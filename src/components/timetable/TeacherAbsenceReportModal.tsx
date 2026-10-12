import React, { useState, useMemo } from 'react';
import { 
  User, 
  TimetableSlot, 
  TeacherAbsenceReport, 
  TeacherLeaveType, 
  AffectedLessonSlot 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  User as UserIcon, 
  ShieldAlert, 
  BookOpen, 
  Phone, 
  FileText, 
  X,
  Users,
  Check
} from 'lucide-react';

interface TeacherAbsenceReportModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: (report: TeacherAbsenceReport) => void;
}

const LEAVE_TYPES: { id: TeacherLeaveType; label: string; desc: string }[] = [
  { id: 'sick_leave', label: 'Medical / Sick Leave', desc: 'Illness, hospitalization, or doctor recommended rest' },
  { id: 'emergency', label: 'Family / Urgent Emergency', desc: 'Unforeseen domestic or personal emergency' },
  { id: 'tsc_official', label: 'TSC / Official Ministry Duty', desc: 'KICD/KNEC training, workshop, or curriculum assessment' },
  { id: 'medical_appointment', label: 'Medical Appointment', desc: 'Scheduled clinical examination or therapy session' },
  { id: 'bereavement', label: 'Compassionate / Bereavement', desc: 'Family bereavement or funeral attendance' },
  { id: 'personal', label: 'Approved Personal Leave', desc: 'Pre-approved administrative or personal leave' }
];

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export const TeacherAbsenceReportModal: React.FC<TeacherAbsenceReportModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onReportSubmitted
}) => {
  const [leaveType, setLeaveType] = useState<TeacherLeaveType>('sick_leave');
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(() => {
    const todayIndex = new Date().getDay();
    // Monday is 1, Friday is 5
    if (todayIndex >= 1 && todayIndex <= 5) {
      return DAYS_OF_WEEK[todayIndex - 1];
    }
    return 'Monday';
  });

  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>(currentUser.phone || '+254 ');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch all timetable slots taught by this teacher
  const allSlots = Storage.getAllTimetableSlots();
  const teacherName = currentUser.name;

  // Filter slots for the teacher
  const teacherSlots = useMemo(() => {
    const nameLower = teacherName.toLowerCase();
    return allSlots.filter(s => s.teacherName && s.teacherName.toLowerCase() === nameLower);
  }, [allSlots, teacherName]);

  // Affected classes for the selected day
  const affectedClassesForDay: AffectedLessonSlot[] = useMemo(() => {
    return teacherSlots
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.period - b.period)
      .map(s => ({
        dayOfWeek: s.dayOfWeek,
        period: s.period,
        grade: s.grade,
        stream: s.stream,
        subject: s.subject,
        time: `${s.startTime} – ${s.endTime}`,
        roomName: s.roomName,
        strandTopic: s.strandTopic
      }));
  }, [teacherSlots, selectedDay]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a brief reason for your absence to guide school leadership.');
      return;
    }

    setIsSubmitting(true);

    const report: TeacherAbsenceReport = {
      id: `abs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      teacherEmail: currentUser.email,
      leaveType,
      startDate,
      endDate,
      dayOfWeek: selectedDay,
      reason: reason.trim(),
      handoverNotes: handoverNotes.trim() || 'Please supervise learners with standard revision materials.',
      contactNumber: contactNumber.trim(),
      affectedClasses: affectedClassesForDay,
      notifiedRoles: ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher'],
      reliefStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    Storage.addTeacherAbsenceReport(report);
    setIsSubmitting(false);
    setIsSuccess(true);

    if (onReportSubmitted) {
      onReportSubmitted(report);
    }

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
        
        {/* HEADER */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Report Absence Status to Leadership
              </h3>
              <p className="text-xs text-amber-100">
                Official Staff Absence & Relief Dispatch Notification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RECIPIENTS BANNER */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-200">Broadcasts Immediately To:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700">
              🏫 Head Teacher
            </span>
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700">
              👔 Deputy Head
            </span>
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700">
              📚 Dean of Studies
            </span>
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700">
              🎖️ Senior Teacher
            </span>
          </div>
        </div>

        {/* FORM BODY */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-slate-900">
              Absence Report Successfully Submitted!
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              The Head Teacher, Deputy Head, Dean of Studies, and Senior Teacher have received high-priority alerts. The Dean/Deputy will assign relief teachers for your classes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
            
            {/* Reporting Teacher Info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-500">{currentUser.email}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Verified Faculty
              </span>
            </div>

            {/* 1. Leave Type Selection */}
            <div>
              <label className="font-bold text-slate-900 block mb-2">
                1. Nature / Category of Absence *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LEAVE_TYPES.map(lt => (
                  <label
                    key={lt.id}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      leaveType === lt.id 
                        ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400 shadow-2xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value={lt.id}
                      checked={leaveType === lt.id}
                      onChange={() => setLeaveType(lt.id)}
                      className="mt-0.5 accent-amber-600"
                    />
                    <div>
                      <span className="font-bold block text-xs">{lt.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{lt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Dates & Day Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Day of Week Schedule *
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Affected Classes to Visit Preview */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  Classes & Streams You Visit on {selectedDay} ({affectedClassesForDay.length} Lessons)
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Requires Relief Booking
                </span>
              </div>

              {affectedClassesForDay.length === 0 ? (
                <p className="text-slate-500 italic py-2 text-[11px]">
                  No scheduled instructional classes on {selectedDay}. Non-teaching duties only.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {affectedClassesForDay.map((c, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                          P{c.period}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          Grade {c.grade} {c.stream}
                        </span>
                        <span className="text-slate-600 font-semibold">
                          · {c.subject}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {c.time} ({c.roomName || 'Classroom'})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Reason Explanation */}
            <div>
              <label className="font-bold text-slate-900 block mb-1">
                2. Reason / Circumstance of Absence *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Briefly state the cause of absence (e.g., severe migraine and doctor visit, attending TSC curriculum cluster training)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
                required
              />
            </div>

            {/* 5. Handover Notes for Relief Colleague */}
            <div>
              <label className="font-bold text-slate-900 block mb-1 flex items-center justify-between">
                <span>3. Lesson Handover Notes & Instructions for Relief Teachers</span>
                <span className="text-[10px] font-normal text-slate-500">Helps substitute teacher conduct your classes</span>
              </label>
              <textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                rows={2}
                placeholder="Example: Grade 4 Dove: Textbook pg 52 Ex 4 on Fractions. Workbooks are on teacher's desk. Grade 5 Eagle: Guide them through science diagrams..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
              />
            </div>

            {/* 6. Emergency Contact */}
            <div>
              <label className="font-bold text-slate-900 block mb-1">
                4. Contact Number During Absence
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Dispatching Notice...' : 'Send Absence Report to Leadership'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
