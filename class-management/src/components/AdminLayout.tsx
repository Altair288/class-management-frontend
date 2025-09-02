"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <Topbar onMenuClick={() => setSidebarOpen(v => !v)} />
      <Sidebar open={sidebarOpen} />
      <Box
        component="main"
        sx={{
          transition: "margin-left 0.2s",
          ml: { xs: 0, md: sidebarOpen ? "240px" : 0 },
          pt: 1, // 减少顶部padding，因为Topbar已经提供了足够的间距
          p: { xs: 2, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}