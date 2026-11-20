import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  TimetableSlot, 
  SubjectName,
  PRIMARY_STREAMS, 
  JUNIOR_STREAMS,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS,
  ExamTimetableEntry,
  BellPeriodDef,
  TeacherAbsenceReport
} from '../../types';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';
import { listSubjects } from '../../utils/catalogStore';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { TeacherAbsenceReportModal } from './TeacherAbsenceReportModal';
import { ReliefBookingModal } from './ReliefBookingModal';
import { TeacherTimetableCaptureModal } from './TeacherTimetableCaptureModal';
import { TTWorkspacePayload, ttApiFetch } from './timetableTypes';
import { TimetableConfigPanel } from './TimetableConfigPanel';
import { TimetableAllocationsPanel } from './TimetableAllocationsPanel';
import { TimetableTeachersPanel } from './TimetableTeachersPanel';
import { TimetableDragDropEditor } from './TimetableDragDropEditor';
import { TimetableVersionsAndReportsPanel } from './TimetableVersionsAndReportsPanel';
import { TeacherLoadDashboard } from './TeacherLoadDashboard';
import { ExamScheduleManager } from './ExamScheduleManager';
import { ClassicTimetableSheet } from './ClassicTimetableSheet';
import { ScrollableMatrixTableWrapper } from '../common/ResponsiveUIKit';
import { 
  Calendar, 
  Clock, 
  Video, 
  Printer, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  User as UserIcon, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  X, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  CalendarDays, 
  Layers, 
  Building2, 
  GraduationCap, 
  FileText,
  Radio,
  Eye,
  Info,
  Shield,
  Lock,
  Save,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Check,
  Send,
  CalendarCheck,
  ListTodo,
  Sliders,
  UserCog,
  FileSpreadsheet,
  LayoutGrid,
  BarChart3
} from 'lucide-react';

interface TimetablePortalProps {
  currentUser: User;
  initialGrade?: GradeLevel;
  initialStream?: StreamName;
  initialPerspective?: TimetablePerspective;
  initialSuiteTab?: 'published' | 'config' | 'allocations' | 'teachers' | 'load_dashboard' | 'editor' | 'approvals';
  readOnly?: boolean;
}

type TimetablePerspective = 'grid' | 'today' | 'teacher' | 'rooms' | 'exams' | 'relief';

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday'
];

export type BellPeriod = BellPeriodDef;

