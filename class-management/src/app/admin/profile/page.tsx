"use client";

import { useEffect, useState } from 'react';
import { getCurrentUser, CurrentUser } from '@/services/userService';
import { Box, Card, CardContent, Typography, Divider, Chip, Skeleton } from '@mui/material';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function AdminProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
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
