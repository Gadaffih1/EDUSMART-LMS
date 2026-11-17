import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

type AuthenticatorTransportFuture = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb';
import {
  getDb,
  notifyMySqlTablesChanged,
  stripSecrets,
  writeSecurityAudit,
} from './db.ts';
import { createAuthSession, isHttpsRequest, requireAuth } from './authRoutes.ts';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function resolveRpContext(req: Request): { rpID: string; origins: string[] } {
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000')
    .split(',')[0]
    .trim();
  const hostname = rawHost.split(':')[0] || 'localhost';
  const proto = isHttpsRequest(req) ? 'https' : 'http';
  const originHeader = String(req.headers.origin || '').trim();

  const origins = new Set<string>([`${proto}://${rawHost}`, `https://${hostname}`]);
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    origins.add(`http://${rawHost}`);
  }
  if (originHeader) {
    origins.add(originHeader);
  }

  return {
    rpID: hostname,
    origins: Array.from(origins),
  };
}

function resolveUserByIdAndSchool(
  userId: string,
  schoolId: string,
  isSuperAdmin: boolean
): { user: Record<string, any>; accessScope: 'super_admin_only' | 'tenant' } | null {
  const db = getDb();

  if (isSuperAdmin) {
    const admin = db
      .prepare(
        `SELECT id, name, email, rights_json, is_active FROM platform_admins WHERE id = ? AND is_active = 1`
      )
      .get(userId) as any;
    if (!admin) return null;
    const firstTenant = db.prepare(`SELECT id FROM tenants LIMIT 1`).get() as { id: string } | undefined;
    return {
      accessScope: 'super_admin_only',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        schoolId: firstTenant?.id || schoolId || 'tenant-riara',
        isActive: true,
        accessScope: 'super_admin_only',
        rights: JSON.parse(admin.rights_json || '["super_admin_page"]'),
      },
    };
  }

  const userRow = db
    .prepare(`SELECT id, school_id, payload_json FROM users WHERE id = ? AND school_id = ? AND is_active = 1 LIMIT 1`)
    .get(userId, schoolId) as any;
  if (userRow) {
    return {
      accessScope: 'tenant',
      user: { ...JSON.parse(userRow.payload_json), id: userRow.id, schoolId: userRow.school_id },
    };
  }

  const provRow = db
    .prepare(
      `SELECT id, school_id, payload_json FROM provisioned_accounts WHERE id = ? AND school_id = ? AND is_active = 1 LIMIT 1`
    )
    .get(userId, schoolId) as any;
  if (provRow) {
    return {
      accessScope: 'tenant',
      user: { ...JSON.parse(provRow.payload_json), id: provRow.id, schoolId: provRow.school_id },
    };
  }

  const stuRow = db
    .prepare(
      `SELECT id, school_id, name, email, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, payload_json
       FROM students WHERE id = ? AND school_id = ? AND is_active = 1 LIMIT 1`
    )
    .get(userId, schoolId) as any;
  if (stuRow) {
    const extra = stuRow.payload_json ? JSON.parse(stuRow.payload_json) : {};
    const gradeMatch = String(stuRow.grade_label || '').match(/\b([1-9])\b/);
    return {
      accessScope: 'tenant',
      user: {
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
      },
    };
  }

  const parentRow = db
    .prepare(
      `SELECT id, school_id, student_id, name, email, phone
       FROM student_parents WHERE id = ? AND school_id = ? LIMIT 1`
    )
    .get(userId, schoolId) as any;
  if (parentRow) {
    const siblingRows = db
      .prepare(`SELECT student_id FROM student_parents WHERE lower(email) = ? AND school_id = ?`)
      .all(String(parentRow.email).toLowerCase(), parentRow.school_id) as Array<{ student_id: string }>;
    return {
      accessScope: 'tenant',
      user: {
        id: parentRow.id,
        name: parentRow.name,
        email: parentRow.email,
        role: 'parent',
        schoolId: parentRow.school_id,
        phone: parentRow.phone,
        childrenIds: siblingRows.map((r) => r.student_id),
        isActive: true,
      },
    };
  }

  const accRow = db
    .prepare(
      `SELECT sa.school_id, sa.email, t.payload_json
       FROM school_accounts sa JOIN tenants t ON t.id = sa.school_id
       WHERE sa.school_id = ? LIMIT 1`
    )
    .get(schoolId) as any;
  if (accRow && `usr-school-login-${accRow.school_id}` === userId) {
    const tenantObj = JSON.parse(accRow.payload_json);
    return {
      accessScope: 'tenant',
      user: {
        id: userId,
        name: tenantObj.principalName || `${tenantObj.shortName || tenantObj.name} School Login`,
        email: accRow.email,
        role: 'admin',
        schoolId: accRow.school_id,
        isActive: true,
      },
    };
  }

  return null;
}

