"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface AuthUser {
  id: number;
  username: string;
  userType: string; // ADMIN | TEACHER | STUDENT | others
  // 新增：班长扩展
  classMonitor?: boolean; // true 表示该学生是某班班长
  monitorClassId?: number; // 所属班级ID（若为班长）
  relatedId?: number; // 现有后端返回（可能是 studentId 或 teacherId）
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void; // 强制登出
  setUserUnsafe: (u: AuthUser | null) => void; // 特殊场景（如登录成功后直接写入）
  isStudent: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isClassMonitor: boolean; // 新增：是否班长
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

  const logout = () => {
    try {
      setUser(null);
      // 广播给其它标签页
      localStorage.setItem('auth:changed', Date.now().toString());
    } catch {}
  };

  const value: AuthState = {
    user,
    loading: !firstTried || loadingInternal,
    refresh: load,
    logout,
    setUserUnsafe: (u) => setUser(u),
    isStudent: user?.userType === 'STUDENT',
    isAdmin: user?.userType === 'ADMIN',
    isTeacher: user?.userType === 'TEACHER',
    isClassMonitor: !!user?.classMonitor
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