export const TimetablePortal: React.FC<TimetablePortalProps> = ({
  currentUser,
  initialGrade,
  initialStream,
  initialPerspective,
  initialSuiteTab,
  readOnly = false
}) => {
  // Timetable slots & exams state from Storage (placed early for RBAC lookup)
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>(() => Storage.getAllTimetableSlots());
  const [examTimetables, setExamTimetables] = useState<ExamTimetableEntry[]>(() => Storage.getExamTimetables());
  const [bellSchedule, setBellSchedule] = useState<BellPeriodDef[]>(() => Storage.getBellSchedule());
  const [showPeriodTimingsModal, setShowPeriodTimingsModal] = useState(false);
  const [tempBellSchedule, setTempBellSchedule] = useState<BellPeriodDef[]>([]);

  const { currentTenant } = useTenant();
  const ADMIN_SUITE_ROLES = [
    'admin',
    'head_teacher',
    'deputy_head',
    'dean_of_studies',
    'curriculum_coordinator',
    'school_admin_staff',
    'senior_teacher',
    'hod',
  ];
  const heldUserRoles = [
    String(currentUser.role || '').toLowerCase(),
    ...(Array.isArray(currentUser.assignedRoles)
      ? currentUser.assignedRoles.map((r) => String(r || '').toLowerCase())
      : []),
    ...(currentUser.doubleAccessConfig?.enabled && currentUser.doubleAccessConfig.secondaryRole
      ? [String(currentUser.doubleAccessConfig.secondaryRole).toLowerCase()]
      : []),
  ];
  const isTimetableAdminUser =
    !readOnly &&
    (currentUser.accessScope === 'super_admin_only' ||
      heldUserRoles.some((r) => ADMIN_SUITE_ROLES.includes(r)));

  type SuiteTabId = 'published' | 'config' | 'allocations' | 'teachers' | 'load_dashboard' | 'editor' | 'approvals';
  const [suiteTab, setSuiteTab] = useState<SuiteTabId>(initialSuiteTab || 'published');
  useEffect(() => {
    if (initialSuiteTab && isTimetableAdminUser) {
      setSuiteTab(initialSuiteTab);
    }
  }, [initialSuiteTab, isTimetableAdminUser]);
  const [mobileGridDay, setMobileGridDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [allocationsDepartmentFilter, setAllocationsDepartmentFilter] = useState<string>('');
  const [ttWorkspace, setTtWorkspace] = useState<TTWorkspacePayload | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [resettingWorkspace, setResettingWorkspace] = useState(false);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetBanner, setResetBanner] = useState<string | null>(null);

  const loadWorkspace = async (versionId?: string) => {
    if (!isTimetableAdminUser) return;
    setLoadingWorkspace(true);
    setWorkspaceError(null);
    try {
      const qs = versionId ? `?versionId=${encodeURIComponent(versionId)}` : '';
      const data = await ttApiFetch<TTWorkspacePayload>(`/api/timetable/workspace${qs}`);
      setTtWorkspace(data);
    } catch (err: any) {
      setWorkspaceError(err?.message || 'Unable to sync the timetable workspace. Click Retry or Reset & Enable.');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleResetTimetableWorkspace = async (resetAllocations: boolean) => {
    if (!isTimetableAdminUser) return;
    setResettingWorkspace(true);
    setWorkspaceError(null);
    setResetBanner(null);
    try {
      const res = await ttApiFetch<{ ok: boolean; versionId: string; versionName: string }>(
        '/api/timetable/workspace/reset',
        {
          method: 'POST',
          body: JSON.stringify({ resetAllocations }),
        }
      );
      setShowResetPanel(false);
      await loadWorkspace(res.versionId);
      await loadPublishedBackendSchedule();
      setResetBanner(
        resetAllocations
          ? `Timetable workspace reset to clean CBC grade-band defaults and unlocked (${res.versionName}). All suite sections are enabled.`
          : `Timetable unlocked on a fresh editable draft (${res.versionName}). All suite sections are enabled and ready.`
      );
      window.setTimeout(() => setResetBanner(null), 7000);
    } catch (err: any) {
      setWorkspaceError(err?.message || 'Failed to reset timetable workspace.');
    } finally {
      setResettingWorkspace(false);
    }
  };

  const loadPublishedBackendSchedule = async () => {
    try {
      type PubEntry = {
        id: string;
        dayOfWeek: string;
        periodNumber: number;
        grade: number;
        stream: string;
        groupName?: string;
        subjectName: string;
        teacherNames?: string[];
        roomName?: string;
      };
      type PubPeriod = { periodNumber: number; label: string; kind: string; startTime: string; endTime: string };

      let resolvedPeriods: PubPeriod[] = [];
      let resolvedEntries: PubEntry[] = [];

      // Use role-scoped canonical endpoints for Student and Parent portals, falling back to /api/timetable/published
      const primaryRole = String(currentUser.role || '').toLowerCase();
      if (primaryRole === 'student' && currentUser.id) {
        try {
          const stuRes = await ttApiFetch<{
            published?: boolean;
            periods?: PubPeriod[];
            entries?: PubEntry[];
          }>(`/api/timetable/student/${encodeURIComponent(currentUser.id)}`);
          if (stuRes?.published && Array.isArray(stuRes.entries) && stuRes.entries.length > 0) {
            resolvedPeriods = stuRes.periods || [];
            resolvedEntries = stuRes.entries;
          }
        } catch {
          // fallback to /api/timetable/published below
        }
      } else if (primaryRole === 'parent' && currentUser.id) {
        try {
          const parRes = await ttApiFetch<{
            published?: boolean;
            periods?: PubPeriod[];
            children?: Array<{ entries?: PubEntry[] }>;
          }>(`/api/timetable/parent/${encodeURIComponent(currentUser.id)}`);
          if (parRes?.published && Array.isArray(parRes.children)) {
            const seenIds = new Set<string>();
            const merged: PubEntry[] = [];
            for (const ch of parRes.children) {
              for (const entry of ch.entries || []) {
                if (!seenIds.has(entry.id)) {
                  seenIds.add(entry.id);
                  merged.push(entry);
                }
              }
            }
            if (merged.length > 0) {
              resolvedPeriods = parRes.periods || [];
              resolvedEntries = merged;
            }
          }
        } catch {
          // fallback to /api/timetable/published below
        }
      }

      if (resolvedEntries.length === 0) {
        // Request teacher-only subset ONLY when explicitly opened in standalone teacher-only perspective;
        // otherwise load synced entries for Teacher View, Class/Stream View, and Master View together.
        const shouldRequestTeacherScope = initialPerspective === 'teacher';
        const publishedUrl = shouldRequestTeacherScope
          ? '/api/timetable/published?viewAs=teacher'
          : '/api/timetable/published';
        const pub = await ttApiFetch<{
          published: boolean;
          periods?: PubPeriod[];
          entries?: PubEntry[];
        }>(publishedUrl);

        if (pub?.published && Array.isArray(pub.entries) && pub.entries.length > 0) {
          resolvedPeriods = pub.periods || [];
          resolvedEntries = pub.entries;
        }
      }

      if (resolvedEntries.length > 0) {
        const periodTimeMap = new Map<number, { startTime: string; endTime: string }>();
        resolvedPeriods.forEach((p) => {
          if (p.kind === 'lesson' && p.periodNumber > 0) {
            periodTimeMap.set(p.periodNumber, { startTime: p.startTime, endTime: p.endTime });
          }
        });
        const mappedSlots: TimetableSlot[] = resolvedEntries.map((e) => {
          const tm = periodTimeMap.get(e.periodNumber);
          return {
            id: e.id,
            grade: e.grade as GradeLevel,
            stream: e.stream as StreamName,
            dayOfWeek: e.dayOfWeek as TimetableSlot['dayOfWeek'],
            period: e.periodNumber,
            startTime: tm?.startTime || '08:00',
            endTime: tm?.endTime || '08:40',
            subject: e.subjectName as SubjectName,
            teacherName: (e.teacherNames || []).join(', ') || 'Faculty',
            roomName: e.roomName || 'Classroom',
            notes: e.groupName && e.groupName !== 'Whole Class' ? `Group: ${e.groupName}` : undefined,
          };
        });
        setAllSlots(mappedSlots);
      }
    } catch {
      // Preserve database-hydrated timetable cache if backend does not yet have a published version
    }
  };

  useEffect(() => {
    loadPublishedBackendSchedule();
    if (isTimetableAdminUser) {
      loadWorkspace();
    }
  }, [currentUser.id, currentUser.schoolId, currentUser.role]);

  // Live Shared Facility Weekly Schedules (Swimming Pool, Computer Lab, Library, Science Lab, Sports Field)
  const [facilitySchedules, setFacilitySchedules] = useState<{
    versionName: string | null;
    workingDays: string[];
    periods: Array<{ periodNumber: number; label: string; startTime: string; endTime: string }>;
    facilities: Array<{
      id: string;
      name: string;
      roomCode: string;
      roomType: string;
      capacity: number;
      maxConcurrentClasses: number;
      responsibleStaff: string;
      location: string;
      isSharedFacility: boolean;
      bookedSlots: number;
      freeSlots: number;
      utilizationPct: number;
      clashCount: number;
      bookings: Array<{
        dayOfWeek: string;
        periodNumber: number;
        periodLabel: string;
        timeRange: string;
        streams: string[];
        streamLabel: string;
        isCombined: boolean;
        subjects: string[];
        subjectLabel: string;
        teachers: string[];
        responsibleTeacher: string;
        blockLength: number;
        occupancy: number;
        maxConcurrentClasses: number;
        hasClash: boolean;
      }>;
    }>;
  } | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  const [catalogRevision, setCatalogRevision] = useState(0);

  // Listen for storage updates
  useEffect(() => {
    const handleTimetableUpdate = () => {
      setAllSlots(Storage.getAllTimetableSlots());
      setExamTimetables(Storage.getExamTimetables());
    };
    const handleBellUpdate = () => {
      setBellSchedule(Storage.getBellSchedule());
    };
    const handleAbsenceUpdate = () => {
      setAbsenceReports(Storage.getTeacherAbsenceReports());
    };
    const handleCatalogUpdate = () => {
      setCatalogRevision((v) => v + 1);
    };
    window.addEventListener('timetable-updated', handleTimetableUpdate);
    window.addEventListener('bell-schedule-updated', handleBellUpdate);
    window.addEventListener('teacher-absence-reports-updated', handleAbsenceUpdate);
    window.addEventListener('subjects-catalog-updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('timetable-updated', handleTimetableUpdate);
      window.removeEventListener('bell-schedule-updated', handleBellUpdate);
      window.removeEventListener('teacher-absence-reports-updated', handleAbsenceUpdate);
      window.removeEventListener('subjects-catalog-updated', handleCatalogUpdate);
    };
  }, []);

  // Absence Reporting & Relief Management States
  const [absenceReports, setAbsenceReports] = useState<TeacherAbsenceReport[]>(() => Storage.getTeacherAbsenceReports());
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [reliefBookingSlot, setReliefBookingSlot] = useState<TimetableSlot | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState<boolean>(false);
  const [captureModalMode, setCaptureModalMode] = useState<'daily' | 'weekly'>('daily');
  const [teacherViewMode, setTeacherViewModeState] = useState<'daily' | 'weekly'>(() => {
    const saved = ClientDataStore.getPreference<{ teacherViewMode?: 'daily' | 'weekly'; classGridLayout?: 'classic_sheet' | 'period_cards' } | null>('edusmart_timetable_view_prefs_v1', null);
    return saved?.teacherViewMode === 'daily' ? 'daily' : 'weekly';
  });
  const [classGridLayout, setClassGridLayoutState] = useState<'classic_sheet' | 'period_cards'>(() => {
    const saved = ClientDataStore.getPreference<{ teacherViewMode?: 'daily' | 'weekly'; classGridLayout?: 'classic_sheet' | 'period_cards' } | null>('edusmart_timetable_view_prefs_v1', null);
    return saved?.classGridLayout === 'period_cards' ? 'period_cards' : 'classic_sheet';
  });

  const setTeacherViewMode = (mode: 'daily' | 'weekly') => {
    setTeacherViewModeState(mode);
    const cur = ClientDataStore.getPreference<Record<string, any>>('edusmart_timetable_view_prefs_v1', {});
    ClientDataStore.setPreference('edusmart_timetable_view_prefs_v1', { ...cur, teacherViewMode: mode });
  };

  const setClassGridLayout = (layout: 'classic_sheet' | 'period_cards') => {
    setClassGridLayoutState(layout);
    const cur = ClientDataStore.getPreference<Record<string, any>>('edusmart_timetable_view_prefs_v1', {});
    ClientDataStore.setPreference('edusmart_timetable_view_prefs_v1', { ...cur, classGridLayout: layout });
  };

  useEffect(() => {
    const onPrefSync = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === 'user_preferences') {
        const saved = ClientDataStore.getPreference<{ teacherViewMode?: 'daily' | 'weekly'; classGridLayout?: 'classic_sheet' | 'period_cards' } | null>('edusmart_timetable_view_prefs_v1', null);
        if (saved && typeof saved === 'object') {
          if (saved.teacherViewMode === 'daily' || saved.teacherViewMode === 'weekly') {
            setTeacherViewModeState(saved.teacherViewMode);
          }
          if (saved.classGridLayout === 'classic_sheet' || saved.classGridLayout === 'period_cards') {
            setClassGridLayoutState(saved.classGridLayout);
          }
        }
      }
    };
    window.addEventListener('edusmart:data-changed', onPrefSync);
    return () => window.removeEventListener('edusmart:data-changed', onPrefSync);
  }, []);
  const [selectedTeacherDay, setSelectedTeacherDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(() => {
    const todayIndex = new Date().getDay();
    if (todayIndex >= 1 && todayIndex <= 5) {
      return DAYS_OF_WEEK[todayIndex - 1];
    }
    return 'Monday';
  });

  // Role-Based Access Control Classification
  // 1. Executive Leadership: can access master timetable (unrestricted null)
  // 2. Student: can ONLY see his/her class/stream timetable
  // 3. Parent: access timetable as per the child's stream only
  // 4. Class Teacher: view his or her class/stream timetable
  // 5. Subject Teacher: only see his or her assigned class/stream timetable
  const isExecutiveLeadership = [
    'admin', 
    'head_teacher', 
    'deputy_head', 
    'dean_of_studies', 
    'school_admin_staff',
    'principal',
    'director'
  ].includes(currentUser.role);
  
  const isStudent = currentUser.role === 'student';
  const isParent = currentUser.role === 'parent';
  const isClassTeacher = currentUser.role === 'class_teacher';
  const isSubjectTeacher = ['teacher', 'hod', 'senior_teacher', 'curriculum_coordinator'].includes(currentUser.role);

  interface ClassOption {
    grade: GradeLevel;
    stream: StreamName;
    label: string;
    sublabel?: string;
  }

  // Allowed classes calculation based on RBAC rules:
  const allowedClasses: ClassOption[] | null = useMemo(() => {
    // 1. Executive Leadership: can access master timetable (unrestricted null)
    if (isExecutiveLeadership) {
      return null;
    }

    // 2. Student: can ONLY see his or her class/stream timetable
    if (isStudent) {
      const g = (currentUser.grade || initialGrade || 4) as GradeLevel;
      const s = (currentUser.stream || initialStream || (g >= 7 ? 'Mara' : 'Dove')) as StreamName;
      return [{
        grade: g,
        stream: s,
        label: `Grade ${g} (${s})`,
        sublabel: 'Enrolled Learner Routine'
      }];
    }

    // 3. Parent: can access timetable as per the child's stream only
    if (isParent) {
      const parentChildren = Storage.getParentChildren(currentUser);
      if (parentChildren && parentChildren.length > 0) {
        return parentChildren.map(child => {
          const g = (child.grade || 4) as GradeLevel;
          const s = (child.stream || (g >= 7 ? 'Mara' : 'Dove')) as StreamName;
          return {
            grade: g,
            stream: s,
            label: `${child.name} · Grade ${g} (${s})`,
            sublabel: `Child: ${child.name}`
          };
        });
      }
      const g = (initialGrade || 4) as GradeLevel;
      const s = (initialStream || 'Dove') as StreamName;
      return [{
        grade: g,
        stream: s,
        label: `Grade ${g} (${s})`,
        sublabel: "Child's Class Routine"
      }];
    }

    // 4. Class Teacher: can view his or her class/stream timetable
    if (isClassTeacher) {
      const classMap = new Map<string, ClassOption>();

      // Primary class teacher allocation
      const primaryGrade = (currentUser.grade || initialGrade || 4) as GradeLevel;
      const primaryStream = (currentUser.stream || initialStream || (primaryGrade >= 7 ? 'Mara' : 'Dove')) as StreamName;
      const primaryKey = `${primaryGrade}-${primaryStream}`;
      classMap.set(primaryKey, {
        grade: primaryGrade,
        stream: primaryStream,
        label: `Grade ${primaryGrade} (${primaryStream})`,
        sublabel: 'Designated Class (Class Teacher)'
      });

      // Any additional assigned teaching streams for this class teacher
      if (currentUser.assignedStreams && currentUser.assignedStreams.length > 0) {
        currentUser.assignedStreams.forEach(as => {
          const key = `${as.grade}-${as.stream}`;
          if (!classMap.has(key)) {
            classMap.set(key, {
              grade: as.grade,
              stream: as.stream,
              label: `Grade ${as.grade} (${as.stream})`,
              sublabel: 'Assigned Teaching Stream'
            });
          }
        });
      }

      return Array.from(classMap.values());
    }

    // 5. Subject Teacher: can only see his or her assigned class/stream timetable
    if (isSubjectTeacher) {
      const classMap = new Map<string, ClassOption>();

      // A. From explicit assignedStreams
      if (currentUser.assignedStreams && currentUser.assignedStreams.length > 0) {
        currentUser.assignedStreams.forEach(as => {
          const key = `${as.grade}-${as.stream}`;
          classMap.set(key, {
            grade: as.grade,
            stream: as.stream,
            label: `Grade ${as.grade} (${as.stream})`,
            sublabel: 'Assigned Stream'
          });
        });
      }

      // B. From timetable slots taught by this teacher
      if (currentUser.name) {
        const teacherLower = currentUser.name.toLowerCase();
        allSlots.forEach(s => {
          if (s.teacherName && s.teacherName.toLowerCase() === teacherLower) {
            const key = `${s.grade}-${s.stream}`;
            if (!classMap.has(key)) {
              classMap.set(key, {
                grade: s.grade,
                stream: s.stream,
                label: `Grade ${s.grade} (${s.stream})`,
                sublabel: 'Assigned Subject Stream'
              });
            }
          }
        });
      }

      // C. From currentUser.grade & stream
      if (currentUser.grade && currentUser.stream) {
        const key = `${currentUser.grade}-${currentUser.stream}`;
        if (!classMap.has(key)) {
          classMap.set(key, {
            grade: currentUser.grade,
            stream: currentUser.stream,
            label: `Grade ${currentUser.grade} (${currentUser.stream})`,
            sublabel: 'Teaching Stream'
          });
        }
      }

      if (classMap.size > 0) {
        return Array.from(classMap.values());
      }

      const g = (initialGrade || 4) as GradeLevel;
      const s = (initialStream || 'Dove') as StreamName;
      return [{
        grade: g,
        stream: s,
        label: `Grade ${g} (${s})`,
        sublabel: 'Assigned Stream'
      }];
    }

    // Default for guest / prospective demo
    if (initialGrade && initialStream) {
      return [{
        grade: initialGrade,
        stream: initialStream,
        label: `Grade ${initialGrade} (${initialStream})`,
        sublabel: 'Class View'
      }];
    }

    return null;
  }, [currentUser, isExecutiveLeadership, isStudent, isParent, isClassTeacher, isSubjectTeacher, initialGrade, initialStream, allSlots]);

  // Determine user-specific default grade and stream respecting allowed classes
  const defaultGrade: GradeLevel = useMemo(() => {
    if (allowedClasses && allowedClasses.length > 0) {
      if (initialGrade && allowedClasses.some(c => c.grade === initialGrade)) {
        return initialGrade;
      }
      return allowedClasses[0].grade;
    }
    if (initialGrade) return initialGrade;
    if (currentUser.grade) return currentUser.grade;
    return 4; // Default to Grade 4
  }, [allowedClasses, initialGrade, currentUser.grade]);

  const defaultStream: StreamName = useMemo(() => {
    if (allowedClasses && allowedClasses.length > 0) {
      const match = allowedClasses.find(c => c.grade === defaultGrade);
      if (match) return match.stream;
      return allowedClasses[0].stream;
    }
    if (initialStream) return initialStream;
    if (currentUser.stream) return currentUser.stream;
    return defaultGrade >= 7 ? 'Mara' : 'Dove';
  }, [allowedClasses, initialStream, currentUser.stream, defaultGrade]);

  // Core filter states
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(defaultGrade);
  const [selectedStream, setSelectedStream] = useState<StreamName>(defaultStream);
  const [perspective, setPerspective] = useState<TimetablePerspective>(() => {
    if (initialPerspective) return initialPerspective;
    if (isClassTeacher || isSubjectTeacher) return 'teacher';
    return 'grid';
  });
  const [selectedDay, setSelectedDay] = useState<'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (perspective !== 'rooms') return;
    let cancelled = false;
    ttApiFetch<any>('/api/timetable/facilities/schedules')
      .then((data) => {
        if (cancelled) return;
        setFacilitySchedules(data);
        const sharedFirst = (data?.facilities || []).find((f: any) => f.isSharedFacility) || data?.facilities?.[0];
        if (sharedFirst && !selectedFacilityId) {
          setSelectedFacilityId(sharedFirst.id);
        }
      })
      .catch(() => {
        // Fallback to local roomSlots if backend schedule unavailable
      });
    return () => {
      cancelled = true;
    };
  }, [perspective, ttWorkspace?.activeVersion?.id]);

  // Allowed perspectives based on role
  const availablePerspectives: TimetablePerspective[] = useMemo(() => {
    if (isExecutiveLeadership) {
      return ['grid', 'today', 'teacher', 'rooms', 'exams', 'relief'];
    }
    if (isClassTeacher || isSubjectTeacher) {
      return ['grid', 'today', 'teacher', 'exams'];
    }
    // Students and Parents: strictly class schedule (Grid, Today, Exams)
    return ['grid', 'today', 'exams'];
  }, [isExecutiveLeadership, isClassTeacher, isSubjectTeacher]);

  // Synchronize initialPerspective prop if updated from parent component
  useEffect(() => {
    if (initialPerspective && availablePerspectives.includes(initialPerspective)) {
      setPerspective(initialPerspective);
    }
  }, [initialPerspective, availablePerspectives]);

  // Enforce selected perspective within available list
  useEffect(() => {
    if (!availablePerspectives.includes(perspective)) {
      setPerspective(availablePerspectives.includes('teacher') ? 'teacher' : 'grid');
    }
  }, [availablePerspectives, perspective]);

  // Synchronize initialGrade & initialStream props if updated from parent component
  useEffect(() => {
    if (initialGrade) {
      if (!allowedClasses || allowedClasses.some(c => c.grade === initialGrade)) {
        setSelectedGrade(initialGrade);
      }
    }
  }, [initialGrade, allowedClasses]);

  useEffect(() => {
    if (initialStream) {
      if (!allowedClasses || allowedClasses.some(c => c.stream === initialStream)) {
        setSelectedStream(initialStream);
      }
    }
  }, [initialStream, allowedClasses]);

  // Strictly constrain selectedGrade and selectedStream to stay within allowedClasses
  useEffect(() => {
    if (allowedClasses && allowedClasses.length > 0) {
      const match = allowedClasses.find(c => c.grade === selectedGrade && c.stream === selectedStream);
      if (!match) {
        setSelectedGrade(allowedClasses[0].grade);
        setSelectedStream(allowedClasses[0].stream);
      }
    }
  }, [allowedClasses, selectedGrade, selectedStream]);

  // For teachers: Lock selectedTeacher to themselves
  useEffect(() => {
    if ((isClassTeacher || isSubjectTeacher) && currentUser.name) {
      setSelectedTeacher(currentUser.name);
    }
  }, [isClassTeacher, isSubjectTeacher, currentUser.name]);

  // Teacher & Room perspectives state
  const [selectedTeacher, setSelectedTeacher] = useState<string>(() => {
    if (isClassTeacher || isSubjectTeacher) return currentUser.name;
    return 'Mr. David Kiprono';
  });
  const [selectedRoom, setSelectedRoom] = useState<string>('Junior Science Lab 1');

  // Update selected stream when grade changes if invalid for grade category (Executive Master view only)
  useEffect(() => {
    if (!allowedClasses) {
      const isJunior = selectedGrade >= 7;
      const isStreamJunior = (JUNIOR_STREAMS as readonly string[]).includes(selectedStream);
      if (isJunior && !isStreamJunior) {
        setSelectedStream('Mara');
      } else if (!isJunior && isStreamJunior) {
        setSelectedStream('Dove');
      }
    }
  }, [selectedGrade, selectedStream, allowedClasses]);

  // Modals state
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<TimetableSlot | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<TimetableSlot | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Edit / Add form states
  const [formDay, setFormDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formSubject, setFormSubject] = useState<SubjectName>('Mathematics');
  const [formTeacherName, setFormTeacherName] = useState<string>('Mr. David Kiprono');
  const [formRoomName, setFormRoomName] = useState<string>('Classroom 4-Dove');
  const [formMeetLink, setFormMeetLink] = useState<string>('https://meet.google.com/edu-class');
  const [formStrandTopic, setFormStrandTopic] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formIsRemedial, setFormIsRemedial] = useState<boolean>(false);
  const [formConflictWarning, setFormConflictWarning] = useState<string | null>(null);

  // Real-time Bell Schedule & Clock Simulation
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('10:05 AM');
  const [simulatedDay, setSimulatedDay] = useState<string>('Monday');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find currently active bell period
  const activeBellPeriod = useMemo(() => {
    return bellSchedule.find(b => b.period === 3);
  }, [bellSchedule]);

  // Active bell schedule for the selected grade:
  // Grades 1–5: Standard Periods 1–9, Morning Tea Break, Midday Lunch Break
  // Grades 6–9: Includes Period 10 (Early Morning Remedial) and Period 11 (Late Evening Remedial)
  const activeGradeBellSchedule = useMemo(() => {
    if (selectedGrade < 6) {
      return bellSchedule.filter(b => b.period !== 10 && b.period !== 11);
    }
    return bellSchedule;
  }, [bellSchedule, selectedGrade]);

  // Streams applicable to active grade
  const availableStreams = useMemo(() => {
    return selectedGrade >= 7 ? JUNIOR_STREAMS : PRIMARY_STREAMS;
  }, [selectedGrade]);

  // Subjects applicable to active grade (merged with Master Timetable workspace & catalog subjects)
  const availableSubjects = useMemo(() => {
    const base: string[] = selectedGrade >= 7 ? [...JUNIOR_SUBJECTS] : [...PRIMARY_SUBJECTS];
    const seen = new Set(base.map((s) => s.toLowerCase()));
    const extras: string[] = [];
    for (const s of ttWorkspace?.subjects || []) {
      if (s?.name && !seen.has(s.name.toLowerCase())) {
        seen.add(s.name.toLowerCase());
        extras.push(s.name);
      }
    }
    for (const s of listSubjects()) {
      if (s?.name && !seen.has(s.name.toLowerCase())) {
        seen.add(s.name.toLowerCase());
        extras.push(s.name);
      }
    }
    return [...base, ...extras.sort()] as SubjectName[];
  }, [selectedGrade, ttWorkspace?.subjects, catalogRevision]);

  // Strictly allocated subjects + assigned teacher + weekly lesson quota for (selectedGrade, selectedStream)
  const streamAllocatedSubjects = useMemo(() => {
    const map = new Map<
      string,
      { subject: SubjectName; requiredWeeklyPeriods: number; teacherName: string }
    >();

    // Priority 1: Authoritative Master Timetable stream allocations from workspace
    if (ttWorkspace?.streamAllocations?.length) {
      const tById = new Map<string, string>(
        (ttWorkspace.teachers || []).map((t): [string, string] => [t.id, t.teacherName])
      );
      for (const a of ttWorkspace.streamAllocations) {
        if (!a.isActive || a.requiredWeeklyPeriods < 1) continue;
        if (Number(a.grade) !== Number(selectedGrade)) continue;
        if (String(a.stream).trim().toLowerCase() !== String(selectedStream).trim().toLowerCase()) continue;
        const tId = a.teacherIds?.[0];
        const tName = tId ? tById.get(tId) || '' : '';
        map.set(a.subjectName.trim().toLowerCase(), {
          subject: a.subjectName as SubjectName,
          requiredWeeklyPeriods: Math.max(1, Number(a.requiredWeeklyPeriods)),
          teacherName: tName,
        });
      }
    }

    // Priority 2: Supplement from Faculty allocated SubjectStreamAllocations
    const facultyUsers = Storage.getUsers().filter((u) =>
      ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'curriculum_coordinator'].includes(u.role)
    );
    for (const teacher of facultyUsers) {
      for (const alloc of teacher.assignedSubjectAllocations || []) {
        if (Number(alloc.grade) !== Number(selectedGrade)) continue;
        if (String(alloc.stream || '').trim().toLowerCase() !== String(selectedStream).trim().toLowerCase()) continue;
        const key = String(alloc.subject || '').trim().toLowerCase();
        if (!key || map.has(key)) continue;
        const dbGradeAlloc = (ttWorkspace?.gradeAllocations || []).find(
          (ga) => ga.isActive && ga.grade === Number(selectedGrade) && ga.subjectName.toLowerCase() === key
        );
        map.set(key, {
          subject: alloc.subject as SubjectName,
          requiredWeeklyPeriods: dbGradeAlloc?.requiredWeeklyPeriods || alloc.periodsPerWeek || 4,
          teacherName: teacher.name,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.subject.localeCompare(b.subject));
  }, [ttWorkspace?.streamAllocations, ttWorkspace?.teachers, selectedGrade, selectedStream, catalogRevision]);

  // Filtered slots for active Grade & Stream
  const classSlots = useMemo(() => {
    return allSlots.filter(s => s.grade === selectedGrade && s.stream === selectedStream);
  }, [allSlots, selectedGrade, selectedStream]);

  // Filtered slots with search query
  const displayedSlots = useMemo(() => {
    if (!searchQuery.trim()) return classSlots;
    const q = searchQuery.toLowerCase();
    return classSlots.filter(s => 
      s.subject.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q) ||
      (s.strandTopic && s.strandTopic.toLowerCase().includes(q)) ||
      (s.roomName && s.roomName.toLowerCase().includes(q))
    );
  }, [classSlots, searchQuery]);

  // Distinct Faculty members across timetable
  const distinctTeachers = useMemo(() => {
    const list = Array.from(new Set(allSlots.map(s => s.teacherName))).filter(Boolean);
    return list.sort();
  }, [allSlots]);

  // Distinct Rooms & Labs across timetable
  const distinctRooms = useMemo(() => {
    const list = Array.from(new Set(allSlots.map(s => s.roomName).filter((r): r is string => Boolean(r))));
    if (!list.includes('Main Library Reading Hall')) list.push('Main Library Reading Hall');
    if (!list.includes('Junior Science Lab 1')) list.push('Junior Science Lab 1');
    if (!list.includes('Computer Lab A')) list.push('Computer Lab A');
    if (!list.includes('Fine Art & Music Studio')) list.push('Fine Art & Music Studio');
    if (!list.includes('Agricultural Demonstration Plot')) list.push('Agricultural Demonstration Plot');
    if (!list.includes('Main Sports Pitch')) list.push('Main Sports Pitch');
    return list.sort();
  }, [allSlots]);

  // Slots for selected teacher in teacher perspective
  const teacherSlots = useMemo(() => {
    return allSlots.filter(s => s.teacherName.toLowerCase() === selectedTeacher.toLowerCase());
  }, [allSlots, selectedTeacher]);

  // Slots for selected room in rooms perspective
  const roomSlots = useMemo(() => {
    return allSlots.filter(s => s.roomName && s.roomName.toLowerCase() === selectedRoom.toLowerCase());
  }, [allSlots, selectedRoom]);

  // Exam timetable entries for selected grade
  const activeGradeExams = useMemo(() => {
    return examTimetables.filter(e => e.grade === selectedGrade);
  }, [examTimetables, selectedGrade]);

  // Helper: Get subject aesthetic theme
  const getSubjectTheme = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) {
      return {
        bg: 'bg-blue-50/80 hover:bg-blue-100/90',
        text: 'text-blue-900',
        border: 'border-blue-200',
        accent: 'bg-blue-600',
        badge: 'text-blue-700 bg-blue-100/60'
      };
    }
    if (s.includes('science') || s.includes('biology') || s.includes('physics') || s.includes('chemistry')) {
      return {
        bg: 'bg-emerald-50/80 hover:bg-emerald-100/90',
        text: 'text-emerald-900',
        border: 'border-emerald-200',
        accent: 'bg-emerald-600',
        badge: 'text-emerald-700 bg-emerald-100/60'
      };
    }
    if (s.includes('english') || s.includes('kiswahili') || s.includes('french')) {
      return {
        bg: 'bg-purple-50/80 hover:bg-purple-100/90',
        text: 'text-purple-900',
        border: 'border-purple-200',
        accent: 'bg-purple-600',
        badge: 'text-purple-700 bg-purple-100/60'
      };
    }
    if (s.includes('agriculture') || s.includes('technical') || s.includes('pre-technical') || s.includes('home science')) {
      return {
        bg: 'bg-amber-50/80 hover:bg-amber-100/90',
        text: 'text-amber-950',
        border: 'border-amber-200',
        accent: 'bg-amber-600',
        badge: 'text-amber-800 bg-amber-100/60'
      };
    }
    if (s.includes('art') || s.includes('music') || s.includes('creative')) {
      return {
        bg: 'bg-rose-50/80 hover:bg-rose-100/90',
        text: 'text-rose-900',
        border: 'border-rose-200',
        accent: 'bg-rose-600',
        badge: 'text-rose-700 bg-rose-100/60'
      };
    }
    if (s.includes('physical') || s.includes('sports') || s.includes('games')) {
      return {
        bg: 'bg-lime-50/80 hover:bg-lime-100/90',
        text: 'text-lime-950',
        border: 'border-lime-300',
        accent: 'bg-lime-600',
        badge: 'text-lime-800 bg-lime-100/60'
      };
    }
    if (s.includes('library')) {
      return {
        bg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
        text: 'text-indigo-950',
        border: 'border-indigo-300',
        accent: 'bg-indigo-600',
        badge: 'text-indigo-800 bg-indigo-100/80'
      };
    }
    if (s.includes('nutrition')) {
      return {
        bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
        text: 'text-emerald-950',
        border: 'border-emerald-300',
        accent: 'bg-emerald-600',
        badge: 'text-emerald-800 bg-emerald-100/80'
      };
    }
    if (s.includes('religious') || s.includes('cre') || s.includes('ire')) {
      return {
        bg: 'bg-teal-50/80 hover:bg-teal-100/90',
        text: 'text-teal-900',
        border: 'border-teal-200',
        accent: 'bg-teal-600',
        badge: 'text-teal-700 bg-teal-100/60'
      };
    }
    return {
      bg: 'bg-slate-50 hover:bg-slate-100',
      text: 'text-slate-900',
      border: 'border-slate-200',
      accent: 'bg-slate-600',
      badge: 'text-slate-700 bg-slate-100'
    };
  };

  // Count non-remedial scheduled lessons for a subject in the currently selected Grade + Stream
  const getScheduledWeeklyCount = (subjectName: string, excludeId?: string) => {
    const subLower = String(subjectName || '').trim().toLowerCase();
    return classSlots.filter(
      (s) =>
        (!excludeId || s.id !== excludeId) &&
        !s.isRemedial &&
        s.period !== 10 &&
        s.period !== 11 &&
        String(s.subject || '').trim().toLowerCase() === subLower
    ).length;
  };

  // Strict conflict check:
  // 1. No teacher (primary or relief) may have more than 1 lesson at a time across ALL grades & streams
  // 2. No class/stream may have 2 overlapping lessons in the same period
  // 3. No room double-booking across all grades & streams
  const checkConflicts = (day: string, period: number, teacher: string, room: string, excludeId?: string) => {
    const teacherNorm = String(teacher || '').trim().toLowerCase();
    const roomNorm = String(room || '').trim().toLowerCase();

    for (const s of allSlots) {
      if (excludeId && s.id === excludeId) continue;
      if (s.dayOfWeek !== day || s.period !== period) continue;

      // 1. Class/stream collision
      if (Number(s.grade) === Number(selectedGrade) && String(s.stream).toLowerCase() === String(selectedStream).toLowerCase()) {
        return `Class Overlap Blocked: Grade ${selectedGrade} ${selectedStream} already has ${s.subject} (${s.teacherName}) on ${day} Period ${period}.`;
      }

      // 2. Strict 1-lesson-at-a-time teacher clash (primary + co-teachers + relief cover)
      if (teacherNorm && teacherNorm !== 'faculty lead' && teacherNorm !== 'subject teacher') {
        const slotTeachers = [
          ...String(s.teacherName || '').split(/[,&]/).map((n) => n.trim().toLowerCase()),
          ...(s.reliefTeacherName ? [String(s.reliefTeacherName).trim().toLowerCase()] : []),
        ].filter(Boolean);
        if (slotTeachers.includes(teacherNorm)) {
          return `Teacher Double-Booking Blocked: ${teacher} is already teaching Grade ${s.grade} ${s.stream} (${s.subject}) on ${day} Period ${period}. No teacher can have more than 1 lesson at a time.`;
        }
      }

      // 3. Room collision
      if (roomNorm && s.roomName && s.roomName.trim().toLowerCase() === roomNorm) {
        return `Room Collision Blocked: ${room} is already allocated to Grade ${s.grade} ${s.stream} (${s.subject}) on ${day} Period ${period}.`;
      }
    }
    return null;
  };

  // Open Edit/Add Modal
  const handleOpenAddModal = (slot?: TimetableSlot) => {
    if (slot) {
      setSlotToEdit(slot);
      setFormDay(slot.dayOfWeek);
      setFormPeriod(slot.period);
      setFormSubject(slot.subject);
      setFormTeacherName(slot.teacherName);
      setFormRoomName(slot.roomName || `Classroom ${selectedGrade}-${selectedStream}`);
      setFormMeetLink(slot.roomOrMeetLink || '');
      setFormStrandTopic(slot.strandTopic || '');
      setFormNotes(slot.notes || '');
      setFormIsRemedial(Boolean(slot.isRemedial) || slot.period === 10 || slot.period === 11);
    } else {
      setSlotToEdit(null);
      setFormDay('Monday');
      setFormPeriod(1);
      // Prefer the first allocated subject for this Grade + Stream that still has remaining weekly quota
      const nextAlloc =
        streamAllocatedSubjects.find(
          (a) => getScheduledWeeklyCount(a.subject) < a.requiredWeeklyPeriods
        ) || streamAllocatedSubjects[0];
      const defaultSubject = (nextAlloc?.subject || availableSubjects[0]) as SubjectName;
      setFormSubject(defaultSubject);
      setFormTeacherName(nextAlloc?.teacherName || currentUser.name || 'Mr. David Kiprono');
      setFormRoomName(
        String(defaultSubject).toLowerCase().includes('library')
          ? 'Main Library Reading Hall'
          : `Classroom ${selectedGrade}-${selectedStream}`
      );
      setFormMeetLink(`https://meet.google.com/edu-gr${selectedGrade}-${selectedStream.toLowerCase()}`);
      setFormStrandTopic('');
      setFormNotes('');
      setFormIsRemedial(false);
    }
    setFormConflictWarning(null);
    setShowEditModal(true);
  };

  // Save Slot Handler
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const isRemedialSession = formPeriod === 10 || formPeriod === 11 || formIsRemedial;

    // Enforce strict Grade + Stream + Subject allocation and exact weekly lesson quota on regular lessons
    if (!isRemedialSession && streamAllocatedSubjects.length > 0) {
      const matchedAlloc = streamAllocatedSubjects.find(
        (a) => a.subject.toLowerCase() === String(formSubject).trim().toLowerCase()
      );
      if (!matchedAlloc) {
        setFormConflictWarning(
          `Strict Allocation Policy: "${formSubject}" is not allocated to Grade ${selectedGrade} ${selectedStream}. Assign it in Subject Allocations before scheduling.`
        );
        return;
      }
      if (
        matchedAlloc.teacherName &&
        formTeacherName.trim().toLowerCase() !== matchedAlloc.teacherName.trim().toLowerCase()
      ) {
        setFormConflictWarning(
          `Allocated Teacher Mismatch: ${matchedAlloc.teacherName} is the allocated teacher for ${formSubject} in Grade ${selectedGrade} ${selectedStream}.`
        );
        return;
      }
      const alreadyScheduled = getScheduledWeeklyCount(formSubject, slotToEdit?.id);
      if (alreadyScheduled >= matchedAlloc.requiredWeeklyPeriods) {
        setFormConflictWarning(
          `Weekly Lesson Quota Reached: ${formSubject} in Grade ${selectedGrade} ${selectedStream} is limited to ${matchedAlloc.requiredWeeklyPeriods} lesson(s) per week (${alreadyScheduled}/${matchedAlloc.requiredWeeklyPeriods} already scheduled). Adjust lessons per week in Allocations if needed.`
        );
        return;
      }
    }

    // Check conflicts (strict 1 lesson per teacher at a time, class overlap, room overlap)
    const conflict = checkConflicts(formDay, formPeriod, formTeacherName, formRoomName, slotToEdit?.id);
    if (conflict) {
      setFormConflictWarning(conflict);
      return;
    }

    const bell = bellSchedule.find(b => b.period === formPeriod);

    const slotPayload: TimetableSlot = {
      id: slotToEdit?.id || `tt-${selectedGrade}${selectedStream.charAt(0).toLowerCase()}-${Date.now().toString(36)}`,
      grade: selectedGrade,
      stream: selectedStream,
      dayOfWeek: formDay,
      period: formPeriod,
      startTime: bell ? bell.startTime : (formPeriod === 10 ? '07:00' : formPeriod === 11 ? '15:45' : '08:00'),
      endTime: bell ? bell.endTime : (formPeriod === 10 ? '07:50' : formPeriod === 11 ? '16:45' : '08:40'),
      subject: formSubject,
      teacherName: formTeacherName,
      roomName: formRoomName,
      roomOrMeetLink: formMeetLink,
      strandTopic: formStrandTopic.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isRemedial: isRemedialSession,
      teacherEmail: currentUser.email || 'faculty@edusmart.ac.ke'
    };

    Storage.saveTimetableSlot(slotPayload);

    // Sync Library Lesson slots directly to Library Timetable so Library Bookings detect occupied vs free slots
    const linkedLibId = `mt-lib-${slotPayload.id}`;
    const isLibrarySubject = String(slotPayload.subject || '').toLowerCase().includes('library');
    const existingLibSlots = Storage.getLibraryTimetable();
    const existingLinked = existingLibSlots.find((ls) => ls.id === linkedLibId);
    if (isLibrarySubject) {
      const libVenue =
        slotPayload.roomName && slotPayload.roomName.toLowerCase().includes('library')
          ? slotPayload.roomName
          : 'Main Library Reading Hall';
      const syncedEntry = {
        id: linkedLibId,
        dayOfWeek: slotPayload.dayOfWeek,
        startTime: slotPayload.startTime,
        endTime: slotPayload.endTime,
        grade: slotPayload.grade,
        stream: `Grade ${slotPayload.grade} ${slotPayload.stream}`,
        teacherInCharge: slotPayload.teacherName || 'Subject Teacher',
        sessionType: 'Library Reading Period' as const,
        venue: libVenue,
      };
      if (existingLinked) {
        Storage.updateLibraryTimetableSlot(linkedLibId, syncedEntry);
      } else {
        Storage.addLibraryTimetableSlot(syncedEntry);
      }
    } else if (existingLinked) {
      Storage.deleteLibraryTimetableSlot(linkedLibId);
    }

    setShowEditModal(false);
    setNotificationMsg(
      isLibrarySubject
        ? `Library Lesson saved for Grade ${selectedGrade} ${selectedStream} and synced to Library Bookings!`
        : `Timetable period saved successfully for Grade ${selectedGrade} ${selectedStream}!`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Delete Slot Handler
  const handleDeleteSlot = (id: string) => {
    if (window.confirm('Are you sure you want to remove this timetable slot?')) {
      Storage.deleteTimetableSlot(id);
      const linkedLibId = `mt-lib-${id}`;
      if (Storage.getLibraryTimetable().some((ls) => ls.id === linkedLibId)) {
        Storage.deleteLibraryTimetableSlot(linkedLibId);
      }
      setSelectedSlotForDetail(null);
      setNotificationMsg('Period removed from schedule.');
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  // Export iCal (.ics) file
  const handleExportICal = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EduSmart Gadsa Systems//School Timetable Portal//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    classSlots.forEach((slot) => {
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${slot.subject} - Gr ${slot.grade} ${slot.stream}\n`;
      icsContent += `DESCRIPTION:Instructor: ${slot.teacherName}\\nTopic: ${slot.strandTopic || 'Curriculum delivery'}\\nRoom: ${slot.roomName || 'Classroom'}\n`;
      icsContent += `LOCATION:${slot.roomName || 'Campus Main Classroom'}\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EduSmart_Timetable_Grade${selectedGrade}_${selectedStream}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDeanOrDeputy = ['dean_of_studies', 'deputy_head', 'head_teacher', 'admin'].includes(currentUser.role);
  const canEdit = !readOnly && isDeanOrDeputy;
  const canEditPeriodTimings = !readOnly && isDeanOrDeputy;
  const canEditAllocations = !readOnly && isDeanOrDeputy;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationMsg}</span>
        </div>
      )}


      {/* ========================================================
          INTELLIGENT TIMETABLE MANAGEMENT SUITE NAVIGATION (ADMIN)
          ======================================================== */}
      {isTimetableAdminUser && (
        <div className="bg-white border border-slate-200 rounded-2xl p-2 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'published', label: 'Published Views', icon: LayoutGrid },
                  { id: 'config', label: '1. Config, Subjects & Depts', icon: Sliders },
                  { id: 'allocations', label: '2. Allocations & Groups', icon: Layers },
                  { id: 'teachers', label: '3. Teachers & Limits', icon: UserCog },
                  { id: 'load_dashboard', label: 'Teacher Load Dashboard', icon: BarChart3 },
                  { id: 'editor', label: '4. Auto-Solver & Editor', icon: Sparkles },
                  { id: 'approvals', label: '5. Approvals & Reports', icon: FileSpreadsheet },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSuiteTab(tab.id);
                      if (tab.id !== 'published' && (!ttWorkspace || workspaceError)) {
                        loadWorkspace();
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      suiteTab === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 px-1">
              {loadingWorkspace && (
                <span className="text-[11px] font-mono text-slate-500">Syncing...</span>
              )}
              <button
                type="button"
                onClick={() => setShowResetPanel((v) => !v)}
                disabled={resettingWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingWorkspace ? 'animate-spin' : ''}`} />
                <span>Reset &amp; Enable Suite</span>
              </button>
            </div>
          </div>

          {showResetPanel && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700">
                <div className="font-bold text-slate-900">Reset &amp; Enable Timetable Management Suite</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Unlocks read-only/published states onto a fresh editable draft, clears stuck solver jobs, and re-syncs all subjects, departments, and HoD links.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={resettingWorkspace}
                  onClick={() => handleResetTimetableWorkspace(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-50"
                >
                  {resettingWorkspace ? 'Resetting...' : 'Unlock Fresh Draft (Keep Allocations)'}
                </button>
                <button
                  type="button"
                  disabled={resettingWorkspace}
                  onClick={() => handleResetTimetableWorkspace(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer disabled:opacity-50"
                >
                  Reset to CBC Defaults
                </button>
                <button
                  type="button"
                  disabled={resettingWorkspace}
                  onClick={() => setShowResetPanel(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {resetBanner && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetBanner}</span>
              </div>
              <button type="button" onClick={() => setResetBanner(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {isTimetableAdminUser && suiteTab !== 'published' && (
        <div className="space-y-4">
          {suiteTab === 'load_dashboard' ? (
            <TeacherLoadDashboard
              currentUser={currentUser}
              workspace={ttWorkspace}
              onOpenTimetableEditor={() => setSuiteTab('editor')}
              onRefreshWorkspace={async () => {
                await loadWorkspace(ttWorkspace?.activeVersion?.id);
              }}
            />
          ) : !ttWorkspace ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              {workspaceError ? (
                <>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">Timetable Workspace Sync Interrupted</div>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">{workspaceError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => loadWorkspace()}
                      disabled={loadingWorkspace}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                    >
                      {loadingWorkspace ? 'Retrying...' : 'Retry Sync'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetTimetableWorkspace(false)}
                      disabled={resettingWorkspace}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                    >
                      {resettingWorkspace ? 'Resetting...' : 'Reset & Enable Workspace'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500">
                  Loading {currentTenant.name} intelligent timetable workspace...
                </div>
              )}
            </div>
          ) : (
            <>
              {suiteTab === 'config' && (
                <TimetableConfigPanel
                  config={ttWorkspace.config}
                  gradeSchedules={ttWorkspace.gradeSchedules}
                  periods={ttWorkspace.periods}
                  classrooms={ttWorkspace.classrooms}
                  subjects={ttWorkspace.subjects}
                  departments={ttWorkspace.departments || []}
                  categoryAllocations={ttWorkspace.categoryAllocations || []}
                  gradeAllocations={ttWorkspace.gradeAllocations}
                  schoolId={currentTenant.id}
                  onOpenSubjectAllocations={(deptName) => {
                    setAllocationsDepartmentFilter(deptName || '');
                    setSuiteTab('allocations');
                  }}
                  onRefresh={async () => {
                    await loadWorkspace(ttWorkspace.activeVersion?.id);
                  }}
                />
              )}

              {suiteTab === 'allocations' && (
                <TimetableAllocationsPanel
                  categories={ttWorkspace.categories || []}
                  categoryAllocations={ttWorkspace.categoryAllocations || []}
                  departments={ttWorkspace.departments || []}
                  departmentFilter={allocationsDepartmentFilter}
                  onDepartmentFilterChange={setAllocationsDepartmentFilter}
                  onOpenDepartmentsConfig={() => setSuiteTab('config')}
                  gradeSchedules={ttWorkspace.gradeSchedules}
                  subjects={ttWorkspace.subjects}
                  classrooms={ttWorkspace.classrooms}
                  studentGroups={ttWorkspace.studentGroups}
                  teachers={ttWorkspace.teachers}
                  gradeAllocations={ttWorkspace.gradeAllocations}
                  streamAllocations={ttWorkspace.streamAllocations}
                  jointLessons={ttWorkspace.jointLessons}
                  allocationIssues={ttWorkspace.allocationIssues}
                  streamLoadSummary={ttWorkspace.streamLoadSummary}
                  onRefresh={async () => {
                    await loadWorkspace(ttWorkspace.activeVersion?.id);
                  }}
                />
              )}

              {suiteTab === 'teachers' && (
                <TimetableTeachersPanel
                  teachers={ttWorkspace.teachers}
                  subjects={ttWorkspace.subjects}
                  departments={ttWorkspace.departments || []}
                  config={ttWorkspace.config}
                  periods={ttWorkspace.periods}
                  onRefresh={async () => {
                    await loadWorkspace(ttWorkspace.activeVersion?.id);
                  }}
                />
              )}

              {suiteTab === 'editor' && (
                <TimetableDragDropEditor
                  workspace={ttWorkspace}
                  onRefresh={async (verId) => {
                    await loadWorkspace(verId || ttWorkspace.activeVersion?.id);
                    await loadPublishedBackendSchedule();
                  }}
                />
              )}

              {suiteTab === 'approvals' && (
                <TimetableVersionsAndReportsPanel
                  workspace={ttWorkspace}
                  currentUser={currentUser}
                  onRefresh={async (verId) => {
                    await loadWorkspace(verId || ttWorkspace.activeVersion?.id);
                    await loadPublishedBackendSchedule();
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================
          2. PERSPECTIVE SWITCHER & PRIMARY NAVIGATION TABS
          ======================================================== */}
      {suiteTab === 'published' && (
        <React.Fragment>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Perspectives strictly filtered by role-based availability */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {availablePerspectives.includes('grid') && (
            <button
              onClick={() => setPerspective('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly Grid</span>
            </button>
          )}

          {availablePerspectives.includes('today') && (
            <button
              onClick={() => setPerspective('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'today'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today's Agenda</span>
            </button>
          )}

          {availablePerspectives.includes('teacher') && (
            <button
              onClick={() => setPerspective('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'teacher'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{isExecutiveLeadership ? 'Academic Dept Workload' : 'My Teaching Schedule'}</span>
            </button>
          )}

          {availablePerspectives.includes('rooms') && (
            <button
              onClick={() => setPerspective('rooms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'rooms'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Rooms & Labs</span>
            </button>
          )}

          {availablePerspectives.includes('exams') && (
            <button
              onClick={() => setPerspective('exams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'exams'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Exam Schedule</span>
            </button>
          )}

          {availablePerspectives.includes('relief') && (
            <button
              onClick={() => setPerspective('relief')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                perspective === 'relief'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
              title="Dean of Studies & Deputy Head: Book teachers when colleagues are absent"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Relief & Absence Desk</span>
              {absenceReports.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  {absenceReports.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, instructor, lab..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

      </div>

      {/* ========================================================
          3. CLASS & STREAM SEGMENTED CONTROLS (GRID & AGENDA VIEWS)
          ======================================================== */}
      {['grid', 'today', 'exams'].includes(perspective) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          
          {/* A. EXECUTIVE LEADERSHIP: MASTER TIMETABLE FULL AUTHORITY */}
          {isExecutiveLeadership && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900">
                      Master Institutional Timetable Control
                    </span>
                    <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold">
                      Executive Authority
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Currently Viewing: <strong>Grade {selectedGrade} ({selectedStream})</strong>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Grade Level Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Grade:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <button
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedGrade === g
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Stream:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {availableStreams.map(stream => (
                      <button
                        key={stream}
                        onClick={() => setSelectedStream(stream)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedStream === stream
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {stream}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. ROLE-RESTRICTED CONTROLS: Student, Parent, Class Teacher, Subject Teacher */}
          {!isExecutiveLeadership && allowedClasses && (
            <div>
              {/* Single allowed stream (Student, Parent with 1 child, Single-class teacher) */}
              {allowedClasses.length === 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      {isStudent && <GraduationCap className="w-5 h-5 text-emerald-700" />}
                      {isParent && <UserIcon className="w-5 h-5 text-purple-700" />}
                      {isClassTeacher && <BookOpen className="w-5 h-5 text-blue-700" />}
                      {isSubjectTeacher && <CalendarDays className="w-5 h-5 text-indigo-700" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          Grade {selectedGrade} ({selectedStream})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-slate-200 text-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          {isStudent && 'Student Class'}
                          {isParent && "Child's Stream"}
                          {isClassTeacher && 'Class Teacher Allocation'}
                          {isSubjectTeacher && 'Assigned Subject Stream'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {isStudent && 'Locked: You can only see your enrolled class/stream timetable per academic regulations.'}
                        {isParent && `Locked: Access is restricted strictly as per your child's stream (${allowedClasses[0].sublabel || 'Child Routine'}).`}
                        {isClassTeacher && `Timetable authorized strictly for your designated class: Grade ${selectedGrade} (${selectedStream}).`}
                        {isSubjectTeacher && `Timetable authorized strictly for your assigned teaching stream: Grade ${selectedGrade} (${selectedStream}).`}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold self-start sm:self-center shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Single-Stream Access Locked</span>
                  </div>
                </div>
              )}

              {/* Multiple allowed streams (Parent with multiple children, or Teacher with multiple assigned streams) */}
              {allowedClasses.length > 1 && (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        {isParent && `Select Child's Stream Timetable (${allowedClasses.length} Children):`}
                        {isClassTeacher && `Class Teacher & Assigned Streams (${allowedClasses.length} Streams):`}
                        {isSubjectTeacher && `Your Assigned Teaching Streams (${allowedClasses.length} Streams):`}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {isParent && "Access is restricted strictly to your registered children's streams only."}
                        {isClassTeacher && 'Access restricted to your designated class and assigned teaching streams.'}
                        {isSubjectTeacher && 'Access restricted to your assigned teaching schedule only.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Authorized Scope Only</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {allowedClasses.map(c => {
                      const isSelected = selectedGrade === c.grade && selectedStream === c.stream;
                      return (
                        <button
                          key={`${c.grade}-${c.stream}-${c.label}`}
                          onClick={() => {
                            setSelectedGrade(c.grade);
                            setSelectedStream(c.stream);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isParent ? <UserIcon className="w-3.5 h-3.5 text-purple-400" /> : <CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{c.label}</span>
                          {c.sublabel && !isParent && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {c.sublabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day Selector (for Today / Agenda Perspective) */}
          {perspective === 'today' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Day Filter:</span>
                <div className="flex flex-wrap gap-1">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        selectedDay === day
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Inspecting schedule for <strong className="text-slate-900">{selectedDay === 'All' ? 'Full Week' : selectedDay}</strong>
              </span>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 1: WEEKLY MASTER GRID VIEW
          ======================================================== */}
      {perspective === 'grid' && (
        <div className="space-y-3">
          {/* Sheet Layout Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Grade {selectedGrade} ({selectedStream}) Routine Timetable
              </h3>
              <span className="text-[11px] text-slate-400">·</span>
              <span className="text-[11px] text-slate-500 font-medium">
                11-Lesson Matrix (8:20 – 15:40) · Mo–Fri
              </span>
            </div>

            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setClassGridLayout('classic_sheet')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  classGridLayout === 'classic_sheet'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official Sheet (11-Lesson)
              </button>
              <button
                type="button"
                onClick={() => setClassGridLayout('period_cards')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  classGridLayout === 'period_cards'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Period Cards View
              </button>
            </div>
          </div>

          {/* Mobile Daily Schedule Cards (< md) */}
          <div className="md:hidden bg-white rounded-xl border border-slate-200 p-3 space-y-3 print:hidden">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = mobileGridDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setMobileGridDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {(() => {
                const daySlots = displayedSlots
                  .filter((s) => s.dayOfWeek === mobileGridDay)
                  .sort((a, b) => a.period - b.period);
                if (daySlots.length === 0) {
                  return (
                    <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                      No lessons scheduled for Grade {selectedGrade} {selectedStream} on {mobileGridDay}.
                    </div>
                  );
                }
                return daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotForDetail(slot)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono tabular-nums text-slate-500">
                        Period {slot.period} · {slot.startTime}–{slot.endTime}
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {slot.subject}
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {slot.teacherName} · {slot.roomName}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-500 shrink-0">
                      G{slot.grade} {slot.stream}
                    </span>
                  </button>
                ));
              })()}
            </div>
          </div>

          <div className="hidden md:block print:block">
          {classGridLayout === 'classic_sheet' ? (
            <ClassicTimetableSheet
              mode="class"
              slots={displayedSlots}
              grade={selectedGrade}
              stream={selectedStream}
              canEdit={canEdit}
              onSelectSlot={(slot) => setSelectedSlotForDetail(slot)}
              onAddSlot={(day, academicPeriod) => {
                setSlotToEdit(null);
                setFormDay(day);
                setFormPeriod(academicPeriod);
                setFormSubject(availableSubjects[0]);
                setFormTeacherName(currentUser.name || 'Mr. David Kiprono');
                setFormRoomName(`Classroom ${selectedGrade}-${selectedStream}`);
                setFormIsRemedial(false);
                setFormStrandTopic('');
                setFormNotes('');
                setFormConflictWarning(null);
                setShowEditModal(true);
              }}
            />
          ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Grade {selectedGrade} ({selectedStream}) Routine Timetable
              </h3>
              <span className="text-[11px] text-slate-500">·</span>
              <span className="text-[11px] text-slate-500 font-medium">
                Academic Periods + Breaks &amp; Physical Education
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Maths</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sciences</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Languages</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pre-Tech/Agri</span>
              </span>
            </div>
          </div>

          <ScrollableMatrixTableWrapper hint="Swipe horizontally to view Monday–Friday periods" className="border-0">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-bold">
                  <th className="py-3 px-3 w-28 text-center border-r border-slate-200">Bell Period</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="py-3 px-4 text-center border-r border-slate-200 last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {activeGradeBellSchedule.map((bell) => {
                  // If Break row (Morning Tea or Lunch or Games)
                  if (bell.isBreak) {
                    return (
                      <tr key={`break-${bell.startTime}`} className="bg-slate-50/90 font-medium">
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-[11px] font-mono text-slate-500 bg-slate-100/60">
                          {bell.startTime} - {bell.endTime}
                        </td>
                        <td colSpan={5} className="py-2.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2 text-slate-700 text-xs font-black tracking-wide">
                            {bell.breakType === 'morning_tea' && <span>☕ {bell.label}</span>}
                            {bell.breakType === 'lunch' && <span>🍱 {bell.label}</span>}
                            {bell.breakType === 'remedial' && <span>📖 {bell.label}</span>}
                            {bell.breakType === 'games' && <span>🏆 {bell.label}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const isPeriod10 = bell.period === 10;
                  const isPeriod11 = bell.period === 11;

                  // Academic Period Row
                  return (
                    <tr 
                      key={`period-${bell.period}`} 
                      className={`hover:bg-slate-50/50 ${isPeriod10 ? 'bg-amber-50/20' : isPeriod11 ? 'bg-indigo-50/20' : ''}`}
                    >
                      {/* Period Time Column */}
                      <td className={`py-3 px-3 text-center border-r border-slate-200 align-middle ${
                        isPeriod10 ? 'bg-amber-50/80 border-r-amber-200' : 
                        isPeriod11 ? 'bg-indigo-50/80 border-r-indigo-200' : 
                        'bg-slate-50/40'
                      }`}>
                        {isPeriod10 ? (
                          <div>
                            <div className="font-black text-amber-950 text-xs flex items-center justify-center gap-1">
                              <span>🌅</span>
                              <span>Period 10</span>
                            </div>
                            <div className="text-[10px] font-black text-amber-700 uppercase tracking-tighter mt-0.5">Early Remedial</div>
                            <div className="font-mono text-[10px] text-amber-900/90 mt-0.5 font-bold">{bell.startTime} – {bell.endTime}</div>
                            <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-950 border border-amber-300">Gr 6–9</span>
                          </div>
                        ) : isPeriod11 ? (
                          <div>
                            <div className="font-black text-indigo-950 text-xs flex items-center justify-center gap-1">
                              <span>🌙</span>
                              <span>Period 11</span>
                            </div>
                            <div className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter mt-0.5">Late Remedial</div>
                            <div className="font-mono text-[10px] text-indigo-900/90 mt-0.5 font-bold">{bell.startTime} – {bell.endTime}</div>
                            <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-200/90 text-indigo-950 border border-indigo-300">Gr 6–9</span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">Period {bell.period}</div>
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{bell.startTime} – {bell.endTime}</div>
                          </div>
                        )}
                      </td>

                      {/* Day Columns */}
                      {DAYS_OF_WEEK.map((day) => {
                        const slot = displayedSlots.find(s => s.dayOfWeek === day && s.period === bell.period);

                        if (!slot) {
                          return (
                            <td 
                              key={`${day}-${bell.period}`} 
                              className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-center align-middle"
                            >
                              {canEdit ? (
                                <button
                                  onClick={() => {
                                    setSlotToEdit(null);
                                    setFormDay(day);
                                    setFormPeriod(bell.period);
                                    setFormSubject(availableSubjects[0]);
                                    setFormTeacherName(currentUser.name || 'Mr. David Kiprono');
                                    setFormRoomName(`Classroom ${selectedGrade}-${selectedStream}`);
                                    setFormIsRemedial(isPeriod10 || isPeriod11);
                                    setFormStrandTopic(isPeriod10 ? 'Early Morning Remedial Session' : isPeriod11 ? 'Late Evening Remedial Session' : '');
                                    setFormNotes(isPeriod10 ? 'Grades 6–9 Early Morning Remedial Clinic' : isPeriod11 ? 'Grades 6–9 Late Evening Remedial Clinic' : '');
                                    setFormConflictWarning(null);
                                    setShowEditModal(true);
                                  }}
                                  className={`w-full h-14 border border-dashed rounded-xl flex items-center justify-center transition-colors text-xs font-semibold ${
                                    isPeriod10 
                                      ? 'border-amber-300 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-100/50 text-amber-700' 
                                      : isPeriod11 
                                        ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-500 hover:bg-indigo-100/50 text-indigo-700' 
                                        : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-400 hover:text-emerald-700'
                                  }`}
                                >
                                  {isPeriod10 ? '+ Allocate Early Remedial' : isPeriod11 ? '+ Allocate Evening Remedial' : '+ Add Slot'}
                                </button>
                              ) : (
                                <div className="h-14 flex items-center justify-center text-slate-300 text-xs italic">
                                  Free Study
                                </div>
                              )}
                            </td>
                          );
                        }

                        const theme = getSubjectTheme(slot.subject);
                        const isSlotRemedial = slot.isRemedial || slot.period === 10 || slot.period === 11;

                        return (
                          <td 
                            key={`${day}-${bell.period}`} 
                            className="py-2 px-2.5 border-r border-slate-200 last:border-r-0 align-top"
                          >
                            <div 
                              onClick={() => setSelectedSlotForDetail(slot)}
                              className={`p-2.5 rounded-xl border ${theme.bg} ${theme.border} transition-all shadow-2xs hover:shadow-sm cursor-pointer group flex flex-col justify-between min-h-[78px]`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <span className={`font-black text-xs ${theme.text} leading-tight group-hover:underline line-clamp-1`}>
                                    {slot.subject}
                                  </span>
                                  {slot.roomOrMeetLink && (
                                    <Video className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                                  )}
                                </div>

                                {isSlotRemedial && (
                                  <div className="mt-1">
                                    {slot.period === 10 ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                        <span>🌅</span>
                                        <span>Early Remedial</span>
                                      </span>
                                    ) : slot.period === 11 ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                                        <span>🌙</span>
                                        <span>Late Remedial</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                                        <span>⭐</span>
                                        <span>Remedial</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-600 font-medium mt-1 truncate">
                                  {slot.teacherName}
                                </div>
                              </div>

                              <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span className="truncate">{slot.roomName || `Room ${selectedGrade}`}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollableMatrixTableWrapper>
        </div>
          )}
          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 2: TODAY'S AGENDA TIMELINE
          ======================================================== */}
      {perspective === 'today' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedDay === 'All' ? "Full Week Period Run-Down" : `${selectedDay}'s Daily Learning Agenda`}
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed timeline with lesson objectives, lab stations, and virtual video conference rooms.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                Grade {selectedGrade} {selectedStream}
              </div>
            </div>

            <div className="space-y-3">
              {activeGradeBellSchedule.map((bell) => {
                if (bell.isBreak) {
                  return (
                    <div key={`agenda-break-${bell.startTime}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <span>⏰</span>
                        <span>{bell.label}</span>
                      </div>
                      <span className="font-mono text-slate-500">{bell.startTime} – {bell.endTime}</span>
                    </div>
                  );
                }

                const dayToMatch = selectedDay === 'All' ? 'Monday' : selectedDay;
                const slot = displayedSlots.find(s => s.dayOfWeek === dayToMatch && s.period === bell.period);
                const theme = slot ? getSubjectTheme(slot.subject) : null;

                return (
                  <div 
                    key={`agenda-${bell.period}`}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      slot ? `${theme?.bg} ${theme?.border}` : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 text-center shrink-0">
                        <div className="text-xs font-black text-slate-900">Period {bell.period}</div>
                        <div className="font-mono text-[10px] text-slate-500">{bell.startTime}</div>
                      </div>

                      {slot ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{slot.subject}</h4>
                            <span className="text-[11px] text-slate-500">·</span>
                            <span className="text-xs font-semibold text-slate-700">{slot.teacherName}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {slot.strandTopic ? `Strand: ${slot.strandTopic}` : 'Official CBC syllabus delivery and formative activities.'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{slot.roomName || 'Main Classroom'}</span>
                            </span>
                            {slot.materialsNeeded && slot.materialsNeeded.length > 0 && (
                              <span className="text-slate-600">
                                Materials: {slot.materialsNeeded.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          No lesson scheduled. Independent reading or library consultation.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {slot?.roomOrMeetLink && (
                        <a
                          href={slot.roomOrMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}
                      {slot && (
                        <button
                          onClick={() => setSelectedSlotForDetail(slot)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors"
                        >
                          Dossier
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 3: FACULTY WORKLOAD, DAILY ROUTE & WEEKLY MATRIX
          ======================================================== */}
      {perspective === 'teacher' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
            
            {/* TOP HEADER & INSTRUCTOR SELECTOR */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md">
                    Faculty Timetable & Itinerary
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Term 3 (Academic Year 2026)
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
                  {isExecutiveLeadership ? 'Academic Dept Teaching Allocations & Workload Matrix' : 'My Teaching Schedule & Daily Classroom Route'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isExecutiveLeadership 
                    ? 'Executive Master Oversight: Audit classes to visit per day, weekly matrix, and assign relief teachers for absent colleagues.' 
                    : 'View all classes and streams to visit per day, full weekly schedule matrix, and report absence to leadership.'}
                </p>
              </div>

              {/* Action Controls & Teacher Selector */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Teacher Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {isExecutiveLeadership ? 'Select Faculty:' : 'Assigned Faculty:'}
                  </span>
                  {isExecutiveLeadership ? (
                    <select
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      {distinctTeachers.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentUser.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                        My Workload
                      </span>
                    </div>
                  )}
                </div>

                {/* Report Absence Button (For Any Teacher or Leadership) */}
                <button
                  onClick={() => setShowAbsenceModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Report absence status to Head Teacher, Deputy Head, Dean of Studies, and Senior Teacher"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report Absence to Leadership</span>
                </button>

                {/* Full View Capture Button */}
                <button
                  onClick={() => {
                    setCaptureModalMode(teacherViewMode);
                    setShowCaptureModal(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Full View Capture: Clean printable and exportable snapshot of classes and streams to visit"
                >
                  <Eye className="w-4 h-4" />
                  <span>Full View Capture</span>
                </button>

                {/* Print / Capture Full Schedule */}
                <button
                  onClick={() => {
                    setCaptureModalMode(teacherViewMode);
                    setShowCaptureModal(true);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print / Save Timetable Schedule Capture"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Print Capture</span>
                </button>
              </div>
            </div>

            {/* Active Absence Report Status Notification Banner */}
            {(() => {
              const activeReport = absenceReports.find(r => r.teacherName.toLowerCase() === selectedTeacher.toLowerCase());
              if (!activeReport) return null;

              const totalAffected = activeReport.affectedClasses?.length || 0;
              const coveredCount = activeReport.affectedClasses?.filter(cls => {
                return allSlots.some(s => 
                  s.teacherName?.toLowerCase() === activeReport.teacherName.toLowerCase() &&
                  s.dayOfWeek === cls.dayOfWeek &&
                  s.period === cls.period &&
                  s.isReliefCover
                );
              }).length || 0;

              return (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-900 uppercase">
                          Absence Report Logged ({activeReport.leaveType.replace('_', ' ').toUpperCase()})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          {activeReport.startDate} to {activeReport.endDate}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Broadcasted to: <strong>Head Teacher, Deputy Head, Dean of Studies & Senior Teacher</strong>.
                        Reason: {activeReport.reason}
                      </p>
                      <div className="text-[11px] text-amber-900 font-bold mt-1">
                        Relief Coverage: {coveredCount} of {totalAffected} classes covered by relief colleagues.
                      </div>
                    </div>
                  </div>

                  {isExecutiveLeadership && (
                    <button
                      onClick={() => setPerspective('relief')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Open Relief Desk
                    </button>
                  )}
                </div>
              );
            })()}

            {/* FULL VIEW MODE SWITCHER TABS (DAY VIEW vs WHOLE WEEK VIEW) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTeacherViewMode('daily')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    teacherViewMode === 'daily'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>1. Daily View: Classes & Streams to Visit ({selectedTeacherDay})</span>
                </button>

                <button
                  onClick={() => setTeacherViewMode('weekly')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    teacherViewMode === 'weekly'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span>2. Whole Week's View: Full Matrix (Mon–Fri)</span>
                </button>
              </div>

              {/* Quick View Stat Pill */}
              <div className="text-xs font-bold text-slate-600 px-3 py-1">
                {teacherViewMode === 'daily' ? (
                  <span>
                    Selected: <strong className="text-slate-900">{selectedTeacherDay}</strong> ({teacherSlots.filter(s => s.dayOfWeek === selectedTeacherDay).length} lessons scheduled)
                  </span>
                ) : (
                  <span>
                    Total: <strong className="text-slate-900">{teacherSlots.length} weekly contact periods</strong> ({teacherSlots.length * 40} mins)
                  </span>
                )}
              </div>
            </div>

            {/* WORKLOAD SUMMARY METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Weekly Contact Periods</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{teacherSlots.length} periods</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{teacherSlots.length * 40} minutes instructional delivery</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Daily Lessons ({selectedTeacherDay})</div>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {teacherSlots.filter(s => s.dayOfWeek === selectedTeacherDay).length} classes
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {teacherSlots.filter(s => s.dayOfWeek === selectedTeacherDay).length * 40} mins delivery on {selectedTeacherDay}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Free / Prep Periods</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">{Math.max(0, 40 - teacherSlots.length)} periods</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Lesson planning & rubric assessment marking</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Assigned Classes & Streams</div>
                <div className="text-sm font-bold text-slate-900 mt-2 truncate">
                  {Array.from(new Set(teacherSlots.map(s => `Gr ${s.grade} ${s.stream}`))).join(', ') || 'None assigned'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Active curriculum streams</div>
              </div>
            </div>

            {/* ========================================================
                VIEW MODE 1: DAILY VIEW (CLASSES TO VISIT PER DAY)
                ======================================================== */}
            {teacherViewMode === 'daily' && (
              <div className="space-y-4">
                
                {/* Day of Week Selector Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Select Day:</span>
                  {DAYS_OF_WEEK.map(d => {
                    const countForDay = teacherSlots.filter(s => s.dayOfWeek === d).length;
                    const isSelected = selectedTeacherDay === d;

                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedTeacherDay(d)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{d}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {countForDay}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Day Summary Itinerary Banner */}
                {(() => {
                  const daySlots = teacherSlots
                    .filter(s => s.dayOfWeek === selectedTeacherDay)
                    .sort((a, b) => a.period - b.period);
                  const distinctClassesToday = Array.from(new Set(daySlots.map(s => `Grade ${s.grade} (${s.stream})`)));
                  const freePeriodsToday = Math.max(0, 8 - daySlots.length);

                  return (
                    <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                            {selectedTeacherDay} Itinerary
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            Visiting {daySlots.length} classes across {distinctClassesToday.length} streams
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {distinctClassesToday.length > 0 
                            ? `Classes on route: ${distinctClassesToday.join(', ')}`
                            : 'No scheduled teaching lessons for this day.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                          {daySlots.length * 40} mins delivery · {freePeriodsToday} free periods
                        </span>
                        <button
                          onClick={() => {
                            setCaptureModalMode('daily');
                            setShowCaptureModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          title="Open Full View Capture for this day"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Capture Day Itinerary</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Chronological List of All Classes to Visit */}
                {(() => {
                  const daySlots = teacherSlots
                    .filter(s => s.dayOfWeek === selectedTeacherDay)
                    .sort((a, b) => a.period - b.period);

                  // Generate full 8 periods breakdown for this day
                  const periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

                  return (
                    <div className="space-y-3">
                      {periodsList.map(periodNum => {
                        const slot = daySlots.find(s => s.period === periodNum);
                        const bell = bellSchedule.find(b => b.period === periodNum && !b.isBreak);
                        const timeStr = bell ? `${bell.startTime} – ${bell.endTime}` : `Period ${periodNum}`;

                        if (slot) {
                          return (
                            <div
                              key={slot.id}
                              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs ${
                                slot.isReliefCover 
                                  ? 'bg-amber-50/70 border-amber-300' 
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                
                                {/* Left Info: Class and Stream Badge */}
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                                    <span className="text-[10px] uppercase font-bold opacity-80">Period</span>
                                    <span className="text-base leading-none">{slot.period}</span>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* CLASS & STREAM BADGE */}
                                      <span className="text-sm font-black text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-lg">
                                        Grade {slot.grade} ({slot.stream})
                                      </span>

                                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                        {slot.subject}
                                      </span>

                                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {slot.startTime} – {slot.endTime}
                                      </span>

                                      {slot.isReliefCover && (
                                        <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                                          <span>Relief Cover (Substituting for {slot.absentTeacherName})</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Topic / Strand */}
                                    <p className="text-xs text-slate-700 font-medium">
                                      <strong>Strand / Topic:</strong> {slot.strandTopic || 'Core CBC Curriculum Unit'}
                                    </p>

                                    {/* Location & Handover */}
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                      <span className="flex items-center gap-1 font-mono">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Room: <strong>{slot.roomName || 'Allocated Classroom'}</strong></span>
                                      </span>

                                      {slot.materialsNeeded && slot.materialsNeeded.length > 0 && (
                                        <span>
                                          Materials: <em>{slot.materialsNeeded.join(', ')}</em>
                                        </span>
                                      )}

                                      {slot.reliefInstructions && (
                                        <span className="text-amber-800 font-medium">
                                          Relief Notes: {slot.reliefInstructions}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                  {isExecutiveLeadership && (
                                    <button
                                      onClick={() => setReliefBookingSlot(slot)}
                                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      title="Dean of Studies & Deputy Head: Book relief teacher for absent colleague"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>{slot.isReliefCover ? 'Change Relief' : 'Book Relief Teacher'}</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setSelectedSlotForDetail(slot)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                  >
                                    Inspect Dossier
                                  </button>
                                </div>

                              </div>
                            </div>
                          );
                        } else {
                          // Free / Prep Period Row
                          return (
                            <div
                              key={`free-${periodNum}`}
                              className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3.5 flex items-center justify-between text-xs text-slate-500"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                                  P{periodNum}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-700 block">
                                    Free Period / Lesson Preparation & Grading
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-400">
                                    {timeStr} · Staff Room / Resource Library
                                  </span>
                                </div>
                              </div>

                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Open Window
                              </span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* ========================================================
                VIEW MODE 2: WHOLE WEEK'S VIEW (FULL WEEKLY SCHEDULE MATRIX)
                ======================================================== */}
            {teacherViewMode === 'weekly' && (
              <div className="space-y-4">
                
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Master Weekly Teaching Matrix (Monday to Friday)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Full 5-day panoramic grid of all class visits, stream rotations, and free prep windows.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      {teacherSlots.length} Total Contact Periods
                    </span>
                    <button
                      onClick={() => {
                        setCaptureModalMode('weekly');
                        setShowCaptureModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Open Full View Capture for the whole week"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Capture Weekly Matrix</span>
                    </button>
                  </div>
                </div>

                {/* Official 11-Lesson Horizontal Teacher Timetable Sheet (Mo–Fri × LESSON 1–11) */}
                <ClassicTimetableSheet
                  mode="teacher"
                  slots={teacherSlots}
                  teacherName={selectedTeacher || currentUser.name}
                  offDutySlots={
                    ttWorkspace?.teachers?.find(
                      (t) => t.teacherName.toLowerCase() === String(selectedTeacher || currentUser.name || '').toLowerCase()
                    )?.offDutySlots || []
                  }
                  onSelectSlot={(slot) => setSelectedSlotForDetail(slot)}
                />

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE: FACULTY RELIEF & ABSENCE MANAGEMENT DESK
          (Executive Leadership: Dean of Studies, Deputy Head, Head Teacher)
          ======================================================== */}
      {perspective === 'relief' && isExecutiveLeadership && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md">
                      Dean of Studies & Deputy Head Operations
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Curriculum Delivery Continuity
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Faculty Relief & Teacher Absence Management Desk
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAbsenceModal(true)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>+ Record Faculty Absence</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: ACTIVE TEACHER ABSENCE REPORTS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Reported Faculty Absences ({absenceReports.length} Reports)</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Dean / Deputy action: Assign relief teachers for affected lesson slots
                </span>
              </div>

              {absenceReports.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  All faculty members are currently on duty. Zero pending absence reports.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {absenceReports.map(report => (
                    <div 
                      key={report.id}
                      className="bg-white rounded-2xl border border-amber-200 p-5 shadow-2xs space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-slate-900">{report.teacherName}</h5>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              {report.leaveType.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Absence Window: <strong className="text-slate-800">{report.startDate} to {report.endDate}</strong>
                          </p>
                        </div>

                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          report.reliefStatus === 'fully_assigned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {report.reliefStatus === 'fully_assigned' ? 'Covered' : 'Relief Needed'}
                        </span>
                      </div>

                      {/* Reason & Handover Note */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">Reason: </span>
                          <span className="text-slate-600">{report.reason}</span>
                        </div>
                        {report.handoverNotes && (
                          <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                            <strong className="text-indigo-900">Handover Notes:</strong> {report.handoverNotes}
                          </div>
                        )}
                        {report.contactNumber && (
                          <div className="text-[11px] text-slate-500 pt-0.5">
                            Emergency Phone: <strong className="font-mono text-slate-700">{report.contactNumber}</strong>
                          </div>
                        )}
                      </div>

                      {/* Affected Classes to Visit & Relief Booking Action */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">
                          Affected Classes & Streams ({report.affectedClasses.length} Lessons):
                        </span>

                        <div className="space-y-1.5">
                          {report.affectedClasses.map((cls, i) => {
                            // Find corresponding slot in allSlots
                            const matchedSlot = allSlots.find(s => 
                              s.teacherName.toLowerCase() === report.teacherName.toLowerCase() &&
                              s.dayOfWeek === cls.dayOfWeek &&
                              s.period === cls.period
                            );

                            const isCovered = matchedSlot?.isReliefCover;

                            return (
                              <div 
                                key={i}
                                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                      Grade {cls.grade} {cls.stream}
                                    </span>
                                    <span className="font-semibold text-emerald-800">
                                      · {cls.subject}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      (P{cls.period}: {cls.time})
                                    </span>
                                  </div>
                                  {isCovered && (
                                    <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                      ✓ Covered by: <strong>{matchedSlot?.reliefTeacherName}</strong>
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    if (matchedSlot) {
                                      setReliefBookingSlot(matchedSlot);
                                    } else {
                                      // Fallback dummy slot for booking
                                      const dummySlot: TimetableSlot = {
                                        id: `slot-rel-${Date.now()}`,
                                        grade: cls.grade,
                                        stream: cls.stream,
                                        dayOfWeek: cls.dayOfWeek,
                                        period: cls.period,
                                        startTime: cls.time.split('–')[0]?.trim() || '08:20',
                                        endTime: cls.time.split('–')[1]?.trim() || '09:00',
                                        subject: cls.subject,
                                        teacherName: report.teacherName,
                                        absentTeacherName: report.teacherName,
                                        notes: report.handoverNotes
                                      };
                                      setReliefBookingSlot(dummySlot);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isCovered
                                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                                  }`}
                                >
                                  {isCovered ? 'Change Relief' : 'Book Relief Teacher'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: ACTIVE RELIEF ASSIGNMENTS TABLE */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Currently Booked Relief Teachers Across the School</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {allSlots.filter(s => s.isReliefCover).length} Active Substitutions
                </span>
              </div>

              {allSlots.filter(s => s.isReliefCover).length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  No active relief covers currently assigned.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Day & Period</th>
                        <th className="py-2.5 px-4">Class & Stream</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Absent Colleague</th>
                        <th className="py-2.5 px-4">Relief Teacher Booked</th>
                        <th className="py-2.5 px-4">Booked By</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allSlots.filter(s => s.isReliefCover).map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {s.dayOfWeek} · P{s.period} ({s.startTime}–{s.endTime})
                          </td>
                          <td className="py-2.5 px-4 font-extrabold text-slate-900">
                            Grade {s.grade} {s.stream}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-emerald-800">
                            {s.subject}
                          </td>
                          <td className="py-2.5 px-4 text-rose-700 font-semibold">
                            {s.absentTeacherName || s.teacherName}
                          </td>
                          <td className="py-2.5 px-4 text-indigo-700 font-black">
                            {s.reliefTeacherName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                            {s.reliefBookedBy || 'Dean of Studies'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => setReliefBookingSlot(s)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] cursor-pointer mr-1"
                            >
                              Modify
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Cancel this relief cover?')) {
                                  Storage.cancelReliefBooking(s.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 4: SHARED FACILITIES & SPECIALIST LABS WEEKLY TIMETABLE
          ======================================================== */}
      {perspective === 'rooms' && (
        <div className="space-y-6">
          {facilitySchedules && facilitySchedules.facilities.length > 0 ? (() => {
            const sharedFacilities = facilitySchedules.facilities.filter((f) => f.isSharedFacility);
            const allFacs = facilitySchedules.facilities;
            const activeFac =
              allFacs.find((f) => f.id === selectedFacilityId) || sharedFacilities[0] || allFacs[0];
            const facDays = facilitySchedules.workingDays?.length
              ? facilitySchedules.workingDays
              : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const facPeriods = facilitySchedules.periods?.length
              ? facilitySchedules.periods
              : [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ periodNumber: n, label: `Period ${n}`, startTime: '', endTime: '' }));

            return (
              <div className="space-y-4">
                {/* Shared Facilities Quick Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(sharedFacilities.length > 0 ? sharedFacilities : allFacs.slice(0, 8)).map((fac) => {
                    const isSelected = activeFac?.id === fac.id;
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => setSelectedFacilityId(fac.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold truncate">{fac.name}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              fac.clashCount > 0
                                ? 'bg-rose-500 text-white'
                                : isSelected
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {fac.clashCount > 0 ? `${fac.clashCount} Clash` : `${fac.utilizationPct}%`}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-1 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {fac.roomCode} · Max {fac.maxConcurrentClasses} class{fac.maxConcurrentClasses === 1 ? '' : 'es'}/slot · {fac.bookedSlots} booked
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Facility Detailed Weekly Matrix & Bookings */}
                {activeFac && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <TenantSchoolLogo variant="emblem" size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {activeFac.name} · Shared Facility Weekly Schedule
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {activeFac.roomCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Capacity: {activeFac.capacity} seats · Simultaneous limit: {activeFac.maxConcurrentClasses} class{activeFac.maxConcurrentClasses === 1 ? '' : 'es'} · {activeFac.bookedSlots} booked / {activeFac.freeSlots} free slots
                            {activeFac.responsibleStaff ? ` · Supervisor: ${activeFac.responsibleStaff}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={activeFac.id}
                          onChange={(e) => setSelectedFacilityId(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        >
                          {allFacs.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.roomCode})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer print:hidden"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Schedule</span>
                        </button>
                      </div>
                    </div>

                    {/* Weekly Facility Grid (Days × Periods) */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="py-2.5 px-3 w-28">Day</th>
                            {facPeriods.map((p) => (
                              <th key={p.periodNumber} className="py-2 px-2 text-center border-l border-slate-700">
                                <div className="font-bold">P{p.periodNumber}</div>
                                {p.startTime && (
                                  <div className="text-[10px] font-mono text-slate-300">{p.startTime}–{p.endTime}</div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {facDays.map((day) => (
                            <tr key={day} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-extrabold text-slate-900 bg-slate-50 border-r border-slate-200">
                                {day}
                              </td>
                              {facPeriods.map((p) => {
                                const booking = activeFac.bookings.find(
                                  (b) => b.dayOfWeek === day && b.periodNumber === p.periodNumber
                                );
                                if (!booking) {
                                  return (
                                    <td key={`${day}-${p.periodNumber}`} className="p-2 text-center text-[10px] text-slate-400 border-l border-slate-200">
                                      Available
                                    </td>
                                  );
                                }
                                return (
                                  <td
                                    key={`${day}-${p.periodNumber}`}
                                    className={`p-2 border-l border-slate-200 align-top ${
                                      booking.hasClash ? 'bg-rose-50' : 'bg-emerald-50/60'
                                    }`}
                                  >
                                    <div className="font-extrabold text-[11px] text-slate-900 leading-tight">
                                      {booking.subjectLabel}
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-900 mt-0.5 leading-tight">
                                      {booking.streamLabel}
                                    </div>
                                    <div className="text-[10px] text-slate-600 truncate mt-0.5">
                                      {booking.responsibleTeacher}
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                                      <span className={booking.hasClash ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                                        {booking.occupancy}/{booking.maxConcurrentClasses} cls
                                      </span>
                                      {booking.blockLength > 1 && (
                                        <span className="px-1 rounded bg-slate-900 text-white font-bold">
                                          {booking.blockLength}P
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Structured Facility Allocations Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Day</th>
                            <th className="py-2.5 px-4">Time / Period</th>
                            <th className="py-2.5 px-4">Grade &amp; Stream(s)</th>
                            <th className="py-2.5 px-4">Activity / Subject</th>
                            <th className="py-2.5 px-4">Responsible Teacher</th>
                            <th className="py-2.5 px-4 text-center">Duration</th>
                            <th className="py-2.5 px-4 text-right">Occupancy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeFac.bookings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                                {activeFac.name} currently has 100% open weekly availability.
                              </td>
                            </tr>
                          ) : (
                            activeFac.bookings.map((b, idx) => (
                              <tr key={`${b.dayOfWeek}-${b.periodNumber}-${idx}`} className="hover:bg-slate-50">
                                <td className="py-2.5 px-4 font-bold text-slate-900">{b.dayOfWeek}</td>
                                <td className="py-2.5 px-4 font-mono text-slate-700">
                                  P{b.periodNumber} · {b.timeRange}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-slate-800">
                                  {b.streamLabel}
                                  {b.isCombined && (
                                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800">
                                      Combined
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-emerald-800">{b.subjectLabel}</td>
                                <td className="py-2.5 px-4 text-slate-700">{b.responsibleTeacher}</td>
                                <td className="py-2.5 px-4 text-center font-mono">{b.blockLength} period{b.blockLength > 1 ? 's' : ''}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                      b.hasClash
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                  >
                                    {b.hasClash ? `CLASH (${b.occupancy}/${b.maxConcurrentClasses})` : `${b.occupancy}/${b.maxConcurrentClasses} OK`}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Specialist Labs, Studios &amp; Sports Facilities Utilization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time space occupancy across Swimming Pool, Science Labs, Computer Labs, Library, Art Studios, and Outdoor Pitches.
                  </p>
                </div>

                {/* Room Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Select Facility:</span>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {distinctRooms.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room Schedule Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4 text-center">Period</th>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Occupant Class</th>
                      <th className="py-2.5 px-4">Learning Area</th>
                      <th className="py-2.5 px-4">Supervising Instructor</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {roomSlots.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          {selectedRoom} has open availability with no allocated periods yet.
                        </td>
                      </tr>
                    ) : (
                      roomSlots.map(slot => (
                        <tr key={slot.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{slot.dayOfWeek}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-semibold">Period {slot.period}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{slot.startTime} – {slot.endTime}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">Grade {slot.grade} {slot.stream}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-800">{slot.subject}</td>
                          <td className="py-2.5 px-4 text-slate-700">{slot.teacherName}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                              Booked
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 5: CBC ASSESSMENT & EXAM TIMETABLE
          ======================================================== */}
      {perspective === 'exams' && (
        <ExamScheduleManager
          currentUser={currentUser}
          defaultGrade={selectedGrade}
        />
      )}

      {/* ========================================================
          MODAL: PERIOD DETAILS DOSSIER
          ======================================================== */}
      {selectedSlotForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Period Dossier · Grade {selectedSlotForDetail.grade} {selectedSlotForDetail.stream}
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedSlotForDetail.subject}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSlotForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Day & Period</span>
                  <div className="font-bold text-slate-900">{selectedSlotForDetail.dayOfWeek} · Period {selectedSlotForDetail.period}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Bell Timing</span>
                  <div className="font-mono font-bold text-slate-900">{selectedSlotForDetail.startTime} – {selectedSlotForDetail.endTime}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Instructor</span>
                  <div className="font-bold text-slate-900">{selectedSlotForDetail.teacherName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Facility Location</span>
                  <div className="font-bold text-slate-900">{selectedSlotForDetail.roomName || 'Classroom'}</div>
                </div>
              </div>

              {selectedSlotForDetail.strandTopic && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Curriculum Strand & Topic:</span>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                    {selectedSlotForDetail.strandTopic}
                  </div>
                </div>
              )}

              {selectedSlotForDetail.competencies && selectedSlotForDetail.competencies.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Targeted CBC Competencies:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSlotForDetail.competencies.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSlotForDetail.materialsNeeded && selectedSlotForDetail.materialsNeeded.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Required Learner Materials:</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                    {selectedSlotForDetail.materialsNeeded.map(m => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSlotForDetail.roomOrMeetLink && (
                <div className="pt-2">
                  <a
                    href={selectedSlotForDetail.roomOrMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>Launch Google Meet Classroom Session</span>
                  </a>
                </div>
              )}

              {canEdit && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteSlot(selectedSlotForDetail.id)}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Slot</span>
                  </button>

                  <button
                    onClick={() => {
                      const slot = selectedSlotForDetail;
                      setSelectedSlotForDetail(null);
                      handleOpenAddModal(slot);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Slot</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT PERIOD SLOT
          ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {slotToEdit ? 'Modify Scheduled Period' : 'Add Period to Timetable'}
                </h3>
                <p className="text-xs text-slate-400">
                  Grade {selectedGrade} ({selectedStream})
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-3.5 text-xs">
              
              {formConflictWarning && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{formConflictWarning}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setFormPeriod(p);
                      if (p === 10 || p === 11) {
                        setFormIsRemedial(true);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold font-mono"
                  >
                    {selectedGrade >= 6 && isDeanOrDeputy && (
                      <option value={10}>
                        🌅 Period 10 (Early Morning Remedial: 07:00 – 07:50)
                      </option>
                    )}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => {
                      const b = bellSchedule.find(bell => bell.period === p);
                      return (
                        <option key={p} value={p}>
                          Period {p} ({b?.startTime || '08:00'} - {b?.endTime || '08:40'})
                        </option>
                      );
                    })}
                    {selectedGrade >= 6 && isDeanOrDeputy && (
                      <option value={11}>
                        🌙 Period 11 (Late Evening Remedial: 15:45 – 16:45)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Remedial Info Callout Banner for Period 10 or 11 */}
              {(formPeriod === 10 || formPeriod === 11) && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <span className="text-lg">{formPeriod === 10 ? '🌅' : '🌙'}</span>
                  <div>
                    <div className="font-extrabold">
                      {formPeriod === 10 
                        ? `Grade ${selectedGrade} Early Morning Remedial Session (Period 10)`
                        : `Grade ${selectedGrade} Late Evening Remedial Session (Period 11)`}
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Dean of Studies & Deputy Head privilege: Dedicated academic remedial clinic for upper primary / junior school learners (Grades 6–9).
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="formRemedialCheckbox"
                  checked={formIsRemedial || formPeriod === 10 || formPeriod === 11}
                  onChange={(e) => setFormIsRemedial(e.target.checked)}
                  disabled={formPeriod === 10 || formPeriod === 11}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="formRemedialCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <span>Mark as Remedial Lesson / Subject Coaching Clinic</span>
                  {(formPeriod === 10 || formPeriod === 11) && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">Required</span>
                  )}
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Subject / Learning Area</label>
                  {streamAllocatedSubjects.length > 0 && !(formIsRemedial || formPeriod === 10 || formPeriod === 11) && (() => {
                    const matched = streamAllocatedSubjects.find(
                      (a) => a.subject.toLowerCase() === String(formSubject).trim().toLowerCase()
                    );
                    if (!matched) return null;
                    const count = getScheduledWeeklyCount(formSubject, slotToEdit?.id);
                    const atCap = count >= matched.requiredWeeklyPeriods;
                    return (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          atCap
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {count}/{matched.requiredWeeklyPeriods} lessons/wk scheduled
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={formSubject}
                  onChange={(e) => {
                    const nextSub = e.target.value as SubjectName;
                    setFormSubject(nextSub);
                    setFormConflictWarning(null);
                    const matchedAlloc = streamAllocatedSubjects.find(
                      (a) => a.subject.toLowerCase() === String(nextSub).trim().toLowerCase()
                    );
                    if (matchedAlloc?.teacherName) {
                      setFormTeacherName(matchedAlloc.teacherName);
                    }
                    if (
                      String(nextSub).toLowerCase().includes('library') &&
                      (!formRoomName || formRoomName.toLowerCase().startsWith('classroom'))
                    ) {
                      setFormRoomName('Main Library Reading Hall');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  {streamAllocatedSubjects.length > 0 && !(formIsRemedial || formPeriod === 10 || formPeriod === 11) ? (
                    <>
                      {streamAllocatedSubjects.map((alloc) => {
                        const used = getScheduledWeeklyCount(alloc.subject, slotToEdit?.id);
                        return (
                          <option key={alloc.subject} value={alloc.subject}>
                            {alloc.subject} ({used}/{alloc.requiredWeeklyPeriods} wk{alloc.teacherName ? ` · ${alloc.teacherName}` : ''})
                          </option>
                        );
                      })}
                      {!streamAllocatedSubjects.some((a) => a.subject === formSubject) && (
                        <option value={formSubject}>{formSubject} (Not allocated)</option>
                      )}
                    </>
                  ) : (
                    <>
                      {availableSubjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      {!availableSubjects.includes(formSubject) && (
                        <option value={formSubject}>{formSubject}</option>
                      )}
                    </>
                  )}
                </select>
                {streamAllocatedSubjects.length > 0 && !(formIsRemedial || formPeriod === 10 || formPeriod === 11) && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Strictly restricted to subjects allocated to Grade {selectedGrade} {selectedStream} and their configured weekly lesson limits.
                  </p>
                )}
                {String(formSubject).toLowerCase().includes('library') && (
                  <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                    Linked to Library Bookings: saving this Library Lesson automatically marks this library slot as occupied so free slots are visible for other teachers.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Instructor / Teacher Name</label>
                  {isDeanOrDeputy && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Dean / Deputy Reallocation Enabled
                    </span>
                  )}
                </div>
                {isDeanOrDeputy ? (
                  <div className="space-y-1.5">
                    <select
                      value={formTeacherName}
                      onChange={(e) => setFormTeacherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                    >
                      {distinctTeachers.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      {!distinctTeachers.includes(formTeacherName) && (
                        <option value={formTeacherName}>{formTeacherName}</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    placeholder="e.g. Mr. David Kiprono"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Lab Facility</label>
                  {isDeanOrDeputy ? (
                    <select
                      value={formRoomName}
                      onChange={(e) => setFormRoomName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                    >
                      {distinctRooms.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      {!distinctRooms.includes(formRoomName) && formRoomName && (
                        <option value={formRoomName}>{formRoomName}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formRoomName}
                      onChange={(e) => setFormRoomName(e.target.value)}
                      placeholder="e.g. Science Lab 1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Google Meet Room Link</label>
                  <input
                    type="url"
                    value={formMeetLink}
                    onChange={(e) => setFormMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Curriculum Strand & Topic</label>
                <input
                  type="text"
                  value={formStrandTopic}
                  onChange={(e) => setFormStrandTopic(e.target.value)}
                  placeholder="e.g. Fractions and Decimals Word Problems"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Save Schedule Slot
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: HIGH-RESOLUTION PRINT POSTER PREVIEW
          ======================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-sm">Printable A4 Classroom Wall Chart</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Execute Print</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 print:p-0 print:m-0">
              
              {/* Official School Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                    Republic of Kenya · Ministry of Education · CBC Compliant
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">
                    {currentTenant.name}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Official Class Routine Timetable · Grade {selectedGrade} ({selectedStream}) · Academic Year 2026
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <TenantSchoolLogo variant="emblem" size="sm" />
                  <div className="text-[10px] font-mono text-slate-500 mt-1">Ref: TIMETABLE/2026/G{selectedGrade}</div>
                </div>
              </div>

              {/* High-Contrast Print Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-900 border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-900 font-black text-slate-900">
                    <th className="p-2 border-r border-slate-900 w-28 text-center">Period / Time</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="p-2 border-r border-slate-900 last:border-r-0 text-center">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {activeGradeBellSchedule.map(bell => {
                    if (bell.isBreak) {
                      return (
                        <tr key={`print-break-${bell.startTime}`} className="bg-slate-100 font-bold border-b border-slate-900">
                          <td className="p-1.5 text-center border-r border-slate-900 font-mono text-[10px]">
                            {bell.startTime} - {bell.endTime}
                          </td>
                          <td colSpan={5} className="p-1.5 text-center text-xs tracking-wider uppercase font-black">
                            {bell.label}
                          </td>
                        </tr>
                      );
                    }

                    const isPeriod10 = bell.period === 10;
                    const isPeriod11 = bell.period === 11;

                    return (
                      <tr key={`print-period-${bell.period}`} className={`border-b border-slate-900 ${isPeriod10 ? 'bg-amber-50/50' : isPeriod11 ? 'bg-indigo-50/50' : ''}`}>
                        <td className="p-2 text-center border-r border-slate-900 font-black">
                          {isPeriod10 ? (
                            <div>
                              <div className="text-amber-900 font-black">Period 10</div>
                              <div className="text-[9px] uppercase font-bold text-amber-700">Early Remedial</div>
                              <div className="text-[10px] font-mono font-normal">{bell.startTime} - {bell.endTime}</div>
                            </div>
                          ) : isPeriod11 ? (
                            <div>
                              <div className="text-indigo-900 font-black">Period 11</div>
                              <div className="text-[9px] uppercase font-bold text-indigo-700">Late Remedial</div>
                              <div className="text-[10px] font-mono font-normal">{bell.startTime} - {bell.endTime}</div>
                            </div>
                          ) : (
                            <div>
                              <div>Period {bell.period}</div>
                              <div className="text-[10px] font-mono font-normal">{bell.startTime} - {bell.endTime}</div>
                            </div>
                          )}
                        </td>
                        {DAYS_OF_WEEK.map(day => {
                          const slot = displayedSlots.find(s => s.dayOfWeek === day && s.period === bell.period);
                          return (
                            <td key={`print-${day}-${bell.period}`} className="p-2 border-r border-slate-900 last:border-r-0 align-top">
                              {slot ? (
                                <div>
                                  <div className="font-black text-slate-900 text-xs">{slot.subject}</div>
                                  <div className="text-[10px] text-slate-700">{slot.teacherName}</div>
                                  <div className="text-[9px] font-mono text-slate-500 mt-0.5">{slot.roomName || 'Classroom'}</div>
                                </div>
                              ) : (
                                <div className="text-center text-slate-400 italic text-[10px]">Free Study</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">Class Teacher</div>
                  <div className="mt-8 border-b border-slate-400 w-36" />
                  <div className="text-[10px] text-slate-500 mt-1">Mr. David Kiprono</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">Dean of Studies</div>
                  <div className="mt-8 border-b border-slate-400 w-36" />
                  <div className="text-[10px] text-slate-500 mt-1">Dean Academic Oversight</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">Head Teacher Approval</div>
                  <div className="mt-8 border-b border-slate-400 w-36" />
                  <div className="text-[10px] text-slate-500 mt-1">Dr. Arthur Mwangi · Principal</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CONFIGURE PERIOD TIMINGS & BELL SCHEDULE
          (FOR DEAN OF STUDIES & DEPUTY HEADTEACHER)
          ======================================================== */}
      {showPeriodTimingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Institutional Period Timings & Bell Schedule</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                      Dean & Deputy Head Authority
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modify official start times, end times, and break durations. Master timetable slots automatically synchronize to these timings.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPeriodTimingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timings Table / Editor */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Presets Toolbar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-700">Quick Institutional Routine Presets:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempBellSchedule([
                        { period: 10, label: 'Period 10 (Early Morning Remedial - Gr 6–9)', startTime: '07:00', endTime: '07:50' },
                        { period: 1, label: 'Period 1 (Morning Core)', startTime: '08:00', endTime: '08:40' },
                        { period: 2, label: 'Period 2 (Core Instruction)', startTime: '08:40', endTime: '09:20' },
                        { period: 3, label: 'Period 3 (STEM & Numeracy)', startTime: '09:20', endTime: '10:00' },
                        { period: 4, label: 'Period 4 (Language Arts)', startTime: '10:00', endTime: '10:40' },
                        { period: 0, label: 'Morning Tea & Health Snack Break', startTime: '10:40', endTime: '11:10', isBreak: true, breakType: 'morning_tea' },
                        { period: 5, label: 'Period 5 (Social & Applied Sciences)', startTime: '11:10', endTime: '11:50' },
                        { period: 6, label: 'Period 6 (Creative & Practical)', startTime: '11:50', endTime: '12:30' },
                        { period: 7, label: 'Period 7 (Science & Pre-Technical)', startTime: '12:30', endTime: '13:10' },
                        { period: 0, label: 'Midday Lunch & Pastoral Rest', startTime: '13:10', endTime: '14:10', isBreak: true, breakType: 'lunch' },
                        { period: 8, label: 'Period 8 (Specialist & Lab)', startTime: '14:10', endTime: '14:50' },
                        { period: 9, label: 'Period 9 (Afternoon Core Study)', startTime: '14:50', endTime: '15:30' },
                        { period: 11, label: 'Period 11 (Late Evening Remedial - Gr 6–9)', startTime: '15:45', endTime: '16:45' },
                      ]);
                      setNotificationMsg('Standard CBC 9-Period routine loaded (with Gr 6-9 remedial sessions).');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Standard CBC (9 Periods + Remedial)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBellSchedule([
                        { period: 1, label: 'Exam Session 1 (Paper 1)', startTime: '08:00', endTime: '09:00' },
                        { period: 2, label: 'Exam Session 2 (Review)', startTime: '09:00', endTime: '10:00' },
                        { period: 0, label: 'Morning Tea & Health Snack', startTime: '10:00', endTime: '10:30', isBreak: true, breakType: 'morning_tea' },
                        { period: 3, label: 'Exam Session 3 (Paper 2)', startTime: '10:30', endTime: '11:30' },
                        { period: 4, label: 'Exam Session 4 (Practical)', startTime: '11:30', endTime: '12:30' },
                        { period: 0, label: 'Midday Lunch & Pastoral Rest', startTime: '12:30', endTime: '13:30', isBreak: true, breakType: 'lunch' },
                        { period: 7, label: 'Afternoon Revision Lab', startTime: '13:30', endTime: '14:30' },
                        { period: 8, label: 'Supervised Library Prep', startTime: '14:30', endTime: '15:30' },
                        { period: 10, label: 'Evening Games & Leisure', startTime: '15:30', endTime: '16:30', isBreak: true, breakType: 'games' },
                      ]);
                      setNotificationMsg('Examination 60-Min routine loaded.');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Examination Schedule (60-Min)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBellSchedule([
                        { period: 1, label: 'Period 1 (Fast-Track)', startTime: '08:00', endTime: '08:35' },
                        { period: 2, label: 'Period 2 (Fast-Track)', startTime: '08:35', endTime: '09:10' },
                        { period: 0, label: 'Morning Tea & Health Snack', startTime: '09:10', endTime: '09:30', isBreak: true, breakType: 'morning_tea' },
                        { period: 3, label: 'Period 3 (Fast-Track)', startTime: '09:30', endTime: '10:05' },
                        { period: 4, label: 'Period 4 (Fast-Track)', startTime: '10:05', endTime: '10:40' },
                        { period: 5, label: 'Period 5 (Fast-Track)', startTime: '10:40', endTime: '11:15' },
                        { period: 6, label: 'Period 6 (Fast-Track)', startTime: '11:15', endTime: '11:50' },
                        { period: 0, label: 'Midday Lunch & Pastoral Rest', startTime: '11:50', endTime: '12:50', isBreak: true, breakType: 'lunch' },
                        { period: 7, label: 'Period 7 (Clubs/Society)', startTime: '12:50', endTime: '13:30' },
                        { period: 10, label: 'All-School Friday Assembly', startTime: '13:30', endTime: '15:00', isBreak: true, breakType: 'games' },
                      ]);
                      setNotificationMsg('Friday compressed routine loaded.');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Friday Compressed (35-Min)
                  </button>
                </div>
              </div>

              {/* Editable Periods List */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Session Type</th>
                      <th className="py-2.5 px-3">Period Label / Designation</th>
                      <th className="py-2.5 px-3">Start Time</th>
                      <th className="py-2.5 px-3">End Time</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tempBellSchedule.map((item, idx) => (
                      <tr key={idx} className={item.isBreak ? 'bg-amber-50/30' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3">
                          {item.isBreak ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                              {item.breakType === 'lunch' ? '🍱 Midday Lunch' : item.breakType === 'morning_tea' ? '☕ Morning Tea' : '⚽ Co-Curricular'}
                            </span>
                          ) : item.period === 10 ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-400">
                              🌅 Period 10 (Early Remedial)
                            </span>
                          ) : item.period === 11 ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-400">
                              🌙 Period 11 (Late Remedial)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Period {item.period}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...tempBellSchedule];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setTempBellSchedule(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="time"
                            value={item.startTime}
                            onChange={(e) => {
                              const updated = [...tempBellSchedule];
                              updated[idx] = { ...updated[idx], startTime: e.target.value };
                              setTempBellSchedule(updated);
                            }}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="time"
                            value={item.endTime}
                            onChange={(e) => {
                              const updated = [...tempBellSchedule];
                              updated[idx] = { ...updated[idx], endTime: e.target.value };
                              setTempBellSchedule(updated);
                            }}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {(() => {
                            const [sh, sm] = item.startTime.split(':').map(Number);
                            const [eh, em] = item.endTime.split(':').map(Number);
                            const diff = (eh * 60 + em) - (sh * 60 + sm);
                            return `${diff > 0 ? diff : 0} mins`;
                          })()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = tempBellSchedule.filter((_, i) => i !== idx);
                              setTempBellSchedule(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Remove period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const def = Storage.resetBellSchedule();
                  setTempBellSchedule(def);
                  setNotificationMsg('Bell schedule reset to default institutional timetable.');
                }}
                className="px-3.5 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPeriodTimingsModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    Storage.saveBellSchedule(tempBellSchedule);
                    setShowPeriodTimingsModal(false);
                    setNotificationMsg('Institutional period timings saved and master slots synchronized!');
                    setTimeout(() => setNotificationMsg(null), 4000);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Timings & Sync Timetable Slots</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

        </React.Fragment>
      )}

      {/* Teacher Absence Reporting Modal */}
      <TeacherAbsenceReportModal
        currentUser={currentUser}
        isOpen={showAbsenceModal}
        onClose={() => setShowAbsenceModal(false)}
        onReportSubmitted={(report) => {
          setNotificationMsg(`Absence notification dispatched to Head Teacher, Deputy, Dean, and Senior Teacher. ${report.affectedClasses.length} classes flagged for relief cover.`);
          setTimeout(() => setNotificationMsg(null), 5000);
        }}
      />

      {/* Relief Teacher Booking Modal (Dean / Deputy / Executive Leadership) */}
      {reliefBookingSlot && (
        <ReliefBookingModal
          currentUser={currentUser}
          slot={reliefBookingSlot}
          isOpen={!!reliefBookingSlot}
          onClose={() => setReliefBookingSlot(null)}
          onSuccess={(updatedSlot) => {
            setNotificationMsg(`Relief teacher ${updatedSlot.reliefTeacherName} successfully booked for Grade ${updatedSlot.grade} ${updatedSlot.stream} Period ${updatedSlot.period}!`);
            setTimeout(() => setNotificationMsg(null), 5000);
          }}
        />
      )}

      {/* Teacher Timetable Full View Capture Modal */}
      <TeacherTimetableCaptureModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        teacherName={selectedTeacher}
        allSlots={allSlots}
        bellSchedule={bellSchedule}
        initialMode={captureModalMode}
        initialDay={selectedTeacherDay}
      />

    </div>
  );
};
