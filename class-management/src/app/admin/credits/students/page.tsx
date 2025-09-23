"use client";

import { useState, useEffect, useCallback } from "react";
import { alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

interface StudentCredit {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  avatar?: string;
  德: number;
  智: number;
  体: number;
  美: number;
  劳: number;
  total: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

interface ClassInfo {
  id: number;
  name: string;
  grade: string;
}

// 模拟数据
const initialStudentCredits: StudentCredit[] = [];

const statusConfig = {
  excellent: { label: '优秀', color: '#28a745', bgColor: '#d4edda', threshold: 400 },
  good: { label: '良好', color: '#007bff', bgColor: '#d1ecf1', threshold: 350 },
  warning: { label: '预警', color: '#ffc107', bgColor: '#fff3cd', threshold: 300 },
  danger: { label: '危险', color: '#dc3545', bgColor: '#f8d7da', threshold: 0 },
};

const creditCategories = [
  { key: '德', name: '德', color: '#1565c0' },
  { key: '智', name: '智', color: '#6a1b9a' },
  { key: '体', name: '体', color: '#2e7d32' },
  { key: '美', name: '美', color: '#ef6c00' },
  { key: '劳', name: '劳', color: '#ad1457' },
];

export default function StudentsCreditsPage() {
  const [studentCredits, setStudentCredits] = useState<StudentCredit[]>(initialStudentCredits);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentCredit | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载班级数据
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/class/simple');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  // 加载学生学分数据
  const fetchStudentCredits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('keyword', searchTerm);
      if (classFilter) params.append('classId', classFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/credits/student-union-scores?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStudentCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch student credits:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, classFilter, statusFilter]);

  // 初始加载
  useEffect(() => {
    fetchClasses();
    fetchStudentCredits();
  }, [fetchClasses, fetchStudentCredits]);

  // 筛选条件变化时重新加载数据
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchStudentCredits();
    }, 300); // 防抖

    return () => clearTimeout(delayedFetch);
  }, [fetchStudentCredits]);

  // 过滤数据 - 现在主要用于统计显示，实际筛选在后端完成
  const filteredStudents = studentCredits;

  const handleEditStudent = (student: StudentCredit) => {
    setEditingStudent(student);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingStudent) {
      const updatedStudent = {
        ...editingStudent,
        total: editingStudent.德 + editingStudent.智 + editingStudent.体 + editingStudent.美 + editingStudent.劳,
      };
      // 更新状态
      if (updatedStudent.total >= 400) updatedStudent.status = 'excellent';
      else if (updatedStudent.total >= 350) updatedStudent.status = 'good';
      else if (updatedStudent.total >= 300) updatedStudent.status = 'warning';
      else updatedStudent.status = 'danger';

      setStudentCredits(students =>
        students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      );
      setEditDialogOpen(false);
    }
  };

  const getStatusChip = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.color,
          color: 'white',
          fontWeight: 600,
        }}
      />
    );
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#2196f3';
    if (score >= 60) return '#ff9800';
    return '#f44336';
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
              backgroundColor: (theme)=> theme.palette.mode==='light'? '#f8f9fa' : alpha(theme.palette.primary.main,0.15),
              border: (theme)=> `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: (theme)=> theme.palette.mode==='light'? '#e9ecef' : alpha(theme.palette.primary.main,0.25)
              }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              学生学分管理
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              查看学生学分详情，批量导入导出数据，进行学分调整和异常处理
            </Typography>
          </Box>
        </Box>

        {/* 统计概览 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = filteredStudents.filter(s => s.status === key).length;
            return (
              <Card key={key} sx={{ borderRadius: 1, border: (theme)=>`1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: (theme)=> theme.palette.background.paper }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary', 
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          mb: 1
                        }}
                      >
                        {config.label}学生
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: config.color, 
                          fontWeight: 700,
                          fontSize: '2rem',
                          lineHeight: 1,
                          mb: 0.5
                        }}
                      >
                        {count}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.75rem'
                        }}
                      >
                        占比 {((count / filteredStudents.length) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        width: 4,
                        height: 40,
                        backgroundColor: config.color,
                        borderRadius: 2
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* 搜索和筛选工具栏 - Google风格设计 */}
  <Card sx={{ mb: 3, borderRadius: 3, border: (theme)=>`1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: (theme)=> theme.palette.background.paper }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* 搜索框 */}
              <Box sx={{ flex: '1 1 300px', minWidth: 200 }}>
                <TextField
                  fullWidth
                  placeholder="搜索学生姓名或学号"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '24px',
                      backgroundColor: (theme)=> theme.palette.mode==='light'? '#f8f9fa' : alpha(theme.palette.action.hover,0.15),
                      fontSize: '14px',
                      height: 44,
                      '& fieldset': {
                        borderColor: (theme)=> theme.palette.divider,
                        borderWidth: 1,
                      },
                      '&:hover fieldset': {
                        borderColor: (theme)=> theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: (theme)=> theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '10px 16px 10px 0',
                    },
                  }}
                />
              </Box>
              
              {/* 筛选器 */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '20px',
                      height: 36,
                      fontSize: '14px',
                      backgroundColor: (theme)=> classFilter ? alpha(theme.palette.primary.main,0.12) : (theme.palette.mode==='light'? '#f8f9fa' : alpha(theme.palette.action.hover,0.15)),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: (theme)=> classFilter ? theme.palette.primary.main : theme.palette.divider,
                        borderWidth: 1,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: (theme)=> theme.palette.primary.main,
                      },
                      '& .MuiSelect-select': {
                        padding: '8px 32px 8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '14px' }}>所有班级</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id.toString()} sx={{ fontSize: '14px' }}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '20px',
                      height: 36,
                      fontSize: '14px',
                      backgroundColor: (theme)=> statusFilter ? alpha(theme.palette.primary.main,0.12) : (theme.palette.mode==='light'? '#f8f9fa' : alpha(theme.palette.action.hover,0.15)),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: (theme)=> statusFilter ? theme.palette.primary.main : theme.palette.divider,
                        borderWidth: 1,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: (theme)=> theme.palette.primary.main,
                      },
                      '& .MuiSelect-select': {
                        padding: '8px 32px 8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '14px' }}>所有状态</MenuItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key} sx={{ fontSize: '14px' }}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 结果统计 */}
                {(searchTerm || classFilter || statusFilter) && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px', ml: 1 }}>
                    {loading ? '搜索中...' : `找到 ${filteredStudents.length} 个结果`}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 学生学分表格 */}
  <Card sx={{ borderRadius: 3, border: (theme)=> `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: (theme)=> theme.palette.background.paper }}>
          <CardContent sx={{ p: 0 }}>
            {/* 表格标题栏 */}
            <Box sx={{ p: 3, borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                    学生学分列表
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px' }}>
                    {loading ? '加载中...' : `共 ${filteredStudents.length} 名学生`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* 表格内容 */}
            <Box sx={{ overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: (theme)=> theme.palette.mode==='light'? '#f8f9fa' : alpha(theme.palette.action.hover,0.15) }}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px', borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>学生</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#202124', fontSize: '14px', borderBottom: '1px solid #dadce0' }}>班级</TableCell>
                      {creditCategories.map(category => (
                        <TableCell key={category.key} sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px', borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                          {category.name}
                        </TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px', borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>总分</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px', borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px', borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow 
                        key={student.id} 
                        hover
                        sx={{
                          '&:hover': { backgroundColor: (theme)=> theme.palette.action.hover },
                          borderBottom: (theme)=> `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <TableCell sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '14px' }}>
                              {student.studentName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '14px', color: 'text.primary' }}>
                                {student.studentName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                {student.studentId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}`, fontSize: '14px', color: 'text.primary' }}>
                          {student.className}
                        </TableCell>
                        {creditCategories.map(category => {
                          const score = student[category.key as keyof StudentCredit] as number;
                          return (
                            <TableCell key={category.key} sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '14px', color: 'text.primary', mb: 0.5 }}>
                                  {score}分
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={score}
                                  sx={{
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: (theme)=> alpha(theme.palette.text.primary,0.12),
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getProgressColor(score),
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell>
                          );
                        })}
                        <TableCell sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="h6" fontWeight={600} sx={{ fontSize: '16px', color: 'text.primary' }}>
                            {student.total}分
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                          {getStatusChip(student.status)}
                        </TableCell>
                        <TableCell sx={{ borderBottom: (theme)=> `1px solid ${theme.palette.divider}` }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditStudent(student)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: (theme)=> theme.palette.action.hover,
                                color: 'primary.main',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 编辑对话框 */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            编辑学生学分 - {editingStudent?.studentName}
          </DialogTitle>
          <DialogContent>
            {editingStudent && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {creditCategories.map(category => (
                  <TextField
                    key={category.key}
                    label={`${category.name}类学分`}
                    type="number"
                    value={editingStudent[category.key as keyof StudentCredit]}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      [category.key]: Number(e.target.value)
                    })}
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                  />
                ))}
                
                <TextField
                  label="总分"
                  value={editingStudent.德 + editingStudent.智 + editingStudent.体 + editingStudent.美 + editingStudent.劳}
                  disabled
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained"
              startIcon={<SaveIcon />}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
