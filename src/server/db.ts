import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { initTimetableSchema } from './timetableSchema.ts';

export interface DbContext {
  db: DatabaseSync;
  dbPath: string;
  uploadsDir: string;
}

let cachedContext: DbContext | null = null;

export function getDbPaths(rootDir: string = process.cwd()) {
  const dataDir = path.resolve(rootDir, 'data');
  const dbPath = path.resolve(dataDir, 'edusmart.db');
  const uploadsDir = path.resolve(dataDir, 'uploads');
  const legacyJsonPath = path.resolve(dataDir, 'server_db.json');
  const backupJsonPath = path.resolve(dataDir, 'server_db.backup.json');
  return { dataDir, dbPath, uploadsDir, legacyJsonPath, backupJsonPath };
}

export function initDatabase(rootDir: string = process.cwd()): DbContext {
  if (cachedContext) return cachedContext;

  const { dataDir, dbPath, uploadsDir, legacyJsonPath, backupJsonPath } = getDbPaths(rootDir);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Safe backup of existing flat-file database before touching anything
  if (fs.existsSync(legacyJsonPath) && !fs.existsSync(backupJsonPath)) {
    try {
      fs.copyFileSync(legacyJsonPath, backupJsonPath);
      console.info(`[db] Backed up existing database to ${path.basename(backupJsonPath)}`);
    } catch (err) {
      console.warn('[db] Warning backing up server_db.json:', err);
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      code TEXT,
      domain TEXT,
      email TEXT,
      theme_color TEXT,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
    CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      school_id TEXT NOT NULL,
      admission_number TEXT,
      staff_number TEXT,
      tsc_number TEXT,
      password_hash TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(lower(email));
    CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(school_id, role);
    CREATE INDEX IF NOT EXISTS idx_users_admission ON users(lower(admission_number));
    CREATE INDEX IF NOT EXISTS idx_users_staff ON users(lower(staff_number));

    CREATE TABLE IF NOT EXISTS platform_admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      rights_json TEXT NOT NULL,
      access_scope TEXT NOT NULL DEFAULT 'super_admin_only',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(lower(email));

    CREATE TABLE IF NOT EXISTS school_accounts (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      domain TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_school_accounts_school ON school_accounts(school_id);
    CREATE INDEX IF NOT EXISTS idx_school_accounts_email ON school_accounts(lower(email));

    CREATE TABLE IF NOT EXISTS provisioned_accounts (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      admission_number TEXT,
      staff_number TEXT,
      phone TEXT,
      grade INTEGER,
      stream TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_provisioned_email ON provisioned_accounts(lower(email));
    CREATE INDEX IF NOT EXISTS idx_provisioned_school ON provisioned_accounts(school_id);

    CREATE TABLE IF NOT EXISTS system_roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      password_prefix TEXT NOT NULL,
      number_kind TEXT NOT NULL,
      built_in INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_system_roles_slug ON system_roles(slug);

    CREATE TABLE IF NOT EXISTS school_grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_school_grades_school ON school_grades(school_id);

    CREATE TABLE IF NOT EXISTS school_streams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_school_streams_school ON school_streams(school_id);
    CREATE INDEX IF NOT EXISTS idx_school_streams_grade ON school_streams(grade_id);

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      admission_number TEXT,
      phone TEXT,
      upi_number TEXT,
      grade_label TEXT,
      stream_label TEXT,
      class_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      rights_json TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
    CREATE INDEX IF NOT EXISTS idx_students_email ON students(lower(email));
    CREATE INDEX IF NOT EXISTS idx_students_adm ON students(lower(admission_number));
    CREATE INDEX IF NOT EXISTS idx_students_stream ON students(stream_id);

    CREATE TABLE IF NOT EXISTS student_parents (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      relationship TEXT,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_parents_school ON student_parents(school_id);
    CREATE INDEX IF NOT EXISTS idx_parents_student ON student_parents(student_id);
    CREATE INDEX IF NOT EXISTS idx_parents_email ON student_parents(lower(email));

    CREATE TABLE IF NOT EXISTS school_departments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT,
      subjects_json TEXT NOT NULL,
      activities_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_departments_school ON school_departments(school_id);

    CREATE TABLE IF NOT EXISTS role_seats (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      role TEXT NOT NULL,
      holders_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_role_seats_school ON role_seats(school_id);

    CREATE TABLE IF NOT EXISTS school_settings (
      school_id TEXT NOT NULL,
      setting_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (school_id, setting_key)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT NOT NULL,
      pref_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, pref_key)
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      school_id TEXT NOT NULL,
      access_scope TEXT NOT NULL DEFAULT 'tenant',
      user_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      storage_path TEXT NOT NULL,
      public_url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_school ON uploaded_files(school_id);

    CREATE TABLE IF NOT EXISTS collections_store (
      collection_key TEXT NOT NULL,
      tenant_id TEXT NOT NULL DEFAULT 'global',
      record_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      PRIMARY KEY (collection_key, tenant_id, record_id)
    );
    CREATE INDEX IF NOT EXISTS idx_collections_lookup ON collections_store(collection_key, tenant_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_collections_updated ON collections_store(updated_at);

    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sec_audit_school ON security_audit_logs(school_id, created_at);

    CREATE TABLE IF NOT EXISTS migration_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pwa_install_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      device_category TEXT NOT NULL,
      browser_family TEXT NOT NULL,
      display_mode TEXT NOT NULL,
      app_version TEXT NOT NULL,
      install_id TEXT,
      school_id TEXT NOT NULL DEFAULT 'global',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pwa_events_type ON pwa_install_events(event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_pwa_events_device ON pwa_install_events(device_category);
    CREATE INDEX IF NOT EXISTS idx_pwa_events_install ON pwa_install_events(install_id, event_type);

    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      school_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      is_super_admin INTEGER NOT NULL DEFAULT 0,
      credential_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports_json TEXT NOT NULL DEFAULT '[]',
      device_type TEXT,
      backed_up INTEGER NOT NULL DEFAULT 0,
      device_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_cred_id ON webauthn_credentials(credential_id);
    CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id, school_id);
    CREATE INDEX IF NOT EXISTS idx_webauthn_email ON webauthn_credentials(lower(user_email));

    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT,
      is_super_admin INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_webauthn_challenge_exp ON webauthn_challenges(expires_at);
  `);

  initTimetableSchema(db);

  cachedContext = { db, dbPath, uploadsDir };
  return cachedContext;
}

export function getDb(): DatabaseSync {
  return initDatabase().db;
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt with random salt + legacy plaintext compatibility)
// ---------------------------------------------------------------------------
export function isHashedPassword(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

export function hashPassword(plaintext: string): string {
  if (!plaintext) return '';
  if (isHashedPassword(plaintext)) return plaintext;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plaintext, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(plaintext: string, stored: string | undefined | null): boolean {
  if (!stored) return false;
  if (isHashedPassword(stored)) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    const derived = crypto.scryptSync(plaintext, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }
  // Timing-safe comparison even on legacy unhashed seed values
  const a = Buffer.from(plaintext, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function stripSecrets<T extends Record<string, any>>(record: T): T {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const clone = { ...record };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.password_hash;
  return clone;
}

let mySqlWriteNotifier: ((tables?: string[]) => void) | null = null;

export function registerMySqlWriteNotifier(notifier: (tables?: string[]) => void): void {
  mySqlWriteNotifier = notifier;
}

export function notifyMySqlTablesChanged(tables?: string[]): void {
  if (mySqlWriteNotifier) {
    mySqlWriteNotifier(tables);
  }
}

export function writeSecurityAudit(entry: {
  schoolId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details?: string;
}): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO security_audit_logs (id, school_id, user_id, user_email, action, resource, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `sec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      entry.schoolId || 'global',
      entry.userId || null,
      entry.userEmail || null,
      entry.action,
      entry.resource,
      entry.details || null,
      new Date().toISOString()
    );
    notifyMySqlTablesChanged(['security_audit_logs']);
  } catch (err) {
    console.warn('[audit] failed writing security audit log:', err);
  }
}
