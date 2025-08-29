"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// 模拟数据类型
interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  avgApprovalTime: number;
  employeeCount: number;
}

interface LeaveTypeStats {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface RecentLeave {
  id: number;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// 模拟数据
const mockStats: LeaveStats = {
  totalRequests: 156,
  pendingRequests: 12,
  approvedRequests: 128,
  rejectedRequests: 16,
  avgApprovalTime: 2.3,
  employeeCount: 85,
};

const mockLeaveTypes: LeaveTypeStats[] = [
  { type: "年假", count: 65, percentage: 41.7, color: "#1976d2" },
  { type: "病假", count: 28, percentage: 17.9, color: "#f57c00" },
  { type: "事假", count: 32, percentage: 20.5, color: "#388e3c" },
  { type: "调休", count: 21, percentage: 13.5, color: "#7b1fa2" },
  { type: "其他", count: 10, percentage: 6.4, color: "#d32f2f" },
];

const mockRecentLeaves: RecentLeave[] = [
  {
    id: 1,
    employeeName: "张三",
    type: "年假",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    status: "pending",
    submittedAt: "2024-01-10 14:30",
  },
  {
    id: 2,
    employeeName: "李四",
    type: "病假",
    startDate: "2024-01-12",
    endDate: "2024-01-12",
    status: "approved",
    submittedAt: "2024-01-11 09:15",
  },
  {
    id: 3,
    employeeName: "王五",
    type: "事假",
    startDate: "2024-01-18",
    endDate: "2024-01-19",
    status: "rejected",
    submittedAt: "2024-01-08 16:45",
  },
];

const statusConfig = {
  pending: { label: '待审批', color: '#f57c00', bgColor: '#fff3e0' },
  approved: { label: '已批准', color: '#388e3c', bgColor: '#e8f5e8' },
  rejected: { label: '已拒绝', color: '#d32f2f', bgColor: '#ffebee' },
};

export default function LeaveDashboard() {
  const [stats, setStats] = useState<LeaveStats>(mockStats);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeStats[]>(mockLeaveTypes);
  const [recentLeaves, setRecentLeaves] = useState<RecentLeave[]>(mockRecentLeaves);
  const [timeRange, setTimeRange] = useState('month');

  // 模拟数据加载
  useEffect(() => {
    // 这里可以调用后端接口获取数据
    setStats(mockStats);
    setLeaveTypes(mockLeaveTypes);
    setRecentLeaves(mockRecentLeaves);
  }, [timeRange]);

  const getStatusChip = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.color,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    );
  };

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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="时间范围"
            >
              <MenuItem value="week">本周</MenuItem>
              <MenuItem value="month">本月</MenuItem>
              <MenuItem value="quarter">本季度</MenuItem>
              <MenuItem value="year">本年</MenuItem>
            </Select>
          </FormControl>
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
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
              </Box>
            </CardContent>
          </Card>

          {/* 最近请假申请 */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 3 }}>
                最近请假申请
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#212529' }}>姓名</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#212529' }}>类型</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#212529' }}>日期</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#212529' }}>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLeaves.map((leave) => (
                      <TableRow key={leave.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {leave.employeeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6c757d' }}>
                            {leave.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.75rem' }}>
                            {leave.startDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(leave.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
}
