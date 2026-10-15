import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  SubjectName,
  ReportCard,
  getStreamsForGrade, 
  getSubjectsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { ClassTeacherModule } from './ClassTeacherModule';
import { ResultUploadManager } from '../academic/ResultUploadManager';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { StudentGateExit } from './StudentGateExit';
import { TeacherWorkEntryForm } from './TeacherWorkEntryForm';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { StaffAppraisalModule } from '../supervision/StaffAppraisalModule';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import { 
  UserCheck, 
  Award, 
  MessageSquare, 
  Utensils, 
  ShieldAlert, 
  DoorOpen, 
  Calendar, 
  FileCheck2, 
  Bell, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Save, 
  Sparkles, 
  Menu, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

export type ClassTeacherTab = 
  | 'class_register'
  | 'cbc_results'
  | 'report_remarks'
  | 'lunch_register'
  | 'discipline_log'
  | 'gate_exit'
  | 'timetable'
  | 'work_entry'
  | 'parent_comms'
  | 'staff_appraisal';

interface ClassTeacherWorkspaceProps {
  currentUser: User;
}

export const ClassTeacherWorkspace: React.FC<ClassTeacherWorkspaceProps> = ({ currentUser }) => {
  const defaultGrade: GradeLevel = currentUser.grade || 4;
  const defaultStream: StreamName = currentUser.stream || 'Dove';

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(defaultGrade);
  const [selectedStream, setSelectedStream] = useState<StreamName>(defaultStream);
  const [activeTab, setActiveTab] = useState<ClassTeacherTab>('class_register');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState<boolean>(false);

  // Available streams for this class teacher or all streams if Super Admin / Executive
  const isSuperAdmin = currentUser.role === 'admin';
  const availableStreams: StreamName[] = isSuperAdmin
    ? getStreamsForGrade(selectedGrade)
    : currentUser.assignedStreams && currentUser.assignedStreams.length > 0
    ? currentUser.assignedStreams.filter(as => as.grade === selectedGrade).map(as => as.stream)
    : [currentUser.stream || 'Dove'];

  // Stream learners
  const streamStudents = Storage.getUsers().filter(
    u => u.role === 'student' && u.grade === selectedGrade && u.stream === selectedStream
  );

  // Termly Report Card Remarks State
  const [remarksSearchQuery, setRemarksSearchQuery] = useState('');
  const [studentRemarksMap, setStudentRemarksMap] = useState<Record<string, string>>({});
  const [remarksSavedToast, setRemarksSavedToast] = useState<string | null>(null);

  // Discipline state
  const [disciplineEntries, setDisciplineEntries] = useState<Array<{
    id: string;
    studentId: string;
    studentName: string;
    type: 'merit' | 'demerit' | 'counseling' | 'commendation';
    category: string;
    description: string;
    date: string;
    actionTaken: string;
  }>>([
    {
      id: 'disc-1',
      studentId: streamStudents[0]?.id || 'stu-1',
      studentName: streamStudents[0]?.name || 'Brian Otieno',
      type: 'commendation',
      category: 'Leadership & Orderliness',
      description: 'Maintained exceptional class discipline and ensured all group tables were organized.',
      date: '2026-10-01',
      actionTaken: 'Awarded 5 Merit Points & Announced at morning assembly'
    },
    {
      id: 'disc-2',
      studentId: streamStudents[1]?.id || 'stu-2',
      studentName: streamStudents[1]?.name || 'Amina Hassan',
      type: 'merit',
      category: 'Peer Collaboration',
      description: 'Volunteered to assist peers during the Fractions practical group session.',
      date: '2026-09-29',
      actionTaken: 'Recorded in Termly Character Progress Profile'
    }
  ]);

  const [newDisciplineStudentId, setNewDisciplineStudentId] = useState<string>(streamStudents[0]?.id || '');
  const [newDisciplineType, setNewDisciplineType] = useState<'merit' | 'demerit' | 'counseling' | 'commendation'>('merit');
  const [newDisciplineCategory, setNewDisciplineCategory] = useState<string>('Academic Diligence');
  const [newDisciplineDesc, setNewDisciplineDesc] = useState<string>('');
  const [newDisciplineAction, setNewDisciplineAction] = useState<string>('');
  const [showNewDisciplineModal, setShowNewDisciplineModal] = useState<boolean>(false);

  // Parent Comms state
  const [classAnnouncements, setClassAnnouncements] = useState<Array<{
    id: string;
    title: string;
    message: string;
    urgency: 'normal' | 'important' | 'urgent';
    date: string;
    recipientsCount: number;
  }>>([
    {
      id: 'ann-1',
      title: 'Term 2 Week 6 CBC Practical Project Supplies Reminder',
      message: 'Dear Grade 4 Dove Parents, kindly ensure your learner carries a notebook, metric ruler and plant specimen for our Science classification module on Wednesday.',
      urgency: 'important',
      date: '2026-10-01',
      recipientsCount: streamStudents.length
    },
    {
      id: 'ann-2',
      title: 'Midterm Parent-Teacher Consultation Bookings',
      message: 'Progress consultation slots are now open on the Parent Portal. Please book a 15-minute slot with Mr. Kiprono before Friday 04:00 PM.',
      urgency: 'normal',
      date: '2026-09-28',
      recipientsCount: streamStudents.length
    }
  ]);

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMsg, setNewNoticeMsg] = useState('');
  const [newNoticeUrgency, setNewNoticeUrgency] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Load Report Card Remarks for enrolled learners
  useEffect(() => {
    const reportCards = Storage.getReportCards(undefined, selectedGrade, selectedStream);
    const initialMap: Record<string, string> = {};
    streamStudents.forEach(stu => {
      const existingRc = reportCards.find(rc => rc.studentId === stu.id);
      initialMap[stu.id] = existingRc?.classTeacherRemarks || 'Exhibits steady CBC competency progression, punctuality, and positive peer collaboration.';
    });
    setStudentRemarksMap(initialMap);
  }, [selectedGrade, selectedStream]);

  // Save single student remarks
  const handleSaveStudentRemarks = (studentId: string) => {
    const remark = studentRemarksMap[studentId];
    if (!remark) return;

    Storage.updateReportCardRemarks(studentId, '2026-T1', {
      classTeacherRemarks: remark
    });

    setRemarksSavedToast(`Class teacher remarks saved for ${streamStudents.find(s => s.id === studentId)?.name || 'Learner'}!`);
    setTimeout(() => setRemarksSavedToast(null), 3000);
  };

  // Batch save all remarks
  const handleBatchSaveAllRemarks = () => {
    streamStudents.forEach(stu => {
      const remark = studentRemarksMap[stu.id];
      if (remark) {
        Storage.updateReportCardRemarks(stu.id, '2026-T1', {
          classTeacherRemarks: remark
        });
      }
    });

    setRemarksSavedToast(`Successfully saved remarks for all ${streamStudents.length} learners in Grade ${selectedGrade} (${selectedStream})!`);
    setTimeout(() => setRemarksSavedToast(null), 3500);
  };

  // Quick Preset Remarks
  const REMARK_PRESETS = [
    'Consistently disciplined, focused, and demonstrates exemplary CBC competency growth.',
    'A courteous and diligent learner who exhibits exceptional promise in collaborative learning.',
    'Making steady, commendable progress. Encouraged to participate more actively in class discussions.',
    'Exhibits outstanding intellectual curiosity and maintains high standards of classroom conduct.',
    'Creative, punctual, and well-behaved. Keep up the commendable standard of work!'
  ];

  // Handle adding discipline log
  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisciplineDesc || !newDisciplineStudentId) return;

    const studentObj = streamStudents.find(s => s.id === newDisciplineStudentId);
    const entry = {
      id: `disc-${Date.now()}`,
      studentId: newDisciplineStudentId,
      studentName: studentObj?.name || 'Learner',
      type: newDisciplineType,
      category: newDisciplineCategory,
      description: newDisciplineDesc,
      date: new Date().toISOString().split('T')[0],
      actionTaken: newDisciplineAction || 'Recorded in Class Pastoral Register'
    };

    setDisciplineEntries([entry, ...disciplineEntries]);
    setShowNewDisciplineModal(false);
    setNewDisciplineDesc('');
    setNewDisciplineAction('');
  };

  // Handle sending parent broadcast
  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeMsg) return;

    const newNotice = {
      id: `ann-${Date.now()}`,
      title: newNoticeTitle,
      message: newNoticeMsg,
      urgency: newNoticeUrgency,
      date: new Date().toISOString().split('T')[0],
      recipientsCount: streamStudents.length
    };

    setClassAnnouncements([newNotice, ...classAnnouncements]);
    setNewNoticeTitle('');
    setNewNoticeMsg('');
    setRemarksSavedToast(`Announcement broadcasted to ${streamStudents.length} parents of Grade ${selectedGrade} ${selectedStream}!`);
    setTimeout(() => setRemarksSavedToast(null), 3500);
  };

  // Sidebar navigation structure
  const sidebarGroups: WorkspaceSidebarGroup<ClassTeacherTab>[] = [
    {
      title: 'Class Administration',
      items: [
        {
          id: 'class_register',
          label: '1. Class Roll Call Register',
          icon: UserCheck,
          badge: `${selectedStream}`
        },
        {
          id: 'cbc_results',
          label: '2. CBC Marks & CBA Sheet',
          icon: Award,
          badge: 'Gr. ' + selectedGrade,
          badgeColor: 'bg-emerald-600'
        },
        {
          id: 'report_remarks',
          label: '3. Termly Report Remarks',
          icon: FileCheck2,
          badge: `${streamStudents.length} Pupils`,
          badgeColor: 'bg-blue-600'
        },
        {
          id: 'lunch_register',
          label: '4. Learner Lunch Register',
          icon: Utensils,
          badge: 'Dining'
        }
      ]
    },
    {
      title: 'Learner Pastoral & Welfare',
      items: [
        {
          id: 'discipline_log',
          label: '5. Conduct & Merits Log',
          icon: ShieldAlert,
          badge: `${disciplineEntries.length}`
        },
        {
          id: 'gate_exit',
          label: '6. Student Gate Exit Passes',
          icon: DoorOpen
        },
        {
          id: 'parent_comms',
          label: '7. Class Parent Notices',
          icon: MessageSquare,
          badge: 'SMS Hub'
        }
      ]
    },
    {
      title: 'Teacher Routine & Growth',
      items: [
        {
          id: 'timetable',
          label: '8. Class Timetable',
          icon: Calendar
        },
        {
          id: 'work_entry',
          label: '9. Daily Work Entry Sign-In',
          icon: Briefcase
        },
        {
          id: 'staff_appraisal',
          label: '10. TPAD Performance Appraisal',
          icon: TrendingUp
        }
      ]
    }
  ];

  return (
    <div className="flex w-full min-h-screen bg-slate-50 relative">
      
      {/* Toast Notification */}
      {remarksSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{remarksSavedToast}</span>
        </div>
      )}

      {/* Modern Workspace Sidebar */}
      <WorkspaceSidebar
        portalTitle="Class Teacher Desk"
        portalSubtitle={`Grade ${selectedGrade} (${selectedStream}) Form Master`}
        portalIcon="👨‍🏫"
        portalBadge="Form Lead"
        groups={sidebarGroups}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpenMobile(false);
        }}
        isOpenMobile={sidebarOpenMobile}
        onCloseMobile={() => setSidebarOpenMobile(false)}
        themeColor="emerald"
        footerNote="EduSmart CBC Class Teacher Governance"
        statusText={`Grade ${selectedGrade} ${selectedStream} Active`}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpenMobile(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                  Class Teacher Portal
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  TSC Registered Classroom Lead
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 font-serif tracking-tight">
                {currentUser.name} — Form Lead for Grade {selectedGrade} ({selectedStream})
              </h1>
            </div>
          </div>

          {/* Quick Stream & Grade Selector / Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            
            {/* Stream Switcher if multi-stream assigned */}
            {availableStreams.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase px-1">Stream:</span>
                {availableStreams.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStream(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      selectedStream === st
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{streamStudents.length} Learners</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="text-[11px] text-slate-600">
                Grade {selectedGrade}
              </div>
            </div>

          </div>

        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          
          {/* ========================================================
              TAB 1: CLASS ROLL CALL REGISTER (ClassTeacherModule)
              ======================================================== */}
          {activeTab === 'class_register' && (
            <div className="space-y-6">
              <ClassTeacherModule currentUser={currentUser} />
            </div>
          )}

          {/* ========================================================
              TAB 2: CBC MARKS & CBA RESULTS (ResultUploadManager)
              ======================================================== */}
          {activeTab === 'cbc_results' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-serif">
                      Grade {selectedGrade} ({selectedStream}) CBC Assessment Marksheet
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload continuous assessment scores, verify learning area rubrics, and publish formative records.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    CBC CBA Engine Active
                  </span>
                </div>
                <ResultUploadManager
                  currentUser={currentUser}
                  defaultGrade={selectedGrade}
                  defaultStream={selectedStream}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: TERMLY REPORT CARD REMARKS (Direct Editor)
              ======================================================== */}
          {activeTab === 'report_remarks' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 uppercase">
                      Official Remarks Registry
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Term 1 Progress Report Cards
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 font-serif tracking-tight">
                    Class Teacher Progress Remarks Manager
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Enter and customize qualitative evaluation remarks printed directly on learners' official termly report cards.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchSaveAllRemarks}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Class Remarks</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search pupil by name or admission..."
                    value={remarksSearchQuery}
                    onChange={(e) => setRemarksSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {streamStudents.filter(s => s.name.toLowerCase().includes(remarksSearchQuery.toLowerCase())).length} of {streamStudents.length} Learners
                </div>
              </div>

              {/* Roster of Learners with Remarks Editor */}
              <div className="space-y-3">
                {streamStudents
                  .filter(stu => stu.name.toLowerCase().includes(remarksSearchQuery.toLowerCase()) || (stu.admissionNumber && stu.admissionNumber.toLowerCase().includes(remarksSearchQuery.toLowerCase())))
                  .map((stu, sidx) => {
                    const currentRemark = studentRemarksMap[stu.id] || '';
                    return (
                      <div 
                        key={stu.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {stu.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {stu.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Adm: {stu.admissionNumber || `ADM-${1000 + sidx}`} • Grade {selectedGrade} ({selectedStream})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              onClick={() => handleSaveStudentRemarks(stu.id)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3 h-3 text-emerald-600" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>

                        {/* Remark Textarea */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Official Class Teacher Remark:
                          </label>
                          <textarea
                            rows={2}
                            value={currentRemark}
                            onChange={(e) => setStudentRemarksMap({
                              ...studentRemarksMap,
                              [stu.id]: e.target.value
                            })}
                            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                          />
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Templates:</span>
                          {REMARK_PRESETS.map((preset, pidx) => (
                            <button
                              key={pidx}
                              type="button"
                              onClick={() => setStudentRemarksMap({
                                ...studentRemarksMap,
                                [stu.id]: preset
                              })}
                              className="px-2 py-0.5 bg-slate-200/70 hover:bg-emerald-100 hover:text-emerald-900 text-[10px] rounded text-slate-700 transition-colors cursor-pointer truncate max-w-[200px]"
                              title={preset}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: LEARNER LUNCH REGISTER (LearnerLunchRegister)
              ======================================================== */}
          {activeTab === 'lunch_register' && (
            <div className="space-y-6">
              <LearnerLunchRegister
                currentUser={currentUser}
                initialGrade={selectedGrade}
                initialStream={selectedStream}
                viewMode="class_teacher"
                title={`Grade ${selectedGrade} (${selectedStream}) Class Teacher Lunch Register`}
                subtitle="Official daily midday lunch & dining attendance log. Marked strictly by the respective class teacher."
              />
            </div>
          )}

          {/* ========================================================
              TAB 5: CONDUCT & DISCIPLINE LOG
              ======================================================== */}
          {activeTab === 'discipline_log' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif tracking-tight">
                    Grade {selectedGrade} ({selectedStream}) Class Pastoral & Discipline Log
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Record merits, commendable achievements, warnings, and counseling interventions for class pupils.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewDisciplineModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>+ Record Pastoral Entry</span>
                </button>
              </div>

              {/* Discipline Entries Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4">Notes & Observation</th>
                      <th className="py-3 px-4">Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disciplineEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{entry.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{entry.studentName}</td>
                        <td className="py-3 px-4 text-slate-700">{entry.category}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            entry.type === 'commendation'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.type === 'merit'
                              ? 'bg-blue-100 text-blue-800'
                              : entry.type === 'counseling'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">{entry.description}</td>
                        <td className="py-3 px-4 text-slate-600">{entry.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal to Record New Entry */}
              {showNewDisciplineModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-base font-black text-slate-900 font-serif">Record Learner Pastoral Entry</h3>
                      <button 
                        onClick={() => setShowNewDisciplineModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddDiscipline} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Select Learner</label>
                        <select
                          value={newDisciplineStudentId}
                          onChange={(e) => setNewDisciplineStudentId(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
                        >
                          {streamStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber || 'Student'})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Type</label>
                          <select
                            value={newDisciplineType}
                            onChange={(e) => setNewDisciplineType(e.target.value as any)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
                          >
                            <option value="merit">Merit</option>
                            <option value="commendation">Commendation</option>
                            <option value="counseling">Counseling Referral</option>
                            <option value="demerit">Infraction Warning</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Category</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Orderliness"
                            value={newDisciplineCategory}
                            onChange={(e) => setNewDisciplineCategory(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Describe the incident or commendable achievement..."
                          value={newDisciplineDesc}
                          onChange={(e) => setNewDisciplineDesc(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Action Taken</label>
                        <input
                          type="text"
                          placeholder="e.g. Parent notified via SMS / Certificate issued"
                          value={newDisciplineAction}
                          onChange={(e) => setNewDisciplineAction(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowNewDisciplineModal(false)}
                          className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          Save Record
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: STUDENT GATE EXIT AUTHORIZATION (StudentGateExit)
              ======================================================== */}
          {activeTab === 'gate_exit' && (
            <div className="space-y-6">
              <StudentGateExit currentUser={currentUser} />
            </div>
          )}

          {/* ========================================================
              TAB 7: CLASS PARENT NOTICES & COMMS
              ======================================================== */}
          {activeTab === 'parent_comms' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="pb-5 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-900 font-serif tracking-tight">
                  Grade {selectedGrade} ({selectedStream}) Parent Communication Hub
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Broadcast class-specific announcements, homework supply reminders, and meeting notices to parents of this stream.
                </p>
              </div>

              {/* Compose New Announcement Form */}
              <form onSubmit={handleSendNotice} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Draft Class Parent Announcement (Dispatched via Portal & SMS)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject / Header</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Project Materials Needed for Wednesday"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Message Content</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type announcement to parents..."
                    value={newNoticeMsg}
                    onChange={(e) => setNewNoticeMsg(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Urgency:</span>
                    <select
                      value={newNoticeUrgency}
                      onChange={(e) => setNewNoticeUrgency(e.target.value as any)}
                      className="p-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Announcement to {streamStudents.length} Parents</span>
                  </button>
                </div>
              </form>

              {/* Published Announcements History */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Dispatched Notices History</h3>
                {classAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 font-serif">{ann.title}</h4>
                      <span className="text-[10px] font-mono text-slate-500">{ann.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{ann.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Delivered to {ann.recipientsCount} Parent Portals</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700 uppercase">{ann.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: CLASS TIMETABLE & ROUTINE (TimetablePortal)
              ======================================================== */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <TimetablePortal currentUser={currentUser} />
            </div>
          )}

          {/* ========================================================
              TAB 9: TEACHER WORK ENTRY (TeacherWorkEntryForm)
              ======================================================== */}
          {activeTab === 'work_entry' && (
            <div className="space-y-6">
              <TeacherWorkEntryForm currentUser={currentUser} defaultGrade={selectedGrade} />
            </div>
          )}

          {/* ========================================================
              TAB 10: STAFF APPRAISAL (StaffAppraisalModule)
              ======================================================== */}
          {activeTab === 'staff_appraisal' && (
            <div className="space-y-6">
              <StaffAppraisalModule currentUser={currentUser} />
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
