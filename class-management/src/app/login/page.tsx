"use client";

import { useState } from "react";
import {
  Box, Button, Card, CardContent, Typography, TextField, Tabs, Tab,
  CircularProgress, Alert, Stack
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/themes/theme";
import axios from "axios";
import { useRouter } from "next/navigation";

type UserType = "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [registerTab, setRegisterTab] = useState<UserType>("STUDENT");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [studentForm, setStudentForm] = useState({
    name: "",
    studentNo: "",
    password: "",
    phone: "",
    email: "",
    classId: ""
  });
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    teacherNo: "",
    password: "",
    phone: "",
    email: ""
  });
  const [parentForm, setParentForm] = useState({
    name: "",
    password: "",
    phone: "",
    email: "",
    studentId: ""
  });
  const [message, setMessage] = useState("");
  const [adminTrick, setAdminTrick] = useState(0);

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post(
        "/api/users/login",
        new URLSearchParams(loginForm),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      setMessage("登录成功！");
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data || "登录失败";
        setMessage(msg);
      } else {
        setMessage("登录失败");
      }
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (registerTab === "STUDENT") {
        await axios.post("/api/users/register/student", {
          ...studentForm,
          classId: studentForm.classId ? Number(studentForm.classId) : undefined,
        });
      } else if (registerTab === "TEACHER") {
        await axios.post("/api/users/register/teacher", teacherForm);
      } else if (registerTab === "PARENT") {
        await axios.post("/api/users/register/parent", {
          ...parentForm,
          studentId: parentForm.studentId ? Number(parentForm.studentId) : undefined,
        });
      }
      setMessage("注册成功，请登录！");
      setIsLogin(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data || "注册失败";
        setMessage(msg);
      } else {
        setMessage("注册失败");
      }
    } finally {
      setLoading(false);
    }
  };

  // 隐藏管理员入口：连续点击logo 5次
  const handleLogoClick = () => {
    setAdminTrick((v) => {
      if (v >= 4) {
        setMessage("已切换为管理员登录");
        setLoginForm({ username: "", password: "" });
        setIsLogin(true);
        return 0;
      }
      return v + 1;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex" }}>
        {/* 左侧表单 */}
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
          <Box width={400}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={4} onClick={handleLogoClick} sx={{ cursor: "pointer" }}>
              <img src="/logo.svg" alt="logo" width={40} />
              <Typography variant="h4" fontWeight={700} color="primary" ml={1}>ClassAble</Typography>
            </Box>
            <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
              <CardContent>
                <Typography variant="h5" align="center" fontWeight={700} mb={2}>
                  {isLogin ? "Sign In" : "Sign Up"}
                </Typography>
                <Typography align="center" color="text.secondary" mb={2}>
                  {isLogin ? "Welcome back! Select the method of login." : "Create your account"}
                </Typography>
                {message && (
                  <Alert severity={message.includes("成功") ? "success" : "info"} sx={{ mb: 2 }}>
                    {message}
                  </Alert>
                )}
                {isLogin ? (
                  <form onSubmit={handleLogin}>
                    <Stack spacing={2} mb={2}>
                      <TextField
                        label="用户名"
                        value={loginForm.username}
                        onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                        fullWidth
                        required
                      />
                      <TextField
                        label="密码"
                        type="password"
                        value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        fullWidth
                        required
                      />
                    </Stack>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{ mb: 1 }}
                      startIcon={loading && <CircularProgress size={20} color="inherit" />}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                    <Typography align="center" variant="body2">
                      没有账号？{" "}
                      <Button variant="text" size="small" onClick={() => setIsLogin(false)} sx={{ color: "primary.main", textTransform: "none" }}>
                        去注册
                      </Button>
                    </Typography>
                  </form>
                ) : (
                  <>
                    <Tabs
                      value={registerTab}
                      onChange={(_, val) => setRegisterTab(val)}
                      variant="fullWidth"
                      sx={{ mb: 2 }}
                    >
                      <Tab label="学生注册" value="STUDENT" />
                      <Tab label="教师注册" value="TEACHER" />
                      <Tab label="家长注册" value="PARENT" />
                    </Tabs>
                    <form onSubmit={handleRegister}>
                      {registerTab === "STUDENT" && (
                        <Stack spacing={2} mb={2}>
                          <TextField label="姓名" value={studentForm.name} onChange={e => setStudentForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
                          <TextField label="学号" value={studentForm.studentNo} onChange={e => setStudentForm(f => ({ ...f, studentNo: e.target.value }))} fullWidth required />
                          <TextField label="密码" type="password" value={studentForm.password} onChange={e => setStudentForm(f => ({ ...f, password: e.target.value }))} fullWidth required />
                          <TextField label="手机号" value={studentForm.phone} onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
                          <TextField label="邮箱" value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} fullWidth />
                          <TextField label="班级ID" value={studentForm.classId} onChange={e => setStudentForm(f => ({ ...f, classId: e.target.value }))} fullWidth />
                        </Stack>
                      )}
                      {registerTab === "TEACHER" && (
                        <Stack spacing={2} mb={2}>
                          <TextField label="姓名" value={teacherForm.name} onChange={e => setTeacherForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
                          <TextField label="工号" value={teacherForm.teacherNo} onChange={e => setTeacherForm(f => ({ ...f, teacherNo: e.target.value }))} fullWidth required />
                          <TextField label="密码" type="password" value={teacherForm.password} onChange={e => setTeacherForm(f => ({ ...f, password: e.target.value }))} fullWidth required />
                          <TextField label="手机号" value={teacherForm.phone} onChange={e => setTeacherForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
                          <TextField label="邮箱" value={teacherForm.email} onChange={e => setTeacherForm(f => ({ ...f, email: e.target.value }))} fullWidth />
                        </Stack>
                      )}
                      {registerTab === "PARENT" && (
                        <Stack spacing={2} mb={2}>
                          <TextField label="姓名" value={parentForm.name} onChange={e => setParentForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
                          <TextField label="手机号" value={parentForm.phone} onChange={e => setParentForm(f => ({ ...f, phone: e.target.value }))} fullWidth required />
                          <TextField label="密码" type="password" value={parentForm.password} onChange={e => setParentForm(f => ({ ...f, password: e.target.value }))} fullWidth required />
                          <TextField label="邮箱" value={parentForm.email} onChange={e => setParentForm(f => ({ ...f, email: e.target.value }))} fullWidth />
                          <TextField label="学生ID" value={parentForm.studentId} onChange={e => setParentForm(f => ({ ...f, studentId: e.target.value }))} fullWidth required />
                        </Stack>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{ mb: 1 }}
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                      >
                        {loading ? "注册中..." : "注册"}
                      </Button>
                      <Typography align="center" variant="body2">
                        已有账号？{" "}
                        <Button variant="text" size="small" onClick={() => setIsLogin(true)} sx={{ color: "primary.main", textTransform: "none" }}>
                          去登录
                        </Button>
                      </Typography>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
            <Typography align="center" color="text.secondary" mt={4} fontSize={13}>
              © 2024 ClassAble &nbsp; | &nbsp; Privacy Policy &nbsp; | &nbsp; Terms & Conditions
            </Typography>
          </Box>
        </Box>
        {/* 右侧品牌介绍 */}
        <Box
          flex={1}
          sx={{
            bgcolor: "#f5f6fd",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 8,
          }}
        >
          <img src="/logo.svg" alt="logo" width={60} />
          <Typography variant="h4" color="primary" fontWeight={700} mt={2}>
            ClassAble
          </Typography>
          <Typography color="text.secondary" mt={2} fontSize={18} align="center" maxWidth={400}>
            平台用于无缝数据管理和用户洞察，助力学校高效运营，解锁实时分析与灵活功能。
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}