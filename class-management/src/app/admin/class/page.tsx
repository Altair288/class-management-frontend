/**
 * 文件: page.tsx
 * 路径: src/app/admin/class/page.tsx
 * 功能: 班级管理页面。支持班级统计展示、班级成员查看/分页/排序/筛选、单个学生按学号添加、批量 Excel 导入、
 *       成员移除（转入未分班池）、未分班学生列表预览，以及展开聚焦动画体验。
 * 技术要点:
 *   - 使用 MUI (Theme, alpha) 进行语义化配色与暗色模式适配。
 *   - 利用 framer-motion 实现卡片展开/聚焦过渡与渐入动画。
 *   - 分班成员分页、排序（学号/姓名，本地 localeCompare，含中文排序）、筛选（学号/姓名/手机/邮箱）。
 *   - 多个班级的分页 / 分页大小 / 排序 / 筛选 状态分别持久在映射对象中 (pageMap / pageSizeMap / sortMap / filterMap)。
 *   - 通过多并发请求聚合统计数据与未分班学生信息。
 * 待办 (TODO):
 *   1. Excel 导入时：前端显示加载动画；导入完成后展示详细结果，并弹出成功/失败结果对话框。
 *   2. 移除成员成功后：增加成功提示（如 Snackbar / Dialog 反馈）。
 *   3. 单独新增成员成功后：增加成功提示（如 Snackbar / Dialog 反馈）。
 *   4. （可选）Excel 导入失败的异常捕获与用户友好错误提示。
 *   5. （可选）将未分班学生区域支持展开/折叠及全量查看对话框。
 * 最近更新: 2025-09-24 添加文件头部标准注释并整合待办列表。
 */

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Collapse,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  // Autocomplete,
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
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  // FormControl,
  // InputLabel,
  TableSortLabel,
  useTheme,
  alpha,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Group as GroupIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

type ClassInfo = {
  id: number;
  name: string;
  grade: string;
  teacherName: string | null;
  createdAt: string | null;
  studentCount?: number;
};

type Student = { id: number; name: string; studentNo: string; phone?: string | null; email?: string | null };

