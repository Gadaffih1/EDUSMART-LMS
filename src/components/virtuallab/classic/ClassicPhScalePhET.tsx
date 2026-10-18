import React, { useState, useRef } from 'react';
import { 
  FlaskConical, 
  RotateCcw, 
  Droplet, 
  Sliders, 
  Save, 
  Check, 
  HelpCircle,
  Plus,
  Minus,
  Sparkles,
  Info
} from 'lucide-react';

interface ClassicPhScalePhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

interface LiquidDef {
  id: string;
  name: string;
  formula: string;
  basePh: number;
  color: string;
  category: 'Acid' | 'Neutral' | 'Base';
  description: string;
  jssItemRef: string;
}

const PHET_LIQUIDS: LiquidDef[] = [
  { id: 'hcl', name: 'Hydrochloric Acid {AR}', formula: 'HCl (aq)', basePh: 1.00, color: '#f87171', category: 'Acid', description: 'Strong mineral acid from JSS Chemistry inventory (Item #16)', jssItemRef: 'Item #16' },
  { id: 'battery_acid', name: 'Battery Acid (H₂SO₄)', formula: 'H₂SO₄ (aq)', basePh: 0.80, color: '#ef4444', category: 'Acid', description: 'Concentrated sulphuric acid solution (Item #15)', jssItemRef: 'Item #15' },
  { id: 'lemon_juice', name: 'Lemon Juice (Citric Acid)', formula: 'C₆H₈O₇ (aq)', basePh: 2.20, color: '#fbbf24', category: 'Acid', description: 'Natural organic fruit acid used in CBC domestic acid investigations', jssItemRef: 'Domestic Acid' },
  { id: 'vinegar', name: 'Vinegar (Ethanoic Acid)', formula: 'CH₃COOH (aq)', basePh: 2.80, color: '#f59e0b', category: 'Acid', description: 'Commercial vinegar 5% ethanoic solution (Item #21 & #71)', jssItemRef: 'Item #21' },
  { id: 'tomato_juice', name: 'Tomato Juice', formula: 'Organic acids', basePh: 4.10, color: '#ea580c', category: 'Acid', description: 'Mild organic weak acid solution', jssItemRef: 'Biological' },
  { id: 'coffee', name: 'Black Coffee', formula: 'Chlorogenic acids', basePh: 5.00, color: '#78350f', category: 'Acid', description: 'Mildly acidic beverage containing roasted organic acids', jssItemRef: 'Domestic Reagent' },
  { id: 'milk', name: 'Cow Milk (Lactic Acid)', formula: 'Lactic acid', basePh: 6.60, color: '#fef3c7', category: 'Acid', description: 'Near neutral emulsion containing mild lactic buffer', jssItemRef: 'Food Reagent' },
  { id: 'water', name: 'Pure Distilled Water', formula: 'H₂O (l)', basePh: 7.00, color: '#38bdf8', category: 'Neutral', description: 'Neutral laboratory solvent with balanced H⁺ and OH⁻ ions', jssItemRef: 'Item #74 Solvents' },
  { id: 'blood', name: 'Human Blood Plasma', formula: 'Bicarbonate buffer', basePh: 7.40, color: '#be123c', category: 'Base', description: 'Slightly alkaline biological physiological buffer', jssItemRef: 'Biological Buffer' },
  { id: 'nahco3', name: 'Sodium Bicarbonate', formula: 'NaHCO₃ (aq)', basePh: 8.40, color: '#0284c7', category: 'Base', description: 'Baking soda weak alkaline solution (Item #17)', jssItemRef: 'Item #17' },
  { id: 'hand_soap', name: 'Hand Soap Solution', formula: 'Sodium stearate', basePh: 10.00, color: '#2563eb', category: 'Base', description: 'Alkaline domestic surfactant soap solution', jssItemRef: 'Item #70 Cleaning' },
  { id: 'limewater', name: 'Calcium Hydroxide (Limewater)', formula: 'Ca(OH)₂ (aq)', basePh: 11.20, color: '#4338ca', category: 'Base', description: 'Saturated calcium hydroxide solution for testing CO₂ gas (Item #7)', jssItemRef: 'Item #7' },
  { id: 'bleach', name: 'Household Bleach', formula: 'NaOCl (aq)', basePh: 12.60, color: '#6d28d9', category: 'Base', description: 'Sodium hypochlorite strong household disinfectant', jssItemRef: 'Disinfectant' },
  { id: 'naoh', name: 'Sodium Hydroxide Solution', formula: 'NaOH (aq)', basePh: 13.80, color: '#4c1d95', category: 'Base', description: 'Strong caustic alkali pellets solution (Item #13)', jssItemRef: 'Item #13' }
];

