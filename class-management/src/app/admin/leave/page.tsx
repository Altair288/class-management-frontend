"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
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

// 模拟统计数据
const statsData = [
  { label: "总请假数", value: 156, unit: "次", color: "#1976d2", bgColor: "#e3f2fd", icon: <ScheduleIcon /> },
  { label: "待审批", value: 12, unit: "次", color: "#f57c00", bgColor: "#fff3e0", icon: <WarningIcon /> },
  { label: "已批准", value: 128, unit: "次", color: "#388e3c", bgColor: "#e8f5e8", icon: <CheckCircleIcon /> },
  { label: "审批时长", value: 2.3, unit: "小时", color: "#7b1fa2", bgColor: "#f3e5f5", icon: <AssignmentIcon /> },
];

const quickActions = [
  {
    title: "总体仪表板",
    description: "查看请假统计、趋势分析和关键指标",
    icon: <DashboardIcon />,
    color: "#1976d2",
    bgColor: "#e3f2fd",
    href: "/admin/leave/dashboard",
  },
  {
    title: "审批处理",
    description: "处理待审批请假申请，支持批量操作",
    icon: <AssignmentIcon />,
    color: "#f57c00",
    bgColor: "#fff3e0",
    href: "/admin/leave/approval",
  },
  {
    title: "日历视图",
    description: "查看请假日历，按日/周/月展示",
    icon: <CalendarIcon />,
    color: "#388e3c",
    bgColor: "#e8f5e8",
    href: "/admin/leave/calendar",
  },
  {
    title: "员工详情",
    description: "查看员工请假历史和余额情况",
    icon: <GroupIcon />,
    color: "#7b1fa2",
    bgColor: "#f3e5f5",
    href: "/admin/leave/employees",
  },
  {
    title: "规则配置",
    description: "设置请假类型、审批流程和权限",
    icon: <SettingsIcon />,
    color: "#d32f2f",
    bgColor: "#ffebee",
    href: "/admin/leave/config",
  },
  {
    title: "审批日志",
    description: "查看详细的审批轨迹和操作记录",
    icon: <HistoryIcon />,
    color: "#455a64",
    bgColor: "#eceff1",
    href: "/admin/leave/logs",
  },
];

export default function LeavePage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.2s'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            backgroundColor: stat.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box sx={{ color: stat.color, fontSize: 20 }}>
                            {stat.icon}
                          </Box>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#6c757d', 
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            color: stat.color, 
                            fontWeight: 700,
                            fontSize: '2.5rem',
                            lineHeight: 1
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem'
                          }}
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
        <Card sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <Box sx={{ borderBottom: '1px solid #e0e0e0' }}>
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
                    sx={{
                      height: '100%',
                      borderRadius: 2,
                      border: '1px solid #e9ecef',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: action.color,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                    component={Link}
                    href={action.href}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: action.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Box sx={{ color: action.color, fontSize: 24 }}>
                            {action.icon}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#212529', 
                              fontWeight: 600,
                              mb: 1
                            }}
                          >
                            {action.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#6c757d',
                              lineHeight: 1.6
                            }}
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
                sx={{ 
                  width: 64,
                  height: 64,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <AssignmentIcon sx={{ fontSize: 32, color: '#6c757d' }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#212529' }}>
                快速操作面板
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6c757d', 
                  mb: 3,
                  maxWidth: 400,
                  mx: 'auto',
                  lineHeight: 1.6
                }}
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
