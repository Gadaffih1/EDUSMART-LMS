import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Boxes, 
  Presentation, 
  Users, 
  FileText, 
  Award, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  Search,
  BookOpen,
  Sliders,
  CheckCircle2,
  Atom,
  Zap,
  TestTube,
  Eye,
  ArrowRight,
  Laptop,
  Code2
} from 'lucide-react';
import { User } from '../../types';
import { 
  CBC_VIRTUAL_EXPERIMENTS, 
  JSS_LAB_REQUIREMENTS,
  VirtualExperiment 
} from './labInventoryData';
import { LaboratoryInventoryView } from './LaboratoryInventoryView';
import { TeacherDemonstrationHub } from './TeacherDemonstrationHub';
import { LearnerExperimentWorkbench } from './LearnerExperimentWorkbench';
import { LabNotebookAndReports } from './LabNotebookAndReports';
import { ComputerLabScratchStudio } from './ComputerLabScratchStudio';
import { TeacherLabAssignmentModal } from './TeacherLabAssignmentModal';

export type VirtualLabTab = 
  | 'home'
  | 'library'
  | 'demonstrations'
  | 'scratch_coding'
  | 'learner_experiments'
  | 'my_experiments'
  | 'reports'
  | 'inventory'
  | 'safety';

interface VirtualLabWorkspaceProps {
  currentUser?: User;
  initialTab?: VirtualLabTab;
  onClose?: () => void;
  isEmbedded?: boolean;
  assignedExperimentId?: string;
  assignedLabType?: 'science' | 'scratch';
  onAssignmentComplete?: (submissionData: any) => void;
}

