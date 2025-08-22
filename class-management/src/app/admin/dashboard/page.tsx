"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
} from "@mui/material";
import {
  Group as GroupIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// 模拟数据
const dashboardStats = [
  {
    title: "在校学生",
    value: 1248,
    unit: "人",
    change: "+5.2%",
    color: "#007bff",
    icon: <GroupIcon />,
    bgColor: "#e3f2fd",
  },
  {
    title: "班级数量", 
    value: 42,
    unit: "个",
    change: "+2",
    color: "#28a745",
    icon: <SchoolIcon />,
    bgColor: "#e8f5e8",
  },
  {
    title: "预警学生",
    value: 23,
    unit: "人", 
    change: "-12.8%",
    color: "#dc3545",
    icon: <WarningIcon />,
    bgColor: "#ffebee",
  },
  {
    title: "优秀学生",
    value: 342,
    unit: "人",
    change: "+8.4%", 
    color: "#ffc107",
    icon: <CheckCircleIcon />,
    bgColor: "#fff8e1",
  },
];

const recentActivities = [
  {
    id: 1,
    type: "学分预警",
    content: "张三德育学分低于60分，已发送预警通知",
    time: "2小时前",
    status: "warning",
  },
  {
    id: 2, 
    type: "学分更新",
    content: "计算机2024-1班学分数据已更新",
    time: "4小时前", 
    status: "success",
  },
  {
    id: 3,
    type: "系统通知",
    content: "德育学分评估标准已更新",
    time: "1天前",
    status: "info",
  },
];

const creditOverview = [
  { category: "德育", total: 89.5, trend: "+2.3%" },
  { category: "智育", total: 92.1, trend: "+1.8%" },
  { category: "体育", total: 85.7, trend: "-0.5%" },
  { category: "美育", total: 78.9, trend: "+3.2%" },
  { category: "劳育", total: 83.4, trend: "+1.1%" },
];

export default function AdminDashboard() {
  const [sidebarOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <Sidebar open={sidebarOpen} />
      <Box
        sx={{
          transition: "margin-left 0.2s",
          ml: { xs: 0, md: sidebarOpen ? "240px" : 0 },
          p: { xs: 2, md: 3 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 页面标题 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#212529", mb: 1 }}>
              系统概览
            </Typography>
            <Typography variant="body2" sx={{ color: "#6c757d" }}>
              欢迎使用班级管理系统，查看最新的数据统计和系统状态
            </Typography>
          </Box>

          {/* 统计卡片 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
            {dashboardStats.map((stat, index) => (
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'box-shadow 0.2s'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: stat.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box sx={{ color: stat.color, fontSize: 24 }}>
                          {stat.icon}
                        </Box>
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: stat.change.startsWith('+') ? '#28a745' : '#dc3545',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          backgroundColor: stat.change.startsWith('+') ? '#d4edda' : '#f8d7da',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        {stat.change}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6c757d', 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 1
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          color: '#212529', 
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>

          {/* 主要内容区域 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            {/* 学分概览 */}
            <Card sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529' }}>
                    学分概览
                  </Typography>
                  <Button
                    component={Link}
                    href="/admin/credits"
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: 1 }}
                  >
                    查看详情
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {creditOverview.map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#212529' }}>
                          {item.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#212529' }}>
                            {item.total}分
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: item.trend.startsWith('+') ? '#28a745' : '#dc3545',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {item.trend}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.total}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e9ecef',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.total >= 90 ? '#28a745' : 
                                           item.total >= 80 ? '#007bff' :
                                           item.total >= 70 ? '#ffc107' : '#dc3545',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* 最近活动 */}
            <Card sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                  最近活动
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentActivities.map((activity) => (
                    <Box 
                      key={activity.id}
                      sx={{ 
                        p: 2,
                        borderLeft: `3px solid ${
                          activity.status === 'warning' ? '#ffc107' :
                          activity.status === 'success' ? '#28a745' : '#007bff'
                        }`,
                        backgroundColor: '#f8f9fa',
                        borderRadius: '0 4px 4px 0',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#212529', mb: 0.5 }}>
                        {activity.type}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6c757d', mb: 1, lineHeight: 1.4 }}>
                        {activity.content}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.75rem' }}>
                        {activity.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 快速操作 */}
          <Card sx={{ mt: 3, borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                快速操作
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Button
                  component={Link}
                  href="/admin/credits/config"
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1, 
                    p: 2,
                    justifyContent: 'flex-start',
                    color: '#212529',
                    borderColor: '#e9ecef',
                    '&:hover': {
                      borderColor: '#007bff',
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  配置学分项目
                </Button>
                <Button
                  component={Link}
                  href="/admin/credits/students"
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1, 
                    p: 2,
                    justifyContent: 'flex-start',
                    color: '#212529',
                    borderColor: '#e9ecef',
                    '&:hover': {
                      borderColor: '#007bff',
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  管理学生学分
                </Button>
                <Button
                  component={Link}
                  href="/admin/credits/alerts"
                  variant="outlined"
                  startIcon={<WarningIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1, 
                    p: 2,
                    justifyContent: 'flex-start',
                    color: '#212529',
                    borderColor: '#e9ecef',
                    '&:hover': {
                      borderColor: '#007bff',
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  设置预警机制
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}