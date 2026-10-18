import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Check, 
  Sliders, 
  BarChart3, 
  PieChart, 
  Sparkles, 
  Globe2, 
  Gauge, 
  FastForward 
} from 'lucide-react';

interface ClassicEnergySkateParkPhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const ClassicEnergySkateParkPhET: React.FC<ClassicEnergySkateParkPhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  // Planetary Gravity options
  const GRAVITY_PRESETS = {
    earth: { name: 'Earth', g: 9.8, label: '9.8 m/s²' },
    moon: { name: 'Moon', g: 1.6, label: '1.6 m/s²' },
    jupiter: { name: 'Jupiter', g: 24.8, label: '24.8 m/s²' },
    space: { name: 'Zero-G Space', g: 0.0, label: '0.0 m/s²' }
  };

  const [planet, setPlanet] = useState<'earth' | 'moon' | 'jupiter' | 'space'>('earth');
  const [skaterMass, setSkaterMass] = useState<number>(60); // kg
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.02); // 0 (None) to 0.08
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSlowMotion, setIsSlowMotion] = useState<boolean>(false);
  const [showBarGraph, setShowBarGraph] = useState<boolean>(true);
  const [showPieChart, setShowPieChart] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Skater state on parabolic track: y = a * x^2
  // track width: -200 to +200 px. height at edge: 140px.
  // x = position (-180 to +180). theta = phase angle for oscillation
  const [skaterX, setSkaterX] = useState<number>(-160);
  const [thermalEnergy, setThermalEnergy] = useState<number>(0);
  const phaseRef = useRef<number>(0);

  const currentG = GRAVITY_PRESETS[planet].g;

  // Track profile: height h from 0 to 6 meters
  // Skater max height at x = 160: ~5.0 meters
  const currentHeight = Math.max(0, Math.pow(skaterX / 160, 2) * 5.0); // meters

  // Mechanical Physics:
  // Initial total energy: E_total = m * g * h_initial
  const maxInitialHeight = 5.0;
  const initialTotalEnergy = skaterMass * Math.max(0.1, currentG) * maxInitialHeight;
  
  // Available mechanical energy after thermal dissipation:
  const mechanicalEnergy = Math.max(0, initialTotalEnergy - thermalEnergy);
  
  // Potential energy: Ep = m * g * h
  const potentialEnergy = currentG > 0 ? skaterMass * currentG * currentHeight : 0;
  
  // Kinetic energy: Ek = mechanicalEnergy - potentialEnergy (clamped >= 0)
  const kineticEnergy = Math.max(0, mechanicalEnergy - potentialEnergy);
  
  // Total energy:
  const totalEnergy = kineticEnergy + potentialEnergy + thermalEnergy;

  // Velocity v = sqrt(2 * Ek / m)
  const velocity = Math.sqrt((2 * kineticEnergy) / skaterMass);

  // Animation Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (isPlaying && currentG > 0) {
        const speedFactor = isSlowMotion ? 0.015 : 0.04;
        phaseRef.current += Math.sqrt(currentG / 9.8) * speedFactor;

        // Amplitude decays if friction > 0
        const damping = Math.exp(-frictionCoeff * phaseRef.current * 0.1);
        const effectiveAmp = Math.max(0, 160 * damping);
        
        const newX = effectiveAmp * Math.cos(phaseRef.current);
        setSkaterX(newX);

        if (frictionCoeff > 0) {
          setThermalEnergy(prev => {
            const nextTh = initialTotalEnergy * (1 - damping);
            return Math.min(initialTotalEnergy, nextTh);
          });
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentG, isSlowMotion, frictionCoeff, initialTotalEnergy]);

  const handleReset = () => {
    phaseRef.current = 0;
    setSkaterX(-160);
    setThermalEnergy(0);
    setIsPlaying(true);
  };

  const handleRecord = () => {
    const data = {
      type: 'Energy Conservation (Skate Park)',
      environment: GRAVITY_PRESETS[planet].name,
      gravity: `${currentG} m/s²`,
      skaterMass: `${skaterMass} kg`,
      skaterHeight: `${currentHeight.toFixed(2)} m`,
      velocity: `${velocity.toFixed(2)} m/s`,
      potentialEnergy: `${potentialEnergy.toFixed(0)} J`,
      kineticEnergy: `${kineticEnergy.toFixed(0)} J`,
      thermalEnergy: `${thermalEnergy.toFixed(0)} J`,
      totalEnergy: `${totalEnergy.toFixed(0)} J`,
      conclusion: 'Law of Conservation of Energy verified: E_total remains constant.'
    };

    onRecordObservation?.(data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Convert SVG coordinates
  // Canvas width 600, center at 300, ground baseline at y = 280
  const svgSkaterX = 300 + skaterX;
  const svgSkaterY = 270 - Math.pow(skaterX / 160, 2) * 140;

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                PhET Classic Physics
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                CBC Strand 4.1 · Conservation of Energy
              </span>
            </div>
            <h3 className="text-sm font-black text-white">
              Energy Skate Park: Basics &amp; Conservation of Energy
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => setIsSlowMotion(!isSlowMotion)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
              isSlowMotion ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Slow Motion"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Slow-Mo</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Reset Skater to Top of Ramp"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRecord}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-1"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Log Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggles & Options */}
      <div className="bg-slate-900/90 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showBarGraph}
              onChange={(e) => setShowBarGraph(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Energy Bar Graph</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showPieChart}
              onChange={(e) => setShowPieChart(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Pie Chart</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showSpeedometer}
              onChange={(e) => setShowSpeedometer(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Speedometer</span>
          </label>
        </div>

        {/* Planet Gravity Selector */}
        <div className="flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 font-bold mr-1">Gravity:</span>
          {(Object.keys(GRAVITY_PRESETS) as Array<keyof typeof GRAVITY_PRESETS>).map(pKey => (
            <button
              key={pKey}
              onClick={() => {
                setPlanet(pKey);
                handleReset();
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                planet === pKey ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {GRAVITY_PRESETS[pKey].name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Stage */}
      <div className="relative bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 h-[380px] overflow-hidden select-none">
        
        {/* Floating Energy Bar Graph (PhET Style) */}
        {showBarGraph && (
          <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-300 shadow-xl space-y-2 text-xs w-48">
            <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Energy Graph</span>
              <span className="font-mono text-[11px]">{totalEnergy.toFixed(0)} J</span>
            </div>

            <div className="flex items-end justify-between h-28 pt-2 px-1 gap-2">
              {/* Kinetic (Green) */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div 
                  className="w-full bg-emerald-500 rounded-t transition-all duration-75"
                  style={{ height: `${totalEnergy > 0 ? (kineticEnergy / totalEnergy) * 100 : 0}%` }}
                />
                <span className="text-[9px] font-bold text-slate-700 mt-1">Kin</span>
              </div>

              {/* Potential (Blue) */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div 
                  className="w-full bg-blue-600 rounded-t transition-all duration-75"
                  style={{ height: `${totalEnergy > 0 ? (potentialEnergy / totalEnergy) * 100 : 0}%` }}
                />
                <span className="text-[9px] font-bold text-slate-700 mt-1">Pot</span>
              </div>

              {/* Thermal (Red) */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div 
                  className="w-full bg-rose-500 rounded-t transition-all duration-75"
                  style={{ height: `${totalEnergy > 0 ? (thermalEnergy / totalEnergy) * 100 : 0}%` }}
                />
                <span className="text-[9px] font-bold text-slate-700 mt-1">Th</span>
              </div>

              {/* Total (Gold) */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div className="w-full bg-amber-500 rounded-t h-full" />
                <span className="text-[9px] font-bold text-slate-700 mt-1">Tot</span>
              </div>
            </div>
          </div>
        )}

        {/* Speedometer Gauge */}
        {showSpeedometer && (
          <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-300 shadow-md flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-700" />
            <div>
              <div className="text-[9px] font-bold uppercase text-slate-500">Speed</div>
              <div className="text-sm font-black font-mono text-slate-900">{velocity.toFixed(1)} m/s</div>
            </div>
          </div>
        )}

        {/* SVG Track & Skater Viewport */}
        <svg viewBox="0 0 600 380" className="w-full h-full">
          {/* Parabolic Skate Ramp U-Curve */}
          <path
            d="M 120 130 Q 300 320 480 130"
            fill="none"
            stroke="#92400e"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 120 130 Q 300 320 480 130"
            fill="none"
            stroke="#fde047"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Reference Ground Level Line */}
          <line x1="50" y1="285" x2="550" y2="285" stroke="#059669" strokeWidth="6" />

          {/* Skater Assembly */}
          <g transform={`translate(${svgSkaterX}, ${svgSkaterY})`}>
            {/* Pie Chart floating above skater */}
            {showPieChart && totalEnergy > 0 && (
              <g transform="translate(0, -50)">
                <circle r="14" fill="#3b82f6" />
                {/* Kinetic slice */}
                <path
                  d={`M 0 0 L 0 -14 A 14 14 0 ${kineticEnergy / totalEnergy > 0.5 ? 1 : 0} 1 ${14 * Math.sin((kineticEnergy / totalEnergy) * 2 * Math.PI)} ${-14 * Math.cos((kineticEnergy / totalEnergy) * 2 * Math.PI)} Z`}
                  fill="#10b981"
                />
                <circle r="14" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            )}

            {/* Skateboard */}
            <rect x="-18" y="0" width="36" height="5" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <circle cx="-12" cy="7" r="3" fill="#0f172a" />
            <circle cx="12" cy="7" r="3" fill="#0f172a" />

            {/* Skater Figure */}
            <circle cx="0" cy="-28" r="7" fill="#fcd34d" stroke="#b45309" strokeWidth="1" />
            <line x1="0" y1="-21" x2="0" y2="-6" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="-8" y2="0" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="8" y2="0" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
            <line x1="-12" y1="-14" x2="12" y2="-14" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-950 p-5 border-t border-slate-800 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Friction Slider */}
          <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Track Friction:</span>
              <span className="font-mono font-bold text-slate-200">
                {frictionCoeff === 0 ? 'None (Perpetual Conservation)' : frictionCoeff < 0.04 ? 'Low' : 'Lots (Thermal Loss)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.08"
              step="0.01"
              value={frictionCoeff}
              onChange={(e) => setFrictionCoeff(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>None</span>
              <span>Medium</span>
              <span>Lots</span>
            </div>
          </div>

          {/* Mass Slider */}
          <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Skater Mass:</span>
              <span className="font-mono font-black text-emerald-400">{skaterMass} kg</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={skaterMass}
              onChange={(e) => setSkaterMass(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>20 kg (Small)</span>
              <span>60 kg (Average)</span>
              <span>100 kg (Heavy)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
