import crypto from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import { getDb, hashPassword, isHashedPassword, stripSecrets, verifyPassword, writeSecurityAudit } from './db';
import { ingestCollectionData, resolveRecordTenantId, upsertCollectionRecord } from './migrate';
import { broadcastChange } from './realtimeBus';

export const SESSION_COOKIE_NAME = 'edusmart_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AuthSession {
  tokenHash: string;
  userId: string;
  role: string;
  schoolId: string;
  accessScope: 'super_admin_only' | 'tenant';
  isSuperAdmin: boolean;
  user: Record<string, any>;
}

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession | null;
    }
  }
}

// Simple in-memory rate limiter for auth endpoints
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts = 25, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxAttempts;
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx).trim());
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isHttpsRequest(req: Request): boolean {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const origin = String(req.headers.origin || '').toLowerCase();
  const referer = String(req.headers.referer || '').toLowerCase();
  return Boolean(
    req.secure ||
      forwardedProto === 'https' ||
      origin.startsWith('https://') ||
      referer.startsWith('https://') ||
      forwardedHost.includes('.run.app')
  );
}

function setSessionCookie(req: Request, res: Response, rawToken: string): void {
  const isHttps = isHttpsRequest(req);

  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps = isHttpsRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
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

export function createAuthSession(
  req: Request,
  res: Response,
  user: Record<string, any>,
  accessScope: 'super_admin_only' | 'tenant'
): string {
  const db = getDb();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  const safeUser = stripSecrets(user);

  db.prepare(
    `INSERT INTO auth_sessions (token_hash, user_id, user_role, school_id, access_scope, user_json, created_at, expires_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    tokenHash,
    String(safeUser.id),
    String(safeUser.role || 'student'),
    String(safeUser.schoolId || 'tenant-riara'),
    accessScope,
    JSON.stringify(safeUser),
    now.toISOString(),
    expiresAt,
    now.toISOString()
  );

  setSessionCookie(req, res, rawToken);
  return rawToken;
}

export function resolveSessionFromRequest(req: Request): AuthSession | null {
  try {
    const cookies = parseCookies(req);
    const authHeader = String(req.headers.authorization || '').trim();
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const rawToken = cookies[SESSION_COOKIE_NAME] || bearerToken;
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const db = getDb();
    const row = db
      .prepare(
        `SELECT token_hash, user_id, user_role, school_id, access_scope, user_json, expires_at
         FROM auth_sessions WHERE token_hash = ?`
      )
      .get(tokenHash) as any;

    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`).run(tokenHash);
      return null;
    }

    // Touch last_seen_at occasionally (every > 60s) or silently
    db.prepare(`UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?`).run(
      new Date().toISOString(),
      tokenHash
    );

    const parsedUser = JSON.parse(row.user_json);
    const isSuperAdmin = row.access_scope === 'super_admin_only';
    return {
      tokenHash: row.token_hash,
      userId: row.user_id,
      role: row.user_role,
      schoolId: row.school_id,
      accessScope: row.access_scope,
      isSuperAdmin,
      user: { ...parsedUser, schoolId: row.school_id, ...(isSuperAdmin ? { accessScope: 'super_admin_only' } : {}) },
    };
  } catch {
    return null;
  }
}

export function attachAuthSession(req: Request, _res: Response, next: NextFunction): void {
  req.authSession = resolveSessionFromRequest(req);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authSession) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authSession) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!req.authSession.isSuperAdmin) {
    res.status(403).json({ error: 'Super Administrator privileges required.' });
    return;
  }
  next();
}

/**
 * Strictly enforces multi-tenant isolation.
 * Non-super-admin users can NEVER override or access another school's tenantId.
 */
export function resolveAuthorizedTenantId(
  req: Request,
  res: Response,
  explicitTenantId?: string | null
): string | null {
  const session = req.authSession;
  if (!session) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }

  const candidate =
    explicitTenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-tenant'] as string) ||
    (req.headers['x-school-id'] as string) ||
    (req.query.tenantId as string) ||
    (req.query.schoolId as string) ||
    (req.body && typeof req.body === 'object' ? (req.body.tenantId || req.body.schoolId) : null) ||
    null;

  if (session.isSuperAdmin) {
    return candidate || session.schoolId || 'tenant-riara';
  }

  if (candidate && candidate !== 'global' && candidate !== session.schoolId) {
    writeSecurityAudit({
      schoolId: session.schoolId,
      userId: session.userId,
      userEmail: session.user?.email,
      action: 'CROSS_TENANT_ACCESS_BLOCKED',
      resource: req.originalUrl,
      details: `Attempted to access tenant ${candidate} from ${session.schoolId}`,
    });
    res.status(403).json({
      error: 'Cross-tenant access forbidden. You are only authorized to access your institution records.',
    });
    return null;
  }

  return session.schoolId;
}

