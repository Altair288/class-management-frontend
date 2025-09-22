"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
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
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// 可分配角色 DTO（来自教师管理模块接口 /api/teachers/management/assignable-roles）
interface AssignableRoleDTO {
  id: number;
  code: string;          // 例如 HOMEROOM / DEPT_HEAD / GRADE_HEAD
  displayName: string;   // 中文显示名
  category?: string;
  level?: number;
  sortOrder?: number;
  description?: string | null;
  enabled?: boolean;
}

// API 基础 URL（走 Next.js 代理，避免 CORS 与环境差异）
const API_BASE_URL = "/api";

// API 调用函数（修复后）
const leaveTypeApi = {
  // 获取所有请假类型（包括已停用的）
  getAllLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/all`, { credentials: 'include' });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`加载失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 获取激活的请假类型
  getActiveLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/active`, { credentials: 'include' });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`加载激活类型失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 创建新的请假类型
  createLeaveType: async (leaveType: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> => {
    const response = await fetch(`${API_BASE_URL}/leave/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(leaveType),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`创建失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 更新请假类型
  updateLeaveType: async (id: number, leaveType: Omit<LeaveType, 'createdAt' | 'updatedAt'>): Promise<LeaveType> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(leaveType),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`更新失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 删除请假类型
  deleteLeaveType: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`删除失败 ${response.status}: ${text || response.statusText}`);
    }
  },

  // 激活请假类型
  activateLeaveType: async (id: number): Promise<LeaveType> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/${id}/activate`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`启用失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 停用请假类型
  deactivateLeaveType: async (id: number): Promise<LeaveType> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/${id}/deactivate`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`停用失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 同步该类型的余额（默认仅当前学年）
  syncBalances: async (
    id: number,
    onlyCurrentYear: boolean = true
  ): Promise<{ updated: number; onlyCurrentYear: boolean }> => {
    const response = await fetch(
      `${API_BASE_URL}/leave/config/${id}/sync-balances?onlyCurrentYear=${onlyCurrentYear ? 'true' : 'false'}`,
      { method: 'POST', credentials: 'include' }
    );
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`同步失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },
};

// 审批流程 API
const workflowsApi = {
  listBindings: async (): Promise<LeaveTypeWorkflowBinding[]> => {
    const res = await fetch(`${API_BASE_URL}/workflows/bindings`, { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`加载绑定关系失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  bindType: async (leaveTypeId: number, workflowId: number): Promise<LeaveTypeWorkflowBinding> => {
    const res = await fetch(`${API_BASE_URL}/workflows/bind/type/${leaveTypeId}/workflow/${workflowId}`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`绑定失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  unbindType: async (leaveTypeId: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/workflows/bind/type/${leaveTypeId}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`解绑失败 ${res.status}: ${text || res.statusText}`);
    }
  },
  list: async (): Promise<BackendWorkflow[]> => {
    const res = await fetch(`${API_BASE_URL}/workflows`, { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`加载流程失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  create: async (w: Partial<BackendWorkflow>): Promise<BackendWorkflow> => {
    const res = await fetch(`${API_BASE_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(w),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`创建流程失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  update: async (id: number, w: Partial<BackendWorkflow>): Promise<BackendWorkflow> => {
    const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(w),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`更新流程失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  remove: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`删除流程失败 ${res.status}: ${text || res.statusText}`);
    }
  },
  steps: async (workflowId: number): Promise<BackendWorkflowStep[]> => {
    const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/steps`, { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`加载流程步骤失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  addStep: async (workflowId: number, s: Partial<BackendWorkflowStep>): Promise<BackendWorkflowStep> => {
    const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        stepName: s.stepName,
        roleCode: s.roleCode,
        stepOrder: s.stepOrder,
        autoApprove: s.autoApprove,
        enabled: s.enabled,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`新增步骤失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  updateStep: async (stepId: number, s: Partial<BackendWorkflowStep>): Promise<BackendWorkflowStep> => {
    const res = await fetch(`${API_BASE_URL}/workflows/steps/${stepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        stepName: s.stepName,
        roleCode: s.roleCode,
        stepOrder: s.stepOrder,
        autoApprove: s.autoApprove,
        enabled: s.enabled,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`更新步骤失败 ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  removeStep: async (stepId: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/workflows/steps/${stepId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`删除步骤失败 ${res.status}: ${text || res.statusText}`);
    }
  },
};

interface LeaveType {
  id: number;
  typeName: string;
  typeCode: string;
  description: string;
  annualAllowance: number;
  maxDaysPerRequest: number;
  requiresApproval: boolean;
  requiresMedicalProof: boolean;
  advanceDaysRequired: number;
  color: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 后端返回类型
type BackendWorkflow = {
  id: number;
  workflowName: string;
  workflowCode: string;
  description?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendWorkflowStep = {
  id: number;
  workflowId: number;
  stepOrder: number;
  stepName: string;
  roleCode: string;            // 后端角色编码
  roleDisplayName: string;     // 可直接展示
  autoApprove: boolean;
  enabled: boolean;
};

type LeaveTypeWorkflowBinding = {
  id: number;
  leaveTypeId: number;
  workflowId: number;
  enabled?: boolean;
};

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemNotifications: boolean;
  notifyOnRequest: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  reminderBeforeLeave: number; // days
}

// 占位：不再使用模拟流程

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ConfigPage() {
  const [tabValue, setTabValue] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [workflows, setWorkflows] = useState<BackendWorkflow[]>([]);
  const [wfSteps, setWfSteps] = useState<Record<number, BackendWorkflowStep[]>>({});
  const [wfLoading, setWfLoading] = useState(false);
  const [wfError, setWfError] = useState<string | null>(null);
  const [typeBindings, setTypeBindings] = useState<Record<number, number | null>>({}); // leaveTypeId -> workflowId
  // 流程编辑弹窗
  const [wfDialogOpen, setWfDialogOpen] = useState(false);
  const [wfSaving, setWfSaving] = useState(false);
  const [wfForm, setWfForm] = useState<Partial<BackendWorkflow>>({ workflowName: '', workflowCode: '', description: '', enabled: true });
  // 步骤编辑弹窗
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState<Partial<BackendWorkflowStep>>({ stepOrder: 1, stepName: '', roleCode: '', autoApprove: false, enabled: true });
  const [editDialog, setEditDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [loading, setLoading] = useState(false);
  // 行级加载态，避免整页刷新闪烁
  const [pendingMap, setPendingMap] = useState<Record<number, boolean>>({});
  // 编辑弹窗保存态
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  // 通用确认弹窗
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    content: React.ReactNode;
    onConfirm?: () => void | Promise<void>;
  }>({ open: false, title: '', content: '' });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    systemNotifications: true,
    notifyOnRequest: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    reminderBeforeLeave: 3,
  });

  // 可分配审批角色列表（下拉用）
  const [assignableRoles, setAssignableRoles] = useState<AssignableRoleDTO[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // 加载请假类型数据
  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await leaveTypeApi.getAllLeaveTypes();
      setLeaveTypes(data);
    } catch (error: unknown) {
      console.error('Failed to load leave types:', error);
      const msg = error instanceof Error ? error.message : '未知错误';
      setSnackbarMessage(`加载请假类型失败：${msg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadLeaveTypes();
    // 加载审批流程列表与步骤
    (async () => {
      try {
        setWfLoading(true);
        setWfError(null);
        const list = await workflowsApi.list();
        setWorkflows(list);
        // 并行加载每个流程的步骤
    const pairs = await Promise.all(
          list.map(async (w) => {
            try {
              const steps = await workflowsApi.steps(w.id);
              // 保持按 stepOrder 排序
              steps.sort((a, b) => a.stepOrder - b.stepOrder);
      return [w.id, steps as BackendWorkflowStep[]] as const;
            } catch (e) {
              console.error('加载步骤失败', w.id, e);
      return [w.id, [] as BackendWorkflowStep[]] as const;
            }
          })
        );
        const map: Record<number, BackendWorkflowStep[]> = {};
        for (const [id, steps] of pairs) map[id] = steps;
        setWfSteps(map);
        // 加载类型-流程绑定
        try {
          const binds = await workflowsApi.listBindings();
          const next: Record<number, number | null> = {};
          for (const b of binds) {
            if (b.enabled === false) continue;
            next[b.leaveTypeId] = b.workflowId;
          }
          setTypeBindings(next);
        } catch (be) {
          console.error('加载绑定失败', be);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载失败';
        setWfError(msg);
      } finally {
        setWfLoading(false);
      }
    })();

    // 加载可分配审批角色
    (async () => {
      try {
        setRolesLoading(true);
        setRolesError(null);
        const res = await fetch('/api/teachers/management/assignable-roles', { credentials: 'include' });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || res.statusText);
        }
        const data: AssignableRoleDTO[] = await res.json();
        // 只保留 enabled 的，按 level/ sortOrder 排序
        const sorted = [...data]
          .filter(r => r.enabled !== false)
          .sort((a,b) => {
            const l = (a.level ?? 0) - (b.level ?? 0);
            return l !== 0 ? l : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          });
        setAssignableRoles(sorted);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '加载可分配角色失败';
        setRolesError(msg);
      } finally {
        setRolesLoading(false);
      }
    })();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 工作流：新增
  const handleAddWorkflow = () => {
    setWfForm({ workflowName: '', workflowCode: '', description: '', enabled: true });
    setWfDialogOpen(true);
  };

  // 工作流：编辑
  const handleEditWorkflow = (w: BackendWorkflow) => {
    setWfForm({ ...w });
    setWfDialogOpen(true);
  };

  // 工作流：保存（新增或更新）
  const handleSaveWorkflow = async () => {
    try {
      setWfSaving(true);
      if (wfForm.id) {
        const updated = await workflowsApi.update(wfForm.id, wfForm);
        setWorkflows(prev => prev.map(w => (w.id === updated.id ? updated : w)));
        setSnackbarMessage('流程已更新');
      } else {
        const created = await workflowsApi.create(wfForm);
        setWorkflows(prev => [...prev, created]);
        setSnackbarMessage('流程已创建');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setWfDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '请重试';
      setSnackbarMessage(`保存流程失败：${msg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setWfSaving(false);
    }
  };

  // 工作流：删除
  const handleDeleteWorkflow = (w: BackendWorkflow) => {
    setConfirmState({
      open: true,
      title: '删除流程',
      content: (
        <Typography variant="body2">确认删除流程「{w.workflowName}」？该操作不可恢复。</Typography>
      ),
      onConfirm: async () => {
        try {
          await workflowsApi.remove(w.id);
          setWorkflows(prev => prev.filter(x => x.id !== w.id));
          setWfSteps(prev => {
            const next = { ...prev };
            delete next[w.id];
            return next;
          });
          setSnackbarMessage('流程已删除');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : '请重试';
          setSnackbarMessage(`删除流程失败：${msg}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    });
  };

  // 工作流：切换启用
  const handleToggleWorkflowEnabled = async (w: BackendWorkflow) => {
    const target = !w.enabled;
    try {
      const updated = await workflowsApi.update(w.id, { ...w, enabled: target });
      setWorkflows(prev => prev.map(x => (x.id === w.id ? updated : x)));
      setSnackbarMessage(target ? '已启用流程' : '已禁用流程');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '请重试';
      setSnackbarMessage(`切换失败：${msg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // 步骤：新增
  const handleAddStep = (workflowId: number) => {
    const current = wfSteps[workflowId] || [];
    const nextOrder = current.length > 0 ? Math.max(...current.map(s => s.stepOrder)) + 1 : 1;
    setActiveWorkflowId(workflowId);
  setStepForm({ id: undefined, workflowId, stepOrder: nextOrder, stepName: '', roleCode: '', autoApprove: false, enabled: true });
    setStepDialogOpen(true);
  };

  // 步骤：编辑
  const handleEditStep = (workflowId: number, step: BackendWorkflowStep) => {
    setActiveWorkflowId(workflowId);
    setStepForm({ ...step });
    setStepDialogOpen(true);
  };

  // 步骤：保存
  const handleSaveStep = async () => {
    if (!activeWorkflowId) return;
    try {
      setStepSaving(true);
      if (stepForm.id) {
        const updated = await workflowsApi.updateStep(stepForm.id, stepForm);
        setWfSteps(prev => ({
          ...prev,
          [activeWorkflowId]: (prev[activeWorkflowId] || []).map(s => (s.id === updated.id ? updated : s)).sort((a, b) => a.stepOrder - b.stepOrder)
        }));
        setSnackbarMessage('步骤已更新');
      } else {
        const created = await workflowsApi.addStep(activeWorkflowId, stepForm);
        setWfSteps(prev => ({
          ...prev,
          [activeWorkflowId]: ([...(prev[activeWorkflowId] || []), created]).sort((a, b) => a.stepOrder - b.stepOrder)
        }));
        setSnackbarMessage('步骤已创建');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setStepDialogOpen(false);
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : '请重试';
      if (/stepOrder/i.test(msg) && /存在|exist/i.test(msg)) {
        msg = '步骤序号已存在，请换一个未使用的序号';
      }
      if (/roleCode/i.test(msg) && /无效|invalid/i.test(msg)) {
        msg = '角色编码无效，请在下拉中选择有效角色';
      }
      setSnackbarMessage(`保存步骤失败：${msg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setStepSaving(false);
    }
  };

  // 步骤：删除
  const handleDeleteStep = (workflowId: number, step: BackendWorkflowStep) => {
    setConfirmState({
      open: true,
      title: '删除步骤',
      content: (<Typography variant="body2">确认删除「步骤{step.stepOrder}：{step.stepName}」？</Typography>),
      onConfirm: async () => {
        try {
          await workflowsApi.removeStep(step.id);
          setWfSteps(prev => ({
            ...prev,
            [workflowId]: (prev[workflowId] || []).filter(s => s.id !== step.id)
          }));
          setSnackbarMessage('步骤已删除');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : '请重试';
          setSnackbarMessage(`删除步骤失败：${msg}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    });
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setEditDialog(true);
  };

  const handleAddLeaveType = () => {
    setSelectedLeaveType({
      id: 0,
      typeName: "",
      typeCode: "",
      description: "",
      annualAllowance: 15,
      maxDaysPerRequest: 30,
      requiresApproval: true,
      requiresMedicalProof: false,
      advanceDaysRequired: 0,
      color: "#1976d2",
      enabled: true,
      createdAt: "",
      updatedAt: "",
    });
    setEditDialog(true);
  };

  const handleSaveLeaveType = async () => {
    if (!selectedLeaveType) return;

    // 如果是更新操作，提醒用户配置变更会影响相关数据（使用页面内确认弹窗）
    if (selectedLeaveType.id && selectedLeaveType.id > 0) {
      const originalType = leaveTypes.find(t => t.id === selectedLeaveType.id);
      if (originalType && originalType.annualAllowance !== selectedLeaveType.annualAllowance) {
        setConfirmState({
          open: true,
          title: '确认更新年度额度',
          content: (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                年度额度将从 {originalType.annualAllowance} 天调整为 {selectedLeaveType.annualAllowance} 天。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                该操作会自动调整当前年度所有学生的对应余额，是否继续？
              </Typography>
            </Box>
          ),
      onConfirm: () => actuallySaveLeaveType({ changedAllowance: true }),
        });
        return;
      }
    }

    await actuallySaveLeaveType();
  };

  // 真正执行保存（新增/更新）
  const actuallySaveLeaveType = async (opts?: { changedAllowance?: boolean }) => {
    if (!selectedLeaveType) return;
    try {
      setSaving(true);
      
      if (selectedLeaveType.id && selectedLeaveType.id > 0) {
        // 更新现有类型
        const updated = await leaveTypeApi.updateLeaveType(selectedLeaveType.id, selectedLeaveType);
        setLeaveTypes(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        // 若额度变更，调用后端同步余额（仅当前学年）
        if (opts?.changedAllowance) {
          try {
            const res = await leaveTypeApi.syncBalances(updated.id, true);
            setSnackbarMessage(`请假类型更新成功，已同步当前学年余额：${res.updated} 条`);
          } catch (syncErr) {
            console.error('余额同步失败：', syncErr);
            setSnackbarMessage('请假类型更新成功，但余额同步失败，请稍后在后台重试同步');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        } else {
          setSnackbarMessage('请假类型更新成功');
        }
      } else {
        // 添加新类型
        const newLeaveType = {
          typeName: selectedLeaveType.typeName,
          typeCode: selectedLeaveType.typeCode,
          description: selectedLeaveType.description,
          annualAllowance: selectedLeaveType.annualAllowance,
          maxDaysPerRequest: selectedLeaveType.maxDaysPerRequest,
          requiresApproval: selectedLeaveType.requiresApproval,
          requiresMedicalProof: selectedLeaveType.requiresMedicalProof,
          advanceDaysRequired: selectedLeaveType.advanceDaysRequired,
          color: selectedLeaveType.color,
          enabled: selectedLeaveType.enabled,
        };
        const created = await leaveTypeApi.createLeaveType(newLeaveType);
        setLeaveTypes(prev => [...prev, created]);
        setSnackbarMessage('请假类型创建成功');
      }
      
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      setEditDialog(false);
      setSelectedLeaveType(null);
    } catch (error: unknown) {
      console.error('Failed to save leave type:', error);
      const msg = error instanceof Error ? error.message : '请重试';
      setSnackbarMessage(`保存失败：${msg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeaveType = async (typeId: number) => {
    setConfirmState({
      open: true,
      title: '确认删除',
      content: (
        <Typography variant="body2">
          删除后将无法恢复。该操作会影响历史记录中该类型的可见性（建议仅停用）。是否继续删除？
        </Typography>
      ),
      onConfirm: async () => {
        try {
          setPendingMap(prev => ({ ...prev, [typeId]: true }));
          await leaveTypeApi.deleteLeaveType(typeId);
          setLeaveTypes(prev => prev.filter(t => t.id !== typeId));
          setSnackbarMessage('请假类型删除成功');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (error: unknown) {
          console.error('Failed to delete leave type:', error);
          const msg = error instanceof Error ? error.message : '请重试';
          setSnackbarMessage(`删除失败：${msg}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        } finally {
          setPendingMap(prev => ({ ...prev, [typeId]: false }));
        }
      },
    });
  };

  // 启用/停用请假类型
  const handleToggleEnabled = async (type: LeaveType) => {
    const targetEnabled = !type.enabled;
    const action = targetEnabled ? '启用' : '停用';

    setConfirmState({
      open: true,
      title: `${action}请假类型`,
      content: (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            确定要{action}「{type.typeName}」吗？
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {targetEnabled
              ? '启用后，学生将可以选择此请假类型进行申请。'
              : '停用后，学生将无法选择此请假类型进行新的申请，但不影响已有申请。'}
          </Typography>
        </Box>
      ),
      onConfirm: async () => {
        try {
          setPendingMap(prev => ({ ...prev, [type.id]: true }));
          // 乐观更新
          setLeaveTypes(prev => prev.map(t => (t.id === type.id ? { ...t, enabled: targetEnabled } : t)));
          // 调后端
          if (targetEnabled) await leaveTypeApi.activateLeaveType(type.id);
          else await leaveTypeApi.deactivateLeaveType(type.id);
          setSnackbarMessage(targetEnabled ? '已启用该请假类型' : '已停用该请假类型');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (error: unknown) {
          console.error('Failed to toggle leave type status:', error);
          // 回滚
          setLeaveTypes(prev => prev.map(t => (t.id === type.id ? { ...t, enabled: type.enabled } : t)));
          const msg = error instanceof Error ? error.message : '请重试';
          setSnackbarMessage(`操作失败：${msg}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        } finally {
          setPendingMap(prev => ({ ...prev, [type.id]: false }));
        }
      },
    });
  };

  const renderLeaveTypesTab = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            请假类型管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLeaveType}
            sx={{ borderRadius: 2, boxShadow: 'none' }}
            disabled={loading}
          >
            添加类型
          </Button>
        </Box>

        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>类型名称</TableCell>
                    <TableCell>年度额度</TableCell>
                    <TableCell>最大天数</TableCell>
                    <TableCell>需要审批</TableCell>
                    <TableCell>审批流程</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: type.color,
                            }}
                          />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {type.typeName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{type.annualAllowance} 天</TableCell>
                      <TableCell>{type.maxDaysPerRequest} 天</TableCell>
                      <TableCell>
                        <Chip
                          label={type.requiresApproval ? "是" : "否"}
                          size="small"
                          color={type.requiresApproval ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <InputLabel id={`wf-label-${type.id}`}>流程</InputLabel>
                          <Select
                            labelId={`wf-label-${type.id}`}
                            label="流程"
                            value={typeBindings[type.id] ?? ''}
                            onChange={async (e) => {
                              const val = e.target.value as number | '';
                              const targetId = val === '' ? null : (val as number);
                              try {
                                setPendingMap(prev => ({ ...prev, [type.id]: true }));
                                if (targetId === null) {
                                  await workflowsApi.unbindType(type.id);
                                  setTypeBindings(prev => ({ ...prev, [type.id]: null }));
                                  setSnackbarMessage('已解绑审批流程');
                                } else {
                                  const res = await workflowsApi.bindType(type.id, targetId);
                                  setTypeBindings(prev => ({ ...prev, [type.id]: res.workflowId }));
                                  setSnackbarMessage('已绑定审批流程');
                                }
                                setSnackbarSeverity('success');
                                setSnackbarOpen(true);
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : '请重试';
                                setSnackbarMessage(`设置流程失败：${msg}`);
                                setSnackbarSeverity('error');
                                setSnackbarOpen(true);
                              } finally {
                                setPendingMap(prev => ({ ...prev, [type.id]: false }));
                              }
                            }}
                            disabled={!!pendingMap[type.id] || loading}
                          >
                            <MenuItem value="">
                              <em>未绑定</em>
                            </MenuItem>
                            {workflows.map(w => (
                              <MenuItem key={w.id} value={w.id} disabled={!w.enabled}>
                                {w.workflowName}{!w.enabled ? '（禁用）' : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={type.enabled ? "启用" : "禁用"}
                            size="small"
                            color={type.enabled ? "success" : "default"}
                          />
                          <Switch
                            size="small"
                            checked={type.enabled}
                            onChange={() => handleToggleEnabled(type)}
                            disabled={loading}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditLeaveType(type)}
                            disabled={!!pendingMap[type.id]}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLeaveType(type.id)}
                            color="error"
                            disabled={!!pendingMap[type.id]}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderApprovalWorkflowTab = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            审批流程配置
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, boxShadow: 'none' }}
            onClick={handleAddWorkflow}
          >
            添加流程
          </Button>
        </Box>
        {wfError && (
          <Alert severity="error" sx={{ mb: 2 }}>{wfError}</Alert>
        )}
        <Alert severity="info" sx={{ mb: 1.5 }}>
          审批流程定义了不同类型请假申请的审批路径和规则，系统已支持多级审批。
        </Alert>
        {wfLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>流程加载中…</Alert>
        )}

        <Box sx={{ display: 'grid', gap: 2 }}>
          {workflows.map((workflow) => (
            <Card key={workflow.id} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {workflow.workflowName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6c757d' }}>
                      {workflow.description || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6c757d', display:'block' }}>
                      编码：{workflow.workflowCode}
                    </Typography>
                    {(() => {
                      const steps = wfSteps[workflow.id] || [];
                      if (!steps.length) return null;
                      const autoCount = steps.filter(s => s.autoApprove).length;
                      return (
                        <Typography variant="caption" sx={{ color: '#6c757d' }}>
                          步骤数：{steps.length}（自动通过：{autoCount}）
                        </Typography>
                      );
                    })()}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={workflow.enabled ? '启用' : '禁用'}
                      size="small"
                      color={workflow.enabled ? 'success' : 'default'}
                    />
                    <Switch size="small" checked={workflow.enabled} onChange={() => handleToggleWorkflowEnabled(workflow)} />
                    <IconButton size="small" onClick={() => handleEditWorkflow(workflow)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteWorkflow(workflow)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    审批步骤：
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddStep(workflow.id)}>添加步骤</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(wfSteps[workflow.id] || []).length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#6c757d' }}>暂无步骤</Typography>
                  ) : (
                    (wfSteps[workflow.id] || []).map((s, index) => (
                      <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`步骤${s.stepOrder}: ${s.stepName}（${s.roleDisplayName || s.roleCode}${s.autoApprove ? '·自动通过' : ''}）`}
                          size="small"
                          variant="outlined"
                          clickable
                          onClick={() => handleEditStep(workflow.id, s)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleEditStep(workflow.id, s); }}
                        />
                        <IconButton size="small" color="error" onClick={() => handleDeleteStep(workflow.id, s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {index < (wfSteps[workflow.id] || []).length - 1 && (
                          <Typography sx={{ color: '#6c757d' }}>→</Typography>
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  const renderNotificationTab = () => {
    return (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          通知设置
        </Typography>

        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              通知渠道
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      emailNotifications: e.target.checked
                    })}
                  />
                }
                label="邮件通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.systemNotifications}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      systemNotifications: e.target.checked
                    })}
                  />
                }
                label="系统内通知"
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              通知事件
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.notifyOnRequest}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      notifyOnRequest: e.target.checked
                    })}
                  />
                }
                label="收到请假申请时通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.notifyOnApproval}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      notifyOnApproval: e.target.checked
                    })}
                  />
                }
                label="请假申请通过时通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.notifyOnRejection}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      notifyOnRejection: e.target.checked
                    })}
                  />
                }
                label="请假申请被拒绝时通知"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
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
            系统配置
          </Typography>
          <Typography variant="body2" sx={{ color: '#6c757d' }}>
            管理请假系统的配置参数、审批流程和通知设置
          </Typography>
        </Box>

        {/* 选项卡 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label="请假类型"
              icon={<ScheduleIcon />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label="审批流程"
              icon={<GroupIcon />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label="通知设置"
              icon={<NotificationsIcon />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderLeaveTypesTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderApprovalWorkflowTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {renderNotificationTab()}
        </TabPanel>

        {/* 编辑请假类型对话框 */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedLeaveType?.id ? "编辑请假类型" : "添加请假类型"}
          </DialogTitle>
          <DialogContent>
            {selectedLeaveType && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="类型名称"
                  value={selectedLeaveType.typeName}
                  onChange={(e) => setSelectedLeaveType({
                    ...selectedLeaveType,
                    typeName: e.target.value
                  })}
                  fullWidth
                />
                <TextField
                  label="类型代码"
                  value={selectedLeaveType.typeCode}
                  onChange={(e) => setSelectedLeaveType({
                    ...selectedLeaveType,
                    typeCode: e.target.value
                  })}
                  fullWidth
                  helperText="用于系统内部识别，建议使用英文字母"
                />
                <TextField
                  label="描述"
                  value={selectedLeaveType.description}
                  onChange={(e) => setSelectedLeaveType({
                    ...selectedLeaveType,
                    description: e.target.value
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="年度额度（天）"
                    type="number"
                    value={selectedLeaveType.annualAllowance}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      annualAllowance: parseInt(e.target.value)
                    })}
                    error={selectedLeaveType.annualAllowance < 0}
                    helperText={selectedLeaveType.annualAllowance < 0 ? "额度不能为负数" : ""}
                  />
                  <TextField
                    label="单次最大天数（天）"
                    type="number"
                    value={selectedLeaveType.maxDaysPerRequest}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      maxDaysPerRequest: parseInt(e.target.value)
                    })}
                    error={selectedLeaveType.maxDaysPerRequest <= 0}
                    helperText={selectedLeaveType.maxDaysPerRequest <= 0 ? "单次最大天数必须大于0" : ""}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="提前申请天数"
                    type="number"
                    value={selectedLeaveType.advanceDaysRequired}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      advanceDaysRequired: parseInt(e.target.value)
                    })}
                    error={selectedLeaveType.advanceDaysRequired < 0}
                    helperText={selectedLeaveType.advanceDaysRequired < 0 ? "提前申请天数不能为负数" : "0表示无需提前申请"}
                  />
                  <TextField
                    label="颜色"
                    type="color"
                    value={selectedLeaveType.color}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      color: e.target.value
                    })}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedLeaveType.requiresApproval}
                        onChange={(e) => setSelectedLeaveType({
                          ...selectedLeaveType,
                          requiresApproval: e.target.checked
                        })}
                      />
                    }
                    label="需要审批"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedLeaveType.requiresMedicalProof}
                        onChange={(e) => setSelectedLeaveType({
                          ...selectedLeaveType,
                          requiresMedicalProof: e.target.checked
                        })}
                      />
                    }
                    label="需要医疗证明"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedLeaveType.enabled}
                        onChange={(e) => setSelectedLeaveType({
                          ...selectedLeaveType,
                          enabled: e.target.checked
                        })}
                      />
                    }
                    label="启用此类型"
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)} disabled={loading}>取消</Button>
            <Button
              onClick={handleSaveLeaveType}
              variant="contained"
              sx={{ boxShadow: 'none' }}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 编辑/新增 流程 对话框 */}
        <Dialog open={wfDialogOpen} onClose={() => setWfDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{wfForm.id ? '编辑流程' : '新增流程'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="流程名称"
                value={wfForm.workflowName || ''}
                onChange={(e) => setWfForm(f => ({ ...f, workflowName: e.target.value }))}
                fullWidth
              />
              <TextField
                label="流程编码"
                value={wfForm.workflowCode || ''}
                onChange={(e) => setWfForm(f => ({ ...f, workflowCode: e.target.value }))}
                fullWidth
                helperText="用于系统识别，需唯一"
                disabled={!!wfForm.id}
              />
              <TextField
                label="描述"
                value={wfForm.description || ''}
                onChange={(e) => setWfForm(f => ({ ...f, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
              <FormControlLabel
                control={<Switch checked={!!wfForm.enabled} onChange={(e) => setWfForm(f => ({ ...f, enabled: e.target.checked }))} />}
                label="启用此流程"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWfDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveWorkflow} variant="contained" disabled={wfSaving} sx={{ boxShadow: 'none' }}>
              {wfSaving ? '保存中…' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 编辑/新增 步骤 对话框 */}
        <Dialog open={stepDialogOpen} onClose={() => setStepDialogOpen(false)} maxWidth="sm" fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // 避免空值提交
              if (!stepSaving && stepForm.stepName && stepForm.roleCode) {
                e.preventDefault();
                handleSaveStep();
              }
            }
          }}
        >
          <DialogTitle>{stepForm.id ? '编辑步骤' : '新增步骤'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="步骤序号"
                type="number"
                value={stepForm.stepOrder ?? 1}
                onChange={(e) => setStepForm(f => ({ ...f, stepOrder: parseInt(e.target.value || '1', 10) }))}
              />
              <TextField
                label="步骤名称"
                value={stepForm.stepName || ''}
                onChange={(e) => setStepForm(f => ({ ...f, stepName: e.target.value }))}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="role-code-select-label">审批角色</InputLabel>
                <Select
                  labelId="role-code-select-label"
                  label="审批角色"
                  value={stepForm.roleCode || ''}
                  onChange={(e) => setStepForm(f => ({ ...f, roleCode: e.target.value as string }))}
                >
                  <MenuItem value=""><em>未选择</em></MenuItem>
                  {rolesLoading && <MenuItem disabled value="__loading">加载中…</MenuItem>}
                  {/* 平铺显示：显示名称（CODE） */}
                  {assignableRoles.map(r => (
                    <MenuItem key={r.code} value={r.code}>{r.displayName}（{r.code}）</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {rolesError && (
                <Alert severity="error">加载角色失败：{rolesError}</Alert>
              )}
              <FormControlLabel
                control={<Switch checked={!!stepForm.autoApprove} onChange={(e) => setStepForm(f => ({ ...f, autoApprove: e.target.checked }))} />}
                label="自动通过"
              />
              <FormControlLabel
                control={<Switch checked={!!stepForm.enabled} onChange={(e) => setStepForm(f => ({ ...f, enabled: e.target.checked }))} />}
                label="启用此步骤"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStepDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveStep} variant="contained" disabled={stepSaving} sx={{ boxShadow: 'none' }}>
              {stepSaving ? '保存中…' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* 通用确认弹窗 */}
        <Dialog open={confirmState.open} onClose={() => setConfirmState(s => ({ ...s, open: false }))}>
          <DialogTitle>{confirmState.title}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>{confirmState.content}</Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmState(s => ({ ...s, open: false }))}>取消</Button>
            <Button
              variant="contained"
              onClick={async () => {
                const cb = confirmState.onConfirm;
                setConfirmState(s => ({ ...s, open: false }));
                if (cb) await cb();
              }}
              sx={{ boxShadow: 'none' }}
            >
              确认
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
