"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

interface CreditItem {
  id: number;
  category: string;
  name: string;
  initialScore: number;
  maxScore: number;
  description: string;
  isActive: boolean;
}

// 模拟数据
const initialCreditItems: CreditItem[] = [
  {
    id: 1,
    category: "德",
    name: "思想品德",
    initialScore: 80,
    maxScore: 100,
    description: "思想政治表现和道德品质",
    isActive: true,
  },
  {
    id: 2,
    category: "德",
    name: "遵纪守法",
    initialScore: 85,
    maxScore: 100,
    description: "遵守法律法规和校规校纪",
    isActive: true,
  },
  {
    id: 3,
    category: "智",
    name: "学业成绩",
    initialScore: 75,
    maxScore: 100,
    description: "课程学习成绩和学术表现",
    isActive: true,
  },
  {
    id: 4,
    category: "体",
    name: "体质健康",
    initialScore: 80,
    maxScore: 100,
    description: "身体素质和健康状况",
    isActive: true,
  },
  {
    id: 5,
    category: "美",
    name: "艺术修养",
    initialScore: 70,
    maxScore: 100,
    description: "艺术鉴赏和审美能力",
    isActive: true,
  },
  {
    id: 6,
    category: "劳",
    name: "劳动实践",
    initialScore: 75,
    maxScore: 100,
    description: "劳动技能和实践能力",
    isActive: true,
  },
];

const categoryColors: { [key: string]: string } = {
  德: "#1565c0",
  智: "#6a1b9a", 
  体: "#2e7d32",
  美: "#ef6c00",
  劳: "#ad1457",
};

export default function CreditsConfigPage() {
  const [creditItems, setCreditItems] = useState<CreditItem[]>(initialCreditItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreditItem | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    initialScore: 0,
    maxScore: 100,
    description: "",
    isActive: true,
  });

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      category: "",
      name: "",
      initialScore: 0,
      maxScore: 100,
      description: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: CreditItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      initialScore: item.initialScore,
      maxScore: item.maxScore,
      description: item.description,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      // 编辑现有项目
      setCreditItems(items =>
        items.map(item =>
          item.id === editingItem.id
            ? { ...item, ...formData }
            : item
        )
      );
    } else {
      // 添加新项目
      const newItem: CreditItem = {
        id: Math.max(...creditItems.map(i => i.id)) + 1,
        ...formData,
      };
      setCreditItems(items => [...items, newItem]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setCreditItems(items => items.filter(item => item.id !== id));
  };

  const handleToggleActive = (id: number) => {
    setCreditItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
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
              学分项目配置
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              配置各类学分的评分标准、权重分配和计算规则
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
              px: 3,
              py: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            添加项目
          </Button>
        </Box>

        {/* 统计概览 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 4 }}>
          {Object.entries(
            creditItems.reduce((acc, item) => {
              acc[item.category] = (acc[item.category] || 0) + 1;
              return acc;
            }, {} as { [key: string]: number })
          ).map(([category, count]) => (
            <Card key={category} sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: categoryColors[category],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5
                  }}
                >
                  <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                    {category}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#212529', mb: 0.5 }}>
                  {count}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.75rem' }}>
                  配置项目
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 配置项目表格 */}
        <Card sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529' }}>
                配置项目列表
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d', mt: 0.5 }}>
                管理所有学分评估项目的配置参数
              </Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem', py: 2 }}>类别</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>项目名称</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>初始分值</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>最大分值</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>状态</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>描述</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#495057', fontSize: '0.875rem' }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creditItems.map((item, index) => (
                    <TableRow 
                      key={item.id} 
                      sx={{ 
                        '&:hover': { backgroundColor: '#f8f9fa' },
                        borderBottom: index === creditItems.length - 1 ? 'none' : '1px solid #e9ecef'
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            backgroundColor: categoryColors[item.category],
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#212529' }}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#495057' }}>
                          {item.initialScore}分
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#495057' }}>
                          {item.maxScore}分
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={item.isActive}
                              onChange={() => handleToggleActive(item.id)}
                              size="small"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#28a745',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#28a745',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ color: item.isActive ? '#28a745' : '#6c757d' }}>
                              {item.isActive ? "启用" : "禁用"}
                            </Typography>
                          }
                          labelPlacement="start"
                          sx={{ ml: 0, gap: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }} noWrap>
                          {item.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(item)}
                            sx={{ 
                              color: '#495057',
                              '&:hover': { 
                                backgroundColor: '#e9ecef',
                                color: '#007bff'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{ 
                              color: '#495057',
                              '&:hover': { 
                                backgroundColor: '#f8d7da',
                                color: '#dc3545'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
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

        {/* 添加/编辑对话框 */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? "编辑学分项目" : "添加学分项目"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="类别"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                select
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="">请选择类别</option>
                <option value="德">德</option>
                <option value="智">智</option>
                <option value="体">体</option>
                <option value="美">美</option>
                <option value="劳">劳</option>
              </TextField>
              
              <TextField
                label="项目名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="初始分值"
                  type="number"
                  value={formData.initialScore}
                  onChange={(e) => setFormData({ ...formData, initialScore: Number(e.target.value) })}
                  fullWidth
                />
                <TextField
                  label="最大分值"
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                  fullWidth
                />
              </Box>
              
              <TextField
                label="项目描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="启用该项目"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!formData.category || !formData.name}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
