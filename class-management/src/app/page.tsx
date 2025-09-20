"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";

// 主页面重定向到管理后台
export default function HomePage() {
  const theme = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 自动重定向到管理后台
    router.push("/login");
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        bgcolor: theme.palette.background.default,
        transition: 'background-color 0.3s ease'
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: theme.palette.text.secondary, 
            mb: 2 
          }}
        >
          正在跳转到管理系统...
        </Typography>
        <CircularProgress 
          size={40}
          sx={{ 
            color: theme.palette.primary.main
          }} 
        />
      </Box>
    </Box>
  );
}