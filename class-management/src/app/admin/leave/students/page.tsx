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
  Person as PersonIcon,
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
    const res = await fetch(`${API_BASE_URL}/leave/all`);
    if (!res.ok) throw new Error(`获取请假列表失败：${res.status}`);
    return res.json();
  },
  async fetchClasses(): Promise<ClassSimple[]> {
    const res = await fetch(`${API_BASE_URL}/class/simple`);
    if (!res.ok) throw new Error(`获取班级列表失败：${res.status}`);
    return res.json();
  },
  async fetchStudentBalances(studentId: number): Promise<StudentLeaveBalanceItem[]> {
    const res = await fetch(`${API_BASE_URL}/leave/balance/student/${studentId}`);
    if (!res.ok) throw new Error(`获取学生余额失败：${res.status}`);
    return res.json();
  },
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
      if (!r.student) continue;
      const sid = r.student.id;
      const exists = map.get(sid);
      const base: StudentRow = exists ?? {
        studentId: sid,
        name: r.student.name,
        studentNo: r.student.studentNo,
        clazzId: r.student.clazz?.id,
        clazzName: r.student.clazz?.name,
        grade: r.student.clazz?.grade,
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
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 5),
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
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
              学生请假管理
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
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
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
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
                      <SearchIcon sx={{ color: '#6c757d' }} />
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
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
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
                      sx={{ '&:hover': { backgroundColor: '#f8f9fa' }, cursor: 'pointer' }}
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#1976d2' }}>
                            {row.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {row.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
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
              <Avatar sx={{ bgcolor: '#1976d2', width: 50, height: 50 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedRow?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  {selectedRow?.clazzName} · {selectedRow?.grade}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {selectedRow && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: { xs: '75vh', md: '65vh' } }}>
                {/* 基本信息 */}
                <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      基本信息
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          学号
                        </Typography>
                        <Typography variant="body1">{selectedRow.studentNo || selectedRow.studentId}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          班级
                        </Typography>
                        <Typography variant="body1">{selectedRow.clazzName || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
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
