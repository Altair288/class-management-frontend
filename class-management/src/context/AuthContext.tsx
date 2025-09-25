"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface AuthUser {
  id: number;
  username: string;
  userType: string; // ADMIN | TEACHER | STUDENT | others
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isStudent: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const [firstTried, setFirstTried] = useState(false);
  const pathname = usePathname();
  const [lastAttemptAt, setLastAttemptAt] = useState<number>(0);

  const load = useCallback(async () => {
    try {
      setLoadingInternal(true);
      setLastAttemptAt(Date.now());
      const res = await fetch('/api/users/current', { cache: 'no-store' });
      if (!res.ok) throw new Error('unauth');
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoadingInternal(false);
      setFirstTried(true);
    }
  }, []);

  // 初次加载
  useEffect(() => { load(); }, [load]);

  // 路径变化时：若尚未拿到用户（可能刚登录后跳转），尝试再取一次（防止登录后需手动刷新）
  useEffect(() => {
    if (!firstTried) return; // 初次加载还没完成不重复
    if (user) return; // 已经有用户无需再取
    // 节流：避免不停请求；超过 1500ms 才再尝试一次
    if (Date.now() - lastAttemptAt < 1500) return;
    load();
  }, [pathname, user, firstTried, lastAttemptAt, load]);

  // 窗口重新聚焦时，如果当前没有用户信息，尝试刷新（处理用户在其它标签登录的情况）
  useEffect(() => {
    const onFocus = () => {
      if (!user && firstTried) {
        if (Date.now() - lastAttemptAt > 1000) load();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, firstTried, lastAttemptAt, load]);

  // 监听 localStorage 中的登陆状态广播（可在登录成功后执行 localStorage.setItem('auth:changed', Date.now().toString())）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth:changed') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load]);

  const value: AuthState = {
    user,
    loading: !firstTried || loadingInternal,
    refresh: load,
    isStudent: user?.userType === 'STUDENT',
    isAdmin: user?.userType === 'ADMIN',
    isTeacher: user?.userType === 'TEACHER'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
