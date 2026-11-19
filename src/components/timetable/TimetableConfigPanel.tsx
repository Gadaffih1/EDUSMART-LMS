import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Calendar, Clock, Plus, Save, Trash2, CheckCircle2, AlertCircle, Pencil, BookOpen, FolderKanban, X, UserCheck } from 'lucide-react';
import {
  ROOM_TYPE_LABELS,
  TTClassroomItem,
  TTConfigData,
  TTDepartmentItem,
  TTGradeSchedule,
  TTPeriodItem,
  TTSubjectItem,
  ttApiFetch,
} from './timetableTypes';
import { addCatalogSubject, deleteCatalogSubject, updateCatalogSubject } from '../../utils/catalogStore';
import { createDepartment, deleteDepartment, linkDepartmentHod, listDepartments, updateDepartment } from '../../utils/departmentStore';
import { Storage } from '../../utils/storage';

interface TimetableConfigPanelProps {
  config: TTConfigData;
  gradeSchedules: TTGradeSchedule[];
  periods: TTPeriodItem[];
  classrooms: TTClassroomItem[];
  subjects?: TTSubjectItem[];
  departments?: TTDepartmentItem[];
  schoolId?: string;
  onRefresh: () => Promise<void>;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableConfigPanel: React.FC<TimetableConfigPanelProps> = ({
  config,
  gradeSchedules,
  periods,
  classrooms,
  subjects = [],
  departments = [],
  schoolId,
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

  // New Classroom / Shared Facility State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [newRoomCapacity, setNewRoomCapacity] = useState(45);
  const [newRoomMaxConcurrent, setNewRoomMaxConcurrent] = useState(1);
  const [newRoomResponsibleStaff, setNewRoomResponsibleStaff] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('Main Block');
  const [savingRoom, setSavingRoom] = useState(false);

  // Department CRUD State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptHodUserId, setNewDeptHodUserId] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptHodUserId, setEditDeptHodUserId] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [confirmDeleteDeptId, setConfirmDeleteDeptId] = useState<string | null>(null);

  // Eligible HoD & faculty candidates for linking every department to a specific HoD
  const hodCandidates = useMemo(() => {
    const allUsers = Storage.getUsers().filter((u) => {
      if (u.role === 'student' || u.role === 'parent') return false;
      if (schoolId && u.schoolId && u.schoolId !== schoolId) return false;
      return true;
    });
    return allUsers.sort((a, b) => {
      const aIsHod = a.role === 'hod' || (Array.isArray(a.assignedRoles) && a.assignedRoles.includes('hod')) ? 0 : 1;
      const bIsHod = b.role === 'hod' || (Array.isArray(b.assignedRoles) && b.assignedRoles.includes('hod')) ? 0 : 1;
      if (aIsHod !== bIsHod) return aIsHod - bIsHod;
      return a.name.localeCompare(b.name);
    });
  }, [schoolId, departments.length]);

  // Subject CRUD State
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubDept, setNewSubDept] = useState<string>(departments[0]?.name || 'Core Academic');
  const [newSubRoomType, setNewSubRoomType] = useState('general');
  const [newSubPractical, setNewSubPractical] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');
  const [editSubDept, setEditSubDept] = useState('');
  const [editSubRoomType, setEditSubRoomType] = useState('general');
  const [editSubPractical, setEditSubPractical] = useState(false);
  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState<string | null>(null);

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
          maxConcurrentClasses: newRoomMaxConcurrent,
          responsibleStaff: newRoomResponsibleStaff.trim(),
          location: newRoomLocation.trim(),
        }),
      });
      setNewRoomName('');
      setNewRoomCode('');
      setNewRoomCapacity(45);
      setNewRoomMaxConcurrent(1);
      setNewRoomResponsibleStaff('');
      await onRefresh();
      setStatusMsg({ type: 'ok', text: 'Classroom / shared facility registered.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not add room.' });
    } finally {
      setSavingRoom(false);
    }
  };

  const handleUpdateRoomConcurrentCap = async (rm: TTClassroomItem, nextCap: number) => {
    try {
      await ttApiFetch(`/api/timetable/classrooms/${rm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          maxConcurrentClasses: nextCap,
          assignedGrade: rm.assignedGrade,
          assignedStream: rm.assignedStream,
        }),
      });
      await onRefresh();
      setStatusMsg({
        type: 'ok',
        text: `${rm.name}: simultaneous class limit updated to ${nextCap} class${nextCap === 1 ? '' : 'es'} per slot.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not update facility capacity.' });
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

  const syncLocalHodUser = (deptName: string, hodUserId: string) => {
    if (!hodUserId) return;
    const matched = hodCandidates.find((u) => u.id === hodUserId);
    if (!matched) return;
    const assigned = Array.isArray(matched.assignedRoles) ? matched.assignedRoles : [];
    const nextAssigned = matched.role === 'hod' || assigned.includes('hod') ? assigned : [...assigned, 'hod' as const];
    Storage.updateUser(matched.id, { department: deptName, assignedRoles: nextAssigned });
  };

  // Department CRUD handlers
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    setStatusMsg(null);
    try {
      const cleanName = newDeptName.trim();
      const selectedHod = newDeptHodUserId ? hodCandidates.find((u) => u.id === newDeptHodUserId) : undefined;
      const resolvedHeadName = selectedHod?.name || newDeptHead.trim();
      await ttApiFetch('/api/timetable/departments', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          code: newDeptCode.trim() || undefined,
          hodUserId: selectedHod?.id || '',
          headName: resolvedHeadName,
          description: newDeptDesc.trim(),
        }),
      });
      if (schoolId) {
        try {
          createDepartment(schoolId, cleanName, {
            hodUserId: selectedHod?.id || '',
            hodName: resolvedHeadName,
          });
        } catch {
          const existingLocal = listDepartments(schoolId).find(
            (d) => d.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (existingLocal && selectedHod) {
            linkDepartmentHod(existingLocal.id, selectedHod.id, resolvedHeadName);
          }
        }
      }
      if (selectedHod) {
        syncLocalHodUser(cleanName, selectedHod.id);
      }
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptHodUserId('');
      setNewDeptHead('');
      setNewDeptDesc('');
      await onRefresh();
      setStatusMsg({
        type: 'ok',
        text: selectedHod
          ? `Department "${cleanName}" added and linked to HoD ${selectedHod.name}.`
          : `Department "${cleanName}" added to Master Timetable.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not add department.' });
    } finally {
      setSavingDept(false);
    }
  };

  const handleSaveDepartmentEdit = async (dept: TTDepartmentItem) => {
    if (!editDeptName.trim()) return;
    setSavingDept(true);
    setStatusMsg(null);
    try {
      const cleanNext = editDeptName.trim();
      const selectedHod = editDeptHodUserId ? hodCandidates.find((u) => u.id === editDeptHodUserId) : undefined;
      const resolvedHeadName = selectedHod ? selectedHod.name : editDeptHead.trim();
      await ttApiFetch(`/api/timetable/departments/${dept.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: cleanNext,
          code: editDeptCode.trim(),
          hodUserId: selectedHod?.id || '',
          headName: resolvedHeadName,
          description: editDeptDesc.trim(),
        }),
      });
      if (schoolId) {
        const localMatch = listDepartments(schoolId).find(
          (d) => d.name.toLowerCase() === dept.name.toLowerCase()
        );
        if (localMatch) {
          if (localMatch.name !== cleanNext) {
            try {
              updateDepartment(localMatch.id, cleanNext);
            } catch {
              // ignore duplicate
            }
          }
          linkDepartmentHod(localMatch.id, selectedHod?.id || '', resolvedHeadName);
        }
      }
      if (selectedHod) {
        syncLocalHodUser(cleanNext, selectedHod.id);
      }
      setEditingDeptId(null);
      await onRefresh();
      setStatusMsg({
        type: 'ok',
        text: selectedHod
          ? `Department "${cleanNext}" updated and linked to HoD ${selectedHod.name}.`
          : `Department "${cleanNext}" updated.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not update department.' });
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (dept: TTDepartmentItem) => {
    setSavingDept(true);
    setStatusMsg(null);
    try {
      await ttApiFetch(`/api/timetable/departments/${dept.id}`, { method: 'DELETE' });
      if (schoolId) {
        const localMatch = listDepartments(schoolId).find(
          (d) => d.name.toLowerCase() === dept.name.toLowerCase()
        );
        if (localMatch) deleteDepartment(localMatch.id);
      }
      setConfirmDeleteDeptId(null);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Department "${dept.name}" removed.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not delete department.' });
    } finally {
      setSavingDept(false);
    }
  };

  // Subject CRUD handlers
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    setSavingSub(true);
    setStatusMsg(null);
    try {
      const cleanName = newSubName.trim();
      await ttApiFetch('/api/timetable/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          code: newSubCode.trim() || undefined,
          department: newSubDept || 'Core Academic',
          requiresRoomType: newSubRoomType,
          isPractical: newSubPractical,
        }),
      });
      addCatalogSubject(cleanName);
      setNewSubName('');
      setNewSubCode('');
      setNewSubPractical(false);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Subject "${cleanName}" added to Master Timetable.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not add subject.' });
    } finally {
      setSavingSub(false);
    }
  };

  const handleSaveSubjectEdit = async (sub: TTSubjectItem) => {
    if (!editSubName.trim()) return;
    setSavingSub(true);
    setStatusMsg(null);
    try {
      const cleanNext = editSubName.trim();
      await ttApiFetch(`/api/timetable/subjects/${sub.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: cleanNext,
          code: editSubCode.trim(),
          department: editSubDept.trim() || 'Core Academic',
          requiresRoomType: editSubRoomType,
          isPractical: editSubPractical,
        }),
      });
      updateCatalogSubject(sub.name, cleanNext);
      setEditingSubId(null);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Subject "${cleanNext}" updated across timetable allocations.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not update subject.' });
    } finally {
      setSavingSub(false);
    }
  };

  const handleDeleteSubject = async (sub: TTSubjectItem) => {
    setSavingSub(true);
    setStatusMsg(null);
    try {
      await ttApiFetch(`/api/timetable/subjects/${sub.id}`, { method: 'DELETE' });
      deleteCatalogSubject(sub.name);
      setConfirmDeleteSubId(null);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Subject "${sub.name}" removed from Master Timetable.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not remove subject.' });
    } finally {
      setSavingSub(false);
    }
  };

  const departmentNameOptions = Array.from(
    new Set<string>([
      ...departments.map((d) => d.name),
      ...subjects.map((s) => s.department).filter(Boolean),
      'Core Academic',
    ])
  ).sort();

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

        <form onSubmit={handleCreateClassroom} className="grid grid-cols-1 sm:grid-cols-8 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="text"
            placeholder="Facility Name (e.g. Swimming Pool)"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            required
            className="sm:col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="text"
            placeholder="Code (POOL-01)"
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
            title="Student Seat Capacity"
            value={newRoomCapacity}
            onChange={(e) => setNewRoomCapacity(Number(e.target.value || 45))}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-mono tabular-nums"
          />
          <select
            value={newRoomMaxConcurrent}
            onChange={(e) => setNewRoomMaxConcurrent(Number(e.target.value || 1))}
            title="Simultaneous Classes Allowed"
            className="px-2 py-2 border border-slate-200 rounded-lg bg-white font-mono"
          >
            <option value={1}>1 Class / Slot</option>
            <option value={2}>2 Classes / Slot</option>
            <option value={3}>3 Classes / Slot</option>
            <option value={4}>4 Classes / Slot</option>
          </select>
          <input
            type="text"
            placeholder="Supervisor / Staff"
            value={newRoomResponsibleStaff}
            onChange={(e) => setNewRoomResponsibleStaff(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <button
            type="submit"
            disabled={savingRoom}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
          >
            {savingRoom ? 'Adding...' : 'Add Facility'}
          </button>
        </form>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Facility Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Seats</th>
                <th className="py-2 pr-3">Max Classes/Slot</th>
                <th className="py-2 pr-3">Supervisor / Home</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classrooms.map((rm) => (
                <tr key={rm.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 font-mono text-slate-600">{rm.roomCode}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-900">{rm.name}</td>
                  <td className="py-2 pr-3 text-slate-600">{ROOM_TYPE_LABELS[rm.roomType] || rm.roomType}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{rm.capacity}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={rm.maxConcurrentClasses || 1}
                      onChange={(e) => handleUpdateRoomConcurrentCap(rm, Number(e.target.value))}
                      className="px-2 py-1 border border-slate-200 rounded bg-white font-mono text-[11px]"
                      title="Simultaneous classes permitted in this facility"
                    >
                      <option value={1}>1 class</option>
                      <option value={2}>2 classes</option>
                      <option value={3}>3 classes</option>
                      <option value={4}>4 classes</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3 text-slate-500">
                    {rm.responsibleStaff || (rm.assignedGrade ? `Grade ${rm.assignedGrade} ${rm.assignedStream}` : rm.location)}
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

      {/* 5. Academic Departments (Add, Edit & Remove) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-600" />
            <span>05. Academic Departments ({departments.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, rename, edit, or remove academic departments used when preparing the Master Timetable, assigning subjects, and organizing teachers.
          </p>
        </div>

        <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="text"
            placeholder="Department Name (e.g. Creative Arts & Music)"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            required
            className="sm:col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="text"
            placeholder="Code (e.g. ARTS)"
            value={newDeptCode}
            onChange={(e) => setNewDeptCode(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-mono"
          />
          <select
            value={newDeptHodUserId}
            onChange={(e) => {
              const id = e.target.value;
              setNewDeptHodUserId(id);
              const u = hodCandidates.find((c) => c.id === id);
              setNewDeptHead(u?.name || '');
            }}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
            title="Link Specific Head of Department (HoD)"
          >
            <option value="">-- Link Specific HoD --</option>
            {hodCandidates.map((u) => {
              const isHod = u.role === 'hod' || (Array.isArray(u.assignedRoles) && u.assignedRoles.includes('hod'));
              return (
                <option key={u.id} value={u.id}>
                  {u.name} {isHod ? '(HoD)' : `(${u.role.replace(/_/g, ' ')})`}
                </option>
              );
            })}
          </select>
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newDeptDesc}
            onChange={(e) => setNewDeptDesc(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <button
            type="submit"
            disabled={savingDept}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{savingDept ? 'Saving...' : 'Add Dept'}</span>
          </button>
        </form>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Department Name</th>
                <th className="py-2 pr-3">Linked HoD</th>
                <th className="py-2 pr-3">Subjects</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const isEditing = editingDeptId === dept.id;
                const linkedSubCount = subjects.filter(
                  (s) => s.department.toLowerCase() === dept.name.toLowerCase()
                ).length;
                return (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    {isEditing ? (
                      <>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editDeptCode}
                            onChange={(e) => setEditDeptCode(e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded font-mono"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editDeptName}
                            onChange={(e) => setEditDeptName(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-semibold"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={editDeptHodUserId}
                            onChange={(e) => {
                              const id = e.target.value;
                              setEditDeptHodUserId(id);
                              const u = hodCandidates.find((c) => c.id === id);
                              setEditDeptHead(u?.name || '');
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                          >
                            <option value="">-- Unassigned HoD --</option>
                            {hodCandidates.map((u) => {
                              const isHod = u.role === 'hod' || (Array.isArray(u.assignedRoles) && u.assignedRoles.includes('hod'));
                              return (
                                <option key={u.id} value={u.id}>
                                  {u.name} {isHod ? '(HoD)' : `(${u.role.replace(/_/g, ' ')})`}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editDeptDesc}
                            onChange={(e) => setEditDeptDesc(e.target.value)}
                            placeholder="Description"
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                          />
                        </td>
                        <td className="py-2 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            disabled={savingDept}
                            onClick={() => handleSaveDepartmentEdit(dept)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDeptId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-3 font-mono text-slate-600">{dept.code || '—'}</td>
                        <td className="py-2 pr-3">
                          <div className="font-semibold text-slate-900">{dept.name}</div>
                          {dept.description && (
                            <div className="text-[11px] text-slate-500">{dept.description}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {dept.headName ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>{dept.headName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Not linked — click Edit
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 font-mono text-slate-600">{linkedSubCount}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {confirmDeleteDeptId === dept.id ? (
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={savingDept}
                                onClick={() => handleDeleteDepartment(dept)}
                                className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Confirm Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDeptId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDeptId(dept.id);
                                  setEditDeptName(dept.name);
                                  setEditDeptCode(dept.code || '');
                                  setEditDeptHodUserId(dept.hodUserId || '');
                                  setEditDeptHead(dept.headName || '');
                                  setEditDeptDesc(dept.description || '');
                                }}
                                className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title={`Edit ${dept.name}`}
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDeptId(dept.id)}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title={`Remove ${dept.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Master Timetable Subjects Catalogue (Add, Edit & Remove) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>06. Master Timetable Subjects ({subjects.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, or remove curriculum subjects (including Library Lesson, Arts, Music, Nutrition, French, Swimming) and assign their department and specialist room requirements.
          </p>
        </div>

        <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 items-center">
          <input
            type="text"
            placeholder="Subject Name (e.g. French, Drama)"
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            required
            className="sm:col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="text"
            placeholder="Code (e.g. FRE)"
            value={newSubCode}
            onChange={(e) => setNewSubCode(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-mono"
          />
          <select
            value={newSubDept}
            onChange={(e) => setNewSubDept(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          >
            {departmentNameOptions.map((dn) => (
              <option key={dn} value={dn}>{dn}</option>
            ))}
          </select>
          <select
            value={newSubRoomType}
            onChange={(e) => setNewSubRoomType(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
          >
            {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={newSubPractical}
                onChange={(e) => setNewSubPractical(e.target.checked)}
                className="rounded text-slate-900"
              />
              <span>Prac</span>
            </label>
            <button
              type="submit"
              disabled={savingSub}
              className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{savingSub ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
        </form>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Subject Name</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Required Facility</th>
                <th className="py-2 pr-3">Practical</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => {
                const isEditing = editingSubId === sub.id;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    {isEditing ? (
                      <>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editSubCode}
                            onChange={(e) => setEditSubCode(e.target.value)}
                            className="w-16 px-2 py-1 border border-slate-300 rounded font-mono"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-semibold"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={editSubDept}
                            onChange={(e) => setEditSubDept(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                          >
                            {!departmentNameOptions.includes(editSubDept) && editSubDept && (
                              <option value={editSubDept}>{editSubDept}</option>
                            )}
                            {departmentNameOptions.map((dn) => (
                              <option key={dn} value={dn}>{dn}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={editSubRoomType}
                            onChange={(e) => setEditSubRoomType(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                          >
                            {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={editSubPractical}
                            onChange={(e) => setEditSubPractical(e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-2 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            disabled={savingSub}
                            onClick={() => handleSaveSubjectEdit(sub)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            <X className="w-3 h-3 inline" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-3 font-mono text-slate-600">{sub.code}</td>
                        <td className="py-2 pr-3 font-semibold text-slate-900">
                          {sub.name}
                          {sub.name.toLowerCase().includes('library') && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              Linked to Library Bookings
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">{sub.department}</td>
                        <td className="py-2 pr-3 text-slate-600">{ROOM_TYPE_LABELS[sub.requiresRoomType] || sub.requiresRoomType}</td>
                        <td className="py-2 pr-3 text-slate-600">{sub.isPractical ? 'Yes' : 'No'}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {confirmDeleteSubId === sub.id ? (
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={savingSub}
                                onClick={() => handleDeleteSubject(sub)}
                                className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Confirm Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSubId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubId(sub.id);
                                  setEditSubName(sub.name);
                                  setEditSubCode(sub.code);
                                  setEditSubDept(sub.department);
                                  setEditSubRoomType(sub.requiresRoomType || 'general');
                                  setEditSubPractical(Boolean(sub.isPractical));
                                }}
                                className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title={`Edit ${sub.name}`}
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSubId(sub.id)}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title={`Remove ${sub.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
