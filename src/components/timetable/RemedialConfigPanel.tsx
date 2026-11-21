import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import {
  ttApiFetch,
  type DirectoryStudent,
  type DirectoryTeacher,
  type ScheduleConfig,
  type StudentGroupMode,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableFacility,
  type TimetableRemedialConfig,
  type TimetableStream,
} from './timetableTypes';

interface Props {
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  facilities: TimetableFacility[];
  streams: TimetableStream[];
  teachers: DirectoryTeacher[];
  students: DirectoryStudent[];
  remedialConfigs: TimetableRemedialConfig[];
  canManage: boolean;
  preselectCategory?: TimetableCategoryId | null;
  preselectType?: 'remedial_1' | 'remedial_2' | null;
  onRefresh: () => Promise<void>;
}

export const RemedialConfigPanel: React.FC<Props> = ({
  categories,
  weekdays,
  scheduleConfigs,
  facilities,
  streams,
  teachers,
  students,
  remedialConfigs,
  canManage,
  preselectCategory,
  preselectType,
  onRefresh,
}) => {
  const [remedialType, setRemedialType] = useState<'remedial_1' | 'remedial_2'>(
    preselectType || 'remedial_1'
  );
  const [selectedStreamKey, setSelectedStreamKey] = useState<string>('');
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(2);
  const [teacherId, setTeacherId] = useState<string>('');
  const [studentGroupMode, setStudentGroupMode] = useState<StudentGroupMode>('selected_learners');
  const [studentGroupName, setStudentGroupName] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [durationMins, setDurationMins] = useState<number>(40);
  const [availableDays, setAvailableDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [availablePeriods, setAvailablePeriods] = useState<number[]>([]);
  const [facilityId, setFacilityId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (preselectType) setRemedialType(preselectType);
  }, [preselectType]);

  useEffect(() => {
    if (preselectCategory && streams.length > 0) {
      const match = streams.find((s) => s.categoryId === preselectCategory);
      if (match) setSelectedStreamKey(`${match.grade}::${match.stream}`);
    } else if (!selectedStreamKey && streams.length > 0) {
      setSelectedStreamKey(`${streams[0].grade}::${streams[0].stream}`);
    }
  }, [preselectCategory, streams, selectedStreamKey]);

  const activeStream = useMemo(() => {
    const [gStr, ...rest] = selectedStreamKey.split('::');
    const g = Number(gStr);
    const st = rest.join('::');
    return streams.find((s) => s.grade === g && s.stream === st) || null;
  }, [selectedStreamKey, streams]);

  const activeScheduleConfig = useMemo(() => {
    if (!activeStream) return null;
    return scheduleConfigs[activeStream.categoryId] || null;
  }, [activeStream, scheduleConfigs]);

  const streamStudents = useMemo(() => {
    if (!activeStream) return [];
    return students.filter(
      (s) =>
        s.grade === activeStream.grade &&
        s.stream.toLowerCase() === activeStream.stream.toLowerCase()
    );
  }, [students, activeStream]);

  // Reset selected students when target stream changes
  useEffect(() => {
    setSelectedStudentIds([]);
    if (activeScheduleConfig) {
      const remSlot = activeScheduleConfig.periods.find((p) => p.slotType === 'remedial');
      if (remSlot) setAvailablePeriods([remSlot.periodNumber]);
    }
  }, [selectedStreamKey, activeScheduleConfig]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const togglePeriod = (periodNumber: number) => {
    setAvailablePeriods((prev) =>
      prev.includes(periodNumber)
        ? prev.filter((p) => p !== periodNumber)
        : [...prev, periodNumber].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !activeStream) return;

    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setFeedback({ type: 'err', text: 'Select an assigned remedial teacher.' });
      return;
    }
    if (studentGroupMode === 'selected_learners' && selectedStudentIds.length === 0) {
      setFeedback({
        type: 'err',
        text: 'Select at least one participating student, or switch group mode to Whole Stream.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await ttApiFetch('/api/timetable/remedials', {
        method: 'POST',
        body: JSON.stringify({
          remedialType,
          grade: activeStream.grade,
          stream: activeStream.stream,
          weeklyFrequency,
          teacherId: teacher.id,
          teacherName: teacher.name,
          studentGroupMode,
          studentGroupName:
            studentGroupName.trim() ||
            (studentGroupMode === 'whole_stream'
              ? `Grade ${activeStream.grade} ${activeStream.stream} (Whole Stream)`
              : `${remedialType === 'remedial_1' ? 'Remedial 1' : 'Remedial 2'} Group`),
          studentIds: studentGroupMode === 'selected_learners' ? selectedStudentIds : [],
          durationMins,
          availableDays,
          availablePeriods,
          facilityId: facilityId || null,
          notes,
        }),
      });
      await onRefresh();
      setFeedback({
        type: 'ok',
        text: `Saved ${remedialType === 'remedial_1' ? 'Remedial 1' : 'Remedial 2'} configuration for Grade ${activeStream.grade} ${activeStream.stream}.`,
      });
      setStudentGroupName('');
      setSelectedStudentIds([]);
      setNotes('');
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save remedial configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await ttApiFetch(`/api/timetable/remedials/${id}`, { method: 'DELETE' });
      await onRefresh();
      setFeedback({ type: 'ok', text: 'Remedial configuration deleted.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to delete remedial configuration.' });
    }
  };

  const studentNameById = useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students]
  );

  return (
    <div className="space-y-5">
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

      {/* Create Remedial 1 / Remedial 2 Configuration */}
      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Configure Remedial 1 & Remedial 2 Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Remedial 1 and Remedial 2 are scheduled independently. When targeting Selected
              Learners, the scheduling engine verifies actual participating student lists so
              non-overlapping groups can run without false conflicts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Remedial Lesson Type</label>
              <select
                value={remedialType}
                onChange={(e) => setRemedialType(e.target.value as 'remedial_1' | 'remedial_2')}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900 font-medium"
              >
                <option value="remedial_1">Remedial 1</option>
                <option value="remedial_2">Remedial 2</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Grade & Stream
              </label>
              <select
                value={selectedStreamKey}
                onChange={(e) => setSelectedStreamKey(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {streams.map((st) => (
                  <option key={`${st.grade}::${st.stream}`} value={`${st.grade}::${st.stream}`}>
                    Grade {st.grade} · {st.stream} (
                    {categories.find((c) => c.id === st.categoryId)?.shortLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assigned Remedial Teacher
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">Select remedial teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Weekly Freq.</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={weeklyFrequency}
                  onChange={(e) =>
                    setWeeklyFrequency(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                  }
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono tabular-nums text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min={20}
                  max={120}
                  value={durationMins}
                  onChange={(e) =>
                    setDurationMins(Math.max(20, Math.min(120, Number(e.target.value) || 40)))
                  }
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono tabular-nums text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Student Group Mode & Participating Learners Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="space-y-2.5">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Participating Learner Scope
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentGroupMode('selected_learners')}
                    className={`flex-1 px-2.5 py-1.5 rounded border text-xs font-medium ${
                      studentGroupMode === 'selected_learners'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Selected Learners
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentGroupMode('whole_stream')}
                    className={`flex-1 px-2.5 py-1.5 rounded border text-xs font-medium ${
                      studentGroupMode === 'whole_stream'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Whole Stream
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Group Name / Focus</label>
                <input
                  type="text"
                  placeholder="e.g., Foundational Numeracy Group A"
                  value={studentGroupName}
                  onChange={(e) => setStudentGroupName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Venue / Facility (optional)
                </label>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="">Stream Classroom / Remedial Room</option>
                  {facilities
                    .filter((f) => f.isActive)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-700 mb-1">
                {studentGroupMode === 'selected_learners'
                  ? `Select Participating Learners (${selectedStudentIds.length} selected)`
                  : 'Whole Stream Mode Active'}
              </div>
              {studentGroupMode === 'selected_learners' ? (
                <div className="border border-slate-200 rounded bg-slate-50/50 max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {streamStudents.length === 0 ? (
                    <div className="p-3 text-slate-500">
                      No active student records enrolled in Grade {activeStream?.grade}{' '}
                      {activeStream?.stream}. Switch to Whole Stream or enroll students first.
                    </div>
                  ) : (
                    streamStudents.map((stu) => {
                      const checked = selectedStudentIds.includes(stu.id);
                      return (
                        <label
                          key={stu.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(stu.id)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span className="font-medium text-slate-800">{stu.name}</span>
                          {stu.admissionNumber && (
                            <span className="font-mono text-[11px] text-slate-400 ml-auto">
                              {stu.admissionNumber}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="p-3 border border-slate-200 rounded bg-slate-50 text-slate-600">
                  All learners in Grade {activeStream?.grade} {activeStream?.stream} will be
                  scheduled together for this remedial block.
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="font-medium text-slate-700 mb-1">Available Days</div>
                <div className="flex flex-wrap gap-1.5">
                  {weekdays.map((day) => {
                    const active = availableDays.includes(day);
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
                  Available Periods (including Remedial Slot)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeScheduleConfig?.periods || []).map((slot) => {
                    const active = availablePeriods.includes(slot.periodNumber);
                    return (
                      <button
                        key={slot.periodNumber}
                        type="button"
                        onClick={() => togglePeriod(slot.periodNumber)}
                        className={`px-2 py-1 rounded border font-mono text-xs font-medium ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {slot.slotType === 'remedial'
                          ? `Rem P${slot.periodNumber}`
                          : `P${slot.periodNumber}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Remedial Configuration'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Existing Remedial Configurations Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="w-4 h-4 text-slate-600" />
          <span>Configured Remedial 1 & Remedial 2 Sessions</span>
          <span className="font-mono text-xs font-normal text-slate-500">
            ({remedialConfigs.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Type & Target Class</th>
                <th className="py-2.5 px-4">Remedial Teacher</th>
                <th className="py-2.5 px-4">Participating Group</th>
                <th className="py-2.5 px-4">Schedule & Duration</th>
                <th className="py-2.5 px-4 text-right">Freq./Wk</th>
                {canManage && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {remedialConfigs.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="py-8 px-4 text-center text-xs text-slate-500"
                  >
                    No Remedial 1 or Remedial 2 sessions configured yet.
                  </td>
                </tr>
              ) : (
                remedialConfigs.map((rc) => {
                  const learnerPreview =
                    rc.studentGroupMode === 'selected_learners'
                      ? rc.studentIds
                          .slice(0, 3)
                          .map((id) => studentNameById.get(id) || id)
                          .join(', ')
                      : '';
                  return (
                    <tr key={rc.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">
                          {rc.remedialType === 'remedial_1' ? 'Remedial 1' : 'Remedial 2'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Grade {rc.grade} · {rc.stream}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 text-xs">
                        {rc.teacherName}
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        <div className="font-medium text-slate-800">
                          {rc.studentGroupName ||
                            (rc.studentGroupMode === 'whole_stream'
                              ? 'Whole Stream'
                              : 'Selected Learners')}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {rc.studentGroupMode === 'whole_stream'
                            ? 'Entire stream attends'
                            : `${rc.studentIds.length} learner(s)${learnerPreview ? ` · ${learnerPreview}${rc.studentIds.length > 3 ? '…' : ''}` : ''}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        <div className="font-mono">{rc.durationMins} mins</div>
                        <div className="text-slate-500 mt-0.5">
                          {rc.availableDays.length > 0
                            ? rc.availableDays.map((d) => d.slice(0, 3)).join(', ')
                            : 'Any day'}
                          {' · '}
                          {rc.availablePeriods.length > 0
                            ? `P${rc.availablePeriods.join(', P')}`
                            : 'Remedial slot'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {rc.weeklyFrequency}
                      </td>
                      {canManage && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(rc.id)}
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
