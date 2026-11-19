import type { DatabaseSync } from 'node:sqlite';

interface SqliteColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface SqliteIndexListRow {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface SqliteIndexInfoRow {
  seqno: number;
  cid: number;
  name: string | null;
}

export interface MySqlDumpResult {
  sql: string;
  filename: string;
  tableCount: number;
  totalRows: number;
  tables: Array<{ name: string; rows: number }>;
}

function escapeIdent(ident: string): string {
  return '`' + String(ident).replace(/`/g, '``') + '`';
}

function escapeMySqlString(value: string): string {
  return (
    "'" +
    value
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z')
      .replace(/'/g, "\\'") +
    "'"
  );
}

function formatMySqlValue(val: unknown): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }
  if (typeof val === 'bigint') {
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
    const hex = Buffer.from(val).toString('hex');
    return hex.length > 0 ? `X'${hex}'` : "''";
  }
  return escapeMySqlString(String(val));
}

function extractExpressionIndexCols(indexSql: string | null | undefined): string[] {
  if (!indexSql) return [];
  const openIdx = indexSql.indexOf('(');
  const closeIdx = indexSql.lastIndexOf(')');
  if (openIdx === -1 || closeIdx <= openIdx) return [];
  const inner = indexSql.slice(openIdx + 1, closeIdx);
  return inner
    .split(',')
    .map((part) => {
      const cleaned = part
        .trim()
        .replace(/^lower\s*\(\s*/i, '')
        .replace(/^upper\s*\(\s*/i, '')
        .replace(/\)\s*$/, '')
        .replace(/["`[\]]/g, '')
        .replace(/\s+(ASC|DESC)$/i, '')
        .trim();
      return cleaned;
    })
    .filter(Boolean);
}

function mapColumnToMySqlType(
  col: SqliteColumnInfo,
  isIndexed: boolean,
  maxObservedLen: number
): string {
  const upperType = String(col.type || 'TEXT').toUpperCase();

  if (upperType.includes('INT')) {
    return 'BIGINT';
  }
  if (upperType.includes('REAL') || upperType.includes('FLOA') || upperType.includes('DOUB')) {
    return 'DOUBLE';
  }
  if (upperType.includes('BLOB')) {
    return 'LONGBLOB';
  }

  // String / JSON / TEXT columns
  if (isIndexed) {
    // Keep indexed VARCHAR safely under InnoDB utf8mb4 3072-byte composite index cap
    if (maxObservedLen > 191 && maxObservedLen <= 255) {
      return 'VARCHAR(255)';
    }
    if (maxObservedLen > 255) {
      return 'TEXT';
    }
    return 'VARCHAR(191)';
  }

  const lowerName = col.name.toLowerCase();
  if (
    lowerName.endsWith('_json') ||
    lowerName === 'details' ||
    lowerName === 'value' ||
    lowerName === 'password_hash' ||
    maxObservedLen > 255
  ) {
    return 'LONGTEXT';
  }

  return 'TEXT';
}

function formatDefaultClause(col: SqliteColumnInfo, mysqlType: string): string {
  if (col.dflt_value === null || col.dflt_value === undefined) return '';
  // MySQL 8.0 / MariaDB strict mode disallows literal DEFAULT on TEXT/LONGTEXT/BLOB
  if (mysqlType === 'TEXT' || mysqlType === 'LONGTEXT' || mysqlType === 'LONGBLOB') {
    return '';
  }
  const trimmed = String(col.dflt_value).trim();
  if (!trimmed) return '';
  if (/^null$/i.test(trimmed)) return ' DEFAULT NULL';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return ` DEFAULT ${trimmed}`;
  if (/^'.*'$/.test(trimmed)) return ` DEFAULT ${trimmed}`;
  return ` DEFAULT ${escapeMySqlString(trimmed)}`;
}

export function getMySqlExportSummary(db: DatabaseSync): {
  tables: Array<{ name: string; rows: number }>;
  totalTables: number;
  totalRows: number;
} {
  const tableRows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name ASC`
    )
    .all() as Array<{ name: string }>;

  const tables: Array<{ name: string; rows: number }> = [];
  let totalRows = 0;
  for (const t of tableRows) {
    const safeName = t.name.replace(/"/g, '""');
    const rowCount = (
      db.prepare(`SELECT COUNT(*) AS c FROM "${safeName}"`).get() as { c: number }
    ).c;
    tables.push({ name: t.name, rows: rowCount });
    totalRows += rowCount;
  }
  return { tables, totalTables: tables.length, totalRows };
}

export interface MySqlTableSchemaMeta {
  tableName: string;
  columns: SqliteColumnInfo[];
  pkCols: string[];
  createSql: string;
}

export function buildMySqlTableSchema(
  db: DatabaseSync,
  tableName: string,
  ifNotExists = false
): MySqlTableSchemaMeta {
  const quotedSqliteTable = `"${tableName.replace(/"/g, '""')}"`;
  const columns = db.prepare(`PRAGMA table_info(${quotedSqliteTable})`).all() as unknown as SqliteColumnInfo[];
  const indexes = db.prepare(`PRAGMA index_list(${quotedSqliteTable})`).all() as unknown as SqliteIndexListRow[];

  const pkCols = columns
    .filter((c) => c.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((c) => c.name);

  const parsedIndexes: Array<{ name: string; unique: boolean; cols: string[] }> = [];
  const seenIndexSignatures = new Set<string>();
  const indexedColSet = new Set<string>(pkCols);

  for (const idx of indexes) {
    if (idx.origin === 'pk') continue; // Primary key emitted separately
    const infoRows = db
      .prepare(`PRAGMA index_info("${idx.name.replace(/"/g, '""')}")`)
      .all() as unknown as SqliteIndexInfoRow[];

    let idxCols = infoRows
      .sort((a, b) => a.seqno - b.seqno)
      .map((r) => r.name)
      .filter((n): n is string => Boolean(n));

    if (idxCols.length === 0) {
      const masterRow = db
        .prepare(`SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?`)
        .get(idx.name) as { sql: string | null } | undefined;
      idxCols = extractExpressionIndexCols(masterRow?.sql);
    }

    const colNamesSet = new Set(columns.map((c) => c.name));
    idxCols = idxCols.filter((c) => colNamesSet.has(c));
    if (idxCols.length === 0) continue;

    const sig = `${idx.unique ? 'U' : 'N'}:${idxCols.join(',')}`;
    if (seenIndexSignatures.has(sig)) continue;
    seenIndexSignatures.add(sig);

    idxCols.forEach((c) => indexedColSet.add(c));
    parsedIndexes.push({
      name: idx.name,
      unique: idx.unique === 1,
      cols: idxCols,
    });
  }

  const columnTypeByName = new Map<string, string>();

  for (const col of columns) {
    let maxLen = 0;
    const upper = String(col.type || '').toUpperCase();
    if (!upper.includes('INT') && !upper.includes('REAL') && !upper.includes('BLOB')) {
      const lenRow = db
        .prepare(
          `SELECT COALESCE(MAX(LENGTH(CAST("${col.name.replace(/"/g, '""')}" AS TEXT))), 0) AS m FROM ${quotedSqliteTable}`
        )
        .get() as { m: number };
      maxLen = Number(lenRow?.m || 0);
    }
    columnTypeByName.set(col.name, mapColumnToMySqlType(col, indexedColSet.has(col.name), maxLen));
  }

  const colDefs: string[] = [];
  for (const col of columns) {
    const mysqlType = columnTypeByName.get(col.name) || 'TEXT';
    const notNull = col.notnull === 1 || col.pk > 0 ? ' NOT NULL' : ' NULL';
    const defaultClause = formatDefaultClause(col, mysqlType);
    colDefs.push(`  ${escapeIdent(col.name)} ${mysqlType}${notNull}${defaultClause}`);
  }

  const formatKeyPart = (colName: string, forcePrefix = false) => {
    const mysqlType = columnTypeByName.get(colName) || '';
    if (mysqlType === 'TEXT' || mysqlType === 'LONGTEXT' || mysqlType === 'LONGBLOB' || forcePrefix) {
      return `${escapeIdent(colName)}(191)`;
    }
    return escapeIdent(colName);
  };

  if (pkCols.length > 0) {
    const forcePrefix = pkCols.length > 2 && pkCols.some((c) => columnTypeByName.get(c) === 'VARCHAR(255)');
    const pkExpr = pkCols.map((c) => formatKeyPart(c, forcePrefix)).join(', ');
    colDefs.push(`  PRIMARY KEY (${pkExpr})`);
  }

  for (const idx of parsedIndexes) {
    const kind = idx.unique ? 'UNIQUE KEY' : 'KEY';
    const forcePrefix = idx.cols.length > 2 && idx.cols.some((c) => columnTypeByName.get(c) === 'VARCHAR(255)');
    const colsExpr = idx.cols.map((c) => formatKeyPart(c, forcePrefix)).join(', ');
    colDefs.push(`  ${kind} ${escapeIdent(idx.name)} (${colsExpr})`);
  }

  const ifNotExistsClause = ifNotExists ? 'IF NOT EXISTS ' : '';
  const createSql = `CREATE TABLE ${ifNotExistsClause}${escapeIdent(tableName)} (\n${colDefs.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  return { tableName, columns, pkCols, createSql };
}

export function generateMySqlDump(db: DatabaseSync): MySqlDumpResult {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    '_',
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  const filename = `edusmart_mysql_dump_${stamp}.sql`;

  const tableRows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name ASC`
    )
    .all() as Array<{ name: string }>;

  const summaryTables: Array<{ name: string; rows: number }> = [];
  let totalRows = 0;

  const chunks: string[] = [];

  for (const { name: tableName } of tableRows) {
    const quotedSqliteTable = `"${tableName.replace(/"/g, '""')}"`;
    const { columns, createSql } = buildMySqlTableSchema(db, tableName, false);

    const tableChunks: string[] = [];
    tableChunks.push(`-- --------------------------------------------------------`);
    tableChunks.push(`-- Table structure for table ${escapeIdent(tableName)}`);
    tableChunks.push(`-- --------------------------------------------------------`);
    tableChunks.push(`DROP TABLE IF EXISTS ${escapeIdent(tableName)};`);
    tableChunks.push(createSql);
    tableChunks.push('');

    const rows = db.prepare(`SELECT * FROM ${quotedSqliteTable}`).all() as Record<string, unknown>[];
    summaryTables.push({ name: tableName, rows: rows.length });
    totalRows += rows.length;

    if (rows.length > 0) {
      const colListSql = columns.map((c) => escapeIdent(c.name)).join(', ');
      const insertPrefix = `INSERT INTO ${escapeIdent(tableName)} (${colListSql}) VALUES\n`;

      tableChunks.push(`-- Dumping data for table ${escapeIdent(tableName)} (${rows.length} rows)`);

      let batchTuples: string[] = [];
      let batchByteLen = 0;

      const flushBatch = () => {
        if (batchTuples.length === 0) return;
        tableChunks.push(`${insertPrefix}${batchTuples.join(',\n')};`);
        batchTuples = [];
        batchByteLen = 0;
      };

      for (const row of rows) {
        const tuple = `(${columns.map((c) => formatMySqlValue(row[c.name])).join(', ')})`;
        if (batchTuples.length >= 100 || (batchTuples.length > 0 && batchByteLen + tuple.length > 240_000)) {
          flushBatch();
        }
        batchTuples.push(tuple);
        batchByteLen += tuple.length;
      }
      flushBatch();
      tableChunks.push('');
    }

    chunks.push(tableChunks.join('\n'));
  }

  const header = [
    '-- ============================================================================',
    '-- EduSmart LMS Central Database - MySQL Dump',
    `-- Generated At (UTC): ${now.toISOString()}`,
    '-- Target Compatibility: MySQL 8.0+ / MariaDB 10.6+ / phpMyAdmin / Workbench',
    `-- Exported Tables: ${summaryTables.length} | Exported Rows: ${totalRows}`,
    '-- ============================================================================',
    '',
    '-- CREATE DATABASE IF NOT EXISTS `edusmart_lms` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
    '-- USE `edusmart_lms`;',
    '',
    'SET NAMES utf8mb4;',
    "SET TIME_ZONE = '+00:00';",
    'SET FOREIGN_KEY_CHECKS = 0;',
    "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';",
    'SET AUTOCOMMIT = 0;',
    'START TRANSACTION;',
    '',
  ].join('\n');

  const footer = [
    'COMMIT;',
    'SET FOREIGN_KEY_CHECKS = 1;',
    `-- End of EduSmart MySQL Dump (${summaryTables.length} tables, ${totalRows} rows)`,
    '',
  ].join('\n');

  return {
    sql: `${header}${chunks.join('\n')}${footer}`,
    filename,
    tableCount: summaryTables.length,
    totalRows,
    tables: summaryTables,
  };
}
