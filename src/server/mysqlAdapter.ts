import mysql, { type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, registerMySqlWriteNotifier } from './db.ts';
import { buildMySqlTableSchema } from './mysqlExport.ts';

export interface MySqlRuntimeStatus {
  configured: boolean;
  connected: boolean;
  driver: 'mysql2' | 'sqlite-fallback';
  host: string | null;
  port: number | null;
  database: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  syncSourceOfTruth: 'mysql' | 'local-sqlite';
}

let pool: Pool | null = null;
let connected = false;
let configured = false;
let activeHost: string | null = null;
let activePort: number | null = null;
let activeDatabase: string | null = null;
let lastSyncedAt: string | null = null;
let lastError: string | null = null;

// Serialized sync queue to prevent overlapping writes across concurrent API requests
const pendingTables = new Set<string>();
let syncQueuePromise: Promise<void> = Promise.resolve();
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function escapeIdent(ident: string): string {
  return '`' + String(ident).replace(/`/g, '``') + '`';
}

export function isMySqlEnvConfigured(): boolean {
  const url = String(process.env.MYSQL_URL || '').trim();
  if (url) return true;
  const host = String(process.env.MYSQL_HOST || '').trim();
  const user = String(process.env.MYSQL_USER || '').trim();
  const database = String(process.env.MYSQL_DATABASE || '').trim();
  return Boolean(host && user && database);
}

function buildConnectionOptions(): mysql.PoolOptions | null {
  const rawUrl = String(process.env.MYSQL_URL || '').trim();
  const sslEnabled = String(process.env.MYSQL_SSL || '').toLowerCase() === 'true';

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      activeHost = parsed.hostname || 'localhost';
      activePort = parsed.port ? Number(parsed.port) : 3306;
      activeDatabase = parsed.pathname.replace(/^\//, '') || 'edusmart_lms';
    } catch {
      activeHost = 'mysql-url';
      activePort = 3306;
      activeDatabase = 'edusmart_lms';
    }
    return {
      uri: rawUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      charset: 'utf8mb4',
      ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  const host = String(process.env.MYSQL_HOST || '').trim();
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = String(process.env.MYSQL_USER || '').trim();
  const password = String(process.env.MYSQL_PASSWORD || '');
  const database = String(process.env.MYSQL_DATABASE || '').trim();

  if (!host || !user || !database) return null;

  activeHost = host;
  activePort = Number.isFinite(port) && port > 0 ? port : 3306;
  activeDatabase = database;

  return {
    host: activeHost,
    port: activePort,
    user,
    password,
    database: activeDatabase,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
    charset: 'utf8mb4',
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function listSqliteTables(db: DatabaseSync): string[] {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name ASC`
    )
    .all() as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

async function ensureMySqlSchema(conn: PoolConnection, db: DatabaseSync): Promise<string[]> {
  const tables = listSqliteTables(db);
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const tableName of tables) {
      const schema = buildMySqlTableSchema(db, tableName, true);
      await conn.query(schema.createSql);
    }
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }
  return tables;
}

function makePkKey(row: Record<string, any>, pkCols: string[]): string {
  return pkCols.map((c) => String(row[c] ?? '')).join('\u0000');
}

async function syncSingleTableToMySql(
  conn: PoolConnection,
  db: DatabaseSync,
  tableName: string
): Promise<void> {
  const schema = buildMySqlTableSchema(db, tableName, true);
  await conn.query(schema.createSql);

  const quotedSqlite = `"${tableName.replace(/"/g, '""')}"`;
  const rows = db.prepare(`SELECT * FROM ${quotedSqlite}`).all() as Record<string, any>[];
  const colNames = schema.columns.map((c) => c.name);
  const pkCols = schema.pkCols;

  await conn.beginTransaction();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    if (rows.length === 0) {
      await conn.query(`DELETE FROM ${escapeIdent(tableName)}`);
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.commit();
      return;
    }

    // Reconcile deletions cleanly using PK comparison
    if (pkCols.length > 0 && tableName !== 'security_audit_logs') {
      const localKeys = new Set(rows.map((r) => makePkKey(r, pkCols)));
      const pkSelect = pkCols.map((c) => escapeIdent(c)).join(', ');
      const [remoteRows] = await conn.query<RowDataPacket[]>(
        `SELECT ${pkSelect} FROM ${escapeIdent(tableName)}`
      );
      const staleRows = remoteRows.filter((rr) => !localKeys.has(makePkKey(rr, pkCols)));
      if (staleRows.length > 0) {
        const whereClause = pkCols.map((c) => `${escapeIdent(c)} = ?`).join(' AND ');
        for (const stale of staleRows) {
          await conn.query(
            `DELETE FROM ${escapeIdent(tableName)} WHERE ${whereClause}`,
            pkCols.map((c) => stale[c])
          );
        }
      }
    }

    // Upsert all current rows in batches
    const colList = colNames.map((c) => escapeIdent(c)).join(', ');
    const updateCols = colNames.filter((c) => !pkCols.includes(c));
    const onDupClause =
      updateCols.length > 0
        ? ` ON DUPLICATE KEY UPDATE ${updateCols
            .map((c) => `${escapeIdent(c)} = VALUES(${escapeIdent(c)})`)
            .join(', ')}`
        : ` ON DUPLICATE KEY UPDATE ${escapeIdent(colNames[0])} = VALUES(${escapeIdent(colNames[0])})`;

    const tuplePlaceholder = `(${colNames.map(() => '?').join(', ')})`;
    const BATCH_SIZE = 75;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => tuplePlaceholder).join(', ');
      const params: unknown[] = [];
      for (const row of batch) {
        for (const col of colNames) {
          const v = row[col];
          params.push(v === undefined ? null : v);
        }
      }
      const sql = `INSERT INTO ${escapeIdent(tableName)} (${colList}) VALUES ${placeholders}${onDupClause}`;
      await conn.query(sql, params);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
  } catch (err) {
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // ignore
    }
    await conn.rollback();
    throw err;
  }
}

