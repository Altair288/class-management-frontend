import { useEffect, useState } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import InputBase from "@mui/material/InputBase";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";

interface UserInfo {
  id: number;
  username: string;
  userType: string;
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

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
        bgcolor: "#fff",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1201,
      }}
    >
      <IconButton onClick={onMenuClick} sx={{ mr: 2 }}>
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" fontWeight={700} sx={{ flex: 0, mr: 3 }}>
        Dashboard
      </Typography>
      <Box sx={{ flex: 1 }}>
        <InputBase
          placeholder="Search here"
          sx={{
            marginLeft: 1.5,
            bgcolor: "#f5f7fa",
            px: 1.5,
            py: 0.5,
            borderRadius: 5,
            height: 36,
            width: 200,
            fontSize: 15,
          }}
          startAdornment={
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
              alt="search"
              style={{ width: 16, height: 16, marginRight: 10 }}
            />
          }
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            sx: { mt: 1.5, minWidth: 240, borderRadius: 3, boxShadow: 3 },
          }}
        >
          {/* ...其它菜单项... */}
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}