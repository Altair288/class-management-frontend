"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Chip, List, ListItem, Divider, Button, CircularProgress, IconButton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircleIcon from '@mui/icons-material/Circle';
import { useNotifications, getPriorityColor, getTypeLabel } from '@/hooks/useNotifications';
import { useNotificationContext } from '@/context/NotificationContext';

// 安全包装：Hook 仍被无条件调用，若没有 Provider 抛错则捕获并返回 null
function useOptionalNotificationContext() {
  try {
    return useNotificationContext();
  } catch {
    return null;
  }
}

interface NotificationPanelProps {
  userId: number;              // 向后兼容：若未包裹 Provider 仍可独立使用
  limit?: number;
  variant?: 'dashboard' | 'embedded';
  showHeaderActions?: boolean;
  hideFooter?: boolean;
  onViewAll?: () => void;
  preferContext?: boolean;     // 默认 true: 如果存在 Provider 则用 Provider 数据
}

const formatTime = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}天前`;
  if (diffHours > 0) return `${diffHours}小时前`;
  return '刚刚';
};

export default function NotificationPanel({
  userId,
  limit = 5,
  variant = 'dashboard',
  showHeaderActions = true,
  hideFooter = false,
  onViewAll,
  preferContext = true,
}: NotificationPanelProps) {
  const theme = useTheme();
  // 始终尝试调用（若没有 Provider 会抛错）
  const possibleCtx = useOptionalNotificationContext();
  const ctx = preferContext ? possibleCtx : null;
  const standalone = useNotifications(userId, { limit });
  const notifications = ctx ? ctx.notifications : standalone.notifications;
  const unreadCount = ctx ? ctx.unreadCount : standalone.unreadCount;
  const loading = ctx ? ctx.loading : standalone.loading;
  const initialized = ctx ? ctx.initialized : standalone.initialized;
  const markAsRead = ctx ? ctx.markAsRead : standalone.markAsRead;
  const markAllRead = ctx ? ctx.markAllRead : standalone.markAllRead;
  const refresh = ctx ? ctx.refresh : standalone.refresh;

  const isDashboard = variant === 'dashboard';

  // 多选模式与选择集合
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (notificationId: number) => {
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelectedIds(prev => prev.includes(notificationId) ? prev : [...prev, notificationId]);
    }, 500); // 500ms 触发
  };

  const toggleSelect = (notificationId: number) => {
    setSelectedIds(prev => prev.includes(notificationId) ? prev.filter(id => id !== notificationId) : [...prev, notificationId]);
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const batchMarkAsRead = useCallback(() => {
    if (selectedIds.length === 0) return;
    const targetRecipientIds = notifications.filter(n => selectedIds.includes(n.notificationId) && !n.read).map(n => n.recipientId);
    if (targetRecipientIds.length > 0) {
      markAsRead(targetRecipientIds);
    }
    exitSelection();
  }, [selectedIds, notifications, markAsRead]);

  const header = (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 1.5,
      pr: 0.5
    }}>
      {!selectionMode ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary' }}>
              最新消息
            </Typography>
            <Chip
              label={`${unreadCount} 未读`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.35) : theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                backdropFilter: theme.palette.mode === 'dark' ? 'blur(4px)' : 'none',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.light, 0.4) : 'transparent',
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
          </Box>
          {showHeaderActions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={() => markAllRead()}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.7rem',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >全部已读</Button>
              )}
              <IconButton size="small" onClick={() => refresh()} disabled={loading} sx={{ color: 'primary.main' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>多选模式</Typography>
            <Chip size="small" label={`已选 ${selectedIds.length}`} sx={{ height: 20, fontSize: '0.6rem' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              disabled={selectedIds.length === 0}
              onClick={batchMarkAsRead}
              sx={{ textTransform: 'none', fontSize: '0.7rem', color: selectedIds.length === 0 ? 'text.disabled' : 'primary.main' }}
            >标记已读</Button>
            <Button
              size="small"
              onClick={exitSelection}
              sx={{ textTransform: 'none', fontSize: '0.7rem', color: 'text.secondary' }}
            >退出</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  const list = (
    <Box sx={{
      maxHeight: isDashboard ? 365 : 400,
      overflowY: 'auto',
      pr: 0.5,
      '&::-webkit-scrollbar': { width: 6 },
      '&::-webkit-scrollbar-track': { background: 'transparent' },
      '&::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.primary.main, 0.3),
        borderRadius: 3,
        '&:hover': { background: alpha(theme.palette.primary.main, 0.5) }
      }
    }}>
      {loading && !initialized ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary', fontSize: '0.8rem' }}>
          暂无消息
        </Box>
      ) : (
        <List sx={{ py: 0 }}>
          {notifications.map((n, idx) => {
            const unreadBg = theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.08);
            const unreadHover = theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.22) : alpha(theme.palette.primary.main, 0.15);
            // 已读项在浅色模式 hover 之前过重，改为更轻的主色微底，深色沿用原逻辑
            const readHover = theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.06)
              : alpha(theme.palette.primary.main, 0.05);
            const isSelected = selectedIds.includes(n.notificationId);
            return (
              <Box key={n.notificationId}>
                <ListItem
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(n.notificationId);
                    } else if (!n.read) {
                      markAsRead([n.recipientId]);
                    }
                  }}
                  onMouseDown={() => { if (!selectionMode) startLongPress(n.notificationId); }}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchStart={() => { if (!selectionMode) startLongPress(n.notificationId); }}
                  onTouchEnd={clearLongPressTimer}
                  sx={{
                    alignItems: 'flex-start',
                    display: 'flex',
                    gap: 1,
                    cursor: 'pointer',
                    py: 1.2,
                    px: 1,
                    pr: 1.25,
                    position: 'relative',
                    borderRadius: 2,
                    backgroundColor: n.read ? (selectionMode && isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent') : unreadBg,
                    boxShadow: (selectionMode && isSelected)
                      ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.5)}, 0 2px 4px ${alpha('#000', 0.15)}`
                      : '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid',
                    borderColor: (selectionMode && isSelected) ? alpha(theme.palette.primary.main, 0.6) : alpha(theme.palette.divider, 0.6),
                    '&:before': !n.read ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: 3,
                      borderRadius: 2,
                      background: getPriorityColor(n.priority),
                      boxShadow: `0 0 0 1px ${alpha(getPriorityColor(n.priority), 0.4)}`
                    } : undefined,
                    '&:hover': {
                      backgroundColor: n.read ? readHover : unreadHover,
                      boxShadow: selectionMode && isSelected ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.7)}, 0 2px 6px ${alpha('#000', 0.2)}` : undefined,
                      borderColor: selectionMode && isSelected ? alpha(theme.palette.primary.main, 0.7) : undefined
                    },
                    transition: 'background-color .18s ease, box-shadow .18s ease, border-color .18s ease'
                  }}
                >
                  <Box sx={{ width: 14, display: 'flex', justifyContent: 'center', pt: 0.6 }}>
                    {selectionMode ? (
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: 0.75,
                          border: '2px solid',
                          borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.4),
                          background: isSelected ? theme.palette.primary.main : 'transparent',
                          position: 'relative',
                          transition: 'all .18s',
                          '&:after': isSelected ? {
                            content: '""',
                            position: 'absolute',
                            left: 3,
                            top: 1.5,
                            width: 4,
                            height: 7,
                            border: '2px solid #fff',
                            borderTop: 'none',
                            borderLeft: 'none',
                            transform: 'rotate(45deg)'
                          } : undefined
                        }}
                      />
                    ) : (!n.read && <CircleIcon sx={{ fontSize: 8, color: getPriorityColor(n.priority) }} />)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.read ? 400 : 600,
                          color: 'text.primary',
                          flex: 1,
                          minWidth: 0,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {n.title}
                      </Typography>
                      <Chip
                        label={getTypeLabel(n.type)}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: alpha(getPriorityColor(n.priority), 0.8),
                          color: getPriorityColor(n.priority),
                          fontSize: '0.55rem',
                          height: 16,
                          backgroundColor: alpha(getPriorityColor(n.priority), theme.palette.mode === 'dark' ? 0.1 : 0.06),
                          '& .MuiChip-label': { px: 0.75, py: 0 },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 0.25
                      }}
                    >
                      {n.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }} suppressHydrationWarning>
                      {formatTime(n.createdAt)}
                    </Typography>
                  </Box>
                </ListItem>
                {idx < notifications.length - 1 && <Divider sx={{ ml: 2, borderColor: alpha(theme.palette.divider, 0.6) }} />}
              </Box>
            );
          })}
        </List>
      )}
    </Box>
  );

  const footer = hideFooter ? null : (
    <Box sx={{ pt: 1.5, display: 'flex', justifyContent: 'center' }}>
      <Button
        size="small"
        onClick={() => onViewAll && onViewAll()}
        sx={{
          textTransform: 'none',
          color: 'primary.main',
          fontSize: '0.7rem',
          borderRadius: 1,
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
        }}
      >查看全部</Button>
    </Box>
  );

  if (isDashboard) {
    return (
      <Card sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', boxShadow: 'none', bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {header}
          {list}
          {footer}
        </CardContent>
      </Card>
    );
  }

  // embedded (不包Card) 用于 Popover 或其他容器
  return (
    <Box sx={{ p: 1.5 }}>
      {header}
      {list}
      {footer}
    </Box>
  );
}
