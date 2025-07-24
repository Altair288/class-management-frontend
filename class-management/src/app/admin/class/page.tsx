"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

export default function ClassManagePage() {
  const [classList, setClassList] = useState<
    { id: number; name: string; teacherName: string | null; createdAt: string }[]
  >([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    // 获取班级列表
    axios.get("/api/class/all").then((res) => {
      setClassList(res.data);
    });
    // 获取统计数据
    Promise.all([
      axios.get("/api/class/count"),
      axios.get("/api/users/student/count"),
      axios.get("/api/users/teacher/count"),
    ]).then(([classCount, studentCount, teacherCount]) => {
      setStats({
        totalClasses: classCount.data,
        totalStudents: studentCount.data,
        totalTeachers: teacherCount.data,
        pendingRequests: 0, // 如果有待处理请求的接口，这里也可以获取
      });
    });
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      {/* 页面标题 */}
      <Typography variant="h4" fontWeight={700} mb={4} color="primary">
        班级管理
      </Typography>

      {/* 顶部统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                班级总数
              </Typography>
              <Typography variant="h5" fontWeight={600} mt={1}>
                {stats.totalClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                学生总数
              </Typography>
              <Typography variant="h5" fontWeight={600} mt={1}>
                {stats.totalStudents}
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
                {stats.totalTeachers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                待处理申请
              </Typography>
              <Typography variant="h5" fontWeight={600} mt={1}>
                {stats.pendingRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 班级卡片列表 */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          班级列表
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {classList.map((cls) => (
            <Card 
              key={cls.id}
              sx={{ 
                width: '100%',
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  cursor: 'pointer'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6" fontWeight={600}>
                        {cls.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {cls.id}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      班主任: {cls.teacherName || "未分配"}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      创建时间
                    </Typography>
                    <Typography variant="body2">
                      {cls.createdAt ? new Date(cls.createdAt).toLocaleString() : ""}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}