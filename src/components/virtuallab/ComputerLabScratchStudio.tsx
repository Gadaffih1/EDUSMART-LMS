import React, { useState, useEffect, useRef } from 'react';
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
  Sliders, 
  CheckCircle2, 
  BookOpen, 
  Eye, 
  Plus, 
  Share2, 
  Monitor, 
  Cpu, 
  HelpCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Terminal,
  MousePointer,
  Award
} from 'lucide-react';
import { User, GradeLevel } from '../../types';

export interface ScratchProjectTemplate {
  id: string;
  title: string;
  grade: GradeLevel;
  strand: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  scratchEmbedUrl?: string;
  scratchProjectId?: string;
  initialCodeBlocks: {
    category: 'events' | 'motion' | 'looks' | 'control' | 'variables' | 'sensing';
    label: string;
    actionType: string;
    params?: any;
  }[];
  teacherNotes: string[];
  inquiryQuestions: {
    question: string;
    answer: string;
  }[];
  rubricCriteria: string[];
}

export const CBC_SCRATCH_PROJECTS: ScratchProjectTemplate[] = [
  {
    id: 'scratch-maze-game',
    title: 'Interactive Maze Navigator & Collision Sensing',
    grade: 7,
    strand: 'Computational Thinking & Game Algorithms',
    difficulty: 'Intermediate',
    description: 'Design a keyboard-controlled sprite that navigates through a labyrinth, detects boundary walls using sensing blocks, and awards points when reaching the treasure goal.',
    scratchProjectId: '10128407',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/10128407/embed',
    initialCodeBlocks: [
      { category: 'events', label: 'when [green flag] clicked', actionType: 'start' },
      { category: 'motion', label: 'go to x: (-180) y: (120)', actionType: 'goto', params: { x: -180, y: 120 } },
      { category: 'looks', label: 'say [Start Maze!] for (2) secs', actionType: 'say', params: { text: 'Start Maze!', time: 2 } },
      { category: 'control', label: 'forever', actionType: 'loop' },
      { category: 'motion', label: 'move (10) steps', actionType: 'move', params: { steps: 10 } },
      { category: 'sensing', label: 'if <touching [Wall]?> then bounce', actionType: 'bounce' },
      { category: 'variables', label: 'change [Score] by (1)', actionType: 'addScore', params: { amount: 1 } }
    ],
    teacherNotes: [
      'Emphasize coordinate geometry: X is horizontal (-240 to +240) and Y is vertical (-180 to +180).',
      'Demonstrate the difference between sequential execution and "forever" continuous event loops.',
      'Show how collision sensing prevents the sprite from teleporting through walls.'
    ],
    inquiryQuestions: [
      {
        question: 'Why do we need a "forever" loop wrapped around the movement and sensing blocks?',
        answer: 'Without a continuous forever loop, the computer checks the condition once at startup and stops immediately.'
      },
      {
        question: 'What happens if we decrease the step value from 10 to 3?',
        answer: 'The sprite moves more smoothly and slowly, giving the learner more precise navigation control.'
      }
    ],
    rubricCriteria: [
      'Proper initialization of sprite coordinates at origin',
      'Accurate implementation of collision detection',
      'Clean variable scoring upon reaching the objective',
      'Clear learner code commenting and pseudocode explanation'
    ]
  },
  {
    id: 'scratch-science-photosynthesis',
    title: 'Science Simulation: Plant Water Uptake & Photosynthesis',
    grade: 7,
    strand: 'Integrated Science & Computational Modeling',
    difficulty: 'Intermediate',
    description: 'Model how chlorophyll absorbs sunlight and xylem vessels transport water in plants. Demonstrates to learners how coding can simulate real biological processes.',
    scratchProjectId: '60917032',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/60917032/embed',
    initialCodeBlocks: [
      { category: 'events', label: 'when [green flag] clicked', actionType: 'start' },
      { category: 'variables', label: 'set [Sunlight Level] to (100)', actionType: 'setSunlight', params: { val: 100 } },
      { category: 'motion', label: 'glide (2) secs to x: (0) y: (50)', actionType: 'glide', params: { x: 0, y: 50, time: 2 } },
      { category: 'looks', label: 'switch costume to [Leaf Green]', actionType: 'costume', params: { name: 'Leaf Green' } },
      { category: 'control', label: 'repeat (5)', actionType: 'repeat' },
      { category: 'looks', label: 'say [Producing Glucose + Oxygen] for (2) secs', actionType: 'say', params: { text: 'Producing Glucose + O2', time: 2 } }
    ],
    teacherNotes: [
      'Highlight cross-curricular CBC integration between Computer Studies and Integrated Science.',
      'Demonstrate how changing sunlight and water variables simulates environmental conditions (drought vs sunlight).',
      'Encourage learners to use broadcast messages to synchronize roots, stem, and leaves sprites.'
    ],
    inquiryQuestions: [
      {
        question: 'How do variables in Scratch represent physical biological factors like temperature or sunlight?',
        answer: 'Variables store numeric values that can increase or decrease, dynamically altering the sprite behavior and animations.'
      }
    ],
    rubricCriteria: [
      'Accurate biological modeling of plant inputs and outputs',
      'Use of variables to regulate simulation speed and factors',
      'Smooth sprite transitions and animations'
    ]
  },
  {
    id: 'scratch-calculator-loops',
    title: 'CBC Grade 8: Logic Flow, Loops & Score Calculator',
    grade: 8,
    strand: 'Data Processing & Conditional Decision Trees',
    difficulty: 'Beginner',
    description: 'Construct an automated interactive math quiz sprite. The program asks arithmetic questions, validates student input using if-else logic, and tallies the final CBC performance score.',
    scratchProjectId: '41738290',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/41738290/embed',
    initialCodeBlocks: [
      { category: 'events', label: 'when [green flag] clicked', actionType: 'start' },
      { category: 'variables', label: 'set [Score] to (0)', actionType: 'setScore', params: { val: 0 } },
      { category: 'looks', label: 'say [Welcome to CBC Math Quiz!] for (2) secs', actionType: 'say', params: { text: 'Welcome to CBC Math Quiz!', time: 2 } },
      { category: 'sensing', label: 'ask [What is 15 x 4?] and wait', actionType: 'ask' },
      { category: 'control', label: 'if <answer = 60> then', actionType: 'if' },
      { category: 'variables', label: 'change [Score] by (10)', actionType: 'addScore', params: { amount: 10 } },
      { category: 'looks', label: 'say [Correct! Exceeding Expectation] for (2) secs', actionType: 'say', params: { text: 'Correct!', time: 2 } }
    ],
    teacherNotes: [
      'Teach algorithmic branching (If/Else structures).',
      'Explain how user input validation prevents logic errors in software.',
      'Show learners how this forms the foundation of real web development and financial calculators.'
    ],
    inquiryQuestions: [
      {
        question: 'What is the role of the "wait" block after asking a question in Scratch?',
        answer: 'It suspends script execution until the user enters text in the input box and presses Enter.'
      }
    ],
    rubricCriteria: [
      'Accurate mathematical logic and conditional checks',
      'Robust feedback messages for both correct and incorrect inputs',
      'Score accumulation and final CBC performance badge'
    ]
  },
  {
    id: 'scratch-traffic-lights',
    title: 'Automated Traffic Light Sequence & Timer Broadcasting',
    grade: 8,
    strand: 'Robotics, Embedded Systems & Timed State Machines',
    difficulty: 'Intermediate',
    description: 'Simulate a road intersection control system using timed broadcast messages: Green light (Go) -> Amber light (Get Ready) -> Red light (Stop) with pedestrian crossing alerts.',
    scratchProjectId: '24915002',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/24915002/embed',
    initialCodeBlocks: [
      { category: 'events', label: 'when [green flag] clicked', actionType: 'start' },
      { category: 'control', label: 'forever', actionType: 'loop' },
      { category: 'looks', label: 'switch costume to [Green Light]', actionType: 'costume', params: { name: 'Green' } },
      { category: 'control', label: 'wait (5) secs', actionType: 'wait', params: { secs: 5 } },
      { category: 'looks', label: 'switch costume to [Yellow Light]', actionType: 'costume', params: { name: 'Yellow' } },
      { category: 'control', label: 'wait (2) secs', actionType: 'wait', params: { secs: 2 } },
      { category: 'looks', label: 'switch costume to [Red Light]', actionType: 'costume', params: { name: 'Red' } },
      { category: 'control', label: 'wait (5) secs', actionType: 'wait', params: { secs: 5 } }
    ],
    teacherNotes: [
      'Relate Scratch timing to embedded microcontrollers (Arduino / Raspberry Pi).',
      'Discuss real-world road safety systems in Kenya (e.g. KenHA smart highway signals).',
      'Guide learners on using broadcast events so pedestrian sprites cross safely on Red.'
    ],
    inquiryQuestions: [
      {
        question: 'Why must the Yellow/Amber light duration be shorter than Red and Green?',
        answer: 'Yellow serves as a transitional safety warning for motorists to decelerate before the complete stop signal.'
      }
    ],
    rubricCriteria: [
      'Sequential state transitions matching road safety rules',
      'Accurate timing delays using wait blocks',
      'Integration of pedestrian crossing broadcast trigger'
    ]
  }
];

