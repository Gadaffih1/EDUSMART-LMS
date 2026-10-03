import React, { useState } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  GateExitPass, 
  GatePassStatus,
  getStreamsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  LogOut, 
  ShieldCheck, 
  Search, 
  Clock, 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  User as UserIcon, 
  Phone, 
  Calendar, 
  Car, 
  Check, 
  KeyRound,
  Filter,
  Eye,
  Plus,
  RefreshCw,
  School
} from 'lucide-react';

interface StudentGateExitProps {
  currentUser: User;
}

export const StudentGateExit: React.FC<StudentGateExitProps> = ({ currentUser }) => {
  const allUsers = Storage.getUsers();
  const allStudents = allUsers.filter(u => u.role === 'student');

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [admissionNo, setAdmissionNo] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentUser.grade || 4);
  const [selectedStream, setSelectedStream] = useState<StreamName>(currentUser.stream || 'Dove');

  const [departureDate, setDepartureDate] = useState<string>('2026-10-01');
  const [departureTime, setDepartureTime] = useState<string>('11:30 AM');
  const [notReturningToday, setNotReturningToday] = useState<boolean>(false);
  const [expectedReturnTime, setExpectedReturnTime] = useState<string>('02:00 PM');
  
  const [reasonCategory, setReasonCategory] = useState<string>('Medical clinic visit');
  const [reasonDetails, setReasonDetails] = useState<string>('');

  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('+254 ');
  const [guardianRelationship, setGuardianRelationship] = useState<string>('Parent / Father');
  const [guardianIdNumber, setGuardianIdNumber] = useState<string>('');
  const [transportMode, setTransportMode] = useState<string>('Private Vehicle');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');

  // Status & Feedback states
  const [createdPass, setCreatedPass] = useState<GateExitPass | null>(null);
  const [passToViewOrPrint, setPassToViewOrPrint] = useState<GateExitPass | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter & Search states for the status tracking database ledger
  const [statusFilter, setStatusFilter] = useState<'all' | GatePassStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // When teacher selects a student from dropdown
  const handleSelectStudent = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = allStudents.find(s => s.id === stuId);
    if (stu) {
      setStudentName(stu.name);
      setAdmissionNo(stu.admissionNumber || '');
      if (stu.grade) setSelectedGrade(stu.grade);
      if (stu.stream) setSelectedStream(stu.stream);
    }
  };

  // Quick button to set departure time to now
  const setTimeToCurrent = () => {
    const now = new Date();
    const formatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setDepartureTime(formatted);
  };

  // Submit and create new gate exit pass
  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !guardianName.trim() || !guardianPhone.trim()) {
      alert('Please provide student name, guardian name, and phone contact.');
      return;
    }

    const streamInitial = selectedStream.charAt(0);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const gatePassCode = `GP-${selectedGrade}${streamInitial}-${randomCode}`;

    const newPass: GateExitPass = {
      id: `gep-${Date.now()}`,
      studentId: selectedStudentId || `stu-custom-${Date.now()}`,
      studentName: studentName.trim(),
      admissionNumber: admissionNo.trim() || undefined,
      grade: selectedGrade,
      stream: selectedStream,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      tscNumber: currentUser.tscNumber || 'TSC/44120/ED',
      departureDate,
      departureTime,
      expectedReturnTime: notReturningToday ? 'Not Returning Today' : expectedReturnTime,
      reason: reasonDetails.trim() ? `${reasonCategory} - ${reasonDetails.trim()}` : reasonCategory,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianRelationship,
      guardianIdNumber: guardianIdNumber.trim() || undefined,
      transportMode: vehiclePlate.trim() ? `${transportMode} (${vehiclePlate.trim()})` : transportMode,
      gatePassCode,
      status: 'active', // default authorized active
      approvedAt: new Date().toLocaleString('en-KE', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    Storage.addGatePass(newPass);
    setCreatedPass(newPass);
    setFeedbackMsg(`Gate Pass ${gatePassCode} generated and authorized for ${studentName}!`);

    // Reset form fields
    setSelectedStudentId('');
    setStudentName('');
    setAdmissionNo('');
    setReasonDetails('');
    setGuardianName('');
    setGuardianPhone('+254 ');
    setGuardianIdNumber('');
    setVehiclePlate('');

    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Status transitions
  const handleTransitionStatus = (
    passId: string, 
    newStatus: GatePassStatus, 
    returnTimeStr?: string
  ) => {
    Storage.updateGatePassStatus(passId, newStatus, {
      actualReturnTime: returnTimeStr,
      securityRemarks: `Status updated to ${newStatus} by ${currentUser.name}`
    });
    setFeedbackMsg(`Gate Pass status updated to ${newStatus.toUpperCase()}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Ledger records from storage
  const passes = Storage.getGatePasses();

  // Filtered passes by status and search
  const filteredPasses = passes.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = 
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gatePassCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.guardianPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Campus Safety & Security Protocol</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Student Gate Exit Authorization & Tracking System
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Log official student departures, record verified guardian credentials, and track departure/return statuses in the real-time security database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs">
            <div className="text-[10px] font-bold uppercase text-rose-700">Active Passes Outside</div>
            <div className="text-xl font-extrabold font-mono text-rose-900 mt-0.5">
              {passes.filter(p => p.status === 'active' || p.status === 'departed').length}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <div className="text-[10px] font-bold uppercase text-emerald-700">Returned Today</div>
            <div className="text-xl font-extrabold font-mono text-emerald-900 mt-0.5">
              {passes.filter(p => p.status === 'returned').length}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-950 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          {createdPass && (
            <button
              onClick={() => setPassToViewOrPrint(createdPass)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
            >
              Print Gate Slip
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Gate Exit Form (Left) & Database Status Column Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ========================================================
            COLUMN 1: THE STUDENT GATE EXIT FORM (5 COLS)
            ======================================================== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Log New Student Gate Exit</span>
              </h3>
              <p className="text-xs text-slate-500">Authorized by {currentUser.name}</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded uppercase">
              Official Pass
            </span>
          </div>

          <form onSubmit={handleCreatePass} className="space-y-4 text-xs">
            
            {/* Quick Student Selection */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Select Enrolled Student or Type Name
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- Choose from Enrolled Students --</option>
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Grade {s.grade} {s.stream}) - {s.admissionNumber || 'No ADM'}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Brian Otieno"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Admission No.</label>
                  <input
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    placeholder="e.g. ADM/2026/0412"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Grade</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setSelectedGrade(g);
                      setSelectedStream(getStreamsForGrade(g)[0]);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Stream</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value as StreamName)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {getStreamsForGrade(selectedGrade).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Departure Timings */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Departure & Expected Return
                </span>
                <button
                  type="button"
                  onClick={setTimeToCurrent}
                  className="text-[10px] text-rose-700 hover:underline font-bold"
                >
                  Set to Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Departure Time *</label>
                  <input
                    type="text"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="11:30 AM"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-500 font-semibold">Expected Return</label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notReturningToday}
                      onChange={(e) => setNotReturningToday(e.target.checked)}
                      className="rounded text-rose-600"
                    />
                    <span>Released for day</span>
                  </label>
                </div>
                {!notReturningToday && (
                  <input
                    type="text"
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                    placeholder="e.g. 02:30 PM"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                )}
              </div>
            </div>

            {/* Departure Reason */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Reason for Departure *
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 mb-1.5"
              >
                <option value="Medical clinic visit">Medical Clinic / Doctor Visit</option>
                <option value="Sudden illness / Sanatorium referral">Sudden Illness / Sanatorium Referral</option>
                <option value="Dental appointment">Dental Appointment</option>
                <option value="Family emergency">Family Emergency</option>
                <option value="Official school competition">Official School Activity / Competition</option>
                <option value="Parental signed request">Parent Written Request</option>
                <option value="Special compassionate leave">Special Compassionate Leave</option>
              </select>
              <input
                type="text"
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Additional notes / clinic name / explanation..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Guardian & Transport Details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Authorized Guardian Details *
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Guardian Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Grace Otieno"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Relationship</label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                    <option value="Authorized Relative">Authorized Relative</option>
                    <option value="Designated Driver">Designated Family Driver</option>
                    <option value="Hospital Ambulance Staff">Medical / Ambulance Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Phone Contact *</label>
                  <input
                    type="text"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">ID / Passport Number</label>
                  <input
                    type="text"
                    value={guardianIdNumber}
                    onChange={(e) => setGuardianIdNumber(e.target.value)}
                    placeholder="National ID: 2981..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Transport Mode</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Private Vehicle">Private Vehicle</option>
                    <option value="Walking with Guardian">Walking with Guardian</option>
                    <option value="School Bus / Van">School Van</option>
                    <option value="Registered Taxi">Taxi / Uber</option>
                    <option value="Ambulance">Ambulance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Vehicle Plate (if driving)</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. KDF 412X"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Authorize Exit & Generate Gate Pass</span>
            </button>
          </form>
        </div>

        {/* ========================================================
            COLUMN 2: DATABASE STATUS TRACKING COLUMN & LEDGER (7 COLS)
            ======================================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Campus Gate Exit Ledger & Status Tracking</span>
              </h3>
              <p className="text-xs text-slate-500">Live synchronization with school gate security station</p>
            </div>

            <div className="text-xs font-mono font-bold text-slate-700">
              {filteredPasses.length} Record(s) Found
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({passes.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'active' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({passes.filter(p => p.status === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('departed')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'departed' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Departed ({passes.filter(p => p.status === 'departed').length})
              </button>
              <button
                onClick={() => setStatusFilter('returned')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'returned' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Returned ({passes.filter(p => p.status === 'returned').length})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'overdue' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overdue ({passes.filter(p => p.status === 'overdue').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or code..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Database Table with Status Tracking Column */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Pass Code</th>
                  <th className="py-3 px-3">Student & Stream</th>
                  <th className="py-3 px-3">Departure / Return</th>
                  <th className="py-3 px-3">Guardian Details</th>
                  <th className="py-3 px-3 text-center">Status Column</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No gate passes match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Pass Code */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {p.gatePassCode}
                          </span>
                        </td>

                        {/* Student Details */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{p.studentName}</div>
                          <div className="text-[11px] text-slate-500">
                            Grade {p.grade} ({p.stream}) · {p.admissionNumber || 'ADM/STD'}
                          </div>
                        </td>

                        {/* Departure & Expected Return */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="text-slate-800 font-bold">Dep: {p.departureTime}</div>
                          <div className="text-slate-500">
                            Exp: {p.expectedReturnTime || 'Released for day'}
                          </div>
                          {p.actualReturnTime && (
                            <div className="text-emerald-700 font-bold">Ret: {p.actualReturnTime}</div>
                          )}
                        </td>

                        {/* Guardian Details */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{p.guardianName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{p.guardianPhone}</div>
                          <div className="text-[10px] text-slate-400 italic">{p.reason}</div>
                        </td>

                        {/* STATUS TRACKING COLUMN IN DATABASE */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              p.status === 'active'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : p.status === 'departed'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : p.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : p.status === 'overdue'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <span 
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.status === 'active' 
                                  ? 'bg-amber-500 animate-pulse' 
                                  : p.status === 'departed' 
                                  ? 'bg-purple-600 animate-pulse'
                                  : p.status === 'returned'
                                  ? 'bg-emerald-600'
                                  : 'bg-rose-600'
                              }`} 
                            />
                            <span>{p.status}</span>
                          </span>
                        </td>

                        {/* Interactive Status Transition & Print Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Print Slip */}
                            <button
                              type="button"
                              onClick={() => setPassToViewOrPrint(p)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                              title="View & Print Official Gate Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Status controls */}
                            {p.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(p.id, 'departed')}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold"
                              >
                                Departed
                              </button>
                            )}

                            {p.status === 'departed' && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    handleTransitionStatus(p.id, 'returned', nowTime);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs"
                                >
                                  Return
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTransitionStatus(p.id, 'overdue')}
                                  className="px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold"
                                  title="Mark Overdue"
                                >
                                  Overdue
                                </button>
                              </div>
                            )}

                            {p.status === 'overdue' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                  handleTransitionStatus(p.id, 'returned', nowTime);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs"
                              >
                                Mark Returned
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: OFFICIAL PRINTABLE STUDENT GATE EXIT PASS
          ======================================================== */}
      {passToViewOrPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden print:m-0 print:border-none print:shadow-none">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 ml-2">
                  Gate Security Clearance
                </span>
              </div>
              <button
                onClick={() => setPassToViewOrPrint(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Printable Pass Body */}
            <div className="p-6 space-y-4 bg-white text-xs">
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-2">
                  <EduSmartGadsaLogo variant="full" size="sm" />
                </div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                  Edu-Smart PORTAL · By Gadsa Systems
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Student Gate Exit Pass
                </h3>
                <div className="font-mono text-xs font-bold text-rose-700">
                  Authorization Code: {passToViewOrPrint.gatePassCode}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Valid for Single Exit · Verified at Main Gate
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">Database Status:</span>
                <span className="font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {passToViewOrPrint.status}
                </span>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student Name</span>
                  <strong className="text-sm text-slate-900 block">{passToViewOrPrint.studentName}</strong>
                  <span className="text-slate-500 font-mono text-[11px]">ADM: {passToViewOrPrint.admissionNumber || 'ADM/2026/0412'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Grade & Stream</span>
                  <strong className="text-sm text-slate-900 block">Grade {passToViewOrPrint.grade} ({passToViewOrPrint.stream})</strong>
                  <span className="text-slate-500 text-[11px]">Class Teacher: {passToViewOrPrint.teacherName}</span>
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-semibold block">Departure Time</span>
                  <strong className="text-slate-900">{passToViewOrPrint.departureTime} ({passToViewOrPrint.departureDate || '2026-10-01'})</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-semibold block">Expected Return</span>
                  <strong className="text-rose-800">{passToViewOrPrint.expectedReturnTime || 'End of Day'}</strong>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Departure Reason</span>
                <p className="text-slate-900 font-medium">{passToViewOrPrint.reason}</p>
              </div>

              {/* Guardian Verification */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Authorized Collecting Guardian</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{passToViewOrPrint.guardianName} ({passToViewOrPrint.guardianRelationship || 'Guardian'})</span>
                  <span className="font-mono text-slate-700">{passToViewOrPrint.guardianPhone}</span>
                </div>
                {passToViewOrPrint.guardianIdNumber && (
                  <div className="text-[11px] text-slate-500 font-mono">ID No: {passToViewOrPrint.guardianIdNumber}</div>
                )}
                {passToViewOrPrint.transportMode && (
                  <div className="text-[11px] text-slate-500">Transport: {passToViewOrPrint.transportMode}</div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <div>Authorizing Teacher:</div>
                  <strong className="text-slate-900 block mt-0.5">{passToViewOrPrint.teacherName}</strong>
                  <div className="font-mono">TSC: {passToViewOrPrint.tscNumber || 'TSC/44120/ED'}</div>
                </div>
                <div className="text-right">
                  <div>Gate Security Officer:</div>
                  <div className="mt-4 border-b border-slate-400 w-32 ml-auto" />
                  <div className="mt-0.5">Signature & Security Stamp</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPassToViewOrPrint(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Gate Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
