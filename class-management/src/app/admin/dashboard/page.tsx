"use client";

import { useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <Sidebar open={sidebarOpen} />
      <Box
        sx={{
          transition: "margin-left 0.2s",
          ml: { xs: 0, md: sidebarOpen ? "240px" : 0 },
          p: { xs: 2, md: 4 },
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={4} color="primary">
          管理员仪表盘
        </Typography>
        <Grid container spacing={3}>
          {/* 示例统计卡片 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  学生总数
                </Typography>
                <Typography variant="h5" fontWeight={600} mt={1}>
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  教师总数
                </Typography>
                <Typography variant="h5" fontWeight={600} mt={1}>
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  请假申请
                </Typography>
                <Typography variant="h5" fontWeight={600} mt={1}>
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  待审批
                </Typography>
                <Typography variant="h5" fontWeight={600} mt={1}>
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 示例图表或其他内容区域 */}
        <Box mt={5}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                数据概览（可接入图表组件）
              </Typography>
              <Box
                sx={{
                  height: 200,
                  bgcolor: "#e3f2fd",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  这里可以放置图表或统计信息
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}