export const ClassicPhScalePhET: React.FC<ClassicPhScalePhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  const [selectedLiquidId, setSelectedLiquidId] = useState<string>('hcl');
  const [solutionVolume, setSolutionVolume] = useState<number>(0.50); // Litres (0.10 to 1.00 L)
  const [waterAddedVolume, setWaterAddedVolume] = useState<number>(0.0); // Litres added
  const [testStripDipped, setTestStripDipped] = useState<boolean>(true);
  const [indicatorType, setIndicatorType] = useState<'universal' | 'litmus_blue' | 'litmus_red'>('universal');
  const [probePosition, setProbePosition] = useState<{ x: number; y: number }>({ x: 260, y: 220 });
  const [isDraggingProbe, setIsDraggingProbe] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const containerRef = useRef<SVGSVGElement>(null);

  const currentLiquid = PHET_LIQUIDS.find(l => l.id === selectedLiquidId) || PHET_LIQUIDS[0];

  // Total Volume
  const totalVolume = Number((solutionVolume + waterAddedVolume).toFixed(2));

  // Compute Diluted pH
  // Initial [H+] = 10^(-basePh)
  // When diluted with water (neutral pH 7, [H+] = 10^-7):
  // Total moles H+ = (initialVolume * 10^-basePh) + (waterVolume * 10^-7)
  // New [H+] = totalMoles / totalVolume
  // New pH = -log10(new [H+])
  const initialH = Math.pow(10, -currentLiquid.basePh);
  const waterH = Math.pow(10, -7.00);
  const totalMolesH = (solutionVolume * initialH) + (waterAddedVolume * waterH);
  const currentConcH = totalMolesH / Math.max(0.01, totalVolume);
  const calculatedPh = Math.max(0, Math.min(14, -Math.log10(currentConcH)));
  const currentPh = Number(calculatedPh.toFixed(2));

  // Is probe submerged in liquid?
  // Beaker liquid height: fills from y=160 (empty) to y=320 (bottom)
  const liquidTopY = 320 - (totalVolume / 1.0) * 140;
  const isProbeInLiquid = probePosition.x >= 180 && probePosition.x <= 340 && probePosition.y >= liquidTopY && probePosition.y <= 330;

  // Universal Indicator Spectrum Color
  const getSpectrumColor = (ph: number): string => {
    if (ph < 2) return '#ef4444'; // Red
    if (ph < 4) return '#f97316'; // Orange
    if (ph < 6) return '#eab308'; // Yellow
    if (ph <= 7.5) return '#22c55e'; // Green
    if (ph < 10) return '#06b6d4'; // Cyan
    if (ph < 12) return '#3b82f6'; // Blue
    return '#7c3aed'; // Violet
  };

  const getStripResultColor = () => {
    if (indicatorType === 'universal') {
      return getSpectrumColor(currentPh);
    }
    if (indicatorType === 'litmus_blue') {
      return currentPh < 7 ? '#ef4444' : '#3b82f6';
    }
    // litmus_red
    return currentPh > 7 ? '#3b82f6' : '#ef4444';
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingProbe(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingProbe || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(50, Math.min(550, e.clientX - rect.left));
    const y = Math.max(50, Math.min(350, e.clientY - rect.top));
    setProbePosition({ x, y });
  };

  const handlePointerUp = () => {
    setIsDraggingProbe(false);
  };

  const handleAddWater = () => {
    if (totalVolume < 1.0) {
      setWaterAddedVolume(prev => Number(Math.min(1.0 - solutionVolume, prev + 0.10).toFixed(2)));
    }
  };

  const handleDrain = () => {
    if (totalVolume > 0.1) {
      if (waterAddedVolume > 0) {
        setWaterAddedVolume(prev => Number(Math.max(0, prev - 0.10).toFixed(2)));
      } else {
        setSolutionVolume(prev => Number(Math.max(0.1, prev - 0.10).toFixed(2)));
      }
    }
  };

  const handleReset = () => {
    setSolutionVolume(0.50);
    setWaterAddedVolume(0.0);
    setProbePosition({ x: 260, y: 220 });
    setSelectedLiquidId('hcl');
  };

  const handleRecord = () => {
    const observation = {
      experiment: 'pH Scale & Acid-Base Dilution',
      substance: currentLiquid.name,
      basePh: currentLiquid.basePh,
      currentPh,
      totalVolume: `${totalVolume} L`,
      waterAdded: `${waterAddedVolume} L`,
      indicatorTested: indicatorType,
      classification: currentPh < 7 ? 'Acidic' : currentPh === 7 ? 'Neutral' : 'Basic/Alkaline',
      timestamp: new Date().toLocaleTimeString()
    };
    onRecordObservation?.(observation);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className={`bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* PhET Classic Ribbon */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                PhET Classic Engine
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                pH = -log₁₀[H⁺]
              </span>
            </div>
            <h3 className="text-sm font-black tracking-tight text-white mt-0.5">
              pH Scale & Solutions Workbench
            </h3>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            title="Reset simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRecord}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Logged!' : 'Record Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1">
        
        {/* Left 8 Cols: Interactive Beaker & Probes Canvas */}
        <div 
          className="lg:col-span-8 p-4 bg-slate-950 relative flex flex-col justify-between select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="relative w-full h-[430px] rounded-2xl bg-[#091122] border border-slate-800/80 overflow-hidden shadow-inner">
            
            <svg 
              ref={containerRef}
              className="w-full h-full relative z-10" 
              viewBox="0 0 650 400"
            >
              {/* ============================================================== */}
              {/* WATER TAP FAUCET (Top Left) */}
              {/* ============================================================== */}
              <g transform="translate(140, 20)">
                {/* Brass Spigot pipe */}
                <path d="M 0,40 L 40,40 L 40,80 L 60,80 L 60,30 L 0,30 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Valve handle */}
                <rect x="42" y="15" width="16" height="15" rx="3" fill="#3b82f6" stroke="#60a5fa" />
                <circle cx="50" cy="22" r="3" fill="#ffffff" />
                <text x="50" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle">Water Faucet</text>
              </g>

              {/* DRAIN VALVE (Bottom of Beaker) */}
              <g transform="translate(240, 350)">
                <rect x="10" y="0" width="20" height="25" fill="#64748b" />
                <rect x="5" y="20" width="30" height="8" rx="2" fill="#334155" />
              </g>

              {/* ============================================================== */}
              {/* GLASS BEAKER (1000ml / 1.0 Litre Graduated Beaker) */}
              {/* ============================================================== */}
              <g transform="translate(170, 160)">
                {/* Liquid Volume inside Beaker */}
                <rect 
                  x="15" 
                  y={160 - (totalVolume / 1.0) * 140} 
                  width="170" 
                  height={(totalVolume / 1.0) * 140} 
                  rx="6" 
                  fill={currentLiquid.color} 
                  opacity="0.82"
                  className="transition-all duration-300"
                />
                
                {/* Surface Meniscus Wave */}
                <ellipse 
                  cx="100" 
                  cy={160 - (totalVolume / 1.0) * 140} 
                  rx="85" 
                  ry="6" 
                  fill={currentLiquid.color} 
                  opacity="0.9" 
                />

                {/* Glass Beaker Outline */}
                <path 
                  d="M 10,10 L 10,165 Q 10,175 25,175 L 175,175 Q 190,175 190,165 L 190,10" 
                  fill="none" 
                  stroke="#cbd5e1" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                />
                {/* Beaker Spout on top left */}
                <path d="M 10,10 L 0,6 L 10,2" fill="none" stroke="#cbd5e1" strokeWidth="3" />

                {/* Beaker Volume Graduations */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((v, idx) => {
                  const yPos = 160 - (v / 1.0) * 140;
                  return (
                    <g key={idx}>
                      <line x1="10" y1={yPos} x2="30" y2={yPos} stroke="#ffffff" strokeWidth="2" opacity="0.7" />
                      <text x="36" y={yPos + 4} fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {(v * 1000).toFixed(0)}ml
                      </text>
                    </g>
                  );
                })}

                <text x="100" y="195" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                  1000ml Pyrex Beaker
                </text>
              </g>

              {/* ============================================================== */}
              {/* LITMUS / UNIVERSAL INDICATOR PAPER STRIP */}
              {/* ============================================================== */}
              {testStripDipped && (
                <g transform="translate(320, 140)">
                  {/* Paper Strip */}
                  <rect x="0" y="0" width="16" height="140" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                  {/* Submerged section changes colour */}
                  <rect 
                    x="0" 
                    y="40" 
                    width="16" 
                    height="100" 
                    rx="2" 
                    fill={getStripResultColor()} 
                    opacity="0.95"
                  />
                  <text x="8" y="-6" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">Test Strip</text>
                </g>
              )}

              {/* ============================================================== */}
              {/* DRAGGABLE DIGITAL pH SENSOR METER & ELECTRODE PROBE */}
              {/* ============================================================== */}
              {/* Digital Meter Base (Top Right) */}
              <g transform="translate(420, 25)">
                <rect x="0" y="0" width="150" height="95" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.5))" />
                <rect x="14" y="14" width="122" height="42" rx="6" fill="#0c4a6e" stroke="#0284c7" />
                
                {/* Big Digital pH Display */}
                <text x="75" y="44" fill="#38bdf8" fontSize="26" fontFamily="monospace" fontWeight="900" textAnchor="middle">
                  {isProbeInLiquid ? currentPh.toFixed(2) : '---'}
                </text>
                <text x="120" y="44" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold">pH</text>

                <text x="75" y="74" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {isProbeInLiquid 
                    ? (currentPh < 6.8 ? 'ACIDIC' : currentPh <= 7.2 ? 'NEUTRAL' : 'ALKALINE')
                    : 'DIP PROBE IN LIQUID'}
                </text>
                <text x="75" y="86" fill="#64748b" fontSize="8" textAnchor="middle">PHET DIGITAL SENSOR</text>
              </g>

              {/* Flexible Sensor Cable connecting Meter to Electrode Probe */}
              <path 
                d={`M 450,115 Q ${(450 + probePosition.x)/2 + 20},${(115 + probePosition.y)/2 + 30} ${probePosition.x},${probePosition.y}`} 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* DRAGGABLE GLASS ELECTRODE PROBE */}
              <g 
                transform={`translate(${probePosition.x}, ${probePosition.y})`}
                onPointerDown={handlePointerDown}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Glass bulb tip */}
                <circle cx="0" cy="18" r="6" fill="#a5f3fc" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9" />
                {/* Shield tube */}
                <rect x="-4" y="-20" width="8" height="38" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                {/* Grip Handle */}
                <rect x="-8" y="-45" width="16" height="25" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="0" cy="-32" r="3" fill="#ffffff" />
                {/* Grab hotspot */}
                <circle cx="0" cy="0" r="14" fill="transparent" />
              </g>
            </svg>

            {/* In-canvas Guidance Pill */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isProbeInLiquid ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span>
                {isProbeInLiquid 
                  ? `Probe immersed: pH is ${currentPh.toFixed(2)} (${currentLiquid.name})` 
                  : 'Drag the digital electrode probe into the beaker to measure active pH!'}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Measured pH</span>
              <span className="text-base font-black text-cyan-400 font-mono">
                {isProbeInLiquid ? currentPh.toFixed(2) : '--'}
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Solution Volume</span>
              <span className="text-base font-black text-amber-400 font-mono">{totalVolume.toFixed(2)} L</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Hydronium [H⁺]</span>
              <span className="text-base font-black text-emerald-400 font-mono">{currentConcH.toExponential(2)} M</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
              <span className={`text-base font-black font-mono ${currentPh < 7 ? 'text-red-400' : currentPh === 7 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {currentPh < 6.8 ? 'Acidic' : currentPh <= 7.2 ? 'Neutral' : 'Basic'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Classic PhET Solution Controls */}
        <div className="lg:col-span-4 p-5 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Solution & Reagents</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">JSS Chemistry</span>
          </div>

          {/* 1. Select Solution Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Select Chemical Substance:</label>
            <select
              value={selectedLiquidId}
              onChange={(e) => {
                setSelectedLiquidId(e.target.value);
                setWaterAddedVolume(0.0);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold focus:ring-2 focus:ring-emerald-500"
            >
              {PHET_LIQUIDS.map((liq) => (
                <option key={liq.id} value={liq.id}>
                  {liq.name} (pH ~ {liq.basePh.toFixed(1)})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">{currentLiquid.description}</p>
          </div>

          {/* 2. Dilution & Drain Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 block">Beaker Fluid Management:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddWater}
                disabled={totalVolume >= 1.0}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>+ Water (Dilute)</span>
              </button>

              <button
                type="button"
                onClick={handleDrain}
                disabled={totalVolume <= 0.1}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <span>Drain Liquid</span>
              </button>
            </div>
          </div>

          {/* 3. Indicator Test Strip Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 block">Chemical Indicator Paper:</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: 'universal', label: 'Universal', note: 'pH 1-14' },
                { id: 'litmus_blue', label: 'Blue Litmus', note: 'Red in acid' },
                { id: 'litmus_red', label: 'Red Litmus', note: 'Blue in base' }
              ].map(ind => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setIndicatorType(ind.id as any)}
                  className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all cursor-pointer ${
                    indicatorType === ind.id 
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm' 
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <div>{ind.label}</div>
                  <span className="text-[9px] opacity-75 block">{ind.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Universal pH Color Spectrum Scale */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 text-[10px] uppercase">Universal Indicator Spectrum</span>
              <span className="font-mono text-[10px] text-cyan-400">0 → 14</span>
            </div>
            {/* Visual gradient rainbow bar */}
            <div className="h-5 rounded-lg bg-gradient-to-r from-red-600 via-yellow-400 via-emerald-500 via-blue-600 to-purple-800 relative shadow-inner">
              {/* Indicator pointer needle */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-white border border-black shadow-md transform -translate-x-1/2 transition-all duration-300"
                style={{ left: `${(currentPh / 14) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>0 (Acid)</span>
              <span>7 (Neutral)</span>
              <span>14 (Alkali)</span>
            </div>
          </div>

          {/* Inquiry Question */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>PhET CBC Lab Question:</span>
            </span>
            <p className="text-slate-300 leading-relaxed">
              When you dilute an acid with water, does the pH increase toward 7 or decrease toward 0? Can dilution ever turn an acid into a base?
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
