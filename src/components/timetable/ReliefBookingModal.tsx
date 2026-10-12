import React, { useState, useMemo } from 'react';
import { User, TimetableSlot, TeacherAbsenceReport } from '../../types';
import { Storage } from '../../utils/storage';
import { 
  UserCheck, 
  Clock, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Send, 
  FileText, 
  Info,
  Shield,
  Trash2
} from 'lucide-react';

interface ReliefBookingModalProps {
  currentUser: User;
  slot: TimetableSlot;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedSlot: TimetableSlot) => void;
}

export const ReliefBookingModal: React.FC<ReliefBookingModalProps> = ({
  currentUser,
  slot,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedReliefTeacher, setSelectedReliefTeacher] = useState<string>(slot.reliefTeacherName || '');
  const [reliefReason, setReliefReason] = useState<string>(slot.reliefReason || `Colleague absence cover for ${slot.teacherName}`);
  const [reliefInstructions, setReliefInstructions] = useState<string>(slot.reliefInstructions || slot.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check if there is an official absence report for the original teacher
  const absenceReports = Storage.getTeacherAbsenceReports();
  const matchedAbsenceReport = useMemo(() => {
    const origTeacherLower = (slot.absentTeacherName || slot.teacherName || '').toLowerCase();
    return absenceReports.find(r => r.teacherName.toLowerCase() === origTeacherLower);
  }, [absenceReports, slot]);

  // All timetable slots to determine teacher busy/free status in this specific period
  const allSlots = Storage.getAllTimetableSlots();
  const allUsers = Storage.getUsers();

  // Distinct teachers in the institution
  const allTeachers = useMemo(() => {
    const list: Array<{ name: string; email: string }> = [];
    const seen = new Set<string>();

    allUsers
      .filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role))
      .forEach(u => {
        if (!seen.has(u.name.toLowerCase())) {
          seen.add(u.name.toLowerCase());
          list.push({ name: u.name, email: u.email });
        }
      });

    // Also include teachers in timetable if not in allUsers
    allSlots.forEach(s => {
      if (s.teacherName && !seen.has(s.teacherName.toLowerCase())) {
        seen.add(s.teacherName.toLowerCase());
        list.push({ name: s.teacherName, email: s.teacherEmail || '' });
      }
    });

    return list;
  }, [allUsers, allSlots]);

  // Determine availability for each teacher during slot.dayOfWeek and slot.period
  const teachersWithAvailability = useMemo(() => {
    const origTeacher = (slot.absentTeacherName || slot.teacherName || '').toLowerCase();

    return allTeachers
      .filter(t => t.name.toLowerCase() !== origTeacher) // Exclude the absent teacher
      .map(t => {
        const busySlot = allSlots.find(s => 
          s.teacherName?.toLowerCase() === t.name.toLowerCase() &&
          s.dayOfWeek === slot.dayOfWeek &&
          s.period === slot.period
        );

        return {
          ...t,
          isFree: !busySlot,
          busySlot
        };
      })
      .sort((a, b) => {
        // Free teachers first
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allTeachers, allSlots, slot]);

  // Set default relief teacher to the first free teacher if not already set
  React.useEffect(() => {
    if (!selectedReliefTeacher && teachersWithAvailability.length > 0) {
      const firstFree = teachersWithAvailability.find(t => t.isFree);
      if (firstFree) {
        setSelectedReliefTeacher(firstFree.name);
      }
    }
  }, [selectedReliefTeacher, teachersWithAvailability]);

  if (!isOpen) return null;

  const handleBookRelief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReliefTeacher) {
      alert('Please select a relief teacher to cover this lesson.');
      return;
    }

    setIsSubmitting(true);

    const bookedTeacherObj = allTeachers.find(t => t.name === selectedReliefTeacher);
    const updated = Storage.bookReliefTeacher(slot.id, {
      reliefTeacherName: selectedReliefTeacher,
      reliefTeacherEmail: bookedTeacherObj?.email,
      bookedBy: `${currentUser.name} (${currentUser.role.replace('_', ' ').toUpperCase()})`,
      reason: reliefReason,
      instructions: reliefInstructions,
      absentTeacherName: slot.absentTeacherName || slot.teacherName
    });

    setIsSubmitting(false);
    if (updated && onSuccess) {
      onSuccess(updated);
    }
    onClose();
  };

  const handleCancelRelief = () => {
    if (window.confirm('Cancel this relief booking and restore original lesson instructor?')) {
      const updated = Storage.cancelReliefBooking(slot.id);
      if (updated && onSuccess) {
        onSuccess(updated);
      }
      onClose();
    }
  };

  const freeCount = teachersWithAvailability.filter(t => t.isFree).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
        
        {/* HEADER */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {slot.isReliefCover ? 'Manage Relief Teaching Assignment' : 'Book Relief Teacher (Colleague Absent)'}
              </h3>
              <p className="text-xs text-indigo-100">
                Dean of Studies & Deputy Head Relief Operations
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

        {/* TARGET LESSON DETAILS SUMMARY */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                Grade {slot.grade} {slot.stream}
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {slot.subject}
              </span>
              <span className="font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                P{slot.period}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{slot.dayOfWeek} · {slot.startTime} – {slot.endTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-600">
              Scheduled Teacher: <strong className="text-rose-700">{slot.absentTeacherName || slot.teacherName} (Absent)</strong>
            </span>
            <span className="text-slate-500 font-mono">
              Room: {slot.roomName || 'Classroom'}
            </span>
          </div>

          {/* Matched Absence Notice */}
          {matchedAbsenceReport && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 mt-2 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Colleague Absence Report On Record:</span>
              </div>
              <p className="text-amber-800">{matchedAbsenceReport.reason}</p>
              {matchedAbsenceReport.handoverNotes && (
                <p className="text-amber-950 font-medium">
                  <strong>Handover note:</strong> {matchedAbsenceReport.handoverNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* BOOKING FORM */}
        <form onSubmit={handleBookRelief} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Free Teachers Badge */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-emerald-950">
                {freeCount} Teachers Available & Free in Period {slot.period} ({slot.dayOfWeek})
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              No Lesson Conflict
            </span>
          </div>

          {/* 1. Select Relief Teacher */}
          <div>
            <label className="font-bold text-slate-900 block mb-1.5">
              Select Relief / Substitute Teacher *
            </label>
            <select
              value={selectedReliefTeacher}
              onChange={(e) => setSelectedReliefTeacher(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              required
            >
              <optgroup label="✅ Free Teachers (Available in this period)">
                {teachersWithAvailability
                  .filter(t => t.isFree)
                  .map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} — (Free Period)
                    </option>
                  ))}
              </optgroup>

              <optgroup label="⚠️ Busy Teachers (Already teaching a class)">
                {teachersWithAvailability
                  .filter(t => !t.isFree)
                  .map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} — (Teaching Gr {t.busySlot?.grade} {t.busySlot?.stream})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* 2. Relief Reason */}
          <div>
            <label className="font-bold text-slate-900 block mb-1">
              Reason for Relief Assignment
            </label>
            <input
              type="text"
              value={reliefReason}
              onChange={(e) => setReliefReason(e.target.value)}
              placeholder="e.g., Sick leave cover for Mr. Kiprono, emergency cover..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* 3. Relief Instructions */}
          <div>
            <label className="font-bold text-slate-900 block mb-1">
              Specific Instructions for the Relief Teacher
            </label>
            <textarea
              value={reliefInstructions}
              onChange={(e) => setReliefInstructions(e.target.value)}
              rows={3}
              placeholder="e.g., Supervise math fraction exercises on page 52; workbooks are in the cabinet. Collect homework at end of period."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Notice */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Once booked, an immediate high-priority alert will be sent to <strong>{selectedReliefTeacher || 'the relief teacher'}</strong> with classroom and period details.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            {slot.isReliefCover ? (
              <button
                type="button"
                onClick={handleCancelRelief}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Relief Cover</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Booking Teacher...' : 'Confirm Relief Booking'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
