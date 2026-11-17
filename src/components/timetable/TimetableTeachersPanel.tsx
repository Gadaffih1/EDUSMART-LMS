import React, { useMemo, useState } from 'react';
import { CheckCircle2, Save, Search, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { TTConfigData, TTPeriodItem, TTSubjectItem, TTTeacherProfileItem, ttApiFetch } from './timetableTypes';

interface TimetableTeachersPanelProps {
  teachers: TTTeacherProfileItem[];
  subjects: TTSubjectItem[];
  config: TTConfigData;
  periods: TTPeriodItem[];
  onRefresh: () => Promise<void>;
}

export const TimetableTeachersPanel: React.FC<TimetableTeachersPanelProps> = ({
  teachers,
  subjects,
  config,
  periods,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(teachers[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter(
      (t) =>
        !q ||
        t.teacherName.toLowerCase().includes(q) ||
        t.teacherEmail.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [teachers, query]);

  const currentTeacher = teachers.find((t) => t.id === selectedId) || teachers[0];

  const [edits, setEdits] = useState<Record<string, TTTeacherProfileItem>>({});
  const activeDraft: TTTeacherProfileItem | undefined = currentTeacher
    ? edits[currentTeacher.id] || currentTeacher
    : undefined;

  const patchDraft = (patch: Partial<TTTeacherProfileItem>) => {
    if (!currentTeacher) return;
    setEdits((prev) => ({
      ...prev,
      [currentTeacher.id]: { ...(prev[currentTeacher.id] || currentTeacher), ...patch },
    }));
  };

  const lessonPeriods = useMemo(
    () => periods.filter((p) => p.kind === 'lesson').sort((a, b) => a.periodNumber - b.periodNumber),
    [periods]
  );

  const toggleQualification = (subjName: string) => {
    if (!activeDraft) return;
    const exists = activeDraft.qualifiedSubjects.includes(subjName);
    patchDraft({
      qualifiedSubjects: exists
        ? activeDraft.qualifiedSubjects.filter((s) => s !== subjName)
        : [...activeDraft.qualifiedSubjects, subjName],
    });
  };

  const cycleSlotState = (day: string, periodNum: number) => {
    if (!activeDraft) return;
    const isUnavail = activeDraft.availability?.[day]?.[String(periodNum)] === false;
    const isPrefFree = activeDraft.preferredFreePeriods.some(
      (pf) => pf.day === day && pf.period === periodNum
    );

    const nextAvail = { ...(activeDraft.availability || {}) };
    nextAvail[day] = { ...(nextAvail[day] || {}) };
    let nextPrefFree = [...activeDraft.preferredFreePeriods];

    if (!isUnavail && !isPrefFree) {
      // Available -> Preferred Free
      nextPrefFree.push({ day, period: periodNum });
    } else if (isPrefFree) {
      // Preferred Free -> Unavailable
      nextPrefFree = nextPrefFree.filter((pf) => !(pf.day === day && pf.period === periodNum));
      nextAvail[day][String(periodNum)] = false;
    } else {
      // Unavailable -> Available
      delete nextAvail[day][String(periodNum)];
    }

    patchDraft({ availability: nextAvail, preferredFreePeriods: nextPrefFree });
  };

  const handleSaveTeacher = async () => {
    if (!activeDraft) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await ttApiFetch(`/api/timetable/teachers/${activeDraft.id}`, {
        method: 'PUT',
        body: JSON.stringify(activeDraft),
      });
      await onRefresh();
      setStatusMsg(`Saved qualification, workload caps, and availability matrix for ${activeDraft.teacherName}.`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to save teacher profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Roster synced from existing EduSmart HR/Users */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Faculty Roster ({teachers.length})</h3>
          <p className="text-[11px] text-slate-500">
            Synced directly from EduSmart HR &amp; Staff records. Inactive staff keep historical timetables intact.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter teacher name or email..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
          {filteredTeachers.map((t) => {
            const selected = currentTeacher?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left py-2.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                  selected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{t.teacherName}</span>
                  <span className={`text-[10px] font-mono tabular-nums ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {t.maxDailyPeriods}d/{t.maxWeeklyPeriods}w
                  </span>
                </div>
                <div className={`text-[11px] truncate ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t.department} · {t.activeInTimetable ? 'Active' : 'Inactive (Historical Preserved)'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Detail Configurator */}
      {activeDraft ? (
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          {statusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{activeDraft.teacherName}</h3>
              <p className="text-xs text-slate-500 font-mono">
                {activeDraft.teacherEmail} · {activeDraft.tscNumber ? `TSC ${activeDraft.tscNumber}` : 'Linked Staff Profile'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => patchDraft({ activeInTimetable: !activeDraft.activeInTimetable })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer flex items-center gap-1.5 ${
                  activeDraft.activeInTimetable
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {activeDraft.activeInTimetable ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                <span>{activeDraft.activeInTimetable ? 'Active in New Schedules' : 'Inactive (Archived)'}</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTeacher}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Teacher Settings'}</span>
              </button>
            </div>
          </div>

          {/* Workload Caps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                value={activeDraft.department}
                onChange={(e) => patchDraft({ department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Max Daily Periods</label>
              <input
                type="number"
                min={1}
                max={10}
                value={activeDraft.maxDailyPeriods}
                onChange={(e) => patchDraft({ maxDailyPeriods: Number(e.target.value || 6) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Max Weekly Periods</label>
              <input
                type="number"
                min={1}
                max={45}
                value={activeDraft.maxWeeklyPeriods}
                onChange={(e) => patchDraft({ maxWeeklyPeriods: Number(e.target.value || 28) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Max Consecutive</label>
              <input
                type="number"
                min={1}
                max={6}
                value={activeDraft.maxConsecutiveLessons}
                onChange={(e) => patchDraft({ maxConsecutiveLessons: Number(e.target.value || 3) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Subject Qualification Mapping */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Subject Qualification Mapping ({activeDraft.qualifiedSubjects.length} selected):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((sub) => {
                const checked = activeDraft.qualifiedSubjects.includes(sub.name);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleQualification(sub.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      checked
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Teacher Availability & Preferred Free Matrix */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">
                Weekly Availability &amp; Preferred Free Matrix (click cell to cycle):
              </span>
              <span className="text-[11px] text-slate-500">
                White = Available · Amber = Preferred Free · Dark Rose = Unavailable
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2 text-left">Period</th>
                    {config.workingDays.map((d) => (
                      <th key={d} className="p-2">{d.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lessonPeriods.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 text-left font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        P{p.periodNumber} ({p.startTime})
                      </td>
                      {config.workingDays.map((d) => {
                        const isUnavail = activeDraft.availability?.[d]?.[String(p.periodNumber)] === false;
                        const isPrefFree = activeDraft.preferredFreePeriods.some(
                          (pf) => pf.day === d && pf.period === p.periodNumber
                        );
                        return (
                          <td key={`${d}-${p.periodNumber}`} className="p-1">
                            <button
                              type="button"
                              onClick={() => cycleSlotState(d, p.periodNumber)}
                              className={`w-full py-1.5 px-2 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
                                isUnavail
                                  ? 'bg-rose-100 border-rose-300 text-rose-900'
                                  : isPrefFree
                                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isUnavail ? 'Unavailable' : isPrefFree ? 'Pref. Free' : 'Available'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          Select a teacher from the faculty list to configure qualifications and availability.
        </div>
      )}
    </div>
  );
};
