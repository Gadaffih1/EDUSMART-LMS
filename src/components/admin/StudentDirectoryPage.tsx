import React, { useMemo, useState } from 'react';
import { StudentRecord } from '../../utils/schoolDirectoryStore';
import { buildUsername, uniqueUsername } from '../../utils/accountCredentials';
import { removeProvisionedAccount, saveProvisionedAccount } from '../../utils/provisionedAccounts';
import {
  deleteStudentRecord,
  ensureSchoolDirectory,
  listSchoolStudents,
  listStreams,
  saveStudentRecord,
} from '../../utils/schoolDirectoryStore';
import { Storage } from '../../utils/storage';
import { User } from '../../types';
import { Pencil, Trash2 } from 'lucide-react';

interface StudentDirectoryPageProps {
  schoolId: string;
  domain: string;
}

export const StudentDirectoryPage: React.FC<StudentDirectoryPageProps> = ({ schoolId, domain }) => {
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editAdmission, setEditAdmission] = useState('');
  const [editStreamId, setEditStreamId] = useState('');

  const directory = useMemo(() => {
    ensureSchoolDirectory(schoolId);
    return {
      students: listSchoolStudents(schoolId),
      streams: listStreamsForSchool(schoolId),
    };
  }, [schoolId, revision]);

  const classes = [...new Set(directory.students.map((student) => student.className).filter(Boolean))].sort();
  const visible = directory.students.filter((student) => {
    if (classFilter !== 'all' && student.className !== classFilter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [student.name, student.email, student.admissionNumber, student.className]
      .some((value) => value.toLowerCase().includes(needle));
  });

  const refresh = () => setRevision((value) => value + 1);

  const takenEmails = (except = '') => [
    ...Storage.getUsers().map((user) => user.email),
    ...listSchoolStudents(schoolId).map((student) => student.email),
  ].filter((email) => email.toLowerCase() !== except.toLowerCase());

  const beginEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditAdmission(student.admissionNumber);
    setEditStreamId(student.streamId);
    setError('');
  };

  const onSave = (event: React.FormEvent, student: StudentRecord) => {
    event.preventDefault();
    setError('');
    const name = editName.trim();
    const email = uniqueUsername(buildUsername(name, domain), takenEmails(student.email));
    if (!name || !email) {
      setError('Type the student full name so the username can be updated.');
      return;
    }
    const stream = directory.streams.find((item) => item.id === editStreamId);
    const next: StudentRecord = {
      ...student,
      name,
      email,
      admissionNumber: editAdmission.trim() || student.admissionNumber,
      streamId: stream?.id || student.streamId,
      gradeId: stream?.gradeId || student.gradeId,
      streamLabel: stream?.name || student.streamLabel,
      className: stream?.displayName || student.className,
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
      admissionNumber: next.admissionNumber,
      className: next.className,
      designation: 'Student / Learner',
    };
    Storage.addUser(account);
    saveProvisionedAccount(account);
    setEditingId('');
    refresh();
  };

  const onDelete = (student: StudentRecord) => {
    const confirmed = window.confirm(`Delete ${student.name} and their sign-in?`);
    if (!confirmed) return;
    const ids = deleteStudentRecord(student.id);
    ids.forEach((id) => {
      Storage.deleteUser(id);
      removeProvisionedAccount(id);
    });
    if (editingId === student.id) setEditingId('');
    refresh();
  };

  return (
    <section className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>
      )}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Students</h2>
        <p className="text-sm text-slate-600">Filter by class, search, and open each learner’s email and password.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or admission number"
          aria-label="Search students"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          aria-label="Filter by class"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
        >
          <option value="all">All classes</option>
          {classes.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((student) => (
          <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-base font-extrabold text-slate-900">{student.name}</p>
            <p className="mt-1 text-xs font-bold text-indigo-700">{student.className}</p>
            <p className="mt-2 text-xs text-slate-600">Email: {student.email}</p>
            <p className="text-xs text-slate-600">Password: {student.password}</p>
            <p className="text-xs text-slate-500">{student.admissionNumber}</p>
            {editingId === student.id ? (
              <form onSubmit={(event) => onSave(event, student)} className="mt-3 space-y-2">
                <label htmlFor={`student-name-${student.id}`} className="block text-xs font-bold text-slate-700">Full legal name</label>
                <input id={`student-name-${student.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                <label htmlFor={`student-adm-${student.id}`} className="block text-xs font-bold text-slate-700">Admission number</label>
                <input id={`student-adm-${student.id}`} value={editAdmission} onChange={(event) => setEditAdmission(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                <label htmlFor={`student-class-${student.id}`} className="block text-xs font-bold text-slate-700">Class</label>
                <select id={`student-class-${student.id}`} value={editStreamId} onChange={(event) => setEditStreamId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {directory.streams.map((stream) => <option key={stream.id} value={stream.id}>{stream.displayName}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                  <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => beginEdit(student)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => onDelete(student)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {visible.length === 0 && <p className="text-sm text-slate-500">No students match this class or search.</p>}
    </section>
  );
};

function listStreamsForSchool(schoolId: string) {
  const directory = ensureSchoolDirectory(schoolId);
  return directory.grades.flatMap((grade) => listStreams(grade.id));
}
