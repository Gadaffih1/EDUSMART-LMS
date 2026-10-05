import React, { useState } from 'react';
import { User, AppNotification, NotificationCategory } from '../../types';
import { Storage } from '../../utils/storage';
import { useNotificationLayout, NotificationPanelWidth } from '../../context/NotificationLayoutContext';
import { 
  Bell, 
  CheckCheck, 
  Award, 
  ShieldCheck, 
  Megaphone, 
  X, 
  ChevronRight, 
  Clock, 
  BookOpen,
  Maximize2,
  Minimize2,
  Eye,
  Columns,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NotificationDrawerProps {
  currentUser: User;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  currentUser,
  onSelectNotification
}) => {
  const { 
    isNotificationOpen, 
    closeNotifications, 
    panelWidth, 
    setPanelWidth,
    refreshUnreadCount 
  } = useNotificationLayout();

  const [filter, setFilter] = useState<'all' | 'unread' | 'assignment' | 'grade' | 'announcement'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    Storage.getNotifications(currentUser)
  );

  // If closed, don't render anything
  if (!isNotificationOpen) return null;

  const refreshData = () => {
    const fresh = Storage.getNotifications(currentUser);
    setNotifications(fresh);
    refreshUnreadCount();
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    Storage.markNotificationAsRead(id, currentUser.id);
    refreshData();
  };

  const handleMarkAllAsRead = () => {
    Storage.markAllNotificationsAsRead(currentUser.id);
    refreshData();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Storage.deleteNotification(id);
    refreshData();
  };

  const handleClickItem = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    if (notif.linkTab) {
      window.dispatchEvent(new CustomEvent('workspace-nav-tab', { detail: notif.linkTab }));
    }
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  // Filtered list
  const filtered = notifications.filter(n => {
    const isUnread = !n.readByUserIds?.includes(currentUser.id);
    if (filter === 'unread') return isUnread;
    if (filter === 'assignment') return n.category === 'assignment';
    if (filter === 'grade') return n.category === 'grade';
    if (filter === 'announcement') return n.category === 'announcement';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.readByUserIds?.includes(currentUser.id)).length;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'grade':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'safety':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'system':
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'grade':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'safety':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'announcement':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Determine width class for docked desktop sidebar
  const getWidthClass = (width: NotificationPanelWidth) => {
    switch (width) {
      case 'compact':
        return 'md:w-72 lg:w-80'; // ~288px - 320px: Maximum reading view
      case 'wide':
        return 'md:w-96 lg:w-[460px]'; // ~384px - 460px: Expanded notification view
      case 'standard':
      default:
        return 'md:w-80 lg:w-96'; // ~320px - 384px: Balanced view
    }
  };

  return (
    <>
      {/* Mobile Top/Bottom Drawer Controller Bar (< md) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-emerald-600 shadow-2xl flex flex-col max-h-[65vh] animate-in slide-in-from-bottom duration-250">
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">Notifications ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[10px] font-mono font-bold">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={closeNotifications}
            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 rounded-md transition-colors"
          >
            Return to Reading View
          </button>
        </div>

        {/* Mobile Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh] bg-slate-50">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No notifications in this filter.</div>
          ) : (
            filtered.map((notif) => {
              const isUnread = !notif.readByUserIds?.includes(currentUser.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer ${
                    isUnread ? 'bg-white border-emerald-400 shadow-xs' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryBadgeClass(notif.category)}`}>
                      {notif.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatTime(notif.createdAt)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{notif.title}</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">{notif.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop & Tablet Docked Sidebar (>= md):
          - Sits side-by-side with reading content in flex layout
          - NO modal overlay / backdrop
          - Adjusts reading viewing space seamlessly so NOTHING is blocked */}
      <aside 
        role="region"
        aria-label="Notification Companion Panel"
        className={`hidden md:flex flex-col border-l border-slate-200 bg-white sticky top-16 h-[calc(100vh-4rem)] shrink-0 z-20 shadow-xs transition-all duration-300 ${getWidthClass(panelWidth)}`}
      >
        {/* Header with Title & Space Controls */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-full font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[190px]">
                {currentUser.name} ({currentUser.role.replace('_', ' ')})
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Width Toggles & Maximize Reading View */}
          <div className="flex items-center gap-1">
            {/* Width Selector */}
            <div className="hidden lg:flex items-center bg-slate-200/80 p-0.5 rounded-md text-[10px] font-mono">
              <button
                onClick={() => setPanelWidth('compact')}
                className={`px-1.5 py-0.5 rounded transition-colors ${panelWidth === 'compact' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Compact Panel (Maximizes Reading Space)"
              >
                Fit
              </button>
              <button
                onClick={() => setPanelWidth('standard')}
                className={`px-1.5 py-0.5 rounded transition-colors ${panelWidth === 'standard' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Standard Reading Balance"
              >
                Std
              </button>
              <button
                onClick={() => setPanelWidth('wide')}
                className={`px-1.5 py-0.5 rounded transition-colors ${panelWidth === 'wide' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Wide Notification View"
              >
                Wide
              </button>
            </div>

            {/* Maximize Reading View (Close Notification Panel) */}
            <button
              onClick={closeNotifications}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Maximize Reading View (Close notifications panel)"
              aria-label="Maximize Reading View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={closeNotifications}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close notification panel"
              aria-label="Close notification panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unblocked Reading Notice Pill */}
        <div className="px-3.5 py-1.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reading View Unblocked</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
              title="Mark all as read"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-3.5 py-2 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'unread'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('assignment')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'assignment'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => setFilter('grade')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'grade'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Grades
          </button>
          <button
            onClick={() => setFilter('announcement')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'announcement'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Directives
          </button>
        </div>

        {/* Scrollable List of Notifications */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700">No Notifications</div>
              <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                {filter === 'unread' 
                  ? "You're all caught up! No unread alerts."
                  : 'No alerts in this category.'}
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isUnread = !notif.readByUserIds?.includes(currentUser.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3 rounded-xl border transition-all text-xs cursor-pointer relative group ${
                    isUnread
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  {/* Category + Time Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {getCategoryIcon(notif.category)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(notif.category)}`}>
                        {notif.category}
                      </span>
                      {notif.urgency === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-800 uppercase">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{formatTime(notif.createdAt)}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h4 className={`text-xs ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-800 font-semibold'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    {notif.linkTab ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5 hover:underline">
                        <span>Open {notif.linkTab.replace('_', ' ')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-slate-400">EduSmart Notice</span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="text-[10px] text-slate-500">
            Side-by-side view active
          </span>
          <button
            onClick={closeNotifications}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold text-[11px] transition-colors shadow-2xs"
            title="Expand reading view to full page"
          >
            Maximize Reading View
          </button>
        </div>
      </aside>
    </>
  );
};
