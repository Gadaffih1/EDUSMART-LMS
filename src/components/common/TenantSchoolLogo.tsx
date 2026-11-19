import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, School, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant } from '../../types/tenant';
import { INITIAL_TENANTS } from '../../data/tenantsData';

const PRESET_LOGO_MAP = new Map<string, string>(
  INITIAL_TENANTS
    .map((t): [string, string] => [t.id, t.logoUrl || ''])
    .filter(([, url]) => Boolean(url))
);

export function resolveTenantLogoSources(tenant?: Partial<Tenant> | null): string[] {
  if (!tenant) return [];
  const candidates = [
    typeof tenant.customLogoBase64 === 'string' ? tenant.customLogoBase64.trim() : '',
    typeof tenant.logoUrl === 'string' ? tenant.logoUrl.trim() : '',
    tenant.id ? PRESET_LOGO_MAP.get(tenant.id) || '' : '',
  ].filter(Boolean);
  return Array.from(new Set(candidates));
}

export function resolveTenantLogoSrc(tenant?: Partial<Tenant> | null): string {
  return resolveTenantLogoSources(tenant)[0] || '';
}

export interface TenantSchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'doc';
  variant?: 'full' | 'emblem' | 'horizontal' | 'badge';
  monochrome?: boolean;
  showMotto?: boolean;
  /** When true on variant="horizontal", shows the crisp emblem on phones (<640px) and emblem + text on sm+ */
  compactMobile?: boolean;
  /** Optional tenant override for rendering a specific school's logo outside the active context */
  tenantOverride?: Partial<Tenant>;
}

export const TenantSchoolLogo: React.FC<TenantSchoolLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  monochrome = false,
  showMotto = true,
  compactMobile = false,
  tenantOverride,
}) => {
  const { currentTenant } = useTenant();
  const tenant = tenantOverride ? { ...currentTenant, ...tenantOverride } : currentTenant;

  const logoSources = useMemo(
    () => resolveTenantLogoSources(tenant),
    [tenant.id, tenant.customLogoBase64, tenant.logoUrl]
  );
  const sourcesKey = logoSources.join('|');
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sourcesKey]);

  const activeLogoSrc = logoSources[sourceIndex] || '';

  const sizeMap: Record<
    string,
    { boxPx: number; padClass: string; radiusClass: string; iconClass: string }
  > = {
    xs: { boxPx: 40, padClass: 'p-1', radiusClass: 'rounded-xl', iconClass: 'w-5 h-5' },
    sm: { boxPx: 48, padClass: 'p-1', radiusClass: 'rounded-xl', iconClass: 'w-6 h-6' },
    md: { boxPx: 64, padClass: 'p-1.5', radiusClass: 'rounded-2xl', iconClass: 'w-8 h-8' },
    lg: { boxPx: 88, padClass: 'p-2', radiusClass: 'rounded-2xl', iconClass: 'w-11 h-11' },
    xl: { boxPx: 124, padClass: 'p-2.5', radiusClass: 'rounded-2xl', iconClass: 'w-14 h-14' },
    '2xl': { boxPx: 176, padClass: 'p-3', radiusClass: 'rounded-3xl', iconClass: 'w-20 h-20' },
    doc: { boxPx: 96, padClass: 'p-1.5', radiusClass: 'rounded-2xl', iconClass: 'w-12 h-12' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const renderFallbackIcon = () => {
    if (tenant.crestIcon === 'school') {
      return <School className={`${currentSize.iconClass} text-sky-500`} />;
    }
    if (tenant.crestIcon === 'book-open') {
      return <BookOpen className={`${currentSize.iconClass} text-indigo-500`} />;
    }
    if (tenant.crestIcon === 'shield') {
      return <Shield className={`${currentSize.iconClass} text-amber-500`} />;
    }
    return <GraduationCap className={`${currentSize.iconClass} text-amber-500`} />;
  };

  const renderLogoBox = (extraClasses = '', altSuffix = 'Official Logo') => (
    <div
      className={`edusmart-tenant-logo ${currentSize.radiusClass} bg-white ${currentSize.padClass} shrink-0 inline-flex items-center justify-center border border-slate-200/90 shadow-xs ${
        monochrome ? 'grayscale' : ''
      } ${extraClasses}`}
      style={{
        width: currentSize.boxPx,
        height: currentSize.boxPx,
        minWidth: currentSize.boxPx,
        minHeight: currentSize.boxPx,
      }}
    >
      {activeLogoSrc ? (
        <img
          src={activeLogoSrc}
          alt={`${tenant.name || 'School'} ${altSuffix}`}
          onError={() => setSourceIndex((prev) => prev + 1)}
          decoding="async"
          className="edusmart-tenant-logo-img max-w-full max-h-full w-auto h-auto object-contain block select-none"
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
      <div className={`inline-flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 ${className}`}>
        {renderLogoBox('', 'Official Logo')}
        <div className={`leading-tight text-left min-w-0 ${compactMobile ? 'hidden sm:block' : ''}`}>
          <div className="font-serif font-bold tracking-tight text-sm sm:text-base text-slate-950 truncate">
            {tenant.name}
          </div>
          {showMotto && (
            <div className="text-[10px] font-medium text-slate-600 truncate">
              {tenant.motto || tenant.code}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'emblem') {
    return renderLogoBox(className, 'Crest');
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 shrink-0 ${className}`}
      >
        <div className="edusmart-tenant-logo w-6 h-6 min-w-6 min-h-6 rounded-md bg-white p-0.5 inline-flex items-center justify-center shrink-0">
          {activeLogoSrc ? (
            <img
              src={activeLogoSrc}
              alt={`${tenant.name || 'School'} Emblem`}
              onError={() => setSourceIndex((prev) => prev + 1)}
              decoding="async"
              className="edusmart-tenant-logo-img max-w-full max-h-full w-auto h-auto object-contain block select-none"
            />
          ) : (
            <School className="w-4 h-4 text-slate-700" />
          )}
        </div>
        <span className="text-xs font-bold text-slate-900">{tenant.shortName || tenant.name}</span>
      </div>
    );
  }

  return renderLogoBox(className, 'Logo');
};

