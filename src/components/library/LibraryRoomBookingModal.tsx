import React, { useState, useMemo } from 'react';
import { 
  User, 
  LibraryRoom, 
  LibraryRoomBooking, 
  LibraryTimetableSlot,
  GradeLevel,
  StreamName,
  SubjectName,
  PRIMARY_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Calendar, 
  Clock, 
  DoorOpen, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Users, 
  BookOpen, 
  Sparkles, 
  Check, 
  Trash2, 
  CalendarCheck, 
  Printer, 
  Search, 
  Filter,
  Info,
  ShieldAlert,
  ChevronRight,
  Tv,
  Tablet,
  LayoutGrid,
  FileText
} from 'lucide-react';

interface LibraryRoomBookingModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: LibraryRoomBooking) => void;
}

// Standard school periods matching the bell schedule
export interface BookingPeriod {
  periodNum: number;
  label: string;
  startTime: string; // "08:00"
  endTime: string;   // "08:40"
  displayTime: string; // "08:00 AM - 08:40 AM"
}

export const BOOKING_PERIODS: BookingPeriod[] = [
  { periodNum: 1, label: 'Period 1 (Morning Core)', startTime: '08:00', endTime: '08:40', displayTime: '08:00 AM - 08:40 AM' },
  { periodNum: 2, label: 'Period 2 (Core Instruction)', startTime: '08:40', endTime: '09:20', displayTime: '08:40 AM - 09:20 AM' },
  { periodNum: 3, label: 'Period 3 (STEM & Numeracy)', startTime: '09:20', endTime: '10:00', displayTime: '09:20 AM - 10:00 AM' },
  { periodNum: 4, label: 'Period 4 (Language Arts)', startTime: '10:00', endTime: '10:40', displayTime: '10:00 AM - 10:40 AM' },
  { periodNum: 5, label: 'Period 5 (Social & Applied Sciences)', startTime: '11:10', endTime: '11:50', displayTime: '11:10 AM - 11:50 AM' },
  { periodNum: 6, label: 'Period 6 (Creative & Practical)', startTime: '11:50', endTime: '12:30', displayTime: '11:50 AM - 12:30 PM' },
  { periodNum: 7, label: 'Period 7 (Science & Pre-Technical)', startTime: '12:30', endTime: '13:10', displayTime: '12:30 PM - 01:10 PM' },
  { periodNum: 8, label: 'Period 8 (Specialist & Lab)', startTime: '14:10', endTime: '14:50', displayTime: '02:10 PM - 02:50 PM' },
  { periodNum: 9, label: 'Period 9 (Afternoon Core Study)', startTime: '14:50', endTime: '15:30', displayTime: '02:50 PM - 03:30 PM' },
  { periodNum: 11, label: 'Period 11 (Late Remedial / Prep)', startTime: '15:45', endTime: '16:45', displayTime: '03:45 PM - 04:45 PM' },
];

const DAYS_OF_WEEK: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

// Helper to convert time strings ("08:20 AM", "08:20", "14:10") to total minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const numPart = cleaned.replace(/[A-Z\s]/g, '');
  const [hStr, mStr] = numPart.split(':');
  let h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

