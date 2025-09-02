// Test Page
// This is a test page for leave application



"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  Send as SendIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// 与其他页面一致，走 Next.js 代理
const API_BASE_URL = "/api";

// 页面内部使用的类型（与后端字段做轻量映射）
interface LeaveType {
  // 前端下拉使用的标识（沿用 typeCode 以避免大范围改动）
  id: string; // typeCode
  name: string;
  maxDays?: number; // 对应后端 maxDaysPerRequest
  requiresApproval?: boolean;
  allowancePerYear?: number; // 对应后端 annualAllowance
  color?: string;
  description?: string;
  // 后端主键ID（提交时需要用它作为 leaveTypeId）
  backendId?: number;
}

interface LeaveApplication {
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  emergencyContact: string;
  emergencyPhone: string;
  handoverNotes?: string;
  attachments?: File[];
}

// 当前登录用户（来自后端）
interface CurrentUserInfo {
  userId: number;
  userType: string; // 学生 等
  studentId?: number;
  studentName?: string;
  teacherId?: number;
  teacherName?: string;
  phone?: string;
  email?: string;
  classId?: number;
  className?: string;
}

// 后端类型定义（/api/leave/types）
interface ApiLeaveType {
  id?: number;
  typeName: string;
  typeCode: string;
  description?: string;
  annualAllowance?: number;
  maxDaysPerRequest?: number;
  requiresApproval?: boolean;
  requiresMedicalProof?: boolean;
  advanceDaysRequired?: number;
  color?: string;
  enabled?: boolean;
}

// 颜色映射（与其他页面一致）
const typeColor = (code: string) => {
  const colors: Record<string, string> = {
    annual: "#007AFF",
    sick: "#34C759",
    personal: "#FF9500",
    emergency: "#FF3B30",
    default: "#8E8E93",
  };
  return colors[code] || colors.default;
};

