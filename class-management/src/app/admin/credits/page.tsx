"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Divider,
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

// 模拟数据
const creditCategories = [
  { id: 1, name: "德育", code: "DE", description: "思想品德与道德修养", color: "#1565c0" },
  { id: 2, name: "智育", code: "ZH", description: "学业成绩与知识掌握", color: "#6a1b9a" },
  { id: 3, name: "体育", code: "TI", description: "身体素质与健康状况", color: "#2e7d32" },
  { id: 4, name: "美育", code: "ME", description: "艺术修养与审美能力", color: "#ef6c00" },
  { id: 5, name: "劳育", code: "LA", description: "劳动技能与实践能力", color: "#ad1457" },
];

const statsData = [
  { label: "在校学生", value: 1248, unit: "人", trend: "+5.2%", color: "#1976d2", bgColor: "#e3f2fd" },
  { label: "预警学生", value: 23, unit: "人", trend: "-12.8%", color: "#d32f2f", bgColor: "#ffebee" },
  { label: "优秀学生", value: 342, unit: "人", trend: "+8.4%", color: "#388e3c", bgColor: "#e8f5e8" },
  { label: "平均总分", value: 432.8, unit: "分", trend: "+2.1%", color: "#f57c00", bgColor: "#fff3e0" },
];

export default function CreditsPage() {
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
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: stat.trend.startsWith('+') ? '#28a745' : '#dc3545',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {stat.trend} 较上月
                      </Typography>
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
              {creditCategories.map((category) => (
                <Box
                  key={category.id}
                  sx={{
                    p: 3,
                    borderRadius: 1,
                    border: '1px solid #e9ecef',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: category.color,
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
                        backgroundColor: category.color,
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
                        {category.code}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ color: '#212529', fontWeight: 600 }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6c757d',
                      fontSize: '0.875rem',
                      lineHeight: 1.5
                    }}
                  >
                    {category.description}
                  </Typography>
                </Box>
              ))}
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
                startIcon={<WarningIcon />}
                href="/admin/credits/alerts"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 4,
                  py: 1.5,
                }}
              >
                预警配置
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
                数据分析功能正在开发中，敬请期待
              </Alert>
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </motion.div>
  );
}
