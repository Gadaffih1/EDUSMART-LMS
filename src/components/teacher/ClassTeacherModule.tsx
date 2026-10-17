import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  AttendanceRecord, 
  ReportCard,
  getSubjectsForGrade,
  getStreamsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { useTenant } from '../../context/TenantContext';
import { TenantPrintHeader, TenantPrintFooter } from '../common/TenantPrintHeader';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { 
  ClipboardCheck, 
  BarChart3, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check,
  X,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HeartPulse,
  Utensils
} from 'lucide-react';

interface ClassTeacherModuleProps {
  currentUser: User;
}

export const ClassTeacherModule: React.FC<ClassTeacherModuleProps> = ({ currentUser }) => {
  const { currentTenant } = useTenant();
  // Strict School Protocol: Only designated Class Teachers can mark daily attendance
  const canMarkAttendance = currentUser.role === 'class_teacher' || (currentUser.role === 'teacher' && !!currentUser.stream);

  // Assigned Grade and Stream from currentUser
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentUser.grade || 4);
  const [selectedStream, setSelectedStream] = useState<StreamName>(currentUser.stream || 'Dove');

  // Sub-tabs: Attendance Register, Multi-Day Matrix, Graphical Analysis, Print Report Cards, Sanatorium Records, Lunch Register
  const [activeSubTab, setActiveSubTab] = useState<'daily_register' | 'history_matrix' | 'graphics' | 'reports' | 'sanatorium' | 'lunch_register'>('daily_register');

  // Attendance Date (default to today: 2026-10-01)
  const todayDateString = '2026-10-01';
  const [selectedDate, setSelectedDate] = useState<string>(todayDateString);

  // Available streams for this class teacher
  const availableStreams = currentUser.assignedStreams && currentUser.assignedStreams.length > 0
    ? currentUser.assignedStreams.map(as => as.stream)
    : [currentUser.stream || 'Dove'];

  // Learners strictly assigned to this stream and grade
  const streamStudents = Storage.getUsers().filter(
    u => u.role === 'student' && u.grade === selectedGrade && u.stream === selectedStream
  );

  // Status and remarks state for each student in the stream for the selected date
  const [studentStatuses, setStudentStatuses] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  const [isExistingRecordSaved, setIsExistingRecordSaved] = useState<boolean>(false);
  const [attendanceSavedMessage, setAttendanceSavedMessage] = useState<string | null>(null);

  // Load attendance data whenever selectedDate, selectedGrade, or selectedStream changes
  useEffect(() => {
    const existing = Storage.getAttendanceRecordForDate(selectedGrade, selectedStream, selectedDate);
    const initialStatuses: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    const initialRemarks: Record<string, string> = {};

    if (existing) {
      existing.records.forEach(r => {
        initialStatuses[r.studentId] = r.status;
        if (r.remarks) {
          initialRemarks[r.studentId] = r.remarks;
        }
      });
      setIsExistingRecordSaved(true);
    } else {
      // Default all enrolled students to 'present' with empty remarks
      streamStudents.forEach(stu => {
        initialStatuses[stu.id] = 'present';
      });
      setIsExistingRecordSaved(false);
    }

    setStudentStatuses(initialStatuses);
    setStudentRemarks(initialRemarks);
  }, [selectedDate, selectedGrade, selectedStream]);

  // Quick Date Navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const setDateToToday = () => {
    setSelectedDate(todayDateString);
  };

  // Status Toggles
  const handleSetStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!canMarkAttendance) {
      setAttendanceSavedMessage('Protocol Error: Only the assigned Class Teacher is authorized to mark daily attendance.');
      setTimeout(() => setAttendanceSavedMessage(null), 3500);
      return;
    }
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSetRemark = (studentId: string, remark: string) => {
    if (!canMarkAttendance) return;
    setStudentRemarks(prev => ({
      ...prev,
      [studentId]: remark
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    if (!canMarkAttendance) {
      setAttendanceSavedMessage('Protocol Error: Only the assigned Class Teacher can mark attendance.');
      setTimeout(() => setAttendanceSavedMessage(null), 3500);
      return;
    }
    const updated: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    streamStudents.forEach(stu => {
      updated[stu.id] = status;
    });
    setStudentStatuses(updated);
  };

  // Save the register for the selected date
  const handleSaveAttendance = () => {
    if (!canMarkAttendance) {
      setAttendanceSavedMessage('Access Denied: Only the designated Class Teacher is authorized to save daily attendance registers.');
      setTimeout(() => setAttendanceSavedMessage(null), 3500);
      return;
    }

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    const records = streamStudents.map(stu => {
      const status = studentStatuses[stu.id] || 'present';
      const remark = studentRemarks[stu.id]?.trim();

      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;

      return {
        studentId: stu.id,
        studentName: stu.name,
        status,
        remarks: remark || undefined
      };
    });

    const total = records.length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    const record: AttendanceRecord = {
      id: `att-${selectedGrade}-${selectedStream}-${selectedDate}`,
      date: selectedDate,
      grade: selectedGrade,
      stream: selectedStream,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      records,
      summary: {
        present,
        absent,
        late,
        excused,
        total,
        attendanceRate
      }
    };

    Storage.saveAttendanceRecord(record);
    setIsExistingRecordSaved(true);
    setAttendanceSavedMessage(`Register for ${selectedDate} saved! Attendance rate: ${attendanceRate}% (${present} present, ${absent} absent).`);
    setTimeout(() => setAttendanceSavedMessage(null), 3500);
  };

  // Metrics for current selected date
  const totalEnrolled = streamStudents.length;
  let currentPresent = 0;
  let currentAbsent = 0;
  let currentLate = 0;
  let currentExcused = 0;

  streamStudents.forEach(stu => {
    const st = studentStatuses[stu.id] || 'present';
    if (st === 'present') currentPresent++;
    else if (st === 'absent') currentAbsent++;
    else if (st === 'late') currentLate++;
    else if (st === 'excused') currentExcused++;
  });

  const currentRate = totalEnrolled > 0 
    ? Math.round(((currentPresent + currentLate) / totalEnrolled) * 100) 
    : 100;

  // Past dates recorded for this stream
  const allStreamRecords = Storage.getAttendanceRecords(selectedGrade, selectedStream)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Report Card selection for printing
  const streamReports = Storage.getReportCards(undefined, selectedGrade, selectedStream);
  const [selectedReportToPrint, setSelectedReportToPrint] = useState<ReportCard | null>(
    streamReports[0] || null
  );

  // Graphical Analysis Calculation
  const subjects = getSubjectsForGrade(selectedGrade);
  const subjectAverages = subjects.map((subj, idx) => {
    const base = 78 + ((idx * 3) % 15);
    return {
      subject: subj,
      meanScore: Math.min(94, base),
      passRate: 92 + (idx % 8)
    };
  });

  return (
    <div id="class-register-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Header with Stream & Role Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Class Teacher Console
            </span>
            <span aria-hidden="true">·</span>
            <span>Grade {selectedGrade} ({selectedStream} Stream)</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{totalEnrolled} Pupils Assigned</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Class Attendance Register & Performance Suite
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Mark learners present or absent for specific dates, view multi-day register logs, analyze stream performance graphics, and print termly report cards.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start lg:self-auto">
          <button
            onClick={() => setActiveSubTab('daily_register')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'daily_register'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Mark Daily Register</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('history_matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'history_matrix'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Multi-Day Matrix ({allStreamRecords.length} Days)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('graphics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'graphics'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stream Graphics</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'reports'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report Cards</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sanatorium')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'sanatorium'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
            <span>Sanatorium Records</span>
          </button>

          <button
            onClick={() => setActiveSubTab('lunch_register')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'lunch_register'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-amber-300" />
            <span>Learner Lunch Register</span>
          </button>
        </div>
      </div>

      {/* Stream Selection Bar (if teacher has multiple assigned streams) */}
      {availableStreams.length > 1 && (
        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-700">Switch Assigned Stream:</span>
          {availableStreams.map(s => (
            <button
              key={s}
              onClick={() => setSelectedStream(s)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                selectedStream === s
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Grade {selectedGrade} · {s} Stream
            </button>
          ))}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 1: MARK DAILY CLASS REGISTER FOR SPECIFIC DATES
          ======================================================== */}
      {activeSubTab === 'daily_register' && (
        <div className="space-y-6">

          {/* Date Picker & Navigation Control Bar */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: Date selector controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-700" />
                  <span>Register Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center gap-1 pt-4 sm:pt-4">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-xs transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={setDateToToday}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    selectedDate === todayDateString
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-xs transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Saved Status Indicator */}
              <div className="pt-4 sm:pt-4">
                {isExistingRecordSaved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saved Record</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unsaved Draft</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quick Bulk Actions & Save */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-300 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Mark All Absent</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Save Register for {selectedDate}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {attendanceSavedMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{attendanceSavedMessage}</span>
            </div>
          )}

          {/* Live Summary Tally for Selected Date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Stream Roll Call</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">{totalEnrolled}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Grade {selectedGrade} ({selectedStream})</div>
            </div>

            <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Present Today</div>
              <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                {currentPresent} <span className="text-xs font-normal text-emerald-600">({totalEnrolled > 0 ? Math.round((currentPresent / totalEnrolled) * 100) : 0}%)</span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">Learners in class</div>
            </div>

            <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200">
              <div className="text-[10px] uppercase font-bold text-rose-700">Absent Today</div>
              <div className="text-2xl font-black font-mono text-rose-800 mt-1">
                {currentAbsent} <span className="text-xs font-normal text-rose-600">({totalEnrolled > 0 ? Math.round((currentAbsent / totalEnrolled) * 100) : 0}%)</span>
              </div>
              <div className="text-[11px] text-rose-800 mt-0.5">Unexcused / Illness</div>
            </div>

            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
              <div className="text-[10px] uppercase font-bold text-blue-700">Daily Attendance Rate</div>
              <div className="text-2xl font-black font-mono text-blue-900 mt-1">{currentRate}%</div>
              <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentRate >= 80 ? 'bg-emerald-600' : currentRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${currentRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Student Register Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Admission No.</th>
                  <th className="py-3 px-4">Stream</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Teacher Absence / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {streamStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No learners currently assigned to Grade {selectedGrade} ({selectedStream} Stream).
                      <div className="text-xs text-slate-400 mt-1">
                        Use the Admin portal to assign students to this grade and stream.
                      </div>
                    </td>
                  </tr>
                ) : (
                  streamStudents.map((stu, idx) => {
                    const status = studentStatuses[stu.id] || 'present';
                    const remark = studentRemarks[stu.id] || '';

                    return (
                      <tr 
                        key={stu.id} 
                        className={`transition-colors ${
                          status === 'absent' 
                            ? 'bg-rose-50/40 hover:bg-rose-50/60' 
                            : status === 'late'
                            ? 'bg-amber-50/40 hover:bg-amber-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{stu.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {stu.id}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                          {stu.admissionNumber || `ADM/2026/0${idx + 1}`}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {selectedStream}
                          </span>
                        </td>

                        {/* Interactive Present / Absent Status Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs">
                            {/* PRESENT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'present')}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-1 ring-emerald-700'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>

                            {/* ABSENT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'absent')}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                                status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-1 ring-rose-700'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </button>

                            {/* LATE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'late')}
                              className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                status === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title="Mark Late Arrival"
                            >
                              Late
                            </button>

                            {/* EXCUSED BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'excused')}
                              className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                status === 'excused'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title="Mark Excused Permission"
                            >
                              Excused
                            </button>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={remark}
                            onChange={(e) => handleSetRemark(stu.id, e.target.value)}
                            placeholder={status === 'absent' ? 'Reason (e.g. Sick, clinic, excused)...' : 'Remarks (optional)...'}
                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                              status === 'absent'
                                ? 'border-rose-300 bg-rose-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-rose-950 font-medium'
                                : 'border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">
              Roll call updates are tied to <strong>Grade {selectedGrade} ({selectedStream} Stream)</strong>. Saved records sync with individual student report cards.
            </div>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Confirm & Save Register ({selectedDate})</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: MULTI-DAY ATTENDANCE MATRIX & LOGS
          ======================================================== */}
      {activeSubTab === 'history_matrix' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Day Attendance Register Log ({selectedStream} Stream)
              </h3>
              <p className="text-xs text-slate-500">
                Cross-date historical register. Click any date to load and edit that day's register.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Recorded Dates: <strong>{allStreamRecords.length} Days</strong>
            </div>
          </div>

          {/* Past Attendance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStreamRecords.map((rec) => (
              <div 
                key={rec.id}
                className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{rec.date}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                    {rec.summary.attendanceRate}% Rate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1 border-y border-slate-200/60">
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">Present</div>
                    <div className="font-bold text-emerald-700">{rec.summary.present}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">Absent</div>
                    <div className="font-bold text-rose-700">{rec.summary.absent}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-500">Late/Exc</div>
                    <div className="font-bold text-slate-700">{rec.summary.late + rec.summary.excused}</div>
                  </div>
                </div>

                {/* Absent students preview */}
                {rec.summary.absent > 0 && (
                  <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="font-bold">Absent: </span>
                    {rec.records
                      .filter(r => r.status === 'absent')
                      .map(r => `${r.studentName}${r.remarks ? ` (${r.remarks})` : ''}`)
                      .join(', ')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(rec.date);
                    setActiveSubTab('daily_register');
                  }}
                  className="w-full py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
                >
                  Load & Edit This Date →
                </button>
              </div>
            ))}
          </div>

          {/* Student Cumulative Attendance Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Cumulative Term Attendance by Student</span>
              <span className="text-slate-500 font-normal">Based on all {allStreamRecords.length} marked days</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Learner Name</th>
                  <th className="py-2.5 px-4">Admission No.</th>
                  <th className="py-2.5 px-4 text-center">Days Present</th>
                  <th className="py-2.5 px-4 text-center">Days Absent</th>
                  <th className="py-2.5 px-4 text-center">Days Excused</th>
                  <th className="py-2.5 px-4 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {streamStudents.map(stu => {
                  const summary = Storage.getStudentAttendanceSummary(stu.id);
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{stu.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{stu.admissionNumber}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {summary.daysPresent}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">
                        {summary.daysAbsent}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-blue-700">
                        {summary.daysExcused}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-extrabold text-slate-900">
                        {summary.attendanceRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: GRAPHICAL PERFORMANCE ANALYSIS
          ======================================================== */}
      {activeSubTab === 'graphics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
              <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stream Mean Score</div>
              <div className="text-2xl font-extrabold font-mono mt-1">84.6%</div>
              <div className="text-xs text-emerald-800 mt-0.5">Grade {selectedGrade} Benchmark: 80.2% (+4.4%)</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-950">
              <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Stream Attendance Health</div>
              <div className="text-2xl font-extrabold font-mono mt-1">94.2%</div>
              <div className="text-xs text-blue-800 mt-0.5">Excellent regular roll-call consistency</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-purple-950">
              <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Syllabus Completion</div>
              <div className="text-2xl font-extrabold font-mono mt-1">89%</div>
              <div className="text-xs text-purple-800 mt-0.5">Term 1 syllabus on schedule</div>
            </div>
          </div>

          {/* Bar Chart: Multi-Subject Mean Performance */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Subject Mean Score Breakdown ({selectedStream} Stream)
                </h3>
                <p className="text-xs text-slate-500">Comparative performance across all {subjects.length} learning areas.</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Mean / 100</span>
            </div>

            <div className="space-y-3 pt-2">
              {subjectAverages.map((item) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.subject}</span>
                    <span className="font-mono font-bold text-emerald-800">{item.meanScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.meanScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CBC Competency Distribution Tier */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              CBC Competency Achievement Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="font-bold text-emerald-900">Exceeding Expectations</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">54%</div>
                <div className="text-[10px] text-emerald-800">Level 4 Mastery</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-900">Meeting Expectations</div>
                <div className="text-xl font-bold font-mono text-blue-700 mt-1">38%</div>
                <div className="text-[10px] text-blue-800">Level 3 Standard</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900">Approaching Expectations</div>
                <div className="text-xl font-bold font-mono text-amber-700 mt-1">8%</div>
                <div className="text-[10px] text-amber-800">Targeted support</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <div className="font-bold text-rose-900">Below Expectations</div>
                <div className="text-xl font-bold font-mono text-rose-700 mt-1">0%</div>
                <div className="text-[10px] text-rose-800">Remedial active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: PRINT OVERALL REPORT CARDS FOR STREAM
          ======================================================== */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                Select Pupil to Review & Print
              </label>
              <select
                value={selectedReportToPrint?.studentId || ''}
                onChange={(e) => {
                  const found = streamReports.find(r => r.studentId === e.target.value);
                  if (found) setSelectedReportToPrint(found);
                }}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {streamReports.map(r => (
                  <option key={r.studentId} value={r.studentId}>
                    {r.studentName} ({r.admissionNumber}) · Position: {r.streamPosition}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report Card</span>
            </button>
          </div>

          {/* Report Card Preview Frame */}
          {selectedReportToPrint ? (
            <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white shadow-md space-y-6 print:m-0 print:border-none print:shadow-none">
              <TenantPrintHeader
                title="Comprehensive Learner Performance Report"
                subtitle={`${selectedReportToPrint.term} · Academic Year ${selectedReportToPrint.academicYear} · Grade ${selectedReportToPrint.grade} (${selectedReportToPrint.stream} Stream)`}
                documentRef={`REPORT/${currentTenant.code}/${selectedReportToPrint.admissionNumber}`}
                showWatermark={true}
              />

              {/* Pupil details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Learner</span>
                  <strong className="text-slate-900 text-sm font-sans">{selectedReportToPrint.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Admission No</span>
                  <strong className="text-slate-900">{selectedReportToPrint.admissionNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Position in Stream</span>
                  <strong className="text-emerald-700">{selectedReportToPrint.streamPosition} of {selectedReportToPrint.totalStudentsInStream}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Average Score</span>
                  <strong className="text-slate-900">{selectedReportToPrint.overallAverage}%</strong>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Subject / Learning Area</th>
                      <th className="py-2.5 px-3 text-center">Opener (30)</th>
                      <th className="py-2.5 px-3 text-center">Mid-Term (30)</th>
                      <th className="py-2.5 px-3 text-center">End-Term (40)</th>
                      <th className="py-2.5 px-3 text-center">Total (100)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3">CBC Competency Level</th>
                      <th className="py-2.5 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedReportToPrint.subjects.map((sub, sIdx) => (
                      <tr key={sIdx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{sub.subject}</td>
                        <td className="py-2 px-3 text-center font-mono">{sub.openerScore}</td>
                        <td className="py-2 px-3 text-center font-mono">{sub.midTermScore}</td>
                        <td className="py-2 px-3 text-center font-mono">{sub.endTermScore}</td>
                        <td className="py-2 px-3 text-center font-mono font-extrabold text-slate-900">{sub.total}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">{sub.gradeLetter}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{sub.rubricLevel}</td>
                        <td className="py-2 px-3 italic text-slate-600">"{sub.remarks}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Endorsements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Class Teacher Remarks:</div>
                  <p className="italic text-slate-700">"{selectedReportToPrint.classTeacherRemarks}"</p>
                  <div className="text-[10px] text-slate-500 pt-2 font-mono">
                    Class Teacher Signature · Attendance Days: {selectedReportToPrint.attendanceDays} / {selectedReportToPrint.totalSchoolDays}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Head Teacher Endorsement:</div>
                  <p className="italic text-slate-700">"{selectedReportToPrint.headTeacherRemarks}"</p>
                  <div className="text-[10px] text-slate-500 pt-2">
                    Head Teacher Signature & Official Stamp
                  </div>
                </div>
              </div>

              {/* OFFICIAL ENDORSEMENT FOOTER WITH TENANT MOTTO & TAGLINE */}
              <TenantPrintFooter
                showSignature={false}
                customNote={currentTenant.printFooterNotes}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
              No report cards found for this stream.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: SANATORIUM & HEALTH RECORDS (FOR THIS CLASS)
          ======================================================== */}
      {activeSubTab === 'sanatorium' && (
        <div className="space-y-4">
          <SanatoriumSection
            currentUser={currentUser}
            canRecord={false}
            filterGrade={selectedGrade}
            filterStream={selectedStream}
            title={`Grade ${selectedGrade} (${selectedStream}) Class Sanatorium & Health Register`}
            subtitle="Learner medical visits, attendance details, nurse recommendations, and activity exemptions for your assigned stream."
          />
        </div>
      )}

      {/* ========================================================
          SUB-TAB 6: LEARNER LUNCH REGISTER & MEAL MARKING
          ======================================================== */}
      {activeSubTab === 'lunch_register' && (
        <div className="space-y-4">
          <LearnerLunchRegister
            currentUser={currentUser}
            initialGrade={selectedGrade}
            initialStream={selectedStream}
            viewMode="class_teacher"
          />
        </div>
      )}
    </div>
  );
};
