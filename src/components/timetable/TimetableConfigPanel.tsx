import React, { useState, useEffect } from 'react';
import { Building2, Calendar, Clock, Plus, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ROOM_TYPE_LABELS,
  TTClassroomItem,
  TTConfigData,
  TTGradeSchedule,
  TTPeriodItem,
  ttApiFetch,
} from './timetableTypes';

interface TimetableConfigPanelProps {
  config: TTConfigData;
  gradeSchedules: TTGradeSchedule[];
  periods: TTPeriodItem[];
  classrooms: TTClassroomItem[];
  onRefresh: () => Promise<void>;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableConfigPanel: React.FC<TimetableConfigPanelProps> = ({
  config,
  gradeSchedules,
  periods,
  classrooms,
  onRefresh,
}) => {
  const [academicYear, setAcademicYear] = useState(config.academicYear);
  const [term, setTerm] = useState(config.term);
  const [cycleDays, setCycleDays] = useState(config.cycleDays);
  const [workingDays, setWorkingDays] = useState<string[]>(config.workingDays);
  const [defaultPeriodsPerDay, setDefaultPeriodsPerDay] = useState(config.defaultPeriodsPerDay);
  const [cycleLabel, setCycleLabel] = useState(config.cycleLabel);
  const [localPeriods, setLocalPeriods] = useState<TTPeriodItem[]>(periods);
  const [localGradeScheds, setLocalGradeScheds] = useState<TTGradeSchedule[]>(gradeSchedules);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // New Classroom State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [newRoomCapacity, setNewRoomCapacity] = useState(45);
  const [newRoomLocation, setNewRoomLocation] = useState('Main Block');
  const [savingRoom, setSavingRoom] = useState(false);

  useEffect(() => {
    setAcademicYear(config.academicYear);
    setTerm(config.term);
    setCycleDays(config.cycleDays);
    setWorkingDays(config.workingDays);
    setDefaultPeriodsPerDay(config.defaultPeriodsPerDay);
    setCycleLabel(config.cycleLabel);
  }, [config]);

  useEffect(() => {
    setLocalPeriods(periods);
  }, [periods]);

  useEffect(() => {
    setLocalGradeScheds(gradeSchedules);
  }, [gradeSchedules]);

  const toggleWorkingDay = (day: string) => {
    const next = workingDays.includes(day)
      ? workingDays.filter((d) => d !== day)
      : WEEK_DAYS.filter((d) => workingDays.includes(d) || d === day);
    if (next.length === 0) return;
    setWorkingDays(next);
    setCycleDays(next.length);
  };

  const applySchedulePreset = (days: 5 | 6) => {
    const list = days === 6 ? WEEK_DAYS.slice(0, 6) : WEEK_DAYS.slice(0, 5);
    setWorkingDays(list);
    setCycleDays(days);
    setCycleLabel(days === 6 ? '6-Day Cycle (Mon–Sat)' : '5-Day Cycle (Mon–Fri)');
  };

  const addBellSlot = () => {
    const nextSort = localPeriods.length + 1;
    const maxLessonNum = localPeriods.reduce((m, p) => (p.kind === 'lesson' && p.periodNumber > m ? p.periodNumber : m), 0);
    setLocalPeriods([
      ...localPeriods,
      {
        id: `new-${Date.now()}`,
        gradeBand: 'all',
        periodNumber: maxLessonNum + 1,
        label: `Lesson ${maxLessonNum + 1}`,
        kind: 'lesson',
        startTime: '15:15',
        endTime: '15:55',
        sortOrder: nextSort,
      },
    ]);
  };

  const updatePeriodRow = (idx: number, patch: Partial<TTPeriodItem>) => {
    setLocalPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removePeriodRow = (idx: number) => {
    setLocalPeriods((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sortOrder: i + 1 })));
  };

