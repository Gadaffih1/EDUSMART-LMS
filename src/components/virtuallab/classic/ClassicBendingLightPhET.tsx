import React, { useState } from 'react';
import { 
  RotateCcw, 
  Save, 
  Check, 
  Sparkles, 
  Compass, 
  Sun, 
  Layers, 
  Info,
  Maximize2
} from 'lucide-react';

interface ClassicBendingLightPhETProps {
  onRecordObservation?: (data: any) => void;
  className?: string;
}

interface OpticalMedium {
  name: string;
  n: number; // Index of refraction
  color: string;
  bgColor: string;
}

const OPTICAL_MEDIA: Record<string, OpticalMedium> = {
  air: { name: 'Air', n: 1.000, color: '#e0f2fe', bgColor: 'bg-sky-500/10' },
  water: { name: 'Water', n: 1.333, color: '#38bdf8', bgColor: 'bg-cyan-500/20' },
  glass: { name: 'Glass', n: 1.500, color: '#93c5fd', bgColor: 'bg-blue-500/30' },
  diamond: { name: 'Diamond', n: 2.417, color: '#e0e7ff', bgColor: 'bg-indigo-500/40' },
  mystery: { name: 'Mystery Medium A', n: 1.420, color: '#d8b4fe', bgColor: 'bg-purple-500/30' }
};

