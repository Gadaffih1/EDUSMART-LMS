import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WorkspaceSidebarItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
}

export interface WorkspaceSidebarGroup<T extends string = string> {
  title: string;
  items: WorkspaceSidebarItem<T>[];
}

interface WorkspaceSidebarProps<T extends string = string> {
  portalTitle: string;
  portalSubtitle?: string;
  portalIcon?: React.ReactNode;
  portalBadge?: string;
  groups: WorkspaceSidebarGroup<T>[];
  activeTab: T;
  onSelectTab: (tab: T) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  themeColor?: 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber' | 'slate' | 'teal';
  footerNote?: string;
  statusText?: string;
}

const themeActiveGradients: Record<string, string> = {
  emerald: 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xs',
  blue: 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs',
  indigo: 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-xs',
  purple: 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs',
  amber: 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-xs',
  teal: 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-xs',
  slate: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-xs'
};

const themeBadgeColors: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  teal: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
  slate: 'bg-slate-700/50 text-slate-300 border-slate-600/30'
};

export const WorkspaceSidebar = <T extends string = string>({
  portalTitle,
  portalSubtitle = 'EduSmart Operations Hub',
  portalIcon = '🏛️',
  portalBadge = 'Portal',
  groups,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  themeColor = 'emerald',
  footerNote = 'CBC Competency & Security',
  statusText = '● Online'
}: WorkspaceSidebarProps<T>) => {
  const activeGradient = themeActiveGradients[themeColor] || themeActiveGradients.emerald;
  const badgeBorder = themeBadgeColors[themeColor] || themeBadgeColors.emerald;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-40
        w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-800 text-slate-300
        flex flex-col shrink-0 transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation tree header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-xl shrink-0">{portalIcon}</span>
            <div className="truncate">
              <div className="text-xs font-black text-white uppercase tracking-wider truncate">
                {portalTitle}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {portalSubtitle}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeBorder}`}>
            {portalBadge}
          </span>
        </div>

        {/* Scrollable buttons listed on the left */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all text-left cursor-pointer
                        ${isActive 
                          ? activeGradient
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shrink-0 ${item.badgeColor || 'bg-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile / Status Stamp */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="truncate pr-2">{footerNote}</span>
          <span className="text-emerald-400 font-bold shrink-0">{statusText}</span>
        </div>
      </aside>
    </>
  );
};
