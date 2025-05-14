"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/themes/theme"; // 确保路径正确
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack
} from "@mui/material";

type UserType = "STUDENT" | "TEACHER" | "PARENT";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    userType: "STUDENT" as UserType,
    relatedId: "",
    password: "",
  });
  const [message, setMessage] = useState("");

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
      router.push("admin/dashboard");
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
      await axios.post("/api/users/register", {
        userType: registerForm.userType,
        relatedId: registerForm.relatedId,
        password: registerForm.password,
      });
      setMessage("注册成功，请登录！");
      setIsLogin(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data || "注册失败");
      } else {
        setMessage("注册失败");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: "linear-gradient(135deg, #1976d2 0%, #90caf9 100%)" }}>
        <Card sx={{ borderRadius: 3, boxShadow: 6, width: 370 }}>
          <CardContent>
            <Typography variant="h5" align="center" color="primary" fontWeight={700} mb={3}>
              {isLogin ? "用户登录" : "用户注册"}
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
                    autoComplete="username"
                  />
                  <TextField
                    label="密码"
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    fullWidth
                    required
                    autoComplete="current-password"
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
                  {loading ? "登录中..." : "登录"}
                </Button>
                <Typography align="center" variant="body2">
                  没有账号？{' '}
                  <Button variant="text" size="small" onClick={() => setIsLogin(false)} sx={{ color: 'primary.main', textTransform: 'none' }}>
                    去注册
                  </Button>
                </Typography>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <Stack spacing={2} mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>用户类型</InputLabel>
                    <Select
                      label="用户类型"
                      value={registerForm.userType}
                      onChange={e => setRegisterForm(f => ({ ...f, userType: e.target.value as UserType }))}
                    >
                      <MenuItem value="STUDENT">学生</MenuItem>
                      <MenuItem value="TEACHER">教师</MenuItem>
                      <MenuItem value="PARENT">家长</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="关联ID（学生/教师/家长ID）"
                    value={registerForm.relatedId}
                    onChange={e => setRegisterForm(f => ({ ...f, relatedId: e.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="密码"
                    type="password"
                    value={registerForm.password}
                    onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
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
                  {loading ? "注册中..." : "注册"}
                </Button>
                <Typography align="center" variant="body2">
                  已有账号？{' '}
                  <Button variant="text" size="small" onClick={() => setIsLogin(true)} sx={{ color: 'primary.main', textTransform: 'none' }}>
                    去登录
                  </Button>
                </Typography>
              </form>
            )}
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}