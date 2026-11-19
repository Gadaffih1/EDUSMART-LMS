import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  UserCheck,
  Calendar,
  PartyPopper,
  Plus,
  DoorOpen,
  Pencil,
  Trash2,
  Building2,
  RotateCcw,
  X,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  User,
  GradeLevel,
  StreamName,
  TimetableSlot,
  ReadingProgrammeMember,
  LibraryAttendanceLog,
  LibraryTimetableSlot,
  LibraryEvent,
  LibraryRoom,
  LibraryRoomBooking
} from '../../types';
import { Storage } from '../../utils/storage';
import { LibraryPortalSection } from './types';
import { LibraryRoomBookingButton } from './LibraryRoomBookingButton';
import { BOOKING_PERIODS } from './LibraryRoomBookingModal';
import { ttApiFetch } from '../timetable/timetableTypes';

interface ProgrammesViewsProps {
  currentUser?: User;
  section: LibraryPortalSection;
  readingMembers: ReadingProgrammeMember[];
  attendanceLogs: LibraryAttendanceLog[];
  timetableSlots: LibraryTimetableSlot[];
  events: LibraryEvent[];
  onAddReadingMember?: (member: ReadingProgrammeMember) => void;
  onUpdateReadingMember?: (id: string, updates: Partial<ReadingProgrammeMember>) => void;
  onDeleteReadingMember?: (id: string) => void;
  onAddAttendanceLog: (log: LibraryAttendanceLog) => void;
  onUpdateAttendanceLog?: (id: string, updates: Partial<LibraryAttendanceLog>) => void;
  onDeleteAttendanceLog?: (id: string) => void;
  onAddTimetableSlot: (slot: LibraryTimetableSlot) => void;
  onUpdateTimetableSlot?: (id: string, updates: Partial<LibraryTimetableSlot>) => void;
  onDeleteTimetableSlot?: (id: string) => void;
  onAddEvent: (event: LibraryEvent) => void;
  onUpdateEvent?: (id: string, updates: Partial<LibraryEvent>) => void;
  onDeleteEvent?: (id: string) => void;
}