function defaultRolePasswordForDomainPrefix(prefix: string): { role: string; password: string } {
  if (prefix.includes('admin') || prefix.includes('principal') || prefix.includes('head')) {
    return { role: 'admin', password: 'admin2026' };
  }
  if (prefix.includes('student') || prefix.includes('learner')) {
    return { role: 'student', password: 'GR4@2026' };
  }
  if (prefix.includes('parent') || prefix.includes('guardian')) {
    return { role: 'parent', password: 'parent2026' };
  }
  if (prefix.includes('nurse')) {
    return { role: 'nurse', password: 'nurse2026' };
  }
  if (prefix.includes('transport')) {
    return { role: 'transport_team', password: 'transport2026' };
  }
  if (prefix.includes('cocurricular')) {
    return { role: 'cocurricular_team', password: 'cocurricular2026' };
  }
  if (prefix.includes('registrar') || prefix.includes('staff')) {
    return { role: 'school_admin_staff', password: 'staff2026' };
  }
  return { role: 'teacher', password: 'teach2026' };
}

export function registerAuthRoutes(app: Express): void {
  // 1. Standard School User Sign-In (HTTP-only session cookie)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { identifier = '', email = '', password = '' } = req.body || {};
      const rawIdent = String(identifier || email || '').trim();
      const cleanIdent = rawIdent.toLowerCase();

      if (!cleanIdent || !password) {
        return res.status(400).json({ error: 'Email/identifier and password are required.' });
      }

      const clientIp = req.ip || 'local';
      if (!checkRateLimit(`login:${clientIp}:${cleanIdent}`)) {
        return res.status(429).json({ error: 'Too many login attempts. Please wait a minute and try again.' });
      }

      const db = getDb();

      // Reject Platform Super Admins on regular school login screen (preserving security boundary)
      // Use 401 instead of 403 so Nginx proxy_intercept_errors does not replace JSON with forbidden.html
      const superAdmin = db
        .prepare(`SELECT id FROM platform_admins WHERE lower(email) = ? AND is_active = 1`)
        .get(cleanIdent);
      if (superAdmin) {
        return res.status(401).json({
          error: 'This account can only open the Super Admin console (/admin).',
          requireAdminPortal: true,
        });
      }

      let matchedUser: Record<string, any> | null = null;
      let storedPasswordHash: string | null = null;
      let passwordUpgradeTarget: { table: string; id: string } | null = null;

      // 1a. Check `users` table
      const userRow = db
        .prepare(
          `SELECT id, password_hash, school_id, payload_json
           FROM users
           WHERE is_active = 1 AND (
             lower(email) = ? OR
             lower(name) = ? OR
             lower(admission_number) = ? OR
             lower(staff_number) = ? OR
             lower(tsc_number) = ?
           )
           LIMIT 1`
        )
        .get(cleanIdent, cleanIdent, cleanIdent, cleanIdent, cleanIdent) as any;

      if (userRow) {
        matchedUser = { ...JSON.parse(userRow.payload_json), id: userRow.id, schoolId: userRow.school_id };
        storedPasswordHash = userRow.password_hash;
        passwordUpgradeTarget = { table: 'users', id: userRow.id };
      }

      // 1b. Check `provisioned_accounts`
      if (!matchedUser) {
        const provRow = db
          .prepare(
            `SELECT id, school_id, password_hash, payload_json
             FROM provisioned_accounts
             WHERE is_active = 1 AND (
               lower(email) = ? OR
               lower(admission_number) = ? OR
               lower(staff_number) = ?
             )
             LIMIT 1`
          )
          .get(cleanIdent, cleanIdent, cleanIdent) as any;
        if (provRow) {
          matchedUser = { ...JSON.parse(provRow.payload_json), id: provRow.id, schoolId: provRow.school_id };
          storedPasswordHash = provRow.password_hash;
          passwordUpgradeTarget = { table: 'provisioned_accounts', id: provRow.id };
        }
      }

      // 1c. Check `students`
      if (!matchedUser) {
        const stuRow = db
          .prepare(
            `SELECT id, school_id, name, email, password_hash, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, payload_json
             FROM students
             WHERE is_active = 1 AND (
               lower(email) = ? OR
               lower(admission_number) = ? OR
               lower(name) = ?
             )
             LIMIT 1`
          )
          .get(cleanIdent, cleanIdent, cleanIdent) as any;
        if (stuRow) {
          const extra = stuRow.payload_json ? JSON.parse(stuRow.payload_json) : {};
          const gradeMatch = String(stuRow.grade_label || '').match(/\b([1-9])\b/);
          matchedUser = {
            ...extra,
            id: stuRow.id,
            name: stuRow.name,
            email: stuRow.email,
            role: 'student',
            schoolId: stuRow.school_id,
            admissionNumber: stuRow.admission_number,
            phone: stuRow.phone,
            upiNumber: stuRow.upi_number,
            grade: gradeMatch ? Number(gradeMatch[1]) : extra.grade,
            stream: stuRow.stream_label || extra.stream,
            className: stuRow.class_name,
            isActive: Boolean(stuRow.is_active),
          };
          storedPasswordHash = stuRow.password_hash;
          passwordUpgradeTarget = { table: 'students', id: stuRow.id };
        }
      }

      // 1d. Check `student_parents`
      if (!matchedUser) {
        const parentRow = db
          .prepare(
            `SELECT id, school_id, student_id, name, email, password_hash, phone
             FROM student_parents
             WHERE lower(email) = ? OR lower(name) = ? OR lower(phone) = ?
             LIMIT 1`
          )
          .get(cleanIdent, cleanIdent, cleanIdent) as any;
        if (parentRow) {
          const siblingRows = db
            .prepare(`SELECT student_id FROM student_parents WHERE lower(email) = ? AND school_id = ?`)
            .all(String(parentRow.email).toLowerCase(), parentRow.school_id) as Array<{ student_id: string }>;
          matchedUser = {
            id: parentRow.id,
            name: parentRow.name,
            email: parentRow.email,
            role: 'parent',
            schoolId: parentRow.school_id,
            phone: parentRow.phone,
            childrenIds: siblingRows.map((r) => r.student_id),
            isActive: true,
          };
          storedPasswordHash = parentRow.password_hash;
          passwordUpgradeTarget = { table: 'student_parents', id: parentRow.id };
        }
      }

      // 1e. Check `school_accounts`
      if (!matchedUser) {
        const accRow = db
          .prepare(
            `SELECT sa.id, sa.school_id, sa.email, sa.password_hash, t.payload_json
             FROM school_accounts sa
             JOIN tenants t ON t.id = sa.school_id
             WHERE lower(sa.email) = ?
             LIMIT 1`
          )
          .get(cleanIdent) as any;
        if (accRow) {
          const tenantObj = JSON.parse(accRow.payload_json);
          matchedUser = {
            id: `usr-school-login-${accRow.school_id}`,
            name: tenantObj.principalName || `${tenantObj.shortName || tenantObj.name} School Login`,
            email: accRow.email,
            role: 'admin',
            schoolId: accRow.school_id,
            isActive: true,
          };
          storedPasswordHash = accRow.password_hash;
          passwordUpgradeTarget = { table: 'school_accounts', id: accRow.id };
        }
      }

      // 1f. Check `tenants` institutional email & domain login fallback
      if (!matchedUser) {
        const tenantRows = db.prepare(`SELECT id, email, domain, short_name, code, payload_json FROM tenants`).all() as any[];
        for (const row of tenantRows) {
          const tenant = JSON.parse(row.payload_json);
          const tEmail = String(row.email || '').toLowerCase().trim();
          const tDomain = String(row.domain || '').toLowerCase().trim();
          const tEmailDomain = tEmail.includes('@') ? tEmail.split('@')[1] : '';
          const schoolSlug = String(row.short_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const schoolCode = String(row.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          if (tEmail && tEmail === cleanIdent) {
            matchedUser = {
              id: `usr-admin-${row.id}`,
              name: tenant.principalName || `${tenant.shortName} Administrator`,
              email: cleanIdent,
              role: 'admin',
              schoolId: row.id,
              isActive: true,
            };
            storedPasswordHash = 'admin2026';
            break;
          }

          if (cleanIdent.includes('@')) {
            const emailDomain = cleanIdent.split('@')[1].trim();
            const isDomainMatch =
              (tDomain && emailDomain === tDomain) ||
              (tEmailDomain && emailDomain === tEmailDomain) ||
              (schoolSlug && emailDomain.startsWith(schoolSlug)) ||
              (schoolCode && emailDomain.includes(schoolCode));
            if (isDomainMatch) {
              const prefix = cleanIdent.split('@')[0];
              const mapped = defaultRolePasswordForDomainPrefix(prefix);
              matchedUser = {
                id: `usr-${row.id}-${prefix.replace(/[^a-z0-9]/g, '') || Date.now()}`,
                name:
                  mapped.role === 'admin'
                    ? tenant.principalName || `${tenant.shortName} Admin`
                    : `${tenant.shortName} ${mapped.role.replace(/_/g, ' ')}`,
                email: cleanIdent,
                role: mapped.role,
                schoolId: row.id,
                isActive: true,
              };
              storedPasswordHash = mapped.password;
              break;
            }
          }
        }
      }

      if (!matchedUser) {
        return res.status(401).json({
          error: 'This account was not found. Use the email and password for your role.',
        });
      }

      if (storedPasswordHash && !verifyPassword(String(password), storedPasswordHash)) {
        writeSecurityAudit({
          schoolId: matchedUser.schoolId || 'global',
          userId: matchedUser.id,
          userEmail: matchedUser.email,
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          details: 'Invalid password',
        });
        return res.status(401).json({
          error: 'Incorrect password. Please verify your credentials and try again.',
        });
      }

      // Upgrade legacy unhashed stored password seamlessly on login
      if (passwordUpgradeTarget && storedPasswordHash && !isHashedPassword(storedPasswordHash)) {
        const nextHash = hashPassword(String(password));
        db.prepare(`UPDATE ${passwordUpgradeTarget.table} SET password_hash = ? WHERE id = ?`).run(
          nextHash,
          passwordUpgradeTarget.id
        );
      }

      const tenantRow = db
        .prepare(`SELECT payload_json FROM tenants WHERE id = ?`)
        .get(matchedUser.schoolId) as { payload_json: string } | undefined;
      const tenant = tenantRow ? JSON.parse(tenantRow.payload_json) : null;

      const sessionToken = createAuthSession(req, res, matchedUser, 'tenant');

      writeSecurityAudit({
        schoolId: matchedUser.schoolId || 'tenant-riara',
        userId: matchedUser.id,
        userEmail: matchedUser.email,
        action: 'LOGIN_SUCCESS',
        resource: '/api/auth/login',
        details: `Role ${matchedUser.role} signed in`,
      });

      return res.json({
        success: true,
        sessionToken,
        user: stripSecrets(matchedUser),
        tenant,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/login:', err);
      return res.status(500).json({ error: 'Authentication failed', message: err?.message });
    }
  });

  // 2. Platform Super Admin Login (HTTP-only cookie with super_admin_only scope)
  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    try {
      const { email = '', identifier = '', password = '' } = req.body || {};
      const cleanEmail = String(email || identifier || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      if (!checkRateLimit(`admin-login:${req.ip || 'local'}`)) {
        return res.status(429).json({ error: 'Too many authentication attempts.' });
      }

      const db = getDb();
      const admin = db
        .prepare(
          `SELECT id, name, email, password_hash, rights_json, access_scope, is_active
           FROM platform_admins
           WHERE lower(email) = ? AND is_active = 1`
        )
        .get(cleanEmail) as any;

      const rawPassword = String(password ?? '');
      const cleanPassword = rawPassword.replace(/[\r\n]+/g, '');
      const passwordValid = Boolean(
        admin &&
          (verifyPassword(rawPassword, admin.password_hash) ||
            (cleanPassword !== rawPassword && verifyPassword(cleanPassword, admin.password_hash)))
      );

      if (!admin || !passwordValid) {
        writeSecurityAudit({
          schoolId: 'global',
          userEmail: cleanEmail,
          action: 'SUPER_ADMIN_LOGIN_FAILED',
          resource: '/api/auth/admin-login',
          details: admin ? 'Invalid password' : 'Admin account not found',
        });
        return res.status(401).json({
          error: 'The Admin Console only accepts the platform administrator account.',
        });
      }

      if (!isHashedPassword(admin.password_hash)) {
        db.prepare(`UPDATE platform_admins SET password_hash = ? WHERE id = ?`).run(
          hashPassword(cleanPassword),
          admin.id
        );
      }

      const firstTenant = db.prepare(`SELECT id FROM tenants LIMIT 1`).get() as { id: string } | undefined;
      const sessionUser = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        schoolId: firstTenant?.id || 'tenant-riara',
        isActive: true,
        accessScope: 'super_admin_only' as const,
        rights: JSON.parse(admin.rights_json || '["super_admin_page"]'),
      };

      const sessionToken = createAuthSession(req, res, sessionUser, 'super_admin_only');
      writeSecurityAudit({
        schoolId: 'global',
        userId: sessionUser.id,
        userEmail: sessionUser.email,
        action: 'SUPER_ADMIN_LOGIN',
        resource: '/api/auth/admin-login',
      });

      return res.json({ success: true, sessionToken, user: sessionUser });
    } catch (err: any) {
      return res.status(500).json({ error: 'Admin login failed', message: err?.message });
    }
  });

  // 3. Update Platform Admin Credentials (Super Admin Only)
  app.post('/api/auth/platform-admin/credentials', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const { adminId, currentPassword, email, newPassword } = req.body || {};
      const targetId = adminId || req.authSession!.userId;
      const db = getDb();

      const admin = db
        .prepare(`SELECT * FROM platform_admins WHERE id = ?`)
        .get(targetId) as any;

      if (!admin) {
        return res.status(404).json({ ok: false, message: 'Platform admin account was not found.' });
      }
      if (!verifyPassword(String(currentPassword || ''), admin.password_hash)) {
        return res.status(401).json({ ok: false, message: 'Current password is incorrect.' });
      }

      let nextEmail = admin.email;
      let nextPassHash = admin.password_hash;

      if (email !== undefined) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.split('@')[1]?.includes('.')) {
          return res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
        }
        const conflict = db
          .prepare(`SELECT id FROM platform_admins WHERE lower(email) = ? AND id != ?`)
          .get(cleanEmail, targetId);
        if (conflict) {
          return res.status(409).json({ ok: false, message: 'Another platform admin already uses that email.' });
        }
        nextEmail = cleanEmail;
      }

      if (newPassword !== undefined && String(newPassword).length > 0) {
        if (String(newPassword).length < 4) {
          return res.status(400).json({ ok: false, message: 'New password must be at least 4 characters.' });
        }
        nextPassHash = hashPassword(String(newPassword));
      }

      const now = new Date().toISOString();
      db.prepare(
        `UPDATE platform_admins SET email = ?, password_hash = ?, updated_at = ? WHERE id = ?`
      ).run(nextEmail, nextPassHash, now, targetId);

      const safeAdmin = {
        id: admin.id,
        name: admin.name,
        email: nextEmail,
        rights: JSON.parse(admin.rights_json || '["super_admin_page"]'),
        accessScope: admin.access_scope,
        isActive: Boolean(admin.is_active),
      };

      upsertCollectionRecord(db, 'edusmart_platform_admins_v1', admin.id, 'global', safeAdmin, false);
      broadcastChange({
        type: 'collection:updated',
        collection: 'edusmart_platform_admins_v1',
        tenantId: 'global',
        timestamp: now,
      });

      return res.json({ ok: true, admin: safeAdmin });
    } catch (err: any) {
      return res.status(500).json({ ok: false, message: err?.message || 'Failed updating credentials' });
    }
  });

  // 4. Register User Account (Persisted in SQLite + sets session cookie if requested)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const payload = req.body?.user ? req.body.user : req.body;
      const autoLogin = req.body?.autoLogin !== false;
      if (!payload || !payload.email || !payload.name) {
        return res.status(400).json({ error: 'Missing required user registration fields (name, email)' });
      }

      const cleanEmail = String(payload.email).trim().toLowerCase();
      const db = getDb();

      // Prevent registering an active platform super admin email
      const reservedAdmin = db
        .prepare(`SELECT id FROM platform_admins WHERE lower(email) = ?`)
        .get(cleanEmail);
      if (reservedAdmin) {
        return res.status(409).json({ error: 'This email is reserved for the Super Admin console.' });
      }

      const existing = db
        .prepare(`SELECT id FROM users WHERE lower(email) = ?`)
        .get(cleanEmail) as { id: string } | undefined;
      if (existing && !req.authSession) {
        return res.status(409).json({
          error: 'An account with this email address already exists. Please sign in instead.',
        });
      }

      const schoolId =
        req.authSession && !req.authSession.isSuperAdmin
          ? req.authSession.schoolId
          : payload.schoolId || 'tenant-riara';

      const role = payload.role || 'student';
      const rawPass = String(payload.password || 'GR4@2026');
      const registeredUser = {
        ...payload,
        email: cleanEmail,
        role,
        id: existing?.id || payload.id || `usr-${role}-${Date.now()}`,
        schoolId,
        isActive: true,
        registeredAt: new Date().toISOString(),
      };

      ingestCollectionData(db, 'edusmart_users_v1', [registeredUser], false);
      const safeUser = stripSecrets(registeredUser);

      const sessionToken = autoLogin && !req.authSession
        ? createAuthSession(req, res, safeUser, 'tenant')
        : undefined;

      broadcastChange({
        type: 'record:created',
        collection: 'edusmart_users_v1',
        tenantId: resolveRecordTenantId('edusmart_users_v1', safeUser, schoolId),
        recordId: safeUser.id,
        actorId: safeUser.id,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        ...(sessionToken ? { sessionToken } : {}),
        user: safeUser,
        message: 'User account registered and synchronized to database successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/auth/register:', err);
      return res.status(500).json({ error: 'Failed to register user account', message: err?.message });
    }
  });

  // 5. Inspect Current Authenticated Session from HTTP-only Cookie
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = req.authSession;
    if (!session) {
      return res.json({ authenticated: false, user: null, activeTenantId: null });
    }
    return res.json({
      authenticated: true,
      user: stripSecrets(session.user),
      activeTenantId: session.schoolId,
      isSuperAdmin: session.isSuperAdmin,
    });
  });

  // 6. Switch Active Tenant (Super Admin Only — updates SQLite session)
  app.post('/api/auth/switch-tenant', requireSuperAdmin, (req: Request, res: Response) => {
    const { schoolId } = req.body || {};
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

    const db = getDb();
    const tenant = db.prepare(`SELECT id FROM tenants WHERE id = ?`).get(String(schoolId));
    if (!tenant) return res.status(404).json({ error: 'Tenant school not found' });

    const updatedUser = { ...req.authSession!.user, schoolId: String(schoolId) };
    db.prepare(
      `UPDATE auth_sessions SET school_id = ?, user_json = ?, last_seen_at = ? WHERE token_hash = ?`
    ).run(String(schoolId), JSON.stringify(updatedUser), new Date().toISOString(), req.authSession!.tokenHash);

    return res.json({ success: true, schoolId: String(schoolId) });
  });

  // 7. Authorized Quick Switch User (School Admin within own school OR Super Admin)
  app.post('/api/auth/switch-user', requireAuth, (req: Request, res: Response) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const session = req.authSession!;
    const allowedSwitcher = session.isSuperAdmin || session.role === 'admin' || session.role === 'head_teacher';
    if (!allowedSwitcher) {
      return res.status(403).json({ error: 'Only authorized administrators can switch user accounts.' });
    }

    const db = getDb();
    const row = db
      .prepare(`SELECT id, school_id, role, payload_json FROM users WHERE id = ?`)
      .get(String(userId)) as any;

    if (!row) return res.status(404).json({ error: 'Target user not found' });
    if (!session.isSuperAdmin && row.school_id !== session.schoolId) {
      return res.status(403).json({ error: 'Cannot switch to a user in another school.' });
    }

    const targetUser = stripSecrets({ ...JSON.parse(row.payload_json), id: row.id, schoolId: row.school_id });
    const sessionToken = createAuthSession(req, res, targetUser, 'tenant');

    // Clean previous session row
    db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`).run(session.tokenHash);

    return res.json({ success: true, sessionToken, user: targetUser });
  });

  // 8. Sign Out (Destroys server session + clears HTTP-only cookie)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      if (session) {
        const db = getDb();
        db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`).run(session.tokenHash);
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'LOGOUT',
          resource: '/api/auth/logout',
        });
      }
      clearSessionCookie(req, res);
      return res.json({ success: true });
    } catch (err: any) {
      clearSessionCookie(req, res);
      return res.json({ success: true });
    }
  });
}
