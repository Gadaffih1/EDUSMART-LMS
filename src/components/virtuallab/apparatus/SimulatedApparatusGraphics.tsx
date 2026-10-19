import React from 'react';

interface SimulatedApparatusGraphicsProps {
  diagramType: string;
  className?: string;
  interactiveState?: any;
  showLabels?: boolean;
}

export const SimulatedApparatusGraphics: React.FC<SimulatedApparatusGraphicsProps> = ({
  diagramType,
  className = 'w-full h-64',
  interactiveState = {},
  showLabels = true
}) => {
  switch (diagramType) {
    case 'microscope':
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="lensGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Horseshoe Heavy Base */}
          <path d="M120 360 C120 380, 280 380, 280 360 L260 330 C230 340, 170 340, 140 330 Z" fill="url(#metalGrad)" stroke="#1e293b" strokeWidth="3" />
          <rect x="180" y="300" width="40" height="35" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />

          {/* Mirror / Illuminator Light Source */}
          <ellipse cx="200" cy="285" rx="22" ry="10" fill="url(#lensGlow)" stroke="#0284c7" strokeWidth="2" />
          <path d="M190 285 L180 310 M210 285 L220 310" stroke="#64748b" strokeWidth="3" />

          {/* Curved Mechanical Arm */}
          <path d="M220 310 C290 270, 310 160, 230 110 L200 110" fill="none" stroke="url(#metalGrad)" strokeWidth="24" strokeLinecap="round" />

          {/* Stage & Condenser */}
          <rect x="140" y="215" width="120" height="12" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Stage Aperture / Slide */}
          <rect x="180" y="213" width="40" height="4" fill="#38bdf8" />
          {/* Stage Clips */}
          <path d="M150 215 L165 210 M250 215 L235 210" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

          {/* Substage Condenser */}
          <path d="M185 227 L215 227 L208 245 L192 245 Z" fill="#475569" stroke="#334155" strokeWidth="2" />

          {/* Coarse & Fine Focus Adjustment Knobs */}
          <circle cx="260" cy="200" r="18" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="2" />
          <circle cx="260" cy="200" r="10" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="260" cy="200" r="4" fill="#fbbf24" />

          {/* Revolving Nosepiece / Objective Turret */}
          <ellipse cx="200" cy="155" rx="25" ry="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Objectives (4x, 10x, 40x) */}
          <rect x="194" y="163" width="12" height="35" rx="2" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="1.5" />
          <rect x="175" y="160" width="10" height="25" rx="2" fill="#64748b" transform="rotate(15 180 160)" />
          <rect x="215" y="160" width="10" height="28" rx="2" fill="#64748b" transform="rotate(-15 220 160)" />

          {/* Optical Body Tube */}
          <rect x="190" y="60" width="20" height="85" fill="url(#metalGrad)" stroke="#1e293b" strokeWidth="2" />

          {/* Eyepiece / Ocular Lens (10x) */}
          <rect x="185" y="30" width="30" height="30" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="200" cy="30" rx="14" ry="4" fill="#38bdf8" />

          {/* Specimen Light Cone Simulation */}
          <polygon points="190,280 210,280 203,220 197,220" fill="rgba(56, 189, 248, 0.35)" />
          <polygon points="198,210 202,210 206,198 194,198" fill="rgba(56, 189, 248, 0.45)" />

          {showLabels && (
            <g className="text-[9px] font-bold fill-slate-700">
              <text x="225" y="45">Eyepiece (10x)</text>
              <line x1="215" y1="42" x2="223" y2="42" stroke="#64748b" strokeWidth="1" />
              <text x="215" y="180">Objective Lens</text>
              <line x1="207" y1="180" x2="213" y2="180" stroke="#64748b" strokeWidth="1" />
              <text x="75" y="220">Stage & Slide Clip</text>
              <line x1="138" y1="218" x2="160" y2="218" stroke="#64748b" strokeWidth="1" />
              <text x="285" y="205">Focus Knobs</text>
              <line x1="278" y1="202" x2="283" y2="202" stroke="#64748b" strokeWidth="1" />
              <text x="235" y="290">Illumination Mirror</text>
              <line x1="222" y1="287" x2="233" y2="287" stroke="#64748b" strokeWidth="1" />
            </g>
          )}
        </svg>
      );

    case 'bunsen_burner': {
      const isRoaring = interactiveState?.isRoaring ?? false;
      const isOpen = interactiveState?.isOpen ?? false;
      return (
        <svg viewBox="0 0 320 380" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blueFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="innerCone" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
            <linearGradient id="yellowFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="burnerBarrel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="80%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>

          {/* Heavy Cast Base */}
          <path d="M80 340 C80 365, 240 365, 240 340 L220 310 L100 310 Z" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          {/* Gas Inlet Tube */}
          <path d="M70 325 L130 325" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" />
          <path d="M70 325 C30 325, 20 370, 0 370" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="6,4" />

          {/* Air Collar & Air Hole */}
          <rect x="142" y="250" width="36" height="35" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          {/* Air hole opening */}
          <ellipse cx="160" cy="268" rx="8" ry="6" fill={isOpen || isRoaring ? '#0f172a' : '#fbbf24'} stroke="#78350f" strokeWidth="1.5" />

          {/* Brass Barrel Chimney */}
          <rect x="146" y="130" width="28" height="120" fill="url(#burnerBarrel)" stroke="#78350f" strokeWidth="2" />
          <rect x="143" y="125" width="34" height="8" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />

          {/* Dynamic Flame */}
          {isRoaring || isOpen ? (
            /* Non-luminous roaring blue flame */
            <g>
              <path d="M145 125 C135 70, 150 20, 160 5 C170 20, 185 70, 175 125 Z" fill="url(#blueFlame)" />
              <path d="M150 125 C145 95, 155 60, 160 50 C165 60, 175 95, 170 125 Z" fill="url(#innerCone)" />
              <circle cx="160" cy="48" r="3" fill="#ffffff" className="animate-ping" />
            </g>
          ) : (
            /* Safety luminous yellow/orange wavy flame */
            <g>
              <path d="M144 125 C125 75, 140 25, 160 10 C180 25, 195 75, 176 125 Z" fill="url(#yellowFlame)" />
              <path d="M148 125 C140 85, 152 45, 160 35 C168 45, 180 85, 172 125 Z" fill="#fef08a" opacity="0.8" />
            </g>
          )}

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="195" y="40">{isRoaring || isOpen ? 'Non-Luminous Blue (~1200°C)' : 'Safety Yellow Flame (~700°C)'}</text>
              <text x="190" y="180">Brass Barrel Chimney</text>
              <text x="190" y="270">Adjustable Air Collar</text>
              <text x="15" y="320">Gas Tubing Inlet</text>
              <text x="210" y="345">Heavy Base</text>
            </g>
          )}
        </svg>
      );
    }

    case 'measuring_cylinder': {
      const volumeMl = interactiveState?.volumeMl ?? 65;
      const liquidY = 320 - (volumeMl / 100) * 220;
      return (
        <svg viewBox="0 0 280 380" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="glassWall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="15%" stopColor="#bae6fd" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#bae6fd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="liquidBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Hexagonal Base */}
          <polygon points="70,360 110,345 170,345 210,360 170,375 110,375" fill="#334155" stroke="#1e293b" strokeWidth="2" />

          {/* Glass Cylinder Column */}
          <rect x="110" y="70" width="60" height="275" rx="4" fill="url(#glassWall)" stroke="#38bdf8" strokeWidth="2" />
          {/* Spout Lip */}
          <path d="M110 70 L95 62 L112 60" fill="none" stroke="#38bdf8" strokeWidth="2" />

          {/* Liquid Column with Meniscus */}
          <rect x="112" y={liquidY} width="56" height={345 - liquidY} fill="url(#liquidBlue)" />
          {/* Curved Concave Meniscus (bottom of curve is true measurement) */}
          <path d={`M112 ${liquidY} Q140 ${liquidY + 6} 168 ${liquidY}`} fill="none" stroke="#0369a1" strokeWidth="2.5" />

          {/* Metric Graduation Scale (10 to 100 ml) */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
            const y = 320 - (val / 100) * 220;
            return (
              <g key={val}>
                <line x1="150" y1={y} x2="168" y2={y} stroke="#0f172a" strokeWidth="1.5" />
                <text x="175" y={y + 3} className="text-[9px] font-mono font-bold fill-slate-700">{val}</text>
              </g>
            );
          })}
          {/* Subdivisions (5ml ticks) */}
          {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map(val => {
            const y = 320 - (val / 100) * 220;
            return <line key={val} x1="158" y1={y} x2="168" y2={y} stroke="#64748b" strokeWidth="1" />;
          })}

          {/* Eye-level Parallax Indicator */}
          <g transform={`translate(45, ${liquidY + 3})`}>
            <circle cx="20" cy="0" r="10" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="23" cy="0" r="5" fill="#0284c7" />
            <line x1="32" y1="0" x2="110" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="-40" y="3" className="text-[9px] font-bold fill-red-600">Eye-Level Meniscus</text>
          </g>

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="100" y="45">Pouring Spout Lip</text>
              <text x="180" y="90">100ml Graduation Scale</text>
              <text x="120" y={liquidY - 8} className="font-mono text-emerald-800 font-black">{volumeMl} ml</text>
              <text x="80" y="375">Hexagonal Safety Foot</text>
            </g>
          )}
        </svg>
      );
    }

    case 'spring_balance': {
      const massGrams = interactiveState?.massGrams ?? 200;
      const stretchY = Math.min(230, 110 + (massGrams / 500) * 110);
      const forceNewtons = ((massGrams / 1000) * 9.8).toFixed(1);
      return (
        <svg viewBox="0 0 280 400" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Top Suspension Ring */}
          <circle cx="140" cy="25" r="15" fill="none" stroke="#64748b" strokeWidth="4" />
          <rect x="135" y="38" width="10" height="15" fill="#475569" />

          {/* Rectangular Acrylic Enclosure */}
          <rect x="105" y="52" width="70" height="240" rx="6" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          <rect x="110" y="58" width="60" height="228" fill="#e2e8f0" opacity="0.6" />

          {/* Internal Helical Spring Coil */}
          <path 
            d={`M140 65 L140 80 Q155 90 140 100 Q125 110 140 120 Q155 130 140 140 Q125 150 140 160 Q155 170 140 180 L140 ${stretchY}`} 
            fill="none" 
            stroke="#0284c7" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />

          {/* Red Indicator Pointer */}
          <polygon points={`122,${stretchY} 158,${stretchY} 165,${stretchY + 4} 115,${stretchY + 4}`} fill="#dc2626" />
          <circle cx="140" cy={stretchY + 2} r="3" fill="#ffffff" />

          {/* Dual Scale Markings (Newtons on left, Grams on right) */}
          {[0, 1, 2, 3, 4, 5].map(n => {
            const y = 80 + n * 36;
            return (
              <g key={n}>
                <line x1="110" y1={y} x2="122" y2={y} stroke="#0f172a" strokeWidth="1.5" />
                <text x="92" y={y + 3} className="text-[9px] font-bold font-mono fill-slate-800">{n}N</text>
                <line x1="158" y1={y} x2="170" y2={y} stroke="#0f172a" strokeWidth="1.5" />
                <text x="175" y={y + 3} className="text-[9px] font-bold font-mono fill-slate-600">{n * 100}g</text>
              </g>
            );
          })}

          {/* Lower Extension Rod & Hook */}
          <line x1="140" y1={stretchY + 4} x2="140" y2="330" stroke="#475569" strokeWidth="3.5" />
          {/* Steel Hook */}
          <path d="M140 330 C140 360, 115 360, 115 345 C115 335, 125 335, 125 345" fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

          {/* Hanging Slotted Weight */}
          <g transform="translate(115, 350)">
            <rect x="10" y="0" width="30" height="35" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            <text x="16" y="22" className="text-[9px] font-black fill-amber-100">{massGrams}g</text>
          </g>

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="35" y="40">Suspension Ring</text>
              <text x="15" y="150">Newton (N) Scale</text>
              <text x="195" y="150">Gram (g) Mass</text>
              <text x="185" y={stretchY + 5} className="fill-red-600 font-mono font-black">{forceNewtons} N</text>
              <text x="165" y="370">Slotted Mass ({massGrams}g)</text>
            </g>
          )}
        </svg>
      );
    }

    case 'vernier_calipers': {
      const readingMm = interactiveState?.readingMm ?? 34.5;
      const slideOffset = Math.min(100, (readingMm / 100) * 100);
      return (
        <svg viewBox="0 0 420 220" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="steelBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="vernierJaw" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Main Fixed Caliper Beam */}
          <rect x="50" y="70" width="340" height="40" fill="url(#steelBeam)" stroke="#334155" strokeWidth="2" />

          {/* Fixed Jaws (Left) */}
          {/* Fixed Outside Large Jaw */}
          <path d="M50 70 L50 180 C50 190, 70 185, 75 160 L75 110 L50 110 Z" fill="url(#steelBeam)" stroke="#334155" strokeWidth="2" />
          {/* Fixed Inside Small Jaw */}
          <path d="M50 70 L50 20 C50 15, 65 20, 70 45 L70 70 Z" fill="url(#steelBeam)" stroke="#334155" strokeWidth="2" />

          {/* Main Metric Scale Divisions (cm and mm) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cm => {
            const x = 90 + cm * 25;
            return (
              <g key={cm}>
                <line x1={x} y1="90" x2={x} y2="110" stroke="#0f172a" strokeWidth="1.5" />
                <text x={x - 4} y="86" className="text-[8px] font-mono font-bold fill-slate-800">{cm}</text>
                {/* 5mm tick */}
                <line x1={x + 12.5} y1="96" x2={x + 12.5} y2="110" stroke="#475569" strokeWidth="1" />
              </g>
            );
          })}

          {/* Measured Sphere Clamped Between Jaws */}
          <circle cx={75 + slideOffset / 2} cy="150" r={slideOffset / 2} fill="#fbbf24" stroke="#b45309" strokeWidth="2" />

          {/* Sliding Vernier Frame */}
          <g transform={`translate(${slideOffset}, 0)`}>
            {/* Sliding Outside Jaw */}
            <path d="M90 70 L90 180 C90 190, 75 185, 75 160 L75 110 L90 110 Z" fill="url(#vernierJaw)" stroke="#1e293b" strokeWidth="2" />
            {/* Sliding Inside Jaw */}
            <path d="M90 70 L90 20 C90 15, 75 20, 75 45 L75 70 Z" fill="url(#vernierJaw)" stroke="#1e293b" strokeWidth="2" />
            {/* Vernier Frame Window */}
            <rect x="90" y="65" width="85" height="50" rx="3" fill="url(#vernierJaw)" stroke="#1e293b" strokeWidth="2" opacity="0.95" />
            {/* Vernier divisions (0-10) */}
            {[0, 2, 4, 6, 8, 10].map(v => (
              <line key={v} x1={95 + v * 7} y1="65" x2={95 + v * 7} y2="78" stroke="#0f172a" strokeWidth="1.2" />
            ))}
            <text x="92" y="90" className="text-[8px] font-mono font-black fill-emerald-800">0.1mm</text>
            {/* Thumb Lock Nut */}
            <rect x="130" y="48" width="22" height="15" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          </g>

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="30" y="15">Inside Jaws</text>
              <text x="25" y="205">Outside Jaws</text>
              <text x="220" y="55">Main Metric Scale (cm/mm)</text>
              <text x="170" y="180">Sliding Vernier Scale (0.1 mm precision)</text>
              <text x="75" y="150" className="text-[9px] font-black fill-amber-900">{readingMm} mm</text>
            </g>
          )}
        </svg>
      );
    }

    case 'eureka_can': {
      return (
        <svg viewBox="0 0 360 320" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Can Cylinder Body */}
          <rect x="70" y="90" width="120" height="180" rx="4" fill="#94a3b8" stroke="#334155" strokeWidth="3" />
          <ellipse cx="130" cy="90" rx="60" ry="12" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />

          {/* Angled Overflow Spout */}
          <path d="M190 120 L240 160 L245 168 L190 135 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2" />

          {/* Water Inside Can */}
          <rect x="73" y="125" width="114" height="142" fill="#38bdf8" opacity="0.75" />
          {/* Submerged Stone Tied to Thread */}
          <line x1="130" y1="50" x2="130" y2="180" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
          <path d="M115 180 C110 170, 145 165, 150 180 C155 195, 135 210, 120 205 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />

          {/* Overflow Stream of Water Falling from Spout */}
          <path d="M242 165 Q245 200 255 240" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="5,2" />

          {/* Receiving Graduated Cylinder */}
          <rect x="235" y="210" width="40" height="90" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" opacity="0.9" />
          <rect x="237" y="255" width="36" height="43" fill="#38bdf8" opacity="0.8" />
          <line x1="260" y1="230" x2="273" y2="230" stroke="#0f172a" strokeWidth="1" />
          <line x1="260" y1="250" x2="273" y2="250" stroke="#0f172a" strokeWidth="1" />
          <line x1="260" y1="270" x2="273" y2="270" stroke="#0f172a" strokeWidth="1" />

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="80" y="70">Displacement (Eureka) Can</text>
              <text x="210" y="115">Overflow Spout</text>
              <text x="75" y="215">Submerged Solid</text>
              <text x="200" y="315">Displaced Volume (V)</text>
            </g>
          )}
        </svg>
      );
    }

    case 'separating_funnel': {
      const tapOpen = interactiveState?.tapOpen ?? false;
      return (
        <svg viewBox="0 0 300 400" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Top Stopper */}
          <polygon points="135,30 165,30 160,55 140,55" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
          <rect x="138" y="55" width="24" height="20" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />

          {/* Pear-shaped Glass Bulb */}
          <path d="M138 75 C80 95, 75 190, 142 260 L142 300 L158 300 L158 260 C225 190, 220 95, 162 75 Z" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2.5" opacity="0.9" />

          {/* Upper Immiscible Oil Layer (Yellow) */}
          <path d="M100 120 C85 150, 95 180, 150 180 C205 180, 215 150, 200 120 Z" fill="#fbbf24" opacity="0.85" />
          <text x="135" y="155" className="text-[10px] font-black fill-amber-950">Oil Phase (Upper)</text>

          {/* Lower Aqueous Water Layer (Blue) */}
          <path d="M100 180 C110 220, 130 250, 145 260 L155 260 C170 250, 190 220, 200 180 Z" fill="#38bdf8" opacity="0.85" />
          <text x="130" y="225" className="text-[10px] font-black fill-blue-950">Water Phase (Lower)</text>

          {/* Phase Boundary Interface */}
          <line x1="100" y1="180" x2="200" y2="180" stroke="#0f172a" strokeWidth="2" strokeDasharray="3,2" />

          {/* PTFE Stopcock Valve */}
          <rect x="135" y="300" width="30" height="20" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="2" />
          {/* Tap Handle */}
          <rect x="165" y="305" width="25" height="10" rx="2" fill={tapOpen ? '#10b981' : '#ef4444'} stroke="#0f172a" strokeWidth="1.5" transform={tapOpen ? 'rotate(90 170 310)' : 'rotate(0)'} />

          {/* Delivery Stem & Drops */}
          <rect x="146" y="320" width="8" height="50" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          {tapOpen && (
            <g className="animate-bounce">
              <circle cx="150" cy="385" r="3.5" fill="#0284c7" />
            </g>
          )}

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="175" y="45">Ground Glass Stopper</text>
              <text x="215" y="185">Sharp Phase Boundary</text>
              <text x="195" y="315">PTFE Stopcock ({tapOpen ? 'OPEN' : 'CLOSED'})</text>
              <text x="165" y="365">Narrow Draining Stem</text>
            </g>
          )}
        </svg>
      );
    }

    case 'circuit_switch': {
      const isClosed = interactiveState?.isClosed ?? true;
      return (
        <svg viewBox="0 0 380 260" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Insulated Bakelite Base */}
          <rect x="60" y="150" width="260" height="80" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />

          {/* Binding Screw Terminals */}
          <circle cx="100" cy="180" r="10" fill="#d97706" stroke="#78350f" strokeWidth="2" />
          <circle cx="280" cy="180" r="10" fill="#d97706" stroke="#78350f" strokeWidth="2" />

          {/* Connecting Red & Black Wires */}
          <path d="M100 180 C40 180, 20 80, 80 40 L160 40" fill="none" stroke="#dc2626" strokeWidth="4" />
          <path d="M280 180 C340 180, 360 80, 300 40 L220 40" fill="none" stroke="#0f172a" strokeWidth="4" />

          {/* Miniature Torch Bulb & Socket */}
          <g transform="translate(170, 20)">
            <ellipse cx="20" cy="35" rx="15" ry="18" fill={isClosed ? '#fef08a' : '#e2e8f0'} stroke="#64748b" strokeWidth="2" />
            <path d="M15 35 Q20 25 25 35" fill="none" stroke="#b45309" strokeWidth="1.5" />
            <rect x="12" y="45" width="16" height="12" fill="#d97706" />
            {isClosed && (
              <g className="animate-pulse">
                <circle cx="20" cy="35" r="28" fill="#fbbf24" opacity="0.3" />
                <line x1="5" y1="20" x2="-2" y2="10" stroke="#f59e0b" strokeWidth="2" />
                <line x1="35" y1="20" x2="42" y2="10" stroke="#f59e0b" strokeWidth="2" />
                <line x1="20" y1="10" x2="20" y2="0" stroke="#f59e0b" strokeWidth="2" />
              </g>
            )}
          </g>

          {/* Knife Blade Switch Contact */}
          <circle cx="120" cy="180" r="6" fill="#fbbf24" />
          <circle cx="260" cy="180" r="6" fill="#fbbf24" />

          {/* Brass Knife Blade */}
          {isClosed ? (
            /* Closed Circuit */
            <path d="M120 180 L260 180" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          ) : (
            /* Open Circuit (Blade lifted 40 degrees) */
            <path d="M120 180 L240 110" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          )}

          {/* Insulated Grip Handle */}
          <rect x={isClosed ? "250" : "235"} y={isClosed ? "174" : "102"} width="18" height="12" rx="3" fill="#dc2626" />

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="140" y="80">{isClosed ? 'Closed Loop (Current Active)' : 'Open Loop (Broken Circuit)'}</text>
              <text x="75" y="215">Terminal Screw</text>
              <text x="150" y="215">Brass Knife Switch ({isClosed ? 'CLOSED' : 'OPEN'})</text>
              <text x="250" y="215">Insulated Handle</text>
            </g>
          )}
        </svg>
      );
    }

    case 'magnet': {
      return (
        <svg viewBox="0 0 380 240" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="northRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="southBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>

          {/* Magnetic Flux Field Lines */}
          <g stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="4,3">
            <path d="M130 90 C130 30, 250 30, 250 90" />
            <path d="M130 80 C110 -10, 270 -10, 250 80" />
            <path d="M130 150 C130 210, 250 210, 250 150" />
            <path d="M130 160 C110 250, 270 250, 250 160" />
          </g>

          {/* Directional Arrows on Field Lines (N to S) */}
          <polygon points="190,40 196,44 190,48" fill="#475569" />
          <polygon points="190,195 196,199 190,203" fill="#475569" />

          {/* Permanent Bar Magnet */}
          {/* North Half (Red) */}
          <rect x="90" y="90" width="100" height="60" rx="4" fill="url(#northRed)" stroke="#7f1d1d" strokeWidth="2.5" />
          <text x="130" y="130" className="text-2xl font-black fill-white tracking-widest">N</text>

          {/* South Half (Blue) */}
          <rect x="190" y="90" width="100" height="60" rx="4" fill="url(#southBlue)" stroke="#1e3a8a" strokeWidth="2.5" />
          <text x="235" y="130" className="text-2xl font-black fill-white tracking-widest">S</text>

          {/* Neutral Divider Line */}
          <line x1="190" y1="90" x2="190" y2="150" stroke="#f8fafc" strokeWidth="2" />

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="100" y="80">North Pole (Flux Exits)</text>
              <text x="210" y="80">South Pole (Flux Enters)</text>
              <text x="135" y="230">Curved Magnetic Flux Lines</text>
            </g>
          )}
        </svg>
      );
    }

    case 'reagent_bottle': {
      const liquidColor = interactiveState?.liquidColor ?? '#9333ea';
      const labelText = interactiveState?.labelText ?? 'Litmus Solution';
      return (
        <svg viewBox="0 0 280 340" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Amber Bottle Glass Body */}
          <rect x="80" y="100" width="120" height="190" rx="10" fill="#78350f" stroke="#451a03" strokeWidth="3" opacity="0.9" />
          <path d="M120 100 L120 70 L160 70 L160 100" fill="#78350f" stroke="#451a03" strokeWidth="2" />

          {/* Solution Volume Inside */}
          <rect x="85" y="140" width="110" height="145" rx="6" fill={liquidColor} opacity="0.8" />

          {/* Dropper Pipette Stem */}
          <line x1="140" y1="40" x2="140" y2="240" stroke="#cbd5e1" strokeWidth="4" />
          {/* Rubber Teat Bulb */}
          <path d="M130 40 C130 20, 150 20, 150 40 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />

          {/* Official Chemical Reagent White Label */}
          <rect x="95" y="150" width="90" height="85" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="102" y="170" className="text-[9px] font-black fill-slate-900">{labelText}</text>
          <text x="102" y="185" className="text-[7px] font-bold fill-slate-500">CBC JSS Standard Reagent</text>
          <line x1="102" y1="190" x2="175" y2="190" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="102" y="196" width="16" height="16" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
          <text x="106" y="208" className="text-[9px] font-black fill-red-700">!</text>
          <text x="122" y="208" className="text-[8px] font-bold fill-slate-700">Lab Grade</text>

          {showLabels && (
            <g className="text-[10px] font-bold fill-slate-700">
              <text x="160" y="30">Rubber Teat Bulb</text>
              <text x="35" y="85">Glass Neck</text>
              <text x="30" y="180">Amber UV Glass</text>
              <text x="95" y="315">500ml Storage Capacity</text>
            </g>
          )}
        </svg>
      );
    }

    default:
      return (
        <svg viewBox="0 0 300 300" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="50" y="50" width="200" height="200" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="150" cy="150" r="50" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <path d="M135 150 L145 160 L165 140" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="85" y="225" className="text-xs font-bold fill-slate-700">Standard CBC Laboratory Unit</text>
        </svg>
      );
  }
};
