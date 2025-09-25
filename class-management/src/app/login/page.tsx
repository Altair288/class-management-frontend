"use client";

import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Typography, TextField, Tabs, Tab,
  CircularProgress, Alert, Stack, useTheme, alpha
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
// import { userAgent } from "next/server";
// import FluidBackground from "@/components/FluidBackground";

type UserType = "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";

export default function AuthPage() {
  const theme = useTheme();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [registerTab, setRegisterTab] = useState<UserType>("STUDENT");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [studentForm, setStudentForm] = useState({
    name: "",
    username: "",
    studentNo: "",
    password: "",
    phone: "",
    email: "",
    classId: ""
  });
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    username: "",
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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [classList, setClassList] = useState<{ id: number; name: string }[]>([]);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showStudentConfirmPassword, setShowStudentConfirmPassword] = useState(false);
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [showTeacherConfirmPassword, setShowTeacherConfirmPassword] = useState(false);
  const [teacherConfirmPassword, setTeacherConfirmPassword] = useState("");
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showParentConfirmPassword, setShowParentConfirmPassword] = useState(false);
  const [parentConfirmPassword, setParentConfirmPassword] = useState("");
  const [showStudentPasswordTip, setShowStudentPasswordTip] = useState(false);

  useEffect(() => {
    // 获取班级列表
    axios.get("/api/users/classes")
      .then(res => setClassList(res.data))
      .catch(() => setClassList([]));
  }, []);

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
      // 登录成功后优先回跳来源
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      router.push(from || "/admin/dashboard");
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

  // 注册校验密码一致
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setFieldErrors({});
    // 密码一致性校验
    if (registerTab === "STUDENT" && studentForm.password !== studentConfirmPassword) {
      setFieldErrors({ password: "两次输入的密码不一致", confirmPassword: "两次输入的密码不一致" });
      setMessage("两次输入的密码不一致");
      setLoading(false);
      return;
    }
    if (registerTab === "TEACHER" && teacherForm.password !== teacherConfirmPassword) {
      setFieldErrors({ password: "两次输入的密码不一致", confirmPassword: "两次输入的密码不一致" });
      setMessage("两次输入的密码不一致");
      setLoading(false);
      return;
    }
    if (registerTab === "PARENT" && parentForm.password !== parentConfirmPassword) {
      setFieldErrors({ password: "两次输入的密码不一致", confirmPassword: "两次输入的密码不一致" });
      setMessage("两次输入的密码不一致");
      setLoading(false);
      return;
    }
    try {
      if (registerTab === "STUDENT") {
        await axios.post("/api/users/register/student", {
          ...removeEmpty({
            ...studentForm,
            classId: studentForm.classId ? Number(studentForm.classId) : undefined,
          }),
        });
      } else if (registerTab === "TEACHER") {
        await axios.post("/api/users/register/teacher", removeEmpty(teacherForm));
      } else if (registerTab === "PARENT") {
        await axios.post("/api/users/register/parent", removeEmpty({
          ...parentForm,
          studentId: parentForm.studentId ? Number(parentForm.studentId) : undefined,
        }));
      }
      setMessage("注册成功，请登录！");
      setIsLogin(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data || "注册失败";
        const errors: { [key: string]: string } = {};
        if (typeof msg === "string") {
          if (msg.includes("学号")) errors.studentNo = msg;
          if (msg.includes("工号")) errors.teacherNo = msg;
          if (msg.includes("用户名")) errors.username = msg;
          if (msg.includes("密码")) errors.password = msg;
          if (msg.includes("手机号")) errors.phone = msg;
          if (msg.includes("邮箱")) errors.email = msg;
          if (msg.includes("教师号")) errors.teacherNo = msg;
          if (msg.includes("家长账号")) errors.parentAccount = msg;
          if (msg.includes("学生账号")) errors.studentAccount = msg;
        }
        setFieldErrors(errors);
        setMessage(typeof msg === "string" ? msg : "注册失败");
      } else {
        setMessage("注册失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setLoginForm({ username: "", password: "" });
    setStudentForm({
      name: "",
      username: "",
      studentNo: "",
      password: "",
      phone: "",
      email: "",
      classId: ""
    });
    setTeacherForm({
      name: "",
      username: "",
      teacherNo: "",
      password: "",
      phone: "",
      email: ""
    });
    setParentForm({
      name: "",
      password: "",
      phone: "",
      email: "",
      studentId: ""
    });
    setStudentConfirmPassword("");
    setTeacherConfirmPassword("");
    setParentConfirmPassword("");
    setMessage("");
    setFieldErrors({}); // 清空错误提示
  };

  function removeEmpty(obj: Record<string, unknown>) {
    const result: Record<string, unknown> = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== "") {
        result[key] = obj[key];
      }
    });
    return result;
  }

  // 隐藏管理员入口：连续点击logo 5次
  let adminTrick = 0;
  const handleLogoClick = () => {
    adminTrick++;
    if (adminTrick >= 5) {
      setMessage("已切换为管理员登录");
      setLoginForm({ username: "", password: "" });
      setIsLogin(true);
      adminTrick = 0;
    }
  };
  return (
    <>
      <CssBaseline />
      {/* 统一背景容器 */}
      <Box 
        sx={{ 
          minHeight: "100vh",
          position: 'relative',
          bgcolor: theme.palette.background.default,
          transition: 'background-color 0.3s ease',
        }}
      >
        {/* 背景图片覆盖整个容器 */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('https://arch.altair288.eu.org:3001/i/6a37db98-65d9-4cb9-986f-7a23de8aa904.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: `blur(2px) brightness(${theme.palette.mode === 'dark' ? '0.5' : '1.1'}) contrast(${theme.palette.mode === 'dark' ? '1.1' : '1.2'})`,
            opacity: theme.palette.mode === 'dark' ? 0.25 : 0.35,
            transition: 'filter 0.3s ease, opacity 0.3s ease',
            zIndex: 0,
          }}
        />
        
        {/* 整体毛玻璃渗透层 */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 25% 50%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 65%),
                        radial-gradient(circle at 75% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 65%),
                        linear-gradient(135deg, 
                          ${alpha(theme.palette.background.default, 0.5)} 0%,
                          ${alpha(theme.palette.background.paper, 0.3)} 50%,
                          ${alpha(theme.palette.background.default, 0.6)} 100%)`,
            backdropFilter: 'blur(0.5px)',
            WebkitBackdropFilter: 'blur(0.5px)',
            zIndex: 1,
          }}
        />

        {/* 主要内容区 - flex布局 */}
        <Box sx={{ 
          position: 'relative',
          zIndex: 2,
          minHeight: "100vh", 
          display: "flex",
        }}>
          {/* 左侧表单 - 无独立背景 */}
          <Box 
            flex={1} 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            sx={{ 
              position: "relative",
              // 完全透明，依赖统一背景
            }}
          >
            <Box width={400} sx={{ position: 'relative' }}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={4} onClick={handleLogoClick} sx={{ cursor: "pointer" }}>
              <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="logo" width={40} height={40} unoptimized />
              <Typography variant="h4" fontWeight={700} color="primary" ml={1}>ClassAble</Typography>
            </Box>
              <Card sx={{ 
                borderRadius: 4, 
                boxShadow: theme.palette.mode === 'dark' 
                  ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}, 
                     0 0 0 1px ${alpha(theme.palette.primary.main, 0.15)}` 
                  : `0 8px 32px ${alpha(theme.palette.grey[400], 0.12)},
                     0 0 0 1px ${alpha(theme.palette.primary.main, 0.06)}`,
                // 强化毛玻璃效果
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.15 : 0.4),
                backdropFilter: 'blur(24px) saturate(1.8) brightness(1.1)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8) brightness(1.1)',
                border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.08 : 0.2)}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 24px 48px ${alpha(theme.palette.common.black, 0.4)}, 
                       0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}` 
                    : `0 24px 48px ${alpha(theme.palette.grey[400], 0.18)},
                       0 0 0 1px ${alpha(theme.palette.primary.main, 0.12)}`,
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.2 : 0.5),
                }
              }}>
              <CardContent>
                <Typography variant="h5" align="center" fontWeight={700} mb={2}>
                  {isLogin ? "登陆" : "注册"}
                </Typography>
                <Typography align="center" color="text.secondary" mb={2}>
                  {isLogin ? "欢迎回来！请选择登录方式。" : "创建您的账户"}
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
                        label="学号 / 用户名"
                        value={loginForm.username}
                        onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                        fullWidth
                        required
                      />
                      <TextField
                        label="密码"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        fullWidth
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="显示密码"
                                onMouseDown={() => setShowLoginPassword(true)}
                                onMouseUp={() => setShowLoginPassword(false)}
                                onMouseLeave={() => setShowLoginPassword(false)}
                                edge="end"
                              >
                                {showLoginPassword ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
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
                      {loading ? "登陆中..." : "登录"}
                    </Button>
                    <Typography align="center" variant="body2">
                      没有账号？{" "}
                      <Button variant="text" size="small" onClick={() => { resetForms(); setIsLogin(false)}} sx={{ color: "primary.main", textTransform: "none" }}>
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
                          <TextField 
                            label="姓名" 
                            value={studentForm.name} 
                            onChange={e => setStudentForm(f => ({ ...f, name: e.target.value, username: e.target.value }))} 
                            fullWidth 
                            required
                            size="small"
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username}
                          />
                          <TextField
                            label="学号"
                            value={studentForm.studentNo}
                            onChange={e => setStudentForm(f => ({ ...f, studentNo: e.target.value }))}
                            fullWidth
                            required
                            size="small"
                            error={!!fieldErrors.studentNo}
                            helperText={fieldErrors.studentNo}
                          />
                          <TextField
                            label="密码"
                            type={showStudentPassword ? "text" : "password"}
                            value={studentForm.password}
                            onChange={e => setStudentForm(f => ({ ...f, password: e.target.value }))}
                            size="small"
                            fullWidth
                            required
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
                            onFocus={() => setShowStudentPasswordTip(true)}
                            onBlur={() => setShowStudentPasswordTip(false)}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowStudentPassword(true)}
                                    onMouseUp={() => setShowStudentPassword(false)}
                                    onMouseLeave={() => setShowStudentPassword(false)}
                                    edge="end"
                                  >
                                    {showStudentPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          {showStudentPasswordTip && (
                            <Alert severity="info" sx={{ fontSize: 13, mt: -1, mb: 1 }}>
                              密码需至少8位，包含大小写字母数字和特殊字符
                            </Alert>
                          )}
                          <TextField
                            label="确认密码"
                            type={showStudentConfirmPassword ? "text" : "password"}
                            value={studentConfirmPassword}
                            onChange={e => setStudentConfirmPassword(e.target.value)}
                            size="small"
                            fullWidth
                            required
                            error={!!fieldErrors.confirmPassword}
                            helperText={fieldErrors.confirmPassword}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowStudentConfirmPassword(true)}
                                    onMouseUp={() => setShowStudentConfirmPassword(false)}
                                    onMouseLeave={() => setShowStudentConfirmPassword(false)}
                                    edge="end"
                                  >
                                    {showStudentConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            label="手机号"
                            value={studentForm.phone}
                            onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))}
                            fullWidth
                            size="small"
                            error={!!fieldErrors.phone}
                            helperText={fieldErrors.phone}
                          />
                          <TextField
                            label="邮箱"
                            value={studentForm.email}
                            onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))}
                            fullWidth
                            size="small"
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email}
                          />
                          {/* 班级下拉选择 */}
                          <Select
                            value={studentForm.classId}
                            onChange={e => setStudentForm(f => ({ ...f, classId: e.target.value }))}
                            displayEmpty
                            size="small"
                            fullWidth
                            required
                          >
                            <MenuItem value="">
                              <em>请选择班级</em>
                            </MenuItem>
                            {classList.map(cls => (
                              <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                            ))}
                          </Select>
                        </Stack>
                      )}
                      {registerTab === "TEACHER" && (
                        <Stack spacing={2} mb={2}>
                          <TextField 
                            label="姓名" 
                            value={teacherForm.name} 
                            onChange={e => setTeacherForm(f => ({ ...f, name: e.target.value, username: e.target.value }))} 
                            fullWidth 
                            required
                            size="small"
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username}
                            />
                          <TextField 
                            label="工号" 
                            value={teacherForm.teacherNo} 
                            onChange={e => setTeacherForm(f => ({ ...f, teacherNo: e.target.value }))} 
                            fullWidth 
                            required
                            size="small"
                            error={!!fieldErrors.teacherNo}
                            helperText={fieldErrors.teacherNo}
                            />
                          <TextField
                            label="密码"
                            type={showTeacherPassword ? "text" : "password"}
                            value={teacherForm.password}
                            onChange={e => setTeacherForm(f => ({ ...f, password: e.target.value }))}
                            fullWidth
                            required
                            onFocus={() => setShowStudentPasswordTip(true)}
                            onBlur={() => setShowStudentPasswordTip(false)}
                            size="small"
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowTeacherPassword(true)}
                                    onMouseUp={() => setShowTeacherPassword(false)}
                                    onMouseLeave={() => setShowTeacherPassword(false)}
                                    edge="end"
                                  >
                                    {showTeacherPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          {showStudentPasswordTip && (
                            <Alert severity="info" sx={{ fontSize: 13, mt: -1, mb: 1 }}>
                              密码需至少8位，包含大小写字母数字和特殊字符
                            </Alert>
                          )}
                          <TextField
                            label="确认密码"
                            type={showTeacherConfirmPassword ? "text" : "password"}
                            value={teacherConfirmPassword}
                            onChange={e => setTeacherConfirmPassword(e.target.value)}
                            fullWidth
                            required
                            size="small"
                            error={!!fieldErrors.confirmPassword}
                            helperText={fieldErrors.confirmPassword}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowTeacherConfirmPassword(true)}
                                    onMouseUp={() => setShowTeacherConfirmPassword(false)}
                                    onMouseLeave={() => setShowTeacherConfirmPassword(false)}
                                    edge="end"
                                  >
                                    {showTeacherConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField 
                            label="手机号" 
                            value={teacherForm.phone} 
                            onChange={e => setTeacherForm(f => ({ ...f, phone: e.target.value }))} 
                            fullWidth 
                            size="small" 
                            error={!!fieldErrors.phone}
                            helperText={fieldErrors.phone}
                          />
                          <TextField 
                            label="邮箱" 
                            value={teacherForm.email} 
                            onChange={e => setTeacherForm(f => ({ ...f, email: e.target.value }))} 
                            fullWidth 
                            size="small"
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email}
                          />
                        </Stack>
                      )}
                      {registerTab === "PARENT" && (
                        <Stack spacing={2} mb={2}>
                          <TextField 
                            label="姓名" 
                            value={parentForm.name} 
                            onChange={e => setParentForm(f => ({ ...f, name: e.target.value }))} 
                            fullWidth 
                            required 
                            size="small" 
                            error={!!fieldErrors.name}
                            helperText={fieldErrors.name}
                          />
                          <TextField 
                            label="手机号" 
                            value={parentForm.phone} 
                            onChange={e => setParentForm(f => ({ ...f, phone: e.target.value }))} 
                            fullWidth 
                            required 
                            size="small"
                            error={!!fieldErrors.phone}
                            helperText={fieldErrors.phone}
                          />
                          <TextField
                            label="密码"
                            type={showParentPassword ? "text" : "password"}
                            value={parentForm.password}
                            onChange={e => setParentForm(f => ({ ...f, password: e.target.value }))}
                            size="small"
                            fullWidth
                            required
                            onFocus={() => setShowStudentPasswordTip(true)}
                            onBlur={() => setShowStudentPasswordTip(false)}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowParentPassword(true)}
                                    onMouseUp={() => setShowParentPassword(false)}
                                    onMouseLeave={() => setShowParentPassword(false)}
                                    edge="end"
                                  >
                                    {showParentPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          {showStudentPasswordTip && (
                            <Alert severity="info" sx={{ fontSize: 13, mt: -1, mb: 1 }}>
                              密码需至少8位，包含大小写字母数字和特殊字符
                            </Alert>
                          )}
                          <TextField
                            label="确认密码"
                            type={showParentConfirmPassword ? "text" : "password"}
                            value={parentConfirmPassword}
                            onChange={e => setParentConfirmPassword(e.target.value)}
                            size="small"
                            fullWidth
                            required
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="显示密码"
                                    onMouseDown={() => setShowParentConfirmPassword(true)}
                                    onMouseUp={() => setShowParentConfirmPassword(false)}
                                    onMouseLeave={() => setShowParentConfirmPassword(false)}
                                    edge="end"
                                  >
                                    {showParentConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField 
                            label="邮箱" 
                            value={parentForm.email} 
                            onChange={e => setParentForm(f => ({ ...f, email: e.target.value }))} 
                            fullWidth 
                            size="small"
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email}
                          />
                          <TextField 
                            label="学生ID" 
                            value={parentForm.studentId} 
                            onChange={e => setParentForm(f => ({ ...f, studentId: e.target.value }))} 
                            fullWidth 
                            required 
                            size="small" 
                            error={!!fieldErrors.studentId}
                            helperText={fieldErrors.studentId}
                          />
                        </Stack>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="medium"
                        disabled={loading}
                        sx={{ mb: 1 }}
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                      >
                        {loading ? "注册中..." : "注册"}
                      </Button>
                      <Typography align="center" variant="body2">
                        已有账号？{" "}
                        <Button variant="text" size="small" onClick={() => {resetForms(); setIsLogin(true)}} sx={{ color: "primary.main", textTransform: "none" }}>
                          去登录
                        </Button>
                      </Typography>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
            <Typography align="center" color="text.secondary" mt={4} fontSize={13}>
              © 2025 ClassAble &nbsp; | &nbsp; Privacy Policy &nbsp; | &nbsp; Terms & Conditions
            </Typography>
          </Box>
        </Box>
          {/* 右侧品牌介绍 - 无独立背景 */}
          <Box
            flex={1}
            sx={{
              position: "relative",
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 8,
              // 完全透明，依赖统一背景
            }}
          >
            {/* 内容区 */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
            <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="logo" width={60} height={60} unoptimized />
            <Typography variant="h4" color="primary" fontWeight={700} mt={2}>
              ClassAble
            </Typography>
            <Typography color="text.secondary" mt={2} fontSize={18} align="center" maxWidth={400}>
              平台用于无缝数据管理和用户洞察，助力学校高效运营，解锁实时分析与灵活功能。
            </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}