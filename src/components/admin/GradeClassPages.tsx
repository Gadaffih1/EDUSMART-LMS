import React, { useMemo, useState } from 'react';
import { GradeLevel, StreamName, User, JUNIOR_STREAMS, PRIMARY_STREAMS } from '../../types';
import { STUDENT_RIGHTS, STUDENT_RIGHT_LABELS, StudentRecord, joinGradeStream } from '../../utils/schoolDirectoryStore';
import {
  buildUsername,
  nextRegistryNumber,
  rolePassword,
  uniqueUsername,
} from '../../utils/accountCredentials';
import { listProvisionedAccounts, removeProvisionedAccount, saveProvisionedAccount } from '../../utils/provisionedAccounts';
import {
  createGrade,
  createStream,
  ensureSchoolDirectory,
  getGrade,
  getStream,
  getStudentRecord,
  listAdmissionNumbers,
  listDirectoryEmails,
  listGrades,
  listStreams,
  listStudentParents,
  listStudents,
  saveStudentParent,
  saveStudentRecord,
  deleteGrade,
  deleteParentRecord,
  deleteStream,
  deleteStudentRecord,
  updateGrade,
  updateStream,
} from '../../utils/schoolDirectoryStore';
import { Storage } from '../../utils/storage';
import { ChevronLeft, GraduationCap, Pencil, Trash2, UserPlus } from 'lucide-react';

interface GradeClassPagesProps {
  schoolId: string;
  domain: string;
}

type Page =
  | { name: 'grades' }
  | { name: 'streams'; gradeId: string }
  | { name: 'students'; gradeId: string; streamId: string }
  | { name: 'student'; gradeId: string; streamId: string; studentId: string };

function gradeNumber(label: string): GradeLevel | undefined {
  const match = label.match(/\d+/);
  if (!match) return undefined;
  const value = Number(match[0]);
  if (value >= 1 && value <= 9) return value as GradeLevel;
  return undefined;
}

function knownStream(name: string): StreamName | undefined {
  return [...PRIMARY_STREAMS, ...JUNIOR_STREAMS].find((stream) => stream.toLowerCase() === name.toLowerCase());
}

