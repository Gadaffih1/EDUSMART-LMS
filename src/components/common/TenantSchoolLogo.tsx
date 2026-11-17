import React from 'react';
import { BookOpen, GraduationCap, School, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export interface TenantSchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'doc';
  variant?: 'full' | 'emblem' | 'horizontal' | 'badge';
  monochrome?: boolean;
  showMotto?: boolean;
}

export const TenantSchoolLogo: React.FC<TenantSchoolLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  monochrome = false,
  showMotto = true,
}) => {
  const { currentTenant } = useTenant();
  const logoSrc = currentTenant.customLogoBase64 || currentTenant.logoUrl || '';

  const sizeMap: Record<string, { width: number; height: number; iconClass: string }> = {
    xs: { width: 28, height: 28, iconClass: 'w-4 h-4' },
    sm: { width: 38, height: 38, iconClass: 'w-5 h-5' },
    md: { width: 54, height: 54, iconClass: 'w-7 h-7' },
    lg: { width: 84, height: 84, iconClass: 'w-10 h-10' },
    xl: { width: 120, height: 120, iconClass: 'w-14 h-14' },
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
      className={`rounded-xl overflow-hidden bg-white p-1 shrink-0 flex items-center justify-center border border-slate-200 ${
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
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderLogoBox()}
        <div className="leading-tight text-left min-w-0">
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
        className={`rounded-2xl overflow-hidden bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200 ${
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
