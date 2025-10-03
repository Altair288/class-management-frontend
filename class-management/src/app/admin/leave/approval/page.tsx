"use client";

import { useEffect, useMemo, useState } from "react";
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
  Snackbar,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";

// 与其他页面一致，走 Next.js 代理
const API_BASE_URL = "/api";
// 新增：业务与附件存储约定常量
const BUSINESS_REF_TYPE = 'LEAVE_REQUEST';
const LEAVE_ATTACHMENT_BUCKET_PURPOSE = 'LEAVE_ATTACHMENT';

// 审批步骤（新接口 approvals 元素）
interface ApprovalStep {
  id: number;
  stepOrder: number;
  stepName: string;
  roleCode: string;
  roleDisplayName: string;
  teacherId?: number | null; // 指派教师（可能为空表示角色下任意成员）
  teacherName?: string | null;
  status: string; // 待审批 / 已批准 / 已拒绝
  comment?: string | null;
  reviewedAt?: string | null;
}
// 新增：附件文件类型
interface AttachmentFile { id: number; originalFilename: string; sizeBytes: number; status: string; createdAt?: string; downloadUrl?: string; ext?: string; mimeType?: string; }

// 后端新响应形状（最小必要字段）
interface BackendLeaveRequest {
  id: number;
  studentId?: number;
  studentName?: string;
  studentNo?: string; // 若后端仍返回则使用
  className?: string;
  leaveTypeId?: number;
  leaveTypeName?: string;
  status?: string;
  startDate?: string | number | Date;
  endDate?: string | number | Date;
  days?: number | string;
  reason?: string;
  createdAt?: string | number | Date;
  reviewedAt?: string | null;
  currentStepName?: string | null;
  pendingRoleCode?: string | null;
  pendingRoleDisplayName?: string | null;
  approvals?: ApprovalStep[];
}

// 前端用于渲染的结构
interface UILeaveRequest {
  id: number;
  studentName: string;
  studentNo: string; // 可能为 "" 若后端不再提供
  className: string;
  typeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;
  reason: string;
  status: string;
  createdAt?: string;
  currentStepName?: string | null;
  pendingRoleDisplayName?: string | null;
  approvals: ApprovalStep[];
}

// 请假类型与 palette key 的映射，便于深色模式适配
const typePaletteMap: Record<string, 'primary' | 'warning' | 'success' | 'secondary' | 'error'> = {
  '年假': 'primary',
  '病假': 'warning',
  '事假': 'success',
  '调休': 'secondary',
  '其他': 'error'
};

