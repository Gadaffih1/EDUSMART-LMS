import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import {
  decryptVaultPassword,
  deleteCredentialVault,
  getDb,
  hashPassword,
  isHashedPassword,
  notifyMySqlTablesChanged,
  stripSecrets,
  upsertCredentialVault,
  writeSecurityAudit,
} from './db.ts';
import {
  AuthSession,
  normalizeAssignedRoles,
  requireAuth,
  requireSuperAdmin,
  sessionHasAnyRole,
  sessionHasRole,
} from './authRoutes.ts';
import { upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';

function canManageUsers(session: AuthSession): boolean {
  return (
    session.isSuperAdmin ||
    sessionHasAnyRole(session, ['admin', 'head_teacher', 'school_admin_staff'])
  );
}

function defaultPasswordForRole(role: string, grade?: number | string): string {
  const cleanRole = String(role || 'student').toLowerCase();
  if (cleanRole === 'student') {
    const g = Number(grade);
    if (g >= 1 && g <= 9) return `GR${g}@2026`;
    return 'GR4@2026';
  }
  const map: Record<string, string> = {
    admin: 'admin2026',
    teacher: 'teach2026',
    parent: 'parent2026',
    nurse: 'nurse2026',
    transport_team: 'transport2026',
    cocurricular_team: 'cocurricular2026',
    school_admin_staff: 'staff2026',
    head_teacher: 'head2026',
    deputy_head: 'deputy2026',
    dean_of_studies: 'dean2026',
    curriculum_coordinator: 'curriculum2026',
    senior_teacher: 'senior2026',
    head_of_department: 'hod2026',
    class_teacher: 'class2026',
    librarian: 'librarian2026',
    finance_officer: 'finance2026',
    procurement_officer: 'procurement2026',
    storekeeper: 'storekeeper2026',
    hr_officer: 'hr2026',
  };
  return map[cleanRole] || 'edusmart2026';
}

function formatRoleLabel(role: string): string {
  return String(role || 'user')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseJsonSafe(raw: string | null | undefined, fallback: any = {}): any {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeUserRecord(row: any): Record<string, any> {
  const extra = parseJsonSafe(row.payload_json, {});
  const primaryRole = String(row.role || extra.role || 'student').trim().toLowerCase();
  const assignedRoles = normalizeAssignedRoles(
    primaryRole,
    extra.assignedRoles,
    extra.doubleAccessConfig
  );
  return stripSecrets({
    ...extra,
    id: row.id,
    name: row.name || extra.name || 'User',
    email: String(row.email || extra.email || '').trim().toLowerCase(),
    role: primaryRole,
    assignedRoles,
    schoolId: row.school_id || extra.schoolId || 'tenant-riara',
    admissionNumber: row.admission_number ?? extra.admissionNumber ?? undefined,
    staffNumber: row.staff_number ?? extra.staffNumber ?? undefined,
    tscNumber: row.tsc_number ?? extra.tscNumber ?? undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : extra.isActive !== false,
    updatedAt: row.updated_at || extra.updatedAt,
  });
}

function softDeleteCollectionRecord(db: ReturnType<typeof getDb>, collectionKey: string, recordId: string, now: string): void {
  db.prepare(
    `UPDATE collections_store SET deleted_at = ?, updated_at = ?
     WHERE collection_key = ? AND record_id = ? AND deleted_at IS NULL`
  ).run(now, now, collectionKey, recordId);
}

export function registerUserManagementRoutes(app: Express): void {
  // 1. List Users (Super Admin: any/all tenants; Tenant Admin: strictly own schoolId)
  app.get('/api/users', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!canManageUsers(session)) {
        return res.status(403).json({ error: 'Administrator privileges required to list user accounts.' });
      }

      const requestedSchoolId = String(req.query.schoolId || req.query.tenantId || '').trim();
      if (!session.isSuperAdmin && requestedSchoolId && requestedSchoolId !== session.schoolId) {
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'CROSS_TENANT_USER_LIST_BLOCKED',
          resource: '/api/users',
          details: `Requested schoolId=${requestedSchoolId}`,
        });
        return res.status(403).json({ error: 'Cross-tenant user directory access forbidden.' });
      }

      const includeAll = session.isSuperAdmin && (requestedSchoolId === 'all' || !requestedSchoolId);
      const targetSchoolId = includeAll ? null : session.isSuperAdmin ? requestedSchoolId : session.schoolId;

      const search = String(req.query.search || '').trim().toLowerCase();
      const roleFilter = String(req.query.role || '').trim().toLowerCase();
      const statusFilter = String(req.query.status || '').trim().toLowerCase();

      const db = getDb();
      const whereParts: string[] = [];
      const params: any[] = [];

      if (targetSchoolId) {
        whereParts.push(`school_id = ?`);
        params.push(targetSchoolId);
      }
      if (statusFilter === 'active') {
        whereParts.push(`is_active = 1`);
      } else if (statusFilter === 'inactive') {
        whereParts.push(`is_active = 0`);
      }

      const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      const rows = db
        .prepare(
          `SELECT id, email, name, role, school_id, admission_number, staff_number, tsc_number, is_active, payload_json, updated_at
           FROM users ${whereSql}
           ORDER BY school_id ASC, name ASC`
        )
        .all(...params) as any[];

      const userMap = new Map<string, Record<string, any>>();
      for (const r of rows) {
        const u = normalizeUserRecord(r);
        if (roleFilter && roleFilter !== 'all') {
          const rolesHeld = Array.isArray(u.assignedRoles) ? u.assignedRoles : [u.role];
          if (!rolesHeld.includes(roleFilter)) continue;
        }
        userMap.set(u.id, u);
      }

      // Include any students/parents/provisioned_accounts not yet mirrored in `users`
      const extraQueries: Array<{ sql: string; mapRow: (r: any) => Record<string, any> }> = [
        {
          sql: targetSchoolId
            ? `SELECT id, school_id, name, email, role, admission_number, staff_number, phone, grade, stream, is_active, created_at, payload_json FROM provisioned_accounts WHERE school_id = ?`
            : `SELECT id, school_id, name, email, role, admission_number, staff_number, phone, grade, stream, is_active, created_at, payload_json FROM provisioned_accounts`,
          mapRow: (r: any) => {
            const extra = parseJsonSafe(r.payload_json, {});
            return stripSecrets({
              ...extra,
              id: r.id,
              schoolId: r.school_id,
              name: r.name,
              email: String(r.email || '').trim().toLowerCase(),
              role: r.role || 'student',
              admissionNumber: r.admission_number || extra.admissionNumber,
              staffNumber: r.staff_number || extra.staffNumber,
              phone: r.phone || extra.phone,
              grade: r.grade ?? extra.grade,
              stream: r.stream || extra.stream,
              isActive: Boolean(r.is_active),
              createdAt: r.created_at,
            });
          },
        },
        {
          sql: targetSchoolId
            ? `SELECT id, school_id, name, email, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, created_at, rights_json, payload_json FROM students WHERE school_id = ?`
            : `SELECT id, school_id, name, email, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, created_at, rights_json, payload_json FROM students`,
          mapRow: (r: any) => {
            const extra = parseJsonSafe(r.payload_json, {});
            const gradeMatch = String(r.grade_label || '').match(/\b([1-9])\b/);
            return stripSecrets({
              ...extra,
              id: r.id,
              schoolId: r.school_id,
              name: r.name,
              email: String(r.email || '').trim().toLowerCase(),
              role: 'student',
              admissionNumber: r.admission_number || extra.admissionNumber,
              phone: r.phone || extra.phone,
              upiNumber: r.upi_number || extra.upiNumber,
              grade: extra.grade ?? (gradeMatch ? Number(gradeMatch[1]) : undefined),
              stream: r.stream_label || extra.stream,
              className: r.class_name || extra.className,
              isActive: Boolean(r.is_active),
              createdAt: r.created_at,
            });
          },
        },
        {
          sql: targetSchoolId
            ? `SELECT id, school_id, student_id, name, email, phone, relationship, created_at, payload_json FROM student_parents WHERE school_id = ?`
            : `SELECT id, school_id, student_id, name, email, phone, relationship, created_at, payload_json FROM student_parents`,
          mapRow: (r: any) => {
            const extra = parseJsonSafe(r.payload_json, {});
            return stripSecrets({
              ...extra,
              id: r.id,
              schoolId: r.school_id,
              name: r.name,
              email: String(r.email || '').trim().toLowerCase(),
              role: 'parent',
              phone: r.phone || extra.phone,
              relationship: r.relationship || extra.relationship,
              isActive: true,
              createdAt: r.created_at,
            });
          },
        },
      ];

      const seenEmails = new Set(Array.from(userMap.values()).map((u) => `${u.schoolId}::${u.email}`));
      for (const q of extraQueries) {
        const extraRows = (targetSchoolId ? db.prepare(q.sql).all(targetSchoolId) : db.prepare(q.sql).all()) as any[];
        for (const r of extraRows) {
          const item = q.mapRow(r);
          if (!item.email) continue;
          const emailKey = `${item.schoolId}::${item.email}`;
          if (userMap.has(item.id) || seenEmails.has(emailKey)) continue;
          if (roleFilter && roleFilter !== 'all') {
            const rolesHeld = Array.isArray(item.assignedRoles) ? item.assignedRoles : [String(item.role || '').toLowerCase()];
            if (!rolesHeld.includes(roleFilter)) continue;
          }
          if (statusFilter === 'active' && !item.isActive) continue;
          if (statusFilter === 'inactive' && item.isActive) continue;
          userMap.set(item.id, item);
          seenEmails.add(emailKey);
        }
      }

      let users = Array.from(userMap.values());
      if (search) {
        users = users.filter((u) => {
          const hay = [
            u.name,
            u.email,
            u.role,
            ...(Array.isArray(u.assignedRoles) ? u.assignedRoles : []),
            u.admissionNumber,
            u.staffNumber,
            u.tscNumber,
            u.phone,
            u.designation,
            u.department,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(search);
        });
      }

      users.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      return res.json({
        success: true,
        scope: targetSchoolId || 'all',
        total: users.length,
        users,
      });
    } catch (err: any) {
      console.error('Error in GET /api/users:', err);
      return res.status(500).json({ error: 'Failed to load user accounts', message: err?.message });
    }
  });

  // 2. Super Admin Printable Credentials Roster Per Tenant School (STRICTLY SUPER ADMIN ONLY)
  app.get('/api/users/printable-credentials', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const db = getDb();
      const requestedSchoolId = String(req.query.schoolId || req.query.tenantId || 'all').trim();
      const roleFilter = String(req.query.role || 'all').trim().toLowerCase();
      const statusFilter = String(req.query.status || 'all').trim().toLowerCase();

      const tenants = (
        requestedSchoolId && requestedSchoolId !== 'all'
          ? db.prepare(`SELECT id, name, short_name, code, domain, email, theme_color, payload_json FROM tenants WHERE id = ?`).all(requestedSchoolId)
          : db.prepare(`SELECT id, name, short_name, code, domain, email, theme_color, payload_json FROM tenants ORDER BY name ASC`).all()
      ) as any[];

      if (requestedSchoolId && requestedSchoolId !== 'all' && tenants.length === 0) {
        return res.status(404).json({ error: 'Tenant school not found.' });
      }

      // Build vault password lookup maps
      const vaultRows = (
        requestedSchoolId && requestedSchoolId !== 'all'
          ? db
              .prepare(`SELECT account_key, source_table, record_id, school_id, email, encrypted_password FROM user_credential_vault WHERE school_id = ?`)
              .all(requestedSchoolId)
          : db
              .prepare(`SELECT account_key, source_table, record_id, school_id, email, encrypted_password FROM user_credential_vault`)
              .all()
      ) as Array<{
        account_key: string;
        source_table: string;
        record_id: string;
        school_id: string;
        email: string;
        encrypted_password: string;
      }>;

      const vaultByAccountKey = new Map<string, string>();
      const vaultByRecordId = new Map<string, string>();
      const vaultBySchoolEmail = new Map<string, string>();

      for (const v of vaultRows) {
        const decrypted = decryptVaultPassword(v.encrypted_password);
        if (!decrypted) continue;
        vaultByAccountKey.set(v.account_key, decrypted);
        if (!vaultByRecordId.has(v.record_id)) vaultByRecordId.set(v.record_id, decrypted);
        if (v.email) {
          vaultBySchoolEmail.set(`${v.school_id}::${v.email.trim().toLowerCase()}`, decrypted);
        }
      }

      const resolvePasswordForRecord = (
        sourceTables: string[],
        recordId: string,
        schoolId: string,
        email: string,
        rawHash?: string | null
      ): { password: string | null; passwordStatus: 'verified' | 'reset_required' } => {
        for (const tbl of sourceTables) {
          const hit = vaultByAccountKey.get(`${tbl}:${recordId}`);
          if (hit) return { password: hit, passwordStatus: 'verified' };
        }
        const byId = vaultByRecordId.get(recordId);
        if (byId) return { password: byId, passwordStatus: 'verified' };
        const byEmail = vaultBySchoolEmail.get(`${schoolId}::${email.trim().toLowerCase()}`);
        if (byEmail) return { password: byEmail, passwordStatus: 'verified' };
        if (rawHash && !isHashedPassword(rawHash)) {
          return { password: rawHash, passwordStatus: 'verified' };
        }
        return { password: null, passwordStatus: 'reset_required' };
      };

      const schools = tenants.map((t) => {
        const tenantExtra = parseJsonSafe(t.payload_json, {});
        const schoolId = String(t.id);

        const schoolAccountRow = db
          .prepare(`SELECT id, email, domain, password_hash FROM school_accounts WHERE school_id = ? LIMIT 1`)
          .get(schoolId) as any;

        const schoolAccount = schoolAccountRow
          ? {
              id: schoolAccountRow.id,
              email: schoolAccountRow.email,
              domain: schoolAccountRow.domain || t.domain || '',
              ...resolvePasswordForRecord(
                ['school_accounts'],
                schoolAccountRow.id,
                schoolId,
                schoolAccountRow.email,
                schoolAccountRow.password_hash
              ),
            }
          : null;

        const combinedByEmail = new Map<string, any>();

        // 1. Primary `users` table
        const userRows = db
          .prepare(
            `SELECT id, email, name, role, school_id, admission_number, staff_number, tsc_number, password_hash, is_active, payload_json
             FROM users WHERE school_id = ? ORDER BY role ASC, name ASC`
          )
          .all(schoolId) as any[];

        for (const r of userRows) {
          const cleanEmail = String(r.email || '').trim().toLowerCase();
          if (!cleanEmail) continue;
          const extra = parseJsonSafe(r.payload_json, {});
          const passInfo = resolvePasswordForRecord(
            ['users', 'students', 'student_parents', 'provisioned_accounts'],
            r.id,
            schoolId,
            cleanEmail,
            r.password_hash
          );
          combinedByEmail.set(cleanEmail, {
            id: r.id,
            name: r.name || extra.name || 'User',
            email: cleanEmail,
            password: passInfo.password,
            passwordStatus: passInfo.passwordStatus,
            role: r.role || extra.role || 'student',
            roleLabel: formatRoleLabel(r.role || extra.role || 'student'),
            identifier: r.admission_number || r.staff_number || r.tsc_number || extra.admissionNumber || extra.staffNumber || '',
            admissionNumber: r.admission_number || extra.admissionNumber || '',
            staffNumber: r.staff_number || extra.staffNumber || '',
            tscNumber: r.tsc_number || extra.tscNumber || '',
            phone: extra.phone || '',
            grade: extra.grade ?? '',
            stream: extra.stream || '',
            designation: extra.designation || '',
            department: extra.department || '',
            isActive: Boolean(r.is_active),
          });
        }

        // 2. Fallback from `provisioned_accounts`
        const provRows = db
          .prepare(
            `SELECT id, name, email, role, admission_number, staff_number, phone, grade, stream, is_active, password_hash, payload_json
             FROM provisioned_accounts WHERE school_id = ?`
          )
          .all(schoolId) as any[];

        for (const r of provRows) {
          const cleanEmail = String(r.email || '').trim().toLowerCase();
          if (!cleanEmail || combinedByEmail.has(cleanEmail)) continue;
          const extra = parseJsonSafe(r.payload_json, {});
          const passInfo = resolvePasswordForRecord(
            ['provisioned_accounts', 'users'],
            r.id,
            schoolId,
            cleanEmail,
            r.password_hash
          );
          combinedByEmail.set(cleanEmail, {
            id: r.id,
            name: r.name || extra.name || 'User',
            email: cleanEmail,
            password: passInfo.password,
            passwordStatus: passInfo.passwordStatus,
            role: r.role || 'student',
            roleLabel: formatRoleLabel(r.role || 'student'),
            identifier: r.admission_number || r.staff_number || '',
            admissionNumber: r.admission_number || '',
            staffNumber: r.staff_number || '',
            tscNumber: extra.tscNumber || '',
            phone: r.phone || extra.phone || '',
            grade: r.grade ?? extra.grade ?? '',
            stream: r.stream || extra.stream || '',
            designation: extra.designation || '',
            department: extra.department || '',
            isActive: Boolean(r.is_active),
          });
        }

        // 3. Fallback from `students`
        const stuRows = db
          .prepare(
            `SELECT id, name, email, admission_number, phone, grade_label, stream_label, is_active, password_hash, payload_json
             FROM students WHERE school_id = ?`
          )
          .all(schoolId) as any[];

        for (const r of stuRows) {
          const cleanEmail = String(r.email || '').trim().toLowerCase();
          if (!cleanEmail || combinedByEmail.has(cleanEmail)) continue;
          const extra = parseJsonSafe(r.payload_json, {});
          const passInfo = resolvePasswordForRecord(
            ['students', 'users'],
            r.id,
            schoolId,
            cleanEmail,
            r.password_hash
          );
          combinedByEmail.set(cleanEmail, {
            id: r.id,
            name: r.name || 'Student',
            email: cleanEmail,
            password: passInfo.password,
            passwordStatus: passInfo.passwordStatus,
            role: 'student',
            roleLabel: 'Student',
            identifier: r.admission_number || '',
            admissionNumber: r.admission_number || '',
            staffNumber: '',
            tscNumber: '',
            phone: r.phone || '',
            grade: r.grade_label || extra.grade || '',
            stream: r.stream_label || extra.stream || '',
            designation: '',
            department: '',
            isActive: Boolean(r.is_active),
          });
        }

        // 4. Fallback from `student_parents`
        const parentRows = db
          .prepare(
            `SELECT id, name, email, phone, relationship, password_hash, payload_json
             FROM student_parents WHERE school_id = ?`
          )
          .all(schoolId) as any[];

        for (const r of parentRows) {
          const cleanEmail = String(r.email || '').trim().toLowerCase();
          if (!cleanEmail || combinedByEmail.has(cleanEmail)) continue;
          const passInfo = resolvePasswordForRecord(
            ['student_parents', 'users'],
            r.id,
            schoolId,
            cleanEmail,
            r.password_hash
          );
          combinedByEmail.set(cleanEmail, {
            id: r.id,
            name: r.name || 'Parent',
            email: cleanEmail,
            password: passInfo.password,
            passwordStatus: passInfo.passwordStatus,
            role: 'parent',
            roleLabel: 'Parent / Guardian',
            identifier: r.relationship || 'Parent',
            admissionNumber: '',
            staffNumber: '',
            tscNumber: '',
            phone: r.phone || '',
            grade: '',
            stream: '',
            designation: r.relationship || '',
            department: '',
            isActive: true,
          });
        }

        let users = Array.from(combinedByEmail.values());
        if (roleFilter && roleFilter !== 'all') {
          users = users.filter((u) => String(u.role || '').toLowerCase() === roleFilter);
        }
        if (statusFilter === 'active') {
          users = users.filter((u) => u.isActive);
        } else if (statusFilter === 'inactive') {
          users = users.filter((u) => !u.isActive);
        }

        users.sort((a, b) => {
          const roleCmp = String(a.role || '').localeCompare(String(b.role || ''));
          if (roleCmp !== 0) return roleCmp;
          return String(a.name || '').localeCompare(String(b.name || ''));
        });

        return {
          schoolId,
          schoolName: t.name,
          shortName: t.short_name || tenantExtra.shortName || t.name,
          code: t.code || tenantExtra.code || '',
          domain: t.domain || tenantExtra.domain || '',
          email: t.email || tenantExtra.email || '',
          motto: tenantExtra.motto || '',
          location: tenantExtra.location || '',
          primaryColor: tenantExtra.primaryColor || '#2563eb',
          logoUrl: tenantExtra.customLogoBase64 || tenantExtra.logoUrl || '',
          schoolAccount,
          totalUsers: users.length,
          users,
        };
      });

      writeSecurityAudit({
        schoolId: requestedSchoolId || 'all',
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'SUPER_ADMIN_PRINTABLE_CREDENTIALS',
        resource: '/api/users/printable-credentials',
        details: `Generated credential sheet for ${schools.length} school(s), role=${roleFilter}, status=${statusFilter}`,
      });

      return res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        generatedBy: session.user?.email || session.user?.name || 'Platform Super Admin',
        schools,
      });
    } catch (err: any) {
      console.error('Error in GET /api/users/printable-credentials:', err);
      return res.status(500).json({ error: 'Failed loading printable user credentials', message: err?.message });
    }
  });

  // 3. Create User Account (Super Admin: any school; Tenant Admin: strictly own school)
  app.post('/api/users', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!canManageUsers(session)) {
        return res.status(403).json({ error: 'Administrator privileges required to create user accounts.' });
      }

      const body = req.body?.user || req.body || {};
      const name = String(body.name || '').trim();
      const cleanEmail = String(body.email || '').trim().toLowerCase();
      const role = String(body.role || 'student').trim().toLowerCase();

      if (!name || !cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid full name and institutional email are required.' });
      }

      if (!session.isSuperAdmin && body.schoolId && String(body.schoolId) !== session.schoolId) {
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'CROSS_TENANT_USER_CREATE_BLOCKED',
          resource: 'POST /api/users',
          details: `Attempted schoolId=${body.schoolId}`,
        });
        return res.status(403).json({ error: 'Cross-tenant provisioning forbidden. You can only create accounts in your own school.' });
      }

      const schoolId = session.isSuperAdmin
        ? String(body.schoolId || session.schoolId || 'tenant-riara')
        : session.schoolId;

      const db = getDb();
      const tenantExists = db.prepare(`SELECT id FROM tenants WHERE id = ?`).get(schoolId);
      if (!tenantExists) {
        return res.status(404).json({ error: 'Selected tenant school does not exist.' });
      }

      const reservedAdmin = db
        .prepare(`SELECT id FROM platform_admins WHERE lower(email) = ?`)
        .get(cleanEmail);
      if (reservedAdmin) {
        return res.status(409).json({ error: 'This email is reserved for Platform Super Administrators.' });
      }

      const existingUser = db
        .prepare(`SELECT id, school_id FROM users WHERE lower(email) = ?`)
        .get(cleanEmail) as { id: string; school_id: string } | undefined;
      if (existingUser) {
        return res.status(409).json({ error: 'An institutional account with this email already exists.' });
      }

      if (!session.isSuperAdmin && role === 'admin' && !sessionHasRole(session, 'admin')) {
        return res.status(403).json({ error: 'Only a School Administrator or Super Admin can create administrator accounts.' });
      }

      const rawPassword = String(body.password || '').trim() || defaultPasswordForRole(role, body.grade);
      if (rawPassword.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters.' });
      }
      const passHash = isHashedPassword(rawPassword) ? rawPassword : hashPassword(rawPassword);

      const now = new Date().toISOString();
      const userId = String(body.id || `usr-${role}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`);
      const assignedRoles = normalizeAssignedRoles(role, body.assignedRoles, body.doubleAccessConfig);

      const cleanPayload: Record<string, any> = {
        ...body,
        id: userId,
        name,
        email: cleanEmail,
        role,
        assignedRoles,
        schoolId,
        isActive: body.isActive !== false,
        registeredAt: body.registeredAt || now,
        updatedAt: now,
      };
      delete cleanPayload.password;
      delete cleanPayload.passwordHash;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO users (id, email, name, role, school_id, admission_number, staff_number, tsc_number, password_hash, is_active, payload_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          userId,
          cleanEmail,
          name,
          role,
          schoolId,
          body.admissionNumber || null,
          body.staffNumber || null,
          body.tscNumber || null,
          passHash,
          cleanPayload.isActive ? 1 : 0,
          JSON.stringify(cleanPayload),
          now
        );

        if (!isHashedPassword(rawPassword)) {
          upsertCredentialVault(db, {
            sourceTable: 'users',
            recordId: userId,
            schoolId,
            email: cleanEmail,
            plaintextPassword: rawPassword,
          });
        }

        upsertCollectionRecord(db, 'edusmart_users_v1', userId, schoolId, cleanPayload, false);

        if (role === 'student') {
          const gradeLabel = body.grade ? `Grade ${body.grade}` : body.gradeLabel || '';
          const streamLabel = body.stream || body.streamLabel || '';
          db.prepare(
            `INSERT INTO students (id, school_id, grade_id, stream_id, name, email, password_hash, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, created_at, rights_json, payload_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name, email = excluded.email, password_hash = excluded.password_hash,
               admission_number = excluded.admission_number, phone = excluded.phone, grade_label = excluded.grade_label,
               stream_label = excluded.stream_label, is_active = excluded.is_active, payload_json = excluded.payload_json`
          ).run(
            userId,
            schoolId,
            String(body.gradeId || ''),
            String(body.streamId || ''),
            name,
            cleanEmail,
            passHash,
            body.admissionNumber || '',
            body.phone || '',
            body.upiNumber || '',
            gradeLabel,
            streamLabel,
            body.className || (gradeLabel && streamLabel ? `${gradeLabel} ${streamLabel}` : gradeLabel),
            cleanPayload.isActive ? 1 : 0,
            now,
            JSON.stringify(body.rights || {}),
            JSON.stringify(cleanPayload)
          );
          if (!isHashedPassword(rawPassword)) {
            upsertCredentialVault(db, {
              sourceTable: 'students',
              recordId: userId,
              schoolId,
              email: cleanEmail,
              plaintextPassword: rawPassword,
            });
          }
          upsertCollectionRecord(db, 'edusmart_students_v1', userId, schoolId, cleanPayload, false);
        } else if (role === 'parent') {
          const primaryStudentId = Array.isArray(body.childrenIds) && body.childrenIds[0] ? String(body.childrenIds[0]) : String(body.studentId || '');
          db.prepare(
            `INSERT INTO student_parents (id, school_id, student_id, name, email, password_hash, phone, relationship, created_at, payload_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name, email = excluded.email, password_hash = excluded.password_hash,
               phone = excluded.phone, relationship = excluded.relationship, payload_json = excluded.payload_json`
          ).run(
            userId,
            schoolId,
            primaryStudentId,
            name,
            cleanEmail,
            passHash,
            body.phone || '',
            body.relationship || 'Parent',
            now,
            JSON.stringify(cleanPayload)
          );
          if (!isHashedPassword(rawPassword)) {
            upsertCredentialVault(db, {
              sourceTable: 'student_parents',
              recordId: userId,
              schoolId,
              email: cleanEmail,
              plaintextPassword: rawPassword,
            });
          }
          upsertCollectionRecord(db, 'edusmart_student_parents_v1', userId, schoolId, cleanPayload, false);
        }

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      writeSecurityAudit({
        schoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'USER_CREATED',
        resource: 'POST /api/users',
        details: `Created ${role} account ${cleanEmail} (${userId})`,
      });
      notifyMySqlTablesChanged([
        'users',
        'students',
        'student_parents',
        'user_credential_vault',
        'collections_store',
        'security_audit_logs',
      ]);
      broadcastChange({
        type: 'record:created',
        collection: 'edusmart_users_v1',
        tenantId: schoolId,
        recordId: userId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({ success: true, user: stripSecrets(cleanPayload) });
    } catch (err: any) {
      console.error('Error in POST /api/users:', err);
      return res.status(500).json({ error: 'Failed to create user account', message: err?.message });
    }
  });

  // 4. Update User Details (Super Admin: any school; Tenant Admin: strictly own school)
  app.put('/api/users/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!canManageUsers(session)) {
        return res.status(403).json({ error: 'Administrator privileges required to edit user accounts.' });
      }

      const id = String(req.params.id || '').trim();
      const body = req.body?.user || req.body || {};
      const db = getDb();

      const existingRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
      const existingProv = !existingRow
        ? (db.prepare(`SELECT * FROM provisioned_accounts WHERE id = ?`).get(id) as any)
        : null;
      const existingStu = !existingRow && !existingProv
        ? (db.prepare(`SELECT * FROM students WHERE id = ?`).get(id) as any)
        : null;
      const existingParent = !existingRow && !existingProv && !existingStu
        ? (db.prepare(`SELECT * FROM student_parents WHERE id = ?`).get(id) as any)
        : null;

      const sourceRow = existingRow || existingProv || existingStu || existingParent;
      if (!sourceRow) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      const currentSchoolId = String(sourceRow.school_id || 'tenant-riara');
      if (!session.isSuperAdmin && currentSchoolId !== session.schoolId) {
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'CROSS_TENANT_USER_UPDATE_BLOCKED',
          resource: `PUT /api/users/${id}`,
          details: `Target schoolId=${currentSchoolId}`,
        });
        return res.status(403).json({ error: 'Cross-tenant edit forbidden. You can only manage users in your own school.' });
      }

      const currentExtra = parseJsonSafe(sourceRow.payload_json, {});
      const currentRole = String(sourceRow.role || currentExtra.role || (existingStu ? 'student' : existingParent ? 'parent' : 'student'));
      if (!session.isSuperAdmin && currentRole === 'admin' && !sessionHasRole(session, 'admin')) {
        return res.status(403).json({ error: 'Only a School Administrator or Super Admin can modify administrator accounts.' });
      }

      const nextSchoolId = session.isSuperAdmin && body.schoolId ? String(body.schoolId) : currentSchoolId;
      if (nextSchoolId !== currentSchoolId) {
        const destTenant = db.prepare(`SELECT id FROM tenants WHERE id = ?`).get(nextSchoolId);
        if (!destTenant) {
          return res.status(404).json({ error: 'Target tenant school not found.' });
        }
      }

      const nextEmail = String(body.email !== undefined ? body.email : sourceRow.email).trim().toLowerCase();
      if (!nextEmail || !nextEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const reservedAdmin = db.prepare(`SELECT id FROM platform_admins WHERE lower(email) = ?`).get(nextEmail);
      if (reservedAdmin) {
        return res.status(409).json({ error: 'This email is reserved for Platform Super Administrators.' });
      }

      const conflict = db
        .prepare(`SELECT id FROM users WHERE lower(email) = ? AND id != ?`)
        .get(nextEmail, id);
      if (conflict) {
        return res.status(409).json({ error: 'Another account already uses this email address.' });
      }

      const nextName = String(body.name !== undefined ? body.name : sourceRow.name || currentExtra.name || 'User').trim();
      const nextRole = String(body.role !== undefined ? body.role : currentRole).trim().toLowerCase();
      const rawAdditionalRoles =
        body.assignedRoles !== undefined ? body.assignedRoles : currentExtra.assignedRoles;
      const nextDoubleAccess =
        body.doubleAccessConfig !== undefined ? body.doubleAccessConfig : currentExtra.doubleAccessConfig;
      const assignedRoles = normalizeAssignedRoles(nextRole, rawAdditionalRoles, nextDoubleAccess);
      const nextIsActive = body.isActive !== undefined ? Boolean(body.isActive) : (sourceRow.is_active !== undefined ? Boolean(sourceRow.is_active) : true);
      const nextPassPlain = body.password && String(body.password).trim().length > 0 ? String(body.password).trim() : '';
      if (nextPassPlain && nextPassPlain.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters.' });
      }
      const nextPassHash = nextPassPlain
        ? isHashedPassword(nextPassPlain)
          ? nextPassPlain
          : hashPassword(nextPassPlain)
        : sourceRow.password_hash || hashPassword(defaultPasswordForRole(nextRole));

      const now = new Date().toISOString();
      const updatedPayload: Record<string, any> = {
        ...currentExtra,
        ...body,
        id,
        name: nextName,
        email: nextEmail,
        role: nextRole,
        assignedRoles,
        schoolId: nextSchoolId,
        isActive: nextIsActive,
        updatedAt: now,
      };
      delete updatedPayload.password;
      delete updatedPayload.passwordHash;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO users (id, email, name, role, school_id, admission_number, staff_number, tsc_number, password_hash, is_active, payload_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             email = excluded.email,
             name = excluded.name,
             role = excluded.role,
             school_id = excluded.school_id,
             admission_number = excluded.admission_number,
             staff_number = excluded.staff_number,
             tsc_number = excluded.tsc_number,
             password_hash = excluded.password_hash,
             is_active = excluded.is_active,
             payload_json = excluded.payload_json,
             updated_at = excluded.updated_at`
        ).run(
          id,
          nextEmail,
          nextName,
          nextRole,
          nextSchoolId,
          updatedPayload.admissionNumber || null,
          updatedPayload.staffNumber || null,
          updatedPayload.tscNumber || null,
          nextPassHash,
          nextIsActive ? 1 : 0,
          JSON.stringify(updatedPayload),
          now
        );

        db.prepare(
          `UPDATE provisioned_accounts
           SET school_id = ?, name = ?, email = ?, role = ?, password_hash = ?, admission_number = ?, staff_number = ?, phone = ?, grade = ?, stream = ?, is_active = ?, payload_json = ?
           WHERE id = ?`
        ).run(
          nextSchoolId,
          nextName,
          nextEmail,
          nextRole,
          nextPassHash,
          updatedPayload.admissionNumber || null,
          updatedPayload.staffNumber || null,
          updatedPayload.phone || null,
          updatedPayload.grade ?? null,
          updatedPayload.stream || null,
          nextIsActive ? 1 : 0,
          JSON.stringify(updatedPayload),
          id
        );

        db.prepare(
          `UPDATE students
           SET school_id = ?, name = ?, email = ?, password_hash = ?, admission_number = ?, phone = ?, grade_label = ?, stream_label = ?, is_active = ?, payload_json = ?
           WHERE id = ?`
        ).run(
          nextSchoolId,
          nextName,
          nextEmail,
          nextPassHash,
          updatedPayload.admissionNumber || '',
          updatedPayload.phone || '',
          updatedPayload.grade ? `Grade ${updatedPayload.grade}` : updatedPayload.gradeLabel || '',
          updatedPayload.stream || updatedPayload.streamLabel || '',
          nextIsActive ? 1 : 0,
          JSON.stringify(updatedPayload),
          id
        );

        db.prepare(
          `UPDATE student_parents
           SET school_id = ?, name = ?, email = ?, password_hash = ?, phone = ?, payload_json = ?
           WHERE id = ?`
        ).run(
          nextSchoolId,
          nextName,
          nextEmail,
          nextPassHash,
          updatedPayload.phone || '',
          JSON.stringify(updatedPayload),
          id
        );

        if (nextPassPlain && !isHashedPassword(nextPassPlain)) {
          upsertCredentialVault(db, {
            sourceTable: 'users',
            recordId: id,
            schoolId: nextSchoolId,
            email: nextEmail,
            plaintextPassword: nextPassPlain,
          });
        } else {
          db.prepare(
            `UPDATE user_credential_vault SET school_id = ?, email = ?, updated_at = ? WHERE record_id = ?`
          ).run(nextSchoolId, nextEmail, now, id);
        }

        upsertCollectionRecord(db, 'edusmart_users_v1', id, nextSchoolId, updatedPayload, false);

        if (!nextIsActive) {
          db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?`).run(id);
        } else {
          db.prepare(
            `UPDATE auth_sessions
             SET user_role = ?, school_id = ?, user_json = ?
             WHERE user_id = ? AND access_scope = 'tenant'`
          ).run(nextRole, nextSchoolId, JSON.stringify(stripSecrets(updatedPayload)), id);
        }

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      writeSecurityAudit({
        schoolId: nextSchoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'USER_UPDATED',
        resource: `PUT /api/users/${id}`,
        details: `Updated ${nextEmail} (role=${nextRole}, active=${nextIsActive})`,
      });
      notifyMySqlTablesChanged([
        'users',
        'provisioned_accounts',
        'students',
        'student_parents',
        'user_credential_vault',
        'auth_sessions',
        'collections_store',
        'security_audit_logs',
      ]);
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_users_v1',
        tenantId: nextSchoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, user: stripSecrets(updatedPayload) });
    } catch (err: any) {
      console.error('Error in PUT /api/users/:id:', err);
      return res.status(500).json({ error: 'Failed to update user account', message: err?.message });
    }
  });

  // 5. Reset User Password (Super Admin: any user; Tenant Admin: strictly own school users)
  app.post('/api/users/:id/reset-password', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!canManageUsers(session)) {
        return res.status(403).json({ error: 'Administrator privileges required to reset user passwords.' });
      }

      const id = String(req.params.id || '').trim();
      const rawPassword = String(req.body?.newPassword || req.body?.password || '').trim();
      if (!rawPassword || rawPassword.length < 4) {
        return res.status(400).json({ error: 'A new password of at least 4 characters is required.' });
      }

      const db = getDb();
      const target =
        (db.prepare(`SELECT id, school_id, email, role, payload_json FROM users WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, role, payload_json FROM provisioned_accounts WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, 'student' as role, payload_json FROM students WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, 'parent' as role, payload_json FROM student_parents WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, 'admin' as role, '{}' as payload_json FROM school_accounts WHERE id = ?`).get(id) as any);

      if (!target) {
        return res.status(404).json({ error: 'Target user account not found.' });
      }

      const targetSchoolId = String(target.school_id || 'tenant-riara');
      if (!session.isSuperAdmin && targetSchoolId !== session.schoolId) {
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'CROSS_TENANT_PASSWORD_RESET_BLOCKED',
          resource: `POST /api/users/${id}/reset-password`,
          details: `Target schoolId=${targetSchoolId}`,
        });
        return res.status(403).json({ error: 'Cross-tenant password reset forbidden.' });
      }

      if (!session.isSuperAdmin && target.role === 'admin' && !sessionHasRole(session, 'admin')) {
        return res.status(403).json({ error: 'Only a School Administrator or Super Admin can reset an admin password.' });
      }

      const cleanEmail = String(target.email || '').trim().toLowerCase();
      const nextHash = hashPassword(rawPassword);
      const now = new Date().toISOString();

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? OR (lower(email) = ? AND school_id = ?)`).run(
          nextHash,
          now,
          id,
          cleanEmail,
          targetSchoolId
        );
        db.prepare(`UPDATE students SET password_hash = ? WHERE id = ? OR (lower(email) = ? AND school_id = ?)`).run(
          nextHash,
          id,
          cleanEmail,
          targetSchoolId
        );
        db.prepare(`UPDATE student_parents SET password_hash = ? WHERE id = ? OR (lower(email) = ? AND school_id = ?)`).run(
          nextHash,
          id,
          cleanEmail,
          targetSchoolId
        );
        db.prepare(`UPDATE provisioned_accounts SET password_hash = ? WHERE id = ? OR (lower(email) = ? AND school_id = ?)`).run(
          nextHash,
          id,
          cleanEmail,
          targetSchoolId
        );
        db.prepare(`UPDATE school_accounts SET password_hash = ?, updated_at = ? WHERE id = ? OR (lower(email) = ? AND school_id = ?)`).run(
          nextHash,
          now,
          id,
          cleanEmail,
          targetSchoolId
        );

        // Update vault across matching source tables for clean printing
        const tablesToCheck: Array<{
          table: 'users' | 'students' | 'student_parents' | 'provisioned_accounts' | 'school_accounts';
          existsSql: string;
        }> = [
          { table: 'users', existsSql: `SELECT id FROM users WHERE id = ?` },
          { table: 'students', existsSql: `SELECT id FROM students WHERE id = ?` },
          { table: 'student_parents', existsSql: `SELECT id FROM student_parents WHERE id = ?` },
          { table: 'provisioned_accounts', existsSql: `SELECT id FROM provisioned_accounts WHERE id = ?` },
          { table: 'school_accounts', existsSql: `SELECT id FROM school_accounts WHERE id = ?` },
        ];
        let vaultStored = false;
        for (const t of tablesToCheck) {
          const hit = db.prepare(t.existsSql).get(id);
          if (hit) {
            upsertCredentialVault(db, {
              sourceTable: t.table,
              recordId: id,
              schoolId: targetSchoolId,
              email: cleanEmail,
              plaintextPassword: rawPassword,
            });
            vaultStored = true;
          }
        }
        if (!vaultStored) {
          upsertCredentialVault(db, {
            sourceTable: 'users',
            recordId: id,
            schoolId: targetSchoolId,
            email: cleanEmail,
            plaintextPassword: rawPassword,
          });
        }

        // Invalidate existing sessions of target user (except actor's own session)
        db.prepare(`DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?`).run(
          id,
          session.tokenHash
        );

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      writeSecurityAudit({
        schoolId: targetSchoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'PASSWORD_RESET_BY_ADMIN',
        resource: `POST /api/users/${id}/reset-password`,
        details: `Password reset for ${cleanEmail} (${id})`,
      });
      notifyMySqlTablesChanged([
        'users',
        'students',
        'student_parents',
        'provisioned_accounts',
        'school_accounts',
        'user_credential_vault',
        'auth_sessions',
        'security_audit_logs',
      ]);
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_users_v1',
        tenantId: targetSchoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        userId: id,
        schoolId: targetSchoolId,
        email: cleanEmail,
        timestamp: now,
      });
    } catch (err: any) {
      console.error('Error in POST /api/users/:id/reset-password:', err);
      return res.status(500).json({ error: 'Failed to reset user password', message: err?.message });
    }
  });

  // 6. Delete User Account (Super Admin: any user; Tenant Admin: strictly own school)
  app.delete('/api/users/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!canManageUsers(session)) {
        return res.status(403).json({ error: 'Administrator privileges required to remove user accounts.' });
      }

      const id = String(req.params.id || '').trim();
      if (id === session.userId) {
        return res.status(400).json({ error: 'You cannot delete your own active account while signed in.' });
      }

      const db = getDb();
      const platformAdmin = db.prepare(`SELECT id FROM platform_admins WHERE id = ?`).get(id);
      if (platformAdmin) {
        return res.status(403).json({ error: 'Platform Super Admin accounts cannot be deleted through tenant user deletion.' });
      }

      const target =
        (db.prepare(`SELECT id, school_id, email, role FROM users WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, role FROM provisioned_accounts WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, 'student' as role FROM students WHERE id = ?`).get(id) as any) ||
        (db.prepare(`SELECT id, school_id, email, 'parent' as role FROM student_parents WHERE id = ?`).get(id) as any);

      if (!target) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      const targetSchoolId = String(target.school_id || 'tenant-riara');
      if (!session.isSuperAdmin && targetSchoolId !== session.schoolId) {
        writeSecurityAudit({
          schoolId: session.schoolId,
          userId: session.userId,
          userEmail: session.user?.email,
          action: 'CROSS_TENANT_USER_DELETE_BLOCKED',
          resource: `DELETE /api/users/${id}`,
          details: `Target schoolId=${targetSchoolId}`,
        });
        return res.status(403).json({ error: 'Cross-tenant deletion forbidden.' });
      }

      if (!session.isSuperAdmin && target.role === 'admin' && !sessionHasRole(session, 'admin')) {
        return res.status(403).json({ error: 'Only a School Administrator or Super Admin can remove an admin account.' });
      }

      const now = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
        db.prepare(`DELETE FROM provisioned_accounts WHERE id = ?`).run(id);
        db.prepare(`DELETE FROM students WHERE id = ?`).run(id);
        db.prepare(`DELETE FROM student_parents WHERE id = ?`).run(id);
        deleteCredentialVault(db, id);
        db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?`).run(id);

        softDeleteCollectionRecord(db, 'edusmart_users_v1', id, now);
        softDeleteCollectionRecord(db, 'edusmart_provisioned_accounts_v1', id, now);
        softDeleteCollectionRecord(db, 'edusmart_students_v1', id, now);
        softDeleteCollectionRecord(db, 'edusmart_student_parents_v1', id, now);
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      writeSecurityAudit({
        schoolId: targetSchoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'USER_DELETED',
        resource: `DELETE /api/users/${id}`,
        details: `Removed ${target.email} (${id})`,
      });
      notifyMySqlTablesChanged([
        'users',
        'provisioned_accounts',
        'students',
        'student_parents',
        'user_credential_vault',
        'auth_sessions',
        'collections_store',
        'security_audit_logs',
      ]);
      broadcastChange({
        type: 'record:deleted',
        collection: 'edusmart_users_v1',
        tenantId: targetSchoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, deletedId: id, schoolId: targetSchoolId });
    } catch (err: any) {
      console.error('Error in DELETE /api/users/:id:', err);
      return res.status(500).json({ error: 'Failed to delete user account', message: err?.message });
    }
  });
}
