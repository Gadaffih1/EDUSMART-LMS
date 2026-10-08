import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  LunchStatus, 
  LearnerLunchRecord,
  PRIMARY_STREAMS,
  JUNIOR_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Utensils, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Printer, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Check, 
  X, 
  Coffee, 
  ChevronRight,
  Eye,
  Edit3,
  Award,
  Layers,
  Baby,
  Lock
} from 'lucide-react';

interface LearnerLunchRegisterProps {
  currentUser: User;
  initialGrade?: GradeLevel;
  initialStream?: StreamName;
  filterStudentId?: string; // For parent viewing specific child
  viewMode?: 'class_teacher' | 'executive' | 'parent';
  title?: string;
  subtitle?: string;
}

const MEAL_TYPES = [
  'Standard Balanced Hot Meal',
  'Vegetarian / Halal Meal',
  'Special Medical Diet',
  'Light Hydration / Recovery Diet'
];

export const LearnerLunchRegister: React.FC<LearnerLunchRegisterProps> = ({
  currentUser,
  initialGrade,
  initialStream,
  filterStudentId,
  viewMode,
  title,
  subtitle
}) => {
  // Determine role & mode
  const isParent = currentUser.role === 'parent' || viewMode === 'parent';
  const isClassTeacher = currentUser.role === 'class_teacher' || viewMode === 'class_teacher' || 
    (currentUser.role === 'teacher' && currentUser.stream && viewMode !== 'executive');
  const isExecutiveOrAdmin = ['head_teacher', 'deputy_head', 'dean_of_studies', 'school_admin_staff', 'admin'].includes(currentUser.role);
  
  // Date State (Defaults to current date YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Effective Grade & Stream
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(() => {
    if (initialGrade) return initialGrade;
    if (currentUser.grade) return currentUser.grade;
    return 4;
  });

  const [selectedStream, setSelectedStream] = useState<StreamName>(() => {
    if (initialStream) return initialStream;
    if (currentUser.stream) return currentUser.stream;
    return 'Dove';
  });

  // School-wide stream filter for executive / admin staff
  const [executiveStreamFilter, setExecutiveStreamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LunchStatus>('all');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [printRegisterModal, setPrintRegisterModal] = useState(false);

  // Modal for editing specific lunch details (meal type / dietary note)
  const [editingRecord, setEditingRecord] = useState<LearnerLunchRecord | null>(null);
  const [editMealType, setEditMealType] = useState('Standard Balanced Hot Meal');
  const [editDietaryNotes, setEditDietaryNotes] = useState('');

  // Storage data
  const [lunchRecords, setLunchRecords] = useState<LearnerLunchRecord[]>(() => Storage.getLunchRecords());
  const allUsers = useMemo(() => Storage.getUsers(), []);

  // Find the designated class teacher from system users for any specific grade & stream
  const getAssignedClassTeacher = (grade: GradeLevel, stream: StreamName): User | undefined => {
    return allUsers.find(u => 
      (u.role === 'class_teacher' || (u.role === 'teacher' && !!u.stream)) &&
      (
        (u.grade === grade && u.stream === stream) ||
        (u.assignedStreams && u.assignedStreams.some(as => as.grade === grade && as.stream === stream))
      )
    );
  };

  // Check if currentUser is the officially assigned respective Class Teacher for a given Grade and Stream
  const isUserRespectiveClassTeacher = (grade?: GradeLevel, stream?: StreamName): boolean => {
    if (isParent || currentUser.role === 'student' || isExecutiveOrAdmin) return false;

    const hasClassTeacherDesignation = currentUser.role === 'class_teacher' || 
      (currentUser.role === 'teacher' && (!!currentUser.stream || (currentUser.assignedStreams && currentUser.assignedStreams.length > 0)));

    if (!hasClassTeacherDesignation) return false;

    const targetGrade = grade ?? selectedGrade;
    const targetStream = stream ?? selectedStream;

    // Direct match on primary assigned grade and stream
    if (currentUser.grade === targetGrade && currentUser.stream === targetStream) {
      return true;
    }

    // Match on assignedStreams
    if (currentUser.assignedStreams && currentUser.assignedStreams.some(as => as.grade === targetGrade && as.stream === targetStream)) {
      return true;
    }

    return false;
  };

  // Respective Class Teacher for the currently selected class
  const assignedTeacherForSelectedClass = useMemo(() => {
    return getAssignedClassTeacher(selectedGrade, selectedStream);
  }, [allUsers, selectedGrade, selectedStream]);

  // Strict School Protocol: Only the respective Class Teacher can mark this class lunch register
  const canMarkLunch = isUserRespectiveClassTeacher(selectedGrade, selectedStream);

  // Listen for storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setLunchRecords(Storage.getLunchRecords());
    };
    window.addEventListener('lunch-records-updated', handleUpdate);
    return () => window.removeEventListener('lunch-records-updated', handleUpdate);
  }, []);

  // All student users
  const allStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'student');
  }, [allUsers]);

  // For Parent: parent's enrolled children
  const parentChildren = useMemo(() => {
    if (isParent) {
      return Storage.getParentChildren(currentUser);
    }
    return [];
  }, [isParent, currentUser]);

  // Target students for the selected Grade & Stream (Class Teacher Mode)
  const streamStudents = useMemo(() => {
    return allStudents.filter(s => s.grade === selectedGrade && s.stream === selectedStream);
  }, [allStudents, selectedGrade, selectedStream]);

  // Filtered Students for the table
  const activeStudents = useMemo(() => {
    if (isParent) {
      if (filterStudentId) {
        return allStudents.filter(s => s.id === filterStudentId);
      }
      const childIds = parentChildren.map(c => c.id);
      return allStudents.filter(s => childIds.includes(s.id));
    }

    if (isClassTeacher && !isExecutiveOrAdmin) {
      return streamStudents;
    }

    // Executive / Admin Mode: can filter by grade and stream
    return allStudents.filter(s => {
      const matchGrade = s.grade === selectedGrade;
      const matchStream = executiveStreamFilter === 'all' || s.stream === executiveStreamFilter;
      return matchGrade && matchStream;
    });
  }, [isParent, filterStudentId, parentChildren, isClassTeacher, isExecutiveOrAdmin, streamStudents, allStudents, selectedGrade, executiveStreamFilter]);

  // Merged view of student + their lunch record for selectedDate
  const studentLunchData = useMemo(() => {
    return activeStudents.map(student => {
      const record = lunchRecords.find(r => r.studentId === student.id && r.date === selectedDate);
      return {
        student,
        record: record || {
          id: `tmp-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          admissionNumber: student.admissionNumber || 'ADM/2026/000',
          grade: student.grade || selectedGrade,
          stream: student.stream || selectedStream,
          date: selectedDate,
          status: 'not_taken' as LunchStatus,
          mealType: 'Standard Balanced Hot Meal',
          dietaryNotes: '',
          markedBy: 'Unmarked',
          markedByRole: 'Staff',
          updatedAt: ''
        }
      };
    }).filter(item => {
      const matchesSearch = item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.student.admissionNumber && item.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.record.dietaryNotes && item.record.dietaryNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || item.record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeStudents, lunchRecords, selectedDate, selectedGrade, selectedStream, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = activeStudents.length;
    let taken = 0;
    let specialDiet = 0;
    let notTaken = 0;

    activeStudents.forEach(student => {
      const rec = lunchRecords.find(r => r.studentId === student.id && r.date === selectedDate);
      if (rec?.status === 'taken') taken++;
      else if (rec?.status === 'special_diet') specialDiet++;
      else notTaken++;
    });

    const totalFed = taken + specialDiet;
    const percentage = total > 0 ? Math.round((totalFed / total) * 100) : 0;

    return { total, taken, specialDiet, notTaken, totalFed, percentage };
  }, [activeStudents, lunchRecords, selectedDate]);

  // Quick Action: Mark Individual Learner (Strictly Respective Class Teacher Only)
  const handleMarkLunch = (student: User, newStatus: LunchStatus, customMealType?: string, notes?: string) => {
    const isAuthorized = isUserRespectiveClassTeacher(student.grade, student.stream);
    if (!isAuthorized) {
      const assignedTeacher = getAssignedClassTeacher(student.grade || selectedGrade, student.stream || selectedStream);
      setNotificationMsg(`Access Restricted: Per institutional protocol, only the respective Class Teacher (${assignedTeacher ? assignedTeacher.name : `Grade ${student.grade || selectedGrade} ${student.stream || selectedStream} Class Teacher`}) is authorized to mark this lunch register.`);
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }

    const teacherName = currentUser.name;
    const teacherRole = 'Class Teacher';

    Storage.markLearnerLunch(student.id, newStatus, {
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      grade: student.grade || selectedGrade,
      stream: student.stream || selectedStream,
      date: selectedDate,
      mealType: customMealType || (newStatus === 'special_diet' ? 'Special Medical Diet' : 'Standard Balanced Hot Meal'),
      dietaryNotes: notes,
      markedBy: teacherName,
      markedByRole: teacherRole
    });

    const updated = Storage.getLunchRecords();
    setLunchRecords(updated);

    setNotificationMsg(`${student.name} marked as "${newStatus === 'taken' ? 'Lunch Taken' : newStatus === 'special_diet' ? 'Special Diet' : 'Not Taken'}".`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Bulk Action: Mark All in Stream as Taken (Respective Class Teacher Only)
  const handleMarkAllTaken = () => {
    if (!canMarkLunch) {
      setNotificationMsg(`Access Restricted: Only the respective Class Teacher (${assignedTeacherForSelectedClass ? assignedTeacherForSelectedClass.name : `Grade ${selectedGrade} ${selectedStream} Class Teacher`}) is authorized to mark this class lunch register.`);
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }

    const teacherName = currentUser.name;
    const teacherRole = 'Class Teacher';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Target only students strictly belonging to this teacher's assigned class
    const targetLearners = activeStudents.filter(s => 
      s.grade === selectedGrade && s.stream === selectedStream
    );

    const newRecords: LearnerLunchRecord[] = targetLearners.map(student => {
      const existing = lunchRecords.find(r => r.studentId === student.id && r.date === selectedDate);
      return {
        id: existing?.id || `lnch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentId: student.id,
        studentName: student.name,
        admissionNumber: student.admissionNumber || 'ADM/2026/000',
        grade: student.grade || selectedGrade,
        stream: student.stream || selectedStream,
        date: selectedDate,
        status: 'taken',
        takenAt: existing?.takenAt || timeStr,
        mealType: existing?.mealType || 'Standard Balanced Hot Meal',
        dietaryNotes: existing?.dietaryNotes || 'Batch confirmed by respective class teacher',
        markedBy: teacherName,
        markedByRole: teacherRole,
        updatedAt: new Date().toISOString()
      };
    });

    Storage.batchSaveLunchRecords(newRecords);
    setLunchRecords(Storage.getLunchRecords());

    setNotificationMsg(`Confirmed: All ${targetLearners.length} learners in Grade ${selectedGrade} (${selectedStream}) marked as Lunch Taken by ${teacherName}!`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Open Edit Details Modal
  const handleOpenEditModal = (record: LearnerLunchRecord) => {
    const student = allStudents.find(s => s.id === record.studentId);
    const isAuthorized = student ? isUserRespectiveClassTeacher(student.grade, student.stream) : canMarkLunch;
    if (!isAuthorized) {
      setNotificationMsg('Access Restricted: Only the respective Class Teacher can modify lunch records and dietary notes.');
      setTimeout(() => setNotificationMsg(null), 3500);
      return;
    }
    setEditingRecord(record);
    setEditMealType(record.mealType || 'Standard Balanced Hot Meal');
    setEditDietaryNotes(record.dietaryNotes || '');
  };

  // Save Modal Edit
  const handleSaveModalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const student = allStudents.find(s => s.id === editingRecord.studentId);
    const isAuthorized = student ? isUserRespectiveClassTeacher(student.grade, student.stream) : canMarkLunch;
    if (!isAuthorized) {
      setNotificationMsg('Access Denied: Only the respective Class Teacher is authorized to update lunch records.');
      setTimeout(() => setNotificationMsg(null), 3500);
      return;
    }

    Storage.saveLunchRecord({
      ...editingRecord,
      mealType: editMealType,
      dietaryNotes: editDietaryNotes,
      markedBy: currentUser.name,
      markedByRole: 'Class Teacher',
      updatedAt: new Date().toISOString()
    });

    setLunchRecords(Storage.getLunchRecords());
    setEditingRecord(null);
    setNotificationMsg('Dietary notes and meal type updated successfully.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Status Badge Styling
  const getStatusBadge = (status: LunchStatus, takenAt?: string) => {
    switch (status) {
      case 'taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lunch Taken {takenAt ? `· ${takenAt}` : ''}</span>
          </span>
        );
      case 'special_diet':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Special Diet {takenAt ? `· ${takenAt}` : ''}</span>
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <X className="w-3.5 h-3.5 text-slate-500" />
            <span>Absent Today</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending / Not Taken</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3.5 bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          1. HEADER & ROLE-BASED ACCESS BANNER
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Learner Dining & Nutritional Welfare Registry</span>
            <span className="text-slate-300">·</span>
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono text-[10px]">
              Midday Lunch Hour (12:20 – 13:20)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🍱</span>
            <span>
              {title || (
                isParent 
                  ? "Child's Daily Lunch & Nutrition Status"
                  : isClassTeacher && !isExecutiveOrAdmin
                    ? `Grade ${selectedGrade} (${selectedStream}) Class Teacher Lunch Register`
                    : "School-Wide Learner Lunch & Dining Surveillance"
              )}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {subtitle || (
              isParent
                ? "Confidential daily lunch attendance log: Real-time confirmation of hot balanced meals, specialized medical diets, and teacher supervision stamps."
                : isClassTeacher && !isExecutiveOrAdmin
                  ? `Daily classroom dining register: Mark learners in Grade ${selectedGrade} (${selectedStream}) who have taken lunch. Records are instantly accessible to child parents, school administration staff, and executive leadership.`
                  : "Institutional catering & nutritional oversight: Daily headcount, percentage uptake, special dietary tracking, and stream-by-stream verification."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print/Export Button */}
          <button
            onClick={() => setPrintRegisterModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Catering Register</span>
          </button>

          {/* Mark All Taken (Respective Class Teacher Action Only) */}
          {canMarkLunch ? (
            <button
              onClick={handleMarkAllTaken}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Mark All Stream As Taken</span>
            </button>
          ) : !isParent ? (
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Read-Only: Marked exclusively by Respective Class Teacher
                {assignedTeacherForSelectedClass ? ` (${assignedTeacherForSelectedClass.name})` : ''}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Role-Specific Privacy / Scope Badge */}
      <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs ${
        canMarkLunch 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          {canMarkLunch ? (
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          )}
          <span className="font-semibold">
            {isParent && `Parent View: Strictly monitoring registered child (${parentChildren.map(c => `${c.name} - Grade ${c.grade} ${c.stream}`).join(', ')})`}
            {canMarkLunch && `Respective Class Teacher Authorization Active: You are the verified Class Teacher for Grade ${selectedGrade} (${selectedStream}). You are authorized to mark today's lunch register.`}
            {!canMarkLunch && !isParent && currentUser.role === 'class_teacher' && (
              `Read-Only Mode: You are the assigned Class Teacher for Grade ${currentUser.grade} (${currentUser.stream}). Only the respective Class Teacher for Grade ${selectedGrade} (${selectedStream})${assignedTeacherForSelectedClass ? ` (${assignedTeacherForSelectedClass.name})` : ''} can mark this register.`
            )}
            {!canMarkLunch && !isParent && isExecutiveOrAdmin && (
              `Executive Dining Surveillance & Audit: Per strict institutional protocol, daily learner lunch registers are marked exclusively by the respective Class Teacher${assignedTeacherForSelectedClass ? ` (${assignedTeacherForSelectedClass.name})` : ''}. This view provides institutional dining audit & oversight.`
            )}
            {!canMarkLunch && !isParent && !isExecutiveOrAdmin && currentUser.role === 'teacher' && (
              `Subject Teacher Read-Only Mode: Per institutional protocol, only the respective Class Teacher${assignedTeacherForSelectedClass ? ` (${assignedTeacherForSelectedClass.name})` : ''} can mark learner lunch registers.`
            )}
          </span>
        </div>
        <div className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border self-start sm:self-auto ${
          canMarkLunch 
            ? 'bg-emerald-600 text-white border-emerald-700' 
            : 'bg-white border-slate-200 text-slate-600'
        }`}>
          {isParent 
            ? 'CHILD CONFIDENTIAL' 
            : canMarkLunch 
              ? 'RESPECTIVE CLASS TEACHER AUTHORIZED' 
              : 'READ-ONLY AUDIT'}
        </div>
      </div>

      {/* ========================================================
          2. NUTRITIONAL KPI METRICS CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>Enrolled Learners</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Eligible for lunch today</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between">
            <span>Lunch Taken</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{stats.taken}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Hot meal consumed</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
            <span>Special Diet</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{stats.specialDiet}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Medical / Halal / Light</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
            <span>Pending / Unmarked</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{stats.notTaken}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Yet to feed or log</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-purple-700 flex items-center justify-between">
            <span>Dining Uptake</span>
            <Heart className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1 font-mono">{stats.percentage}%</div>
          <div className="text-[10px] text-purple-600 mt-0.5">{stats.totalFed} of {stats.total} learners</div>
        </div>
      </div>

      {/* ========================================================
          3. CONTROLS TOOLBAR: DATE, GRADE, STREAM, SEARCH, FILTER
          ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Date:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Grade Selector (For Executive / Admin Staff) */}
          {isExecutiveOrAdmin && !isParent && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-semibold text-slate-600">Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          )}

          {/* Stream Selector (For Executive / Admin Staff) */}
          {isExecutiveOrAdmin && !isParent && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-semibold text-slate-600">Stream:</span>
              <select
                value={executiveStreamFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setExecutiveStreamFilter(val);
                  if (val !== 'all') {
                    setSelectedStream(val as StreamName);
                  }
                }}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Streams</option>
                {(selectedGrade <= 6 ? PRIMARY_STREAMS : JUNIOR_STREAMS).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assigned Class Teacher Indicator */}
          {assignedTeacherForSelectedClass && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Assigned Class Teacher:</span>
              <strong className="font-bold text-amber-950">{assignedTeacherForSelectedClass.name}</strong>
              {assignedTeacherForSelectedClass.tscNumber && (
                <span className="text-[10px] font-mono text-amber-800">({assignedTeacherForSelectedClass.tscNumber})</span>
              )}
            </div>
          )}

          {/* Multiple Assigned Streams for Class Teacher */}
          {currentUser.assignedStreams && currentUser.assignedStreams.length > 1 && !isExecutiveOrAdmin && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-xs">
              <span className="font-semibold text-emerald-800">My Streams:</span>
              {currentUser.assignedStreams.map(as => (
                <button
                  key={`${as.grade}-${as.stream}`}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(as.grade);
                    setSelectedStream(as.stream);
                  }}
                  className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                    selectedGrade === as.grade && selectedStream === as.stream
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  Gr {as.grade} ({as.stream})
                </button>
              ))}
            </div>
          )}

          {/* Class Teacher Locked Stream Tag */}
          {isClassTeacher && !isExecutiveOrAdmin && (!currentUser.assignedStreams || currentUser.assignedStreams.length <= 1) && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>Grade {selectedGrade} ({selectedStream})</span>
              <span className="text-[10px] font-normal text-emerald-700 font-mono">Assigned Stream</span>
            </div>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Meal Statuses</option>
            <option value="taken">Lunch Taken</option>
            <option value="special_diet">Special Medical Diet</option>
            <option value="not_taken">Pending / Not Taken</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learner name or ADM..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* ========================================================
          4. LEARNERS LUNCH REGISTER TABLE / GRID
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              Daily Dining Roster ({studentLunchData.length} Learners Listed)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              · Date: {selectedDate}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Tap buttons below to mark status or update dietary notes
          </span>
        </div>

        {studentLunchData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-sm">No learner records found for this criteria.</div>
            <p className="text-xs text-slate-400 mt-1">Try selecting another grade, stream, or resetting your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Learner Profile</th>
                  <th className="py-3 px-4">Class & Stream</th>
                  <th className="py-3 px-4">Lunch Status</th>
                  <th className="py-3 px-4">Meal Description & Notes</th>
                  <th className="py-3 px-4">Supervisor Stamp</th>
                  {!isParent && <th className="py-3 px-4 text-right">Class Teacher Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentLunchData.map(({ student, record }, index) => {
                  const isTaken = record.status === 'taken';
                  const isSpecial = record.status === 'special_diet';
                  const isNotTaken = record.status === 'not_taken';
                  const isStudentAuthorized = isUserRespectiveClassTeacher(student.grade, student.stream);
                  const assignedTeacherForStudent = getAssignedClassTeacher(student.grade || selectedGrade, student.stream || selectedStream);

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTaken ? 'bg-emerald-50/20' : isSpecial ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                      
                      {/* Learner Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {student.avatarUrl ? (
                            <img 
                              src={student.avatarUrl} 
                              alt={student.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {student.admissionNumber || 'ADM/2026/000'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Grade & Stream */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">Grade {student.grade || selectedGrade}</div>
                        <div className="text-[10px] text-slate-500">{student.stream || selectedStream} Stream</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(record.status, record.takenAt)}
                      </td>

                      {/* Meal Type & Dietary Notes */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{record.mealType || 'Standard Balanced Hot Meal'}</div>
                        {record.dietaryNotes ? (
                          <div className="text-[11px] text-amber-800 mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {record.dietaryNotes}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No dietary restrictions</span>
                        )}
                      </td>

                      {/* Supervisor Stamp */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-semibold">{record.markedBy || 'Unmarked'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {record.updatedAt ? new Date(record.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </div>
                      </td>

                      {/* Actions (Only for Respective Class Teacher) */}
                      {!isParent && (
                        <td className="py-3 px-4 text-right">
                          {isStudentAuthorized ? (
                            <div className="inline-flex items-center gap-1.5">
                              {/* Toggle Taken */}
                              <button
                                onClick={() => handleMarkLunch(student, isTaken ? 'not_taken' : 'taken')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isTaken
                                    ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                }`}
                                title={isTaken ? 'Mark as Not Taken' : 'Mark as Lunch Taken'}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isTaken ? 'Taken ✓' : 'Mark Taken'}</span>
                              </button>

                              {/* Special Diet Option */}
                              <button
                                onClick={() => handleMarkLunch(student, 'special_diet', 'Special Medical Diet')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isSpecial
                                    ? 'bg-blue-700 text-white shadow-xs hover:bg-blue-800'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                }`}
                                title="Mark Special Medical or Dietary Meal"
                              >
                                <span>🥗 Special</span>
                              </button>

                              {/* Edit Notes */}
                              <button
                                onClick={() => handleOpenEditModal(record)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Add dietary notes or customize meal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs"
                              title={`Strict Protocol: Only the assigned Class Teacher (${assignedTeacherForStudent ? assignedTeacherForStudent.name : 'Class Teacher'}) can mark this learner's lunch status`}
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{assignedTeacherForStudent ? `${assignedTeacherForStudent.name.split(' ').slice(0, 2).join(' ')} Only` : 'Class Teacher Only'}</span>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          5. EDIT DIETARY NOTES MODAL
          ======================================================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Learner Meal & Dietary Customization</h3>
                  <p className="text-xs text-amber-100">{editingRecord.studentName} · {editingRecord.admissionNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                className="text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meal Classification</label>
                <select
                  value={editMealType}
                  onChange={(e) => setEditMealType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {MEAL_TYPES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specific Dietary / Allergy Notes & Instructions
                </label>
                <textarea
                  rows={3}
                  value={editDietaryNotes}
                  onChange={(e) => setEditDietaryNotes(e.target.value)}
                  placeholder="e.g. Mild seasoning, extra hydration, gluten-free portion requested, observed by nurse..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-md shadow-amber-600/20"
                >
                  Save Meal Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. PRINT CATERING REGISTER MODAL
          ======================================================== */}
      {printRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Daily Catering & Dining Register</h3>
                  <p className="text-xs text-slate-500">Ministry of Education CBC Nutrition & Meal Compliance Report</p>
                </div>
              </div>
              <button 
                onClick={() => setPrintRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="font-black text-base text-slate-900">EDUSMART INTEGRATED ACADEMY</div>
                <div className="text-slate-600">Daily Learner Midday Nutrition & Dining Register</div>
                <div className="text-slate-400 font-mono text-[11px] mt-1">Date: {selectedDate} · Grade {selectedGrade} ({selectedStream})</div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Enrolled</div>
                  <div className="text-lg font-bold font-mono text-slate-900">{stats.total}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Lunch Taken</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">{stats.taken}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Special Diet</div>
                  <div className="text-lg font-bold font-mono text-blue-700">{stats.specialDiet}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Uptake Rate</div>
                  <div className="text-lg font-bold font-mono text-purple-700">{stats.percentage}%</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-200">
                      <th className="p-2">#</th>
                      <th className="p-2">Learner Name</th>
                      <th className="p-2">Admission No</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Time</th>
                      <th className="p-2">Class Teacher Stamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentLunchData.map(({ student, record }, i) => (
                      <tr key={student.id}>
                        <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{student.name}</td>
                        <td className="p-2 font-mono text-slate-600">{student.admissionNumber}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            record.status === 'taken' ? 'bg-emerald-100 text-emerald-800' :
                            record.status === 'special_diet' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {record.status === 'taken' ? 'Taken' : record.status === 'special_diet' ? 'Special Diet' : 'Not Taken'}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-slate-500">{record.takenAt || '—'}</td>
                        <td className="p-2 text-slate-700">{record.markedBy || 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Official Institutional Catering Record</span>
              <button
                onClick={() => {
                  window.print();
                  setPrintRegisterModal(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
