// 创建班级页面 - 重新设计，移除教师分配功能

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Divider,
  Stack,
  LinearProgress,
  Alert,
  AlertTitle,
  IconButton,
  Chip
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ClassCreatePage() {
  const router = useRouter();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [gradeOptions, setGradeOptions] = useState<number[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState<{id:number; name:string}[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [depLoading, setDepLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 年级下拉
  useEffect(() => {
    const now = new Date().getFullYear();
    const arr = [];
    for (let y = 2020; y <= now; y++) arr.push(y);
    setGradeOptions(arr.reverse());
  }, []);

  // 加载系部列表
  useEffect(() => {
    const loadDepartments = async () => {
      setDepLoading(true);
      try {
        const res = await axios.get('/api/department/list');
        setDepartments(res.data || []);
      } catch (e) {
        console.error('加载系部失败', e);
      }
      setDepLoading(false);
    };
    loadDepartments();
  }, []);

  // 自动加年份前缀
  const handleClassNameChange = (val: string) => {
    const yearSuffix = String(year).slice(-2);
    let name = val;
    if (!val.startsWith(yearSuffix)) {
      name = yearSuffix + val.replace(/^\d{2}/, "");
    }
    setClassName(name);
  };

  // 年级切换时自动加前缀
  const handleYearChange = (y: number) => {
    setYear(y);
    const yearSuffix = String(y).slice(-2);
    setClassName((prev) => {
      const name = prev.replace(/^\d{2}/, "");
      return yearSuffix + name;
    });
  };

  // 提交
  const handleSubmit = async () => {
    if (!className.trim()) {
      alert("请输入班级名称");
      return;
    }
    if (!departmentId) {
      setFormError('请选择系部');
      return;
    }

    setFormError(null);

    setLoading(true);
    try {
      await axios.post("/api/class/create", {
        name: className,
        grade: year,
        departmentId: departmentId,
      });
      setSuccess(true);
      setTimeout(() => {
        setClassName("");
        setDepartmentId('');
        setSuccess(false);
      }, 3000);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "未知错误";
      alert("创建失败：" + errorMessage);
    }
    setLoading(false);
  };

  const handleGoToTeacherManagement = () => {
    router.push("/admin/users/teachers");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Box sx={{
        p: 3,
        minHeight: '100vh'
      }}>
        {/* 页面头部 */}
        <Box sx={(theme) => ({
          mb: 4,
          p: 3,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'light' 
            ? '0 1px 3px rgba(0,0,0,0.03)' 
            : '0 1px 3px rgba(0,0,0,0.6)',
          transition: 'background-color 0.3s, border-color 0.3s'
        })}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={() => router.back()}
              sx={(theme) => ({
                mr: 2,
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              })}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={(theme) => ({
              fontWeight: 600,
              color: theme.palette.text.primary,
              letterSpacing: '-0.025em'
            })}>
              创建班级
            </Typography>
          </Box>
          <Typography variant="body1" sx={(theme) => ({
            color: theme.palette.text.secondary,
            lineHeight: 1.6
          })}>
            创建新的班级信息，配置基本属性和设置
          </Typography>
        </Box>

        {/* 主要内容卡片 */}
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Card sx={(theme) => ({
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'light' 
              ? '0 1px 3px rgba(0,0,0,0.03)' 
              : '0 1px 3px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: theme.palette.background.paper,
            transition: 'background-color 0.3s, border-color 0.3s'
          })}>
            {loading && (
              <LinearProgress sx={(theme) => ({ 
                backgroundColor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main
                }
              })} />
            )}
            
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={4}>
                {/* Success Alert */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="success" 
                      icon={<CheckCircleIcon fontSize="inherit" />}
                      sx={(theme) => ({
                        borderRadius: '12px',
                        background: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : undefined,
                        '& .MuiAlert-icon': {
                          color: theme.palette.success.main
                        }
                      })}
                    >
                      <AlertTitle sx={{ fontWeight: 600 }}>创建成功！</AlertTitle>
                      班级 &ldquo;{className}&rdquo; 已创建完成
                    </Alert>
                  </motion.div>
                )}

                {/* Info Alert */}
                <Alert 
                  severity="info" 
                  icon={<InfoIcon fontSize="inherit" />}
                  sx={(theme) => ({
                    borderRadius: '12px',
                    backgroundColor: theme.palette.mode === 'light' 
                      ? theme.palette.info.light 
                      : 'rgba(33,150,243,0.15)',
                    '& .MuiAlert-icon': {
                      color: theme.palette.info.main
                    }
                  })}
                >
                  <AlertTitle sx={{ fontWeight: 600 }}>关于教师分配</AlertTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2">
                      班级创建后，您可以前往教师管理页面为班级分配班主任和任课教师
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={handleGoToTeacherManagement}
                      sx={{
                        ml: 2,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)'
                        }
                      }}
                    >
                      分配教师
                    </Button>
                  </Box>
                </Alert>

                <Divider sx={(theme) => ({ borderColor: theme.palette.divider })} />

                {/* Form */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <FormControl fullWidth>
                      <InputLabel sx={(theme) => ({ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        '&.Mui-focused': { color: theme.palette.primary.main }
                      })}>年级</InputLabel>
                      <Select
                        label="年级"
                        value={year}
                        onChange={e => handleYearChange(Number(e.target.value))}
                        sx={(theme) => ({
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.divider,
                            borderWidth: '1px'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.light
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '2px'
                          },
                          '& .MuiSelect-select': {
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            padding: '12px 14px'
                          },
                          '& .MuiSelect-icon': {
                            color: theme.palette.primary.main
                          }
                        })}
                        MenuProps={{
                          PaperProps: {
                            sx: (theme) => ({
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.divider}`,
                              boxShadow: theme.palette.mode === 'light' 
                                ? '0 4px 12px rgba(0,0,0,0.1)' 
                                : '0 4px 12px rgba(0,0,0,0.6)',
                              mt: 1,
                              backgroundColor: theme.palette.background.paper,
                              '& .MuiList-root': {
                                padding: '8px'
                              }
                            })
                          }
                        }}
                      >
                        {gradeOptions.map(y => (
                          <MenuItem 
                            key={y} 
                            value={y}
                            sx={(theme) => ({
                              borderRadius: '4px',
                              margin: '2px 4px',
                              '&:hover': { 
                                backgroundColor: theme.palette.action.hover
                              },
                              '&.Mui-selected': { 
                                backgroundColor: theme.palette.mode === 'light' 
                                  ? theme.palette.action.selected 
                                  : 'rgba(255,255,255,0.12)',
                                fontWeight: 600,
                                '&:hover': { 
                                  backgroundColor: theme.palette.action.selected
                                }
                              }
                            })}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={(theme) => ({ fontWeight: 600, color: theme.palette.text.primary })}>{y}级</Typography>
                              <Chip
                                label="入学年份"
                                size="small"
                                sx={(theme) => ({
                                  backgroundColor: theme.palette.mode === 'light' 
                                    ? theme.palette.primary.light + '33' 
                                    : theme.palette.primary.main + '33',
                                  color: theme.palette.primary.main,
                                  fontSize: '0.7rem',
                                  height: 20
                                })}
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <TextField
                      label="班级名称"
                      value={className}
                      onChange={e => handleClassNameChange(e.target.value)}
                      fullWidth
                      required
                      helperText="班级名称前会自动加上年份后两位数字"
                      sx={(theme) => ({
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: '8px',
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                            borderWidth: '1px'
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.light
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '2px'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          padding: '12px 14px'
                        },
                        '& .MuiInputLabel-root': {
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          '&.Mui-focused': {
                            color: theme.palette.primary.main
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          mt: 1
                        }
                      })}
                      InputProps={{
                        placeholder: "例如: 计算机1班"
                      }}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                    <FormControl fullWidth required>
                      <InputLabel>系部</InputLabel>
                      <Select
                        label="系部"
                        value={departmentId === '' ? '' : departmentId}
                        onChange={e => setDepartmentId(Number(e.target.value))}
                        disabled={depLoading}
                      >
                        {departments.map(d => (
                          <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {formError && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>{formError}</Typography>
                    )}
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={(theme) => ({ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 3,
                  borderTop: `1px solid ${theme.palette.divider}`
                })}>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={handleGoToTeacherManagement}
                    sx={(theme) => ({
                      borderRadius: '12px',
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      textTransform: 'none',
                      padding: '10px 20px',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'light' 
                          ? theme.palette.primary.light + '33' 
                          : theme.palette.primary.main + '22',
                        borderColor: theme.palette.primary.dark
                      }
                    })}
                  >
                    管理教师分配
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !className.trim()}
                    size="large"
                    sx={(theme) => ({
                      borderRadius: '12px',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                      boxShadow: theme.palette.mode === 'light'
                        ? `0 8px 24px ${theme.palette.primary.main}55`
                        : `0 8px 24px ${theme.palette.primary.main}40`,
                      fontWeight: 600,
                      textTransform: 'none',
                      padding: '12px 32px',
                      minWidth: 160,
                      transition: 'transform 0.2s, box-shadow 0.3s',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                        boxShadow: theme.palette.mode === 'light'
                          ? `0 12px 32px ${theme.palette.primary.main}66`
                          : `0 12px 32px ${theme.palette.primary.main}55`,
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        boxShadow: 'none'
                      }
                    })}
                  >
                    {loading ? "创建中..." : "创建班级"}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
}