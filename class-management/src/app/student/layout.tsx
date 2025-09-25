"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

// 学生端布局：仅允许 STUDENT 角色访问，其它角色（管理员/教师）自动跳转到 /admin/dashboard
// 未登录则跳转到 /login（可根据你的实际登录路由调整）
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isStudent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user && !isStudent) {
      // 非学生访问学生路由：重定向到管理端仪表盘
      router.replace('/admin/dashboard');
    }
  }, [user, loading, isStudent, router, pathname]);

  if (loading || !user || !isStudent) {
    return (
      <Box sx={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary">正在加载学生中心...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {children}
    </Box>
  );
}