export const ProgrammesViews: React.FC<ProgrammesViewsProps> = ({
  currentUser,
  section,
  readingMembers,
  attendanceLogs,
  timetableSlots,
  events,
  onAddReadingMember,
  onUpdateReadingMember,
  onDeleteReadingMember,
  onAddAttendanceLog,
  onUpdateAttendanceLog,
  onDeleteAttendanceLog,
  onAddTimetableSlot,
  onUpdateTimetableSlot,
  onDeleteTimetableSlot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const actorName = currentUser?.name || 'School Librarian';
  const actorRole = currentUser?.role || 'librarian';

  // Reading Programme CRUD state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null);
  const [memName, setMemName] = useState('');
  const [memGrade, setMemGrade] = useState<number>(4);
  const [memStream, setMemStream] = useState<string>('Dove');
  const [memLevel, setMemLevel] = useState<ReadingProgrammeMember['currentLevel']>('Gold Reader');
  const [memBooksRead, setMemBooksRead] = useState<number>(5);
  const [memTarget, setMemTarget] = useState<number>(10);
  const [memPoints, setMemPoints] = useState<number>(250);
  const [memBadges, setMemBadges] = useState('Fast Reader, CBC Bookworm');
  const [memLastBook, setMemLastBook] = useState('');

  // Attendance CRUD state
  const [showAttModal, setShowAttModal] = useState(false);
  const [editingAttId, setEditingAttId] = useState<string | null>(null);
  const [confirmDeleteAttId, setConfirmDeleteAttId] = useState<string | null>(null);
  const [attName, setAttName] = useState('');
  const [attRole, setAttRole] = useState<LibraryAttendanceLog['role']>('student');
  const [attGrade, setAttGrade] = useState<number>(4);
  const [attStream, setAttStream] = useState<string>('Dove');
  const [attEntryTime, setAttEntryTime] = useState('08:30 AM');
  const [attExitTime, setAttExitTime] = useState('');
  const [attPurpose, setAttPurpose] = useState<LibraryAttendanceLog['purpose']>('Study & Revision');
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Timetable CRUD state
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
  const [slotDay, setSlotDay] = useState<LibraryTimetableSlot['dayOfWeek']>('Monday');
  const [slotStart, setSlotStart] = useState('08:40');
  const [slotEnd, setSlotEnd] = useState('09:20');
  const [slotGrade, setSlotGrade] = useState<number>(4);
  const [slotStream, setSlotStream] = useState('Grade 4 Dove');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotSessionType, setSlotSessionType] = useState<LibraryTimetableSlot['sessionType']>('Library Reading Period');
  const [slotVenue, setSlotVenue] = useState('Main Library Reading Hall');

  // Events CRUD state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtType, setEvtType] = useState<LibraryEvent['type']>('Book Fair');
  const [evtDate, setEvtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [evtTime, setEvtTime] = useState('10:00 AM - 01:00 PM');
  const [evtVenue, setEvtVenue] = useState('Main Library Reading Hall');
  const [evtAudience, setEvtAudience] = useState('All Primary & JSS Learners');
  const [evtCoordinator, setEvtCoordinator] = useState(actorName);
  const [evtStatus, setEvtStatus] = useState<LibraryEvent['status']>('Upcoming');
  const [evtDesc, setEvtDesc] = useState('');

  // Room Booking & Rooms Management state (for room_booking section)
  const [rooms, setRooms] = useState<LibraryRoom[]>(() => Storage.getLibraryRooms());
  const [bookings, setBookings] = useState<LibraryRoomBooking[]>(() => Storage.getLibraryRoomBookings());
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);
  const [rmName, setRmName] = useState('');
  const [rmType, setRmType] = useState('Seminar Room');
  const [rmCapacity, setRmCapacity] = useState<number>(30);
  const [rmLocation, setRmLocation] = useState('');
  const [rmFeatures, setRmFeatures] = useState('Interactive Smart Screen, Reference Tables');
  const [rmDesc, setRmDesc] = useState('');

  // Edit / Delete Booking inside room_booking view
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState<string | null>(null);
  const [bkRoomId, setBkRoomId] = useState('');
  const [bkDate, setBkDate] = useState('');
  const [bkPeriodNum, setBkPeriodNum] = useState<number>(3);
  const [bkTeacher, setBkTeacher] = useState('');
  const [bkStream, setBkStream] = useState('');
  const [bkSubject, setBkSubject] = useState('');
  const [bkPurpose, setBkPurpose] = useState('');
  const [bkLearners, setBkLearners] = useState<number>(30);
  const [bkStatus, setBkStatus] = useState<'confirmed' | 'cancelled'>('confirmed');

  // Master Timetable Library Lesson linkage & Free Slots Monitor state
  const [masterTimetableSlots, setMasterTimetableSlots] = useState<TimetableSlot[]>(() => Storage.getAllTimetableSlots());
  const [publishedMasterLibLessons, setPublishedMasterLibLessons] = useState<
    Array<LibraryTimetableSlot & { periodNumber?: number }>
  >([]);
  const [monitorDay, setMonitorDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [monitorRoomId, setMonitorRoomId] = useState<string>(() => Storage.getLibraryRooms()[0]?.id || 'room-main-hall');

  useEffect(() => {
    const syncRooms = () => setRooms(Storage.getLibraryRooms());
    const syncBookings = () => setBookings(Storage.getLibraryRoomBookings());
    const syncMaster = () => setMasterTimetableSlots(Storage.getAllTimetableSlots());
    window.addEventListener('library-rooms-updated', syncRooms);
    window.addEventListener('library-room-bookings-updated', syncBookings);
    window.addEventListener('timetable-updated', syncMaster);
    window.addEventListener('edusmart:data-changed', syncRooms);
    window.addEventListener('edusmart:data-changed', syncBookings);
    window.addEventListener('edusmart:data-changed', syncMaster);
    return () => {
      window.removeEventListener('library-rooms-updated', syncRooms);
      window.removeEventListener('library-room-bookings-updated', syncBookings);
      window.removeEventListener('timetable-updated', syncMaster);
      window.removeEventListener('edusmart:data-changed', syncRooms);
      window.removeEventListener('edusmart:data-changed', syncBookings);
      window.removeEventListener('edusmart:data-changed', syncMaster);
    };
  }, []);

  useEffect(() => {
    if (section !== 'room_booking' && section !== 'timetable') return;
    let cancelled = false;
    (async () => {
      try {
        const pub = await ttApiFetch<{
          published?: boolean;
          periods?: Array<{ periodNumber: number; kind: string; startTime: string; endTime: string }>;
          entries?: Array<{
            id: string;
            dayOfWeek: string;
            periodNumber: number;
            grade: number;
            stream: string;
            subjectName: string;
            teacherNames?: string[];
            roomName?: string;
          }>;
        }>('/api/timetable/published');
        if (cancelled || !pub?.published || !Array.isArray(pub.entries)) return;
        const pMap = new Map<number, { startTime: string; endTime: string }>();
        for (const p of pub.periods || []) {
          if (p.kind === 'lesson' && p.periodNumber > 0) {
            pMap.set(p.periodNumber, { startTime: p.startTime, endTime: p.endTime });
          }
        }
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
        const list = pub.entries
          .filter((e) => String(e.subjectName || '').toLowerCase().includes('library'))
          .map((e) => {
            const tm = pMap.get(e.periodNumber) || BOOKING_PERIODS.find((bp) => bp.periodNum === e.periodNumber);
            const day = validDays.includes(e.dayOfWeek as any)
              ? (e.dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')
              : 'Monday';
            return {
              id: `mt-pub-${e.id}`,
              dayOfWeek: day,
              startTime: tm?.startTime || '08:00',
              endTime: tm?.endTime || '08:40',
              grade: Number(e.grade || 4) as GradeLevel,
              stream: `Grade ${e.grade} ${e.stream}`.trim(),
              teacherInCharge: (e.teacherNames || []).join(', ') || 'Subject Teacher',
              sessionType: 'Library Reading Period' as const,
              venue:
                e.roomName && e.roomName.toLowerCase().includes('library')
                  ? e.roomName
                  : 'Main Library Reading Hall',
              periodNumber: e.periodNumber,
            };
          });
        setPublishedMasterLibLessons(list);
      } catch {
        // Fallback to local storage slots
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  const toMinutes = (t: string) => {
    if (!t) return 0;
    const up = t.trim().toUpperCase();
    const pm = up.includes('PM');
    const am = up.includes('AM');
    const [hStr, mStr] = up.replace(/[A-Z\s]/g, '').split(':');
    let h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10);
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return h * 60 + m;
  };

  // Unified Library Lessons from Master Timetable + Library Timetable
  const linkedLibraryLessons = useMemo(() => {
    const map = new Map<string, LibraryTimetableSlot & { fromMaster: boolean; periodNumber?: number }>();
    const keyOf = (day: string, start: string, grade: number, stream: string) =>
      `${day.toLowerCase()}::${toMinutes(start)}::${grade}::${stream.toLowerCase().replace(/^grade\s*\d+\s*/i, '').trim()}`;

    for (const item of publishedMasterLibLessons) {
      map.set(keyOf(item.dayOfWeek, item.startTime, Number(item.grade), item.stream), {
        ...item,
        fromMaster: true,
      });
    }
    for (const slot of masterTimetableSlots) {
      if (!slot || !String(slot.subject || '').toLowerCase().includes('library')) continue;
      const streamLabel = String(slot.stream || '').toLowerCase().startsWith('grade')
        ? String(slot.stream)
        : `Grade ${slot.grade} ${slot.stream}`;
      const k = keyOf(slot.dayOfWeek, slot.startTime, Number(slot.grade), streamLabel);
      if (!map.has(k)) {
        map.set(k, {
          id: `mt-local-${slot.id}`,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          grade: slot.grade,
          stream: streamLabel,
          teacherInCharge: slot.teacherName || 'Subject Teacher',
          sessionType: 'Library Reading Period',
          venue:
            slot.roomName && slot.roomName.toLowerCase().includes('library')
              ? slot.roomName
              : 'Main Library Reading Hall',
          fromMaster: true,
          periodNumber: slot.period,
        });
      }
    }
    for (const slot of timetableSlots) {
      if (!slot) continue;
      const k = keyOf(slot.dayOfWeek, slot.startTime, Number(slot.grade), slot.stream || '');
      if (!map.has(k)) {
        map.set(k, {
          ...slot,
          fromMaster: String(slot.id || '').startsWith('mt-lib-'),
        });
      }
    }
    return Array.from(map.values());
  }, [publishedMasterLibLessons, masterTimetableSlots, timetableSlots]);

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

          <button
            type="button"
            onClick={() => {
              setEditingMemberId(null);
              setMemName('');
              setMemGrade(4);
              setMemStream('Dove');
              setMemLevel('Silver Reader');
              setMemBooksRead(1);
              setMemTarget(10);
              setMemPoints(50);
              setMemBadges('Rising Reader');
              setMemLastBook('');
              setShowMemberModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reader Member</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {readingMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
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

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="text-[11px] text-slate-500 italic">
                  Latest: "{member.lastBookReviewed || 'No review logged yet'}"
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(member.id);
                      setMemName(member.studentName);
                      setMemGrade(Number(member.grade));
                      setMemStream(member.stream);
                      setMemLevel(member.currentLevel);
                      setMemBooksRead(member.booksReadThisTerm);
                      setMemTarget(member.targetBooks);
                      setMemPoints(member.pointsEarned);
                      setMemBadges(member.badges.join(', '));
                      setMemLastBook(member.lastBookReviewed);
                      setShowMemberModal(true);
                    }}
                    className="px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  {onDeleteReadingMember && (
                    confirmDeleteMemberId === member.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteReadingMember(member.id);
                            setConfirmDeleteMemberId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMemberId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMemberId(member.id)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingMemberId ? 'Edit Reader Champion' : 'Enroll Reader Champion'}
                </h4>
                <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Name *</label>
                <input type="text" value={memName} onChange={(e) => setMemName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade</label>
                  <input type="number" min={1} max={9} value={memGrade} onChange={(e) => setMemGrade(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stream</label>
                  <input type="text" value={memStream} onChange={(e) => setMemStream(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tier</label>
                  <select value={memLevel} onChange={(e) => setMemLevel(e.target.value as ReadingProgrammeMember['currentLevel'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="Bronze Reader">Bronze Reader</option>
                    <option value="Silver Reader">Silver Reader</option>
                    <option value="Gold Reader">Gold Reader</option>
                    <option value="Platinum Scholar">Platinum Scholar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Books Read</label>
                  <input type="number" min={0} value={memBooksRead} onChange={(e) => setMemBooksRead(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target</label>
                  <input type="number" min={1} value={memTarget} onChange={(e) => setMemTarget(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Points</label>
                  <input type="number" min={0} value={memPoints} onChange={(e) => setMemPoints(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badges (comma-separated)</label>
                <input type="text" value={memBadges} onChange={(e) => setMemBadges(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Latest Book Reviewed</label>
                <input type="text" value={memLastBook} onChange={(e) => setMemLastBook(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!memName.trim()) return;
                    const badgeList = memBadges.split(',').map(b => b.trim()).filter(Boolean);
                    if (editingMemberId && onUpdateReadingMember) {
                      onUpdateReadingMember(editingMemberId, {
                        studentName: memName.trim(),
                        grade: memGrade as GradeLevel,
                        stream: memStream.trim() as StreamName,
                        currentLevel: memLevel,
                        booksReadThisTerm: memBooksRead,
                        targetBooks: memTarget,
                        pointsEarned: memPoints,
                        badges: badgeList,
                        lastBookReviewed: memLastBook.trim()
                      });
                    } else if (onAddReadingMember) {
                      onAddReadingMember({
                        id: `rp-${Date.now()}`,
                        studentId: `stu-${Date.now()}`,
                        studentName: memName.trim(),
                        grade: memGrade as GradeLevel,
                        stream: memStream.trim() as StreamName,
                        currentLevel: memLevel,
                        booksReadThisTerm: memBooksRead,
                        targetBooks: memTarget,
                        pointsEarned: memPoints,
                        badges: badgeList,
                        lastBookReviewed: memLastBook.trim() || 'Newly Enrolled'
                      });
                    }
                    setShowMemberModal(false);
                    setEditingMemberId(null);
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg cursor-pointer"
                >
                  {editingMemberId ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </div>
          </div>
        )}
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

          <button
            type="button"
            onClick={() => {
              setEditingAttId(null);
              setAttName('');
              setAttRole('student');
              setAttGrade(4);
              setAttStream('Dove');
              setAttEntryTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              setAttExitTime('');
              setAttPurpose('Study & Revision');
              setAttDate(new Date().toISOString().split('T')[0]);
              setShowAttModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Log Visitor Entry</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[660px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Visitor / Member Name</th>
                <th className="py-3 px-4">Role & Class</th>
                <th className="py-3 px-4 font-mono">Entry Time</th>
                <th className="py-3 px-4 font-mono">Exit Time</th>
                <th className="py-3 px-4">Session Purpose</th>
                <th className="py-3 px-4 font-mono">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 capitalize">
                    {log.role} {log.grade && `· Grade ${log.grade} ${log.stream || ''}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{log.entryTime}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.exitTime || 'In Library'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.purpose}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!log.exitTime && onUpdateAttendanceLog && (
                        <button
                          type="button"
                          onClick={() => onUpdateAttendanceLog(log.id, { exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                          className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Sign Out
                        </button>
                      )}
                      {onUpdateAttendanceLog && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAttId(log.id);
                            setAttName(log.name);
                            setAttRole(log.role);
                            setAttGrade(Number(log.grade || 4));
                            setAttStream(String(log.stream || 'Dove'));
                            setAttEntryTime(log.entryTime);
                            setAttExitTime(log.exitTime || '');
                            setAttPurpose(log.purpose);
                            setAttDate(log.date);
                            setShowAttModal(true);
                          }}
                          className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onDeleteAttendanceLog && (
                        confirmDeleteAttId === log.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteAttendanceLog(log.id);
                                setConfirmDeleteAttId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAttId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAttId(log.id)}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add / Edit Attendance Modal */}
        {showAttModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingAttId ? 'Edit Attendance Record' : 'Log Library Entry'}
                </h4>
                <button onClick={() => setShowAttModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor / Member Name *</label>
                <input type="text" value={attName} onChange={(e) => setAttName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select value={attRole} onChange={(e) => setAttRole(e.target.value as LibraryAttendanceLog['role'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="visitor">Visitor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade</label>
                  <input type="number" min={1} max={9} value={attGrade} onChange={(e) => setAttGrade(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stream</label>
                  <input type="text" value={attStream} onChange={(e) => setAttStream(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entry Time</label>
                  <input type="text" value={attEntryTime} onChange={(e) => setAttEntryTime(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exit Time</label>
                  <input type="text" value={attExitTime} onChange={(e) => setAttExitTime(e.target.value)} placeholder="Optional" className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
                <select value={attPurpose} onChange={(e) => setAttPurpose(e.target.value as LibraryAttendanceLog['purpose'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                  <option value="Study & Revision">Study & Revision</option>
                  <option value="Borrowing / Return">Borrowing / Return</option>
                  <option value="Computer / Research">Computer / Research</option>
                  <option value="Class Session">Class Session</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAttModal(false)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!attName.trim()) return;
                    if (editingAttId && onUpdateAttendanceLog) {
                      onUpdateAttendanceLog(editingAttId, {
                        name: attName.trim(),
                        role: attRole,
                        grade: attRole === 'student' ? (attGrade as GradeLevel) : undefined,
                        stream: attRole === 'student' ? (attStream.trim() as StreamName) : undefined,
                        entryTime: attEntryTime.trim(),
                        exitTime: attExitTime.trim() || undefined,
                        purpose: attPurpose,
                        date: attDate
                      });
                    } else {
                      onAddAttendanceLog({
                        id: `att-${Date.now()}`,
                        learnerOrStaffId: `mem-${Date.now()}`,
                        name: attName.trim(),
                        role: attRole,
                        grade: attRole === 'student' ? (attGrade as GradeLevel) : undefined,
                        stream: attRole === 'student' ? (attStream.trim() as StreamName) : undefined,
                        entryTime: attEntryTime.trim() || '08:30 AM',
                        exitTime: attExitTime.trim() || undefined,
                        purpose: attPurpose,
                        date: attDate
                      });
                    }
                    setShowAttModal(false);
                    setEditingAttId(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer"
                >
                  {editingAttId ? 'Save Changes' : 'Log Entry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Timetable
  if (section === 'timetable') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Class Library Timetable & Session Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Weekly scheduled reading periods, library orientation, and digital literacy lab bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingSlotId(null);
                setSlotDay('Monday');
                setSlotStart('08:40');
                setSlotEnd('09:20');
                setSlotGrade(4);
                setSlotStream('Grade 4 Dove');
                setSlotTeacher(actorName);
                setSlotSessionType('Library Reading Period');
                setSlotVenue(rooms[0]?.name || 'Main Library Reading Hall');
                setShowSlotModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timetable Slot</span>
            </button>
            <LibraryRoomBookingButton
              currentUser={currentUser || ({ name: 'School Librarian', role: 'librarian' } as User)}
              variant="hero"
              label="Book Free Room Spot"
            />
          </div>
        </div>

        {/* Timetable spots explanation banner */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-purple-900 font-medium">
            <strong className="text-purple-950 font-black">Facility Booking Rule:</strong> The spots below contain scheduled class lessons and cannot be booked. Subject Teachers & Librarians can book rooms on any open spot without scheduled lessons.
          </div>
          <LibraryRoomBookingButton
            currentUser={currentUser || ({ name: 'School Librarian', role: 'librarian' } as User)}
            variant="outline"
            label="Check Spot Availability"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {linkedLibraryLessons.map((slot) => {
            const isEditableLocalSlot = timetableSlots.some((ts) => ts.id === slot.id);
            return (
            <div key={slot.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                      {slot.dayOfWeek}
                    </span>
                    {slot.fromMaster && (
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        Master TT
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-3">{slot.sessionType}</h4>
                <div className="text-xs text-slate-600 mt-1 font-semibold">{slot.stream}</div>
                <div className="text-xs text-slate-500 mt-0.5">Faculty Lead: {slot.teacherInCharge}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-purple-700 font-mono truncate">📍 {slot.venue}</span>
                {isEditableLocalSlot ? (
                <div className="flex items-center gap-1 shrink-0">
                  {onUpdateTimetableSlot && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlotId(slot.id);
                        setSlotDay(slot.dayOfWeek);
                        setSlotStart(slot.startTime);
                        setSlotEnd(slot.endTime);
                        setSlotGrade(Number(slot.grade));
                        setSlotStream(slot.stream);
                        setSlotTeacher(slot.teacherInCharge);
                        setSlotSessionType(slot.sessionType);
                        setSlotVenue(slot.venue);
                        setShowSlotModal(true);
                      }}
                      className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteTimetableSlot && (
                    confirmDeleteSlotId === slot.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTimetableSlot(slot.id);
                            setConfirmDeleteSlotId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSlotId(null)}
                          className="px-1.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlotId(slot.id)}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )
                  )}
                </div>
                ) : (
                  <span className="text-[10px] font-semibold text-indigo-700 shrink-0">Synced via Master TT</span>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Add / Edit Timetable Slot Modal */}
        {showSlotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingSlotId ? 'Edit Library Timetable Slot' : 'Add Library Timetable Slot'}
                </h4>
                <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day</label>
                  <select value={slotDay} onChange={(e) => setSlotDay(e.target.value as LibraryTimetableSlot['dayOfWeek'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input type="text" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input type="text" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session Type</label>
                  <select value={slotSessionType} onChange={(e) => setSlotSessionType(e.target.value as LibraryTimetableSlot['sessionType'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="Library Reading Period">Library Reading Period</option>
                    <option value="Research & Digital Literacy">Research & Digital Literacy</option>
                    <option value="Open Study">Open Study</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade</label>
                  <input type="number" min={1} max={9} value={slotGrade} onChange={(e) => setSlotGrade(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Stream *</label>
                  <input type="text" value={slotStream} onChange={(e) => setSlotStream(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teacher In Charge</label>
                  <input type="text" value={slotTeacher} onChange={(e) => setSlotTeacher(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Library Venue</label>
                <select value={slotVenue} onChange={(e) => setSlotVenue(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                  {rooms.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowSlotModal(false)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!slotStream.trim()) return;
                    if (editingSlotId && onUpdateTimetableSlot) {
                      onUpdateTimetableSlot(editingSlotId, {
                        dayOfWeek: slotDay,
                        startTime: slotStart.trim(),
                        endTime: slotEnd.trim(),
                        grade: slotGrade as GradeLevel,
                        stream: slotStream.trim(),
                        teacherInCharge: slotTeacher.trim() || actorName,
                        sessionType: slotSessionType,
                        venue: slotVenue
                      });
                    } else {
                      onAddTimetableSlot({
                        id: `tt-${Date.now()}`,
                        dayOfWeek: slotDay,
                        startTime: slotStart.trim(),
                        endTime: slotEnd.trim(),
                        grade: slotGrade as GradeLevel,
                        stream: slotStream.trim(),
                        teacherInCharge: slotTeacher.trim() || actorName,
                        sessionType: slotSessionType,
                        venue: slotVenue
                      });
                    }
                    setShowSlotModal(false);
                    setEditingSlotId(null);
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg cursor-pointer"
                >
                  {editingSlotId ? 'Update Slot' : 'Add Slot'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Room Booking Section (Full Librarian Rooms & Bookings CRUD)
  if (section === 'room_booking') {
    const handleSaveRoom = () => {
      if (!rmName.trim()) return;
      const features = rmFeatures.split(',').map(s => s.trim()).filter(Boolean);
      if (editingRoomId) {
        Storage.updateLibraryRoom(editingRoomId, {
          name: rmName.trim(),
          type: rmType.trim() || 'Seminar Room',
          capacity: Math.max(1, rmCapacity),
          location: rmLocation.trim() || 'Library Wing',
          features,
          description: rmDesc.trim() || 'Dedicated CBC learning space.'
        });
        Storage.addLibraryAuditLog({
          id: `aud-${Date.now()}`,
          action: 'Library Room Updated',
          performedBy: actorName,
          role: actorRole,
          timestamp: new Date().toISOString(),
          details: `Updated library venue "${rmName.trim()}"`
        });
      } else {
        const created: LibraryRoom = {
          id: `room-${Date.now()}`,
          name: rmName.trim(),
          type: rmType.trim() || 'Seminar Room',
          capacity: Math.max(1, rmCapacity),
          location: rmLocation.trim() || 'Library Wing',
          features,
          description: rmDesc.trim() || 'Dedicated CBC learning space.'
        };
        Storage.addLibraryRoom(created);
        Storage.addLibraryAuditLog({
          id: `aud-${Date.now()}`,
          action: 'Library Room Added',
          performedBy: actorName,
          role: actorRole,
          timestamp: new Date().toISOString(),
          details: `Added library venue "${created.name}" (Capacity: ${created.capacity})`
        });
      }
      setRooms(Storage.getLibraryRooms());
      setShowRoomModal(false);
      setEditingRoomId(null);
    };

    const handleSaveBookingEdit = (id: string) => {
      const rm = rooms.find(r => r.id === bkRoomId) || rooms[0];
      const per = BOOKING_PERIODS.find(p => p.periodNum === bkPeriodNum) || BOOKING_PERIODS[2];
      const dayIdx = bkDate ? new Date(bkDate + 'T00:00:00').getDay() : 1;
      const dayMap: Record<number, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = {
        1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday'
      };
      Storage.updateLibraryRoomBooking(id, {
        roomId: rm?.id || bkRoomId,
        roomName: rm?.name || 'Library Room',
        roomCapacity: rm?.capacity || 30,
        date: bkDate,
        dayOfWeek: dayMap[dayIdx] || 'Monday',
        startTime: per.displayTime.split(' - ')[0],
        endTime: per.displayTime.split(' - ')[1],
        periodLabel: per.label,
        bookedByName: bkTeacher.trim() || actorName,
        stream: bkStream.trim(),
        subject: bkSubject.trim(),
        purpose: bkPurpose.trim() || 'Library Session',
        learnersCount: Math.max(1, bkLearners),
        status: bkStatus
      });
      Storage.addLibraryAuditLog({
        id: `aud-${Date.now()}`,
        action: 'Room Booking Updated',
        performedBy: actorName,
        role: actorRole,
        timestamp: new Date().toISOString(),
        details: `Updated room booking ${id} for ${rm?.name || 'Library Room'} on ${bkDate}`
      });
      setBookings(Storage.getLibraryRoomBookings());
      setEditingBookingId(null);
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-semibold mb-2">
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Librarian Full Facility & Booking Control</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">
              Library Room Booking & Learning Spaces
            </h3>
            <p className="text-purple-200/80 text-xs mt-1 max-w-xl">
              Add, edit, or remove library rooms and manage, edit, cancel, or permanently delete any teacher or staff room booking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingRoomId(null);
                setRmName('');
                setRmType('Seminar Room');
                setRmCapacity(30);
                setRmLocation('First Floor · Library Wing');
                setRmFeatures('Interactive Smart Screen, Reference Tables');
                setRmDesc('');
                setShowRoomModal(true);
              }}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Library Room</span>
            </button>
            <LibraryRoomBookingButton
              currentUser={currentUser || ({ name: 'School Librarian', role: 'librarian' } as User)}
              variant="hero"
              label="+ New Room Booking"
            />
          </div>
        </div>

        {/* Master Timetable Library Lessons & Free Slots Monitor */}
        {(() => {
          const activeMonitorRoom = rooms.find((r) => r.id === monitorRoomId) || rooms[0];
          const safeRoom = (activeMonitorRoom?.name || '').toLowerCase();
          const isDefaultMain =
            safeRoom.includes('main') ||
            safeRoom.includes('reading') ||
            activeMonitorRoom?.id === rooms[0]?.id;

          const periodStatuses = BOOKING_PERIODS.map((p) => {
            const pStart = toMinutes(p.startTime);
            const pEnd = toMinutes(p.endTime);
            const lesson = linkedLibraryLessons.find((l) => {
              if (l.dayOfWeek !== monitorDay) return false;
              const v = (l.venue || '').toLowerCase().trim();
              const generic = !v || v === 'library' || v === 'school library' || v.startsWith('classroom');
              const venueOk =
                (generic && isDefaultMain) ||
                (v && safeRoom && (v.includes(safeRoom) || safeRoom.includes(v))) ||
                (safeRoom.includes('main') && v.includes('main')) ||
                (safeRoom.includes('digital') && v.includes('digital'));
              if (!venueOk) return false;
              if (typeof l.periodNumber === 'number' && l.periodNumber === p.periodNum) return true;
              return Math.max(pStart, toMinutes(l.startTime)) < Math.min(pEnd, toMinutes(l.endTime));
            });
            const booked = bookings.find((b) => {
              if (!b || b.status === 'cancelled' || b.dayOfWeek !== monitorDay) return false;
              if (b.roomId !== activeMonitorRoom?.id && b.roomName !== activeMonitorRoom?.name) return false;
              return Math.max(pStart, toMinutes(b.startTime)) < Math.min(pEnd, toMinutes(b.endTime));
            });
            return { period: p, lesson, booked };
          });

          const freeCount = periodStatuses.filter((s) => !s.lesson && !s.booked).length;
          const lessonCount = periodStatuses.filter((s) => Boolean(s.lesson)).length;
          const bookedCount = periodStatuses.filter((s) => !s.lesson && Boolean(s.booked)).length;

          return (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Master Timetable Library Lessons &amp; Free Slots Monitor</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Linked directly to scheduled <strong>Library Lessons</strong> in the Master Timetable so you can instantly spot free slots when booking for other teachers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={monitorDay}
                    onChange={(e) => setMonitorDay(e.target.value as any)}
                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-800"
                  >
                    {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={activeMonitorRoom?.id || ''}
                    onChange={(e) => setMonitorRoomId(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-800"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {freeCount} Free Slots for Other Teachers
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  {lessonCount} Library Lessons (Master TT / Schedule)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  {bookedCount} Reserved Bookings
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {periodStatuses.map(({ period, lesson, booked }) => (
                  <div
                    key={period.periodNum}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                      lesson
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : booked
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>Period {period.periodNum}</span>
                      <span className="font-mono">{period.startTime}</span>
                    </div>
                    {lesson ? (
                      <div>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-black text-[9px] uppercase">
                          {lesson.fromMaster ? 'Master TT Lesson' : 'Library Lesson'}
                        </span>
                        <div className="font-bold text-[11px] mt-1 truncate">{lesson.stream}</div>
                        <div className="text-[10px] text-rose-700 truncate">{lesson.teacherInCharge}</div>
                      </div>
                    ) : booked ? (
                      <div>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-black text-[9px] uppercase">
                          Booked
                        </span>
                        <div className="font-bold text-[11px] mt-1 truncate">{booked.bookedByName}</div>
                        <div className="text-[10px] text-amber-700 truncate">{booked.subject || booked.purpose}</div>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black text-[9px] uppercase">
                          FREE SLOT
                        </span>
                        <div className="text-[10px] text-emerald-800 font-medium mt-1">
                          Open to book for other teachers
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Library Rooms / Venues Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Library Venues & Learning Spaces ({rooms.length})</span>
              </h4>
              <p className="text-xs text-slate-500">Rooms available for scheduling and subject teacher bookings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map(rm => (
              <div key={rm.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3 hover:border-purple-300 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-slate-900">{rm.name}</div>
                      <div className="text-[11px] text-purple-700 font-semibold">{rm.type} · 📍 {rm.location}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] shrink-0">
                      Cap: {rm.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{rm.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoomId(rm.id);
                      setRmName(rm.name);
                      setRmType(rm.type);
                      setRmCapacity(rm.capacity);
                      setRmLocation(rm.location);
                      setRmFeatures((rm.features || []).join(', '));
                      setRmDesc(rm.description);
                      setShowRoomModal(true);
                    }}
                    className="px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  {rooms.length > 1 && (
                    confirmDeleteRoomId === rm.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            Storage.deleteLibraryRoom(rm.id);
                            Storage.addLibraryAuditLog({
                              id: `aud-${Date.now()}`,
                              action: 'Library Room Removed',
                              performedBy: actorName,
                              role: actorRole,
                              timestamp: new Date().toISOString(),
                              details: `Removed library room "${rm.name}"`
                            });
                            setRooms(Storage.getLibraryRooms());
                            setConfirmDeleteRoomId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRoomId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRoomId(rm.id)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Room Bookings Registry */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-base text-slate-900">
                All Room Bookings Registry ({bookings.length})
              </h4>
              <p className="text-xs text-slate-500">
                Full librarian rights to edit, cancel, restore, or permanently delete any booking.
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl">
              No room bookings recorded yet. Click <strong>+ New Room Booking</strong> above to reserve a library space.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(bk => (
                <div key={bk.id} className={`rounded-2xl border p-4 space-y-2.5 ${bk.status === 'cancelled' ? 'opacity-70 border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-purple-700">{bk.bookingRef}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${bk.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {bk.status}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{bk.roomName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        📅 {bk.date} ({bk.dayOfWeek}) · ⏰ {bk.startTime} - {bk.endTime} · {bk.bookedByName} · {bk.stream} ({bk.subject})
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5">{bk.purpose} ({bk.learnersCount} learners)</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingBookingId === bk.id) {
                            setEditingBookingId(null);
                            return;
                          }
                          setEditingBookingId(bk.id);
                          setBkRoomId(bk.roomId);
                          setBkDate(bk.date);
                          const matched = BOOKING_PERIODS.find(p => p.label === bk.periodLabel || p.displayTime.startsWith(bk.startTime));
                          setBkPeriodNum(matched?.periodNum || 3);
                          setBkTeacher(bk.bookedByName);
                          setBkStream(bk.stream || '');
                          setBkSubject(bk.subject || '');
                          setBkPurpose(bk.purpose);
                          setBkLearners(bk.learnersCount);
                          setBkStatus(bk.status);
                        }}
                        className="px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{editingBookingId === bk.id ? 'Close' : 'Edit'}</span>
                      </button>

                      {bk.status === 'confirmed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            Storage.cancelLibraryRoomBooking(bk.id);
                            setBookings(Storage.getLibraryRoomBookings());
                          }}
                          className="px-2.5 py-1 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            Storage.updateLibraryRoomBooking(bk.id, { status: 'confirmed' });
                            setBookings(Storage.getLibraryRoomBookings());
                          }}
                          className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      )}

                      {confirmDeleteBookingId === bk.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              Storage.deleteLibraryRoomBooking(bk.id);
                              Storage.addLibraryAuditLog({
                                id: `aud-${Date.now()}`,
                                action: 'Room Booking Deleted',
                                performedBy: actorName,
                                role: actorRole,
                                timestamp: new Date().toISOString(),
                                details: `Permanently deleted booking ${bk.bookingRef} (${bk.roomName})`
                              });
                              setBookings(Storage.getLibraryRoomBookings());
                              setConfirmDeleteBookingId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBookingId(null)}
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteBookingId(bk.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {editingBookingId === bk.id && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Room</label>
                          <select value={bkRoomId} onChange={(e) => setBkRoomId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white">
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Date</label>
                          <input type="date" value={bkDate} onChange={(e) => setBkDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Period</label>
                          <select value={bkPeriodNum} onChange={(e) => setBkPeriodNum(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white">
                            {BOOKING_PERIODS.map(p => <option key={p.periodNum} value={p.periodNum}>{p.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Booked By</label>
                          <input type="text" value={bkTeacher} onChange={(e) => setBkTeacher(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Class / Stream</label>
                          <input type="text" value={bkStream} onChange={(e) => setBkStream(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Subject</label>
                          <input type="text" value={bkSubject} onChange={(e) => setBkSubject(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Purpose</label>
                          <input type="text" value={bkPurpose} onChange={(e) => setBkPurpose(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Learners</label>
                          <input type="number" min={1} value={bkLearners} onChange={(e) => setBkLearners(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingBookingId(null)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                        <button type="button" onClick={() => handleSaveBookingEdit(bk.id)} className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg cursor-pointer">Save Changes</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Room Modal */}
        {showRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingRoomId ? 'Edit Library Room' : 'Add Library Room / Venue'}
                </h4>
                <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Name *</label>
                <input type="text" value={rmName} onChange={(e) => setRmName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
                  <input type="text" value={rmType} onChange={(e) => setRmType(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input type="number" min={1} value={rmCapacity} onChange={(e) => setRmCapacity(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Wing</label>
                <input type="text" value={rmLocation} onChange={(e) => setRmLocation(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Features (comma-separated)</label>
                <input type="text" value={rmFeatures} onChange={(e) => setRmFeatures(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={rmDesc} onChange={(e) => setRmDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowRoomModal(false)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSaveRoom} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg cursor-pointer">
                  {editingRoomId ? 'Update Room' : 'Save Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Events & Programmes
  if (section === 'events_programmes') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-amber-500" />
              <span>Literacy Festivals, Book Fairs & Guest Author Events</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Annual literary campaigns, national book week exhibitions, and storytelling events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingEventId(null);
              setEvtTitle('');
              setEvtType('Book Fair');
              setEvtDate(new Date().toISOString().split('T')[0]);
              setEvtTime('10:00 AM - 01:00 PM');
              setEvtVenue(rooms[0]?.name || 'Main Library Reading Hall');
              setEvtAudience('All Primary & JSS Learners');
              setEvtCoordinator(actorName);
              setEvtStatus('Upcoming');
              setEvtDesc('');
              setShowEventModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Library Event</span>
          </button>
        </div>

        <div className="space-y-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-base text-slate-900">{evt.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      {evt.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    📅 {evt.date} · ⏰ {evt.time} · 📍 {evt.venue}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                    {evt.status}
                  </span>
                  {onUpdateEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(evt.id);
                        setEvtTitle(evt.title);
                        setEvtType(evt.type);
                        setEvtDate(evt.date);
                        setEvtTime(evt.time);
                        setEvtVenue(evt.venue);
                        setEvtAudience(evt.targetAudience);
                        setEvtCoordinator(evt.coordinator);
                        setEvtStatus(evt.status);
                        setEvtDesc(evt.description);
                        setShowEventModal(true);
                      }}
                      className="px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                  {onDeleteEvent && (
                    confirmDeleteEventId === evt.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteEvent(evt.id);
                            setConfirmDeleteEventId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEventId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteEventId(evt.id)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )
                  )}
                </div>
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

        {/* Add / Edit Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingEventId ? 'Edit Library Event' : 'Create Library Event / Programme'}
                </h4>
                <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input type="text" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                  <select value={evtType} onChange={(e) => setEvtType(e.target.value as LibraryEvent['type'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="Book Fair">Book Fair</option>
                    <option value="Author Visit">Author Visit</option>
                    <option value="Spelling Bee">Spelling Bee</option>
                    <option value="Storytelling Day">Storytelling Day</option>
                    <option value="Literacy Workshop">Literacy Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select value={evtStatus} onChange={(e) => setEvtStatus(e.target.value as LibraryEvent['status'])} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={evtDate} onChange={(e) => setEvtDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time</label>
                  <input type="text" value={evtTime} onChange={(e) => setEvtTime(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                  <input type="text" value={evtVenue} onChange={(e) => setEvtVenue(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coordinator</label>
                  <input type="text" value={evtCoordinator} onChange={(e) => setEvtCoordinator(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <input type="text" value={evtAudience} onChange={(e) => setEvtAudience(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!evtTitle.trim()) return;
                    if (editingEventId && onUpdateEvent) {
                      onUpdateEvent(editingEventId, {
                        title: evtTitle.trim(),
                        type: evtType,
                        date: evtDate,
                        time: evtTime.trim(),
                        venue: evtVenue.trim(),
                        targetAudience: evtAudience.trim(),
                        coordinator: evtCoordinator.trim(),
                        status: evtStatus,
                        description: evtDesc.trim()
                      });
                    } else {
                      onAddEvent({
                        id: `evt-${Date.now()}`,
                        title: evtTitle.trim(),
                        type: evtType,
                        date: evtDate,
                        time: evtTime.trim(),
                        venue: evtVenue.trim(),
                        targetAudience: evtAudience.trim(),
                        coordinator: evtCoordinator.trim(),
                        status: evtStatus,
                        description: evtDesc.trim()
                      });
                    }
                    setShowEventModal(false);
                    setEditingEventId(null);
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg cursor-pointer"
                >
                  {editingEventId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
