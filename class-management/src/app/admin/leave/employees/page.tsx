"use client";

import { useState } from "react";
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
  Add as AddIcon,
  FilterList as FilterIcon,
  DownloadOutlined as ExportIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  avatar?: string;
  leaveBalance: {
    annual: { total: number; used: number; remaining: number };
    sick: { total: number; used: number; remaining: number };
    personal: { total: number; used: number; remaining: number };
  };
  recentLeaves: LeaveRecord[];
}

interface LeaveRecord {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approvedBy?: string;
  approvedDate?: string;
}

// 模拟数据
const mockEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "张三",
    position: "高级开发工程师",
    department: "技术部",
    email: "zhangsan@company.com",
    phone: "13800138001",
    hireDate: "2022-03-15",
    leaveBalance: {
      annual: { total: 15, used: 8, remaining: 7 },
      sick: { total: 10, used: 2, remaining: 8 },
      personal: { total: 5, used: 1, remaining: 4 },
    },
    recentLeaves: [
      {
        id: 1,
        type: "年假",
        startDate: "2024-02-15",
        endDate: "2024-02-17",
        days: 3,
        status: "approved",
        reason: "春节回家探亲",
        approvedBy: "李经理",
        approvedDate: "2024-02-10",
      },
      {
        id: 2,
        type: "病假",
        startDate: "2024-01-20",
        endDate: "2024-01-20",
        days: 1,
        status: "approved",
        reason: "感冒发烧",
        approvedBy: "李经理",
        approvedDate: "2024-01-20",
      },
    ],
  },
  {
    id: "EMP002",
    name: "李四",
    position: "产品经理",
    department: "产品部",
    email: "lisi@company.com",
    phone: "13800138002",
    hireDate: "2021-11-20",
    leaveBalance: {
      annual: { total: 20, used: 12, remaining: 8 },
      sick: { total: 10, used: 5, remaining: 5 },
      personal: { total: 5, used: 3, remaining: 2 },
    },
    recentLeaves: [
      {
        id: 3,
        type: "年假",
        startDate: "2024-02-16",
        endDate: "2024-02-18",
        days: 3,
        status: "pending",
        reason: "旅游度假",
      },
    ],
  },
  {
    id: "EMP003",
    name: "王五",
    position: "UI设计师",
    department: "设计部",
    email: "wangwu@company.com",
    phone: "13800138003",
    hireDate: "2023-01-10",
    leaveBalance: {
      annual: { total: 10, used: 4, remaining: 6 },
      sick: { total: 10, used: 1, remaining: 9 },
      personal: { total: 5, used: 0, remaining: 5 },
    },
    recentLeaves: [
      {
        id: 4,
        type: "事假",
        startDate: "2024-02-20",
        endDate: "2024-02-21",
        days: 2,
        status: "approved",
        reason: "处理个人事务",
        approvedBy: "陈经理",
        approvedDate: "2024-02-19",
      },
    ],
  },
];

const statusConfig = {
  pending: { label: '待审批', color: '#f57c00' },
  approved: { label: '已批准', color: '#388e3c' },
  rejected: { label: '已拒绝', color: '#d32f2f' },
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeesPage() {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // 获取所有部门
  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  // 过滤员工
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "" || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailDialog(true);
    setTabValue(0);
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

  const renderEmployeeStats = (employee: Employee) => {
    const totalLeaves = employee.recentLeaves.length;
    const approvedLeaves = employee.recentLeaves.filter(leave => leave.status === 'approved').length;
    const pendingLeaves = employee.recentLeaves.filter(leave => leave.status === 'pending').length;

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center' }}>
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
          <CardContent sx={{ textAlign: 'center' }}>
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
          <CardContent sx={{ textAlign: 'center' }}>
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

  const renderLeaveBalance = (employee: Employee) => {
    const balanceTypes = [
      { key: 'annual', label: '年假', color: '#1976d2' },
      { key: 'sick', label: '病假', color: '#388e3c' },
      { key: 'personal', label: '事假', color: '#f57c00' },
    ];

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
        {balanceTypes.map((type) => {
          const balance = employee.leaveBalance[type.key as keyof typeof employee.leaveBalance];
          const percentage = (balance.used / balance.total) * 100;
          
          return (
            <Card key={type.key} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {type.label}
                  </Typography>
                  <Chip
                    label={`${balance.remaining}天剩余`}
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
                        backgroundColor: getLeaveBalanceColor(balance.used, balance.total),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    已用: {balance.used}天
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    总计: {balance.total}天
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  const renderLeaveHistory = (employee: Employee) => {
    return (
      <TableContainer>
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
            {employee.recentLeaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>{leave.type}</TableCell>
                <TableCell>{leave.startDate}</TableCell>
                <TableCell>{leave.endDate}</TableCell>
                <TableCell>{leave.days}</TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[leave.status].label}
                    size="small"
                    sx={{
                      backgroundColor: statusConfig[leave.status].color,
                      color: 'white',
                    }}
                  />
                </TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell>{leave.approvedBy || '-'}</TableCell>
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
              员工管理
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              查看员工请假记录、余额和详细信息
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2, boxShadow: 'none' }}
            >
              添加员工
            </Button>
          </Box>
        </Box>

        {/* 搜索和过滤栏 */}
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="搜索员工姓名、工号或职位..."
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
                <InputLabel>部门</InputLabel>
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  label="部门"
                >
                  <MenuItem value="">全部部门</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
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

        {/* 员工列表 */}
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>员工信息</TableCell>
                    <TableCell>部门</TableCell>
                    <TableCell>职位</TableCell>
                    <TableCell>年假余额</TableCell>
                    <TableCell>病假余额</TableCell>
                    <TableCell>事假余额</TableCell>
                    <TableCell>近期请假</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      sx={{ '&:hover': { backgroundColor: '#f8f9fa' }, cursor: 'pointer' }}
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#1976d2' }}>
                            {employee.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {employee.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                              {employee.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {employee.leaveBalance.annual.remaining}/{employee.leaveBalance.annual.total}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(employee.leaveBalance.annual.used / employee.leaveBalance.annual.total) * 100}
                            sx={{ width: 60, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {employee.leaveBalance.sick.remaining}/{employee.leaveBalance.sick.total}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(employee.leaveBalance.sick.used / employee.leaveBalance.sick.total) * 100}
                            sx={{ width: 60, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {employee.leaveBalance.personal.remaining}/{employee.leaveBalance.personal.total}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(employee.leaveBalance.personal.used / employee.leaveBalance.personal.total) * 100}
                            sx={{ width: 60, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${employee.recentLeaves.length} 次`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmployeeClick(employee);
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

        {/* 员工详情对话框 */}
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
                  {selectedEmployee?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  {selectedEmployee?.position} · {selectedEmployee?.department}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedEmployee && (
              <Box>
                {/* 基本信息 */}
                <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      基本信息
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          员工编号
                        </Typography>
                        <Typography variant="body1">{selectedEmployee.id}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          邮箱
                        </Typography>
                        <Typography variant="body1">{selectedEmployee.email}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          电话
                        </Typography>
                        <Typography variant="body1">{selectedEmployee.phone}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          入职日期
                        </Typography>
                        <Typography variant="body1">{selectedEmployee.hireDate}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* 选项卡 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="统计概览" />
                    <Tab label="假期余额" />
                    <Tab label="请假记录" />
                  </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                  {renderEmployeeStats(selectedEmployee)}
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  {renderLeaveBalance(selectedEmployee)}
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  {renderLeaveHistory(selectedEmployee)}
                </TabPanel>
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
