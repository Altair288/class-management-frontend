"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Tooltip
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  PendingActions as PendingIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import NotificationPanel from "@/components/NotificationPanel";
import { useNotificationContext } from '@/context/NotificationContext';

// 学生端所需精简类型
interface UserInfo { id: number; username: string; userType: string; }

interface PersonalLeaveStats {
  total: number;         // 总申请
  pending: number;       // 待审批
  approved: number;      // 已批准
  rejected: number;      // 已拒绝
  avgApprovalHours: number; // 平均审批小时（可缺省时=0）
  lastRequestAt?: string;
}

interface PersonalCreditOverviewItem { category: string; score: number; }
interface CreditEvaluation { status?: string; totalScore?: number; message?: string; }

export default function AdminDashboard() {
  const [sidebarOpen] = useState(false); // placeholder 保留布局兼容
  const [user, setUser] = useState<UserInfo | null>(null);
  const [leaveStats, setLeaveStats] = useState<PersonalLeaveStats | null>(null);
  const [creditOverviewRaw, setCreditOverviewRaw] = useState<PersonalCreditOverviewItem[]>([]);
  const [evaluation, setEvaluation] = useState<CreditEvaluation | null>(null);
  const [loadingLeave, setLoadingLeave] = useState(true);
  const [loadingCredit, setLoadingCredit] = useState(true);
  const [errorLeave, setErrorLeave] = useState<string | null>(null);
  const [errorCredit, setErrorCredit] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);

  // 拉取当前登录用户基本信息 + 学生扩展信息（用于拿 studentId）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await axios.get("/api/users/current");
        if (!cancelled) setUser(u.data);
      } catch {
        if (!cancelled) setUser(null);
      }
      try {
        const lu = await fetch('/api/leave/current-user-info', { credentials: 'include' });
        if (lu.ok) {
          const data = await lu.json();
          if (!cancelled && typeof data.studentId === 'number') setStudentId(data.studentId);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // 仅学生个人：基于 /api/leave/student/{studentId} 列表本地聚合
  useEffect(() => {
    if (studentId == null) return; // 等待 studentId
    let cancelled = false;
    (async () => {
      setLoadingLeave(true); setErrorLeave(null);
      try {
        const res = await fetch(`/api/leave/student/${studentId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('请求失败');
  type LeaveItem = { status?: string; createdAt?: string; submitTime?: string; requestTime?: string; approvedAt?: string; finalApprovedAt?: string; updatedAt?: string };
  const list: LeaveItem[] = await res.json();
        if (cancelled) return;
        // 预期字段：status(中文或英文), createdAt/submitTime, approvedAt/updatedAt
        let total = 0, pending = 0, approved = 0, rejected = 0;
  const approveDurations: number[] = [];
        let lastRequestAt: string | undefined;
        for (const it of list) {
          total++;
          const status: string = (it.status || '').toString();
            if (/(待|pending)/.test(status)) pending++; else if (/(批|通|approved)/.test(status)) approved++; else if (/(拒|驳|reject)/.test(status)) rejected++;
          const created = it.createdAt || it.submitTime || it.requestTime;
          if (created && (!lastRequestAt || new Date(created).getTime() > new Date(lastRequestAt).getTime())) {
            lastRequestAt = created;
          }
          const approvedAt = it.approvedAt || it.finalApprovedAt || it.updatedAt;
          if (approvedAt && created) {
            const diffMs = new Date(approvedAt).getTime() - new Date(created).getTime();
            if (diffMs > 0) approveDurations.push(diffMs / 3600000); // 转小时
          }
        }
        const avgApprovalHours = approveDurations.length ? approveDurations.reduce((a,b)=>a+b,0)/approveDurations.length : 0;
        setLeaveStats({ total, pending, approved, rejected, avgApprovalHours, lastRequestAt });
      } catch {
        if (!cancelled) setErrorLeave('无法获取个人请假统计');
      } finally {
        if (!cancelled) setLoadingLeave(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  // 仅学生个人：调用 /api/credits/students/{studentId}/totals + evaluation
  useEffect(() => {
    if (studentId == null) return;
    let cancelled = false;
    (async () => {
      setLoadingCredit(true); setErrorCredit(null);
      try {
        const [totalsRes, evalRes] = await Promise.all([
          fetch(`/api/credits/students/${studentId}/totals`, { credentials: 'include' }),
          fetch(`/api/credits/students/${studentId}/evaluation`, { credentials: 'include' })
        ]);
        if (!totalsRes.ok) throw new Error('totals failed');
        const totals = await totalsRes.json();
        let evalData: unknown = null;
        if (evalRes && evalRes.ok) {
          try { evalData = await evalRes.json(); } catch { /* ignore parse */ }
        }
        if (cancelled) return;
        const mapped: PersonalCreditOverviewItem[] = [
          { category: '德育', score: Number((totals.de ?? 0).toFixed?.(1) || (totals.de ?? 0)) },
          { category: '智育', score: Number((totals.zhi ?? 0).toFixed?.(1) || (totals.zhi ?? 0)) },
          { category: '体育', score: Number((totals.ti ?? 0).toFixed?.(1) || (totals.ti ?? 0)) },
          { category: '美育', score: Number((totals.mei ?? 0).toFixed?.(1) || (totals.mei ?? 0)) },
          { category: '劳育', score: Number((totals.lao ?? 0).toFixed?.(1) || (totals.lao ?? 0)) },
        ];
        setCreditOverviewRaw(mapped);
        if (evalData) setEvaluation(evalData);
      } catch {
        if (!cancelled) setErrorCredit('无法获取个人学分');
      } finally {
        if (!cancelled) setLoadingCredit(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const creditOverview = useMemo(() => creditOverviewRaw, [creditOverviewRaw]);

  // 使用主题 (保持在依赖 theme 的计算之前)
  const theme = useTheme();

  // 总分（若 evaluation 返回 totalScore 则用之，否则求和）
  const totalCreditScore = useMemo(() => {
    if (evaluation && typeof evaluation.totalScore === 'number' && !isNaN(evaluation.totalScore)) return evaluation.totalScore;
    return creditOverview.reduce((a, b) => a + (Number(b.score) || 0), 0);
  }, [evaluation, creditOverview]);

  // 评价展示映射
  const evaluationDisplay = useMemo(() => {
    if (!evaluation) return null;
    const raw = (evaluation.status || '').toLowerCase();
    let label = evaluation.status || '—';
    let color: string = theme.palette.secondary.main;
    if (/excellent|优/.test(raw)) { label = '优秀'; color = theme.palette.success.main; }
    else if (/good|良/.test(raw)) { label = '良好'; color = theme.palette.info ? theme.palette.info.main : theme.palette.primary.main; }
    else if (/warn|预警/.test(raw)) { label = '预警'; color = theme.palette.warning.main; }
    else if (/danger|risk|差|不及格|警/.test(raw)) { label = '风险'; color = theme.palette.error.main; }
    return { label, color };
  }, [evaluation, theme]);

  // 通知 Context：获取未读数
  useNotificationContext();

  // theme 已提前声明

  // 人性化显示审批时长（输入为小时）
  const formatApprovalDuration = (hours: number): string => {
    if (!hours || hours <= 0) return '0秒';
    const seconds = hours * 3600;
    if (hours < 1 / 60) {
      // 小于1分钟，显示秒
      return `${Math.round(seconds)}秒`;
    } else if (hours < 1) {
      // 小于1小时，显示分钟（<10保留1位小数）
      const minutes = hours * 60;
      return minutes < 10 ? `${minutes.toFixed(1)}分钟` : `${Math.round(minutes)}分钟`;
    } else if (hours < 24) {
      // 小于1天，显示小时（<10保留1位小数）
      return hours < 10 ? `${hours.toFixed(1)}小时` : `${Math.round(hours)}小时`;
    } else {
      // 显示 天 + 小时（剩余不足0.5小时忽略）
      const days = Math.floor(hours / 24);
      const remain = hours - days * 24;
      if (remain < 0.5) return `${days}天`;
      const remainDisplay = remain < 10 ? remain.toFixed(1) : Math.round(remain);
      return `${days}天${remainDisplay}小时`;
    }
  };

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
            {/* 标题 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
                我的学习 & 请假概览
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                快速查看个人请假进度、学分表现与最新通知
              </Typography>
            </Box>

            {/* 顶部三列：个人请假、学分、通知 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr 0.9fr' }, gap: 3, alignItems: 'stretch' }}>
              {/* 个人请假统计 */}
              <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[3], bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>我的请假</Typography>
                    {loadingLeave && <CircularProgress size={20} />}
                  </Box>
                  {errorLeave && (
                    <Typography variant="body2" color="error">{errorLeave}</Typography>
                  )}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 2 }}>
                    {[{
                      label: '总申请', value: leaveStats?.total ?? 0, icon: <TimelineIcon fontSize="small" />, color: theme.palette.primary.main
                    }, {
                      label: '待审批', value: leaveStats?.pending ?? 0, icon: <PendingIcon fontSize="small" />, color: theme.palette.warning.main
                    }, {
                      label: '已批准', value: leaveStats?.approved ?? 0, icon: <CheckCircleIcon fontSize="small" />, color: theme.palette.success.main
                    }, {
                      label: '被拒绝', value: leaveStats?.rejected ?? 0, icon: <AssignmentIcon fontSize="small" />, color: theme.palette.error.main
                    }].map((i) => (
                      <Box key={i.label} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: .5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                          <Box sx={{ width: 22, height: 22, bgcolor: alpha(i.color, 0.15), color: i.color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: .8 }}>
                            {i.icon}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{i.label}</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: i.color }}>{loadingLeave ? '--' : i.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Tooltip title="从提交到最终审批平均耗时">
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, backgroundColor: alpha(theme.palette.secondary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>平均审批时长</Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                        {leaveStats ? formatApprovalDuration(leaveStats.avgApprovalHours) : '--'}
                      </Typography>
                    </Box>
                  </Tooltip>
                  {leaveStats?.lastRequestAt && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>最近提交：{new Date(leaveStats.lastRequestAt).toLocaleString()}</Typography>
                  )}
                </CardContent>
              </Card>

              {/* 学分概览 */}
              <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], bgcolor: theme.palette.background.paper }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>学分表现</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {evaluationDisplay && (
                        <Chip
                          size="small"
                          label={`${evaluationDisplay.label} · ${Number.isFinite(totalCreditScore) ? totalCreditScore.toFixed(1) : '--'}分`}
                          sx={{
                            fontWeight: 600,
                            bgcolor: alpha(evaluationDisplay.color, 0.15),
                            color: evaluationDisplay.color
                          }}
                        />
                      )}
                      {loadingCredit && <CircularProgress size={20} />}
                    </Box>
                  </Box>
                  {errorCredit && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>{errorCredit}</Typography>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                    {creditOverview.map(item => (
                      <Box key={item.category}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: .5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.category}</Typography>
                          <Chip size="small" label={loadingCredit ? '--' : `${item.score}分`} sx={{ fontWeight: 600 }} />
                        </Box>
                        <LinearProgress variant="determinate" value={Number.isFinite(item.score) ? Math.min(item.score, 100) : 0} sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* 通知摘录 */}
              <Box sx={{ '& > .MuiCard-root': { height: '100%', display: 'flex', flexDirection: 'column' } }}>
                {user?.id && <NotificationPanel userId={user.id} variant="dashboard" limit={5} />}
              </Box>
            </Box>
        </motion.div>
    </Box>
  );
}