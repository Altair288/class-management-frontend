"use client";
import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge, alpha, useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import OutboxIcon from '@mui/icons-material/Outbox';
import EventIcon from '@mui/icons-material/Event';
import { usePathname, useRouter } from 'next/navigation';
import { useNotificationContext } from '@/context/NotificationContext';

function useOptionalNotificationContext() {
  try {
    return useNotificationContext();
  } catch {
    return null;
  }
}

export default function StudentBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const possibleCtx = useOptionalNotificationContext();
  const ctxUnread = possibleCtx ? possibleCtx.unreadCount : 0;

  const items = [
    { label: '概览', icon: <DashboardIcon />, path: '/student/dashboard' },
    { label: '消息', icon: <MailOutlineIcon />, path: '/student/notifications', badge: ctxUnread },
    { label: '请假', icon: <OutboxIcon />, path: '/student/leave/apply' },
    { label: '日历', icon: <EventIcon />, path: '/student/leave/calendar' },
  ];

  const currentIndex = Math.max(0, items.findIndex(i => pathname.startsWith(i.path)));

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(12px)',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha('#ffffff', 0.95)
      }}
    >
      <BottomNavigation
        showLabels
        value={currentIndex}
        onChange={(e, value) => {
          const target = items[value];
          if (target) router.push(target.path);
        }}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '4px 6px',
            fontSize: '.7rem'
          },
          '& .MuiBottomNavigationAction-label': {
            fontWeight: 500
          }
        }}
      >
        {items.map((it) => (
          <BottomNavigationAction
            key={it.path}
            label={it.label}
            icon={it.badge ? (
              <Badge badgeContent={it.badge} color="error" max={99}>
                {it.icon}
              </Badge>
            ) : it.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
