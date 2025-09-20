"use client";

import { useState, useCallback } from 'react';
import { Badge, IconButton, Popover, Box, Typography, Button, Chip, Divider } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import NotificationPanel from './NotificationPanel';
import { useNotificationContext } from '@/context/NotificationContext';

// 统一使用 Provider 提供的数据；userId 仅为向后兼容（现在不再在组件内部单独加载）
export default function NotificationBadge() {
  const { unreadCount, refresh, markAllRead, notifications } = useNotificationContext();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

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
          color: '#1976d2',
          borderRadius: 2,
          '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' }
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{ '& .MuiBadge-badge': { backgroundColor: '#f44336', color: '#fff', fontWeight: 600, fontSize: '0.7rem', minWidth: 18, height: 18 } }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
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
            border: '1px solid #e5eaf2',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, background: 'linear-gradient(90deg,#e8f3ff,#f5faff)', borderBottom: '1px solid #e5eaf2' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>消息中心</Typography>
            <Chip label={`${unreadCount} 未读`} size="small" sx={{ backgroundColor: '#1976d2', color: '#fff', fontSize: '0.65rem', height: 18, fontWeight: 500 }} />
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAll} sx={{ color: '#1976d2', fontSize: '0.7rem', mt: 1, textTransform: 'none', px: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' } }}>全部标记已读</Button>
          )}
        </Box>
        <NotificationPanel userId={0} limit={20} variant="embedded" showHeaderActions={false} hideFooter />
        <Divider sx={{ borderColor: '#e5eaf2' }} />
        <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff' }}>
          <Button size="small" onClick={handleClose} sx={{ color: '#1976d2', textTransform: 'none', fontSize: '0.75rem', borderRadius: 2, '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' } }}>查看全部消息</Button>
        </Box>
      </Popover>
    </>
  );
}