export const VirtualLabWorkspace: React.FC<VirtualLabWorkspaceProps> = ({
  currentUser,
  initialTab = 'home',
  onClose,
  isEmbedded = false,
  assignedExperimentId,
  assignedLabType = 'science',
  onAssignmentComplete
}) => {
  const [activeTab, setActiveTab] = useState<VirtualLabTab>(initialTab);
  const [selectedExperiment, setSelectedExperiment] = useState<VirtualExperiment>(CBC_VIRTUAL_EXPERIMENTS[0]);
  const [searchExperimentQuery, setSearchExperimentQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const isTeacher = !!currentUser && ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(currentUser.role);

  // Sync if an assigned experiment/scratch is launched by learner
  useEffect(() => {
    if (assignedExperimentId) {
      if (assignedLabType === 'scratch') {
        setActiveTab('scratch_coding');
      } else {
        const found = CBC_VIRTUAL_EXPERIMENTS.find(e => e.id === assignedExperimentId);
        if (found) setSelectedExperiment(found);
        setActiveTab('learner_experiments');
      }
    }
  }, [assignedExperimentId, assignedLabType]);

  const filteredExperiments = CBC_VIRTUAL_EXPERIMENTS.filter(exp => {
    const matchSearch = exp.title.toLowerCase().includes(searchExperimentQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchExperimentQuery.toLowerCase()) ||
      exp.strand.toLowerCase().includes(searchExperimentQuery.toLowerCase());
    const matchSubject = selectedSubjectFilter === 'ALL' || exp.subject === selectedSubjectFilter;
    return matchSearch && matchSubject;
  });

  const handleLaunchExperiment = (exp: VirtualExperiment, mode: 'conduct' | 'demonstrate') => {
    setSelectedExperiment(exp);
    if (mode === 'demonstrate') {
      setActiveTab('demonstrations');
    } else {
      setActiveTab('learner_experiments');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Workspace Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shrink-0">
            <FlaskConical className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                CBC Practical Science Lab
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                Grades 5 to 9 & JSS
              </span>
              <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                75 JSS Standard Items Verified
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              EduSmart Virtual Laboratory & Science Workbench
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive simulation laboratory for demonstration, learner experimentation, practical observation notebooks, and lab reports.
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {isTeacher && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Give Lab/Scratch Assignment</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Back to LMS
            </button>
          )}
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          { id: 'home', label: 'Lab Home', icon: Sparkles },
          { id: 'library', label: 'Experiment Library', icon: BookOpen },
          { id: 'demonstrations', label: 'Teacher Demonstrations', icon: Presentation },
          { id: 'scratch_coding', label: 'Computer Lab (Scratch)', icon: Laptop },
          { id: 'learner_experiments', label: 'Learner Experiments (10-Stage)', icon: FlaskConical },
          { id: 'my_experiments', label: 'My Notebook & Reports', icon: FileText },
          { id: 'inventory', label: 'Apparatus Requirements (75 Items)', icon: Boxes },
          { id: 'safety', label: 'Safety Guidelines', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as VirtualLabTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: LAB HOME (DASHBOARD & FAST DISCOVERY) */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Hero Welcome & Quick Launch Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/25 border border-emerald-300/30 px-3 py-1 rounded-full text-emerald-200">
                Welcome, {currentUser?.name || 'Science Scholar'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Discover, Demonstrate & Conduct Scientific Practical Inquiries
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Seamlessly integrated inside EduSmart LMS. Experience hands-on laboratory investigations aligned directly with the Kenya Junior Secondary School curriculum requirements.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('learner_experiments')}
                  className="px-5 py-3 bg-white text-emerald-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-emerald-700" />
                  <span>Explore & Conduct Experiment</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-4 py-3 bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Boxes className="w-4 h-4 text-emerald-300" />
                  <span>View 75 JSS Requirements</span>
                </button>
              </div>
            </div>
          </div>

          {/* Core Science Strands Carousel Cards */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
              Explore Experiments by Subject Strand
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { title: 'Integrated Science', icon: Atom, count: 5, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                { title: 'Physics', icon: Zap, count: 4, color: 'bg-blue-50 border-blue-200 text-blue-900' },
                { title: 'Chemistry', icon: TestTube, count: 4, color: 'bg-purple-50 border-purple-200 text-purple-900' },
                { title: 'Biology', icon: Eye, count: 3, color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
                { title: 'JSS Apparatus', icon: Boxes, count: 75, color: 'bg-amber-50 border-amber-200 text-amber-900' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (item.title === 'JSS Apparatus') setActiveTab('inventory');
                      else {
                        setSelectedSubjectFilter(item.title);
                        setActiveTab('library');
                      }
                    }}
                    className={`p-4 rounded-2xl border ${item.color} shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <div>
                      <div className="font-black text-sm">{item.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{item.count} Active Units</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Featured Ready-to-Launch Experiments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Featured CBC Practical Workbench Sessions
              </h3>
              <button
                onClick={() => setActiveTab('library')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Library</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CBC_VIRTUAL_EXPERIMENTS.map(exp => (
                <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{exp.subject} · {exp.gradeLevel}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{exp.durationMinutes} mins</span>
                    </div>
                    <h4 className="font-black text-base text-slate-900 mt-2 leading-snug">
                      {exp.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLaunchExperiment(exp, 'conduct')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Conduct</span>
                    </button>
                    <button
                      onClick={() => handleLaunchExperiment(exp, 'demonstrate')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      title="Demonstrate to class on screen"
                    >
                      <span>Demonstrate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: EXPERIMENT LIBRARY */}
      {/* ============================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchExperimentQuery}
                onChange={(e) => setSearchExperimentQuery(e.target.value)}
                placeholder="Search experiments by strand, topic, or concept..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {['ALL', 'Integrated Science', 'Physics', 'Biology'].map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectFilter(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSubjectFilter === sub ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExperiments.map(exp => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black">{exp.subject}</span>
                    <span>{exp.gradeLevel} · {exp.durationMinutes} min</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{exp.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <strong className="text-slate-700 block mb-0.5">Aim:</strong>
                    <span className="text-slate-600">{exp.aim}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleLaunchExperiment(exp, 'conduct')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Conduct Experiment (Learner Mode)</span>
                  </button>
                  <button
                    onClick={() => handleLaunchExperiment(exp, 'demonstrate')}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Demonstrate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: TEACHER DEMONSTRATION HUB */}
      {/* ============================================================== */}
      {activeTab === 'demonstrations' && (
        <TeacherDemonstrationHub
          onAssignExperiment={(exp) => {
            setSelectedExperiment(exp);
            setIsAssignModalOpen(true);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* SECTION 3B: COMPUTER LAB & SCRATCH CODING STUDIO */}
      {/* ============================================================== */}
      {activeTab === 'scratch_coding' && (
        <ComputerLabScratchStudio
          currentUser={currentUser}
          isTeacher={isTeacher}
          onAssignProject={(proj) => {
            setIsAssignModalOpen(true);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* SECTION 4: 10-STAGE LEARNER EXPERIMENT WORKBENCH */}
      {/* ============================================================== */}
      {activeTab === 'learner_experiments' && (
        <LearnerExperimentWorkbench
          currentUser={currentUser}
          initialExperiment={selectedExperiment}
          onCompleteSubmission={(rep) => {
            if (onAssignmentComplete) onAssignmentComplete(rep);
            setActiveTab('my_experiments');
          }}
        />
      )}

      {/* ============================================================== */}
      {/* SECTION 5: MY EXPERIMENTS & LAB NOTEBOOK */}
      {/* ============================================================== */}
      {activeTab === 'my_experiments' && (
        <LabNotebookAndReports currentUser={currentUser} />
      )}

      {/* ============================================================== */}
      {/* SECTION 6: LABORATORY REQUIREMENTS & INVENTORY (75 ITEMS) */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <LaboratoryInventoryView />
      )}

      {/* ============================================================== */}
      {/* SECTION 7: SAFETY GUIDELINES */}
      {/* ============================================================== */}
      {activeTab === 'safety' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                KICD CBC Science Laboratory Safety Code
              </h2>
              <p className="text-xs text-slate-500">
                Official health, hygiene and physical hazard containment regulations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: '1. Laboratory Attire (Item #72 & #73)', desc: 'White lab coat buttoned at all times. Protective nitrile gloves when dispensing acids or staining specimens.' },
              { title: '2. Chemical Reagent Handling', desc: 'Never taste chemicals. Always waft fumes gently toward the nose instead of direct inhalation.' },
              { title: '3. Electrical Workbenches', desc: 'Ensure switch (Item #29) is OPEN before modifying any circuit loops or connecting cells.' },
              { title: '4. Glassware Integrity (Item #35, #36, #42)', desc: 'Inspect test tubes, delivery tubes, and condensers for hairline cracks before heating.' },
              { title: '5. Heating and Fire Safety (Item #69)', desc: 'Always point test tubes away from self and peers during Bunsen heating.' },
              { title: '6. Spill Containment & Disposal', desc: 'Neutralize strong acidic or basic residues prior to disposal in drainage basins.' }
            ].map((rule, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{rule.title}</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">{rule.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Lab & Scratch Assignment Modal */}
      {isAssignModalOpen && currentUser && (
        <TeacherLabAssignmentModal
          currentUser={currentUser}
          initialLabType={activeTab === 'scratch_coding' ? 'scratch' : 'science'}
          initialExperiment={selectedExperiment}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            setIsAssignModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
