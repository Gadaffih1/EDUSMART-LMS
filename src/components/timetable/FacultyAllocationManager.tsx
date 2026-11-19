import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  GradeLevel,
  JUNIOR_STREAMS,
  JUNIOR_SUBJECTS,
  PRIMARY_STREAMS,
  PRIMARY_SUBJECTS,
  StreamName,
  SubjectName,
  SubjectStreamAllocation,
  User,
} from '../../types';
import { Storage } from '../../utils/storage';
import { listSubjects } from '../../utils/catalogStore';
import { listDepartments } from '../../utils/departmentStore';
import { ahApiFetch, type AcademicBootstrapPayload } from '../academic-hierarchy/academicHierarchyTypes';

interface FacultyAllocationManagerProps {
  currentUser: User;
  onAllocationsUpdated?: () => void;
  onTriggerAutoGeneration?: () => void;
}

interface SlotOwnerInfo {
  teacherId: string;
  teacherName: string;
  assignmentId?: string;
}

function parseGradeNumFromLabel(name: string, gradeNumber?: number | null): number {
  if (typeof gradeNumber === 'number' && Number.isFinite(gradeNumber)) return gradeNumber;
  const match = String(name || '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function slotKey(grade: number, stream: string, subject: string): string {
  return `${grade}::${stream.trim().toLowerCase()}::${subject.trim().toLowerCase()}`;
}

export const FacultyAllocationManager: React.FC<FacultyAllocationManagerProps> = ({
  currentUser,
  onAllocationsUpdated,
  onTriggerAutoGeneration,
}) => {
  const schoolId = currentUser.schoolId || 'tenant-riara';
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers(schoolId));
  const [bootstrap, setBootstrap] = useState<AcademicBootstrapPayload | null>(null);
  const [loadingSync, setLoadingSync] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Modal state for explicit Grade + Specific Stream + Subject linking
  const [draftAllocations, setDraftAllocations] = useState<SubjectStreamAllocation[]>([]);
  const [builderSubject, setBuilderSubject] = useState<string>('Mathematics');
  const [builderGrade, setBuilderGrade] = useState<number>(4);
  const [builderPeriods, setBuilderPeriods] = useState<number>(4);
  const [departmentInput, setDepartmentInput] = useState<string>('');
  const [allowReassign, setAllowReassign] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadHierarchyData = useCallback(async () => {
    setLoadingSync(true);
    try {
      const data = await ahApiFetch<AcademicBootstrapPayload>('/api/academic/bootstrap', {
        tenantId: schoolId,
      });
      setBootstrap(data);
    } catch {
      // Fall back gracefully to local storage state if bootstrap unavailable
    } finally {
      setUsers(Storage.getUsers(schoolId));
      setLoadingSync(false);
    }
  }, [schoolId]);

  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(() => {
    void loadHierarchyData();
    const onUsersUpdated = () => setUsers(Storage.getUsers(schoolId));
    const onCatalogUpdated = () => setCatalogTick((t) => t + 1);
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || detail.key === '*' || detail.key === 'academic_hierarchy' || detail.key === 'edusmart_users_v1') {
        void loadHierarchyData();
      }
      if (!detail || detail.key === '*' || detail.key === 'edusmart_subjects_v1' || detail.key === 'edusmart_departments_v1') {
        setCatalogTick((t) => t + 1);
      }
    };
    window.addEventListener('users-updated', onUsersUpdated);
    window.addEventListener('subjects-catalog-updated', onCatalogUpdated);
    window.addEventListener('departments-updated', onCatalogUpdated);
    window.addEventListener('edusmart:data-changed', onSse);
    return () => {
      window.removeEventListener('users-updated', onUsersUpdated);
      window.removeEventListener('subjects-catalog-updated', onCatalogUpdated);
      window.removeEventListener('departments-updated', onCatalogUpdated);
      window.removeEventListener('edusmart:data-changed', onSse);
    };
  }, [loadHierarchyData, schoolId]);

  // Faculty members for this school
  const facultyList = useMemo(() => {
    return users.filter((u) => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));
  }, [users]);

  // Available curriculum subjects (includes Library Lesson, Arts, Music, Nutrition & custom Master Timetable subjects)
  const allCurriculumSubjects = useMemo(() => {
    const set = new Set<string>([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS]);
    for (const s of listSubjects()) {
      if (s?.name) set.add(s.name);
    }
    for (const a of bootstrap?.subjectAssignments || []) {
      if (a.subject_name) set.add(String(a.subject_name));
    }
    return Array.from(set).sort();
  }, [bootstrap, catalogTick]);

  // Available academic departments (from Department Store + existing faculty records)
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of listDepartments(schoolId)) {
      if (d?.name) set.add(d.name);
    }
    for (const f of facultyList) {
      if (f.department && f.department.trim()) set.add(f.department.trim());
    }
    return Array.from(set).sort();
  }, [schoolId, facultyList, catalogTick]);

  // Available grades & their specific streams for this school
  const gradeOptions = useMemo(() => {
    const byGradeNum = new Map<
      number,
      {
        gradeNum: number;
        gradeId?: string;
        gradeName: string;
        streams: Array<{ streamId?: string; streamName: string; displayName: string }>;
      }
    >();

    if (bootstrap?.grades?.length) {
      for (const g of bootstrap.grades) {
        const gNum = parseGradeNumFromLabel(g.name, g.gradeNumber);
        const matchingStreams = (bootstrap.streams || [])
          .filter((s) => s.gradeId === g.id)
          .map((s) => ({
            streamId: s.id,
            streamName: s.name,
            displayName: s.displayName || `${g.name} ${s.name}`,
          }));
        byGradeNum.set(gNum, {
          gradeNum: gNum,
          gradeId: g.id,
          gradeName: g.name,
          streams: matchingStreams,
        });
      }
    }

    // Ensure Grades 1-9 fallback if a grade or stream hasn't been configured yet
    for (const gNum of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const existing = byGradeNum.get(gNum);
      if (!existing) {
        const defaults = gNum <= 6 ? PRIMARY_STREAMS.slice(0, 3) : JUNIOR_STREAMS.slice(0, 3);
        byGradeNum.set(gNum, {
          gradeNum: gNum,
          gradeName: `Grade ${gNum}`,
          streams: defaults.map((st) => ({
            streamName: st,
            displayName: `Grade ${gNum} ${st}`,
          })),
        });
      } else if (existing.streams.length === 0) {
        const defaults = gNum <= 6 ? PRIMARY_STREAMS.slice(0, 3) : JUNIOR_STREAMS.slice(0, 3);
        existing.streams = defaults.map((st) => ({
          streamName: st,
          displayName: `${existing.gradeName} ${st}`,
        }));
      }
    }

    return Array.from(byGradeNum.values()).sort((a, b) => a.gradeNum - b.gradeNum);
  }, [bootstrap]);

  // Explicit allocations keyed by teacherId from authoritative backend + local fallback
  const allocationsByTeacherId = useMemo(() => {
    const map = new Map<string, SubjectStreamAllocation[]>();

    if (bootstrap?.subjectAssignments?.length) {
      for (const a of bootstrap.subjectAssignments) {
        if (!a.stream_name && !a.stream_id) continue;
        const gNum = parseGradeNumFromLabel(a.grade_name || '', a.grade_number);
        const item: SubjectStreamAllocation = {
          id: a.id,
          grade: gNum as GradeLevel,
          stream: (a.stream_name || '') as StreamName,
          subject: String(a.subject_name) as SubjectName,
          gradeId: a.grade_id,
          streamId: a.stream_id || undefined,
          periodsPerWeek: Number(a.periods_per_week || 4),
        };
        const arr = map.get(a.teacher_id) || [];
        arr.push(item);
        map.set(a.teacher_id, arr);
      }
    }

    for (const teacher of facultyList) {
      if (!map.has(teacher.id) && teacher.assignedSubjectAllocations?.length) {
        map.set(teacher.id, teacher.assignedSubjectAllocations);
      }
    }

    return map;
  }, [bootstrap, facultyList]);

  // Global ownership map: slotKey(grade, stream, subject) -> SlotOwnerInfo (enforces max 1 teacher per subject per stream)
  const slotOwnerMap = useMemo(() => {
    const map = new Map<string, SlotOwnerInfo>();
    const nameById = new Map(facultyList.map((f) => [f.id, f.name]));

    for (const [tid, list] of allocationsByTeacherId.entries()) {
      for (const a of list) {
        if (!a.stream || !a.subject) continue;
        const k = slotKey(Number(a.grade), a.stream, a.subject);
        if (!map.has(k)) {
          const bMatch = bootstrap?.subjectAssignments?.find((r) => r.id === a.id);
          map.set(k, {
            teacherId: tid,
            teacherName: bMatch?.teacher_name || nameById.get(tid) || 'Assigned Teacher',
            assignmentId: a.id,
          });
        }
      }
    }
    return map;
  }, [allocationsByTeacherId, bootstrap, facultyList]);

  // Filtered faculty
  const filteredFaculty = useMemo(() => {
    return facultyList.filter((t) => {
      const teacherAllocs = allocationsByTeacherId.get(t.id) || [];
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacherAllocs.some(
          (a) =>
            a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.stream.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `grade ${a.grade}`.includes(searchQuery.toLowerCase())
        ) ||
        (t.assignedSubjects && t.assignedSubjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (t.tscNumber && t.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        filterDepartment === 'all' ||
        (t.department && t.department.toLowerCase().includes(filterDepartment.toLowerCase()));

      return matchesSearch && matchesDept;
    });
  }, [facultyList, allocationsByTeacherId, searchQuery, filterDepartment]);

  // Open Edit Modal for a teacher
  const handleOpenEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setModalError(null);
    setAllowReassign(false);

    const existing = allocationsByTeacherId.get(teacher.id) || teacher.assignedSubjectAllocations || [];
    setDraftAllocations(existing.map((a) => ({ ...a })));

    const firstAlloc = existing[0];
    setBuilderSubject(firstAlloc?.subject || teacher.assignedSubjects?.[0] || 'Mathematics');
    setBuilderGrade(firstAlloc?.grade || gradeOptions[0]?.gradeNum || 4);
    setBuilderPeriods(firstAlloc?.periodsPerWeek || 4);
    setDepartmentInput(teacher.department || 'Academic Department');
  };

  const currentGradeConfig = useMemo(() => {
    return gradeOptions.find((g) => g.gradeNum === builderGrade) || gradeOptions[0];
  }, [gradeOptions, builderGrade]);

  // Toggle a specific (builderSubject, builderGrade, specificStream) link for the editing teacher
  const handleToggleStreamSubjectLink = (streamObj: {
    streamId?: string;
    streamName: string;
    displayName: string;
  }) => {
    if (!editingTeacher || !currentGradeConfig) return;
    setModalError(null);

    const k = slotKey(currentGradeConfig.gradeNum, streamObj.streamName, builderSubject);
    const alreadyInDraft = draftAllocations.some(
      (a) => slotKey(Number(a.grade), a.stream, a.subject) === k
    );

    if (alreadyInDraft) {
      setDraftAllocations((prev) =>
        prev.filter((a) => slotKey(Number(a.grade), a.stream, a.subject) !== k)
      );
      return;
    }

    const owner = slotOwnerMap.get(k);
    if (owner && owner.teacherId !== editingTeacher.id && !allowReassign) {
      setModalError(
        `${builderSubject} in ${streamObj.displayName} is already assigned to ${owner.teacherName}. No subject in any stream can have more than one teacher. Enable "Reassign from existing teacher" below only if you want to transfer ownership.`
      );
      return;
    }

    setDraftAllocations((prev) => [
      ...prev,
      {
        grade: currentGradeConfig.gradeNum as GradeLevel,
        stream: streamObj.streamName as StreamName,
        subject: builderSubject as SubjectName,
        gradeId: currentGradeConfig.gradeId,
        streamId: streamObj.streamId,
        periodsPerWeek: Math.max(1, Number(builderPeriods || 4)),
      },
    ]);
  };

  const handleRemoveAllocation = (alloc: SubjectStreamAllocation) => {
    const k = slotKey(Number(alloc.grade), alloc.stream, alloc.subject);
    setDraftAllocations((prev) =>
      prev.filter((a) => slotKey(Number(a.grade), a.stream, a.subject) !== k)
    );
  };

  // Save teacher allocations atomically to backend + local Storage
  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSaving(true);
    setModalError(null);

    try {
      await ahApiFetch('/api/academic/teacher-assignments/sync-teacher', {
        method: 'PUT',
        tenantId: schoolId,
        body: JSON.stringify({
          schoolId,
          teacherId: editingTeacher.id,
          department: departmentInput.trim() || undefined,
          replaceExisting: allowReassign,
          allocations: draftAllocations.map((a) => ({
            grade: a.grade,
            gradeId: a.gradeId,
            stream: a.stream,
            streamId: a.streamId,
            subject: a.subject,
            periodsPerWeek: a.periodsPerWeek || 4,
          })),
        }),
      });

      const derivedSubjects = Array.from(new Set(draftAllocations.map((a) => a.subject))) as SubjectName[];
      const seenStream = new Set<string>();
      const derivedStreams: Array<{ grade: GradeLevel; stream: StreamName }> = [];
      for (const a of draftAllocations) {
        const key = `${a.grade}::${a.stream.toLowerCase()}`;
        if (!seenStream.has(key)) {
          seenStream.add(key);
          derivedStreams.push({ grade: a.grade, stream: a.stream });
        }
      }

      Storage.updateUser(editingTeacher.id, {
        assignedSubjectAllocations: draftAllocations,
        assignedSubjects: derivedSubjects,
        assignedStreams: derivedStreams,
        department: departmentInput.trim() || undefined,
      });

      await loadHierarchyData();
      setSaveSuccessMsg(
        `Saved ${draftAllocations.length} Grade-Stream-Subject lesson link${
          draftAllocations.length === 1 ? '' : 's'
        } for ${editingTeacher.name}.`
      );
      setTimeout(() => setSaveSuccessMsg(null), 5000);
      setEditingTeacher(null);
      onAllocationsUpdated?.();
    } catch (err: any) {
      setModalError(
        err?.message ||
          'Unable to save lesson allocations. Ensure each subject in a stream has only one teacher.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {onTriggerAutoGeneration && (
            <button
              type="button"
              onClick={onTriggerAutoGeneration}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-Run Auto-Generator Now</span>
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Dean of Studies Academic Office</span>
            <span>·</span>
            <span>Strict Stream-Subject Ownership</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Faculty Lesson, Grade &amp; Stream Allocations
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Every lesson links a <strong className="text-slate-700">Subject</strong> to a specific{' '}
            <strong className="text-slate-700">Grade &amp; Stream</strong>. A teacher can teach the same subject across multiple streams in a grade or across multiple grades, while each subject in any stream is locked to at most one teacher.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => void loadHierarchyData()}
            className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          {onTriggerAutoGeneration && (
            <button
              type="button"
              onClick={onTriggerAutoGeneration}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto-Generate Master Timetable</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teacher, TSC number, grade, stream, or subject..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Department:</span>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((teacher) => {
          const allocs = allocationsByTeacherId.get(teacher.id) || [];
          const isClassTeacher = teacher.role === 'class_teacher';

          // Group allocations cleanly by Subject for scannable display
          const groupedBySubject = new Map<string, SubjectStreamAllocation[]>();
          for (const a of allocs) {
            const arr = groupedBySubject.get(a.subject) || [];
            arr.push(a);
            groupedBySubject.set(a.subject, arr);
          }

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Teacher Profile Top */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={teacher.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{teacher.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {teacher.tscNumber || 'TSC/PENDING'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            isClassTeacher ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isClassTeacher ? 'Class Teacher' : 'Subject Faculty'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(teacher)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="Edit Teacher Allocation"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Linked Subject -> Grade & Specific Stream Assignments */}
                <div className="my-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Lessons ({allocs.length}):
                    </span>
                    {allocs.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {allocs.reduce((sum, a) => sum + Number(a.periodsPerWeek || 4), 0)}p/wk est.
                      </span>
                    )}
                  </div>

                  {allocs.length === 0 ? (
                    <span className="inline-block text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded font-medium">
                      No subject-stream lessons allocated yet
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(groupedBySubject.entries()).map(([subject, list]) => (
                        <div key={subject} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                          <div className="text-[11px] font-extrabold text-slate-900 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{subject}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {list.map((a) => (
                              <span
                                key={`${a.grade}-${a.stream}-${a.subject}`}
                                className="px-2 py-0.5 bg-white text-slate-800 border border-slate-200 rounded text-[10px] font-mono font-bold"
                              >
                                Gr {a.grade} · {a.stream}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {teacher.department || 'General Faculty'}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(teacher)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Assign Lessons</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          EDIT ALLOCATION MODAL (Subject ↔ Grade ↔ Specific Stream)
          ======================================================== */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Subject ↔ Grade &amp; Specific Stream Lesson Assignment
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Assign Lessons: {editingTeacher.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAllocation} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Department Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Department</label>
                  <input
                    type="text"
                    list="faculty-departments-datalist"
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    placeholder="e.g. Sciences & Mathematics, Library & Information Services"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                  />
                  <datalist id="faculty-departments-datalist">
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowReassign}
                      onChange={(e) => {
                        setAllowReassign(e.target.checked);
                        setModalError(null);
                      }}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">
                      Allow transferring stream ownership from another teacher
                    </span>
                  </label>
                </div>
              </div>

              {/* 1. BUILDER: PICK SUBJECT + GRADE + CLICK SPECIFIC STREAMS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div>
                  <div className="font-black text-slate-900 uppercase tracking-wide">
                    1. Link Subject to Grade &amp; Specific Stream(s)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a subject and grade, then click specific streams below. You can assign the same subject across multiple streams in this grade or switch grades to add other grades &amp; streams.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Learning Area / Subject</label>
                    <select
                      value={builderSubject}
                      onChange={(e) => {
                        setBuilderSubject(e.target.value);
                        setModalError(null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      {allCurriculumSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Grade</label>
                    <select
                      value={builderGrade}
                      onChange={(e) => {
                        setBuilderGrade(Number(e.target.value));
                        setModalError(null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      {gradeOptions.map((g) => (
                        <option key={g.gradeNum} value={g.gradeNum}>
                          {g.gradeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Periods / Week</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={builderPeriods}
                      onChange={(e) => setBuilderPeriods(Math.max(1, Number(e.target.value || 4)))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Specific Stream Selector Buttons */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-700">
                    Click specific streams in {currentGradeConfig?.gradeName} for{' '}
                    <span className="text-emerald-700">{builderSubject}</span>:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(currentGradeConfig?.streams || []).map((st) => {
                      const k = slotKey(currentGradeConfig.gradeNum, st.streamName, builderSubject);
                      const isAssignedToThisTeacher = draftAllocations.some(
                        (a) => slotKey(Number(a.grade), a.stream, a.subject) === k
                      );
                      const owner = slotOwnerMap.get(k);
                      const isTakenByOther = Boolean(owner && owner.teacherId !== editingTeacher.id);

                      return (
                        <button
                          key={st.streamName}
                          type="button"
                          onClick={() => handleToggleStreamSubjectLink(st)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isAssignedToThisTeacher
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : isTakenByOther && !allowReassign
                              ? 'bg-amber-50/70 text-amber-900 border-amber-300 hover:bg-amber-100/70'
                              : isTakenByOther && allowReassign
                              ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold truncate">{st.displayName}</div>
                            {isTakenByOther && !isAssignedToThisTeacher && (
                              <div className="text-[10px] font-medium text-amber-800 truncate">
                                Taken: {owner?.teacherName}
                              </div>
                            )}
                            {isAssignedToThisTeacher && (
                              <div className="text-[10px] font-medium text-emerald-100">Assigned</div>
                            )}
                          </div>
                          {isAssignedToThisTeacher ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : isTakenByOther && !allowReassign ? (
                            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. TEACHER'S COMPLETE LESSON LINKS LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                    2. Active Lesson Links for {editingTeacher.name} ({draftAllocations.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Each link pairs 1 Subject + 1 Grade + 1 Specific Stream
                  </span>
                </div>

                {draftAllocations.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                    No lesson assignments configured yet. Use the stream buttons above to assign subjects to specific grade streams.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                    {draftAllocations.map((alloc) => (
                      <div
                        key={`${alloc.grade}-${alloc.stream}-${alloc.subject}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900">{alloc.subject}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono font-bold text-slate-700">
                          Gr {alloc.grade} {alloc.stream}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(alloc)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Remove this lesson assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Lesson Allocations'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
