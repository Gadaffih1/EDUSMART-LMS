import React, { useState, useMemo } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Flame, 
  Zap, 
  Eye, 
  Layers, 
  Play, 
  RotateCcw, 
  Printer, 
  ExternalLink,
  Search,
  Check
} from 'lucide-react';
import { LabApparatusItem, JSS_LAB_REQUIREMENTS, VirtualExperiment, CBC_VIRTUAL_EXPERIMENTS } from '../labInventoryData';
import { getApparatusDemonstrationData, ApparatusDemonstrationData } from './apparatusCatalog';
import { SimulatedApparatusGraphics } from './SimulatedApparatusGraphics';

interface ApparatusDemonstrationModalProps {
  initialItemNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onLaunchExperiment?: (exp: VirtualExperiment) => void;
}

export const ApparatusDemonstrationModal: React.FC<ApparatusDemonstrationModalProps> = ({
  initialItemNumber,
  isOpen,
  onClose,
  onLaunchExperiment
}) => {
  const [currentItemNumber, setCurrentItemNumber] = useState<number>(initialItemNumber);
  const [activeTab, setActiveTab] = useState<'simulation' | 'guide' | 'safety' | 'experiments'>('simulation');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [showComponentLabels, setShowComponentLabels] = useState(true);

  // Interactive Simulation States
  const [flameIsOpen, setFlameIsOpen] = useState(false);
  const [volumeMl, setVolumeMl] = useState(50);
  const [massGrams, setMassGrams] = useState(200);
  const [caliperMm, setCaliperMm] = useState(28.4);
  const [switchClosed, setSwitchClosed] = useState(true);
  const [funnelTapOpen, setFunnelTapOpen] = useState(false);
  const [testMedium, setTestMedium] = useState<'acid' | 'neutral' | 'alkali'>('acid');

  // Sync when initialItemNumber changes
  React.useEffect(() => {
    setCurrentItemNumber(initialItemNumber);
  }, [initialItemNumber]);

  const rawItem = useMemo(() => {
    return JSS_LAB_REQUIREMENTS.find(i => i.itemNumber === currentItemNumber) || JSS_LAB_REQUIREMENTS[0];
  }, [currentItemNumber]);

  const demoData = useMemo(() => {
    return getApparatusDemonstrationData(currentItemNumber);
  }, [currentItemNumber]);

  if (!isOpen) return null;

  const handleNext = () => {
    const nextNum = currentItemNumber >= 75 ? 1 : currentItemNumber + 1;
    setCurrentItemNumber(nextNum);
  };

  const handlePrev = () => {
    const prevNum = currentItemNumber <= 1 ? 75 : currentItemNumber - 1;
    setCurrentItemNumber(prevNum);
  };

  // Derive interactive graphic state based on apparatus type
  const getInteractiveGraphicState = () => {
    if (demoData.diagramType === 'bunsen_burner') {
      return { isOpen: flameIsOpen, isRoaring: flameIsOpen };
    }
    if (demoData.diagramType === 'measuring_cylinder') {
      return { volumeMl };
    }
    if (demoData.diagramType === 'spring_balance') {
      return { massGrams };
    }
    if (demoData.diagramType === 'vernier_calipers') {
      return { readingMm: caliperMm };
    }
    if (demoData.diagramType === 'circuit_switch') {
      return { isClosed: switchClosed };
    }
    if (demoData.diagramType === 'separating_funnel') {
      return { tapOpen: funnelTapOpen };
    }
    if (demoData.diagramType === 'reagent_bottle') {
      let liquidColor = '#9333ea';
      if (testMedium === 'acid') liquidColor = '#dc2626';
      else if (testMedium === 'alkali') liquidColor = '#2563eb';
      else liquidColor = '#9333ea';
      return { liquidColor, labelText: rawItem.name };
    }
    return {};
  };

  const associatedExps = CBC_VIRTUAL_EXPERIMENTS.filter(e => 
    rawItem.usedInExperiments.some(expName => e.title.toLowerCase().includes(expName.toLowerCase()) || expName.toLowerCase().includes(e.strand.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className={`bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl max-h-[92vh]'
      }`}>
        {/* Modal Header Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-sm flex items-center justify-center shrink-0">
              #{rawItem.itemNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full">
                  CBC JSS Section {rawItem.section}
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                  {rawItem.category}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {rawItem.name}
              </h2>
            </div>
          </div>

          {/* Quick Navigator & Window Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Apparatus Selector Dropdown */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Apparatus"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={currentItemNumber}
                onChange={(e) => setCurrentItemNumber(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white px-2 py-1 outline-none cursor-pointer"
              >
                {JSS_LAB_REQUIREMENTS.map(item => (
                  <option key={item.id} value={item.itemNumber} className="bg-slate-900 text-white">
                    #{item.itemNumber} - {item.name.slice(0, 28)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Apparatus"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 bg-slate-50/70 overflow-x-auto shrink-0">
          {[
            { id: 'simulation', label: 'Simulated Visual Diagram & Live Operation', icon: Sliders },
            { id: 'guide', label: 'Teacher Demonstration Script & Questions', icon: BookOpen },
            { id: 'safety', label: 'Safety, Hazard Code & Handling Care', icon: ShieldAlert },
            { id: 'experiments', label: `Used in CBC Experiments (${rawItem.usedInExperiments.length})`, icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-900 bg-white shadow-2xs rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SIMULATION & VISUAL DIAGRAM */}
          {activeTab === 'simulation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulated Graphical Canvas */}
              <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 border border-slate-800 flex flex-col justify-between shadow-inner relative overflow-hidden">
                {/* Visual Canvas Top Bar */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-mono font-bold text-emerald-300">
                      LIVE SCIENTIFIC SIMULATION ENGINE
                    </span>
                  </div>
                  <button
                    onClick={() => setShowComponentLabels(!showComponentLabels)}
                    className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    {showComponentLabels ? 'Hide Labels' : 'Show Labeled Parts'}
                  </button>
                </div>

                {/* Vector Apparatus Render */}
                <div className="my-auto py-4 flex items-center justify-center">
                  <SimulatedApparatusGraphics
                    diagramType={demoData.diagramType}
                    interactiveState={getInteractiveGraphicState()}
                    showLabels={showComponentLabels}
                    className="w-full max-h-80 object-contain drop-shadow-xl"
                  />
                </div>

                {/* Canvas Footer Note */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 z-10">
                  <span>Standard verified borosilicate / calibrated precision grade</span>
                  <span className="font-mono text-emerald-400 font-bold">{rawItem.quantity} {rawItem.unit} Available</span>
                </div>
              </div>

              {/* Right Column: Interactive Demonstration Controls & Specification */}
              <div className="lg:col-span-5 space-y-4">
                {/* Interactive Controls Box */}
                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>Live Demonstration Controls</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Teacher Interactive
                    </span>
                  </div>

                  {/* Bunsen Burner Flame Controls */}
                  {demoData.diagramType === 'bunsen_burner' && (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-600 text-[11px]">
                        Rotate the air hole collar to demonstrate the difference between the luminous safety flame and the non-luminous heating flame:
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setFlameIsOpen(false)}
                          className={`py-2 px-3 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                            !flameIsOpen
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Safety Flame (Air Hole Closed)
                        </button>
                        <button
                          onClick={() => setFlameIsOpen(true)}
                          className={`py-2 px-3 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                            flameIsOpen
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Roaring Blue (~1200°C)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Measuring Cylinder Slider */}
                  {demoData.diagramType === 'measuring_cylinder' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Pour Liquid Volume:</span>
                        <strong className="font-mono text-emerald-700 font-black">{volumeMl} ml</strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={volumeMl}
                        onChange={(e) => setVolumeMl(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">
                        Prompt learners to observe the bottom of the curved meniscus aligned with eye-level to eliminate parallax error.
                      </p>
                    </div>
                  )}

                  {/* Spring Balance Slider */}
                  {demoData.diagramType === 'spring_balance' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Attach Slotted Mass:</span>
                        <strong className="font-mono text-blue-700 font-black">{massGrams} g (≈ {((massGrams/1000)*9.8).toFixed(1)} N)</strong>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[50, 100, 200, 500].map(m => (
                          <button
                            key={m}
                            onClick={() => setMassGrams(m)}
                            className={`py-1.5 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                              massGrams === m
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {m}g
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vernier Calipers Slider */}
                  {demoData.diagramType === 'vernier_calipers' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Jaw Clamped Width:</span>
                        <strong className="font-mono text-amber-800 font-black">{caliperMm} mm</strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="0.5"
                        value={caliperMm}
                        onChange={(e) => setCaliperMm(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">
                        Main scale reading + sliding vernier coincidence line = 0.1mm measurement precision.
                      </p>
                    </div>
                  )}

                  {/* Circuit Switch Toggle */}
                  {demoData.diagramType === 'circuit_switch' && (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-600 text-[11px]">
                        Demonstrate continuous conductive loop versus broken circuit:
                      </p>
                      <button
                        onClick={() => setSwitchClosed(!switchClosed)}
                        className={`w-full py-2.5 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          switchClosed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-xs'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>{switchClosed ? 'Switch is CLOSED (Bulb ON - Current Flowing)' : 'Switch is OPEN (Bulb OFF - Broken Loop)'}</span>
                      </button>
                    </div>
                  )}

                  {/* Separating Funnel Tap Toggle */}
                  {demoData.diagramType === 'separating_funnel' && (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-600 text-[11px]">
                        Open the PTFE tap to drain the dense aqueous water phase, closing immediately as the boundary reaches the bore:
                      </p>
                      <button
                        onClick={() => setFunnelTapOpen(!funnelTapOpen)}
                        className={`w-full py-2.5 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          funnelTapOpen
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs'
                        }`}
                      >
                        <span>{funnelTapOpen ? 'Stopcock Tap: OPEN (Draining Aqueous Phase)' : 'Stopcock Tap: CLOSED (Holding Layers)'}</span>
                      </button>
                    </div>
                  )}

                  {/* Reagent Dropper Test Medium */}
                  {demoData.diagramType === 'reagent_bottle' && (
                    <div className="space-y-2 text-xs">
                      <div className="text-slate-700 font-bold">Dispense Reagent into Solution:</div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {(['acid', 'neutral', 'alkali'] as const).map(med => (
                          <button
                            key={med}
                            onClick={() => setTestMedium(med)}
                            className={`py-1.5 rounded-lg font-bold text-[11px] capitalize border transition-all cursor-pointer ${
                              testMedium === med
                                ? med === 'acid' ? 'bg-rose-600 text-white border-rose-700' :
                                  med === 'alkali' ? 'bg-blue-600 text-white border-blue-700' :
                                  'bg-purple-600 text-white border-purple-700'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {med}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Scientific Uses Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Primary CBC Uses & Functions</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {demoData.primaryUses.map((use, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Scientific Principles */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Key Scientific Principles</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {demoData.keyScientificPrinciples.map((prin, idx) => (
                      <li key={idx} className="leading-relaxed">
                        • {prin}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHER DEMONSTRATION GUIDE & QUESTIONS */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-4xl">
              {/* Demonstration Procedure Script */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Teacher Demonstration Script (Step-by-Step)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400">Step 1: Physical Setup</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {demoData.teacherDemonstrationGuide.setup}
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-emerald-800">Step 2: Demonstration Action</span>
                    <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                      {demoData.teacherDemonstrationGuide.action}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-800">Step 3: Observation Prompt to Learners</span>
                    <p className="text-xs text-blue-950 leading-relaxed font-medium">
                      "{demoData.teacherDemonstrationGuide.observationPrompt}"
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-purple-800">Expected Learner Response</span>
                    <p className="text-xs text-purple-950 leading-relaxed font-medium">
                      {demoData.teacherDemonstrationGuide.expectedLearnerResponse}
                    </p>
                  </div>
                </div>
              </div>

              {/* Classroom Interactive Discussion Questions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>Teacher Discussion Questions for Class Comprehension</span>
                </h3>

                <div className="space-y-3">
                  {demoData.teacherDemonstrationGuide.discussionQuestions.map((q, idx) => {
                    const isRevealed = !!revealedQuestions[idx];
                    return (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-xs font-bold text-slate-900 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{q}</span>
                          </div>
                          <button
                            onClick={() => setRevealedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 cursor-pointer"
                          >
                            {isRevealed ? 'Hide Teaching Notes' : 'Teacher Answer Key'}
                          </button>
                        </div>
                        {isRevealed && (
                          <div className="pl-7 pt-2 text-xs text-emerald-900 border-t border-slate-200/80 leading-relaxed">
                            <strong>Key Concept:</strong> Ensure learners explain the underlying scientific cause rather than merely repeating factual terms. Encourage learners to relate this to everyday Kenyan agricultural or domestic contexts.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY, HAZARDS & STORAGE */}
          {activeTab === 'safety' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Hazard Classification & Standard Precautions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mandatory safety protocols for handling in CBC Junior Secondary science laboratories.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-rose-700">Official Hazard Classification</span>
                    <div className="text-sm font-black text-rose-950">{demoData.safetyAndHandling.hazardType}</div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-700">Required Personal Protective Equipment (PPE)</span>
                    <div className="text-xs font-bold text-emerald-950">
                      {demoData.safetyAndHandling.protectiveGear.join(' • ')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black uppercase text-slate-700">Mandatory Handling Rules:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {demoData.safetyAndHandling.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-800">Laboratory Storage & Maintenance:</span>
                  <p className="text-slate-600">{demoData.safetyAndHandling.storageCare}</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-1">Designated Location: {rawItem.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASSOCIATED CBC PRACTICAL EXPERIMENTS */}
          {activeTab === 'experiments' && (
            <div className="space-y-4 max-w-4xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      CBC Practical Experiments Utilizing This Apparatus
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any experiment below to launch the 10-stage interactive practical workbench.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    {rawItem.usedInExperiments.length} CBC Practical Units
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rawItem.usedInExperiments.map((expTitle, idx) => {
                    const matchedExp = CBC_VIRTUAL_EXPERIMENTS.find(e => 
                      e.title.toLowerCase().includes(expTitle.toLowerCase()) || 
                      expTitle.toLowerCase().includes(e.subject.toLowerCase())
                    ) || CBC_VIRTUAL_EXPERIMENTS[0];

                    return (
                      <div key={idx} className="p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            CBC Practical Module
                          </span>
                          <h4 className="font-black text-slate-900 text-xs mt-1.5">{expTitle}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Requires Item #{rawItem.itemNumber} ({rawItem.name}) for measurement and quantitative observations.
                          </p>
                        </div>

                        {onLaunchExperiment && (
                          <button
                            onClick={() => {
                              onLaunchExperiment(matchedExp);
                              onClose();
                            }}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Launch 10-Stage Practical Workbench</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Strip */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>Item <strong className="text-slate-800 font-bold">#{rawItem.itemNumber}</strong> of 75</span>
            <span className="text-slate-300">|</span>
            <span>Location: <strong className="text-slate-800 font-bold">{rawItem.location}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Item</span>
            </button>
            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next Item</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
