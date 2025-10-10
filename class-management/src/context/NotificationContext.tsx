"use client";
import React, { createContext, useContext, useMemo } from 'react';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';

interface NotificationProviderProps {
  userId: number | undefined;
  children: React.ReactNode;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  sseConnected: boolean;
  sseError: string | null;
  refresh: () => void;
  markAllRead: () => void;
  markAsRead: (recipientIds: number[]) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ userId, children }: NotificationProviderProps) {
  // limit 设小一些用于顶部和面板展示，完整列表页面可单独再调用 hook 或未来支持 loadMore
  const {
    notifications,
    unreadCount,
    loading,
    initialized,
    sseConnected,
    sseError,
    refresh,
    markAllRead,
    markAsRead
  } = useNotifications(userId, { poll: true, pollInterval: 30000, limit: 20, sse: true });

  if (process.env.NODE_ENV !== 'production') {
    // 只在开发模式下输出一次关键状态（可根据 userId + initialized 变化）
    console.debug('[NotificationProvider] render', { userId, initialized, sseConnected, loading });
  }

  const value: NotificationContextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    initialized,
    sseConnected,
    sseError,
    refresh,
    markAllRead,
    markAsRead
  }), [notifications, unreadCount, loading, initialized, sseConnected, sseError, refresh, markAllRead, markAsRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
