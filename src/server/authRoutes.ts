import crypto from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import {
  getDb,
  hashPassword,
  isHashedPassword,
  notifyMySqlTablesChanged,
  stripSecrets,
  upsertCredentialVault,
  verifyPassword,
  writeSecurityAudit,
} from './db.ts';
import { ingestCollectionData, resolveRecordTenantId, upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';

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
  notifyMySqlTablesChanged(['auth_sessions']);
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

      // 1a. Check `users` table strictly by assigned email
      const userRow = db
        .prepare(
          `SELECT id, password_hash, school_id, payload_json
           FROM users
           WHERE is_active = 1 AND lower(email) = ?
           LIMIT 1`
        )
        .get(cleanIdent) as any;

      if (userRow) {
        matchedUser = { ...JSON.parse(userRow.payload_json), id: userRow.id, schoolId: userRow.school_id };
        storedPasswordHash = userRow.password_hash;
        passwordUpgradeTarget = { table: 'users', id: userRow.id };
      }

      // 1b. Check `provisioned_accounts` strictly by assigned email
      if (!matchedUser) {
        const provRow = db
          .prepare(
            `SELECT id, school_id, password_hash, payload_json
             FROM provisioned_accounts
             WHERE is_active = 1 AND lower(email) = ?
             LIMIT 1`
          )
          .get(cleanIdent) as any;
        if (provRow) {
          matchedUser = { ...JSON.parse(provRow.payload_json), id: provRow.id, schoolId: provRow.school_id };
          storedPasswordHash = provRow.password_hash;
          passwordUpgradeTarget = { table: 'provisioned_accounts', id: provRow.id };
        }
      }

      // 1c. Check `students` strictly by assigned email
      if (!matchedUser) {
        const stuRow = db
          .prepare(
            `SELECT id, school_id, name, email, password_hash, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, payload_json
             FROM students
             WHERE is_active = 1 AND lower(email) = ?
             LIMIT 1`
          )
          .get(cleanIdent) as any;
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

      // 1d. Check `student_parents` strictly by assigned email
      if (!matchedUser) {
        const parentRow = db
          .prepare(
            `SELECT id, school_id, student_id, name, email, password_hash, phone
             FROM student_parents
             WHERE lower(email) = ?
             LIMIT 1`
          )
          .get(cleanIdent) as any;
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

      // 1f. Primary tenant institutional contact email ONLY (no wildcard domain synthesis)
      if (!matchedUser) {
        const tenantRowMatch = db
          .prepare(`SELECT id, email, payload_json FROM tenants WHERE lower(email) = ? LIMIT 1`)
          .get(cleanIdent) as any;
        if (tenantRowMatch) {
          const tenant = JSON.parse(tenantRowMatch.payload_json);
          matchedUser = {
            id: `usr-admin-${tenantRowMatch.id}`,
            name: tenant.principalName || `${tenant.shortName} Administrator`,
            email: cleanIdent,
            role: 'admin',
            schoolId: tenantRowMatch.id,
            isActive: true,
          };
          storedPasswordHash = 'admin2026';
        }
      }

      if (!matchedUser) {
        return res.status(401).json({
          error: 'Account not found. Sign in strictly with your assigned institutional email and password.',
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

      if (passwordUpgradeTarget) {
        upsertCredentialVault(db, {
          sourceTable: passwordUpgradeTarget.table as
            | 'users'
            | 'students'
            | 'student_parents'
            | 'provisioned_accounts'
            | 'school_accounts',
          recordId: passwordUpgradeTarget.id,
          schoolId: String(matchedUser.schoolId || 'tenant-riara'),
          email: String(matchedUser.email || cleanIdent).trim().toLowerCase(),
          plaintextPassword: String(password),
        });
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
      notifyMySqlTablesChanged(['platform_admins', 'collections_store']);
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

  // 4. Create Assigned User Account (Strictly Restricted to Authenticated School Admins / Registrars / Super Admin)
  app.post('/api/auth/register', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const canProvisionUsers =
        session.isSuperAdmin ||
        ['admin', 'head_teacher', 'school_admin_staff'].includes(session.role);
      if (!canProvisionUsers) {
        return res.status(403).json({
          error: 'Public account creation is disabled. Contact your School Administrator to issue credentials.',
        });
      }

      const payload = req.body?.user ? req.body.user : req.body;
      if (!payload || !payload.email || !payload.name) {
        return res.status(400).json({ error: 'Missing required user account fields (name, email).' });
      }

      const cleanEmail = String(payload.email).trim().toLowerCase();
      const db = getDb();

      // Prevent overwriting an active platform super admin email
      const reservedAdmin = db
        .prepare(`SELECT id FROM platform_admins WHERE lower(email) = ?`)
        .get(cleanEmail);
      if (reservedAdmin) {
        return res.status(409).json({ error: 'This email is reserved for the Super Admin console.' });
      }

      // Strictly lock tenant scope for non-super-admins
      const schoolId = session.isSuperAdmin
        ? String(payload.schoolId || session.schoolId || 'tenant-riara')
        : session.schoolId;

      if (!session.isSuperAdmin && payload.schoolId && payload.schoolId !== session.schoolId) {
        return res.status(403).json({
          error: 'Cross-tenant provisioning forbidden. You can only create accounts within your own school.',
        });
      }

      const existing = db
        .prepare(`SELECT id, school_id FROM users WHERE lower(email) = ?`)
        .get(cleanEmail) as { id: string; school_id: string } | undefined;
      if (existing && !session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(409).json({
          error: 'This email is already assigned in another institution.',
        });
      }

      const role = payload.role || 'student';
      const registeredUser = {
        ...payload,
        email: cleanEmail,
        role,
        id: existing?.id || payload.id || `usr-${role}-${Date.now()}`,
        schoolId,
        isActive: payload.isActive !== false,
        registeredAt: new Date().toISOString(),
      };

      ingestCollectionData(db, 'edusmart_users_v1', [registeredUser], false);
      const safeUser = stripSecrets(registeredUser);

      broadcastChange({
        type: 'record:created',
        collection: 'edusmart_users_v1',
        tenantId: resolveRecordTenantId('edusmart_users_v1', safeUser, schoolId),
        recordId: safeUser.id,
        actorId: session.userId,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        user: safeUser,
        message: 'Assigned institutional user account saved to database.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/auth/register:', err);
      return res.status(500).json({ error: 'Failed to provision user account', message: err?.message });
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
    notifyMySqlTablesChanged(['auth_sessions']);

    return res.json({ success: true, schoolId: String(schoolId) });
  });

  // 7. Authorized Account / Role Switcher (Super Admin Portal Only)
  app.post('/api/auth/switch-user', requireAuth, (req: Request, res: Response) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const session = req.authSession!;
    if (!session.isSuperAdmin) {
      return res.status(403).json({ error: 'Account switching is restricted exclusively to the Super Admin Portal.' });
    }

    const db = getDb();
    const row = db
      .prepare(`SELECT id, school_id, role, payload_json FROM users WHERE id = ?`)
      .get(String(userId)) as any;

    if (!row) return res.status(404).json({ error: 'Target user not found' });

    const targetUser = stripSecrets({ ...JSON.parse(row.payload_json), id: row.id, schoolId: row.school_id });
    const sessionToken = createAuthSession(req, res, targetUser, 'tenant');

    // Clean previous session row
    db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`).run(session.tokenHash);
    notifyMySqlTablesChanged(['auth_sessions']);

    return res.json({ success: true, sessionToken, user: targetUser });
  });

  // 8. Change Own Account Password (Central Database / MySQL)
  app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Current password and a new password (at least 6 characters) are required.' });
      }

      const db = getDb();
      const now = new Date().toISOString();
      const nextHash = hashPassword(String(newPassword));

      if (session.isSuperAdmin) {
        const admin = db.prepare(`SELECT id, password_hash FROM platform_admins WHERE id = ?`).get(session.userId) as any;
        if (!admin || !verifyPassword(String(currentPassword), admin.password_hash)) {
          return res.status(401).json({ error: 'Current password is incorrect.' });
        }
        db.prepare(`UPDATE platform_admins SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
          nextHash,
          now,
          session.userId
        );
        notifyMySqlTablesChanged(['platform_admins']);
        return res.json({ success: true });
      }

      const userRow = db
        .prepare(`SELECT id, password_hash, payload_json FROM users WHERE id = ?`)
        .get(session.userId) as any;
      if (!userRow || !verifyPassword(String(currentPassword), userRow.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const parsed = JSON.parse(userRow.payload_json || '{}');
      parsed.passwordHash = nextHash;
      delete parsed.password;

      db.prepare(`UPDATE users SET password_hash = ?, payload_json = ?, updated_at = ? WHERE id = ?`).run(
        nextHash,
        JSON.stringify(parsed),
        now,
        session.userId
      );
      db.prepare(`UPDATE students SET password_hash = ? WHERE id = ?`).run(nextHash, session.userId);
      db.prepare(`UPDATE student_parents SET password_hash = ? WHERE id = ?`).run(nextHash, session.userId);
      db.prepare(`UPDATE provisioned_accounts SET password_hash = ? WHERE id = ?`).run(nextHash, session.userId);
      upsertCredentialVault(db, {
        sourceTable: 'users',
        recordId: session.userId,
        schoolId: session.schoolId,
        email: String(parsed.email || session.user?.email || '').trim().toLowerCase(),
        plaintextPassword: String(newPassword),
      });
      upsertCollectionRecord(db, 'edusmart_users_v1', session.userId, session.schoolId, parsed, false);

      writeSecurityAudit({
        schoolId: session.schoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'PASSWORD_UPDATED',
        resource: '/api/auth/change-password',
      });
      notifyMySqlTablesChanged(['users', 'students', 'student_parents', 'provisioned_accounts', 'user_credential_vault', 'collections_store', 'security_audit_logs']);

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating password', message: err?.message });
    }
  });

  // 9. Sign Out (Destroys server session + clears HTTP-only cookie)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      const session = req.authSession;
      if (session) {
        const db = getDb();
        db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`).run(session.tokenHash);
        notifyMySqlTablesChanged(['auth_sessions']);
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
