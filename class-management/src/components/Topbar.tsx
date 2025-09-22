import { useEffect, useState } from "react";
import axios from "axios";
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
import { ThemeToggle } from "./ThemeToggle";

interface UserInfo {
  id: number;
  username: string;
  userType: string;
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    axios.get("/api/users/current")
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 登出功能
  const handleLogout = async () => {
    try {
      await axios.post("/api/users/logout");
    } catch {}
    setUser(null);
    handleClose();
    router.push("/login");
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
      <Typography variant="h6" fontWeight={700} sx={{ 
        flex: 0, 
        mr: 3, 
        color: theme.palette.text.primary 
      }}>
        Dashboard
      </Typography>
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
        {user && user.id && (
          <NotificationBadge />
        )}
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
          <MenuItem onClick={() => { handleClose(); router.push('/admin/notifications'); }}>
            <MailOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            消息中心
          </MenuItem>
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