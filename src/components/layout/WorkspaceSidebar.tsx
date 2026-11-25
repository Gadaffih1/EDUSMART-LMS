import React, { useEffect, useMemo, useState } from 'react';
import { Bot, ChevronDown, ChevronRight, ExternalLink, LucideIcon, Menu, X } from 'lucide-react';

export interface WorkspaceSidebarExternalLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  title?: string;
}

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
  onOpenMobile?: () => void;
  themeColor?: 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber' | 'slate' | 'teal';
  footerNote?: string;
  statusText?: string;
  showMobileBottomNav?: boolean;
  bottomExternalLinks?: WorkspaceSidebarExternalLink[];
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

const themeAccentText: Record<string, string> = {
  emerald: 'text-emerald-700',
  blue: 'text-blue-700',
  indigo: 'text-indigo-700',
  purple: 'text-purple-700',
  amber: 'text-amber-700',
  teal: 'text-teal-700',
  slate: 'text-slate-900',
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
  onOpenMobile,
  themeColor = 'emerald',
  footerNote = 'CBC Competency & Security',
  statusText = 'Online',
  showMobileBottomNav = true,
  bottomExternalLinks,
}: WorkspaceSidebarProps<T>) => {
  const activeGradient = themeActiveGradients[themeColor] || themeActiveGradients.emerald;
  const badgeBorder = themeBadgeColors[themeColor] || themeBadgeColors.emerald;
  const accentText = themeAccentText[themeColor] || themeAccentText.emerald;

  // Allow mobile/desktop users to collapse or expand navigation categories
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);

  const drawerOpen = isOpenMobile || internalDrawerOpen;
  const closeDrawer = () => {
    setInternalDrawerOpen(false);
    onCloseMobile();
  };
  const openDrawer = () => {
    if (onOpenMobile) {
      onOpenMobile();
    } else {
      setInternalDrawerOpen(true);
    }
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const quickBottomItems = useMemo(() => flatItems.slice(0, 4), [flatItems]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Collapsible Navigation Drawer (Mobile) & Persistent Rail (Desktop) */}
      <aside
        aria-label={`${portalTitle} navigation`}
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto
          w-[min(17.5rem,85vw)] lg:w-64 lg:min-w-64 lg:max-w-64 bg-slate-900 border-r border-slate-800 text-slate-300
          flex flex-col shrink-0 transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Navigation drawer header with mobile Close button */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xl shrink-0">{portalIcon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-white uppercase tracking-wider truncate">
                {portalTitle}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {portalSubtitle}
              </div>
            </div>
          </div>
          <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeBorder}`}>
            {portalBadge}
          </span>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close navigation drawer"
            className="lg:hidden min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expandable/Collapsible Module Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          {groups.map((group, gIdx) => {
            const hasActiveItem = group.items.some((i) => i.id === activeTab);
            const isCollapsed = Boolean(collapsedGroups[group.title]) && !hasActiveItem;

            return (
              <div key={gIdx} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={!isCollapsed}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <span className="truncate">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => {
                            onSelectTab(item.id);
                            closeDrawer();
                          }}
                          className={`
                            w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all text-left cursor-pointer
                            ${isActive
                              ? activeGradient
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 ${item.badgeColor || 'bg-slate-700'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {bottomExternalLinks && bottomExternalLinks.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              {bottomExternalLinks.map((link) => {
                const LinkIcon = link.icon || Bot;
                return (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeDrawer}
                    title={link.title || link.label}
                    className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LinkIcon className="w-4 h-4 shrink-0 text-white" />
                      <span className="truncate">{link.label}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-85" />
                  </a>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom Portal Stamp */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="truncate pr-2">{footerNote}</span>
          <span className="text-emerald-400 font-bold shrink-0">{statusText}</span>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar for Top 4 Frequent Modules + Drawer Menu */}
      {showMobileBottomNav && quickBottomItems.length > 0 && (
        <nav
          aria-label={`${portalTitle} quick navigation`}
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-safe"
        >
          <div className="grid grid-cols-5 h-14 max-w-screen-md mx-auto">
            {quickBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    closeDrawer();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition-colors cursor-pointer min-w-0 ${
                    isActive ? accentText : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-full leading-tight">
                    {item.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open all modules menu"
              className={`flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition-colors cursor-pointer ${
                drawerOpen ? accentText : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Menu className="w-4 h-4 shrink-0" />
              <span className="leading-tight">Modules</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