async function pullSingleTableFromMySql(
  conn: PoolConnection,
  db: DatabaseSync,
  tableName: string
): Promise<number> {
  const quotedSqlite = `"${tableName.replace(/"/g, '""')}"`;
  const [remoteRows] = await conn.query<RowDataPacket[]>(`SELECT * FROM ${escapeIdent(tableName)}`);
  const colInfos = db.prepare(`PRAGMA table_info(${quotedSqlite})`).all() as Array<{ name: string }>;
  const colNames = colInfos.map((c) => c.name);
  if (colNames.length === 0) return 0;

  const insertSql = `INSERT OR REPLACE INTO ${quotedSqlite} (${colNames
    .map((c) => `"${c.replace(/"/g, '""')}"`)
    .join(', ')}) VALUES (${colNames.map(() => '?').join(', ')})`;
  const stmt = db.prepare(insertSql);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`DELETE FROM ${quotedSqlite}`);
    for (const row of remoteRows) {
      stmt.run(...colNames.map((c) => (row[c] === undefined ? null : row[c])));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return remoteRows.length;
}

export async function initMySqlBridge(db: DatabaseSync = getDb()): Promise<MySqlRuntimeStatus> {
  configured = isMySqlEnvConfigured();
  if (!configured) {
    connected = false;
    lastError = null;
    return getMySqlStatus();
  }

  const opts = buildConnectionOptions();
  if (!opts) {
    configured = false;
    connected = false;
    return getMySqlStatus();
  }

  try {
    // Ensure database exists when connecting via discrete MYSQL_* variables
    if (!opts.uri && opts.host && opts.user && activeDatabase) {
      try {
        const adminConn = await mysql.createConnection({
          host: opts.host,
          port: opts.port,
          user: opts.user,
          password: opts.password,
          connectTimeout: 5000,
          ...(opts.ssl ? { ssl: opts.ssl } : {}),
        });
        await adminConn.query(
          `CREATE DATABASE IF NOT EXISTS ${escapeIdent(activeDatabase)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await adminConn.end();
      } catch {
        // Managed databases often pre-create the schema and restrict CREATE DATABASE; proceed directly
      }
    }

    pool = mysql.createPool(opts);
    const conn = await pool.getConnection();
    try {
      await conn.query('SELECT 1');
      const tables = await ensureMySqlSchema(conn, db);

      // Inspect if MySQL already contains authoritative data
      const [tenantCountRows] = await conn.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM \`tenants\``);
      const [adminCountRows] = await conn.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM \`platform_admins\``);
      const [colCountRows] = await conn.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM \`collections_store\``);

      const mysqlHasData =
        Number(tenantCountRows[0]?.c || 0) > 0 ||
        Number(adminCountRows[0]?.c || 0) > 0 ||
        Number(colCountRows[0]?.c || 0) > 0;

      if (mysqlHasData) {
        // Authoritative pull: hydrate state from MySQL
        let pulledRows = 0;
        for (const tableName of tables) {
          pulledRows += await pullSingleTableFromMySql(conn, db, tableName);
        }
        console.info(
          `[mysql] Connected to ${activeHost}:${activePort}/${activeDatabase} — loaded ${pulledRows} authoritative rows across ${tables.length} tables.`
        );
      } else {
        // Fresh MySQL database: seed all initial tables cleanly
        for (const tableName of tables) {
          await syncSingleTableToMySql(conn, db, tableName);
        }
        console.info(
          `[mysql] Connected to ${activeHost}:${activePort}/${activeDatabase} — initialized schema & migrated ${tables.length} tables into MySQL.`
        );
      }

      connected = true;
      lastError = null;
      lastSyncedAt = new Date().toISOString();
      registerMySqlWriteNotifier((tables) => scheduleMySqlSync(tables));
    } finally {
      conn.release();
    }
  } catch (err: any) {
    connected = false;
    lastError = err?.message || 'Unable to connect to MySQL server';
    console.warn(`[mysql] Connection failed (${lastError}). Running with local SQLite backup until MySQL is reachable.`);
    if (pool) {
      try {
        await pool.end();
      } catch {
        // ignore
      }
      pool = null;
    }
  }

  return getMySqlStatus();
}

