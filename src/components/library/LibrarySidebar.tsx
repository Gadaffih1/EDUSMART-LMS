import React from 'react';
import { LibraryPortalSection, SectionCategory } from './types';
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  ArrowLeftRight, 
  Bookmark, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  ShoppingBag, 
  Boxes, 
  Compass, 
  Laptop, 
  Sparkles, 
  UserCheck, 
  Calendar, 
  DoorOpen,
  PartyPopper, 
  FileText, 
  Bell, 
  ShieldCheck, 
  Settings,
  History,
  ChevronRight,
  FlaskConical
} from 'lucide-react';

interface LibrarySidebarProps {
  currentSection: LibraryPortalSection;
  onSelectSection: (section: LibraryPortalSection) => void;
  overdueCount: number;
  reservationsCount: number;
  unpaidFinesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  currentSection,
  onSelectSection,
  overdueCount,
  reservationsCount,
  unpaidFinesCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const groups: SectionCategory[] = [
    {
      title: 'OVERVIEW & CATALOGUE',
      items: [
        { id: 'dashboard' as LibraryPortalSection, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'catalogue' as LibraryPortalSection, label: 'Catalogue', icon: BookOpen },
        { id: 'books_resources' as LibraryPortalSection, label: 'Books & Resources', icon: Library }
      ]
    },
    {
      title: 'CIRCULATION & BORROWERS',
      items: [
        { id: 'issue_return' as LibraryPortalSection, label: 'Issue / Return', icon: ArrowLeftRight },
        { id: 'reservations' as LibraryPortalSection, label: 'Reservations', icon: Bookmark, badge: reservationsCount > 0 ? reservationsCount : undefined },
        { id: 'borrowers' as LibraryPortalSection, label: 'Borrowers', icon: Users },
        { id: 'overdue' as LibraryPortalSection, label: 'Overdue', icon: AlertTriangle, badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: 'bg-rose-500' },
        { id: 'fines_charges' as LibraryPortalSection, label: 'Fines & Charges', icon: DollarSign, badge: unpaidFinesCount > 0 ? `KES` : undefined }
      ]
    },
    {
      title: 'COLLECTION & INVENTORY',
      items: [
        { id: 'acquisitions' as LibraryPortalSection, label: 'Acquisitions', icon: ShoppingBag },
        { id: 'inventory' as LibraryPortalSection, label: 'Inventory', icon: Boxes },
        { id: 'shelves_locations' as LibraryPortalSection, label: 'Shelves & Locations', icon: Compass },
        { id: 'digital_library' as LibraryPortalSection, label: 'Digital Library', icon: Laptop },
        { id: 'virtual_lab' as LibraryPortalSection, label: 'Virtual LAB (JSS)', icon: FlaskConical, badge: 'Interactive', badgeColor: 'bg-emerald-600' }
      ]
    },
    {
      title: 'PROGRAMMES & ACCESS',
      items: [
        { id: 'reading_programme' as LibraryPortalSection, label: 'Reading Programme', icon: Sparkles },
        { id: 'attendance' as LibraryPortalSection, label: 'Library Attendance', icon: UserCheck },
        { id: 'timetable' as LibraryPortalSection, label: 'Library Timetable', icon: Calendar },
        { id: 'room_booking' as LibraryPortalSection, label: 'Room Booking', icon: DoorOpen, badge: 'Vacant Spots', badgeColor: 'bg-purple-600' },
        { id: 'events_programmes' as LibraryPortalSection, label: 'Events & Programmes', icon: PartyPopper }
      ]
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'reports_analytics' as LibraryPortalSection, label: 'Reports & Analytics', icon: FileText },
        { id: 'notifications' as LibraryPortalSection, label: 'Notifications', icon: Bell },
        { id: 'policies' as LibraryPortalSection, label: 'Library Policies', icon: ShieldCheck },
        { id: 'settings' as LibraryPortalSection, label: 'Settings', icon: Settings },
        { id: 'audit_trail' as LibraryPortalSection, label: 'Audit Trail', icon: History }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed lg:static top-16 bottom-0 left-0 z-40
        w-64 bg-slate-900 border-r border-slate-800 text-slate-300
        flex flex-col transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation tree title */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">LIBRARY PORTAL</div>
              <div className="text-[10px] text-slate-400 font-mono">EduSmart Information Hub</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            v2.6
          </span>
        </div>

        {/* Scrollable tree list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar text-xs">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all text-left cursor-pointer
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white ${item.badgeColor || 'bg-purple-500'}`}>
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

        {/* Bottom Profile Stamp */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Dewey Decimal & CBC Indexed</span>
          <span className="text-emerald-400 font-bold">● Online</span>
        </div>
      </aside>
    </>
  );
};
