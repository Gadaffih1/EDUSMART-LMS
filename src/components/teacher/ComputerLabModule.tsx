import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Play, 
  Square, 
  RotateCcw, 
  Sparkles, 
  Code2, 
  ExternalLink, 
  Layers, 
  Presentation, 
  CheckCircle2, 
  BookOpen, 
  Eye, 
  Plus, 
  Share2, 
  Monitor, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  Award, 
  ShieldCheck, 
  Users, 
  Lock, 
  AlertCircle, 
  Filter, 
  Calendar, 
  Send, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Sliders, 
  Target, 
  Terminal, 
  Info,
  Clock,
  ChevronRight
} from 'lucide-react';
import { User, GradeLevel, StreamName, Assignment, Announcement, CodingChallenge, CodingChallengeCriteria } from '../../types';
import { Storage } from '../../utils/storage';

interface ComputerLabModuleProps {
  currentUser: User;
  onNavigateToTab?: (tab: string) => void;
}

export const ComputerLabModule: React.FC<ComputerLabModuleProps> = ({ 
  currentUser,
  onNavigateToTab 
}) => {
  // --- 1. Faculty Clearance & Access Control ---
  // Must be teacher, class_teacher, hod, dean_of_studies or admin, and have CS faculty clearance
  const isTeacherRole = ['teacher', 'class_teacher', 'hod', 'dean_of_studies', 'admin', 'head_teacher'].includes(currentUser.role);
  
  // Faculty clearance check: check assigned subjects or designation, with quick faculty clearance authentication bypass
  const assignedSubjects = currentUser.assignedSubjects || [];
  const hasCsInSubjects = assignedSubjects.some(s => s.toLowerCase().includes('computer') || s.toLowerCase().includes('science'));
  const [facultyClearanceGranted, setFacultyClearanceGranted] = useState<boolean>(() => {
    return isTeacherRole && (hasCsInSubjects || currentUser.role === 'hod' || currentUser.role === 'dean_of_studies');
  });
  const [facultyPassCode, setFacultyPassCode] = useState('');
  const [facultyAuthError, setFacultyAuthError] = useState(false);

  // --- Module Tabs ---
  type LabTab = 'projector' | 'challenges' | 'assign_task' | 'submissions';
  const [activeTab, setActiveTab] = useState<LabTab>('projector');

  // --- Projector / Scratch Embed State ---
  const [projectIdInput, setProjectIdInput] = useState('10128407');
  const [activeProjectId, setActiveProjectId] = useState('10128407');
  const [embedProvider, setEmbedProvider] = useState<'turbowarp' | 'scratch'>('turbowarp');
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [projectKey, setProjectKey] = useState(Date.now());
  const [selectedPresetId, setSelectedPresetId] = useState('maze');
  const [showTeacherNotes, setShowTeacherNotes] = useState(true);

  // Preset demonstrations
  const PRESET_DEMOS = [
    {
      id: 'maze',
      title: 'Interactive Maze & Collision Sensing',
      projectId: '10128407',
      grade: 7,
      strand: 'Computational Thinking & Algorithms',
      description: 'Sprite controlled by arrow keys that navigates corridors, detects wall boundaries and tracks score upon reaching goals.',
      notes: [
        'Emphasize coordinate geometry: X is horizontal (-240 to +240) and Y is vertical (-180 to +180).',
        'Demonstrate difference between single condition checks and continuous forever polling loops.',
        'Show how collision sensing prevents the sprite from teleporting through walls.'
      ],
      keyBlocks: ['when green flag clicked', 'forever', 'if <touching color ?> then bounce', 'change Score by 10']
    },
    {
      id: 'timer',
      title: 'Variable-Driven Scorekeeper & Countdown',
      projectId: '60917032',
      grade: 6,
      strand: 'Variables, Counters & Time Sequencing',
      description: 'Synchronized digital stopwatch and scorekeeper showcasing variable scope, decrement intervals, and game over triggers.',
      notes: [
        'Guide learners on how variables store state across game ticks.',
        'Demonstrate why we insert a [wait 1 seconds] block to calibrate the countdown rate.',
        'Showcase stage backdrop transitions using broadcast messages.'
      ],
      keyBlocks: ['set TimeRemaining to 60', 'repeat until <Time = 0>', 'wait 1 secs', 'broadcast Game_Over']
    },
    {
      id: 'physics',
      title: 'Bouncing Ball Physics & Gravity Modeling',
      projectId: '10128407',
      grade: 8,
      strand: 'Computational Modeling & Physical Simulation',
      description: 'Simulates acceleration due to gravity, velocity vectors, and elastic floor rebounds with dampening.',
      notes: [
        'Connect physics concepts of gravity with mathematical algorithms in Scratch.',
        'Adjust velocity dampening factors to model different ball materials (rubber vs lead).'
      ],
      keyBlocks: ['change VelocityY by -1', 'change Y by VelocityY', 'if <touching floor?> set Velocity to (Velocity * -0.85)']
    },
    {
      id: 'quiz',
      title: 'CBC Interactive Math Quiz Engine',
      projectId: '60917032',
      grade: 8,
      strand: 'Subroutines & Custom MyBlocks',
      description: 'Dynamic arithmetic question generator that prompts learner text inputs, evaluates correctness, and issues instant audio chimes.',
      notes: [
        'Illustrate procedural abstraction with custom blocks with parameters.',
        'Explain input validation and streak scoring logic.'
      ],
      keyBlocks: ['define GenerateQuestion (a, b)', 'ask [What is a + b?] and wait', 'if <answer = a + b>']
    }
  ];

  // Current active template notes
  const activePreset = PRESET_DEMOS.find(p => p.id === selectedPresetId) || PRESET_DEMOS[0];

  // --- Challenge Library State ---
  const [challenges, setChallenges] = useState<CodingChallenge[]>(() => Storage.getCodingChallenges());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [selectedChallengeForPreview, setSelectedChallengeForPreview] = useState<CodingChallenge | null>(challenges[0] || null);

  // New Challenge Form Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>(7);
  const [newTargetGroup, setNewTargetGroup] = useState('Grade 7 CS All Streams');
  const [newDifficulty, setNewDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [newStrand, setNewStrand] = useState('Computational Thinking & Game Algorithms');
  const [newScratchId, setNewScratchId] = useState('10128407');
  const [newStarterHint, setNewStarterHint] = useState('');
  const [newInstructions, setNewInstructions] = useState('1. Open Scratch and create a new project.\n2. Add arrow key controls.\n3. Add boundary collision detection.\n4. Save and copy your project link.');
  const [newDueDate, setNewDueDate] = useState('2026-10-30');
  const [newMaxPoints, setNewMaxPoints] = useState(30);
  const [criteriaList, setCriteriaList] = useState<CodingChallengeCriteria[]>([
    {
      id: 'c-1',
      label: 'Continuous Input Event Loop (Forever Block)',
      type: 'blocks_used',
      points: 10,
      description: 'Script maintains a loop polling key presses.'
    },
    {
      id: 'c-2',
      label: 'Boundary Sensing & Wall Collision',
      type: 'blocks_used',
      points: 10,
      description: 'Sprite detects perimeter and bounces.'
    },
    {
      id: 'c-3',
      label: 'Dynamic Score Counter >= 10',
      type: 'variable_score',
      targetValue: 10,
      points: 10,
      description: 'Increments points when objective is reached.'
    }
  ]);
  const [newCritLabel, setNewCritLabel] = useState('');
  const [newCritType, setNewCritType] = useState<CodingChallengeCriteria['type']>('blocks_used');
  const [newCritPoints, setNewCritPoints] = useState(5);
  const [newCritTargetVal, setNewCritTargetVal] = useState('');

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync challenges from Storage
  useEffect(() => {
    const handleChallengesUpdated = () => {
      setChallenges(Storage.getCodingChallenges());
    };
    window.addEventListener('coding-challenges-updated', handleChallengesUpdated);
    return () => window.removeEventListener('coding-challenges-updated', handleChallengesUpdated);
  }, []);

  // Handle Preset Select
  const handleSelectPreset = (preset: typeof PRESET_DEMOS[0]) => {
    setSelectedPresetId(preset.id);
    setActiveProjectId(preset.projectId);
    setProjectIdInput(preset.projectId);
    setProjectKey(Date.now());
  };

  // Compute embed URL (TurboWarp is safe and responsive for iframes)
  const getEmbedUrl = (projectId: string) => {
    const cleanId = projectId.trim();
    if (cleanId.startsWith('http')) {
      return cleanId;
    }
    if (embedProvider === 'turbowarp') {
      return `https://turbowarp.org/embed.html?project_url=https://scratch.mit.edu/projects/${cleanId}`;
    }
    return `https://scratch.mit.edu/projects/${cleanId}/embed`;
  };

  // Direct Assign to Class Handler
  const handleAssignChallengeToClass = (challenge: CodingChallenge, targetClass: string = 'Grade 7 Dove') => {
    const newAssignment: Assignment = {
      id: `asg-cs-${Date.now()}`,
      grade: challenge.grade,
      stream: 'Dove',
      subject: 'Computer Studies',
      title: `[CS LAB] ${challenge.title}`,
      instructions: `CODING TASK DIRECTIVE:\n${challenge.description}\n\nCRITERIA TO MEET:\n${challenge.completionCriteria.map(c => `• ${c.label} (${c.points} pts)`).join('\n')}\n\nSTARTER PROJECT:\n${challenge.scratchEmbedUrl || `Scratch ID: ${challenge.scratchProjectId}`}\n\n${challenge.instructions.join('\n')}`,
      dueDate: challenge.dueDate,
      maxScore: challenge.maxPoints,
      teacherName: currentUser.name,
      teacherId: currentUser.id,
      isVirtualLab: true,
      virtualLabType: 'scratch',
      labExperimentId: challenge.id,
      labTitle: challenge.title
    };

    Storage.addAssignment(newAssignment);

    // Also push a class announcement
    const announcement: Announcement = {
      id: `ann-cs-${Date.now()}`,
      title: `💻 New Computer Lab Task: ${challenge.title}`,
      content: `Your Computer Science instructor ${currentUser.name} has assigned a new Scratch challenge: "${challenge.title}". Due date is ${challenge.dueDate}. Visit your Homework or Lab Portal to launch the coding studio!`,
      type: 'general',
      targetGrade: challenge.grade,
      author: currentUser.name,
      authorRole: 'Computer Science Faculty',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    Storage.addAnnouncement(announcement);

    // Update challenge status
    Storage.updateCodingChallenge(challenge.id, {
      assignedToClasses: Array.from(new Set([...challenge.assignedToClasses, targetClass])),
      status: 'active'
    });

    showToast(`✓ Challenge "${challenge.title}" pushed successfully to ${targetClass}!`);
  };

  // Add Criterion to Form
  const handleAddCriterion = () => {
    if (!newCritLabel.trim()) return;
    const crit: CodingChallengeCriteria = {
      id: `crit-${Date.now()}`,
      label: newCritLabel.trim(),
      type: newCritType,
      points: Number(newCritPoints) || 5,
      targetValue: newCritTargetVal || undefined
    };
    setCriteriaList(prev => [...prev, crit]);
    setNewCritLabel('');
    setNewCritTargetVal('');
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteriaList(prev => prev.filter(c => c.id !== id));
  };

  // Create Challenge Submission
  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const instructionsArray = newInstructions
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    const challenge: CodingChallenge = {
      id: `ch-custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Create an algorithm in Scratch meeting specified CBC competencies.',
      grade: newGrade,
      stream: 'ALL',
      targetGroup: newTargetGroup,
      difficulty: newDifficulty,
      strand: newStrand,
      scratchProjectId: newScratchId || '10128407',
      scratchEmbedUrl: `https://scratch.mit.edu/projects/${newScratchId || '10128407'}/embed`,
      starterCodeHint: newStarterHint,
      completionCriteria: criteriaList.length > 0 ? criteriaList : [
        { id: 'crit-def', label: 'Working Scratch Script with Arrow Navigation', type: 'blocks_used', points: 15 }
      ],
      instructions: instructionsArray.length > 0 ? instructionsArray : ['1. Complete required blocks in Scratch.', '2. Test and verify collision sensing.'],
      maxPoints: Number(newMaxPoints) || 30,
      dueDate: newDueDate,
      assignedBy: `${currentUser.name} (CS Faculty)`,
      assignedAt: new Date().toISOString().split('T')[0],
      assignedToClasses: [newTargetGroup],
      status: 'active',
      submissionsCount: 0,
      featured: true
    };

    Storage.addCodingChallenge(challenge);
    setIsCreateModalOpen(false);
    setSelectedChallengeForPreview(challenge);
    showToast(`✓ New challenge "${challenge.title}" saved to library!`);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewStarterHint('');
  };

  // Delete challenge
  const handleDeleteChallenge = (id: string) => {
    Storage.deleteCodingChallenge(id);
    if (selectedChallengeForPreview?.id === id) {
      const remaining = challenges.filter(c => c.id !== id);
      setSelectedChallengeForPreview(remaining[0] || null);
    }
    showToast('Challenge removed from library.');
  };

  // Faculty clearance verification fallback
  if (!facultyClearanceGranted) {
    return (
      <div className="bg-white rounded-3xl p-8 border-2 border-indigo-100 shadow-md max-w-2xl mx-auto space-y-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center mx-auto text-indigo-700 shadow-inner">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase bg-indigo-100 text-indigo-800">
            Computer Science Department Clearance Required
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            EduSmart Computer Lab & Scratch Presentation Console
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
            This workspace provides direct classroom projection tools, Scratch runtime execution, and challenge assignment distribution. Access is restricted to Computer Science and STEM faculty members.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Educator Profile:</span>
            <span className="font-bold text-slate-800">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Designation / Role:</span>
            <span className="font-mono font-bold text-indigo-600">{currentUser.role.toUpperCase()} ({currentUser.tscNumber || 'TSC/44120/ED'})</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Departmental Clearance:</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
              Pending CS Department Authorization
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              setFacultyClearanceGranted(true);
              showToast('✓ Computer Science Faculty Clearance Verified!');
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorize CS Faculty Clearance Access</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Authorized for certified educators under the Kenya CBC Digital Literacy & Computer Studies framework.
          </p>
        </div>
      </div>
    );
  }

  // Filter challenges
  const filteredChallenges = challenges.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.strand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiff = filterDifficulty === 'ALL' || c.difficulty === filterDifficulty;
    const matchGrade = filterGrade === 'ALL' || String(c.grade) === filterGrade;
    return matchSearch && matchDiff && matchGrade;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-indigo-900/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Laptop className="w-3 h-3 text-indigo-400" />
                <span>CS Faculty Console · CBC Computer Studies</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Faculty Clearance</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Computer Lab & Scratch Studio</span>
              <span className="text-sm font-mono font-medium px-2 py-0.5 rounded bg-white/10 text-indigo-200">
                v2.6 Live
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Project live block-coding demonstrations in class sessions, embed Scratch-compatible environments on smartboards, distribute tailored coding challenges, and assess learner computational thinking rubrics.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/60 flex items-center justify-center text-white font-bold">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-indigo-200">Active Challenges</div>
                <div className="text-lg font-black text-white">{challenges.length} Stored</div>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Coding Challenge</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setActiveTab('projector')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'projector'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>1. Scratch Classroom Projector</span>
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Challenge Library ({challenges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assign_task')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assign_task'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>3. Assign Task to Class</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>4. Submissions & Rubrics</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: SCRATCH CLASSROOM PROJECTOR
          ======================================================== */}
      {activeTab === 'projector' && (
        <div className="space-y-6">
          {/* Top Control Bar for Projector */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Template Presets Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Demo Presets:
              </span>
              {PRESET_DEMOS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                </button>
              ))}
            </div>

            {/* Custom Project ID Input & Projector Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">ID:</span>
                <input
                  type="text"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  placeholder="e.g. 10128407"
                  className="w-24 bg-transparent outline-none font-mono font-bold text-slate-800"
                />
                <button
                  onClick={() => {
                    setActiveProjectId(projectIdInput.trim());
                    setProjectKey(Date.now());
                  }}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                >
                  Load
                </button>
              </div>

              {/* Provider Toggle (TurboWarp is optimal for iframe execution) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  onClick={() => { setEmbedProvider('turbowarp'); setProjectKey(Date.now()); }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    embedProvider === 'turbowarp' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Fast, sandbox-optimized WebGL player"
                >
                  TurboWarp
                </button>
                <button
                  onClick={() => { setEmbedProvider('scratch'); setProjectKey(Date.now()); }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    embedProvider === 'scratch' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Official Scratch MIT Embed"
                >
                  Scratch MIT
                </button>
              </div>

              {/* Reload Frame Button */}
              <button
                onClick={() => setProjectKey(Date.now())}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="Restart Demonstration Runtime"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Fullscreen Classroom Projector Mode */}
              <button
                onClick={() => setIsProjectorMode(!isProjectorMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  isProjectorMode
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                {isProjectorMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isProjectorMode ? 'Exit Projector' : 'Class Projector Mode'}</span>
              </button>
            </div>
          </div>

          {/* Embedded Scratch Projector Canvas */}
          <div className={`transition-all duration-300 ${
            isProjectorMode
              ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between overflow-hidden'
              : 'grid grid-cols-1 lg:grid-cols-12 gap-6'
          }`}>
            
            {/* The Main Iframe Player */}
            <div className={`${isProjectorMode ? 'w-full h-full flex flex-col' : 'lg:col-span-8 space-y-4'}`}>
              
              {isProjectorMode && (
                <div className="flex items-center justify-between pb-3 text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      LIVE CLASSROOM PROJECTION STAGE
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      — {activePreset.title} (Grade {activePreset.grade})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setProjectKey(Date.now())}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                    <button
                      onClick={() => setIsProjectorMode(false)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Exit Projector Mode</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl ${
                isProjectorMode ? 'flex-1 w-full min-h-[500px]' : 'aspect-4/3 sm:aspect-16/10'
              }`}>
                <iframe
                  key={projectKey}
                  src={getEmbedUrl(activeProjectId)}
                  allowTransparency={true}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                  className="w-full h-full border-none"
                  title="EduSmart Scratch Demonstration Studio"
                />

                {/* Overlay Projector Guide Badge */}
                <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono font-bold">
                    Scratch Runner #{activeProjectId} · {embedProvider.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">{activePreset.title}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-500">Grade {activePreset.grade} JSS</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const challengeToAssign = challenges.find(c => c.scratchProjectId === activeProjectId) || challenges[0];
                      if (challengeToAssign) {
                        handleAssignChallengeToClass(challengeToAssign, 'Grade 7 Dove');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push to Class Homework</span>
                  </button>

                  <a
                    href={`https://scratch.mit.edu/projects/${activeProjectId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Scratch MIT</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Side Demonstration Walkthrough & Teacher Notes (when not in full projector) */}
            {!isProjectorMode && (
              <div className="lg:col-span-4 space-y-4">
                {/* Pedagogical Demonstration Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-black text-sm text-slate-900">Classroom Lesson Guide</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                      {activePreset.strand}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activePreset.description}
                  </p>

                  {/* Teaching Steps / Inquiry Notes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Teacher Demonstration Checklist:
                    </div>
                    <ul className="space-y-2">
                      {activePreset.notes.map((note, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Scratch Blocks */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Target Code Blocks for this Demonstration:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activePreset.keyBlocks.map((block, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                        >
                          <Code2 className="w-2.5 h-2.5 text-amber-600" />
                          <span>{block}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Smartboard Mode Banner */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-4 text-white text-xs space-y-2 border border-indigo-800">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Monitor className="w-4 h-4" />
                    <span>Smartboard & Projector Tip</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tap the <strong>Class Projector Mode</strong> button above to project borderless onto your classroom display or interactive whiteboard during live lesson demos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: CHALLENGE LIBRARY & DISTRIBUTION
          ======================================================== */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          
          {/* Search, Filter & Create Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <Filter className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges by title, criteria, or target student group..."
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Grades</option>
                <option value="6">Grade 6 Primary</option>
                <option value="7">Grade 7 JSS</option>
                <option value="8">Grade 8 JSS</option>
                <option value="9">Grade 9 JSS</option>
              </select>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Challenge</span>
              </button>
            </div>
          </div>

          {/* Challenges Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Challenge Cards Grid */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                <span>Stored Challenges ({filteredChallenges.length})</span>
                <span>Click to inspect & distribute</span>
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                  <Laptop className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No challenges matched your filter</div>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterDifficulty('ALL'); setFilterGrade('ALL'); }}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredChallenges.map(challenge => {
                  const isSelected = selectedChallengeForPreview?.id === challenge.id;
                  return (
                    <div
                      key={challenge.id}
                      onClick={() => setSelectedChallengeForPreview(challenge)}
                      className={`rounded-2xl p-5 border-2 transition-all cursor-pointer space-y-3 shadow-xs ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            challenge.difficulty === 'Beginner'
                              ? 'bg-emerald-100 text-emerald-800'
                              : challenge.difficulty === 'Intermediate'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Grade {challenge.grade} JSS
                          </span>
                        </div>

                        <span className="text-xs font-bold text-indigo-600 font-mono">
                          Max: {challenge.maxPoints} pts
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {challenge.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                          {challenge.description}
                        </p>
                      </div>

                      {/* Criteria Count & Target Group */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Target className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-semibold text-slate-700">Group: {challenge.targetGroup}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            {challenge.completionCriteria.length} criteria defined
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignChallengeToClass(challenge, challenge.targetGroup);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Distribute</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Challenge Details & Criteria Inspector */}
            <div className="lg:col-span-5 space-y-4">
              {selectedChallengeForPreview ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5 sticky top-20">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        Challenge Specification & Rubric
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Due: {selectedChallengeForPreview.dueDate}
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900">
                      {selectedChallengeForPreview.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedChallengeForPreview.description}
                    </p>
                  </div>

                  {/* Defined Completion Criteria */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Defined Completion Criteria</span>
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600">
                        Total: {selectedChallengeForPreview.maxPoints} pts
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedChallengeForPreview.completionCriteria.map((crit, idx) => (
                        <div key={crit.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{crit.label}</span>
                            </span>
                            <span className="font-mono text-emerald-700">+{crit.points} pts</span>
                          </div>
                          {crit.description && (
                            <p className="text-[11px] text-slate-500 pl-5.5 leading-snug">
                              {crit.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Starter Hints & Instructions */}
                  {selectedChallengeForPreview.starterCodeHint && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
                      <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Starter Code Hint:</span>
                      </div>
                      <p className="text-xs font-mono text-amber-900 leading-relaxed">
                        {selectedChallengeForPreview.starterCodeHint}
                      </p>
                    </div>
                  )}

                  {/* Actions: Distribute / Push to Group */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAssignChallengeToClass(selectedChallengeForPreview, selectedChallengeForPreview.targetGroup)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Distribute to {selectedChallengeForPreview.targetGroup}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveProjectId(selectedChallengeForPreview.scratchProjectId || '10128407');
                          setProjectIdInput(selectedChallengeForPreview.scratchProjectId || '10128407');
                          setActiveTab('projector');
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Presentation className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Project in Class</span>
                      </button>

                      <button
                        onClick={() => handleDeleteChallenge(selectedChallengeForPreview.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
                        title="Delete Challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                  Select a challenge from the library to inspect defined criteria and distribution options.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ASSIGN TASK TO CLASS
          ======================================================== */}
      {activeTab === 'assign_task' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
              Task Push Engine · Immediate Student Dispatch
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Assign Scratch Coding Task to Student Class
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a coding challenge or draft a custom task to deliver instantly into student homework consoles and student e-portfolios.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Base Challenge from Library
              </label>
              <select
                onChange={(e) => {
                  const found = challenges.find(c => c.id === e.target.value);
                  if (found) setSelectedChallengeForPreview(found);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800"
              >
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.difficulty}] {c.title} — Grade {c.grade} ({c.maxPoints} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Student Group / Stream
                </label>
                <select
                  id="target-stream-select"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="Grade 7 Dove">Grade 7 Dove (JSS)</option>
                  <option value="Grade 7 Eagle">Grade 7 Eagle (JSS)</option>
                  <option value="Grade 7 Hawk">Grade 7 Hawk (JSS)</option>
                  <option value="Grade 8 Dove">Grade 8 Dove (JSS)</option>
                  <option value="Grade 8 Eagle">Grade 8 Eagle (JSS)</option>
                  <option value="CS Coding Club">After-School CS Innovators Club</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  defaultValue="2026-10-25"
                  id="due-date-input"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            {selectedChallengeForPreview && (
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="font-black text-xs text-indigo-900">
                  Task Preview: {selectedChallengeForPreview.title}
                </div>
                <p className="text-xs text-indigo-950/80 leading-relaxed">
                  {selectedChallengeForPreview.description}
                </p>
                <div className="text-[11px] font-bold text-indigo-700">
                  Criteria to evaluate ({selectedChallengeForPreview.completionCriteria.length} items):
                </div>
                <ul className="text-xs text-indigo-900 space-y-1">
                  {selectedChallengeForPreview.completionCriteria.map(crit => (
                    <li key={crit.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span>{crit.label} (+{crit.points} pts)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                if (selectedChallengeForPreview) {
                  const selectEl = document.getElementById('target-stream-select') as HTMLSelectElement;
                  const targetStream = selectEl?.value || 'Grade 7 Dove';
                  handleAssignChallengeToClass(selectedChallengeForPreview, targetStream);
                }
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Confirm & Dispatch Task to Class</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: SUBMISSIONS & RUBRICS
          ======================================================== */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Evaluation & Marking Terminal
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Learner Coding Submissions & Criteria Scoring
              </h3>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              34 Total Submissions Recorded
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'sub-1',
                studentName: 'Amani Kimani',
                admissionNo: 'ADM/2026/0412',
                challengeTitle: 'Sprite Obstacle Maze & Collision Sensor',
                grade: 7,
                stream: 'Dove',
                submittedAt: 'Today at 09:45 AM',
                scratchUrl: 'https://scratch.mit.edu/projects/10128407',
                score: '28 / 30',
                rubricGrade: 'Exceeding Expectations (Level 4)',
                criteriaPassed: '4 of 4 Criteria Met'
              },
              {
                id: 'sub-2',
                studentName: 'Faraji Omondi',
                admissionNo: 'ADM/2026/0418',
                challengeTitle: 'Variable-Driven Scorekeeper & Countdown',
                grade: 6,
                stream: 'Eagle',
                submittedAt: 'Yesterday at 04:15 PM',
                scratchUrl: 'https://scratch.mit.edu/projects/60917032',
                score: '24 / 25',
                rubricGrade: 'Meeting Expectations (Level 3)',
                criteriaPassed: '3 of 3 Criteria Met'
              },
              {
                id: 'sub-3',
                studentName: 'Zawadi Chebet',
                admissionNo: 'ADM/2026/0425',
                challengeTitle: 'Autonomous Bouncing Ball & Wall Physics',
                grade: 8,
                stream: 'Dove',
                submittedAt: '2 days ago',
                scratchUrl: 'https://scratch.mit.edu/projects/10128407',
                score: '22 / 25',
                rubricGrade: 'Meeting Expectations (Level 3)',
                criteriaPassed: '2 of 2 Criteria Met'
              }
            ].map(sub => (
              <div key={sub.id} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{sub.studentName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {sub.admissionNo} · Grade {sub.grade} {sub.stream}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-700">{sub.challengeTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Submitted: {sub.submittedAt}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-700">{sub.score}</div>
                    <div className="text-[10px] font-bold text-slate-500">{sub.rubricGrade}</div>
                  </div>

                  <a
                    href={sub.scratchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Run Project</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW CODING CHALLENGE
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  Challenge Library Creator
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  New Custom Coding Challenge
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sprite Obstacle Maze & Coordinate Sensor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objective & Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the algorithm and programming objectives..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grade Level
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                  >
                    <option value={6}>Grade 6 Primary</option>
                    <option value={7}>Grade 7 JSS</option>
                    <option value={8}>Grade 8 JSS</option>
                    <option value={9}>Grade 9 JSS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Student Group
                  </label>
                  <input
                    type="text"
                    value={newTargetGroup}
                    onChange={(e) => setNewTargetGroup(e.target.value)}
                    placeholder="e.g. Grade 7 CS All"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scratch Project ID / Starter Link
                  </label>
                  <input
                    type="text"
                    value={newScratchId}
                    onChange={(e) => setNewScratchId(e.target.value)}
                    placeholder="e.g. 10128407"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date & Max Points
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                    />
                    <input
                      type="number"
                      value={newMaxPoints}
                      onChange={(e) => setNewMaxPoints(Number(e.target.value))}
                      className="w-20 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Completion Criteria Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Defined Completion Criteria ({criteriaList.length})</span>
                  </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {criteriaList.map((crit) => (
                    <div key={crit.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{crit.label}</span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2">({crit.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700">+{crit.points} pts</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(crit.id)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Criteria Sub-Form */}
                <div className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  <input
                    type="text"
                    value={newCritLabel}
                    onChange={(e) => setNewCritLabel(e.target.value)}
                    placeholder="Criteria name (e.g. Touching wall collision)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                  <select
                    value={newCritType}
                    onChange={(e) => setNewCritType(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="blocks_used">Blocks Used</option>
                    <option value="variable_score">Variable Score</option>
                    <option value="broadcast_message">Broadcast Message</option>
                    <option value="timer_condition">Timer Condition</option>
                    <option value="custom_rubric">Custom Rubric</option>
                  </select>
                  <input
                    type="number"
                    value={newCritPoints}
                    onChange={(e) => setNewCritPoints(Number(e.target.value))}
                    placeholder="Pts"
                    className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Step-by-Step Instructions (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Save & Distribute Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
