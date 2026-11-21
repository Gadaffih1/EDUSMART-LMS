import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Calendar,
  LayoutGrid,
  Printer,
  RefreshCw,
  TableProperties,
  UserCheck,
  Users,
} from 'lucide-react';
import type { User } from '../../types';
import {
  ttApiFetch,
  type ScheduleConfig,
  type TimetableBootstrapResponse,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableEntry,
  type TimetableStream,
  type TimetableVersion,
} from './timetableTypes';
import { SubjectAllocationTable } from './SubjectAllocationTable';
import { TeacherAssignmentsPanel } from './TeacherAssignmentsPanel';
import { RemedialConfigPanel } from './RemedialConfigPanel';
import { SharedFacilitiesPanel } from './SharedFacilitiesPanel';
import { TimetableViewsAndPrintPanel } from './TimetableViewsAndPrintPanel';

interface TimetablePortalProps {
  user: User;
  schoolName?: string;
}

type AdminSectionTab =
  | 'allocations'
  | 'teachers'
  | 'remedials'
  | 'facilities'
  | 'timetables';

const ADMIN_ROLES = new Set([
  'admin',
  'head_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
]);

export const TimetablePortal: React.FC<TimetablePortalProps> = ({
  user,
  schoolName = 'EduSmart School',
}) => {
  const isAdminViewer = ADMIN_ROLES.has((user.role || '').toLowerCase());

  // Admin mode full state
  const [bootstrap, setBootstrap] = useState<TimetableBootstrapResponse | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('allocations');
  const [preselectCategory, setPreselectCategory] = useState<TimetableCategoryId | null>(null);
  const [preselectSubjectId, setPreselectSubjectId] = useState<string | null>(null);
  const [preselectRemedialType, setPreselectRemedialType] = useState<
    'remedial_1' | 'remedial_2' | null
  >(null);

  // Read-only published state for Teachers / Students / Parents
  const [publishedData, setPublishedData] = useState<{
    categories: TimetableCategoryMeta[];
    weekdays: string[];
    scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
    streams: TimetableStream[];
    version: TimetableVersion | null;
    entries: TimetableEntry[];
  } | null>(null);
  const [roStreamKey, setRoStreamKey] = useState<string>('');
  const [roPrinting, setRoPrinting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (versionOverride?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (isAdminViewer) {
          const vId = versionOverride ?? selectedVersionId;
          const query = vId ? `?versionId=${encodeURIComponent(vId)}` : '';
          const data = await ttApiFetch<TimetableBootstrapResponse>(
            `/api/timetable/bootstrap${query}`
          );
          setBootstrap(data);
          if (data.activeVersion) {
            setSelectedVersionId(data.activeVersion.id);
          }
        } else {
          const data = await ttApiFetch('/api/timetable/published');
          setPublishedData(data);
          if (data.streams?.length > 0 && !roStreamKey) {
            const matchGrade = user.grade;
            const matchStream = user.stream;
            const matched =
              data.streams.find(
                (s: TimetableStream) =>
                  s.grade === matchGrade &&
                  (!matchStream || s.stream.toLowerCase() === matchStream.toLowerCase())
              ) || data.streams[0];
            if (matched) setRoStreamKey(`${matched.grade}::${matched.stream}`);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load timetable data.');
      } finally {
        setLoading(false);
      }
    },
    [isAdminViewer, selectedVersionId, roStreamKey, user.grade, user.stream]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!roPrinting) return;
    document.body.classList.add('printing-portal-active');
    const cleanup = () => {
      document.body.classList.remove('printing-portal-active');
      setRoPrinting(false);
    };
    window.addEventListener('afterprint', cleanup);
    const t = window.setTimeout(() => window.print(), 80);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-portal-active');
    };
  }, [roPrinting]);

  const isTeacherRole =
    user.role === 'teacher' ||
    user.role === 'class_teacher' ||
    user.role === 'hod' ||
    user.role === 'senior_teacher';

  const readOnlyEntries = useMemo(() => {
    if (!publishedData) return [];
    if (isTeacherRole) {
      return publishedData.entries.filter((e) => e.teacherId === user.id);
    }
    const [gStr, ...rest] = roStreamKey.split('::');
    const g = Number(gStr);
    const st = rest.join('::');
    return publishedData.entries.filter((e) => e.grade === g && e.stream === st);
  }, [publishedData, isTeacherRole, user.id, roStreamKey]);

  const readOnlyPeriods = useMemo(() => {
    if (!publishedData) return [];
    const byNum = new Map<
      number,
      { periodNumber: number; label: string; startTime: string; endTime: string }
    >();
    for (const cfg of Object.values(publishedData.scheduleConfigs)) {
      for (const p of cfg.periods) {
        if (!byNum.has(p.periodNumber)) {
          byNum.set(p.periodNumber, {
            periodNumber: p.periodNumber,
            label: p.label,
            startTime: p.startTime,
            endTime: p.endTime,
          });
        }
      }
    }
    return Array.from(byNum.values()).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [publishedData]);

  if (loading && !bootstrap && !publishedData) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading EduSmart Timetable...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700 flex items-center justify-between">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => void loadData()}
          className="px-3 py-1.5 bg-red-50 border border-red-200 rounded text-xs font-medium text-red-800 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  // Non-Admin Published Timetable View (Teachers, Students, Parents)
  if (!isAdminViewer) {
    const days = publishedData?.weekdays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const entriesBySlot = new Map<string, TimetableEntry[]>();
    for (const e of readOnlyEntries) {
      const k = `${e.dayOfWeek}::${e.periodNumber}`;
      if (!entriesBySlot.has(k)) entriesBySlot.set(k, []);
      entriesBySlot.get(k)!.push(e);
    }

    const sheetTitle = isTeacherRole
      ? `My Teaching & Supervision Timetable — ${user.name}`
      : `Class Timetable — Grade ${roStreamKey.replace('::', ' ')}`;

    const renderGrid = () => (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="py-2 px-3 w-32 border-r border-slate-200">Period / Time</th>
              {days.map((d) => (
                <th key={d} className="py-2 px-2.5 border-r border-slate-200 last:border-r-0">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {readOnlyPeriods.map((slot) => (
              <tr key={slot.periodNumber} className="align-top">
                <td className="py-2 px-3 bg-slate-50/60 border-r border-slate-200 font-mono">
                  <div className="font-semibold text-slate-900">{slot.label}</div>
                  <div className="text-[11px] text-slate-500">
                    {slot.startTime}–{slot.endTime}
                  </div>
                </td>
                {days.map((day) => {
                  const list = entriesBySlot.get(`${day}::${slot.periodNumber}`) || [];
                  return (
                    <td key={day} className="p-2 border-r border-slate-200 last:border-r-0">
                      {list.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <div className="space-y-1">
                          {list.map((e) => (
                            <div
                              key={e.id}
                              className="rounded border border-slate-200 bg-white p-1.5"
                            >
                              <div className="font-semibold text-slate-900">{e.subjectName}</div>
                              <div className="text-[11px] text-slate-600">
                                {isTeacherRole ? `Grade ${e.grade} ${e.stream}` : e.teacherName}
                              </div>
                              {e.facilityName && (
                                <div className="text-[10px] text-slate-500">{e.facilityName}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{sheetTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {publishedData?.version
                ? `${publishedData.version.name} · ${publishedData.version.termLabel} ${publishedData.version.academicYear}`
                : 'No published timetable available yet'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isTeacherRole && publishedData && publishedData.streams.length > 0 && (
              <select
                value={roStreamKey}
                onChange={(e) => setRoStreamKey(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
              >
                {publishedData.streams.map((st) => (
                  <option key={`${st.grade}::${st.stream}`} value={`${st.grade}::${st.stream}`}>
                    Grade {st.grade} · {st.stream}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={readOnlyEntries.length === 0}
              onClick={() => setRoPrinting(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Timetable
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {!publishedData?.version || readOnlyEntries.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No published timetable sessions are scheduled for this view yet.
            </div>
          ) : (
            renderGrid()
          )}
        </div>

        {roPrinting &&
          createPortal(
            <div className="printable-credential-portal hidden print:block bg-white text-slate-900 p-4">
              <div className="mb-3 border-b border-slate-300 pb-2">
                <div className="text-base font-bold">{schoolName}</div>
                <div className="text-xs text-slate-600">{sheetTitle}</div>
              </div>
              {renderGrid()}
            </div>,
            document.body
          )}
      </div>
    );
  }

  if (!bootstrap) return null;

  const tabs: Array<{ id: AdminSectionTab; label: string; icon: React.ReactNode; count?: number }> = [
    {
      id: 'allocations',
      label: 'Subject Allocations',
      icon: <TableProperties className="w-4 h-4" />,
    },
    {
      id: 'teachers',
      label: 'Teachers & Supervisors',
      icon: <UserCheck className="w-4 h-4" />,
      count: bootstrap.teacherAssignments.length,
    },
    {
      id: 'remedials',
      label: 'Remedial 1 & 2',
      icon: <Users className="w-4 h-4" />,
      count: bootstrap.remedialConfigs.length,
    },
    {
      id: 'facilities',
      label: 'Shared Facilities',
      icon: <Building2 className="w-4 h-4" />,
      count: bootstrap.facilities.length,
    },
    {
      id: 'timetables',
      label: 'Timetables, Audit & Print',
      icon: <LayoutGrid className="w-4 h-4" />,
      count: bootstrap.versions.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Clean Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              EduSmart Timetable Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Independent Category 1–3 subject & activity allocations, explicit teacher &
            supervisor authorization, Remedial 1 & 2 learner-group scheduling, shared facility
            capacity enforcement, validation, and printing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'allocations' && (
        <SubjectAllocationTable
          categories={bootstrap.categories}
          weekdays={bootstrap.weekdays}
          scheduleConfigs={bootstrap.scheduleConfigs}
          subjects={bootstrap.subjects}
          facilities={bootstrap.facilities}
          teacherAssignments={bootstrap.teacherAssignments}
          remedialConfigs={bootstrap.remedialConfigs}
          canManage={bootstrap.canManage}
          onRefresh={() => loadData()}
          onJumpToTeachers={(catId, subId) => {
            setPreselectCategory(catId);
            setPreselectSubjectId(subId);
            setActiveTab('teachers');
          }}
          onJumpToRemedials={(catId, remType) => {
            setPreselectCategory(catId);
            setPreselectRemedialType(remType);
            setActiveTab('remedials');
          }}
        />
      )}

      {activeTab === 'teachers' && (
        <TeacherAssignmentsPanel
          categories={bootstrap.categories}
          weekdays={bootstrap.weekdays}
          subjects={bootstrap.subjects}
          facilities={bootstrap.facilities}
          streams={bootstrap.streams}
          teachers={bootstrap.teachers}
          teacherAssignments={bootstrap.teacherAssignments}
          canManage={bootstrap.canManage}
          preselectCategory={preselectCategory}
          preselectSubjectId={preselectSubjectId}
          onRefresh={() => loadData()}
        />
      )}

      {activeTab === 'remedials' && (
        <RemedialConfigPanel
          categories={bootstrap.categories}
          weekdays={bootstrap.weekdays}
          scheduleConfigs={bootstrap.scheduleConfigs}
          facilities={bootstrap.facilities}
          streams={bootstrap.streams}
          teachers={bootstrap.teachers}
          students={bootstrap.students}
          remedialConfigs={bootstrap.remedialConfigs}
          canManage={bootstrap.canManage}
          preselectCategory={preselectCategory}
          preselectType={preselectRemedialType}
          onRefresh={() => loadData()}
        />
      )}

      {activeTab === 'facilities' && (
        <SharedFacilitiesPanel
          weekdays={bootstrap.weekdays}
          facilities={bootstrap.facilities}
          utilization={bootstrap.audit.facilityUtilization}
          canManage={bootstrap.canManage}
          onRefresh={() => loadData()}
        />
      )}

      {activeTab === 'timetables' && (
        <TimetableViewsAndPrintPanel
          schoolName={schoolName}
          categories={bootstrap.categories}
          weekdays={bootstrap.weekdays}
          scheduleConfigs={bootstrap.scheduleConfigs}
          facilities={bootstrap.facilities}
          streams={bootstrap.streams}
          teachers={bootstrap.teachers}
          versions={bootstrap.versions}
          activeVersion={bootstrap.activeVersion}
          entries={bootstrap.entries}
          audit={bootstrap.audit}
          canManage={bootstrap.canManage}
          onSelectVersion={(vId) => {
            setSelectedVersionId(vId);
            void loadData(vId);
          }}
          onRefresh={(vId) => loadData(vId)}
        />
      )}
    </div>
  );
};
