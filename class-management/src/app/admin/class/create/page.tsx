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
  Grid,
  InputLabel,
  Select,
  FormControl,
  Divider,
  Stack,
  LinearProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";

type Teacher = { id: number; name: string };

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  transition: "box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[8],
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius * 2,
  },
}));

export default function ClassCreatePage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [gradeOptions, setGradeOptions] = useState<number[]>([]);
  const [className, setClassName] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<Teacher[]>([]);
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
      let name = prev.replace(/^\d{2}/, "");
      return yearSuffix + name;
    });
  };

  // 提交
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post("/api/class/create", {
        name: className,
        grade: year,
        teacherId: teacher?.id,
      });
      alert("创建成功！");
      setClassName("");
      setTeacher(null);
    } catch (e: any) {
      alert("创建失败：" + (e?.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      maxWidth: 800,
      mx: "auto",
      mt: 4,
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      <StyledCard>
        {loading && <LinearProgress />}
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={700} color="primary">
              创建新班级
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>年级</InputLabel>
                  <Select
                    label="年级"
                    value={year}
                    onChange={e => handleYearChange(Number(e.target.value))}
                    sx={{ borderRadius: 2 }}
                  >
                    {gradeOptions.map(y => (
                      <MenuItem key={y} value={y}>{y}级</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
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
                    <StyledTextField
                      {...params}
                      label="任教老师"
                      placeholder="搜索老师"
                      required
                      sx={{ width: "140%" }}
                    />
                  )}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                />
              </Grid>
              <Grid item xs={12} sx={{ pt: 0.5 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <StyledButton
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    size="large"
                    sx={{ minWidth: 180 }}
                  >
                    {loading ? "提交中..." : "创建班级"}
                  </StyledButton>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </StyledCard>
    </Box>
  );
}