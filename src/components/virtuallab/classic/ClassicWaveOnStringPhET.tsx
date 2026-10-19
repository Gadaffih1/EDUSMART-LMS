import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Gauge, 
  Save, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Activity, 
  FastForward, 
  Clock, 
  Maximize2,
  ChevronRight,
  Move
} from 'lucide-react';

interface ClassicWaveOnStringPhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

export const ClassicWaveOnStringPhET: React.FC<ClassicWaveOnStringPhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  // Mode: Manual (Wiggle), Oscillate (Continuous Driver), or Pulse (Single wave packet)
  const [driverMode, setDriverMode] = useState<'oscillate' | 'pulse' | 'manual'>('oscillate');
  
  // End boundary condition: Fixed End (clamp), Loose End (ring on rod), or No End (window)
  const [endCondition, setEndCondition] = useState<'fixed' | 'loose' | 'no_end'>('fixed');

  // Wave physical parameters
  const [amplitude, setAmplitude] = useState<number>(0.75); // cm (0.00 to 1.25)
  const [frequency, setFrequency] = useState<number>(1.50); // Hz (0.10 to 3.00)
  const [damping, setDamping] = useState<number>(0.00); // 0 (None) to 0.05 (Lots)
  const [tensionLevel, setTensionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Playback & Speed
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<'normal' | 'slow'>('normal');

  // Measurement tools
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showStopwatch, setShowStopwatch] = useState<boolean>(false);
  const [showReferenceLine, setShowReferenceLine] = useState<boolean>(true);
  const [referenceLineY, setReferenceLineY] = useState<number>(75); // pixels above center
  
  // Draggable tool positions
  const [rulerPos, setRulerPos] = useState<{ x: number; y: number }>({ x: 80, y: 220 });
  const [isDraggingRuler, setIsDraggingRuler] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Digital Stopwatch
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  // Manual Driver Drag Y
  const [manualHandleY, setManualHandleY] = useState<number>(0);

  // Classroom Discussion & Pedagogy
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Canvas / SVG Animation Ref
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Tension to Wave Speed Mapping (v = sqrt(T/mu))
  const tensionConfigs = {
    low: { name: 'Low Tension (1.0 N)', tensionN: 1.0, speedCmS: 2.5, speedMultiplier: 1.0 },
    medium: { name: 'Medium Tension (4.0 N)', tensionN: 4.0, speedCmS: 5.0, speedMultiplier: 2.0 },
    high: { name: 'High Tension (9.0 N)', tensionN: 9.0, speedCmS: 8.0, speedMultiplier: 3.2 }
  };

  const currentTension = tensionConfigs[tensionLevel];
  const waveSpeed = currentTension.speedCmS; // cm/s
  const wavelength = frequency > 0 ? Number((waveSpeed / frequency).toFixed(2)) : 0; // cm
  const wavePeriod = frequency > 0 ? Number((1 / frequency).toFixed(2)) : 0; // s

  // Number of string beads
  const NUM_BEADS = 54;
  const STRING_WIDTH_PX = 540;
  const beadSpacingPx = STRING_WIDTH_PX / (NUM_BEADS - 1);

  // Array storing displacement y for all beads
  const [beadPositions, setBeadPositions] = useState<number[]>(new Array(NUM_BEADS).fill(0));

  // Pulse trigger counter
  const pulseStartTimeRef = useRef<number | null>(null);

  const triggerPulse = () => {
    pulseStartTimeRef.current = timeRef.current;
  };

  // Stopwatch timer interval
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => Number((prev + 0.05).toFixed(2)));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Main Wave Simulation Physics Loop
  useEffect(() => {
    let lastTimestamp: number | null = null;

    const updatePhysics = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const rawDelta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isRunning) {
        const timeScale = simSpeed === 'slow' ? 0.25 : 1.0;
        const dt = Math.min(rawDelta, 0.05) * timeScale;
        timeRef.current += dt;
        const t = timeRef.current;

        // Wave propagation calculation
        const k = (2 * Math.PI) / (wavelength || 1); // wave number (rad/cm)
        const omega = 2 * Math.PI * frequency; // angular frequency (rad/s)
        const v = waveSpeed; // cm/s
        const pixelScale = 50; // pixels per cm of amplitude

        const newY: number[] = [];

        for (let i = 0; i < NUM_BEADS; i++) {
          const xCm = (i / (NUM_BEADS - 1)) * 10.0; // string length 10.0 cm
          const xPx = i * beadSpacingPx;

          // Damping factor: e^(-gamma * x)
          const dampingFactor = Math.exp(-damping * xCm * 3.0);

          let yDisplacementCm = 0;

          if (driverMode === 'oscillate') {
            const timeDelay = xCm / v;
            if (t >= timeDelay) {
              const forwardWave = amplitude * Math.sin(omega * (t - timeDelay));
              
              let reflectedWave = 0;
              if (endCondition === 'fixed') {
                // Fixed End: Inverted reflection (180 deg phase shift, crest -> trough)
                const totalDist = 20.0 - xCm; // reflected travel distance
                const reflectDelay = totalDist / v;
                if (t >= reflectDelay) {
                  reflectedWave = -amplitude * Math.sin(omega * (t - reflectDelay)) * Math.exp(-damping * totalDist * 1.5);
                }
              } else if (endCondition === 'loose') {
                // Loose End: In-phase reflection (crest -> crest, doubles at boundary)
                const totalDist = 20.0 - xCm;
                const reflectDelay = totalDist / v;
                if (t >= reflectDelay) {
                  reflectedWave = amplitude * Math.sin(omega * (t - reflectDelay)) * Math.exp(-damping * totalDist * 1.5);
                }
              }

              yDisplacementCm = (forwardWave + reflectedWave) * dampingFactor;
            } else {
              yDisplacementCm = 0;
            }
          } else if (driverMode === 'pulse') {
            if (pulseStartTimeRef.current !== null) {
              const pulseElapsed = t - pulseStartTimeRef.current;
              const pulseDuration = 1.0 / (frequency || 1); // 1 period width
              const pulsePosCm = pulseElapsed * v;

              // Gaussian / bell pulse envelope
              const distFromPulseCenter = xCm - pulsePosCm;
              const pulseWidthCm = v * pulseDuration * 0.45;
              const forwardPulse = amplitude * Math.exp(-Math.pow(distFromPulseCenter / pulseWidthCm, 2));

              let reflectedPulse = 0;
              if (endCondition === 'fixed') {
                const reflectedCenter = 20.0 - pulsePosCm;
                const distReflect = xCm - reflectedCenter;
                reflectedPulse = -amplitude * Math.exp(-Math.pow(distReflect / pulseWidthCm, 2));
              } else if (endCondition === 'loose') {
                const reflectedCenter = 20.0 - pulsePosCm;
                const distReflect = xCm - reflectedCenter;
                reflectedPulse = amplitude * Math.exp(-Math.pow(distReflect / pulseWidthCm, 2));
              }

              yDisplacementCm = (forwardPulse + reflectedPulse) * dampingFactor;
            }
          } else if (driverMode === 'manual') {
            // Manual Wiggle Mode
            const manualAmpCm = manualHandleY / pixelScale;
            const timeDelay = xCm / v;
            const decay = Math.exp(-xCm * 0.4);
            yDisplacementCm = manualAmpCm * Math.cos(k * xCm - omega * t * 0.5) * decay;
          }

          // Bound condition clamp
          if (i === NUM_BEADS - 1 && endCondition === 'fixed') {
            yDisplacementCm = 0; // clamped to zero at fixed wall
          }

          newY.push(yDisplacementCm * pixelScale);
        }

        setBeadPositions(newY);
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, simSpeed, driverMode, endCondition, amplitude, frequency, damping, waveSpeed, wavelength, manualHandleY]);

  // Restart / Reset
  const handleReset = () => {
    timeRef.current = 0;
    pulseStartTimeRef.current = null;
    setBeadPositions(new Array(NUM_BEADS).fill(0));
    setManualHandleY(0);
    setStopwatchTime(0);
    setIsStopwatchRunning(false);
  };

  // Record observation into Virtual Lab notebook
  const handleSaveObservation = () => {
    const observation = {
      experiment: 'Wave on a String: Frequency, Amplitude & Tension',
      driverMode,
      endCondition,
      frequencyHz: frequency,
      periodS: wavePeriod,
      amplitudeCm: amplitude,
      damping,
      tensionLevel,
      tensionN: currentTension.tensionN,
      waveSpeedCmS: waveSpeed,
      wavelengthCm: wavelength,
      waveEquationVerification: `${waveSpeed} cm/s = ${frequency} Hz × ${wavelength} cm`,
      timestamp: new Date().toLocaleTimeString()
    };

    onRecordObservation?.(observation);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Draggable ruler handlers
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsDraggingRuler(true);
    setDragOffset({
      x: e.clientX - rulerPos.x,
      y: e.clientY - rulerPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRuler) {
        setRulerPos({
          x: Math.max(20, Math.min(500, e.clientX - dragOffset.x)),
          y: Math.max(50, Math.min(320, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRuler(false);
    };

    if (isDraggingRuler) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRuler, dragOffset]);

  // Pedagogical inquiry questions
  const inquiryQuestions = [
    {
      q: '1. Tension & Speed: When string tension is increased from Low (1.0 N) to High (9.0 N), what happens to wave speed v and wavelength λ at constant frequency?',
      a: 'Wave speed v is directly proportional to the square root of tension (v = √(T/μ)). Increasing tension triples the wave speed, and because λ = v/f, the wavelength on the string triples.'
    },
    {
      q: '2. Boundary Reflection: How does reflection at a Fixed Clamp differ from reflection at a Loose Ring on a rod?',
      a: 'At a Fixed Clamp, the boundary exerts an equal and opposite downward reaction force, inverting the wave (180° or π phase shift: a crest reflects as a trough). At a Loose Ring, the ring is free to slide, reflecting the wave in-phase (0° phase shift: crest reflects as a crest, momentarily doubling amplitude).'
    },
    {
      q: '3. Frequency vs Wavelength: If frequency f is doubled from 1.0 Hz to 2.0 Hz at constant string tension, what happens to the wavelength λ?',
      a: 'Because wave speed v is determined solely by the string medium tension and density, v remains constant. By v = f × λ, doubling frequency halves the wavelength (λ = v / 2f).'
    }
  ];

  return (
    <div className={`bg-slate-900 rounded-3xl border border-slate-800 text-white shadow-xl overflow-hidden ${className}`}>
      {/* Top Simulation Header Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3 h-3 text-orange-300" />
              Classic PhET Physics Engine
            </span>
            <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
              CBC Grade 8-9 Physics
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              Transverse Wave Mechanics
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
            Wave on a String: Frequency, Amplitude & Tension
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Driver Mode Selector */}
          <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10">
            {(['manual', 'oscillate', 'pulse'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setDriverMode(mode);
                  handleReset();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  driverMode === mode
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* End Condition Selector */}
          <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10">
            {(['fixed', 'loose', 'no_end'] as const).map(end => (
              <button
                key={end}
                onClick={() => setEndCondition(end)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  endCondition === end
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {end === 'fixed' ? 'Fixed End' : end === 'loose' ? 'Loose End' : 'No End'}
              </button>
            ))}
          </div>

          {/* Record to Notebook Button */}
          <button
            onClick={handleSaveObservation}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved to Lab!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Log Observation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="relative p-5 sm:p-7 bg-slate-950 flex flex-col items-center select-none overflow-hidden min-h-[380px]">
        {/* Real-time Physics Telemetry Bar */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-xs font-mono">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Frequency (f)</span>
            <span className="text-sm font-black text-emerald-400">{frequency.toFixed(2)} Hz</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Wave Period (T = 1/f)</span>
            <span className="text-sm font-black text-cyan-400">{wavePeriod.toFixed(2)} s</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">String Tension</span>
            <span className="text-sm font-black text-amber-400">{currentTension.name.slice(0, 11)}</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Wave Speed (v)</span>
            <span className="text-sm font-black text-purple-400">{waveSpeed.toFixed(1)} cm/s</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-bold">Wavelength (λ = v/f)</span>
            <span className="text-sm font-black text-rose-400">{wavelength.toFixed(2)} cm</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* INTERACTIVE SVG STRING CANVAS */}
        {/* ============================================================== */}
        <div className="w-full max-w-4xl relative bg-slate-900/70 rounded-2xl border border-slate-800 p-4 shadow-inner">
          <svg 
            ref={svgRef}
            viewBox="0 0 680 260" 
            className="w-full h-64 overflow-visible"
          >
            <defs>
              <linearGradient id="clampMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="rodBrass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            <g stroke="#1e293b" strokeWidth="1">
              {[60, 110, 160, 210].map(y => (
                <line key={y} x1="50" y1={y} x2="630" y2={y} strokeDasharray="3,3" />
              ))}
            </g>

            {/* Horizontal Equilibrium Centerline */}
            <line x1="60" y1="130" x2="620" y2="130" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,4" />
            <text x="625" y="133" className="text-[9px] font-mono fill-slate-500 font-bold">0 cm</text>

            {/* Movable Reference Amplitude Line */}
            {showReferenceLine && (
              <g>
                <line 
                  x1="60" 
                  y1={130 - referenceLineY} 
                  x2="620" 
                  y2={130 - referenceLineY} 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  strokeDasharray="6,3" 
                />
                <text x="625" y={133 - referenceLineY} className="text-[9px] font-mono fill-red-400 font-bold">
                  +{(referenceLineY / 50).toFixed(2)} cm
                </text>
              </g>
            )}

            {/* LEFT DRIVER MECHANISM */}
            {driverMode === 'oscillate' && (
              /* Motorized Piston Oscillator */
              <g transform="translate(25, 80)">
                <rect x="0" y="0" width="35" height="100" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <circle cx="17.5" cy="50" r="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                <circle cx="17.5" cy="50" r="5" fill="#f59e0b" />
                {/* Connecting Piston Arm */}
                <line x1="17.5" y1="50" x2="45" y2={50 + (beadPositions[0] || 0) * 0.7} stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="45" cy={50 + (beadPositions[0] || 0) * 0.7} r="6" fill="#38bdf8" />
              </g>
            )}

            {driverMode === 'pulse' && (
              /* Pulse Actuator Button */
              <g transform="translate(15, 95)">
                <rect x="0" y="15" width="45" height="40" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <rect x="10" y="0" width="25" height="20" rx="3" fill="#ea580c" />
                <text x="14" y="14" className="text-[8px] font-black fill-white">PULSE</text>
              </g>
            )}

            {driverMode === 'manual' && (
              /* Manual Drag Wrench / Handle */
              <g transform={`translate(20, ${110 + manualHandleY})`}>
                <rect x="0" y="0" width="40" height="25" rx="4" fill="#d97706" stroke="#78350f" strokeWidth="2" />
                <text x="6" y="16" className="text-[9px] font-black fill-amber-950">DRAG</text>
              </g>
            )}

            {/* BEADED STRING: CONNECTING ELASTIC LINE */}
            <path
              d={beadPositions.map((y, idx) => {
                const x = 70 + idx * beadSpacingPx;
                const actualY = 130 - y;
                return `${idx === 0 ? 'M' : 'L'} ${x} ${actualY}`;
              }).join(' ')}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
            />

            {/* BEADED STRING: INDIVIDUAL ALTERNATING COLOR BEADS */}
            {beadPositions.map((y, idx) => {
              const x = 70 + idx * beadSpacingPx;
              const actualY = 130 - y;
              const isFirst = idx === 0;
              const isLast = idx === NUM_BEADS - 1;
              const beadColor = isFirst ? '#38bdf8' : isLast ? '#ef4444' : idx % 2 === 0 ? '#f97316' : '#10b981';

              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={actualY}
                  r={isFirst || isLast ? 6 : 4.5}
                  fill={beadColor}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* RIGHT BOUNDARY END MECHANISM */}
            {endCondition === 'fixed' && (
              /* Heavy Duty Fixed Clamp on Post */
              <g transform="translate(615, 80)">
                <rect x="0" y="0" width="20" height="100" fill="url(#clampMetal)" stroke="#0f172a" strokeWidth="2" />
                <rect x="-8" y="42" width="16" height="16" rx="2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
                <text x="-4" y="32" className="text-[8px] font-bold fill-slate-400">Fixed</text>
              </g>
            )}

            {endCondition === 'loose' && (
              /* Polished Vertical Brass Rod with Sliding Ring */
              <g transform="translate(615, 40)">
                <rect x="5" y="0" width="6" height="180" rx="3" fill="url(#rodBrass)" stroke="#78350f" strokeWidth="1.5" />
                {/* Sliding Ring */}
                <ellipse 
                  cx="8" 
                  cy={90 - (beadPositions[NUM_BEADS - 1] || 0)} 
                  rx="9" 
                  ry="5" 
                  fill="#ffffff" 
                  stroke="#b45309" 
                  strokeWidth="2.5" 
                />
                <text x="-8" y="20" className="text-[8px] font-bold fill-amber-300">Loose Ring</text>
              </g>
            )}

            {endCondition === 'no_end' && (
              /* Open Laboratory Window */
              <g transform="translate(610, 60)">
                <rect x="0" y="0" width="25" height="140" fill="#0369a1" opacity="0.3" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,2" />
                <text x="2" y="30" className="text-[8px] font-bold fill-cyan-400">Window</text>
              </g>
            )}

            {/* DRAGGABLE RULER OVERLAY */}
            {showRuler && (
              <g 
                transform={`translate(${rulerPos.x}, ${rulerPos.y})`}
                onMouseDown={handleRulerMouseDown}
                className="cursor-move"
              >
                <rect x="0" y="0" width="300" height="40" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" opacity="0.9" />
                {/* Metric graduation ticks */}
                {Array.from({ length: 31 }).map((_, cm) => (
                  <g key={cm}>
                    <line x1={cm * 10} y1="0" x2={cm * 10} y2="12" stroke="#713f12" strokeWidth="1" />
                    {cm % 5 === 0 && (
                      <text x={cm * 10 - 3} y="24" className="text-[8px] font-mono font-bold fill-amber-950">
                        {cm}
                      </text>
                    )}
                  </g>
                ))}
                <text x="270" y="34" className="text-[8px] font-mono font-black fill-amber-900">cm</text>
                <text x="10" y="34" className="text-[7px] font-bold fill-amber-800">DRAG ME TO MEASURE λ</text>
              </g>
            )}
          </svg>
        </div>

        {/* DIGITAL STOPWATCH TOOL OVERLAY */}
        {showStopwatch && (
          <div className="mt-3 bg-slate-900 border border-slate-700 p-3 rounded-2xl flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Wave Period Stopwatch</span>
                <div className="text-xl font-mono font-black text-cyan-300">{stopwatchTime.toFixed(2)} s</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  isStopwatchRunning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isStopwatchRunning ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchTime(0);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Playback & Step Controls Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between w-full max-w-4xl gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              title={isRunning ? 'Pause Wave' : 'Play Wave'}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {driverMode === 'pulse' && (
              <button
                onClick={triggerPulse}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4" />
                <span>Send Single Pulse</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors cursor-pointer"
              title="Reset Wave to Rest"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Sim Speed Toggle */}
            <button
              onClick={() => setSimSpeed(simSpeed === 'normal' ? 'slow' : 'normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                simSpeed === 'slow'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{simSpeed === 'slow' ? 'Slow Motion (0.25x)' : 'Normal Speed'}</span>
            </button>
          </div>

          {/* Tools Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                showRuler ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Ruler ({showRuler ? 'ON' : 'OFF'})
            </button>

            <button
              onClick={() => setShowStopwatch(!showStopwatch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                showStopwatch ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Stopwatch
            </button>

            <button
              onClick={() => setShowReferenceLine(!showReferenceLine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                showReferenceLine ? 'bg-rose-600 text-white font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Reference Line
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LOWER DASHBOARD: PARAMETER CONTROLS & TEACHER GUIDE */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-6 bg-slate-900 grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-800">
        {/* Left: Wave Physics Parameter Sliders */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Wave Parameter Controls</span>
            </h3>

            {/* Amplitude Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Amplitude (A):</span>
                <span className="font-mono text-emerald-400 font-black">{amplitude.toFixed(2)} cm</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.25"
                step="0.05"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.00 cm (Flat)</span>
                <span>0.75 cm</span>
                <span>1.25 cm (Maximum)</span>
              </div>
            </div>

            {/* Frequency Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Frequency (f):</span>
                <span className="font-mono text-cyan-400 font-black">{frequency.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="3.00"
                step="0.10"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.10 Hz (Slow)</span>
                <span>1.50 Hz</span>
                <span>3.00 Hz (Fast)</span>
              </div>
            </div>

            {/* Damping Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Damping (Friction / Decay):</span>
                <span className="font-mono text-amber-400 font-black">
                  {damping === 0 ? 'None (0.00)' : damping < 0.03 ? 'Moderate' : 'Lots'}
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.05"
                step="0.005"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>None (Infinite Wave)</span>
                <span>Moderate</span>
                <span>Lots (Rapid Decay)</span>
              </div>
            </div>

            {/* String Tension Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">String Tension (T):</span>
                <span className="font-mono text-purple-400 font-black">{currentTension.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(ten => (
                  <button
                    key={ten}
                    onClick={() => setTensionLevel(ten)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      tensionLevel === ten
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {ten} Tension
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Teacher Demonstration Guide & Inquiry Questions */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Teacher Demonstration Script & Inquiry Prompts</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {inquiryQuestions.map((item, idx) => {
                const isRevealed = !!revealedAnswers[idx];
                return (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-slate-200 leading-snug">{item.q}</div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        {isRevealed ? 'Scientific explanation visible' : 'Prompt students first'}
                      </span>
                      <button
                        onClick={() => setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                      >
                        {isRevealed ? 'Hide Answer' : 'Reveal Answer to Class'}
                      </button>
                    </div>

                    {isRevealed && (
                      <div className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/40 text-[11px] text-emerald-200 leading-relaxed">
                        <strong>Concept:</strong> {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
