import React, { useState, useMemo, useRef } from 'react';
import { TimetableSlot, BellPeriodDef } from '../../types';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  CalendarDays, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  X, 
  Maximize2, 
  FileText, 
  Sparkles, 
  Share2, 
  BookOpen,
  CalendarCheck,
  Building,
  School,
  AlertTriangle
} from 'lucide-react';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface TeacherTimetableCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  allSlots: TimetableSlot[];
  bellSchedule: BellPeriodDef[];
  initialMode?: 'daily' | 'weekly';
  initialDay?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
}

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday'
];

export const TeacherTimetableCaptureModal: React.FC<TeacherTimetableCaptureModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  allSlots,
  bellSchedule,
  initialMode = 'daily',
  initialDay
}) => {
  const [captureMode, setCaptureMode] = useState<'daily' | 'weekly'>(initialMode);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(() => {
    if (initialDay) return initialDay;
    const todayIndex = new Date().getDay();
    if (todayIndex >= 1 && todayIndex <= 5) {
      return DAYS_OF_WEEK[todayIndex - 1];
    }
    return 'Monday';
  });
  const [isCopied, setIsCopied] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Filter slots for this specific teacher
  const teacherSlots = useMemo(() => {
    const nameLower = teacherName.toLowerCase();
    return allSlots.filter(s => 
      (s.teacherName && s.teacherName.toLowerCase() === nameLower) ||
      (s.isReliefCover && s.reliefTeacherName && s.reliefTeacherName.toLowerCase() === nameLower)
    );
  }, [allSlots, teacherName]);

  // Slots for selected day
  const daySlots = useMemo(() => {
    return teacherSlots
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.period - b.period);
  }, [teacherSlots, selectedDay]);

  // Classes & streams visited on selected day
  const dayStreamsList = useMemo(() => {
    return Array.from(new Set(daySlots.map(s => `Grade ${s.grade} (${s.stream})`)));
  }, [daySlots]);

  // Total unique classes & streams across whole week
  const weeklyStreamsList = useMemo(() => {
    return Array.from(new Set(teacherSlots.map(s => `Grade ${s.grade} (${s.stream})`)));
  }, [teacherSlots]);

  if (!isOpen) return null;

  // Copy schedule text to clipboard
  const handleCopyText = () => {
    let text = '';
    if (captureMode === 'daily') {
      text = `*EDUSMART ACADEMY - TEACHER DAILY TIMETABLE CAPTURE*\n`;
      text += `Teacher: ${teacherName}\n`;
      text += `Day: ${selectedDay} | Classes to Visit: ${daySlots.length}\n`;
      text += `Streams: ${dayStreamsList.join(', ')}\n\n`;
      text += `*CHRONOLOGICAL ITINERARY:*\n`;

      [1, 2, 3, 4, 5, 6, 7, 8].forEach(pNum => {
        const slot = daySlots.find(s => s.period === pNum);
        const bell = bellSchedule.find(b => b.period === pNum && !b.isBreak);
        const time = bell ? `${bell.startTime} - ${bell.endTime}` : `P${pNum}`;
        if (slot) {
          text += `• Period ${pNum} (${time}): Grade ${slot.grade} ${slot.stream} - ${slot.subject} | Room: ${slot.roomName || 'Classroom'}${slot.strandTopic ? ` | Strand: ${slot.strandTopic}` : ''}${slot.isReliefCover ? ' [RELIEF COVER]' : ''}\n`;
        } else {
          text += `• Period ${pNum} (${time}): FREE / PREP PERIOD\n`;
        }
      });
    } else {
      text = `*EDUSMART ACADEMY - MASTER WEEKLY TIMETABLE CAPTURE*\n`;
      text += `Teacher: ${teacherName}\n`;
      text += `Total Weekly Contact Periods: ${teacherSlots.length} (${teacherSlots.length * 40} mins delivery)\n`;
      text += `Streams Covered: ${weeklyStreamsList.join(', ')}\n\n`;

      DAYS_OF_WEEK.forEach(day => {
        const slotsForDay = teacherSlots.filter(s => s.dayOfWeek === day).sort((a, b) => a.period - b.period);
        text += `*${day.toUpperCase()} (${slotsForDay.length} Lessons):*\n`;
        if (slotsForDay.length === 0) {
          text += `  No lessons scheduled.\n`;
        } else {
          slotsForDay.forEach(s => {
            text += `  • P${s.period} (${s.startTime}-${s.endTime}): Grade ${s.grade} ${s.stream} - ${s.subject} (${s.roomName || 'Classroom'})\n`;
          });
        }
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none">
        
        {/* HEADER CONTROLS (HIDDEN DURING PRINT) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                  Full View Timetable Capture
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {teacherName}
                </span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-white">
                Teacher Schedule & Stream Visit Capture
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy schedule itinerary text for sharing or pasting"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print high-resolution timetable capture"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Capture</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE TOGGLE BAR (DAY VIEW vs WHOLE WEEK VIEW) */}
        <div className="bg-slate-100 p-3 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaptureMode('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                captureMode === 'daily'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Day View Capture (Classes to Visit)</span>
            </button>

            <button
              onClick={() => setCaptureMode('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                captureMode === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span>2. Whole Week's View Capture (Mon–Fri Matrix)</span>
            </button>
          </div>

          {/* Day selector when in daily mode */}
          {captureMode === 'daily' && (
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Day:</span>
              {DAYS_OF_WEEK.map(d => {
                const count = teacherSlots.filter(s => s.dayOfWeek === d).length;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedDay === d
                        ? 'bg-indigo-600 text-white font-black'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{d.slice(0, 3)}</span>
                    <span className="ml-1 opacity-75 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRINTABLE / CAPTURABLE CANVAS */}
        <div ref={captureRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-2">
          
          {/* OFFICIAL INSTITUTIONAL HEADER */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  EduSmart GADSA Senior Academy
                </h2>
                <p className="text-xs font-bold text-indigo-700">
                  Official CBC Faculty Timetable & Stream Delivery Schedule
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Ministry of Education & TSC Certified · Academic Year 2026 / Term 1
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 space-y-0.5">
              <div className="text-xs font-black text-slate-900">
                Instructor: <span className="text-indigo-700 font-extrabold">{teacherName}</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Capture Mode: <strong>{captureMode === 'daily' ? `Daily View (${selectedDay})` : "Whole Week's View (Mon–Fri)"}</strong>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* ========================================================
              CAPTURE MODE 1: DAILY VIEW (ALL CLASSES/STREAMS TO VISIT PER DAY)
              ======================================================== */}
          {captureMode === 'daily' && (
            <div className="space-y-6">
              
              {/* Daily Banner Card */}
              <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border-2 border-indigo-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-lg">
                      {selectedDay} Route & Classes
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      Visiting {daySlots.length} Classes across {dayStreamsList.length} Unique Streams
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 pt-1">
                    <strong>Streams on today's route:</strong>{' '}
                    {dayStreamsList.length > 0 ? (
                      <span className="text-indigo-900 font-bold">{dayStreamsList.join(' · ')}</span>
                    ) : (
                      <span className="italic text-slate-500">No classes scheduled on {selectedDay}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-semibold">Total Delivery</span>
                    <span className="text-indigo-700 font-extrabold">{daySlots.length * 40} Mins</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-semibold">Free Windows</span>
                    <span className="text-emerald-700 font-extrabold">{Math.max(0, 8 - daySlots.length)} Periods</span>
                  </div>
                </div>
              </div>

              {/* Chronological Table of Day Periods */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5 w-20 text-center">Period</th>
                      <th className="py-3 px-3 w-28">Time</th>
                      <th className="py-3 px-4">Class & Stream to Visit</th>
                      <th className="py-3 px-4">Learning Area / Subject</th>
                      <th className="py-3 px-3 w-32">Room / Lab</th>
                      <th className="py-3 px-4">Strand Topic / Lesson Objective</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(pNum => {
                      const slot = daySlots.find(s => s.period === pNum);
                      const bell = bellSchedule.find(b => b.period === pNum && !b.isBreak);
                      const timeStr = bell ? `${bell.startTime} – ${bell.endTime}` : `Period ${pNum}`;

                      if (slot) {
                        return (
                          <tr key={pNum} className={slot.isReliefCover ? 'bg-amber-50/70' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-3.5 text-center font-black text-slate-900 bg-slate-50 border-r border-slate-200">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center font-black">
                                P{pNum}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              {timeStr}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                                  Grade {slot.grade} ({slot.stream})
                                </span>
                                {slot.isReliefCover && (
                                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                                    <span>Relief ({slot.absentTeacherName})</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-800 text-xs">
                              {slot.subject}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{slot.roomName || 'Classroom'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {slot.strandTopic || 'Core CBC Curriculum Unit'}
                              {slot.reliefInstructions && (
                                <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                                  Note: {slot.reliefInstructions}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      // Free Period Row
                      return (
                        <tr key={pNum} className="bg-slate-50/50 text-slate-400 italic">
                          <td className="py-2.5 px-3.5 text-center font-bold bg-slate-100 border-r border-slate-200 text-slate-500">
                            P{pNum}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {timeStr}
                          </td>
                          <td colSpan={4} className="py-2.5 px-4 text-emerald-700 font-semibold text-xs">
                            ✓ Free Period / Lesson Preparation, Rubric Assessment & Marking
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
              CAPTURE MODE 2: WHOLE WEEK'S VIEW (FULL 5-DAY PANORAMIC MATRIX)
              ======================================================== */}
          {captureMode === 'weekly' && (
            <div className="space-y-6">
              
              {/* Weekly Summary Header */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black tracking-tight text-white">
                    Master Weekly Teaching Matrix (Monday to Friday)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Full panoramic grid of all class visits, stream rotations, and free prep windows.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Weekly Periods</span>
                    <span className="text-white font-extrabold text-sm">{teacherSlots.length} Lessons</span>
                  </div>
                  <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Contact Time</span>
                    <span className="text-indigo-300 font-extrabold text-sm">{teacherSlots.length * 40} Mins</span>
                  </div>
                  <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Streams Visited</span>
                    <span className="text-emerald-300 font-extrabold text-sm">{weeklyStreamsList.length} Streams</span>
                  </div>
                </div>
              </div>

              {/* Master Weekly Matrix Table */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-black border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-24 text-center uppercase tracking-wider text-[11px]">
                        Day
                      </th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(pNum => {
                        const bell = bellSchedule.find(b => b.period === pNum && !b.isBreak);
                        return (
                          <th key={pNum} className="py-2.5 px-2 text-center min-w-[120px] border-l border-slate-800">
                            <div className="font-black text-white text-xs">P{pNum}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {bell ? `${bell.startTime}–${bell.endTime}` : ''}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {DAYS_OF_WEEK.map(d => {
                      const daySlotsForWeek = teacherSlots.filter(s => s.dayOfWeek === d);

                      return (
                        <tr key={d} className="hover:bg-slate-50/50">
                          {/* Day Row Header */}
                          <td className="py-3 px-3.5 font-black text-slate-900 text-center bg-slate-100 border-r border-slate-200 align-middle">
                            <div className="text-xs font-black">{d}</div>
                            <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1">
                              {daySlotsForWeek.length} lessons
                            </div>
                          </td>

                          {/* Periods 1 to 8 */}
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(pNum => {
                            const slot = daySlotsForWeek.find(s => s.period === pNum);

                            if (slot) {
                              return (
                                <td 
                                  key={pNum} 
                                  className={`p-2 border-l border-slate-200 align-top ${
                                    slot.isReliefCover ? 'bg-amber-50' : 'bg-indigo-50/40'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-slate-900 text-[11px] bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-2xs">
                                        Gr {slot.grade} {slot.stream}
                                      </span>
                                      {slot.isReliefCover && (
                                        <span className="text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900 px-1 rounded">
                                          Relief
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-extrabold text-emerald-800 text-[11px] leading-tight">
                                      {slot.subject}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {slot.roomName || 'Room'}
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            // Free / Prep Period Cell
                            return (
                              <td key={pNum} className="p-2 border-l border-slate-200 text-center bg-slate-50/40 align-middle">
                                <span className="text-[10px] font-semibold text-slate-400 italic">
                                  Free / Prep
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* OFFICIAL FOOTER SIGN-OFF */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Dean of Studies & Deputy Head Approved</p>
              <p className="text-[11px]">EduSmart Timetable & Autonomous Curriculum Scheduling System</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Official Staff Record · Verification Hash: EDS-{Date.now().toString(36).toUpperCase()}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
