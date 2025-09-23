"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, CircularProgress, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useNotifications, getPriorityColor, getTypeLabel } from '@/hooks/useNotifications';
import CircleIcon from '@mui/icons-material/Circle';

interface UserInfo { id: number; username: string; userType: string }

export default function AllNotificationsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/users/current').then(r => r.json()).then(setUser).catch(() => setUser(null));
  }, []);

  const { notifications, unreadCount, loading, markAsRead, markAllRead, refresh } = useNotifications(user?.id, { limit: 100, history: true });

  const filtered = notifications.filter(n => {
    return (!typeFilter || n.type === typeFilter) && (!priorityFilter || n.priority === priorityFilter) && (!search || n.title.includes(search) || n.content.includes(search));
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>消息中心</Typography>
      <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', p: 2 }}>
          <Chip label={`未读 ${unreadCount}`} color="primary" size="small" />
          <TextField size="small" placeholder="搜索标题/内容" value={search} onChange={e => setSearch(e.target.value)} />
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
          <Button size="small" onClick={() => refresh()}>刷新</Button>
          {unreadCount > 0 && <Button size="small" onClick={() => markAllRead()}>全部已读</Button>}
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#6c757d' }}>暂无消息</Box>
          ) : (
            <Box>
              {filtered.map((n, idx) => (
                <Box key={n.notificationId+"-"+n.recipientId} sx={{ p: 2.5, borderBottom: idx < filtered.length -1 ? '1px solid #f1f3f5' : 'none', display: 'flex', gap: 2, background: n.read ? '#fff' : '#f5f9ff', '&:hover': { background: n.read ? '#f8f9fa' : '#e9f2ff' }, cursor: 'pointer' }}
                  onClick={() => !n.read && markAsRead([n.recipientId])}
                >
                  {!n.read && <CircleIcon sx={{ fontSize: 10, mt: 0.75, color: getPriorityColor(n.priority) }} />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 500 : 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.85rem' }}>{n.title}</Typography>
                      <Chip label={getTypeLabel(n.type)} size="small" variant="outlined" sx={{ borderColor: getPriorityColor(n.priority), color: getPriorityColor(n.priority), height: 18, fontSize: '0.6rem' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#555', fontSize: '.7rem', lineHeight: 1.4, mb: 0.5 }}>{n.content}</Typography>
                    <Typography variant="caption" sx={{ color: '#8a93a5', fontSize: '0.6rem' }}>{new Date(n.createdAt).toLocaleString()}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
