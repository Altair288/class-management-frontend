"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

// 与其他页面保持一致，通过 Next.js 代理调用后端
const API_BASE_URL = "/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 后端返回结构
interface LeaveStatisticsResponse {
  approvalDuration: {
    avgHours: number;
    minHours: number;
    maxHours: number;
    count: number;
  };
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  typeCounts: Array<{
    typeName: string;
    count: number;
    typeCode: string;
  }>;
}

// 使用语义 palette key，渲染时动态取 theme 颜色并通过 alpha 生成浅色背景
const quickActions = [
  { title: "总体仪表板", description: "查看请假统计、趋势分析和关键指标", icon: <DashboardIcon />, palette: 'primary', href: "/admin/leave/dashboard" },
  { title: "审批处理", description: "处理待审批请假申请，支持批量操作", icon: <AssignmentIcon />, palette: 'warning', href: "/admin/leave/approval" },
  { title: "日历视图", description: "查看请假日历，按日/周/月展示", icon: <CalendarIcon />, palette: 'success', href: "/admin/leave/calendar" },
  { title: "员工详情", description: "查看员工请假历史和余额情况", icon: <GroupIcon />, palette: 'secondary', href: "/admin/leave/employees" },
  { title: "规则配置", description: "设置请假类型、审批流程和权限", icon: <SettingsIcon />, palette: 'error', href: "/admin/leave/config" },
  { title: "审批日志", description: "查看详细的审批轨迹和操作记录", icon: <HistoryIcon />, palette: 'info', href: "/admin/leave/logs" },
];

type SupportedPalette = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

import type { Theme } from '@mui/material/styles';
interface PaletteColorLike { main?: string }
const getMainColor = (theme: Theme, key: SupportedPalette) => {
  // Theme.palette 没有统一的索引签名，这里通过已知 key 集合做类型收窄
  const map: Record<SupportedPalette, PaletteColorLike | undefined> = {
    primary: theme.palette.primary,
    secondary: theme.palette.secondary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    error: theme.palette.error,
    info: theme.palette.info,
  };
  const paletteSection = map[key];
  return paletteSection?.main || theme.palette.primary.main;
};

export default function LeavePage() {
  const [tabValue, setTabValue] = useState(0);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [avgHours, setAvgHours] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 拉取头部统计
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/leave/statistics`, { signal: controller.signal });
        if (!res.ok) throw new Error(`加载统计失败：${res.status}`);
        const data: LeaveStatisticsResponse = await res.json();
        setTotal(data.total || 0);
        setPending(data.pending || 0);
        setApproved(data.approved || 0);
        setAvgHours(data.approvalDuration?.avgHours ?? 0);
      } catch (e) {
        console.error(e);
        setTotal(0);
        setPending(0);
        setApproved(0);
        setAvgHours(0);
      } finally {
      }
    })();
    return () => controller.abort();
  }, []);

  const cards = [
    { label: "总请假数", value: total, unit: "次", palette: 'primary', icon: <ScheduleIcon /> },
    { label: "待审批", value: pending, unit: "次", palette: 'warning', icon: <WarningIcon /> },
    { label: "已批准", value: approved, unit: "次", palette: 'success', icon: <CheckCircleIcon /> },
    { label: "审批时长", value: Number(avgHours.toFixed(1)), unit: "小时", palette: 'secondary', icon: <AssignmentIcon /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        {/* 页面标题 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            请假管理系统
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理员工请假申请、审批流程、假期配置和统计分析
          </Typography>
        </Box>

        {/* 关键指标统计 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
          {cards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                sx={(theme) => { 
                  const mainColor = getMainColor(theme, stat.palette as SupportedPalette);
                  const bg = alpha(mainColor, theme.palette.mode === 'light' ? 0.10 : 0.25);
                  return ({
                    height: '100%',
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    backgroundColor: theme.palette.background.paper,
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.6)',
                      borderColor: mainColor
                    },
                    '& ._statIconWrapper': {
                      backgroundColor: bg
                    },
                    '& ._statLabel': {
                      color: theme.palette.text.secondary
                    },
                    '& ._statValue': {
                      color: mainColor
                    },
                    '& ._statUnit': {
                      color: theme.palette.text.secondary
                    }
                  });
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box className="_statIconWrapper" sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Box className="_statIcon" sx={(theme) => ({ fontSize: 20, color: getMainColor(theme, stat.palette as SupportedPalette) })}>
                            {stat.icon}
                          </Box>
                        </Box>
                        <Typography 
                          variant="body2" 
                          className="_statLabel"
                          sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography 
                          variant="h3" 
                          className="_statValue"
                          sx={{ fontWeight: 700, fontSize: '2.5rem', lineHeight: 1 }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          className="_statUnit"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {stat.unit}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>

        {/* 功能模块导航 */}
        <Card sx={(theme) => ({ borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
          <Box sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}` })}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  minHeight: 48,
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                },
              }}
            >
              <Tab label="功能导航" />
              <Tab label="快速操作" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {/* 功能模块网格 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    sx={(theme) => {
                      const mainColor = getMainColor(theme, action.palette as SupportedPalette);
                      const bg = alpha(mainColor, theme.palette.mode === 'light' ? 0.12 : 0.25);
                      return {
                        height: '100%',
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        cursor: 'pointer',
                        transition: 'all 0.25s',
                        backgroundColor: theme.palette.background.paper,
                        '&:hover': {
                          borderColor: mainColor,
                          transform: 'translateY(-2px)',
                          boxShadow: theme.palette.mode === 'light' ? '0 4px 12px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.6)',
                        },
                        '& ._qaIconWrapper': {
                          backgroundColor: bg
                        },
                        '& ._qaTitle': {
                          color: theme.palette.text.primary
                        },
                        '& ._qaDesc': {
                          color: theme.palette.text.secondary
                        },
                        '& ._qaIcon': {
                          color: mainColor
                        }
                      }
                    }}
                    component={Link}
                    href={action.href}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                        <Box className="_qaIconWrapper" sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Box className="_qaIcon" sx={{ fontSize: 24 }}>
                            {action.icon}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            className="_qaTitle"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {action.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            className="_qaDesc"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box 
                sx={(theme) => ({ 
                  width: 64,
                  height: 64,
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                })}
              >
                <AssignmentIcon sx={(theme) => ({ fontSize: 32, color: theme.palette.text.secondary })} />
              </Box>
              <Typography variant="h6" gutterBottom sx={(theme) => ({ fontWeight: 600, color: theme.palette.text.primary })}>
                快速操作面板
              </Typography>
              <Typography 
                variant="body2" 
                sx={(theme) => ({ 
                  color: theme.palette.text.secondary, 
                  mb: 3,
                  maxWidth: 400,
                  mx: 'auto',
                  lineHeight: 1.6
                })}
              >
                这里将提供常用的快速操作功能，如批量审批、紧急请假处理等
              </Typography>
              <Alert 
                severity="info" 
                sx={{ 
                  maxWidth: 400, 
                  mx: 'auto',
                  borderRadius: 1,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                快速操作功能正在开发中，敬请期待
              </Alert>
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </motion.div>
  );
}
