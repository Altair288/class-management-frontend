"use client";
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, CircularProgress, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { getPriorityColor, getTypeLabel } from '@/hooks/useNotifications';
import { useNotificationContext } from '@/context/NotificationContext';
import CircleIcon from '@mui/icons-material/Circle';

export default function AllNotificationsPage() {
  // 用户信息不再由此页面单独请求，依赖上层布局/Provider 已完成会话处理
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const theme = useTheme();


  // 简化：此页面直接使用独立 hook（history 模式），并建议外部不再包裹 Provider，以避免重复连接
  const { notifications, unreadCount, loading, markAsRead, markAllRead, refresh } = useNotificationContext();

  const filtered = notifications.filter(n => {
    return (!typeFilter || n.type === typeFilter) && (!priorityFilter || n.priority === priorityFilter) && (!search || n.title.includes(search) || n.content.includes(search));
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>消息中心</Typography>
      <Card sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        mb: 2,
        bgcolor: 'background.paper',
        backdropFilter: theme.palette.mode === 'dark' ? 'blur(4px)' : 'none'
      }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', p: 2 }}>
          <Chip label={`未读 ${unreadCount}`} size="small" sx={{
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.15),
            color: theme.palette.primary.main,
            fontWeight: 600,
          }} />
          <TextField
            size="small"
            placeholder="搜索标题/内容"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{
              minWidth: 200,
              '& .MuiInputBase-root': {
                bgcolor: alpha(theme.palette.action.hover, 0.3),
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>类型</InputLabel>
            <Select value={typeFilter} label="类型" onChange={e => setTypeFilter(e.target.value)}>
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="LEAVE_SUBMITTED">请假提交</MenuItem>
              <MenuItem value="LEAVE_APPROVED">请假通过</MenuItem>
              <MenuItem value="LEAVE_REJECTED">请假拒绝</MenuItem>
              <MenuItem value="LEAVE_STEP_ADVANCED">审批推进</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>优先级</InputLabel>
            <Select value={priorityFilter} label="优先级" onChange={e => setPriorityFilter(e.target.value)}>
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="URGENT">紧急</MenuItem>
              <MenuItem value="HIGH">高</MenuItem>
              <MenuItem value="NORMAL">普通</MenuItem>
              <MenuItem value="LOW">低</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" onClick={() => { setTypeFilter(''); setPriorityFilter(''); setSearch(''); }}>重置</Button>
          <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => refresh()} sx={{ textTransform: 'none' }}>刷新</Button>
            {unreadCount > 0 && <Button size="small" onClick={() => markAllRead()} sx={{ textTransform: 'none' }}>全部已读</Button>}
        </CardContent>
      </Card>
      <Card sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        bgcolor: 'background.paper'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>暂无消息</Box>
          ) : (
            <Box>
              {filtered.map((n, idx) => {
                const unreadBg = theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.14)
                  : alpha(theme.palette.primary.main, 0.08);
                const unreadHover = theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.24)
                  : alpha(theme.palette.primary.main, 0.15);
                const readHover = theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.06)
                  : alpha(theme.palette.primary.main, 0.04);
                return (
                  <Box
                    key={n.notificationId+"-"+n.recipientId}
                    sx={{
                      p: 2.25,
                      borderBottom: idx < filtered.length -1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      display: 'flex',
                      gap: 2,
                      background: n.read ? 'transparent' : unreadBg,
                      '&:hover': { background: n.read ? readHover : unreadHover },
                      cursor: 'pointer',
                      transition: 'background .18s ease'
                    }}
                    onClick={() => !n.read && markAsRead([n.recipientId])}
                  >
                    {!n.read && <CircleIcon sx={{ fontSize: 10, mt: 0.75, color: getPriorityColor(n.priority) }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 500 : 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.85rem', color: 'text.primary' }}>{n.title}</Typography>
                        <Chip label={getTypeLabel(n.type)} size="small" variant="outlined" sx={{
                          borderColor: getPriorityColor(n.priority),
                          color: getPriorityColor(n.priority),
                          height: 18,
                          fontSize: '0.6rem',
                          backgroundColor: alpha(getPriorityColor(n.priority), theme.palette.mode === 'dark' ? 0.12 : 0.08)
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '.7rem', lineHeight: 1.45, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }} suppressHydrationWarning>{new Date(n.createdAt).toLocaleString()}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