// Check time overlap between two intervals
function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a1 = parseTimeToMinutes(startA);
  const a2 = parseTimeToMinutes(endA);
  const b1 = parseTimeToMinutes(startB);
  const b2 = parseTimeToMinutes(endB);
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export const LibraryRoomBookingModal: React.FC<LibraryRoomBookingModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onBookingSuccess
}) => {
  const rooms = useMemo(() => Storage.getLibraryRooms(), []);
  const [activeTab, setActiveTab] = useState<'book' | 'matrix' | 'my_bookings'>('book');

  // Bookings & timetable state
  const [allBookings, setAllBookings] = useState<LibraryRoomBooking[]>(() => Storage.getLibraryRoomBookings());
  const [timetableSlots, setTimetableSlots] = useState<LibraryTimetableSlot[]>(() => Storage.getLibraryTimetable());

  // Form inputs
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || 'room-main-hall');
  const [bookingDate, setBookingDate] = useState<string>(() => {
    // Default to tomorrow or next weekday
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedPeriodNum, setSelectedPeriodNum] = useState<number>(3);
  
  // Requester fields
  const [teacherName, setTeacherName] = useState(currentUser.name);
  const [subject, setSubject] = useState<string>(currentUser.assignedSubjects?.[0] || 'Integrated Science');
  const [grade, setGrade] = useState<GradeLevel>((currentUser.grade as GradeLevel) || 4);
  const [stream, setStream] = useState<string>(currentUser.stream ? `Grade ${currentUser.grade || 4} ${currentUser.stream}` : 'Grade 4 Dove');
  const [purpose, setPurpose] = useState('CBC Research & Digital Learning Practicum');
  const [learnersCount, setLearnersCount] = useState<number>(32);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([
    'Interactive Smart Screen',
    'High-Speed CBC Tablets'
  ]);
  const [notes, setNotes] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState<LibraryRoomBooking | null>(null);

  // Filter for my bookings
  const [bookingsFilter, setBookingsFilter] = useState<'all' | 'mine'>('all');

  // Sync with storage events
  React.useEffect(() => {
    const handleBookingsUpdate = () => setAllBookings(Storage.getLibraryRoomBookings());
    const handleTimetableUpdate = () => setTimetableSlots(Storage.getLibraryTimetable());

    window.addEventListener('library-room-bookings-updated', handleBookingsUpdate);
    window.addEventListener('library-timetable-updated', handleTimetableUpdate);
    return () => {
      window.removeEventListener('library-room-bookings-updated', handleBookingsUpdate);
      window.removeEventListener('library-timetable-updated', handleTimetableUpdate);
    };
  }, []);

  // Selected Room Object
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  // Derive day of week from selected booking date
  const selectedDayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' = useMemo(() => {
    if (!bookingDate) return 'Monday';
    const dayIdx = new Date(bookingDate + 'T00:00:00').getDay();
    // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    if (dayIdx === 1) return 'Monday';
    if (dayIdx === 2) return 'Tuesday';
    if (dayIdx === 3) return 'Wednesday';
    if (dayIdx === 4) return 'Thursday';
    if (dayIdx === 5) return 'Friday';
    return 'Monday'; // fallback for weekends
  }, [bookingDate]);

  const selectedPeriod = BOOKING_PERIODS.find(p => p.periodNum === selectedPeriodNum) || BOOKING_PERIODS[2];

  // Helper function to check if a specific slot has a conflict with a Library Lesson or existing Booking
  const checkSlotStatus = (
    roomId: string, 
    roomName: string, 
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', 
    dateStr: string,
    period: BookingPeriod
  ): {
    status: 'lesson_conflict' | 'already_booked' | 'available';
    lesson?: LibraryTimetableSlot;
    booking?: LibraryRoomBooking;
    reason?: string;
  } => {
    // 1. Check Library Lessons from timetable
    // A library lesson occurs if:
    // - slot day matches
    // - slot venue matches roomName OR session is general library session held in that venue
    // - time interval overlaps
    const conflictingLesson = timetableSlots.find(slot => {
      if (slot.dayOfWeek !== day) return false;
      
      const venueMatches = 
        slot.venue.toLowerCase().includes(roomName.toLowerCase()) || 
        roomName.toLowerCase().includes(slot.venue.toLowerCase()) ||
        (roomName.includes('Main') && slot.venue.includes('Main')) ||
        (roomName.includes('Digital') && slot.venue.includes('Digital'));

      if (!venueMatches) return false;

      return timesOverlap(period.startTime, period.endTime, slot.startTime, slot.endTime);
    });

    if (conflictingLesson) {
      return {
        status: 'lesson_conflict',
        lesson: conflictingLesson,
        reason: `Scheduled Library Lesson in progress: Grade ${conflictingLesson.grade} ${conflictingLesson.stream} (${conflictingLesson.sessionType} - Led by ${conflictingLesson.teacherInCharge})`
      };
    }

    // 2. Check existing confirmed bookings
    const conflictingBooking = allBookings.find(b => {
      if (b.status === 'cancelled') return false;
      if (b.date !== dateStr) return false;
      if (b.roomId !== roomId && b.roomName !== roomName) return false;
      return timesOverlap(period.startTime, period.endTime, b.startTime, b.endTime);
    });

    if (conflictingBooking) {
      return {
        status: 'already_booked',
        booking: conflictingBooking,
        reason: `Already reserved by ${conflictingBooking.bookedByName} (${conflictingBooking.purpose})`
      };
    }

    return { status: 'available' };
  };

  // Check status for the currently selected configuration
  const currentSlotConflict = checkSlotStatus(
    selectedRoom.id, 
    selectedRoom.name, 
    selectedDayOfWeek, 
    bookingDate, 
    selectedPeriod
  );

  // Available equipment options
  const equipmentOptions = [
    'Interactive Smart Screen',
    'High-Speed CBC Tablets',
    'Ceiling Projector & Screen',
    'Magnetic Whiteboards & Markers',
    'Reference Encyclopedias & Atlases',
    'Audio Headsets (Language lab)',
    'CBC Science Experiment Trays'
  ];

  const handleToggleEquipment = (eq: string) => {
    setEquipmentNeeded(prev => 
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: strictly forbid spots with library lessons or existing bookings
    if (currentSlotConflict.status !== 'available') {
      alert(`Cannot book: ${currentSlotConflict.reason}`);
      return;
    }

    if (learnersCount > selectedRoom.capacity) {
      alert(`Learners count (${learnersCount}) exceeds room capacity (${selectedRoom.capacity}). Please select a larger room or reduce count.`);
      return;
    }

    const newBooking: LibraryRoomBooking = {
      id: `lrb-${Date.now()}`,
      bookingRef: `LRB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomCapacity: selectedRoom.capacity,
      date: bookingDate,
      dayOfWeek: selectedDayOfWeek,
      startTime: selectedPeriod.displayTime.split(' - ')[0],
      endTime: selectedPeriod.displayTime.split(' - ')[1],
      periodLabel: selectedPeriod.label,
      bookedByUserId: currentUser.id,
      bookedByName: teacherName,
      bookedByRole: currentUser.role,
      grade,
      stream,
      subject,
      purpose,
      learnersCount: Number(learnersCount),
      equipmentNeeded,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      notes: notes.trim()
    };

    Storage.addLibraryRoomBooking(newBooking);

    // Add Library Audit Log
    Storage.addLibraryAuditLog({
      id: `aud-${Date.now()}`,
      action: 'Library Room Reserved',
      performedBy: currentUser.name,
      role: currentUser.role,
      timestamp: new Date().toISOString(),
      details: `Booked "${selectedRoom.name}" on ${bookingDate} (${selectedPeriod.label}) for ${stream} - ${purpose}`
    });

    setAllBookings(Storage.getLibraryRoomBookings());
    setBookingSubmitted(newBooking);
    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
  };

  const handleCancelBooking = (id: string) => {
    if (confirm('Are you sure you want to cancel this library room reservation? The spot will immediately become available for others.')) {
      Storage.cancelLibraryRoomBooking(id);
      setAllBookings(Storage.getLibraryRoomBookings());
    }
  };

  // Filtered bookings
  const displayedBookings = allBookings.filter(b => {
    if (bookingsFilter === 'mine') {
      return b.bookedByUserId === currentUser.id || b.bookedByName === currentUser.name;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-200 shadow-inner">
              <DoorOpen className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500 text-white uppercase tracking-wider">
                  Facility Reservation Console
                </span>
                <span className="text-xs text-purple-200 font-semibold hidden sm:inline">
                  CBC Learning Spaces
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Library Room & Learning Space Booking
              </h2>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Authorized for <strong className="text-white">School Librarian</strong> and <strong className="text-white">Subject Teachers</strong> · Only open on vacant spots without library lessons
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Policy Ribbon */}
        <div className="bg-purple-50 border-b border-purple-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-purple-900">
            <span className="font-semibold text-slate-600">Active User:</span>
            <span className="font-black bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
              {currentUser.name} ({currentUser.role === 'librarian' ? 'Head Librarian' : 'Subject Teacher'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-purple-800 font-medium">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Strict Rule: Spots with scheduled class library lessons are locked & non-bookable</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('book'); setBookingSubmitted(null); }}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'book'
                ? 'bg-white text-purple-900 border-slate-200 -mb-px font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-purple-600" />
            <span>1. Book a Spot</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'matrix'
                ? 'bg-white text-purple-900 border-slate-200 -mb-px font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-purple-600" />
            <span>2. Weekly Spot Availability Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'my_bookings'
                ? 'bg-white text-purple-900 border-slate-200 -mb-px font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>3. Active Reservations ({allBookings.filter(b => b.status === 'confirmed').length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: BOOK A SPOT */}
          {activeTab === 'book' && (
            <div>
              {bookingSubmitted ? (
                /* Success Confirmation View */
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                      Spot Successfully Reserved!
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      Library Room Booking Confirmed
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
                      Your booking has been registered in the school system and added to the official facility schedule.
                    </p>
                  </div>

                  {/* Booking Summary Pass Card */}
                  <div className="bg-white rounded-2xl border border-emerald-200 p-5 text-left max-w-xl mx-auto shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Booking Reference</div>
                        <div className="font-mono text-sm font-black text-purple-700">{bookingSubmitted.bookingRef}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        CONFIRMED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Room / Space:</span>
                        <div className="font-bold text-slate-900">{bookingSubmitted.roomName}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Date & Period:</span>
                        <div className="font-bold text-slate-900">{bookingSubmitted.date} ({bookingSubmitted.dayOfWeek})</div>
                        <div className="text-[11px] text-purple-700 font-semibold">{bookingSubmitted.periodLabel} · {bookingSubmitted.startTime} - {bookingSubmitted.endTime}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Teacher In-Charge:</span>
                        <div className="font-bold text-slate-900">{bookingSubmitted.bookedByName}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Class & Subject:</span>
                        <div className="font-bold text-slate-900">{bookingSubmitted.stream} · {bookingSubmitted.subject}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Session Purpose:</span>
                      <div className="font-bold text-slate-900 mt-0.5">{bookingSubmitted.purpose}</div>
                    </div>

                    {bookingSubmitted.equipmentNeeded.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">Reserved Equipment:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {bookingSubmitted.equipmentNeeded.map((eq, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded font-semibold text-[10px]">
                              ✓ {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Entry Pass</span>
                    </button>
                    <button
                      onClick={() => setBookingSubmitted(null)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      + Book Another Spot
                    </button>
                    <button
                      onClick={() => setActiveTab('my_bookings')}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      View All Reservations
                    </button>
                  </div>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleConfirmBooking} className="space-y-6 text-xs">
                  
                  {/* Step 1: Choose Room */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-purple-600" />
                        <span>Step 1: Select Library Facility / Room</span>
                      </label>
                      <span className="text-slate-500 text-[11px] font-medium">
                        Capacity: {selectedRoom.capacity} learners max
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rooms.map(rm => {
                        const isSelected = rm.id === selectedRoomId;
                        return (
                          <div
                            key={rm.id}
                            onClick={() => setSelectedRoomId(rm.id)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-600/20'
                                : 'border-slate-200 hover:border-purple-300 bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-900 text-xs">
                                  {rm.name}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  Cap: {rm.capacity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {rm.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-purple-700 font-medium">📍 {rm.location}</span>
                              {isSelected && (
                                <span className="font-bold text-purple-800 flex items-center gap-0.5">
                                  <Check className="w-3.5 h-3.5 text-purple-600" /> Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Date & Period with Live Spot Verification */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <label className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Step 2: Select Date & Time Period</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Date Input */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Reservation Date
                        </label>
                        <input
                          type="date"
                          value={bookingDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                          required
                        />
                        <div className="text-[11px] text-purple-700 font-semibold mt-1">
                          Day: <strong>{selectedDayOfWeek}</strong>
                        </div>
                      </div>

                      {/* Period Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Timetable Period / Bell Slot
                        </label>
                        <select
                          value={selectedPeriodNum}
                          onChange={(e) => setSelectedPeriodNum(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        >
                          {BOOKING_PERIODS.map(p => {
                            const statusCheck = checkSlotStatus(selectedRoom.id, selectedRoom.name, selectedDayOfWeek, bookingDate, p);
                            let tag = '';
                            if (statusCheck.status === 'lesson_conflict') tag = ' [🚫 Lesson in Room]';
                            if (statusCheck.status === 'already_booked') tag = ' [⚠️ Already Booked]';
                            return (
                              <option key={p.periodNum} value={p.periodNum}>
                                {p.label} · {p.displayTime} {tag}
                              </option>
                            );
                          })}
                        </select>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Active slot: <span className="font-bold text-slate-800">{selectedPeriod.displayTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* SPOT STATUS VERIFICATION BANNER (CRITICAL REQUIREMENT) */}
                    <div className="pt-2">
                      {currentSlotConflict.status === 'lesson_conflict' ? (
                        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl p-4 flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-black text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🚫 Spot Locked: Scheduled Library Lesson In Progress</span>
                            </div>
                            <p className="text-xs text-rose-900 font-bold mt-1">
                              {currentSlotConflict.reason}
                            </p>
                            <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                              In accordance with school policy, library rooms can <strong>only be booked on vacant spots without scheduled library lessons</strong>. Please choose another period or another room.
                            </p>
                          </div>
                        </div>
                      ) : currentSlotConflict.status === 'already_booked' ? (
                        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-black text-xs text-amber-800 uppercase tracking-wider">
                              ⚠️ Spot Unavailable: Already Reserved
                            </div>
                            <p className="text-xs text-amber-900 font-bold mt-1">
                              {currentSlotConflict.reason}
                            </p>
                            <p className="text-[11px] text-amber-700 mt-1">
                              This room is already confirmed for another educator. Please choose a different period or room.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-black text-xs text-emerald-800 uppercase tracking-wider">
                              ✅ Spot Verified & Free: No Scheduled Library Lessons
                            </div>
                            <p className="text-xs text-emerald-900 font-medium mt-0.5">
                              {selectedRoom.name} is completely vacant during <strong>{selectedPeriod.label} ({selectedPeriod.displayTime})</strong> on {selectedDayOfWeek}. Clear to book!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Requester & Session Details */}
                  <div className="space-y-4">
                    <label className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Step 3: Session Details & CBC Subject Group</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Teacher / Requester Name
                        </label>
                        <input
                          type="text"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Subject / Learning Area
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Science & Tech, Math, English"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Class / Stream
                        </label>
                        <input
                          type="text"
                          value={stream}
                          onChange={(e) => setStream(e.target.value)}
                          placeholder="e.g. Grade 4 Dove"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Session Purpose & Learning Objective
                        </label>
                        <input
                          type="text"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="e.g. CBC Research Practicum, Audio-Visual Screening"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Expected Number of Learners (Max {selectedRoom.capacity})
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={selectedRoom.capacity}
                          value={learnersCount}
                          onChange={(e) => setLearnersCount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Equipment Checklist */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Required Library Equipment & Resources
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {equipmentOptions.map((eq, idx) => {
                          const isChecked = equipmentNeeded.includes(eq);
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => handleToggleEquipment(eq)}
                              className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                isChecked
                                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <span>{eq}</span>
                              {isChecked ? (
                                <Check className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Special Instructions or Setup Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Please arrange desks in horseshoe format for debate."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Submission Footer */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-slate-500 text-[11px]">
                      {currentSlotConflict.status === 'available' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Spot verified: Available for immediate confirmation
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          Cannot proceed: Spot has a scheduling conflict
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={currentSlotConflict.status !== 'available'}
                        className={`w-1/2 sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                          currentSlotConflict.status === 'available'
                            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer hover:shadow-purple-500/25'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        <CalendarCheck className="w-4 h-4" />
                        <span>Confirm & Reserve Room</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: WEEKLY SPOT AVAILABILITY MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Comprehensive Library Timetable & Spot Availability Grid
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live overview of scheduled curriculum library reading lessons vs open spots available for booking.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Lesson (Locked)
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Booked
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free Spot
                  </span>
                </div>
              </div>

              {/* Day-by-Day Slot Matrix */}
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  return (
                    <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="bg-slate-900 text-white px-4 py-2.5 font-black text-xs flex items-center justify-between">
                        <span className="uppercase tracking-wider">{day} Schedule</span>
                        <span className="text-[11px] text-purple-300 font-semibold">
                          {selectedRoom.name}
                        </span>
                      </div>

                      <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {BOOKING_PERIODS.slice(0, 10).map((period) => {
                          const status = checkSlotStatus(selectedRoom.id, selectedRoom.name, day, bookingDate, period);
                          const isLesson = status.status === 'lesson_conflict';
                          const isBooked = status.status === 'already_booked';

                          return (
                            <div
                              key={period.periodNum}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between ${
                                isLesson
                                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                                  : isBooked
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span>P{period.periodNum}</span>
                                  <span className="font-mono text-[9px]">{period.startTime}</span>
                                </div>
                                <div className="text-[11px] font-bold mt-1 line-clamp-1">
                                  {period.label.split('(')[0]}
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
                                {isLesson ? (
                                  <div>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 font-bold text-[9px]">
                                      LESSON
                                    </span>
                                    <div className="font-bold text-[10px] mt-1 text-rose-900 truncate">
                                      {status.lesson?.stream}
                                    </div>
                                    <div className="text-[9px] text-rose-700 truncate">
                                      {status.lesson?.teacherInCharge}
                                    </div>
                                  </div>
                                ) : isBooked ? (
                                  <div>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-bold text-[9px]">
                                      RESERVED
                                    </span>
                                    <div className="font-bold text-[10px] mt-1 text-amber-900 truncate">
                                      {status.booking?.bookedByName}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-black text-[9px]">
                                      AVAILABLE
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPeriodNum(period.periodNum);
                                        setActiveTab('book');
                                      }}
                                      className="mt-1.5 w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black transition-colors cursor-pointer"
                                    >
                                      Book Spot
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE RESERVATIONS REGISTRY */}
          {activeTab === 'my_bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Confirmed Library Room Reservations Registry
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Authorized bookings submitted by Subject Teachers and Library Staff.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBookingsFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      bookingsFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Reservations ({allBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingsFilter('mine')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      bookingsFilter === 'mine'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    My Bookings
                  </button>
                </div>
              </div>

              {displayedBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No reservations found under this filter.</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Create New Reservation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedBookings.map((bk) => (
                    <div 
                      key={bk.id}
                      className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all ${
                        bk.status === 'cancelled' ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-purple-700">
                              {bk.bookingRef}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              bk.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {bk.status}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {bk.roomName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            📅 {bk.date} ({bk.dayOfWeek}) · ⏰ {bk.startTime} - {bk.endTime} · 🏷️ {bk.periodLabel}
                          </div>
                        </div>

                        {bk.status === 'confirmed' && (
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              onClick={() => handleCancelBooking(bk.id)}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400 font-medium">Booked By:</span>
                          <div className="font-bold text-slate-900">{bk.bookedByName}</div>
                          <div className="text-[10px] text-purple-700 capitalize">{bk.bookedByRole.replace('_', ' ')}</div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-medium">Learners & Subject:</span>
                          <div className="font-bold text-slate-900">{bk.stream} · {bk.subject}</div>
                          <div className="text-[10px] text-slate-500">{bk.learnersCount} Learners Attending</div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-medium">Session Objective:</span>
                          <div className="font-medium text-slate-800 line-clamp-2">{bk.purpose}</div>
                        </div>
                      </div>

                      {bk.equipmentNeeded && bk.equipmentNeeded.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                          {bk.equipmentNeeded.map((eq, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              ✓ {eq}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
