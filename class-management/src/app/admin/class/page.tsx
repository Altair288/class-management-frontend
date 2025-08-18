"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Collapse,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Autocomplete,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  MenuItem,
  Select,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { motion, AnimatePresence } from "framer-motion";

type ClassInfo = {
  id: number;
  name: string;
  grade: string;
  teacherName: string | null;
  createdAt: string | null;
  studentCount?: number;
};

type Student = { id: number; name: string; studentNo: string };

export default function ClassManagePage() {
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
  });
  const [members, setMembers] = useState<Record<number, Student[]>>({});
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [addStudent, setAddStudent] = useState<Student | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [focusClass, setFocusClass] = useState<ClassInfo | null>(null);
  const [showMemberTable, setShowMemberTable] = useState(false);
  const [originScrollY, setOriginScrollY] = useState(0);
  const [containerRect, setContainerRect] = useState({ left: 0, width: 0 });

  const [studentNoInput, setStudentNoInput] = useState("");
  const [studentNoResult, setStudentNoResult] = useState<Student | null>(null);
  const [studentNoLoading, setStudentNoLoading] = useState(false);
  const [studentNoError, setStudentNoError] = useState("");

  // 分页相关
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // 移除成员相关
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState("");

  // 组件顶层
  const [pageMap, setPageMap] = useState<Record<number, number>>({});
  const [pageSizeMap, setPageSizeMap] = useState<Record<number, number>>({});

  useEffect(() => {
  if (!focusClass) return;
  const updateRect = () => {
    const container = document.querySelector("#class-list-container");
    if (container) {
      const rect = container.getBoundingClientRect();
      setContainerRect({ left: rect.left, width: rect.width });
    }
  };
  window.addEventListener("resize", updateRect);
  updateRect();
  return () => window.removeEventListener("resize", updateRect);
}, [focusClass]);

  useEffect(() => {
    Promise.all([
      axios.get("/api/class/all"),
      axios.get("/api/class/student-count"),
      axios.get("/api/class/count"),
      axios.get("/api/users/student/count"),
      axios.get("/api/users/teacher/count"),
    ]).then(([allRes, countRes, classCount, studentCount, teacherCount]) => {
      const studentCountMap: Record<number, number> = {};
      countRes.data.forEach(
        (item: { classId: number; studentCount: number }) => {
          studentCountMap[item.classId] = item.studentCount;
        }
      );
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
    axios
      .get("/api/users/student/all")
      .then((res) => setStudentOptions(res.data));
      
  }, []);

  const handleExpand = async (cls: ClassInfo) => {
    if (focusClass && focusClass.id === cls.id) {
      setShowMemberTable(false);
      setTimeout(() => {
        setFocusClass(null);
        document.body.style.overflow = "auto";
        window.scrollTo({ top: originScrollY, behavior: "smooth" });
      }, 300);
      return;
    }

    const container = document.querySelector("#class-list-container");
    if (container) {
      const rect = container.getBoundingClientRect();
      setContainerRect({ left: rect.left, width: rect.width });
    }
    setOriginScrollY(window.scrollY);
    document.body.style.overflow = "hidden";

    setShowMemberTable(false);
    setTimeout(() => {
      setFocusClass(cls);
      setTimeout(() => setShowMemberTable(true), 350);
    }, 300);

    if (!members[cls.id]) {
      const res = await axios.get(`/api/class/${cls.id}/members`);
      setMembers((prev) => ({ ...prev, [cls.id]: res.data }));
    }
  };

  const refreshAllOpenedMembers = async () => {
    // 总是刷新所有已加载的班级成员
    const updates = await Promise.all(
      Object.keys(members).map(async (cid) => {
        const res = await axios.get(`/api/class/${cid}/members`);
        return { cid, data: res.data };
      })
    );
    setMembers((prev) => {
      const next = { ...prev };
      updates.forEach(({ cid, data }) => {
        next[Number(cid)] = data;
      });
      return next;
    });
  };

  // 单独添加成员
  const handleAddStudent = async (classId: number, student?: Student | null) => {
    const stu = student ?? addStudent;
    if (!stu) return;
    await axios.post(`/api/class/${classId}/add-student`, { studentId: stu.id });
    // 刷新所有已展开班级的成员
    await refreshAllOpenedMembers();
    setStudentNoInput("");
    setStudentNoResult(null);
    setAddStudent(null);

    // 刷新班级人数和学生总数
    Promise.all([
      axios.get("/api/class/student-count"),
      axios.get("/api/class/count"),
      axios.get("/api/users/student/count"),
      axios.get("/api/users/teacher/count"),
    ]).then(([countRes, classCount, studentCount, teacherCount]) => {
      const studentCountMap: Record<number, number> = {};
      countRes.data.forEach(
        (item: { classId: number; studentCount: number }) => {
          studentCountMap[item.classId] = item.studentCount;
        }
      );
      setClassList((prev) =>
        prev.map((cls) =>
          studentCountMap[cls.id] !== undefined
            ? { ...cls, studentCount: studentCountMap[cls.id] }
            : cls
        )
      );
      setStats({
        totalClasses: classCount.data,
        totalStudents: studentCount.data,
        totalTeachers: teacherCount.data,
        pendingRequests: 0,
      });
    });
  };

  // 批量导入
  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>, classId: number) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };
  const handleBatchImport = async (classId: number) => {
    if (!excelFile) return;
    const formData = new FormData();
    formData.append("file", excelFile);
    await axios.post(`/api/class/${classId}/import-students`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const res = await axios.get(`/api/class/${classId}/members`);
    setMembers((prev) => ({ ...prev, [classId]: res.data }));
    setExcelFile(null);
    // 刷新班级人数和学生总数
    Promise.all([
      axios.get("/api/class/student-count"),
      axios.get("/api/class/count"),
      axios.get("/api/users/student/count"),
      axios.get("/api/users/teacher/count"),
    ]).then(([countRes, classCount, studentCount, teacherCount]) => {
      const studentCountMap: Record<number, number> = {};
      countRes.data.forEach(
        (item: { classId: number; studentCount: number }) => {
          studentCountMap[item.classId] = item.studentCount;
        }
      );
      setClassList((prev) =>
        prev.map((cls) =>
          studentCountMap[cls.id] !== undefined
            ? { ...cls, studentCount: studentCountMap[cls.id] }
            : cls
        )
      );
      setStats({
        totalClasses: classCount.data,
        totalStudents: studentCount.data,
        totalTeachers: teacherCount.data,
        pendingRequests: 0,
      });
    });
  };

  // 查询学号
  const handleStudentNoSearch = async () => {
    setStudentNoResult(null);
    setStudentNoError("");
    if (!studentNoInput) return;
    setStudentNoLoading(true);
    try {
      const res = await axios.get(`/api/users/student/by-no?studentNo=${studentNoInput}`);
      if (res.data && res.data.id) {
        setStudentNoResult(res.data);
      } else {
        setStudentNoError("未找到该学号");
      }
    } catch {
      setStudentNoError("未找到该学号");
    }
    setStudentNoLoading(false);
  };

  // 新增：移除成员
  const handleRemoveStudent = (stu: Student) => {
    setRemoveTarget(stu);
    setRemoveDialogOpen(true);
    setRemoveConfirm("");
  };
  const confirmRemoveStudent = async (classId: number) => {
    if (!removeTarget) return;
    await axios.post(`/api/class/${classId}/remove-student`, { studentId: removeTarget.id });
    setRemoveDialogOpen(false);
    setRemoveTarget(null);
    setRemoveConfirm("");
    await refreshAllOpenedMembers();
    // 可选：刷新统计
  };

  // 获取当前班级分页
  const getPage = (classId: number) => pageMap[classId] || 1;
  const getPageSize = (classId: number) => pageSizeMap[classId] || 15;

  // 修改页码
  const handlePageChange = (classId: number, val: number) => {
    setPageMap((prev) => ({ ...prev, [classId]: val }));
  };
  // 修改每页条数
  const handlePageSizeChange = (classId: number, val: number) => {
    setPageSizeMap((prev) => ({ ...prev, [classId]: val }));
    setPageMap((prev) => ({ ...prev, [classId]: 1 })); // 切换条数时重置页码
  };

  const renderClassCard = (cls: ClassInfo, isFocus: boolean) => {
    const memberList = members[cls.id] || [];
    const page = getPage(cls.id);
    const pageSize = getPageSize(cls.id);
    const pagedMembers = memberList.slice((page - 1) * pageSize, page * pageSize);

    return (
      <Card
        sx={{
          width: "100%",
          borderRadius: 4,
          boxShadow: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 },
          bgcolor: "#fff",
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
            <Typography variant="h5" fontWeight={700}>
              {cls.name}
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
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
            <Box sx={{ ml: "auto" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleExpand(cls)}
              >
                {focusClass && focusClass.id === cls.id ? "收起成员" : "查看成员"}
              </Button>
            </Box>
          </Box>
          <Collapse
            in={isFocus ? showMemberTable : false}
            timeout="auto"
            unmountOnExit
          >
            <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "#fff" }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                班级成员
              </Typography>
              <Box sx={{ maxHeight: "calc(100vh - 690px)", overflow: "auto" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>学号</TableCell>
                      <TableCell>姓名</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedMembers.map((stu) => (
                      <TableRow key={stu.id}>
                        <TableCell>{stu.studentNo}</TableCell>
                        <TableCell>{stu.name}</TableCell>
                        <TableCell>
                          <Button
                            color="error"
                            size="small"
                            onClick={() => handleRemoveStudent(stu)}
                          >
                            移除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {/* 分页选择 */}
              <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                <Typography>每页显示</Typography>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={e => handlePageSizeChange(cls.id, Number(e.target.value))}
                  sx={{ width: 80 }}
                >
                  {[5, 15, 30, 45, 100].map(size => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
                <Typography>条</Typography>
                <Box flex={1} />
                <Pagination
                  count={Math.ceil(memberList.length / pageSize) || 1}
                  page={page}
                  onChange={(_, val) => handlePageChange(cls.id, val)}
                  color="primary"
                  size="small"
                />
              </Stack>
              <Box
                mt={2}
                mb={2}
                p={2}
                border="1px solid #e0e0e0"
                borderRadius={2}
              >
                <Typography fontWeight={600} mb={1}>
                  单独新增成员（学号）
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="输入学号"
                    value={studentNoInput}
                    onChange={e => setStudentNoInput(e.target.value.trim())}
                    size="small"
                    sx={{ minWidth: 180 }}
                    error={!!studentNoError}
                    helperText={studentNoError}
                    disabled={studentNoLoading}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleStudentNoSearch();
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleStudentNoSearch}
                    disabled={!studentNoInput}
                  >
                    查询
                  </Button>
                  <TextField
                    label="学生姓名"
                    value={studentNoResult?.name || ""}
                    size="small"
                    sx={{ minWidth: 120 }}
                    disabled
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleAddStudent(cls.id, studentNoResult)}
                    disabled={!studentNoResult}
                  >
                    添加
                  </Button>
                </Stack>
              </Box>
              <Box mt={2} p={2} border="1px solid #e0e0e0" borderRadius={2}>
                <Typography fontWeight={600} mb={1}>
                  批量添加成员（Excel导入）
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                  >
                    选择Excel文件
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      hidden
                      onChange={(e) => handleExcelChange(e, cls.id)}
                    />
                  </Button>
                  {excelFile && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="inline"
                    >
                      {excelFile.name}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => handleBatchImport(cls.id)}
                    disabled={!excelFile}
                  >
                    导入
                  </Button>
                </Stack>
              </Box>
            </Paper>
            {/* 移除成员确认对话框 */}
            <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
              <DialogTitle>确认移除成员</DialogTitle>
              <DialogContent>
                <Typography mb={2}>
                  确认要移除学生 <b>{removeTarget?.name}</b>（学号：{removeTarget?.studentNo}）吗？<br />
                  请在下方输入“确认删除”以继续操作。
                </Typography>
                <TextField
                  label="请输入：确认删除"
                  value={removeConfirm}
                  onChange={e => setRemoveConfirm(e.target.value)}
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setRemoveDialogOpen(false)}>取消</Button>
                <Button
                  color="error"
                  disabled={removeConfirm !== "确认删除"}
                  onClick={() => confirmRemoveStudent(cls.id)}
                >
                  确认移除
                </Button>
              </DialogActions>
            </Dialog>
          </Collapse>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <Typography variant="h4" fontWeight={700} mb={4} color="primary">
        班级管理
      </Typography>
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
      <Box mt={4}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          班级列表
        </Typography>
        <AnimatePresence initial={false}>
          {focusClass ? (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "#c2c2c2ab",
                  backdropFilter: "blur(10px) saturate(180%)",
                  WebkitBackdropFilter: "blur(10px) saturate(180%)",
                  zIndex: 150,
                }}
                onClick={() => handleExpand(focusClass!)}
              />
              <motion.div
                key="focus"
                layoutId={`class-card-${focusClass.id}`}
                initial={{ y: -20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                style={{
                  position: "fixed",
                  top: 100, // 预留导航栏高度
                  left: containerRect.left,
                  width: containerRect.width,
                  zIndex: 200,
                }}
              >
                {renderClassCard(focusClass, true)}
              </motion.div>
            </>
          ) : (
            <Box
              id="class-list-container"
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {classList.map((cls) => (
                <motion.div
                  key={cls.id}
                  layoutId={`class-card-${cls.id}`}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                >
                  {renderClassCard(cls, false)}
                </motion.div>
              ))}
            </Box>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}