import React, { useEffect, useMemo, useState } from 'react';
import { SchoolDepartment } from '../../utils/departmentStore';
import { listActivities, listSubjects } from '../../utils/catalogStore';
import {
  createDepartment,
  deleteDepartment,
  ensureDepartments,
  linkDepartmentHod,
  listDepartments,
  saveDepartmentChoice,
  updateDepartment,
} from '../../utils/departmentStore';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';
import { ttApiFetch } from '../timetable/timetableTypes';
import { AlertTriangle, ChevronLeft, Pencil, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { User } from '../../types';

interface DepartmentPagesProps {
  schoolId: string;
}

type Panel = 'department' | 'subjects' | 'activities';
type Page = { name: 'list' } | { name: 'open'; departmentId: string; panel: Panel };

const HOD_ELIGIBLE_ROLES = new Set([
  'hod',
  'senior_teacher',
  'teacher',
  'class_teacher',
  'dean_of_studies',
  'deputy_head',
  'curriculum_coordinator',
  'librarian',
  'school_admin_staff',
  'admin',
  'head_teacher',
]);

function isHodUser(user: User): boolean {
  return user.role === 'hod' || (Array.isArray(user.assignedRoles) && user.assignedRoles.includes('hod'));
}

export const DepartmentPages: React.FC<DepartmentPagesProps> = ({ schoolId }) => {
  const pageKey = `edusmart_department_page:${schoolId}`;
  const [page, setPage] = useState<Page>({ name: 'list' });
  const [revision, setRevision] = useState(0);
  const [name, setName] = useState('');
  const [newHodUserId, setNewHodUserId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editHodUserId, setEditHodUserId] = useState('');
  const [draftSubjects, setDraftSubjects] = useState<string[]>([]);
  const [draftActivities, setDraftActivities] = useState<string[]>([]);

  useEffect(() => {
    const stored = ClientDataStore.getPreference<Page | null>(pageKey, null);
    if (stored && (stored.name === 'list' || stored.name === 'open')) {
      setPage(stored);
    }
  }, [pageKey]);

  const openPage = (next: Page) => {
    ClientDataStore.setPreference(pageKey, next);
    setPage(next);
  };

  const tenantUsers = useMemo(() => {
    return Storage.getUsers().filter(
      (u) => u.schoolId === schoolId || (!u.schoolId && schoolId === 'tenant-riara')
    );
  }, [schoolId, revision]);

  const hodCandidates = useMemo(() => {
    const eligible = tenantUsers.filter((u) => {
      if (u.role === 'student' || u.role === 'parent') return false;
      const assigned = Array.isArray(u.assignedRoles) ? u.assignedRoles : [];
      return HOD_ELIGIBLE_ROLES.has(u.role) || assigned.some((r) => HOD_ELIGIBLE_ROLES.has(r));
    });
    return eligible.sort((a, b) => {
      const aHod = isHodUser(a) ? 0 : 1;
      const bHod = isHodUser(b) ? 0 : 1;
      if (aHod !== bHod) return aHod - bHod;
      return a.name.localeCompare(b.name);
    });
  }, [tenantUsers]);

  const departments = useMemo(() => {
    ensureDepartments(schoolId);
    const list = listDepartments(schoolId);
    // Resolve display HoD if linked via user.department when not yet persisted on the department row
    return list.map((dept) => {
      if (dept.hodUserId) {
        const matched = tenantUsers.find((u) => u.id === dept.hodUserId);
        return {
          ...dept,
          hodName: matched?.name || dept.hodName || '',
        };
      }
      const autoHod = tenantUsers.find(
        (u) => isHodUser(u) && String(u.department || '').trim().toLowerCase() === dept.name.trim().toLowerCase()
      );
      if (autoHod) {
        return {
          ...dept,
          hodUserId: autoHod.id,
          hodName: autoHod.name,
        };
      }
      return dept;
    });
  }, [schoolId, revision, tenantUsers]);

  const subjects = useMemo(() => listSubjects(), [revision]);
  const activities = useMemo(() => listActivities(), [revision]);
  const refresh = () => setRevision((value) => value + 1);
  const opened = page.name === 'open' ? departments.find((item) => item.id === page.departmentId) : undefined;

  useEffect(() => {
    if (!opened) return;
    setDraftSubjects(opened.subjects);
    setDraftActivities(opened.activities);
  }, [opened?.id, opened?.subjects.join('|'), opened?.activities.join('|')]);

  const syncUserAsDepartmentHod = (deptName: string, hodUserId: string) => {
    if (!hodUserId) return null;
    const hodUser = tenantUsers.find((u) => u.id === hodUserId);
    if (!hodUser) return null;
    const existingAssigned = Array.isArray(hodUser.assignedRoles) ? hodUser.assignedRoles : [];
    const nextAssigned =
      hodUser.role === 'hod' || existingAssigned.includes('hod')
        ? existingAssigned
        : [...existingAssigned, 'hod' as const];
    Storage.updateUser(hodUser.id, {
      department: deptName,
      assignedRoles: nextAssigned,
    });
    return hodUser;
  };

  const syncBackendTimetableDepartment = async (
    previousName: string,
    nextName: string,
    hodUserId: string,
    headName: string
  ) => {
    try {
      const ws = await ttApiFetch<{ departments?: Array<{ id: string; name: string }> }>('/api/timetable/workspace');
      const existing = (ws?.departments || []).find(
        (d) =>
          d.name.toLowerCase() === previousName.toLowerCase() ||
          d.name.toLowerCase() === nextName.toLowerCase()
      );
      if (existing) {
        await ttApiFetch(`/api/timetable/departments/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: nextName, hodUserId, headName }),
        });
      } else {
        await ttApiFetch('/api/timetable/departments', {
          method: 'POST',
          body: JSON.stringify({ name: nextName, hodUserId, headName }),
        });
      }
    } catch {
      // Best-effort sync when backend session is active
    }
  };

  const renameUsers = (previous: string, next: string) => {
    if (previous === next) return;
    Storage.getUsers()
      .filter((user) => user.department === previous && (user.schoolId === schoolId || (!user.schoolId && schoolId === 'tenant-riara')))
      .forEach((user) => Storage.updateUser(user.id, { department: next }));
    Storage.getStaffAppraisals()
      .filter((record) => record.department === previous)
      .forEach((record) => Storage.updateStaffAppraisal(record.id, { department: next }));
  };

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const hodUser = newHodUserId ? tenantUsers.find((u) => u.id === newHodUserId) : undefined;
      const created = createDepartment(schoolId, name, {
        hodUserId: hodUser?.id || '',
        hodName: hodUser?.name || '',
      });
      if (hodUser) {
        syncUserAsDepartmentHod(created.name, hodUser.id);
      }
      void syncBackendTimetableDepartment(created.name, created.name, hodUser?.id || '', hodUser?.name || '');
      setName('');
      setNewHodUserId('');
      refresh();
      openPage({ name: 'open', departmentId: created.id, panel: 'department' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The department could not be added.');
    }
  };

  const onSave = (event: React.FormEvent, id: string) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const saved = updateDepartment(id, editName);
      renameUsers(saved.previous, saved.next.name);
      const hodUser = editHodUserId ? tenantUsers.find((u) => u.id === editHodUserId) : undefined;
      linkDepartmentHod(id, hodUser?.id || '', hodUser?.name || '');
      if (hodUser) {
        syncUserAsDepartmentHod(saved.next.name, hodUser.id);
      }
      void syncBackendTimetableDepartment(saved.previous, saved.next.name, hodUser?.id || '', hodUser?.name || '');
      setEditingId('');
      setEditHodUserId('');
      setNotice(
        hodUser
          ? `Department "${saved.next.name}" linked to HoD ${hodUser.name}.`
          : `Department "${saved.next.name}" updated.`
      );
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The department could not be saved.');
    }
  };

  const handleAssignHodInline = (dept: SchoolDepartment, hodUserId: string) => {
    setError('');
    setNotice('');
    const hodUser = hodUserId ? tenantUsers.find((u) => u.id === hodUserId) : undefined;
    linkDepartmentHod(dept.id, hodUser?.id || '', hodUser?.name || '');
    if (hodUser) {
      syncUserAsDepartmentHod(dept.name, hodUser.id);
    }
    void syncBackendTimetableDepartment(dept.name, dept.name, hodUser?.id || '', hodUser?.name || '');
    setNotice(
      hodUser
        ? `${hodUser.name} is now linked as Head of Department for ${dept.name}.`
        : `Cleared HoD link for ${dept.name}.`
    );
    refresh();
  };

  const onDelete = (id: string, label: string) => {
    const confirmed = window.confirm(`Delete the department ${label}? Staff already using it keep that name on their account.`);
    if (!confirmed) return;
    deleteDepartment(id);
    if (page.name === 'open' && page.departmentId === id) openPage({ name: 'list' });
    refresh();
  };

  const chooseKind = (item: SchoolDepartment, kind: 'teaching' | 'non_teaching') => {
    setError('');
    saveDepartmentChoice(item.id, { kind });
    refresh();
    openPage({ name: 'open', departmentId: item.id, panel: kind === 'teaching' ? 'subjects' : 'activities' });
  };

  const saveSubjects = (item: SchoolDepartment) => {
    if (draftSubjects.length === 0) {
      setError('Choose at least one subject for this department.');
      return;
    }
    setError('');
    saveDepartmentChoice(item.id, { subjects: draftSubjects });
    refresh();
  };

  const saveActivities = (item: SchoolDepartment) => {
    if (draftActivities.length === 0) {
      setError('Choose at least one activity for this department.');
      return;
    }
    setError('');
    saveDepartmentChoice(item.id, { activities: draftActivities });
    refresh();
  };

  const toggle = (current: string[], value: string, set: (next: string[]) => void) => {
    set(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const linkedCount = departments.filter((d) => Boolean(d.hodUserId || d.hodName)).length;

  return (
    <section className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </p>
      )}

      {page.name === 'list' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Departments &amp; HoD Linkage</h2>
              <p className="text-sm text-slate-600">
                Link every academic or operational department to its specific Head of Department (HoD) and assign its subjects or activities.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{linkedCount} / {departments.length} Departments Linked to HoD</span>
            </div>
          </div>

          <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="department-name" className="block text-xs font-bold text-slate-700">Department name</label>
                <input
                  id="department-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Sciences & Innovation"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="department-hod" className="block text-xs font-bold text-slate-700">Link Specific HoD</label>
                <select
                  id="department-hod"
                  value={newHodUserId}
                  onChange={(event) => setNewHodUserId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">-- Select Department HoD --</option>
                  {hodCandidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {isHodUser(u) ? '(HoD)' : `(${u.role.replace(/_/g, ' ')})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 cursor-pointer">
                  Add department
                </button>
              </div>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                {editingId === item.id ? (
                  <form onSubmit={(event) => onSave(event, item.id)} className="space-y-2.5">
                    <div>
                      <label htmlFor={`edit-dept-${item.id}`} className="block text-xs font-bold text-slate-700">Department name</label>
                      <input
                        id={`edit-dept-${item.id}`}
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-dept-hod-${item.id}`} className="block text-xs font-bold text-slate-700">Linked Head of Department (HoD)</label>
                      <select
                        id={`edit-dept-hod-${item.id}`}
                        value={editHodUserId}
                        onChange={(event) => setEditHodUserId(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">-- Unassigned HoD --</option>
                        {hodCandidates.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {isHodUser(u) ? '(HoD)' : `(${u.role.replace(/_/g, ' ')})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white cursor-pointer">Save</button>
                      <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" onClick={() => openPage({ name: 'open', departmentId: item.id, panel: 'department' })} className="w-full text-left cursor-pointer">
                      <span className="block text-base font-extrabold text-slate-900">{item.name}</span>
                      <span className="mt-1 block text-xs font-bold text-indigo-700">
                        {item.kind === 'teaching' ? 'Teaching staff' : item.kind === 'non_teaching' ? 'Non-teaching staff' : 'Choose teaching or non-teaching'}
                      </span>
                    </button>
                    <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                      {item.hodName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>HoD: {item.hodName}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>No HoD linked yet</span>
                        </span>
                      )}
                      <select
                        aria-label={`Link HoD for ${item.name}`}
                        value={item.hodUserId || ''}
                        onChange={(e) => handleAssignHodInline(item, e.target.value)}
                        className="max-w-[175px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        <option value="">Assign HoD...</option>
                        {hodCandidates.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {isHodUser(u) ? '(HoD)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                          setEditHodUserId(item.hodUserId || '');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id, item.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {page.name === 'open' && opened && (
        <div className="space-y-4">
          <button type="button" onClick={() => openPage({ name: 'list' })} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 cursor-pointer">
            <ChevronLeft className="h-4 w-4" /> Departments
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{opened.name}</h2>
            <p className="text-sm text-slate-600">Teaching departments use subjects. Non-teaching departments, including drivers, use activities.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openPage({ name: 'open', departmentId: opened.id, panel: 'department' })}
              className={`rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${page.panel === 'department' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
            >
              Department &amp; HoD
            </button>
            {opened.kind === 'teaching' && (
              <button
                type="button"
                onClick={() => openPage({ name: 'open', departmentId: opened.id, panel: 'subjects' })}
                className={`rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${page.panel === 'subjects' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
              >
                Subjects
              </button>
            )}
            {opened.kind === 'non_teaching' && (
              <button
                type="button"
                onClick={() => openPage({ name: 'open', departmentId: opened.id, panel: 'activities' })}
                className={`rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${page.panel === 'activities' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
              >
                Activities
              </button>
            )}
          </div>

          {page.panel === 'department' && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div>
                <p className="text-sm font-bold text-slate-800">Specific Head of Department (HoD)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Linking a staff member here sets them as the designated HoD for {opened.name} across academic appraisals, supervision, and Master Timetable setup.
                </p>
                <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                  <select
                    value={opened.hodUserId || ''}
                    onChange={(e) => handleAssignHodInline(opened, e.target.value)}
                    className="w-full sm:max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    <option value="">-- Select Specific HoD --</option>
                    {hodCandidates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {isHodUser(u) ? '(HoD)' : `(${u.role.replace(/_/g, ' ')})`} {u.department ? `· ${u.department}` : ''}
                      </option>
                    ))}
                  </select>
                  {opened.hodName && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <UserCheck className="h-3.5 w-3.5" />
                      Linked: {opened.hodName}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-800">Who works in this department?</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => chooseKind(opened, 'teaching')} className={`rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${opened.kind === 'teaching' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-800'}`}>
                    Teaching staff
                  </button>
                  <button type="button" onClick={() => chooseKind(opened, 'non_teaching')} className={`rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${opened.kind === 'non_teaching' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-800'}`}>
                    Non-teaching staff
                  </button>
                </div>
              </div>
            </div>
          )}

          {page.panel === 'subjects' && opened.kind === 'teaching' && (
            <form onSubmit={(event) => { event.preventDefault(); saveSubjects(opened); }} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-sm font-bold text-slate-800">Subjects this department deals with</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={draftSubjects.includes(subject.name)} onChange={() => toggle(draftSubjects, subject.name, setDraftSubjects)} />
                    {subject.name}
                  </label>
                ))}
              </div>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white cursor-pointer">Save subjects</button>
            </form>
          )}

          {page.panel === 'activities' && opened.kind === 'non_teaching' && (
            <form onSubmit={(event) => { event.preventDefault(); saveActivities(opened); }} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-sm font-bold text-slate-800">Activities this department handles</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {activities.map((activity) => (
                  <label key={activity.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={draftActivities.includes(activity.name)} onChange={() => toggle(draftActivities, activity.name, setDraftActivities)} />
                    {activity.name}
                  </label>
                ))}
              </div>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white cursor-pointer">Save activities</button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
