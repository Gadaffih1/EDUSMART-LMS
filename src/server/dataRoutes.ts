import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';
import {
  getDb,
  initDatabase,
  notifyMySqlTablesChanged,
  stripSecrets,
  writeSecurityAudit,
} from './db.ts';
import {
  ingestCollectionData,
  resolveRecordId,
  resolveRecordTenantId,
  upsertCollectionRecord,
} from './migrate.ts';
import { broadcastChange, getRealtimeClientCount, registerSseClient } from './realtimeBus.ts';
import {
  isHttpsRequest,
  parseCookies,
  requireAuth,
  requireSuperAdmin,
  resolveAuthorizedTenantId,
} from './authRoutes.ts';
import { generateMySqlDump, getMySqlExportSummary } from './mysqlExport.ts';
import { forceFullMySqlSync, getMySqlStatus } from './mysqlAdapter.ts';

const VLAB_PASS_COOKIE_NAME = 'edusmart_vlab_pass';
const VLAB_COOKIE_TTL_SEC = 60 * 60 * 24 * 30; // 30 days (bound by ticket expiresAt)
const VLAB_PAYBILL_NUMBER = '400200';
const VLAB_ACCOUNT_NUMBER = '1164798';
const VLAB_TIER_PRICES_KES: Record<string, { priceKes: number; days: number }> = {
  day: { priceKes: 150, days: 1 },
  term: { priceKes: 1200, days: 90 },
  annual: { priceKes: 3500, days: 365 },
};

let cachedVlabCookieSecret: string | null = null;

