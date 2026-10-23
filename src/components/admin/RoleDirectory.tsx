import React, { useMemo, useState } from 'react';
import { SubjectName, User, UserRole } from '../../types';
import { rolePassword } from '../../utils/accountCredentials';
import { saveProvisionedAccount } from '../../utils/provisionedAccounts';
import {
  KeptRoleProfile,
  RoleSeat,
  RoleSeatHolder,
  assignUserToRole,
  assignUserToSeat,
  ensureRoleSeats,
  isDirectoryRole,
  keptProfile,
  openHolder,
  releaseRoleSeat,
  userInSchool,
} from '../../utils/roleSeatStore';
import { findSystemRole, listSystemRoles } from '../../utils/systemRoles';
import { listSchoolParents, listSchoolStudents } from '../../utils/schoolDirectoryStore';
import { Storage } from '../../utils/storage';
import { UserMinus, UserPlus } from 'lucide-react';

interface RoleDirectoryProps {
  schoolId: string;
  users: User[];
  onEdit: (user: User) => void;
  onChanged: (message: string) => void;
}

interface ActivityItem {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  label: string;
  detail: string;
}

function stamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function activitiesFor(seat: RoleSeat): ActivityItem[] {
  const ids = new Set(seat.holders.map((holder) => holder.userId));
  const items: ActivityItem[] = [];
  for (const log of Storage.getWorkEntryLogs()) {
    if (!ids.has(log.teacherId)) continue;
    items.push({
      id: `work-${log.id}`,
      at: log.timestamp || `${log.date}T${log.time || '00:00:00'}`,
      actorId: log.teacherId,
      actorName: log.teacherName,
      label: 'Work entry',
      detail: [log.subject, log.topicTaught, log.grade ? `Grade ${log.grade}` : ''].filter(Boolean).join(' · '),
    });
  }
  for (const appraisal of Storage.getStaffAppraisals()) {
    if (!ids.has(appraisal.teacherId)) continue;
    items.push({
      id: `appraisal-${appraisal.id}`,
      at: appraisal.updatedAt || appraisal.completedAt || appraisal.createdAt,
      actorId: appraisal.teacherId,
      actorName: appraisal.teacherName,
      label: 'Staff appraisal',
      detail: `${appraisal.status.replace(/_/g, ' ')} · ${appraisal.overallPercentage}%`,
    });
  }
  for (const pass of Storage.getGatePasses()) {
    if (!ids.has(pass.teacherId)) continue;
    items.push({
      id: `gate-${pass.id}`,
      at: pass.approvedAt || pass.departureDate || '',
      actorId: pass.teacherId,
      actorName: pass.teacherName,
      label: 'Gate pass',
      detail: `${pass.studentName} · ${pass.reason}`,
    });
  }
  for (const record of Storage.getAttendanceRecords()) {
    if (!ids.has(record.teacherId)) continue;
    const present = record.summary?.present ?? record.records.filter((row) => row.status === 'present').length;
    items.push({
      id: `attendance-${record.id}`,
      at: record.date,
      actorId: record.teacherId,
      actorName: record.teacherName,
      label: 'Attendance',
      detail: `Grade ${record.grade} ${record.stream} · ${present} present`,
    });
  }
  return items
    .filter((item) => item.at)
    .sort((a, b) => a.at.localeCompare(b.at));
}

function applyAccount(user: User, role: string, startedAt: string, inherited?: KeptRoleProfile): User | null {
  const roleDef = findSystemRole(role);
  const updates: Partial<User> = {
    role: role as UserRole,
    roleStartedAt: startedAt,
    roleReleasedAt: undefined,
    password: roleDef ? rolePassword(roleDef.passwordPrefix) : user.password,
  };
  if (inherited?.designation) updates.designation = inherited.designation;
  if (inherited?.department) updates.department = inherited.department;
  if (inherited && inherited.subjects.length > 0) updates.assignedSubjects = inherited.subjects as SubjectName[];
  const saved = Storage.updateUser(user.id, updates);
  if (saved) saveProvisionedAccount(saved);
  return saved;
}

