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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

interface AlertRule {
  id: number;
  category: string;
  threshold: number;
  isEnabled: boolean;
  description: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  systemNotificationEnabled: boolean;
  notifyStudent: boolean;
  notifyTeacher: boolean;
}

interface AlertHistory {
  id: number;
  studentName: string;
  studentId: string;
  class: string;
  category: string;
  currentScore: number;
  threshold: number;
  alertTime: string;
  status: 'sent' | 'pending' | 'failed';
}

// 模拟数据
const initialAlertRules: AlertRule[] = [
  {
    id: 1,
    category: "德",
    threshold: 60,
    isEnabled: true,
    description: "德育学分低于60分时触发预警",
  },
  {
    id: 2,
    category: "智",
    threshold: 65,
    isEnabled: true,
    description: "智育学分低于65分时触发预警",
  },
  {
    id: 3,
    category: "体",
    threshold: 55,
    isEnabled: true,
    description: "体育学分低于55分时触发预警",
  },
  {
    id: 4,
    category: "美",
    threshold: 50,
    isEnabled: false,
    description: "美育学分低于50分时触发预警",
  },
  {
    id: 5,
    category: "劳",
    threshold: 50,
    isEnabled: true,
    description: "劳育学分低于50分时触发预警",
  },
  {
    id: 6,
    category: "总分",
    threshold: 300,
    isEnabled: true,
    description: "总学分低于300分时触发预警",
  },
];

const initialNotificationSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  systemNotificationEnabled: true,
  notifyStudent: true,
  notifyTeacher: true,
};

const mockAlertHistory: AlertHistory[] = [
  {
    id: 1,
    studentName: "王五",
    studentId: "2024003",
    class: "计算机2024-2班",
    category: "德",
    currentScore: 60,
    threshold: 60,
    alertTime: "2024-08-22 14:30:00",
    status: 'sent',
  },
  {
    id: 2,
    studentName: "赵六",
    studentId: "2024004",
    class: "计算机2024-2班",
    category: "总分",
    currentScore: 250,
    threshold: 300,
    alertTime: "2024-08-22 15:15:00",
    status: 'sent',
  },
];

const categoryColors: { [key: string]: string } = {
  德: "#1565c0",
  智: "#6a1b9a",
  体: "#2e7d32",
  美: "#ef6c00",
  劳: "#ad1457",
  总分: "#495057",
};

export default function AlertsConfigPage() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>(initialAlertRules);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotificationSettings);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const handleRuleChange = (id: number, field: string, value: number | boolean) => {
    setAlertRules(rules =>
      rules.map(rule =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleNotificationSettingChange = (field: string, value: boolean) => {
    setNotificationSettings(settings => ({
      ...settings,
      [field]: value,
    }));
  };

  const handleSaveSettings = () => {
    // 这里应该调用API保存设置
    alert("设置已保存!");
  };

  const handleTestAlert = async () => {
    setTestResult("正在发送测试预警...");
    
    // 模拟API调用
    setTimeout(() => {
      setTestResult("测试预警发送成功! 请检查您的邮箱和系统通知。");
    }, 2000);
  };

  const getStatusChip = (status: string) => {
    const config = {
      sent: { label: '已发送', color: '#4caf50' },
      pending: { label: '待发送', color: '#ff9800' },
      failed: { label: '发送失败', color: '#f44336' },
    };
    const statusConfig = config[status as keyof typeof config];
    return (
      <Chip
        label={statusConfig.label}
        size="small"
        sx={{
          backgroundColor: statusConfig.color,
          color: 'white',
          fontWeight: 600,
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
        {/* 页面标题和操作栏 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            component={Link}
            href="/admin/credits"
            sx={{ 
              mr: 2,
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: '#e9ecef'
              }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#212529', mb: 1 }}>
              预警机制配置
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              设置学分预警阈值，配置自动通知机制，及时发现和处理学分异常情况
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
              px: 3,
              py: 1.5,
              boxShadow: 'none',
              backgroundColor: '#28a745',
              '&:hover': {
                backgroundColor: '#218838',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            保存配置
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* 左侧：预警规则 */}
          <Box sx={{ flex: '1 1 400px' }}>
            {/* 预警规则设置 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  预警规则设置
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  配置各类学分的预警阈值，当学生学分低于设定值时自动触发预警
                </Typography>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 600 }}>类别</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>预警阈值</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alertRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Chip
                              label={rule.category}
                              size="small"
                              sx={{
                                backgroundColor: categoryColors[rule.category],
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={rule.threshold}
                              onChange={(e) => handleRuleChange(rule.id, 'threshold', Number(e.target.value))}
                              size="small"
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, max: 100 }}
                              disabled={!rule.isEnabled}
                            />
                            分
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.isEnabled}
                              onChange={(e) => handleRuleChange(rule.id, 'isEnabled', e.target.checked)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* 通知设置 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  通知设置
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  配置预警通知的发送方式和接收对象
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    通知方式
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => handleNotificationSettingChange('emailEnabled', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon />
                        <span>邮件通知</span>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.systemNotificationEnabled}
                        onChange={(e) => handleNotificationSettingChange('systemNotificationEnabled', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsIcon />
                        <span>系统通知</span>
                      </Box>
                    }
                  />

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    通知对象
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.notifyStudent}
                        onChange={(e) => handleNotificationSettingChange('notifyStudent', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        <span>通知学生本人</span>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.notifyTeacher}
                        onChange={(e) => handleNotificationSettingChange('notifyTeacher', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon />
                        <span>通知班主任</span>
                      </Box>
                    }
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setTestDialogOpen(true)}
                    startIcon={<NotificationsIcon />}
                  >
                    发送测试预警
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 右侧：预警历史 */}
          <Box sx={{ flex: '1 1 400px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  最近预警记录
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  查看最近触发的预警通知记录
                </Typography>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 600 }}>学生</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>类别</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>分数</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockAlertHistory.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {alert.studentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {alert.class}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.category}
                              size="small"
                              sx={{
                                backgroundColor: categoryColors[alert.category],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error">
                              {alert.currentScore}/{alert.threshold}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(alert.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {mockAlertHistory.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    暂无预警记录
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* 测试预警对话框 */}
        <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>发送测试预警</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              将发送一条测试预警通知，用于验证通知设置是否正常工作。
            </Typography>
            {testResult && (
              <Alert severity={testResult.includes('成功') ? 'success' : 'info'} sx={{ mb: 2 }}>
                {testResult}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              测试通知将发送到当前管理员账号。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestDialogOpen(false)}>
              关闭
            </Button>
            <Button 
              onClick={handleTestAlert} 
              variant="contained"
              startIcon={<NotificationsIcon />}
            >
              发送测试
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