function getVlabCookieSecret(): string {
  if (cachedVlabCookieSecret) return cachedVlabCookieSecret;
  if (process.env.VLAB_COOKIE_SECRET) {
    cachedVlabCookieSecret = process.env.VLAB_COOKIE_SECRET;
    return cachedVlabCookieSecret;
  }
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM migration_meta WHERE key = 'vlab_cookie_secret_v1'`)
    .get() as { value: string } | undefined;
  if (row?.value) {
    cachedVlabCookieSecret = row.value;
    return cachedVlabCookieSecret;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  db.prepare(
    `INSERT OR IGNORE INTO migration_meta (key, value, applied_at) VALUES (?, ?, ?)`
  ).run('vlab_cookie_secret_v1', generated, new Date().toISOString());
  const stored = db
    .prepare(`SELECT value FROM migration_meta WHERE key = 'vlab_cookie_secret_v1'`)
    .get() as { value: string } | undefined;
  cachedVlabCookieSecret = stored?.value || generated;
  return cachedVlabCookieSecret;
}

function signVlabTicketToken(ticketId: string): string {
  const sig = crypto
    .createHmac('sha256', getVlabCookieSecret())
    .update(ticketId)
    .digest('hex');
  return `${ticketId}.${sig}`;
}

function setVlabPassCookie(req: Request, res: Response, ticketId: string): void {
  const token = signVlabTicketToken(ticketId);
  const isHttps = isHttpsRequest(req);
  const parts = [
    `${VLAB_PASS_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${VLAB_COOKIE_TTL_SEC}`,
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearVlabPassCookie(req: Request, res: Response): void {
  const isHttps = isHttpsRequest(req);
  const parts = [
    `${VLAB_PASS_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function isPassActiveAndValid(pass: any): boolean {
  if (!pass || typeof pass !== 'object') return false;
  const tid = String(pass.ticketId || '').trim().toUpperCase();
  if (!tid || tid.includes('DEMO')) return false;
  if (pass.status !== 'active') return false;
  if (pass.subscriptionVerified === false) return false;
  if (pass.expiresAt) {
    const expMs = Date.parse(String(pass.expiresAt));
    if (!Number.isNaN(expMs) && expMs <= Date.now()) return false;
  }
  return true;
}

function findAnyVlabPassByCode(code: string): any | null {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean || clean.includes('DEMO')) return null;
  const passes = readCollectionForTenant('edusmart_vlab_ticket_passes', 'global', true) || [];
  if (!Array.isArray(passes)) return null;
  const found = passes.find((p: any) => {
    const tid = String(p?.ticketId || '').trim().toUpperCase();
    const ref = String(p?.mpesaReference || '').trim().toUpperCase();
    return tid === clean || (ref && ref === clean);
  });
  return found ? stripSecrets(found) : null;
}

function findActiveVlabPassByCode(code: string): any | null {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean || clean.includes('DEMO')) return null;
  const passes = readCollectionForTenant('edusmart_vlab_ticket_passes', 'global', true) || [];
  if (!Array.isArray(passes)) return null;
  const found = passes.find((p: any) => {
    const tid = String(p?.ticketId || '').trim().toUpperCase();
    const ref = String(p?.mpesaReference || '').trim().toUpperCase();
    return (tid === clean || (ref && ref === clean)) && isPassActiveAndValid(p);
  });
  return found ? stripSecrets(found) : null;
}

function findVlabPassesByEmail(email: string): any[] {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return [];
  const passes = readCollectionForTenant('edusmart_vlab_ticket_passes', 'global', true) || [];
  if (!Array.isArray(passes)) return [];
  return passes
    .filter((p: any) => {
      const pEmail = String(p?.email || '').trim().toLowerCase();
      const tid = String(p?.ticketId || '').trim().toUpperCase();
      return pEmail === cleanEmail && tid && !tid.includes('DEMO');
    })
    .sort((a: any, b: any) => {
      const aTime = Date.parse(String(a?.approvedAt || a?.createdAt || a?.issuedAt || 0)) || 0;
      const bTime = Date.parse(String(b?.approvedAt || b?.createdAt || b?.issuedAt || 0)) || 0;
      return bTime - aTime;
    })
    .map((p: any) => stripSecrets(p));
}

function verifyVlabPassCookie(req: Request): any | null {
  const cookies = parseCookies(req);
  const raw = cookies[VLAB_PASS_COOKIE_NAME];
  if (!raw) return null;
  const dotIdx = raw.lastIndexOf('.');
  if (dotIdx <= 0) return null;
  const ticketId = raw.slice(0, dotIdx).trim().toUpperCase();
  const sig = raw.slice(dotIdx + 1).trim();
  if (!ticketId || !sig || ticketId.includes('DEMO')) return null;

  const expectedSig = crypto
    .createHmac('sha256', getVlabCookieSecret())
    .update(ticketId)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  return findActiveVlabPassByCode(ticketId);
}

// Collections safe to serve to unauthenticated visitors for public landing page & reference catalogs
const PUBLIC_SAFE_COLLECTIONS = new Set([
  'edusmart_platform_customization_v6',
  'edusmart_platform_customization_pack_v1',
  'edusmart_hero_video_presets_v1',
  'edusmart_hero_image_presets_v1',
  'edusmart_system_roles_v1',
  'edusmart_subjects_v1',
  'edusmart_activities_v1',
  'edusmart_tpad_standards_v1',
  'edusmart_primary_curriculum_demand_v1',
  'edusmart_junior_curriculum_demand_v1',
  'edusmart_starter_package_docs_v1',
]);

// Singleton collections (stored as single JSON objects rather than arrays)
const SINGLETON_COLLECTIONS = new Set([
  'edusmart_platform_customization_v6',
  'edusmart_platform_customization_pack_v1',
  'edusmart_role_permissions_v1',
  'edusmart_school_departments_seeded_v1',
  'edusmart_department_kinds_v1',
]);

// Global collections shared across all tenants (platform-level or reference)
const GLOBAL_WRITE_COLLECTIONS = new Set([
  'edusmart_platform_customization_v6',
  'edusmart_platform_customization_pack_v1',
  'edusmart_platform_admins_v1',
  'edusmart_system_roles_v1',
  'edusmart_all_tenants_registry',
  'edusmart_school_registry_v1',
  'edusmart_school_accounts_v1',
  'edusmart_hero_video_presets_v1',
  'edusmart_hero_image_presets_v1',
  'edusmart_subjects_v1',
  'edusmart_activities_v1',
  'edusmart_tpad_standards_v1',
  'edusmart_starter_package_docs_v1',
]);

export function readCollectionForTenant(
  collectionKey: string,
  tenantId: string | null,
  includeAllTenants: boolean
): any {
  const db = getDb();

  if (SINGLETON_COLLECTIONS.has(collectionKey)) {
    // Check tenant-specific singleton first if applicable, fallback to global
    const row = tenantId
      ? (db
          .prepare(
            `SELECT payload_json FROM collections_store
             WHERE collection_key = ? AND tenant_id IN (?, 'global') AND deleted_at IS NULL
             ORDER BY CASE WHEN tenant_id = ? THEN 0 ELSE 1 END, updated_at DESC LIMIT 1`
          )
          .get(collectionKey, tenantId, tenantId) as { payload_json: string } | undefined)
      : (db
          .prepare(
            `SELECT payload_json FROM collections_store
             WHERE collection_key = ? AND deleted_at IS NULL
             ORDER BY updated_at DESC LIMIT 1`
          )
          .get(collectionKey) as { payload_json: string } | undefined);

    if (!row) return undefined;
    try {
      return JSON.parse(row.payload_json);
    } catch {
      return undefined;
    }
  }

  let rows: Array<{ payload_json: string }>;
  if (includeAllTenants || !tenantId) {
    rows = db
      .prepare(
        `SELECT payload_json FROM collections_store
         WHERE collection_key = ? AND deleted_at IS NULL
         ORDER BY rowid ASC`
      )
      .all(collectionKey) as Array<{ payload_json: string }>;
  } else {
    rows = db
      .prepare(
        `SELECT payload_json FROM collections_store
         WHERE collection_key = ? AND tenant_id IN (?, 'global') AND deleted_at IS NULL
         ORDER BY rowid ASC`
      )
      .all(collectionKey, tenantId) as Array<{ payload_json: string }>;
  }

  const parsed: any[] = [];
  for (const r of rows) {
    try {
      const obj = JSON.parse(r.payload_json);
      parsed.push(stripSecrets(obj));
    } catch {
      // Skip malformed JSON
    }
  }
  return parsed;
}

function listAllCollectionKeys(): string[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT DISTINCT collection_key FROM collections_store WHERE deleted_at IS NULL`)
    .all() as Array<{ collection_key: string }>;
  return rows.map((r) => r.collection_key);
}

function buildPublicTenantsList(): any[] {
  const tenants = readCollectionForTenant('edusmart_all_tenants_registry', 'global', true) || [];
  if (!Array.isArray(tenants)) return [];
  // Keep full branding/display properties for school portal headers & login page selector, strip any secret tokens
  return tenants.map((t: any) => stripSecrets(t));
}

function getFileExtensionForMime(mime: string, originalName: string): string {
  const extFromName = path.extname(originalName || '').toLowerCase();
  if (extFromName && /^[.a-z0-9]{2,8}$/.test(extFromName)) return extFromName;
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };
  return map[mime] || '.bin';
}

const ALLOWED_UPLOAD_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function registerDataRoutes(app: Express): void {
  // -------------------------------------------------------------------------
  // 1. Real-Time SSE Endpoint (Tenant-Isolated Live Synchronization)
  // -------------------------------------------------------------------------
  app.get('/api/realtime/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const session = req.authSession;
    const clientId = crypto.randomUUID();
    const unsubscribe = registerSseClient({
      id: clientId,
      res,
      userId: session?.userId || null,
      schoolId: session?.schoolId || null,
      isSuperAdmin: Boolean(session?.isSuperAdmin),
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Central Bootstrap & Sync Endpoints
  // -------------------------------------------------------------------------
  const bootstrapHandler = (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      const db = getDb();

      if (!session) {
        // Unauthenticated bootstrap: strictly safe landing page & reference catalogs ONLY
        const collections: Record<string, any> = {
          edusmart_all_tenants_registry: buildPublicTenantsList(),
        };
        for (const key of PUBLIC_SAFE_COLLECTIONS) {
          const val = readCollectionForTenant(key, 'global', true);
          if (val !== undefined) collections[key] = val;
        }
        const activeVlabPass = verifyVlabPassCookie(req);
        return res.json({
          success: true,
          authenticated: false,
          user: null,
          activeTenantId: collections.edusmart_all_tenants_registry?.[0]?.id || 'tenant-riara',
          collections,
          preferences: {},
          activeVlabPass,
          timestamp: new Date().toISOString(),
        });
      }

      // Authenticated bootstrap: tenant-isolated collections
      const isSuperAdmin = session.isSuperAdmin;
      const activeTenantId = session.schoolId || 'tenant-riara';
      const collections: Record<string, any> = {};
      const keys = listAllCollectionKeys();

      for (const key of keys) {
        if (key === 'edusmart_platform_admins_v1') {
          if (isSuperAdmin) {
            collections[key] = readCollectionForTenant(key, null, true);
          }
          continue;
        }
        if (key === 'edusmart_school_accounts_v1' || key === 'edusmart_school_registry_v1') {
          if (isSuperAdmin) {
            collections[key] = readCollectionForTenant(key, null, true);
          }
          continue;
        }
        if (key === 'edusmart_all_tenants_registry') {
          collections[key] = buildPublicTenantsList();
          continue;
        }

        const data = readCollectionForTenant(key, activeTenantId, isSuperAdmin);
        if (data !== undefined) {
          collections[key] = data;
        }
      }

      // Load user preferences from database
      const prefRows = db
        .prepare(`SELECT pref_key, payload_json FROM user_preferences WHERE user_id = ?`)
        .all(session.userId) as Array<{ pref_key: string; payload_json: string }>;

      const preferences: Record<string, any> = {};
      for (const row of prefRows) {
        try {
          preferences[row.pref_key] = JSON.parse(row.payload_json);
        } catch {
          preferences[row.pref_key] = row.payload_json;
        }
      }

      // Also attach any school-level settings stored in school_settings
      const settingRows = db
        .prepare(`SELECT setting_key, payload_json FROM school_settings WHERE school_id = ?`)
        .all(activeTenantId) as Array<{ setting_key: string; payload_json: string }>;
      const schoolSettings: Record<string, any> = {};
      for (const row of settingRows) {
        try {
          schoolSettings[row.setting_key] = JSON.parse(row.payload_json);
        } catch {
          schoolSettings[row.setting_key] = row.payload_json;
        }
      }

      const activeVlabPass = verifyVlabPassCookie(req);
      return res.json({
        success: true,
        authenticated: true,
        user: stripSecrets(session.user),
        activeTenantId,
        isSuperAdmin,
        collections,
        totalCollections: Object.keys(collections).length,
        preferences,
        schoolSettings,
        activeVlabPass,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/bootstrap:', err);
      return res.status(500).json({ error: 'Failed to load database state', message: err?.message });
    }
  };

  app.get('/api/bootstrap', bootstrapHandler);
  app.get('/api/sync/all', bootstrapHandler);

  // Pull single collection
  app.get('/api/sync/pull', requireAuth, (req: Request, res: Response) => {
    try {
      const collection = String(req.query.collection || '').trim();
      if (!collection) {
        return res.status(400).json({ error: 'collection parameter is required' });
      }
      const tenantId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!tenantId) return;

      const data = readCollectionForTenant(collection, tenantId, req.authSession!.isSuperAdmin);
      return res.json({
        success: true,
        collection,
        data: data ?? null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to pull collection', message: err?.message });
    }
  });

  // Push / Save collection (transactional SQLite update + tenant isolation + SSE broadcast)
  app.post('/api/sync/push', requireAuth, (req: Request, res: Response) => {
    try {
      const { collection, records, tenantId: bodyTenantId, mode = 'replace' } = req.body || {};
      if (!collection || typeof collection !== 'string') {
        return res.status(400).json({ error: 'collection name is required' });
      }

      const session = req.authSession!;
      const authorizedTenantId = resolveAuthorizedTenantId(req, res, bodyTenantId);
      if (!authorizedTenantId) return;

      // RBAC check for global platform customization & tenant registry
      if (
        (collection === 'edusmart_platform_customization_v6' ||
          collection === 'edusmart_platform_customization_pack_v1' ||
          collection === 'edusmart_system_roles_v1') &&
        !session.isSuperAdmin
      ) {
        return res.status(403).json({
          error: 'Only Platform Super Administrators can modify global platform configuration.',
        });
      }

      if (
        (collection === 'edusmart_all_tenants_registry' ||
          collection === 'edusmart_school_registry_v1') &&
        !session.isSuperAdmin &&
        session.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Administrator privileges required to modify school registry.' });
      }

      const db = getDb();
      const now = new Date().toISOString();

      db.exec('BEGIN IMMEDIATE');
      try {
        if (SINGLETON_COLLECTIONS.has(collection) || (!Array.isArray(records) && records && typeof records === 'object')) {
          const targetTenant = GLOBAL_WRITE_COLLECTIONS.has(collection) ? 'global' : authorizedTenantId;
          upsertCollectionRecord(db, collection, 'singleton', targetTenant, records, false);
        } else if (Array.isArray(records)) {
          // Determine target tenant partition for replacement
          const isGlobalCol = GLOBAL_WRITE_COLLECTIONS.has(collection);
          const partitionTenant = isGlobalCol ? 'global' : authorizedTenantId;

          if (mode === 'replace') {
            if (isGlobalCol && session.isSuperAdmin) {
              // Super admin replacing global list
              const incomingIds = new Set(records.map((r, i) => resolveRecordId(r, i)));
              const existingRows = db
                .prepare(`SELECT record_id, tenant_id FROM collections_store WHERE collection_key = ? AND deleted_at IS NULL`)
                .all(collection) as Array<{ record_id: string; tenant_id: string }>;
              for (const row of existingRows) {
                if (!incomingIds.has(row.record_id)) {
                  db.prepare(
                    `UPDATE collections_store SET deleted_at = ?, updated_at = ?
                     WHERE collection_key = ? AND tenant_id = ? AND record_id = ?`
                  ).run(now, now, collection, row.tenant_id, row.record_id);
                }
              }
            } else if (!isGlobalCol) {
              // Tenant-scoped replace: only touch rows belonging to authorizedTenantId
              const tenantRecords = records.filter((item) => {
                const itemTenant = resolveRecordTenantId(collection, item, authorizedTenantId);
                return session.isSuperAdmin || itemTenant === authorizedTenantId || itemTenant === 'global';
              });
              const incomingIds = new Set(tenantRecords.map((r, i) => resolveRecordId(r, i)));
              const existingRows = db
                .prepare(
                  `SELECT record_id FROM collections_store WHERE collection_key = ? AND tenant_id = ? AND deleted_at IS NULL`
                )
                .all(collection, partitionTenant) as Array<{ record_id: string }>;
              for (const row of existingRows) {
                if (!incomingIds.has(row.record_id)) {
                  db.prepare(
                    `UPDATE collections_store SET deleted_at = ?, updated_at = ?
                     WHERE collection_key = ? AND tenant_id = ? AND record_id = ?`
                  ).run(now, now, collection, partitionTenant, row.record_id);
                }
              }
            }
          }

          // Filter & upsert incoming records enforcing tenant scope
          const allowedRecords = records
            .filter((item) => {
              if (!item || typeof item !== 'object') return true;
              const recTenant = resolveRecordTenantId(collection, item, authorizedTenantId);
              if (session.isSuperAdmin || isGlobalCol || recTenant === 'global') return true;
              return recTenant === authorizedTenantId;
            })
            .map((item) => {
              if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
              if (!session.isSuperAdmin && !isGlobalCol && item.schoolId === undefined && item.tenantId === undefined) {
                return { ...item, schoolId: authorizedTenantId };
              }
              return item;
            });

          ingestCollectionData(db, collection, allowedRecords, false);
        }

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      broadcastChange({
        type: 'collection:updated',
        collection,
        tenantId: GLOBAL_WRITE_COLLECTIONS.has(collection) ? 'global' : authorizedTenantId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        collection,
        tenantId: authorizedTenantId,
        count: Array.isArray(records) ? records.length : 1,
        timestamp: now,
      });
    } catch (err: any) {
      console.error('Error in /api/sync/push:', err);
      return res.status(500).json({ error: 'Failed to persist collection', message: err?.message });
    }
  });

  // Confirm Virtual Lab Super Admin approval status by subscriber email
  app.post('/api/vlab/tickets/check-email', (req: Request, res: Response) => {
    try {
      const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          valid: false,
          approved: false,
          status: 'invalid_email',
          error: 'Please enter a valid subscriber email address.',
        });
      }

      const matches = findVlabPassesByEmail(cleanEmail);
      if (matches.length === 0) {
        return res.status(404).json({
          valid: false,
          approved: false,
          status: 'not_found',
          error: `No Virtual Lab subscription request was found for "${cleanEmail}". Please subscribe and pay via Paybill 400200 Account 1164798 first.`,
        });
      }

      const activePass = matches.find((p: any) => isPassActiveAndValid(p));
      if (activePass) {
        setVlabPassCookie(req, res, String(activePass.ticketId).toUpperCase());
        return res.json({
          valid: true,
          approved: true,
          status: 'active',
          pass: activePass,
        });
      }

      const latest = matches[0];
      if (latest.status === 'pending_approval') {
        return res.status(423).json({
          valid: false,
          approved: false,
          status: 'pending_approval',
          pass: latest,
          error: `Ticket ${latest.ticketId} (${latest.email}) is submitted for Paybill 400200 Account 1164798 and is still waiting for Super Admin approval.`,
        });
      }

      if (latest.status === 'rejected') {
        return res.status(402).json({
          valid: false,
          approved: false,
          status: 'rejected',
          pass: latest,
          error: latest.rejectionReason || 'Payment verification was declined by Super Admin.',
        });
      }

      return res.status(404).json({
        valid: false,
        approved: false,
        status: 'expired',
        pass: latest,
        error: 'Your Virtual Lab ticket pass is expired or inactive. Please purchase a new pass.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed checking email approval status', message: err?.message });
    }
  });

  // Public Virtual Lab Ticket Purchase & Lookup (Paybill 400200 Account 1164798 + Super Admin Approval)
  app.get('/api/vlab/tickets/:code', (req: Request, res: Response) => {
    try {
      const code = String(req.params.code || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ valid: false, error: 'Ticket or M-Pesa code is required' });
      if (code.includes('DEMO')) {
        return res.status(402).json({
          valid: false,
          error: 'Free demo access is disabled. An active paid subscription ticket is strictly required.',
        });
      }
      const found = findAnyVlabPassByCode(code);
      if (!found) {
        return res.status(404).json({ valid: false, error: 'Subscription pass or M-Pesa transaction code not found.' });
      }
      if (found.status === 'pending_approval') {
        return res.status(423).json({
          valid: false,
          status: 'pending_approval',
          pass: found,
          error: 'Payment submitted to Paybill 400200 (Account 1164798). Waiting for Super Admin approval in order to proceed.',
        });
      }
      if (found.status === 'rejected') {
        return res.status(402).json({
          valid: false,
          status: 'rejected',
          pass: found,
          error: found.rejectionReason || 'Payment verification was declined by Super Admin.',
        });
      }
      if (!isPassActiveAndValid(found)) {
        return res.status(404).json({ valid: false, error: 'Active paid subscription ticket expired or inactive' });
      }
      setVlabPassCookie(req, res, String(found.ticketId).toUpperCase());
      return res.json({ valid: true, status: 'active', pass: found });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed verifying ticket', message: err?.message });
    }
  });

  app.post('/api/vlab/tickets', (req: Request, res: Response) => {
    try {
      const input = req.body?.pass || req.body || {};
      const holderName = String(input.holderName || '').trim();
      const email = String(input.email || '').trim();
      const phone = String(input.phone || '').trim();
      const tier = String(input.tier || 'term').trim().toLowerCase();
      const mpesaReference = String(input.mpesaReference || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

      if (!holderName || holderName.length < 2) {
        return res.status(400).json({ error: 'Subscriber full name is required.' });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      if (!phone || phone.replace(/\D/g, '').length < 9) {
        return res.status(400).json({ error: 'A valid M-Pesa phone number is required.' });
      }
      if (!mpesaReference || mpesaReference.length < 6) {
        return res.status(400).json({
          error: 'Enter your M-Pesa confirmation/transaction code after paying via Paybill 400200 Account 1164798.',
        });
      }
      const tierConfig = VLAB_TIER_PRICES_KES[tier];
      if (!tierConfig) {
        return res.status(400).json({ error: 'Invalid subscription tier selected.' });
      }

      const rawTicket = String(input.ticketId || '').trim().toUpperCase();
      if (rawTicket.includes('DEMO')) {
        return res.status(403).json({
          error: 'Demo ticket codes are prohibited. Public Virtual Lab requires a paid subscription.',
        });
      }

      const now = new Date();
      const canonicalTicketId =
        /^VLAB-TICKET-[A-Z0-9]{4,16}$/.test(rawTicket)
          ? rawTicket
          : `VLAB-TICKET-${crypto.randomInt(100000, 999999)}`;

      const pendingPass = {
        id: canonicalTicketId,
        ticketId: canonicalTicketId,
        tier,
        priceKes: tierConfig.priceKes,
        paybillNumber: VLAB_PAYBILL_NUMBER,
        accountNumber: VLAB_ACCOUNT_NUMBER,
        mpesaReference,
        holderName,
        email,
        phone,
        schoolName: String(input.schoolName || 'Public STEM Learner / Homeschool').trim(),
        gradeLevel: String(input.gradeLevel || 'Grade 7 (JSS)').trim(),
        issuedAt: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        createdAt: now.toISOString(),
        expiresAt: null,
        status: 'pending_approval',
        approvalStatus: 'pending',
        subscriptionVerified: false,
      };

      const db = getDb();
      ingestCollectionData(db, 'edusmart_vlab_ticket_passes', [pendingPass], false);
      broadcastChange({
        type: 'record:created',
        collection: 'edusmart_vlab_ticket_passes',
        tenantId: 'global',
        recordId: canonicalTicketId,
        timestamp: now.toISOString(),
      });
      return res.status(201).json({ success: true, pendingApproval: true, pass: pendingPass });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed saving ticket pass', message: err?.message });
    }
  });

  app.post('/api/vlab/tickets/clear', (req: Request, res: Response) => {
    clearVlabPassCookie(req, res);
    return res.json({ success: true });
  });

  // Super Admin Virtual Lab Payment Verification & Approval Endpoints
  app.get('/api/vlab/admin/tickets', requireSuperAdmin, (_req: Request, res: Response) => {
    try {
      const passes = readCollectionForTenant('edusmart_vlab_ticket_passes', 'global', true) || [];
      const sorted = Array.isArray(passes)
        ? [...passes].sort((a: any, b: any) => {
            const aTime = Date.parse(String(a?.createdAt || a?.issuedAt || 0)) || 0;
            const bTime = Date.parse(String(b?.createdAt || b?.issuedAt || 0)) || 0;
            return bTime - aTime;
          })
        : [];
      return res.json({
        success: true,
        paybillNumber: VLAB_PAYBILL_NUMBER,
        accountNumber: VLAB_ACCOUNT_NUMBER,
        passes: sorted,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading virtual lab passes', message: err?.message });
    }
  });

  app.post('/api/vlab/admin/tickets/:ticketId/approve', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const ticketId = String(req.params.ticketId || '').trim().toUpperCase();
      const existing = findAnyVlabPassByCode(ticketId);
      if (!existing) {
        return res.status(404).json({ error: 'Virtual lab subscription request not found.' });
      }
      const tier = String(existing.tier || 'term').toLowerCase();
      const tierConfig = VLAB_TIER_PRICES_KES[tier] || VLAB_TIER_PRICES_KES.term;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + tierConfig.days * 86_400_000).toISOString();

      const approvedPass = {
        ...existing,
        id: existing.id || existing.ticketId,
        ticketId: existing.ticketId,
        paybillNumber: existing.paybillNumber || VLAB_PAYBILL_NUMBER,
        accountNumber: existing.accountNumber || VLAB_ACCOUNT_NUMBER,
        status: 'active',
        approvalStatus: 'approved',
        subscriptionVerified: true,
        approvedBy: req.authSession!.user?.email || req.authSession!.userId,
        approvedAt: now.toISOString(),
        expiresAt,
      };

      const db = getDb();
      ingestCollectionData(db, 'edusmart_vlab_ticket_passes', [approvedPass], false);
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_vlab_ticket_passes',
        tenantId: 'global',
        recordId: String(approvedPass.ticketId),
        actorId: req.authSession!.userId,
        timestamp: now.toISOString(),
      });
      return res.json({ success: true, pass: approvedPass });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed approving virtual lab pass', message: err?.message });
    }
  });

  app.post('/api/vlab/admin/tickets/:ticketId/reject', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const ticketId = String(req.params.ticketId || '').trim().toUpperCase();
      const existing = findAnyVlabPassByCode(ticketId);
      if (!existing) {
        return res.status(404).json({ error: 'Virtual lab subscription request not found.' });
      }
      const now = new Date();
      const reason = String(req.body?.reason || '').trim() || 'M-Pesa payment could not be verified for Paybill 400200 Account 1164798.';
      const rejectedPass = {
        ...existing,
        id: existing.id || existing.ticketId,
        ticketId: existing.ticketId,
        status: 'rejected',
        approvalStatus: 'rejected',
        subscriptionVerified: false,
        rejectionReason: reason,
        rejectedBy: req.authSession!.user?.email || req.authSession!.userId,
        rejectedAt: now.toISOString(),
      };

      const db = getDb();
      ingestCollectionData(db, 'edusmart_vlab_ticket_passes', [rejectedPass], false);
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_vlab_ticket_passes',
        tenantId: 'global',
        recordId: String(rejectedPass.ticketId),
        actorId: req.authSession!.userId,
        timestamp: now.toISOString(),
      });
      return res.json({ success: true, pass: rejectedPass });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed declining virtual lab pass', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 3. Paginated Students & Directory REST APIs (Strict Multi-Tenant)
  // -------------------------------------------------------------------------
  app.get('/api/students', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!tenantId) return;

      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '100'), 10) || 100));
      const search = String(req.query.search || '').trim().toLowerCase();
      const offset = (page - 1) * limit;

      const db = getDb();
      let where = `school_id = ?`;
      const params: any[] = [tenantId];

      if (search) {
        where += ` AND (lower(name) LIKE ? OR lower(email) LIKE ? OR lower(admission_number) LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const totalRow = db.prepare(`SELECT COUNT(*) as total FROM students WHERE ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT payload_json, name, email, admission_number, grade_label, stream_label, class_name, school_id, grade_id, stream_id, phone, upi_number, is_active, created_at, rights_json, id FROM students WHERE ${where} ORDER BY name ASC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset) as any[];

      const data = rows.map((r) => {
        const extra = r.payload_json ? JSON.parse(r.payload_json) : {};
        return stripSecrets({
          ...extra,
          id: r.id,
          schoolId: r.school_id,
          gradeId: r.grade_id,
          streamId: r.stream_id,
          name: r.name,
          email: r.email,
          admissionNumber: r.admission_number,
          phone: r.phone,
          upiNumber: r.upi_number,
          gradeLabel: r.grade_label,
          streamLabel: r.stream_label,
          className: r.class_name,
          isActive: Boolean(r.is_active),
          createdAt: r.created_at,
          rights: r.rights_json ? JSON.parse(r.rights_json) : {},
        });
      });

      return res.json({
        success: true,
        tenantId,
        page,
        limit,
        total: totalRow.total,
        data,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve students', message: err?.message });
    }
  });

  app.post('/api/students', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const allowedRoles = new Set(['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'school_admin_staff', 'class_teacher']);
      if (!session.isSuperAdmin && !allowedRoles.has(session.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to enroll students.' });
      }

      const studentInput = req.body?.student || req.body;
      const tenantId = resolveAuthorizedTenantId(req, res, studentInput?.schoolId);
      if (!tenantId) return;

      if (!studentInput?.name || !studentInput?.email) {
        return res.status(400).json({ error: 'Student name and email are required.' });
      }

      const cleanEmail = String(studentInput.email).trim().toLowerCase();
      const student = {
        ...studentInput,
        id: studentInput.id || `usr-stu-${Date.now()}`,
        schoolId: tenantId,
        email: cleanEmail,
        isActive: studentInput.isActive !== false,
        createdAt: studentInput.createdAt || new Date().toISOString(),
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_students_v1', [student], false);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({
        type: 'record:created',
        collection: 'edusmart_students_v1',
        tenantId,
        recordId: student.id,
        actorId: session.userId,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({ success: true, data: stripSecrets(student) });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create student record', message: err?.message });
    }
  });

  app.delete('/api/students/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const allowedRoles = new Set(['admin', 'head_teacher', 'deputy_head', 'school_admin_staff']);
      if (!session.isSuperAdmin && !allowedRoles.has(session.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to delete student records.' });
      }

      const id = String(req.params.id);
      const db = getDb();
      const existing = db.prepare(`SELECT school_id FROM students WHERE id = ?`).get(id) as { school_id: string } | undefined;
      if (!existing) return res.status(404).json({ error: 'Student not found.' });
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant deletion forbidden.' });
      }

      const now = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`DELETE FROM students WHERE id = ?`).run(id);
        db.prepare(`DELETE FROM student_parents WHERE student_id = ?`).run(id);
        db.prepare(
          `UPDATE collections_store SET deleted_at = ?, updated_at = ? WHERE collection_key = 'edusmart_students_v1' AND record_id = ?`
        ).run(now, now, id);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({
        type: 'record:deleted',
        collection: 'edusmart_students_v1',
        tenantId: existing.school_id,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, deletedId: id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete student', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Institutional Settings & User Preferences APIs
  // -------------------------------------------------------------------------
  app.get('/api/settings', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!tenantId) return;

      const db = getDb();
      const rows = db
        .prepare(`SELECT setting_key, payload_json, updated_at FROM school_settings WHERE school_id = ?`)
        .all(tenantId) as Array<{ setting_key: string; payload_json: string; updated_at: string }>;

      const settings: Record<string, any> = {};
      for (const r of rows) {
        try {
          settings[r.setting_key] = JSON.parse(r.payload_json);
        } catch {
          settings[r.setting_key] = r.payload_json;
        }
      }

      const tenantRow = db.prepare(`SELECT payload_json FROM tenants WHERE id = ?`).get(tenantId) as { payload_json: string } | undefined;
      return res.json({
        success: true,
        tenantId,
        tenant: tenantRow ? JSON.parse(tenantRow.payload_json) : null,
        settings,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed reading school settings', message: err?.message });
    }
  });

  app.put('/api/settings/school', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const allowedRoles = new Set(['admin', 'head_teacher', 'deputy_head', 'dean_of_studies']);
      if (!session.isSuperAdmin && !allowedRoles.has(session.role)) {
        return res.status(403).json({ error: 'Administrator privileges required to update school settings.' });
      }

      const { tenantId: bodyTenantId, settingKey, value, tenantUpdates } = req.body || {};
      const tenantId = resolveAuthorizedTenantId(req, res, bodyTenantId);
      if (!tenantId) return;

      const db = getDb();
      const now = new Date().toISOString();

      db.exec('BEGIN IMMEDIATE');
      try {
        if (settingKey && value !== undefined) {
          db.prepare(
            `INSERT INTO school_settings (school_id, setting_key, payload_json, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(school_id, setting_key)
             DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
          ).run(tenantId, String(settingKey), JSON.stringify(value), now);
        }

        if (tenantUpdates && typeof tenantUpdates === 'object') {
          const row = db.prepare(`SELECT payload_json FROM tenants WHERE id = ?`).get(tenantId) as { payload_json: string } | undefined;
          if (row) {
            const current = JSON.parse(row.payload_json);
            const merged = { ...current, ...tenantUpdates, id: tenantId };
            ingestCollectionData(db, 'edusmart_all_tenants_registry', [merged], false);
            db.prepare(
              `INSERT INTO school_settings (school_id, setting_key, payload_json, updated_at)
               VALUES (?, 'profile_and_branding', ?, ?)
               ON CONFLICT(school_id, setting_key)
               DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
            ).run(tenantId, JSON.stringify(merged), now);
          }
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({
        type: 'settings:updated',
        collection: 'edusmart_all_tenants_registry',
        tenantId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, tenantId, timestamp: now });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating school settings', message: err?.message });
    }
  });

  app.put('/api/settings/platform', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const customization = req.body?.customization || req.body;
      if (!customization || typeof customization !== 'object') {
        return res.status(400).json({ error: 'Customization payload required.' });
      }
      const db = getDb();
      const now = new Date().toISOString();
      upsertCollectionRecord(db, 'edusmart_platform_customization_v6', 'singleton', 'global', customization, false);
      upsertCollectionRecord(db, 'edusmart_platform_customization_pack_v1', 'singleton', 'global', customization, false);

      broadcastChange({
        type: 'settings:updated',
        collection: 'edusmart_platform_customization_v6',
        tenantId: 'global',
        actorId: req.authSession!.userId,
        timestamp: now,
      });

      return res.json({ success: true, timestamp: now });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating platform settings', message: err?.message });
    }
  });

  // User Preferences (Accessibility, Mobile Layout, Workspace Tab)
  app.get('/api/preferences', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const rows = db
        .prepare(`SELECT pref_key, payload_json FROM user_preferences WHERE user_id = ?`)
        .all(req.authSession!.userId) as Array<{ pref_key: string; payload_json: string }>;
      const preferences: Record<string, any> = {};
      for (const r of rows) {
        try {
          preferences[r.pref_key] = JSON.parse(r.payload_json);
        } catch {
          preferences[r.pref_key] = r.payload_json;
        }
      }
      return res.json({ success: true, preferences });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading preferences', message: err?.message });
    }
  });

  app.put('/api/preferences', requireAuth, (req: Request, res: Response) => {
    try {
      const { key, value } = req.body || {};
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Preference key is required.' });
      }
      const db = getDb();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO user_preferences (user_id, pref_key, payload_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, pref_key)
         DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      ).run(req.authSession!.userId, key, JSON.stringify(value ?? null), now);

      broadcastChange({
        type: 'preferences:updated',
        collection: 'user_preferences',
        tenantId: req.authSession!.schoolId,
        actorId: req.authSession!.userId,
        timestamp: now,
      });

      return res.json({ success: true, key, timestamp: now });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed saving preference', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 5. Server-Backed File & Document Storage API (/api/files/*)
  // -------------------------------------------------------------------------
  app.post('/api/files/upload', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const tenantId = resolveAuthorizedTenantId(req, res, req.body?.tenantId || req.body?.schoolId);
      if (!tenantId) return;

      const { fileName = 'upload.bin', mimeType = 'application/octet-stream', dataBase64, category = 'general' } = req.body || {};
      if (!dataBase64 || typeof dataBase64 !== 'string') {
        return res.status(400).json({ error: 'File dataBase64 is required.' });
      }

      const cleanMime = String(mimeType).split(';')[0].trim().toLowerCase();
      if (!ALLOWED_UPLOAD_MIMES.has(cleanMime)) {
        return res.status(400).json({ error: `Unsupported file type: ${cleanMime}` });
      }

      // Strip data URI prefix if sent
      const rawBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      const buffer = Buffer.from(rawBase64, 'base64');

      const MAX_BYTES = 25 * 1024 * 1024; // 25MB
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
        return res.status(400).json({ error: 'File size must be between 1 byte and 25 MB.' });
      }

      const { uploadsDir } = initDatabase();
      const safeTenantDir = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const tenantUploadDir = path.join(uploadsDir, safeTenantDir);
      if (!fs.existsSync(tenantUploadDir)) fs.mkdirSync(tenantUploadDir, { recursive: true });

      const fileId = `file-${crypto.randomUUID()}`;
      const ext = getFileExtensionForMime(cleanMime, String(fileName));
      const diskName = `${fileId}${ext}`;
      const absPath = path.join(tenantUploadDir, diskName);
      fs.writeFileSync(absPath, buffer);

      const publicUrl = `/api/files/${fileId}`;
      const now = new Date().toISOString();
      const db = getDb();
      db.prepare(
        `INSERT INTO uploaded_files (id, school_id, uploaded_by, original_name, mime_type, size_bytes, category, storage_path, public_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        fileId,
        tenantId,
        session.userId,
        path.basename(String(fileName)).slice(0, 200),
        cleanMime,
        buffer.byteLength,
        String(category).slice(0, 64),
        path.relative(uploadsDir, absPath),
        publicUrl,
        now
      );
      notifyMySqlTablesChanged(['uploaded_files']);

      return res.status(201).json({
        success: true,
        file: {
          id: fileId,
          schoolId: tenantId,
          uploadedBy: session.userId,
          originalName: path.basename(String(fileName)),
          mimeType: cleanMime,
          sizeBytes: buffer.byteLength,
          category,
          url: publicUrl,
          createdAt: now,
        },
      });
    } catch (err: any) {
      console.error('Error in POST /api/files/upload:', err);
      return res.status(500).json({ error: 'File upload failed', message: err?.message });
    }
  });

  app.get('/api/files', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!tenantId) return;
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT id, school_id as schoolId, uploaded_by as uploadedBy, original_name as originalName,
                  mime_type as mimeType, size_bytes as sizeBytes, category, public_url as url, created_at as createdAt
           FROM uploaded_files WHERE school_id = ? ORDER BY created_at DESC`
        )
        .all(tenantId);
      return res.json({ success: true, files: rows });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to list files', message: err?.message });
    }
  });

  app.get('/api/files/:id', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const db = getDb();
      const row = db
        .prepare(`SELECT * FROM uploaded_files WHERE id = ?`)
        .get(id) as any;

      if (!row) return res.status(404).json({ error: 'File not found' });

      // Public logos/hero banners stored under 'global' or category 'branding'/'hero' can be rendered on login/landing page
      const isPublicAsset = row.school_id === 'global' || row.category === 'branding' || row.category === 'hero';
      if (!isPublicAsset) {
        const session = req.authSession;
        if (!session) return res.status(401).json({ error: 'Authentication required to download this file.' });
        if (!session.isSuperAdmin && session.schoolId !== row.school_id) {
          return res.status(403).json({ error: 'Access denied to file outside your school tenant.' });
        }
      }

      const { uploadsDir } = initDatabase();
      const absPath = path.resolve(uploadsDir, row.storage_path);
      if (!absPath.startsWith(uploadsDir) || !fs.existsSync(absPath)) {
        return res.status(404).json({ error: 'Stored file missing on disk.' });
      }

      res.setHeader('Content-Type', row.mime_type);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(absPath);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed serving file', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 6. Database Health & Status Endpoint
  // -------------------------------------------------------------------------
  app.get('/api/sync/status', (_req: Request, res: Response) => {
    try {
      const db = getDb();
      const { dbPath } = initDatabase();
      const colStats = db
        .prepare(`SELECT COUNT(DISTINCT collection_key) as cols, COUNT(*) as rows FROM collections_store WHERE deleted_at IS NULL`)
        .get() as { cols: number; rows: number };
      const usersCount = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
      const studentsCount = (db.prepare(`SELECT COUNT(*) as c FROM students`).get() as { c: number }).c;
      const tenantsCount = (db.prepare(`SELECT COUNT(*) as c FROM tenants`).get() as { c: number }).c;

      const mysqlStatus = getMySqlStatus();
      return res.json({
        status: 'connected',
        persistence: mysqlStatus.connected ? 'mysql2-central-database' : 'sqlite-central-database',
        mysql: mysqlStatus,
        databaseFile: dbPath,
        totalCollections: colStats.cols,
        totalCollectionRecords: colStats.rows,
        usersCount,
        studentsCount,
        tenantsCount,
        realtimeClients: getRealtimeClientCount(),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed checking database status', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 7. Super Admin MySQL Status, Live Sync & Downloadable Dump Endpoints
  // -------------------------------------------------------------------------
  app.get('/api/admin/export-mysql/summary', (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      if (!session || !session.isSuperAdmin) {
        return res.status(401).json({ error: 'Super Administrator authentication required.' });
      }
      const db = getDb();
      const { dbPath } = initDatabase();
      const summary = getMySqlExportSummary(db);
      const dbSizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
      const mysqlStatus = getMySqlStatus();
      return res.json({
        success: true,
        ...summary,
        dbSizeBytes,
        mysql: mysqlStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed inspecting database summary', message: err?.message });
    }
  });

  app.post('/api/admin/mysql/sync', async (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      if (!session || !session.isSuperAdmin) {
        return res.status(401).json({ error: 'Super Administrator authentication required.' });
      }
      const mysqlStatus = await forceFullMySqlSync();
      if (!mysqlStatus.connected) {
        return res.status(400).json({
          success: false,
          mysql: mysqlStatus,
          error:
            mysqlStatus.lastError ||
            'MySQL is not configured or reachable. Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE (or MYSQL_URL) in .env.',
        });
      }
      writeSecurityAudit({
        schoolId: 'global',
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'MYSQL_FULL_SYNC',
        resource: '/api/admin/mysql/sync',
        details: `Synchronized live central tables to ${mysqlStatus.host}:${mysqlStatus.port}/${mysqlStatus.database}`,
      });
      return res.json({ success: true, mysql: mysqlStatus });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed syncing MySQL database', message: err?.message });
    }
  });

  app.get('/api/admin/export-mysql', (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      if (!session || !session.isSuperAdmin) {
        return res.status(401).json({ error: 'Super Administrator authentication required.' });
      }
      const db = getDb();
      const dump = generateMySqlDump(db);

      writeSecurityAudit({
        schoolId: 'global',
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'MYSQL_DUMP_EXPORTED',
        resource: '/api/admin/export-mysql',
        details: `Exported ${dump.filename} (${dump.tableCount} tables, ${dump.totalRows} rows)`,
      });

      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${dump.filename}"`);
      res.setHeader('X-EduSmart-Dump-Filename', dump.filename);
      res.setHeader('X-EduSmart-Dump-Tables', String(dump.tableCount));
      res.setHeader('X-EduSmart-Dump-Rows', String(dump.totalRows));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(dump.sql);
    } catch (err: any) {
      console.error('Error generating MySQL dump:', err);
      return res.status(500).json({ error: 'Failed generating MySQL dump', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 8. PWA Installation Detection & Privacy-Preserving Aggregate Analytics
  // -------------------------------------------------------------------------
  const ALLOWED_PWA_EVENTS = new Set([
    'installed',
    'standalone_launch',
    'prompt_shown',
    'prompt_accepted',
    'prompt_dismissed',
    'ios_guide_opened',
  ]);
  const ALLOWED_PWA_DEVICES = new Set([
    'android_phone',
    'iphone',
    'android_tablet',
    'ipad',
    'desktop',
    'other',
  ]);
  const ALLOWED_PWA_BROWSERS = new Set([
    'chrome',
    'samsung_internet',
    'safari',
    'edge',
    'firefox',
    'other',
  ]);

  app.post('/api/pwa/telemetry', (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const eventType = String(body.eventType || '').trim().toLowerCase();
      if (!ALLOWED_PWA_EVENTS.has(eventType)) {
        return res.status(400).json({ error: 'Unsupported PWA event type.' });
      }

      const rawDevice = String(body.deviceCategory || 'other').trim().toLowerCase();
      const deviceCategory = ALLOWED_PWA_DEVICES.has(rawDevice) ? rawDevice : 'other';

      const rawBrowser = String(body.browserFamily || 'other').trim().toLowerCase();
      const browserFamily = ALLOWED_PWA_BROWSERS.has(rawBrowser) ? rawBrowser : 'other';

      const displayMode = body.displayMode === 'standalone' ? 'standalone' : 'browser';
      const appVersion = String(body.appVersion || '2.0.0').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 32) || '2.0.0';
      const installId = body.installId
        ? String(body.installId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
        : null;

      // Associate school_id only from verified session if signed in (strict tenant boundary), never trust arbitrary body schoolId
      const schoolId = req.authSession?.schoolId && !req.authSession.isSuperAdmin
        ? req.authSession.schoolId
        : 'global';

      const db = getDb();

      // Deduplicate 'installed' event per anonymous installId
      if (eventType === 'installed' && installId) {
        const existing = db
          .prepare(`SELECT id FROM pwa_install_events WHERE install_id = ? AND event_type = 'installed' LIMIT 1`)
          .get(installId) as { id: string } | undefined;
        if (existing) {
          return res.json({ success: true, deduplicated: true });
        }
      }

      const eventId = `pwa-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO pwa_install_events (id, event_type, device_category, browser_family, display_mode, app_version, install_id, school_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(eventId, eventType, deviceCategory, browserFamily, displayMode, appVersion, installId, schoolId, now);

      notifyMySqlTablesChanged(['pwa_install_events']);
      return res.status(201).json({ success: true, id: eventId, createdAt: now });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed recording PWA analytics', message: err?.message });
    }
  });

  app.get('/api/pwa/analytics', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const allowedRoles = new Set(['admin', 'head_teacher', 'deputy_head']);
      if (!session.isSuperAdmin && !allowedRoles.has(session.role)) {
        return res.status(403).json({ error: 'Administrator privileges required to view PWA statistics.' });
      }

      const db = getDb();
      const scopeWhere = session.isSuperAdmin ? '' : 'WHERE school_id = ?';
      const scopeParams = session.isSuperAdmin ? [] : [session.schoolId];

      const eventRows = db
        .prepare(
          `SELECT event_type, device_category, browser_family, display_mode, app_version, created_at
           FROM pwa_install_events ${scopeWhere}
           ORDER BY created_at DESC`
        )
        .all(...scopeParams) as Array<{
          event_type: string;
          device_category: string;
          browser_family: string;
          display_mode: string;
          app_version: string;
          created_at: string;
        }>;

      let totalInstalls = 0;
      let standaloneLaunches = 0;
      let promptShown = 0;
      let promptAccepted = 0;
      let promptDismissed = 0;
      let iosGuideViews = 0;

      const byDeviceCategory: Record<string, { installs: number; launches: number }> = {};
      const byBrowserFamily: Record<string, { installs: number; launches: number }> = {};
      const byVersion: Record<string, number> = {};

      for (const row of eventRows) {
        if (!byDeviceCategory[row.device_category]) {
          byDeviceCategory[row.device_category] = { installs: 0, launches: 0 };
        }
        if (!byBrowserFamily[row.browser_family]) {
          byBrowserFamily[row.browser_family] = { installs: 0, launches: 0 };
        }

        if (row.event_type === 'installed') {
          totalInstalls++;
          byDeviceCategory[row.device_category].installs++;
          byBrowserFamily[row.browser_family].installs++;
          byVersion[row.app_version] = (byVersion[row.app_version] || 0) + 1;
        } else if (row.event_type === 'standalone_launch') {
          standaloneLaunches++;
          byDeviceCategory[row.device_category].launches++;
          byBrowserFamily[row.browser_family].launches++;
        } else if (row.event_type === 'prompt_shown') {
          promptShown++;
        } else if (row.event_type === 'prompt_accepted') {
          promptAccepted++;
        } else if (row.event_type === 'prompt_dismissed') {
          promptDismissed++;
        } else if (row.event_type === 'ios_guide_opened') {
          iosGuideViews++;
        }
      }

      const recentEvents = eventRows.slice(0, 15).map((r) => ({
        eventType: r.event_type,
        deviceCategory: r.device_category,
        browserFamily: r.browser_family,
        displayMode: r.display_mode,
        appVersion: r.app_version,
        createdAt: r.created_at,
      }));

      return res.json({
        success: true,
        scope: session.isSuperAdmin ? 'platform_global' : session.schoolId,
        summary: {
          totalInstalls,
          standaloneLaunches,
          promptShown,
          promptAccepted,
          promptDismissed,
          iosGuideViews,
          promptConversionRate: promptShown > 0 ? Math.round((promptAccepted / promptShown) * 100) : 0,
        },
        byDeviceCategory,
        byBrowserFamily,
        byVersion,
        recentEvents,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed computing PWA analytics', message: err?.message });
    }
  });

  // Reverse Geocode GPS Coordinates -> Actual Physical Street/Area/Town Name (never campus name)
  app.get('/api/geocode/reverse', requireAuth, async (req: Request, res: Response) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid latitude and longitude coordinates are required.' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
      const upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EduSmart-LMS/1.0 (https://www.edusmart.co.ke)',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (upstream.ok) {
        const data = (await upstream.json()) as any;
        const addr = data?.address || {};
        const primaryParts = [
          addr.road || addr.pedestrian || addr.footway || addr.neighbourhood || addr.suburb || addr.quarter,
          addr.suburb && addr.suburb !== addr.neighbourhood ? addr.suburb : addr.village || addr.town || addr.city_district,
          addr.city || addr.town || addr.county || addr.state_district,
          addr.country,
        ]
          .filter((part, idx, arr) => Boolean(part) && arr.indexOf(part) === idx)
          .map((p) => String(p).trim());

        const locationName =
          primaryParts.length >= 2
            ? primaryParts.join(', ')
            : String(data?.display_name || '')
                .split(',')
                .slice(0, 4)
                .map((s: string) => s.trim())
                .filter(Boolean)
                .join(', ');

        if (locationName) {
          return res.json({
            success: true,
            locationName,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
            addressDetails: addr,
            source: 'nominatim',
          });
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    return res.json({
      success: true,
      locationName: `GPS Coordinates (${lat.toFixed(5)}°, ${lon.toFixed(5)}°)`,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      rawCoordinatesOnly: true,
      source: 'gps_coordinates',
    });
  });
}

