import React, { useState } from 'react';
import { 
  PHET_SIMULATIONS, 
  PhetSimulation 
} from './phetSimulationsData';
import { ClassicCircuitsPhET } from './classic/ClassicCircuitsPhET';
import { ClassicPhScalePhET } from './classic/ClassicPhScalePhET';
import { ClassicForcesMotionPhET } from './classic/ClassicForcesMotionPhET';
import { ClassicBendingLightPhET } from './classic/ClassicBendingLightPhET';
import { ClassicEnergySkateParkPhET } from './classic/ClassicEnergySkateParkPhET';
import { ClassicWaveOnStringPhET } from './classic/ClassicWaveOnStringPhET';
import { SyncEngine } from '../../utils/syncEngine';
import { User } from '../../types';
import { 
  Atom, 
  Zap, 
  TestTube, 
  Flame, 
  Search, 
  Sliders, 
  Clock, 
  ExternalLink, 
  Maximize2, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Save, 
  Check, 
  Compass, 
  Layers, 
  Sparkles,
  ArrowRight,
  Shield,
  Play,
  Pause,
  Award
} from 'lucide-react';

interface PhetSimulationsHubProps {
  currentUser?: User;
  initialSimulationId?: string;
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const PhetSimulationsHub: React.FC<PhetSimulationsHubProps> = ({
  currentUser,
  initialSimulationId,
  onRecordObservation,
  className = ''
}) => {
  // Selected simulation
  const [selectedSim, setSelectedSim] = useState<PhetSimulation>(() => {
    if (initialSimulationId) {
      const found = PHET_SIMULATIONS.find(s => s.id === initialSimulationId);
      if (found) return found;
    }
    return PHET_SIMULATIONS[0]; // DC Circuits default
  });

  // Engine Mode: 'classic_native' (interactive custom high-fps engine) or 'phet_html5' (official phet iframe)
  const [engineMode, setEngineMode] = useState<'classic_native' | 'phet_html5'>('classic_native');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Floating Classic Lab Tools
  const [showStopwatch, setShowStopwatch] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [rulerPos, setRulerPos] = useState<{ x: number; y: number }>({ x: 40, y: 80 });

  // Quick Notebook note
  const [customLearnerNote, setCustomLearnerNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Stopwatch timer effect
  React.useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(s => s + 0.1);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Filtered simulations
  const filteredSims = PHET_SIMULATIONS.filter(sim => {
    const matchQuery = sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.strand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'ALL' || sim.subject === selectedSubject;
    const matchDiff = selectedDifficulty === 'ALL' || sim.difficulty === selectedDifficulty;
    return matchQuery && matchSubject && matchDiff;
  });

  const handleLogObservation = (engineData?: any) => {
    const reportData = {
      id: 'phet-obs-' + Date.now(),
      studentName: currentUser?.name || 'Amina Mwangi',
      admissionNumber: currentUser?.admissionNumber || 'ADM-2026-042',
      grade: currentUser?.grade || 7,
      simulationId: selectedSim.id,
      simulationTitle: selectedSim.title,
      subject: selectedSim.subject,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toISOString(),
      measurements: engineData || { note: customLearnerNote || 'Simulation observed in equilibrium.' },
      learnerNote: customLearnerNote,
      curriculumRef: selectedSim.cbcCurriculumRef
    };

    try {
      const existing = JSON.parse(localStorage.getItem('edusmart_virtual_lab_reports') || '[]');
      existing.unshift(reportData);
      SyncEngine.persistItem('edusmart_virtual_lab_reports', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    onRecordObservation?.(reportData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setCustomLearnerNote('');
    }, 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Simulation Selector Bar & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Atom className="w-3 h-3 text-orange-600 animate-spin" />
                PhET Classic Interactive Simulations
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {PHET_SIMULATIONS.length} Simulations Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Interactive Science Simulations Workbench
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hands-on interactive models powered by Classic PhET physics, chemistry, and biology inquiry engines.
            </p>
          </div>

          {/* Engine Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start md:self-center">
            <button
              onClick={() => setEngineMode('classic_native')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                engineMode === 'classic_native'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Classic Native Engine (Instant)</span>
            </button>

            <button
              onClick={() => setEngineMode('phet_html5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                engineMode === 'phet_html5'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official PhET HTML5 Web</span>
            </button>
          </div>
        </div>

        {/* Search & Subject Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search simulations (e.g. circuits, pH, motion, optics, energy)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Physics', 'Chemistry', 'Integrated Science'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-orange-500 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Simulation Horizontal Carousel / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filteredSims.map(sim => {
            const isSelected = selectedSim.id === sim.id;
            return (
              <button
                key={sim.id}
                onClick={() => setSelectedSim(sim)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-sm font-black ring-2 ring-orange-400/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-orange-500'}`} />
                <span>{sim.title.split(':')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {sim.subject}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SIMULATION ACTIVE VIEWPORT & TOOLS */}
      {/* ============================================================== */}
      <div className="space-y-4">
        
        {/* Top Simulation Context Bar */}
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-black uppercase text-[10px]">
                {selectedSim.subject}
              </span>
              <span className="text-slate-400 font-bold">{selectedSim.gradeLevel}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-mono text-[11px]">{selectedSim.strand}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black mt-1 text-white">
              {selectedSim.title}
            </h1>
          </div>

          {/* Classic Floating Lab Instruments Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStopwatch(!showStopwatch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showStopwatch ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle Digital Stopwatch Tool"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Stopwatch</span>
            </button>

            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showRuler ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle Metric Ruler Overlay"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Metric Ruler</span>
            </button>

            <a
              href={selectedSim.phetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open PhET Simulation in New Fullscreen Window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Floating Digital Stopwatch Widget */}
        {showStopwatch && (
          <div className="bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl flex items-center gap-4 text-white z-30 max-w-xs">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Lab Stopwatch</div>
              <div className="text-xl font-black font-mono text-amber-400">
                {stopwatchSeconds.toFixed(1)}s
              </div>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  isStopwatchRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isStopwatchRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg cursor-pointer"
                title="Reset stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Ruler Overlay */}
        {showRuler && (
          <div className="bg-amber-100/90 border border-amber-400 rounded-lg p-2 shadow-xl z-30 max-w-md text-amber-950 font-mono text-[10px]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">Metric Ruler (0 - 15 cm)</span>
              <button onClick={() => setShowRuler(false)} className="text-amber-800 font-bold hover:text-black">×</button>
            </div>
            {/* Ruler Ticks */}
            <div className="h-6 border-b-2 border-amber-800 flex justify-between items-end px-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[8px]">{i % 5 === 0 ? i : ''}</span>
                  <div className={`w-0.5 bg-amber-900 ${i % 5 === 0 ? 'h-3.5' : 'h-2'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ACTIVE SIMULATION ENGINE RENDER */}
        {/* ============================================================== */}
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
          {engineMode === 'classic_native' ? (
            /* Render Native High-Performance Interactive Component */
            <>
              {selectedSim.nativeEngineType === 'circuits' && (
                <ClassicCircuitsPhET onRecordObservation={handleLogObservation} />
              )}
              {selectedSim.nativeEngineType === 'ph_scale' && (
                <ClassicPhScalePhET onRecordObservation={handleLogObservation} />
              )}
              {selectedSim.nativeEngineType === 'forces_motion' && (
                <ClassicForcesMotionPhET onRecordObservation={handleLogObservation} />
              )}
              {selectedSim.nativeEngineType === 'bending_light' && (
                <ClassicBendingLightPhET onRecordObservation={handleLogObservation} />
              )}
              {selectedSim.nativeEngineType === 'energy_skate' && (
                <ClassicEnergySkateParkPhET onRecordObservation={handleLogObservation} />
              )}
              {/* Fallback for other simulation types: seamless embedded PhET */}
              {!['circuits', 'ph_scale', 'forces_motion', 'bending_light', 'energy_skate'].includes(selectedSim.nativeEngineType) && (
                <div className="relative w-full h-[580px] bg-slate-950">
                  <iframe
                    src={selectedSim.phetUrl}
                    title={selectedSim.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              )}
            </>
          ) : (
            /* Render Official PhET HTML5 Iframe */
            <div className="relative w-full h-[620px] bg-slate-950">
              <iframe
                src={selectedSim.phetUrl}
                title={selectedSim.title}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* INQUIRY PROMPTS, FORMULAS & LAB NOTEBOOK LOGGING */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inquiry Prompts & CBC Learning Goals (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Inquiry Prompts */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-orange-800 font-black text-sm">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                <span>CBC Scientific Inquiry Prompts &amp; Investigations</span>
              </div>
              <p className="text-xs text-slate-500">
                Explore these core research questions using the interactive controls and draggable measurement tools above.
              </p>

              <div className="space-y-2.5 pt-1">
                {selectedSim.inquiryPrompts.map((prompt, idx) => (
                  <div key={idx} className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="text-xs font-bold text-slate-800 leading-relaxed">
                      {prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Curriculum Learning Competencies</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedSim.learningGoals.map((goal, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span className="text-slate-700 leading-relaxed">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulas, Equipment & Log to Notebook (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Key Formulas */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Key Scientific Formulas</span>
              </div>
              <div className="space-y-2">
                {selectedSim.keyFormulas.map((formula, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 font-mono text-xs text-amber-300 font-bold text-center">
                    {formula}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                CBC Curriculum Ref: <strong className="text-slate-300">{selectedSim.cbcCurriculumRef}</strong>
              </div>
            </div>

            {/* Record Observation to Lab Notebook */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Observation Log</span>
              </div>

              <p className="text-xs text-slate-500">
                Write a quick observation note or hypothesis test result to save to your official Lab Notebook.
              </p>

              <textarea
                value={customLearnerNote}
                onChange={(e) => setCustomLearnerNote(e.target.value)}
                placeholder="E.g. With 4 cells and 2 bulbs in parallel, voltage across both is 6.0V and current draws 1.20A..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />

              <button
                onClick={() => handleLogObservation()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Saved to My Lab Notebook!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Log Entry to Lab Notebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
