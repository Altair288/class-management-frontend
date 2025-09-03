"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  //Divider,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

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
      id={`credits-tabpanel-${index}`}
      aria-labelledby={`credits-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 学分类别颜色映射
const categoryColors: { [key: string]: string } = {
  "德": "#1565c0",
  "智": "#6a1b9a", 
  "体": "#2e7d32",
  "美": "#ef6c00",
  "劳": "#ad1457",
};

// 根据类别名称获取颜色
const getCategoryColor = (itemName: string): string => {
  // 尝试直接匹配
  if (categoryColors[itemName]) {
    return categoryColors[itemName];
  }
  
  // 如果没有直接匹配，尝试匹配第一个字符
  const firstChar = itemName.charAt(0);
  if (categoryColors[firstChar]) {
    return categoryColors[firstChar];
  }
  
  // 默认颜色
  return "#1565c0";
};

// 学分类别接口类型
interface CreditCategory {
  id: number;
  category: string;
  itemName: string;
  initialScore: number;
  maxScore: number;
  description: string;
  enabled: boolean;
}

// 仪表盘统计数据类型
interface DashboardSummary {
  countExcellent: number;
  countGood: number;
  totalClasses: number;
  countWarning: number;
  totalStudents: number;
  avgTi: number;
  countDanger: number;
  avgTotal: number;
  avgMei: number;
  avgZhi: number;
  avgLao: number;
  avgDe: number;
}

export default function CreditsPage() {
  const [tabValue, setTabValue] = useState(0);

  // 从后端获取学分类别数据
  const [creditCategories, setCreditCategories] = useState<CreditCategory[]>([]);
  
  // 从后端获取仪表盘统计数据
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  
  useEffect(() => {
    // 获取仪表盘统计数据
    axios.get("/api/credits/dashboard/summary").then(res => {
      setDashboardSummary(res.data || null);
    }).catch(() => {
      // 错误处理：保持 null
      setDashboardSummary(null);
    });

    // 获取学分类别数据
    axios.get("/api/credits/items").then(res => {
      setCreditCategories(res.data || []);
    }).catch(() => {
      // 错误处理：保持空数组
      setCreditCategories([]);
    });
  }, []);

  // 基于接口数据构建统计数据
  const statsData = [
    { 
      label: "在校学生", 
      value: dashboardSummary?.totalStudents || 0, 
      unit: "人", 
      color: "#1976d2", 
      bgColor: "#e3f2fd" 
    },
    { 
      label: "预警学生", 
      value: dashboardSummary?.countWarning || 0, 
      unit: "人", 
      color: "#d32f2f", 
      bgColor: "#ffebee" 
    },
    { 
      label: "优秀学生", 
      value: dashboardSummary?.countExcellent || 0, 
      unit: "人", 
      color: "#388e3c", 
      bgColor: "#e8f5e8" 
    },
    { 
      label: "平均总分", 
      value: dashboardSummary ? Number(dashboardSummary.avgTotal.toFixed(1)) : 0, 
      unit: "分", 
      color: "#f57c00", 
      bgColor: "#fff3e0" 
    },
  ];

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
            德育学分管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理学生德智体美劳各项学分，配置评分标准和预警机制
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
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#6c757d', 
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          mb: 1
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
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
                    <Box 
                      sx={{ 
                        width: 4,
                        height: 60,
                        backgroundColor: stat.color,
                        borderRadius: 2
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>

        {/* 学分类别概览 */}
        <Card sx={{ mb: 4, borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529' }}>
                学分类别分布
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                5个评估维度
              </Typography>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {creditCategories.map((category, index) => {
                const categoryColor = getCategoryColor(category.itemName);
                const categoryCode = category.itemName.charAt(0).toUpperCase();
                
                return (
                  <Box
                    key={`${category.itemName}-${index}`}
                    sx={{
                      p: 3,
                      borderRadius: 2.5,
                      border: '1px solid #e9ecef',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: categoryColor,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: categoryColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography 
                          sx={{ 
                            color: 'white', 
                            fontSize: '0.875rem',
                            fontWeight: 700
                          }}
                        >
                          {categoryCode}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ color: '#212529', fontWeight: 600 }}
                      >
                        {category.itemName}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6c757d',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        mb: 2
                      }}
                    >
                      {category.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`基础分: ${category.initialScore}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      <Chip
                        label={`上限: ${category.maxScore}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

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
              <Tab label="学分配置" />
              <Tab label="学生管理" />
              <Tab label="预警设置" />
              <Tab label="数据分析" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
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
                <SettingsIcon sx={{ fontSize: 32, color: '#6c757d' }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#212529' }}>
                学分项目配置
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
                配置各类学分的评分标准、权重分配和计算规则，建立完整的学分评估体系
              </Typography>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                href="/admin/credits/config"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 4,
                  py: 1.5,
                }}
              >
                配置管理
              </Button>
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
                <TrendingUpIcon sx={{ fontSize: 32, color: '#6c757d' }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#212529' }}>
                学生学分管理
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
                查看学生学分详情，批量导入导出数据，进行学分调整和异常处理
              </Typography>
              <Button
                variant="contained"
                startIcon={<TrendingUpIcon />}
                href="/admin/credits/students"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 4,
                  py: 1.5,
                }}
              >
                学生管理
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
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
                <WarningIcon sx={{ fontSize: 32, color: '#6c757d' }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#212529' }}>
                预警机制设置
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
                设置学分预警阈值，配置自动通知机制，及时发现和处理学分异常情况
              </Typography>
              <Button
                variant="contained"
                startIcon={<TrendingUpIcon />}
                href="/admin/credits/alerts"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 4,
                  py: 1.5,
                }}
              >
                学生管理
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
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
                <TrendingUpIcon sx={{ fontSize: 32, color: '#6c757d' }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#212529' }}>
                数据分析报表
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
                生成学分统计报表，分析学生表现趋势，为教学管理提供数据支持
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
                数据分析功能待开发，敬请期待
              </Alert>
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </motion.div>
  );
}