export function scheduleMySqlSync(tables?: string[]): void {
  if (!connected || !pool) return;

  if (Array.isArray(tables) && tables.length > 0) {
    for (const t of tables) pendingTables.add(t);
  } else {
    for (const t of listSqliteTables(getDb())) pendingTables.add(t);
  }

  if (syncTimer) return;
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushMySqlSync();
  }, 40);
}

export async function flushMySqlSync(specificTables?: string[]): Promise<MySqlRuntimeStatus> {
  if (Array.isArray(specificTables)) {
    for (const t of specificTables) pendingTables.add(t);
  }

  syncQueuePromise = syncQueuePromise.then(async () => {
    if (!connected || !pool || pendingTables.size === 0) return;

    const batch = Array.from(pendingTables);
    pendingTables.clear();

    let conn: PoolConnection | null = null;
    try {
      const db = getDb();
      conn = await pool.getConnection();
      for (const tableName of batch) {
        await syncSingleTableToMySql(conn, db, tableName);
      }
      lastSyncedAt = new Date().toISOString();
      lastError = null;
    } catch (err: any) {
      lastError = err?.message || 'MySQL write-through sync failed';
      console.error('[mysql] Sync error:', lastError);
      // Re-queue failed tables for retry on next mutation
      for (const t of batch) pendingTables.add(t);
    } finally {
      if (conn) conn.release();
    }
  });

  await syncQueuePromise;
  return getMySqlStatus();
}

export async function forceFullMySqlSync(): Promise<MySqlRuntimeStatus> {
  if (!connected || !pool) {
    return initMySqlBridge(getDb());
  }
  const tables = listSqliteTables(getDb());
  return flushMySqlSync(tables);
}

export function getMySqlStatus(): MySqlRuntimeStatus {
  return {
    configured,
    connected,
    driver: connected ? 'mysql2' : 'sqlite-fallback',
    host: activeHost,
    port: activePort,
    database: activeDatabase,
    lastSyncedAt,
    lastError,
    syncSourceOfTruth: connected ? 'mysql' : 'local-sqlite',
  };
}