export default function ClassManagePage() {
  const theme = useTheme();
  
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
  });
  const [members, setMembers] = useState<Record<number, Student[]>>({});
  // 移除 studentOptions：原先预取全部学生列表未在页面中使用，避免冗余请求与未使用变量告警。
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

  // 全局 page / pageSize 状态移除：采用按班级映射 pageMap/pageSizeMap 管理分页。

  // 移除成员相关
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState("");
  // 移除成功提示
  const [removeSuccessOpen, setRemoveSuccessOpen] = useState(false);
  // 单独新增成员成功提示
  const [addSuccessOpen, setAddSuccessOpen] = useState(false);
  // Excel 导入结果提示
  const [importSuccessOpen, setImportSuccessOpen] = useState(false);
  const [importAdded, setImportAdded] = useState<number | null>(null);
  const [importError, setImportError] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });
  const [importLoading, setImportLoading] = useState(false); // Excel 导入时加载指示

  // 组件顶层
  const [pageMap, setPageMap] = useState<Record<number, number>>({});
  const [pageSizeMap, setPageSizeMap] = useState<Record<number, number>>({});

  // 新增：未分班学生相关状态
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);

  // 排序/筛选/列宽
  const [sortMap, setSortMap] = useState<Record<number, { by: "studentNo" | "name"; order: "asc" | "desc" }>>({});
  const [filterMap] = useState<Record<number, string>>({}); // 当前未启用筛选输入
  // 固定列宽模式（如需 UI 控制可还原为 useState）
  const widthMode: "compact" | "normal" | "wide" = "normal";

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
      axios.get("/api/class/unassigned/members"), // 新增
      axios.get("/api/class/unassigned/count"), // 新增
    ]).then(
      ([
        allRes,
        countRes,
        classCount,
        studentCount,
        teacherCount,
        unassignedRes,
        unassignedCountRes,
      ]) => {
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
          pendingRequests: unassignedCountRes.data, // 用未分班数量作为待处理申请
        });
        setUnassignedStudents(unassignedRes.data);
        setUnassignedCount(unassignedCountRes.data);
      }
    );
    // 已删除获取全部学生列表的请求（未使用）。
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

  // refreshAllOpenedMembers 函数暂未使用，如需“一键刷新所有已展开班级成员”可恢复实现。

  // 单独添加成员
  const handleAddStudent = async (classId: number, student?: Student | null) => {
    const stu = student ?? addStudent;
    if (!stu) return;
    await axios.post(`/api/class/${classId}/add-student`, { studentId: stu.id });

    // 立即拉取该班级成员并更新人数显示
    const r = await axios.get(`/api/class/${classId}/members`);
    setMembers(prev => ({ ...prev, [classId]: r.data }));
    const newCount = r.data.length;
    setClassList(prev => prev.map(c => (c.id === classId ? { ...c, studentCount: newCount } : c)));
    setFocusClass(fc => (fc && fc.id === classId ? { ...fc, studentCount: newCount } : fc));

    setStudentNoInput("");
    setStudentNoResult(null);
    setAddStudent(null);
  setAddSuccessOpen(true); // 显示添加成功

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
  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };
  const handleBatchImport = async (classId: number) => {
    if (!excelFile) return;
    try {
      setImportLoading(true);
      setImportError({ open: false, msg: "" });
      const before = members[classId]?.length || 0;
      const formData = new FormData();
      formData.append("file", excelFile);
      await axios.post(`/api/class/${classId}/import-students`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const res = await axios.get(`/api/class/${classId}/members`);
      setMembers(prev => ({ ...prev, [classId]: res.data }));
      const newCount = res.data.length;
      setClassList(prev => prev.map(c => (c.id === classId ? { ...c, studentCount: newCount } : c)));
      setFocusClass(fc => (fc && fc.id === classId ? { ...fc, studentCount: newCount } : fc));
      setExcelFile(null);

      const added = newCount - before;
      setImportAdded(added > 0 ? added : 0);
      setImportSuccessOpen(true);

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
    } catch (e: unknown) {
      let msg = "导入失败，请检查文件格式与数据有效性";
      if (typeof e === 'object' && e && 'response' in e) {
        interface AxiosLikeError { response?: { data?: { message?: string } }; }
        const resp = (e as AxiosLikeError).response;
        msg = resp?.data?.message || msg;
      } else if (e instanceof Error) {
        msg = e.message || msg;
      }
      setImportError({ open: true, msg });
    }
    finally {
      setImportLoading(false);
    }
  };

  // 查询学号
  const handleStudentNoSearch = async () => {
    setStudentNoResult(null);
    setStudentNoError("");
    if (!studentNoInput) return;
    setStudentNoLoading(true);
    try {
      const res = await axios.get(
        `/api/users/student/by-no?studentNo=${studentNoInput}`
      );
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

    // 即刻拉取该班级成员并更新人数
    const r = await axios.get(`/api/class/${classId}/members`);
    setMembers(prev => ({ ...prev, [classId]: r.data }));
    const newCount = r.data.length;
    setClassList(prev => prev.map(c => (c.id === classId ? { ...c, studentCount: newCount } : c)));
    setFocusClass(fc => (fc && fc.id === classId ? { ...fc, studentCount: newCount } : fc));

    // 刷新未分班学生和统计数据
    const [unassignedRes, unassignedCountRes, countRes, studentCount] = await Promise.all([
      axios.get("/api/class/unassigned/members"),
      axios.get("/api/class/unassigned/count"),
      axios.get("/api/class/student-count"),
      axios.get("/api/users/student/count"),
    ]);

    setUnassignedStudents(unassignedRes.data);
    setUnassignedCount(unassignedCountRes.data);

    // 更新班级人数统计
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
    setStats((prev) => ({
      ...prev,
      totalStudents: studentCount.data,
      pendingRequests: unassignedCountRes.data,
    }));

    // 显示移除成功提示
    setRemoveSuccessOpen(true);
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

  // 排序/筛选工具函数
  const getSort = (classId: number) => sortMap[classId] || { by: "studentNo", order: "asc" as const };
  const getFilter = (classId: number) => filterMap[classId] || "";
  const handleSort = (classId: number, by: "studentNo" | "name") => {
    setSortMap(prev => {
      const cur = prev[classId] || { by, order: "asc" as const };
      const nextOrder = cur.by === by ? (cur.order === "asc" ? "desc" : "asc") : "asc";
      return { ...prev, [classId]: { by, order: nextOrder } };
    });
  };
  // handleFilterChange 暂未在 UI 中启用（对应工具栏被注释），故移除以消除未使用告警。

  const renderClassCard = (cls: ClassInfo, isFocus: boolean) => {
    const memberList = members[cls.id] || [];

    // 应用筛选（新增：支持按手机、邮箱筛选）
    const filterText = getFilter(cls.id).toLowerCase().trim();
    let visibleList = filterText
      ? memberList.filter(stu =>
          stu.studentNo.toLowerCase().includes(filterText) ||
          stu.name.toLowerCase().includes(filterText) ||
          (stu.phone || "").toLowerCase().includes(filterText) ||
          (stu.email || "").toLowerCase().includes(filterText)
        )
      : memberList;

    // 应用排序
    const { by, order } = getSort(cls.id);
    visibleList = [...visibleList].sort((a, b) => {
      const av = by === "studentNo" ? a.studentNo : a.name;
      const bv = by === "studentNo" ? b.studentNo : b.name;
      return order === "asc" ? av.localeCompare(bv, "zh-Hans-CN") : bv.localeCompare(av, "zh-Hans-CN");
    });

    // 分页
    const page = getPage(cls.id);
    const pageSize = getPageSize(cls.id);
    const pagedMembers = visibleList.slice((page - 1) * pageSize, page * pageSize);

    // 列宽（新增：为手机、邮箱增加列宽）
    const widthMap = {
      compact: { no: 120, name: 140, phone: 140, email: 200, actions: 110 },
      normal:  { no: 160, name: 180, phone: 160, email: 240, actions: 120 },
      wide:    { no: 220, name: 240, phone: 200, email: 300, actions: 140 },
    } as const;
    const cw = widthMap[widthMode];

    return (
      <Card
        sx={{
          width: "100%",
          borderRadius: 4,
          boxShadow: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 },
          bgcolor: theme.palette.background.paper,
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
            <Paper sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                班级成员
              </Typography>

              {/* 工具栏：筛选 + 列宽模式 */}
              {/* <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="筛选学号或姓名"
                  value={getFilter(cls.id)}
                  onChange={e => handleFilterChange(cls.id, e.target.value)}
                  sx={{ width: 240 }}
                />
                <Box flex={1} />
                <Typography variant="body2" color="text.secondary">列宽</Typography>
                <Select
                  size="small"
                  value={widthMode}
                  onChange={e => setWidthMode(e.target.value as "compact" | "normal" | "wide")}
                  sx={{ width: 110 }}
                >
                  <MenuItem value="compact">紧凑</MenuItem>
                  <MenuItem value="normal">标准</MenuItem>
                  <MenuItem value="wide">宽松</MenuItem>
                </Select>
              </Stack> */}

              <Box sx={{ maxHeight: "calc(100vh - 690px)", overflow: "auto" }}>
                <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: cw.no, minWidth: cw.no }}>
                        <TableSortLabel
                          active={by === "studentNo"}
                          direction={by === "studentNo" ? order : "asc"}
                          onClick={() => handleSort(cls.id, "studentNo")}
                        >
                          学号
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ width: cw.name, minWidth: cw.name }}>
                        <TableSortLabel
                          active={by === "name"}
                          direction={by === "name" ? order : "asc"}
                          onClick={() => handleSort(cls.id, "name")}
                        >
                          姓名
                        </TableSortLabel>
                      </TableCell>
                      {/* 新增：手机、邮箱表头（此处无需排序，如需排序可按需扩展） */}
                      <TableCell sx={{ width: cw.phone, minWidth: cw.phone }}>
                        手机
                      </TableCell>
                      <TableCell sx={{ width: cw.email, minWidth: cw.email }}>
                        邮箱
                      </TableCell>
                      <TableCell sx={{ width: cw.actions, minWidth: cw.actions }}>
                        操作
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedMembers.map(stu => (
                      <TableRow key={stu.id}>
                        <TableCell>{stu.studentNo}</TableCell>
                        <TableCell>{stu.name}</TableCell>
                        {/* 新增：手机、邮箱数据渲染，为空时显示 - */}
                        <TableCell>{stu.phone || "-"}</TableCell>
                        <TableCell>{stu.email || "-"}</TableCell>
                        <TableCell>
                          <Button color="error" size="small" onClick={() => handleRemoveStudent(stu)}>
                            移除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* 分页 + 每页条数 */}
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
                  count={Math.max(1, Math.ceil(visibleList.length / pageSize))}
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
                border={`1px solid ${alpha(theme.palette.divider, 0.5)}`}
                borderRadius={2}
              >
                <Typography fontWeight={600} mb={1}>
                  单独新增成员（学号）
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="输入学号"
                    value={studentNoInput}
                    onChange={(e) => setStudentNoInput(e.target.value.trim())}
                    size="small"
                    sx={{ minWidth: 180 }}
                    error={!!studentNoError}
                    helperText={studentNoError}
                    disabled={studentNoLoading}
                    onKeyDown={(e) => {
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
              <Box 
                mt={2} 
                p={2} 
                border={`1px solid ${alpha(theme.palette.divider, 0.5)}`} 
                borderRadius={2}
              >
                <Typography fontWeight={600} mb={1}>
                  批量添加成员（Excel导入）
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={importLoading}
                  >
                    选择Excel文件
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      hidden
                      onChange={handleExcelChange}
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
                    disabled={!excelFile || importLoading}
                    sx={{ position: 'relative', minWidth: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                  >
                    {importLoading && <CircularProgress size={18} color="inherit" />}
                    {importLoading ? '正在导入...' : '导入'}
                  </Button>
                </Stack>
              </Box>
            </Paper>
            {/* 移除成员确认对话框 */}
            <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
              <DialogTitle>确认移除成员</DialogTitle>
              <DialogContent>
                <Typography mb={2}>
                  确认要将学生 <b>{removeTarget?.name}</b>（学号：{removeTarget?.studentNo}）从当前班级移除吗？<br />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    注意：学生将被转移到&quot;未分班&quot;状态，不会被删除。
                  </Typography>
                  请在下方输入&quot;确认移除&quot;以继续操作。
                </Typography>
                <TextField
                  label="请输入：确认移除"
                  value={removeConfirm}
                  onChange={(e) => setRemoveConfirm(e.target.value)}
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setRemoveDialogOpen(false)}>取消</Button>
                <Button
                  color="error"
                  disabled={removeConfirm !== "确认移除"}
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
    <>
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: theme.palette.background.default,
      transition: 'background-color 0.3s ease'
    }}>
      <Typography variant="h4" fontWeight={700} mb={4} color="primary">
        班级管理
      </Typography>
      
      {/* 统计卡片 - 修改为一行显示 */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: { xs: 'wrap', md: 'nowrap' } // 移动端允许换行，桌面端强制一行
      }}>
        {/* 班级总数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 * 0.1 }}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transition: 'box-shadow 0.2s'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}> {/* 减少内边距 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40, // 减小图标容器尺寸
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SchoolIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    班级总数
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '1.75rem',
                        lineHeight: 1
                      }}
                    >
                      {stats.totalClasses}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }}
                    >
                      个
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* 学生总数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 * 0.1 }}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transition: 'box-shadow 0.2s'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GroupIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    学生总数
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '1.75rem',
                        lineHeight: 1
                      }}
                    >
                      {stats.totalStudents}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }}
                    >
                      人
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* 教师总数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 * 0.1 }}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transition: 'box-shadow 0.2s'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    教师总数
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '1.75rem',
                        lineHeight: 1
                      }}
                    >
                      {stats.totalTeachers}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }}
                    >
                      人
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* 未分班学生 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 * 0.1 }}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.2s'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    未分班学生
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '1.75rem',
                        lineHeight: 1
                      }}
                    >
                      {stats.pendingRequests}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }}
                    >
                      人
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
      
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
                  background: alpha(theme.palette.action.disabled, 0.3),
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
      {/* 新增未分班学生展示区域 */}
      <Box mt={4} mb={4}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          未分班学生 ({unassignedCount}人)
        </Typography>
        {unassignedCount > 0 ? (
          <Card
            sx={{
              borderRadius: 3,
              p: 2,
              position: 'relative',
              bgcolor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.warning.main, 0.16)
                : alpha(theme.palette.warning.main, 0.12),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
              boxShadow: 'none',
              backdropFilter: theme.palette.mode === 'dark' ? 'blur(4px)' : 'none',
              transition: 'background-color .25s,border-color .25s',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.warning.main, 0.22)
                  : alpha(theme.palette.warning.main, 0.18),
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: theme.palette.mode === 'dark' ? theme.palette.warning.light : 'text.secondary',
                fontWeight: 500
              }}
            >
              以下学生尚未分配到班级，可通过“添加成员”功能将其分配到对应班级：
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {unassignedStudents.slice(0, 10).map((stu) => (
                <Chip
                  key={stu.id}
                  label={`${stu.name}（${stu.studentNo}）`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.4)
                      : theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                    '& .MuiChip-label': { px: 1.2 }
                  }}
                />
              ))}
              {unassignedCount > 10 && (
                <Chip
                  label={`还有 ${unassignedCount - 10} 人...`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.4)
                      : theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                  }}
                />
              )}
            </Box>
          </Card>
        ) : (
          <Typography variant="body2" color="text.secondary">
            所有学生均已分配到班级
          </Typography>
        )}
      </Box>
    </Box>
    <Snackbar
      open={removeSuccessOpen}
      autoHideDuration={3000}
      onClose={() => setRemoveSuccessOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="success"
        variant="filled"
        elevation={3}
        onClose={() => setRemoveSuccessOpen(false)}
        sx={{ fontWeight: 500 }}
      >
        成员已成功移除
      </Alert>
    </Snackbar>
    <Snackbar
      open={addSuccessOpen}
      autoHideDuration={3000}
      onClose={() => setAddSuccessOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="success"
        variant="filled"
        elevation={3}
        onClose={() => setAddSuccessOpen(false)}
        sx={{ fontWeight: 500 }}
      >
        成员添加成功
      </Alert>
    </Snackbar>
    <Snackbar
      open={importSuccessOpen}
      autoHideDuration={3500}
      onClose={() => setImportSuccessOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="success"
        variant="filled"
        elevation={3}
        onClose={() => setImportSuccessOpen(false)}
        sx={{ fontWeight: 500 }}
      >
        导入完成{importAdded !== null ? `，新增 ${importAdded} 人` : ''}
      </Alert>
    </Snackbar>
    <Snackbar
      open={importError.open}
      autoHideDuration={4000}
      onClose={() => setImportError({ open: false, msg: '' })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="error"
        variant="filled"
        elevation={3}
        onClose={() => setImportError({ open: false, msg: '' })}
        sx={{ fontWeight: 500 }}
      >
        {importError.msg}
      </Alert>
    </Snackbar>
    </>
  );
}