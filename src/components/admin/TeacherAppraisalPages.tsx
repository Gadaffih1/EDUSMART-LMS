import React, { useEffect, useMemo, useState } from 'react';
import {
  AppraisalPerformanceGrade,
  GradeLevel,
  JUNIOR_SUBJECTS,
  LessonObservationRecord,
  PRIMARY_SUBJECTS,
  StaffAppraisalRecord,
  StaffAppraisalStatus,
  SubjectName,
  TPADStandardRating,
  User,
} from '../../types';
import { loadTpadStandards } from '../../utils/tpadStandards';
import {
  buildUsername,
  nextRegistryNumber,
  rolePassword,
  uniqueUsername,
} from '../../utils/accountCredentials';
import { listProvisionedAccounts, removeProvisionedAccount, saveProvisionedAccount } from '../../utils/provisionedAccounts';
import { findSystemRole } from '../../utils/systemRoles';
import { ensureDepartments, listDepartments } from '../../utils/departmentStore';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { Check, ChevronLeft, ClipboardCheck, Pencil, Trash2, UserPlus } from 'lucide-react';

interface TeacherAppraisalPagesProps {
  schoolId: string;
  domain: string;
  currentUser: User;
  surface?: 'staff' | 'appraisal' | 'own';
}

type StepId = 'account' | 'self' | 'observation' | 'meeting' | 'countersign';

type Page =
  | { name: 'list' }
  | { name: 'flow'; teacherId: string; step: StepId };

const STEPS: { id: StepId; label: string; detail: string }[] = [
  { id: 'account', label: 'Staff account', detail: 'Name, username, password, subjects, and staff number' },
  { id: 'self', label: 'Self-appraisal', detail: 'The staff member scores the five TSC standards' },
  { id: 'observation', label: 'Lesson observation', detail: 'A classroom visit is recorded' },
  { id: 'meeting', label: 'Appraisal meeting', detail: 'Agreed scores, the TPD gap, and interventions' },
  { id: 'countersign', label: 'Countersign', detail: 'The head teacher ratifies the dossier' },
];

const SUBJECTS = [...new Set<SubjectName>([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS])];
const TEACHING_ROLES = ['teacher', 'class_teacher', 'hod', 'senior_teacher'];

const STATUS_LABEL: Record<StaffAppraisalStatus, string> = {
  draft: 'Account ready',
  submitted_for_appraisal: 'Self-appraisal submitted',
  appraisal_meeting_pending: 'Appraisal meeting pending',
  completed: 'Appraiser evaluated',
  countersigned: 'Countersigned',
};

function stepIndex(step: StepId): number {
  return STEPS.findIndex((item) => item.id === step);
}

function stepForStatus(status?: StaffAppraisalStatus): StepId {
  if (status === 'submitted_for_appraisal') return 'observation';
  if (status === 'appraisal_meeting_pending') return 'meeting';
  if (status === 'completed' || status === 'countersigned') return 'countersign';
  if (status === 'draft') return 'account';
  return 'account';
}

function maxOpenIndex(teacherId: string, status?: StaffAppraisalStatus): number {
  if (!teacherId) return 0;
  if (status === 'completed' || status === 'countersigned') return 4;
  if (status === 'appraisal_meeting_pending') return 3;
  if (status === 'submitted_for_appraisal') return 2;
  if (status === 'draft') return 1;
  return 0;
}

function performanceGrade(percentage: number): AppraisalPerformanceGrade {
  if (percentage >= 90) return 'Exemplary (90-100%)';
  if (percentage >= 80) return 'Very Good (80-89%)';
  if (percentage >= 60) return 'Good (60-79%)';
  if (percentage >= 40) return 'Fair (40-59%)';
  return 'Needs Improvement (0-39%)';
}

function blankStandards(): TPADStandardRating[] {
  return loadTpadStandards().map((standard) => ({
    ...standard,
    selfScore: 0,
    appraiserScore: 0,
    agreedScore: 0,
    evidenceDescription: '',
  }));
}

