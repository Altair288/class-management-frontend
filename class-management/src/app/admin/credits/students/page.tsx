"use client";

import { useState } from "react";
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
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  InputLabel,
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
  class: string;
  avatar?: string;
  德: number;
  智: number;
  体: number;
  美: number;
  劳: number;
  total: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

// 模拟数据
const initialStudentCredits: StudentCredit[] = [
  {
    id: 1,
    studentId: "2024001",
    studentName: "张三",
    class: "计算机2024-1班",
    德: 85,
    智: 92,
    体: 78,
    美: 88,
    劳: 85,
    total: 428,
    status: 'excellent',
  },
  {
    id: 2,
    studentId: "2024002",
    studentName: "李四",
    class: "计算机2024-1班",
    德: 75,
    智: 88,
    体: 82,
    美: 76,
    劳: 80,
    total: 401,
    status: 'good',
  },
  {
    id: 3,
    studentId: "2024003",
    studentName: "王五",
    class: "计算机2024-2班",
    德: 60,
    智: 70,
    体: 65,
    美: 58,
    劳: 62,
    total: 315,
    status: 'warning',
  },
  {
    id: 4,
    studentId: "2024004",
    studentName: "赵六",
    class: "计算机2024-2班",
    德: 45,
    智: 55,
    体: 50,
    美: 48,
    劳: 52,
    total: 250,
    status: 'danger',
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentCredit | null>(null);

  // 过滤数据
  const filteredStudents = studentCredits.filter(student => {
    const matchSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       student.studentId.includes(searchTerm);
    const matchClass = !classFilter || student.class === classFilter;
    const matchStatus = !statusFilter || student.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  // 获取所有班级
  const allClasses = Array.from(new Set(studentCredits.map(s => s.class)));

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
              学生学分管理
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              查看学生学分详情，批量导入导出数据，进行学分调整和异常处理
            </Typography>
          </Box>
        </Box>

        {/* 统计概览 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = filteredStudents.filter(s => s.status === key).length;
            return (
              <Card key={key} sx={{ borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#6c757d', 
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
                          color: '#6c757d',
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

        {/* 搜索和过滤工具栏 */}
        <Card sx={{ mb: 3, borderRadius: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529', mb: 2 }}>
              筛选条件
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <TextField
                placeholder="搜索学生姓名或学号"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#6c757d' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: '#e9ecef',
                    },
                    '&:hover fieldset': {
                      borderColor: '#007bff',
                    },
                  },
                }}
              />
              
              <FormControl>
                <InputLabel sx={{ fontSize: '0.875rem' }}>班级</InputLabel>
                <Select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  label="班级"
                  sx={{
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e9ecef',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#007bff',
                    },
                  }}
                >
                  <MenuItem value="">全部班级</MenuItem>
                  {allClasses.map(cls => (
                    <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel sx={{ fontSize: '0.875rem' }}>状态</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="状态"
                  sx={{
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e9ecef',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#007bff',
                    },
                  }}
                >
                  <MenuItem value="">全部状态</MenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>{config.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* 学生学分表格 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              学生学分列表 ({filteredStudents.length}人)
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>学生</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>班级</TableCell>
                    {creditCategories.map(category => (
                      <TableCell key={category.key} sx={{ fontWeight: 600 }}>
                        {category.name}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 600 }}>总分</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {student.studentName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {student.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.studentId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      {creditCategories.map(category => {
                        const score = student[category.key as keyof StudentCredit] as number;
                        return (
                          <TableCell key={category.key}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {score}分
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={score}
                                sx={{
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getProgressColor(score),
                                  },
                                }}
                              />
                            </Box>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Typography variant="h6" fontWeight={600}>
                          {student.total}分
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(student.status)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditStudent(student)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
