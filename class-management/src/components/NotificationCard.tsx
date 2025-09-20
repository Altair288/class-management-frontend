"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// 复用通知类型定义
interface NotificationItem {
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

// 优先级颜色映射
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return '#f44336';
    case 'HIGH': return '#ff9800';
    case 'NORMAL': return '#2196f3';
    case 'LOW': return '#9e9e9e';
    default: return '#2196f3';
  }
};

// 通知类型中文映射
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'LEAVE_SUBMITTED': return '请假提交';
    case 'LEAVE_APPROVED': return '请假通过';
    case 'LEAVE_REJECTED': return '请假拒绝';
    case 'LEAVE_STEP_ADVANCED': return '审批推进';
    default: return '系统通知';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'LEAVE_SUBMITTED': return '📝';
    case 'LEAVE_APPROVED': return '✅';
    case 'LEAVE_REJECTED': return '❌';
    case 'LEAVE_STEP_ADVANCED': return '🔄';
    default: return '📢';
  }
};

interface NotificationCardProps {
  userId: number;
}

export default function NotificationCard({ userId }: NotificationCardProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 获取通知数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const [inboxResponse, countResponse] = await Promise.all([
        fetch(`/api/notifications/inbox?userId=${userId}&limit=5`, {
          credentials: 'include'
        }),
        fetch(`/api/notifications/unread-count?userId=${userId}`, {
          credentials: 'include'
        })
      ]);

      if (inboxResponse.ok && countResponse.ok) {
        const [inboxData, countData] = await Promise.all([
          inboxResponse.json(),
          countResponse.json()
        ]);
        
        setNotifications(inboxData);
        setUnreadCount(countData.unread || 0);
      }
    } catch (error) {
      console.error('获取通知数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  return (
    <Card 
      sx={{ 
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(33,150,243,0.08)',
        border: '1px solid #e3f2fd',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: '#fff',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            消息中心
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={fetchData}
          disabled={loading}
          sx={{ 
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <CardContent sx={{ p: 0, height: 'calc(100% - 80px)' }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 200,
              color: '#9e9e9e',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">暂无消息</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ py: 0 }}>
              {notifications.map((notification, index) => (
                <Box key={notification.notificationId}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read ? '#fff' : '#f3f9ff',
                      py: 1.5,
                      px: 3,
                      '&:hover': {
                        backgroundColor: notification.read ? '#f8f9fa' : '#e8f4fd',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: getPriorityColor(notification.priority),
                            fontSize: '1.2rem',
                          }}
                        >
                          {getTypeIcon(notification.type)}
                        </Avatar>
                        {!notification.read && (
                          <CircleIcon
                            sx={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              fontSize: 12,
                              color: '#f44336',
                            }}
                          />
                        )}
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              color: notification.read ? '#666' : '#333',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.85rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#666',
                              fontSize: '0.75rem',
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5,
                            }}
                          >
                            {notification.content}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getTypeLabel(notification.type)}
                              size="small"
                              sx={{
                                backgroundColor: getPriorityColor(notification.priority),
                                color: '#fff',
                                fontSize: '0.6rem',
                                height: 16,
                                '& .MuiChip-label': { px: 1 },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: '#999', fontSize: '0.65rem' }}
                            >
                              {formatTime(notification.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider sx={{ mx: 3, borderColor: '#e8f4fd' }} />
                  )}
                </Box>
              ))}
            </List>
            
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fafbff' }}>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => {
                  // TODO: 导航到完整消息页面
                  // router.push('/admin/notifications');
                }}
                sx={{
                  color: '#2196f3',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(33,150,243,0.04)',
                  }
                }}
              >
                查看全部消息
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}