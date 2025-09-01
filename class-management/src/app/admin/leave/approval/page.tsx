"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface LeaveRequest {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  urgency: 'low' | 'medium' | 'high';
}

// 模拟数据
const mockRequests: LeaveRequest[] = [
  {
    id: 1,
    employeeId: "EMP001",
    employeeName: "张三",
    department: "技术部",
    type: "年假",
    startDate: "2024-02-15",
    endDate: "2024-02-17",
    days: 3,
    reason: "春节假期延长，家庭团聚",
    status: "pending",
    submittedAt: "2024-01-10 14:30",
    urgency: "medium",
  },
  {
    id: 2,
    employeeId: "EMP002",
    employeeName: "李四",
    department: "销售部",
    type: "病假",
    startDate: "2024-01-15",
    endDate: "2024-01-15",
    days: 1,
    reason: "感冒发烧，需要休息治疗",
    status: "pending",
    submittedAt: "2024-01-14 09:15",
    urgency: "high",
  },
  {
    id: 3,
    employeeId: "EMP003",
    employeeName: "王五",
    department: "人事部",
    type: "事假",
    startDate: "2024-02-20",
    endDate: "2024-02-21",
    days: 2,
    reason: "处理个人重要事务",
    status: "pending",
    submittedAt: "2024-01-08 16:45",
    urgency: "low",
  },
];


const typeColors: { [key: string]: string } = {
  '年假': '#1976d2',
  '病假': '#f57c00',
  '事假': '#388e3c',
  '调休': '#7b1fa2',
  '其他': '#d32f2f',
};

export default function ApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>(mockRequests);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailDialog, setDetailDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalRemark, setApprovalRemark] = useState('');

  // 过滤后的请求
  const filteredRequests = requests.filter(request => {
    const matchType = !filterType || request.type === filterType;
    const matchUrgency = !filterUrgency || request.urgency === filterUrgency;
    const matchSearch = !searchTerm || 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchType && matchUrgency && matchSearch && request.status === 'pending';
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, id]);
    } else {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    }
  };

  const handleViewDetail = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDetailDialog(true);
  };

  const handleApproval = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalDialog(true);
  };

  const handleBatchApproval = (action: 'approve' | 'reject') => {
    if (selectedRequests.length === 0) return;
    // 这里可以实现批量审批逻辑
    console.log(`批量${action === 'approve' ? '批准' : '拒绝'}:`, selectedRequests);
  };

  const submitApproval = () => {
    if (!selectedRequest) return;
    
    // 更新请求状态
    setRequests(requests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: approvalAction === 'approve' ? 'approved' : 'rejected' }
        : req
    ));
    
    setApprovalDialog(false);
    setApprovalRemark('');
    setSelectedRequest(null);
  };

  const getTypeChip = (type: string) => {
    return (
      <Chip
        label={type}
        size="small"
        sx={{
          backgroundColor: typeColors[type] || '#6c757d',
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
        {/* 页面标题 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
            审批处理
          </Typography>
          <Typography variant="body2" sx={{ color: '#6c757d' }}>
            处理待审批的请假申请，支持单个和批量操作
          </Typography>
        </Box>

        {/* 统计信息 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#f57c00', fontWeight: 700, mb: 1 }}>
                {filteredRequests.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                待审批申请
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#d32f2f', fontWeight: 700, mb: 1 }}>
                {filteredRequests.filter(r => r.urgency === 'high').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                紧急申请
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 700, mb: 1 }}>
                {selectedRequests.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                已选择
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 筛选和操作栏 */}
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
              <TextField
                placeholder="搜索员工姓名、工号或部门"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250, flex: 1 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#6c757d', mr: 1 }} />,
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>请假类型</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="请假类型"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="年假">年假</MenuItem>
                  <MenuItem value="病假">病假</MenuItem>
                  <MenuItem value="事假">事假</MenuItem>
                  <MenuItem value="调休">调休</MenuItem>
                  <MenuItem value="其他">其他</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>紧急程度</InputLabel>
                <Select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  label="紧急程度"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="high">紧急</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="low">普通</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 批量操作按钮 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                批量操作:
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckIcon />}
                disabled={selectedRequests.length === 0}
                onClick={() => handleBatchApproval('approve')}
              >
                批量批准 ({selectedRequests.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CloseIcon />}
                disabled={selectedRequests.length === 0}
                onClick={() => handleBatchApproval('reject')}
              >
                批量拒绝 ({selectedRequests.length})
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 请假申请列表 */}
        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                      indeterminate={selectedRequests.length > 0 && selectedRequests.length < filteredRequests.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>学生信息</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>请假类型</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>请假时间</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>天数</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>提交时间</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id} 
                    hover
                    selected={selectedRequests.includes(request.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                          {request.employeeName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {request.employeeName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6c757d' }}>
                            {request.employeeId} · {request.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getTypeChip(request.type)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.startDate} 至 {request.endDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {request.days} 天
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#6c757d' }}>
                        {request.submittedAt}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="查看详情">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetail(request)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="批准">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleApproval(request, 'approve')}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="拒绝">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleApproval(request, 'reject')}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredRequests.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#6c757d' }}>
                暂无待审批的请假申请
              </Typography>
            </Box>
          )}
        </Card>

        {/* 详情对话框 */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>请假申请详情</DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                  <TextField
                    label="员工姓名"
                    value={selectedRequest.employeeName}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="员工工号"
                    value={selectedRequest.employeeId}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="所属部门"
                    value={selectedRequest.department}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="请假类型"
                    value={selectedRequest.type}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="开始日期"
                    value={selectedRequest.startDate}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="结束日期"
                    value={selectedRequest.endDate}
                    disabled
                    fullWidth
                  />
                </Box>
                <TextField
                  label="请假原因"
                  value={selectedRequest.reason}
                  disabled
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>关闭</Button>
          </DialogActions>
        </Dialog>

        {/* 审批对话框 */}
        <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {approvalAction === 'approve' ? '批准' : '拒绝'}请假申请
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedRequest && (
                <Alert 
                  severity={approvalAction === 'approve' ? 'success' : 'warning'} 
                  sx={{ mb: 3 }}
                >
                  您即将{approvalAction === 'approve' ? '批准' : '拒绝'} {selectedRequest.employeeName} 的{selectedRequest.type}申请
                </Alert>
              )}
              <TextField
                label="审批备注"
                value={approvalRemark}
                onChange={(e) => setApprovalRemark(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder={`请输入${approvalAction === 'approve' ? '批准' : '拒绝'}理由...`}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovalDialog(false)}>取消</Button>
            <Button 
              onClick={submitApproval}
              color={approvalAction === 'approve' ? 'success' : 'error'}
              variant="contained"
            >
              确认{approvalAction === 'approve' ? '批准' : '拒绝'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
