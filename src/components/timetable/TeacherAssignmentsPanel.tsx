import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import {
  FACILITY_TYPE_LABELS,
  ttApiFetch,
  type DirectoryTeacher,
  type TeacherAssignmentRole,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableFacility,
  type TimetableStream,
  type TimetableSubject,
  type TimetableTeacherAssignment,
} from './timetableTypes';

interface Props {
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  subjects: TimetableSubject[];
  facilities: TimetableFacility[];
  streams: TimetableStream[];
  teachers: DirectoryTeacher[];
  teacherAssignments: TimetableTeacherAssignment[];
  canManage: boolean;
  preselectCategory?: TimetableCategoryId | null;
  preselectSubjectId?: string | null;
  onRefresh: () => Promise<void>;
}

const ROLE_LABELS: Record<TeacherAssignmentRole, string> = {
  subject_teacher: 'Subject Teacher',
  supervisor: 'Activity Supervisor (Clubs / Maktaba)',
  remedial_teacher: 'Remedial Teacher',
};

export const TeacherAssignmentsPanel: React.FC<Props> = ({
  categories,
  weekdays,
  subjects,
  facilities,
  streams,
  teachers,
  teacherAssignments,
  canManage,
  preselectCategory,
  preselectSubjectId,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<TimetableCategoryId | 'all'>('all');
  const [categoryId, setCategoryId] = useState<TimetableCategoryId>(preselectCategory || 'cat_1_3');
  const [subjectId, setSubjectId] = useState<string>(preselectSubjectId || '');
  const [teacherId, setTeacherId] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [stream, setStream] = useState<string>('');
  const [roleType, setRoleType] = useState<TeacherAssignmentRole>('subject_teacher');
  const [maxWeeklyPeriods, setMaxWeeklyPeriods] = useState<number>(28);
  const [facilityId, setFacilityId] = useState<string>('');
  const [equipmentNotes, setEquipmentNotes] = useState<string>('');
  const [allowedDays, setAllowedDays] = useState<string[]>([]);
  const [allowedPeriods, setAllowedPeriods] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (preselectCategory) {
      setCategoryId(preselectCategory);
      setFilterCategory(preselectCategory);
    }
    if (preselectSubjectId) {
      setSubjectId(preselectSubjectId);
      const found = subjects.find((s) => s.id === preselectSubjectId);
      if (found) {
        if (found.code === 'clubs' || found.code === 'maktaba') {
          setRoleType('supervisor');
        } else if (found.subjectKind === 'remedial') {
          setRoleType('remedial_teacher');
        } else {
          setRoleType('subject_teacher');
        }
        setFacilityId(found.defaultFacilityId || '');
      }
    }
  }, [preselectCategory, preselectSubjectId, subjects]);

  const categorySubjects = useMemo(
    () =>
      subjects
        .filter((s) => s.categoryId === categoryId && s.subjectKind !== 'remedial')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [subjects, categoryId]
  );

  useEffect(() => {
    if (!subjectId || !categorySubjects.some((s) => s.id === subjectId)) {
      const first = categorySubjects[0];
      setSubjectId(first?.id || '');
    }
  }, [categorySubjects, subjectId]);

  const categoryStreams = useMemo(
    () => streams.filter((st) => st.categoryId === categoryId),
    [streams, categoryId]
  );

  const gradesInCategory = useMemo(
    () => Array.from(new Set(categoryStreams.map((st) => st.grade))).sort((a, b) => a - b),
    [categoryStreams]
  );

  const streamsInSelectedGrade = useMemo(() => {
    if (!grade) return [];
    const g = Number(grade);
    return categoryStreams.filter((st) => st.grade === g).map((st) => st.stream);
  }, [categoryStreams, grade]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) || null,
    [subjects, subjectId]
  );

  const toggleDay = (day: string) => {
    setAllowedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const togglePeriod = (p: number) => {
    setAllowedPeriods((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)
    );
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setFeedback({ type: 'err', text: 'Select an authorized teacher or supervisor.' });
      return;
    }
    if (!subjectId) {
      setFeedback({ type: 'err', text: 'Select a subject or activity.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await ttApiFetch('/api/timetable/teacher-assignments', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          categoryId,
          subjectId,
          grade: grade ? Number(grade) : null,
          stream: stream || null,
          roleType,
          maxWeeklyPeriods,
          facilityId: facilityId || null,
          equipmentNotes,
          allowedDays,
          allowedPeriods,
        }),
      });
      await onRefresh();
      setFeedback({
        type: 'ok',
        text: `Assigned ${teacher.name} to ${selectedSubject?.name || 'subject'}.`,
      });
      setGrade('');
      setStream('');
      setEquipmentNotes('');
      setAllowedDays([]);
      setAllowedPeriods([]);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save assignment.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await ttApiFetch(`/api/timetable/teacher-assignments/${id}`, { method: 'DELETE' });
      await onRefresh();
      setFeedback({ type: 'ok', text: 'Teacher assignment removed.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to remove assignment.' });
    }
  };

  const filteredAssignments = useMemo(() => {
    return teacherAssignments.filter((a) =>
      filterCategory === 'all' ? true : a.categoryId === filterCategory
    );
  }, [teacherAssignments, filterCategory]);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const facilityById = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);

  // Identify subjects with lessonsPerWeek > 0 that still have 0 assigned teachers
  const unassignedAlerts = useMemo(() => {
    return subjects.filter((s) => {
      if (!s.isActive || s.lessonsPerWeek <= 0 || s.subjectKind === 'remedial') return false;
      const hasAny = teacherAssignments.some(
        (ta) => ta.isActive && ta.categoryId === s.categoryId && ta.subjectId === s.id
      );
      return !hasAny;
    });
  }, [subjects, teacherAssignments]);

  return (
    <div className="space-y-5">
      {unassignedAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-900">
          <div className="font-semibold">
            {unassignedAlerts.length} allocated subject(s) or activity(ies) require an authorized
            teacher/supervisor before timetable generation:
          </div>
          <div className="mt-1 text-amber-800">
            {unassignedAlerts
              .map(
                (s) =>
                  `${s.name} (${categories.find((c) => c.id === s.categoryId)?.shortLabel})`
              )
              .join(' · ')}
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-md border text-sm flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Assignment Form */}
      {canManage && (
        <form
          onSubmit={handleAssign}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Assign Authorized Teacher or Activity Supervisor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                No teachers are auto-assigned. Explicitly authorize qualified teachers for Core
                Subjects, ICT/Robotics, Computer Studies, Library, Swimming, Clubs, and Maktaba.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value as TimetableCategoryId);
                  setGrade('');
                  setStream('');
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject / Activity</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSubjectId(id);
                  const found = subjects.find((s) => s.id === id);
                  if (found) {
                    setRoleType(
                      found.code === 'clubs' || found.code === 'maktaba'
                        ? 'supervisor'
                        : 'subject_teacher'
                    );
                    setFacilityId(found.defaultFacilityId || '');
                  }
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {categorySubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.lessonsPerWeek}/wk)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Teacher / Supervisor
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">Select staff member...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assignment Role</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as TeacherAssignmentRole)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="subject_teacher">Subject Teacher</option>
                <option value="supervisor">Activity Supervisor (Clubs / Maktaba)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Grade (optional)
              </label>
              <select
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setStream('');
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">All Grades in Category</option>
                {gradesInCategory.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Stream (optional)
              </label>
              <select
                value={stream}
                disabled={!grade}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-50"
              >
                <option value="">All Streams</option>
                {streamsInSelectedGrade.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assigned Lab / Shared Facility
              </label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">Use Subject Default / Classroom</option>
                {facilities
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({FACILITY_TYPE_LABELS[f.facilityType]})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Max Weekly Periods
              </label>
              <input
                type="number"
                min={1}
                max={45}
                value={maxWeeklyPeriods}
                onChange={(e) =>
                  setMaxWeeklyPeriods(Math.max(1, Math.min(45, Number(e.target.value) || 28)))
                }
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Optional Allocated Days/Periods (especially useful for Clubs, Maktaba & part-time specialists) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="font-medium text-slate-700 mb-1">
                Allocated Days (Clubs / Maktaba / Availability)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day) => {
                  const active = allowedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2 py-1 rounded border text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-700 mb-1">
                Allocated Periods (optional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                  const active = allowedPeriods.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePeriod(p)}
                      className={`w-8 h-7 rounded border font-mono text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      P{p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Equipment / Qualification Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Robotics kit kit-A, KNEC Computer Studies"
                  value={equipmentNotes}
                  onChange={(e) => setEquipmentNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {saving ? 'Assigning...' : 'Add Teacher Assignment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Existing Assignments Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span>Authorized Teacher & Supervisor Assignments</span>
            <span className="font-mono text-xs font-normal text-slate-500">
              ({filteredAssignments.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCategory(c.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                  filterCategory === c.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Teacher / Supervisor</th>
                <th className="py-2.5 px-4">Category & Subject</th>
                <th className="py-2.5 px-4">Scope</th>
                <th className="py-2.5 px-4">Facility & Schedule Rules</th>
                <th className="py-2.5 px-4 text-right">Max Load</th>
                {canManage && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="py-8 px-4 text-center text-xs text-slate-500"
                  >
                    No teacher assignments configured yet for this filter. Use the form above to
                    authorize teachers and activity supervisors.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => {
                  const sub = subjectById.get(a.subjectId);
                  const fac = a.facilityId ? facilityById.get(a.facilityId) : null;
                  const cat = categories.find((c) => c.id === a.categoryId);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{a.teacherName}</div>
                        <div className="text-xs text-slate-500">
                          {ROLE_LABELS[a.roleType]}
                          {a.teacherEmail ? ` · ${a.teacherEmail}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub?.name || a.subjectId}
                        </div>
                        <div className="text-xs text-slate-500">{cat?.label}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-700">
                        {a.grade
                          ? `Grade ${a.grade}${a.stream ? ` · ${a.stream}` : ' (All streams)'}`
                          : 'All grades in category'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        <div>{fac ? fac.name : 'Default classroom / subject venue'}</div>
                        {(a.allowedDays.length > 0 || a.allowedPeriods.length > 0) && (
                          <div className="text-slate-500 mt-0.5">
                            {a.allowedDays.length > 0 &&
                              `Days: ${a.allowedDays.map((d) => d.slice(0, 3)).join(', ')}`}
                            {a.allowedDays.length > 0 && a.allowedPeriods.length > 0 && ' · '}
                            {a.allowedPeriods.length > 0 &&
                              `Periods: P${a.allowedPeriods.join(', P')}`}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {a.maxWeeklyPeriods} /wk
                      </td>
                      {canManage && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
