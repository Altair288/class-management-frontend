import { useState, useMemo, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
// import InputBase from "@mui/material/InputBase";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { useTheme, alpha } from "@mui/material/styles";
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import NotificationBadge from "./NotificationBadge";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import OutboxIcon from '@mui/icons-material/Outbox';
// 角色图标已移除显示，如需恢复可重新引入 School / WorkspacePremium 等
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from "./ThemeToggle";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, loading, isStudent, isAdmin, isTeacher, refresh } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const theme = useTheme();

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 登出功能
  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
    } catch { }
    await refresh();
    try { localStorage.setItem('auth:changed', Date.now().toString()); } catch { }
    handleClose();
    router.push('/login');
  };

  // 角色标题与图标
  const roleTitle = useMemo(() => {
    if (isStudent) return '学生中心';
    if (isTeacher) return '教师工作台';
    if (isAdmin) return 'ClassAble学生管理平台';
    return '系统';
  }, [isStudent, isTeacher, isAdmin]);

  // 环境标识（非生产展示）
  const appEnv = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_APP_ENV : undefined;
  const showEnv = appEnv && !['prod', 'production', ''].includes(appEnv.toLowerCase());

  // 滚动阴影（如果未来需要监听 scroll，可在 layout 中传入）
  const [elevated, setElevated] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const sc = window.scrollY || 0;
      setElevated(sc > 4);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        backdropFilter: 'blur(12px) saturate(160%)',
        WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        bgcolor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.72)
          : alpha(theme.palette.background.paper, 0.85),
        borderBottom: `1px solid ${alpha(theme.palette.divider, elevated ? 0.9 : 0.6)}`,
        boxShadow: elevated ? (theme.palette.mode === 'dark'
          ? '0 4px 12px -4px rgba(0,0,0,0.55)' : '0 6px 18px -6px rgba(31,59,88,0.18)') : 'none',
        backdropSaturation: '180%',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1201,
        transition: 'background-color .35s ease, border-color .35s ease, box-shadow .35s ease',
      }}
    >
      <IconButton onClick={onMenuClick} sx={{ mr: 2 }}>
        <MenuIcon />
      </IconButton>
      <Box sx={{
        flex: 0,
        mr: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        whiteSpace: 'nowrap',
        height: '100%'
      }}>
        {loading ? (
          <Skeleton variant='text' width={96} height={28} sx={{ borderRadius: 1 }} />
        ) : (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              letterSpacing: '.5px',
              fontSize: 18,
              lineHeight: 1.1,
              m: 0,
              p: 0
            }}
          >
            {roleTitle}
          </Typography>
        )}
        {showEnv && (
          <Chip size="small" label={appEnv} color="warning" sx={{ ml: .5, height: 20 }} />
        )}
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
          <InputBase
            placeholder="Search here"
            sx={{
              bgcolor: theme.palette.action.hover,
              color: theme.palette.text.primary,
              px: 1.5,
              py: 0.5,
              borderRadius: 2.5,
              transition: 'background-color 0.3s ease, color 0.3s ease',
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1,
              },
              height: 40,
              width: 220,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center'
            }}
            startAdornment={(
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/React-icon.svg" alt="search" style={{ width: 16, height: 16, marginRight: 10 }} />
            )}
          />
        </Box> */}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
        {/* 主题切换 */}
        <ThemeToggle size="small" />

        {/* 消息通知 */}
        {!loading && user && <NotificationBadge />}
        <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
            alt="user"
            sx={{ width: 36, height: 36 }}
          />
        </IconButton>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', justifyContent: 'center', height: 36, lineHeight: 1 }}>
          <Typography fontWeight={600} fontSize={15}>
            {user ? user.username : "未登录"}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {user ? user.userType : ""}
          </Typography>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { mt: 1.5, minWidth: 240, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', p: 1 }
          }}
        >
          <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: .5, opacity: 1, py: 1.5 }}>
            <Typography fontSize={14} fontWeight={600}>{user?.username || '未登录'}</Typography>
            <Typography fontSize={12} color="text.secondary">{user?.userType || '角色'}</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); router.push(isStudent ? '/student/notifications' : '/admin/notifications'); }}>
            <MailOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            {isStudent ? '我的消息' : '消息中心'}
          </MenuItem>
          {isStudent && (
            <MenuItem onClick={() => { handleClose(); router.push('/student/leave/apply'); }}>
              <OutboxIcon fontSize="small" sx={{ mr: 1 }} />
              提交请假
            </MenuItem>
          )}
          {isStudent && (
            <MenuItem onClick={() => { handleClose(); router.push('/student/leave/calendar'); }}>
              <EventIcon fontSize="small" sx={{ mr: 1 }} />
              我的日历
            </MenuItem>
          )}
          {isStudent && (
            <MenuItem onClick={() => { handleClose(); router.push('/student/dashboard'); }}>
              <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
              学生仪表盘
            </MenuItem>
          )}
          {(isAdmin || isTeacher) && (
            <MenuItem onClick={() => { handleClose(); router.push('/admin/dashboard'); }}>
              <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
              管理仪表盘
            </MenuItem>
          )}
          <MenuItem onClick={() => { handleClose(); /* 预留个人信息页面 */ }}>
            <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            个人信息 (占位)
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{
            mt: .5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
          }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            退出登录
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}