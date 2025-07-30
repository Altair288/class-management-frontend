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

type ClassInfo = {
  id: number;
  name: string;
  grade: string;
  teacherName: string | null;
  createdAt: string | null;
  studentCount?: number;
};

export default function ClassManagePage() {
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    // 获取班级详细信息和班级人数
    Promise.all([
      axios.get("/api/class/all"),
      axios.get("/api/class/student-count"),
      axios.get("/api/class/count"),
      axios.get("/api/users/student/count"),
      axios.get("/api/users/teacher/count"),
    ]).then(([allRes, countRes, classCount, studentCount, teacherCount]) => {
      // studentCount接口返回的是 {classId, className, studentCount}
      const studentCountMap: Record<number, number> = {};
      countRes.data.forEach((item: { classId: number; studentCount: number }) => {
        studentCountMap[item.classId] = item.studentCount;
      });
      // 合并 studentCount 到 classList
      const merged = allRes.data.map((cls: ClassInfo) => ({
        ...cls,
        studentCount: studentCountMap[cls.id] ?? 0,
      }));
      setClassList(merged);
      setStats({
        totalClasses: classCount.data,
        totalStudents: studentCount.data,
        totalTeachers: teacherCount.data,
        pendingRequests: 0,
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {classList.map((cls) => (
            <Card
              key={cls.id}
              sx={{
                width: '100%',
                borderRadius: 4,
                boxShadow: 1,
                px: { xs: 2, md: 4 },
                py: { xs: 2, md: 3 },
                bgcolor: "#fff",
                minHeight: 160,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {cls.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    年级：{cls.grade}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" mt={1} mb={2}>
                  班主任：{cls.teacherName || "未分配"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 6, mt: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {cls.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      班级人数
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {cls.studentCount ?? 0}人
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      创建时间
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {cls.createdAt ? cls.createdAt.slice(0, 10) : "--"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}