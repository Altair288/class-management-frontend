// page.tsx 修正版：修复固定卡片不遮住顶部导航 & 返回原位置

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

  // 单独添加成员
  const handleAddStudent = async (classId: number) => {
    if (!addStudent) return;
    await axios.post(`/api/class/${classId}/add-student`, { studentId: addStudent.id });
    // 刷新成员列表
    const res = await axios.get(`/api/class/${classId}/members`);
    setMembers(prev => ({ ...prev, [classId]: res.data }));
    setAddStudent(null);
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
    // 刷新成员列表
    const res = await axios.get(`/api/class/${classId}/members`);
    setMembers(prev => ({ ...prev, [classId]: res.data }));
    setExcelFile(null);
  };

  const renderClassCard = (cls: ClassInfo, isFocus: boolean) => (
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
          <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "#ffffffff" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              班级成员
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>学号</TableCell>
                  <TableCell>姓名</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(members[cls.id] || []).map((stu) => (
                  <TableRow key={stu.id}>
                    <TableCell>{stu.studentNo}</TableCell>
                    <TableCell>{stu.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box
              mt={4}
              mb={2}
              p={2}
              border="1px solid #e0e0e0"
              borderRadius={2}
            >
              <Typography fontWeight={600} mb={1}>
                单独新增成员
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Autocomplete
                  options={studentOptions}
                  getOptionLabel={(option) =>
                    `${option.name}（${option.studentNo}）`
                  }
                  value={addStudent}
                  onChange={(_, val) => setAddStudent(val)}
                  renderInput={(params) => (
                    <TextField {...params} label="选择学生" />
                  )}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  sx={{ minWidth: 220 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleAddStudent(cls.id)}
                  disabled={!addStudent}
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
                    accept=".xlsx,.xls"
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
        </Collapse>
      </Box>
    </Card>
  );

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

// "use client";

// import { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import {
//   Box,
//   Typography,
//   Card,
//   CardContent,
//   Grid,
//   Collapse,
//   Table,
//   TableHead,
//   TableRow,
//   TableCell,
//   TableBody,
//   TextField,
//   Autocomplete,
//   Button,
//   Paper,
//   Stack
// } from "@mui/material";
// import UploadFileIcon from "@mui/icons-material/UploadFile";
// import { motion, AnimatePresence } from "framer-motion";

// type ClassInfo = {
//   id: number;
//   name: string;
//   grade: string;
//   teacherName: string | null;
//   createdAt: string | null;
//   studentCount?: number;
// };

// type Student = { id: number; name: string; studentNo: string };

// export default function ClassManagePage() {
//   const [classList, setClassList] = useState<ClassInfo[]>([]);
//   const [stats, setStats] = useState({
//     totalClasses: 0,
//     totalStudents: 0,
//     totalTeachers: 0,
//     pendingRequests: 0,
//   });
//   const [expandedId, setExpandedId] = useState<number | null>(null);
//   const [members, setMembers] = useState<Record<number, Student[]>>({});
//   const [studentOptions, setStudentOptions] = useState<Student[]>([]);
//   const [addStudent, setAddStudent] = useState<Student | null>(null);
//   const [excelFile, setExcelFile] = useState<File | null>(null);
//   const [focusClass, setFocusClass] = useState<ClassInfo | null>(null);
//   const [showMemberTable, setShowMemberTable] = useState(false);

//   // 新增：用于聚焦动画的ref
//   const focusCardRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     // 获取班级详细信息和班级人数
//     Promise.all([
//       axios.get("/api/class/all"),
//       axios.get("/api/class/student-count"),
//       axios.get("/api/class/count"),
//       axios.get("/api/users/student/count"),
//       axios.get("/api/users/teacher/count"),
//     ]).then(([allRes, countRes, classCount, studentCount, teacherCount]) => {
//       // studentCount接口返回的是 {classId, className, studentCount}
//       const studentCountMap: Record<number, number> = {};
//       countRes.data.forEach((item: { classId: number; studentCount: number }) => {
//         studentCountMap[item.classId] = item.studentCount;
//       });
//       // 合并 studentCount 到 classList
//       const merged = allRes.data.map((cls: ClassInfo) => ({
//         ...cls,
//         studentCount: studentCountMap[cls.id] ?? 0,
//       }));
//       setClassList(merged);
//       setStats({
//         totalClasses: classCount.data,
//         totalStudents: studentCount.data,
//         totalTeachers: teacherCount.data,
//         pendingRequests: 0,
//       });
//     });
//     axios.get("/api/users/student/all").then(res => setStudentOptions(res.data));
//   }, []);

//   // 展开时加载成员
//   const handleExpand = async (cls: ClassInfo) => {
//     if (focusClass && focusClass.id === cls.id) {
//       setShowMemberTable(false);
//       setTimeout(() => {
//         setFocusClass(null);
//         // 回到原列表后滚动到原卡片位置
//         setTimeout(() => {
//           const el = document.getElementById(`class-card-${cls.id}-origin`);
//           if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
//         }, 350);
//       }, 300);
//       return;
//     }
//     // 先滚动到顶部再聚焦
//     setShowMemberTable(false);
//     setTimeout(() => {
//       setFocusClass(cls);
//       setTimeout(() => {
//         setShowMemberTable(true);
//         window.scrollTo({ top: 0, behavior: "smooth" });
//       }, 350);
//     }, 300);
//     if (!members[cls.id]) {
//       const res = await axios.get(`/api/class/${cls.id}/members`);
//       setMembers(prev => ({ ...prev, [cls.id]: res.data }));
//     }
//   };

//   // 单独添加成员
//   const handleAddStudent = async (classId: number) => {
//     if (!addStudent) return;
//     await axios.post(`/api/class/${classId}/add-student`, { studentId: addStudent.id });
//     // 刷新成员列表
//     const res = await axios.get(`/api/class/${classId}/members`);
//     setMembers(prev => ({ ...prev, [classId]: res.data }));
//     setAddStudent(null);
//   };

//   // 批量导入
//   const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>, classId: number) => {
//     if (e.target.files && e.target.files[0]) {
//       setExcelFile(e.target.files[0]);
//     }
//   };
//   const handleBatchImport = async (classId: number) => {
//     if (!excelFile) return;
//     const formData = new FormData();
//     formData.append("file", excelFile);
//     await axios.post(`/api/class/${classId}/import-students`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     // 刷新成员列表
//     const res = await axios.get(`/api/class/${classId}/members`);
//     setMembers(prev => ({ ...prev, [classId]: res.data }));
//     setExcelFile(null);
//   };

//   // 渲染班级卡片，支持 layoutId
//   const renderClassCard = (cls: ClassInfo, isFocus: boolean) => (
//     <motion.div
//       layoutId={`class-card-${cls.id}`}
//       transition={{ type: "spring", stiffness: 500, damping: 40 }}
//       style={{ zIndex: isFocus ? 10 : 1, position: isFocus ? "relative" : "static" }}
//       // 新增：原始卡片加id，便于收起后滚动回原位
//       {...(!isFocus ? { id: `class-card-${cls.id}-origin` } : {})}
//       ref={isFocus ? focusCardRef : undefined}
//     >
//       <Card
//         key={cls.id}
//         sx={{
//           width: '100%',
//           borderRadius: 4,
//           boxShadow: 1,
//           px: { xs: 2, md: 4 },
//           py: { xs: 2, md: 3 },
//           bgcolor: "#fff",
//           minHeight: 160,
//           display: "flex",
//           alignItems: "center",
//           mb={2}
//         }}
//       >
//         <Box sx={{ width: "100%" }}>
//           {/* 班级信息块 */}
//           <Box sx={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
//             <Typography variant="h5" fontWeight={700}>
//               {cls.name}
//             </Typography>
//             <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
//               年级：{cls.grade}
//             </Typography>
//           </Box>
//           <Typography variant="body1" color="text.secondary" mt={1} mb={2}>
//             班主任：{cls.teacherName || "未分配"}
//           </Typography>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 6, mt: 2 }}>
//             <Box>
//               <Typography variant="body2" color="text.secondary">
//                 ID
//               </Typography>
//               <Typography variant="h6" fontWeight={600}>
//                 {cls.id}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" color="text.secondary">
//                 班级人数
//               </Typography>
//               <Typography variant="h6" fontWeight={700}>
//                 {cls.studentCount ?? 0}人
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" color="text.secondary">
//                 创建时间
//               </Typography>
//               <Typography variant="h6" fontWeight={600}>
//                 {cls.createdAt ? cls.createdAt.slice(0, 10) : "--"}
//               </Typography>
//             </Box>
//             <Box sx={{ ml: "auto" }}>
//               <Button
//                 variant="outlined"
//                 size="small"
//                 onClick={() => handleExpand(cls)}
//               >
//                 {focusClass && focusClass.id === cls.id ? "收起成员" : "查看成员"}
//               </Button>
//             </Box>
//           </Box>
//           {/* 成员表格与添加功能 */}
//           <Collapse in={isFocus ? showMemberTable : false} timeout="auto" unmountOnExit>
//             <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "#ffffffff" }}>
//               <Typography variant="subtitle1" fontWeight={600} mb={2}>
//                 班级成员
//               </Typography>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>学号</TableCell>
//                     <TableCell>姓名</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {(members[cls.id] || []).map(stu => (
//                     <TableRow key={stu.id}>
//                       <TableCell>{stu.studentNo}</TableCell>
//                       <TableCell>{stu.name}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//               {/* 单独添加成员 */}
//               <Box mt={4} mb={2} p={2} border="1px solid #e0e0e0" borderRadius={2}>
//                 <Typography fontWeight={600} mb={1}>单独新增成员</Typography>
//                 <Stack direction="row" spacing={2} alignItems="center">
//                   <Autocomplete
//                     options={studentOptions}
//                     getOptionLabel={option => `${option.name}（${option.studentNo}）`}
//                     value={addStudent}
//                     onChange={(_, val) => setAddStudent(val)}
//                     renderInput={params => (
//                       <TextField {...params} label="选择学生" />
//                     )}
//                     isOptionEqualToValue={(o, v) => o.id === v.id}
//                     sx={{ minWidth: 220 }}
//                   />
//                   <Button
//                     variant="contained"
//                     onClick={() => handleAddStudent(cls.id)}
//                     disabled={!addStudent}
//                   >
//                     添加
//                   </Button>
//                 </Stack>
//               </Box>
//               {/* 批量添加成员 */}
//               <Box mt={2} p={2} border="1px solid #e0e0e0" borderRadius={2}>
//                 <Typography fontWeight={600} mb={1}>批量添加成员（Excel导入）</Typography>
//                 <Stack direction="row" spacing={2} alignItems="center">
//                   <Button
//                     variant="outlined"
//                     component="label"
//                     startIcon={<UploadFileIcon />}
//                   >
//                     选择Excel文件
//                     <input
//                       type="file"
//                       accept=".xlsx,.xls"
//                       hidden
//                       onChange={e => handleExcelChange(e, cls.id)}
//                     />
//                   </Button>
//                   {excelFile && (
//                     <Typography variant="body2" color="text.secondary" display="inline">
//                       {excelFile.name}
//                     </Typography>
//                   )}
//                   <Button
//                     variant="contained"
//                     onClick={() => handleBatchImport(cls.id)}
//                     disabled={!excelFile}
//                   >
//                     导入
//                   </Button>
//                 </Stack>
//               </Box>
//             </Paper>
//           </Collapse>
//         </Box>
//       </Card>
//     </motion.div>
//   );

//   return (
//     <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
//       <Typography variant="h4" fontWeight={700} mb={4} color="primary">
//         班级管理
//       </Typography>

//       {/* 顶部统计卡片 */}
//       <Grid container spacing={3} mb={4}>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
//             <CardContent>
//               <Typography variant="subtitle2" color="text.secondary">
//                 班级总数
//               </Typography>
//               <Typography variant="h5" fontWeight={600} mt={1}>
//                 {stats.totalClasses}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
//             <CardContent>
//               <Typography variant="subtitle2" color="text.secondary">
//                 学生总数
//               </Typography>
//               <Typography variant="h5" fontWeight={600} mt={1}>
//                 {stats.totalStudents}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
//             <CardContent>
//               <Typography variant="subtitle2" color="text.secondary">
//                 教师总数
//               </Typography>
//               <Typography variant="h5" fontWeight={600} mt={1}>
//                 {stats.totalTeachers}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
//             <CardContent>
//               <Typography variant="subtitle2" color="text.secondary">
//                 待处理申请
//               </Typography>
//               <Typography variant="h5" fontWeight={600} mt={1}>
//                 {stats.pendingRequests}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* 班级卡片列表 */}
//       <Box mt={4}>
//         <Typography variant="h6" fontWeight={600} mb={3}>
//           班级列表
//         </Typography>
//         <AnimatePresence initial={false}>
//           {focusClass ? (
//             // 吸顶聚焦卡片
//             <motion.div
//               key="focus"
//               layoutId={`class-card-${focusClass.id}`}
//               initial={{ y: 40, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 40, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 500, damping: 40 }}
//               style={{
//                 position: "sticky",
//                 top: 24,
//                 zIndex: 20,
//                 marginBottom: 32,
//               }}
//             >
//               {renderClassCard(focusClass, true)}
//             </motion.div>
//           ) : (
//             // 普通列表
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
//               {classList.map(cls => (
//                 <motion.div
//                   key={cls.id}
//                   layoutId={`class-card-${cls.id}`}
//                   transition={{ type: "spring", stiffness: 500, damping: 40 }}
//                 >
//                   {renderClassCard(cls, false)}
//                 </motion.div>
//               ))}
//             </Box>
//           )}
//         </AnimatePresence>
//       </Box>
//     </Box>
//   );
// }
