"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
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
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveReason, setSaveReason] = useState('调整');
  const [saveMode, setSaveMode] = useState<'absolute'|'delta'>('absolute'); // absolute 使用 set-score, delta 使用 update-score
  const [deltaValues, setDeltaValues] = useState<Record<string, number>>({}); // delta 模式下的每类增减值
  const [snackbar, setSnackbar] = useState<{open:boolean; msg:string; severity:'success'|'error'|'info'}>({open:false,msg:'',severity:'success'});
  const originalEditingSnapshot = useRef<StudentCredit | null>(null);
  const [creditItemMap, setCreditItemMap] = useState<Record<string, number>>({}); // category -> creditItemId
  const creditCategoriesKeys = useMemo(()=>['德','智','体','美','劳'] as const, []);
  const validationErrors = useMemo(()=>{
    const errs: Record<string,string> = {};
    if (!editingStudent) return errs;
    if (saveMode === 'absolute') {
      creditCategoriesKeys.forEach(k => {
        const v = editingStudent[k];
        if (v < 0 || v > 100) errs[k] = '范围 0-100';
      });
    } else { // delta
      creditCategoriesKeys.forEach(k => {
        const orig = originalEditingSnapshot.current?.[k] ?? 0;
        const delta = deltaValues[k] ?? 0;
        const newVal = orig + delta;
        if (newVal < 0 || newVal > 100) {
          const min = -orig;
          const max = 100 - orig;
            errs[k] = `新值${newVal}超范围(0-100)，可调区间 ${min} ~ +${max}`;
        }
      });
    }
    return errs;
  }, [editingStudent, saveMode, deltaValues, creditCategoriesKeys]);
  const hasValidationError = Object.keys(validationErrors).length > 0;

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
        // 后端 DTO 使用 @JsonProperty("class")，这里统一映射到 className，并按最新 total 计算状态防止 evaluation 未重算导致前端状态不更新
        interface RawStudentCreditsViewDTO {
          id: number; studentId: string; studentName: string; class?: string; className?: string;
          德: number; 智: number; 体: number; 美: number; 劳: number; total?: number; status?: string;
        }
        const normalized: StudentCredit[] = (data as RawStudentCreditsViewDTO[]).map((d) => {
          const total = d.total ?? (d['德'] + d['智'] + d['体'] + d['美'] + d['劳']);
          const computeStatus = (t: number) => t >= 400 ? 'excellent' : t >= 350 ? 'good' : t >= 300 ? 'warning' : 'danger';
          return {
            id: d.id,
            studentId: d.studentId,
            studentName: d.studentName,
            className: d.class ?? d.className ?? '',
            德: d['德'],
            智: d['智'],
            体: d['体'],
            美: d['美'],
            劳: d['劳'],
            total,
            status: computeStatus(total) as StudentCredit['status']
          };
        });
        setStudentCredits(normalized);
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
    // 拉取各类别主项目 ID
    (async () => {
      try {
        const results = await Promise.all(creditCategoriesKeys.map(c => fetch(`/api/credits/items?category=${encodeURIComponent(c)}`)));
        const jsons = await Promise.all(results.map(r => r.ok ? r.json() : []));
        const map: Record<string, number> = {};
        jsons.forEach((arr, idx) => {
          if (Array.isArray(arr) && arr.length>0) {
            map[creditCategoriesKeys[idx]] = arr[0].id; // 约定一类一个主项目
          }
        });
        setCreditItemMap(map);
      } catch (e) {
        console.error('加载主项目信息失败', e);
        setSnackbar({open:true,msg:'加载主项目信息失败',severity:'error'});
      }
    })();
  }, [fetchClasses, fetchStudentCredits, creditCategoriesKeys]);

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
    originalEditingSnapshot.current = JSON.parse(JSON.stringify(student));
    setSaveReason('调整');
    setDeltaValues({});
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent || !originalEditingSnapshot.current) return;
    if (!Object.keys(creditItemMap).length) {
      setSnackbar({open:true,msg:'主项目信息尚未加载',severity:'error'});
      return;
    }
    if (hasValidationError) {
      setSnackbar({open:true,msg:'存在超出 0-100 范围的数值，请先修正',severity:'error'});
      return;
    }
    setSaveLoading(true);
    try {
      const orig = originalEditingSnapshot.current;
      const requests: Promise<Response>[] = [];
      if (saveMode === 'absolute') {
        creditCategoriesKeys.forEach(cat => {
          const newVal = editingStudent[cat];
          const oldVal = orig[cat];
          if (newVal !== oldVal) {
            const creditItemId = creditItemMap[cat];
            if (!creditItemId) return;
            requests.push(fetch(`/api/credits/students/${editingStudent.id}/set-score`, {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({ creditItemId, value:newVal, reason: saveReason || '调整' })
            }));
          }
        });
      } else {
        creditCategoriesKeys.forEach(cat => {
          const delta = deltaValues[cat];
          if (delta && delta !== 0) {
            const creditItemId = creditItemMap[cat];
            if (!creditItemId) return;
            requests.push(fetch(`/api/credits/students/${editingStudent.id}/update-score`, {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({ creditItemId, delta, reason: saveReason || '调整' })
            }));
          }
        });
      }
      if (requests.length === 0) {
        setSnackbar({open:true,msg:'没有发生变化',severity:'info'});
        setEditDialogOpen(false);
        return;
      }
      const responses = await Promise.all(requests);
      const failed = responses.filter(r=>!r.ok);
      if (failed.length) {
        const t = await failed[0].text();
        throw new Error(t || '部分更新失败');
      }
      await fetchStudentCredits();
      setSnackbar({open:true,msg:'学分已更新',severity:'success'});
      setEditDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnackbar({open:true,msg:`保存失败: ${msg}`,severity:'error'});
    } finally {
      setSaveLoading(false);
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
                <Box>
                  <FormLabel component="legend" sx={{ mb: 1 }}>保存模式</FormLabel>
                  <RadioGroup
                    row
                    value={saveMode}
                    onChange={(e)=> setSaveMode(e.target.value as 'absolute'|'delta')}
                  >
                    <FormControlLabel value="absolute" control={<Radio size="small" />} label="绝对设置(覆盖)" />
                    <FormControlLabel value="delta" control={<Radio size="small" />} label="增量调整(差值)" />
                  </RadioGroup>
                  <Typography variant="caption" sx={{ color:'text.secondary' }}>
                    {saveMode === 'absolute' ? '将每个修改后的数值直接写入(使用 set-score)，适合直接修正错误或对齐统计。' : '根据修改前后差值发送增减(使用 update-score)，保留原始记录并生成增减日志。'}
                  </Typography>
                </Box>
                {saveMode === 'absolute' && creditCategories.map(category => (
                  <TextField
                    key={category.key}
                    label={`${category.name}类学分 (绝对)`}
                    type="number"
                    value={editingStudent[category.key as keyof StudentCredit]}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      [category.key]: Number(e.target.value)
                    })}
                    inputProps={{ min: 0 }}
                    fullWidth
                    error={!!validationErrors[category.key]}
                    helperText={validationErrors[category.key] || '范围 0-100'}
                  />
                ))}
                {saveMode === 'delta' && creditCategories.map(category => {
                  const origVal = (originalEditingSnapshot.current?.[category.key as keyof StudentCredit] as number) ?? 0;
                  const delta = deltaValues[category.key] ?? 0;
                  const newVal = origVal + delta;
                  return (
                    <Box key={category.key} sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight:600 }}>
                        {category.name}：当前 {origVal} + 调整
                      </Typography>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={deltaValues[category.key] ?? ''}
                          placeholder="0"
                          onChange={(e)=> {
                            const v = e.target.value === '' ? undefined : Number(e.target.value);
                            setDeltaValues(prev => ({ ...prev, [category.key]: (v===undefined || isNaN(v)) ? 0 : v }));
                          }}
                          sx={{ width:140 }}
                          inputProps={{ step: 0.5 }}
                          error={!!validationErrors[category.key]}
                          helperText={validationErrors[category.key] || `可调范围 ${-origVal} ~ +${100-origVal}`}
                        />
                        <Typography variant="body2" sx={{ fontWeight:600 }}>= {newVal}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, newVal))}
                        sx={{ height:4, borderRadius:2 }}
                      />
                    </Box>
                  );
                })}
                {(() => {
                  const origTotal = (originalEditingSnapshot.current?.德 ?? 0) + (originalEditingSnapshot.current?.智 ?? 0) + (originalEditingSnapshot.current?.体 ?? 0) + (originalEditingSnapshot.current?.美 ?? 0) + (originalEditingSnapshot.current?.劳 ?? 0);
                  const deltaSum = saveMode==='delta' ? creditCategoriesKeys.reduce((sum,k)=> sum + (deltaValues[k]||0),0) : 0;
                  const newTotal = saveMode==='delta' ? origTotal + deltaSum : (editingStudent.德 + editingStudent.智 + editingStudent.体 + editingStudent.美 + editingStudent.劳);
                  return (
                    <Box>
                      <TextField
                        label={saveMode==='absolute' ? '总分' : '新总分'}
                        value={newTotal}
                        disabled
                        fullWidth
                      />
                      {saveMode==='delta' && (
                        <Typography variant="caption" sx={{ color:'text.secondary' }}>
                          原总分 {origTotal} + Δ {deltaSum >=0 ? '+'+deltaSum : deltaSum} = {newTotal}
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
                <TextField
                  label="调整原因"
                  value={saveReason}
                  onChange={(e)=> setSaveReason(e.target.value)}
                  placeholder="例如：期中表现、加分调整"
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
              disabled={saveLoading || hasValidationError}
            >
              {saveLoading? '保存中...' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={()=> setSnackbar(s=>({...s,open:false}))}
          anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled" elevation={3} onClose={()=> setSnackbar(s=>({...s,open:false}))}>
            {snackbar.msg}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
