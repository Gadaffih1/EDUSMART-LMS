import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  SubjectName, 
  PRIMARY_SUBJECTS, 
  JUNIOR_SUBJECTS, 
  AssessmentCycle,
  Announcement
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { DocumentRequestsHub } from '../admin/DocumentRequestsHub';
import { CMSPostsSectionsHub } from '../admin/CMSPostsSectionsHub';
import { ComputerLabModule } from '../teacher/ComputerLabModule';
import { 
  Compass, 
  BookOpen, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Laptop, 
  FileText, 
  AlertCircle, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ExternalLink, 
  Printer, 
  Share2, 
  Send, 
  ShieldCheck, 
  Users, 
  Sliders, 
  RefreshCw, 
  FileSpreadsheet, 
  FlaskConical, 
  Bell, 
  Check, 
  X,
  Target
} from 'lucide-react';

interface CurriculumCoordinatorWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

interface SyllabusTopicTracking {
  id: string;
  grade: GradeLevel;
  subject: SubjectName;
  strand: string;
  subStrand: string;
  expectedWeek: number;
  completedWeek: number;
  status: 'on_schedule' | 'ahead' | 'lagging';
  leadTeacher: string;
  competencyTarget: string;
}

export const CurriculumCoordinatorWorkspace: React.FC<CurriculumCoordinatorWorkspaceProps> = ({ 
  currentUser,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<
    'pacing' | 'schemes' | 'cba_moderation' | 'computer_lab' | 'doc_requests' | 'directives' | 'bom_report'
  >('pacing');

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(2);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Advisory Memo Modal State
  const [advisoryModalTopic, setAdvisoryModalTopic] = useState<SyllabusTopicTracking | null>(null);
  const [advisoryMemoText, setAdvisoryMemoText] = useState('');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mock CBC Syllabus Tracker Data
  const [syllabusTracking, setSyllabusTracking] = useState<SyllabusTopicTracking[]>([
    {
      id: 'syl-01',
      grade: 4,
      subject: 'Mathematics',
      strand: 'Numbers & Operations',
      subStrand: 'Fractions & Equivalent Quantities',
      expectedWeek: 7,
      completedWeek: 7,
      status: 'on_schedule',
      leadTeacher: 'Ms. Sarah Mwangi',
      competencyTarget: 'Critical thinking in splitting concrete objects into fractional units'
    },
    {
      id: 'syl-02',
      grade: 4,
      subject: 'Integrated Science',
      strand: 'Living Things & Ecosystems',
      subStrand: 'Plant Nutrition & Water Transport',
      expectedWeek: 7,
      completedWeek: 6,
      status: 'lagging',
      leadTeacher: 'Mr. David Omondi',
      competencyTarget: 'Practical experiment setup with food dye and celery stalks'
    },
    {
      id: 'syl-03',
      grade: 7,
      subject: 'Computer Studies',
      strand: 'Computational Thinking',
      subStrand: 'Scratch Algorithms & Loop Iterations',
      expectedWeek: 7,
      completedWeek: 8,
      status: 'ahead',
      leadTeacher: 'Mr. John Kamau',
      competencyTarget: 'Sprite broadcast messaging and variable scorekeeper counters'
    },
    {
      id: 'syl-04',
      grade: 8,
      subject: 'Pretechnical Education',
      strand: 'Materials & Production',
      subStrand: 'Safety in Mechanical Workshop',
      expectedWeek: 7,
      completedWeek: 7,
      status: 'on_schedule',
      leadTeacher: 'Mrs. Grace Njeri',
      competencyTarget: 'Standard PPE protocol and hazardous material storage'
    },
    {
      id: 'syl-05',
      grade: 5,
      subject: 'Creative Arts',
      strand: 'Visual Arts & Craft',
      subStrand: 'Weaving & Pattern Construction',
      expectedWeek: 7,
      completedWeek: 5,
      status: 'lagging',
      leadTeacher: 'Mr. Patrick Mutiso',
      competencyTarget: 'Local fibre collection and geometric loom design'
    },
    {
      id: 'syl-06',
      grade: 6,
      subject: 'Social Studies',
      strand: 'Resources & Economic Activities',
      subStrand: 'Dairy Farming in Eastern Africa',
      expectedWeek: 7,
      completedWeek: 7,
      status: 'on_schedule',
      leadTeacher: 'Mrs. Janet Otieno',
      competencyTarget: 'Map interpretation and cooperative society benefits'
    }
  ]);

  // Schemes of Work Verification Desk Mock Data
  const [schemesOfWork, setSchemesOfWork] = useState([
    {
      id: 'sch-01',
      teacher: 'Ms. Sarah Mwangi',
      grade: 4,
      subject: 'Mathematics',
      term: 2,
      submittedDate: '2026-10-02',
      status: 'approved',
      feedback: 'Excellent alignment with CBC inquiry questions and learner rubrics.',
      reviewedBy: 'Mrs. Beatrice Omari'
    },
    {
      id: 'sch-02',
      teacher: 'Mr. David Omondi',
      grade: 4,
      subject: 'Integrated Science',
      term: 2,
      submittedDate: '2026-10-04',
      status: 'pending_revision',
      feedback: 'Please incorporate the Virtual Science Lab experiment on Acids & Bases into Week 8.',
      reviewedBy: 'Mrs. Beatrice Omari'
    },
    {
      id: 'sch-03',
      teacher: 'Mr. John Kamau',
      grade: 7,
      subject: 'Computer Studies',
      term: 2,
      submittedDate: '2026-10-05',
      status: 'approved',
      feedback: 'Great use of Computer Lab Challenge Library for Grade 7 coding sessions.',
      reviewedBy: 'Mrs. Beatrice Omari'
    },
    {
      id: 'sch-04',
      teacher: 'Mrs. Grace Njeri',
      grade: 8,
      subject: 'Pretechnical Education',
      term: 2,
      submittedDate: '2026-10-06',
      status: 'approved',
      feedback: 'Comprehensive workshop risk mitigation guidelines included.',
      reviewedBy: 'Mrs. Beatrice Omari'
    }
  ]);

  // Send Pacing Advisory Memo to Teacher
  const handleSendPacingAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryModalTopic || !advisoryMemoText.trim()) return;

    const newDirective: Announcement = {
      id: `ann-coord-${Date.now()}`,
      title: `Curriculum Coordination Advisory: ${advisoryModalTopic.subject} Grade ${advisoryModalTopic.grade}`,
      content: `ATTN: ${advisoryModalTopic.leadTeacher}\n\n${advisoryMemoText.trim()}\n\nStrand Focus: ${advisoryModalTopic.strand} -> ${advisoryModalTopic.subStrand}. Pacing adjustment expected by Friday.`,
      type: 'urgent',
      targetGrade: advisoryModalTopic.grade,
      author: currentUser.name,
      authorRole: 'Curriculum Coordinator',
      createdAt: new Date().toISOString(),
      categories: ['academic-directives']
    };

    Storage.addAnnouncement(newDirective);
    showToast(`Pacing Advisory dispatched to ${advisoryModalTopic.leadTeacher}! Broadcast notice created.`, 'success');
    setAdvisoryModalTopic(null);
    setAdvisoryMemoText('');
  };

  // Filter syllabus tracking
  const filteredSyllabus = syllabusTracking.filter(item => {
    const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  // Calculate metrics
  const totalTopics = syllabusTracking.length;
  const onScheduleCount = syllabusTracking.filter(t => t.status === 'on_schedule' || t.status === 'ahead').length;
  const pacingPercentage = Math.round((onScheduleCount / Math.max(1, totalTopics)) * 100);
  const laggingCount = syllabusTracking.filter(t => t.status === 'lagging').length;
  const approvedSchemes = schemesOfWork.filter(s => s.status === 'approved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP EXECUTIVE LEADERSHIP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Compass className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.2 rounded-md">
                  Executive Leadership · CBC Directorate
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Term {selectedTerm} (Academic Year 2026)
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span className="text-xs font-medium text-slate-400 font-mono">({currentUser.designation || 'Curriculum Coordinator'})</span>
              </h1>
            </div>
          </div>

          {/* Quick Leadership Navigation Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Week 7 of 13 · Syllabi Active</span>
            </div>

            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(Number(e.target.value) as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2 (Current)</option>
              <option value={3}>Term 3</option>
            </select>
          </div>
        </div>
      </header>

      {/* EXECUTIVE KPI SUMMARY STRIP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">CBC Syllabus Pacing</div>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              <span>{pacingPercentage}%</span>
              <span className="text-xs font-bold text-emerald-600">On Target</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{onScheduleCount} of {totalTopics} Core Strands Synchronized</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Schemes of Work Verified</div>
            <div className="text-2xl font-black text-indigo-700 flex items-baseline gap-1.5">
              <span>{approvedSchemes}</span>
              <span className="text-xs font-bold text-indigo-600">of {schemesOfWork.length}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Weekly Pedagogical Reviews</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Strands Lagging Pacing</div>
            <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1.5">
              <span>{laggingCount}</span>
              <span className="text-xs font-bold text-amber-700">Needs Catch-up</span>
            </div>
            <div className="text-[10px] text-amber-700 font-mono">Remedial Advisories Required</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Integrated STEM Labs</div>
            <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
              <span>100%</span>
              <span className="text-xs font-bold text-emerald-700">Operational</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Virtual Lab + Scratch Computer Lab</div>
          </div>
        </div>
      </div>

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('pacing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pacing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>1. Syllabus Pacing Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schemes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Schemes of Work Verification Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('cba_moderation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cba_moderation' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. CBA Rubrics & Formative Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('computer_lab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'computer_lab' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>4. Computer Lab & Scratch Coding</span>
          </button>

          <button
            onClick={() => setActiveTab('doc_requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'doc_requests' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>5. Request Teacher/Student Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('directives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'directives' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>6. Curriculum Directives & Post CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('bom_report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bom_report' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>7. Executive BOM Curriculum Report</span>
          </button>
        </div>
      </div>

      {/* MAIN TAB CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* ========================================================
            TAB 1: SYLLABUS PACING RADAR
            ======================================================== */}
        {activeTab === 'pacing' && (
          <div className="space-y-5">
            
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Grade:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value) as GradeLevel)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="all">All Grades (1-9)</option>
                  {[1,2,3,4,5,6,7,8,9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>

                <span className="text-xs font-bold text-slate-500 uppercase ml-2">Subject:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="all">All Learning Areas</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Integrated Science">Integrated Science</option>
                  <option value="Computer Studies">Computer Studies</option>
                  <option value="Creative Arts">Creative Arts</option>
                  <option value="Pretechnical Education">Pretechnical Education</option>
                  <option value="Social Studies">Social Studies</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Showing {filteredSyllabus.length} Monitored Strands
                </span>
              </div>
            </div>

            {/* Pacing Radar Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSyllabus.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 transition-all">
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        Grade {item.grade} · {item.subject}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        item.status === 'on_schedule' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        item.status === 'ahead' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.status === 'on_schedule' ? '✓ On Schedule' : item.status === 'ahead' ? '⚡ Ahead of Target' : '⚠️ Lagging Pacing'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900">{item.strand}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{item.subStrand}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Lead Instructor:</span>
                        <span className="text-slate-900 font-semibold">{item.leadTeacher}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Competency: "{item.competencyTarget}"
                      </div>
                    </div>
                  </div>

                  {/* Progress Strip */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Coverage: Week {item.completedWeek} of {item.expectedWeek} Target</span>
                      <span className="font-bold text-slate-800">
                        {Math.round((item.completedWeek / item.expectedWeek) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === 'lagging' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, (item.completedWeek / item.expectedWeek) * 100)}%` }}
                      />
                    </div>

                    {item.status === 'lagging' && (
                      <button
                        onClick={() => {
                          setAdvisoryModalTopic(item);
                          setAdvisoryMemoText(`Please schedule a catch-up remedial lesson for ${item.subStrand}. Strand is currently 1 week behind the approved KICD syllabus pacing.`);
                        }}
                        className="w-full mt-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-amber-700" />
                        <span>Dispatch Pacing Advisory Memo</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: SCHEMES OF WORK VERIFICATION DESK
            ======================================================== */}
        {activeTab === 'schemes' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Teacher Schemes of Work & Lesson Plan Verification Desk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify weekly pedagogical plans submitted by subject teachers across primary and junior school streams.
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                {approvedSchemes} of {schemesOfWork.length} Verified by Coordinator
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Subject Faculty</th>
                      <th className="py-3 px-3">Grade & Subject</th>
                      <th className="py-3 px-3">Term & Academic Cycle</th>
                      <th className="py-3 px-3">Submission Date</th>
                      <th className="py-3 px-3">Review Remarks</th>
                      <th className="py-3 px-4 text-right">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schemesOfWork.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sch.teacher}</div>
                          <div className="text-[10px] text-slate-400 font-mono">TSC Verified Instructor</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">Grade {sch.grade}</span>
                          <span className="text-slate-500 ml-1">· {sch.subject}</span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-mono">
                          Term {sch.term} (Year 2026)
                        </td>

                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {sch.submittedDate}
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate italic">
                          "{sch.feedback}"
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            sch.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {sch.status === 'approved' ? '✅ Verified & Approved' : '🔄 Revision Required'}
                          </span>
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
            TAB 3: CBA ASSESSMENT MODERATION
            ======================================================== */}
        {activeTab === 'cba_moderation' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Competency-Based Assessment (CBA) Rubrics & Formative Moderation</span>
              </h3>
              <p className="text-xs text-slate-500">
                Institutional moderation of attainment levels (EE, ME, AE, BE) to ensure standardized grading across all 8 primary streams and 7 junior school streams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">EE: Exceeding Expectations</div>
                <div className="text-2xl font-black">28.4%</div>
                <div className="text-[10px] text-emerald-800">Learners showing mastery & self-direction</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">ME: Meeting Expectations</div>
                <div className="text-2xl font-black">56.2%</div>
                <div className="text-[10px] text-blue-800">Core cohort meeting KICD attainment criteria</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">AE: Approaching Expectations</div>
                <div className="text-2xl font-black">12.1%</div>
                <div className="text-[10px] text-amber-800">Requires targeted scaffolding & practice</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">BE: Below Expectations</div>
                <div className="text-2xl font-black">3.3%</div>
                <div className="text-[10px] text-rose-800">Remedial learning plans initiated</div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: COMPUTER LAB MODULE INTEGRATION
            ======================================================== */}
        {activeTab === 'computer_lab' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Executive Oversight: Computer Lab & Scratch Coding Studio</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review classroom Scratch demonstrations, challenge library distribution, and STEM integration.
                </p>
              </div>
            </div>

            <ComputerLabModule currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 5: REQUEST TEACHER/STUDENT DOCUMENTS (ROLE 1)
            ======================================================== */}
        {activeTab === 'doc_requests' && (
          <div className="space-y-4">
            <DocumentRequestsHub currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 6: CURRICULUM DIRECTIVES & POST CMS (ROLES 2, 3, 5)
            ======================================================== */}
        {activeTab === 'directives' && (
          <div className="space-y-4">
            <CMSPostsSectionsHub currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 7: BOM & EXECUTIVE CURRICULUM REPORT
            ======================================================== */}
        {activeTab === 'bom_report' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Official Institutional Assessment
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Board of Management (BOM) & Head Teacher Curriculum Implementation Briefing
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Comprehensive audit of syllabus coverage, teacher compliance, and student competency acquisition.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print BOM Briefing</span>
              </button>
            </div>

            {/* Document Report Sheet */}
            <div className="space-y-6 text-xs text-slate-700 leading-relaxed max-w-4xl">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Academic Term</div>
                  <div className="font-black text-sm text-slate-900 mt-0.5">Term 2, 2026</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Overall Pacing</div>
                  <div className="font-black text-sm text-emerald-600 mt-0.5">91.2% On Track</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Verified Schemes</div>
                  <div className="font-black text-sm text-indigo-700 mt-0.5">148 Approved</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">CBA Attainment</div>
                  <div className="font-black text-sm text-slate-900 mt-0.5">84.6% EE / ME</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  1. Executive Summary & Curriculum Health
                </h4>
                <p>
                  Curriculum implementation across Grades 1 through 9 remains highly robust, with all core learning areas progressing within acceptable variance of KICD syllabi guidelines. Formative assessment rubrics in Upper Primary and Junior School reflect distinguished mastery in computational thinking, science experiment inquiry, and foundational literacy.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  2. Remedial Action Directives
                </h4>
                <p>
                  Targeted catch-up advisories have been dispatched to the Integrated Science faculty (Grade 4) and Creative Arts department (Grade 5). Timetabled Friday remedial clinics have been scheduled to ensure all strands are fully covered prior to the KNEC CBA upload window.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <div className="font-serif italic text-base text-slate-900">Mrs. Beatrice Omari</div>
                  <div className="text-[10px] font-bold uppercase mt-0.5">Curriculum Coordinator, Executive Leadership</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-700">EduSmart Institutional Governance</div>
                  <div className="text-[10px] font-mono">Gadsa Systems Certified</div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ========================================================
          MODAL: PACING ADVISORY MEMO DISPATCH
          ======================================================== */}
      {advisoryModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-slate-900">Dispatch Curriculum Pacing Advisory</h3>
              </div>
              <button onClick={() => setAdvisoryModalTopic(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950">
              <div><strong>Recipient:</strong> {advisoryModalTopic.leadTeacher}</div>
              <div><strong>Subject & Grade:</strong> {advisoryModalTopic.subject} (Grade {advisoryModalTopic.grade})</div>
              <div><strong>Strand:</strong> {advisoryModalTopic.strand} &gt; {advisoryModalTopic.subStrand}</div>
            </div>

            <form onSubmit={handleSendPacingAdvisory} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pacing Memo Directive *</label>
                <textarea
                  rows={4}
                  required
                  value={advisoryMemoText}
                  onChange={(e) => setAdvisoryMemoText(e.target.value)}
                  placeholder="Detail expected catch-up schedule or remedial timetable adjustments..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalTopic(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Advisory Memo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