function ProfileLines({ profile, title }: { profile: KeptRoleProfile; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <p className="font-bold text-slate-900">{title}</p>
      {profile.designation && <p>Designation: {profile.designation}</p>}
      {profile.department && <p>Department: {profile.department}</p>}
      {profile.gradeLabel && <p>Class: {profile.gradeLabel}</p>}
      {profile.subjects.length > 0 && <p>Subjects: {profile.subjects.join(', ')}</p>}
      {profile.tscNumber && <p>TSC number: {profile.tscNumber}</p>}
      {profile.staffNumber && <p>Staff number: {profile.staffNumber}</p>}
    </div>
  );
}

function SeatTimeline({ seat, current }: { seat: RoleSeat; current?: RoleSeatHolder }) {
  const items = activitiesFor(seat);
  const start = current?.startedAt || '';
  const before = start ? items.filter((item) => item.at < start) : items;
  const after = start ? items.filter((item) => item.at >= start) : [];
  const shownBefore = before.slice(-20);
  const previous = [...seat.holders].reverse().find((holder) => holder.endedAt);
  return (
    <div className="mt-3 space-y-2">
      {previous?.kept && (
        <ProfileLines profile={previous.kept} title={`Role data kept from ${previous.userName}`} />
      )}
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {shownBefore.length === 0 && !current && (
          <p className="text-xs text-slate-500">No activity has been recorded on this role yet. The seat still keeps its place.</p>
        )}
        {before.length > shownBefore.length && (
          <p className="text-[11px] text-slate-400">Showing the 20 records closest to the start point.</p>
        )}
        {shownBefore.map((item) => (
          <p key={item.id} className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{item.label}.</span> {item.actorName} · {stamp(item.at)}
            {item.detail ? ` · ${item.detail}` : ''}
          </p>
        ))}
        {current && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
            Started here · {current.userName} · {stamp(current.startedAt)}.
            {shownBefore.length > 0 ? ' Records above stayed on this role.' : ' Activity after this point belongs to this person.'}
          </p>
        )}
        {after.map((item) => (
          <p key={item.id} className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{item.label}.</span> {item.actorName} · {stamp(item.at)}
            {item.detail ? ` · ${item.detail}` : ''}
          </p>
        ))}
        {current && after.length === 0 && (
          <p className="text-xs text-slate-500">No new activity yet after this start point.</p>
        )}
      </div>
    </div>
  );
}

const STAFF_SOURCE_ROLES = ['teacher', 'class_teacher', 'hod', 'senior_teacher'];