interface ComputerLabScratchStudioProps {
  currentUser?: User;
  onAssignProject?: (project: ScratchProjectTemplate) => void;
  isTeacher?: boolean;
}

export const ComputerLabScratchStudio: React.FC<ComputerLabScratchStudioProps> = ({
  currentUser,
  onAssignProject,
  isTeacher = true
}) => {
  const [selectedProject, setSelectedProject] = useState<ScratchProjectTemplate>(CBC_SCRATCH_PROJECTS[0]);
  const [viewMode, setViewMode] = useState<'simulator' | 'embed_player' | 'teacher_guide'>('simulator');
  const [customProjectId, setCustomProjectId] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string>(CBC_SCRATCH_PROJECTS[0].scratchEmbedUrl || '');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  
  // Interactive Simulator State
  const [isRunning, setIsRunning] = useState(false);
  const [spriteX, setSpriteX] = useState(0);
  const [spriteY, setSpriteY] = useState(0);
  const [spriteRotation, setSpriteRotation] = useState(0);
  const [spriteSpeech, setSpriteSpeech] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isSmartboardMode, setIsSmartboardMode] = useState(false);
  const [activeCodeBlocks, setActiveCodeBlocks] = useState(selectedProject.initialCodeBlocks);

  // Sync when template changes
  useEffect(() => {
    setActiveCodeBlocks(selectedProject.initialCodeBlocks);
    setEmbedUrl(selectedProject.scratchEmbedUrl || `https://scratch.mit.edu/projects/${selectedProject.scratchProjectId}/embed`);
    setRevealedAnswers({});
    resetSimulation();
  }, [selectedProject]);

  const resetSimulation = () => {
    setIsRunning(false);
    setSpriteX(0);
    setSpriteY(0);
    setSpriteRotation(0);
    setSpriteSpeech(null);
    setScore(0);
    setActiveStepIndex(-1);
  };

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStepIndex(0);

    let step = 0;
    const blocks = activeCodeBlocks;

    const interval = setInterval(() => {
      if (step >= blocks.length) {
        clearInterval(interval);
        setIsRunning(false);
        setActiveStepIndex(-1);
        return;
      }

      const blk = blocks[step];
      setActiveStepIndex(step);

      if (blk.actionType === 'move') {
        setSpriteX(prev => Math.min(180, prev + (blk.params?.steps || 25)));
      } else if (blk.actionType === 'goto') {
        setSpriteX(blk.params?.x || 0);
        setSpriteY(blk.params?.y || 0);
      } else if (blk.actionType === 'say') {
        setSpriteSpeech(blk.params?.text || 'Hello CBC!');
        setTimeout(() => setSpriteSpeech(null), (blk.params?.time || 2) * 1000);
      } else if (blk.actionType === 'addScore') {
        setScore(prev => prev + (blk.params?.amount || 10));
      } else if (blk.actionType === 'setScore') {
        setScore(blk.params?.val || 0);
      } else if (blk.actionType === 'bounce') {
        setSpriteRotation(prev => (prev + 180) % 360);
      } else if (blk.actionType === 'glide') {
        setSpriteX(blk.params?.x || 0);
        setSpriteY(blk.params?.y || 50);
      }

      step++;
    }, 1200);
  };

  const handleLoadCustomScratch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customProjectId.replace(/\D/g, '');
    if (cleanId) {
      setEmbedUrl(`https://scratch.mit.edu/projects/${cleanId}/embed`);
      setViewMode('embed_player');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'motion': return 'bg-blue-600 text-white border-blue-700';
      case 'looks': return 'bg-purple-600 text-white border-purple-700';
      case 'events': return 'bg-amber-500 text-slate-900 border-amber-600 font-bold';
      case 'control': return 'bg-orange-500 text-white border-orange-600';
      case 'sensing': return 'bg-cyan-600 text-white border-cyan-700';
      case 'variables': return 'bg-rose-600 text-white border-rose-700';
      default: return 'bg-slate-700 text-white border-slate-800';
    }
  };

  return (
    <div className={`space-y-6 ${isSmartboardMode ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto text-white' : ''}`}>
      {/* Top Header / Context bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Laptop className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  CBC Computer Science & ICT Lab
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Scratch Block Programming Suite
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Smartboard Demonstration Ready
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Computer Coding Lab & Scratch Demonstration Studio
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Teacher live coding walkthroughs, Scratch interactive simulation engine, student algorithm assignments & CBC computing standards.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSmartboardMode(!isSmartboardMode)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Toggle Classroom Smartboard Projector Mode"
            >
              {isSmartboardMode ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
              <span>{isSmartboardMode ? 'Exit Fullscreen' : 'Smartboard Mode'}</span>
            </button>

            {onAssignProject && isTeacher && (
              <button
                onClick={() => onAssignProject(selectedProject)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Give Scratch Assignment</span>
              </button>
            )}

            <a
              href="https://scratch.mit.edu/create"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Scratch Online</span>
            </a>
          </div>
        </div>

        {/* View Switcher Sub-nav */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setViewMode('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'simulator'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CBC Block Simulator & Stage</span>
            </button>
            <button
              onClick={() => setViewMode('embed_player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'embed_player'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Live Scratch Embedded Player</span>
            </button>
            <button
              onClick={() => setViewMode('teacher_guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'teacher_guide'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Pedagogy & Inquiry Guide</span>
            </button>
          </div>

          {/* Quick Select Project Template */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Active Project:</span>
            <select
              value={selectedProject.id}
              onChange={(e) => {
                const found = CBC_SCRATCH_PROJECTS.find(p => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            >
              {CBC_SCRATCH_PROJECTS.map(p => (
                <option key={p.id} value={p.id}>
                  Grade {p.grade}: {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Areas based on viewMode */}
      {viewMode === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Stage & Sprite Execution Canvas (5 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Stage Controls */}
              <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-xs font-mono font-bold text-slate-300 ml-2">Scratch Stage (480 x 360)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={runSimulation}
                    disabled={isRunning}
                    className={`px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer animate-pulse'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run (Green Flag)</span>
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all cursor-pointer"
                    title="Reset coordinates"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* The Visual Stage Canvas */}
              <div className="relative h-80 sm:h-96 bg-gradient-to-b from-sky-100 via-indigo-50 to-emerald-100 border-b border-slate-200 overflow-hidden flex items-center justify-center">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Coordinate Origin Crosshair */}
                <div className="absolute w-full h-[1px] bg-slate-300 top-1/2 left-0 pointer-events-none"></div>
                <div className="absolute h-full w-[1px] bg-slate-300 left-1/2 top-0 pointer-events-none"></div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/80 text-[10px] font-mono text-slate-500 border border-slate-200">
                  X: {spriteX} · Y: {spriteY}
                </div>

                {/* Score Widget */}
                <div className="absolute top-2 right-2 px-3 py-1 rounded-xl bg-slate-900/90 text-white text-xs font-mono font-bold border border-slate-700 flex items-center gap-2 shadow-xs">
                  <span className="text-amber-400">SCORE:</span>
                  <span className="text-base font-black">{score}</span>
                </div>

                {/* Interactive Scratch Sprite (Cat / CBC Robot) */}
                <div
                  className="absolute transition-all duration-700 ease-out flex flex-col items-center"
                  style={{
                    transform: `translate(${spriteX}px, ${-spriteY}px) rotate(${spriteRotation}deg)`
                  }}
                >
                  {/* Speech Bubble */}
                  {spriteSpeech && (
                    <div className="mb-2 px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-2xl border-2 border-indigo-600 shadow-lg relative animate-bounce">
                      <span>{spriteSpeech}</span>
                      <div className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-indigo-600 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
                    </div>
                  )}

                  {/* Sprite Character Body */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-md p-1 border-2 border-white flex flex-col items-center justify-center text-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
                    <span className="text-2xl select-none">🐱</span>
                    <span className="text-[9px] font-black tracking-tight uppercase text-amber-950">Scratch Cat</span>
                  </div>
                </div>

                {/* Destination / Goal Target for Game Algorithm */}
                {selectedProject.id === 'scratch-maze-game' && (
                  <div className="absolute right-8 top-12 p-2 bg-amber-400/80 rounded-2xl border-2 border-amber-600 animate-pulse text-center">
                    <Award className="w-8 h-8 text-amber-950 mx-auto" />
                    <span className="text-[10px] font-extrabold text-amber-950 uppercase">Goal!</span>
                  </div>
                )}
              </div>

              {/* Stage Telemetry Footer */}
              <div className="p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Sprite:</span>
                    <strong className="text-slate-800">Cat1</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Rotation:</span>
                    <strong className="text-slate-800 font-mono">{spriteRotation}°</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Direction:</span>
                    <strong className="text-emerald-700 font-bold">90 (Right)</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSpriteX(prev => Math.max(-180, prev - 20))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ← Left
                  </button>
                  <button
                    onClick={() => setSpriteX(prev => Math.min(180, prev + 20))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Right →
                  </button>
                  <button
                    onClick={() => setSpriteY(prev => Math.min(120, prev + 20))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => setSpriteY(prev => Math.max(-120, prev - 20))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ↓ Down
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code Blocks Workspace & Palette (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Scratch Code Stack Workspace
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {activeCodeBlocks.length} Blocks in Script
                </span>
              </div>

              {/* Block Coding Categories Legend */}
              <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-slate-100">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Motion</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">Looks</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Events</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Control</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Sensing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Variables</span>
              </div>

              {/* Connected Scratch Code Block Stack */}
              <div className="py-4 space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 min-h-[320px] overflow-y-auto">
                {activeCodeBlocks.map((blk, idx) => {
                  const isCurrent = activeStepIndex === idx;
                  const colorClasses = getCategoryColor(blk.category);
                  
                  return (
                    <div
                      key={idx}
                      className={`relative px-4 py-2.5 rounded-xl border-b-4 text-xs font-mono font-bold transition-all shadow-xs flex items-center justify-between ${colorClasses} ${
                        isCurrent ? 'ring-4 ring-amber-400 scale-[1.02] shadow-md' : 'hover:opacity-95'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent && <Play className="w-3.5 h-3.5 text-white animate-bounce" />}
                        <span>{blk.label}</span>
                      </div>
                      <span className="text-[10px] opacity-75 uppercase tracking-wider">{blk.category}</span>
                    </div>
                  );
                })}
              </div>

              {/* Interactive block action bar */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Click <strong>Run (Green Flag)</strong> to execute this script in sequential order.
                </div>
                <button
                  onClick={() => {
                    setActiveCodeBlocks(selectedProject.initialCodeBlocks);
                    resetSimulation();
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  Reset Default Blocks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Scratch Live Player View */}
      {viewMode === 'embed_player' && (
        <div className="space-y-4">
          {/* Custom Project Loader Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Scratch Project Embed Studio
              </h3>
              <p className="text-xs text-slate-500">
                Load any verified Scratch project using its ID or choose from our pre-configured CBC coding curricula.
              </p>
            </div>

            <form onSubmit={handleLoadCustomScratch} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter Scratch Project ID (e.g. 10128407)"
                value={customProjectId}
                onChange={(e) => setCustomProjectId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono w-full sm:w-64 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
              >
                Load Project
              </button>
            </form>
          </div>

          {/* Iframe Container */}
          <div className="bg-slate-950 rounded-3xl p-2 sm:p-4 border border-slate-800 shadow-xl overflow-hidden flex flex-col items-center">
            <div className="w-full max-w-[620px] aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              <iframe
                src={embedUrl}
                allowTransparency={true}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowFullScreen={true}
                title={`Scratch Project - ${selectedProject.title}`}
                className="w-full h-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Powered by official Scratch Embed API (MIT Media Lab) · Safe, sandboxed classroom runtime.
            </p>
          </div>
        </div>
      )}

      {/* Teacher Pedagogy, Inquiry & Assignment Guide */}
      {viewMode === 'teacher_guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inquiry Questions for Classroom */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900">
                Classroom Demonstration Questions
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Ask your learners these algorithmic inquiry prompts before revealing the code execution result.
            </p>

            <div className="space-y-3">
              {selectedProject.inquiryQuestions.map((q, idx) => {
                const isRevealed = !!revealedAnswers[idx];
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <p className="text-xs font-bold text-amber-950">
                      Q{idx + 1}: {q.question}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isRevealed ? 'Hide Answer' : 'Reveal Model Answer'}</span>
                      </button>
                    </div>
                    {isRevealed && (
                      <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs text-slate-700 animate-in fade-in duration-200">
                        <strong>Teacher Answer:</strong> {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher CBC Rubrics & Notes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Teacher Notes & CBC Assessment Rubric
              </h3>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pedagogical Delivery Notes
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                {selectedProject.teacherNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">{note}</li>
                ))}
              </ul>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 pt-3">
                CBC Assessment Evaluation Rubric
              </h4>
              <div className="space-y-2">
                {selectedProject.rubricCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