export default function LeaveApplyPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [application, setApplication] = useState<LeaveApplication>({
    type: "",
    startDate: "",
    endDate: "",
    days: 0,
    reason: "",
    emergencyContact: "",
    emergencyPhone: "",
    handoverNotes: "",
    attachments: [],
  });

  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化加载：用户信息与请假类型
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
  try {
        // 当前用户信息
        const ures = await fetch(`${API_BASE_URL}/leave/current-user-info`, {
          signal: controller.signal,
          credentials: 'include',
        });
        if (ures.ok) {
          const info: CurrentUserInfo = await ures.json();
          setCurrentUser(info);
          // 用用户信息预填紧急联系人/电话（可按需调整）
          setApplication(prev => ({
            ...prev,
            emergencyContact: info.studentName || info.teacherName || "",
            emergencyPhone: info.phone || "",
          }));
        }
        // 请假类型
        const tres = await fetch(`${API_BASE_URL}/leave/types`, {
          signal: controller.signal,
          credentials: 'include',
        });
        if (tres.ok) {
          const list: ApiLeaveType[] = await tres.json();
          const mapped: LeaveType[] = list
            .filter(t => t.enabled !== false)
            .map(t => ({
              id: t.typeCode,
              name: t.typeName,
              maxDays: t.maxDaysPerRequest,
              requiresApproval: t.requiresApproval,
              allowancePerYear: t.annualAllowance,
              color: t.color || typeColor(t.typeCode),
              description: t.description,
              backendId: typeof t.id === 'number' ? t.id : undefined,
            }));
          setLeaveTypes(mapped);
        } else {
          setLeaveTypes([]);
        }
      } catch (e) {
        console.error(e);
  } finally {
  }
    })();
    return () => controller.abort();
  }, []);

  // 计算请假天数
  const calculateDays = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  // 处理请假类型选择
  const handleLeaveTypeChange = (typeId: string) => {
  const leaveType = leaveTypes.find(type => type.id === typeId);
    setSelectedLeaveType(leaveType || null);
    setApplication(prev => ({
      ...prev,
      type: typeId,
    }));
  };

  // 处理日期变更
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const updatedApplication = {
      ...application,
      [field]: value,
    };
    
    if (field === 'startDate' || field === 'endDate') {
      const days = calculateDays(updatedApplication.startDate, updatedApplication.endDate);
      updatedApplication.days = days;
    }
    
    setApplication(updatedApplication);
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!application.type) {
      newErrors.type = "请选择请假类型";
    }
    if (!application.startDate) {
      newErrors.startDate = "请选择开始日期";
    }
    if (!application.endDate) {
      newErrors.endDate = "请选择结束日期";
    }
    if (application.startDate && application.endDate && new Date(application.startDate) > new Date(application.endDate)) {
      newErrors.endDate = "结束日期不能早于开始日期";
    }
    if (!application.reason.trim()) {
      newErrors.reason = "请填写请假原因";
    }
    if (!application.emergencyContact.trim()) {
      newErrors.emergencyContact = "请填写紧急联系人";
    }
    if (!application.emergencyPhone.trim()) {
      newErrors.emergencyPhone = "请填写紧急联系电话";
    }

    // 校验：不超过单次最大天数（如果后端配置了）
    if (selectedLeaveType?.maxDays && application.days > selectedLeaveType.maxDays) {
      newErrors.days = `请假天数不能超过该类型最大连续天数(${selectedLeaveType.maxDays}天)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交申请
  const handleSubmit = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  // 确认提交
  type SubmitPayload = {
  // 按后端 LeaveRequest 实体字段提交
  leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    handoverNotes?: string;
    studentId?: number;
  };

  const handleConfirmSubmit = async () => {
    try {
      // 校验登录身份是否为学生并且拿到学生ID
      if (!currentUser?.studentId) {
        alert('当前账号未关联学生，无法提交请假申请。');
        return;
      }
      // 通过所选 typeCode 找到后端的类型主键ID
      const selected = leaveTypes.find(t => t.id === application.type);
      if (!selected?.backendId) {
        alert('请选择有效的请假类型');
        return;
      }
      // 构造与后端 LeaveRequest 对应的最小体
      const payload: SubmitPayload = {
        leaveTypeId: selected.backendId,
        startDate: application.startDate,
        endDate: application.endDate,
        reason: application.reason,
        emergencyContact: application.emergencyContact,
        emergencyPhone: application.emergencyPhone,
        handoverNotes: application.handoverNotes,
        studentId: currentUser.studentId,
      };

      const res = await fetch(`${API_BASE_URL}/leave/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`提交失败：${res.status}`);

      setShowPreview(false);
      setShowSuccess(true);
      // 重置表单
      setApplication({
        type: "",
        startDate: "",
        endDate: "",
        days: 0,
        reason: "",
        emergencyContact: currentUser?.studentName || currentUser?.teacherName || "",
        emergencyPhone: currentUser?.phone || "",
        handoverNotes: "",
        attachments: [],
      });
      setSelectedLeaveType(null);
    } catch (e) {
      console.error(e);
      alert('提交失败，请稍后重试');
  } finally {
  }
  };

  // 保存草稿
  const handleSaveDraft = () => {
    // 这里应该调用API保存草稿
    console.log("保存草稿:", application);
    alert("草稿已保存");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* 页面标题 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
            请假申请
          </Typography>
          <Typography variant="body2" sx={{ color: '#6c757d' }}>
            填写详细信息提交您的请假申请
          </Typography>
        </Box>

        {/* 用户信息卡片 */}
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 50, height: 50 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentUser?.studentName || currentUser?.userId || '-'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  {currentUser?.userType || ''} · {currentUser?.className || ''}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                  直属教师
                </Typography>
                <Typography variant="body1">{currentUser?.teacherName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                  手机
                </Typography>
                <Typography variant="body1">{currentUser?.phone || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                  邮箱
                </Typography>
                <Typography variant="body1">{currentUser?.email || '-'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* 左侧表单 */}
          <Box>
            <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  申请信息
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* 请假类型选择 */}
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>请假类型</InputLabel>
                    <Select
                      value={application.type}
                      onChange={(e) => handleLeaveTypeChange(e.target.value)}
                      label="请假类型"
                    >
                      {leaveTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: type.color || '#8E8E93',
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1">{type.name}</Typography>
                              {typeof type.allowancePerYear !== 'undefined' && (
                                <Typography variant="caption" sx={{ color: '#6c757d' }}>
                                  年额度: {type.allowancePerYear}天 {type.maxDays ? `· 单次最多 ${type.maxDays} 天` : ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.type}
                      </Typography>
                    )}
                  </FormControl>

                  {/* 选中请假类型的详细信息 */}
                  {selectedLeaveType && (
                    <Alert 
                      severity="info" 
                      sx={{ borderRadius: 2 }}
                      icon={<AssignmentIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {selectedLeaveType.name}
                      </Typography>
                      <Typography variant="body2">
                        {selectedLeaveType.description}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {typeof selectedLeaveType.maxDays !== 'undefined' ? (
                          <>最大连续天数: <strong>{selectedLeaveType.maxDays}天</strong></>
                        ) : '按类型配置为准'}
                      </Typography>
                    </Alert>
                  )}

                  {/* 日期选择 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <TextField
                        fullWidth
                        label="开始日期"
                        type="date"
                        value={application.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                      />
                    </Box>
                    <Box>
                      <TextField
                        fullWidth
                        label="结束日期"
                        type="date"
                        value={application.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                      />
                    </Box>
                  </Box>

                  {/* 请假天数显示 */}
                  {application.days > 0 && (
                    <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        请假天数: {application.days} 天
                      </Typography>
                      {errors.days && (
                        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                          {errors.days}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* 请假原因 */}
                  <TextField
                    fullWidth
                    label="请假原因"
                    multiline
                    rows={4}
                    value={application.reason}
                    onChange={(e) => setApplication(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="请详细说明请假原因..."
                    error={!!errors.reason}
                    helperText={errors.reason}
                  />

                  {/* 紧急联系信息 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <TextField
                        fullWidth
                        label="紧急联系人"
                        value={application.emergencyContact}
                        onChange={(e) => setApplication(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        error={!!errors.emergencyContact}
                        helperText={errors.emergencyContact}
                      />
                    </Box>
                    <Box>
                      <TextField
                        fullWidth
                        label="联系电话"
                        value={application.emergencyPhone}
                        onChange={(e) => setApplication(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        error={!!errors.emergencyPhone}
                        helperText={errors.emergencyPhone}
                      />
                    </Box>
                  </Box>

                  {/* 工作交接 */}
                  <TextField
                    fullWidth
                    label="工作交接说明（可选）"
                    multiline
                    rows={3}
                    value={application.handoverNotes}
                    onChange={(e) => setApplication(prev => ({ ...prev, handoverNotes: e.target.value }))}
                    placeholder="请说明工作交接安排..."
                  />

                  {/* 附件上传区域 */}
                  <Box sx={{ p: 2, border: '2px dashed #e0e0e0', borderRadius: 2, textAlign: 'center' }}>
                    <AttachFileIcon sx={{ fontSize: 48, color: '#6c757d', mb: 1 }} />
                    <Typography variant="body1" sx={{ color: '#6c757d', mb: 1 }}>
                      上传相关证明文件（可选）
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6c757d' }}>
                      支持 PDF, JPG, PNG 格式，单个文件不超过 5MB
                    </Typography>
                    <Button variant="outlined" sx={{ mt: 2 }}>
                      选择文件
                    </Button>
                  </Box>

                  {/* 操作按钮 */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveDraft}
                    >
                      保存草稿
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSubmit}
                      sx={{ boxShadow: 'none' }}
                    >
                      提交申请
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 右侧信息面板 */}
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 申请须知 */}
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    申请须知
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                          <CalendarIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="提前申请"
                        secondary="病假需提前1天申请，紧急情况请电话联系主管"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#388e3c', width: 32, height: 32 }}>
                          <ScheduleIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="审批流程"
                        secondary="申请将依次经过直属教师和系部部门"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#f57c00', width: 32, height: 32 }}>
                          <WarningIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="注意事项"
                        secondary="病假需提供医疗证明，长期请假需安排工作交接"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* 假期余额 */}
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    假期余额
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {leaveTypes.map((type) => (
                      <Box key={type.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: type.color || '#8E8E93',
                            }}
                          />
                          <Typography variant="body2">{type.name}</Typography>
                        </Box>
                        <Chip
                          label={typeof type.allowancePerYear !== 'undefined' ? `年额度 ${type.allowancePerYear}` : '按配置'}
                          size="small"
                          sx={{
                            backgroundColor: type.color || '#8E8E93',
                            color: 'white',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* 申请预览对话框 */}
        <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
          <DialogTitle>确认提交申请</DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                申请摘要
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>请假类型</Typography>
                  <Typography variant="body1">{selectedLeaveType?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>请假天数</Typography>
                  <Typography variant="body1">{application.days} 天</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>开始日期</Typography>
                  <Typography variant="body1">{application.startDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>结束日期</Typography>
                  <Typography variant="body1">{application.endDate}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>请假原因</Typography>
                  <Typography variant="body1">{application.reason}</Typography>
                </Box>
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>
              取消
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSubmit}
              startIcon={<CheckCircleIcon />}
              sx={{ boxShadow: 'none' }}
            >
              确认提交
            </Button>
          </DialogActions>
        </Dialog>

        {/* 成功提示 */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setShowSuccess(false)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            申请提交成功！您可以在审批处理页面查看申请状态。
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
