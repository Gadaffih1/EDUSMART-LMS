import React from 'react';
import { BookOpen, GraduationCap, School, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export interface TenantSchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'doc';
  variant?: 'full' | 'emblem' | 'horizontal' | 'badge';
  monochrome?: boolean;
  showMotto?: boolean;
  /** When true on variant="horizontal", shows the crisp emblem on phones (<640px) and emblem + text on sm+ */
  compactMobile?: boolean;
}

export const TenantSchoolLogo: React.FC<TenantSchoolLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  monochrome = false,
  showMotto = true,
  compactMobile = false,
}) => {
  const { currentTenant } = useTenant();
  const logoSrc = currentTenant.customLogoBase64 || currentTenant.logoUrl || '';

  const sizeMap: Record<string, { width: number; height: number; iconClass: string }> = {
    xs: { width: 38, height: 38, iconClass: 'w-5 h-5' },
    sm: { width: 44, height: 44, iconClass: 'w-6 h-6' },
    md: { width: 60, height: 60, iconClass: 'w-8 h-8' },
    lg: { width: 88, height: 88, iconClass: 'w-11 h-11' },
    xl: { width: 124, height: 124, iconClass: 'w-14 h-14' },
    '2xl': { width: 180, height: 180, iconClass: 'w-20 h-20' },
    doc: { width: 96, height: 96, iconClass: 'w-12 h-12' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const renderFallbackIcon = () => {
    if (currentTenant.crestIcon === 'school') {
      return <School className={`${currentSize.iconClass} text-sky-500`} />;
    }
    if (currentTenant.crestIcon === 'book-open') {
      return <BookOpen className={`${currentSize.iconClass} text-indigo-500`} />;
    }
    if (currentTenant.crestIcon === 'shield') {
      return <Shield className={`${currentSize.iconClass} text-amber-500`} />;
    }
    return <GraduationCap className={`${currentSize.iconClass} text-amber-500`} />;
  };

  const renderLogoBox = (extraClasses = '') => (
    <div
      className={`rounded-xl overflow-hidden bg-white p-0.5 shrink-0 flex items-center justify-center border border-slate-200 ${
        monochrome ? 'grayscale' : ''
      } ${extraClasses}`}
      style={{ width: currentSize.width, height: currentSize.height }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${currentTenant.name} Official Logo`}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center">
          {renderFallbackIcon()}
        </div>
      )}
    </div>
  );

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2 sm:gap-2.5 min-w-0 ${className}`}>
        {renderLogoBox()}
        <div className={`leading-tight text-left min-w-0 ${compactMobile ? 'hidden sm:block' : ''}`}>
          <div className="font-serif font-bold tracking-tight text-sm sm:text-base text-slate-950 truncate">
            {currentTenant.name}
          </div>
          {showMotto && (
            <div className="text-[10px] font-medium text-slate-600 truncate">
              {currentTenant.motto || currentTenant.code}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div
        className={`rounded-2xl overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0 border border-slate-200 ${
          monochrome ? 'grayscale' : ''
        } ${className}`}
        style={{ width: currentSize.width, height: currentSize.height }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={`${currentTenant.name} Crest`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
            {renderFallbackIcon()}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 ${className}`}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={`${currentTenant.name}`}
            className="w-5 h-5 object-contain"
          />
        ) : (
          <School className="w-4 h-4 text-slate-700" />
        )}
        <span className="text-xs font-bold text-slate-900">{currentTenant.shortName || currentTenant.name}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${monochrome ? 'grayscale' : ''} ${className}`}
      style={{ width: currentSize.width, height: currentSize.height }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${currentTenant.name} Logo`}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center p-2">
          {renderFallbackIcon()}
        </div>
      )}
    </div>
  );
};