  const updateGradeSchedRow = (grade: number, patch: Partial<TTGradeSchedule>) => {
    setLocalGradeScheds((prev) => prev.map((g) => (g.grade === grade ? { ...g, ...patch } : g)));
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setStatusMsg(null);
    try {
      await ttApiFetch('/api/timetable/config', {
        method: 'PUT',
        body: JSON.stringify({
          academicYear,
          term,
          cycleDays,
          workingDays,
          defaultPeriodsPerDay,
          cycleLabel,
          periods: localPeriods,
          gradeSchedules: localGradeScheds,
        }),
      });
      await onRefresh();
      setStatusMsg({ type: 'ok', text: 'Timetable configuration, bell slots, and grade schedules saved.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Failed to save configuration.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomCode.trim()) return;
    setSavingRoom(true);
    setStatusMsg(null);
    try {
      await ttApiFetch('/api/timetable/classrooms', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoomName.trim(),
          roomCode: newRoomCode.trim(),
          roomType: newRoomType,
          capacity: newRoomCapacity,
          location: newRoomLocation.trim(),
        }),
      });
      setNewRoomName('');
      setNewRoomCode('');
      setNewRoomCapacity(45);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: 'Classroom / facility registered.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not add room.' });
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await ttApiFetch(`/api/timetable/classrooms/${roomId}`, { method: 'DELETE' });
      await onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not delete room.' });
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 1. Cycle, Term & Working Days */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>01. Academic Cycle &amp; Working Days</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure 5-day or 6-day schedules, academic year, term, and default daily teaching load.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applySchedulePreset(5)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                workingDays.length === 5 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              5-Day Week
            </button>
            <button
              type="button"
              onClick={() => applySchedulePreset(6)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                workingDays.length === 6 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              6-Day Week
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Daily Teaching Periods</label>
            <input
              type="number"
              min={4}
              max={12}
              value={defaultPeriodsPerDay}
              onChange={(e) => setDefaultPeriodsPerDay(Number(e.target.value || 8))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Cycle Label</label>
            <input
              type="text"
              value={cycleLabel}
              onChange={(e) => setCycleLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-600 mb-2">Active School Days ({workingDays.length} days):</div>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => {
              const active = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Bell Timings, Breaks, Lunch & Assemblies */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>02. Bell Schedule, Breaks &amp; Assembly Slots</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-period blocks automatically verify break and lunch boundaries so double lessons never split across breaks.
            </p>
          </div>
          <button
            type="button"
            onClick={addBellSlot}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 pr-3">Period #</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">End</th>
                <th className="py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localPeriods.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-50/70">
                  <td className="py-2 pr-3 font-mono tabular-nums text-slate-500">{idx + 1}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={p.kind}
                      onChange={(e) => updatePeriodRow(idx, { kind: e.target.value as any })}
                      className="px-2 py-1 border border-slate-200 rounded bg-white"
                    >
                      <option value="lesson">Lesson</option>
                      <option value="break">Break</option>
                      <option value="lunch">Lunch</option>
                      <option value="assembly">Assembly</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      disabled={p.kind !== 'lesson'}
                      value={p.kind === 'lesson' ? p.periodNumber : 0}
                      onChange={(e) => updatePeriodRow(idx, { periodNumber: Number(e.target.value) })}
                      className="w-16 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums disabled:bg-slate-100"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={p.label}
                      onChange={(e) => updatePeriodRow(idx, { label: e.target.value })}
                      className="w-40 px-2 py-1 border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="time"
                      value={p.startTime}
                      onChange={(e) => updatePeriodRow(idx, { startTime: e.target.value })}
                      className="px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="time"
                      value={p.endTime}
                      onChange={(e) => updatePeriodRow(idx, { endTime: e.target.value })}
                      className="px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removePeriodRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Remove slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Different Schedules per Grade Level */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">03. Per-Grade Level Schedule Limits</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust daily teaching periods and assembly day individually for lower primary, upper primary, and junior secondary grades.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 pr-3">Grade</th>
                <th className="py-2 pr-3">Periods / Day</th>
                <th className="py-2 pr-3">Assembly Day</th>
                <th className="py-2 pr-3">Assembly Period</th>
                <th className="py-2">Weekly Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localGradeScheds.map((gs) => {
                const cap = gs.workingDays.length * gs.periodsPerDay - (gs.assemblyPeriod > 0 ? 1 : 0);
                return (
                  <tr key={gs.grade}>
                    <td className="py-2 pr-3 font-semibold text-slate-900">Grade {gs.grade}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={4}
                        max={12}
                        value={gs.periodsPerDay}
                        onChange={(e) => updateGradeSchedRow(gs.grade, { periodsPerDay: Number(e.target.value || 8) })}
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={gs.assemblyDay}
                        onChange={(e) => updateGradeSchedRow(gs.grade, { assemblyDay: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        {WEEK_DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={gs.periodsPerDay}
                        value={gs.assemblyPeriod}
                        onChange={(e) => updateGradeSchedRow(gs.grade, { assemblyPeriod: Number(e.target.value || 0) })}
                        className="w-16 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                      />
                    </td>
                    <td className="py-2 font-mono tabular-nums text-slate-700 font-semibold">
                      {cap} periods / week
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Classrooms & Specialized Facilities */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>04. Classrooms &amp; Specialized Facilities ({classrooms.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Register homerooms, science laboratories, ICT labs, workshops, halls, and sports fields with exact seat capacity.
          </p>
        </div>

        <form onSubmit={handleCreateClassroom} className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="text"
            placeholder="Room Name (e.g. Biology Lab)"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            required
            className="sm:col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="text"
            placeholder="Code (LAB-03)"
            value={newRoomCode}
            onChange={(e) => setNewRoomCode(e.target.value)}
            required
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-mono"
          />
          <select
            value={newRoomType}
            onChange={(e) => setNewRoomType(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          >
            {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="number"
            min={5}
            max={600}
            placeholder="Seats"
            value={newRoomCapacity}
            onChange={(e) => setNewRoomCapacity(Number(e.target.value || 45))}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-mono tabular-nums"
          />
          <button
            type="submit"
            disabled={savingRoom}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
          >
            {savingRoom ? 'Adding...' : 'Add Room'}
          </button>
        </form>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Facility Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Capacity</th>
                <th className="py-2 pr-3">Home Assignment</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classrooms.map((rm) => (
                <tr key={rm.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 font-mono text-slate-600">{rm.roomCode}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-900">{rm.name}</td>
                  <td className="py-2 pr-3 text-slate-600">{ROOM_TYPE_LABELS[rm.roomType] || rm.roomType}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{rm.capacity} seats</td>
                  <td className="py-2 pr-3 text-slate-500">
                    {rm.assignedGrade ? `Grade ${rm.assignedGrade} ${rm.assignedStream}` : rm.location}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(rm.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      aria-label={`Delete ${rm.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
