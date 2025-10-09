"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tooltip,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Button
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BugReportIcon from '@mui/icons-material/BugReport';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/context/AuthContext';

interface CreditLogItem {
  id: number;
  operatorUsername: string;
  operatorRoleCodes: string;
  studentId: number;
  studentNo: string;
  studentName: string;
  category: string;
  itemName: string;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
  actionType: string;
  reason: string;
  batchId: string | null;
  requestId: string | null;
  rollbackFlag: boolean;
  createdAt: string;
}

interface PageResp<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page index
  size: number;
}

const actionTypeConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  DELTA: { label: '增量', color: '#1976d2', icon: <TimelineIcon fontSize="inherit" /> },
  SET: { label: '设置', color: '#6a1b9a', icon: <AssignmentIcon fontSize="inherit" /> },
  RESET: { label: '重置', color: '#ef6c00', icon: <RefreshIcon fontSize="inherit" /> },
  CLAMP: { label: '钳制', color: '#ad1457', icon: <WarningAmberIcon fontSize="inherit" /> },
  INIT: { label: '初始化', color: '#2e7d32', icon: <CheckCircleIcon fontSize="inherit" /> },
  ROLLBACK: { label: '回滚', color: '#dc004e', icon: <CancelIcon fontSize="inherit" /> },
};

export default function LogCenterPage() {
  const { user, isAdmin, isTeacher, loading: authLoading } = useAuth();
  const [tab, setTab] = useState(0); // 0=学分日志 1=系统日志
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<CreditLogItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'success' });
  const [filters, setFilters] = useState({ actionType: '', operator: '', studentId: '', itemName: '' });

  const canView = (isAdmin || isTeacher) && !!user;

  const fetchCreditLogs = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.operator) params.append('operator', filters.operator.trim());
      if (filters.studentId) params.append('studentId', filters.studentId.trim());
      if (filters.itemName) params.append('itemId', filters.itemName.trim()); // TODO: 若需名称模糊搜索需后端支持
      // 模拟关键字：可扩展
      params.append('page', String(page - 1));
      params.append('size', String(pageSize));
      const resp = await fetch(`/api/credits/logs?${params.toString()}`);
      if (!resp.ok) throw new Error(await resp.text());
      const json: PageResp<CreditLogItem> = await resp.json();
      let list = json.content;
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(l =>
          l.studentName?.toLowerCase().includes(q) ||
          l.studentNo?.toLowerCase().includes(q) ||
          l.operatorUsername?.toLowerCase().includes(q) ||
          l.itemName?.toLowerCase().includes(q)
        );
      }
      setLogs(list);
      setTotalPages(json.totalPages);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnackbar({ open: true, msg: `加载失败: ${msg}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, query, canView]);

  useEffect(() => { if (tab === 0) fetchCreditLogs(); }, [tab, fetchCreditLogs]);

  const handleTabChange = (_: unknown, v: number) => setTab(v);

  const creditLogTable = (
    <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <TextField
            size="small"
            placeholder="搜索学生/学号/操作人/项目"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')}><CloseIcon fontSize="small" /></IconButton>
                </InputAdornment>
              )
            }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select value={filters.actionType} displayEmpty onChange={(e) => { setFilters(f => ({ ...f, actionType: e.target.value })); setPage(1); }}>
              <MenuItem value="">全部类型</MenuItem>
              {Object.keys(actionTypeConfig).map(k => <MenuItem key={k} value={k}>{actionTypeConfig[k].label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="操作人" value={filters.operator} onChange={(e) => { setFilters(f => ({ ...f, operator: e.target.value })); setPage(1); }} />
          <TextField size="small" label="学生ID" value={filters.studentId} onChange={(e) => { setFilters(f => ({ ...f, studentId: e.target.value })); setPage(1); }} />
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => fetchCreditLogs()} disabled={loading}>刷新</Button>
        </Box>
        <Box sx={{ overflow: 'auto', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: (theme) => theme.palette.mode === 'light' ? '#f8f9fa' : alpha(theme.palette.action.hover, 0.15) }}>
                <TableCell sx={{ textAlign: 'center' }}>ID</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>时间</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>操作人</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>学生</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>类别</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>项目</TableCell>
                <TableCell sx={{ textAlign: 'center' }} align="right">旧分</TableCell>
                <TableCell sx={{ textAlign: 'center' }} align="right">新分</TableCell>
                <TableCell sx={{ textAlign: 'center' }} align="right">Delta值</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>动作</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>原因</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} align="center"><CircularProgress size={28} /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>暂无数据</TableCell></TableRow>
              ) : (
                logs.map(l => {
                  const cfg = actionTypeConfig[l.actionType] || { label: l.actionType, color: '#607d8b' };
                  return (
                    <TableRow key={l.id} hover>
                      <TableCell align='center'>{l.id}</TableCell>
                      <TableCell align='center'>
                        <Typography variant="caption">{new Date(l.createdAt).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align='center'>{l.operatorUsername}</TableCell>
                      <TableCell align='center'>
                        <Tooltip title={`ID:${l.studentId}`}><span>{l.studentName} ({l.studentNo})</span></Tooltip>
                      </TableCell>
                      <TableCell align='center'>{l.category}</TableCell>
                      <TableCell align='center'>{l.itemName}</TableCell>
                      <TableCell align="center">{l.oldScore ?? '-'}</TableCell>
                      <TableCell align="center">{l.newScore ?? '-'}</TableCell>
                      <TableCell align="center" style={{ color: (l.delta || 0) > 0 ? '#2e7d32' : (l.delta || 0) < 0 ? '#d32f2f' : undefined }}>{l.delta ?? '-'}</TableCell>
                      <TableCell align='center'>
                        <Chip size="small" label={cfg.label} sx={{ bgcolor: alpha(cfg.color, 0.12), color: cfg.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align='center' >
                        <Typography variant="caption" sx={{ maxWidth: 180, display: 'inline-block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{l.reason}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const systemLogPlaceholder = (
    <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <BugReportIcon sx={{ fontSize: 48, color: 'warning.main' }} />
        <Typography variant="h6" fontWeight={600}>系统日志 (占位)</Typography>
        <Typography variant="body2" color="text.secondary">后端尚未提供统一系统日志 API，可在此接入审计/异常/登录日志。</Typography>
      </CardContent>
    </Card>
  );

  if (authLoading) return null;
  if (!canView) return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" color="text.secondary">无权限访问日志中心</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>日志中心</Typography>
        <Typography variant="body2" color="text.secondary">查看学分操作轨迹与系统事件</Typography>
      </Box>
      <Card sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
            <Tab label="学分日志" />
            <Tab label="系统日志" />
          </Tabs>
          <Box sx={{ p: 2.5 }}>
            {tab === 0 ? creditLogTable : systemLogPlaceholder}
          </Box>
        </CardContent>
      </Card>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
