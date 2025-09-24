"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  DownloadOutlined as ExportIcon,
  Work as WorkIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// 使用 Next.js 代理，避免跨域
const API_BASE_URL = "/api";

// 后端数据类型
interface ClassSimple {
  id: number;
  name: string;
  grade: string;
}

interface Clazz {
  id: number;
  name: string;
  grade: string;
}

interface Teacher { id: number; name: string }

interface Student {
  id: number;
  name: string;
  studentNo?: string;
  phone?: string | null;
  email?: string | null;
  clazz?: Clazz | null;
}

interface LeaveTypeConfig {
  id: number;
  typeCode: 'annual' | 'sick' | 'personal' | string;
  typeName: string;
  color: string;
}

interface LeaveRequest {
  id: number;
  studentId: number;
  teacherId?: number | null;
  leaveTypeId: number;
  reason: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  days: number;
  status: string; // 后端中文：待审批/已批准/已拒绝...
  student: Student;
  teacher?: Teacher | null;
  leaveTypeConfig: LeaveTypeConfig;
}

interface StudentLeaveBalanceItem {
  id: number;
  studentId: number;
  leaveTypeId: number;
  year: number;
  totalAllowance: number;
  usedDays: number;
  remainingDays: number;
  leaveTypeConfig: LeaveTypeConfig;
}

// 后端扁平 DTO（/api/leave/all 返回）可能的字段集合
interface LeaveRequestFlatDTO {
  id: number;
  studentId: number;
  studentName?: string;
  studentNo?: string;
  classId?: number;
  className?: string;
  clazzName?: string; // 兼容不同命名
  grade?: string;
  leaveTypeId: number;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  leaveTypeColor?: string;
  typeName?: string;
  teacherId?: number;
  teacherName?: string;
  startDate: string;
  endDate: string;
  days?: number;
  dayCount?: number;
  status: string;
  reason?: string;
  comment?: string;
  student?: Student;
  teacher?: Teacher;
  leaveTypeConfig?: LeaveTypeConfig;
  approvals?: Array<{
    id: number;
    stepOrder?: number;
    stepName?: string;
    roleCode?: string;
    roleDisplayName?: string;
    teacherId?: number;
    teacherName?: string;
    status?: string;
    comment?: string | null;
    reviewedAt?: string | null;
  }>;
}

// 聚合后的行数据
interface StudentRow {
  studentId: number;
  name: string;
  studentNo?: string;
  clazzId?: number;
  clazzName?: string;
  grade?: string;
  recentLeaves: LeaveRequest[];
}

