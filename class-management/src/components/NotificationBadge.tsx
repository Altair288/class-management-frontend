"use client";

import { useState, useCallback } from 'react';
import { Badge, IconButton, Popover, Box, Typography, Button, Chip, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import NotificationPanel from './NotificationPanel';
import { useNotificationContext } from '@/context/NotificationContext';

// 统一使用 Provider 提供的数据；userId 仅为向后兼容（现在不再在组件内部单独加载）
export default function NotificationBadge() {
  const { unreadCount, refresh, markAllRead, notifications } = useNotificationContext();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    if (!open && notifications.length === 0) {
      refresh();
    }
  };
  const handleClose = () => setAnchorEl(null);

  const handleMarkAll = useCallback(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
          borderRadius: 2,
          transition: 'background-color .2s ease, color .2s ease',
          position: 'relative',
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12) },
          ...(unreadCount > 0 ? {
            animation: 'notifPulse 2.4s ease-in-out infinite'
          } : {})
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{ '& .MuiBadge-badge': { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText, fontWeight: 600, fontSize: '0.7rem', minWidth: 18, height: 18, boxShadow: theme.palette.mode === 'dark' ? '0 0 0 1px rgba(0,0,0,0.4)' : 'none' } }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      {/* 动画 keyframes 注入 */}
      <style jsx global>{`
        @keyframes notifPulse {
          0% { transform: scale(1); }
          20% { transform: scale(1.08); }
          40% { transform: scale(1); }
          60% { transform: scale(1.05); }
          80% { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: 3,
            border: '1px solid',
            borderColor: theme.palette.divider,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 18px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
            backdropFilter: theme.palette.mode === 'dark' ? 'blur(6px)' : 'none'
          }
        }}
      >
        <Box sx={{
          px: 3,
            py: 2,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.35)}, ${alpha(theme.palette.primary.main, 0.15)})`
              : 'linear-gradient(90deg,#e8f3ff,#f5faff)',
            borderBottom: '1px solid',
            borderColor: theme.palette.divider
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>消息中心</Typography>
            <Chip label={`${unreadCount} 未读`} size="small" sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontSize: '0.65rem', height: 18, fontWeight: 500 }} />
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAll} sx={{ color: theme.palette.primary.main, fontSize: '0.7rem', mt: 1, textTransform: 'none', px: 1, borderRadius: 2, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) } }}>全部标记已读</Button>
          )}
        </Box>
        <NotificationPanel userId={0} limit={20} variant="embedded" showHeaderActions={false} hideFooter />
        <Divider sx={{ borderColor: theme.palette.divider }} />
        <Box sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
          <Button size="small" onClick={handleClose} sx={{ color: theme.palette.primary.main, textTransform: 'none', fontSize: '0.75rem', borderRadius: 2, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) } }}>查看全部消息</Button>
        </Box>
      </Popover>
    </>
  );
}