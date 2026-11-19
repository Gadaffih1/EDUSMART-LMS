import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, SlidersHorizontal, ArrowLeftRight } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  summaryText?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  defaultOpenDesktop?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-first expandable/collapsible section for lengthy profiles,
 * academic records, financial ledgers, HR dossiers, and settings.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  summaryText,
  icon,
  defaultOpen = false,
  defaultOpenDesktop = true,
  headerRight,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return defaultOpenDesktop;
    }
    return defaultOpen;
  });

  const contentId = React.useId();

  return (
    <section
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          {icon && (
            <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
              {title}
            </h3>
            {(subtitle || summaryText) && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {subtitle}
                {subtitle && summaryText ? ' · ' : ''}
                {summaryText && (
                  <span className="font-semibold text-slate-700 tabular-nums">{summaryText}</span>
                )}
              </p>
            )}
          </div>
          <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </button>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {isOpen && (
        <div id={contentId} className="p-4 sm:p-5">
          {children}
        </div>
      )}
    </section>
  );
};

export interface OverflowMenuItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Touch-friendly 3-dot overflow menu to keep primary actions prominent
 * while neatly organizing secondary actions without crowding on smartphones.
 */
export const MobileOverflowMenu: React.FC<{
  items: OverflowMenuItem[];
  label?: string;
  align?: 'left' | 'right';
}> = ({ items, label = 'More actions', align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 space-y-0.5`}
        >
          {items.map((item, idx) => {
            const isDanger = item.danger || item.variant === 'danger';
            return (
              <button
                key={item.id ?? `${item.label}-${idx}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  isDanger
                    ? 'text-rose-700 hover:bg-rose-50'
                    : item.variant === 'primary'
                    ? 'text-indigo-700 hover:bg-indigo-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Expandable filter panel so search remains immediate while advanced
 * filters stay collapsed on smartphones until requested.
 */
export const CollapsibleFilterBar: React.FC<{
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  primaryAction?: React.ReactNode;
  filters?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  activeFilterCount = 0,
  onClearFilters,
  primaryAction,
  filters,
  children,
}) => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const filterContent = filters ?? children;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {filterContent && (
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              aria-expanded={filtersExpanded}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                filtersExpanded || activeFilterCount > 0
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            </button>
          )}
          {onClearFilters && activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          )}
          {primaryAction}
        </div>
      </div>

      {filterContent && (
        <div className={`${filtersExpanded ? 'block' : 'hidden md:block'}`}>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filterContent}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Controlled horizontal scroll wrapper for comparison matrices (e.g. Timetables, RBAC grids)
 * with an explicit mobile scroll cue and zero page-level overflow.
 */
export const ScrollableMatrixTableWrapper: React.FC<{
  children: React.ReactNode;
  hint?: string;
  className?: string;
}> = ({ children, hint = 'Swipe horizontally to view all columns', className = '' }) => (
  <div className={`w-full max-w-full space-y-1.5 ${className}`}>
    <div className="md:hidden flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-600">
      <span>{hint}</span>
      <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
    </div>
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 edusmart-scroll-container">
      {children}
    </div>
  </div>
);

export interface ResponsiveKpiItem {
  id: string;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: 'default' | 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo';
  icon?: React.ReactNode;
}

/**
 * Responsive KPI card strip: displays 2 compact cards per row on mobile
 * with a View All toggle when > 4 exist, expanding to 4 columns on desktop.
 */
export const ResponsiveKpiStrip: React.FC<{
  items: ResponsiveKpiItem[];
  mobileInitialCount?: number;
}> = ({ items, mobileInitialCount = 4 }) => {
  const [showAllMobile, setShowAllMobile] = useState(false);

  const toneText: Record<string, string> = {
    default: 'text-slate-900',
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    indigo: 'text-indigo-700',
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => {
          const hiddenOnMobile = !showAllMobile && idx >= mobileInitialCount;
          return (
            <div
              key={item.id}
              className={`${hiddenOnMobile ? 'hidden sm:flex' : 'flex'} flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs min-w-0`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 leading-snug line-clamp-2">
                  {item.label}
                </span>
                {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
              </div>
              <div className="mt-2">
                <div className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate ${toneText[item.tone || 'default']}`}>
                  {item.value}
                </div>
                {item.sublabel && (
                  <div className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                    {item.sublabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {items.length > mobileInitialCount && (
        <button
          type="button"
          onClick={() => setShowAllMobile((prev) => !prev)}
          className="sm:hidden w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          {showAllMobile
            ? 'Show Fewer Metrics'
            : `View All Metrics (+${items.length - mobileInitialCount} more)`}
        </button>
      )}
    </div>
  );
};
