"use client";

import { useState } from "react";
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

interface LeaveType {
  id: string;
  name: string;
  maxDays: number;
  requiresApproval: boolean;
  allowancePerYear: number;
  carryOverAllowed: boolean;
  color: string;
  description: string;
  enabled: boolean;
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

// 模拟数据
const mockLeaveTypes: LeaveType[] = [
  {
    id: "annual",
    name: "年假",
    maxDays: 30,
    requiresApproval: true,
    allowancePerYear: 15,
    carryOverAllowed: true,
    color: "#1976d2",
    description: "员工每年享有的带薪年假",
    enabled: true,
  },
  {
    id: "sick",
    name: "病假",
    maxDays: 90,
    requiresApproval: false,
    allowancePerYear: 10,
    carryOverAllowed: false,
    color: "#388e3c",
    description: "因疾病需要休息的假期",
    enabled: true,
  },
  {
    id: "personal",
    name: "事假",
    maxDays: 10,
    requiresApproval: true,
    allowancePerYear: 5,
    carryOverAllowed: false,
    color: "#f57c00",
    description: "因个人事务需要请假",
    enabled: true,
  },
];

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
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(mockLeaveTypes);
  const [workflows] = useState<ApprovalWorkflow[]>(mockWorkflows);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    systemNotifications: true,
    notifyOnRequest: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    reminderBeforeLeave: 3,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setEditDialog(true);
  };

  const handleAddLeaveType = () => {
    setSelectedLeaveType({
      id: "",
      name: "",
      maxDays: 30,
      requiresApproval: true,
      allowancePerYear: 15,
      carryOverAllowed: true,
      color: "#1976d2",
      description: "",
      enabled: true,
    });
    setEditDialog(true);
  };

  const handleSaveLeaveType = () => {
    if (selectedLeaveType) {
      if (selectedLeaveType.id) {
        // 更新现有类型
        setLeaveTypes(leaveTypes.map(type => 
          type.id === selectedLeaveType.id ? selectedLeaveType : type
        ));
      } else {
        // 添加新类型
        const newId = `leave_${Date.now()}`;
        setLeaveTypes([...leaveTypes, { ...selectedLeaveType, id: newId }]);
      }
    }
    setEditDialog(false);
    setSelectedLeaveType(null);
  };

  const handleDeleteLeaveType = (typeId: string) => {
    setLeaveTypes(leaveTypes.filter(type => type.id !== typeId));
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
                    <TableCell>可结转</TableCell>
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
                              {type.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{type.allowancePerYear} 天</TableCell>
                      <TableCell>{type.maxDays} 天</TableCell>
                      <TableCell>
                        <Chip
                          label={type.requiresApproval ? "是" : "否"}
                          size="small"
                          color={type.requiresApproval ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={type.carryOverAllowed ? "是" : "否"}
                          size="small"
                          color={type.carryOverAllowed ? "info" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={type.enabled ? "启用" : "禁用"}
                          size="small"
                          color={type.enabled ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditLeaveType(type)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLeaveType(type.id)}
                            color="error"
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
                        const leaveType = leaveTypes.find(t => t.id === typeId);
                        return leaveType ? (
                          <Chip
                            key={typeId}
                            label={leaveType.name}
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
                  value={selectedLeaveType.name}
                  onChange={(e) => setSelectedLeaveType({
                    ...selectedLeaveType,
                    name: e.target.value
                  })}
                  fullWidth
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
                    value={selectedLeaveType.allowancePerYear}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      allowancePerYear: parseInt(e.target.value)
                    })}
                  />
                  <TextField
                    label="最大天数（天）"
                    type="number"
                    value={selectedLeaveType.maxDays}
                    onChange={(e) => setSelectedLeaveType({
                      ...selectedLeaveType,
                      maxDays: parseInt(e.target.value)
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
                        checked={selectedLeaveType.carryOverAllowed}
                        onChange={(e) => setSelectedLeaveType({
                          ...selectedLeaveType,
                          carryOverAllowed: e.target.checked
                        })}
                      />
                    }
                    label="允许结转到下一年"
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
            <Button onClick={() => setEditDialog(false)}>取消</Button>
            <Button
              onClick={handleSaveLeaveType}
              variant="contained"
              sx={{ boxShadow: 'none' }}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
