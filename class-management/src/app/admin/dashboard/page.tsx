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
  useTheme,
  alpha,
} from "@mui/material";
import {
  Group as GroupIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
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

// 请假统计数据类型
interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  avgApprovalTime: number;
}

// 请假类型统计
interface LeaveTypeStats {
  type: string;
  count: number;
  percentage: number;
  color: string;
}



interface UserInfo {
  id: number;
  username: string;
  userType: string;
}

export default function AdminDashboard() {
  const [sidebarOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    avgApprovalTime: 0,
  });
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeStats[]>([]);
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

  // 拉取请假统计数据
  useEffect(() => {
    const fetchLeaveStats = async () => {
      try {
        const res = await fetch("/api/leave/statistics");
        if (!res.ok) throw new Error("请假数据加载失败");
        const data = await res.json();
        
        const total = data.total || 0;
        setLeaveStats({
          totalRequests: total,
          pendingRequests: data.pending || 0,
          approvedRequests: data.approved || 0,
          rejectedRequests: data.rejected || 0,
          avgApprovalTime: data.approvalDuration?.avgHours ?? 0,
        });

        // 类型颜色映射
        const typeColorMap = (code: string) => {
          const colors: Record<string, string> = {
            annual: "#007AFF",
            sick: "#34C759", 
            personal: "#FF9500",
            emergency: "#FF3B30",
          };
          return colors[code] || "#8E8E93";
        };

        const mapped: LeaveTypeStats[] = (data.typeCounts || []).slice(0, 4).map((t: { typeName: string; count: number; typeCode: string }) => ({
          type: t.typeName,
          count: t.count,
          percentage: total > 0 ? Number(((t.count / total) * 100).toFixed(1)) : 0,
          color: typeColorMap(t.typeCode),
        }));
        setLeaveTypes(mapped);
      } catch (e) {
        console.error("请假数据获取失败:", e);
      }
    };
    fetchLeaveStats();
  }, []);

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

  // 使用主题
  const theme = useTheme();

  return (
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
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: theme.palette.text.primary, 
                mb: 1 
              }}>
                管理系统数据概览
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                班级管理系统核心数据监控
              </Typography>
            </Box>          {/* 主要布局：左中右三段式 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 0.8fr' }, gap: 3 }}>
            {/* 左侧：核心学生数据 */}
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.background.paper,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 600, 
                  mb: 3 
                }}>
                  核心指标
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* 在校学生 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <GroupIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: '0.875rem', 
                          mb: 0.5 
                        }}>
                          👤 在校学生
                        </Typography>
                        <Typography variant="h3" sx={{ 
                          color: theme.palette.primary.main, 
                          fontWeight: 700, 
                          fontSize: '2rem' 
                        }}>
                          {loading ? '--' : summary?.totalStudents ?? 0}
                          <Typography component="span" sx={{ 
                            fontSize: '0.875rem', 
                            color: theme.palette.text.secondary, 
                            ml: 0.5 
                          }}>
                            人
                          </Typography>
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>

                  {/* 预警学生 - 带可视化 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <>
                            <WarningIcon sx={{ fontSize: 24, color: theme.palette.error.main }} />
                            {/* 环形进度指示器 */}
                            <CircularProgress
                              variant="determinate"
                              value={summary ? (summary.countWarning / summary.totalStudents) * 100 : 0}
                              size={40}
                              thickness={3}
                              sx={{
                                position: 'absolute',
                                color: theme.palette.error.main,
                                '& .MuiCircularProgress-circle': {
                                  strokeLinecap: 'round',
                                },
                              }}
                            />
                          </>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: '0.875rem', 
                          mb: 0.5 
                        }}>
                          ⚠️ 预警学生
                        </Typography>
                        <Typography variant="h3" sx={{ 
                          color: theme.palette.error.main, 
                          fontWeight: 700, 
                          fontSize: '2rem' 
                        }}>
                          {loading ? '--' : summary?.countWarning ?? 0}
                          <Typography component="span" sx={{ 
                            fontSize: '0.875rem', 
                            color: theme.palette.text.secondary, 
                            ml: 0.5 
                          }}>
                            人
                          </Typography>
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem' 
                        }}>
                          占比: {summary ? ((summary.countWarning / summary.totalStudents) * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>

                  {/* 优秀学生 - 带可视化 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <>
                            <CheckCircleIcon sx={{ fontSize: 24, color: theme.palette.warning.main }} />
                            {/* 环形进度指示器 */}
                            <CircularProgress
                              variant="determinate"
                              value={summary ? (summary.countExcellent / summary.totalStudents) * 100 : 0}
                              size={40}
                              thickness={3}
                              sx={{
                                position: 'absolute',
                                color: theme.palette.warning.main,
                                '& .MuiCircularProgress-circle': {
                                  strokeLinecap: 'round',
                                },
                              }}
                            />
                          </>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: '0.875rem', 
                          mb: 0.5 
                        }}>
                          ⭐ 优秀学生
                        </Typography>
                        <Typography variant="h3" sx={{ 
                          color: theme.palette.warning.main, 
                          fontWeight: 700, 
                          fontSize: '2rem' 
                        }}>
                          {loading ? '--' : summary?.countExcellent ?? 0}
                          <Typography component="span" sx={{ 
                            fontSize: '0.875rem', 
                            color: theme.palette.text.secondary, 
                            ml: 0.5 
                          }}>
                            人
                          </Typography>
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem' 
                        }}>
                          占比: {summary ? ((summary.countExcellent / summary.totalStudents) * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Box>
              </CardContent>
            </Card>

            {/* 中间：班级信息和请假审批 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 班级信息 */}
              <Card sx={{ 
                borderRadius: 2, 
                boxShadow: theme.shadows[2],
                bgcolor: theme.palette.background.paper,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    mb: 2 
                  }}>
                    班级信息
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SchoolIcon sx={{ fontSize: 24, color: theme.palette.success.main }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.text.secondary, 
                        fontSize: '0.875rem' 
                      }}>
                        🏫 班级数量
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: theme.palette.success.main, 
                        fontWeight: 700 
                      }}>
                        {loading ? '--' : summary?.totalClasses ?? 0}
                        <Typography component="span" sx={{ 
                          fontSize: '0.875rem', 
                          color: theme.palette.text.secondary, 
                          ml: 0.5 
                        }}>
                          个
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* 请假审批 */}
              <Card sx={{ 
                borderRadius: 2, 
                boxShadow: theme.shadows[2],
                bgcolor: theme.palette.background.paper,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    mb: 2 
                  }}>
                    请假审批
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 总请假数 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 500, 
                          fontSize: '0.875rem' 
                        }}>
                          📝 总请假数
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.primary.main, 
                        fontWeight: 600 
                      }}>
                        {leaveStats.totalRequests}次
                      </Typography>
                    </Box>

                    {/* 待审批 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 500, 
                          fontSize: '0.875rem' 
                        }}>
                          ⏳ 待审批
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.warning.main, 
                        fontWeight: 600 
                      }}>
                        {leaveStats.pendingRequests}次
                      </Typography>
                    </Box>

                    {/* 已批准 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 500, 
                          fontSize: '0.875rem' 
                        }}>
                          ✅ 已批准
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.success.main, 
                        fontWeight: 600 
                      }}>
                        {leaveStats.approvedRequests}次
                      </Typography>
                    </Box>

                    {/* 审批时长 */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1.5,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        borderRadius: 1,
                        mt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 600, 
                          fontSize: '0.875rem' 
                        }}>
                          ⏱️ 平均审批时长
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ 
                        color: theme.palette.secondary.main, 
                        fontWeight: 700 
                      }}>
                        {Math.round(leaveStats.avgApprovalTime)}h
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* 右侧：消息通知 */}
            <Box>
              {user && user.id && (
                <NotificationPanel userId={user.id} variant="dashboard" limit={5} />
              )}
            </Box>
          </Box>

          {/* 底部：学分概览和请假类型 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
            {/* 学分概览 */}
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: theme.shadows[2],
              bgcolor: theme.palette.background.paper,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary 
                  }}>
                    学分平均分概览
                  </Typography>
                  <Button
                    component={Link}
                    href="/admin/credits"
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    查看详情
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {creditOverview.map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 500, 
                          color: theme.palette.text.primary 
                        }}>
                          {item.category}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          color: theme.palette.text.primary 
                        }}>
                          {loading ? '--' : `${item.total}分`}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Number.isFinite(item.total) ? item.total : 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.action.disabled, 0.3),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.total >= 90 ? theme.palette.success.main : 
                                           item.total >= 80 ? theme.palette.primary.main :
                                           item.total >= 70 ? theme.palette.warning.main : theme.palette.error.main,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* 请假类型分布 */}
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: theme.shadows[2],
              bgcolor: theme.palette.background.paper,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary 
                  }}>
                    请假类型分布
                  </Typography>
                  <Button
                    component={Link}
                    href="/admin/leave/dashboard"
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    查看详情
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {leaveTypes.length > 0 ? (
                    leaveTypes.map((type, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.text.primary 
                          }}>
                            {type.type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.text.primary 
                            }}>
                              {type.count}次
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.secondary 
                            }}>
                              ({type.percentage}%)
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={type.percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.action.disabled, 0.3),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: type.color,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.secondary 
                      }}>
                        暂无请假数据
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 快速操作 */}
          <Card sx={{ 
            mt: 3, 
            borderRadius: 2, 
            boxShadow: theme.shadows[2],
            bgcolor: theme.palette.background.paper,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                mb: 3 
              }}>
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
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
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
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
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
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
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
                    textTransform: 'none', 
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
                    }
                  }}
                >
                  学生请假管理
                </Button>
                <Button
                  component={Link}
                  href="/admin/leave/approval"
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  请假审批
                </Button>
                                <Button
                  component={Link}
                  href="/admin/leave/approve"
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
                    }
                  }}
                >
                  请假审批
                </Button>
                <Button
                  component={Link}
                  href="/admin/notifications"
                  variant="outlined"
                  startIcon={<MailOutlineIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    p: 2,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04)
                    }
                  }}
                >
                  消息中心
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
    </Box>
  );
}