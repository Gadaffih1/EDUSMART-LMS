import React, { useState } from 'react';
import { User, AppNotification, NotificationCategory } from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  Award, 
  ShieldCheck, 
  Megaphone, 
  Settings, 
  X, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface NotificationDrawerProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
  onNotificationCountChange?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectNotification,
  onNotificationCountChange
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'assignment' | 'grade' | 'announcement'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    Storage.getNotifications(currentUser)
  );

  if (!isOpen) return null;

  const refreshData = () => {
    const fresh = Storage.getNotifications(currentUser);
    setNotifications(fresh);
    const unreadCount = fresh.filter(n => !n.readByUserIds?.includes(currentUser.id)).length;
    if (onNotificationCountChange) {
      onNotificationCountChange(unreadCount);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <aside 
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="notification-drawer-title" className="text-sm font-bold text-slate-900">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-full font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Personalized alerts for {currentUser.name} ({currentUser.role.replace('_', ' ')})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close notification panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'unread'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('assignment')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'assignment'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setFilter('grade')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'grade'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Grades
          </button>
          <button
            onClick={() => setFilter('announcement')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
              filter === 'announcement'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Directives
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">No Notifications</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {filter === 'unread' 
                  ? "You're all caught up! No unread alerts."
                  : 'No notification matches the selected category.'}
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isUnread = !notif.readByUserIds?.includes(currentUser.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3.5 rounded-xl border transition-all text-xs cursor-pointer relative group ${
                    isUnread
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Category + Time Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {getCategoryIcon(notif.category)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(notif.category)}`}>
                        {notif.category}
                      </span>
                      {notif.urgency === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-800 uppercase">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatTime(notif.createdAt)}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="pr-6">
                    <h4 className={`text-xs font-bold ${isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    {notif.linkTab ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                        <span>Open {notif.linkTab.replace('_', ' ')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-slate-400">EduSmart Alert</span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Role: <strong className="text-slate-800 uppercase font-mono">{currentUser.role.replace('_', ' ')}</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold"
          >
            Close Panel
          </button>
        </div>
      </aside>
    </div>
  );
};
