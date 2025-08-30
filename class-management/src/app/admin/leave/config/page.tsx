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
  Slider,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// API 基础 URL（走 Next.js 代理，避免 CORS 与环境差异）
const API_BASE_URL = "/api";

// API 调用函数
const leaveTypeApi = {
  // 获取所有请假类型（包括已停用的）
  getAllLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/all`);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`加载失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // 获取激活的请假类型
  getActiveLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await fetch(`${API_BASE_URL}/leave/config/active`);
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      { method: 'POST' }
    );
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`同步失败 ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
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

interface ApprovalWorkflow {
  id: string;
  name: string;
  leaveTypes: string[];
  steps: ApprovalStep[];
  autoApprovalRules?: AutoApprovalRule[];
  enabled: boolean;
}

interface ApprovalStep {
  id: string;
  order: number;
  approverType: 'class_manager' | 'result' | 'specific_role' | 'specific_person';
  approverValue?: string;
  required: boolean;
}

interface AutoApprovalRule {
  id: string;
  name: string;
  conditions: {
    maxDays?: number;
    leaveTypes?: string[];
    departments?: string[];
  };
  enabled: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemNotifications: boolean;
  notifyOnRequest: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  reminderBeforeLeave: number; // days
}

const mockWorkflows: ApprovalWorkflow[] = [
  {
    id: "default",
    name: "默认审批流程",
    leaveTypes: ["annual", "personal"],
    steps: [
      {
        id: "step1",
        order: 1,
        approverType: "class_manager",
        required: true,
      },
      {
        id: "step2",
        order: 2,
        approverType: "result",
        required: true,
      },
    ],
    enabled: true,
  },
];

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
  const [workflows] = useState<ApprovalWorkflow[]>(mockWorkflows);
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
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          >
            添加流程
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 1.5 }}>
          审批流程定义了不同类型请假申请的审批路径和规则。您可以为不同的请假类型设置不同的审批流程。
        </Alert>
        <Alert severity="info" sx={{ mb: 3 }}>
          目前暂不支持多级审批，后续将会支持。
        </Alert>

        <Box sx={{ display: 'grid', gap: 2 }}>
          {workflows.map((workflow) => (
            <Card key={workflow.id} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {workflow.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {workflow.leaveTypes.map((typeId) => {
                        const leaveType = leaveTypes.find(t => t.typeCode === typeId);
                        return leaveType ? (
                          <Chip
                            key={typeId}
                            label={leaveType.typeName}
                            size="small"
                            sx={{
                              backgroundColor: leaveType.color,
                              color: 'white',
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={workflow.enabled ? "启用" : "禁用"}
                      size="small"
                      color={workflow.enabled ? "success" : "default"}
                    />
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#6c757d', mb: 2 }}>
                  审批步骤:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {workflow.steps.map((step, index) => (
                    <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`步骤${step.order}: ${
                          step.approverType === 'class_manager' ? '班级教师' :
                          step.approverType === 'result' ? '审批成功' :
                          step.approverType === 'specific_role' ? '特定角色' : '特定人员'
                        }`}
                        size="small"
                        variant="outlined"
                      />
                      {index < workflow.steps.length - 1 && (
                        <Typography sx={{ color: '#6c757d' }}>→</Typography>
                      )}
                    </Box>
                  ))}
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
                    checked={notifications.smsNotifications}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      smsNotifications: e.target.checked
                    })}
                  />
                }
                label="短信通知"
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

        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              提醒设置
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                请假前提醒时间: {notifications.reminderBeforeLeave} 天
              </Typography>
              <Slider
                value={notifications.reminderBeforeLeave}
                onChange={(e, value) => setNotifications({
                  ...notifications,
                  reminderBeforeLeave: value as number
                })}
                min={0}
                max={7}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ borderRadius: 2, boxShadow: 'none' }}
          >
            保存设置
          </Button>
        </Box>
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
