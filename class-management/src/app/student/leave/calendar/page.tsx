"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
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
import { alpha, useTheme } from '@mui/material/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewModuleIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// 使用 Next.js 代理
const API_BASE_URL = "/api";

// 后端日历事件（DTO）
interface LeaveCalendarDTO {
  requestId: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  leaveTypeCode: string; // annual/sick/personal/...
  leaveTypeName: string;
  status: string; // 待审批/已批准/已拒绝
  startDate: string; // ISO 时间
  endDate: string;   // ISO 时间
}

// 页面使用的事件模型（附带衍生字段）
interface LeaveEvent {
  requestId: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  status: string;
  start: Date;
  end: Date;
  startYmd: string; // YYYY-MM-DD
  endYmd: string;   // YYYY-MM-DD
  color: {
    primary: string;
    bg: string;
  };
}

interface ClassSimple { id: number; name: string; grade: string }

// 状态使用主题 palette 映射
const statusPaletteMap: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  '待审批': 'warning',
  '已批准': 'success',
  '已拒绝': 'error'
};

const viewModes = [
  { value: 'month', label: '月', icon: <CalendarMonthIcon /> },
  { value: 'week', label: '周', icon: <ViewWeekIcon /> },
  { value: 'day', label: '日', icon: <ViewModuleIcon /> },
];

