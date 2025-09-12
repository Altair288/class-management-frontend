"use client";

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ================= Types =================
interface Role {
  id: number;
  code: string;
  displayName: string;
  category: 'SYSTEM' | 'APPROVAL' | 'CUSTOM';
  level?: number;
  sortOrder?: number;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ================= API Configuration =================
// 使用相对路径访问后端 API（与其他页面一致）。若需要跨域，再配置 NEXT_PUBLIC_API_BASE_URL。
const API_BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL;

// ================= API Functions =================
const roleAPI = {
  // 获取所有角色
  async getAllRoles(): Promise<Role[]> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles` : '/api/roles', { credentials: 'include' });
    if (!response.ok) {
      console.error('角色列表请求失败', response.status, response.statusText);
    }
    if (!response.ok) throw new Error(`获取角色列表失败: ${response.statusText}`);
    return response.json();
  },

  // 获取系统角色
  async getSystemRoles(): Promise<Role[]> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/system` : '/api/roles/system', { credentials: 'include' });
    if (!response.ok) throw new Error(`获取系统角色失败: ${response.statusText}`);
    return response.json();
  },

  // 获取审批角色
  async getApprovalRoles(): Promise<Role[]> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/approval` : '/api/roles/approval', { credentials: 'include' });
    if (!response.ok) throw new Error(`获取审批角色失败: ${response.statusText}`);
    return response.json();
  },

  // 创建角色
  async createRole(roleData: {
    code: string;
    displayName: string;
    category: 'SYSTEM' | 'APPROVAL' | 'CUSTOM';
    level?: number;
    sortOrder?: number;
    description?: string;
    enabled?: boolean;
  }): Promise<Role> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles` : '/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(roleData),
    });
    if (!response.ok) throw new Error(`创建角色失败: ${response.statusText}`);
    return response.json();
  },

  // 更新角色
  async updateRole(id: number, roleData: {
    displayName?: string;
    description?: string;
    enabled?: boolean;
    level?: number;
    sortOrder?: number;
  }): Promise<Role> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/${id}` : `/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(roleData),
    });
    if (!response.ok) throw new Error(`更新角色失败: ${response.statusText}`);
    return response.json();
  },

  // 调整角色层级
  async updateHierarchy(id: number, level?: number, sortOrder?: number): Promise<Role> {
    const params = new URLSearchParams();
    if (level !== undefined) params.append('level', level.toString());
    if (sortOrder !== undefined) params.append('sortOrder', sortOrder.toString());
    
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/${id}/hierarchy?${params}` : `/api/roles/${id}/hierarchy?${params}`, {
      method: 'PATCH',
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`更新角色层级失败: ${response.statusText}`);
    return response.json();
  },

  // 启用/禁用角色
  async toggleRole(id: number, enabled: boolean): Promise<Role> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/${id}/enabled?enabled=${enabled}` : `/api/roles/${id}/enabled?enabled=${enabled}`, {
      method: 'PATCH',
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`切换角色状态失败: ${response.statusText}`);
    return response.json();
  },

  // 删除角色
  async deleteRole(id: number): Promise<void> {
  const response = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/roles/${id}` : `/api/roles/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`删除角色失败: ${response.statusText}`);
  }
};

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    category: 'APPROVAL' as Role['category'], // 初始使用后端支持的类别
    level: 1,
    sortOrder: 1,
    description: '',
    enabled: true
  });
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ================= Effects =================
  
  // 初始化加载角色数据
  useEffect(() => {
    loadRoles();
  }, []);

  // 筛选角色
  useEffect(() => {
    let filtered = roles;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(role => 
        role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(role => role.category === selectedCategory);
    }
    
    setFilteredRoles(filtered);
  }, [searchQuery, selectedCategory, roles]);

  // ================= API Handlers =================
  
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleAPI.getAllRoles();
      setRoles(data);
      setFilteredRoles(data);
    } catch (error) {
      console.error('加载角色数据失败:', error);
      setSnackbar({
        open: true,
        message: '加载角色数据失败，请重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= Handlers =================

  const handleCreateRole = () => {
    setDialogMode('create');
    setFormData({
      code: '',
      displayName: '',
      category: 'APPROVAL', // 默认后端支持的类别
      level: 1,
      sortOrder: Math.max(...roles.map(r => r.sortOrder || 0)) + 1,
      description: '',
      enabled: true
    });
    setEditingRole(null);
    setOpenDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setDialogMode('edit');
    setFormData({
      code: role.code,
      displayName: role.displayName,
      category: role.category,
      level: role.level || 1,
      sortOrder: role.sortOrder || 1,
      description: role.description || '',
      enabled: role.enabled
    });
    setEditingRole(role);
    setOpenDialog(true);
  };

  const handleSaveRole = async () => {
    if (!formData.displayName.trim() || !formData.code.trim()) {
      setSnackbar({
        open: true,
        message: '请填写角色名称和角色代码',
        severity: 'error'
      });
      return;
    }

    try {
      setDialogLoading(true);
      
      if (dialogMode === 'create') {
        if (formData.category === 'CUSTOM') {
          setSnackbar({ open: true, message: '自定义角色功能尚未开放', severity: 'info' });
          return;
        }
        const created = await roleAPI.createRole({
          code: formData.code,
          displayName: formData.displayName,
          category: formData.category,
          level: formData.level,
          sortOrder: formData.sortOrder,
          description: formData.description,
          enabled: formData.enabled
        });
        // 直接追加到本地 state（排序：按 sortOrder 升序）
        setRoles(prev => [...prev, created].sort((a,b) => (a.sortOrder||0) - (b.sortOrder||0)));
        setSnackbar({
          open: true,
          message: '角色创建成功',
          severity: 'success'
        });
      } else if (editingRole) {
        const updated = await roleAPI.updateRole(editingRole.id, {
          displayName: formData.displayName,
          description: formData.description,
          enabled: formData.enabled,
          level: formData.level,
          sortOrder: formData.sortOrder
        });
        // 局部更新
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...updated } : r));
        setSnackbar({
          open: true,
          message: '角色更新成功',
          severity: 'success'
        });
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('保存角色失败:', error);
      setSnackbar({
        open: true,
        message: `保存角色失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleToggleRole = async (roleId: number) => {
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;
      const target = !role.enabled;
      // 乐观更新
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, enabled: target } : r));
      try {
        await roleAPI.toggleRole(roleId, target);
        setSnackbar({
          open: true,
          message: '角色状态已更新',
          severity: 'success'
        });
      } catch (e) {
        // 回滚
        setRoles(prev => prev.map(r => r.id === roleId ? { ...r, enabled: role.enabled } : r));
        throw e;
      }
    } catch (error) {
      console.error('切换角色状态失败:', error);
      setSnackbar({
        open: true,
        message: `切换角色状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('确定要删除这个角色吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 乐观移除
      const backup = roles;
      setRoles(prev => prev.filter(r => r.id !== roleId));
      try {
        await roleAPI.deleteRole(roleId);
      } catch (e) {
        // 回滚
        setRoles(backup);
        throw e;
      }
      setSnackbar({
        open: true,
        message: '角色删除成功',
        severity: 'success'
      });
    } catch (error) {
      console.error('删除角色失败:', error);
      setSnackbar({
        open: true,
        message: `删除角色失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    }
  };

  // ================= Render Helpers =================
  const getCategoryIcon = (category: Role['category']) => {
    switch (category) {
      case 'SYSTEM':
        return <SecurityIcon fontSize="small" />;
      case 'APPROVAL':
        return <AdminIcon fontSize="small" />;
      case 'CUSTOM':
        return <PersonIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getCategoryColor = (category: Role['category']) => {
    switch (category) {
      case 'SYSTEM':
        return '#dc2626'; // red
      case 'APPROVAL':
        return '#2563eb'; // blue
      case 'CUSTOM':
        return '#059669'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getCategoryLabel = (category: Role['category']) => {
    switch (category) {
      case 'SYSTEM':
        return '系统角色';
      case 'APPROVAL':
        return '审批角色';
      case 'CUSTOM':
        return '自定义角色';
      default:
        return '未知';
    }
  };

  // ================= Render =================
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Box sx={{
        p: 3,
        minHeight: '100vh'
      }}>
        {/* 页面头部 */}
        <Box sx={{
          mb: 4,
          p: 3,
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e8eaed',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ ml: 1,mr: 2, color: '#3182ce', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{
                  fontWeight: 600,
                  color: '#1a202c',
                  letterSpacing: '-0.025em',
                  mt: 2
                }}>
                  角色管理
                </Typography>
                <Typography variant="body1" sx={{
                  color: '#718096',
                  lineHeight: 1.6,
                  mt: 0.5
                }}>
                  管理系统角色权限，配置用户角色层级和权限范围
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRole}
              sx={{
                backgroundColor: '#3182ce',
                borderRadius: '8px',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#2c5282'
                }
              }}
            >
              新建角色
            </Button>
          </Box>
        </Box>

        {/* 统计卡片 */}
        <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                    总角色数
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
                    {roles.length}
                  </Typography>
                </Box>
                <SecurityIcon sx={{ color: '#3182ce', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                    系统角色
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#dc2626' }}>
                    {roles.filter(r => r.category === 'SYSTEM').length}
                  </Typography>
                </Box>
                <AdminIcon sx={{ color: '#dc2626', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                    审批角色
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2563eb' }}>
                    {roles.filter(r => r.category === 'APPROVAL').length}
                  </Typography>
                </Box>
                <SupervisorIcon sx={{ color: '#2563eb', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                    启用角色
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#059669' }}>
                    {roles.filter(r => r.enabled).length}
                  </Typography>
                </Box>
                <PersonIcon sx={{ color: '#059669', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 角色分类Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            delay: 0.1,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            mb: 3,
            overflow: 'hidden'
          }}>
            <Tabs
              value={selectedCategory}
              onChange={(e, newValue) => setSelectedCategory(newValue)}
              variant="fullWidth"
              sx={{
                backgroundColor: '#f7fafc',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#718096',
                  minHeight: 56,
                  transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  '&.Mui-selected': {
                    color: '#3182ce',
                    fontWeight: 600
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(49, 130, 206, 0.04)'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3182ce',
                  height: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                },
                '& .MuiTabs-flexContainer': {
                  height: 56
                }
              }}
            >
              <Tab 
                label={`全部角色 (${roles.length})`}
                value="ALL"
              />
              <Tab 
                label={`系统角色 (${roles.filter(r => r.category === 'SYSTEM').length})`}
                value="SYSTEM"
              />
              <Tab 
                label={`审批角色 (${roles.filter(r => r.category === 'APPROVAL').length})`}
                value="APPROVAL"
              />
              <Tab 
                label={`自定义角色 (${roles.filter(r => r.category === 'CUSTOM').length})`}
                value="CUSTOM"
              />
            </Tabs>
          </Card>
        </motion.div>

        {/* 筛选和搜索 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            delay: 0.2,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          <Card sx={{
            borderRadius: '12px',
            border: '1px solid #e8eaed',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  placeholder="搜索角色名称、代码或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#718096' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#f7fafc',
                      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      '& fieldset': {
                        borderColor: '#e8eaed'
                      },
                      '&:hover fieldset': {
                        borderColor: '#90cdf4'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3182ce'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* 角色列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: 0.3,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
          >
            <Card sx={{
              borderRadius: '12px',
              border: '1px solid #e8eaed',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}>
              {loading ? (
                <Box sx={{ 
                  py: 8, 
                  textAlign: 'center',
                  color: '#718096'
                }}>
                  <CircularProgress sx={{ color: '#3182ce', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    加载中...
                  </Typography>
                  <Typography variant="body2">
                    正在获取角色数据
                  </Typography>
                </Box>
              ) : (
                <>
                  {selectedCategory !== 'CUSTOM' && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>
                            角色信息
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>
                            类型
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>
                            层级
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>
                            状态
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>
                            创建时间
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2, textAlign: 'center' }}>
                            操作
                          </TableCell>
                        </TableRow>
                      </TableHead>
              <TableBody>
                <AnimatePresence mode="wait">
                  {filteredRoles.map((role, index) => (
                    <TableRow
                      key={role.id}
                      component={motion.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05, // stagger effect
                        ease: [0.4, 0.0, 0.2, 1]
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f7fafc'
                        }
                      }}
                    >
                        <TableCell>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a202c', mb: 0.5 }}>
                              {role.displayName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.875rem' }}>
                              代码: {role.code}
                            </Typography>
                            {role.description && (
                              <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.75rem', mt: 0.5 }}>
                                {role.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getCategoryIcon(role.category)}
                            label={getCategoryLabel(role.category)}
                            size="small"
                            sx={{
                              backgroundColor: `${getCategoryColor(role.category)}15`,
                              color: getCategoryColor(role.category),
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: getCategoryColor(role.category)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#1a202c', fontWeight: 500 }}>
                              {role.level || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                              (排序: {role.sortOrder || '-'})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.enabled ? '启用' : '禁用'}
                            size="small"
                            icon={role.enabled ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                            sx={{
                              backgroundColor: role.enabled ? '#f0fff4' : '#fef2f2',
                              color: role.enabled ? '#059669' : '#dc2626',
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: role.enabled ? '#059669' : '#dc2626'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#718096' }}>
                            {new Date(role.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="编辑角色">
                              <IconButton
                                size="small"
                                onClick={() => handleEditRole(role)}
                                sx={{
                                  color: '#3182ce',
                                  '&:hover': {
                                    backgroundColor: '#ebf8ff'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={role.enabled ? '禁用角色' : '启用角色'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleRole(role.id)}
                                sx={{
                                  color: role.enabled ? '#dc2626' : '#059669',
                                  '&:hover': {
                                    backgroundColor: role.enabled ? '#fef2f2' : '#f0fff4'
                                  }
                                }}
                              >
                                {role.enabled ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            {role.category === 'CUSTOM' && (
                              <Tooltip title="删除角色">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRole(role.id)}
                                  sx={{
                                    color: '#dc2626',
                                    '&:hover': {
                                      backgroundColor: '#fef2f2'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
                  )}
                  {selectedCategory === 'CUSTOM' && !loading && (
                    <Box sx={{ py: 10, textAlign: 'center', color: '#718096' }}>
                      <PersonIcon sx={{ fontSize: 56, mb: 2, opacity: 0.4 }} />
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1a202c' }}>
                        自定义角色功能开发中
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        当前仅展示占位，后端尚未开放自定义角色类别（CUSTOM）
                      </Typography>
                      <Typography variant="body2">
                        后续将支持：按模块权限粒度创建、分配和继承策略。
                      </Typography>
                    </Box>
                  )}
            
            {filteredRoles.length === 0 && !loading && selectedCategory !== 'CUSTOM' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
              >
                <Box sx={{ 
                  py: 8, 
                  textAlign: 'center',
                  color: '#718096'
                }}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.2,
                      ease: [0.4, 0.0, 0.2, 1]
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 48, mb: 2 }} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3,
                      delay: 0.4,
                      ease: [0.4, 0.0, 0.2, 1]
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      未找到角色
                    </Typography>
                    <Typography variant="body2">
                      {searchQuery || selectedCategory !== 'ALL' 
                        ? '尝试调整搜索条件或筛选器' 
                        : '点击上方按钮创建第一个角色'
                      }
                    </Typography>
                  </motion.div>
                </Box>
              </motion.div>
            )}
                </>
              )}
            </Card>
          </motion.div>
        </motion.div>

        {/* 创建/编辑角色对话框 */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,
            fontWeight: 600,
            color: '#1a202c'
          }}>
            {dialogMode === 'create' ? '创建新角色' : '编辑角色'}
          </DialogTitle>
          <DialogContent sx={{ mt: 3, pt: 3, pb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                label="角色名称"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
              
              <TextField
                label="角色代码"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                fullWidth
                required
                placeholder="例如: TEACHER, STUDENT"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
              
              <FormControl fullWidth>
                <InputLabel>角色类型</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Role['category'] })}
                  label="角色类型"
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="SYSTEM">系统角色</MenuItem>
                  <MenuItem value="APPROVAL">审批角色</MenuItem>
                  <MenuItem value="CUSTOM" disabled>自定义角色（待开发）</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="角色层级"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                fullWidth
                inputProps={{ min: 1, max: 99 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
              
              <TextField
                label="排序顺序"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                fullWidth
                inputProps={{ min: 1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3182ce'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3182ce'
                      }
                    }}
                  />
                }
                label="启用角色"
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
              
              <TextField
                label="角色描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="描述角色的职责和权限范围..."
                sx={{
                  gridColumn: { md: '1 / -1' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{
                borderColor: '#e8eaed',
                color: '#4a5568',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#cbd5e0',
                  backgroundColor: '#f7fafc'
                }
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveRole}
              variant="contained"
              startIcon={dialogLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
              disabled={dialogLoading}
              sx={{
                backgroundColor: '#3182ce',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#2c5282'
                },
                '&:disabled': {
                  backgroundColor: '#cbd5e0'
                }
              }}
            >
              {dialogLoading ? '保存中...' : (dialogMode === 'create' ? '创建角色' : '保存更改')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ borderRadius: '8px' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
