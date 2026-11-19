import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  GradeLevel,
  StreamName,
  getStreamsForGrade,
} from '../../types';
import { Storage } from '../../utils/storage';
import {
  canAccessStudentStreamAllocation,
  hasFullSchoolStreamAllocationAccess,
} from '../../utils/subjectTeacherSwitch';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';

interface StudentStreamManagerProps {
  currentUser: User;
  /** Optional explicit grade scope (e.g. from SeniorTeacherWorkspace bootstrap). */
  allowedGrades?: GradeLevel[];
}

const ALL_CBC_GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const StudentStreamManager: React.FC<StudentStreamManagerProps> = ({
  currentUser,
  allowedGrades,
}) => {
  const isAuthorized = canAccessStudentStreamAllocation(currentUser);
  const hasFullSchoolScope = hasFullSchoolStreamAllocationAccess(currentUser);

  const [fetchedSeniorGrades, setFetchedSeniorGrades] = useState<GradeLevel[]>([]);
  const [seniorScopeLoaded, setSeniorScopeLoaded] = useState<boolean>(
    hasFullSchoolScope || Boolean(allowedGrades && allowedGrades.length > 0)
  );

  // For Grade Senior Teachers without explicit allowedGrades prop, load their assigned grade(s) from the hierarchy API
  useEffect(() => {
    if (!isAuthorized || hasFullSchoolScope || (allowedGrades && allowedGrades.length > 0)) {
      setSeniorScopeLoaded(true);
      return;
    }
    let cancelled = false;
    const schoolId = currentUser.schoolId || '';
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    fetch(`/api/academic/bootstrap${qs}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const gradesArr = Array.isArray(data?.grades) ? data.grades : [];
        const assigned: GradeLevel[] = gradesArr
          .map((g: any) => Number(g?.gradeNumber ?? g?.grade_number))
          .filter((n: number): n is GradeLevel => Number.isInteger(n) && n >= 1 && n <= 9);
        setFetchedSeniorGrades(Array.from(new Set<GradeLevel>(assigned)).sort((a, b) => a - b));
        setSeniorScopeLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setSeniorScopeLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthorized, hasFullSchoolScope, allowedGrades, currentUser.schoolId]);

  const permittedGrades = useMemo<GradeLevel[]>(() => {
    if (!isAuthorized) return [];
    if (hasFullSchoolScope) return ALL_CBC_GRADES;
    if (allowedGrades && allowedGrades.length > 0) {
      return Array.from(new Set(allowedGrades)).sort((a, b) => a - b);
    }
    if (fetchedSeniorGrades.length > 0) {
      return fetchedSeniorGrades;
    }
    if (currentUser.grade && currentUser.grade >= 1 && currentUser.grade <= 9) {
      return [currentUser.grade];
    }
    return [];
  }, [isAuthorized, hasFullSchoolScope, allowedGrades, fetchedSeniorGrades, currentUser.grade]);

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    () => permittedGrades[0] || currentUser.grade || 4
  );
  const [activeStreamFilter, setActiveStreamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkTargetStream, setBulkTargetStream] = useState<StreamName>(() => {
    return getStreamsForGrade(permittedGrades[0] || currentUser.grade || 4)[0];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  // Keep selectedGrade strictly locked within permittedGrades
  useEffect(() => {
    if (permittedGrades.length > 0 && !permittedGrades.includes(selectedGrade)) {
      setSelectedGrade(permittedGrades[0]);
      setSelectedStudentIds([]);
      setActiveStreamFilter('all');
    }
  }, [permittedGrades, selectedGrade]);

  // Listen for live user updates
  useEffect(() => {
    const handleUsersUpdated = () => setRevision((r) => r + 1);
    window.addEventListener('users-updated', handleUsersUpdated);
    window.addEventListener('edusmart:data-changed', handleUsersUpdated);
    return () => {
      window.removeEventListener('users-updated', handleUsersUpdated);
      window.removeEventListener('edusmart:data-changed', handleUsersUpdated);
    };
  }, []);

  const validStreamsForSelectedGrade = useMemo(() => {
    return getStreamsForGrade(selectedGrade);
  }, [selectedGrade]);

  // Keep bulk target stream aligned if grade changes
  useEffect(() => {
    const valid = getStreamsForGrade(selectedGrade);
    if (!valid.includes(bulkTargetStream)) {
      setBulkTargetStream(valid[0]);
    }
  }, [selectedGrade, bulkTargetStream]);

  // Get all students for the current school
  const allStudents = useMemo(() => {
    if (!isAuthorized) return [];
    const schoolId = currentUser.schoolId;
    return Storage.getUsers().filter((u) => {
      if (u.role !== 'student') return false;
      if (schoolId && u.schoolId && u.schoolId !== schoolId) return false;
      return true;
    });
  }, [isAuthorized, currentUser.schoolId, revision]);

  // Filter students by selected grade (only if permitted)
  const gradeStudents = useMemo(() => {
    if (!permittedGrades.includes(selectedGrade)) return [];
    return allStudents.filter((u) => u.grade === selectedGrade);
  }, [allStudents, selectedGrade, permittedGrades]);

  // Stream counts & statistics
  const streamStats = useMemo(() => {
    const counts: Record<string, number> = {};
    validStreamsForSelectedGrade.forEach((s) => {
      counts[s] = 0;
    });
    let unassigned = 0;

    gradeStudents.forEach((stu) => {
      if (stu.stream && validStreamsForSelectedGrade.includes(stu.stream)) {
        counts[stu.stream] = (counts[stu.stream] || 0) + 1;
      } else {
        unassigned++;
      }
    });

    return { counts, unassigned };
  }, [gradeStudents, validStreamsForSelectedGrade]);

  // Apply stream & search filters
  const filteredStudents = useMemo(() => {
    return gradeStudents.filter((stu) => {
      if (activeStreamFilter === 'unassigned') {
        if (stu.stream && validStreamsForSelectedGrade.includes(stu.stream)) return false;
      } else if (activeStreamFilter !== 'all') {
        if (stu.stream !== activeStreamFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = stu.name.toLowerCase().includes(q);
        const admMatch = stu.admissionNumber ? stu.admissionNumber.toLowerCase().includes(q) : false;
        const upiMatch = stu.upiNumber ? stu.upiNumber.toLowerCase().includes(q) : false;
        return nameMatch || admMatch || upiMatch;
      }

      return true;
    });
  }, [gradeStudents, activeStreamFilter, searchQuery, validStreamsForSelectedGrade]);

  const showToast = (msg: string) => {
    setErrorMessage(null);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const persistAllocationsToServer = async (
    studentIds: string[],
    grade: GradeLevel,
    stream: StreamName
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/academic/students/allocate-stream', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: currentUser.schoolId,
          studentIds,
          grade,
          stream,
        }),
      });
      if (res.ok) {
        return { ok: true };
      }
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.error || `Server rejected stream allocation (${res.status})` };
    } catch {
      return { ok: false, error: 'Network error while saving student stream allocation.' };
    }
  };

  // Handle individual stream assignment
  const handleAssignStream = async (student: User, newStream: StreamName) => {
    if (!isAuthorized || !permittedGrades.includes(selectedGrade)) {
      setErrorMessage('Access Denied: You are not authorized to allocate streams for this grade.');
      return;
    }
    const targetGrade = (student.grade || selectedGrade) as GradeLevel;
    if (!permittedGrades.includes(targetGrade)) {
      setErrorMessage(`Access Denied: Your role is not authorized to allocate Grade ${targetGrade} students.`);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    const result = await persistAllocationsToServer([student.id], targetGrade, newStream);
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Unable to update student stream.');
      return;
    }

    // Mirror locally for instant UI responsiveness
    Storage.updateUser(student.id, {
      stream: newStream,
      className: `Grade ${targetGrade} ${newStream}`,
    });
    setRevision((r) => r + 1);
    showToast(`Assigned ${student.name} to Grade ${targetGrade} ${newStream}`);
  };

  // Handle bulk stream assignment
  const handleBulkAssign = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!isAuthorized || !permittedGrades.includes(selectedGrade)) {
      setErrorMessage('Access Denied: You are not authorized to allocate streams for this grade.');
      return;
    }

    const validIds = selectedStudentIds.filter((id) => gradeStudents.some((s) => s.id === id));
    if (validIds.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);
    const result = await persistAllocationsToServer(validIds, selectedGrade, bulkTargetStream);
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Unable to apply bulk stream allocation.');
      return;
    }

    validIds.forEach((id) => {
      Storage.updateUser(id, {
        stream: bulkTargetStream,
        className: `Grade ${selectedGrade} ${bulkTargetStream}`,
      });
    });

    setSelectedStudentIds([]);
    setRevision((r) => r + 1);
    showToast(`Successfully assigned ${validIds.length} learners to Grade ${selectedGrade} ${bulkTargetStream}!`);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Hard security guard — strictly System Administrator, Grade Senior Teacher, or delegated Extra Role
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Student Stream Allocation Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Access to the Student Stream Assignment Hub is strictly limited to the{' '}
            <strong>System Administrator</strong>, <strong>Grade Senior Teachers</strong> (for their assigned grades), or staff members explicitly granted the{' '}
            <strong>Student Stream Allocator</strong> extra role by the System Administrator.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>No other role may access or modify student stream allocations.</span>
        </div>
      </div>
    );
  }

  const isJunior = selectedGrade >= 7;
  const roleScopeBadge = currentUser.extraRoles?.includes('student_stream_allocator') && currentUser.role !== 'admin' && currentUser.role !== 'senior_teacher'
    ? 'Delegated Extra Role · All Grades'
    : hasFullSchoolScope
      ? 'System Administrator · All Grades'
      : `Grade Senior Teacher · ${permittedGrades.map((g) => `G${g}`).join(', ') || 'No Grade Assigned'}`;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-900">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>CBC Stream Allocator & Visibility System</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{roleScopeBadge}</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
            Student Stream Assignment Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Assign students to their specific CBC streams. Students will only see classroom resources, assignments, timetables, and announcements filtered to their assigned stream.
          </p>
        </div>

        {/* Grade Level Selector (strictly limited to permittedGrades) */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 shrink-0">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {hasFullSchoolScope ? 'Select Grade Level' : 'Assigned Senior Teacher Grade(s)'}
          </label>
          {permittedGrades.length === 0 ? (
            <div className="text-xs text-amber-300 font-semibold py-2">
              {seniorScopeLoaded
                ? 'No grade has been assigned to your Senior Teacher seat yet. Contact the System Administrator.'
                : 'Loading assigned grades...'}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                {permittedGrades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(g);
                      setSelectedStudentIds([]);
                      setActiveStreamFilter('all');
                    }}
                    className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl font-mono text-xs font-black transition-all cursor-pointer ${
                      selectedGrade === g
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                    title={`Grade ${g} (${g <= 6 ? 'Primary' : 'Junior School'})`}
                  >
                    G{g}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {isJunior ? (
                  <span className="text-amber-400 font-bold">Junior Secondary (Grades 7–9: 7 Kenyan River Streams)</span>
                ) : (
                  <span className="text-sky-400 font-bold">Primary CBC (Grades 1–6: 8 Kenyan Bird Streams)</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {permittedGrades.length > 0 && (
        <>
          {/* Stream Capacity & Distribution Cards */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Grade {selectedGrade} Stream Allocations ({validStreamsForSelectedGrade.length} Streams)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Total Enrolled: {gradeStudents.length} learners
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {validStreamsForSelectedGrade.map((streamName) => {
                const count = streamStats.counts[streamName] || 0;
                const isSelected = activeStreamFilter === streamName;

                return (
                  <button
                    key={streamName}
                    type="button"
                    onClick={() => setActiveStreamFilter(isSelected ? 'all' : streamName)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="text-[11px] font-black uppercase tracking-wider truncate mb-1">
                      {streamName}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-black font-mono ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                        {count}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        pupils
                      </span>
                    </div>
                    <div className={`mt-2 h-1 rounded-full overflow-hidden ${isSelected ? 'bg-blue-400' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full ${isSelected ? 'bg-white' : count > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        style={{ width: `${Math.min(100, (count / 40) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Unassigned Warning Card if any */}
            {streamStats.unassigned > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-amber-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {streamStats.unassigned} learner{streamStats.unassigned > 1 ? 's' : ''} in Grade {selectedGrade} do not have an assigned stream yet.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStreamFilter('unassigned')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Filter Unassigned Only
                </button>
              </div>
            )}
          </div>

          {/* Main Student Table & Bulk Actions Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Controls Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name or admission number..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveStreamFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStreamFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  All Streams ({gradeStudents.length})
                </button>
                {streamStats.unassigned > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveStreamFilter('unassigned')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeStreamFilter === 'unassigned'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    }`}
                  >
                    Unassigned ({streamStats.unassigned})
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Action Bar (Visible when students selected) */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {selectedStudentIds.length}
                  </span>
                  <span>Learners selected for bulk stream assignment</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <select
                    value={bulkTargetStream}
                    onChange={(e) => setBulkTargetStream(e.target.value as StreamName)}
                    disabled={isSaving}
                    className="px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {validStreamsForSelectedGrade.map((s) => (
                      <option key={s} value={s}>
                        Assign to {s} Stream
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleBulkAssign()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-black rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : `Apply to ${selectedStudentIds.length} Learners`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Stacked Cards */}
            <div className="md:hidden space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No students found matching your grade and stream filter.</span>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const isAssigned = student.stream && validStreamsForSelectedGrade.includes(student.stream);

                  return (
                    <div
                      key={student.id}
                      className={`p-4 rounded-2xl border transition-colors space-y-3 ${
                        isSelected ? 'bg-indigo-50/50 border-indigo-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(student.id)}
                            className="w-4 h-4 mt-0.5 accent-blue-600 rounded cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900 truncate">{student.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {student.admissionNumber || `ADM-${student.id.slice(-6)}`} · Grade {student.grade || selectedGrade}
                            </div>
                          </div>
                        </label>
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                            <span>{student.stream}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            <span>Unassigned</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase">
                          Assign / Reassign Stream
                        </label>
                        <select
                          value={student.stream || ''}
                          disabled={isSaving}
                          onChange={(e) => void handleAssignStream(student, e.target.value as StreamName)}
                          className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value="" disabled>
                            -- Select Stream --
                          </option>
                          {validStreamsForSelectedGrade.map((s) => (
                            <option key={s} value={s}>
                              {s} ({isJunior ? 'JSS Stream' : 'Primary Stream'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Learners Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/70">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="py-3 px-4">Learner Name & Admission</th>
                    <th className="py-3 px-4">Current Stream</th>
                    <th className="py-3 px-4">Assign / Reassign Stream</th>
                    <th className="py-3 px-4 text-right">Stream Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>No students found matching your grade and stream filter.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      const isAssigned = student.stream && validStreamsForSelectedGrade.includes(student.stream);

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(student.id)}
                              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {student.admissionNumber || `ADM-${student.id.slice(-6)}`} · Grade {student.grade || selectedGrade}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span>{student.stream} Stream</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Unassigned</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={student.stream || ''}
                              disabled={isSaving}
                              onChange={(e) => void handleAssignStream(student, e.target.value as StreamName)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-colors cursor-pointer"
                            >
                              <option value="" disabled>
                                -- Select Stream --
                              </option>
                              {validStreamsForSelectedGrade.map((s) => (
                                <option key={s} value={s}>
                                  {s} ({isJunior ? 'JSS Stream' : 'Primary Stream'})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isAssigned ? (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Live Sync Active</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-600">
                                Awaiting Allocation
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
