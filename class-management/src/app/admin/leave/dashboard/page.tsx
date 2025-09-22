"use client";

import { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, LinearProgress } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// API 基础地址（与 calendar/config 一致，走 Next.js 代理）
const API_BASE_URL = "/api";

// 仪表盘统计类型
interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  avgApprovalTime: number;
}

// 类型分布项
interface LeaveTypeStats {
  type: string; // 展示名称（typeName）
  count: number;
  percentage: number;
  color: string; // 根据 typeCode 映射
}

// 后端返回的数据结构
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

// 类型颜色映射（使用接近系统语义主色，保留差异）
const baseTypePalette: Record<string, string> = {
  annual: "#007AFF",
  sick: "#34C759",
  personal: "#FF9500",
  emergency: "#FF3B30",
  default: "#8E8E93",
};

// 获取类型主色
const typeColor = (code: string) => baseTypePalette[code] || baseTypePalette.default;


export default function LeaveDashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    avgApprovalTime: 0,
  });
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeStats[]>([]);
  const [loading, setLoading] = useState(false);


  // 拉取统计数据
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/leave/statistics`, { signal: controller.signal });
        if (!res.ok) throw new Error(`加载统计失败：${res.status}`);
        const data: LeaveStatisticsResponse = await res.json();

        const total = data.total || 0;
        setStats({
          totalRequests: total,
          pendingRequests: data.pending || 0,
          approvedRequests: data.approved || 0,
          rejectedRequests: data.rejected || 0,
          avgApprovalTime: data.approvalDuration?.avgHours ?? 0,
        });

        const mapped: LeaveTypeStats[] = (data.typeCounts || []).map((t) => ({
          type: t.typeName,
          count: t.count,
          percentage: total > 0 ? Number(((t.count / total) * 100).toFixed(1)) : 0,
          color: typeColor(t.typeCode),
        }));
        setLeaveTypes(mapped);
      } catch (e) {
        console.error(e);
        setStats({
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          avgApprovalTime: 0,
        });
        setLeaveTypes([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        {/* 页面标题和时间选择 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              请假仪表板
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              查看请假统计数据、趋势分析和关键指标
            </Typography>
          </Box>
        </Box>

        {/* 关键指标卡片 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
          {[
            {
              label: '总请假数',
              value: stats.totalRequests,
              icon: <ScheduleIcon fontSize="inherit" />,
              color: theme.palette.primary.main,
            },
            {
              label: '待审批',
              value: stats.pendingRequests,
              icon: <AccessTimeIcon fontSize="inherit" />,
              color: theme.palette.warning.main,
            },
            {
              label: '已批准',
              value: stats.approvedRequests,
              icon: <CheckCircleIcon fontSize="inherit" />,
              color: theme.palette.success.main,
            },
            {
              label: '审批时长',
              value: `${stats.avgApprovalTime}h`,
              icon: <TrendingUpIcon fontSize="inherit" />,
              color: theme.palette.secondary.main,
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                bgcolor: 'background.paper',
                transition: 'background-color .25s ease, border-color .25s ease',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px -2px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      backgroundColor: alpha(item.color, theme.palette.mode === 'dark' ? 0.18 : 0.15),
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: item.color, fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 主要内容区域 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          {/* 请假类型分布 */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
                请假类型分布
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {leaveTypes.map((type, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {type.type}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {type.count}次
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
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
                        backgroundColor: alpha(type.color, 0.15),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: type.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}
                {leaveTypes.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {loading ? '加载中…' : '暂无数据'}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
}
