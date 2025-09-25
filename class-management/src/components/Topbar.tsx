import { useState } from "react";
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
import NotificationBadge from "./NotificationBadge";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import OutboxIcon from '@mui/icons-material/Outbox';
// import HomeIcon from '@mui/icons-material/Home';
// import SchoolIcon from '@mui/icons-material/School';
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
    } catch {}
    await refresh();
    try { localStorage.setItem('auth:changed', Date.now().toString()); } catch {}
    handleClose();
    router.push('/login');
  };

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1201,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <IconButton onClick={onMenuClick} sx={{ mr: 2 }}>
        <MenuIcon />
      </IconButton>
      {/* <Typography variant="h6" fontWeight={700} sx={{
        flex: 0,
        mr: 3,
        display: 'flex',
        alignItems: 'center',
        gap: .75,
        color: theme.palette.text.primary
      }}>
        {isStudent ? <SchoolIcon fontSize="small" /> : <HomeIcon fontSize="small" />}
        {isStudent ? '学生中心' : '管理后台'}
      </Typography> */}
      <Box sx={{ flex: 1 }}>
        {/* <InputBase
          placeholder="Search here"
          sx={{
            marginLeft: 1.5,
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.primary,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            transition: 'background-color 0.3s ease, color 0.3s ease',
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
            height: 36,
            width: 200,
            fontSize: 15,
          }}
          startAdornment={(
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/React-icon.svg" alt="search" style={{ width: 16, height: 16, marginRight: 10 }} />
          )}
        /> */}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
        <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", justifyContent: "center" }}>
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
            <>
              <MenuItem onClick={() => { handleClose(); router.push('/student/leave/apply'); }}>
                <OutboxIcon fontSize="small" sx={{ mr: 1 }} />
                提交请假
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); router.push('/student/leave/calendar'); }}>
                <EventIcon fontSize="small" sx={{ mr: 1 }} />
                我的日历
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); router.push('/student/dashboard'); }}>
                <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                学生仪表盘
              </MenuItem>
            </>
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