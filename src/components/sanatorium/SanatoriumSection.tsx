import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  SanatoriumRecord, 
  SanatoriumDisposition, 
  GradeLevel, 
  StreamName,
  PRIMARY_STREAMS,
  JUNIOR_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  HeartPulse, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  Thermometer, 
  Activity, 
  Phone, 
  FileText, 
  Bed, 
  Ambulance, 
  LogOut, 
  X, 
  Check, 
  Eye, 
  Stethoscope, 
  Pill, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Download
} from 'lucide-react';

interface SanatoriumSectionProps {
  currentUser: User;
  canRecord?: boolean;
  filterStudentId?: string; // Strictly for specific parent
  allowedStudentIds?: string[]; // Strictly restrict to parent's children
  filterGrade?: GradeLevel; // For class teacher
  filterStream?: StreamName; // For class teacher
  title?: string;
  subtitle?: string;
}

const COMMON_SYMPTOMS = [
  'High Fever',
  'Severe Headache',
  'Abdominal Pain / Cramps',
  'Nausea & Vomiting',
  'Asthma / Wheezing',
  'Sports Abrasion / Cut',
  'Sprain / Joint Pain',
  'Dizziness / Fainting',
  'Eye Redness / Irritation',
  'Allergic Reaction',
  'Epistaxis (Nosebleed)',
  'Chest Tightness'
];

