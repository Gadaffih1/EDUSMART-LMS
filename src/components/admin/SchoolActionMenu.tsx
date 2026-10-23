import React from 'react';
import {
  Award,
  BarChart3,
  Building2,
  Bus,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  IdCard,
  HeartPulse,
  KeyRound,
  School,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserPlus,
  Users,
  Utensils,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';

export type AdminActionTab =
  | 'overview'
  | 'grades'
  | 'students'
  | 'departments'
  | 'analytics'
  | 'users'
  | 'create_user'
  | 'teachers'
  | 'bulk_import'
  | 'extra_roles'
  | 'cms_hub'
  | 'doc_requests'
  | 'staff_appraisal'
  | 'permissions'
  | 'passwords'
  | 'virtual_rooms'
  | 'work_entry_audit'
  | 'timetable'
  | 'sanatorium'
  | 'lunch_register'
  | 'transport'
  | 'cocurricular'
  | 'oversight'
  | 'reports'
  | 'operations';

interface ActionItem {
  id: AdminActionTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SchoolActionMenuProps {
  activeTab: AdminActionTab;
  onSelect: (tab: AdminActionTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userCount: number;
  workLogCount: number;
}

export const SchoolActionMenu: React.FC<SchoolActionMenuProps> = ({
  activeTab,
  onSelect,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  userCount,
  workLogCount,
}) => {
  const groups: { title: string; items: ActionItem[] }[] = [
    {
      title: 'School',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: School },
        { id: 'grades', label: 'Grades & Streams', icon: GraduationCap },
        { id: 'students', label: 'Students', icon: IdCard },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'analytics', label: 'Attendance & Academic KPIs', icon: BarChart3 },
      ],
    },
    {
      title: 'People',
      items: [
        { id: 'users', label: 'User Directory', icon: Users, badge: String(userCount) },
        { id: 'create_user', label: 'Create New User Account', icon: UserPlus },
        { id: 'teachers', label: 'Staff', icon: ClipboardCheck },
        { id: 'bulk_import', label: 'Bulk Onboarding & Admissions', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Access',
      items: [
        { id: 'permissions', label: 'Role Permissions & Access Matrix', icon: Shield },
        { id: 'extra_roles', label: 'Extra Roles & Delegations', icon: ShieldCheck },
      ],
    },
    {
      title: 'Campus',
      items: [
        { id: 'cms_hub', label: 'CMS Posts, Categories & Sections', icon: SlidersHorizontal },
        { id: 'doc_requests', label: 'Document Requests Hub', icon: FileText },
        { id: 'staff_appraisal', label: 'Staff Appraisal (TSC TPAD)', icon: Award },
        { id: 'passwords', label: 'Grade Passwords Management', icon: KeyRound },
        { id: 'virtual_rooms', label: 'Google Meet Room Links', icon: Video },
        { id: 'work_entry_audit', label: 'Work Entry Sign-Ins', icon: FileText, badge: String(workLogCount) },
      ],
    },
    {
      title: 'Daily school life',
      items: [
        { id: 'timetable', label: 'Curriculum Timetable & Bell Schedule', icon: CalendarDays },
        { id: 'sanatorium', label: 'Sanatorium Logs', icon: HeartPulse },
        { id: 'lunch_register', label: 'Learner Lunch Register', icon: Utensils },
        { id: 'transport', label: 'School Transport', icon: Bus },
        { id: 'cocurricular', label: 'Co-Curricular Programmes', icon: Trophy },
      ],
    },
    {
      title: 'Leadership',
      items: [
        { id: 'oversight', label: 'Executive Oversight & Logs', icon: BarChart3 },
        { id: 'reports', label: 'Reports & Dossiers', icon: FileSpreadsheet },
        { id: 'operations', label: 'Finance, Procurement, Stores & HR', icon: Building2 },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close action menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        id="school-action-menu"
        aria-label="School actions"
        className={`fixed top-16 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-72'}`}
      >
        <div className={`flex items-center border-b border-slate-200 px-3 py-3 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">School menu</p>
            <p className="text-sm font-extrabold text-slate-900">Actions</p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:flex"
            aria-expanded={!collapsed}
            aria-controls="school-action-list"
            title={collapsed ? 'Expand action menu' : 'Collapse action menu'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            <span className="sr-only">{collapsed ? 'Expand action menu' : 'Collapse action menu'}</span>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close action menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav id="school-action-list" className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
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
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
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
