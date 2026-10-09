import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Atom, 
  TestTube, 
  Zap, 
  Compass, 
  ShieldCheck, 
  Layers, 
  RotateCcw, 
  CheckCircle2, 
  Info, 
  Play,
  Lightbulb,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';

export const VIRTUAL_LAB_URL = 'https://chatgpt.com/s/t_6ac78bfad95c8191841d261117b27e60';

interface VirtualLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'chemistry' | 'physics' | 'biology';
}

export const VirtualLabModal: React.FC<VirtualLabModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview'
}) => {
  // All hooks must execute unconditionally before any early return!
  const [activeTab, setActiveTab] = useState<'overview' | 'chemistry' | 'physics' | 'biology' | 'safety'>(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chemistry Sim State (Acid/Base & Indicators)
  const [chemSubstance, setChemSubstance] = useState<'hcl' | 'lemon' | 'water' | 'baking_soda' | 'naoh'>('lemon');
  const [chemIndicator, setChemIndicator] = useState<'litmus_blue' | 'litmus_red' | 'universal' | 'phenolphthalein'>('universal');
  const [chemTested, setChemTested] = useState(false);

  // Physics Sim State (Electric Circuit & Ohm's Law)
  const [circuitClosed, setCircuitClosed] = useState(true);
  const [voltage, setVoltage] = useState<number>(6.0); // Volts
  const [resistance, setResistance] = useState<number>(15); // Ohms

  // Biology Sim State (Virtual Microscope)
  const [microscopeSlide, setMicroscopeSlide] = useState<'onion' | 'cheek' | 'stomata'>('onion');
  const [magnification, setMagnification] = useState<40 | 100 | 400>(100);
  const [focusLevel, setFocusLevel] = useState<number>(85); // 0-100 (optimal is 80-90)

  // Learner observation log
  const [learnerNote, setLearnerNote] = useState('');
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(VIRTUAL_LAB_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSaveObservation = () => {
    if (!learnerNote.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('edusmart_lab_observations') || '[]');
      existing.unshift({
        id: 'obs-' + Date.now(),
        date: new Date().toISOString(),
        topic: activeTab,
        note: learnerNote.trim()
      });
      localStorage.setItem('edusmart_lab_observations', JSON.stringify(existing.slice(0, 20)));
      setSavedNoteSuccess(true);
      setTimeout(() => setSavedNoteSuccess(false), 3000);
      setLearnerNote('');
    } catch (e) {
      console.error('Failed to save observation', e);
    }
  };

  // Guard right before JSX render to preserve React hook consistency
  if (!isOpen) return null;

  // Chemistry calculations
  const substancesConfig = {
    hcl: { name: 'Dilute Hydrochloric Acid (HCl)', ph: 1.2, type: 'Strong Acid', color: 'bg-red-500/20 text-red-700 border-red-300' },
    lemon: { name: 'Fresh Lemon Juice (Citric Acid)', ph: 2.5, type: 'Weak Acid', color: 'bg-amber-500/20 text-amber-700 border-amber-300' },
    water: { name: 'Pure Distilled Water (H₂O)', ph: 7.0, type: 'Neutral', color: 'bg-emerald-500/20 text-emerald-700 border-emerald-300' },
    baking_soda: { name: 'Sodium Bicarbonate Solution', ph: 8.6, type: 'Weak Base', color: 'bg-cyan-500/20 text-cyan-700 border-cyan-300' },
    naoh: { name: 'Sodium Hydroxide (NaOH)', ph: 13.5, type: 'Strong Base', color: 'bg-indigo-500/20 text-indigo-700 border-indigo-300' }
  };

  const currentChem = substancesConfig[chemSubstance];
  let chemResultColor = 'bg-slate-200 text-slate-700';
  let chemResultDesc = '';

  if (chemIndicator === 'universal') {
    if (currentChem.ph < 3) {
      chemResultColor = 'bg-red-600 text-white';
      chemResultDesc = `Turns Deep Red (pH ${currentChem.ph} - Strong Acid)`;
    } else if (currentChem.ph < 6) {
      chemResultColor = 'bg-amber-500 text-white';
      chemResultDesc = `Turns Orange/Yellow (pH ${currentChem.ph} - Weak Acid)`;
    } else if (currentChem.ph <= 7.5) {
      chemResultColor = 'bg-emerald-500 text-white';
      chemResultDesc = `Turns Green (pH ${currentChem.ph} - Neutral Solution)`;
    } else if (currentChem.ph < 11) {
      chemResultColor = 'bg-blue-600 text-white';
      chemResultDesc = `Turns Blue (pH ${currentChem.ph} - Weak Alkaline)`;
    } else {
      chemResultColor = 'bg-purple-700 text-white';
      chemResultDesc = `Turns Deep Violet (pH ${currentChem.ph} - Strong Alkaline)`;
    }
  } else if (chemIndicator === 'litmus_blue') {
    if (currentChem.ph < 7) {
      chemResultColor = 'bg-red-600 text-white';
      chemResultDesc = 'Turns Red (Confirmed Acidic property)';
    } else {
      chemResultColor = 'bg-blue-600 text-white';
      chemResultDesc = 'Remains Blue (Neutral or Alkaline solution)';
    }
  } else if (chemIndicator === 'litmus_red') {
    if (currentChem.ph > 7) {
      chemResultColor = 'bg-blue-600 text-white';
      chemResultDesc = 'Turns Blue (Confirmed Alkaline / Basic property)';
    } else {
      chemResultColor = 'bg-red-600 text-white';
      chemResultDesc = 'Remains Red (Neutral or Acidic solution)';
    }
  } else if (chemIndicator === 'phenolphthalein') {
    if (currentChem.ph > 8.2) {
      chemResultColor = 'bg-pink-600 text-white';
      chemResultDesc = 'Turns Bright Magenta/Pink (Basic/Alkaline)';
    } else {
      chemResultColor = 'bg-slate-100 text-slate-600 border border-slate-300';
      chemResultDesc = 'Remains Completely Colourless (Acidic or Neutral)';
    }
  }

  // Physics calculations (Ohm's Law: I = V / R)
  const currentAmps = circuitClosed ? (voltage / resistance).toFixed(2) : '0.00';
  const bulbPower = circuitClosed ? (Math.pow(voltage, 2) / resistance).toFixed(1) : '0.0';
  const bulbOpacity = circuitClosed ? Math.min(1, Math.max(0.15, Number(currentAmps) / 0.6)) : 0.05;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-5 sm:p-6 text-white relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <FlaskConical className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/25 border border-emerald-300/30 px-2 py-0.5 rounded-full text-emerald-100">
                  CBC STEM Innovation Hub
                </span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                  Interactive Science Lab
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                EduSmart Virtual LAB & Science Workbench
              </h2>
              <p className="text-emerald-100/80 text-xs mt-0.5 max-w-xl">
                Digital experimentation environment aligned with Kenya CBC Grade 4–9 Science & Technology, Junior Physics, Chemistry and Biology competencies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <a
              href={VIRTUAL_LAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-transform transform active:scale-95"
            >
              <span>Launch Virtual LAB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close Virtual Lab"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual LAB Portal & Link</span>
          </button>
          <button
            onClick={() => setActiveTab('chemistry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            <span>Chemistry: Acids & Bases Sim</span>
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'physics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Physics: Electric Circuit Sim</span>
          </button>
          <button
            onClick={() => setActiveTab('biology')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'biology'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Biology: Virtual Microscope</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CBC Lab Safety Checklist</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW & DIRECT LINK LAUNCHER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Highlight Hero Launch Banner */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>Designated Virtual LAB Session</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Access the Interactive Virtual LAB Experience
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      This dedicated Virtual LAB platform provides learners and teachers with real-time practical science inquiries, step-by-step experiment instructions, safety demonstrations, and interactive simulation workbenches tailored for CBC Science & Technology.
                    </p>
                    
                    {/* Destination URL Display */}
                    <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">Lab Link:</span>
                        <code className="text-emerald-800 font-mono text-[11px] truncate select-all">
                          {VIRTUAL_LAB_URL}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleCopyLink}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 shrink-0 min-w-[200px]">
                    <a
                      href={VIRTUAL_LAB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 text-center"
                    >
                      <FlaskConical className="w-4 h-4 text-emerald-200" />
                      <span>Open Virtual LAB</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => setActiveTab('chemistry')}
                      className="w-full px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <TestTube className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Test Local Simulators</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CBC Curriculum Alignment Grid */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                  CBC Science & Technology Practical Strands Covered
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-2">
                      <TestTube className="w-4 h-4" />
                    </div>
                    <div className="font-black text-slate-900 text-sm">Matter & Chemistry</div>
                    <p className="text-xs text-slate-500 mt-1">
                      Acids, bases, pH indicators, mixtures, separation techniques, and solutions.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Grade 4 - 8 CBC
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black mb-2">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="font-black text-slate-900 text-sm">Energy & Physical Science</div>
                    <p className="text-xs text-slate-500 mt-1">
                      Simple electric circuits, Ohm's law, magnets, light reflection, and sound waves.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      Grade 5 - 9 CBC
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-cyan-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black mb-2">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="font-black text-slate-900 text-sm">Living World & Biology</div>
                    <p className="text-xs text-slate-500 mt-1">
                      Cellular structures, plant epidermal cells, microscope optics, and photosynthesis.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                      Grade 6 - 9 CBC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHEMISTRY ACID & BASE SIMULATOR */}
          {activeTab === 'chemistry' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-emerald-600" />
                      <span>Acid, Base & Indicator Reaction Workbench</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a substance and test with different chemical indicators to observe color changes.
                    </p>
                  </div>
                  <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-bold">
                    CBC Strand: Matter & Chemical Changes
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                        1. Select Test Substance:
                      </label>
                      <div className="space-y-1.5">
                        {(Object.keys(substancesConfig) as Array<keyof typeof substancesConfig>).map((key) => {
                          const sub = substancesConfig[key];
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setChemSubstance(key);
                                setChemTested(true);
                              }}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                                chemSubstance === key
                                  ? 'border-emerald-600 bg-emerald-50/60 font-black text-emerald-950 shadow-2xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{sub.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${sub.color}`}>
                                pH ~ {sub.ph}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                        2. Select Indicator:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'universal', label: 'Universal Indicator', sub: 'Full pH Spectrum' },
                          { id: 'litmus_blue', label: 'Blue Litmus Paper', sub: 'Turns red in acid' },
                          { id: 'litmus_red', label: 'Red Litmus Paper', sub: 'Turns blue in base' },
                          { id: 'phenolphthalein', label: 'Phenolphthalein', sub: 'Pink in base' }
                        ].map((ind) => (
                          <button
                            key={ind.id}
                            onClick={() => {
                              setChemIndicator(ind.id as any);
                              setChemTested(true);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                              chemIndicator === ind.id
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="font-bold text-[11px]">{ind.label}</div>
                            <div className="text-[10px] text-slate-500">{ind.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reaction Reaction Beaker / Observation Visualizer */}
                  <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-between min-h-[340px]">
                    <div className="w-full flex items-center justify-between text-xs text-slate-400">
                      <span>Lab Vessel: Borosilicate 250mL Beaker</span>
                      <span className="font-mono text-emerald-400">STATUS: ACTIVE TEST</span>
                    </div>

                    {/* Virtual Beaker Graphic */}
                    <div className="relative my-4 flex flex-col items-center">
                      <div className="w-36 h-48 border-4 border-slate-400/50 border-t-0 rounded-b-3xl relative overflow-hidden bg-slate-800/40 backdrop-blur-md flex items-end justify-center shadow-inner">
                        {/* Measuring graduation lines */}
                        <div className="absolute left-2 top-6 w-3 h-0.5 bg-slate-400/40" />
                        <div className="absolute left-2 top-14 w-4 h-0.5 bg-slate-400/40" />
                        <div className="absolute left-2 top-22 w-3 h-0.5 bg-slate-400/40" />
                        <div className="absolute left-2 top-30 w-4 h-0.5 bg-slate-400/40" />
                        
                        {/* Liquid Layer with Color Animation */}
                        <div 
                          className={`w-full h-32 transition-all duration-500 rounded-b-2xl flex items-center justify-center ${chemResultColor} shadow-lg`}
                        >
                          <div className="text-center p-2">
                            <span className="text-[11px] font-black uppercase tracking-wider block">
                              {currentChem.type}
                            </span>
                            <span className="text-[10px] opacity-90 block">
                              pH {currentChem.ph}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result Callout */}
                    <div className="w-full bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Experimental Observation:</span>
                      </div>
                      <p className="text-slate-200 font-medium">
                        {chemResultDesc}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Conclusion: {currentChem.name} behaves as a {currentChem.type.toLowerCase()} in accordance with the Kenya CBC Basic Chemistry syllabus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICS ELECTRIC CIRCUIT SIMULATOR */}
          {activeTab === 'physics' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-teal-600" />
                      <span>Ohm's Law & Simple Electric Circuit Workbench</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toggle the switch, change voltage and resistance to observe live current and bulb brightness.
                    </p>
                  </div>
                  <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-bold">
                    CBC Strand: Energy & Electricity (V = I × R)
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Circuit Switch:
                        </label>
                        <button
                          onClick={() => setCircuitClosed(!circuitClosed)}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                            circuitClosed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{circuitClosed ? 'CLOSED (ON)' : 'OPEN (OFF)'}</span>
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Battery Voltage (V):</span>
                          <span className="font-mono text-teal-700">{voltage.toFixed(1)} V</span>
                        </div>
                        <input
                          type="range"
                          min="1.5"
                          max="12.0"
                          step="1.5"
                          value={voltage}
                          onChange={(e) => setVoltage(Number(e.target.value))}
                          className="w-full accent-teal-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>1.5V</span>
                          <span>6.0V</span>
                          <span>12.0V</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Circuit Resistance (R):</span>
                          <span className="font-mono text-teal-700">{resistance} Ω</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={resistance}
                          onChange={(e) => setResistance(Number(e.target.value))}
                          className="w-full accent-teal-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>5 Ω</span>
                          <span>25 Ω</span>
                          <span>50 Ω</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter Readings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
                        <div className="text-[10px] font-black text-teal-800 uppercase tracking-wider">
                          Current (I = V / R)
                        </div>
                        <div className="text-xl font-black text-teal-900 font-mono mt-1">
                          {currentAmps} A
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                        <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                          Power Dissipated (P)
                        </div>
                        <div className="text-xl font-black text-amber-900 font-mono mt-1">
                          {bulbPower} W
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Circuit Workbench Visualizer */}
                  <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-between min-h-[340px] relative overflow-hidden">
                    <div className="w-full flex items-center justify-between text-xs text-slate-400">
                      <span>Circuit Simulator: Closed Loop Schematic</span>
                      <span className={`font-mono ${circuitClosed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {circuitClosed ? '● CURRENT FLOWING' : '○ CIRCUIT OPEN'}
                      </span>
                    </div>

                    {/* Bulb Center Stage with Dynamic Glow */}
                    <div className="relative my-6 flex flex-col items-center justify-center">
                      {/* Glow halo */}
                      {circuitClosed && Number(currentAmps) > 0 && (
                        <div 
                          className="absolute w-44 h-44 rounded-full bg-amber-400 blur-2xl transition-all duration-300 pointer-events-none"
                          style={{ opacity: bulbOpacity }}
                        />
                      )}

                      <div className="relative z-10 w-24 h-24 rounded-full border-4 border-slate-600 flex items-center justify-center bg-slate-800/80 shadow-2xl">
                        <Lightbulb 
                          className={`w-14 h-14 transition-all duration-300 ${
                            circuitClosed && Number(currentAmps) > 0
                              ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                              : 'text-slate-600'
                          }`} 
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-2">
                        Incandescent Filament Lamp
                      </div>
                    </div>

                    {/* Scientific Summary */}
                    <div className="w-full bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 text-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Ohmic Relationship:</span>
                      </div>
                      <p className="text-slate-200">
                        {circuitClosed 
                          ? `At ${voltage}V with ${resistance}Ω resistance, a current of ${currentAmps} Amperes flows, illuminating the bulb.`
                          : 'The switch is OPEN. No current can flow through the discontinuous circuit path.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BIOLOGY VIRTUAL MICROSCOPE */}
          {activeTab === 'biology' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-600" />
                      <span>Digital Compound Microscope Simulator</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mount slides, adjust magnification and fine-focus to observe plant and animal cellular structures.
                    </p>
                  </div>
                  <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-bold">
                    CBC Strand: Living Organisms & Cells
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                        Select Prepared Slide:
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'onion', title: 'Onion Epidermal Cell', sub: 'Plant cell with cell wall, cytoplasm & nucleus' },
                          { id: 'cheek', title: 'Human Cheek Epithelial Cell', sub: 'Animal cell with cell membrane & nucleus' },
                          { id: 'stomata', title: 'Leaf Lower Epidermis (Stomata)', sub: 'Guard cells regulating gas exchange' }
                        ].map((slide) => (
                          <button
                            key={slide.id}
                            onClick={() => setMicroscopeSlide(slide.id as any)}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                              microscopeSlide === slide.id
                                ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 font-black shadow-2xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="font-bold">{slide.title}</div>
                            <div className="text-[10px] text-slate-500">{slide.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                        Objective Lens Magnification:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[40, 100, 400].map((mag) => (
                          <button
                            key={mag}
                            onClick={() => setMagnification(mag as any)}
                            className={`p-2 rounded-xl border text-center transition-all text-xs font-black cursor-pointer ${
                              magnification === mag
                                ? 'border-cyan-600 bg-cyan-600 text-white'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {mag}×
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>Fine Focus Adjustment:</span>
                        <span className="font-mono text-cyan-700">{focusLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={focusLevel}
                        onChange={(e) => setFocusLevel(Number(e.target.value))}
                        className="w-full accent-cyan-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>Blurry</span>
                        <span className="text-emerald-600 font-bold">Crisp (85%)</span>
                        <span>Over-focused</span>
                      </div>
                    </div>
                  </div>

                  {/* Eyepiece Visualizer Field of View */}
                  <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-between min-h-[340px]">
                    <div className="w-full flex items-center justify-between text-xs text-slate-400">
                      <span>Circular Field of View (FOV)</span>
                      <span className="font-mono text-cyan-400">MAG: {magnification}×</span>
                    </div>

                    {/* Circular Eyepiece */}
                    <div className="relative my-4 flex items-center justify-center">
                      <div 
                        className="w-48 h-48 rounded-full border-8 border-slate-700 bg-emerald-950/80 overflow-hidden relative shadow-2xl flex items-center justify-center"
                        style={{
                          filter: `blur(${Math.abs(85 - focusLevel) / 10}px)`
                        }}
                      >
                        {/* Slide Representation */}
                        {microscopeSlide === 'onion' && (
                          <div className="grid grid-cols-4 grid-rows-3 gap-1 w-full h-full p-3 opacity-80">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="border-2 border-emerald-400/80 rounded-md bg-emerald-700/40 relative flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-200/90" />
                              </div>
                            ))}
                          </div>
                        )}

                        {microscopeSlide === 'cheek' && (
                          <div className="relative w-full h-full flex items-center justify-center opacity-85">
                            <div className="w-24 h-20 rounded-[45%] border-2 border-pink-400/80 bg-pink-600/30 flex items-center justify-center transform -rotate-12">
                              <div className="w-3.5 h-3.5 rounded-full bg-purple-900 border border-purple-300" />
                            </div>
                            <div className="w-16 h-14 rounded-[50%] border-2 border-pink-400/70 bg-pink-600/25 absolute top-4 left-6 flex items-center justify-center transform rotate-20">
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-900 border border-purple-300" />
                            </div>
                          </div>
                        )}

                        {microscopeSlide === 'stomata' && (
                          <div className="relative w-full h-full flex items-center justify-center opacity-85">
                            <div className="w-28 h-20 border-2 border-green-400/70 rounded-full bg-green-600/30 flex items-center justify-center">
                              <div className="w-8 h-12 border-2 border-green-300 rounded-full bg-slate-900 flex items-center justify-center" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scientific Conclusion */}
                    <div className="w-full bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 text-xs">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Microscopic Findings:</span>
                      </div>
                      <p className="text-slate-200">
                        {microscopeSlide === 'onion' && 'Visible cellulose cell walls in rectangular pattern with prominent cell nuclei.'}
                        {microscopeSlide === 'cheek' && 'Irregular animal epithelial cells with flexible cell membrane and centered dark nuclei.'}
                        {microscopeSlide === 'stomata' && 'Bean-shaped guard cells flanking the stomatal pore for transpiration control.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CBC LAB SAFETY & LOG */}
          {activeTab === 'safety' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>KICD CBC Science Laboratory Safety Checklist</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Standard safety rules required for both physical science labs and virtual experiment preparations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Personal Protective Equipment', desc: 'Wear lab coats, safety goggles and closed-toe footwear during chemical tests.' },
                    { title: 'Safe Chemical Reagent Handling', desc: 'Never taste chemicals. Always waft fumes gently toward the nose instead of direct sniffing.' },
                    { title: 'Apparatus Breakage Protocol', desc: 'Report any cracked glassware immediately. Dispose in designated broken-glass containers.' },
                    { title: 'Electrical Circuit Safety', desc: 'Ensure switch is OPEN before connecting batteries or modifying wiring loops.' },
                    { title: 'Eye Wash & First Aid Readiness', desc: 'Locate emergency wash stations prior to conducting acid/base titration sessions.' },
                    { title: 'Disposal & Environmental Care', desc: 'Neutralize strong acidic or basic residues before drainage disposal.' }
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rule.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{rule.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Observation Record */}
              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Record Practical Lab Observation (CBC Learner Journal)</span>
                  </h4>
                  {savedNoteSuccess && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={learnerNote}
                  onChange={(e) => setLearnerNote(e.target.value)}
                  placeholder="Type your experiment hypothesis, findings, or questions for your science teacher here..."
                  className="w-full p-3 bg-white rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveObservation}
                    disabled={!learnerNote.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Lab Observation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Virtual LAB resources are available to all students, teachers, and library researchers.</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={VIRTUAL_LAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Full Session</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
