"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
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
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import NotificationPanel from "@/components/NotificationPanel";
import { useNotificationContext } from '@/context/NotificationContext';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

// 仪表盘汇总数据类型
type DashboardSummary = {
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
};

type TopCard = {
  title: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
};

interface UserInfo {
  id: number;
  username: string;
  userType: string;
}

export default function AdminDashboard() {
  const [sidebarOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  // 拉取用户信息
  useEffect(() => {
    axios.get("/api/users/current")
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // 拉取汇总数据
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/credits/dashboard/summary");
        if (!res.ok) throw new Error("加载失败");
        const data: DashboardSummary = await res.json();
        setSummary(data);
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // 顶部统计卡数据（从接口映射）
  const topCards: TopCard[] = useMemo(() => {
    return [
      {
        title: "在校学生",
        value: summary?.totalStudents ?? 0,
        unit: "人",
        color: "#1976d2",
        icon: <GroupIcon />,
        bgColor: "#e3f2fd",
      },
      {
        title: "班级数量",
        value: summary?.totalClasses ?? 0,
        unit: "个",
        color: "#2e7d32",
        icon: <SchoolIcon />,
        bgColor: "#e8f5e9",
      },
      {
        title: "预警学生",
        value: summary?.countWarning ?? 0,
        unit: "人",
        color: "#d32f2f",
        icon: <WarningIcon />,
        bgColor: "#ffebee",
      },
      {
        title: "优秀学生",
        value: summary?.countExcellent ?? 0,
        unit: "人",
        color: "#f9a825",
        icon: <CheckCircleIcon />,
        bgColor: "#fff8e1",
      },
    ];
  }, [summary]);

  const skeletonCards: TopCard[] = useMemo(
    () =>
      Array.from({ length: 4 }).map(() => ({
        title: "",
        value: 0,
        unit: "",
        color: "#ccc",
        icon: <></>,
        bgColor: "#f0f2f5",
      })),
    []
  );

  // 学分平均分概览
  const creditOverview = useMemo(() => {
    return [
      { category: "德育", total: summary ? Number(summary.avgDe?.toFixed(1)) : 0 },
      { category: "智育", total: summary ? Number(summary.avgZhi?.toFixed(1)) : 0 },
      { category: "体育", total: summary ? Number(summary.avgTi?.toFixed(1)) : 0 },
      { category: "美育", total: summary ? Number(summary.avgMei?.toFixed(1)) : 0 },
      { category: "劳育", total: summary ? Number(summary.avgLao?.toFixed(1)) : 0 },
    ];
  }, [summary]);

  // 通过 context 可拿到 unreadCount，如需要可展示在标题旁
  useNotificationContext();

  return (
  <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <Sidebar open={sidebarOpen} />
      <Box
        sx={{
      transition: "margin-left 0.2s",
      ml: { xs: 0, md: sidebarOpen ? "240px" : 0 },
      p: { xs: 1.5, md: 2 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 页面标题 */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#212529", mb: 1 }}>
              系统概览
            </Typography>
            <Typography variant="body2" sx={{ color: "#6c757d" }}>
              欢迎使用班级管理系统，查看最新的数据统计和系统状态
            </Typography>
          </Box>

          {/* 统计卡片 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 1.5, mb: 2 }}>
            {(loading ? skeletonCards : topCards).map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{ height:'100%', borderRadius:1, border:'1px solid #e0e0e0', boxShadow:'none' }}>
                  <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: loading ? '#f0f2f5' : stat.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Box sx={{ color: stat.color, fontSize: 24 }}>
                            {stat.icon}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color:'#6c757d', fontSize:'0.8rem', fontWeight:500, mb: .25 }}>
                      {loading ? '加载中' : stat.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h3" sx={{ color:'#212529', fontWeight:700, fontSize:'1.7rem', lineHeight:1 }}>
                        {loading ? '--' : stat.value}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem'
                        }}
                      >
                        {loading ? '' : stat.unit}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>

          {/* 主要内容区域 */}
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', lg:'2fr 1fr'}, gap: 1.5 }}>
            {/* 学分概览 */}
            <Card sx={{ borderRadius:1, border:'1px solid #e0e0e0', boxShadow:'none' }}>
              <CardContent sx={{ p: 1.5 }}>
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
                
                <Box sx={{ display:'flex', flexDirection:'column', gap: 2.25 }}>
                  {creditOverview.map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#212529' }}>
                          {item.category}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#212529' }}>
                          {loading ? '--' : `${item.total}分`}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Number.isFinite(item.total) ? item.total : 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e9ecef',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.total >= 90 ? '#2e7d32' : 
                                           item.total >= 80 ? '#1976d2' :
                                           item.total >= 70 ? '#f9a825' : '#d32f2f',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* 右侧区域：消息通知和最近活动 */}
            <Box sx={{ display:'flex', flexDirection:'column', gap: 1.5 }}>
              {/* 消息通知 */}
              {user && user.id && (
                <NotificationPanel userId={user.id} variant="dashboard" limit={5} />
              )}

              {/* 最近活动 */}
              <Card sx={{ borderRadius:1, border:'1px solid #e0e0e0', boxShadow:'none' }}>
                <CardContent sx={{ p:1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                    最近活动
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[{id:1,type:'学分预警',content:'系统已完成最新学分统计',time:'刚刚',status:'info'}].map((activity) => (
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
          </Box>

          {/* 快速操作 */}
          <Card sx={{ mt: 1.5, borderRadius:1, border:'1px solid #e0e0e0', boxShadow:'none' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                快速操作
              </Typography>
              
              <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap: 1 }}>
                <Button
                  component={Link}
                  href="/admin/credits/config"
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1, 
                    p: 1.5,
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
                    p: 1.5,
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
                    p: 1.5,
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
                <Button
                  component={Link}
                  href="/admin/leave/students"
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  sx={{ 
                    textTransform:'none', borderRadius:1, p:1.2, justifyContent:'flex-start', color:'#212529', borderColor:'#e9ecef',
                    '&:hover': { borderColor:'#007bff', backgroundColor:'#f8f9fa' }
                  }}
                >学生请假管理</Button>
                <Button
                  component={Link}
                  href="/admin/leave/approval"
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ 
                    textTransform:'none', borderRadius:1, p:1.2, justifyContent:'flex-start', color:'#212529', borderColor:'#e9ecef',
                    '&:hover': { borderColor:'#007bff', backgroundColor:'#f8f9fa' }
                  }}
                >请假审批</Button>
                <Button
                  component={Link}
                  href="/admin/notifications"
                  variant="outlined"
                  startIcon={<MailOutlineIcon />}
                  sx={{ 
                    textTransform:'none', borderRadius:1, p:1.2, justifyContent:'flex-start', color:'#212529', borderColor:'#e9ecef',
                    '&:hover': { borderColor:'#007bff', backgroundColor:'#f8f9fa' }
                  }}
                >消息中心</Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}