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
  // Official image asset path provided by user
  const logoSrc = "/assets/aistudio/WhatsApp_Image_2026-10-22_at_12.24.43_41514bbb.jpeg";

  // Dimensions based on size preset
  const sizeMap: Record<string, { width: number; height: number; classDim: string }> = {
    xs: { width: 28, height: 28, classDim: 'w-7 h-7' },
    sm: { width: 38, height: 38, classDim: 'w-10 h-10' },
    md: { width: 54, height: 54, classDim: 'w-13 h-13' },
    lg: { width: 84, height: 84, classDim: 'w-20 h-20' },
    xl: { width: 120, height: 120, classDim: 'w-30 h-30' },
    '2xl': { width: 180, height: 180, classDim: 'w-44 h-44' },
    doc: { width: 136, height: 136, classDim: 'w-34 h-34' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Variant: horizontal (emblem + text)
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <div 
          className="rounded-xl overflow-hidden bg-white p-0.5 shrink-0 flex items-center justify-center border border-slate-200 shadow-xs"
          style={{ width: currentSize.width, height: currentSize.height }}
        >
          <img
            src={logoSrc}
            alt="Edu-Smart PORTAL By Gadsa Systems Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="leading-tight text-left">
          <div className="font-sans font-black tracking-tight text-base sm:text-lg">
            <span className="text-[#0B3075]">Edu-</span>
            <span className="text-[#F5A623]">Smart</span>{' '}
            <span className="text-[#0B3075] text-xs uppercase tracking-widest font-extrabold ml-1">PORTAL</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 tracking-wider">
            By Gadsa Systems
          </div>
        </div>
      </div>
    );
  }

  // Variant: emblem (compact crest image in container)
  if (variant === 'emblem') {
    return (
      <div 
        className={`rounded-2xl overflow-hidden bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs border border-white/60 ${className}`}
        style={{ width: currentSize.width, height: currentSize.height }}
      >
        <img
          src={logoSrc}
          alt="Edu-Smart PORTAL Logo"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Variant: badge (pill with small logo + Gadsa text)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs ${className}`}>
        <img
          src={logoSrc}
          alt="Edu-Smart PORTAL"
          className="w-5 h-5 object-contain"
        />
        <span className="text-xs font-bold text-slate-800">
          <span className="text-[#0B3075]">Edu-</span>
          <span className="text-[#F5A623]">Smart</span>{' '}
          <span className="text-[10px] text-blue-900 font-semibold">By Gadsa</span>
        </span>
      </div>
    );
  }

  // Default: full graphic image
  return (
    <div 
      className={`inline-flex flex-col items-center justify-center ${className}`}
      style={{ width: currentSize.width, height: currentSize.height }}
    >
      <img
        src={logoSrc}
        alt="Edu-Smart PORTAL By Gadsa Systems"
        className="w-full h-full object-contain drop-shadow-xs"
      />
    </div>
  );
};
