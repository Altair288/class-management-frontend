"use client";

import React from 'react';
import { Box, Card, CardContent, Typography, Chip, List, ListItem, Divider, Button, CircularProgress, IconButton } from '@mui/material';
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

  const header = (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 1.5
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#212529' }}>
          最新消息
        </Typography>
        <Chip
          label={`${unreadCount} 未读`}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            backgroundColor: '#1976d2',
            color: '#fff'
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
                color: '#1976d2',
                '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' }
              }}
            >全部已读</Button>
          )}
          <IconButton size="small" onClick={() => refresh()} disabled={loading} sx={{ color: '#1976d2' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  const list = (
    <Box sx={{ maxHeight: isDashboard ? 260 : 400, overflowY: 'auto' }}>
      {loading && !initialized ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: '#6c757d', fontSize: '0.8rem' }}>
          暂无消息
        </Box>
      ) : (
        <List sx={{ py: 0 }}>
          {notifications.map((n, idx) => (
            <Box key={n.notificationId}>
              <ListItem
                onClick={() => !n.read && markAsRead([n.recipientId])}
                sx={{
                  alignItems: 'flex-start',
                  display: 'flex',
                  gap: 1,
                  cursor: 'pointer',
                  py: 1.25,
                  px: 0.5,
                  backgroundColor: n.read ? '#fff' : '#f5f9ff',
                  '&:hover': { backgroundColor: n.read ? '#f6f8fa' : '#e9f2ff' },
                  transition: 'background-color .15s ease'
                }}
              >
                {/* 左侧小圆点 */}
                <Box sx={{ width: 10, display: 'flex', justifyContent: 'center', pt: 0.6 }}>
                  {!n.read && <CircleIcon sx={{ fontSize: 10, color: getPriorityColor(n.priority) }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: n.read ? 400 : 600,
                        color: '#212529',
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
                        borderColor: getPriorityColor(n.priority),
                        color: getPriorityColor(n.priority),
                        fontSize: '0.55rem',
                        height: 16,
                        '& .MuiChip-label': { px: 0.75, py: 0 },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#555',
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
                  <Typography variant="caption" sx={{ color: '#8a93a5', fontSize: '0.6rem' }}>
                    {formatTime(n.createdAt)}
                  </Typography>
                </Box>
              </ListItem>
              {idx < notifications.length - 1 && <Divider sx={{ ml: 2, borderColor: '#eef2f5' }} />}
            </Box>
          ))}
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
          color: '#1976d2',
          fontSize: '0.7rem',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' }
        }}
      >查看全部</Button>
    </Box>
  );

  if (isDashboard) {
    return (
      <Card sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
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
