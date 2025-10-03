"use client";

import { useEffect, useState, useMemo } from "react";
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
  useTheme,
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import {
  Send as SendIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import { motion } from "framer-motion";

// 为了让 Snackbar 避开底部胶囊导航，提供一个移动端底部偏移常量（胶囊高度≈40 + 上下内边距&阴影余量）
const SNACKBAR_MOBILE_BOTTOM_OFFSET = 64; // px

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

// 颜色映射改为使用主题 palette（支持深色模式）
import type { Theme } from '@mui/material/styles';
const buildTypeColor = (theme: Theme) => (code: string) => {
  // 允许后端返回 color，但前端需要一个 fallback 映射到语义色
  const colors: Record<string, string> = {
    annual: theme.palette.info?.main || theme.palette.primary.main,
    sick: theme.palette.success.main,
    personal: theme.palette.warning.main,
    emergency: theme.palette.error.main,
    default: theme.palette.text.secondary,
  };
  return colors[code] || colors.default;
};

export default function LeaveApplyPage() {
  const theme = useTheme();
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  // memoize 颜色映射函数，避免每次渲染产生新引用导致 useEffect 重复请求
  const typeColor = useMemo(() => buildTypeColor(theme), [theme]);
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

  // ================= 附件上传集成（MinIO 对象存储） =================
  // 约定 bucketPurpose（需与后台已配置的存储配置一致）
  const LEAVE_ATTACHMENT_BUCKET_PURPOSE = 'LEAVE_ATTACHMENT'; // 请确保后端存在对应启用的存储配置
  const BUSINESS_REF_TYPE = 'LEAVE_REQUEST';
  const MAX_SINGLE_FILE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png'];
  interface UploadItem { file: File; status: 'pending' | 'creating' | 'uploading' | 'confirming' | 'done' | 'error'; progress: number; error?: string; fileObjectId?: number; }
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadingAfterSubmit, setUploadingAfterSubmit] = useState(false);
  const [uploadSummaryMsg, setUploadSummaryMsg] = useState<string | null>(null);
  // const hasPendingUploads = useMemo(()=> uploadItems.some(i=> i.status==='pending'), [uploadItems]); // 预留未来用于按钮显隐

  // 刚刚创建的请假单 ID 及其已绑定附件（确认后无感刷新）
  const [lastLeaveRequestId, setLastLeaveRequestId] = useState<number | null>(null);
  interface AttachedFile { id: number; originalFilename: string; sizeBytes: number; status: string; createdAt?: string; }
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loadingAttached, setLoadingAttached] = useState(false);

  const safeMessage = (e: unknown, fallback: string) => {
    if (typeof e === 'string') return e;
    if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
      return (e as { message: string }).message;
    }
    return fallback;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    const newItems: UploadItem[] = [];
    list.forEach(f => {
      const ext = f.name.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';
      if (f.size > MAX_SINGLE_FILE) {
        newItems.push({ file: f, status: 'error', progress: 0, error: '超过 5MB 限制' });
        return;
      }
      if (ext && !ALLOWED_EXTS.includes(ext)) {
        newItems.push({ file: f, status: 'error', progress: 0, error: '格式不允许' });
        return;
      }
      newItems.push({ file: f, status: 'pending', progress: 0 });
    });
    setUploadItems(prev => [...prev, ...newItems]);
  };

  const removeUploadItem = (idx: number) => {
    setUploadItems(prev => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + 'KB';
    if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + 'MB';
    return (bytes / 1024 ** 3).toFixed(1) + 'GB';
  };

  const shortName = (name: string) => {
    if (!name) return '';
    return name.length > 10 ? name.slice(0, 10) + '…' : name;
  };

  const fetchAttachedFiles = async (leaveRequestId: number) => {
    try {
      setLoadingAttached(true);
      const resp = await fetch(`/api/object-storage/business/${encodeURIComponent(BUSINESS_REF_TYPE)}/${leaveRequestId}/files?bucketPurpose=${encodeURIComponent(LEAVE_ATTACHMENT_BUCKET_PURPOSE)}`, { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        setAttachedFiles(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('附件列表获取失败', e);
    } finally {
      setLoadingAttached(false);
    }
  };

  const createUpload = async (item: UploadItem, leaveRequestId: number) => {
    try {
      const body = {
        bucketPurpose: LEAVE_ATTACHMENT_BUCKET_PURPOSE,
        originalFilename: item.file.name,
        businessRefType: BUSINESS_REF_TYPE,
        businessRefId: leaveRequestId,
        expectedSize: item.file.size
      };
      const resp = await fetch(`/api/object-storage/upload/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      if (!resp.ok) throw new Error('创建上传失败:' + resp.status);
      return await resp.json(); // {presignUrl,fileObjectId,expireSeconds}
    } catch (e: unknown) {
      return { error: safeMessage(e, '创建上传失败') };
    }
  };

  const putFile = (item: UploadItem, presignUrl: string, onProgress: (p: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignUrl, true);
      xhr.upload.onprogress = ev => { if (ev.lengthComputable) { onProgress(Math.round(ev.loaded / ev.total * 100)); } };
      xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error('PUT失败:' + xhr.status)); };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(item.file);
    });
  };

  const confirmUpload = async (fileObjectId: number, item: UploadItem) => {
    const mime = (item.file.type || 'application/octet-stream').toLowerCase();
    const resp = await fetch(`/api/object-storage/upload/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileObjectId, sizeBytes: item.file.size, mimeType: mime }),
      credentials: 'include'
    });
    if (!resp.ok) throw new Error('确认失败:' + resp.status);
    return resp.json();
  };

  const runUploads = async (leaveRequestId: number) => {
    if (uploadItems.length === 0) return { done: 0, failed: 0 };
    setUploadingAfterSubmit(true);
    let done = 0, failed = 0;
    for (let i = 0; i < uploadItems.length; i++) {
      const it = uploadItems[i];
      if (it.status === 'error' || it.status === 'done') { if (it.status === 'done') done++; continue; }
      // 标记 creating
      setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'creating', progress: 0, error: undefined } : p));
      const createResp = await createUpload(it, leaveRequestId);
      if (createResp.error || !createResp.presignUrl || !createResp.fileObjectId) {
        failed++;
        setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: createResp.error || '创建失败' } : p));
        continue;
      }
      const { presignUrl, fileObjectId } = createResp;
      // 上传
      setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'uploading', progress: 0, fileObjectId } : p));
      try {
        await putFile(it, presignUrl, (prog) => setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, progress: prog } : p)));
      } catch (e: unknown) {
        failed++;
        setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: safeMessage(e, '上传失败') } : p));
        continue;
      }
      // 确认
      setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'confirming' } : p));
      try {
        await confirmUpload(fileObjectId, it);
        done++;
        setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', progress: 100 } : p));
      } catch (e: unknown) {
        failed++;
        setUploadItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: safeMessage(e, '确认失败') } : p));
      }
    }
    setUploadingAfterSubmit(false);
    return { done, failed };
  };

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
  }, [typeColor]);

  // 计算请假天数
  // 计算请假天数（包含首尾两天）。若结束日期早于开始日期返回 0。
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0; // 不合法顺序
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包含首尾
    return diffDays;
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
    const updated = { ...application, [field]: value } as LeaveApplication;
    const days = calculateDays(updated.startDate, updated.endDate);
    updated.days = days;

    // 实时校验日期顺序
    setErrors(prev => {
      const next = { ...prev };
      if (updated.startDate && updated.endDate) {
        if (new Date(updated.startDate) > new Date(updated.endDate)) {
          next.endDate = '结束日期不能早于开始日期';
        } else {
          // 清理相关错误
          delete next.endDate;
        }
      }
      return next;
    });
    setApplication(updated);
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
      const saved = await res.json();
      const leaveRequestId = saved?.id || saved?.leaveRequestId || saved?.leaveTypeId; // 兼容不同返回字段（需确保后端返回 id）
      if (leaveRequestId) setLastLeaveRequestId(leaveRequestId);

      // 上传附件（如果有）
      if (leaveRequestId && uploadItems.length > 0) {
        const { done, failed } = await runUploads(leaveRequestId);
        if (failed > 0) {
          // 有失败 -> 回滚：调用取消接口
          try {
            await fetch(`${API_BASE_URL}/leave/request/${leaveRequestId}/cancel`.replace('/request/', '/'), { // ensure path /api/leave/{id}/cancel
              method: 'POST',
              credentials: 'include'
            });
            setUploadSummaryMsg(`附件上传失败(${failed}/${done + failed})，申请已自动撤销，请重新提交。`);
          } catch {
            setUploadSummaryMsg(`附件部分失败(${failed})，且撤销失败，请联系管理员。`);
          }
        } else {
          setUploadSummaryMsg(`附件上传完成：成功 ${done} 个`);
          await fetchAttachedFiles(leaveRequestId);
        }
      } else if (uploadItems.length > 0) {
        setUploadSummaryMsg('未获取到请假单ID，附件未上传');
      }
      // 如果没有附件需要上传也尝试刷新（可能无附件）
      if (leaveRequestId && uploadItems.length === 0) {
        fetchAttachedFiles(leaveRequestId);
      }

      setShowPreview(false);
      // 如果发生了回滚，不展示“成功提交”，而是保留 summary 提示
      if (!uploadSummaryMsg || !uploadSummaryMsg.includes('已自动撤销')) {
        setShowSuccess(true);
      }
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
      // 不清空上传结果，让用户看到状态；如需清空可在成功提示关闭时处理
    } catch (e) {
      console.error(e);
      alert('提交失败，请稍后重试');
    } finally {
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      // 让背景继承 layout 的统一渐变 / token
      bgcolor: 'transparent',
      transition: 'background-color 0.3s ease'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          {/* 页面标题 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1
            }}>
              请假申请
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              填写详细信息提交您的请假申请
            </Typography>
          </Box>

          {/* 用户信息卡片 */}
          <Card sx={{ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 50, height: 50 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {currentUser?.studentName || currentUser?.userId || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {currentUser?.userType || ''} · {currentUser?.className || ''}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                    直属教师
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>{currentUser?.teacherName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                    手机
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>{currentUser?.phone || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                    邮箱
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>{currentUser?.email || '-'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            {/* 左侧表单 */}
            <Box>
              <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
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
                                  backgroundColor: type.color || theme.palette.text.secondary,
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1">{type.name}</Typography>
                                {typeof type.allowancePerYear !== 'undefined' && (
                                  <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
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
                      <Box sx={(theme) => ({
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.18)
                          : alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                        transition: 'background-color .25s ease, border-color .25s ease'
                      })}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
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

                    {/* 附件上传区域（真实集成） */}
                    <Box sx={(theme) => ({ p: 2, border: `2px dashed ${theme.palette.divider}`, borderRadius: 2, backgroundColor: theme.palette.action.hover })}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachFileIcon color="action" />
                          <Typography variant="subtitle2" fontWeight={600}>附件上传</Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          component="label"
                          disabled={uploadingAfterSubmit}
                        >
                          选择文件
                          <input
                            type="file"
                            hidden
                            multiple
                            accept={ALLOWED_EXTS.map(e => '.' + e).join(',')}
                            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                          />
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        支持 {ALLOWED_EXTS.join('/').toUpperCase()}，单个 ≤ 5MB；提交后自动上传并绑定到请假单。
                      </Typography>
                      {uploadItems.length === 0 && (
                        <Typography variant="body2" color="text.secondary">尚未选择附件。</Typography>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {uploadItems.map((it, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" title={it.file.name} sx={{ wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 1.2 }}>
                                {shortName(it.file.name)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{formatSize(it.file.size)}</Typography>
                              {it.status === 'uploading' && (
                                <LinearProgress variant="determinate" value={it.progress} sx={{ mt: 0.5 }} />
                              )}
                              {it.status === 'creating' || it.status === 'confirming' ? (
                                <LinearProgress variant="indeterminate" sx={{ mt: 0.5 }} />
                              ) : null}
                              {it.status === 'error' && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{it.error}</Typography>
                              )}
                            </Box>
                            <Chip size="small" label={it.status} color={it.status === 'done' ? 'success' : it.status === 'error' ? 'error' : 'default'} />
                            {it.status === 'pending' && !uploadingAfterSubmit && (
                              <IconButton size="small" onClick={() => removeUploadItem(idx)}><DeleteIcon fontSize="small" /></IconButton>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </Box>

                    {/* 已上传附件列表（提交后显示） */}
                    {lastLeaveRequestId && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>本次申请附件</Typography>
                        {loadingAttached && (
                          <Typography variant="caption" color="text.secondary">加载中...</Typography>
                        )}
                        {!loadingAttached && attachedFiles.length === 0 && (
                          <Typography variant="body2" color="text.secondary">暂无附件</Typography>
                        )}
                        {!loadingAttached && attachedFiles.length > 0 && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {attachedFiles.map(f => (
                              <Paper key={f.id} variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" title={f.originalFilename} sx={{ wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 1.2 }}>
                                    {shortName(f.originalFilename)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">{formatSize(f.sizeBytes)} · {f.status}</Typography>
                                </Box>
                                {/* 未来可加下载/预览按钮 */}
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* 操作按钮 */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
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
                <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      申请须知
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={(theme) => ({ bgcolor: theme.palette.info?.main || theme.palette.primary.main, width: 32, height: 32 })}>
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
                          <Avatar sx={(theme) => ({ bgcolor: theme.palette.success.main, width: 32, height: 32 })}>
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
                          <Avatar sx={(theme) => ({ bgcolor: theme.palette.warning.main, width: 32, height: 32 })}>
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
                <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
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
                                backgroundColor: type.color || theme.palette.text.secondary,
                              }}
                            />
                            <Typography variant="body2">{type.name}</Typography>
                          </Box>
                          <Chip
                            label={typeof type.allowancePerYear !== 'undefined' ? `年额度 ${type.allowancePerYear}` : '按配置'}
                            size="small"
                            sx={{
                              backgroundColor: type.color || theme.palette.text.secondary,
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
            <DialogTitle sx={{
              fontWeight: 600,
              pb: 1.5,
            }}>确认提交申请</DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
              <Paper sx={(theme) => ({
                p: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: theme.palette.primary.main,
                }
              })}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  申请摘要
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">请假类型</Typography>
                    <Typography variant="body1" color="text.primary">{selectedLeaveType?.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">请假天数</Typography>
                    <Typography variant="body1" color="text.primary">{application.days} 天</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">开始日期</Typography>
                    <Typography variant="body1" color="text.primary">{application.startDate}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">结束日期</Typography>
                    <Typography variant="body1" color="text.primary">{application.endDate}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="body2" color="text.secondary">请假原因</Typography>
                    <Typography variant="body1" color="text.primary">{application.reason}</Typography>
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
            // 通过 sx 直接设置根元素位置，避免被底部导航遮挡
            sx={(theme) => ({
              zIndex: theme.zIndex.snackbar, // 确保高于底部导航 (导航 zIndex:1200, snackbar 默认 1400，此处显式声明防止主题自定义影响)
              bottom: {
                xs: `calc(${SNACKBAR_MOBILE_BOTTOM_OFFSET}px + env(safe-area-inset-bottom, 0px))`,
                sm: 24,
              },
              right: 16,
              left: 'auto',
              '@supports (padding: max(0px))': {
                bottom: {
                  xs: `calc(${SNACKBAR_MOBILE_BOTTOM_OFFSET}px + env(safe-area-inset-bottom, 0px))`,
                  sm: 24,
                }
              }
            })}
          >
            <Alert
              onClose={() => setShowSuccess(false)}
              severity="success"
              sx={{ width: { xs: 'calc(100% - 32px)', sm: '360px' } }}
            >
              申请提交成功！{uploadSummaryMsg ? uploadSummaryMsg : '请耐心等待审批。'}
            </Alert>
          </Snackbar>
          {/* ...existing code... */}
        </Box>
      </motion.div>
    </Box>
  );
}
