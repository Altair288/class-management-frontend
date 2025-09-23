"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

export interface NotificationItem {
  notificationId: number;
  recipientId: number;
  title: string;
  content: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channels: string[];
  read: boolean;
  createdAt: string;
}

interface UseNotificationsOptions {
  poll?: boolean;              // 是否使用轮询（SSE 不可用时作为回退）
  pollInterval?: number;       // 轮询间隔
  limit?: number;              // 初始加载数量
  sse?: boolean;               // 是否启用 SSE
  sseReconnectInterval?: number; // SSE 重试间隔(ms)
  sseMaxRetries?: number;        // 最大重试次数(-1 表示无限)
  onAuthExpired?: () => void;    // 会话 / 登录过期回调（收到 401 时触发）
  authProbeUrl?: string;        // 401 探测 URL（默认 /api/leave/current-user-info）
}

export function useNotifications(userId: number | undefined, opts: UseNotificationsOptions = {}) {
  const {
    poll = false,
    pollInterval = 30000,
    limit = 20,
    sse = true,
    sseReconnectInterval = 5000,
    sseMaxRetries = -1,
    onAuthExpired,
    authProbeUrl = '/api/leave/current-user-info'
  } = opts;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseError, setSseError] = useState<null | string>(null);
  const lastEventTsRef = useRef<number>(0);
  const HEARTBEAT_EXPECTED_MS = 65000; // 服务器 30s ping，这里 65s 判定超时
  const prevUnreadRef = useRef<number>(0);

  const sseRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const manualClosedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications/unread-count?userId=${userId}`, { credentials: 'include' });
      if (res.status === 401) {
        onAuthExpired?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread || 0);
      }
    } catch (e) {
      // 忽略网络瞬断
      if (process.env.NODE_ENV !== 'production') console.debug('unread poll error', e);
    }
  }, [userId, onAuthExpired]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications/inbox?userId=${userId}&limit=${limit}`, { credentials: 'include' });
      if (res.status === 401) {
        onAuthExpired?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('加载通知失败', e);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [userId, limit, onAuthExpired]);

  const markAsRead = useCallback(async (recipientIds: number[]) => {
    if (!userId || recipientIds.length === 0) return;
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, recipientIds })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => recipientIds.includes(n.recipientId) ? { ...n, read: true } : n));
        fetchUnreadCount();
      }
    } catch (e) {
      console.error('标记已读失败', e);
    }
  }, [userId, fetchUnreadCount]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('全部已读失败', e);
    }
  }, [userId]);

  // SSE 连接函数
  const setupSse = useCallback(() => {
    if (!userId || !sse) return;
    // 如果浏览器或运行环境不支持 EventSource，直接跳过
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    // 已存在连接则不重复创建
    if (sseRef.current) return;

    manualClosedRef.current = false;
    // 需要携带 Cookie -> 使用 withCredentials
    // Next.js rewrites 在某些环境(尤其 dev/或部署在 Vercel) 对 SSE 可能发生缓冲，改为直接指向后端根域名可规避。
    // 支持通过环境变量覆盖：NEXT_PUBLIC_BACKEND_ORIGIN，例如 http://localhost:8080
    const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || '').replace(/\/$/, '');
    const relative = `/api/notifications/stream?userId=${userId}`;
    const url = backendOrigin ? `${backendOrigin}${relative}` : relative;
    // TS DOM lib 可能没有定义第二参数 withCredentials（不同 TS 版本差异），通过类型断言绕过
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ES: any = EventSource as unknown as { new (url: string, opts?: { withCredentials?: boolean }): EventSource };
    if (process.env.NODE_ENV !== 'production') console.debug('[SSE] creating connection', { url, backendOrigin });
    const es: EventSource = new ES(url, { withCredentials: true });
    sseRef.current = es;
    // 暴露供外部调试
  try { (window as unknown as { __sse?: EventSource }).__sse = es; } catch {}
    setSseError(null);

    es.addEventListener('open', () => {
      retryRef.current = 0;
      setSseConnected(true);
      lastEventTsRef.current = Date.now();
      if (process.env.NODE_ENV !== 'production') console.debug('[SSE] open');
    });

    es.addEventListener('init', () => {
      lastEventTsRef.current = Date.now();
      if (process.env.NODE_ENV !== 'production') console.debug('[SSE] init');
    });

    // snapshot: 初始快照（unreadCount + notifications 列表）
    es.addEventListener('snapshot', (e: MessageEvent) => {
      try {
        const raw = e.data;
        if (process.env.NODE_ENV !== 'production') console.debug('[SSE] snapshot raw', raw);
        let data: unknown;
        try { data = JSON.parse(raw); } catch { data = raw; }
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
        if (data && typeof data === 'object') {
          const snap = data as { unreadCount?: number; notifications?: unknown };
          if (typeof snap.unreadCount === 'number') setUnreadCount(snap.unreadCount);
          if (Array.isArray(snap.notifications)) {
            const mapped: NotificationItem[] = snap.notifications.map((o: unknown) => {
              if (o && typeof o === 'object') {
                const anyObj = o as Record<string, unknown>;
                return {
                  notificationId: Number(anyObj.notificationId),
                  recipientId: Number(anyObj.recipientId ?? -1),
                  title: typeof anyObj.title === 'string' ? anyObj.title : '',
                  content: typeof anyObj.content === 'string' ? anyObj.content : '',
                  type: typeof anyObj.type === 'string' ? anyObj.type : 'SYSTEM',
                  priority: (typeof anyObj.priority === 'string' ? anyObj.priority : 'NORMAL') as NotificationItem['priority'],
                  channels: [],
                  read: false,
                  createdAt: typeof anyObj.createdAt === 'string' ? anyObj.createdAt : new Date().toISOString(),
                };
              }
              return {
                notificationId: -1,
                recipientId: -1,
                title: '',
                content: '',
                type: 'SYSTEM',
                priority: 'NORMAL',
                channels: [],
                read: false,
                createdAt: new Date().toISOString(),
              } as NotificationItem;
            });
            setNotifications(mapped.filter(m => m.notificationId !== -1).slice(0, limit));
          }
          lastEventTsRef.current = Date.now();
        }
      } catch (err) {
        console.error('[SSE] snapshot parse error', err);
      }
    });
    es.addEventListener('ping', () => {
      lastEventTsRef.current = Date.now();
      if (process.env.NODE_ENV !== 'production') console.debug('[SSE] ping');
    });

  es.addEventListener('notification', (e: MessageEvent) => {
      try {
  const raw = e.data;
    if (process.env.NODE_ENV !== 'production') console.debug('[SSE] raw', raw);
        interface ParsedPayload {
          unreadCount?: number;
          notificationId?: number;
          notification?: NotificationItem;
          recipientId?: number;
          recipientID?: number;
          recipient_id?: number;
          title?: string;
          content?: string;
          type?: string;
          priority?: string;
          createdAt?: string;
        }
  let data: unknown;
  try { data = JSON.parse(raw); } catch { data = raw; }
        const obj: ParsedPayload = (data && typeof data === 'object') ? data as ParsedPayload : {};
        lastEventTsRef.current = Date.now();
        if (process.env.NODE_ENV !== 'production') console.debug('[SSE] notification', data);
        // 1) 更新未读数（若提供）
        if (typeof obj.unreadCount === 'number') {
          setUnreadCount(obj.unreadCount);
        }
        // 2) 兼容两种形态：{ notification: {...} } 或 扁平 {...notificationFields}
  let incoming: NotificationItem | null = null;
        if (obj.notification) {
          incoming = obj.notification;
        } else if (obj.notificationId) {
          // 后端当前推送是扁平结构（notificationId, title, content...）
          incoming = {
            notificationId: obj.notificationId,
            recipientId: obj.recipientId || obj.recipientID || obj.recipient_id || -1,
            title: obj.title || '',
            content: obj.content || '',
            type: obj.type || 'SYSTEM',
            priority: (obj.priority as NotificationItem['priority']) || 'NORMAL',
            channels: [],
            read: false,
            createdAt: obj.createdAt || new Date().toISOString(),
          } as NotificationItem;
        }
        if (incoming) {
          setNotifications(prev => {
            const exists = prev.some(n => n.notificationId === incoming.notificationId);
            if (exists) return prev; // 避免重复
            const next = [incoming, ...prev];
            return next.slice(0, limit);
          });
          // 若服务器未提供 unreadCount，则乐观递增（后续 fetchUnreadCount 会校正）
          if (typeof obj.unreadCount !== 'number') {
            setUnreadCount(u => u + 1);
          }
        } else if (typeof obj.unreadCount === 'number') {
          // 只有未读数，没有通知体：不追加
        } else {
          // 不识别的 payload 形态，可选调试
          if (process.env.NODE_ENV !== 'production') console.debug('未知通知 payload', obj);
        }
        // 3) 如果缺少 unreadCount（某些后端推送未带），做一次被动拉取，避免红点不更新
        if (typeof obj.unreadCount !== 'number') {
          fetchUnreadCount();
        }
      } catch (err) {
        console.error('解析 notification 事件失败', err);
      }
  });

    // 通用 message 回退：若后端未设置 event name, Spring 可能仍发送作为默认 'message'
    if (!es.onmessage) {
      // 类型守卫
      const hasSnapshotShape = (o: unknown): o is { notifications?: unknown } => !!o && typeof o === 'object' && 'notifications' in (o as Record<string, unknown>);
      const hasNotificationShape = (o: unknown): o is { notificationId?: unknown; title?: unknown } => !!o && typeof o === 'object' && ('notificationId' in (o as Record<string, unknown>) || 'title' in (o as Record<string, unknown>));
      es.onmessage = (e: MessageEvent) => {
        try {
          lastEventTsRef.current = Date.now();
          if (process.env.NODE_ENV !== 'production') console.debug('[SSE] generic message', e.data);
          const data = JSON.parse(e.data);
          if (hasSnapshotShape(data)) {
            const snapEv = new MessageEvent('snapshot', { data: e.data });
            es.dispatchEvent(snapEv);
          } else if (hasNotificationShape(data)) {
            const notiEv = new MessageEvent('notification', { data: e.data });
            es.dispatchEvent(notiEv);
          }
        } catch {
          // ignore parse errors
        }
      };
    }

    es.addEventListener('error', async (ev) => {
      if (process.env.NODE_ENV !== 'production') console.warn('[SSE] error event', ev);
      setSseConnected(false);
      setSseError('SSE 连接中断');
      try { sseRef.current?.close(); } catch {}
      sseRef.current = null;
      if (manualClosedRef.current) return; // 主动关闭不重连

      // 探测是否会话过期（401），避免盲目重连死循环
      try {
        const probe = await fetch(authProbeUrl, { credentials: 'include' });
        if (probe.status === 401) {
          if (process.env.NODE_ENV !== 'production') console.warn('[SSE] auth expired detected via probe');
          onAuthExpired?.();
          // 标记为不再自动重连，等待上层重新登录后再调用 reconnect
          manualClosedRef.current = true;
          return;
        }
      } catch (probeErr) {
        // 网络错误，继续按原逻辑退避重连
        if (process.env.NODE_ENV !== 'production') console.debug('[SSE] probe error (treat as transient)', probeErr);
      }
      if (sseMaxRetries !== -1 && retryRef.current >= sseMaxRetries) return;
      retryRef.current += 1;
      // 指数退避 + 抖动
      const delay = Math.min(
        sseReconnectInterval * Math.pow(2, retryRef.current - 1),
        60000
      ) * (0.85 + Math.random() * 0.3);
      if (process.env.NODE_ENV !== 'production') console.debug('[SSE] schedule reconnect', { attempt: retryRef.current, delay });
      setTimeout(setupSse, delay);
    });
  }, [userId, sse, limit, sseMaxRetries, sseReconnectInterval, fetchUnreadCount, onAuthExpired, authProbeUrl]);

  // 初始化：加载一次 + 建立 SSE
  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    fetchNotifications();
    if (sse) {
      setupSse();
    }
    return () => {
      manualClosedRef.current = true;
      sseRef.current?.close();
      sseRef.current = null;
      setSseConnected(false);
    };
  }, [userId, fetchUnreadCount, fetchNotifications, sse, setupSse]);

  // 轮询未读(仅当 poll 开启 且 未启用 SSE 或 SSE 未连接时作为补充)
  useEffect(() => {
    if (!poll || !userId) return;
    if (sse && sseConnected) return; // SSE 已连接则不需要轮询
    const id = setInterval(() => {
      fetchUnreadCount();
      // 同步轮询列表（只取前 limit 条，成本低）
      fetchNotifications();
    }, pollInterval);
    return () => clearInterval(id);
  }, [poll, pollInterval, userId, fetchUnreadCount, fetchNotifications, sse, sseConnected]);

  // unreadCount 上升但当前未建立 SSE 连接 => 立即拉取列表，减少延迟
  useEffect(() => {
    if (!userId) return;
    const prev = prevUnreadRef.current;
    if (unreadCount > prev && !(sse && sseConnected)) {
      fetchNotifications();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, userId, sse, sseConnected, fetchNotifications]);

  // 连接“陈旧”自检：超过预期心跳间隔(65s)仍无事件再重连，避免频繁误判
  useEffect(() => {
    if (!sse || !userId) return;
    const timer = setInterval(() => {
      if (sseConnected) {
        const gap = Date.now() - lastEventTsRef.current;
        if (gap > HEARTBEAT_EXPECTED_MS) {
          if (process.env.NODE_ENV !== 'production') console.warn('[SSE] stale (>65s no event), force reconnect');
          sseRef.current?.close();
          sseRef.current = null;
          setSseConnected(false);
          setupSse();
        }
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [sse, userId, sseConnected, setupSse]);

  return {
    notifications,
    unreadCount,
    loading,
    initialized,
    sseConnected,
    sseError,
    refresh: fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllRead,
    _internal: {
      closeSse: () => { manualClosedRef.current = true; sseRef.current?.close(); sseRef.current = null; setSseConnected(false); },
      reconnect: () => { if (!sseRef.current) setupSse(); }
    }
  };
}

// 工具函数（保持与旧组件一致）
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return '#f44336';
    case 'HIGH': return '#ff9800';
    case 'NORMAL': return '#1976d2';
    case 'LOW': return '#9e9e9e';
    default: return '#1976d2';
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case 'LEAVE_SUBMITTED': return '请假提交';
    case 'LEAVE_APPROVED': return '请假通过';
    case 'LEAVE_REJECTED': return '请假拒绝';
    case 'LEAVE_STEP_ADVANCED': return '审批推进';
    default: return '系统通知';
  }
};
