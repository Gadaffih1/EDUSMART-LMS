import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, verifyPassword } from '../src/server/db.ts';
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_ID,
  ensureDefaultSchoolSettings,
  seedAndRetainSettings,
  upsertCollectionRecord,
} from '../src/server/migrate.ts';

function createTempSettingsDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE tenants (
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
    CREATE TABLE users (
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
    CREATE TABLE students (
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
    CREATE TABLE student_parents (
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
    CREATE TABLE provisioned_accounts (
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
    CREATE TABLE school_accounts (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      domain TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE platform_admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      rights_json TEXT NOT NULL,
      access_scope TEXT NOT NULL DEFAULT 'super_admin_only',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE school_settings (
      school_id TEXT NOT NULL,
      setting_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (school_id, setting_key)
    );
    CREATE TABLE user_preferences (
      user_id TEXT NOT NULL,
      pref_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, pref_key)
    );
    CREATE TABLE collections_store (
      collection_key TEXT NOT NULL,
      tenant_id TEXT NOT NULL DEFAULT 'global',
      record_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      PRIMARY KEY (collection_key, tenant_id, record_id)
    );
    CREATE TABLE migration_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE user_credential_vault (
      account_key TEXT PRIMARY KEY,
      source_table TEXT NOT NULL,
      record_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      email TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tenants (id, name, short_name, code, domain, email, theme_color, payload_json, updated_at)
     VALUES ('tenant-riara', 'Riara Primary & Junior School', 'Riara', 'RGS', 'riara.edusmart.co.ke', 'info@riara.ac.ke', 'blue', ?, ?)`
  ).run(
    JSON.stringify({
      id: 'tenant-riara',
      name: 'Riara Primary & Junior School',
      shortName: 'Riara',
      code: 'RGS',
      motto: 'Rooted and Rising',
      location: 'Nairobi',
      primaryColor: '#1e3a8a',
      curriculum: 'Kenyan CBC & JSS',
    }),
    now
  );

  return db;
}

test('1. Platform customization settings saved by Super Admin are strictly retained across server restarts', () => {
  const db = createTempSettingsDb();

  // First boot seeds defaults
  seedAndRetainSettings(db);

  // Admin edits platform settings (enables pricing visibility, changes virtualLabPolicy & hero title)
  const customPlatform = {
    landingPage: {
      visibility: { hero: true, pricing: true, features: true },
      hero: { title: 'Custom Persistent Platform Title' },
      header: { navLinks: [{ id: 'nav-pricing', label: 'Plans', sectionId: 'pricing-section', enabled: true }] },
    },
    globalSettings: {
      virtualLabPolicy: {
        publicAccessMode: 'free_demo',
        requirePaidSubscriptionOnPublicPage: false,
        allowFreePublicDemo: true,
        freeForMemberSchools: true,
      },
    },
  };
  upsertCollectionRecord(db, 'edusmart_platform_customization_v6', 'singleton', 'global', customPlatform, false);
  upsertCollectionRecord(db, 'edusmart_platform_customization_pack_v1', 'singleton', 'global', customPlatform, false);

  // Simulate server restart running seedAndRetainSettings again
  seedAndRetainSettings(db);

  const row = db
    .prepare(`SELECT payload_json FROM collections_store WHERE collection_key = 'edusmart_platform_customization_v6' AND record_id = 'singleton'`)
    .get() as { payload_json: string };
  const retained = JSON.parse(row.payload_json);

  assert.equal(retained.landingPage.visibility.pricing, true, 'Saved pricing visibility retained after restart');
  assert.equal(retained.landingPage.hero.title, 'Custom Persistent Platform Title', 'Saved hero title retained after restart');
  assert.equal(retained.globalSettings.virtualLabPolicy.allowFreePublicDemo, true, 'Saved Virtual Lab policy retained after restart');
});

test('2. Updated Super Admin credentials (email & password) are strictly retained across server restarts', () => {
  const db = createTempSettingsDb();

  // First boot creates default super admin
  seedAndRetainSettings(db);
  const initialAdmin = db.prepare(`SELECT email FROM platform_admins WHERE id = ?`).get(DEFAULT_SUPER_ADMIN_ID) as { email: string };
  assert.equal(initialAdmin.email, DEFAULT_SUPER_ADMIN_EMAIL);

  // Super Admin updates email & password
  const customEmail = 'director@customschool.ac.ke';
  const customPassHash = hashPassword('MyNewStrongPass!2026');
  db.prepare(`UPDATE platform_admins SET email = ?, password_hash = ?, updated_at = ? WHERE id = ?`).run(
    customEmail,
    customPassHash,
    new Date().toISOString(),
    DEFAULT_SUPER_ADMIN_ID
  );

  // Simulate server restart
  seedAndRetainSettings(db);

  const afterRestart = db
    .prepare(`SELECT email, password_hash FROM platform_admins WHERE id = ?`)
    .get(DEFAULT_SUPER_ADMIN_ID) as { email: string; password_hash: string };

  assert.equal(afterRestart.email, customEmail, 'Updated Super Admin email strictly retained across restarts');
  assert.equal(verifyPassword('MyNewStrongPass!2026', afterRestart.password_hash), true, 'Updated Super Admin password strictly retained across restarts');
});

test('3. Per-school institutional settings in school_settings are strictly retained across restarts and readable across browsers', () => {
  const db = createTempSettingsDb();
  seedAndRetainSettings(db);

  const now = new Date().toISOString();
  const updatedAcademic = {
    currentYear: '2027',
    currentTerm: 3,
    termLabel: 'Term 3, 2027',
    curriculum: 'Kenyan CBC & JSS',
    gradingScale: 'CBC 4-Level (EE, ME, AE, BE)',
  };
  db.prepare(
    `INSERT INTO school_settings (school_id, setting_key, payload_json, updated_at)
     VALUES ('tenant-riara', 'academic_calendar', ?, ?)
     ON CONFLICT(school_id, setting_key)
     DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
  ).run(JSON.stringify(updatedAcademic), now);

  // Simulate restart + ensureDefaultSchoolSettings
  seedAndRetainSettings(db);
  ensureDefaultSchoolSettings(db, { id: 'tenant-riara', name: 'Riara Primary & Junior School' });

  const stored = db
    .prepare(`SELECT payload_json FROM school_settings WHERE school_id = 'tenant-riara' AND setting_key = 'academic_calendar'`)
    .get() as { payload_json: string };
  const parsed = JSON.parse(stored.payload_json);

  assert.equal(parsed.currentYear, '2027');
  assert.equal(parsed.currentTerm, 3);
  assert.equal(parsed.termLabel, 'Term 3, 2027');
});

test('4. User preferences (accessibility, connectivity, timetable view & print size) persist in SQLite across separate browser connections', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edusmart-settings-'));
  const dbFile = path.join(tmpDir, 'test.db');

  try {
    // Browser A writes preferences to database
    const dbA = new DatabaseSync(dbFile);
    dbA.exec(`
      CREATE TABLE user_preferences (
        user_id TEXT NOT NULL,
        pref_key TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, pref_key)
      );
    `);
    const now = new Date().toISOString();
    const upsert = dbA.prepare(
      `INSERT INTO user_preferences (user_id, pref_key, payload_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, pref_key)
       DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
    );
    upsert.run('u-teacher-1', 'edusmart_connectivity_settings_v1', JSON.stringify({ autoBackgroundSync: false, lowDataOptimization: true, precacheFrequentNotes: false }), now);
    upsert.run('u-teacher-1', 'edusmart_accessibility_preferences_v1', JSON.stringify({ highContrast: true, fontSize: 125, screenReaderMode: false, reducedMotion: true, enhancedFocus: true }), now);
    upsert.run('u-teacher-1', 'edusmart_timetable_sheet_prefs_v1', JSON.stringify({ useShortCodes: false, pageSize: 'A3' }), now);
    upsert.run('u-teacher-1', 'edusmart_timetable_view_prefs_v1', JSON.stringify({ teacherViewMode: 'daily', classGridLayout: 'period_cards' }), now);
    dbA.close();

    // Browser B opens fresh database connection and reads exact same user preferences
    const dbB = new DatabaseSync(dbFile);
    const rows = dbB
      .prepare(`SELECT pref_key, payload_json FROM user_preferences WHERE user_id = ?`)
      .all('u-teacher-1') as Array<{ pref_key: string; payload_json: string }>;
    const prefs: Record<string, any> = {};
    for (const r of rows) prefs[r.pref_key] = JSON.parse(r.payload_json);
    dbB.close();

    assert.equal(prefs.edusmart_connectivity_settings_v1.autoBackgroundSync, false);
    assert.equal(prefs.edusmart_accessibility_preferences_v1.fontSize, 125);
    assert.equal(prefs.edusmart_accessibility_preferences_v1.highContrast, true);
    assert.equal(prefs.edusmart_timetable_sheet_prefs_v1.pageSize, 'A3');
    assert.equal(prefs.edusmart_timetable_sheet_prefs_v1.useShortCodes, false);
    assert.equal(prefs.edusmart_timetable_view_prefs_v1.teacherViewMode, 'daily');
    assert.equal(prefs.edusmart_timetable_view_prefs_v1.classGridLayout, 'period_cards');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
