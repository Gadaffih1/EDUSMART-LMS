import {
  User,
  GateExitPass,
  AttendanceRecord,
  ReportCard,
  SanatoriumRecord,
  TransportRoute,
  LibraryBook,
  Announcement,
  BellPeriodDef
} from '../types';
import { Tenant } from '../types/tenant';

/**
 * Tenant Data Isolation Factory
 * Generates isolated, campus-specific starter datasets for each school tenant.
 * Guarantees zero data crossover across institutional boundaries.
 */

export function createTenantUsers(tenant: Tenant): User[] {
  const domain = tenant.domain || `${tenant.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.edusmart.ac.ke`;
  const schoolCode = tenant.code || 'SCH-001';

  // Customized users for this specific tenant school
  const users: User[] = [
    // 1. School Administrator
    {
      id: `usr-admin-${tenant.id}`,
      name: tenant.principalName || `${tenant.shortName} Administrator`,
      email: `admin@${domain}`,
      password: 'admin2026',
      role: 'admin',
      schoolId: tenant.id,
      designation: tenant.principalTitle || 'School Administrator & Principal',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    // 2. School Admin Staff / Academic Registrar
    {
      id: `usr-registrar-${tenant.id}`,
      name: `Mrs. Sarah ${tenant.shortName.split(' ')[0]}`,
      email: `registrar@${domain}`,
      password: 'staff2026',
      role: 'school_admin_staff',
      schoolId: tenant.id,
      tscNumber: `ADM/${tenant.code}/SEC`,
      designation: `Academic Registrar & Secretariat · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    },
    // 3. School Sanatorium Nurse In-Charge
    {
      id: `usr-nurse-${tenant.id}`,
      name: `Sister Grace Wanjiru, RN (${tenant.shortName})`,
      email: `nurse@${domain}`,
      password: 'nurse2026',
      role: 'nurse',
      schoolId: tenant.id,
      tscNumber: `NCK/RN-${Math.floor(10000 + Math.random() * 90000)}`,
      designation: `School Nursing Officer In-Charge · ${tenant.shortName} Sanatorium`,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    },
    // 4. Transport Team Lead
    {
      id: `usr-transport-${tenant.id}`,
      name: `Mr. Josephat Kipkoech (${tenant.shortName})`,
      email: `transport@${domain}`,
      password: 'transport2026',
      role: 'transport_team',
      schoolId: tenant.id,
      phone: tenant.phone || '+254 712 345 678',
      tscNumber: `NTSA/PSV-${Math.floor(10000 + Math.random() * 90000)}`,
      designation: `Lead Fleet Operations & Bus Supervisor · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    // 5. Co-Curricular & Sports Academy Lead
    {
      id: `usr-cocurricular-${tenant.id}`,
      name: `Coach Benjamin Omwenga (${tenant.shortName})`,
      email: `cocurricular@${domain}`,
      password: 'cocurricular2026',
      role: 'cocurricular_team',
      schoolId: tenant.id,
      tscNumber: `TSC/SP-${Math.floor(10000 + Math.random() * 90000)}`,
      designation: `Director of Sports & Activities · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    // 6. Head Teacher / Principal
    {
      id: `usr-head-${tenant.id}`,
      name: tenant.principalName || `Dr. Arthur Mwangi (${tenant.shortName})`,
      email: `headteacher@${domain}`,
      password: 'head2026',
      role: 'head_teacher',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      designation: `Head of Institution & Principal · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    // 7. Deputy Head Teacher
    {
      id: `usr-deputy-${tenant.id}`,
      name: `Mr. Charles Omondi (${tenant.shortName})`,
      email: `deputy@${domain}`,
      password: 'deputy2026',
      role: 'deputy_head',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      designation: `Deputy Principal - Operations & Discipline · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    // 8. Dean of Studies
    {
      id: `usr-dean-${tenant.id}`,
      name: `Ms. Beatrice Wanjiku (${tenant.shortName})`,
      email: `dean@${domain}`,
      password: 'dean2026',
      role: 'dean_of_studies',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      designation: `Dean of Studies & Academic Programs · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    // 9. Curriculum Coordinator
    {
      id: `usr-curriculum-${tenant.id}`,
      name: `Mrs. Beatrice Omari (${tenant.shortName})`,
      email: `curriculum@${domain}`,
      password: 'coord2026',
      role: 'curriculum_coordinator',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      designation: `Director of Curriculum Coordination & CBC Assessment · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    // 10. Head of Department (HOD) - Sciences
    {
      id: `usr-hod-${tenant.id}`,
      name: `Dr. Mercy Mwangi (${tenant.shortName})`,
      email: `hod.sciences@${domain}`,
      password: 'hod2026',
      role: 'hod',
      schoolId: tenant.id,
      department: 'Sciences & Mathematics',
      assignedSubjects: ['Integrated Science', 'Mathematics'],
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    // 11. Senior Teacher
    {
      id: `usr-senior-${tenant.id}`,
      name: `Mr. Peter Ochieng (${tenant.shortName})`,
      email: `senior.teacher@${domain}`,
      password: 'senior2026',
      role: 'senior_teacher',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    // 12. School Librarian
    {
      id: `usr-lib-${tenant.id}`,
      name: `Mrs. Esther Kamau (${tenant.shortName})`,
      email: `librarian@${domain}`,
      password: 'lib2026',
      role: 'librarian',
      schoolId: tenant.id,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    },
    // 13. Class Teacher Grade 4 Dove
    {
      id: `usr-classteach-gr4-${tenant.id}`,
      name: `Mr. David Kiprono (${tenant.shortName})`,
      email: `teacher.gr4@${domain}`,
      password: 'teach2026',
      role: 'class_teacher',
      schoolId: tenant.id,
      grade: 4,
      stream: 'Dove',
      assignedStreams: [
        { grade: 4, stream: 'Dove' },
        { grade: 4, stream: 'Eagle' }
      ],
      assignedSubjects: ['Mathematics', 'Integrated Science'],
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    // 14. Class Teacher Grade 8 Mara (Junior School)
    {
      id: `usr-classteach-gr8-${tenant.id}`,
      name: `Mrs. Florence Akinyi (${tenant.shortName})`,
      email: `teacher.gr8@${domain}`,
      password: 'teach2026',
      role: 'class_teacher',
      schoolId: tenant.id,
      grade: 8,
      stream: 'Mara',
      assignedStreams: [
        { grade: 8, stream: 'Mara' },
        { grade: 8, stream: 'Athi' }
      ],
      assignedSubjects: ['English', 'Social Studies'],
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    // 15. Subject Teacher
    {
      id: `usr-teacher-${tenant.id}`,
      name: `Mr. Peter Mutua (${tenant.shortName})`,
      email: `teacher.mutua@${domain}`,
      password: 'teach2026',
      role: 'teacher',
      schoolId: tenant.id,
      assignedStreams: [
        { grade: 4, stream: 'Dove' },
        { grade: 7, stream: 'Kerio' },
        { grade: 8, stream: 'Mara' },
        { grade: 9, stream: 'Tana' }
      ],
      assignedSubjects: ['Mathematics', 'Pretechnical Education', 'Agriculture and Nutrition'],
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
    // 16. Finance Officer
    {
      id: `usr-fin-${tenant.id}`,
      name: `Mr. David Mwangi (${tenant.shortName})`,
      email: `finance@${domain}`,
      password: 'finance2026',
      role: 'finance_officer',
      schoolId: tenant.id,
      tscNumber: `FIN/${tenant.code}/BUR`,
      designation: `Senior Finance Officer & Bursar · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    // 17. Procurement Officer
    {
      id: `usr-procure-${tenant.id}`,
      name: `Ms. Linda Kiprop (${tenant.shortName})`,
      email: `procurement@${domain}`,
      password: 'procure2026',
      role: 'procurement_officer',
      schoolId: tenant.id,
      tscNumber: `KISM/${tenant.code}/PR`,
      designation: `Head of Procurement & Supply Chain · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    // 18. Central Storekeeper
    {
      id: `usr-stores-${tenant.id}`,
      name: `Mr. Joseph Otieno (${tenant.shortName})`,
      email: `stores@${domain}`,
      password: 'stores2026',
      role: 'storekeeper',
      schoolId: tenant.id,
      tscNumber: `STR/${tenant.code}/LOG`,
      designation: `Central Stores & Inventory Master · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    // 19. HR & Payroll Manager
    {
      id: `usr-hr-${tenant.id}`,
      name: `Mrs. Caroline Nduta (${tenant.shortName})`,
      email: `hr@${domain}`,
      password: 'hr2026',
      role: 'hr_manager',
      schoolId: tenant.id,
      tscNumber: `IHRM/${tenant.code}/HR`,
      designation: `Human Resources & Payroll Director · ${tenant.shortName}`,
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    },
    // 20. Learners (Students) of this school
    {
      id: `usr-stu-1-${tenant.id}`,
      name: `Brian Otieno (${tenant.shortName})`,
      email: `brian.${tenant.id}@student.edusmart.ac.ke`,
      password: 'GR4@2026',
      role: 'student',
      schoolId: tenant.id,
      grade: 4,
      stream: 'Dove',
      admissionNumber: `${schoolCode}/2023/0412`,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: `usr-stu-2-${tenant.id}`,
      name: `Faith Wanjiru (${tenant.shortName})`,
      email: `faith.${tenant.id}@student.edusmart.ac.ke`,
      password: 'GR8@2026',
      role: 'student',
      schoolId: tenant.id,
      grade: 8,
      stream: 'Mara',
      admissionNumber: `${schoolCode}/2021/0819`,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: `usr-stu-3-${tenant.id}`,
      name: `Amina Hassan (${tenant.shortName})`,
      email: `amina.${tenant.id}@student.edusmart.ac.ke`,
      password: 'GR4@2026',
      role: 'student',
      schoolId: tenant.id,
      grade: 4,
      stream: 'Dove',
      admissionNumber: `${schoolCode}/2023/0413`,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: `usr-stu-4-${tenant.id}`,
      name: `Kevin Maina (${tenant.shortName})`,
      email: `kevin.${tenant.id}@student.edusmart.ac.ke`,
      password: 'GR2@2026',
      role: 'student',
      schoolId: tenant.id,
      grade: 2,
      stream: 'Eagle',
      admissionNumber: `${schoolCode}/2025/0201`,
    },
    // 21. Parent of this school
    {
      id: `usr-parent-${tenant.id}`,
      name: `Mrs. Grace Otieno (Parent · ${tenant.shortName})`,
      email: `parent.${tenant.id}@edusmart.ac.ke`,
      password: 'parent2026',
      role: 'parent',
      schoolId: tenant.id,
      phone: tenant.phone || '+254 722 123 456',
      childrenIds: [`usr-stu-1-${tenant.id}`, `usr-stu-2-${tenant.id}`, `usr-stu-4-${tenant.id}`],
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    }
  ];

  return users;
}

export function createTenantGatePasses(tenant: Tenant, users: User[]): GateExitPass[] {
  const students = users.filter(u => u.role === 'student');
  const stu1 = students[0] || { id: 'stu-1', name: 'Student 1', admissionNumber: 'ADM-001', grade: 4, stream: 'Dove' };
  const stu2 = students[1] || { id: 'stu-2', name: 'Student 2', admissionNumber: 'ADM-002', grade: 8, stream: 'Mara' };
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: `gp-${tenant.id}-001`,
      studentId: stu1.id,
      studentName: stu1.name,
      admissionNumber: stu1.admissionNumber || `${tenant.code}/001`,
      grade: stu1.grade || 4,
      stream: (stu1.stream as any) || 'Dove',
      teacherId: `usr-deputy-${tenant.id}`,
      teacherName: tenant.principalName || 'Mr. Charles Omondi',
      departureDate: today,
      departureTime: '13:30',
      expectedReturnTime: '16:00',
      reason: 'Official Sanatorium medical referral to Nairobi Hospital Clinic',
      guardianName: 'Mrs. Grace Otieno',
      guardianPhone: tenant.phone || '+254 722 123 456',
      guardianRelationship: 'Mother',
      guardianIdNumber: '28491024',
      transportMode: 'Private Vehicle',
      gatePassCode: `GP-${tenant.code}-001`,
      status: 'active',
      approvedAt: `${today}T13:20:00.000Z`,
      securityRemarks: `Authorized by ${tenant.shortName} Deputy Principal. Gate exit verified.`
    },
    {
      id: `gp-${tenant.id}-002`,
      studentId: stu2.id,
      studentName: stu2.name,
      admissionNumber: stu2.admissionNumber || `${tenant.code}/002`,
      grade: stu2.grade || 8,
      stream: (stu2.stream as any) || 'Mara',
      teacherId: `usr-cocurricular-${tenant.id}`,
      teacherName: 'Coach Benjamin Omwenga',
      departureDate: today,
      departureTime: '15:00',
      expectedReturnTime: '18:30',
      actualReturnTime: '18:25',
      reason: 'Regional Inter-School Debate Championship representation',
      guardianName: 'Mr. David Wanjiru',
      guardianPhone: tenant.phone || '+254 733 987 654',
      guardianRelationship: 'Father',
      transportMode: 'Official School Bus',
      gatePassCode: `GP-${tenant.code}-002`,
      status: 'returned',
      approvedAt: `${today}T14:45:00.000Z`,
      securityRemarks: 'Officer John Mutisya verified team return.'
    }
  ];
}

export function createTenantAttendance(tenant: Tenant, users: User[]): AttendanceRecord[] {
  const students = users.filter(u => u.role === 'student');
  const today = new Date().toISOString().split('T')[0];

  const studentRecords = students.map((stu, idx) => ({
    studentId: stu.id,
    studentName: stu.name,
    status: (idx === 3 ? 'absent' : idx === 2 ? 'late' : 'present') as 'present' | 'absent' | 'late' | 'excused',
    remarks: idx === 3 ? 'Mild fever - reported to school clinic' : idx === 2 ? 'Morning bus traffic delay' : undefined
  }));

  const presentCount = studentRecords.filter(r => r.status === 'present').length;
  const absentCount = studentRecords.filter(r => r.status === 'absent').length;
  const lateCount = studentRecords.filter(r => r.status === 'late').length;
  const total = studentRecords.length;
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100;

  return [
    {
      id: `att-${tenant.id}-gr4-${today}`,
      date: today,
      grade: 4,
      stream: 'Dove',
      teacherId: `usr-classteach-gr4-${tenant.id}`,
      teacherName: `Mr. David Kiprono (${tenant.shortName})`,
      records: studentRecords,
      summary: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: 0,
        total,
        attendanceRate: rate
      }
    }
  ];
}
