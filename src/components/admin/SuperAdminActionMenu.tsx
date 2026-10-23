import React from 'react';
import {
  Bell,
  ChevronLeft,
  DollarSign,
  FolderPlus,
  LayoutDashboard,
  Palette,
  School,
  Sparkles,
  SpellCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

export type SuperAdminTab =
  | 'overview'
  | 'operations'
  | 'customizer'
  | 'schools'
  | 'branding'
  | 'users'
  | 'spelling'
  | 'categories'
  | 'notify';

interface ActionItem {
  id: SuperAdminTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SuperAdminActionMenuProps {
  activeTab: SuperAdminTab;
  onSelect: (tab: SuperAdminTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  schoolCount: number;
  userCount: number;
}

export const SuperAdminActionMenu: React.FC<SuperAdminActionMenuProps> = ({
  activeTab,
  onSelect,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  schoolCount,
  userCount,
}) => {
  const groups: { title: string; items: ActionItem[] }[] = [
    {
      title: 'Platform',
      items: [
        { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
        { id: 'schools', label: 'Schools & Tenancy', icon: School, badge: String(schoolCount) },
        { id: 'branding', label: 'Logo & Background', icon: Palette },
        { id: 'users', label: 'Users & Staff', icon: Users, badge: String(userCount) },
      ],
    },
    {
      title: 'Studio',
      items: [
        { id: 'customizer', label: 'Platform Studio', icon: Sparkles },
        { id: 'categories', label: 'Categories', icon: FolderPlus },
        { id: 'spelling', label: 'Spelling Corrector', icon: SpellCheck },
        { id: 'notify', label: 'Broadcast Alerts', icon: Bell },
      ],
    },
    {
      title: 'Operations',
      items: [
        { id: 'operations', label: 'Finance & Operations', icon: DollarSign },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close platform menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        id="super-admin-menu"
        aria-label="Platform actions"
        className={`fixed top-[4.75rem] bottom-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-full lg:max-h-full lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-72'}`}
      >
        <div className={`flex items-center border-b border-slate-200 px-3 py-3 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform menu</p>
            <p className="text-sm font-extrabold text-slate-900">Super Admin</p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:flex"
            aria-expanded={!collapsed}
            aria-controls="super-admin-action-list"
            title={collapsed ? 'Expand platform menu' : 'Collapse platform menu'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            <span className="sr-only">{collapsed ? 'Expand platform menu' : 'Collapse platform menu'}</span>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close platform menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav id="super-admin-action-list" className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className={`px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${collapsed ? 'lg:sr-only' : ''}`}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item.id);
                        onCloseMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.label}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                        collapsed ? 'lg:justify-center lg:px-0' : ''
                      } ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className={`min-w-0 flex-1 truncate ${collapsed ? 'lg:sr-only' : ''}`}>{item.label}</span>
                      {item.badge && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                        } ${collapsed ? 'lg:hidden' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
