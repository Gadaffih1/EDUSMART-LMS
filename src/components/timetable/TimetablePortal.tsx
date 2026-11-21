import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  type AllocationProcessingMode,
  type ScheduleConfig,
  type SchoolBrandInfo,
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
import { TimetableMatrixGrid, TimetableViewsAndPrintPanel } from './TimetableViewsAndPrintPanel';

interface TimetablePortalProps {
  user: User;
  schoolId?: string;
  schoolName?: string;
  schoolLogoUrl?: string;
}

type PrimarySectionTab = 'allocations' | 'timetables' | 'resources';
type ResourceSubTab = 'teachers' | 'remedials' | 'facilities';

const ADMIN_ROLES = new Set([
  'super_admin',
  'admin',
  'principal',
  'head_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
]);

function userIsTimetableAdmin(user: User): boolean {
  if (ADMIN_ROLES.has((user.role || '').toLowerCase())) return true;
  if (Array.isArray(user.assignedRoles)) {
    return user.assignedRoles.some((r) => ADMIN_ROLES.has(String(r || '').toLowerCase()));
  }
  return false;
}

export const TimetablePortal: React.FC<TimetablePortalProps> = ({
  user,
  schoolId,
  schoolName = 'EduSmart School',
  schoolLogoUrl,
}) => {
  const isAdminViewer = useMemo(() => userIsTimetableAdmin(user), [user]);

  const [bootstrap, setBootstrap] = useState<TimetableBootstrapResponse | null>(null);
  const [activeTab, setActiveTab] = useState<PrimarySectionTab>('allocations');
  const [resourceSubTab, setResourceSubTab] = useState<ResourceSubTab>('teachers');
  const [preselectCategory, setPreselectCategory] = useState<TimetableCategoryId | null>(null);
  const [preselectSubjectId, setPreselectSubjectId] = useState<string | null>(null);
  const [preselectRemedialType, setPreselectRemedialType] = useState<
    'remedial_1' | 'remedial_2' | null
  >(null);
  const [generatedFocusCategory, setGeneratedFocusCategory] =
    useState<TimetableCategoryId | null>(null);

  const selectedVersionRef = useRef<string | undefined>(undefined);
  const roStreamKeyRef = useRef<string>('');

  // Read-only published state for Teachers / Students / Parents
  const [publishedData, setPublishedData] = useState<{
    school?: SchoolBrandInfo;
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
          const vId = versionOverride !== undefined ? versionOverride : selectedVersionRef.current;
          const query = vId ? `?versionId=${encodeURIComponent(vId)}` : '';
          const data = await ttApiFetch<TimetableBootstrapResponse>(
            `/api/timetable/bootstrap${query}`,
            {},
            schoolId
          );
          setBootstrap(data);
          selectedVersionRef.current = data.activeVersion?.id;
        } else {
          const data = await ttApiFetch('/api/timetable/published', {}, schoolId);
          setPublishedData(data);
          if (data.streams?.length > 0 && !roStreamKeyRef.current) {
            const matchGrade = user.grade;
            const matchStream = user.stream;
            const matched =
              data.streams.find(
                (s: TimetableStream) =>
                  s.grade === matchGrade &&
                  (!matchStream || s.stream.toLowerCase() === matchStream.toLowerCase())
              ) || data.streams[0];
            if (matched) {
              const key = `${matched.grade}::${matched.stream}`;
              roStreamKeyRef.current = key;
              setRoStreamKey(key);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load timetable data.');
      } finally {
        setLoading(false);
      }
    },
    [isAdminViewer, schoolId, user.grade, user.stream]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleChangeAllocationMode = useCallback(
    async (catId: TimetableCategoryId, mode: AllocationProcessingMode) => {
      await ttApiFetch(
        `/api/timetable/allocation-mode/${catId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ allocationMode: mode }),
        },
        schoolId
      );
      await loadData();
    },
    [loadData, schoolId]
  );

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
    if (!isTeacherRole && roStreamKey) {
      const [gStr, ...rest] = roStreamKey.split('::');
      const stObj = publishedData.streams.find(
        (s) => s.grade === Number(gStr) && s.stream === rest.join('::')
      );
      if (stObj && publishedData.scheduleConfigs[stObj.categoryId]) {
        return publishedData.scheduleConfigs[stObj.categoryId].periods;
      }
    }
    return (
      publishedData.scheduleConfigs.cat_4_6?.periods ||
      publishedData.scheduleConfigs.cat_7_9?.periods ||
      publishedData.scheduleConfigs.cat_1_3?.periods ||
      []
    );
  }, [publishedData, isTeacherRole, roStreamKey]);

  const resolvedSchoolBrand: SchoolBrandInfo | undefined = useMemo(() => {
    const src = bootstrap?.school || publishedData?.school;
    if (src) {
      return {
        ...src,
        logoUrl: src.logoUrl || schoolLogoUrl || '',
        name: src.name || schoolName,
      };
    }
    return {
      id: schoolId || '',
      name: schoolName,
      logoUrl: schoolLogoUrl || '',
      address: '',
      city: '',
      phone: '',
      email: '',
      motto: '',
      printFooterNotes: '',
    };
  }, [bootstrap?.school, publishedData?.school, schoolId, schoolLogoUrl, schoolName]);

  if (loading && !bootstrap && !publishedData) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading EduSmart Timetable...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700 flex items-center justify-between gap-4">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => void loadData()}
          className="px-3 py-1.5 bg-red-50 border border-red-200 rounded text-xs font-medium text-red-800 hover:bg-red-100 whitespace-nowrap shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  // Non-Admin Published Timetable View (Teachers, Students, Parents)
  if (!isAdminViewer) {
    const days = publishedData?.weekdays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sheetTitle = isTeacherRole
      ? `My Teaching & Supervision Timetable — ${user.name}`
      : `Class Timetable — Grade ${roStreamKey.replace('::', ' ')}`;
    const sheetSubtitle = publishedData?.version
      ? `${publishedData.version.name} · ${publishedData.version.termLabel} ${publishedData.version.academicYear}`
      : 'No published timetable available yet';

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{sheetTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{sheetSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isTeacherRole && publishedData && publishedData.streams.length > 0 && (
              <select
                value={roStreamKey}
                onChange={(e) => {
                  roStreamKeyRef.current = e.target.value;
                  setRoStreamKey(e.target.value);
                }}
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

        {!publishedData?.version || readOnlyEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-xs text-slate-500">
            No published timetable sessions are scheduled for this view yet.
          </div>
        ) : (
          <TimetableMatrixGrid
            title={sheetTitle}
            subtitle={sheetSubtitle}
            days={days}
            periods={readOnlyPeriods}
            entries={readOnlyEntries}
            mode={isTeacherRole ? 'teacher' : 'stream'}
          />
        )}

        {roPrinting &&
          createPortal(
            <div className="printable-credential-portal hidden print:block bg-white text-slate-900 p-4">
              <div className="mb-3 border-b-2 border-slate-800 pb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {resolvedSchoolBrand?.logoUrl && (
                    <img
                      src={resolvedSchoolBrand.logoUrl}
                      alt={`${resolvedSchoolBrand.name} logo`}
                      className="w-11 h-11 object-contain"
                    />
                  )}
                  <div>
                    <div className="text-base font-bold uppercase">
                      {resolvedSchoolBrand?.name || schoolName}
                    </div>
                    {resolvedSchoolBrand?.motto && (
                      <div className="text-[11px] italic text-slate-600">
                        {resolvedSchoolBrand.motto}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{sheetTitle}</div>
                  <div className="text-[11px] text-slate-600">{sheetSubtitle}</div>
                </div>
              </div>
              <TimetableMatrixGrid
                title={sheetTitle}
                subtitle={sheetSubtitle}
                days={days}
                periods={readOnlyPeriods}
                entries={readOnlyEntries}
                mode={isTeacherRole ? 'teacher' : 'stream'}
                compact
                hideHeader
              />
            </div>,
            document.body
          )}
      </div>
    );
  }

  if (!bootstrap) return null;

  const primaryTabs: Array<{
    id: PrimarySectionTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'allocations',
      label: 'Subject Allocations & Generate',
      icon: <TableProperties className="w-4 h-4" />,
    },
    {
      id: 'timetables',
      label: 'Timetables & Print',
      icon: <LayoutGrid className="w-4 h-4" />,
      count: bootstrap.versions.length,
    },
    {
      id: 'resources',
      label: 'Teachers, Remedials & Facilities',
      icon: <UserCheck className="w-4 h-4" />,
      count: bootstrap.teacherAssignments.length,
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
              EduSmart Automatic Timetable
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure weekly lessons per subject across Grades 1–3, Grades 4–6, and Grades 7–9,
            then automatically generate collision-free stream, teacher, grade, category, and master
            timetables.
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

      {/* Simplified 3-Tab Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {primaryTabs.map((tab) => {
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

      {/* Tab 1: Subject Allocations & Automatic Generate */}
      {activeTab === 'allocations' && (
        <SubjectAllocationTable
          schoolId={schoolId}
          categories={bootstrap.categories}
          weekdays={bootstrap.weekdays}
          scheduleConfigs={bootstrap.scheduleConfigs}
          subjects={bootstrap.subjects}
          gradeOverrides={bootstrap.gradeOverrides ?? []}
          facilities={bootstrap.facilities}
          streams={bootstrap.streams}
          teacherAssignments={bootstrap.teacherAssignments}
          remedialConfigs={bootstrap.remedialConfigs}
          streamAllocations={bootstrap.audit.streamAllocations}
          categoryTotals={bootstrap.audit.categoryTotals}
          canManage={bootstrap.canManage}
          onRefresh={loadData}
          onGeneratedSuccess={(versionId, targetCat) => {
            selectedVersionRef.current = versionId;
            setGeneratedFocusCategory(targetCat ?? null);
            setActiveTab('timetables');
          }}
          onJumpToTeachers={(catId, subId) => {
            setPreselectCategory(catId);
            setPreselectSubjectId(subId);
            setResourceSubTab('teachers');
            setActiveTab('resources');
          }}
          onJumpToRemedials={(catId, remType) => {
            setPreselectCategory(catId);
            setPreselectRemedialType(remType);
            setResourceSubTab('remedials');
            setActiveTab('resources');
          }}
        />
      )}

      {/* Tab 2: Timetables, Manual Edit & 7-Mode Print */}
      {activeTab === 'timetables' && (
        <TimetableViewsAndPrintPanel
          schoolId={schoolId}
          schoolName={resolvedSchoolBrand?.name || schoolName}
          school={resolvedSchoolBrand}
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
          initialCategory={generatedFocusCategory}
          onSelectVersion={(vId) => {
            selectedVersionRef.current = vId;
            void loadData(vId);
          }}
          onRefresh={loadData}
        />
      )}

      {/* Tab 3: Teachers, Remedials & Shared Facilities */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setResourceSubTab('teachers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${
                resourceSubTab === 'teachers'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Teacher &amp; Supervisor Assignments ({bootstrap.teacherAssignments.length})
            </button>
            <button
              type="button"
              onClick={() => setResourceSubTab('remedials')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${
                resourceSubTab === 'remedials'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Remedial 1 &amp; 2 Groups ({bootstrap.remedialConfigs.length})
            </button>
            <button
              type="button"
              onClick={() => setResourceSubTab('facilities')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${
                resourceSubTab === 'facilities'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Shared Facilities ({bootstrap.facilities.length})
            </button>
          </div>

          {resourceSubTab === 'teachers' && (
            <TeacherAssignmentsPanel
              schoolId={schoolId}
              categories={bootstrap.categories}
              weekdays={bootstrap.weekdays}
              scheduleConfigs={bootstrap.scheduleConfigs}
              subjects={bootstrap.subjects}
              facilities={bootstrap.facilities}
              streams={bootstrap.streams}
              teachers={bootstrap.teachers}
              teacherAssignments={bootstrap.teacherAssignments}
              streamAllocations={bootstrap.audit.streamAllocations}
              categoryTotals={bootstrap.audit.categoryTotals}
              canManage={bootstrap.canManage}
              preselectCategory={preselectCategory}
              preselectSubjectId={preselectSubjectId}
              onChangeAllocationMode={handleChangeAllocationMode}
              onRefresh={() => loadData()}
            />
          )}

          {resourceSubTab === 'remedials' && (
            <RemedialConfigPanel
              schoolId={schoolId}
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

          {resourceSubTab === 'facilities' && (
            <SharedFacilitiesPanel
              schoolId={schoolId}
              weekdays={bootstrap.weekdays}
              facilities={bootstrap.facilities}
              utilization={bootstrap.audit.facilityUtilization}
              canManage={bootstrap.canManage}
              onRefresh={() => loadData()}
            />
          )}
        </div>
      )}
    </div>
  );
};
