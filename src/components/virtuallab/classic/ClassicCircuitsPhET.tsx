import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  AlertTriangle, 
  Save, 
  Check, 
  Flame, 
  HelpCircle,
  Eye,
  Maximize2
} from 'lucide-react';

interface ClassicCircuitsPhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const ClassicCircuitsPhET: React.FC<ClassicCircuitsPhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  // Circuit Parameters
  const [batteryVoltage, setBatteryVoltage] = useState<number>(9.0); // 0 to 30 Volts
  const [internalResistance, setInternalResistance] = useState<number>(0.5); // Ohms
  const [bulbResistance, setBulbResistance] = useState<number>(10.0); // Ohms
  const [resistorValue, setResistorValue] = useState<number>(10.0); // Ohms
  const [circuitType, setCircuitType] = useState<'series' | 'parallel'>('series');
  const [bulbCount, setBulbCount] = useState<number>(1); // 1 to 3
  const [includeResistor, setIncludeResistor] = useState<boolean>(true);
  const [switchClosed, setSwitchClosed] = useState<boolean>(true);
  const [showElectrons, setShowElectrons] = useState<boolean>(true);
  const [schematicView, setSchematicView] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Multimeter & Test Leads (Draggable Probes)
  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);
  const [redProbePos, setRedProbePos] = useState<{ x: number; y: number }>({ x: 120, y: 150 }); // Battery (+)
  const [blackProbePos, setBlackProbePos] = useState<{ x: number; y: number }>({ x: 120, y: 320 }); // Battery (-)
  const [activeDraggingProbe, setActiveDraggingProbe] = useState<'red' | 'black' | null>(null);

  // Animation Frame for Electron Flow
  const [electronOffset, setElectronOffset] = useState<number>(0);
  const stageRef = useRef<SVGSVGElement>(null);

  // Physics Calculations
  // Total load resistance
  let totalLoadR = 0;
  if (circuitType === 'series') {
    totalLoadR = (bulbResistance * bulbCount) + (includeResistor ? resistorValue : 0);
  } else {
    // Parallel bulbs + series resistor
    const parallelBulbsR = bulbResistance / bulbCount;
    totalLoadR = parallelBulbsR + (includeResistor ? resistorValue : 0);
  }

  const totalCircuitR = totalLoadR + internalResistance;
  const isShortCircuit = switchClosed && totalCircuitR < 0.8;
  const currentAmps = switchClosed && !isShortCircuit 
    ? Number((batteryVoltage / Math.max(0.01, totalCircuitR)).toFixed(2)) 
    : 0;
  
  const totalPowerWatts = Number((currentAmps * batteryVoltage).toFixed(2));
  const bulbPower = circuitType === 'series'
    ? Number((Math.pow(currentAmps, 2) * bulbResistance).toFixed(2))
    : Number((Math.pow(batteryVoltage - (includeResistor ? currentAmps * resistorValue : 0), 2) / bulbResistance).toFixed(2));
  
  const bulbBrightness = Math.min(1.5, Math.max(0, bulbPower / 10));

  // Determine Voltmeter Reading based on probe positions
  // Check probe proximity to circuit nodes
  const getNodeAt = (x: number, y: number): 'battery_pos' | 'battery_neg' | 'after_switch' | 'after_resistor' | 'bulb_top' | 'bulb_bot' | 'ground' => {
    if (x < 170 && y < 200) return 'battery_pos';
    if (x < 170 && y >= 250) return 'battery_neg';
    if (x >= 200 && x < 350 && y < 180) return 'after_switch';
    if (x >= 350 && x < 520 && y < 180) return 'after_resistor';
    if (x >= 500 && y < 240) return 'bulb_top';
    if (x >= 500 && y >= 240) return 'bulb_bot';
    return 'ground';
  };

  const getVoltageAtNode = (node: string): number => {
    if (!switchClosed) {
      if (node === 'battery_pos') return batteryVoltage;
      return 0;
    }
    if (isShortCircuit) return 0;
    
    switch (node) {
      case 'battery_pos': return batteryVoltage;
      case 'after_switch': return batteryVoltage;
      case 'after_resistor': return includeResistor ? batteryVoltage - (currentAmps * resistorValue) : batteryVoltage;
      case 'bulb_top': return includeResistor ? batteryVoltage - (currentAmps * resistorValue) : batteryVoltage;
      case 'bulb_bot': return 0;
      case 'battery_neg': return 0;
      default: return 0;
    }
  };

  const redVoltage = getVoltageAtNode(getNodeAt(redProbePos.x, redProbePos.y));
  const blackVoltage = getVoltageAtNode(getNodeAt(blackProbePos.x, blackProbePos.y));
  const measuredVoltageDiff = Number((redVoltage - blackVoltage).toFixed(2));

  // Animate electrons along circuit loop
  useEffect(() => {
    if (isPaused || !switchClosed || currentAmps === 0) return;
    const interval = setInterval(() => {
      setElectronOffset(prev => (prev + (currentAmps * 3)) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [isPaused, switchClosed, currentAmps]);

  // Handle probe dragging
  const handlePointerDown = (probe: 'red' | 'black', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDraggingProbe(probe);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggingProbe || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(680, e.clientX - rect.left));
    const y = Math.max(20, Math.min(380, e.clientY - rect.top));

    if (activeDraggingProbe === 'red') {
      setRedProbePos({ x, y });
    } else {
      setBlackProbePos({ x, y });
    }
  };

  const handlePointerUp = () => {
    setActiveDraggingProbe(null);
  };

  const handleRecord = () => {
    const observation = {
      experiment: "Ohm's Law & DC Circuits",
      circuitType,
      batteryVoltage: `${batteryVoltage} V`,
      loadResistance: `${totalLoadR.toFixed(1)} Ω`,
      current: `${currentAmps} A`,
      power: `${totalPowerWatts} W`,
      measuredVoltmeter: `${measuredVoltageDiff} V`,
      bulbBrightness: `${Math.round(bulbBrightness * 100)}%`,
      switchState: switchClosed ? 'Closed' : 'Open',
      timestamp: new Date().toLocaleTimeString()
    };
    onRecordObservation?.(observation);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setBatteryVoltage(9.0);
    setBulbResistance(10.0);
    setResistorValue(10.0);
    setBulbCount(1);
    setCircuitType('series');
    setIncludeResistor(true);
    setSwitchClosed(true);
    setRedProbePos({ x: 120, y: 150 });
    setBlackProbePos({ x: 120, y: 320 });
  };

  return (
    <div className={`bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* PhET Classic Top Ribbon */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                PhET Classic Engine
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                Ohm's Law: V = I × R
              </span>
            </div>
            <h3 className="text-sm font-black tracking-tight text-white mt-0.5">
              Circuit Construction Kit: DC Simulation
            </h3>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSchematicView(!schematicView)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              schematicView 
                ? 'bg-cyan-600 text-white border-cyan-400' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {schematicView ? 'Schematic Symbol' : 'Lifelike Apparatus'}
          </button>

          <button
            onClick={() => setShowElectrons(!showElectrons)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              showElectrons 
                ? 'bg-blue-600 text-white border-blue-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Electrons: {showElectrons ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowVoltmeter(!showVoltmeter)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              showVoltmeter 
                ? 'bg-emerald-600 text-white border-emerald-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Voltmeter
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRecord}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer ml-1"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Logged!' : 'Record Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (Canvas / SVG + Right Control Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1">
        
        {/* Left 8 Cols: Interactive Breadboard Canvas */}
        <div className="lg:col-span-8 p-4 bg-slate-950 relative flex flex-col justify-between select-none">
          {/* Grid Background */}
          <div 
            className="relative w-full h-[420px] rounded-2xl bg-[#0b1329] border border-slate-800/80 overflow-hidden shadow-inner cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Blueprint Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <svg 
              ref={stageRef}
              className="w-full h-full relative z-10" 
              viewBox="0 0 700 400"
            >
              <defs>
                {/* Glow Filter for Light Bulb Filament */}
                <filter id="bulb-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* Short Circuit Warning Pulse */}
                <filter id="fire-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="12" result="fireBlur"/>
                  <feMerge>
                    <feMergeNode in="fireBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* ============================================================== */}
              {/* CIRCUIT CONDUCTING WIRES */}
              {/* ============================================================== */}
              {/* Top Wire: Battery (+) to Switch */}
              <line x1="120" y1="160" x2="220" y2="160" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Switch to Resistor */}
              <line x1="290" y1="160" x2="380" y2="160" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Resistor to Bulb (or junction) */}
              <line x1="460" y1="160" x2="560" y2="160" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Right Vertical Drop to Bulb */}
              <line x1="560" y1="160" x2="560" y2="220" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Bulb bottom to Bottom Wire */}
              <line x1="560" y1="280" x2="560" y2="340" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Bottom Return Wire: Bulb to Battery (-) */}
              <line x1="560" y1="340" x2="120" y2="340" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              {/* Battery Left Vertical Wire */}
              <line x1="120" y1="340" x2="120" y2="280" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              <line x1="120" y1="160" x2="120" y2="180" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />

              {/* Parallel Branches if Parallel mode */}
              {circuitType === 'parallel' && bulbCount > 1 && (
                <>
                  <line x1="560" y1="160" x2="640" y2="160" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                  <line x1="640" y1="160" x2="640" y2="220" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                  <line x1="640" y1="280" x2="640" y2="340" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                  <line x1="640" y1="340" x2="560" y2="340" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                </>
              )}

              {/* ============================================================== */}
              {/* ANIMATED ELECTRON CHARGES (Moving Dots) */}
              {/* ============================================================== */}
              {showElectrons && switchClosed && currentAmps > 0 && !isShortCircuit && (
                <g opacity="0.9">
                  {/* Top Wire Electrons: Flowing from (-) to (+) conventionally or electron flow */}
                  {[0, 20, 40, 60, 80].map((step, idx) => {
                    const pos = (step + electronOffset) % 100;
                    return (
                      <g key={`el-top-${idx}`}>
                        <circle cx={120 + (pos * 4.4)} cy="160" r="4" fill="#38bdf8" />
                        <text x={120 + (pos * 4.4)} y="162" fontSize="6" fill="#0f172a" textAnchor="middle" fontWeight="black">-</text>
                      </g>
                    );
                  })}
                  {/* Right wire electrons */}
                  {[0, 30, 60].map((step, idx) => {
                    const pos = (step + electronOffset) % 100;
                    return (
                      <circle key={`el-rt-${idx}`} cx="560" cy={160 + (pos * 1.8)} r="4" fill="#38bdf8" />
                    );
                  })}
                  {/* Bottom return wire electrons */}
                  {[0, 20, 40, 60, 80].map((step, idx) => {
                    const pos = (step + electronOffset) % 100;
                    return (
                      <circle key={`el-bot-${idx}`} cx={560 - (pos * 4.4)} cy="340" r="4" fill="#38bdf8" />
                    );
                  })}
                </g>
              )}

              {/* ============================================================== */}
              {/* 1. BATTERY COMPONENT (Left Side) */}
              {/* ============================================================== */}
              <g transform="translate(90, 180)">
                {schematicView ? (
                  // Schematic Symbol
                  <g>
                    <line x1="30" y1="0" x2="30" y2="35" stroke="#f59e0b" strokeWidth="4" />
                    <line x1="10" y1="35" x2="50" y2="35" stroke="#38bdf8" strokeWidth="5" />
                    <line x1="20" y1="45" x2="40" y2="45" stroke="#ef4444" strokeWidth="3" />
                    <line x1="10" y1="55" x2="50" y2="55" stroke="#38bdf8" strokeWidth="5" />
                    <line x1="20" y1="65" x2="40" y2="65" stroke="#ef4444" strokeWidth="3" />
                    <line x1="30" y1="65" x2="30" y2="100" stroke="#f59e0b" strokeWidth="4" />
                    <text x="60" y="52" fill="#38bdf8" fontSize="12" fontWeight="bold">{batteryVoltage}V</text>
                  </g>
                ) : (
                  // Realistic Cell Pack
                  <g>
                    <rect x="10" y="10" width="40" height="80" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                    <rect x="22" y="2" width="16" height="8" rx="2" fill="#f59e0b" />
                    {/* Brass bands */}
                    <rect x="10" y="25" width="40" height="15" fill="#f59e0b" />
                    <rect x="10" y="65" width="40" height="15" fill="#0f172a" />
                    <text x="30" y="52" fill="#ffffff" fontSize="11" fontWeight="black" textAnchor="middle">{batteryVoltage}V</text>
                    <text x="30" y="20" fill="#22c55e" fontSize="12" fontWeight="black" textAnchor="middle">+</text>
                    <text x="30" y="88" fill="#ef4444" fontSize="14" fontWeight="black" textAnchor="middle">-</text>
                  </g>
                )}
                <text x="30" y="112" fill="#94a3b8" fontSize="10" textAnchor="middle">Battery Cell</text>
              </g>

              {/* ============================================================== */}
              {/* 2. KNIFE SWITCH (Top Left) */}
              {/* ============================================================== */}
              <g 
                transform="translate(220, 140)" 
                onClick={() => setSwitchClosed(!switchClosed)}
                className="cursor-pointer group/switch"
              >
                <circle cx="10" cy="20" r="6" fill="#38bdf8" />
                <circle cx="70" cy="20" r="6" fill="#38bdf8" />
                {/* Switch Knife Blade */}
                <line 
                  x1="10" 
                  y1="20" 
                  x2={switchClosed ? "68" : "55"} 
                  y2={switchClosed ? "20" : "-10"} 
                  stroke={switchClosed ? "#22c55e" : "#ef4444"} 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
                <text x="40" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Switch: {switchClosed ? 'CLOSED (ON)' : 'OPEN (OFF)'}
                </text>
              </g>

              {/* ============================================================== */}
              {/* 3. RESISTOR (Top Center) */}
              {/* ============================================================== */}
              {includeResistor && (
                <g transform="translate(380, 145)">
                  {schematicView ? (
                    // Zig-zag resistor schematic
                    <polyline 
                      points="0,15 15,15 25,0 35,30 45,0 55,30 65,15 80,15" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="4" 
                    />
                  ) : (
                    // Ceramic color-band resistor
                    <g>
                      <rect x="10" y="5" width="60" height="20" rx="10" fill="#d97706" stroke="#fcd34d" strokeWidth="2" />
                      {/* Color bands */}
                      <rect x="22" y="5" width="4" height="20" fill="#92400e" />
                      <rect x="32" y="5" width="4" height="20" fill="#000000" />
                      <rect x="42" y="5" width="4" height="20" fill="#b91c1c" />
                      <rect x="54" y="5" width="4" height="20" fill="#eab308" />
                    </g>
                  )}
                  <text x="40" y="38" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                    Resistor ({resistorValue}Ω)
                  </text>
                </g>
              )}

              {/* ============================================================== */}
              {/* 4. LIGHT BULB(S) (Right Side) */}
              {/* ============================================================== */}
              <g transform="translate(530, 215)">
                {/* Glow halos when bulb is lit */}
                {switchClosed && bulbBrightness > 0.05 && (
                  <circle 
                    cx="30" 
                    cy="35" 
                    r={35 * bulbBrightness} 
                    fill="#fef08a" 
                    opacity={Math.min(0.85, bulbBrightness * 0.7)}
                    filter="url(#bulb-glow)"
                  />
                )}
                
                {schematicView ? (
                  // Schematic bulb: circle with X
                  <g>
                    <circle cx="30" cy="35" r="20" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="16" y1="21" x2="44" y2="49" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="16" y1="49" x2="44" y2="21" stroke="#f59e0b" strokeWidth="3" />
                  </g>
                ) : (
                  // Realistic Edison glass bulb
                  <g>
                    {/* Glass dome */}
                    <circle 
                      cx="30" 
                      cy="30" 
                      r="22" 
                      fill={switchClosed && bulbBrightness > 0.05 ? "#fef08a" : "#334155"} 
                      stroke="#94a3b8" 
                      strokeWidth="2" 
                      opacity="0.9"
                    />
                    {/* Tungsten filament */}
                    <path 
                      d="M 22,35 L 26,20 L 30,28 L 34,20 L 38,35" 
                      fill="none" 
                      stroke={switchClosed && bulbBrightness > 0.05 ? "#ffffff" : "#64748b"} 
                      strokeWidth={switchClosed && bulbBrightness > 0.05 ? "3" : "1.5"} 
                    />
                    {/* Metallic threaded base */}
                    <rect x="22" y="50" width="16" height="15" rx="3" fill="#64748b" stroke="#475569" />
                  </g>
                )}

                <text x="30" y="80" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Bulb ({bulbPower}W)
                </text>
              </g>

              {/* Parallel second bulb if enabled */}
              {circuitType === 'parallel' && bulbCount > 1 && (
                <g transform="translate(610, 215)">
                  {switchClosed && bulbBrightness > 0.05 && (
                    <circle 
                      cx="30" 
                      cy="35" 
                      r={35 * bulbBrightness} 
                      fill="#fef08a" 
                      opacity={Math.min(0.85, bulbBrightness * 0.7)}
                      filter="url(#bulb-glow)"
                    />
                  )}
                  <circle cx="30" cy="30" r="22" fill={switchClosed && bulbBrightness > 0.05 ? "#fef08a" : "#334155"} stroke="#94a3b8" strokeWidth="2" />
                  <path d="M 22,35 L 26,20 L 30,28 L 34,20 L 38,35" fill="none" stroke={switchClosed && bulbBrightness > 0.05 ? "#ffffff" : "#64748b"} strokeWidth="2" />
                  <rect x="22" y="50" width="16" height="15" rx="3" fill="#64748b" />
                  <text x="30" y="80" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">Bulb 2</text>
                </g>
              )}

              {/* ============================================================== */}
              {/* SHORT CIRCUIT WARNING OVERLAY */}
              {/* ============================================================== */}
              {isShortCircuit && (
                <g transform="translate(120, 200)" filter="url(#fire-glow)">
                  <circle cx="0" cy="0" r="30" fill="#dc2626" opacity="0.8" />
                  <text x="0" y="5" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">FIRE!</text>
                  <text x="120" y="10" fill="#f87171" fontSize="11" fontWeight="bold">
                    ⚠️ Short Circuit! Resistance too low (R &lt; 0.8Ω). Add load to prevent thermal hazard.
                  </text>
                </g>
              )}

              {/* ============================================================== */}
              {/* DRAGGABLE VOLTMETER MULTIMETER & TEST PROBES */}
              {/* ============================================================== */}
              {showVoltmeter && (
                <g>
                  {/* Digital Voltmeter Main Body (Centered Top Left) */}
                  <g transform="translate(20, 20)">
                    <rect x="0" y="0" width="140" height="90" rx="12" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.5))" />
                    <rect x="12" y="12" width="116" height="42" rx="6" fill="#064e3b" stroke="#047857" />
                    
                    {/* LCD Digits */}
                    <text x="70" y="42" fill="#34d399" fontSize="22" fontFamily="monospace" fontWeight="900" textAnchor="middle">
                      {measuredVoltageDiff >= 0 ? `+${measuredVoltageDiff.toFixed(2)}` : measuredVoltageDiff.toFixed(2)}
                    </text>
                    <text x="115" y="42" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="bold">V</text>

                    {/* Jack sockets */}
                    <circle cx="35" cy="72" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="35" y="75" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">V+</text>
                    
                    <circle cx="105" cy="72" r="6" fill="#000000" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="105" y="75" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">COM</text>

                    <text x="70" y="82" fill="#94a3b8" fontSize="8" textAnchor="middle">DC VOLTMETER</text>
                  </g>

                  {/* Flexible Lead Wires from Voltmeter to Probes */}
                  {/* Red Positive Lead */}
                  <path 
                    d={`M 55,92 Q ${(55 + redProbePos.x)/2 - 30},${(92 + redProbePos.y)/2 + 40} ${redProbePos.x},${redProbePos.y}`} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  {/* Black Negative Lead */}
                  <path 
                    d={`M 125,92 Q ${(125 + blackProbePos.x)/2 + 40},${(92 + blackProbePos.y)/2 + 30} ${blackProbePos.x},${blackProbePos.y}`} 
                    fill="none" 
                    stroke="#1e293b" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    opacity="0.9"
                  />

                  {/* RED PROBE HANDLE (Draggable) */}
                  <g 
                    transform={`translate(${redProbePos.x}, ${redProbePos.y})`}
                    onPointerDown={(e) => handlePointerDown('red', e)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {/* Metal needle tip */}
                    <line x1="0" y1="0" x2="0" y2="-12" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Plastic insulated grip */}
                    <rect x="-6" y="0" width="12" height="30" rx="3" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                    <text x="0" y="18" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">+</text>
                    <circle cx="0" cy="0" r="8" fill="transparent" />
                  </g>

                  {/* BLACK PROBE HANDLE (Draggable) */}
                  <g 
                    transform={`translate(${blackProbePos.x}, ${blackProbePos.y})`}
                    onPointerDown={(e) => handlePointerDown('black', e)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {/* Metal needle tip */}
                    <line x1="0" y1="0" x2="0" y2="-12" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Plastic insulated grip */}
                    <rect x="-6" y="0" width="12" height="30" rx="3" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
                    <text x="0" y="18" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">-</text>
                    <circle cx="0" cy="0" r="8" fill="transparent" />
                  </g>
                </g>
              )}
            </svg>

            {/* Instruction tooltip badge */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Tip: Drag the <strong>Red (+)</strong> and <strong>Black (-)</strong> multimeter probes to measure potential differences across any terminal!</span>
            </div>
          </div>

          {/* Quick Metrics Ticker along bottom of stage */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Electric Current (I)</span>
              <span className="text-base font-black text-amber-400 font-mono">{currentAmps} A</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Applied Voltage (V)</span>
              <span className="text-base font-black text-cyan-400 font-mono">{batteryVoltage.toFixed(1)} V</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Resistance (R)</span>
              <span className="text-base font-black text-emerald-400 font-mono">{totalCircuitR.toFixed(1)} Ω</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Power (P = VI)</span>
              <span className="text-base font-black text-purple-400 font-mono">{totalPowerWatts} W</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Classic PhET Control Panel */}
        <div className="lg:col-span-4 p-5 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Circuit Parameters</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">JSS Lab Kit</span>
          </div>

          {/* 1. Battery Voltage Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300">Battery Voltage (V):</label>
              <span className="font-mono font-black text-amber-400 text-sm">{batteryVoltage.toFixed(1)} V</span>
            </div>
            <input 
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0V</span>
              <span>9V (D-Cell Pack)</span>
              <span>30V</span>
            </div>
          </div>

          {/* 2. Load Resistor Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300">Resistor Value (Ω):</label>
              <span className="font-mono font-black text-cyan-400 text-sm">{resistorValue.toFixed(1)} Ω</span>
            </div>
            <input 
              type="range"
              min="1"
              max="50"
              step="1"
              value={resistorValue}
              onChange={(e) => setResistorValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="checkbox"
                id="inc-res"
                checked={includeResistor}
                onChange={(e) => setIncludeResistor(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-400 rounded"
              />
              <label htmlFor="inc-res" className="text-xs text-slate-300 cursor-pointer">
                Include Resistor in circuit
              </label>
            </div>
          </div>

          {/* 3. Bulb Resistance & Count */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300">Bulb Count & Arrangement:</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCircuitType('series')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  circuitType === 'series'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Series
              </button>
              <button
                type="button"
                onClick={() => setCircuitType('parallel')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  circuitType === 'parallel'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Parallel
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Bulb Quantity:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBulbCount(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                      bulbCount === num 
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Knife Switch Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setSwitchClosed(!switchClosed)}
              className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                switchClosed 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{switchClosed ? 'Open Knife Switch (Break Circuit)' : 'Close Knife Switch (Complete Circuit)'}</span>
            </button>
          </div>

          {/* Guided Inquiry Observation Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>CBC Observation Question:</span>
            </span>
            <p className="text-slate-300 leading-relaxed">
              Vary the voltage from <strong>1.5V up to 15.0V</strong> and log the corresponding current (A). Plotting V versus I gives a straight line with slope equal to Resistance (R).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
