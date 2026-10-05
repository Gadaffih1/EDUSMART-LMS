import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  SchoolBus, 
  TransportRoute, 
  StudentTransportProfile, 
  TransportTripRecord, 
  TransportIncident, 
  TransportAlert,
  TripType,
  BoardingStatus,
  GradeLevel,
  StreamName
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Bus, 
  Route, 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  Bell, 
  DollarSign, 
  FileText, 
  Radio, 
  Navigation, 
  Check, 
  X, 
  Eye, 
  Sparkles, 
  UserCheck, 
  Compass, 
  Car, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';

interface TransportWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
  isEmbedded?: boolean;
  readOnly?: boolean;
}

export const TransportWorkspace: React.FC<TransportWorkspaceProps> = ({
  currentUser,
  onLogout,
  isEmbedded = false,
  readOnly
}) => {
  // Navigation tabs
  type TransportTab = 'dashboard' | 'students' | 'fleet' | 'routes' | 'trip_manifest' | 'incidents' | 'alerts' | 'fees' | 'reports';
  const [activeTab, setActiveTab] = useState<TransportTab>('dashboard');

  const isExecutiveOrAdmin = ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher', 'hod', 'school_admin_staff', 'admin'].includes(currentUser.role);
  const isReadOnly = readOnly !== undefined ? readOnly : (currentUser.role !== 'transport_team' || isExecutiveOrAdmin);

  // State from Storage
  const [buses, setBuses] = useState<SchoolBus[]>(() => Storage.getSchoolBuses());
  const [routes, setRoutes] = useState<TransportRoute[]>(() => Storage.getTransportRoutes());
  const [students, setStudents] = useState<StudentTransportProfile[]>(() => Storage.getStudentTransportProfiles());
  const [tripRecords, setTripRecords] = useState<TransportTripRecord[]>(() => Storage.getTransportTripRecords());
  const [incidents, setIncidents] = useState<TransportIncident[]>(() => Storage.getTransportIncidents());
  const [alerts, setAlerts] = useState<TransportAlert[]>(() => Storage.getTransportAlerts());

  // Listen for storage updates
  useEffect(() => {
    const handleBuses = () => setBuses(Storage.getSchoolBuses());
    const handleRoutes = () => setRoutes(Storage.getTransportRoutes());
    const handleStudents = () => setStudents(Storage.getStudentTransportProfiles());
    const handleTrips = () => setTripRecords(Storage.getTransportTripRecords());
    const handleIncidents = () => setIncidents(Storage.getTransportIncidents());
    const handleAlerts = () => setAlerts(Storage.getTransportAlerts());

    window.addEventListener('transport-buses-updated', handleBuses);
    window.addEventListener('transport-routes-updated', handleRoutes);
    window.addEventListener('transport-students-updated', handleStudents);
    window.addEventListener('transport-trip-records-updated', handleTrips);
    window.addEventListener('transport-incidents-updated', handleIncidents);
    window.addEventListener('transport-alerts-updated', handleAlerts);

    return () => {
      window.removeEventListener('transport-buses-updated', handleBuses);
      window.removeEventListener('transport-routes-updated', handleRoutes);
      window.removeEventListener('transport-students-updated', handleStudents);
      window.removeEventListener('transport-trip-records-updated', handleTrips);
      window.removeEventListener('transport-incidents-updated', handleIncidents);
      window.removeEventListener('transport-alerts-updated', handleAlerts);
    };
  }, []);

  // Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  
  // Trip Manifest Active Controls
  const [activeTripType, setActiveTripType] = useState<TripType>('Morning Pickup');
  const [activeManifestRouteId, setActiveManifestRouteId] = useState<string>(routes[0]?.id || 'route-01');
  const todayDateString = '2026-10-04';
  const [activeTripDate, setActiveTripDate] = useState<string>(todayDateString);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddIncidentModal, setShowAddIncidentModal] = useState(false);
  const [showSendAlertModal, setShowSendAlertModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentTransportProfile | null>(null);
  const [selectedBusDetail, setSelectedBusDetail] = useState<SchoolBus | null>(null);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<TransportRoute | null>(null);
  const [printManifestMode, setPrintManifestMode] = useState<boolean>(false);
  const [printStudentCard, setPrintStudentCard] = useState<StudentTransportProfile | null>(null);

  // New Student Form
  const allEnrolledStudents = useMemo(() => {
    return Storage.getUsers().filter(u => u.role === 'student');
  }, []);
  const [newStudentId, setNewStudentId] = useState('');
  const [newRouteId, setNewRouteId] = useState(routes[0]?.id || 'route-01');
  const [newPickupStop, setNewPickupStop] = useState('');
  const [newDropoffStop, setNewDropoffStop] = useState('');
  const [newSeatNumber, setNewSeatNumber] = useState('Seat 12B');
  const [newSpecialNotes, setNewSpecialNotes] = useState('');
  const [newAuthorizedCollector, setNewAuthorizedCollector] = useState('');

  // New Incident Form
  const [newIncRoute, setNewIncRoute] = useState(routes[0]?.name || 'Route 01 – Kiambu Road');
  const [newIncBus, setNewIncBus] = useState('KDG 218M (Bus 01)');
  const [newIncType, setNewIncType] = useState<TransportIncident['incidentType']>('Traffic Delay');
  const [newIncSeverity, setNewIncSeverity] = useState<TransportIncident['severity']>('Low');
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncAction, setNewIncAction] = useState('');

  // New Alert Form
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertRouteId, setAlertRouteId] = useState(routes[0]?.id || 'route-01');
  const [alertType, setAlertType] = useState<TransportAlert['type']>('departure');

  // Metrics
  const totalTransportStudents = students.length;
  const activeBusesCount = buses.filter(b => b.inspectionStatus === 'Valid / Compliant').length;
  const totalCapacity = buses.reduce((acc, b) => acc + b.capacity, 0);
  const totalOccupancy = buses.reduce((acc, b) => acc + b.currentOccupancy, 0);
  const availableSeats = totalCapacity - totalOccupancy;
  const todayTripsCount = tripRecords.filter(t => t.date === todayDateString);
  const boardedTodayCount = todayTripsCount.filter(t => t.status === 'Boarded').length;
  const pendingFeesTotal = students.reduce((acc, s) => acc + s.balance, 0);

  // Active Manifest Students
  const activeManifestStudents = useMemo(() => {
    return students.filter(s => s.routeId === activeManifestRouteId);
  }, [students, activeManifestRouteId]);

  // Handle Quick Status Change for a student on the trip manifest
  const handleUpdateBoardingStatus = (student: StudentTransportProfile, newStatus: BoardingStatus) => {
    const existingIndex = tripRecords.findIndex(
      t => t.studentId === student.studentId && t.date === activeTripDate && t.tripType === activeTripType
    );

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentRoute = routes.find(r => r.id === activeManifestRouteId);

    if (existingIndex >= 0) {
      const existing = tripRecords[existingIndex];
      Storage.updateTransportTripRecord(existing.id, {
        status: newStatus,
        timestamp: nowTime,
        notes: `Status updated to ${newStatus} by ${currentUser.name}`
      });
    } else {
      const newRec: TransportTripRecord = {
        id: `ttr-${Date.now()}-${student.studentId}`,
        date: activeTripDate,
        tripType: activeTripType,
        routeId: activeManifestRouteId,
        routeName: currentRoute?.name || student.routeName,
        busPlate: student.busPlate,
        driverName: currentRoute?.driverName || 'Lead Driver',
        assistantName: currentRoute?.assistantName || currentUser.name,
        studentId: student.studentId,
        studentName: student.studentName,
        grade: student.grade,
        stream: student.stream,
        stopName: activeTripType === 'Morning Pickup' ? student.pickupStop : student.dropoffStop,
        status: newStatus,
        timestamp: nowTime,
        recordedBy: `${currentUser.name} (${currentUser.designation || 'Transport Team'})`,
        notes: `${newStatus} confirmed during ${activeTripType}.`
      };
      Storage.addTransportTripRecord(newRec);
    }

    // Auto generate notification for parent
    if (newStatus === 'Boarded' || newStatus === 'Safely Alighted') {
      const alertItem: TransportAlert = {
        id: `alt-${Date.now()}`,
        timestamp: `${activeTripDate} ${nowTime}`,
        routeId: activeManifestRouteId,
        busPlate: student.busPlate,
        type: newStatus === 'Boarded' ? 'boarded' : 'alighted',
        title: `${student.studentName}: ${newStatus}`,
        message: `${student.studentName} (${student.grade} ${student.stream}) has ${newStatus.toLowerCase()} ${student.busNumber} (${student.busPlate}) at ${student.pickupStop}.`,
        targetAudience: 'route_parents'
      };
      Storage.addTransportAlert(alertItem);
    }
  };

  // Submit Add Student Form
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) return;

    const studentUser = allEnrolledStudents.find(s => s.id === newStudentId);
    if (!studentUser) return;

    const selectedRoute = routes.find(r => r.id === newRouteId);
    if (!selectedRoute) return;

    const newProfile: StudentTransportProfile = {
      id: `stp-${Date.now()}`,
      studentId: studentUser.id,
      studentName: studentUser.name,
      admissionNumber: studentUser.admissionNumber || 'ADM/2026/NEW',
      grade: studentUser.grade || 4,
      stream: studentUser.stream || 'Dove',
      parentName: studentUser.parentName || 'Parent / Guardian',
      parentPhone: studentUser.parentPhone || '+254 722 000 000',
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      busPlate: selectedRoute.busPlate,
      busNumber: selectedRoute.busNumber,
      seatNumber: newSeatNumber.trim() || 'Seat 10A',
      pickupStop: newPickupStop.trim() || selectedRoute.stops[0]?.stopName || 'School Campus',
      dropoffStop: newDropoffStop.trim() || selectedRoute.stops[0]?.stopName || 'School Campus',
      morningPickupTime: selectedRoute.stops[0]?.morningPickupTime || '06:30 AM',
      afternoonDropoffTime: selectedRoute.stops[0]?.afternoonDropoffTime || '04:30 PM',
      transportStatus: 'Active',
      specialInstructions: newSpecialNotes.trim() || 'Standard campus transport protocol.',
      authorizedCollector: newAuthorizedCollector.trim() || 'Registered Parent / Guardian',
      feeStatus: 'Paid',
      termFee: selectedRoute.termFee,
      balance: 0
    };

    Storage.addStudentTransportProfile(newProfile);
    setShowAddStudentModal(false);
    setNewStudentId('');
    setNewSpecialNotes('');
    setNewAuthorizedCollector('');
  };

  // Submit Incident Form
  const handleAddIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncDesc.trim()) return;

    const newIncident: TransportIncident = {
      id: `inc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      busPlate: newIncBus,
      driverName: currentUser.name,
      route: newIncRoute,
      severity: newIncSeverity,
      incidentType: newIncType,
      description: newIncDesc.trim(),
      actionTaken: newIncAction.trim() || 'Notified transport office and parent.',
      reportedBy: `${currentUser.name} (${currentUser.designation || 'Transport Officer'})`,
      followUpStatus: 'Under Investigation',
      studentsInvolved: ['Route passengers']
    };

    Storage.addTransportIncident(newIncident);
    setShowAddIncidentModal(false);
    setNewIncDesc('');
    setNewIncAction('');
  };

  // Submit Alert Form
  const handleSendAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    const targetRoute = routes.find(r => r.id === alertRouteId);
    const newAlert: TransportAlert = {
      id: `alt-${Date.now()}`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      routeId: alertRouteId,
      busPlate: targetRoute?.busPlate || 'School Fleet',
      type: alertType,
      title: alertTitle.trim(),
      message: alertMessage.trim(),
      targetAudience: 'route_parents'
    };

    Storage.addTransportAlert(newAlert);
    setShowSendAlertModal(false);
    setAlertTitle('');
    setAlertMessage('');
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================
          OFFICIAL TRANSPORT PORTAL HEADER & IDENTITY
          ======================================================== */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🚌
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  EduSmart School Transport Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  NTSA & Speed Governor Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Fleet GPS Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>School Transport & Fleet Operations Bay</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Secure transport tracking, real-time student boarding/alighting logs, route mapping, driver assignments, parent alerts & safety governance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => setShowSendAlertModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Broadcast Alert</span>
                </button>
                <button
                  onClick={() => setShowAddIncidentModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Log Incident</span>
                </button>
              </>
            )}
            <button
              onClick={() => setPrintManifestMode(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Roster (PDF)</span>
            </button>
          </div>
        </div>

        {/* User Logged In Ribbon */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Active Operator: <strong>{currentUser.name}</strong> ({currentUser.designation || (isReadOnly ? 'Executive/Admin Audit' : 'Transport Officer')})</span>
            {currentUser.phone && (
              <span className="font-mono text-slate-400">· {currentUser.phone}</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Active Routes: <strong className="text-white">{routes.length}</strong></span>
            <span>Total Buses: <strong className="text-white">{buses.length} Coaches</strong></span>
            <span>Registered Commuters: <strong className="text-white">{students.length} Learners</strong></span>
          </div>
        </div>
      </div>

      {/* Read-Only Surveillance Notice for Executive Leadership and Admin Staff */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <span>Read-Only School Transport & Fleet Surveillance</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  No Editing Rights
                </span>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Accessible with no editing rights to Executive Leadership and Administration Staff ({currentUser.name}). Fleet operations, boarding logs, and incident reports are maintained by the Transport Team.
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono font-bold text-amber-800 bg-white/80 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
            FLEET AUDIT MODE
          </div>
        </div>
      )}

      {/* ========================================================
          NAVIGATION TABS
          ======================================================== */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>1. Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('trip_manifest')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'trip_manifest' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>2. Live Boarding & Trips</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'students' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>3. Student Profiles ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'fleet' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bus className="w-4 h-4 text-emerald-400" />
          <span>4. Fleet & Buses ({buses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'routes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Route className="w-4 h-4 text-purple-400" />
          <span>5. Routes & Stops ({routes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'alerts' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4 text-rose-400" />
          <span>6. Live Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'incidents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>7. Safety Incidents ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'fees' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>8. Transport Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>9. Reports & PDF</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: TRANSPORT DASHBOARD
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Commuters</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalTransportStudents}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Active Profiles</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Fleet Size</span>
                <Bus className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{buses.length} Buses</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">All NTSA Certified</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Fleet Capacity</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalOccupancy} / {totalCapacity}</div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">{availableSeats} Seats Available</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Active Routes</span>
                <Route className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{routes.length} Circuits</div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">11 Stops Total</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Boarded Today</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{boardedTodayCount}</div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">Morning Roll Verified</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Safety Alerts</span>
                <Bell className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{alerts.length} Today</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-1">SMS Dispatched</div>
            </div>

          </div>

          {/* Quick Route Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {routes.map(r => {
              const assignedBus = buses.find(b => b.registrationNumber === r.busPlate);
              const routeStudents = students.filter(s => s.routeId === r.id);
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                        {r.routeNumber}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold">
                        {r.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base">{r.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Assigned Bus:</span>
                        <span className="font-mono font-bold text-slate-900">{r.busPlate} ({r.busNumber})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Lead Driver:</span>
                        <span className="font-bold text-slate-900">{r.driverName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Bus Chaperone:</span>
                        <span className="font-bold text-slate-900">{r.assistantName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Schedule:</span>
                        <span className="font-semibold text-slate-700">Dep: {r.morningStartTime} · Arr: {r.morningSchoolArrivalTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Current Occupancy:</span>
                        <span className="font-bold text-slate-900">{routeStudents.length} / {assignedBus?.capacity || 33} seats</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{r.stops.length} Designated Stops</span>
                    <button
                      onClick={() => {
                        setActiveManifestRouteId(r.id);
                        setActiveTab('trip_manifest');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Take Roll</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Trip Activity & Alerts Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Live Boarding Updates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Today's Live Boarding Activity</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{activeTripDate}</span>
              </div>

              <div className="space-y-3">
                {tripRecords.slice(0, 5).map(record => (
                  <div key={record.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                        record.status === 'Boarded' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'Safely Alighted' ? 'bg-blue-100 text-blue-700' :
                        record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.status === 'Boarded' ? '✓' : record.status === 'Safely Alighted' ? '🚏' : '!'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{record.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {record.stopName} · <span className="font-mono text-slate-400">{record.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.status === 'Boarded' ? 'bg-emerald-100 text-emerald-800' :
                        record.status === 'Safely Alighted' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'Absent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {record.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{record.busPlate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety & Operations Alerts Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Automated Parent Alerts & Dispatch</h3>
                </div>
                <span className="text-xs text-slate-400">SMS / Portal Live</span>
              </div>

              <div className="space-y-3">
                {alerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <span>📢</span>
                        <span>{alert.title}</span>
                      </span>
                      <span className="font-mono text-slate-400">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{alert.message}</p>
                    <div className="mt-2 pt-1.5 border-t border-amber-100 text-[10px] text-slate-400 flex justify-between">
                      <span>Vehicle: <strong className="text-slate-600 font-mono">{alert.busPlate}</strong></span>
                      <span className="text-emerald-700 font-semibold">Delivered to Parent App & SMS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: LIVE BOARDING & TRIP MANIFEST (STUDENT ATTENDANCE ROLL)
          ======================================================== */}
      {activeTab === 'trip_manifest' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Trip Selector Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Route</label>
                <select
                  value={activeManifestRouteId}
                  onChange={(e) => setActiveManifestRouteId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeNumber} — {r.name} ({r.busPlate})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trip Session</label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTripType('Morning Pickup')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTripType === 'Morning Pickup' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌅 Morning Pickup
                  </button>
                  <button
                    onClick={() => setActiveTripType('Afternoon Drop-off')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTripType === 'Afternoon Drop-off' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌇 Afternoon Drop-off
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trip Date</label>
                <input
                  type="date"
                  value={activeTripDate}
                  onChange={(e) => setActiveTripDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintManifestMode(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Export Trip Sheet (PDF)</span>
              </button>
            </div>
          </div>

          {/* Passenger Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Passenger Boarding Manifest: {routes.find(r => r.id === activeManifestRouteId)?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1-Click roll call: Record boarding / alighting status in real-time. Automatically notifies parents.
                </p>
              </div>
              <div className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {activeManifestStudents.length} Assigned Passengers
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Learner Name & Admission</th>
                    <th className="py-3 px-4">Grade & Stream</th>
                    <th className="py-3 px-4">Designated Stop</th>
                    <th className="py-3 px-4">Scheduled Time</th>
                    <th className="py-3 px-4">Parent & Contact</th>
                    <th className="py-3 px-4">Seat #</th>
                    <th className="py-3 px-4">Current Boarding Status</th>
                    <th className="py-3 px-4 text-right">Quick Roll Call Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeManifestStudents.map(student => {
                    const existingTrip = tripRecords.find(
                      t => t.studentId === student.studentId && t.date === activeTripDate && t.tripType === activeTripType
                    );
                    const currentStatus: BoardingStatus = existingTrip?.status || 'Waiting';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{student.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{student.admissionNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          Grade {student.grade} · {student.stream}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {activeTripType === 'Morning Pickup' ? student.pickupStop : student.dropoffStop}
                          </div>
                          {student.specialInstructions && (
                            <div className="text-[10px] text-amber-700 mt-0.5 max-w-xs truncate" title={student.specialInstructions}>
                              ⚠️ {student.specialInstructions}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                          {activeTripType === 'Morning Pickup' ? student.morningPickupTime : student.afternoonDropoffTime}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{student.parentName}</div>
                          <a href={`tel:${student.parentPhone}`} className="text-[11px] font-mono text-blue-600 hover:underline">
                            {student.parentPhone}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {student.seatNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            currentStatus === 'Boarded' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            currentStatus === 'Safely Alighted' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            currentStatus === 'Absent' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            currentStatus === 'Parent Transported' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                            <span>{currentStatus === 'Boarded' ? '●' : currentStatus === 'Safely Alighted' ? '✓' : currentStatus === 'Absent' ? '✕' : '○'}</span>
                            <span>{currentStatus}</span>
                          </span>
                          {existingTrip?.timestamp && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              at {existingTrip.timestamp}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isReadOnly ? (
                            <span className="text-[11px] font-mono text-slate-400 italic">Audit view</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {activeTripType === 'Morning Pickup' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateBoardingStatus(student, 'Boarded')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    currentStatus === 'Boarded'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                  title="Mark as Boarded"
                                >
                                  Boarded
                                </button>
                                <button
                                  onClick={() => handleUpdateBoardingStatus(student, 'Absent')}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    currentStatus === 'Absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title="Mark Absent from Pickup"
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleUpdateBoardingStatus(student, 'Parent Transported')}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    currentStatus === 'Parent Transported'
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Parent dropped to school"
                                >
                                  Private
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleUpdateBoardingStatus(student, 'Boarded')}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    currentStatus === 'Boarded'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  }`}
                                  title="Onboarded at School"
                                >
                                  On Bus
                                </button>
                                <button
                                  onClick={() => handleUpdateBoardingStatus(student, 'Safely Alighted')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    currentStatus === 'Safely Alighted'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  }`}
                                  title="Handed over to authorized collector"
                                >
                                  Alighted
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 3: STUDENT TRANSPORT PROFILES
          ======================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or parent..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={selectedRouteFilter}
                onChange={(e) => setSelectedRouteFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Routes</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Grades</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                  <option key={g} value={g.toString()}>Grade {g}</option>
                ))}
              </select>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Student to Transport</span>
              </button>
            )}
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students
              .filter(s => {
                if (studentSearch.trim()) {
                  const q = studentSearch.toLowerCase();
                  if (!s.studentName.toLowerCase().includes(q) && !s.admissionNumber.toLowerCase().includes(q) && !s.parentName.toLowerCase().includes(q)) return false;
                }
                if (selectedRouteFilter !== 'all' && s.routeId !== selectedRouteFilter) return false;
                if (selectedGradeFilter !== 'all' && s.grade.toString() !== selectedGradeFilter) return false;
                return true;
              })
              .map(student => (
                <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold font-mono">
                        {student.admissionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        {student.transportStatus}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base">{student.studentName}</h4>
                    <div className="text-xs text-slate-500 font-medium">Grade {student.grade} · {student.stream}</div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-[11px] text-slate-500">Route & Bus Assignment:</div>
                        <div className="font-bold text-slate-900">{student.routeName}</div>
                        <div className="text-slate-600 font-mono text-[11px]">
                          Coach: <strong>{student.busPlate}</strong> ({student.busNumber}) · Seat: <strong>{student.seatNumber}</strong>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                        <div className="text-[11px] text-amber-900 font-semibold">Designated Stops:</div>
                        <div className="text-slate-800 font-medium flex items-center justify-between">
                          <span>Pickup: <strong>{student.pickupStop}</strong></span>
                          <span className="font-mono text-slate-500">{student.morningPickupTime}</span>
                        </div>
                        <div className="text-slate-800 font-medium flex items-center justify-between">
                          <span>Drop-off: <strong>{student.dropoffStop}</strong></span>
                          <span className="font-mono text-slate-500">{student.afternoonDropoffTime}</span>
                        </div>
                      </div>

                      <div className="text-slate-600 text-[11px] pt-1">
                        <div>Parent: <strong>{student.parentName}</strong> ({student.parentPhone})</div>
                        {student.authorizedCollector && (
                          <div className="text-slate-500 mt-0.5">Collector: {student.authorizedCollector}</div>
                        )}
                        {student.specialInstructions && (
                          <div className="text-rose-700 font-semibold mt-0.5">Note: {student.specialInstructions}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedStudentDetail(student)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Dossier</span>
                    </button>
                    <button
                      onClick={() => setPrintStudentCard(student)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-amber-200"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bus Pass (PDF)</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 4: FLEET & BUS MANAGEMENT
          ======================================================== */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">School Bus Fleet & Roadworthiness Compliance</h3>
              <p className="text-xs text-slate-500">Inspection status, speed governor calibration, GPS tracking, and safety equipment logs.</p>
            </div>
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Fleet Compliant with NTSA Safety Standards</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buses.map(bus => (
              <div key={bus.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      {bus.registrationNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {bus.inspectionStatus}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-lg">{bus.busNumber} · {bus.model}</h4>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{bus.assignedRouteName}</div>

                  {/* Occupancy Progress */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Capacity Utilization:</span>
                      <span className="text-slate-900 font-bold">{bus.currentOccupancy} / {bus.capacity} seats</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${(bus.currentOccupancy / bus.capacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      {bus.capacity - bus.currentOccupancy} seats available
                    </div>
                  </div>

                  {/* Crew & Safety Details */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Driver:</span>
                      <span className="font-bold text-slate-900">{bus.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Driver Phone:</span>
                      <a href={`tel:${bus.driverPhone}`} className="text-blue-600 font-mono font-bold hover:underline">
                        {bus.driverPhone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assistant / Chaperone:</span>
                      <span className="font-bold text-slate-900">{bus.assistantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Speed Governor:</span>
                      <span className="font-semibold text-emerald-700">{bus.speedGovernorStatus}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GPS Tracker:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                        {bus.gpsTrackingStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current Location:</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[180px]">{bus.currentLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Insurance Expiry:</span>
                      <span className="font-mono text-slate-700">{bus.insuranceExpiry}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Next Service: {bus.nextServiceDue}</span>
                  <button
                    onClick={() => setSelectedBusDetail(bus)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    View Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 5: ROUTES & STOPS
          ======================================================== */}
      {activeTab === 'routes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Designated Transport Circuits & Stops</h3>
              <p className="text-xs text-slate-500">Scheduled pickup/drop-off sequence, designated landmarks, and student passenger density.</p>
            </div>
          </div>

          <div className="space-y-6">
            {routes.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-mono text-xs font-bold">
                        {r.routeNumber}
                      </span>
                      <h4 className="font-black text-slate-900 text-base">{r.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-400">Bus: </span>
                      <strong className="text-slate-900 font-mono">{r.busPlate}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-400">Term Fee: </span>
                      <strong className="text-emerald-700">KES {r.termFee.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Stops Timeline */}
                <div className="mt-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Pickup & Drop-off Sequential Stops:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {r.stops.map((stop, idx) => (
                      <div key={stop.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {stop.studentCount} Students
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{stop.stopName}</div>
                        <div className="text-[11px] text-slate-500">{stop.landmark}</div>
                        <div className="pt-2 border-t border-slate-200/60 flex justify-between text-[11px] font-mono font-semibold">
                          <span className="text-amber-800">AM: {stop.morningPickupTime}</span>
                          <span className="text-slate-600">PM: {stop.afternoonDropoffTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 6: LIVE ALERTS & NOTIFICATIONS
          ======================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Transport Alerts & Parent Notifications Dispatch</h3>
              <p className="text-xs text-slate-500">Live communication logs sent to parents via SMS, mobile app notifications, and email.</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setShowSendAlertModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Send New Alert</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
                    📢
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{alert.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        {alert.busPlate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{alert.message}</p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Timestamp: <strong className="font-mono text-slate-600">{alert.timestamp}</strong></span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">Delivered to Parents</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 7: SAFETY & INCIDENT REGISTER
          ======================================================== */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Transport Safety & Incident Log</h3>
              <p className="text-xs text-slate-500">Official log of traffic delays, safety checks, student behavior reports, and corrective actions taken.</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setShowAddIncidentModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Incident</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {incidents.map(inc => (
              <div key={inc.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                      inc.severity === 'Critical' ? 'bg-rose-600 text-white' :
                      inc.severity === 'High' ? 'bg-orange-600 text-white' :
                      inc.severity === 'Medium' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {inc.severity} Severity
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{inc.incidentType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>{inc.date} · {inc.time}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans font-bold text-[10px]">
                      {inc.followUpStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Incident Description:</span>
                    <p className="text-slate-800 leading-relaxed">{inc.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Action Taken & Resolution:</span>
                    <p className="text-emerald-900 leading-relaxed font-medium bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      {inc.actionTaken}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                  <div>Reported By: <strong className="text-slate-700">{inc.reportedBy}</strong></div>
                  <div>Bus / Route: <strong className="text-slate-700 font-mono">{inc.busPlate} · {inc.route}</strong></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 8: TRANSPORT FEES
          ======================================================== */}
      {activeTab === 'fees' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Transport Fee Ledger & Billing Overview</h3>
              <p className="text-xs text-slate-500">Route-based termly billing, payment tracking, receipts, and balance statements.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Total Billed</div>
                <div className="text-lg font-black text-emerald-900">
                  KES {students.reduce((acc, s) => acc + s.termFee, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-right">
                <div className="text-[10px] text-amber-800 font-bold uppercase">Outstanding Balance</div>
                <div className="text-lg font-black text-amber-900">
                  KES {pendingFeesTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Learner Name</th>
                    <th className="py-3 px-4">Admission</th>
                    <th className="py-3 px-4">Route & Bus</th>
                    <th className="py-3 px-4">Term Fee</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Parent Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.admissionNumber}</td>
                      <td className="py-3 px-4 text-slate-700">{s.routeName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">KES {s.termFee.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {s.balance === 0 ? 'KES 0 (Nil)' : `KES ${s.balance.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          s.feeStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.feeStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600">
                        {s.parentPhone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 9: REPORTS & PDF GENERATOR
          ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Transport Reports & Official Dossier Downloads</h3>
            <p className="text-xs text-slate-500 mt-1">
              Generate printable, audit-ready PDF documents for NTSA compliance, Board of Management reviews, and daily driver clipboards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg mb-3">
                    📋
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Daily Trip Attendance Sheet</h4>
                  <p className="text-xs text-slate-500 mt-1">Morning & evening passenger checkoff roster with chaperone sign-off.</p>
                </div>
                <button
                  onClick={() => setPrintManifestMode(true)}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg mb-3">
                    🚌
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Fleet Compliance Dossier</h4>
                  <p className="text-xs text-slate-500 mt-1">Inspection stickers, speed governor calibrations, insurance policy certificates.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg mb-3">
                    🗺️
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Route Master Register</h4>
                  <p className="text-xs text-slate-500 mt-1">Full stop-by-stop schedule with GPS landmarks and assigned student counts.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-lg mb-3">
                    ⚠️
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Safety & Incident Summary</h4>
                  <p className="text-xs text-slate-500 mt-1">Quarterly safety review with resolutions, parent notifications, and driver training notes.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate PDF</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          MODAL: ASSIGN STUDENT TO TRANSPORT
          ======================================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <EduSmartGadsaLogo variant="emblem" size="sm" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">Assign Learner to School Transport</h3>
                  <p className="text-xs text-slate-500">Select learner, route circuit, designated pickup/drop-off stop & seat.</p>
                </div>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Enrolled Student *</label>
                <select
                  required
                  value={newStudentId}
                  onChange={(e) => {
                    setNewStudentId(e.target.value);
                    const st = allEnrolledStudents.find(s => s.id === e.target.value);
                    if (st) {
                      setNewAuthorizedCollector(st.parentName || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Student --</option>
                  {allEnrolledStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.admissionNumber || 'No ADM'}) · Grade {st.grade} {st.stream}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Route *</label>
                  <select
                    value={newRouteId}
                    onChange={(e) => setNewRouteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seat Assignment</label>
                  <input
                    type="text"
                    value={newSeatNumber}
                    onChange={(e) => setNewSeatNumber(e.target.value)}
                    placeholder="e.g. Seat 12B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Morning Pickup Stop *</label>
                  <input
                    type="text"
                    required
                    value={newPickupStop}
                    onChange={(e) => setNewPickupStop(e.target.value)}
                    placeholder="e.g. Ridgeways Mall Total Station"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Evening Drop-off Stop *</label>
                  <input
                    type="text"
                    required
                    value={newDropoffStop}
                    onChange={(e) => setNewDropoffStop(e.target.value)}
                    placeholder="e.g. Ridgeways Mall Total Station"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Person(s) for Collection</label>
                <input
                  type="text"
                  value={newAuthorizedCollector}
                  onChange={(e) => setNewAuthorizedCollector(e.target.value)}
                  placeholder="e.g. Mr. David Otieno (Father) or Mrs. Hellen Otieno (Mother)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Instructions & Medical Notes</label>
                <textarea
                  value={newSpecialNotes}
                  onChange={(e) => setNewSpecialNotes(e.target.value)}
                  placeholder="e.g. Mild motion sickness - front seats required. Carries asthma inhaler in school bag."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Transport Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RECORD SAFETY INCIDENT
          ======================================================== */}
      {showAddIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Record Transport Safety Incident</h3>
                  <p className="text-xs text-slate-500">Official log for vehicle delays, unauthorized collectors, or mechanical alerts.</p>
                </div>
              </div>
              <button onClick={() => setShowAddIncidentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncidentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Route Circuit</label>
                  <select
                    value={newIncRoute}
                    onChange={(e) => setNewIncRoute(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Coach</label>
                  <select
                    value={newIncBus}
                    onChange={(e) => setNewIncBus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {buses.map(b => (
                      <option key={b.id} value={`${b.registrationNumber} (${b.busNumber})`}>
                        {b.registrationNumber} ({b.busNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incident Classification</label>
                  <select
                    value={newIncType}
                    onChange={(e) => setNewIncType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Traffic Delay">Traffic Delay</option>
                    <option value="Mechanical Glitch">Mechanical Glitch</option>
                    <option value="Minor Misbehaviour">Minor Misbehaviour</option>
                    <option value="Medical Concern">Medical Concern</option>
                    <option value="Unauthorized Collector Attempt">Unauthorized Collector Attempt</option>
                    <option value="Weather Obstacle">Weather Obstacle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={newIncSeverity}
                    onChange={(e) => setNewIncSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Low">Low (Informative)</option>
                    <option value="Medium">Medium (Parent Contacted)</option>
                    <option value="High">High (Immediate Action Required)</option>
                    <option value="Critical">Critical (Executive Escalation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newIncDesc}
                  onChange={(e) => setNewIncDesc(e.target.value)}
                  placeholder="Describe location, circumstances, and people involved..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Immediate Action Taken *</label>
                <textarea
                  required
                  rows={2}
                  value={newIncAction}
                  onChange={(e) => setNewIncAction(e.target.value)}
                  placeholder="Corrective actions taken by driver/chaperone..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddIncidentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Log Safety Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SEND BROADCAST ALERT
          ======================================================== */}
      {showSendAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Broadcast Transport Alert</h3>
                  <p className="text-xs text-slate-500">Send real-time SMS & Portal notifications to parents on this route.</p>
                </div>
              </div>
              <button onClick={() => setShowSendAlertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAlertSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Route Circuit</label>
                <select
                  value={alertRouteId}
                  onChange={(e) => setAlertRouteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeNumber} — {r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Category</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="departure">Route Departure Notification</option>
                  <option value="delayed">Traffic / Weather Delay Notice</option>
                  <option value="arrived_school">Safe School Arrival Confirmation</option>
                  <option value="alighted">Afternoon Drop-off Status</option>
                  <option value="emergency">Emergency / Route Deviation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Title *</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="e.g. Bus 01 Safe Campus Arrival Confirmed"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message to Parents *</label>
                <textarea
                  required
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type clear message regarding commute status..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSendAlertModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Send Broadcast SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINTABLE MODAL: TRIP MANIFEST ROSTER (PDF)
          ======================================================== */}
      {printManifestMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Transport Manifest Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setPrintManifestMode(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Institutional Document */}
            <div className="space-y-6 text-slate-900">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <EduSmartGadsaLogo variant="full" size="md" />
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                      EduSmart Academy International
                    </h2>
                    <div className="text-xs text-slate-600 font-medium">Department of Student Transport & Fleet Safety</div>
                    <div className="text-[11px] font-mono text-slate-500">P.O. Box 45120-00100 Nairobi · transport@edusmart.ac.ke</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-md border border-amber-300 uppercase">
                    Daily Trip Sheet
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">{activeTripDate}</div>
                </div>
              </div>

              {/* Trip Metadata Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Route</span>
                  <span className="font-bold text-slate-900">{routes.find(r => r.id === activeManifestRouteId)?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Session</span>
                  <span className="font-bold text-amber-900">{activeTripType}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Bus</span>
                  <span className="font-mono font-bold text-slate-900">
                    {routes.find(r => r.id === activeManifestRouteId)?.busPlate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Driver & Chaperone</span>
                  <span className="font-semibold text-slate-900">
                    {routes.find(r => r.id === activeManifestRouteId)?.driverName}
                  </span>
                </div>
              </div>

              {/* Passenger List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Learner Name</th>
                      <th className="py-2.5 px-3">Adm #</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Stop</th>
                      <th className="py-2.5 px-3">Seat</th>
                      <th className="py-2.5 px-3">Boarding Status</th>
                      <th className="py-2.5 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeManifestStudents.map((st, i) => {
                      const tripRec = tripRecords.find(
                        t => t.studentId === st.studentId && t.date === activeTripDate && t.tripType === activeTripType
                      );
                      return (
                        <tr key={st.id} className="font-medium">
                          <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{st.studentName}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{st.admissionNumber}</td>
                          <td className="py-2 px-3 text-slate-700">Gr {st.grade} {st.stream}</td>
                          <td className="py-2 px-3 text-slate-800">{activeTripType === 'Morning Pickup' ? st.pickupStop : st.dropoffStop}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{st.seatNumber}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{tripRec?.status || 'Waiting'}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{tripRec?.timestamp || '--:--'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-slate-200">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-8">Lead Driver Confirmation</div>
                  <div className="border-b border-slate-400 w-48 mb-1"></div>
                  <div className="font-bold text-slate-900">{routes.find(r => r.id === activeManifestRouteId)?.driverName}</div>
                  <div className="text-[10px] text-slate-500">Professional PSV Driver</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-8">Bus Chaperone Sign-off</div>
                  <div className="border-b border-slate-400 w-48 mb-1"></div>
                  <div className="font-bold text-slate-900">{routes.find(r => r.id === activeManifestRouteId)?.assistantName}</div>
                  <div className="text-[10px] text-slate-500">Student Roll Call Officer</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: STUDENT BUS PASS (PDF)
          ======================================================== */}
      {printStudentCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Student Bus Pass
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pass</span>
                </button>
                <button onClick={() => setPrintStudentCard(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Pass Design */}
            <div className="border-2 border-amber-500 rounded-2xl p-5 bg-gradient-to-br from-amber-50 via-white to-slate-50 text-slate-900 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3 mb-3">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                  Term 1 Commuter Pass
                </span>
              </div>

              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-amber-200 mx-auto flex items-center justify-center text-2xl font-black text-amber-900 border-2 border-amber-400 mb-2">
                  {printStudentCard.studentName.charAt(0)}
                </div>
                <h3 className="font-black text-slate-900 text-lg">{printStudentCard.studentName}</h3>
                <div className="text-xs font-mono font-bold text-slate-600">{printStudentCard.admissionNumber}</div>
                <div className="text-xs text-amber-800 font-bold mt-0.5">
                  Grade {printStudentCard.grade} · {printStudentCard.stream} Stream
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route:</span>
                  <span className="font-bold text-slate-900 text-right">{printStudentCard.routeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coach:</span>
                  <span className="font-mono font-bold text-slate-900">{printStudentCard.busPlate} ({printStudentCard.busNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat Number:</span>
                  <span className="font-mono font-bold text-amber-900">{printStudentCard.seatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Stop:</span>
                  <span className="font-semibold text-slate-800 text-right">{printStudentCard.pickupStop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Phone:</span>
                  <span className="font-mono font-bold text-blue-700">{printStudentCard.parentPhone}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200 text-center text-[10px] text-slate-400 font-mono">
                Speed Governor & NTSA Safety Compliant · Valid 2026 Academic Year
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: STUDENT DOSSIER VIEW
          ======================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <EduSmartGadsaLogo variant="emblem" size="sm" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Student Transport Profile</span>
                  <h3 className="font-black text-slate-900 text-base">{selectedStudentDetail.studentName}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedStudentDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudentDetail.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Class & Stream</span>
                  <span className="font-bold text-slate-900">Grade {selectedStudentDetail.grade} · {selectedStudentDetail.stream}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Bus</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudentDetail.busPlate} ({selectedStudentDetail.busNumber})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Allocated Seat</span>
                  <span className="font-mono font-bold text-amber-900">{selectedStudentDetail.seatNumber}</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                <div className="font-bold text-amber-900">Route & Stop Details:</div>
                <div>Route: <strong>{selectedStudentDetail.routeName}</strong></div>
                <div>Morning Pickup: <strong>{selectedStudentDetail.pickupStop}</strong> ({selectedStudentDetail.morningPickupTime})</div>
                <div>Afternoon Drop-off: <strong>{selectedStudentDetail.dropoffStop}</strong> ({selectedStudentDetail.afternoonDropoffTime})</div>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">Guardian & Collector Information:</div>
                <div>Parent / Guardian: <strong>{selectedStudentDetail.parentName}</strong></div>
                <div>Emergency Contact: <a href={`tel:${selectedStudentDetail.parentPhone}`} className="font-mono font-bold text-blue-600">{selectedStudentDetail.parentPhone}</a></div>
                <div>Authorized Collectors: <strong>{selectedStudentDetail.authorizedCollector}</strong></div>
                {selectedStudentDetail.specialInstructions && (
                  <div className="text-rose-700 font-semibold">Special Instructions: {selectedStudentDetail.specialInstructions}</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const st = selectedStudentDetail;
                    setSelectedStudentDetail(null);
                    setPrintStudentCard(st);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bus Pass (PDF)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
