import React, { useState } from 'react';
import { 
  VirtualExperiment, 
  JSS_LAB_REQUIREMENTS 
} from './labInventoryData';
import { 
  FlaskConical, 
  Zap, 
  Eye, 
  Layers, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Sliders, 
  Sparkles, 
  Flame, 
  Droplet,
  Volume2,
  FileText,
  Save,
  Check,
  Maximize2,
  Atom
} from 'lucide-react';
import { ClassicCircuitsPhET } from './classic/ClassicCircuitsPhET';
import { ClassicPhScalePhET } from './classic/ClassicPhScalePhET';
import { ClassicForcesMotionPhET } from './classic/ClassicForcesMotionPhET';
import { ClassicBendingLightPhET } from './classic/ClassicBendingLightPhET';
import { ClassicEnergySkateParkPhET } from './classic/ClassicEnergySkateParkPhET';

interface InteractiveSimulationEngineProps {
  experiment: VirtualExperiment;
  mode?: 'learner' | 'demonstration' | 'assigned';
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const InteractiveSimulationEngine: React.FC<InteractiveSimulationEngineProps> = ({
  experiment,
  mode = 'learner',
  onRecordObservation,
  className = ''
}) => {
  // 1. ACID/BASE CHEMICAL REAGENT & INDICATOR SIMULATION
  // Items 1, 2, 3, 4, 6, 7, 8, 10, 13, 16, 17, 21, 71
  const [chemSubstance, setChemSubstance] = useState<string>('hcl');
  const [chemIndicator, setChemIndicator] = useState<'universal' | 'litmus_blue' | 'litmus_red' | 'phenolphthalein' | 'methyl_orange'>('universal');
  const [isHeating, setIsHeating] = useState(false);
  const [solutionTemp, setSolutionTemp] = useState(24); // °C

  // 2. CIRCUIT & OHM'S LAW SIMULATION
  // Items 24, 29, 50, 51, 52, 64, 67
  const [circuitClosed, setCircuitClosed] = useState(true);
  const [cellCount, setCellCount] = useState<number>(2); // 1 to 6 cells (1.5V each = 1.5V to 9V)
  const [bulbCount, setBulbCount] = useState<number>(1); // 1 to 4 bulbs in series/parallel
  const [circuitType, setCircuitType] = useState<'series' | 'parallel'>('series');
  const [resistance, setResistance] = useState<number>(10); // Base wire/bulb ohms

  // 3. MICROSCOPE SIMULATION
  // Items 5, 31, 33, 43, 68
  const [microscopeSlide, setMicroscopeSlide] = useState<'onion' | 'cheek' | 'stomata' | 'yeast'>('onion');
  const [magnification, setMagnification] = useState<40 | 100 | 400>(100);
  const [focusLevel, setFocusLevel] = useState<number>(85); // 0-100 (crisp at 85)
  const [lightIntensity, setLightIntensity] = useState<number>(75);

  // 4. SEPARATING FUNNEL SIMULATION
  // Items 35, 36, 42, 75
  const [funnelTapped, setFunnelTapped] = useState(false);
  const [separationProgress, setSeparationProgress] = useState(0); // 0 to 100%

  // 5. EUREKA DISPLACEMENT CAN & TOP PAN BALANCE SIMULATION
  // Items 24, 25, 26, 27
  const [eurekaSolid, setEurekaSolid] = useState<'stone' | 'brass_weight' | 'glass_marble'>('stone');
  const [isSubmerged, setIsSubmerged] = useState(false);

  // Observation state
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [simEngineView, setSimEngineView] = useState<'apparatus' | 'classic_phet'>('apparatus');

  // Chemistry Substance Database mapped to PDF JSS reagents
  const jssChemicals: Record<string, { name: string; formula: string; ph: number; category: string; itemRef: string }> = {
    hcl: { name: 'Hydrochloric Acid {AR}', formula: 'HCl (aq)', ph: 1.0, category: 'Strong Acid', itemRef: 'Item #16' },
    h2so4: { name: 'Sulphuric(VI) Acid {AR}', formula: 'H₂SO₄ (aq)', ph: 0.8, category: 'Strong Acid', itemRef: 'Item #15' },
    ethanoic: { name: 'Ethanoic Acid (Vinegar)', formula: 'CH₃COOH', ph: 2.8, category: 'Weak Acid', itemRef: 'Item #21 & #71' },
    water: { name: 'Distilled Water', formula: 'H₂O (l)', ph: 7.0, category: 'Neutral', itemRef: 'Solvent' },
    nahco3: { name: 'Sodium Hydrogen Carbonate', formula: 'NaHCO₃ (aq)', ph: 8.4, category: 'Weak Base', itemRef: 'Item #17' },
    limewater: { name: 'Calcium Hydroxide (Lime Water)', formula: 'Ca(OH)₂ (aq)', ph: 11.2, category: 'Base', itemRef: 'Item #7' },
    naoh: { name: 'Sodium Hydroxide Pellets Solution', formula: 'NaOH (aq)', ph: 13.8, category: 'Strong Caustic Base', itemRef: 'Item #13' }
  };

  const currentSubstance = jssChemicals[chemSubstance] || jssChemicals.hcl;

  // Compute Indicator Colour & State
  const getIndicatorResult = () => {
    const ph = currentSubstance.ph;
    if (chemIndicator === 'universal') {
      if (ph < 3) return { bg: 'bg-red-600', text: 'text-white', desc: `pH ~ ${ph} (Strong Acid - Deep Red)`, badge: 'Red' };
      if (ph < 6) return { bg: 'bg-amber-500', text: 'text-white', desc: `pH ~ ${ph} (Weak Acid - Orange/Yellow)`, badge: 'Orange' };
      if (ph <= 7.5) return { bg: 'bg-emerald-600', text: 'text-white', desc: `pH ~ ${ph} (Neutral - Forest Green)`, badge: 'Green' };
      if (ph < 11) return { bg: 'bg-blue-600', text: 'text-white', desc: `pH ~ ${ph} (Weak Base - Sky Blue)`, badge: 'Blue' };
      return { bg: 'bg-purple-800', text: 'text-white', desc: `pH ~ ${ph} (Strong Alkali - Deep Violet)`, badge: 'Violet' };
    }
    if (chemIndicator === 'litmus_blue') {
      return ph < 7 
        ? { bg: 'bg-red-600', text: 'text-white', desc: 'Turns Red (Acidic property confirmed)', badge: 'Red' }
        : { bg: 'bg-blue-600', text: 'text-white', desc: 'Remains Blue (Neutral/Alkaline)', badge: 'Blue' };
    }
    if (chemIndicator === 'litmus_red') {
      return ph > 7
        ? { bg: 'bg-blue-600', text: 'text-white', desc: 'Turns Blue (Alkaline/Base confirmed)', badge: 'Blue' }
        : { bg: 'bg-red-600', text: 'text-white', desc: 'Remains Red (Neutral/Acidic)', badge: 'Red' };
    }
    if (chemIndicator === 'phenolphthalein') {
      return ph > 8.2
        ? { bg: 'bg-pink-600', text: 'text-white', desc: 'Turns Vibrant Magenta / Pink (Basic pH > 8.2)', badge: 'Pink' }
        : { bg: 'bg-slate-100', text: 'text-slate-700', desc: 'Colourless (Acidic or Neutral)', badge: 'Colourless' };
    }
    if (chemIndicator === 'methyl_orange') {
      return ph < 3.1
        ? { bg: 'bg-red-600', text: 'text-white', desc: 'Turns Red (Strong Acid pH < 3.1)', badge: 'Red' }
        : { bg: 'bg-yellow-400', text: 'text-yellow-950', desc: 'Turns Yellow (pH > 4.4 Neutral/Base)', badge: 'Yellow' };
    }
    return { bg: 'bg-slate-200', text: 'text-slate-800', desc: 'Untested', badge: '-' };
  };

  const indicatorResult = getIndicatorResult();

  // Circuit Computations
  const totalVolts = Number((cellCount * 1.5).toFixed(1));
  const effectiveOhms = circuitType === 'series' ? resistance * bulbCount : resistance / bulbCount;
  const currentAmps = circuitClosed ? Number((totalVolts / effectiveOhms).toFixed(2)) : 0;
  const bulbBrightness = circuitClosed ? Math.min(1, currentAmps / 0.5) : 0;

  // Eureka Solid details
  const solidConfigs = {
    stone: { name: 'Irregular Granite Stone', massG: 64.8, volumeCm3: 24.0, density: 2.70 },
    brass_weight: { name: 'Standard Brass Weight (Item #27)', massG: 84.0, volumeCm3: 10.0, density: 8.40 },
    glass_marble: { name: 'Spherical Glass Stopper (Item #35)', massG: 37.5, volumeCm3: 15.0, density: 2.50 }
  };
  const currentSolid = solidConfigs[eurekaSolid];

  const handleDrainSeparatingFunnel = () => {
    setFunnelTapped(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setSeparationProgress(p);
      if (p >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const handleRecordData = () => {
    let reading = {};
    if (experiment.simulationType === 'acids_bases') {
      reading = { substance: currentSubstance.name, formula: currentSubstance.formula, ph: currentSubstance.ph, indicator: chemIndicator, observation: indicatorResult.desc };
    } else if (experiment.simulationType === 'circuits') {
      reading = { voltage: `${totalVolts}V`, bulbs: bulbCount, connection: circuitType, current: `${currentAmps}A`, resistance: `${effectiveOhms.toFixed(1)}Ω` };
    } else if (experiment.simulationType === 'microscope') {
      reading = { slide: microscopeSlide, magnification: `${magnification}x`, clarity: focusLevel === 85 ? 'Optimal Crisp' : 'Adjusted' };
    } else if (experiment.simulationType === 'density_eureka') {
      reading = { specimen: currentSolid.name, mass: `${currentSolid.massG}g`, volume: `${currentSolid.volumeCm3}cm³`, density: `${currentSolid.density} g/cm³` };
    }

    onRecordObservation?.(reading);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Workbench Header Toolbar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            {experiment.simulationType === 'acids_bases' && <FlaskConical className="w-5 h-5" />}
            {experiment.simulationType === 'circuits' && <Zap className="w-5 h-5" />}
            {experiment.simulationType === 'microscope' && <Eye className="w-5 h-5" />}
            {experiment.simulationType === 'separation' && <Layers className="w-5 h-5" />}
            {experiment.simulationType === 'density_eureka' && <Sliders className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                Interactive Simulation Engine
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                Mode: {mode}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
              {experiment.title}
            </h3>
          </div>
        </div>

        {/* Workbench Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSimEngineView('apparatus')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simEngineView === 'apparatus'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Apparatus Bench
            </button>
            <button
              onClick={() => setSimEngineView('classic_phet')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                simEngineView === 'classic_phet'
                  ? 'bg-orange-600 text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-orange-300 animate-spin" />
              <span>PhET Classic</span>
            </button>
          </div>

          <button
            onClick={handleRecordData}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Recorded!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Record to Notebook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage or PhET Classic Stage */}
      {simEngineView === 'classic_phet' ? (
        <div className="p-4 bg-slate-950">
          {experiment.simulationType === 'circuits' && (
            <ClassicCircuitsPhET onRecordObservation={onRecordObservation} />
          )}
          {experiment.simulationType === 'acids_bases' && (
            <ClassicPhScalePhET onRecordObservation={onRecordObservation} />
          )}
          {experiment.simulationType === 'density_eureka' && (
            <ClassicForcesMotionPhET onRecordObservation={onRecordObservation} />
          )}
          {!['circuits', 'acids_bases', 'density_eureka'].includes(experiment.simulationType) && (
            <ClassicForcesMotionPhET onRecordObservation={onRecordObservation} />
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
        
        {/* ============================================================== */}
        {/* CASE 1: ACIDS, BASES & INDICATOR EXPERIMENT */}
        {/* ============================================================== */}
        {experiment.simulationType === 'acids_bases' && (
          <>
            {/* Control Panel: Reagents and Indicators */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    1. Select Reagent from JSS Inventory:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {currentSubstance.itemRef}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(jssChemicals).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setChemSubstance(key)}
                      className={`p-2 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                        chemSubstance === key
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-500 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{item.name}</div>
                        <span className="text-[10px] font-mono font-normal text-slate-400">{item.formula}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        pH {item.ph}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Indicator Selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  2. Select Chemical Indicator (Item #1, 2, 3, 4, 6):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'universal', label: 'Universal Indicator (Item #6)', note: 'pH 1-14 Spectrum' },
                    { id: 'litmus_blue', label: 'Blue Litmus Paper (Item #2)', note: 'Turns red in acid' },
                    { id: 'litmus_red', label: 'Red Litmus Paper (Item #2)', note: 'Turns blue in base' },
                    { id: 'phenolphthalein', label: 'Phenolphthalein (Item #4)', note: 'Pink in base' },
                    { id: 'methyl_orange', label: 'Methyl Orange (Item #3)', note: 'Red in acid, yellow in base' }
                  ].map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => setChemIndicator(ind.id as any)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        chemIndicator === ind.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{ind.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{ind.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Test Tube & Chemical Reaction Visualizer */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="font-black text-slate-900 uppercase tracking-wider">
                    Virtual Test Tube Stand (Item #35 Bungs & Glassware)
                  </span>
                  <span className="font-mono text-slate-500">Temp: {solutionTemp}°C</span>
                </div>

                {/* Apparatus Illustration */}
                <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-8 min-h-[220px]">
                  {/* Test tube container */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-16 h-48 rounded-b-3xl border-4 border-slate-300 bg-slate-100/60 p-1 flex flex-col justify-end shadow-inner relative overflow-hidden">
                      {/* Graduations */}
                      <div className="absolute left-1 top-4 w-2 h-0.5 bg-slate-400"></div>
                      <div className="absolute left-1 top-12 w-3 h-0.5 bg-slate-400"></div>
                      <div className="absolute left-1 top-20 w-2 h-0.5 bg-slate-400"></div>
                      <div className="absolute left-1 top-28 w-3 h-0.5 bg-slate-400"></div>

                      {/* Liquid volume with dynamic indicator colour */}
                      <div 
                        className={`w-full rounded-b-2xl transition-all duration-500 shadow-lg relative flex items-center justify-center text-center p-1 ${indicatorResult.bg} ${indicatorResult.text}`}
                        style={{ height: '70%' }}
                      >
                        <span className="text-[10px] font-mono font-black rotate-90 select-none">
                          {currentSubstance.formula}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 mt-2">Test Tube A</span>
                  </div>

                  {/* Indicator Drop & Reaction Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-xs w-full space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 text-[10px] uppercase">Observed Outcome</span>
                      <span className="font-black text-emerald-700 uppercase text-[10px]">Active</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-900">{currentSubstance.name}</div>
                      <div className="text-[10px] text-slate-500">Tested with: {chemIndicator.replace('_', ' ')}</div>
                    </div>

                    <div className={`p-2.5 rounded-lg font-bold text-xs ${indicatorResult.bg} ${indicatorResult.text}`}>
                      {indicatorResult.desc}
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded-lg leading-relaxed">
                      <strong>Scientific Deduction:</strong> Solution possesses an active hydronium/hydroxide concentration corresponding to <strong>{currentSubstance.category}</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bunsen Burner Heating Toggle (Item #69 Matches) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsHeating(!isHeating);
                      setSolutionTemp(!isHeating ? 68 : 24);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isHeating 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isHeating ? 'Extinguish Flame' : 'Light Bunsen Burner (Item #69)'}</span>
                  </button>
                  {isHeating && <span className="text-amber-700 font-bold text-[11px] animate-pulse">Heating Reagent...</span>}
                </div>
                <span className="text-[10px] text-slate-400">JSS Chemistry Competency</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CASE 2: ELECTRICAL CIRCUITS & OHM'S LAW (JSS Physics) */}
        {/* ============================================================== */}
        {experiment.simulationType === 'circuits' && (
          <>
            {/* Circuit Controls (Dry cells, Bulbs, Switch) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  1. Battery Cells (Item #67 Size D Cells):
                </span>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{cellCount} Dry Cells (1.5V each)</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">Total Voltage: {totalVolts} V</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCellCount(Math.max(1, cellCount - 1))}
                      disabled={cellCount <= 1}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCellCount(Math.min(6, cellCount + 1))}
                      disabled={cellCount >= 6}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block pt-2">
                  2. Bulbs in Holders (Item #50 & #51):
                </span>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{bulbCount} Torch Bulbs</div>
                    <div className="text-[10px] text-slate-500">Miniature MES Screw Base</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBulbCount(Math.max(1, bulbCount - 1))}
                      disabled={bulbCount <= 1}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setBulbCount(Math.min(4, bulbCount + 1))}
                      disabled={bulbCount >= 4}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Circuit Connection Mode */}
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block pt-2">
                  3. Connection Architecture:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setCircuitType('series')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      circuitType === 'series'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Series Circuit
                  </button>
                  <button
                    onClick={() => setCircuitType('parallel')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      circuitType === 'parallel'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Parallel Circuit
                  </button>
                </div>
              </div>

              {/* Knife Switch (Item #29) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Knife Switch (Item #29)</div>
                  <div className="text-[10px] text-slate-500">Status: {circuitClosed ? 'Closed (Conducting)' : 'Open (Broken loop)'}</div>
                </div>
                <button
                  onClick={() => setCircuitClosed(!circuitClosed)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    circuitClosed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  }`}
                >
                  {circuitClosed ? 'Open Switch' : 'Close Switch'}
                </button>
              </div>
            </div>

            {/* Circuit Visualizer & Meter Gauges */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <span className="font-mono text-emerald-400 font-bold uppercase">
                    Breadboard & Connecting Wires (Item #52)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    circuitClosed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {circuitClosed ? 'Current Flowing' : 'No Current'}
                  </span>
                </div>

                {/* Circuit schematic illustration */}
                <div className="my-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center relative min-h-[200px]">
                  {/* Bulbs Display */}
                  <div className="flex items-center justify-center gap-6 my-4">
                    {[...Array(bulbCount)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className="w-14 h-14 rounded-full border-2 border-slate-600 flex items-center justify-center transition-all duration-300 relative"
                          style={{
                            backgroundColor: circuitClosed ? `rgba(250, 204, 21, ${bulbBrightness})` : 'rgba(71, 85, 105, 0.4)',
                            boxShadow: circuitClosed && bulbBrightness > 0.3 ? `0 0 ${bulbBrightness * 25}px rgba(250, 204, 21, 0.8)` : 'none'
                          }}
                        >
                          <Zap className={`w-6 h-6 transition-colors ${circuitClosed && bulbBrightness > 0.2 ? 'text-amber-900' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-1">Bulb {i + 1}</span>
                      </div>
                    ))}
                  </div>

                  {/* Wire loops indicator */}
                  <div className="text-[10px] font-mono text-slate-400">
                    Configuration: {circuitType.toUpperCase()} · Resistance: {effectiveOhms.toFixed(1)} Ω
                  </div>
                </div>

                {/* Virtual Meters: Voltmeter & Ammeter (Item #24 & PDF Measurement) */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Voltmeter Reading (V)</span>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                      {circuitClosed ? `${totalVolts} V` : '0.0 V'}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Ammeter Reading (I)</span>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                      {currentAmps} A
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center mt-4">
                <span>Ohm\'s Law Formula: <strong>V = I × R</strong></span>
                <span className="text-emerald-400 font-bold">Physics Strand verified</span>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CASE 3: VIRTUAL MICROSCOPE (JSS Biology) */}
        {/* ============================================================== */}
        {experiment.simulationType === 'microscope' && (
          <>
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  1. Select Slide Specimen (Item #31 Slides & #33 Cover Slips):
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'onion', title: 'Onion Epidermal Peel', stained: 'Iodine Solution (Item #43)', type: 'Plant Cell' },
                    { id: 'cheek', title: 'Human Cheek Epithelial Cells', stained: 'Quink Ink / Methylene (Item #68)', type: 'Animal Cell' },
                    { id: 'stomata', title: 'Bean Leaf Epidermis (Stomata)', stained: 'Clear Mount', type: 'Plant Guard Cells' }
                  ].map(slide => (
                    <button
                      key={slide.id}
                      onClick={() => setMicroscopeSlide(slide.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        microscopeSlide === slide.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{slide.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Stain: {slide.stained}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {slide.type}
                      </span>
                    </button>
                  ))}
                </div>

                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block pt-2">
                  2. Objective Lens Magnification:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[40, 100, 400].map(mag => (
                    <button
                      key={mag}
                      onClick={() => setMagnification(mag as any)}
                      className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        magnification === mag
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-950 ring-1 ring-cyan-500'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {mag}×
                    </button>
                  ))}
                </div>

                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block pt-2">
                  3. Coarse & Fine Focus Adjustment:
                </span>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={focusLevel}
                  onChange={(e) => setFocusLevel(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Blurry</span>
                  <span className="text-emerald-700 font-bold">In-Focus Target (85%)</span>
                  <span>Distorted</span>
                </div>
              </div>
            </div>

            {/* Circular Eyepiece Field of View */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-between min-h-[340px]">
              <div className="w-full flex items-center justify-between text-xs text-slate-400">
                <span>Microscope Circular Field of View</span>
                <span className="font-mono text-cyan-400">MAG: {magnification}×</span>
              </div>

              {/* Eyepiece Circle with Dynamic Blur */}
              <div 
                className="w-52 h-52 rounded-full border-8 border-slate-700 bg-emerald-950/80 overflow-hidden relative shadow-2xl flex items-center justify-center my-4"
                style={{
                  filter: `blur(${Math.abs(85 - focusLevel) / 9}px)`
                }}
              >
                {microscopeSlide === 'onion' && (
                  <div className="grid grid-cols-4 grid-rows-3 gap-1 w-full h-full p-3 opacity-80">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="border-2 border-emerald-400/80 rounded-md bg-emerald-700/40 relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-200/90" />
                      </div>
                    ))}
                  </div>
                )}
                {microscopeSlide === 'cheek' && (
                  <div className="relative w-full h-full flex items-center justify-center opacity-85">
                    <div className="w-24 h-20 rounded-[45%] border-2 border-pink-400/80 bg-pink-600/30 flex items-center justify-center transform -rotate-12">
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-900 border border-purple-300" />
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

              <div className="w-full bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-xs">
                <span className="text-cyan-300 font-bold block mb-0.5">Cellular Observation:</span>
                <p className="text-slate-300">
                  {microscopeSlide === 'onion' && 'Rectangular plant cell bricks with rigid cell walls and stained nuclei.'}
                  {microscopeSlide === 'cheek' && 'Flexible irregular squamous epithelial animal cells with cell membranes.'}
                  {microscopeSlide === 'stomata' && 'Kidney/bean shaped guard cells regulating stomatal pore opening for gas exchange.'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CASE 4: SEPARATION OF IMMISCIBLE LIQUIDS (Item #36 & #75) */}
        {/* ============================================================== */}
        {experiment.simulationType === 'separation' && (
          <>
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  Separating Funnel Operation (Item #36 & #75 Engine Oil):
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Water and engine oil do not mix (immiscible). Water has a higher density (1.00 g/cm³) and forms the bottom layer, while engine oil (0.88 g/cm³) floats on top.
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDrainSeparatingFunnel}
                    disabled={funnelTapped && separationProgress >= 100}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Droplet className="w-4 h-4" />
                    <span>{separationProgress >= 100 ? 'Separation Complete' : 'Open Stopcock to Tap Denser Water'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFunnelTapped(false);
                      setSeparationProgress(0);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reset Funnel Mixture
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-28 h-64 border-4 border-slate-300 rounded-b-full relative overflow-hidden bg-slate-50 flex flex-col justify-end shadow-inner">
                {/* Engine Oil Layer (Top) */}
                <div className="w-full bg-amber-500/80 text-amber-950 font-bold text-[10px] flex items-center justify-center p-2 text-center" style={{ height: '40%' }}>
                  Engine Oil (Top Layer)
                </div>
                {/* Water Layer (Bottom - drains out) */}
                <div 
                  className="w-full bg-cyan-500/80 text-cyan-950 font-bold text-[10px] flex items-center justify-center p-2 text-center transition-all duration-300"
                  style={{ height: `${Math.max(0, 60 - (separationProgress * 0.6))}%` }}
                >
                  {separationProgress < 100 ? 'Water Layer (Dense)' : 'Tapped Out'}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-3">
                Separation Status: {separationProgress}% complete
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CASE 5: DENSITY & EUREKA DISPLACEMENT CAN (Item #24 & #25) */}
        {/* ============================================================== */}
        {experiment.simulationType === 'density_eureka' && (
          <>
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  1. Select Irregular Specimen:
                </span>
                <div className="space-y-1.5">
                  {(['stone', 'brass_weight', 'glass_marble'] as const).map(spec => (
                    <button
                      key={spec}
                      onClick={() => {
                        setEurekaSolid(spec);
                        setIsSubmerged(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        eurekaSolid === spec
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {solidConfigs[spec].name}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsSubmerged(!isSubmerged)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isSubmerged ? 'Withdraw Object from Can' : 'Submerge Object in Eureka Can'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Mass (Electronic Balance #24)</span>
                  <div className="text-base font-black text-slate-900 mt-1">{currentSolid.massG} g</div>
                </div>
                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                  <span className="text-[10px] text-cyan-800 uppercase font-bold">Displaced Volume (Spout #25)</span>
                  <div className="text-base font-black text-cyan-950 mt-1">
                    {isSubmerged ? `${currentSolid.volumeCm3} cm³` : '0 cm³'}
                  </div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Calculated Density (m/V)</span>
                  <div className="text-base font-black text-emerald-950 mt-1">
                    {isSubmerged ? `${currentSolid.density} g/cm³` : '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 mt-4 leading-relaxed">
                <strong>Physics Measurement Principle:</strong> When the object is submerged into the filled Eureka can, it displaces an exact volume of water equal to its own volume, collected in the graduated cylinder.
              </div>
            </div>
          </>
        )}

        </div>
      )}
    </div>
  );
};