export const TeacherAppraisalPages: React.FC<TeacherAppraisalPagesProps> = ({
  schoolId,
  domain,
  currentUser,
  surface = 'staff',
}) => {
  const pageKey = `edusmart_${surface}_page:${schoolId}:${currentUser.id}`;
  const [page, setPage] = useState<Page>(() => {
    try {
      const stored = sessionStorage.getItem(pageKey);
      if (stored) return JSON.parse(stored) as Page;
    } catch {
      // Start on the teacher list.
    }
    return { name: 'list' };
  });
  const openPage = (next: Page) => {
    sessionStorage.setItem(pageKey, JSON.stringify(next));
    setPage(next);
  };

  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [staffEdited, setStaffEdited] = useState(false);
  const [designation, setDesignation] = useState('Subject Teacher');
  const [department, setDepartment] = useState('');
  const [subjects, setSubjects] = useState<SubjectName[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [selfScores, setSelfScores] = useState<Record<string, { score: number; evidence: string }>>({});
  const [obsDate, setObsDate] = useState(new Date().toISOString().split('T')[0]);
  const [obsSubject, setObsSubject] = useState<SubjectName>('Mathematics');
  const [obsGrade, setObsGrade] = useState<GradeLevel>(4);
  const [obsTopic, setObsTopic] = useState('');
  const [obsScore, setObsScore] = useState(80);
  const [obsStrengths, setObsStrengths] = useState('');
  const [obsGrowth, setObsGrowth] = useState('');
  const [meetingScores, setMeetingScores] = useState<Record<string, { appraiserScore: number; agreedScore: number; remarks: string }>>({});
  const [meetingRemarks, setMeetingRemarks] = useState('');
  const [tpdGap, setTpdGap] = useState('');
  const [interventions, setInterventions] = useState('');
  const [countersignRemarks, setCountersignRemarks] = useState('Appraisal ratings certified for Teachers Service Commission records.');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editStaff, setEditStaff] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSubjects, setEditSubjects] = useState<SubjectName[]>([]);
  const [editActivities, setEditActivities] = useState<string[]>([]);
  const [accountSubjects, setAccountSubjects] = useState<SubjectName[]>([]);
  const [accountActivities, setAccountActivities] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('users-updated', refresh);
    window.addEventListener('staff-appraisals-updated', refresh);
    return () => {
      window.removeEventListener('users-updated', refresh);
      window.removeEventListener('staff-appraisals-updated', refresh);
    };
  }, []);

  const appraisals = useMemo(() => Storage.getStaffAppraisals(), [revision]);
  const teachers = useMemo(() => {
    const held = new Set(appraisals.map((record) => record.teacherId));
    return Storage.getUsers().filter((user) => {
      const inSchool = user.schoolId ? user.schoolId === schoolId : schoolId === 'tenant-riara';
      if (!inSchool) return false;
      return TEACHING_ROLES.includes(user.role) || held.has(user.id);
    });
  }, [schoolId, revision, appraisals]);
  const departments = useMemo(() => ensureDepartments(schoolId), [schoolId, revision]);
  const departmentNames = departments.map((item) => item.name);
  const selectedDepartment = departmentNames.includes(department) ? department : (departmentNames[0] || '');
  const chosenDepartment = departments.find((item) => item.name === selectedDepartment);
  const teacherId = page.name === 'flow' ? page.teacherId : '';
  const teacher = teachers.find((user) => user.id === teacherId) || (surface === 'own' && teacherId === currentUser.id ? currentUser : undefined);
  const appraisal = appraisals.find((record) => record.teacherId === teacherId);

  useEffect(() => {
    setAccountSubjects(teacher?.assignedSubjects || appraisal?.subjectsTaught || []);
    setAccountActivities(teacher?.assignedActivities || []);
  }, [teacher?.id, appraisal?.id]);
  const step: StepId = page.name === 'flow' ? page.step : 'account';
  const openLimit = maxOpenIndex(teacherId, appraisal?.status);

  const takenEmails = (except = '') => [
    ...Storage.getUsers().map((user) => user.email),
    ...listProvisionedAccounts().map((user) => user.email),
  ].filter((email) => email.toLowerCase() !== except.toLowerCase());

  const username = teacherName.trim()
    ? uniqueUsername(buildUsername(teacherName, domain), takenEmails())
    : '';
  const password = username ? rolePassword(findSystemRole('teacher')?.passwordPrefix || 'te') : '';
  const suggestedStaff = username
    ? nextRegistryNumber('STF', new Date().getFullYear(), Storage.getUsers().map((user) => user.staffNumber || ''))
    : '';
  const staffPreview = staffEdited ? staffNumber : suggestedStaff;

  const goStep = (next: StepId) => {
    if (!teacherId && next !== 'account') return;
    if (stepIndex(next) > openLimit) return;
    setError('');
    openPage({ name: 'flow', teacherId, step: next });
  };

  const toggleSubject = (subject: SubjectName) => {
    setSubjects((current) => (
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    ));
  };

  const toggleActivity = (activity: string) => {
    setActivities((current) => (
      current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity]
    ));
  };

  const onCreateTeacher = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!username || !password || !staffPreview) {
      setError('Type the staff member’s full name so the username, password, and staff number can be created.');
      return;
    }
    if (!selectedDepartment || !chosenDepartment?.kind) {
      setError('Open the department and choose teaching or non-teaching before adding this staff member.');
      return;
    }
    if (chosenDepartment.kind === 'teaching' && subjects.length === 0) {
      setError('Choose at least one subject from this department.');
      return;
    }
    if (chosenDepartment.kind === 'non_teaching' && activities.length === 0) {
      setError('Choose at least one activity from this department.');
      return;
    }
    const account: User = {
      id: `teacher-${Date.now()}`,
      name: teacherName.trim(),
      email: username,
      password,
      role: 'teacher',
      schoolId,
      isActive: true,
      staffNumber: staffPreview.trim(),
      designation: designation.trim() || (chosenDepartment.kind === 'teaching' ? 'Subject Teacher' : 'Staff'),
      department: selectedDepartment,
      assignedSubjects: chosenDepartment.kind === 'teaching' ? subjects : [],
      assignedActivities: chosenDepartment.kind === 'non_teaching' ? activities : [],
    };
    const record: StaffAppraisalRecord = {
      id: `appraisal-${account.id}`,
      teacherId: account.id,
      teacherName: account.name,
      tscNumber: '',
      designation: account.designation || 'Staff',
      department: selectedDepartment,
      subjectsTaught: chosenDepartment.kind === 'teaching' ? subjects : [],
      term: 2,
      academicYear: new Date().getFullYear(),
      status: 'draft',
      standards: blankStandards(),
      lessonObservations: [],
      tpdGapIdentified: '',
      targetInterventions: '',
      appraiserName: currentUser.name,
      appraiserRole: currentUser.role,
      overallPercentage: 0,
      performanceGrade: 'Needs Improvement (0-39%)',
      createdAt: new Date().toISOString(),
    };
    Storage.addStaffAppraisal(record);
    setTeacherName('');
    setStaffNumber('');
    setStaffEdited(false);
    setDesignation('Subject Teacher');
    setSubjects([]);
    setActivities([]);
    openPage({ name: 'list' });
    Storage.addUser(account);
    saveProvisionedAccount(account);
  };

  const loadSelf = (record: StaffAppraisalRecord) => {
    const next: Record<string, { score: number; evidence: string }> = {};
    record.standards.forEach((standard) => {
      next[standard.standardId] = {
        score: standard.selfScore || 4,
        evidence: standard.evidenceDescription || '',
      };
    });
    setSelfScores(next);
  };

  const loadMeeting = (record: StaffAppraisalRecord) => {
    const next: Record<string, { appraiserScore: number; agreedScore: number; remarks: string }> = {};
    record.standards.forEach((standard) => {
      next[standard.standardId] = {
        appraiserScore: standard.appraiserScore || standard.selfScore || 4,
        agreedScore: standard.agreedScore || standard.selfScore || 4,
        remarks: standard.appraiserRemarks || '',
      };
    });
    setMeetingScores(next);
    setMeetingRemarks(record.appraiserGeneralRemarks || '');
    setTpdGap(record.tpdGapIdentified || '');
    setInterventions(record.targetInterventions || '');
  };

  useEffect(() => {
    if (!appraisal) return;
    if (step === 'self') loadSelf(appraisal);
    if (step === 'meeting') loadMeeting(appraisal);
    if (appraisal.subjectsTaught[0]) setObsSubject(appraisal.subjectsTaught[0]);
  }, [appraisal?.id, step]);

  const ensureAppraisal = (user: User): StaffAppraisalRecord => {
    const existing = Storage.getStaffAppraisals().find((record) => record.teacherId === user.id);
    if (existing) return existing;
    const created: StaffAppraisalRecord = {
      id: `appraisal-${user.id}`,
      teacherId: user.id,
      teacherName: user.name,
      tscNumber: user.tscNumber || '',
      designation: user.designation || 'Subject Teacher',
      department: user.department || departmentNames[0] || '',
      subjectsTaught: user.assignedSubjects?.length ? user.assignedSubjects : ['Mathematics'],
      term: 2,
      academicYear: new Date().getFullYear(),
      status: 'draft',
      standards: blankStandards(),
      lessonObservations: [],
      tpdGapIdentified: '',
      targetInterventions: '',
      appraiserName: currentUser.name,
      appraiserRole: currentUser.role,
      overallPercentage: 0,
      performanceGrade: 'Needs Improvement (0-39%)',
      createdAt: new Date().toISOString(),
    };
    Storage.addStaffAppraisal(created);
    return created;
  };

  useEffect(() => {
    if (surface === 'staff' && page.name === 'flow' && page.step !== 'account') {
      openPage({ name: 'flow', teacherId: page.teacherId, step: 'account' });
      return;
    }
    if (surface !== 'own' || page.name === 'flow') return;
    const record = ensureAppraisal(currentUser);
    const next = stepForStatus(record.status);
    openPage({ name: 'flow', teacherId: currentUser.id, step: next === 'account' ? 'self' : next });
  }, [surface, currentUser.id]);

  const onContinueExisting = () => {
    if (!teacher) return;
    setError('');
    const record = ensureAppraisal(teacher);
    openPage({ name: 'flow', teacherId: teacher.id, step: stepForStatus(record.status) === 'account' ? 'self' : stepForStatus(record.status) });
  };

  const onSaveSelf = (event: React.FormEvent) => {
    event.preventDefault();
    if (!appraisal) return;
    setError('');
    const standards = appraisal.standards.map((standard) => {
      const entry = selfScores[standard.standardId];
      return {
        ...standard,
        selfScore: entry?.score || 0,
        evidenceDescription: entry?.evidence.trim() || '',
      };
    });
    if (standards.some((standard) => standard.selfScore < 1 || !standard.evidenceDescription)) {
      setError('Score each standard from 1 to 5 and write the evidence.');
      return;
    }
    Storage.updateStaffAppraisal(appraisal.id, {
      standards,
      status: 'submitted_for_appraisal',
      submittedAt: new Date().toISOString(),
    });
    openPage({ name: 'flow', teacherId, step: 'observation' });
  };

  const onSaveObservation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!appraisal) return;
    setError('');
    const observation: LessonObservationRecord = {
      id: `obs-${Date.now()}`,
      date: obsDate,
      subject: obsSubject,
      grade: obsGrade,
      strandOrTopic: obsTopic.trim() || 'Classroom teaching session',
      observationScore: obsScore,
      strengths: obsStrengths.split('\n').map((line) => line.trim()).filter(Boolean),
      areasForGrowth: obsGrowth.split('\n').map((line) => line.trim()).filter(Boolean),
      observerName: currentUser.name,
    };
    Storage.updateStaffAppraisal(appraisal.id, {
      lessonObservations: [...appraisal.lessonObservations, observation],
      status: 'appraisal_meeting_pending',
    });
    setObsTopic('');
    setObsStrengths('');
    setObsGrowth('');
    openPage({ name: 'flow', teacherId, step: 'meeting' });
  };

  const onSaveMeeting = (event: React.FormEvent) => {
    event.preventDefault();
    if (!appraisal) return;
    setError('');
    let total = 0;
    const standards = appraisal.standards.map((standard) => {
      const entry = meetingScores[standard.standardId];
      const agreed = entry?.agreedScore || 0;
      total += agreed;
      return {
        ...standard,
        appraiserScore: entry?.appraiserScore || 0,
        agreedScore: agreed,
        appraiserRemarks: entry?.remarks.trim() || '',
      };
    });
    if (standards.some((standard) => standard.appraiserScore < 1 || standard.agreedScore < 1)) {
      setError('Enter an appraiser score and an agreed score for each standard.');
      return;
    }
    const percentage = Math.round((total / (standards.length * 5)) * 100);
    Storage.updateStaffAppraisal(appraisal.id, {
      standards,
      overallPercentage: percentage,
      performanceGrade: performanceGrade(percentage),
      appraiserName: currentUser.name,
      appraiserRole: currentUser.role,
      appraiserGeneralRemarks: meetingRemarks.trim(),
      tpdGapIdentified: tpdGap.trim(),
      targetInterventions: interventions.trim(),
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    openPage({ name: 'flow', teacherId, step: 'countersign' });
  };

  const onCountersign = (event: React.FormEvent) => {
    event.preventDefault();
    if (!appraisal) return;
    setError('');
    Storage.countersignStaffAppraisal(
      appraisal.id,
      `${currentUser.name} (${currentUser.designation || 'Head Teacher'})`,
      countersignRemarks.trim() || undefined,
    );
    setRevision((value) => value + 1);
  };

  const onSaveEdit = (event: React.FormEvent, user: User) => {
    event.preventDefault();
    setError('');
    const nextName = editName.trim();
    const nextEmail = uniqueUsername(buildUsername(nextName, domain), takenEmails(user.email));
    if (!nextName || !nextEmail) {
      setError('Type the staff member’s full name so the username can be created.');
      return;
    }
    const chosen = departments.find((item) => item.name === editDepartment);
    const teaching = chosen?.kind !== 'non_teaching';
    if (!editStaff.trim()) {
      setError('The staff number is required.');
      return;
    }
    const updates: Partial<User> = {
      name: nextName,
      email: nextEmail,
      staffNumber: editStaff.trim(),
      designation: editDesignation.trim() || (teaching ? 'Subject Teacher' : 'Staff'),
      department: editDepartment,
      assignedSubjects: teaching ? editSubjects : [],
      assignedActivities: teaching ? [] : editActivities,
    };
    const saved = Storage.updateUser(user.id, updates);
    if (saved) saveProvisionedAccount(saved);
    const linked = Storage.getStaffAppraisals().find((record) => record.teacherId === user.id);
    if (linked) {
      Storage.updateStaffAppraisal(linked.id, {
        teacherName: nextName,
        tscNumber: user.tscNumber || '',
        designation: updates.designation,
        department: editDepartment,
        subjectsTaught: teaching ? editSubjects : [],
      });
    }
    setEditingId('');
    setRevision((value) => value + 1);
  };

  const onDeleteTeacher = (user: User) => {
    const confirmed = window.confirm(`Delete ${user.name} and their appraisal dossier?`);
    if (!confirmed) return;
    Storage.getStaffAppraisals()
      .filter((record) => record.teacherId === user.id)
      .forEach((record) => Storage.deleteStaffAppraisal(record.id));
    removeProvisionedAccount(user.id);
    Storage.deleteUser(user.id);
    setEditingId('');
    if (teacherId === user.id) openPage({ name: 'list' });
    setRevision((value) => value + 1);
  };

  const beginEdit = (user: User) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditStaff(user.staffNumber || '');
    setEditDesignation(user.designation || 'Subject Teacher');
    setEditDepartment(user.department || departmentNames[0] || '');
    setEditSubjects(user.assignedSubjects || []);
    setEditActivities(user.assignedActivities || []);
  };

  const toggleAccountSubject = (subject: SubjectName) => {
    setAccountSubjects((current) => (
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    ));
  };

  const onSaveSubjects = () => {
    if (!teacher) return;
    const chosen = departments.find((item) => item.name === teacher.department);
    const teaching = chosen?.kind !== 'non_teaching';
    if (teaching && accountSubjects.length === 0) {
      setError('Choose at least one subject.');
      return;
    }
    if (!teaching && accountActivities.length === 0) {
      setError('Choose at least one activity.');
      return;
    }
    setError('');
    const saved = Storage.updateUser(teacher.id, {
      assignedSubjects: teaching ? accountSubjects : [],
      assignedActivities: teaching ? [] : accountActivities,
    });
    if (saved) saveProvisionedAccount(saved);
    if (appraisal && teaching) Storage.updateStaffAppraisal(appraisal.id, { subjectsTaught: accountSubjects });
    setRevision((value) => value + 1);
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}

      {page.name === 'list' && surface !== 'own' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{surface === 'appraisal' ? 'Appraisal' : 'Staff'}</h2>
              <p className="text-sm text-slate-600">
                {surface === 'appraisal'
                  ? 'Open a staff member for self-appraisal, lesson observation, the meeting, and countersign.'
                  : 'Add the staff account here. Appraisal continues in Staff Appraisal and on that person’s dashboard.'}
              </p>
            </div>
            {surface === 'staff' && (
            <button
              type="button"
              onClick={() => {
                setError('');
                openPage({ name: 'flow', teacherId: '', step: 'account' });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              <UserPlus className="h-4 w-4" />
              Add staff
            </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {teachers.map((user) => {
              const record = appraisals.find((item) => item.teacherId === user.id);
              return (
                <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      const next = record ? stepForStatus(record.status) : 'self';
                      openPage({
                        name: 'flow',
                        teacherId: user.id,
                        step: surface === 'staff' ? 'account' : (next === 'account' ? 'self' : next),
                      });
                    }}
                    className="w-full text-left"
                  >
                    <span className="block text-base font-extrabold text-slate-900">{user.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {user.email} · {user.password || 'Password set on the account'} · {user.staffNumber || 'No staff number'}
                    </span>
                    <span className="mt-1 block text-xs font-bold text-indigo-700">
                      {record ? STATUS_LABEL[record.status] : 'Appraisal not started'}
                    </span>
                  </button>
                  {editingId === user.id ? (
                    <form onSubmit={(event) => onSaveEdit(event, user)} className="mt-3 space-y-2">
                      <label htmlFor={`edit-teacher-name-${user.id}`} className="block text-xs font-bold text-slate-700">Full legal name</label>
                      <input id={`edit-teacher-name-${user.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                      <label htmlFor={`edit-teacher-staff-${user.id}`} className="block text-xs font-bold text-slate-700">Staff number</label>
                      <input id={`edit-teacher-staff-${user.id}`} value={editStaff} onChange={(event) => setEditStaff(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                      <label htmlFor={`edit-teacher-designation-${user.id}`} className="block text-xs font-bold text-slate-700">Designation</label>
                      <input id={`edit-teacher-designation-${user.id}`} value={editDesignation} onChange={(event) => setEditDesignation(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <label htmlFor={`edit-teacher-dept-${user.id}`} className="block text-xs font-bold text-slate-700">Department</label>
                      <select id={`edit-teacher-dept-${user.id}`} value={editDepartment} onChange={(event) => setEditDepartment(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                        {(editDepartment && !departmentNames.includes(editDepartment) ? [editDepartment, ...departmentNames] : departmentNames).map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <fieldset>
                        <legend className="text-xs font-bold text-slate-700">
                          {departments.find((item) => item.name === editDepartment)?.kind === 'non_teaching' ? 'Activities' : 'Subjects'}
                        </legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {(departments.find((item) => item.name === editDepartment)?.kind === 'non_teaching'
                            ? departments.find((item) => item.name === editDepartment)?.activities || []
                            : departments.find((item) => item.name === editDepartment)?.subjects || []
                          ).map((item) => (
                            <label key={item} className="flex items-center gap-2 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={departments.find((row) => row.name === editDepartment)?.kind === 'non_teaching' ? editActivities.includes(item) : editSubjects.includes(item as SubjectName)}
                                onChange={() => {
                                  const nonTeaching = departments.find((row) => row.name === editDepartment)?.kind === 'non_teaching';
                                  if (nonTeaching) {
                                    setEditActivities((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
                                  } else {
                                    const subject = item as SubjectName;
                                    setEditSubjects((current) => current.includes(subject) ? current.filter((value) => value !== subject) : [...current, subject]);
                                  }
                                }}
                              />
                              {item}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                        <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => beginEdit(user)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => onDeleteTeacher(user)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {page.name === 'flow' && (
        <section className="space-y-4">
          {surface !== 'own' && (
          <button type="button" onClick={() => { setError(''); openPage({ name: 'list' }); }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
            <ChevronLeft className="h-4 w-4" /> {surface === 'appraisal' ? 'Appraisal' : 'Staff'}
          </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{teacher ? teacher.name : 'Add staff'}</h2>
            <p className="text-sm text-slate-600">
              {surface === 'staff'
                ? 'Save the account here. Appraisal steps open in Staff Appraisal and on this person’s dashboard.'
                : 'Each step follows the staff appraisal workflow.'}
            </p>
          </div>
          {surface !== 'staff' && (
          <nav aria-label="Staff appraisal steps" className="grid gap-2 sm:grid-cols-4">
            {STEPS.filter((item) => item.id !== 'account').map((item) => {
              const index = stepIndex(item.id);
              const locked = index > openLimit;
              const current = item.id === step;
              const progress = appraisal?.status === 'countersigned' ? 5 : openLimit;
              const done = index < progress;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={locked}
                  onClick={() => goStep(item.id)}
                  className={`rounded-2xl border p-3 text-left ${
                    current ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
                  } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    {done && !current ? <Check className="h-3 w-3" /> : null}
                    Step {index + 1}
                  </span>
                  <span className="mt-1 block text-sm font-extrabold">{item.label}</span>
                </button>
              );
            })}
          </nav>
          )}

          {step === 'account' && !teacher && surface === 'staff' && (
            <form onSubmit={onCreateTeacher} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <label htmlFor="teacher-name" className="block text-xs font-bold text-slate-700">Full legal name</label>
              <input id="teacher-name" value={teacherName} onChange={(event) => setTeacherName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
              <label htmlFor="teacher-username" className="block text-xs font-bold text-slate-700">Username</label>
              <input id="teacher-username" value={username} readOnly placeholder="Username appears here" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="teacher-role" className="block text-xs font-bold text-slate-700">Account role</label>
              <input id="teacher-role" value="Staff" readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="teacher-password" className="block text-xs font-bold text-slate-700">Password</label>
              <input id="teacher-password" value={password} readOnly placeholder="Password appears here" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="teacher-staff" className="block text-xs font-bold text-slate-700">Staff number</label>
              <input
                id="teacher-staff"
                value={staffPreview}
                onChange={(event) => { setStaffEdited(true); setStaffNumber(event.target.value); }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <label htmlFor="teacher-designation" className="block text-xs font-bold text-slate-700">Designation</label>
              <input id="teacher-designation" value={designation} onChange={(event) => setDesignation(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label htmlFor="teacher-department" className="block text-xs font-bold text-slate-700">Department</label>
              <select id="teacher-department" value={selectedDepartment} onChange={(event) => setDepartment(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {departmentNames.length === 0 && <option value="">Add a department first</option>}
                {departmentNames.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {chosenDepartment?.kind === 'non_teaching' ? (
                <fieldset>
                  <legend className="text-xs font-bold text-slate-700">Activities</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {chosenDepartment.activities.map((activity) => (
                      <label key={activity} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={activities.includes(activity)} onChange={() => toggleActivity(activity)} />
                        {activity}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <fieldset>
                  <legend className="text-xs font-bold text-slate-700">Subjects</legend>
                  {!chosenDepartment?.kind && (
                    <p className="mt-2 text-xs text-slate-500">Open this department and choose teaching or non-teaching.</p>
                  )}
                  {chosenDepartment?.kind === 'teaching' && chosenDepartment.subjects.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">Open this department and choose the subjects it deals with.</p>
                  )}
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(chosenDepartment?.kind === 'teaching' ? chosenDepartment.subjects : []).map((subject) => (
                      <label key={subject} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={subjects.includes(subject as SubjectName)} onChange={() => toggleSubject(subject as SubjectName)} />
                        {subject}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                <ClipboardCheck className="h-4 w-4" />
                Save staff
              </button>
            </form>
          )}

          {step === 'account' && teacher && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-sm text-slate-700"><span className="font-bold">Username.</span> {teacher.email}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Password.</span> {teacher.password || 'Set on the account'}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Role.</span> {findSystemRole(teacher.role)?.name || 'Staff'}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Staff number.</span> {teacher.staffNumber || 'Not set'}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Designation.</span> {teacher.designation || 'Subject Teacher'}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Department.</span> {teacher.department || appraisal?.department || 'Not set'}</p>
              <fieldset>
                <legend className="text-xs font-bold text-slate-700">
                  {departments.find((item) => item.name === teacher.department)?.kind === 'non_teaching' ? 'Assign activities' : 'Assign subjects'}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(departments.find((item) => item.name === teacher.department)?.kind === 'non_teaching'
                    ? departments.find((item) => item.name === teacher.department)?.activities || []
                    : departments.find((item) => item.name === teacher.department)?.subjects || []
                  ).map((item) => {
                    const nonTeaching = departments.find((row) => row.name === teacher.department)?.kind === 'non_teaching';
                    return (
                      <label key={item} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={nonTeaching ? accountActivities.includes(item) : accountSubjects.includes(item as SubjectName)}
                          onChange={() => {
                            if (nonTeaching) {
                              setAccountActivities((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
                            } else {
                              toggleAccountSubject(item as SubjectName);
                            }
                          }}
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <button type="button" onClick={onSaveSubjects} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800">
                {departments.find((item) => item.name === teacher.department)?.kind === 'non_teaching' ? 'Save activities' : 'Save subjects'}
              </button>
              {surface === 'staff' ? (
                <p className="text-sm text-slate-600">Self-appraisal, lesson observation, the meeting, and countersign are in Staff Appraisal and on this person’s dashboard.</p>
              ) : (
              <button type="button" onClick={onContinueExisting} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                {appraisal && appraisal.status !== 'draft' ? 'Open the current appraisal step' : 'Start self-appraisal'}
              </button>
              )}
            </div>
          )}

          {step === 'self' && appraisal && (
            <form onSubmit={onSaveSelf} className="space-y-4">
              {appraisal.standards.map((standard) => (
                <div key={standard.standardId} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-extrabold text-slate-900">{standard.standardNumber}. {standard.standardTitle}</h3>
                  <ul className="list-disc pl-5 text-xs text-slate-500">
                    {standard.subStandards.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <label htmlFor={`self-score-${standard.standardId}`} className="block text-xs font-bold text-slate-700">Self score (1 inadequate to 5 exemplary)</label>
                  <select
                    id={`self-score-${standard.standardId}`}
                    value={selfScores[standard.standardId]?.score || 4}
                    onChange={(event) => setSelfScores((current) => ({
                      ...current,
                      [standard.standardId]: { score: Number(event.target.value), evidence: current[standard.standardId]?.evidence || '' },
                    }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                  <label htmlFor={`self-evidence-${standard.standardId}`} className="block text-xs font-bold text-slate-700">Evidence</label>
                  <textarea
                    id={`self-evidence-${standard.standardId}`}
                    value={selfScores[standard.standardId]?.evidence || ''}
                    onChange={(event) => setSelfScores((current) => ({
                      ...current,
                      [standard.standardId]: { score: current[standard.standardId]?.score || 4, evidence: event.target.value },
                    }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Submit self-appraisal</button>
            </form>
          )}

          {step === 'observation' && appraisal && (
            <form onSubmit={onSaveObservation} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              {appraisal.lessonObservations.length > 0 && (
                <ul className="space-y-2">
                  {appraisal.lessonObservations.map((item) => (
                    <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {item.date} · {item.subject} · Grade {item.grade} · {item.observationScore}% · {item.strandOrTopic}
                    </li>
                  ))}
                </ul>
              )}
              <label htmlFor="obs-date" className="block text-xs font-bold text-slate-700">Date</label>
              <input id="obs-date" type="date" value={obsDate} onChange={(event) => setObsDate(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
              <label htmlFor="obs-subject" className="block text-xs font-bold text-slate-700">Subject</label>
              <select id="obs-subject" value={obsSubject} onChange={(event) => setObsSubject(event.target.value as SubjectName)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {(appraisal.subjectsTaught.length ? appraisal.subjectsTaught : SUBJECTS).map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <label htmlFor="obs-grade" className="block text-xs font-bold text-slate-700">Grade</label>
              <select id="obs-grade" value={obsGrade} onChange={(event) => setObsGrade(Number(event.target.value) as GradeLevel)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
              </select>
              <label htmlFor="obs-topic" className="block text-xs font-bold text-slate-700">Strand or topic</label>
              <input id="obs-topic" value={obsTopic} onChange={(event) => setObsTopic(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
              <label htmlFor="obs-score" className="block text-xs font-bold text-slate-700">Observation score (%)</label>
              <input id="obs-score" type="number" min={0} max={100} value={obsScore} onChange={(event) => setObsScore(Number(event.target.value))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
              <label htmlFor="obs-strengths" className="block text-xs font-bold text-slate-700">Strengths, one per line</label>
              <textarea id="obs-strengths" value={obsStrengths} onChange={(event) => setObsStrengths(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label htmlFor="obs-growth" className="block text-xs font-bold text-slate-700">Areas for growth, one per line</label>
              <textarea id="obs-growth" value={obsGrowth} onChange={(event) => setObsGrowth(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Save observation and open the meeting</button>
            </form>
          )}

          {step === 'meeting' && appraisal && (
            <form onSubmit={onSaveMeeting} className="space-y-4">
              {appraisal.standards.map((standard) => (
                <div key={standard.standardId} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-extrabold text-slate-900">{standard.standardNumber}. {standard.standardTitle}</h3>
                  <p className="text-xs text-slate-500">Self score {standard.selfScore}/5. {standard.evidenceDescription}</p>
                  <label htmlFor={`appraiser-score-${standard.standardId}`} className="block text-xs font-bold text-slate-700">Appraiser score</label>
                  <select
                    id={`appraiser-score-${standard.standardId}`}
                    value={meetingScores[standard.standardId]?.appraiserScore || standard.selfScore || 4}
                    onChange={(event) => setMeetingScores((current) => ({
                      ...current,
                      [standard.standardId]: {
                        appraiserScore: Number(event.target.value),
                        agreedScore: current[standard.standardId]?.agreedScore || standard.selfScore || 4,
                        remarks: current[standard.standardId]?.remarks || '',
                      },
                    }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                  <label htmlFor={`agreed-score-${standard.standardId}`} className="block text-xs font-bold text-slate-700">Agreed score</label>
                  <select
                    id={`agreed-score-${standard.standardId}`}
                    value={meetingScores[standard.standardId]?.agreedScore || standard.selfScore || 4}
                    onChange={(event) => setMeetingScores((current) => ({
                      ...current,
                      [standard.standardId]: {
                        appraiserScore: current[standard.standardId]?.appraiserScore || standard.selfScore || 4,
                        agreedScore: Number(event.target.value),
                        remarks: current[standard.standardId]?.remarks || '',
                      },
                    }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                  <label htmlFor={`meeting-remarks-${standard.standardId}`} className="block text-xs font-bold text-slate-700">Appraiser remarks</label>
                  <input
                    id={`meeting-remarks-${standard.standardId}`}
                    value={meetingScores[standard.standardId]?.remarks || ''}
                    onChange={(event) => setMeetingScores((current) => ({
                      ...current,
                      [standard.standardId]: {
                        appraiserScore: current[standard.standardId]?.appraiserScore || standard.selfScore || 4,
                        agreedScore: current[standard.standardId]?.agreedScore || standard.selfScore || 4,
                        remarks: event.target.value,
                      },
                    }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <label htmlFor="meeting-general" className="block text-xs font-bold text-slate-700">General remarks</label>
              <textarea id="meeting-general" value={meetingRemarks} onChange={(event) => setMeetingRemarks(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label htmlFor="tpd-gap" className="block text-xs font-bold text-slate-700">TPD gap identified</label>
              <textarea id="tpd-gap" value={tpdGap} onChange={(event) => setTpdGap(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label htmlFor="interventions" className="block text-xs font-bold text-slate-700">Target interventions</label>
              <textarea id="interventions" value={interventions} onChange={(event) => setInterventions(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Complete the appraisal meeting</button>
            </form>
          )}

          {step === 'countersign' && appraisal && (
            <form onSubmit={onCountersign} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-700"><span className="font-bold">Staff member.</span> {appraisal.teacherName}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Department.</span> {appraisal.department}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Status.</span> {STATUS_LABEL[appraisal.status]}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Overall rating.</span> {appraisal.overallPercentage}% · {appraisal.performanceGrade}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Lesson observations.</span> {appraisal.lessonObservations.length}</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {appraisal.standards.map((standard) => (
                  <li key={standard.standardId}>
                    {standard.standardNumber}. {standard.standardTitle}: agreed {standard.agreedScore}/5
                  </li>
                ))}
              </ul>
              {appraisal.status === 'countersigned' ? (
                <p className="text-sm font-bold text-emerald-800">
                  Countersigned by {appraisal.countersigningOfficerName}. {appraisal.countersigningRemarks}
                </p>
              ) : (
                <>
                  <label htmlFor="countersign-remarks" className="block text-xs font-bold text-slate-700">Countersigning remarks</label>
                  <textarea id="countersign-remarks" value={countersignRemarks} onChange={(event) => setCountersignRemarks(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Countersign the dossier</button>
                </>
              )}
            </form>
          )}

          {step !== 'account' && !appraisal && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This staff member does not have an appraisal dossier yet. Add the person in Staff, then open these steps here.
            </p>
          )}
        </section>
      )}
    </div>
  );
};

export const OwnStaffAppraisal: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { currentTenant } = useTenant();
  return (
    <TeacherAppraisalPages
      schoolId={currentUser.schoolId || currentTenant.id}
      domain={currentTenant.domain}
      currentUser={currentUser}
      surface="own"
    />
  );
};

export const SchoolStaffAppraisal: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { currentTenant } = useTenant();
  return (
    <TeacherAppraisalPages
      schoolId={currentTenant.id}
      domain={currentTenant.domain}
      currentUser={currentUser}
      surface="appraisal"
    />
  );
};
