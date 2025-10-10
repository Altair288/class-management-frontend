"use client";

import { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { changePassword } from '@/services/userService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  interface AuthLike {
    refreshUser?: () => Promise<void>; 
  setUser?: (u: unknown) => void; // 宽松类型
  }
  const auth = useAuth() as unknown as AuthLike;
  const refreshUser = auth.refreshUser;
  const setUser = auth.setUser;

  const canSubmit = oldPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await changePassword({ oldPassword, newPassword, confirmPassword });
      setSuccess(res.message || '修改成功');
      if (res.forceReLogin) {
        // 清理本地用户并跳转登录
        try {
          if (setUser) setUser(null);
        } catch {
          /* ignore */
        }
        setTimeout(() => router.push('/login'), 1200);
      } else {
        try { await refreshUser?.(); } catch {}
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const httpErr = err as { response?: { data?: unknown } ; message?: string };
      const data = httpErr?.response?.data;
      let extracted: string | undefined;
      if (data && typeof data === 'object' && 'message' in data) {
        extracted = (data as { message?: string }).message;
      }
      const msg = extracted || (typeof data === 'string' ? data : undefined) || httpErr.message || '修改失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420 }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
      <TextField
        type={showOld ? "text" : "password"}
        label="旧密码"
        size="small"
        value={oldPassword}
        onChange={e => setOldPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label="toggle old password" onClick={() => setShowOld(s => !s)} edge="end" size="small">
                {showOld ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          )
        }}
        required
      />
      <TextField
        type={showNew ? "text" : "password"}
        label="新密码"
        size="small"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        helperText="8-20 位，需包含大小写字母、数字和特殊字符"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label="toggle new password" onClick={() => setShowNew(s => !s)} edge="end" size="small">
                {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          )
        }}
        required
      />
      <TextField
        type={showConfirm ? "text" : "password"}
        label="确认新密码"
        size="small"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        error={!!confirmPassword && confirmPassword !== newPassword}
        helperText={confirmPassword && confirmPassword !== newPassword ? '两次密码不一致' : '确认新密码'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label="toggle confirm password" onClick={() => setShowConfirm(s => !s)} edge="end" size="small">
                {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          )
        }}
        required
      />
      <Button type="submit" variant="contained" disabled={!canSubmit || loading} sx={{ textTransform: 'none' }}>
        {loading ? <CircularProgress size={22} /> : '修改密码'}
      </Button>
    </Box>
  );
}
