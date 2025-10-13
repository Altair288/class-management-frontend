"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Stack, IconButton, InputAdornment, LinearProgress, Tooltip } from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { useTheme as useAppTheme } from "@/context/ThemeContext";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

interface VerifyResp { valid: boolean; expiresAt?: string | number }

// 简单判断是否是测试/开发环境：可以根据 window.location 或者 NODE_ENV
const isPreviewEnv = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  // 规则：localhost / 127. / 内网段 或 query 有 preview=1
  if (host.includes('localhost') || host.startsWith('127.') || host.startsWith('192.168.') || host.startsWith('10.')) return true;
  const sp = new URLSearchParams(window.location.search);
  if (sp.get('preview') === '1') return true;
  return false;
};

function ResetPasswordInner() {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const params = useSearchParams();
  const router = useRouter();
  const { toggleMode, mode } = useAppTheme();
  const token = params.get("token") || params.get("toekn") || ""; // 兼容用户可能拼写错误 toekn
  const [status, setStatus] = useState<"checking"|"invalid"|"valid"|"submitting"|"done"|"preview">("checking");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const preview = isPreviewEnv();
  const [manualToken, setManualToken] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // 密码强度计算 (0-4)
  const passwordScore = (() => {
    const pwd = password;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    // 最高4分，若超出则截断
    if (score > 4) score = 4;
    return score;
  })();

  const strengthLabel = ['极弱', '较弱', '一般', '较强', '很强'][passwordScore];
  const strengthColor = [
    muiTheme.palette.error.main,
    muiTheme.palette.warning.main,
    muiTheme.palette.info.main,
    muiTheme.palette.success.light,
    muiTheme.palette.success.main,
  ][passwordScore];

  // 格式化时间显示
  const formatExpireTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    if(!token) {
      if (preview) {
        setStatus('preview');
        setMessage('预览模式：未提供 token，仅展示界面样式。');
      } else {
        setStatus("invalid");
      }
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const resp = await axios.get<VerifyResp>(`/api/auth/reset/verify?token=${encodeURIComponent(token)}`);
        if (ignore) return;
        if (resp.data.valid) {
            setStatus("valid");
            if(resp.data.expiresAt) setExpiresAt(String(resp.data.expiresAt));
        } else {
            setStatus("invalid");
        }
      } catch (e: unknown) {
        if (ignore) return;
        setStatus("invalid");
        interface ErrWithResp { response?: { data?: { message?: string } }; message?: string }
        if (typeof e === 'object' && e && 'response' in e) {
          const err = e as ErrWithResp;
          setMessage(err?.response?.data?.message || err?.message || "链接无效或已过期");
        } else {
          setMessage("链接无效或已过期");
        }
      }
    })();
    return () => { ignore = true; };
  }, [token, preview]);

  const doReset = async () => {
    if (!password || !confirmPassword) { setMessage("请填写密码"); return; }
    if (password !== confirmPassword) { setMessage("两次输入密码不一致"); return; }
    setStatus("submitting");
    setMessage("");
    try {
      await axios.post(`/api/auth/reset`, { token, newPassword: password });
      setStatus("done");
      setMessage("密码重置成功，3秒后跳转到登录页...");
      setTimeout(()=>router.push("/login"), 3000);
    } catch (e: unknown) {
      setStatus("valid");
      interface ErrWithResp { response?: { data?: { message?: string } }; message?: string }
      if (typeof e === 'object' && e && 'response' in e) {
        const err = e as ErrWithResp;
        setMessage(err?.response?.data?.message || err?.message || "重置失败");
      } else {
        setMessage("重置失败");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        p:2,
        backgroundImage: 'url(https://arch.altair288.eu.org:3001/i/fec3573f-80ef-473f-9afb-e4401dc64e5a.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          // 固定统一遮罩，不随明暗模式变化
          // backgroundColor: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(0px)',
        }
      }}
    >
      <Card 
        sx={{
          width:440,
          maxWidth:"100%",
          minHeight: 480,
          borderRadius:3,
          boxShadow: isDark ? '0 8px 32px 0 rgba(0,0,0,0.6)' : '0 8px 28px -6px rgba(0,0,0,0.18)',
          backgroundColor: isDark ? 'rgba(26,31,46,0.5)' : 'rgba(255,255,255,0.60)', // 降低透明度
          backdropFilter: 'blur(24px) saturate(180%)', // 增强模糊和饱和度
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'}`, // 边框更淡
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography 
            variant="h4" 
            fontWeight={600} 
            mb={3}
            sx={{
              color: muiTheme.palette.primary.main,
              textAlign: 'center',
            }}
          >
            重置密码
          </Typography>
          {status === 'preview' && (
            <Box sx={{position:'absolute', top:16, right:16}}>
              <Tooltip title={`当前：${mode==='light'?'浅色':'深色'}，点击切换`}>
                <IconButton aria-label="toggle theme" onClick={toggleMode} size="small"
                  sx={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)',
                    '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }
                  }}
                >
                  {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          )}
          {status === "checking" && (
            <Box textAlign="center" py={4}><CircularProgress /></Box>
          )}
          {status === "invalid" && (
            <Box sx={{mb:3}}>
              <Alert severity="error" sx={{mb:2, borderRadius: 2}}>{message || "链接无效或已过期，请重新发起忘记密码请求。"}</Alert>
              <Typography variant="body2" color="text.secondary" sx={{mb:1}}>可在此手动输入 token 测试：</Typography>
              <Stack direction="row" spacing={1}>
                <TextField size="small" fullWidth placeholder="粘贴 token" value={manualToken} onChange={e=>setManualToken(e.target.value)} />
                <Button variant="outlined" disabled={!manualToken} onClick={async()=>{
                  setMessage('');
                  setStatus('checking');
                  try {
                    const resp = await axios.get<VerifyResp>(`/api/auth/reset/verify?token=${encodeURIComponent(manualToken)}`);
                    if (resp.data.valid) {
                      setStatus('valid');
                      if (resp.data.expiresAt) setExpiresAt(String(resp.data.expiresAt));
                    } else {
                      setStatus('invalid');
                      setMessage('Token 无效');
                    }
                  } catch {
                    setStatus('invalid');
                    setMessage('验证失败');
                  }
                }}>验证</Button>
              </Stack>
            </Box>
          )}
          {(status !== "checking" && status !== "invalid") && (
            <>
              {message && (
                <Alert
                  severity={status === "done" ? "success":"info"}
                  sx={{
                    mb:2,
                    borderRadius: 2,
                    color: status === 'done'
                      ? muiTheme.palette.success.contrastText
                      : muiTheme.palette.mode === 'dark'
                        ? muiTheme.palette.text.primary
                        : muiTheme.palette.text.primary,
                    '& .MuiAlert-icon': {
                      color: status === 'done' ? muiTheme.palette.success.light : muiTheme.palette.info.light
                    }
                  }}
                >{message}</Alert>
              )}
              {status !== "done" && (
                <Stack spacing={2.5}>
                  {status === 'preview' && (
                    <Alert severity="info" sx={{borderRadius:2}}>
                      预览模式：未携带 token，提交按钮已禁用。可附加 ?token=xxx 或使用上方输入框验证。
                    </Alert>
                  )}
                  {expiresAt && (
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        backgroundColor: isDark ? 'rgba(100,181,246,0.12)' : 'rgba(25,118,210,0.08)',
                        padding: 1.25,
                        borderRadius: 2,
                        borderLeft: `3px solid ${muiTheme.palette.primary.main}`,
                        color: muiTheme.palette.text.secondary,
                      }}
                    >
                      链接有效期至：{formatExpireTime(expiresAt)}
                    </Typography>
                  )}
                  <TextField
                    label="新密码"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
                        transition: 'background-color .25s ease, box-shadow .25s ease',
                        '& fieldset': {
                          borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
                        },
                        '&:hover fieldset': {
                          borderColor: muiTheme.palette.primary.main
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: muiTheme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${muiTheme.palette.primary.main}33`
                        },
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.95)'
                        },
                        '&.Mui-focused': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,1)'
                        },
                        '& input': {
                          color: muiTheme.palette.text.primary,
                        },
                        '& input::placeholder': {
                          color: muiTheme.palette.text.secondary,
                          opacity: 0.65
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: muiTheme.palette.text.secondary
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: muiTheme.palette.primary.main
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPwd ? '隐藏密码' : '显示密码'}
                            onClick={() => setShowPwd(v=>!v)}
                            edge="end"
                            size="small"
                          >
                            {showPwd ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {password && (
                    <Box>
                      <Box sx={{display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.5}}>
                        <Typography variant="caption" color="text.secondary">密码强度</Typography>
                        <Typography variant="caption" sx={{color: strengthColor}}>{strengthLabel}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(passwordScore/4)*100}
                        sx={{
                          height:8,
                          borderRadius:4,
                          [`& .MuiLinearProgress-bar`]: { backgroundColor: strengthColor }
                        }}
                        aria-label="password strength"
                      />
                    </Box>
                  )}
                  <Alert
                    severity="info"
                    sx={{
                      fontSize:12,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(99,179,237,0.10)' : 'rgba(23,162,184,0.08)',
                      color: muiTheme.palette.mode === 'dark' ? muiTheme.palette.info.light : muiTheme.palette.info.dark,
                      '& .MuiAlert-icon': { color: muiTheme.palette.info.main }
                    }}
                  >
                    密码需至少 8 位，建议包含大小写字母、数字与特殊字符。
                  </Alert>
                  <TextField
                    label="确认新密码"
                    type={showPwd2 ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e=>setConfirmPassword(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
                        transition: 'background-color .25s ease, box-shadow .25s ease',
                        '& fieldset': {
                          borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
                        },
                        '&:hover fieldset': {
                          borderColor: muiTheme.palette.primary.main
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: muiTheme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${muiTheme.palette.primary.main}33`
                        },
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.95)'
                        },
                        '&.Mui-focused': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,1)'
                        },
                        '& input': {
                          color: muiTheme.palette.text.primary,
                        },
                        '& input::placeholder': {
                          color: muiTheme.palette.text.secondary,
                          opacity: 0.65
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: muiTheme.palette.text.secondary
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: muiTheme.palette.primary.main
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPwd2 ? '隐藏密码' : '显示密码'}
                            onClick={() => setShowPwd2(v=>!v)}
                            edge="end"
                            size="small"
                          >
                            {showPwd2 ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    disabled={status==="submitting" || status==="preview"}
                    onClick={doReset}
                    startIcon={status==="submitting" ? <CircularProgress size={18} color="inherit" /> : undefined}
                    sx={{
                      mt: 1,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.primary.dark} 90%)`,
                      boxShadow: isDark
                        ? '0 4px 14px rgba(0,0,0,0.55)'
                        : '0 4px 12px rgba(25,118,210,0.35)',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${muiTheme.palette.primary.dark} 0%, ${muiTheme.palette.primary.main} 90%)`,
                        boxShadow: isDark
                          ? '0 6px 18px rgba(0,0,0,0.65)'
                          : '0 6px 16px rgba(25,118,210,0.45)'
                      },
                      '&:disabled': {
                        background: muiTheme.palette.action.disabledBackground,
                        color: muiTheme.palette.action.disabled,
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {status==="preview"?"预览模式 (禁用)": status==="submitting"?"提交中...":"提交"}
                  </Button>
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{padding:40,textAlign:'center'}}>加载中...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
