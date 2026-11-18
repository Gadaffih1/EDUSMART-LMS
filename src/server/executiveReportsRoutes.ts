import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getDb, notifyMySqlTablesChanged, stripSecrets, writeSecurityAudit } from './db.ts';
import { AuthSession, requireAuth } from './authRoutes.ts';
import { upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';

const VALID_CATEGORIES = new Set([
  'bom_report',
  'academic_report',
  'department_review',
  'discipline_safety',
  'finance_operations',
  'parent_briefing',
  'general_report',
]);

const VALID_TARGET_TYPES = new Set([
  'bom',
  'teachers',
  'departments',
  'parents',
  'individual',
  'group',
]);

const TEACHING_ROLES = new Set([
  'teacher',
  'class_teacher',
  'hod',
  'head_of_department',
  'senior_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
  'librarian',
]);

const BOM_ROLES = new Set(['admin', 'head_teacher', 'deputy_head', 'finance_officer']);

const DEFAULT_DEPARTMENTS: Array<{
  name: string;
  kind: 'teaching' | 'non_teaching';
  subjects: string[];
  activities: string[];
}> = [
  {
    name: 'Mathematics & Computational Sciences',
    kind: 'teaching',
    subjects: ['Mathematics', 'Computer Studies'],
    activities: [],
  },
  {
    name: 'Pure & Integrated Sciences',
    kind: 'teaching',
    subjects: ['Integrated Science', 'Agriculture and Nutrition', 'Agriculture'],
    activities: [],
  },
  {
    name: 'Technical & Applied Sciences',
    kind: 'teaching',
    subjects: ['Pretechnical Education', 'Pre-Technical Studies', 'Business Studies'],
    activities: [],
  },
  {
    name: 'Languages & Literature',
    kind: 'teaching',
    subjects: ['English', 'Kiswahili'],
    activities: [],
  },
  {
    name: 'Pretechnical & Creative Arts',
    kind: 'teaching',
    subjects: ['Creative Arts', 'Pretechnical Education', 'Physical and Health Education'],
    activities: [],
  },
  {
    name: 'Humanities & Social Sciences',
    kind: 'teaching',
    subjects: ['Social Studies', 'Religious Education'],
    activities: [],
  },
  {
    name: 'Transport & Fleet',
    kind: 'non_teaching',
    subjects: [],
    activities: ['Route driving', 'Student boarding and alighting', 'Vehicle inspection', 'Fleet fuel and logbook'],
  },
];

export const BUILT_IN_COHORT_GROUPS = [
  {
    id: 'cohort:slt',
    name: 'Senior Leadership Team (SLT)',
    description: 'Head Teacher, Deputy Head, Dean of Studies, Curriculum Coordinator & School Admin',
    memberRoles: ['head_teacher', 'deputy_head', 'dean_of_studies', 'curriculum_coordinator', 'admin'],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:all_teachers',
    name: 'All Academic & Teaching Staff',
    description: 'All Teachers, Class Teachers, Senior Teachers, HODs, Deans & Librarian',
    memberRoles: Array.from(TEACHING_ROLES),
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:class_teachers',
    name: 'Class Teachers & Senior Mentors',
    description: 'All Class Teachers and Senior Teachers across Grades 1–9',
    memberRoles: ['class_teacher', 'senior_teacher'],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:hods',
    name: 'Heads of Department (HODs)',
    description: 'All Departmental Leads & Curriculum Coordinators',
    memberRoles: ['hod', 'head_of_department', 'curriculum_coordinator', 'dean_of_studies'],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:parents',
    name: 'Parents & Guardians Council',
    description: 'All verified parents and guardians across the school',
    memberRoles: ['parent'],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:support_ops',
    name: 'Operations, Finance & Welfare Staff',
    description: 'Finance, Procurement, Stores, HR, Admin Staff, Nurse, Transport & Co-Curricular Teams',
    memberRoles: [
      'finance_officer',
      'procurement_officer',
      'storekeeper',
      'hr_manager',
      'hr_officer',
      'school_admin_staff',
      'nurse',
      'transport_team',
      'cocurricular_team',
    ],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
  {
    id: 'cohort:students',
    name: 'All Enrolled Learners (Grades 1–9)',
    description: 'All active learners across Primary & Junior School',
    memberRoles: ['student'],
    memberUserIds: [] as string[],
    isBuiltIn: true,
  },
];

function parseJsonSafe<T = any>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function canManageExecutiveReports(session: AuthSession): boolean {
  return (
    session.isSuperAdmin ||
    session.role === 'head_teacher' ||
    session.role === 'admin'
  );
}

function resolveTenantScope(req: Request, res: Response, requestedSchoolId?: string | null): string | null {
  const session = req.authSession!;
  const cleanRequested = String(requestedSchoolId || '').trim();
  if (session.isSuperAdmin) {
    return cleanRequested || session.schoolId || 'tenant-riara';
  }
  if (cleanRequested && cleanRequested !== session.schoolId) {
    res.status(403).json({
      error: 'Cross-tenant access blocked. You can only manage or view reports for your own school.',
    });
    return null;
  }
  return session.schoolId;
}

function ensureDefaultDepartmentsForSchool(db: ReturnType<typeof getDb>, schoolId: string) {
  const existing = db
    .prepare(`SELECT * FROM school_departments WHERE school_id = ? ORDER BY name ASC`)
    .all(schoolId) as any[];
  if (existing.length > 0) {
    return existing.map((d) => ({
      id: d.id,
      schoolId: d.school_id,
      name: d.name,
      kind: d.kind || 'teaching',
      subjects: parseJsonSafe<string[]>(d.subjects_json, []),
      activities: parseJsonSafe<string[]>(d.activities_json, []),
      createdAt: d.created_at,
    }));
  }

  const now = new Date().toISOString();
  const seeded: any[] = [];
  for (let i = 0; i < DEFAULT_DEPARTMENTS.length; i++) {
    const def = DEFAULT_DEPARTMENTS[i];
    const id = def.kind === 'non_teaching' ? `dept-${schoolId}-transport` : `dept-${schoolId}-${i + 1}`;
    db.prepare(
      `INSERT OR IGNORE INTO school_departments (id, school_id, name, kind, subjects_json, activities_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, schoolId, def.name, def.kind, JSON.stringify(def.subjects), JSON.stringify(def.activities), now);
    seeded.push({
      id,
      schoolId,
      name: def.name,
      kind: def.kind,
      subjects: def.subjects,
      activities: def.activities,
      createdAt: now,
    });
  }
  return seeded.sort((a, b) => a.name.localeCompare(b.name));
}

export function ensureDefaultExecutiveReportsForTenant(db: ReturnType<typeof getDb>, schoolId: string): void {
  const metaKey = `seeded_exec_bom_report:${schoolId}`;
  const alreadySeeded = db.prepare(`SELECT value FROM migration_meta WHERE key = ?`).get(metaKey);
  if (alreadySeeded) return;

  const existingCount = db
    .prepare(`SELECT COUNT(*) as cnt FROM executive_reports WHERE school_id = ? AND deleted_at IS NULL`)
    .get(schoolId) as { cnt: number };

  const now = new Date().toISOString();
  if ((existingCount?.cnt || 0) === 0) {
    const htUser = db
      .prepare(
        `SELECT id, name FROM users WHERE school_id = ? AND role = 'head_teacher' AND is_active = 1 LIMIT 1`
      )
      .get(schoolId) as { id: string; name: string } | undefined;

    const headName = htUser?.name || 'Dr. Arthur Mwangi';
    const reportId = `exec-bom-${schoolId}-term3-2026`;
    const sections = [
      {
        id: 'sec-1',
        heading: 'Institutional Status & Enrollment',
        body: 'The institution has maintained stable operational efficiency across both Primary (Grades 1 to 6) and Junior School (Grades 7 to 9) cohorts, with full capacity utilized across 15 recognized streams. Total student headcount stands at optimal teacher-to-learner ratios conforming to Ministry of Education guidelines.',
      },
      {
        id: 'sec-2',
        heading: 'Competency-Based Curriculum (CBC) Transition',
        body: 'Curriculum progression for all 8 Primary learning areas and 9 Junior School learning areas exceeds 92% completion. Preparations for Grade 6 KPSEA national assessment simulations are fully on schedule under the Dean of Studies and Head of Department supervision.',
      },
      {
        id: 'sec-3',
        heading: 'Campus Safety, Discipline & Gate Pass Protocol',
        body: 'Implementation of the digital Student Gate Exit Pass system has eliminated unauthorized campus exits. Zero security breaches were recorded this academic term. Learner discipline cases have been handled restoratively through the Deputy Head Teacher and Senior Teacher mentorship initiatives.',
      },
    ];

    db.prepare(
      `INSERT INTO executive_reports
         (id, school_id, title, category, classification, reporting_period, term, academic_year,
          summary, sections_json, certified_by, directorate_label, status,
          created_by_id, created_by_name, updated_by_id, updated_by_name, created_at, updated_at)
       VALUES (?, ?, ?, 'bom_report', 'CONFIDENTIAL EXECUTIVE BRIEFING', ?, 'Term 3', '2026',
               ?, ?, ?, 'EduSmart Governance Directorate', 'published', ?, ?, ?, ?, ?, ?)`
    ).run(
      reportId,
      schoolId,
      'Board of Management (BOM) Termly Report',
      'Term 3 · Academic Year 2026',
      'Comprehensive termly briefing covering institutional capacity, CBC syllabus progression, and campus welfare & gate pass compliance.',
      JSON.stringify(sections),
      `Certified by: ${headName}, Head Teacher`,
      htUser?.id || 'system-seed',
      headName,
      htUser?.id || 'system-seed',
      headName,
      now,
      now
    );

    db.prepare(
      `INSERT INTO executive_report_shares
         (id, report_id, school_id, target_type, target_id, target_label, target_meta_json, shared_by_id, shared_by_name, shared_note, created_at)
       VALUES (?, ?, ?, 'bom', 'bom_board', 'Board of Management (BoM)', ?, ?, ?, ?, ?)`
    ).run(
      `shr-${reportId}-bom`,
      reportId,
      schoolId,
      JSON.stringify({ boardScope: 'full_bom' }),
      htUser?.id || 'system-seed',
      headName,
      'Default BoM governance distribution',
      now
    );
  }

  db.prepare(`INSERT OR IGNORE INTO migration_meta (key, value, applied_at) VALUES (?, '1', ?)`).run(
    metaKey,
    now
  );
}

function hydrateReportRow(row: any, shareRows: any[]) {
  return {
    id: row.id,
    schoolId: row.school_id,
    title: row.title,
    category: row.category || 'bom_report',
    classification: row.classification || 'CONFIDENTIAL EXECUTIVE BRIEFING',
    reportingPeriod: row.reporting_period,
    term: row.term || '',
    academicYear: row.academic_year || '2026',
    summary: row.summary || '',
    sections: parseJsonSafe<Array<{ id: string; heading: string; body: string }>>(row.sections_json, []),
    certifiedBy: row.certified_by,
    directorateLabel: row.directorate_label || 'EduSmart Governance Directorate',
    status: row.status === 'draft' ? 'draft' : 'published',
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    updatedById: row.updated_by_id || row.created_by_id,
    updatedByName: row.updated_by_name || row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shares: shareRows.map((s) => ({
      id: s.id,
      reportId: s.report_id,
      schoolId: s.school_id,
      targetType: s.target_type,
      targetId: s.target_id,
      targetLabel: s.target_label,
      targetMeta: parseJsonSafe(s.target_meta_json, {}),
      sharedById: s.shared_by_id,
      sharedByName: s.shared_by_name,
      sharedNote: s.shared_note || '',
      createdAt: s.created_at,
    })),
  };
}

function listSchoolAudienceUsers(db: ReturnType<typeof getDb>, schoolId: string) {
  const result = new Map<string, any>();

  const userRows = db
    .prepare(`SELECT * FROM users WHERE school_id = ? AND is_active = 1 ORDER BY name ASC`)
    .all(schoolId) as any[];
  for (const r of userRows) {
    const extra = parseJsonSafe<Record<string, any>>(r.payload_json, {});
    result.set(
      r.id,
      stripSecrets({
        ...extra,
        id: r.id,
        name: r.name || extra.name || 'User',
        email: String(r.email || extra.email || '').toLowerCase(),
        role: r.role || extra.role || 'teacher',
        schoolId: r.school_id,
        department: extra.department || '',
        designation: extra.designation || '',
        grade: extra.grade,
        stream: extra.stream,
        assignedSubjects: Array.isArray(extra.assignedSubjects) ? extra.assignedSubjects : [],
        childrenIds: Array.isArray(extra.childrenIds) ? extra.childrenIds : [],
        rights: Array.isArray(extra.rights) ? extra.rights : [],
      })
    );
  }

  const studentRows = db
    .prepare(`SELECT * FROM students WHERE school_id = ? AND is_active = 1 ORDER BY name ASC`)
    .all(schoolId) as any[];
  for (const r of studentRows) {
    if (result.has(r.id)) continue;
    const extra = parseJsonSafe<Record<string, any>>(r.payload_json, {});
    const gradeMatch = String(r.grade_label || '').match(/\d+/);
    result.set(
      r.id,
      stripSecrets({
        ...extra,
        id: r.id,
        name: r.name,
        email: String(r.email || '').toLowerCase(),
        role: 'student',
        schoolId: r.school_id,
        grade: extra.grade || (gradeMatch ? Number(gradeMatch[0]) : undefined),
        stream: r.stream_label || extra.stream || '',
      })
    );
  }

  const parentRows = db
    .prepare(`SELECT * FROM student_parents WHERE school_id = ? ORDER BY name ASC`)
    .all(schoolId) as any[];
  for (const r of parentRows) {
    const existing = result.get(r.id);
    if (existing) {
      const cids = new Set<string>(existing.childrenIds || []);
      if (r.student_id) cids.add(r.student_id);
      existing.childrenIds = Array.from(cids);
      continue;
    }
    const extra = parseJsonSafe<Record<string, any>>(r.payload_json, {});
    result.set(
      r.id,
      stripSecrets({
        ...extra,
        id: r.id,
        name: r.name,
        email: String(r.email || '').toLowerCase(),
        role: 'parent',
        schoolId: r.school_id,
        childrenIds: r.student_id ? [r.student_id] : extra.childrenIds || [],
      })
    );
  }

  // Enrich parent users with child grades for Grade-scoped Parent sharing
  const studentGradeById = new Map<string, number>();
  for (const u of result.values()) {
    if (u.role === 'student' && u.grade) {
      studentGradeById.set(u.id, Number(u.grade));
    }
  }
  for (const u of result.values()) {
    if (u.role === 'parent') {
      const grades = new Set<number>();
      for (const cid of u.childrenIds || []) {
        const g = studentGradeById.get(cid);
        if (g) grades.add(g);
      }
      u.childrenGrades = Array.from(grades).sort((a, b) => a - b);
    }
  }

  return Array.from(result.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function getUserMatchDetailsForReport(
  session: AuthSession,
  reportShares: any[],
  customGroupsMap: Map<string, { name: string; memberUserIds: string[]; memberRoles: string[] }>,
  departmentsMap: Map<string, { name: string; subjects: string[] }>,
  currentUserRecord: any
): string[] {
  const reasons: string[] = [];
  const userId = session.userId;
  const userRole = session.role;
  const userDept = String(currentUserRecord?.department || session.user?.department || '').trim().toLowerCase();
  const userSubjects: string[] = Array.isArray(currentUserRecord?.assignedSubjects)
    ? currentUserRecord.assignedSubjects
    : Array.isArray(session.user?.assignedSubjects)
    ? session.user.assignedSubjects
    : [];
  const userDesignation = String(currentUserRecord?.designation || session.user?.designation || '').toLowerCase();
  const childGrades: number[] = Array.isArray(currentUserRecord?.childrenGrades)
    ? currentUserRecord.childrenGrades
    : [];

  for (const share of reportShares) {
    const meta = share.targetMeta || {};
    const targetId = String(share.targetId || '');

    if (share.targetType === 'bom') {
      const memberIds: string[] = Array.isArray(meta.memberUserIds) ? meta.memberUserIds : [];
      if (
        session.isSuperAdmin ||
        BOM_ROLES.has(userRole) ||
        userDesignation.includes('bom') ||
        userDesignation.includes('board') ||
        memberIds.includes(userId)
      ) {
        reasons.push(share.targetLabel || 'Board of Management (BoM)');
      }
    } else if (share.targetType === 'teachers') {
      const userIds: string[] = Array.isArray(meta.userIds) ? meta.userIds : [];
      if (targetId === 'all' && TEACHING_ROLES.has(userRole)) {
        reasons.push(share.targetLabel || 'All Teachers');
      } else if (targetId.startsWith('role:') && targetId.slice(5) === userRole) {
        reasons.push(share.targetLabel || `Teachers (${userRole})`);
      } else if (targetId === userId || userIds.includes(userId)) {
        reasons.push(share.targetLabel || 'Selected Teacher');
      }
    } else if (share.targetType === 'departments') {
      const deptKey = String(meta.departmentName || targetId || '').trim().toLowerCase();
      const deptObj = departmentsMap.get(deptKey) || departmentsMap.get(targetId.toLowerCase());
      const deptSubjects = (deptObj?.subjects || []).map((s) => s.toLowerCase());
      const matchesDeptName = Boolean(userDept && deptKey && (userDept === deptKey || userDept.includes(deptKey) || deptKey.includes(userDept)));
      const matchesDeptSubject =
        TEACHING_ROLES.has(userRole) &&
        deptSubjects.length > 0 &&
        userSubjects.some((sub) => deptSubjects.includes(String(sub).toLowerCase()));
      if (matchesDeptName || matchesDeptSubject) {
        reasons.push(share.targetLabel || `Department: ${deptObj?.name || targetId}`);
      }
    } else if (share.targetType === 'parents') {
      const userIds: string[] = Array.isArray(meta.userIds) ? meta.userIds : [];
      if (targetId === 'all' && userRole === 'parent') {
        reasons.push(share.targetLabel || 'All Parents');
      } else if (targetId.startsWith('grade:') && userRole === 'parent') {
        const g = Number(targetId.slice(6));
        if (childGrades.includes(g)) {
          reasons.push(share.targetLabel || `Grade ${g} Parents`);
        }
      } else if (targetId === userId || userIds.includes(userId)) {
        reasons.push(share.targetLabel || 'Parent Briefing');
      }
    } else if (share.targetType === 'individual') {
      const userIds: string[] = Array.isArray(meta.userIds) ? meta.userIds : [];
      if (targetId === userId || userIds.includes(userId)) {
        reasons.push('Shared directly with you');
      }
    } else if (share.targetType === 'group') {
      const builtIn = BUILT_IN_COHORT_GROUPS.find((g) => g.id === targetId);
      if (builtIn) {
        if (builtIn.memberRoles.includes(userRole) || builtIn.memberUserIds.includes(userId)) {
          reasons.push(share.targetLabel || `Group: ${builtIn.name}`);
        }
      } else {
        const customGroup = customGroupsMap.get(targetId);
        if (
          customGroup &&
          (customGroup.memberUserIds.includes(userId) || customGroup.memberRoles.includes(userRole))
        ) {
          reasons.push(share.targetLabel || `Group: ${customGroup.name}`);
        }
      }
    }
  }

  return Array.from(new Set(reasons));
}

function replaceSharesForReport(
  db: ReturnType<typeof getDb>,
  params: {
    reportId: string;
    schoolId: string;
    shares: any[];
    sharedById: string;
    sharedByName: string;
    sharedNote?: string;
    now: string;
  }
) {
  db.prepare(`DELETE FROM executive_report_shares WHERE report_id = ? AND school_id = ?`).run(
    params.reportId,
    params.schoolId
  );

  const insertedShares: any[] = [];
  for (const item of params.shares) {
    const targetType = String(item?.targetType || '').trim();
    const targetId = String(item?.targetId || '').trim();
    const targetLabel = String(item?.targetLabel || targetId || targetType).trim();
    if (!VALID_TARGET_TYPES.has(targetType) || !targetId) continue;
    const shareId = `shr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const targetMeta = item?.targetMeta && typeof item.targetMeta === 'object' ? item.targetMeta : {};
    db.prepare(
      `INSERT INTO executive_report_shares
         (id, report_id, school_id, target_type, target_id, target_label, target_meta_json, shared_by_id, shared_by_name, shared_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      shareId,
      params.reportId,
      params.schoolId,
      targetType,
      targetId,
      targetLabel,
      JSON.stringify(targetMeta),
      params.sharedById,
      params.sharedByName,
      String(item?.sharedNote || params.sharedNote || '').trim(),
      params.now
    );
    insertedShares.push({
      id: shareId,
      reportId: params.reportId,
      schoolId: params.schoolId,
      targetType,
      targetId,
      targetLabel,
      targetMeta,
      sharedById: params.sharedById,
      sharedByName: params.sharedByName,
      sharedNote: String(item?.sharedNote || params.sharedNote || '').trim(),
      createdAt: params.now,
    });
  }
  return insertedShares;
}

function dispatchShareNotifications(
  db: ReturnType<typeof getDb>,
  params: {
    schoolId: string;
    reportTitle: string;
    reportingPeriod: string;
    sharedByName: string;
    shares: any[];
    sharedNote?: string;
    now: string;
  }
) {
  if (!params.shares || params.shares.length === 0) return;

  const audienceUsers = listSchoolAudienceUsers(db, params.schoolId);
  const departments = ensureDefaultDepartmentsForSchool(db, params.schoolId);
  const deptSubjectsMap = new Map<string, string[]>();
  for (const d of departments) {
    deptSubjectsMap.set(d.name.toLowerCase(), (d.subjects || []).map((s: string) => s.toLowerCase()));
  }

  const customGroupRows = db
    .prepare(`SELECT * FROM executive_report_groups WHERE school_id = ? AND deleted_at IS NULL`)
    .all(params.schoolId) as any[];
  const customGroupsMap = new Map<string, { memberUserIds: string[]; memberRoles: string[] }>();
  for (const g of customGroupRows) {
    customGroupsMap.set(g.id, {
      memberUserIds: parseJsonSafe<string[]>(g.member_user_ids_json, []),
      memberRoles: parseJsonSafe<string[]>(g.member_roles_json, []),
    });
  }

  const targetUserIds = new Set<string>();
  const targetRoles = new Set<string>();
  const targetDepartments = new Set<string>();
  let targetGrade: number | undefined = undefined;

  for (const share of params.shares) {
    const meta = share.targetMeta || {};
    if (share.targetType === 'bom') {
      BOM_ROLES.forEach((r) => targetRoles.add(r));
      if (Array.isArray(meta.memberUserIds)) {
        meta.memberUserIds.forEach((id: string) => targetUserIds.add(id));
      }
    } else if (share.targetType === 'teachers') {
      if (share.targetId === 'all') {
        TEACHING_ROLES.forEach((r) => targetRoles.add(r));
      } else if (share.targetId.startsWith('role:')) {
        targetRoles.add(share.targetId.slice(5));
      } else {
        targetUserIds.add(share.targetId);
        if (Array.isArray(meta.userIds)) {
          meta.userIds.forEach((id: string) => targetUserIds.add(id));
        }
      }
    } else if (share.targetType === 'departments') {
      const deptName = String(meta.departmentName || share.targetId || '').trim();
      if (deptName) targetDepartments.add(deptName);
      const deptSubjects = deptSubjectsMap.get(deptName.toLowerCase()) || [];
      for (const u of audienceUsers) {
        const uDept = String(u.department || '').trim().toLowerCase();
        const uSubjects: string[] = Array.isArray(u.assignedSubjects) ? u.assignedSubjects : [];
        if (
          (uDept && (uDept === deptName.toLowerCase() || uDept.includes(deptName.toLowerCase()))) ||
          (deptSubjects.length > 0 && uSubjects.some((s) => deptSubjects.includes(String(s).toLowerCase())))
        ) {
          targetUserIds.add(u.id);
        }
      }
    } else if (share.targetType === 'parents') {
      if (share.targetId === 'all') {
        targetRoles.add('parent');
      } else if (share.targetId.startsWith('grade:')) {
        const g = Number(share.targetId.slice(6));
        if (!isNaN(g) && g >= 1 && g <= 9) {
          targetGrade = g;
          for (const u of audienceUsers) {
            if (u.role === 'parent' && Array.isArray(u.childrenGrades) && u.childrenGrades.includes(g)) {
              targetUserIds.add(u.id);
            }
          }
        }
      } else {
        targetUserIds.add(share.targetId);
      }
    } else if (share.targetType === 'individual') {
      targetUserIds.add(share.targetId);
      if (Array.isArray(meta.userIds)) {
        meta.userIds.forEach((id: string) => targetUserIds.add(id));
      }
    } else if (share.targetType === 'group') {
      const builtIn = BUILT_IN_COHORT_GROUPS.find((g) => g.id === share.targetId);
      if (builtIn) {
        builtIn.memberRoles.forEach((r) => targetRoles.add(r));
        builtIn.memberUserIds.forEach((id) => targetUserIds.add(id));
      } else {
        const cg = customGroupsMap.get(share.targetId);
        if (cg) {
          cg.memberUserIds.forEach((id) => targetUserIds.add(id));
          cg.memberRoles.forEach((r) => targetRoles.add(r));
        }
      }
    }
  }

  const labels = params.shares.map((s) => s.targetLabel).slice(0, 4).join(', ');
  const notifId = `notif-exec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const notifPayload = {
    id: notifId,
    title: `Head Teacher Report Shared: ${params.reportTitle}`,
    message: `${params.sharedByName} shared "${params.reportTitle}" (${params.reportingPeriod}) with ${labels}${params.shares.length > 4 ? ` +${params.shares.length - 4} more` : ''}.${params.sharedNote ? ` Note: ${params.sharedNote}` : ''}`,
    category: 'announcement',
    targetRoles: Array.from(targetRoles),
    targetUserIds: Array.from(targetUserIds),
    targetDepartments: Array.from(targetDepartments),
    ...(targetGrade ? { targetGrade } : {}),
    urgency: 'high',
    linkTab: 'reporting_hub',
    createdAt: params.now,
    readByUserIds: [],
  };

  upsertCollectionRecord(db, 'edusmart_notifications_v1', notifId, params.schoolId, notifPayload, false);
  broadcastChange({
    type: 'collection:updated',
    collection: 'edusmart_notifications_v1',
    tenantId: params.schoolId,
    recordId: notifId,
    timestamp: params.now,
  });
}

export function registerExecutiveReportsRoutes(app: Express): void {
  // 1. Fetch reports for the active school (Head Teacher / Admin sees all; recipients see shared)
  app.get('/api/reports/executive', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      const schoolId = resolveTenantScope(req, res, req.query.schoolId as string | undefined);
      if (!schoolId) return;

      ensureDefaultExecutiveReportsForTenant(db, schoolId);
      const departments = ensureDefaultDepartmentsForSchool(db, schoolId);
      const canManage = canManageExecutiveReports(session);

      const reportRows = db
        .prepare(
          `SELECT * FROM executive_reports
           WHERE school_id = ? AND deleted_at IS NULL
           ORDER BY CASE WHEN category = 'bom_report' THEN 0 ELSE 1 END, updated_at DESC`
        )
        .all(schoolId) as any[];

      const shareRows = db
        .prepare(`SELECT * FROM executive_report_shares WHERE school_id = ? ORDER BY created_at ASC`)
        .all(schoolId) as any[];

      const sharesByReport = new Map<string, any[]>();
      for (const s of shareRows) {
        const list = sharesByReport.get(s.report_id) || [];
        list.push(s);
        sharesByReport.set(s.report_id, list);
      }

      const customGroupRows = db
        .prepare(`SELECT * FROM executive_report_groups WHERE school_id = ? AND deleted_at IS NULL ORDER BY name ASC`)
        .all(schoolId) as any[];
      const customGroups = customGroupRows.map((g) => ({
        id: g.id,
        schoolId: g.school_id,
        name: g.name,
        description: g.description || '',
        memberUserIds: parseJsonSafe<string[]>(g.member_user_ids_json, []),
        memberRoles: parseJsonSafe<string[]>(g.member_roles_json, []),
        isBuiltIn: false,
        createdById: g.created_by_id,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));

      const customGroupsMap = new Map(customGroups.map((g) => [g.id, g]));
      const departmentsMap = new Map(departments.map((d: any) => [d.name.toLowerCase(), d]));

      const allAudienceUsers = listSchoolAudienceUsers(db, schoolId);
      const currentUserRecord = allAudienceUsers.find((u) => u.id === session.userId) || session.user;

      const hydrated = reportRows.map((row) => hydrateReportRow(row, sharesByReport.get(row.id) || []));

      const visibleReports = canManage
        ? hydrated
        : hydrated
            .filter((rep) => rep.status === 'published')
            .map((rep) => {
              const matchedReasons = getUserMatchDetailsForReport(
                session,
                rep.shares,
                customGroupsMap,
                departmentsMap,
                currentUserRecord
              );
              return matchedReasons.length > 0 ? { ...rep, matchedReasons } : null;
            })
            .filter(Boolean);

      return res.json({
        success: true,
        schoolId,
        canManage,
        reports: visibleReports,
        groups: [...BUILT_IN_COHORT_GROUPS.map((g) => ({ ...g, schoolId })), ...customGroups],
        departments,
      });
    } catch (err: any) {
      console.error('[executive-reports] GET error:', err);
      return res.status(500).json({ error: 'Failed to load executive reports', message: err?.message });
    }
  });

  // 2. Audience options for Head Teacher / Admin share picker
  app.get('/api/reports/executive/audience-options', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Head Teacher or Administrator privileges required.' });
      }
      const schoolId = resolveTenantScope(req, res, req.query.schoolId as string | undefined);
      if (!schoolId) return;

      const departments = ensureDefaultDepartmentsForSchool(db, schoolId);
      const users = listSchoolAudienceUsers(db, schoolId);

      const customGroupRows = db
        .prepare(`SELECT * FROM executive_report_groups WHERE school_id = ? AND deleted_at IS NULL ORDER BY name ASC`)
        .all(schoolId) as any[];
      const customGroups = customGroupRows.map((g) => ({
        id: g.id,
        schoolId: g.school_id,
        name: g.name,
        description: g.description || '',
        memberUserIds: parseJsonSafe<string[]>(g.member_user_ids_json, []),
        memberRoles: parseJsonSafe<string[]>(g.member_roles_json, []),
        isBuiltIn: false,
        createdById: g.created_by_id,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));

      return res.json({
        success: true,
        schoolId,
        departments,
        users,
        groups: [...BUILT_IN_COHORT_GROUPS.map((g) => ({ ...g, schoolId })), ...customGroups],
      });
    } catch (err: any) {
      console.error('[executive-reports] audience-options error:', err);
      return res.status(500).json({ error: 'Failed to load audience options', message: err?.message });
    }
  });

  // 3. Create new BoM or any other report
  app.post('/api/reports/executive', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can create executive reports.' });
      }
      const schoolId = resolveTenantScope(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const title = String(req.body?.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Report title is required.' });

      const rawCat = String(req.body?.category || 'bom_report').trim();
      const category = VALID_CATEGORIES.has(rawCat) ? rawCat : 'general_report';
      const classification = String(req.body?.classification || 'CONFIDENTIAL EXECUTIVE BRIEFING').trim();
      const reportingPeriod = String(req.body?.reportingPeriod || 'Term 3 · Academic Year 2026').trim();
      const term = String(req.body?.term || '').trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();
      const summary = String(req.body?.summary || '').trim();
      const certifiedBy = String(
        req.body?.certifiedBy || `Certified by: ${session.user?.name || 'Head Teacher'}, Head Teacher`
      ).trim();
      const directorateLabel = String(req.body?.directorateLabel || 'EduSmart Governance Directorate').trim();
      const status = req.body?.status === 'draft' ? 'draft' : 'published';

      const rawSections = Array.isArray(req.body?.sections) ? req.body.sections : [];
      const sections = rawSections
        .map((s: any, idx: number) => ({
          id: String(s?.id || `sec-${idx + 1}`),
          heading: String(s?.heading || '').trim(),
          body: String(s?.body || '').trim(),
        }))
        .filter((s: any) => s.heading || s.body);

      if (sections.length === 0) {
        return res.status(400).json({ error: 'Please include at least one report section.' });
      }

      const now = new Date().toISOString();
      const reportId = `exec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const actorName = String(session.user?.name || 'Head Teacher');

      db.exec('BEGIN IMMEDIATE');
      let shares: any[] = [];
      try {
        db.prepare(
          `INSERT INTO executive_reports
             (id, school_id, title, category, classification, reporting_period, term, academic_year,
              summary, sections_json, certified_by, directorate_label, status,
              created_by_id, created_by_name, updated_by_id, updated_by_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          reportId,
          schoolId,
          title,
          category,
          classification,
          reportingPeriod,
          term,
          academicYear,
          summary,
          JSON.stringify(sections),
          certifiedBy,
          directorateLabel,
          status,
          session.userId,
          actorName,
          session.userId,
          actorName,
          now,
          now
        );

        const incomingShares = Array.isArray(req.body?.shares) ? req.body.shares : [];
        if (incomingShares.length > 0) {
          shares = replaceSharesForReport(db, {
            reportId,
            schoolId,
            shares: incomingShares,
            sharedById: session.userId,
            sharedByName: actorName,
            sharedNote: String(req.body?.sharedNote || ''),
            now,
          });
        }
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      if (shares.length > 0 && status === 'published' && req.body?.notifyRecipients !== false) {
        dispatchShareNotifications(db, {
          schoolId,
          reportTitle: title,
          reportingPeriod,
          sharedByName: actorName,
          shares,
          sharedNote: String(req.body?.sharedNote || ''),
          now,
        });
      }

      notifyMySqlTablesChanged(['executive_reports', 'executive_report_shares']);
      writeSecurityAudit({
        schoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'create_executive_report',
        resource: `executive_reports:${reportId}`,
        details: JSON.stringify({ title, category, shareCount: shares.length }),
      });
      broadcastChange({
        type: 'record:created',
        collection: 'executive_reports',
        tenantId: schoolId,
        recordId: reportId,
        actorId: session.userId,
        timestamp: now,
      });

      const createdRow = db.prepare(`SELECT * FROM executive_reports WHERE id = ?`).get(reportId);
      return res.status(201).json({
        success: true,
        report: hydrateReportRow(createdRow, shares),
      });
    } catch (err: any) {
      console.error('[executive-reports] POST error:', err);
      return res.status(500).json({ error: 'Failed to create report', message: err?.message });
    }
  });

  // 4. Edit existing report (supports partial or full update)
  app.put('/api/reports/executive/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can edit executive reports.' });
      }
      const existing = db
        .prepare(`SELECT * FROM executive_reports WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
        .get(req.params.id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant report modification is forbidden.' });
      }

      const title = req.body?.title !== undefined ? String(req.body.title).trim() : existing.title;
      if (!title) return res.status(400).json({ error: 'Report title cannot be empty.' });

      const rawCat = req.body?.category !== undefined ? String(req.body.category).trim() : existing.category;
      const category = VALID_CATEGORIES.has(rawCat) ? rawCat : existing.category;
      const classification =
        req.body?.classification !== undefined ? String(req.body.classification).trim() : existing.classification;
      const reportingPeriod =
        req.body?.reportingPeriod !== undefined ? String(req.body.reportingPeriod).trim() : existing.reporting_period;
      const term = req.body?.term !== undefined ? String(req.body.term).trim() : existing.term;
      const academicYear =
        req.body?.academicYear !== undefined ? String(req.body.academicYear).trim() : existing.academic_year;
      const summary = req.body?.summary !== undefined ? String(req.body.summary).trim() : existing.summary;
      const certifiedBy =
        req.body?.certifiedBy !== undefined ? String(req.body.certifiedBy).trim() : existing.certified_by;
      const directorateLabel =
        req.body?.directorateLabel !== undefined
          ? String(req.body.directorateLabel).trim()
          : existing.directorate_label;
      const status =
        req.body?.status !== undefined ? (req.body.status === 'draft' ? 'draft' : 'published') : existing.status;

      let sections = parseJsonSafe<any[]>(existing.sections_json, []);
      if (Array.isArray(req.body?.sections)) {
        sections = req.body.sections
          .map((s: any, idx: number) => ({
            id: String(s?.id || `sec-${idx + 1}`),
            heading: String(s?.heading || '').trim(),
            body: String(s?.body || '').trim(),
          }))
          .filter((s: any) => s.heading || s.body);
      }
      if (sections.length === 0) {
        return res.status(400).json({ error: 'Report must contain at least one section.' });
      }

      const now = new Date().toISOString();
      const actorName = String(session.user?.name || 'Head Teacher');

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE executive_reports
           SET title = ?, category = ?, classification = ?, reporting_period = ?, term = ?, academic_year = ?,
               summary = ?, sections_json = ?, certified_by = ?, directorate_label = ?, status = ?,
               updated_by_id = ?, updated_by_name = ?, updated_at = ?
           WHERE id = ? AND school_id = ?`
        ).run(
          title,
          category,
          classification,
          reportingPeriod,
          term,
          academicYear,
          summary,
          JSON.stringify(sections),
          certifiedBy,
          directorateLabel,
          status,
          session.userId,
          actorName,
          now,
          existing.id,
          existing.school_id
        );

        if (Array.isArray(req.body?.shares)) {
          replaceSharesForReport(db, {
            reportId: existing.id,
            schoolId: existing.school_id,
            shares: req.body.shares,
            sharedById: session.userId,
            sharedByName: actorName,
            sharedNote: String(req.body?.sharedNote || ''),
            now,
          });
        }
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged(['executive_reports', 'executive_report_shares']);
      writeSecurityAudit({
        schoolId: existing.school_id,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'update_executive_report',
        resource: `executive_reports:${existing.id}`,
        details: JSON.stringify({ title, category, status }),
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'executive_reports',
        tenantId: existing.school_id,
        recordId: existing.id,
        actorId: session.userId,
        timestamp: now,
      });

      const updatedRow = db.prepare(`SELECT * FROM executive_reports WHERE id = ?`).get(existing.id);
      const shareRows = db
        .prepare(`SELECT * FROM executive_report_shares WHERE report_id = ? ORDER BY created_at ASC`)
        .all(existing.id) as any[];
      return res.json({
        success: true,
        report: hydrateReportRow(updatedRow, shareRows),
      });
    } catch (err: any) {
      console.error('[executive-reports] PUT error:', err);
      return res.status(500).json({ error: 'Failed to update report', message: err?.message });
    }
  });

  // 5. Share / update share recipients for a report (BoM, Teachers, Departments, Parents, Individual, Group)
  app.post('/api/reports/executive/:id/share', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can share reports.' });
      }

      const existing = db
        .prepare(`SELECT * FROM executive_reports WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
        .get(req.params.id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant report sharing is forbidden.' });
      }

      const incomingShares = Array.isArray(req.body?.shares) ? req.body.shares : [];
      const sharedNote = String(req.body?.sharedNote || '').trim();
      const publishNow = req.body?.publish !== false;
      const notifyRecipients = req.body?.notifyRecipients !== false;
      const now = new Date().toISOString();
      const actorName = String(session.user?.name || 'Head Teacher');

      let updatedShares: any[] = [];
      db.exec('BEGIN IMMEDIATE');
      try {
        updatedShares = replaceSharesForReport(db, {
          reportId: existing.id,
          schoolId: existing.school_id,
          shares: incomingShares,
          sharedById: session.userId,
          sharedByName: actorName,
          sharedNote,
          now,
        });

        if (publishNow && existing.status === 'draft' && updatedShares.length > 0) {
          db.prepare(
            `UPDATE executive_reports SET status = 'published', updated_by_id = ?, updated_by_name = ?, updated_at = ? WHERE id = ?`
          ).run(session.userId, actorName, now, existing.id);
        } else {
          db.prepare(`UPDATE executive_reports SET updated_at = ? WHERE id = ?`).run(now, existing.id);
        }
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      if (notifyRecipients && updatedShares.length > 0) {
        dispatchShareNotifications(db, {
          schoolId: existing.school_id,
          reportTitle: existing.title,
          reportingPeriod: existing.reporting_period,
          sharedByName: actorName,
          shares: updatedShares,
          sharedNote,
          now,
        });
      }

      notifyMySqlTablesChanged(['executive_reports', 'executive_report_shares']);
      writeSecurityAudit({
        schoolId: existing.school_id,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'share_executive_report',
        resource: `executive_reports:${existing.id}`,
        details: JSON.stringify({
          title: existing.title,
          targets: updatedShares.map((s) => `${s.targetType}:${s.targetLabel}`),
        }),
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'executive_reports',
        tenantId: existing.school_id,
        recordId: existing.id,
        actorId: session.userId,
        timestamp: now,
      });

      const updatedRow = db.prepare(`SELECT * FROM executive_reports WHERE id = ?`).get(existing.id);
      const rawShares = db
        .prepare(`SELECT * FROM executive_report_shares WHERE report_id = ? ORDER BY created_at ASC`)
        .all(existing.id) as any[];
      return res.json({
        success: true,
        report: hydrateReportRow(updatedRow, rawShares),
      });
    } catch (err: any) {
      console.error('[executive-reports] SHARE error:', err);
      return res.status(500).json({ error: 'Failed to update report sharing', message: err?.message });
    }
  });

  // 6. Delete report
  app.delete('/api/reports/executive/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can delete reports.' });
      }

      const existing = db
        .prepare(`SELECT * FROM executive_reports WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
        .get(req.params.id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant report deletion is forbidden.' });
      }

      const now = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE executive_reports SET deleted_at = ?, updated_at = ?, updated_by_id = ?, updated_by_name = ? WHERE id = ?`
        ).run(now, now, session.userId, String(session.user?.name || 'Head Teacher'), existing.id);
        db.prepare(`DELETE FROM executive_report_shares WHERE report_id = ?`).run(existing.id);
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged(['executive_reports', 'executive_report_shares']);
      writeSecurityAudit({
        schoolId: existing.school_id,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'delete_executive_report',
        resource: `executive_reports:${existing.id}`,
        details: JSON.stringify({ title: existing.title }),
      });
      broadcastChange({
        type: 'record:deleted',
        collection: 'executive_reports',
        tenantId: existing.school_id,
        recordId: existing.id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, deletedId: existing.id });
    } catch (err: any) {
      console.error('[executive-reports] DELETE error:', err);
      return res.status(500).json({ error: 'Failed to delete report', message: err?.message });
    }
  });

  // 7. Custom Recipient Groups CRUD
  app.post('/api/reports/executive/groups', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can create report groups.' });
      }
      const schoolId = resolveTenantScope(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Group name is required.' });
      const description = String(req.body?.description || '').trim();
      const memberUserIds = Array.isArray(req.body?.memberUserIds)
        ? req.body.memberUserIds.map((x: any) => String(x)).filter(Boolean)
        : [];
      const memberRoles = Array.isArray(req.body?.memberRoles)
        ? req.body.memberRoles.map((x: any) => String(x)).filter(Boolean)
        : [];

      const id = `rgrp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO executive_report_groups
           (id, school_id, name, description, member_user_ids_json, member_roles_json, created_by_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        schoolId,
        name,
        description,
        JSON.stringify(memberUserIds),
        JSON.stringify(memberRoles),
        session.userId,
        now,
        now
      );

      notifyMySqlTablesChanged(['executive_report_groups']);
      broadcastChange({
        type: 'record:created',
        collection: 'executive_report_groups',
        tenantId: schoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({
        success: true,
        group: {
          id,
          schoolId,
          name,
          description,
          memberUserIds,
          memberRoles,
          isBuiltIn: false,
          createdById: session.userId,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (err: any) {
      console.error('[executive-reports] group POST error:', err);
      return res.status(500).json({ error: 'Failed to create group', message: err?.message });
    }
  });

  app.put('/api/reports/executive/groups/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can edit report groups.' });
      }
      const existing = db
        .prepare(`SELECT * FROM executive_report_groups WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
        .get(req.params.id) as any;
      if (!existing) return res.status(404).json({ error: 'Group not found.' });
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant modification forbidden.' });
      }

      const name = req.body?.name !== undefined ? String(req.body.name).trim() : existing.name;
      if (!name) return res.status(400).json({ error: 'Group name cannot be empty.' });
      const description =
        req.body?.description !== undefined ? String(req.body.description).trim() : existing.description;
      const memberUserIds = Array.isArray(req.body?.memberUserIds)
        ? req.body.memberUserIds.map((x: any) => String(x)).filter(Boolean)
        : parseJsonSafe<string[]>(existing.member_user_ids_json, []);
      const memberRoles = Array.isArray(req.body?.memberRoles)
        ? req.body.memberRoles.map((x: any) => String(x)).filter(Boolean)
        : parseJsonSafe<string[]>(existing.member_roles_json, []);

      const now = new Date().toISOString();
      db.prepare(
        `UPDATE executive_report_groups
         SET name = ?, description = ?, member_user_ids_json = ?, member_roles_json = ?, updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(name, description, JSON.stringify(memberUserIds), JSON.stringify(memberRoles), now, existing.id, existing.school_id);

      notifyMySqlTablesChanged(['executive_report_groups']);
      broadcastChange({
        type: 'record:updated',
        collection: 'executive_report_groups',
        tenantId: existing.school_id,
        recordId: existing.id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        group: {
          id: existing.id,
          schoolId: existing.school_id,
          name,
          description,
          memberUserIds,
          memberRoles,
          isBuiltIn: false,
          createdById: existing.created_by_id,
          createdAt: existing.created_at,
          updatedAt: now,
        },
      });
    } catch (err: any) {
      console.error('[executive-reports] group PUT error:', err);
      return res.status(500).json({ error: 'Failed to update group', message: err?.message });
    }
  });

  app.delete('/api/reports/executive/groups/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const db = getDb();
      const session = req.authSession!;
      if (!canManageExecutiveReports(session)) {
        return res.status(403).json({ error: 'Only the Head Teacher or School Admin can delete report groups.' });
      }
      const existing = db
        .prepare(`SELECT * FROM executive_report_groups WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
        .get(req.params.id) as any;
      if (!existing) return res.status(404).json({ error: 'Group not found.' });
      if (!session.isSuperAdmin && existing.school_id !== session.schoolId) {
        return res.status(403).json({ error: 'Cross-tenant deletion forbidden.' });
      }

      const now = new Date().toISOString();
      db.prepare(`UPDATE executive_report_groups SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(
        now,
        now,
        existing.id
      );

      notifyMySqlTablesChanged(['executive_report_groups']);
      broadcastChange({
        type: 'record:deleted',
        collection: 'executive_report_groups',
        tenantId: existing.school_id,
        recordId: existing.id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, deletedId: existing.id });
    } catch (err: any) {
      console.error('[executive-reports] group DELETE error:', err);
      return res.status(500).json({ error: 'Failed to delete group', message: err?.message });
    }
  });
}