export const RoleDirectory: React.FC<RoleDirectoryProps> = ({ schoolId, users, onEdit, onChanged }) => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moveRole, setMoveRole] = useState<Record<string, string>>({});
  const [assignUserId, setAssignUserId] = useState<Record<string, string>>({});
  const [peopleView, setPeopleView] = useState<'roles' | 'students' | 'parents'>('roles');
  const [addRole, setAddRole] = useState('');
  const [addStaffId, setAddStaffId] = useState('');
  const roles = listSystemRoles().filter((role) => isDirectoryRole(role.slug));
  const seats = useMemo(() => ensureRoleSeats(schoolId, users), [schoolId, users]);
  const schoolUsers = users.filter((user) => userInSchool(user, schoolId));
  const openIds = new Set(seats.map((seat) => openHolder(seat)?.userId).filter(Boolean) as string[]);
  const unassigned = schoolUsers.filter((user) => isDirectoryRole(user.role) && !openIds.has(user.id));
  const appraisalStaffIds = new Set(Storage.getStaffAppraisals().map((record) => record.teacherId));
  const staffPool = schoolUsers.filter((user) => STAFF_SOURCE_ROLES.includes(user.role) || appraisalStaffIds.has(user.id));
  const students = useMemo(() => (peopleView === 'students' ? listSchoolStudents(schoolId) : []), [peopleView, schoolId]);
  const parents = useMemo(() => (peopleView === 'parents' ? listSchoolParents(schoolId) : []), [peopleView, schoolId]);
  const studentName = (studentId: string) => students.find((student) => student.id === studentId)?.name
    || listSchoolStudents(schoolId).find((student) => student.id === studentId)?.name
    || 'Student';

  const visibleRoles = roles.filter((role) => {
    if (roleFilter !== 'all' && role.slug !== roleFilter) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    if (role.name.toLowerCase().includes(needle)) return true;
    return seats
      .filter((seat) => seat.role === role.slug)
      .some((seat) => seat.holders.some((holder) => holder.userName.toLowerCase().includes(needle) || holder.email.toLowerCase().includes(needle)));
  });

  const candidates = (seat: RoleSeat) => schoolUsers.filter((user) => isDirectoryRole(user.role) && openHolder(seat)?.userId !== user.id);

  const onRemove = (seat: RoleSeat, holder: RoleSeatHolder) => {
    const user = users.find((item) => item.id === holder.userId);
    if (!user) return;
    const confirmed = window.confirm(`Remove ${user.name} from this role? The role keeps their data and activities.`);
    if (!confirmed) return;
    releaseRoleSeat(schoolId, seat.id, keptProfile(user));
    const saved = Storage.updateUser(user.id, { roleReleasedAt: new Date().toISOString() });
    if (saved) saveProvisionedAccount(saved);
    onChanged(`${user.name} was removed from the role. Their records stayed on the seat.`);
  };

  const onAssignVacant = (seat: RoleSeat) => {
    const user = users.find((item) => item.id === assignUserId[seat.id]);
    if (!user) return;
    const previous = [...seat.holders].reverse().find((holder) => holder.kept);
    const assigned = assignUserToSeat(schoolId, seat.id, user, keptProfile(user));
    if (!assigned) return;
    const started = openHolder(assigned)?.startedAt || new Date().toISOString();
    applyAccount(user, seat.role, started, previous?.kept);
    onChanged(`${user.name} now holds this role. Earlier records stay visible, and their start point is marked.`);
  };

  const onMove = (seat: RoleSeat, holder: RoleSeatHolder) => {
    const role = moveRole[seat.id];
    const user = users.find((item) => item.id === holder.userId);
    if (!user || !role || role === seat.role) return;
    const assigned = assignUserToRole(schoolId, role, user, keptProfile(user));
    const started = openHolder(assigned)?.startedAt || new Date().toISOString();
    const previous = [...assigned.holders].reverse().find((item) => item.userId !== user.id && item.kept);
    applyAccount(user, role, started, previous?.kept);
    const roleName = roles.find((item) => item.slug === role)?.name || role;
    onChanged(`${user.name} was assigned to ${roleName}. The previous role kept its records.`);
  };

  const onAddStaffToRole = (event: React.FormEvent) => {
    event.preventDefault();
    const user = staffPool.find((item) => item.id === addStaffId);
    if (!user || !addRole) return;
    if (seats.some((seat) => seat.role === addRole && openHolder(seat)?.userId === user.id)) {
      onChanged(`${user.name} is already in that role.`);
      return;
    }
    const assigned = assignUserToRole(schoolId, addRole, user, keptProfile(user));
    const started = openHolder(assigned)?.startedAt || new Date().toISOString();
    const previous = [...assigned.holders].reverse().find((item) => item.userId !== user.id && item.kept);
    applyAccount(user, addRole, started, previous?.kept);
    const roleName = roles.find((item) => item.slug === addRole)?.name || addRole;
    setAddStaffId('');
    onChanged(`${user.name} was added to ${roleName} from the staff list.`);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Institutional User Directory</h2>
          <p className="text-xs text-slate-500">
            Add a staff member to a role from the staff list. Removing someone leaves that role’s records in place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPeopleView('students')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800">
            View students
          </button>
          <button type="button" onClick={() => setPeopleView('parents')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800">
            View all parents
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search role or name"
            aria-label="Search roles"
            className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
          >
            <option value="all">All staff roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.slug}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      {peopleView === 'roles' && (
        <form onSubmit={onAddStaffToRole} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="add-role" className="block text-xs font-bold text-slate-700">Role</label>
            <select id="add-role" value={addRole} onChange={(event) => setAddRole(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold" required>
              <option value="">Choose a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="add-staff" className="block text-xs font-bold text-slate-700">Staff member</label>
            <select id="add-staff" value={addStaffId} onChange={(event) => setAddStaffId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold" required>
              <option value="">Choose from staff</option>
              {staffPool.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
            <UserPlus className="h-3.5 w-3.5" /> Add user to this role
          </button>
        </form>
      )}

      {peopleView === 'students' && (
        <div className="space-y-3">
          <button type="button" onClick={() => setPeopleView('roles')} className="text-sm font-bold text-slate-600">Back to roles</button>
          <h3 className="text-base font-extrabold text-slate-900">Students</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map((student) => (
              <article key={student.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-extrabold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500">{student.email} · {student.admissionNumber}</p>
                <p className="text-xs text-slate-600">{student.className || `${student.gradeLabel} ${student.streamLabel}`}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {peopleView === 'parents' && (
        <div className="space-y-3">
          <button type="button" onClick={() => setPeopleView('roles')} className="text-sm font-bold text-slate-600">Back to roles</button>
          <h3 className="text-base font-extrabold text-slate-900">Parents</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {parents.map((parent) => (
              <article key={parent.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-extrabold text-slate-900">{parent.name}</p>
                <p className="text-xs text-slate-500">{parent.email}{parent.phone ? ` · ${parent.phone}` : ''}</p>
                <p className="text-xs text-slate-600">Parent of {studentName(parent.studentId)}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {peopleView === 'roles' && visibleRoles.map((role) => {
        const roleSeats = seats.filter((seat) => seat.role === role.slug);
        return (
          <div key={role.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-extrabold text-slate-900">{role.name}</h3>
            {roleSeats.length === 0 && <p className="text-xs text-slate-500">No one is assigned to this role.</p>}
            {roleSeats.map((seat) => {
              const current = openHolder(seat);
              const last = [...seat.holders].reverse().find((holder) => holder.endedAt);
              return (
                <article key={seat.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  {current ? (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{current.userName}</p>
                        <p className="text-xs text-slate-500">{current.email}</p>
                        <p className="text-xs font-bold text-emerald-800">In this role since {stamp(current.startedAt)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const account = users.find((user) => user.id === current.userId);
                            if (account) onEdit(account);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700"
                        >
                          Edit account
                        </button>
                        <button type="button" onClick={() => onRemove(seat, current)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700">
                          <UserMinus className="h-3.5 w-3.5" /> Remove from role
                        </button>
                        <label className="sr-only" htmlFor={`move-${seat.id}`}>Assign to a different role</label>
                        <select
                          id={`move-${seat.id}`}
                          value={moveRole[seat.id] || ''}
                          onChange={(event) => setMoveRole((currentRoles) => ({ ...currentRoles, [seat.id]: event.target.value }))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-bold"
                        >
                          <option value="">Assign to a different role</option>
                          {roles.filter((item) => item.slug !== role.slug).map((item) => (
                            <option key={item.id} value={item.slug}>{item.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => onMove(seat, current)} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white">
                          Assign
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Vacant</p>
                        <p className="text-xs text-slate-500">Data kept from {last?.userName || 'the previous holder'}.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`assign-${seat.id}`}>Assign a user to this role</label>
                        <select
                          id={`assign-${seat.id}`}
                          value={assignUserId[seat.id] || ''}
                          onChange={(event) => setAssignUserId((currentIds) => ({ ...currentIds, [seat.id]: event.target.value }))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-bold"
                        >
                          <option value="">Assign a user to this role</option>
                          {candidates(seat).map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => onAssignVacant(seat)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white">
                          <UserPlus className="h-3.5 w-3.5" /> Assign
                        </button>
                      </div>
                    </div>
                  )}
                  <SeatTimeline seat={seat} current={current} />
                </article>
              );
            })}
          </div>
        );
      })}

      {peopleView === 'roles' && unassigned.length > 0 && roleFilter === 'all' && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4">
          <h3 className="text-sm font-extrabold text-slate-900">Removed from a role</h3>
          <p className="mt-1 text-xs text-slate-500">These accounts remain. Their previous role still holds the data until someone is assigned to that seat.</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {unassigned.map((user) => (
              <li key={user.id}>{user.name} · {user.email}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
