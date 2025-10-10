"use client";

import { useEffect, useState } from 'react';
import { getCurrentUser, CurrentUser, updateProfile } from '@/services/userService';
import { Box, Card, CardContent, Typography, Divider, Chip, Skeleton, TextField, Button, Stack, Alert } from '@mui/material';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function AdminProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 编辑状态
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // 校验：大陆手机号 1[3-9]\d{9}；允许空
  const isValidPhone = (p: string) => !p || /^1[3-9]\d{9}$/.test(p);
  // 简易邮箱校验，与后端一致
  const isValidEmail = (e: string) => !e || /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(e);
  const dirty = (u: CurrentUser, p: string, m: string) => (p !== (u.phone || '')) || (m !== (u.email || ''));
  const formValid = (p: string, m: string) => isValidPhone(p) && isValidEmail(m);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
  setUser(u);
  setPhone(u.phone || '');
  setEmail(u.email || '');
      } catch (e: unknown) {
        const err = e as { response?: { data?: unknown }; message?: string };
        let extracted: string | undefined;
        const data = err.response?.data;
        if (data && typeof data === 'object' && 'message' in data) {
          extracted = (data as { message?: string }).message;
        } else if (typeof data === 'string') {
          extracted = data;
        }
        const msg = extracted || err.message || '加载失败';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>个人信息</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: theme => `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>基础信息</Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Skeleton variant="rectangular" height={120} />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : user ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Line label="用户名" value={user.username} />
                <Line label="用户类型" value={user.userType} />
                {user.relatedId && <Line label="关联ID" value={user.relatedId} />}
                {user.classMonitor && <Line label="班长" value={<Chip label="是" color="primary" size="small" />} />}
                {user.monitorClassId && <Line label="管理班级ID" value={user.monitorClassId} />}
                <Line label="手机号" value={editing ? (
                  <TextField
                    size="small"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setSaveError(null); setSaveSuccess(null); }}
                    placeholder="可为空"
                    error={!!phone && !isValidPhone(phone)}
                    helperText={phone && !isValidPhone(phone) ? '手机号格式不合法' : ' '}
                    sx={{ maxWidth: 260 }}
                  />
                ) : (user.phone || <span style={{color:'#999'}}>未填写</span>)} />
                <Line label="邮箱" value={editing ? (
                  <TextField
                    size="small"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setSaveError(null); setSaveSuccess(null); }}
                    placeholder="可为空"
                    error={!!email && !isValidEmail(email)}
                    helperText={email && !isValidEmail(email) ? '邮箱格式不合法' : ' '}
                    sx={{ maxWidth: 260 }}
                  />
                ) : (user.email || <span style={{color:'#999'}}>未填写</span>)} />
                <Box sx={{ mt: 1 }}>
                  {editing ? (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={saving || !dirty(user, phone, email) || !formValid(phone, email)}
                        onClick={async () => {
                          setSaving(true); setSaveError(null); setSaveSuccess(null);
                          try {
                            const payload: Record<string, string> = {};
                            if (phone !== user.phone) payload.phone = phone === '' ? '' : phone; // 空串表示清空
                            if (email !== user.email) payload.email = email === '' ? '' : email;
                            if (Object.keys(payload).length === 0) { setSaveSuccess('无修改'); return; }
                            const updated = await updateProfile(payload);
                            setUser(updated);
                            setPhone(updated.phone || '');
                            setEmail(updated.email || '');
                            setSaveSuccess('已保存');
                            setEditing(false);
                          } catch (e: unknown) {
                            const err = e as { response?: { data?: unknown }, message?: string };
                            let extracted: string | undefined;
                            const dataObj = err?.response?.data;
                            if (dataObj && typeof dataObj === 'object' && 'message' in dataObj) {
                              extracted = (dataObj as { message?: string }).message;
                            }
                            const msg = extracted || err?.message || '保存失败';
                            setSaveError(msg);
                          } finally { setSaving(false); }
                        }}
                      >保存</Button>
                      <Button size="small" variant="outlined" disabled={saving} onClick={() => {
                        setEditing(false);
                        setPhone(user.phone || '');
                        setEmail(user.email || '');
                        setSaveError(null); setSaveSuccess(null);
                      }}>取消</Button>
                    </Stack>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => { setEditing(true); setSaveError(null); setSaveSuccess(null); }}>编辑联系方式</Button>
                  )}
                </Box>
                {saveError && <Alert severity="error" sx={{ mt:1, p:0.5 }}>{saveError}</Alert>}
                {saveSuccess && <Alert severity="success" sx={{ mt:1, p:0.5 }}>{saveSuccess}</Alert>}
              </Box>
            ) : null}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: theme => `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>修改密码</Typography>
            <Divider sx={{ mb: 2 }} />
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', fontSize: 14 }}>
      <Box sx={{ width: 110, color: 'text.secondary' }}>{label}</Box>
      <Box sx={{ flex: 1, fontWeight: 500 }}>{value}</Box>
    </Box>
  );
}