export default function CalendarPage() {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [classes, setClasses] = useState<ClassSimple[]>([]);
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [loading, setLoading] = useState(false);

  // 实用函数：日期转 YYYY-MM-DD（本地时区）
  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 起止时间（UTC ISO 字符串，便于后端解析）
  const isoStartOfDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)).toISOString();
  const isoEndOfDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)).toISOString();

  // 请假类型映射 -> palette key
  const typePaletteMap = useMemo<Record<string, 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'>>(()=>({
    annual: 'primary',
    sick: 'success',
    personal: 'warning',
    emergency: 'error'
  }), []);
  const typeColor = useCallback((code: string) => {
    const key = typePaletteMap[code] || 'info';
  // 通过索引访问 palette 动态键（受限于 TS 类型，可用断言）
  const paletteSection = theme.palette[key as keyof typeof theme.palette] as { main: string };
  const main = paletteSection.main;
    return {
      primary: main,
      bg: alpha(main, theme.palette.mode === 'light' ? 0.15 : 0.28)
    };
  }, [theme, typePaletteMap]);

  const getStatusInfo = useCallback((status: string) => {
    const key = statusPaletteMap[status] || 'info';
  const paletteSection = theme.palette[key as keyof typeof theme.palette] as { main: string };
  const main = paletteSection.main;
    return {
      label: status,
      color: main,
      bgColor: alpha(main, theme.palette.mode === 'light' ? 0.15 : 0.25)
    };
  }, [theme]);

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
    const dateStr = ymd(date);
    return events.filter(event => dateStr >= event.startYmd && dateStr <= event.endYmd);
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
      <Box sx={(theme)=>({ backgroundColor: theme.palette.background.paper, borderRadius: 2 })}>
        {/* 星期标题 - 苹果风格 */}
        <Box sx={(theme)=>({ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.action.hover
        })}>
          {weekDays.map((day, index) => (
            <Box 
              key={day} 
              sx={(theme)=>({ 
                p: 2, 
                textAlign: 'center', 
                fontWeight: 600, 
                color: index === 0 || index === 6 ? theme.palette.error.main : theme.palette.text.secondary,
                fontSize: '0.875rem',
                borderRight: index < 6 ? `1px solid ${theme.palette.divider}` : 'none'
              })}
            >
              {day}
            </Box>
          ))}
        </Box>
        
        {/* 日期网格 - 苹果风格 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((dayInfo, index) => {
            const dayEvents = getEventsForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
            const row = Math.floor(index / 7);
            
            return (
              <Box
                key={index}
                sx={(theme)=>({
                  minHeight: 120,
                  borderRight: (index % 7) < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                  borderBottom: row < 5 ? `1px solid ${theme.palette.divider}` : 'none',
                  backgroundColor: dayInfo.isCurrentMonth ? theme.palette.background.paper : theme.palette.action.hover,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                })}
              >
                <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 日期数字 */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isToday ? theme.palette.primary.main : 'transparent',
                        color: isToday 
                          ? theme.palette.primary.contrastText 
                          : dayInfo.isCurrentMonth 
                            ? (isWeekend ? theme.palette.error.main : theme.palette.text.primary)
                            : theme.palette.text.disabled,
                        fontWeight: isToday ? 600 : 500,
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {dayInfo.date.getDate()}
                    </Box>
                  </Box>
                  
                  {/* 请假事件 - 紧凑显示 */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <motion.div
                        key={`${event.requestId}-${eventIndex}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: eventIndex * 0.05 }}
                      >
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: event.color.primary,
                            color: theme.palette.getContrastText(event.color.primary),
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            },
                          }}
                        >
                          {event.studentName}
                        </Box>
                      </motion.div>
                    ))}
                    {dayEvents.length > 3 && (
                      <Box
                        sx={(theme)=>({
                          px: 1,
                          py: 0.25,
                          color: theme.palette.text.secondary,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                        })}
                      >
                        还有 {dayEvents.length - 3} 个
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderWeekView = () => {
    // 周起止（周日-周六）
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();

    return (
      <Box sx={(theme)=>({ backgroundColor: theme.palette.background.paper, borderRadius: 2, overflow: 'hidden' })}>
        {/* 星期标题 */}
        <Box sx={(theme)=>({ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.action.hover
        })}>
          {weekDays.map((day, index) => {
            const currentDay = days[index];
            const isToday = currentDay.toDateString() === today.toDateString();
            const isWeekend = index === 0 || index === 6;
            
            return (
              <Box 
                key={day} 
                sx={(theme)=>({ 
                  p: 2, 
                  textAlign: 'center',
                  borderRight: index < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                  backgroundColor: isToday ? theme.palette.primary.main : 'transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                <Typography 
                  variant="body2" 
                  sx={(theme)=>({ 
                    fontWeight: 600, 
                    color: isToday ? theme.palette.primary.contrastText : (isWeekend ? theme.palette.error.main : theme.palette.text.secondary),
                    mb: 0.5,
                    fontSize: '0.875rem'
                  })}
                >
                  {day}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={(theme)=>({ 
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? theme.palette.primary.contrastText : theme.palette.text.primary,
                    fontSize: '1.25rem'
                  })}
                >
                  {currentDay.getDate()}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {/* 每日列 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 400 }}>
          {days.map((d, idx) => {
            const dayEvents = getEventsForDate(d);
            const isToday = d.toDateString() === today.toDateString();
            
            return (
              <Box 
                key={idx} 
                sx={(theme)=>({ 
                  borderRight: idx < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                  backgroundColor: isToday ? theme.palette.action.hover : theme.palette.background.paper,
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                })}
              >
                <Box sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
                    {dayEvents.length === 0 ? (
                      <Box sx={(theme)=>({ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        color: theme.palette.text.disabled,
                        fontSize: '0.875rem'
                      })}>
                        无安排
                      </Box>
                    ) : (
                      dayEvents.map((ev, eventIndex) => (
                        <motion.div
                          key={`${ev.requestId}-${ev.startYmd}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: eventIndex * 0.05 }}
                        >
                          <Box
                            onClick={() => handleEventClick(ev)}
                            sx={(theme)=>({
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: ev.color.bg,
                              border: `1px solid ${alpha(ev.color.primary,0.25)}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': { 
                                transform: 'translateY(-2px)',
                                boxShadow: theme.palette.mode==='light' ? '0 4px 12px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.6)',
                                borderColor: `${alpha(ev.color.primary,0.4)}`
                              },
                            })}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Box 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  backgroundColor: ev.color.primary,
                                  flexShrink: 0
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: ev.color.primary,
                                  fontSize: '0.875rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {ev.studentName}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="caption" 
                              sx={(theme)=>({ 
                                color: theme.palette.text.secondary,
                                fontSize: '0.75rem',
                                display: 'block'
                              })}
                            >
                              {ev.leaveTypeName}
                            </Typography>
                          </Box>
                        </motion.div>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    return (
      <Box sx={(theme)=>({ backgroundColor: theme.palette.background.paper, borderRadius: 2, overflow: 'hidden' })}>
        {/* 日期标题 */}
        <Box sx={(theme)=>({ 
          p: 3, 
          backgroundColor: isToday ? theme.palette.primary.main : theme.palette.action.hover,
          borderBottom: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        })}>
          <Typography 
            variant="h4" 
            sx={(theme)=>({ 
              fontWeight: 700, 
              color: isToday ? theme.palette.primary.contrastText : theme.palette.text.primary,
              mb: 0.5
            })}
          >
            {currentDate.getDate()}
          </Typography>
          <Typography 
            variant="body2" 
            sx={(theme)=>({ 
              color: isToday ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              fontWeight: 500
            })}
          >
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </Typography>
        </Box>
        
        {/* 事件列表 */}
        <Box sx={{ p: 3 }}>
          {dayEvents.length === 0 ? (
            <Box sx={(theme)=>({ 
              textAlign: 'center', 
              py: 8,
              color: theme.palette.text.disabled
            })}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                无请假安排
              </Typography>
              <Typography variant="body2">
                当天暂无学生请假申请
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dayEvents.map((ev, index) => (
                <motion.div
                  key={ev.requestId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box
                    onClick={() => handleEventClick(ev)}
                    sx={(theme)=>({
                      p: 3,
                      borderRadius: 3,
                      backgroundColor: ev.color.bg,
                      border: `1px solid ${alpha(ev.color.primary,0.25)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.palette.mode==='light' ? '0 8px 24px rgba(0,0,0,0.16)' : '0 8px 24px rgba(0,0,0,0.7)',
                        borderColor: `${alpha(ev.color.primary,0.4)}`
                      },
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      {/* 头像 */}
                      <Avatar 
                        sx={(theme)=>({ 
                          bgcolor: ev.color.primary, 
                          width: 56, 
                          height: 56,
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: theme.palette.getContrastText(ev.color.primary)
                        })}
                      >
                        {ev.studentName[0]}
                      </Avatar>
                      
                      {/* 内容 */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={(theme)=>({ 
                              fontWeight: 600, 
                              color: theme.palette.text.primary,
                              fontSize: '1.125rem'
                            })}
                          >
                            {ev.studentName}
                          </Typography>
                          <Chip
                            label={ev.studentNo}
                            size="small"
                            sx={(theme)=>({
                              backgroundColor: theme.palette.action.hover,
                              color: theme.palette.text.secondary,
                              fontSize: '0.75rem',
                              height: 24,
                              border: `1px solid ${theme.palette.divider}`
                            })}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: ev.color.primary 
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                                sx={{ 
                                  color: ev.color.primary, 
                                  fontWeight: 600,
                                  fontSize: '0.9rem'
                                }}
                            >
                              {ev.leaveTypeName}
                            </Typography>
                          </Box>
                          
                          {(() => { 
                            const info = getStatusInfo(ev.status); 
                            return (
                              <Chip
                                label={info.label}
                                size="small"
                                sx={{
                                  backgroundColor: info.bgColor,
                                  color: info.color,
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  border: `1px solid ${alpha(info.color,0.25)}`
                                }}
                              />
                            ); 
                          })()}
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          sx={(theme)=>({ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem'
                          })}
                        >
                          {ev.startYmd === ev.endYmd 
                            ? `单日请假：${ev.startYmd}` 
                            : `请假期间：${ev.startYmd} 至 ${ev.endYmd}`
                          }
                        </Typography>
                      </Box>
                      
                      {/* 箭头指示 */}
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%',
                        backgroundColor: alpha(ev.color.primary,0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderTop: `2px solid ${ev.color.primary}`,
                          borderRight: `2px solid ${ev.color.primary}`,
                          transform: 'rotate(45deg)'
                        }} />
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // 拉取班级和日历数据
  useEffect(() => {
    // 首次加载班级
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/class/simple`);
        if (res.ok) {
          const data: ClassSimple[] = await res.json();
          setClasses(data);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // 计算时间范围
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let startStr = '';
  let endStr = '';

    if (viewMode === 'month') {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  startStr = isoStartOfDay(start);
  endStr = isoEndOfDay(end);
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
  startStr = isoStartOfDay(start);
  endStr = isoEndOfDay(end);
    } else {
      const d = new Date(currentDate);
  startStr = isoStartOfDay(d);
  endStr = isoEndOfDay(d);
    }

    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('start', startStr);
        params.set('end', endStr);
        if (classFilter !== "") params.set('classId', String(classFilter));
        if (statusFilter !== "") params.set('status', statusFilter);
        const url = `${API_BASE_URL}/leave/calendar?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`加载日历失败：${res.status}`);
        const list: LeaveCalendarDTO[] = await res.json();
        const mapped: LeaveEvent[] = list.map(it => {
          const start = new Date(it.startDate);
          const end = new Date(it.endDate);
          return {
            requestId: it.requestId,
            studentId: it.studentId,
            studentName: it.studentName,
            studentNo: it.studentNo,
            leaveTypeCode: it.leaveTypeCode,
            leaveTypeName: it.leaveTypeName,
            status: it.status,
            start,
            end,
            startYmd: ymd(start),
            endYmd: ymd(end),
            color: typeColor(it.leaveTypeCode),
          };
        });
        setEvents(mapped);
      } catch (e) {
        console.error(e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [currentDate, viewMode, classFilter, statusFilter, typeColor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
  <Box sx={{ p: 3, backgroundColor: 'transparent', minHeight: '100vh' }}>
        {/* 页面标题和控制栏 - 苹果风格 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={(theme)=>({ fontWeight: 700, color: theme.palette.text.primary, mb: 1 })}>
                请假日历
              </Typography>
              <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary, fontSize: '1rem' })}>
                查看学生请假安排和时间分布
              </Typography>
            </Box>
            
            {/* 视图切换和筛选 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 视图模式选择器 - 统一滑块风格 */}
              <Box sx={(theme)=>({ 
                display: 'flex', 
                backgroundColor: theme.palette.action.hover,
                borderRadius: 8,
                p: 0.5,
                border: `1px solid ${theme.palette.divider}`
              })}>
                {viewModes.map((mode) => (
                  <Button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    sx={(theme)=>({
                      px: 2.5,
                      py: 1,
                      minWidth: 60,
                      height: 30,
                      backgroundColor: viewMode === mode.value ? theme.palette.background.paper : 'transparent',
                      color: viewMode === mode.value ? theme.palette.primary.main : theme.palette.text.secondary,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      boxShadow: viewMode === mode.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: viewMode === mode.value ? theme.palette.background.paper : theme.palette.action.hover,
                        color: theme.palette.primary.main,
                      },
                    })}
                  >
                    {mode.label}
                  </Button>
                ))}
              </Box>

              <FormControl size="small" sx={{ minWidth: 120, height: 36 }}>
                <InputLabel sx={(theme)=>({ color: theme.palette.text.secondary, fontSize: '0.875rem' })}>班级</InputLabel>
                <Select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value as number | "")}
                  label="班级"
                  sx={(theme)=>({
                    height: 36,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  })}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>全部班级</MenuItem>
                  {classes.map(c => (
                    <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.875rem' }}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120, height: 36 }}>
                <InputLabel sx={(theme)=>({ color: theme.palette.text.secondary, fontSize: '0.875rem' })}>状态</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as string | "")}
                  label="状态"
                  sx={(theme)=>({
                    height: 36,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  })}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>全部状态</MenuItem>
                  <MenuItem value="待审批" sx={{ fontSize: '0.875rem' }}>待审批</MenuItem>
                  <MenuItem value="已批准" sx={{ fontSize: '0.875rem' }}>已批准</MenuItem>
                  <MenuItem value="已拒绝" sx={{ fontSize: '0.875rem' }}>已拒绝</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 日历导航栏 - 苹果风格 */}
          <Box sx={(theme)=>({ 
            p: 3, 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode==='light' ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.6)'
          })}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={navigatePrevious} 
                  size="small"
                  sx={(theme)=>({ 
                    backgroundColor: theme.palette.action.hover,
                    '&:hover': { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText },
                    transition: 'all 0.15s ease'
                  })}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton 
                  onClick={navigateNext} 
                  size="small"
                  sx={(theme)=>({ 
                    backgroundColor: theme.palette.action.hover,
                    '&:hover': { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText },
                    transition: 'all 0.15s ease'
                  })}
                >
                  <ChevronRightIcon />
                </IconButton>
                <Button
                  startIcon={<TodayIcon />}
                  onClick={goToToday}
                  size="small"
                  sx={(theme)=>({ 
                    ml: 2,
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText },
                    transition: 'all 0.15s ease'
                  })}
                >
                  今天
                </Button>
              </Box>
              
              <Typography variant="h5" sx={(theme)=>({ fontWeight: 700, color: theme.palette.text.primary })}>
                {formatDateRange()}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {(['待审批','已批准'] as const).map(status=>{ const info = getStatusInfo(status); return (
                  <Chip
                    key={status}
                    label={`${status} ${events.filter(e => e.status === status).length}`}
                    sx={{
                      backgroundColor: info.bgColor,
                      color: info.color,
                      fontWeight: 600,
                      border: `1px solid ${info.color}20`
                    }}
                  />
                ); })}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 日历内容 */}
        <motion.div
          key={`${viewMode}-${currentDate.toISOString()}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={(theme)=>({ 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          })}>
            {loading ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary })}>加载中...</Typography>
              </Box>
            ) : (
              <>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </>
            )}
          </Box>
        </motion.div>

        {/* 事件详情对话框 - 苹果风格 */}
        <Dialog 
          open={detailDialog} 
          onClose={() => setDetailDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: (theme)=>({
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode==='light' ? '0 16px 32px rgba(0,0,0,0.15)' : '0 16px 32px rgba(0,0,0,0.6)',
            })
          }}
        >
          <DialogTitle sx={(theme)=>({ 
            pb: 2, 
            backgroundColor: theme.palette.action.hover
          })}>
            <Typography variant="h6" sx={(theme)=>({ fontWeight: 700, color: theme.palette.text.primary })}>
              请假详情
            </Typography>
          </DialogTitle>
          <DialogContent sx={(theme)=>({ p: 4, backgroundColor: theme.palette.background.paper })}>
            {selectedEvent && (
              <Box>
                {/* 学生信息卡片 */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3, 
                  mb: 4,
                  p: 3,
                  backgroundColor: selectedEvent.color.bg,
                  borderRadius: 3,
                  border: `1px solid ${selectedEvent.color.primary}20`
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: selectedEvent.color.primary, 
                      width: 64, 
                      height: 64,
                      fontSize: '1.5rem',
                      fontWeight: 700
                    }}
                  >
                    {selectedEvent.studentName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={(theme)=>({ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 })}>
                      {selectedEvent.studentName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary })}>
                        学号:
                      </Typography>
                      <Chip
                        label={selectedEvent.studentNo}
                        size="small"
                        sx={(theme)=>({
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          height: 24
                        })}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {/* 详细信息 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 })}>
                        请假类型
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            backgroundColor: selectedEvent.color.primary 
                          }} 
                        />
                        <Typography variant="body1" sx={(theme)=>({ fontWeight: 600, color: theme.palette.text.primary })}>
                          {selectedEvent.leaveTypeName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 })}>
                        审批状态
                      </Typography>
                      {(() => { 
                        const info = getStatusInfo(selectedEvent.status); 
                        return (
                          <Chip
                            label={info.label}
                            sx={{
                              backgroundColor: info.bgColor,
                              color: info.color,
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              height: 32,
                              border: `1px solid ${info.color}20`
                            }}
                          />
                        ); 
                      })()}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary, mb: 1.5, fontWeight: 500 })}>
                      请假时间
                    </Typography>
                    <Box sx={(theme)=>({ 
                      p: 3, 
                      backgroundColor: theme.palette.action.hover, 
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    })}>
                      <Typography variant="h6" sx={(theme)=>({ fontWeight: 600, color: theme.palette.text.primary })}>
                        {selectedEvent.startYmd === selectedEvent.endYmd 
                          ? `${selectedEvent.startYmd}（单日）`
                          : `${selectedEvent.startYmd} 至 ${selectedEvent.endYmd}`
                        }
                      </Typography>
                      {selectedEvent.startYmd !== selectedEvent.endYmd && (
                        <Typography variant="body2" sx={(theme)=>({ color: theme.palette.text.secondary, mt: 0.5 })}>
                          共计 {Math.ceil((new Date(selectedEvent.endYmd).getTime() - new Date(selectedEvent.startYmd).getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={(theme)=>({ 
            p: 4, 
            pt: 0, 
            backgroundColor: theme.palette.background.paper,
            justifyContent: 'center'
          })}>
            <Button 
              onClick={() => setDetailDialog(false)}
              sx={(theme)=>({
                px: 4,
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
                borderRadius: 2,
                minWidth: 120,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                transition: 'all 0.15s ease'
              })}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
