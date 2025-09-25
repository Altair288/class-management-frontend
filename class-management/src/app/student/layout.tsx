"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, GlobalStyles } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NotificationProvider } from '@/context/NotificationContext';
import StudentTopbar from '@/components/StudentTopbar';
import StudentBottomNav from '@/components/StudentBottomNav';

// 学生端布局：仅允许 STUDENT 角色访问，其它角色（管理员/教师）自动跳转到 /admin/dashboard
// 未登录则跳转到 /login（可根据你的实际登录路由调整）
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isStudent, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 避免刚登录跳转到学生页时，由于用户信息请求存在瞬时延迟导致的闪烁：
  // 当第一次发现 !user 且 loading 已结束时，先尝试 refresh 并等待一个短暂窗口；
  // 若窗口后仍无用户再真正跳转到 /login。
  useEffect(() => {
    if (loading) return; // 还在加载，继续等待

    if (!user) {
      // 立刻再拉一次，防止 cookie/会话刚写入还没被第一轮捕获
      refresh();
      const timer = setTimeout(() => {
        // 二次检查仍然没有用户才跳转 login，减少“闪一下”体验
        if (!user) router.replace('/login');
      }, 550); // 0.5 秒缓冲
      return () => clearTimeout(timer);
    }

    if (user && !isStudent) {
      router.replace('/admin/dashboard');
    }
  }, [user, loading, isStudent, router, pathname, refresh]);

  const theme = useTheme();

  if (loading || !user || !isStudent) {
    return (
      <Box sx={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary">正在加载学生中心...</Typography>
      </Box>
    );
  }

  return (
    <NotificationProvider userId={user?.id}>
      {/* 全局仅作用于学生区的玻璃态样式 */}
      <GlobalStyles styles={(t)=>({
        '.student-main-area .MuiCard-root': {
          backgroundColor: alpha(t.palette.background.paper, t.palette.mode==='dark'?0.18:0.55),
          backdropFilter: 'blur(18px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          border: `1px solid ${alpha(t.palette.common.white, t.palette.mode==='dark'?0.06:0.35)}`,
          boxShadow: t.palette.mode==='dark'
            ? '0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          transition: 'background-color .4s ease, box-shadow .4s ease, border-color .4s ease'
        },
        '.student-main-area .MuiCard-root:hover': {
          backgroundColor: alpha(t.palette.background.paper, t.palette.mode==='dark'?0.24:0.62),
          boxShadow: t.palette.mode==='dark'
            ? '0 10px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 16px 48px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05)'
        },
        '.student-main-area .MuiTextField-root .MuiOutlinedInput-root': {
          backgroundColor: alpha(t.palette.background.paper, t.palette.mode==='dark'?0.12:0.5),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }
      })} />
      <StudentTopbar />
      {/* 背景容器：柔和渐变 + 多个径向光斑 + 轻噪点叠加 */}
      <Box sx={{ position: 'relative', minHeight: '100vh', pt: '64px', pb: '72px' }}>
        <Box
          sx={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: theme.palette.mode==='dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.default,0.92)} 0%, ${alpha(theme.palette.background.paper,0.85)} 60%),
                 radial-gradient(circle at 18% 22%, ${alpha(theme.palette.primary.main,0.25)} 0%, transparent 55%),
                 radial-gradient(circle at 82% 28%, ${alpha(theme.palette.secondary.main,0.22)} 0%, transparent 60%),
                 radial-gradient(circle at 50% 90%, ${alpha(theme.palette.success.main,0.18)} 0%, transparent 65%)`
              : `linear-gradient(135deg, #ffffffcc 0%, #f8fafc 55%, #eef3f8 100%),
                 radial-gradient(circle at 15% 25%, ${alpha(theme.palette.primary.main,0.15)} 0%, transparent 55%),
                 radial-gradient(circle at 85% 30%, ${alpha(theme.palette.secondary.main,0.12)} 0%, transparent 60%),
                 radial-gradient(circle at 50% 85%, ${alpha(theme.palette.success.main,0.12)} 0%, transparent 65%)`,
            overflow: 'hidden'
          }}
        >
          {/* 轻噪点纹理层 */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\' viewBox=\'0 0 160 160\'%3E%3Crect fill=\'%23ffffff\' opacity=\'0\' width=\'160\' height=\'160\'/%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23000000\' opacity=\'0.06\'/%3E%3C/svg%3E")',
            opacity: theme.palette.mode==='dark'?0.15:0.25,
            mixBlendMode: theme.palette.mode==='dark'?'normal':'multiply'
          }} />
        </Box>
        <Box
          className="student-main-area"
          component="main"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 2, md: 3 },
            minHeight: 'calc(100vh - 64px - 72px)'
          }}
        >
          {children}
        </Box>
      </Box>
      <StudentBottomNav />
    </NotificationProvider>
  );
}