export function registerWebAuthnRoutes(app: Express): void {
  // List current authenticated user's biometric/passkey credentials
  app.get('/api/auth/webauthn/credentials', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT id, credential_id, device_label, device_type, backed_up, transports_json, created_at, last_used_at
           FROM webauthn_credentials
           WHERE user_id = ?
           ORDER BY created_at DESC`
        )
        .all(session.userId) as any[];

      return res.json({
        success: true,
        credentials: rows.map((r) => ({
          id: r.id,
          credentialId: r.credential_id,
          deviceLabel: r.device_label,
          deviceType: r.device_type || 'multiDevice',
          backedUp: Boolean(r.backed_up),
          transports: JSON.parse(r.transports_json || '[]'),
          createdAt: r.created_at,
          lastUsedAt: r.last_used_at,
        })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading registered passkeys', message: err?.message });
    }
  });

  // Delete a registered passkey belonging strictly to the signed-in user
  app.delete('/api/auth/webauthn/credentials/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const id = String(req.params.id || '').trim();
      const db = getDb();
      const existing = db
        .prepare(`SELECT id, device_label FROM webauthn_credentials WHERE id = ? AND user_id = ?`)
        .get(id, session.userId) as any;

      if (!existing) {
        return res.status(404).json({ error: 'Passkey not found or unauthorized.' });
      }

      db.prepare(`DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?`).run(id, session.userId);
      notifyMySqlTablesChanged(['webauthn_credentials']);
      writeSecurityAudit({
        schoolId: session.schoolId || 'global',
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'WEBAUTHN_CREDENTIAL_REMOVED',
        resource: '/api/auth/webauthn/credentials',
        details: `Removed biometric passkey "${existing.device_label}"`,
      });

      return res.json({ success: true, deletedId: id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed removing passkey', message: err?.message });
    }
  });

  // Begin biometric / FaceID / TouchID registration
  app.post('/api/auth/webauthn/register/options', requireAuth, async (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const db = getDb();
      const { rpID } = resolveRpContext(req);
      const userEmail = String(session.user?.email || session.userId).trim().toLowerCase();
      const userName = String(session.user?.name || userEmail);

      const existingRows = db
        .prepare(`SELECT credential_id, transports_json FROM webauthn_credentials WHERE user_id = ?`)
        .all(session.userId) as any[];

      const options = await generateRegistrationOptions({
        rpName: 'EduSmart LMS',
        rpID,
        userID: new TextEncoder().encode(session.userId),
        userName: userEmail,
        userDisplayName: userName,
        attestationType: 'none',
        excludeCredentials: existingRows.map((row) => ({
          id: row.credential_id,
          transports: JSON.parse(row.transports_json || '[]') as AuthenticatorTransportFuture[],
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
        },
      });

      const challengeId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS).toISOString();

      db.prepare(`DELETE FROM webauthn_challenges WHERE expires_at <= ?`).run(now.toISOString());
      db.prepare(
        `INSERT INTO webauthn_challenges (id, challenge, flow_type, user_id, user_email, is_super_admin, expires_at, created_at)
         VALUES (?, ?, 'register', ?, ?, ?, ?, ?)`
      ).run(
        challengeId,
        options.challenge,
        session.userId,
        userEmail,
        session.isSuperAdmin ? 1 : 0,
        expiresAt,
        now.toISOString()
      );

      return res.json({ success: true, challengeId, options });
    } catch (err: any) {
      console.error('WebAuthn register/options error:', err);
      return res.status(500).json({ error: 'Could not initialize biometric setup', message: err?.message });
    }
  });

  // Finish biometric / FaceID / TouchID registration
  app.post('/api/auth/webauthn/register/verify', requireAuth, async (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const { challengeId, attestationResponse, deviceLabel } = req.body || {};
      if (!challengeId || !attestationResponse) {
        return res.status(400).json({ error: 'Missing challengeId or attestation response.' });
      }

      const db = getDb();
      const chRow = db
        .prepare(
          `SELECT * FROM webauthn_challenges
           WHERE id = ? AND flow_type = 'register' AND user_id = ?`
        )
        .get(String(challengeId), session.userId) as any;

      if (!chRow || new Date(chRow.expires_at).getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Biometric setup challenge expired. Please try again.' });
      }

      db.prepare(`DELETE FROM webauthn_challenges WHERE id = ?`).run(String(challengeId));

      const { rpID, origins } = resolveRpContext(req);
      const verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: chRow.challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Biometric verification failed. Please retry on this device.' });
      }

      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      const now = new Date().toISOString();
      const id = `wa-${crypto.randomUUID()}`;
      const cleanLabel =
        String(deviceLabel || '').trim() ||
        `Device Passkey (${new Date().toLocaleDateString('en-KE')})`;

      db.prepare(
        `INSERT INTO webauthn_credentials (
          id, user_id, user_role, school_id, user_email, is_super_admin,
          credential_id, public_key, counter, transports_json,
          device_type, backed_up, device_label, created_at, last_used_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        session.userId,
        session.role,
        session.schoolId || 'global',
        String(session.user?.email || '').toLowerCase(),
        session.isSuperAdmin ? 1 : 0,
        credential.id,
        Buffer.from(credential.publicKey).toString('base64'),
        credential.counter,
        JSON.stringify(credential.transports || []),
        credentialDeviceType || 'singleDevice',
        credentialBackedUp ? 1 : 0,
        cleanLabel,
        now,
        now
      );

      notifyMySqlTablesChanged(['webauthn_credentials']);
      writeSecurityAudit({
        schoolId: session.schoolId || 'global',
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'WEBAUTHN_CREDENTIAL_REGISTERED',
        resource: '/api/auth/webauthn/register/verify',
        details: `Registered ${credentialDeviceType} biometric key "${cleanLabel}"`,
      });

      return res.json({
        success: true,
        credential: {
          id,
          credentialId: credential.id,
          deviceLabel: cleanLabel,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          createdAt: now,
        },
      });
    } catch (err: any) {
      console.error('WebAuthn register/verify error:', err);
      return res.status(400).json({ error: err?.message || 'Failed verifying biometric credential.' });
    }
  });

  // Begin biometric sign-in (FaceID / TouchID / Passkey)
  app.post('/api/auth/webauthn/login/options', async (req: Request, res: Response) => {
    try {
      const { email = '', adminOnly = false } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const db = getDb();
      const { rpID } = resolveRpContext(req);

      let allowCredentials: Array<{ id: string; transports?: AuthenticatorTransportFuture[] }> | undefined;

      if (cleanEmail) {
        const rows = db
          .prepare(
            `SELECT credential_id, transports_json, is_super_admin
             FROM webauthn_credentials
             WHERE lower(user_email) = ?`
          )
          .all(cleanEmail) as any[];

        const filtered = rows.filter((r) => (adminOnly ? Boolean(r.is_super_admin) : !r.is_super_admin));
        if (filtered.length === 0) {
          return res.status(404).json({
            error:
              'No biometric passkey is registered for this email yet. Sign in with your email and password first, then enroll TouchID/FaceID in Settings.',
          });
        }
        allowCredentials = filtered.map((r) => ({
          id: r.credential_id,
          transports: JSON.parse(r.transports_json || '[]') as AuthenticatorTransportFuture[],
        }));
      }

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'required',
        ...(allowCredentials ? { allowCredentials } : {}),
      });

      const challengeId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS).toISOString();

      db.prepare(`DELETE FROM webauthn_challenges WHERE expires_at <= ?`).run(now.toISOString());
      db.prepare(
        `INSERT INTO webauthn_challenges (id, challenge, flow_type, user_email, is_super_admin, expires_at, created_at)
         VALUES (?, ?, 'authenticate', ?, ?, ?, ?)`
      ).run(challengeId, options.challenge, cleanEmail || null, adminOnly ? 1 : 0, expiresAt, now.toISOString());

      return res.json({ success: true, challengeId, options });
    } catch (err: any) {
      console.error('WebAuthn login/options error:', err);
      return res.status(500).json({ error: 'Could not initialize biometric sign-in', message: err?.message });
    }
  });

  // Complete biometric sign-in and issue standard HTTP-only + Bearer session scoped strictly to user tenant & role
  app.post('/api/auth/webauthn/login/verify', async (req: Request, res: Response) => {
    try {
      const { challengeId, assertionResponse, adminOnly = false } = req.body || {};
      if (!challengeId || !assertionResponse?.id) {
        return res.status(400).json({ error: 'Missing biometric verification challenge or assertion.' });
      }

      const db = getDb();
      const chRow = db
        .prepare(`SELECT * FROM webauthn_challenges WHERE id = ? AND flow_type = 'authenticate'`)
        .get(String(challengeId)) as any;

      if (!chRow || new Date(chRow.expires_at).getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Biometric login challenge expired. Please try again.' });
      }
      db.prepare(`DELETE FROM webauthn_challenges WHERE id = ?`).run(String(challengeId));

      const credRow = db
        .prepare(`SELECT * FROM webauthn_credentials WHERE credential_id = ?`)
        .get(String(assertionResponse.id)) as any;

      if (!credRow) {
        return res.status(401).json({ error: 'Recognized passkey is not linked to any active account.' });
      }

      const credIsSuperAdmin = Boolean(credRow.is_super_admin);
      if (adminOnly && !credIsSuperAdmin) {
        return res.status(401).json({ error: 'Only platform super administrator passkeys may unlock /admin.' });
      }
      if (!adminOnly && credIsSuperAdmin) {
        return res.status(401).json({ error: 'Super Admin passkeys may only sign in on the /admin portal.' });
      }

      const { rpID, origins } = resolveRpContext(req);
      const verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: chRow.challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: credRow.credential_id,
          publicKey: new Uint8Array(Buffer.from(credRow.public_key, 'base64')),
          counter: Number(credRow.counter || 0),
          transports: JSON.parse(credRow.transports_json || '[]') as AuthenticatorTransportFuture[],
        },
      });

      if (!verification.verified) {
        writeSecurityAudit({
          schoolId: credRow.school_id || 'global',
          userId: credRow.user_id,
          userEmail: credRow.user_email,
          action: 'WEBAUTHN_LOGIN_FAILED',
          resource: '/api/auth/webauthn/login/verify',
        });
        return res.status(401).json({ error: 'Biometric authentication could not be verified.' });
      }

      const resolved = resolveUserByIdAndSchool(
        credRow.user_id,
        credRow.school_id,
        credIsSuperAdmin
      );
      if (!resolved) {
        return res.status(401).json({ error: 'Account inactive or not found in school directory.' });
      }

      const now = new Date().toISOString();
      db.prepare(`UPDATE webauthn_credentials SET counter = ?, last_used_at = ? WHERE id = ?`).run(
        verification.authenticationInfo.newCounter,
        now,
        credRow.id
      );

      const sessionToken = createAuthSession(req, res, resolved.user, resolved.accessScope);
      const tenantRow = resolved.user.schoolId
        ? (db.prepare(`SELECT payload_json FROM tenants WHERE id = ?`).get(resolved.user.schoolId) as
            | { payload_json: string }
            | undefined)
        : undefined;

      notifyMySqlTablesChanged(['webauthn_credentials', 'security_audit_logs']);
      writeSecurityAudit({
        schoolId: resolved.user.schoolId || 'global',
        userId: resolved.user.id,
        userEmail: resolved.user.email,
        action: 'WEBAUTHN_LOGIN_SUCCESS',
        resource: '/api/auth/webauthn/login/verify',
        details: `Signed in via biometric passkey "${credRow.device_label}" (${resolved.user.role})`,
      });

      return res.json({
        success: true,
        sessionToken,
        user: stripSecrets(resolved.user),
        tenant: tenantRow ? JSON.parse(tenantRow.payload_json) : null,
      });
    } catch (err: any) {
      console.error('WebAuthn login/verify error:', err);
      return res.status(401).json({ error: err?.message || 'Biometric login failed.' });
    }
  });
}
