"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewModuleIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface LeaveEvent {
  id: number;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  color: string;
}

// 模拟数据
const mockLeaveEvents: LeaveEvent[] = [
  {
    id: 1,
    employeeId: "EMP001",
    employeeName: "张三",
    type: "年假",
    startDate: "2024-02-15",
    endDate: "2024-02-17",
    status: "approved",
    color: "#1976d2",
  },
  {
    id: 2,
    employeeId: "EMP002",
    employeeName: "李四",
    type: "病假",
    startDate: "2024-02-16",
    endDate: "2024-02-16",
    status: "pending",
    color: "#f57c00",
  },
  {
    id: 3,
    employeeId: "EMP003",
    employeeName: "王五",
    type: "事假",
    startDate: "2024-02-20",
    endDate: "2024-02-21",
    status: "approved",
    color: "#388e3c",
  },
];

const statusConfig = {
  pending: { label: '待审批', color: '#f57c00' },
  approved: { label: '已批准', color: '#388e3c' },
  rejected: { label: '已拒绝', color: '#d32f2f' },
};

const viewModes = [
  { value: 'month', label: '月视图', icon: <CalendarMonthIcon /> },
  { value: 'week', label: '周视图', icon: <ViewWeekIcon /> },
  { value: 'day', label: '日视图', icon: <ViewModuleIcon /> },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [events] = useState<LeaveEvent[]>(mockLeaveEvents);

  // 获取当前月份的所有日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 添加上个月的日期填充
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      days.push({ date: currentDay, isCurrentMonth: true });
    }
    
    // 添加下个月的日期填充（确保6行）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  // 获取指定日期的请假事件
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      return dateStr >= event.startDate && dateStr <= event.endDate;
    });
  };

  // 导航到上一个时间段
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // 导航到下一个时间段
  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // 回到今天
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: LeaveEvent) => {
    setSelectedEvent(event);
    setDetailDialog(true);
  };

  const formatDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    if (viewMode === 'month') {
      return `${year}年${month}月`;
    } else if (viewMode === 'week') {
      // 计算周的开始和结束日期
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
    } else {
      return `${year}年${month}月${currentDate.getDate()}日`;
    }
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <Box>
        {/* 星期标题 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {weekDays.map((day) => (
            <Box key={day} sx={{ p: 2, textAlign: 'center', fontWeight: 600, color: '#6c757d' }}>
              {day}
            </Box>
          ))}
        </Box>
        
        {/* 日期网格 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {days.map((dayInfo, index) => {
            const dayEvents = getEventsForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            
            return (
              <Card
                key={index}
                sx={{
                  minHeight: 120,
                  backgroundColor: dayInfo.isCurrentMonth ? 'white' : '#f8f9fa',
                  border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                <CardContent sx={{ p: 1, height: '100%' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      color: dayInfo.isCurrentMonth ? '#212529' : '#6c757d',
                      mb: 1,
                    }}
                  >
                    {dayInfo.date.getDate()}
                  </Typography>
                  
                  {/* 请假事件 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <Box
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        sx={{
                          p: 0.5,
                          borderRadius: 1,
                          backgroundColor: event.color,
                          color: 'white',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {event.employeeName} - {event.type}
                      </Box>
                    ))}
                    {dayEvents.length > 2 && (
                      <Typography
                        variant="caption"
                        sx={{ color: '#6c757d', fontSize: '0.7rem' }}
                      >
                        +{dayEvents.length - 2} 更多
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderWeekView = () => {
    // 简化的周视图实现
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6c757d' }}>
          周视图功能开发中...
        </Typography>
      </Box>
    );
  };

  const renderDayView = () => {
    // 简化的日视图实现
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6c757d' }}>
          日视图功能开发中...
        </Typography>
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        {/* 页面标题和控制栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
              请假日历
            </Typography>
            <Typography variant="body2" sx={{ color: '#0b87f3ff' }}>
              按日期查看员工请假情况和时间分布
            </Typography>
          </Box>
          
          {/* 视图切换 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>视图模式</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              label="视图模式"
            >
              {viewModes.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {mode.icon}
                    {mode.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 日历导航栏 */}
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={navigatePrevious} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={navigateNext} size="small">
                  <ChevronRightIcon />
                </IconButton>
                <Button
                  startIcon={<TodayIcon />}
                  onClick={goToToday}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 2 }}
                >
                  今天
                </Button>
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529' }}>
                {formatDateRange()}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`待审批: ${events.filter(e => e.status === 'pending').length}`}
                  size="small"
                  color="warning"
                />
                <Chip
                  label={`已批准: ${events.filter(e => e.status === 'approved').length}`}
                  size="small"
                  color="success"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 日历内容 */}
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </CardContent>
        </Card>

        {/* 事件详情对话框 */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>请假详情</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: selectedEvent.color }}>
                    {selectedEvent.employeeName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedEvent.employeeName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6c757d' }}>
                      员工编号: {selectedEvent.employeeId}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                      请假类型
                    </Typography>
                    <Chip
                      label={selectedEvent.type}
                      sx={{ backgroundColor: selectedEvent.color, color: 'white' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                      审批状态
                    </Typography>
                    <Chip
                      label={statusConfig[selectedEvent.status].label}
                      sx={{ 
                        backgroundColor: statusConfig[selectedEvent.status].color,
                        color: 'white'
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                    请假时间
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.startDate} 至 {selectedEvent.endDate}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>关闭</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
