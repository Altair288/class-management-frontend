"use client";
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, alpha, useTheme, Menu, MenuItem } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import NotificationBadge from './NotificationBadge';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import OutboxIcon from '@mui/icons-material/Outbox';
import EventIcon from '@mui/icons-material/Event';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ClassIcon from '@mui/icons-material/Class';

interface StudentTopbarProps {
  showBack?: boolean;          // 在子页面时可显示返回
  title?: string;              // 覆盖默认标题
  onAvatarClick?: () => void;  // 预留扩展
}

export default function StudentTopbar({ showBack, title, onAvatarClick }: StudentTopbarProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const derivedTitle = title || '学生中心';

  const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    onAvatarClick?.();
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try { await fetch('/api/users/logout', { method: 'POST' }); } catch {}
    await refresh();
    try { localStorage.setItem('auth:changed', Date.now().toString()); } catch {}
    handleClose();
    router.push('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.85)
          : alpha('#ffffff', 0.9),
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <Toolbar sx={{ minHeight: 56, px: 2, gap: 1 }}>
        {showBack ? (
          <IconButton edge="start" onClick={() => router.back()} size="small" sx={{ mr: .5 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        ) : null}
        <Typography
          variant="h6"
          noWrap
          sx={{
            flex: 1,
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '.5px'
          }}
        >
          {derivedTitle}
        </Typography>
        <ThemeToggle size="small" />
        <NotificationBadge />
        <IconButton onClick={handleAvatarClick} sx={{ p: 0, ml: .5 }}>
          <Avatar sx={{ width: 34, height: 34 }} src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg">
            {user?.username?.[0] || 'U'}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { mt: 1.5, minWidth: 220, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', p: 1 }
          }}
        >
          <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: .5, opacity: 1, py: 1.25 }}>
            <Typography fontSize={14} fontWeight={600}>{user?.username || '未登录'}</Typography>
            <Typography fontSize={12} color="text.secondary">{user?.userType || '角色'}</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); router.push('/student/notifications'); }}>
            <MailOutlineIcon fontSize="small" sx={{ mr: 1 }} /> 我的消息
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); router.push('/student/leave/apply'); }}>
            <OutboxIcon fontSize="small" sx={{ mr: 1 }} /> 提交请假
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); router.push('/student/leave/calendar'); }}>
            <EventIcon fontSize="small" sx={{ mr: 1 }} /> 我的日历
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); router.push('/student/dashboard'); }}>
            <DashboardIcon fontSize="small" sx={{ mr: 1 }} /> 学生仪表盘
          </MenuItem>
          {/* 班长专属入口 */}
          {(typeof user === 'object' && user && 'classMonitor' in user && (user as {classMonitor?: boolean}).classMonitor) ? (
            <MenuItem onClick={() => { handleClose(); router.push('/student/credits/manage'); }}>
              <ClassIcon fontSize="small" sx={{ mr: 1 }} /> 班级学分
            </MenuItem>
          ) : null}
          <MenuItem onClick={() => { handleClose(); router.push('/student/profile'); }}>
            <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> 个人信息
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ mt: .5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> 退出登录
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
