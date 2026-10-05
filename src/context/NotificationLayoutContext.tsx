import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { Storage } from '../utils/storage';

export type NotificationPanelWidth = 'compact' | 'standard' | 'wide';

interface NotificationLayoutContextType {
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  panelWidth: NotificationPanelWidth;
  setPanelWidth: (width: NotificationPanelWidth) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => void;
  activeNotification: AppNotification | null;
  setActiveNotification: (notif: AppNotification | null) => void;
}

const NotificationLayoutContext = createContext<NotificationLayoutContextType | undefined>(undefined);

export const NotificationLayoutProvider: React.FC<{
  children: React.ReactNode;
  currentUser: User | null;
}> = ({ children, currentUser }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState<NotificationPanelWidth>('standard');
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);

  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (!currentUser) return 0;
    return Storage.getUnreadNotificationCount(currentUser);
  });

  // Re-sync unread count whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUnreadCount(Storage.getUnreadNotificationCount(currentUser));
    } else {
      setUnreadCount(0);
      setIsNotificationOpen(false);
    }
  }, [currentUser]);

  const refreshUnreadCount = () => {
    if (currentUser) {
      setUnreadCount(Storage.getUnreadNotificationCount(currentUser));
    }
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(prev => !prev);
  };

  const openNotifications = () => {
    setIsNotificationOpen(true);
  };

  const closeNotifications = () => {
    setIsNotificationOpen(false);
  };

  return (
    <NotificationLayoutContext.Provider
      value={{
        isNotificationOpen,
        setIsNotificationOpen,
        toggleNotifications,
        openNotifications,
        closeNotifications,
        panelWidth,
        setPanelWidth,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        activeNotification,
        setActiveNotification
      }}
    >
      {children}
    </NotificationLayoutContext.Provider>
  );
};

export const useNotificationLayout = (): NotificationLayoutContextType => {
  const context = useContext(NotificationLayoutContext);
  if (!context) {
    throw new Error('useNotificationLayout must be used within a NotificationLayoutProvider');
  }
  return context;
};
