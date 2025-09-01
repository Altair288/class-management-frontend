"use client";

import { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, LinearProgress } from "@mui/material";
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

// 类型颜色映射（与日历页面保持一致的风格）
const typeColor = (code: string) => {
  const colors: Record<string, { primary: string; bg: string }> = {
    annual: { primary: "#007AFF", bg: "#E6F3FF" },
    sick: { primary: "#34C759", bg: "#E6F7EA" },
    personal: { primary: "#FF9500", bg: "#FFF2E6" },
    emergency: { primary: "#FF3B30", bg: "#FFE6E6" },
    default: { primary: "#8E8E93", bg: "#F2F2F7" },
  };
  return (colors[code] || colors.default).primary;
};

export default function LeaveDashboard() {
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
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
              请假仪表板
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              查看请假统计数据、趋势分析和关键指标
            </Typography>
          </Box>
        </Box>

        {/* 关键指标卡片 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ScheduleIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    总请假数
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
                    {stats.totalRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: '#fff3e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessTimeIcon sx={{ color: '#f57c00', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    待审批
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 700 }}>
                    {stats.pendingRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: '#e8f5e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#388e3c', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    已批准
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 700 }}>
                    {stats.approvedRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: '#f3e5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#7b1fa2', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    审批时长
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#7b1fa2', fontWeight: 700 }}>
                    {stats.avgApprovalTime}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 主要内容区域 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          {/* 请假类型分布 */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                请假类型分布
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {leaveTypes.map((type, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#212529' }}>
                        {type.type}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#212529' }}>
                          {type.count}次
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.75rem' }}>
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
                        backgroundColor: '#e9ecef',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: type.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}
                {leaveTypes.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
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
