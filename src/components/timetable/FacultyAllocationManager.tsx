import React, { useState, useMemo } from 'react';
import { User, GradeLevel, StreamName, SubjectName, PRIMARY_SUBJECTS, JUNIOR_SUBJECTS, PRIMARY_STREAMS, JUNIOR_STREAMS } from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  BookOpen, 
  GraduationCap, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Save,
  RotateCcw,
  ShieldCheck,
  Building2,
  CalendarDays
} from 'lucide-react';

interface FacultyAllocationManagerProps {
  currentUser: User;
  onAllocationsUpdated?: () => void;
  onTriggerAutoGeneration?: () => void;
}

export const FacultyAllocationManager: React.FC<FacultyAllocationManagerProps> = ({
  currentUser,
  onAllocationsUpdated,
  onTriggerAutoGeneration
}) => {
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Form states for editing allocation
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectName[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<Array<{ grade: GradeLevel; stream: StreamName }>>([]);
  const [targetWeeklyLoad, setTargetWeeklyLoad] = useState<number>(24);
  const [departmentInput, setDepartmentInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // All faculty members
  const facultyList = useMemo(() => {
    return users.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));
  }, [users]);

  // Filtered faculty
  const filteredFaculty = useMemo(() => {
    return facultyList.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignedSubjects && t.assignedSubjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (t.tscNumber && t.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDept = filterDepartment === 'all' || 
        (t.department && t.department.toLowerCase().includes(filterDepartment.toLowerCase()));

      return matchesSearch && matchesDept;
    });
  }, [facultyList, searchQuery, filterDepartment]);

  // Combined list of all unique subjects across primary and junior
  const allCurriculumSubjects = useMemo(() => {
    const set = new Set<SubjectName>([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS]);
    return Array.from(set).sort();
  }, []);

  // Open Edit Modal for a teacher
  const handleOpenEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setSelectedSubjects(teacher.assignedSubjects ? [...teacher.assignedSubjects] : []);
    
    const streams = teacher.assignedStreams ? [...teacher.assignedStreams] : [];
    if (teacher.grade && teacher.stream && !streams.some(s => s.grade === teacher.grade && s.stream === teacher.stream)) {
      streams.push({ grade: teacher.grade, stream: teacher.stream });
    }
    setSelectedStreams(streams);
    setDepartmentInput(teacher.department || 'Academic Department');
    setTargetWeeklyLoad(24);
  };

  // Toggle subject selection
  const handleToggleSubject = (subject: SubjectName) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Add Stream allocation
  const handleAddStream = (grade: GradeLevel, stream: StreamName) => {
    if (selectedStreams.some(s => s.grade === grade && s.stream === stream)) {
      return;
    }
    setSelectedStreams([...selectedStreams, { grade, stream }]);
  };

  // Remove Stream allocation
  const handleRemoveStream = (grade: GradeLevel, stream: StreamName) => {
    setSelectedStreams(selectedStreams.filter(s => !(s.grade === grade && s.stream === stream)));
  };

  // Save teacher allocation
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const updates: Partial<User> = {
      assignedSubjects: selectedSubjects,
      assignedStreams: selectedStreams,
      department: departmentInput.trim() || undefined
    };

    Storage.updateUser(editingTeacher.id, updates);
    const updatedUsers = Storage.getUsers();
    setUsers(updatedUsers);
    setEditingTeacher(null);

    setSaveSuccessMsg(`Subject and stream allocations saved successfully for ${editingTeacher.name}!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);

    if (onAllocationsUpdated) {
      onAllocationsUpdated();
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
            <span>Faculty Workload Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Faculty Subject & Stream Allocations
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Allocate instructional subjects and grade streams to teaching staff. Once allocated, the timetable auto-generation engine uses these assignments to automatically construct a conflict-free master timetable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {onTriggerAutoGeneration && (
            <button
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
            placeholder="Search teacher name, TSC number, subject..."
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
            <option value="science">Sciences & Mathematics</option>
            <option value="language">Languages & Linguistics</option>
            <option value="humanities">Humanities & Social Sciences</option>
            <option value="technical">Technical & Applied Studies</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map(teacher => {
          const subjects = teacher.assignedSubjects || [];
          const streams = teacher.assignedStreams || [];
          const isClassTeacher = teacher.role === 'class_teacher';

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
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {teacher.tscNumber || 'TSC/PENDING'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          isClassTeacher ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isClassTeacher ? 'Class Teacher' : 'Subject Faculty'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="Edit Teacher Allocation"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Assigned Subjects */}
                <div className="my-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Subjects ({subjects.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {subjects.length === 0 ? (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        No subjects allocated yet
                      </span>
                    ) : (
                      subjects.map(sub => (
                        <span 
                          key={sub}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold"
                        >
                          {sub}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Assigned Streams */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Allocated Streams ({streams.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {streams.length === 0 ? (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        No streams allocated yet
                      </span>
                    ) : (
                      streams.map(as => (
                        <span 
                          key={`${as.grade}-${as.stream}`}
                          className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-mono font-bold"
                        >
                          Gr {as.grade} ({as.stream})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {teacher.department || 'General Faculty'}
                </span>
                <button
                  onClick={() => handleOpenEdit(teacher)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================
          EDIT ALLOCATION MODAL
          ======================================================== */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Academic Dean Allocation Editor
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Allocate Subjects & Streams: {editingTeacher.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAllocation} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Department & TSC Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    placeholder="e.g. Sciences & Mathematics"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Contact Load (Periods/Wk)</label>
                  <input
                    type="number"
                    value={targetWeeklyLoad}
                    onChange={(e) => setTargetWeeklyLoad(Number(e.target.value))}
                    min={10}
                    max={35}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* 1. SELECT CURRICULUM SUBJECTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                    1. Assign Curriculum Subjects ({selectedSubjects.length} selected):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click subjects this teacher is qualified to deliver
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {allCurriculumSubjects.map(sub => {
                    const isChecked = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubject(sub)}
                        className={`p-2 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. ALLOCATE GRADE STREAMS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                    2. Allocate Grade Streams ({selectedStreams.length} allocated):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Add streams where this teacher delivers instruction
                  </span>
                </div>

                {/* Currently Allocated Stream Badges */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 min-h-[50px] items-center">
                  {selectedStreams.length === 0 ? (
                    <span className="text-slate-400 text-xs italic">
                      No streams currently assigned. Use the selectors below to assign streams.
                    </span>
                  ) : (
                    selectedStreams.map(as => (
                      <span
                        key={`${as.grade}-${as.stream}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <span>Grade {as.grade} ({as.stream})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStream(as.grade, as.stream)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Remove stream"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Quick Add Stream Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Quick Add Stream to Roster:
                  </span>
                  
                  {/* Primary Streams (Grades 1 to 6) */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Primary School (Grades 1-6):</span>
                    <div className="flex flex-wrap gap-1">
                      {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map(g => (
                        <div key={g} className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-white">
                          <span className="text-[10px] font-bold text-slate-500 px-1">G{g}</span>
                          {PRIMARY_STREAMS.slice(0, 3).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleAddStream(g, st)}
                              className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                                selectedStreams.some(s => s.grade === g && s.stream === st)
                                  ? 'bg-emerald-700 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Junior School Streams (Grades 7 to 9) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Junior School (Grades 7-9):</span>
                    <div className="flex flex-wrap gap-1">
                      {([7, 8, 9] as GradeLevel[]).map(g => (
                        <div key={g} className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-white">
                          <span className="text-[10px] font-bold text-slate-500 px-1">G{g}</span>
                          {(['Mara', 'Serengeti', 'Amboseli', 'Kerio', 'Athi', 'Tana'] as StreamName[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleAddStream(g, st)}
                              className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                                selectedStreams.some(s => s.grade === g && s.stream === st)
                                  ? 'bg-emerald-700 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Faculty Allocation</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