export const ClassicBendingLightPhET: React.FC<ClassicBendingLightPhETProps> = ({
  onRecordObservation,
  className = ''
}) => {
  // Incident angle in degrees (0 = normal incident, 85 = grazing)
  const [incidentAngleDeg, setIncidentAngleDeg] = useState<number>(45);
  const [laserOn, setLaserOn] = useState<boolean>(true);
  const [laserWavelength, setLaserWavelength] = useState<'red' | 'green' | 'violet'>('red');
  const [medium1Key, setMedium1Key] = useState<string>('air');
  const [medium2Key, setMedium2Key] = useState<string>('glass');
  const [showProtractor, setShowProtractor] = useState<boolean>(true);
  const [showNormal, setShowNormal] = useState<boolean>(true);
  const [showAngles, setShowAngles] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const m1 = OPTICAL_MEDIA[medium1Key] || OPTICAL_MEDIA.air;
  const m2 = OPTICAL_MEDIA[medium2Key] || OPTICAL_MEDIA.glass;

  // Snell's Law calculations:
  // n1 * sin(theta1) = n2 * sin(theta2)
  const theta1Rad = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta2 = (m1.n * Math.sin(theta1Rad)) / m2.n;

  // Total Internal Reflection (TIR) condition:
  // Happens when m1.n > m2.n and sinTheta2 > 1.0
  const isTir = sinTheta2 > 1.0;
  const criticalAngleDeg = m1.n > m2.n 
    ? Number(((Math.asin(m2.n / m1.n) * 180) / Math.PI).toFixed(1))
    : null;

  const theta2Rad = !isTir ? Math.asin(sinTheta2) : null;
  const theta2Deg = theta2Rad !== null ? Number(((theta2Rad * 180) / Math.PI).toFixed(1)) : null;

  // Speed of light in media (c = 3.00 x 10^8 m/s)
  const speedM1 = (3.00 / m1.n).toFixed(2);
  const speedM2 = (3.00 / m2.n).toFixed(2);

  // Approximate Fresnel Reflectance (for unpolarized light at boundary)
  let reflectance = 0;
  if (isTir) {
    reflectance = 1.0;
  } else if (theta2Rad !== null) {
    const rPar = Math.tan(theta1Rad - theta2Rad) / Math.max(0.0001, Math.tan(theta1Rad + theta2Rad));
    const rPerp = Math.sin(theta1Rad - theta2Rad) / Math.max(0.0001, Math.sin(theta1Rad + theta2Rad));
    reflectance = Math.min(1.0, Math.max(0, 0.5 * (rPar * rPar + rPerp * rPerp)));
    if (incidentAngleDeg === 0) {
      const r0 = Math.pow((m1.n - m2.n) / (m1.n + m2.n), 2);
      reflectance = r0;
    }
  }

  const reflectedIntensityPct = Math.round(reflectance * 100);
  const refractedIntensityPct = isTir ? 0 : 100 - reflectedIntensityPct;

  // Ray coordinates in SVG:
  // Boundary at y = 200, normal at x = 300
  // Incident ray comes from top-left into center (300, 200)
  // Length of ray = 200px
  const rayLength = 220;
  const incidentStartX = 300 - rayLength * Math.sin(theta1Rad);
  const incidentStartY = 200 - rayLength * Math.cos(theta1Rad);

  // Reflected ray goes up-right
  const reflectedEndX = 300 + rayLength * Math.sin(theta1Rad);
  const reflectedEndY = 200 - rayLength * Math.cos(theta1Rad);

  // Refracted ray goes down-right (into Medium 2)
  const refractedEndX = theta2Rad !== null ? 300 + rayLength * Math.sin(theta2Rad) : 300;
  const refractedEndY = theta2Rad !== null ? 200 + rayLength * Math.cos(theta2Rad) : 200;

  const laserColorMap = {
    red: '#ef4444',
    green: '#10b981',
    violet: '#a855f7'
  };

  const currentLaserHex = laserColorMap[laserWavelength];

  const handleRecord = () => {
    const data = {
      type: 'Bending Light & Snell\'s Law',
      medium1: `${m1.name} (n = ${m1.n})`,
      medium2: `${m2.name} (n = ${m2.n})`,
      incidentAngle: `${incidentAngleDeg}°`,
      refractedAngle: isTir ? 'Total Internal Reflection (TIR)' : `${theta2Deg}°`,
      criticalAngle: criticalAngleDeg ? `${criticalAngleDeg}°` : 'None (n1 <= n2)',
      snellVerification: !isTir ? `n1·sin(θ1) = ${(m1.n * Math.sin(theta1Rad)).toFixed(3)}, n2·sin(θ2) = ${(m2.n * Math.sin(theta2Rad!)).toFixed(3)}` : 'TIR Exceeded',
      speed1: `${speedM1} × 10⁸ m/s`,
      speed2: `${speedM2} × 10⁸ m/s`
    };

    onRecordObservation?.(data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* Top Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-black">
            λ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                PhET Classic Optics
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                CBC Strand 4.4 · Refraction &amp; Snell&apos;s Law
              </span>
            </div>
            <h3 className="text-sm font-black text-white">
              Bending Light: Snell&apos;s Law, Reflection &amp; Refraction
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLaserOn(!laserOn)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              laserOn 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{laserOn ? 'Laser On' : 'Laser Off'}</span>
          </button>

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
                <span>Log Measurement</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tools & Toggles Bar */}
      <div className="bg-slate-900/90 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showProtractor}
              onChange={(e) => setShowProtractor(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            <span>Circular Protractor (360°)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showNormal}
              onChange={(e) => setShowNormal(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            <span>Normal Line (Dashed)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-white">
            <input
              type="checkbox"
              checked={showAngles}
              onChange={(e) => setShowAngles(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            <span>Angles &amp; Percentages</span>
          </label>
        </div>

        {/* Laser Color Chooser */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-bold mr-1">Laser:</span>
          {(['red', 'green', 'violet'] as const).map(color => (
            <button
              key={color}
              onClick={() => setLaserWavelength(color)}
              className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                laserWavelength === color ? 'scale-125 border-white shadow-xs' : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: laserColorMap[color] }}
              title={`Switch to ${color} laser`}
            />
          ))}
        </div>
      </div>

      {/* Main Optics Canvas Viewport */}
      <div className="relative bg-slate-950 h-[380px] overflow-hidden select-none">
        
        {/* Medium 1 (Top Half) & Medium 2 (Bottom Half) Backgrounds */}
        <div 
          className="absolute top-0 left-0 right-0 h-[200px] transition-colors duration-300 border-b border-slate-700/60"
          style={{ backgroundColor: `${m1.color}15` }}
        >
          {/* Medium 1 Label */}
          <div className="absolute top-3 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white">
            <span className="font-extrabold text-cyan-300">{m1.name}</span>
            <span className="font-mono text-slate-400 ml-2">n₁ = {m1.n.toFixed(3)}</span>
            <span className="text-[10px] text-slate-500 ml-2 font-mono">v₁ = {speedM1} × 10⁸ m/s</span>
          </div>
        </div>

        <div 
          className="absolute top-[200px] left-0 right-0 bottom-0 transition-colors duration-300"
          style={{ backgroundColor: `${m2.color}25` }}
        >
          {/* Medium 2 Label */}
          <div className="absolute bottom-3 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white">
            <span className="font-extrabold text-indigo-300">{m2.name}</span>
            <span className="font-mono text-slate-400 ml-2">n₂ = {m2.n.toFixed(3)}</span>
            <span className="text-[10px] text-slate-500 ml-2 font-mono">v₂ = {speedM2} × 10⁸ m/s</span>
          </div>
        </div>

        {/* SVG Rays & Protractor Layer */}
        <svg viewBox="0 0 600 400" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Glow Filter for Laser */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Normal Line (x=300) */}
          {showNormal && (
            <line
              x1="300" y1="20"
              x2="300" y2="380"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
          )}

          {/* Transparent Protractor Overlay */}
          {showProtractor && (
            <g transform="translate(300, 200)" opacity="0.45">
              <circle r="150" fill="none" stroke="#94a3b8" strokeWidth="1" />
              <line x1="-150" y1="0" x2="150" y2="0" stroke="#94a3b8" strokeWidth="1" />
              <line x1="0" y1="-150" x2="0" y2="150" stroke="#94a3b8" strokeWidth="1" />
              {/* Radial Degree Ticks */}
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180;
                const r1 = i % 3 === 0 ? 135 : 142;
                return (
                  <line
                    key={i}
                    x1={r1 * Math.cos(angle)}
                    y1={r1 * Math.sin(angle)}
                    x2={150 * Math.cos(angle)}
                    y2={150 * Math.sin(angle)}
                    stroke="#cbd5e1"
                    strokeWidth={i % 3 === 0 ? '1.5' : '1'}
                  />
                );
              })}
            </g>
          )}

          {/* Laser Rays */}
          {laserOn && (
            <g filter="url(#laserGlow)">
              {/* 1. Incident Ray */}
              <line
                x1={incidentStartX}
                y1={incidentStartY}
                x2="300"
                y2="200"
                stroke={currentLaserHex}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* 2. Reflected Ray */}
              <line
                x1="300"
                y1="200"
                x2={reflectedEndX}
                y2={reflectedEndY}
                stroke={currentLaserHex}
                strokeWidth={Math.max(1, 3.5 * (reflectedIntensityPct / 100))}
                strokeOpacity={Math.max(0.15, reflectedIntensityPct / 100)}
                strokeLinecap="round"
              />

              {/* 3. Refracted Ray (or omitted if TIR) */}
              {!isTir && theta2Rad !== null && (
                <line
                  x1="300"
                  y1="200"
                  x2={refractedEndX}
                  y2={refractedEndY}
                  stroke={currentLaserHex}
                  strokeWidth={Math.max(1, 3.5 * (refractedIntensityPct / 100))}
                  strokeOpacity={Math.max(0.2, refractedIntensityPct / 100)}
                  strokeLinecap="round"
                />
              )}

              {/* Point of Incidence Marker */}
              <circle cx="300" cy="200" r="4" fill="#ffffff" />
            </g>
          )}

          {/* Angle Arcs & Labels */}
          {showAngles && laserOn && (
            <g className="text-xs font-mono font-bold">
              {/* Incident Angle Arc */}
              <text x="260" y="160" fill="#f8fafc" fontSize="11">
                θ₁ = {incidentAngleDeg}°
              </text>
              <text x="315" y="160" fill="#cbd5e1" fontSize="10">
                θ_r = {incidentAngleDeg}° ({reflectedIntensityPct}%)
              </text>
              
              {!isTir && theta2Deg !== null ? (
                <text x="315" y="250" fill="#38bdf8" fontSize="11">
                  θ₂ = {theta2Deg}° ({refractedIntensityPct}%)
                </text>
              ) : (
                <text x="315" y="250" fill="#ef4444" fontSize="11" fontWeight="bold">
                  Total Internal Reflection (TIR)
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Laser Gun Visual (Rotates on arc) */}
        <div 
          className="absolute w-12 h-6 bg-slate-800 border-2 border-slate-500 rounded-lg shadow-lg flex items-center justify-between px-1.5 transition-transform"
          style={{
            left: `${incidentStartX - 24}px`,
            top: `${incidentStartY - 12}px`,
            transform: `rotate(${incidentAngleDeg + 90}deg)`
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="w-1.5 h-3 bg-red-500 rounded-xs" />
        </div>

        {/* TIR Alert Badge */}
        {isTir && (
          <div className="absolute top-4 right-4 bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-4 py-2 rounded-2xl shadow-xl space-y-0.5">
            <div className="text-[10px] font-black uppercase text-rose-400">Optical Phenomenon</div>
            <div className="text-xs font-black">Total Internal Reflection (TIR)</div>
            <div className="text-[10px] text-rose-300">
              θ₁ ({incidentAngleDeg}°) &gt; Critical Angle θ_c ({criticalAngleDeg}°)
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls: Medium Selectors & Angle Slider */}
      <div className="bg-slate-950 p-5 border-t border-slate-800 text-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          
          {/* Medium 1 Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Top Medium (Incident Ray):
            </label>
            <select
              value={medium1Key}
              onChange={(e) => setMedium1Key(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold cursor-pointer"
            >
              {Object.entries(OPTICAL_MEDIA).map(([k, med]) => (
                <option key={k} value={k}>
                  {med.name} (n = {med.n.toFixed(3)})
                </option>
              ))}
            </select>
          </div>

          {/* Incident Angle Slider */}
          <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Incident Angle (θ₁):</span>
              <span className="font-mono font-black text-cyan-400">{incidentAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="85"
              step="1"
              value={incidentAngleDeg}
              onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0° (Normal)</span>
              <span>45°</span>
              <span>85° (Grazing)</span>
            </div>
          </div>

          {/* Medium 2 Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              2. Bottom Medium (Refracted Ray):
            </label>
            <select
              value={medium2Key}
              onChange={(e) => setMedium2Key(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold cursor-pointer"
            >
              {Object.entries(OPTICAL_MEDIA).map(([k, med]) => (
                <option key={k} value={k}>
                  {med.name} (n = {med.n.toFixed(3)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Snell's Law Real-time Math Summary */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-400 font-bold">Snell&apos;s Law Formula:</span>
            <span className="font-mono font-black text-white">n₁ · sin(θ₁) = n₂ · sin(θ₂)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">n₁·sin(θ₁): </span>
              <span className="text-cyan-300 font-bold">{(m1.n * Math.sin(theta1Rad)).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-slate-500">n₂·sin(θ₂): </span>
              <span className="text-indigo-300 font-bold">{!isTir ? (m2.n * Math.sin(theta2Rad!)).toFixed(3) : 'N/A (TIR)'}</span>
            </div>
            {criticalAngleDeg && (
              <div>
                <span className="text-slate-500">Critical Angle θ_c: </span>
                <span className="text-amber-400 font-bold">{criticalAngleDeg}°</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