export const SanatoriumSection: React.FC<SanatoriumSectionProps> = ({
  currentUser,
  canRecord = false,
  filterStudentId,
  allowedStudentIds,
  filterGrade,
  filterStream,
  title = "School Sanatorium & Health Bay",
  subtitle = "Official medical register: Student clinic attendance logs, nurse in-charge notes, vital signs, and clinical recommendations."
}) => {
  // Executive leadership (Head Teacher, Deputy Head, Dean of Studies) & Nurse Officer have full school-wide view
  const isNurseOfficer = currentUser.email === 'nurse@edusmart.ac.ke' || 
    (Boolean(currentUser.designation) && currentUser.designation!.toLowerCase().includes('nurse'));
  const effectiveCanRecord = canRecord && isNurseOfficer;

  // Strict Role-Based Privacy Scoping:
  // 1. Executive Full View: Head Teacher, Deputy Head, Dean of Studies (and Clinic Nurse / Admin)
  // 2. Class Teacher: Restricted strictly to their class/stream
  // 3. Senior Teacher: Restricted strictly to his or her grade
  // 4. Parent: Restricted strictly to specific child
  const isExecutiveFullView = ['head_teacher', 'deputy_head', 'dean_of_studies', 'admin'].includes(currentUser.role) || isNurseOfficer;
  const isSeniorTeacher = currentUser.role === 'senior_teacher';
  const isClassTeacher = !isExecutiveFullView && !isSeniorTeacher && (currentUser.role === 'class_teacher' || Boolean(currentUser.stream) || Boolean(filterStream));
  const isParentUser = currentUser.role === 'parent';

  const effectiveScopeGrade = isClassTeacher 
    ? (filterGrade || currentUser.grade || 4)
    : isSeniorTeacher 
      ? (filterGrade || currentUser.grade || 8)
      : undefined;

  const effectiveScopeStream = isClassTeacher 
    ? (filterStream || currentUser.stream || 'Dove')
    : undefined;

  const isExecutiveOrAdmin = ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher', 'hod', 'school_admin_staff', 'admin'].includes(currentUser.role);
  const isReadOnlyAudit = isExecutiveOrAdmin && !isNurseOfficer;

  // For parent accounts: strictly link records to parent's registered children
  const parentChildren = useMemo(() => {
    if (isParentUser) {
      return Storage.getParentChildren(currentUser);
    }
    return [];
  }, [isParentUser, currentUser]);

  const parentRestrictedIds = useMemo(() => {
    if (isParentUser) {
      return parentChildren.map(c => c.id);
    }
    return allowedStudentIds || null;
  }, [isParentUser, parentChildren, allowedStudentIds]);

  // Load records scoped strictly by role permissions
  const loadScopedRecords = useCallback(() => {
    let raw = Storage.getSanatoriumRecords();

    // 1. Parent restriction: strictly specific child (or children if multiple)
    if (isParentUser) {
      if (filterStudentId) {
        return raw.filter(r => r.studentId === filterStudentId);
      }
      if (parentRestrictedIds && parentRestrictedIds.length > 0) {
        return raw.filter(r => parentRestrictedIds.includes(r.studentId));
      }
      return [];
    }

    // 2. Class Teacher restriction: strictly restricted to their stream
    if (isClassTeacher) {
      return raw.filter(r => r.grade === effectiveScopeGrade && r.stream === effectiveScopeStream);
    }

    // 3. Senior Teacher restriction: strictly restricted to their grade
    if (isSeniorTeacher) {
      return raw.filter(r => r.grade === effectiveScopeGrade);
    }

    // 4. Executive Leadership (Head Teacher, Deputy Head, Dean of Studies) & Nurse: Full institutional view
    if (filterGrade !== undefined) {
      raw = raw.filter(r => r.grade === filterGrade);
    }
    if (filterStream !== undefined) {
      raw = raw.filter(r => r.stream === filterStream);
    }
    if (filterStudentId !== undefined) {
      raw = raw.filter(r => r.studentId === filterStudentId);
    }
    return raw;
  }, [isParentUser, filterStudentId, parentRestrictedIds, isClassTeacher, effectiveScopeGrade, effectiveScopeStream, isSeniorTeacher, filterGrade, filterStream]);

  // All records state
  const [records, setRecords] = useState<SanatoriumRecord[]>(loadScopedRecords);

  // Listen to updates from other tabs/workspaces
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(loadScopedRecords());
    };
    window.addEventListener('sanatorium-records-updated', handleUpdate);
    return () => window.removeEventListener('sanatorium-records-updated', handleUpdate);
  }, [loadScopedRecords]);

  // Keep records in sync when props change
  useEffect(() => {
    setRecords(loadScopedRecords());
  }, [loadScopedRecords]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState<'all' | SanatoriumDisposition>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>(filterGrade ? filterGrade.toString() : 'all');
  const [streamFilter, setStreamFilter] = useState<string>(filterStream || 'all');

  // Modal states
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SanatoriumRecord | null>(null);
  const [printStudentMode, setPrintStudentMode] = useState<SanatoriumRecord | null>(null);
  const [printAllRegister, setPrintAllRegister] = useState(false);

  // New Record Form State
  const allStudents = useMemo(() => {
    return Storage.getUsers().filter(u => u.role === 'student');
  }, []);

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Form Fields
  const [formNurseInCharge, setFormNurseInCharge] = useState('Sister Grace Wambui, RN');
  const [formNurseLicense, setFormNurseLicense] = useState('NCK/RN-58921');
  const [formNurseStaffNo, setFormNurseStaffNo] = useState('SAN/002');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formArrivalTime, setFormArrivalTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [formDepartureTime, setFormDepartureTime] = useState('');
  const [formVisitReason, setFormVisitReason] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  
  // Vitals
  const [vitalTemp, setVitalTemp] = useState<string>('36.8');
  const [vitalPulse, setVitalPulse] = useState<string>('76');
  const [vitalBP, setVitalBP] = useState<string>('110/70');
  const [vitalResp, setVitalResp] = useState<string>('18');

  // Clinical treatment & disposition
  const [formTreatment, setFormTreatment] = useState('');
  const [formDisposition, setFormDisposition] = useState<SanatoriumDisposition>('treated_returned_to_class');
  const [formBedNumber, setFormBedNumber] = useState('Observation Bed #01');

  // Specific Medical Recommendations
  const [formRecommendations, setFormRecommendations] = useState('');
  const [formActivityRestrictions, setFormActivityRestrictions] = useState('Exempt from Physical Education for 48 hours; light hydration.');
  const [formFollowUpPlan, setFormFollowUpPlan] = useState('Review before afternoon classes at 02:00 PM.');
  const [formParentNotified, setFormParentNotified] = useState(true);
  const [formParentNotes, setFormParentNotes] = useState('Parent alerted via SMS and phone call.');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Search filtered students for dropdown
  const filteredStudentCandidates = useMemo(() => {
    if (!studentSearchTerm.trim()) return [];
    const q = studentSearchTerm.toLowerCase();
    return allStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [allStudents, studentSearchTerm]);

  // Handle select student in form
  const handleSelectStudent = (stu: User) => {
    setSelectedStudent(stu);
    setStudentSearchTerm(stu.name);
  };

  // Toggle symptom
  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  // Submit Sanatorium Form
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!selectedStudent) {
      errors.push('Please search and select a registered student.');
    }
    if (!formVisitReason.trim()) {
      errors.push('Please enter the primary reason for clinic visit.');
    }
    if (!formNurseInCharge.trim()) {
      errors.push('Nurse in-charge name is required.');
    }
    if (!formTreatment.trim()) {
      errors.push('Please specify clinical treatment administered.');
    }
    if (!formRecommendations.trim()) {
      errors.push('Please provide specific medical recommendations for teachers and parent.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!selectedStudent) return;

    const parentUser = Storage.getUsers().find(u => u.role === 'parent' && u.childrenIds?.includes(selectedStudent.id));
    const studentParentName = parentUser?.name || selectedStudent.parentName || 'Parent / Legal Guardian';
    const studentParentPhone = parentUser?.phone || selectedStudent.parentPhone || '+254 722 000 000';

    const newRecord: SanatoriumRecord = {
      id: `san-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      admissionNumber: selectedStudent.admissionNumber || 'ADM/PENDING',
      grade: selectedStudent.grade || 4,
      stream: selectedStudent.stream || 'Dove',
      parentName: studentParentName,
      parentPhone: studentParentPhone,
      nurseInCharge: formNurseInCharge.trim(),
      nurseLicenseNo: formNurseLicense.trim(),
      nurseStaffNo: formNurseStaffNo.trim(),
      date: formDate,
      arrivalTime: formArrivalTime,
      departureTime: formDepartureTime.trim() || (formDisposition === 'admitted_observation_bay' ? 'Resting in Bay' : '10:00 AM'),
      visitReason: formVisitReason.trim(),
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['Unspecified General Malaise'],
      vitalSigns: {
        temperature: parseFloat(vitalTemp) || 36.8,
        pulseRate: parseInt(vitalPulse) || 76,
        bloodPressure: vitalBP.trim() || '115/75',
        respiratoryRate: parseInt(vitalResp) || 18,
      },
      treatmentAdministered: formTreatment.trim(),
      disposition: formDisposition,
      bedNumber: formDisposition === 'admitted_observation_bay' ? formBedNumber : undefined,
      recommendations: formRecommendations.trim(),
      activityRestrictions: formActivityRestrictions.trim() || undefined,
      followUpPlan: formFollowUpPlan.trim() || undefined,
      parentNotified: formParentNotified,
      parentNotificationNotes: formParentNotified ? formParentNotes.trim() : undefined,
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser.name
    };

    Storage.addSanatoriumRecord(newRecord);
    setShowEntryModal(false);

    // Reset Form
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setFormVisitReason('');
    setSelectedSymptoms([]);
    setFormTreatment('');
    setFormRecommendations('');
    setFormErrors([]);
  };

  // Filtered Records List
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      const matchSearch = 
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.visitReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nurseInCharge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.recommendations.toLowerCase().includes(searchQuery.toLowerCase());

      // Disposition
      const matchDisposition = dispositionFilter === 'all' || r.disposition === dispositionFilter;

      // Date
      const matchDate = dateFilter === 'all' || r.date === dateFilter;

      // Grade
      const matchGrade = gradeFilter === 'all' || r.grade.toString() === gradeFilter;

      // Stream
      const matchStream = streamFilter === 'all' || r.stream === streamFilter;

      return matchSearch && matchDisposition && matchDate && matchGrade && matchStream;
    });
  }, [records, searchQuery, dispositionFilter, dateFilter, gradeFilter, streamFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const inObservation = records.filter(r => r.disposition === 'admitted_observation_bay').length;
    const referredHospital = records.filter(r => r.disposition === 'referred_to_hospital').length;
    const signedOutParent = records.filter(r => r.disposition === 'signed_out_to_parent').length;
    const returnedToClass = records.filter(r => r.disposition === 'treated_returned_to_class').length;
    const feverCases = records.filter(r => (r.vitalSigns?.temperature || 36.8) >= 38.0).length;

    return { total, inObservation, referredHospital, signedOutParent, returnedToClass, feverCases };
  }, [records]);

  // Unique Dates for Filter
  const availableDates = useMemo(() => {
    return Array.from(new Set(records.map(r => r.date))).sort().reverse();
  }, [records]);

  // Helper for disposition badges
  const getDispositionInfo = (disposition: SanatoriumDisposition) => {
    switch (disposition) {
      case 'treated_returned_to_class':
        return { label: 'Treated & Returned to Class', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'admitted_observation_bay':
        return { label: 'Observation Bay', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'referred_to_hospital':
        return { label: 'Referred to Hospital', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'signed_out_to_parent':
        return { label: 'Signed Out to Parent', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      default:
        return { label: 'Under Monitoring', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================
          HEADER & ACTION BAR
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Institutional Healthcare & Medical Registry</span>
            <span className="text-slate-300">·</span>
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono text-[10px]">
              Sanatorium Bay
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print/Export Button for Admin Staff & Clinic Officers */}
          <button
            onClick={() => setPrintAllRegister(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
            title="Export / Print comprehensive sanatorium register"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Export Log (PDF)</span>
          </button>

          {/* New Sanatorium Entry Form Trigger (Strictly for School Nurse; Executive Leadership & Admin have read-only access) */}
          {effectiveCanRecord && (
            <button
              onClick={() => {
                setFormErrors([]);
                setShowEntryModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record Student Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Privacy & Access Notice */}
      <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs ${
        isExecutiveFullView 
          ? 'bg-slate-900 text-white border border-slate-800' 
          : isClassTeacher
            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
            : isSeniorTeacher
              ? 'bg-blue-50 text-blue-950 border border-blue-200'
              : 'bg-rose-50 text-rose-950 border border-rose-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isExecutiveFullView ? 'bg-white/10 text-emerald-400' : 'bg-white shadow-2xs'
          }`}>
            {isExecutiveFullView ? <Eye className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>
                {isExecutiveFullView && 'Executive Surveillance & Audit Authority'}
                {isClassTeacher && `Class Teacher Confidential Scope · Grade ${effectiveScopeGrade} (${effectiveScopeStream})`}
                {isSeniorTeacher && `Senior Teacher Academic Oversight · Grade ${effectiveScopeGrade} Health Records`}
                {isParentUser && "Confidential Healthcare Record · Child Privacy Protection"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isExecutiveFullView 
                  ? 'bg-emerald-400 text-slate-950' 
                  : 'bg-white border text-slate-800'
              }`}>
                {isExecutiveFullView ? 'FULL INSTITUTIONAL VIEW' : 'STRICTLY SCOPED'}
              </span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isExecutiveFullView ? 'text-slate-300' : 'opacity-80'}`}>
              {isExecutiveFullView && 'Full institutional access authorized for Head Teacher, Deputy Head, Dean of Studies, and School Nursing Officer across all grades and streams.'}
              {isClassTeacher && `Medical privacy enforced: You are authorized to access clinical records strictly for learners enrolled in your designated stream: Grade ${effectiveScopeGrade} (${effectiveScopeStream}).`}
              {isSeniorTeacher && `Medical privacy enforced: Authorized to access clinical visit logs strictly for your supervised cohort: Grade ${effectiveScopeGrade}.`}
              {isParentUser && "Medical privacy enforced: Health records, treatments, and triage notes are strictly restricted to your registered child."}
            </div>
          </div>
        </div>
        <div className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 ${
          isExecutiveFullView ? 'bg-white/10 text-emerald-300 border border-white/20' : 'bg-white border border-slate-300 text-slate-700'
        }`}>
          {isExecutiveFullView ? 'EXECUTIVE CLEARANCE' : 'CONFIDENTIAL RBAC'}
        </div>
      </div>

      {/* ========================================================
          KEY HEALTH & CLINIC METRICS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>Total Attended</span>
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Clinic visits logged</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
            <span>Observation Bay</span>
            <Bed className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1.5 font-mono">{stats.inObservation}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Currently resting</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between">
            <span>Returned to Class</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 font-mono">{stats.returnedToClass}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Cleared for lessons</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
            <span>Signed to Parent</span>
            <LogOut className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1.5 font-mono">{stats.signedOutParent}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Sent home for care</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 flex items-center justify-between">
            <span>Hospital Referrals</span>
            <Ambulance className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1.5 font-mono">{stats.referredHospital}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Escalated care</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 flex items-center justify-between">
            <span>Febrile Illness</span>
            <Thermometer className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1.5 font-mono">{stats.feverCases}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Temp ≥ 38.0°C</div>
        </div>
      </div>

      {/* ========================================================
          SEARCH & FILTER TOOLBAR
          ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, admission no, nurse in-charge, symptoms, recommendations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Disposition Filter */}
          <select
            value={dispositionFilter}
            onChange={(e) => setDispositionFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Dispositions</option>
            <option value="treated_returned_to_class">Treated & Returned to Class</option>
            <option value="admitted_observation_bay">Observation Bay (Resting)</option>
            <option value="signed_out_to_parent">Signed Out to Parent</option>
            <option value="referred_to_hospital">Referred to Hospital</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Dates</option>
            {availableDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Grade & Stream Selectors / Locked Scopes */}
          {isExecutiveFullView && (
            <>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Grades (1–9)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>

              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Streams</option>
                {[...PRIMARY_STREAMS, ...JUNIOR_STREAMS].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}

          {isSeniorTeacher && (
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold text-xs">
                🔒 Grade {effectiveScopeGrade} Only
              </span>
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Grade {effectiveScopeGrade} Streams</option>
                {((effectiveScopeGrade || 8) <= 6 ? PRIMARY_STREAMS : JUNIOR_STREAMS).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {isClassTeacher && (
            <span className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-bold text-xs flex items-center gap-1">
              <span>🔒 Grade {effectiveScopeGrade} ({effectiveScopeStream})</span>
            </span>
          )}

          {isParentUser && (
            <span className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg font-bold text-xs flex items-center gap-1">
              <span>🔒 Registered Child Only</span>
            </span>
          )}

          {/* Clear Filters Button */}
          {(searchQuery || dispositionFilter !== 'all' || dateFilter !== 'all' || (!filterGrade && gradeFilter !== 'all')) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDispositionFilter('all');
                setDateFilter('all');
                if (!filterGrade) setGradeFilter('all');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          SANATORIUM AUDIT REGISTER TABLE
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              Official Clinic Attendance Ledger
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nurse Signature & Vitals Verified</span>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Stethoscope className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-3" />
            <div className="text-sm font-bold text-slate-700">No Clinic Attendance Records Found</div>
            <p className="text-xs mt-1">There are no sanatorium entries matching your active filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Date & Time of Visit</th>
                  <th className="py-3 px-4">Nurse In-Charge</th>
                  <th className="py-3 px-4">Symptoms / Reason</th>
                  <th className="py-3 px-4">Vitals Checked</th>
                  <th className="py-3 px-4">Disposition</th>
                  <th className="py-3 px-4">Medical Recommendations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const disp = getDispositionInfo(rec.disposition);
                  const isHighFever = (rec.vitalSigns?.temperature || 36.8) >= 38.0;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student & Class */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-900 text-sm">
                          {rec.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-slate-600 font-semibold">{rec.admissionNumber}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold">Grade {rec.grade} ({rec.stream})</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{rec.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{rec.arrivalTime} → {rec.departureTime || 'In Bay'}</span>
                        </div>
                      </td>

                      {/* Nurse In-Charge */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{rec.nurseInCharge}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {rec.nurseLicenseNo || 'Registered Nurse'}
                        </div>
                      </td>

                      {/* Symptoms & Chief Complaint */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-900 truncate" title={rec.visitReason}>
                          {rec.visitReason}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.symptoms.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              {s}
                            </span>
                          ))}
                          {rec.symptoms.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-medium">
                              +{rec.symptoms.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vitals Checked */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {rec.vitalSigns ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Thermometer className={`w-3 h-3 ${isHighFever ? 'text-rose-600' : 'text-emerald-600'}`} />
                              <span className={`font-bold ${isHighFever ? 'text-rose-700 bg-rose-50 px-1 rounded' : 'text-slate-800'}`}>
                                {rec.vitalSigns.temperature}°C
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Pulse: <span className="font-bold text-slate-700">{rec.vitalSigns.pulseRate || 76} bpm</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              BP: <span className="font-bold text-slate-700">{rec.vitalSigns.bloodPressure || '115/75'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Vitals Normal</span>
                        )}
                      </td>

                      {/* Disposition */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${disp.color}`}>
                          {disp.label}
                        </span>
                        {rec.bedNumber && (
                          <div className="text-[10px] text-amber-700 font-mono mt-0.5 font-semibold">
                            {rec.bedNumber}
                          </div>
                        )}
                      </td>

                      {/* Recommendations */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="text-slate-700 text-[11px] line-clamp-2" title={rec.recommendations}>
                          {rec.recommendations}
                        </p>
                        {rec.activityRestrictions && (
                          <div className="text-[10px] text-amber-700 font-medium mt-1 truncate" title={rec.activityRestrictions}>
                            ⚠️ {rec.activityRestrictions}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(rec)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            title="View Full Medical Record Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setPrintStudentMode(rec)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                            title="Generate Official Student Medical Slip (PDF)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: RECORD STUDENT ATTENDANCE FORM
          ======================================================== */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Record Sanatorium Attendance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Log student clinic admission, nurse in-charge, vitals, treatment, and medical recommendations.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEntryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Please resolve the following required fields:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
              
              {/* 1. STUDENT SEARCH & SELECTION */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Student Name / Admission No *</span>
                  {selectedStudent && (
                    <span className="text-emerald-700 font-bold font-mono">
                      ✓ Student Selected: Grade {selectedStudent.grade} {selectedStudent.stream}
                    </span>
                  )}
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      if (selectedStudent && e.target.value !== selectedStudent.name) {
                        setSelectedStudent(null);
                      }
                    }}
                    placeholder="Type student name (e.g. Brian Otieno, Sharon Cherono, Kelvin Kiprop)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white font-medium"
                  />
                  {filteredStudentCandidates.length > 0 && !selectedStudent && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                      {filteredStudentCandidates.map((stu) => (
                        <div
                          key={stu.id}
                          onClick={() => handleSelectStudent(stu)}
                          className="p-2.5 hover:bg-rose-50 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{stu.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {stu.admissionNumber} · Grade {stu.grade} ({stu.stream})
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. NURSE IN-CHARGE & CLINIC DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nurse In-Charge *</label>
                  <input
                    type="text"
                    value={formNurseInCharge}
                    onChange={(e) => setFormNurseInCharge(e.target.value)}
                    placeholder="e.g. Sister Grace Wambui, RN"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nurse License / Reg No</label>
                  <input
                    type="text"
                    value={formNurseLicense}
                    onChange={(e) => setFormNurseLicense(e.target.value)}
                    placeholder="e.g. NCK/RN-58921"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nurse Staff No</label>
                  <input
                    type="text"
                    value={formNurseStaffNo}
                    onChange={(e) => setFormNurseStaffNo(e.target.value)}
                    placeholder="e.g. SAN/002"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* 3. TIME OF VISIT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Visit *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Arrival Time *</label>
                  <input
                    type="text"
                    value={formArrivalTime}
                    onChange={(e) => setFormArrivalTime(e.target.value)}
                    placeholder="e.g. 09:30 AM"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departure / Discharge Time</label>
                  <input
                    type="text"
                    value={formDepartureTime}
                    onChange={(e) => setFormDepartureTime(e.target.value)}
                    placeholder="e.g. 10:15 AM (leave blank if ongoing)"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* 4. CHIEF COMPLAINT / REASON FOR VISIT */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chief Complaint / Reason for Visit *</label>
                <input
                  type="text"
                  value={formVisitReason}
                  onChange={(e) => setFormVisitReason(e.target.value)}
                  placeholder="e.g. Sudden high fever with rigors, abdominal cramps, sports knee sprain..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              {/* 5. SYMPTOMS CHECKLIST */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Observed Symptoms Checklist</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const active = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                          active
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Add custom symptom..."
                    className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSymptom}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* 6. VITAL SIGNS CHECKED */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Clinical Vital Signs (Stethoscope & Thermometer Check)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Body Temp (°C) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalTemp}
                      onChange={(e) => setVitalTemp(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={vitalPulse}
                      onChange={(e) => setVitalPulse(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Blood Pressure</label>
                    <input
                      type="text"
                      value={vitalBP}
                      onChange={(e) => setVitalBP(e.target.value)}
                      placeholder="115/75"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Resp Rate (/min)</label>
                    <input
                      type="number"
                      value={vitalResp}
                      onChange={(e) => setVitalResp(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 7. TREATMENT & DISPOSITION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Treatment Administered *</label>
                  <textarea
                    rows={2}
                    value={formTreatment}
                    onChange={(e) => setFormTreatment(e.target.value)}
                    placeholder="e.g. Paracetamol 500mg, wound dressing with povidone-iodine, cold compress, ORS..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinic Disposition *</label>
                  <select
                    value={formDisposition}
                    onChange={(e) => setFormDisposition(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="treated_returned_to_class">Treated & Returned to Class</option>
                    <option value="admitted_observation_bay">Resting in Observation Bay</option>
                    <option value="signed_out_to_parent">Signed Out to Parent / Picked Up</option>
                    <option value="referred_to_hospital">Referred to External Hospital / Emergency</option>
                  </select>

                  {formDisposition === 'admitted_observation_bay' && (
                    <input
                      type="text"
                      value={formBedNumber}
                      onChange={(e) => setFormBedNumber(e.target.value)}
                      placeholder="Bed designation e.g. Observation Bed #02"
                      className="w-full p-1.5 mt-2 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                    />
                  )}
                </div>
              </div>

              {/* 8. SPECIFIC MEDICAL RECOMMENDATIONS */}
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                <div className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Specific Medical Recommendations & Exemptions *</span>
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Clinical Remarks for Teachers & Parent *</label>
                  <textarea
                    rows={2}
                    value={formRecommendations}
                    onChange={(e) => setFormRecommendations(e.target.value)}
                    placeholder="e.g. Student experienced high fever; avoid strenuous physical strain. Re-evaluate before afternoon classes..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Activity / Sports Exemption</label>
                    <input
                      type="text"
                      value={formActivityRestrictions}
                      onChange={(e) => setFormActivityRestrictions(e.target.value)}
                      placeholder="e.g. Excused from PE & running for 48 hours"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Follow-Up Schedule</label>
                    <input
                      type="text"
                      value={formFollowUpPlan}
                      onChange={(e) => setFormFollowUpPlan(e.target.value)}
                      placeholder="e.g. Review at 02:00 PM before prep"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Parent Alert Toggle */}
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParentNotified}
                      onChange={(e) => setFormParentNotified(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 text-[11px]">Notify Parent / Guardian (Phone / SMS)</span>
                  </label>
                  {formParentNotified && (
                    <input
                      type="text"
                      value={formParentNotes}
                      onChange={(e) => setFormParentNotes(e.target.value)}
                      placeholder="Call logged with parent..."
                      className="p-1 px-2 bg-white border border-slate-300 rounded text-[11px] w-60"
                    />
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save & Record Clinic Attendance</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIEW FULL CLINICAL RECORD DOSSIER
          ======================================================== */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <EduSmartGadsaLogo variant="emblem" size="sm" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    Official Sanatorium Record
                  </span>
                  <h3 className="font-black text-slate-900 text-base">
                    Student Medical Attendance Dossier
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Student Demographics */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Learner Name</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedRecord.studentName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Admission No</span>
                  <div className="font-mono text-slate-700 font-bold">{selectedRecord.admissionNumber}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Class & Stream</span>
                  <div className="font-bold text-emerald-800">Grade {selectedRecord.grade} ({selectedRecord.stream})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Visit Date & Time</span>
                  <div className="font-mono text-slate-700">{selectedRecord.date} · {selectedRecord.arrivalTime}</div>
                </div>
              </div>

              {/* Nurse In-Charge Block */}
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-rose-900 font-bold block">Nurse In-Charge:</span>
                  <div className="font-black text-rose-950 text-sm mt-0.5">{selectedRecord.nurseInCharge}</div>
                  <div className="text-[10px] font-mono text-rose-700">
                    License: {selectedRecord.nurseLicenseNo || 'NCK Registered'} · Staff No: {selectedRecord.nurseStaffNo || 'SAN/001'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-200 text-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-600 uppercase block mt-0.5">Verified</span>
                </div>
              </div>

              {/* Chief Complaint & Symptoms */}
              <div>
                <span className="text-slate-500 font-bold block mb-1">Chief Complaint & Symptoms:</span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-900 font-medium">
                  {selectedRecord.visitReason}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedRecord.symptoms.map((s, idx) => (
                    <span key={idx} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vitals */}
              {selectedRecord.vitalSigns && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Recorded Vital Signs:</span>
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400">Temp</div>
                      <div className="font-bold text-slate-900">{selectedRecord.vitalSigns.temperature}°C</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Pulse</div>
                      <div className="font-bold text-slate-900">{selectedRecord.vitalSigns.pulseRate} bpm</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">BP</div>
                      <div className="font-bold text-slate-900">{selectedRecord.vitalSigns.bloodPressure}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Resp</div>
                      <div className="font-bold text-slate-900">{selectedRecord.vitalSigns.respiratoryRate}/min</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Administered */}
              <div>
                <span className="text-slate-500 font-bold block mb-1">Treatment Administered:</span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-800">
                  {selectedRecord.treatmentAdministered}
                </div>
              </div>

              {/* Specific Medical Recommendations */}
              <div>
                <span className="text-slate-500 font-bold block mb-1">Specific Medical Recommendations:</span>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-medium space-y-1.5">
                  <p>{selectedRecord.recommendations}</p>
                  {selectedRecord.activityRestrictions && (
                    <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1 pt-1 border-t border-amber-200">
                      <span>⚠️ Exemption:</span>
                      <span>{selectedRecord.activityRestrictions}</span>
                    </div>
                  )}
                  {selectedRecord.followUpPlan && (
                    <div className="text-[11px] text-amber-800 flex items-center gap-1">
                      <span>🕒 Follow-Up:</span>
                      <span>{selectedRecord.followUpPlan}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Notification */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Parent Notification:</span>
                  <div className="font-bold text-slate-800">
                    {selectedRecord.parentNotified ? 'Parent Alerted via Call / SMS' : 'Not Required / Routine'}
                  </div>
                  {selectedRecord.parentNotificationNotes && (
                    <div className="text-[10px] text-slate-500 mt-0.5 italic">
                      "{selectedRecord.parentNotificationNotes}"
                    </div>
                  )}
                </div>
                <Phone className={`w-5 h-5 ${selectedRecord.parentNotified ? 'text-emerald-600' : 'text-slate-300'}`} />
              </div>

            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setPrintStudentMode(selectedRecord);
                }}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINT / EXPORT MODAL: INDIVIDUAL STUDENT CLINIC SLIP
          ======================================================== */}
      {printStudentMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 print:p-0 print:border-none print:shadow-none print:m-0">
            
            {/* Action Bar (Hidden on actual print) */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-xs">
                  Print Preview · PDF Format
                </span>
                <span className="text-xs text-slate-500">Official Student Medical Visit Slip</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setPrintStudentMode(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="border-4 border-double border-slate-300 p-6 rounded-xl space-y-5 text-slate-800 font-sans">
              
              {/* Official School Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-1">
                  <EduSmartGadsaLogo variant="full" size="md" />
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                  EduSmart Academy · Institutional Sanatorium
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  P.O. Box 45120-00100 Nairobi · Tel: +254 722 000 111 · clinic@edusmart.ac.ke
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-widest rounded">
                  Official Student Medical Visit Slip & Recommendation
                </div>
              </div>

              {/* Student Demographics Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{printStudentMode.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Admission Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{printStudentMode.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Class & Stream:</span>
                  <span className="font-bold text-slate-900">Grade {printStudentMode.grade} ({printStudentMode.stream})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date & Time of Attendance:</span>
                  <span className="font-mono font-bold text-slate-900">{printStudentMode.date} at {printStudentMode.arrivalTime}</span>
                </div>
              </div>

              {/* Clinical Presentation & Vitals */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  1. Clinical Examination & Chief Complaint
                </div>
                <p className="text-slate-700">{printStudentMode.visitReason}</p>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">Observed Symptoms: </span>
                  {printStudentMode.symptoms.join(', ')}
                </div>

                {printStudentMode.vitalSigns && (
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center font-mono bg-slate-100 p-2 rounded">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Temp</span>
                      <span className="font-bold text-slate-900">{printStudentMode.vitalSigns.temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pulse</span>
                      <span className="font-bold text-slate-900">{printStudentMode.vitalSigns.pulseRate} bpm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                      <span className="font-bold text-slate-900">{printStudentMode.vitalSigns.bloodPressure}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Resp Rate</span>
                      <span className="font-bold text-slate-900">{printStudentMode.vitalSigns.respiratoryRate}/min</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Treatment Administered */}
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  2. Clinical Treatment & Disposition
                </div>
                <p className="text-slate-800">{printStudentMode.treatmentAdministered}</p>
                <div className="font-bold text-emerald-800 pt-1">
                  Clinic Disposition: {getDispositionInfo(printStudentMode.disposition).label}
                  {printStudentMode.bedNumber && ` (${printStudentMode.bedNumber})`}
                </div>
              </div>

              {/* Medical Recommendations & Exemptions */}
              <div className="space-y-2 text-xs bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                <div className="font-black text-amber-950 uppercase tracking-wider text-[11px]">
                  3. Specific Medical Recommendations for School & Home
                </div>
                <p className="text-slate-800 font-medium">{printStudentMode.recommendations}</p>
                
                {printStudentMode.activityRestrictions && (
                  <div className="font-bold text-rose-800 pt-1">
                    Activity / PE Exemption: {printStudentMode.activityRestrictions}
                  </div>
                )}
                
                {printStudentMode.followUpPlan && (
                  <div className="text-slate-700 italic">
                    Follow-Up Schedule: {printStudentMode.followUpPlan}
                  </div>
                )}
              </div>

              {/* Nurse Sign-off & Stamp */}
              <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{printStudentMode.nurseInCharge}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Registered Nursing Officer · License: {printStudentMode.nurseLicenseNo || 'NCK/RN'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Official Sanatorium Signature & Seal</div>
                </div>

                <div className="w-28 h-16 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 uppercase font-mono">
                  <span>Sanatorium</span>
                  <span>Official Stamp</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          PRINT / EXPORT MODAL: FULL SANATORIUM REGISTER REPORT
          ======================================================== */}
      {printAllRegister && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 print:p-0 print:border-none print:shadow-none print:m-0">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  School Sanatorium Attendance Register Report
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit ledger for {filteredRecords.length} recorded clinic visits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save Register (PDF)</span>
                </button>
                <button
                  onClick={() => setPrintAllRegister(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Ledger */}
            <div className="space-y-6 text-slate-900">
              
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-1">
                  <EduSmartGadsaLogo variant="full" size="md" />
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                  EduSmart Academy · Institutional Sanatorium Register
                </h1>
                <p className="text-xs text-slate-600">
                  Comprehensive Clinical Attendance, Vitals & Medical Recommendations Audit Log
                </p>
                <div className="text-[11px] font-mono font-bold text-slate-500">
                  Generated On: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} · Total Records: {filteredRecords.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 font-bold uppercase text-[9px] border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Date & Time</th>
                      <th className="p-2 border-r border-slate-300">Student & Class</th>
                      <th className="p-2 border-r border-slate-300">Nurse In-Charge</th>
                      <th className="p-2 border-r border-slate-300">Chief Complaint</th>
                      <th className="p-2 border-r border-slate-300">Vitals</th>
                      <th className="p-2 border-r border-slate-300">Disposition</th>
                      <th className="p-2">Specific Recommendations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2 font-mono border-r border-slate-200 whitespace-nowrap">
                          {r.date}<br/>{r.arrivalTime}
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="font-bold">{r.studentName}</span><br/>
                          <span className="text-slate-500 font-mono text-[10px]">{r.admissionNumber} · Gr {r.grade} {r.stream}</span>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          {r.nurseInCharge}
                        </td>
                        <td className="p-2 border-r border-slate-200 max-w-[140px]">
                          {r.visitReason}
                        </td>
                        <td className="p-2 font-mono border-r border-slate-200 text-[10px]">
                          {r.vitalSigns?.temperature}°C<br/>
                          {r.vitalSigns?.pulseRate} bpm
                        </td>
                        <td className="p-2 border-r border-slate-200 font-semibold text-[10px]">
                          {getDispositionInfo(r.disposition).label}
                        </td>
                        <td className="p-2 text-[10px]">
                          {r.recommendations}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-500">
                <div>Medical Officer In-Charge Signature: _______________________</div>
                <div>School Head Teacher Signature: _______________________</div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