export const GradeClassPages: React.FC<GradeClassPagesProps> = ({ schoolId, domain }) => {
  const pageKey = `edusmart_grade_page:${schoolId}`;
  const [page, setPage] = useState<Page>(() => {
    try {
      const stored = sessionStorage.getItem(pageKey);
      if (stored) return JSON.parse(stored) as Page;
    } catch {
      // Start on the grades list.
    }
    return { name: 'grades' };
  });
  const openPage = (next: Page) => {
    sessionStorage.setItem(pageKey, JSON.stringify(next));
    setPage(next);
  };
  const [revision, setRevision] = useState(0);
  const [gradeName, setGradeName] = useState('');
  const [streamName, setStreamName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [admissionEdited, setAdmissionEdited] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [error, setError] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editAdmission, setEditAdmission] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const directory = useMemo(() => {
    ensureSchoolDirectory(schoolId);
    return {
      grades: listGrades(schoolId),
      streams: page.name === 'grades' ? [] : listStreams(page.gradeId),
      students: page.name === 'students' || page.name === 'student' ? listStudents(page.streamId) : [],
      parents: page.name === 'student' ? listStudentParents(page.studentId) : [],
    };
  }, [schoolId, page, revision]);

  const grade = page.name === 'grades' ? undefined : getGrade(page.gradeId);
  const stream = page.name === 'students' || page.name === 'student' ? getStream(page.streamId) : undefined;
  const student = page.name === 'student' ? getStudentRecord(page.studentId) : undefined;

  const takenEmails = () => [
    ...Storage.getUsers().map((user) => user.email),
    ...listProvisionedAccounts().map((user) => user.email),
    ...listDirectoryEmails(),
  ];

  const studentUsername = studentName.trim()
    ? uniqueUsername(buildUsername(studentName, domain), takenEmails())
    : '';
  const studentPassword = studentUsername ? rolePassword('st') : '';
  const suggestedAdmission = studentUsername
    ? nextRegistryNumber('ADM', new Date().getFullYear(), [
        ...Storage.getUsers().map((user) => user.admissionNumber || ''),
        ...listAdmissionNumbers(),
      ])
    : '';
  const admissionPreview = admissionEdited ? admissionNumber : suggestedAdmission;

  const parentUsername = parentName.trim()
    ? uniqueUsername(buildUsername(parentName, domain), takenEmails())
    : '';
  const parentPassword = parentUsername ? rolePassword('pa') : '';
  const streamPreview = grade && streamName.trim() ? joinGradeStream(grade.name, streamName) : '';

  const refresh = () => setRevision((value) => value + 1);

  const onCreateGrade = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const created = createGrade(schoolId, gradeName);
      setGradeName('');
      refresh();
      openPage({ name: 'streams', gradeId: created.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The grade could not be created.');
    }
  };

  const onCreateStream = (event: React.FormEvent) => {
    event.preventDefault();
    if (!grade) return;
    setError('');
    try {
      const created = createStream(schoolId, grade, streamName);
      setStreamName('');
      refresh();
      openPage({ name: 'students', gradeId: grade.id, streamId: created.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The stream could not be created.');
    }
  };

  const onCreateStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!grade || !stream) return;
    setError('');
    if (!studentUsername || !studentPassword || !admissionPreview) {
      setError('Type the student full name so the username, password, and admission number can be created.');
      return;
    }
    const record: StudentRecord = {
      id: `stu-${Date.now()}`,
      schoolId,
      gradeId: grade.id,
      streamId: stream.id,
      name: studentName.trim(),
      email: studentUsername,
      password: studentPassword,
      admissionNumber: admissionPreview.trim(),
      phone: '',
      upiNumber: '',
      gradeLabel: grade.name,
      streamLabel: stream.name,
      className: stream.displayName,
      isActive: true,
      createdAt: new Date().toISOString(),
      rights: { ...STUDENT_RIGHTS, ...Storage.getRolePermissions().student },
    };
    const account: User = {
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      role: 'student',
      schoolId,
      isActive: true,
      grade: gradeNumber(grade.name),
      stream: knownStream(stream.name),
      admissionNumber: record.admissionNumber,
      designation: 'Student / Learner',
    };
    saveStudentRecord(record);
    setStudentName('');
    setAdmissionNumber('');
    setAdmissionEdited(false);
    setShowStudentForm(false);
    refresh();
    openPage({ name: 'student', gradeId: grade.id, streamId: stream.id, studentId: record.id });
    Storage.addUser(account);
    saveProvisionedAccount(account);
  };

  const onCreateParent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!student) return;
    setError('');
    if (!parentUsername || !parentPassword) {
      setError('Type the parent full name so the username and password can be created.');
      return;
    }
    const parent = saveStudentParent({
      id: `parent-${student.id}-${Date.now()}`,
      schoolId,
      studentId: student.id,
      name: parentName.trim(),
      email: parentUsername,
      password: parentPassword,
      phone: parentPhone.trim(),
      relationship: 'Parent',
      createdAt: new Date().toISOString(),
    });
    const account: User = {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      password: parent.password,
      role: 'parent',
      schoolId,
      isActive: true,
      phone: parent.phone || undefined,
      childrenIds: [student.id],
      designation: 'Parent / Guardian',
    };
    Storage.addUser(account);
    saveProvisionedAccount(account);
    setParentName('');
    setParentPhone('');
    setEditingId('');
    refresh();
  };

  const beginEdit = (id: string, name: string, admission = '', phone = '') => {
    setError('');
    setEditingId(id);
    setEditName(name);
    setEditAdmission(admission);
    setEditPhone(phone);
  };

  const forgetAccounts = (ids: string[]) => {
    ids.forEach((id) => {
      Storage.deleteUser(id);
      removeProvisionedAccount(id);
    });
  };

  const onSaveGrade = (event: React.FormEvent, id: string) => {
    event.preventDefault();
    setError('');
    try {
      updateGrade(id, editName);
      setEditingId('');
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The grade could not be updated.');
    }
  };

  const onSaveStream = (event: React.FormEvent, id: string) => {
    event.preventDefault();
    setError('');
    try {
      updateStream(id, editName);
      setEditingId('');
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The stream could not be updated.');
    }
  };

  const onSaveStudent = (event: React.FormEvent, item: StudentRecord) => {
    event.preventDefault();
    setError('');
    const name = editName.trim();
    const email = uniqueUsername(
      buildUsername(name, domain),
      takenEmails().filter((address) => address.toLowerCase() !== item.email.toLowerCase()),
    );
    if (!name || !email) {
      setError('Type the student full name so the username can be updated.');
      return;
    }
    const next: StudentRecord = {
      ...item,
      name,
      email,
      admissionNumber: editAdmission.trim() || item.admissionNumber,
    };
    saveStudentRecord(next);
    const account: User = {
      id: next.id,
      name: next.name,
      email: next.email,
      password: next.password,
      role: 'student',
      schoolId,
      isActive: next.isActive,
      grade: gradeNumber(next.gradeLabel),
      stream: knownStream(next.streamLabel),
      admissionNumber: next.admissionNumber,
      designation: 'Student / Learner',
    };
    Storage.addUser(account);
    saveProvisionedAccount(account);
    setEditingId('');
    refresh();
  };

  const onSaveParent = (event: React.FormEvent, parentId: string, studentId: string, password: string) => {
    event.preventDefault();
    setError('');
    const current = directory.parents.find((parent) => parent.id === parentId);
    if (!current) return;
    const name = editName.trim();
    const email = uniqueUsername(
      buildUsername(name, domain),
      takenEmails().filter((address) => address.toLowerCase() !== current.email.toLowerCase()),
    );
    if (!name || !email) {
      setError('Type the parent full name so the username can be updated.');
      return;
    }
    const parent = saveStudentParent({
      ...current,
      name,
      email,
      phone: editPhone.trim(),
      password,
    });
    Storage.addUser({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      password: parent.password,
      role: 'parent',
      schoolId,
      isActive: true,
      phone: parent.phone || undefined,
      childrenIds: [studentId],
      designation: 'Parent / Guardian',
    });
    saveProvisionedAccount({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      password: parent.password,
      role: 'parent',
      schoolId,
      isActive: true,
      phone: parent.phone || undefined,
      childrenIds: [studentId],
    });
    setEditingId('');
    refresh();
  };

  const onDeleteGrade = (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? Its streams, students, and their sign-in accounts are removed.`)) return;
    forgetAccounts(deleteGrade(id));
    setEditingId('');
    refresh();
    if (page.name !== 'grades' && 'gradeId' in page && page.gradeId === id) openPage({ name: 'grades' });
  };

  const onDeleteStream = (id: string, name: string, gradeId: string) => {
    if (!window.confirm(`Delete ${name}? Students in this stream and their sign-in accounts are removed.`)) return;
    forgetAccounts(deleteStream(id));
    setEditingId('');
    refresh();
    if ((page.name === 'students' || page.name === 'student') && page.streamId === id) {
      openPage({ name: 'streams', gradeId });
    }
  };

  const onDeleteStudent = (id: string, name: string, gradeId: string, streamId: string) => {
    if (!window.confirm(`Delete ${name}? The student, linked parents, and their sign-in accounts are removed.`)) return;
    forgetAccounts(deleteStudentRecord(id));
    setEditingId('');
    refresh();
    if (page.name === 'student' && page.studentId === id) openPage({ name: 'students', gradeId, streamId });
  };

  const onDeleteParent = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this student?`)) return;
    deleteParentRecord(id);
    forgetAccounts([id]);
    setEditingId('');
    refresh();
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}

      {page.name === 'grades' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Grades</h2>
            <p className="text-sm text-slate-600">Create a grade, then open it to add streams.</p>
          </div>
          <form onSubmit={onCreateGrade} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <label htmlFor="grade-name" className="block text-xs font-bold text-slate-700">Grade name</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="grade-name"
                value={gradeName}
                onChange={(event) => setGradeName(event.target.value)}
                placeholder="Grade 1 or Year 1"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                <GraduationCap className="h-4 w-4" />
                Create grade
              </button>
            </div>
          </form>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directory.grades.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    openPage({ name: 'streams', gradeId: item.id });
                  }}
                  className="w-full text-left"
                >
                  <span className="block text-base font-extrabold text-slate-900">{item.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{listStreams(item.id).length} streams</span>
                </button>
                {editingId === item.id ? (
                  <form onSubmit={(event) => onSaveGrade(event, item.id)} className="mt-3 space-y-2">
                    <label htmlFor={`edit-grade-${item.id}`} className="block text-xs font-bold text-slate-700">Grade name</label>
                    <input id={`edit-grade-${item.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                      <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => beginEdit(item.id, item.name)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => onDeleteGrade(item.id, item.name)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {page.name === 'streams' && grade && (
        <section className="space-y-4">
          <button type="button" onClick={() => { setError(''); openPage({ name: 'grades' }); }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
            <ChevronLeft className="h-4 w-4" /> Grades
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{grade.name}</h2>
            <p className="text-sm text-slate-600">Add a stream. The class name joins the grade and the stream.</p>
          </div>
          <form onSubmit={onCreateStream} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <label htmlFor="stream-name" className="block text-xs font-bold text-slate-700">Stream name</label>
            <input
              id="stream-name"
              value={streamName}
              onChange={(event) => setStreamName(event.target.value)}
              placeholder="Love"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <label htmlFor="stream-preview" className="block text-xs font-bold text-slate-700">Class name</label>
            <input
              id="stream-preview"
              value={streamPreview}
              readOnly
              placeholder="Class name appears here"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Add stream</button>
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            {directory.streams.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    openPage({ name: 'students', gradeId: grade.id, streamId: item.id });
                  }}
                  className="w-full text-left"
                >
                  <span className="block text-base font-extrabold text-slate-900">{item.displayName}</span>
                  <span className="mt-1 block text-xs text-slate-500">Stream {item.name} · {listStudents(item.id).length} students</span>
                </button>
                {editingId === item.id ? (
                  <form onSubmit={(event) => onSaveStream(event, item.id)} className="mt-3 space-y-2">
                    <label htmlFor={`edit-stream-${item.id}`} className="block text-xs font-bold text-slate-700">Stream name</label>
                    <input id={`edit-stream-${item.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                    <p className="text-xs text-slate-500">{joinGradeStream(grade.name, editName || item.name)}</p>
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                      <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => beginEdit(item.id, item.name)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => onDeleteStream(item.id, item.displayName, grade.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {page.name === 'students' && grade && stream && (
        <section className="space-y-4">
          <button type="button" onClick={() => { setError(''); openPage({ name: 'streams', gradeId: grade.id }); }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
            <ChevronLeft className="h-4 w-4" /> {grade.name}
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{stream.displayName}</h2>
              <p className="text-sm text-slate-600">Open a student, or add one with the button.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setShowStudentForm((open) => !open);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
            >
              <UserPlus className="h-4 w-4" />
              {showStudentForm ? 'Close add student' : 'Add student'}
            </button>
          </div>
          {showStudentForm && (
          <form onSubmit={onCreateStudent} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <label htmlFor="student-name" className="block text-xs font-bold text-slate-700">Full legal name</label>
            <input id="student-name" value={studentName} onChange={(event) => { setStudentName(event.target.value); setAdmissionEdited(false); }} placeholder="Mary Wanjiku Kamau" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <label htmlFor="student-username" className="block text-xs font-bold text-slate-700">Username</label>
            <input id="student-username" value={studentUsername} readOnly placeholder="Username appears here as you type the full name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <label htmlFor="student-role" className="block text-xs font-bold text-slate-700">Account role</label>
            <input id="student-role" value={studentUsername ? 'Student / Learner' : ''} readOnly placeholder="Student role appears with the name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <label htmlFor="student-password" className="block text-xs font-bold text-slate-700">Password</label>
            <input id="student-password" value={studentPassword} readOnly placeholder="Password appears after the name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <label htmlFor="student-admission" className="block text-xs font-bold text-slate-700">Admission number</label>
            <input
              id="student-admission"
              value={admissionPreview}
              onChange={(event) => { setAdmissionEdited(true); setAdmissionNumber(event.target.value); }}
              placeholder="Admission number appears after the name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
            />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
              <UserPlus className="h-4 w-4" /> Save student
            </button>
          </form>
          )}
          <div className="grid gap-3">
            {directory.students.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    openPage({ name: 'student', gradeId: grade.id, streamId: stream.id, studentId: item.id });
                  }}
                  className="w-full text-left"
                >
                  <span className="block font-extrabold text-slate-900">{item.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{item.admissionNumber || 'No admission number'} · {item.email}</span>
                </button>
                {editingId === item.id ? (
                  <form onSubmit={(event) => onSaveStudent(event, item)} className="mt-3 space-y-2">
                    <label htmlFor={`edit-student-${item.id}`} className="block text-xs font-bold text-slate-700">Full legal name</label>
                    <input id={`edit-student-${item.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                    <label htmlFor={`edit-admission-${item.id}`} className="block text-xs font-bold text-slate-700">Admission number</label>
                    <input id={`edit-admission-${item.id}`} value={editAdmission} onChange={(event) => setEditAdmission(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm" />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                      <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => beginEdit(item.id, item.name, item.admissionNumber)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => onDeleteStudent(item.id, item.name, grade.id, stream.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {page.name === 'student' && grade && stream && student && (
        <section className="space-y-4">
          <button type="button" onClick={() => { setError(''); openPage({ name: 'students', gradeId: grade.id, streamId: stream.id }); }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
            <ChevronLeft className="h-4 w-4" /> {stream.displayName}
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{student.className}</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{student.name}</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => beginEdit(student.id, student.name, student.admissionNumber)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => onDeleteStudent(student.id, student.name, grade.id, stream.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
            {editingId === student.id && (
              <form onSubmit={(event) => onSaveStudent(event, student)} className="mt-4 space-y-2">
                <label htmlFor="edit-overview-name" className="block text-xs font-bold text-slate-700">Full legal name</label>
                <input id="edit-overview-name" value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                <label htmlFor="edit-overview-admission" className="block text-xs font-bold text-slate-700">Admission number</label>
                <input id="edit-overview-admission" value={editAdmission} onChange={(event) => setEditAdmission(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm" />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                  <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                </div>
              </form>
            )}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Username', student.email],
                ['Password', student.password],
                ['Admission number', student.admissionNumber],
                ['Grade', student.gradeLabel],
                ['Stream', student.streamLabel],
                ['Class', student.className],
                ['Status', student.isActive ? 'Active' : 'Inactive'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900">Student rights</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {STUDENT_RIGHT_LABELS.map((right) => {
                const allowed = Boolean(student.rights[right.key]);
                return (
                  <li key={right.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <span>{right.label}</span>
                    <span className={allowed ? 'font-bold text-emerald-700' : 'font-bold text-slate-400'}>{allowed ? 'Allowed' : 'Off'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Parents</h3>
            {directory.parents.length === 0 && <p className="text-sm text-slate-500">No parent is linked to this student yet.</p>}
            <ul className="space-y-2">
              {directory.parents.map((parent) => (
                <li key={parent.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{parent.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-600">{parent.email} · {parent.password}{parent.phone ? ` · ${parent.phone}` : ''}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => beginEdit(parent.id, parent.name, '', parent.phone)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => onDeleteParent(parent.id, parent.name)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                  {editingId === parent.id && (
                    <form onSubmit={(event) => onSaveParent(event, parent.id, student.id, parent.password)} className="mt-3 space-y-2">
                      <label htmlFor={`edit-parent-${parent.id}`} className="block text-xs font-bold text-slate-700">Full legal name</label>
                      <input id={`edit-parent-${parent.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                      <label htmlFor={`edit-parent-phone-${parent.id}`} className="block text-xs font-bold text-slate-700">Phone</label>
                      <input id={`edit-parent-phone-${parent.id}`} value={editPhone} onChange={(event) => setEditPhone(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                        <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={onCreateParent} className="space-y-3 border-t border-slate-200 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Add a parent</h4>
              <label htmlFor="parent-name" className="block text-xs font-bold text-slate-700">Full legal name</label>
              <input id="parent-name" value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="Jane Wanjiku" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <label htmlFor="parent-username" className="block text-xs font-bold text-slate-700">Username</label>
              <input id="parent-username" value={parentUsername} readOnly placeholder="Username appears here as you type the full name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="parent-role" className="block text-xs font-bold text-slate-700">Account role</label>
              <input id="parent-role" value={parentUsername ? 'Parent / Guardian' : ''} readOnly placeholder="Parent role appears with the name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="parent-password" className="block text-xs font-bold text-slate-700">Password</label>
              <input id="parent-password" value={parentPassword} readOnly placeholder="Password appears after the name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <label htmlFor="parent-phone" className="block text-xs font-bold text-slate-700">Phone</label>
              <input id="parent-phone" value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Add parent</button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};
