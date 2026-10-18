import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Gauge, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Check, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Sparkles,
  Users,
  Box
} from 'lucide-react';

interface ClassicForcesMotionPhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const ClassicForcesMotionPhET: React.FC<ClassicForcesMotionPhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  // Tab / Mode: 'net_force' (Tug-of-war) or 'motion_friction' (Crates & Friction)
  const [activeTab, setActiveTab] = useState<'net_force' | 'motion_friction'>('net_force');

  // ==========================================
  // MODE 1: TUG-OF-WAR (NET FORCE)
  // ==========================================
  const [bluePullers, setBluePullers] = useState<{ id: string; size: 'small' | 'medium' | 'large'; force: number }[]>([
    { id: 'b1', size: 'large', force: 150 }
  ]);
  const [redPullers, setRedPullers] = useState<{ id: string; size: 'small' | 'medium' | 'large'; force: number }[]>([
    { id: 'r1', size: 'medium', force: 100 }
  ]);
  const [cartPosition, setCartPosition] = useState<number>(0); // -250 (Blue wins) to +250 (Red wins)
  const [isTugRunning, setIsTugRunning] = useState<boolean>(false);
  const [tugWinner, setTugWinner] = useState<'blue' | 'red' | null>(null);

  // ==========================================
  // MODE 2: MOTION & FRICTION
  // ==========================================
  const [massObject, setMassObject] = useState<'crate' | 'fridge' | 'learner' | 'gift'>('crate');
  const [appliedForce, setAppliedForce] = useState<number>(100); // -500 to +500 N
  const [frictionLevel, setFrictionLevel] = useState<number>(0.2); // 0 (None) to 0.5 (Lots)
  const [velocity, setVelocity] = useState<number>(0); // m/s
  const [positionX, setPositionX] = useState<number>(0);
  const [isMotionRunning, setIsMotionRunning] = useState<boolean>(true);

  // Checkboxes / Toggles
  const [showSumOfForces, setShowSumOfForces] = useState<boolean>(true);
  const [showValues, setShowValues] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Object Masses
  const OBJECT_MASSES = {
    crate: { name: 'Wooden Crate', mass: 50, color: '#b45309' },
    fridge: { name: 'Refrigerator', mass: 100, color: '#64748b' },
    learner: { name: 'School Learner', mass: 40, color: '#059669' },
    gift: { name: 'Mystery Gift Box', mass: 20, color: '#dc2626' }
  };

  const currentMass = OBJECT_MASSES[massObject].mass;

  // Physics for Tug of War
  const totalBlueForce = bluePullers.reduce((acc, p) => acc + p.force, 0);
  const totalRedForce = redPullers.reduce((acc, p) => acc + p.force, 0);
  const netTugForce = totalRedForce - totalBlueForce; // positive = to right (Red)

  // Physics for Friction & Motion
  // Normal force N = m * g (g = 9.8)
  const normalForce = currentMass * 9.8;
  const maxStaticFriction = frictionLevel * normalForce;
  let frictionForce = 0;

  if (Math.abs(velocity) < 0.05) {
    if (Math.abs(appliedForce) <= maxStaticFriction) {
      frictionForce = -appliedForce;
    } else {
      frictionForce = appliedForce > 0 ? -maxStaticFriction : maxStaticFriction;
    }
  } else {
    // Kinetic friction opposes motion direction
    const kineticFriction = 0.85 * maxStaticFriction;
    frictionForce = velocity > 0 ? -kineticFriction : kineticFriction;
  }

  const netMotionForce = appliedForce + frictionForce;
  const acceleration = Number((netMotionForce / currentMass).toFixed(2));

  // Animation Loop for Tug of War & Motion
  useEffect(() => {
    let animId: number;

    const tick = () => {
      // 1. Tug of war animation
      if (isTugRunning && !tugWinner) {
        setCartPosition(prev => {
          const next = prev + (netTugForce * 0.04);
          if (next <= -200) {
            setTugWinner('blue');
            setIsTugRunning(false);
            return -200;
          }
          if (next >= 200) {
            setTugWinner('red');
            setIsTugRunning(false);
            return 200;
          }
          return next;
        });
      }

      // 2. Motion animation
      if (isMotionRunning && activeTab === 'motion_friction') {
        setVelocity(prevV => {
          let newV = prevV + (acceleration * 0.03);
          // Friction stopping condition when appliedForce is zero
          if (appliedForce === 0 && Math.abs(prevV) > 0) {
            if ((prevV > 0 && newV <= 0) || (prevV < 0 && newV >= 0)) {
              newV = 0;
            }
          }
          // Cap velocity
          return Math.max(-40, Math.min(40, Number(newV.toFixed(2))));
        });

        setPositionX(prevX => {
          return (prevX + velocity * 0.5) % 600;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isTugRunning, tugWinner, netTugForce, isMotionRunning, activeTab, acceleration, appliedForce, velocity]);

  const handleResetTug = () => {
    setCartPosition(0);
    setIsTugRunning(false);
    setTugWinner(null);
  };

  const handleResetMotion = () => {
    setVelocity(0);
    setPositionX(0);
    setAppliedForce(0);
  };

  const handleRecord = () => {
    const data = activeTab === 'net_force'
      ? {
          type: 'Tug-of-War Net Force',
          blueForce: `${totalBlueForce} N (Left)`,
          redForce: `${totalRedForce} N (Right)`,
          netForce: `${Math.abs(netTugForce)} N (${netTugForce >= 0 ? 'Right' : 'Left'})`,
          winner: tugWinner || 'Equilibrium / In Motion'
        }
      : {
          type: 'Forces & Friction',
          object: OBJECT_MASSES[massObject].name,
          mass: `${currentMass} kg`,
          appliedForce: `${appliedForce} N`,
          frictionForce: `${frictionForce.toFixed(1)} N`,
          netForce: `${netMotionForce.toFixed(1)} N`,
          acceleration: `${acceleration} m/s²`,
          speed: `${Math.abs(velocity).toFixed(1)} m/s`
        };

    onRecordObservation?.(data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* Top Header / Mode Switcher */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600/30 border border-orange-500/40 text-orange-400 flex items-center justify-center font-black">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-950 text-orange-400 border border-orange-800 px-2 py-0.5 rounded-full">
                PhET Classic Physics
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                CBC Strand 3.1 · Newton&apos;s Laws
              </span>
            </div>
            <h3 className="text-sm font-black text-white">
              Forces &amp; Motion: Basics (Tug-of-War &amp; Friction)
            </h3>
          </div>
        </div>

        {/* Tab switcher: Net Force vs Friction */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('net_force')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'net_force'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Net Force (Tug-of-War)</span>
          </button>
          <button
            onClick={() => setActiveTab('motion_friction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'motion_friction'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Friction &amp; Acceleration</span>
          </button>
        </div>

        {/* Save to Notebook Button */}
        <button
          onClick={handleRecord}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>Saved to Notebook!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Log Data</span>
            </>
          )}
        </button>
      </div>

      {/* Control Checkboxes & Instruments Bar */}
      <div className="bg-slate-900/90 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showSumOfForces}
              onChange={(e) => setShowSumOfForces(e.target.checked)}
              className="rounded accent-orange-500"
            />
            <span>Sum of Forces (ΣF)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showValues}
              onChange={(e) => setShowValues(e.target.checked)}
              className="rounded accent-orange-500"
            />
            <span>Values (Numbers)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showSpeedometer}
              onChange={(e) => setShowSpeedometer(e.target.checked)}
              className="rounded accent-orange-500"
            />
            <span>Speedometer</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'net_force' ? (
            <button
              onClick={handleResetTug}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Return Cart</span>
            </button>
          ) : (
            <button
              onClick={handleResetMotion}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Stop &amp; Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 p-6 h-96 flex flex-col justify-between overflow-hidden select-none">
        
        {/* Sky / Top HUD with Vector Arrows & Speedometer */}
        <div className="relative z-10 flex items-start justify-between">
          {/* Vector Arrows Display */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-3 border border-slate-300/80 shadow-md space-y-1.5 text-xs">
            {activeTab === 'net_force' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-bold text-blue-700">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Left Force:</span>
                    {showValues && <span className="font-mono">{totalBlueForce} N</span>}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-red-700">
                    <span>Right Force:</span>
                    <ArrowRight className="w-4 h-4" />
                    {showValues && <span className="font-mono">{totalRedForce} N</span>}
                  </div>
                </div>
                {showSumOfForces && (
                  <div className="pt-1 border-t border-slate-200 flex items-center gap-2 font-black text-slate-900">
                    <span>Sum of Forces (ΣF):</span>
                    <span className="font-mono text-orange-600">
                      {Math.abs(netTugForce)} N {netTugForce > 0 ? '→ (Right)' : netTugForce < 0 ? '← (Left)' : '(Equilibrium)'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <span>Applied:</span>
                    {showValues && <span className="font-mono">{appliedForce} N</span>}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-rose-700">
                    <span>Friction:</span>
                    {showValues && <span className="font-mono">{Math.abs(frictionForce).toFixed(1)} N</span>}
                  </div>
                </div>
                {showSumOfForces && (
                  <div className="pt-1 border-t border-slate-200 flex items-center gap-2 font-black text-slate-900">
                    <span>Net Force:</span>
                    <span className="font-mono text-orange-600">
                      {netMotionForce.toFixed(1)} N | a = {acceleration} m/s²
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Speedometer Gauge */}
          {showSpeedometer && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-300 shadow-md flex items-center gap-3">
              <div className="relative w-16 h-10 flex items-end justify-center">
                <svg viewBox="0 0 100 60" className="w-16 h-10">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" 
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (Math.min(40, Math.abs(activeTab === 'net_force' ? cartPosition / 5 : velocity)) / 40) * 125.6}
                  />
                  {/* Gauge Needle */}
                  <line 
                    x1="50" y1="50" 
                    x2={50 + 32 * Math.cos(Math.PI - ((Math.min(40, Math.abs(activeTab === 'net_force' ? cartPosition / 5 : velocity)) / 40) * Math.PI))} 
                    y2={50 - 32 * Math.sin(Math.PI - ((Math.min(40, Math.abs(activeTab === 'net_force' ? cartPosition / 5 : velocity)) / 40) * Math.PI))}
                    stroke="#0f172a" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="50" r="4" fill="#0f172a" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Speed</div>
                <div className="text-base font-black font-mono text-slate-900">
                  {Math.abs(activeTab === 'net_force' ? Number((netTugForce * 0.05).toFixed(1)) : velocity)} m/s
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAB 1 STAGE: TUG OF WAR CART & PULLERS */}
        {/* ============================================================== */}
        {activeTab === 'net_force' && (
          <div className="relative z-0 h-44 flex items-end justify-center">
            {/* Center Finish Line Marker */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1 h-32 border-l-2 border-dashed border-red-500/60 z-0">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-red-600 bg-white/80 px-1 rounded">
                Center
              </span>
            </div>

            {/* Moving Tug Assembly */}
            <div 
              className="relative transition-transform duration-75 flex items-center"
              style={{ transform: `translateX(${cartPosition}px)` }}
            >
              {/* Blue Team Pullers (Left) */}
              <div className="flex items-end gap-1 mr-2">
                {bluePullers.map((p, idx) => (
                  <div key={p.id} className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-blue-900 bg-blue-100 px-1 rounded mb-0.5">{p.force}N</span>
                    <div 
                      className={`bg-blue-600 rounded-t-xl border border-blue-700 shadow-sm transition-all ${
                        p.size === 'large' ? 'w-8 h-20' : p.size === 'medium' ? 'w-6 h-16' : 'w-5 h-12'
                      }`}
                    >
                      <div className="w-full h-4 bg-amber-200 rounded-full mx-auto -mt-3 border border-amber-300" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rope */}
              <div className="w-12 h-2 bg-amber-800 rounded-full shadow-inner" />

              {/* The Heavy Cart with Wheels */}
              <div className="relative bg-amber-700 w-24 h-16 rounded-xl border-2 border-amber-900 shadow-lg flex flex-col items-center justify-between p-2">
                <div className="w-full text-center text-[10px] font-black text-amber-100 uppercase tracking-wider">
                  Cart (100kg)
                </div>
                <div className="w-3 h-6 bg-red-600 rounded-xs mx-auto animate-pulse" title="Center marker" />
                {/* Wheels */}
                <div className="absolute -bottom-3 left-2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                </div>
                <div className="absolute -bottom-3 right-2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                </div>
              </div>

              {/* Rope */}
              <div className="w-12 h-2 bg-amber-800 rounded-full shadow-inner" />

              {/* Red Team Pullers (Right) */}
              <div className="flex items-end gap-1 ml-2">
                {redPullers.map((p, idx) => (
                  <div key={p.id} className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-red-900 bg-red-100 px-1 rounded mb-0.5">{p.force}N</span>
                    <div 
                      className={`bg-red-600 rounded-t-xl border border-red-700 shadow-sm transition-all ${
                        p.size === 'large' ? 'w-8 h-20' : p.size === 'medium' ? 'w-6 h-16' : 'w-5 h-12'
                      }`}
                    >
                      <div className="w-full h-4 bg-amber-200 rounded-full mx-auto -mt-3 border border-amber-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Victory Banner */}
            {tugWinner && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-6 py-2 rounded-2xl shadow-2xl border-2 border-amber-400 animate-bounce text-center z-20">
                <div className="text-xs font-black uppercase text-amber-400">Winner!</div>
                <div className="text-sm font-extrabold capitalize text-white">
                  {tugWinner === 'blue' ? 'Blue Team Wins (Net Left Force)' : 'Red Team Wins (Net Right Force)'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2 STAGE: MOTION, CRATES & SURFACE FRICTION */}
        {/* ============================================================== */}
        {activeTab === 'motion_friction' && (
          <div className="relative z-0 h-44 flex items-end justify-center">
            {/* Object on Track */}
            <div className="relative flex flex-col items-center">
              {/* Force vector arrows over object */}
              {showSumOfForces && appliedForce !== 0 && (
                <div className="absolute -top-10 flex items-center justify-center">
                  {appliedForce > 0 ? (
                    <div className="flex items-center text-emerald-800 font-extrabold text-xs">
                      <div className="h-2 bg-emerald-600 rounded-l" style={{ width: `${Math.min(120, Math.abs(appliedForce) / 3)}px` }} />
                      <ArrowRight className="w-5 h-5 -ml-2 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="flex items-center text-emerald-800 font-extrabold text-xs">
                      <ArrowLeft className="w-5 h-5 -mr-2 text-emerald-600" />
                      <div className="h-2 bg-emerald-600 rounded-r" style={{ width: `${Math.min(120, Math.abs(appliedForce) / 3)}px` }} />
                    </div>
                  )}
                </div>
              )}

              {/* Mass Block */}
              <div 
                className="rounded-2xl border-2 border-slate-900 shadow-xl p-3 flex flex-col items-center justify-center transition-all"
                style={{ 
                  backgroundColor: OBJECT_MASSES[massObject].color,
                  width: massObject === 'fridge' ? '100px' : '80px',
                  height: massObject === 'fridge' ? '120px' : '75px'
                }}
              >
                <div className="text-white font-black text-center text-xs drop-shadow-sm">
                  {OBJECT_MASSES[massObject].name}
                </div>
                <div className="text-white/90 font-mono font-bold text-[11px]">
                  {currentMass} kg
                </div>
              </div>

              {/* Wheels / Skids */}
              <div className="w-full flex justify-between px-2 -mt-1">
                <div className="w-4 h-2 bg-slate-900 rounded-b" />
                <div className="w-4 h-2 bg-slate-900 rounded-b" />
              </div>
            </div>
          </div>
        )}

        {/* Ground Surface (Grass & Track) */}
        <div className="relative z-10 w-full h-8 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 border-t-4 border-amber-800 flex items-center justify-center">
          <div className="text-[10px] font-mono text-emerald-200/60 font-bold uppercase tracking-widest">
            {activeTab === 'motion_friction' ? `Surface Friction Coefficient μ = ${frictionLevel.toFixed(2)}` : 'Frictionless Track'}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Dashboard & Controls */}
      <div className="bg-slate-950 p-5 border-t border-slate-800 text-white space-y-4">
        {activeTab === 'net_force' ? (
          /* Tug of War Controls */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Blue Pullers Configuration */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-blue-900/50 space-y-2">
              <div className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center justify-between">
                <span>Blue Team Pullers</span>
                <span className="font-mono text-white">{totalBlueForce} N</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '+50N', size: 'small', force: 50 },
                  { label: '+100N', size: 'medium', force: 100 },
                  { label: '+150N', size: 'large', force: 150 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (bluePullers.length < 4) {
                        setBluePullers([...bluePullers, { id: 'b' + Date.now(), size: item.size as any, force: item.force }]);
                      }
                    }}
                    className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {bluePullers.length > 0 && (
                <button
                  onClick={() => setBluePullers(bluePullers.slice(0, -1))}
                  className="w-full text-center text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer pt-1"
                >
                  Remove Last Puller
                </button>
              )}
            </div>

            {/* Go / Pause / Return Master Switch */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsTugRunning(!isTugRunning)}
                className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isTugRunning 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTugRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isTugRunning ? 'Pause Tug-of-War' : 'Go! Start Tug-of-War'}</span>
              </button>
              <span className="text-[11px] text-slate-400">
                {netTugForce === 0 ? 'Balanced Forces (0 N Net)' : `Unbalanced Forces (${Math.abs(netTugForce)} N Net)`}
              </span>
            </div>

            {/* Red Pullers Configuration */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-red-900/50 space-y-2">
              <div className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center justify-between">
                <span>Red Team Pullers</span>
                <span className="font-mono text-white">{totalRedForce} N</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '+50N', size: 'small', force: 50 },
                  { label: '+100N', size: 'medium', force: 100 },
                  { label: '+150N', size: 'large', force: 150 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (redPullers.length < 4) {
                        setRedPullers([...redPullers, { id: 'r' + Date.now(), size: item.size as any, force: item.force }]);
                      }
                    }}
                    className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {redPullers.length > 0 && (
                <button
                  onClick={() => setRedPullers(redPullers.slice(0, -1))}
                  className="w-full text-center text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer pt-1"
                >
                  Remove Last Puller
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Motion & Friction Controls */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mass Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Select Object to Push:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['crate', 'fridge', 'learner', 'gift'] as const).map(objKey => (
                  <button
                    key={objKey}
                    onClick={() => setMassObject(objKey)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      massObject === objKey
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{OBJECT_MASSES[objKey].name}</span>
                    <span className="font-mono text-[10px] opacity-80">{OBJECT_MASSES[objKey].mass}kg</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Applied Force Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">2. Applied Force:</span>
                <span className="font-mono font-black text-orange-400">{appliedForce} N</span>
              </div>
              <input
                type="range"
                min="-500"
                max="500"
                step="25"
                value={appliedForce}
                onChange={(e) => setAppliedForce(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => setAppliedForce(Math.max(-500, appliedForce - 50))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                >
                  -50N
                </button>
                <button
                  onClick={() => setAppliedForce(0)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[10px] font-bold cursor-pointer"
                >
                  0N (Release)
                </button>
                <button
                  onClick={() => setAppliedForce(Math.min(500, appliedForce + 50))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                >
                  +50N
                </button>
              </div>
            </div>

            {/* Friction Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">3. Surface Friction:</span>
                <span className="font-mono font-bold text-slate-300">
                  {frictionLevel === 0 ? 'None (Ice)' : frictionLevel < 0.25 ? 'Medium' : 'Lots (Rough)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={frictionLevel}
                onChange={(e) => setFrictionLevel(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>None (Ice)</span>
                <span>Normal Asphalt</span>
                <span>Lots</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
