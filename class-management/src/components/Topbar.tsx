import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import InputBase from "@mui/material/InputBase";
import Avatar from "@mui/material/Avatar";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
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
          startAdornment={<img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="search" style={{ width: 16, height: 16, marginRight: 10 }} />}
        />
      </Box>
      <Box sx={{ display: "relative", alignItems: "center", gap: 2 }}>
        <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" sx={{ width: 36, height: 36 }} />
        <Box>
          <Typography fontWeight={600} fontSize={15}>Erika Collins</Typography>
          <Typography fontSize={12} color="text.secondary">Super Admin</Typography>
        </Box>
      </Box>
    </Box>
  );
}