export default function ApprovalPage() {
  const theme = useTheme();
  const [requests, setRequests] = useState<UILeaveRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 新增：附件相关状态
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // 角色与班级筛选
  const [userType, setUserType] = useState<string>(''); // 管理员/教师/学生
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const isAdmin = userType === '管理员';
  // const isTeacher = userType === '教师';

  const [classes, setClasses] = useState<Array<{ id: number; name: string; grade?: string }>>([]);
  const [filterClassId, setFilterClassId] = useState<number | ''>('');
  const [detailDialog, setDetailDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UILeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalRemark, setApprovalRemark] = useState('');
  // Snackbar 状态：区分单条 / 批量 与不同时长
  const [snackbar, setSnackbar] = useState<{open:boolean; message:string; severity:'success'|'error'|'warning'|'info'; duration:number}>({open:false,message:'',severity:'success',duration:4000});
  // 预览相关新增状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 新增：格式化工具
  const formatSize = (bytes:number) => {
    if(bytes < 1024) return bytes + 'B';
    if(bytes < 1024**2) return (bytes/1024).toFixed(1)+'KB';
    if(bytes < 1024**3) return (bytes/1024**2).toFixed(1)+'MB';
    return (bytes/1024**3).toFixed(1)+'GB';
  };
  const shortName = (name:string) => name.length>32 ? name.slice(0,32)+'…' : name;
  const formatTime = (ts?: string) => {
    if(!ts) return '-';
    const d = new Date(ts);
    if(isNaN(d.getTime())) return '-';
    const pad = (n:number)=> n.toString().padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 加载附件（在详情对话框打开且选中请求发生变化时）
  useEffect(()=> {
    const controller = new AbortController();
    const load = async () => {
      if(!detailDialog || !selectedRequest?.id) { setAttachments([]); return; }
      try {
        setLoadingAttachments(true);
        const url = `/api/object-storage/business/${encodeURIComponent(BUSINESS_REF_TYPE)}/${selectedRequest.id}/files?bucketPurpose=${encodeURIComponent(LEAVE_ATTACHMENT_BUCKET_PURPOSE)}`;
        const resp = await fetch(url, { credentials:'include', signal: controller.signal });
        if(resp.ok){
          const data = await resp.json();
          const list = Array.isArray(data)? data as AttachmentFile[]: [];
          setAttachments(list);
        } else {
          setAttachments([]);
        }
      } catch(e){
        console.warn('加载附件失败', e);
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
    };
    load();
    return () => controller.abort();
  }, [detailDialog, selectedRequest?.id]);

  // 加载当前用户角色 + 基础数据
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 当前用户信息（含 userType、teacherId）
        const ures = await fetch(`${API_BASE_URL}/leave/current-user-info`, {
          signal: controller.signal,
          credentials: 'include',
        });
        if (!ures.ok) throw new Error(`获取当前用户失败 ${ures.status}`);
  const uinfo: { userType: string; teacherId?: number } = await ures.json();
        setUserType(uinfo.userType);
  if (uinfo.teacherId) setTeacherId(uinfo.teacherId);

        // 管理员：加载班级用于筛选
        if (uinfo.userType === '管理员') {
          const cres = await fetch(`${API_BASE_URL}/users/classes`, { credentials: 'include', signal: controller.signal });
          if (cres.ok) {
            const clist: Array<{ id: number; name: string; grade?: string }> = await cres.json();
            setClasses(clist);
          }
        }

        // 加载请假列表（教师取待审批列表，管理员取全部）
        const fetchList = async (): Promise<BackendLeaveRequest[]> => {
          if (uinfo.userType === '管理员') {
            const res = await fetch(`${API_BASE_URL}/leave/all`, { credentials: 'include', signal: controller.signal });
            if (!res.ok) throw new Error(`获取请假列表失败 ${res.status}`);
            return res.json();
          } else if (uinfo.userType === '教师' && uinfo.teacherId) {
            const res = await fetch(`${API_BASE_URL}/leave/teacher/${uinfo.teacherId}/pending`, { credentials: 'include', signal: controller.signal });
            if (!res.ok) throw new Error(`获取请假列表失败 ${res.status}`);
            return res.json();
          } else {
            return [];
          }
        };
        const rawList: BackendLeaveRequest[] = await fetchList();

        // 映射为 UI 结构
        const mapDate = (v: string | number | Date | undefined) => {
          if (!v) return '';
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return '';
          return d.toISOString().slice(0, 10);
        };
        const mapped: UILeaveRequest[] = rawList.map((r) => {
          const approvals: ApprovalStep[] = (r.approvals || []).map(a => ({ ...a }));
          return {
            id: r.id,
            studentName: r.studentName || '-',
            studentNo: r.studentNo || String(r.studentId || ''),
            className: r.className || '-',
            typeName: r.leaveTypeName || '-',
            startDate: mapDate(r.startDate),
            endDate: mapDate(r.endDate),
            days: typeof r.days === 'number' ? r.days : Number(r.days || 0),
            reason: r.reason || '',
            status: r.status || '-',
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
            currentStepName: r.currentStepName || null,
            pendingRoleDisplayName: r.pendingRoleDisplayName || null,
            approvals,
          };
        });
        setRequests(mapped);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(e);
        setError(msg || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);


  const canInlinePreview = (file: AttachmentFile): 'image' | 'pdf' | 'none' => {
    const ext = (file.ext || file.originalFilename.split('.').pop() || '').toLowerCase();
    if(['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)) return 'image';
    if(ext === 'pdf') return 'pdf';
    const mime = (file.mimeType || '').toLowerCase();
    if(mime.startsWith('image/')) return 'image';
    if(mime === 'application/pdf') return 'pdf';
    return 'none';
  };

  // 加载当前用户角色 + 基础数据
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 当前用户信息（含 userType、teacherId）
        const ures = await fetch(`${API_BASE_URL}/leave/current-user-info`, {
          signal: controller.signal,
          credentials: 'include',
        });
        if (!ures.ok) throw new Error(`获取当前用户失败 ${ures.status}`);
  const uinfo: { userType: string; teacherId?: number } = await ures.json();
        setUserType(uinfo.userType);
  if (uinfo.teacherId) setTeacherId(uinfo.teacherId);

        // 管理员：加载班级用于筛选
        if (uinfo.userType === '管理员') {
          const cres = await fetch(`${API_BASE_URL}/users/classes`, { credentials: 'include', signal: controller.signal });
          if (cres.ok) {
            const clist: Array<{ id: number; name: string; grade?: string }> = await cres.json();
            setClasses(clist);
          }
        }

        // 加载请假列表（教师取待审批列表，管理员取全部）
        const fetchList = async (): Promise<BackendLeaveRequest[]> => {
          if (uinfo.userType === '管理员') {
            const res = await fetch(`${API_BASE_URL}/leave/all`, { credentials: 'include', signal: controller.signal });
            if (!res.ok) throw new Error(`获取请假列表失败 ${res.status}`);
            return res.json();
          } else if (uinfo.userType === '教师' && uinfo.teacherId) {
            const res = await fetch(`${API_BASE_URL}/leave/teacher/${uinfo.teacherId}/pending`, { credentials: 'include', signal: controller.signal });
            if (!res.ok) throw new Error(`获取请假列表失败 ${res.status}`);
            return res.json();
          } else {
            return [];
          }
        };
        const rawList: BackendLeaveRequest[] = await fetchList();

        // 映射为 UI 结构
        const mapDate = (v: string | number | Date | undefined) => {
          if (!v) return '';
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return '';
          return d.toISOString().slice(0, 10);
        };
        const mapped: UILeaveRequest[] = rawList.map((r) => {
          const approvals: ApprovalStep[] = (r.approvals || []).map(a => ({ ...a }));
          return {
            id: r.id,
            studentName: r.studentName || '-',
            studentNo: r.studentNo || String(r.studentId || ''),
            className: r.className || '-',
            typeName: r.leaveTypeName || '-',
            startDate: mapDate(r.startDate),
            endDate: mapDate(r.endDate),
            days: typeof r.days === 'number' ? r.days : Number(r.days || 0),
            reason: r.reason || '',
            status: r.status || '-',
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
            currentStepName: r.currentStepName || null,
            pendingRoleDisplayName: r.pendingRoleDisplayName || null,
            approvals,
          };
        });
        setRequests(mapped);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(e);
        setError(msg || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // 判断当前教师是否可对该请求执行审批操作
  const canAct = (req: UILeaveRequest): boolean => {
    if (req.status !== '待审批') return false;
    if (!teacherId) return false;
    // 只要 approvals 中存在一个待审批且 teacherId 匹配即可
    return req.approvals.some(a => a.status === '待审批' && a.teacherId === teacherId);
  };

  // 过滤后的请求（仅显示待审批）；显示逻辑仍旧只展示待审批列表
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchType = !filterType || request.typeName === filterType;
      const matchSearch = !searchTerm ||
        request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.studentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = !isAdmin || !filterClassId || !!(request.className && classes.find(c => c.id === filterClassId && request.className === c.name));
      // 对教师端：后端已返回待审批列表；管理员端仍显示全部但这里保留待审批过滤以聚焦处理任务
      return matchType && matchSearch && matchClass && request.status === '待审批';
    });
  }, [requests, filterType, searchTerm, filterClassId, isAdmin, classes]);

  // 抽取刷新函数（单条或批量操作后使用）
  const refreshList = async () => {
    if (!userType) return;
    try {
      setLoading(true);
      let url: string | null = null;
      if (userType === '管理员') url = `${API_BASE_URL}/leave/all`;
      else if (userType === '教师' && teacherId) url = `${API_BASE_URL}/leave/teacher/${teacherId}/pending`;
      if (!url) { setRequests([]); return; }
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`刷新失败 ${res.status}`);
      const raw: BackendLeaveRequest[] = await res.json();
      const mapDate = (v: string | number | Date | undefined) => {
        if (!v) return '';
        const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; return d.toISOString().slice(0,10);
      };
      const mapped: UILeaveRequest[] = raw.map(r => ({
        id: r.id,
        studentName: r.studentName || '-',
        studentNo: r.studentNo || String(r.studentId || ''),
        className: r.className || '-',
        typeName: r.leaveTypeName || '-',
        startDate: mapDate(r.startDate),
        endDate: mapDate(r.endDate),
        days: typeof r.days === 'number' ? r.days : Number(r.days || 0),
        reason: r.reason || '',
        status: r.status || '-',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
        currentStepName: r.currentStepName || null,
        pendingRoleDisplayName: r.pendingRoleDisplayName || null,
        approvals: (r.approvals || []).map(a => ({...a}))
      }));
      setRequests(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 仅可选择可操作项
      setSelectedRequests(filteredRequests.filter(r => canAct(r)).map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id: number, checked: boolean) => {
    const req = filteredRequests.find(r => r.id === id);
    if (checked) {
      if (req && canAct(req)) setSelectedRequests(prev => [...prev, id]);
    } else {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    }
  };

  const handleViewDetail = (request: UILeaveRequest) => {
    setSelectedRequest(request);
    // 重置附件列表，触发 effect 重新加载
    setAttachments([]);
    setDetailDialog(true);
  };

  const handleApproval = (request: UILeaveRequest, action: 'approve' | 'reject') => {
    if (!canAct(request)) return; // 防止直接调用
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalDialog(true);
  };

  const handleBatchApproval = (action: 'approve' | 'reject') => {
    if (selectedRequests.length === 0 || !teacherId) return;
    const actionableIds = selectedRequests.slice();
    (async () => {
      try {
        const endpoint = action === 'approve' ? 'approve' : 'reject';
        const res = await fetch(`${API_BASE_URL}/leave/batch/${endpoint}?approverId=${teacherId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: actionableIds, comments: approvalRemark })
        });
        if (!res.ok) throw new Error(`批量操作失败 ${res.status}`);
        // 返回的是处理后的 DTO 列表，直接刷新
        await refreshList();
        setSelectedRequests([]);
        setApprovalRemark('');
        setSnackbar({
          open: true,
          message: `已${action === 'approve' ? '批准' : '拒绝'} ${actionableIds.length} 条请假申请`,
          severity: action === 'approve' ? 'success' : 'warning',
          duration: 7000
        });
      } catch (e) {
        console.error(e);
        setSnackbar({
          open: true,
          message: '批量操作失败，请稍后重试',
          severity: 'error',
          duration: 6000,
        });
      }
    })();
  };

  const submitApproval = async () => {
    if (!selectedRequest || !teacherId) return;
    try {
      const endpoint = approvalAction === 'approve' ? 'approve' : 'reject';
      const url = `${API_BASE_URL}/leave/${selectedRequest.id}/${endpoint}?approverId=${teacherId}&comments=${encodeURIComponent(approvalRemark || '')}`;
      const res = await fetch(url, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(`提交失败 ${res.status}`);
      // 单条返回最新 DTO，刷新整体列表避免状态不一致
      await refreshList();
      setApprovalDialog(false);
      setApprovalRemark('');
      setSelectedRequest(null);
      setSnackbar({
        open: true,
        message: `已${approvalAction === 'approve' ? '批准' : '拒绝'} ${selectedRequest.studentName} 的${selectedRequest.typeName}申请`,
        severity: approvalAction === 'approve' ? 'success' : 'warning',
        duration: 5000,
      });
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: '审批提交失败，请稍后重试',
        severity: 'error',
        duration: 6000,
      });
    }
  };

  const getTypeChip = (type: string) => {
    const paletteKey = typePaletteMap[type] || 'primary';
    const mainColor = theme.palette[paletteKey].main;
    const bg = alpha(mainColor, theme.palette.mode === 'light' ? 0.15 : 0.25);
    return (
      <Chip
        label={type}
        size="small"
        sx={{
          backgroundColor: bg,
          color: mainColor,
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: '6px'
        }}
      />
    );
  };

  const handleDownload = async (fileId:number) => {
    try {
      const resp = await fetch(`/api/object-storage/files/${fileId}/download-info`, { credentials:'include' });
      if(!resp.ok) throw new Error('获取下载信息失败');
      const info = await resp.json();
      if(info && info.downloadUrl){
        window.open(info.downloadUrl, '_blank');
      } else {
        setSnackbar({open:true, message:'未获得下载链接', severity:'warning', duration:3000});
      }
    } catch(e){
      console.error(e);
      setSnackbar({open:true, message:'下载失败', severity:'error', duration:4000});
    }
  };

  const handlePreview = async (fileId:number) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewFile(null);
    setPreviewUrl(null);
    try {
      const resp = await fetch(`/api/object-storage/files/${fileId}/download-info`, { credentials:'include' });
      if(!resp.ok) throw new Error('获取预览信息失败');
      const info: AttachmentFile = await resp.json();
      setPreviewFile(info);
      if(info.downloadUrl){
        setPreviewUrl(info.downloadUrl);
      } else {
        setPreviewError('未获得预签名链接');
      }
    } catch(e: unknown){
      console.error(e);
      setPreviewError(e instanceof Error? e.message : '预览失败');
    } finally {
      setPreviewLoading(false);
    }
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
          <Typography variant="h4" sx={(theme) => ({ fontWeight: 700, color: theme.palette.text.primary, mb: 1 })}>
            审批处理
          </Typography>
          <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
            处理待审批的请假申请，支持单个和批量操作
          </Typography>
        </Box>

  {/* 统计信息 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={(theme) => ({ color: theme.palette.warning.main, fontWeight: 700, mb: 1 })}>
                {filteredRequests.length}
              </Typography>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                待审批申请
              </Typography>
            </CardContent>
          </Card>
          <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={(theme) => ({ color: theme.palette.error.main, fontWeight: 700, mb: 1 })}>
    {requests.length}
              </Typography>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
    全部申请
              </Typography>
            </CardContent>
          </Card>
          <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={(theme) => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 1 })}>
                {selectedRequests.length}
              </Typography>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                已选择
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 筛选和操作栏 */}
        <Card sx={(theme) => ({ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
              <TextField
                placeholder="搜索学生姓名、学号或班级"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250, flex: 1 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={(theme) => ({ color: theme.palette.text.secondary, mr: 1 })} />,
                }}
              />
              {isAdmin && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>班级</InputLabel>
                  <Select
                    value={filterClassId}
                    onChange={(e) => setFilterClassId(e.target.value as number | '')}
                    label="班级"
                  >
                    <MenuItem value="">全部</MenuItem>
                    {classes.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}{c.grade ? ` · ${c.grade}` : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

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

              {/* <FormControl size="small" sx={{ minWidth: 100 }}>
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
              </FormControl> */}
            </Box>

            {/* 批量操作按钮 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
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
  <Card sx={(theme) => ({ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper })}>
          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={(theme) => ({ backgroundColor: theme.palette.action.hover })}>
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
                  <TableCell sx={{ fontWeight: 600 }}>当前步骤</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>待审批角色</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>进度</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((item) => {
                  const totalSteps = item.approvals.length;
                  const approvedSteps = item.approvals.filter(a => a.status === '已批准').length;
                  const actionable = canAct(item);
                  return (
                  <TableRow 
                    key={item.id} 
                    hover
                    selected={selectedRequests.includes(item.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRequests.includes(item.id)}
                        onChange={(e) => handleSelectRequest(item.id, e.target.checked)}
                        disabled={!actionable}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                          {item.studentName?.[0] || '-'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.studentName}
                          </Typography>
                          <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                            {item.studentNo} · {item.className}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getTypeChip(item.typeName)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.startDate} 至 {item.endDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.days} 天
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>{item.currentStepName || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.pendingRoleDisplayName || '-'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {approvedSteps}/{totalSteps || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.status} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="查看详情">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetail(item)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {actionable && (
                          <>
                            <Tooltip title="批准">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproval(item, 'approve')}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="拒绝">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleApproval(item, 'reject')}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredRequests.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                {loading ? '加载中...' : '暂无待审批的请假申请'}
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
                    label="学生姓名"
                    value={selectedRequest.studentName}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="学生学号"
                    value={selectedRequest.studentNo}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="所属班级"
                    value={selectedRequest.className}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="请假类型"
                    value={selectedRequest.typeName}
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
                  <TextField
                    label="当前步骤"
                    value={selectedRequest.currentStepName || ''}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="待审批角色"
                    value={selectedRequest.pendingRoleDisplayName || ''}
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
                {/* 审批进度列表 */}
                {selectedRequest.approvals.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>审批步骤</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>序号</TableCell>
                          <TableCell>步骤名称</TableCell>
                          <TableCell>角色</TableCell>
                          <TableCell>审批教师</TableCell>
                          <TableCell>状态</TableCell>
                          <TableCell>时间</TableCell>
                          <TableCell>备注</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRequest.approvals
                          .sort((a,b) => a.stepOrder - b.stepOrder)
                          .map(step => (
                            <TableRow key={step.id}>
                              <TableCell>{step.stepOrder}</TableCell>
                              <TableCell>{step.stepName}</TableCell>
                              <TableCell>{step.roleDisplayName}</TableCell>
                              <TableCell>{step.teacherName || '-'}</TableCell>
                              <TableCell>{step.status}</TableCell>
                              <TableCell>{step.reviewedAt ? step.reviewedAt : '-'}</TableCell>
                              <TableCell>{step.comment || '-'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
                {/* 新增：申请附件展示 */}
                {attachments && detailDialog && (
                  <Box sx={{ mt:3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight:600, mb:1 }}>申请附件</Typography>
                    {loadingAttachments && (
                      <Typography variant="caption" color="text.secondary">加载中...</Typography>
                    )}
                    {!loadingAttachments && attachments.length === 0 && (
                      <Typography variant="body2" color="text.secondary">暂无附件</Typography>
                    )}
                    {!loadingAttachments && attachments.length > 0 && (
                      <Table size="small" sx={{ mt:1 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>文件名</TableCell>
                            <TableCell>大小</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>上传时间</TableCell>
                            <TableCell>操作</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attachments.map(f => (
                            <TableRow key={f.id} hover>
                              <TableCell title={f.originalFilename}>{shortName(f.originalFilename)}</TableCell>
                              <TableCell>{formatSize(f.sizeBytes)}</TableCell>
                              <TableCell>{f.status}</TableCell>
                              <TableCell>{formatTime(f.createdAt)}</TableCell>
                              <TableCell>
                                <Button size="small" sx={{ mr:1 }} variant="outlined" onClick={()=> handlePreview(f.id)}>预览</Button>
                                <Button size="small" variant="contained" onClick={()=> handleDownload(f.id)}>下载</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                )}
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
                  您即将{approvalAction === 'approve' ? '批准' : '拒绝'} {selectedRequest.studentName} 的{selectedRequest.typeName}申请
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

        {/* 附件预览对话框 */}
        <Dialog open={previewOpen} onClose={()=> setPreviewOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>附件预览</DialogTitle>
          <DialogContent dividers sx={{ minHeight: 300 }}>
            {previewLoading && (
              <Typography variant="body2" color="text.secondary">加载中...</Typography>
            )}
            {!previewLoading && previewError && (
              <Alert severity="error" sx={{ mb:2 }}>{previewError}</Alert>
            )}
            {!previewLoading && !previewError && previewFile && previewUrl && (() => {
              const mode = canInlinePreview(previewFile);
              if(mode === 'image') {
                return (
                  <Box sx={{ display:'flex', justifyContent:'center' }}>
                    <Box component="img" src={previewUrl} alt={previewFile.originalFilename} sx={{ maxWidth:'100%', maxHeight: '70vh', objectFit:'contain', borderRadius:1, boxShadow:1 }} />
                  </Box>
                );
              }
              if(mode === 'pdf') {
                return (
                  <Box sx={{ height: '70vh' }}>
                    <iframe
                      src={previewUrl}
                      style={{ width:'100%', height:'100%', border:'none' }}
                      title={previewFile.originalFilename}
                    />
                  </Box>
                );
              }
              return (
                <Box>
                  <Alert severity="info" sx={{ mb:2 }}>该文件类型暂不支持内嵌预览，请点击下方下载。</Alert>
                  <Button variant="contained" onClick={()=> window.open(previewUrl,'_blank')}>在新窗口打开</Button>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> setPreviewOpen(false)}>关闭</Button>
            {!previewLoading && previewUrl && (
              <Button onClick={()=> window.open(previewUrl!, '_blank')} variant="outlined">新窗口打开</Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