const api = {
  async fetchAllLeaveRequests(): Promise<LeaveRequest[]> {
    const res = await fetch(`${API_BASE_URL}/leave/all`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`获取请假列表失败：${res.status}`);
    const raw = await res.json();
    // 兼容后端返回的扁平 DTO (studentId, studentName, className, leaveTypeName...)，转换为前端使用的嵌套结构
  const mapped: LeaveRequest[] = (raw as LeaveRequestFlatDTO[] || []).map((r) => {
      // 若顶层没有 teacher 字段，从审批记录中推导：优先当前待审批，否则最后一个记录
      let teacherId = r.teacherId;
  let teacherName = (r as LeaveRequestFlatDTO).teacherName; // 兼容后端日后可能添加
      if ((!teacherId || !teacherName) && Array.isArray(r.approvals) && r.approvals.length > 0) {
        const pending = r.approvals.find(a => a.status === '待审批' || a.status === 'pending');
        const ref = pending || r.approvals[r.approvals.length - 1];
        if (ref) {
          teacherId = teacherId || ref.teacherId;
          teacherName = teacherName || ref.teacherName;
        }
      }
      const student = r.student || (r.studentId ? {
        id: r.studentId,
        name: r.studentName || `学生${r.studentId}`,
        studentNo: r.studentNo,
        clazz: (r.className || r.clazzName) ? {
          id: r.classId || 0,
          name: r.className || r.clazzName || '',
          grade: r.grade || undefined,
        } : null,
      } : undefined);
      const leaveTypeConfig = r.leaveTypeConfig || (r.leaveTypeId ? {
        id: r.leaveTypeId,
        typeCode: r.leaveTypeCode || '',
        typeName: r.leaveTypeName || r.typeName || '未知类型',
        color: r.leaveTypeColor || '#1976d2',
      } : undefined);
      return {
        id: r.id,
        studentId: r.studentId,
        teacherId: teacherId,
        leaveTypeId: r.leaveTypeId,
        reason: r.reason || r.comment || '',
        startDate: r.startDate,
        endDate: r.endDate,
        days: r.days || r.dayCount || 0,
        status: r.status,
        student: student,
        teacher: r.teacher || (teacherId ? { id: teacherId, name: teacherName || '—' } : undefined),
        leaveTypeConfig: leaveTypeConfig,
      } as LeaveRequest;
    });
    return mapped;
  },
  async fetchClasses(): Promise<ClassSimple[]> {
    const res = await fetch(`${API_BASE_URL}/class/simple`, { credentials: 'include' });
    if (!res.ok) throw new Error(`获取班级列表失败：${res.status}`);
    return res.json();
  },
  async fetchStudentBalances(studentId: number): Promise<StudentLeaveBalanceItem[]> {
    const res = await fetch(`${API_BASE_URL}/leave/balance/student/${studentId}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`获取学生余额失败：${res.status}`);
    return res.json();
  },
};

// 简易中文姓氏->拼音首字母映射（常见百家姓，可按需扩展）
const surnameInitialMap: Record<string, string> = {
  王:'W', 李:'L', 张:'Z', 刘:'L', 陈:'C', 杨:'Y', 赵:'Z', 黄:'H', 周:'Z', 吴:'W', 徐:'X', 孙:'S', 胡:'H', 朱:'Z', 高:'G', 林:'L', 何:'H', 郭:'G', 马:'M', 罗:'L', 梁:'L', 宋:'S', 郑:'Z', 谢:'X', 韩:'H', 唐:'T', 冯:'F', 于:'Y', 董:'D', 萧:'X', 程:'C', 曹:'C', 袁:'Y', 邓:'D', 许:'X', 傅:'F', 沈:'S', 曾:'Z', 彭:'P', 吕:'L', 苏:'S', 卢:'L', 蒋:'J', 蔡:'C', 贾:'J', 丁:'D', 魏:'W', 薛:'X', 叶:'Y', 阎:'Y', 余:'Y', 潘:'P', 杜:'D', 戴:'D', 夏:'X', 钟:'Z', 汪:'W', 田:'T', 任:'R', 姜:'J', 范:'F', 方:'F', 石:'S', 姚:'Y', 谭:'T', 廖:'L', 邹:'Z', 熊:'X', 金:'J', 陆:'L', 郝:'H', 孔:'K', 白:'B', 崔:'C', 康:'K', 毛:'M', 邱:'Q', 秦:'Q', 江:'J', 史:'S', 顾:'G', 侯:'H', 邵:'S', 孟:'M', 龙:'L', 万:'W', 段:'D', 钱:'Q', 汤:'T', 尹:'Y', 黎:'L', 易:'Y', 常:'C', 武:'W', 乔:'Q', 贺:'H', 赖:'L', 龚:'G', 文:'W', 庞:'P', 樊:'F', 兰:'L', 殷:'Y', 施:'S', 陶:'T', 洪:'H', 翟:'Z', 安:'A', 颜:'Y', 倪:'N', 严:'Y', 牛:'N', 温:'W', 芦:'L', 季:'J', 俞:'Y', 章:'Z', 鲁:'L', 葛:'G', 毕:'B', 井:'J', 包:'B', 左:'Z', 吉:'J'
};

const getNameInitial = (name?: string) => {
  if (!name || !name.length) return '?';
  const firstChar = name.trim()[0];
  // 如果是英文/数字等，直接取大写
  if (/^[A-Za-z]$/.test(firstChar)) return firstChar.toUpperCase();
  // 中文姓氏映射
  if (surnameInitialMap[firstChar]) return surnameInitialMap[firstChar];
  // 尝试使用 localeCompare 判断是否中文（简单判断）
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    // 无映射则返回该字的拼音首字母猜测：这里简化为自身首字母占位 'X'
    return 'X';
  }
  return firstChar.toUpperCase();
};

const statusStyle = (status: string) => {
  if (status === '待审批' || status === 'pending') return { label: '待审批', color: '#f57c00' };
  if (status === '已批准' || status === 'approved') return { label: '已批准', color: '#388e3c' };
  if (status === '已拒绝' || status === 'rejected') return { label: '已拒绝', color: '#d32f2f' };
  return { label: status, color: '#6c757d' };
};

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
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [classes, setClasses] = useState<ClassSimple[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [selectedRow, setSelectedRow] = useState<StudentRow | null>(null);
  const [balancesMap, setBalancesMap] = useState<Record<number, StudentLeaveBalanceItem[]>>({});
  const [detailDialog, setDetailDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  // 可按需用于顶部整体加载指示
  // const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState<Record<number, boolean>>({});

  // 加载数据
  useEffect(() => {
    (async () => {
  try {
        const [reqs, cls] = await Promise.all([
          api.fetchAllLeaveRequests(),
          api.fetchClasses(),
        ]);
        setRequests(reqs);
        setClasses(cls);
      } catch (e) {
        console.error(e);
  } finally {
  }
    })();
  }, []);

  // 聚合为学生行
  const rows: StudentRow[] = useMemo(() => {
    const map = new Map<number, StudentRow>();
    for (const r of requests) {
      const sid = r.studentId;
      // 若无 studentId 则跳过
      if (!sid) continue;
      const flat = r as unknown as LeaveRequestFlatDTO; // r 已被映射但保留兼容字段
      const name = r.student?.name || flat.studentName || `学生${sid}`;
      const clazzName = r.student?.clazz?.name || flat.className || flat.clazzName;
      const clazzId = r.student?.clazz?.id || flat.classId;
      const grade = r.student?.clazz?.grade || flat.grade;
      const studentNo = r.student?.studentNo || flat.studentNo;
      const exists = map.get(sid);
      const base: StudentRow = exists ?? {
        studentId: sid,
        name,
        studentNo,
        clazzId,
        clazzName,
        grade,
        recentLeaves: [],
      };
      base.recentLeaves.push(r);
      map.set(sid, base);
    }
    // 仅保留最近 5 条按开始时间倒序
    const list = Array.from(map.values()).map(row => ({
      ...row,
      recentLeaves: row.recentLeaves
        .slice()
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), // 不再截断，显示全部
    }));
    // 默认按班级/姓名排序
    return list.sort((a, b) => (a.clazzName || '').localeCompare(b.clazzName || '') || a.name.localeCompare(b.name));
  }, [requests]);

  // 过滤
  const filteredRows = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return rows.filter(row => {
      const matchesSearch = !kw ||
        row.name.toLowerCase().includes(kw) ||
        (row.studentNo || '').toLowerCase().includes(kw) ||
        (row.clazzName || '').toLowerCase().includes(kw);
      const matchesClass = classFilter === "" || row.clazzId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [rows, searchTerm, classFilter]);

  const handleRowClick = async (row: StudentRow) => {
    setSelectedRow(row);
    setDetailDialog(true);
    setTabValue(0);
    if (!balancesMap[row.studentId] && !loadingBalances[row.studentId]) {
      try {
        setLoadingBalances(prev => ({ ...prev, [row.studentId]: true }));
        const balances = await api.fetchStudentBalances(row.studentId);
        setBalancesMap(prev => ({ ...prev, [row.studentId]: balances }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBalances(prev => ({ ...prev, [row.studentId]: false }));
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getLeaveBalanceColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return '#d32f2f';
    if (percentage >= 70) return '#f57c00';
    return '#388e3c';
  };

  const renderEmployeeStats = (row: StudentRow) => {
    const totalLeaves = row.recentLeaves.length;
    const approvedLeaves = row.recentLeaves.filter(leave => leave.status === '已批准' || leave.status === 'approved').length;
    const pendingLeaves = row.recentLeaves.filter(leave => leave.status === '待审批' || leave.status === 'pending').length;

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CalendarIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {totalLeaves}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              总请假次数
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#388e3c', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {approvedLeaves}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              已批准请假
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <WorkIcon sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {pendingLeaves}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              待审批请假
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderLeaveBalance = (row: StudentRow) => {
    const balanceTypes = [
      { key: 'annual', label: '年假', color: '#1976d2' },
      { key: 'sick', label: '病假', color: '#388e3c' },
      { key: 'personal', label: '事假', color: '#f57c00' },
    ] as const;

    const items = balancesMap[row.studentId] || [];
    const getByCode = (code: string) => items.find(i => i.leaveTypeConfig?.typeCode === code);

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
        {balanceTypes.map((type) => {
          const b = getByCode(type.key);
          const total = b?.totalAllowance ?? 0;
          const used = b?.usedDays ?? 0;
          const remaining = b?.remainingDays ?? Math.max(total - used, 0);
          const percentage = total > 0 ? (used / total) * 100 : 0;
          
          return (
            <Card key={type.key} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {type.label}
                  </Typography>
                  <Chip
                    label={`${remaining}天剩余`}
                    size="small"
                    sx={{ 
                      backgroundColor: type.color,
                      color: 'white'
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getLeaveBalanceColor(used, total),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    已用: {used}天
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    总计: {total}天
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  const renderLeaveHistory = (row: StudentRow) => {
    return (
      <TableContainer sx={{ maxHeight: '100%', overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>请假类型</TableCell>
              <TableCell>开始日期</TableCell>
              <TableCell>结束日期</TableCell>
              <TableCell>天数</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>原因</TableCell>
              <TableCell>审批人</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {row.recentLeaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>{leave.leaveTypeConfig?.typeName || '-'}</TableCell>
                <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{leave.days}</TableCell>
                <TableCell>
                  {(() => { const s = statusStyle(leave.status); return (
                    <Chip label={s.label} size="small" sx={{ backgroundColor: s.color, color: 'white' }} />
                  )})()}
                </TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell>{leave.teacher?.name || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        {/* 页面标题和操作按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              学生请假管理
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              查看学生请假记录、余额和详细信息
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              sx={{ borderRadius: 2 }}
            >
              导出数据
            </Button>
          </Box>
        </Box>

        {/* 搜索和过滤栏 */}
  <Card sx={{ mb: 3, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="搜索学生姓名、学号或班级..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>班级</InputLabel>
                <Select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value as number | "")}
                  label="班级"
                >
                  <MenuItem value="">全部班级</MenuItem>
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                size="small"
                sx={{ borderRadius: 1 }}
              >
                筛选
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 学生列表 */}
  <Card sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>学生信息</TableCell>
                    <TableCell>班级</TableCell>
                    <TableCell>年级</TableCell>
                    <TableCell>近期请假</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row.studentId}
                      sx={{ '&:hover': { backgroundColor: (theme) => theme.palette.action.hover }, cursor: 'pointer' }}
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: (theme) => theme.palette.primary.main }}>
                            {getNameInitial(row.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {row.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {row.studentNo || `ID: ${row.studentId}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{row.clazzName || '-'}</TableCell>
                      <TableCell>{row.grade || '-'}</TableCell>
                      <TableCell>
                        <Chip label={`${row.recentLeaves.length} 次`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                          }}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* 学生详情对话框 */}
        <Dialog
          open={detailDialog}
          onClose={() => setDetailDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: (theme) => theme.palette.primary.main, width: 50, height: 50, fontSize: 24, fontWeight: 600 }}>
                {getNameInitial(selectedRow?.name)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedRow?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedRow?.clazzName} · {selectedRow?.grade}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {selectedRow && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: { xs: '75vh', md: '65vh' } }}>
                {/* 基本信息 */}
                <Card sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      基本信息
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          学号
                        </Typography>
                        <Typography variant="body1">{selectedRow.studentNo || selectedRow.studentId}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          班级
                        </Typography>
                        <Typography variant="body1">{selectedRow.clazzName || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          年级
                        </Typography>
                        <Typography variant="body1">{selectedRow.grade || '-'}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* 选项卡 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="统计概览" />
                    <Tab label="假期余额" />
                    <Tab label="请假记录" />
                  </Tabs>
                </Box>

                {/* 固定高度的内容区域，切换 Tab 不改变整体高度 */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <Box sx={{ height: '100%' }}>
                    <TabPanel value={tabValue} index={0}>
                      {renderEmployeeStats(selectedRow)}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                      {loadingBalances[selectedRow.studentId] && (
                        <Box sx={{ mb: 2 }}><LinearProgress /></Box>
                      )}
                      {renderLeaveBalance(selectedRow)}
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                      {renderLeaveHistory(selectedRow)}
                    </TabPanel>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>关闭</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
