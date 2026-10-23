import React, { useEffect, useMemo, useState } from 'react';
import { SchoolDepartment } from '../../utils/departmentStore';
import { listActivities, listSubjects } from '../../utils/catalogStore';
import {
  createDepartment,
  deleteDepartment,
  ensureDepartments,
  listDepartments,
  saveDepartmentChoice,
  updateDepartment,
} from '../../utils/departmentStore';
import { Storage } from '../../utils/storage';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';

interface DepartmentPagesProps {
  schoolId: string;
}

type Panel = 'department' | 'subjects' | 'activities';
type Page = { name: 'list' } | { name: 'open'; departmentId: string; panel: Panel };

export const DepartmentPages: React.FC<DepartmentPagesProps> = ({ schoolId }) => {
  const pageKey = `edusmart_department_page:${schoolId}`;
  const [page, setPage] = useState<Page>({ name: 'list' });
  const [revision, setRevision] = useState(0);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [draftSubjects, setDraftSubjects] = useState<string[]>([]);
  const [draftActivities, setDraftActivities] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(pageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Page;
      if (parsed?.name === 'list' || parsed?.name === 'open') setPage(parsed);
    } catch {
      sessionStorage.removeItem(pageKey);
    }
  }, [pageKey]);

  const openPage = (next: Page) => {
    sessionStorage.setItem(pageKey, JSON.stringify(next));
    setPage(next);
  };

  const departments = useMemo(() => {
    ensureDepartments(schoolId);
    return listDepartments(schoolId);
  }, [schoolId, revision]);
  const subjects = useMemo(() => listSubjects(), [revision]);
  const activities = useMemo(() => listActivities(), [revision]);
  const refresh = () => setRevision((value) => value + 1);
  const opened = page.name === 'open' ? departments.find((item) => item.id === page.departmentId) : undefined;

  useEffect(() => {
    if (!opened) return;
    setDraftSubjects(opened.subjects);
    setDraftActivities(opened.activities);
  }, [opened?.id, opened?.subjects.join('|'), opened?.activities.join('|')]);

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
    try {
      const created = createDepartment(schoolId, name);
      setName('');
      refresh();
      openPage({ name: 'open', departmentId: created.id, panel: 'department' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The department could not be added.');
    }
  };

  const onSave = (event: React.FormEvent, id: string) => {
    event.preventDefault();
    setError('');
    try {
      const saved = updateDepartment(id, editName);
      renameUsers(saved.previous, saved.next.name);
      setEditingId('');
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The department could not be saved.');
    }
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

  return (
    <section className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}

      {page.name === 'list' && (
        <>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Departments</h2>
            <p className="text-sm text-slate-600">Add a department, then open it and choose teaching subjects or non-teaching activities.</p>
          </div>
          <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <label htmlFor="department-name" className="block text-xs font-bold text-slate-700">Department name</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="department-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Transport & Fleet"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Add department</button>
            </div>
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                {editingId === item.id ? (
                  <form onSubmit={(event) => onSave(event, item.id)} className="space-y-2">
                    <label htmlFor={`edit-dept-${item.id}`} className="block text-xs font-bold text-slate-700">Department name</label>
                    <input id={`edit-dept-${item.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Save</button>
                      <button type="button" onClick={() => setEditingId('')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" onClick={() => openPage({ name: 'open', departmentId: item.id, panel: 'department' })} className="w-full text-left">
                      <span className="block text-base font-extrabold text-slate-900">{item.name}</span>
                      <span className="mt-1 block text-xs font-bold text-indigo-700">
                        {item.kind === 'teaching' ? 'Teaching staff' : item.kind === 'non_teaching' ? 'Non-teaching staff' : 'Choose teaching or non-teaching'}
                      </span>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => { setEditingId(item.id); setEditName(item.name); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => onDelete(item.id, item.name)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">
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
          <button type="button" onClick={() => openPage({ name: 'list' })} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
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
              className={`rounded-xl px-4 py-2 text-sm font-bold ${page.panel === 'department' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
            >
              Department
            </button>
            {opened.kind === 'teaching' && (
              <button
                type="button"
                onClick={() => openPage({ name: 'open', departmentId: opened.id, panel: 'subjects' })}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${page.panel === 'subjects' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
              >
                Subjects
              </button>
            )}
            {opened.kind === 'non_teaching' && (
              <button
                type="button"
                onClick={() => openPage({ name: 'open', departmentId: opened.id, panel: 'activities' })}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${page.panel === 'activities' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}
              >
                Activities
              </button>
            )}
          </div>

          {page.panel === 'department' && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-sm font-bold text-slate-800">Who works in this department?</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => chooseKind(opened, 'teaching')} className={`rounded-xl px-4 py-2 text-sm font-bold ${opened.kind === 'teaching' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-800'}`}>
                  Teaching staff
                </button>
                <button type="button" onClick={() => chooseKind(opened, 'non_teaching')} className={`rounded-xl px-4 py-2 text-sm font-bold ${opened.kind === 'non_teaching' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-800'}`}>
                  Non-teaching staff
                </button>
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
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Save subjects</button>
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
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Save activities</button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
