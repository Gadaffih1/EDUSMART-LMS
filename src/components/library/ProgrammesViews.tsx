import React, { useState } from 'react';
import { 
  Sparkles, 
  UserCheck, 
  Calendar, 
  PartyPopper, 
  Award, 
  Trophy, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  Users,
  BookOpen
} from 'lucide-react';
import { 
  ReadingProgrammeMember, 
  LibraryAttendanceLog, 
  LibraryTimetableSlot, 
  LibraryEvent 
} from '../../types';
import { LibraryPortalSection } from './types';

interface ProgrammesViewsProps {
  section: LibraryPortalSection;
  readingMembers: ReadingProgrammeMember[];
  attendanceLogs: LibraryAttendanceLog[];
  timetableSlots: LibraryTimetableSlot[];
  events: LibraryEvent[];
  onAddAttendanceLog: (log: LibraryAttendanceLog) => void;
  onAddTimetableSlot: (slot: LibraryTimetableSlot) => void;
  onAddEvent: (event: LibraryEvent) => void;
}

export const ProgrammesViews: React.FC<ProgrammesViewsProps> = ({
  section,
  readingMembers,
  attendanceLogs,
  timetableSlots,
  events,
  onAddAttendanceLog,
  onAddTimetableSlot,
  onAddEvent
}) => {
  // Reading Programme
  if (section === 'reading_programme') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>EduSmart Reader Champions & Literacy League</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Encouraging independent reading habits with tiered reading badges, book reviews, and termly awards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {readingMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{member.studentName}</h4>
                    <span className="text-xs text-slate-500">Grade {member.grade} {member.stream}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    member.currentLevel.includes('Platinum') ? 'bg-purple-100 text-purple-900' :
                    member.currentLevel.includes('Gold') ? 'bg-amber-100 text-amber-950' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {member.currentLevel}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Books Read This Term:</span>
                    <span className="font-bold text-slate-900 font-mono">{member.booksReadThisTerm} / {member.targetBooks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reading Points:</span>
                    <span className="font-bold text-amber-600 font-mono">{member.pointsEarned} Pts</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Earned Badges:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.badges.map((b, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md">
                        🎖️ {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
                Latest: "{member.lastBookReviewed}"
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Attendance View
  if (section === 'attendance') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Library Gate Attendance & Facility Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time roll of learners and teachers utilizing reading halls, reference desks, and research suites.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Visitor / Member Name</th>
                <th className="py-3 px-4">Role & Class</th>
                <th className="py-3 px-4 font-mono">Entry Time</th>
                <th className="py-3 px-4 font-mono">Exit Time</th>
                <th className="py-3 px-4">Session Purpose</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 capitalize">
                    {log.role} {log.grade && `· Grade ${log.grade} ${log.stream}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{log.entryTime}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.exitTime || 'In Library'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.purpose}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Timetable
  if (section === 'timetable') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Class Library Timetable & Session Schedule</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Weekly scheduled reading periods, library orientation, and digital literacy lab bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {timetableSlots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                    {slot.dayOfWeek}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-3">{slot.sessionType}</h4>
                <div className="text-xs text-slate-600 mt-1 font-semibold">{slot.stream}</div>
                <div className="text-xs text-slate-500 mt-0.5">Faculty Lead: {slot.teacherInCharge}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-purple-700 font-mono">
                📍 {slot.venue}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Events & Programmes
  if (section === 'events_programmes') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-amber-500" />
            <span>Literacy Festivals, Book Fairs & Guest Author Events</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Annual literary campaigns, national book week exhibitions, and storytelling events.
          </p>
        </div>

        <div className="space-y-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-slate-900">{evt.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      {evt.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    📅 {evt.date} · ⏰ {evt.time} · 📍 {evt.venue}
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg self-start">
                  {evt.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {evt.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Audience: <strong>{evt.targetAudience}</strong></span>
                <span>Coordinator: <strong>{evt.coordinator}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
