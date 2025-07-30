"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  Chip,
  Grid,
  InputLabel,
  Select,
  FormControl,
  OutlinedInput,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

type Teacher = { id: number; name: string };
type Student = { id: number; name: string; studentNo: string };

export default function ClassCreatePage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [gradeOptions, setGradeOptions] = useState<number[]>([]);
  const [className, setClassName] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<Teacher[]>([]);
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 年级下拉
  useEffect(() => {
    const now = new Date().getFullYear();
    const arr = [];
    for (let y = 2020; y <= now; y++) arr.push(y);
    setGradeOptions(arr.reverse());
  }, []);

  // 获取老师列表
  useEffect(() => {
    axios.get("/api/users/teacher/all").then(res => {
      setTeacherOptions(res.data);
    });
  }, []);

  // 获取学生列表
  useEffect(() => {
    axios.get("/api/users/student/all").then(res => {
      setStudentOptions(res.data);
    });
  }, []);

  // 自动加年份前缀
  const handleClassNameChange = (val: string) => {
    // 自动加上年份后两位
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
      // 去掉原有前缀
      let name = prev.replace(/^\d{2}/, "");
      return yearSuffix + name;
    });
  };

  // Excel导入
  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  // 提交
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. 先上传excel并注册学生（如有excel）
      let newStudentIds: number[] = [];
      if (excelFile) {
        const formData = new FormData();
        formData.append("file", excelFile);
        const res = await axios.post("/api/class/import-students", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newStudentIds = res.data.studentIds; // 假设返回新注册学生id数组
      }
      // 2. 创建班级
      const res = await axios.post("/api/class/create", {
        name: className,
        grade: year,
        teacherId: teacher?.id,
        studentIds: [
          ...selectedStudents.map(s => s.id),
          ...newStudentIds,
        ],
      });
      alert("创建成功！");
      // 可跳转到班级列表
    } catch (e: any) {
      alert("创建失败：" + (e?.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3}>
            创建班级
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>年级</InputLabel>
                <Select
                  label="年级"
                  value={year}
                  onChange={e => handleYearChange(Number(e.target.value))}
                >
                  {gradeOptions.map(y => (
                    <MenuItem key={y} value={y}>{y}级</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="班级名称"
                value={className}
                onChange={e => handleClassNameChange(e.target.value)}
                fullWidth
                required
                helperText="班级名称前自动加上年份后两位"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={teacherOptions}
                getOptionLabel={option => option.name}
                value={teacher}
                onChange={(_, val) => setTeacher(val)}
                renderInput={params => (
                  <TextField {...params} label="任教老师" placeholder="搜索老师" required />
                )}
                isOptionEqualToValue={(o, v) => o.id === v.id}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={studentOptions}
                getOptionLabel={option => `${option.name}（${option.studentNo}）`}
                value={selectedStudents}
                onChange={(_, val) => setSelectedStudents(val)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={`${option.name}（${option.studentNo}）`} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="添加学生" placeholder="可多选" />
                )}
                isOptionEqualToValue={(o, v) => o.id === v.id}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{ mr: 2 }}
              >
                Excel批量导入学生
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleExcelChange}
                />
              </Button>
              {excelFile && (
                <Typography variant="body2" color="text.secondary" display="inline">
                  已选择文件：{excelFile.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? "提交中..." : "创建班级"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}