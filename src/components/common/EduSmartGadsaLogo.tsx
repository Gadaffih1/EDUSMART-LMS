import React from 'react';

interface EduSmartGadsaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'doc';
  variant?: 'full' | 'emblem' | 'horizontal' | 'badge';
  monochrome?: boolean;
}

export const EduSmartGadsaLogo: React.FC<EduSmartGadsaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  monochrome = false
}) => {
  // Dimensions based on size preset
  const sizeMap = {
    xs: { width: 32, height: 32, scale: 0.16 },
    sm: { width: 44, height: 44, scale: 0.22 },
    md: { width: 64, height: 64, scale: 0.32 },
    lg: { width: 96, height: 96, scale: 0.48 },
    xl: { width: 140, height: 140, scale: 0.7 },
    '2xl': { width: 220, height: 220, scale: 1.1 },
    doc: { width: 160, height: 160, scale: 0.8 }
  };

  const blue = monochrome ? 'currentColor' : '#0B3075';
  const gold = monochrome ? 'currentColor' : '#F5A623';
  const pillBlue = monochrome ? 'currentColor' : '#08255B';
  const white = '#FFFFFF';

  // If variant is 'horizontal', show emblem on left and clean branded typography on right
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <svg
          viewBox="0 0 200 200"
          className="shrink-0"
          style={{ width: size === 'xs' ? 28 : size === 'sm' ? 36 : size === 'lg' ? 60 : 44, height: 'auto' }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular Yellow Arc */}
          <path
            d="M 32 100 A 70 70 0 1 1 168 100"
            stroke={gold}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Graduation Cap Mortarboard */}
          <polygon
            points="100,24 162,54 100,76 38,54"
            fill={blue}
          />
          {/* Cap Skull Base */}
          <path
            d="M 68 65 Q 100 85 132 65 L 130 84 Q 100 98 70 84 Z"
            fill={blue}
          />
          {/* Golden Tassel */}
          <path
            d="M 100 50 Q 150 56 156 80 L 159 104"
            stroke={gold}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon
            points="155,103 163,103 161,118 157,118"
            fill={gold}
          />

          {/* Laptop Screen Bezel */}
          <rect
            x="56"
            y="76"
            width="88"
            height="58"
            rx="5"
            fill={blue}
          />
          {/* Inner Laptop Screen */}
          <rect
            x="62"
            y="81"
            width="76"
            height="46"
            rx="2"
            fill={white}
          />

          {/* Celebratory Student Figure in Laptop */}
          <circle cx="100" cy="95" r="9" fill={blue} />
          <path
            d="M 72 100 Q 86 112 100 125 Q 114 112 128 100 L 123 118 Q 100 134 77 118 Z"
            fill={blue}
          />

          {/* Laptop Base & Keyboard Plate */}
          <path
            d="M 46 134 L 154 134 L 146 148 L 54 148 Z"
            fill={blue}
          />
          <path
            d="M 88 138 L 112 138 L 110 142 L 90 142 Z"
            fill={white}
            opacity="0.9"
          />

          {/* Open Book Wings - Top Golden Pages */}
          <path
            d="M 22 148 Q 60 146 100 170 Q 140 146 178 148 Q 140 168 100 186 Q 60 168 22 148 Z"
            fill={gold}
          />
          {/* Open Book Wings - Lower Blue Pages */}
          <path
            d="M 18 155 Q 60 158 100 184 Q 140 158 182 155 Q 140 178 100 196 Q 60 178 18 155 Z"
            fill={blue}
          />
        </svg>

        <div className="flex flex-col leading-none">
          <div className="flex items-center text-lg font-black tracking-tight">
            <span style={{ color: blue }}>Edu-</span>
            <span style={{ color: gold }}>Smart</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="h-[1.5px] w-3 bg-amber-500 rounded" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: blue }}>
              PORTAL
            </span>
            <div className="h-[1.5px] w-3 bg-amber-500 rounded" />
          </div>
          <div className="mt-1">
            <span 
              className="text-[9px] font-bold italic text-white px-2 py-0.5 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: pillBlue, border: `1px solid ${gold}` }}
            >
              By Gadsa Systems
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If variant is 'emblem', only show the crest
  if (variant === 'emblem') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={className}
        style={{ width: sizeMap[size].width, height: sizeMap[size].height }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circular Yellow Arc */}
        <path
          d="M 32 100 A 70 70 0 1 1 168 100"
          stroke={gold}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Graduation Cap Mortarboard */}
        <polygon
          points="100,24 162,54 100,76 38,54"
          fill={blue}
        />
        {/* Cap Skull Base */}
        <path
          d="M 68 65 Q 100 85 132 65 L 130 84 Q 100 98 70 84 Z"
          fill={blue}
        />
        {/* Golden Tassel */}
        <path
          d="M 100 50 Q 150 56 156 80 L 159 104"
          stroke={gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <polygon
          points="155,103 163,103 161,118 157,118"
          fill={gold}
        />

        {/* Laptop Screen Bezel */}
        <rect
          x="56"
          y="76"
          width="88"
          height="58"
          rx="5"
          fill={blue}
        />
        {/* Inner Laptop Screen */}
        <rect
          x="62"
          y="81"
          width="76"
          height="46"
          rx="2"
          fill={white}
        />

        {/* Celebratory Student Figure in Laptop */}
        <circle cx="100" cy="95" r="9" fill={blue} />
        <path
          d="M 72 100 Q 86 112 100 125 Q 114 112 128 100 L 123 118 Q 100 134 77 118 Z"
          fill={blue}
        />

        {/* Laptop Base & Keyboard Plate */}
        <path
          d="M 46 134 L 154 134 L 146 148 L 54 148 Z"
          fill={blue}
        />
        <path
          d="M 88 138 L 112 138 L 110 142 L 90 142 Z"
          fill={white}
          opacity="0.9"
        />

        {/* Open Book Wings - Top Golden Pages */}
        <path
          d="M 22 148 Q 60 146 100 170 Q 140 146 178 148 Q 140 168 100 186 Q 60 168 22 148 Z"
          fill={gold}
        />
        {/* Open Book Wings - Lower Blue Pages */}
        <path
          d="M 18 155 Q 60 158 100 184 Q 140 158 182 155 Q 140 178 100 196 Q 60 178 18 155 Z"
          fill={blue}
        />
      </svg>
    );
  }

  // Default: 'full' complete official logo exactly matching GADSA-SYSTEMS.jpeg
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 300 300"
        style={{ width: sizeMap[size].width, height: sizeMap[size].height }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xs"
      >
        {/* 1. Yellow Outer Halo Arc */}
        <path
          d="M 48 135 A 88 88 0 1 1 252 135"
          stroke={gold}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* 2. Graduation Cap Mortarboard */}
        <polygon
          points="150,30 236,70 150,100 64,70"
          fill={blue}
        />
        {/* Cap Base Ring */}
        <path
          d="M 104 86 Q 150 114 196 86 L 193 110 Q 150 128 107 110 Z"
          fill={blue}
        />
        {/* Golden Tassel */}
        <path
          d="M 150,68 Q 220,74 228,110 L 232,140"
          stroke={gold}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <polygon
          points="226,138 238,138 235,160 229,160"
          fill={gold}
        />

        {/* 3. Blue Laptop Monitor */}
        <rect
          x="88"
          y="102"
          width="124"
          height="82"
          rx="7"
          fill={blue}
        />
        {/* White Screen Canvas */}
        <rect
          x="97"
          y="109"
          width="106"
          height="66"
          rx="3"
          fill={white}
        />

        {/* 4. Celebratory Learner with Raised Arms */}
        <circle cx="150" cy="128" r="13" fill={blue} />
        <path
          d="M 112 135 Q 131 152 150 170 Q 169 152 188 135 L 180 160 Q 150 182 120 160 Z"
          fill={blue}
        />

        {/* 5. Laptop Base / Keyboard */}
        <path
          d="M 74 182 L 226 182 L 214 202 L 86 202 Z"
          fill={blue}
        />
        <path
          d="M 132 187 L 168 187 L 165 193 L 135 193 Z"
          fill={white}
          opacity="0.9"
        />

        {/* 6. Open Book Wing Pages (Top Gold Layer) */}
        <path
          d="M 38 202 Q 94 200 150 234 Q 206 200 262 202 Q 206 230 150 255 Q 94 230 38 202 Z"
          fill={gold}
        />

        {/* 7. Open Book Wing Pages (Bottom Blue Layer) */}
        <path
          d="M 32 212 Q 94 216 150 252 Q 206 216 268 212 Q 206 244 150 270 Q 94 244 32 212 Z"
          fill={blue}
        />
      </svg>

      {/* Main Brand Typography: Edu-Smart */}
      <div className="flex items-center justify-center font-black tracking-tighter text-center mt-1" style={{ fontSize: size === 'xs' ? '12px' : size === 'sm' ? '15px' : size === 'md' ? '22px' : size === 'lg' ? '30px' : size === 'xl' ? '40px' : '48px', lineHeight: 1 }}>
        <span style={{ color: blue }} className="font-extrabold tracking-tight">Edu-</span>
        <span style={{ color: gold }} className="font-extrabold tracking-tight">Smart</span>
      </div>

      {/* Sub-Brand: P O R T A L flanked by golden lines */}
      <div className="flex items-center justify-center w-full gap-2 my-1">
        <div className="h-[2px] flex-1 bg-amber-500 rounded-full max-w-[45px]" />
        <span 
          className="font-black uppercase tracking-[0.32em] text-center"
          style={{ 
            color: blue, 
            fontSize: size === 'xs' ? '8px' : size === 'sm' ? '9px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px' 
          }}
        >
          PORTAL
        </span>
        <div className="h-[2px] flex-1 bg-amber-500 rounded-full max-w-[45px]" />
      </div>

      {/* Pill Badge: By Gadsa Systems */}
      <div className="flex items-center justify-center gap-1.5 w-full">
        <div className="h-[2px] w-3 bg-amber-500 rounded-full hidden sm:block" />
        <div 
          className="rounded-full px-3 py-0.5 text-center shadow-xs flex items-center justify-center"
          style={{
            backgroundColor: pillBlue,
            border: `1.5px solid ${gold}`,
          }}
        >
          <span 
            className="text-white font-extrabold italic whitespace-nowrap"
            style={{ 
              fontSize: size === 'xs' ? '7px' : size === 'sm' ? '8px' : size === 'md' ? '10px' : size === 'lg' ? '13px' : '15px' 
            }}
          >
            By Gadsa Systems
          </span>
        </div>
        <div className="h-[2px] w-3 bg-amber-500 rounded-full hidden sm:block" />
      </div>
    </div>
  );
};
