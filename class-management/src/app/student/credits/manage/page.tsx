"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import { useTheme, useMediaQuery, Card, CardContent } from "@mui/material";

interface StudentRow {
  id: number; // 学生主键ID (后端字段 id)
  studentNo: string; // 学号 (后端字段 studentId)
  studentName: string;
  classId: number;
  className?: string;
  de?: number;
  zhi?: number;
  ti?: number;
  mei?: number;
  lao?: number;
  total?: number;
  status?: string;
  [key: string]: unknown; // 允许索引访问
}

interface RawRow {
  id: number;
  studentId: string;
  studentName: string;
  class?: string;
  德?: number;
  智?: number;
  体?: number;
  美?: number;
  劳?: number;
  total?: number;
  status?: string;
}

interface UpdateScorePayload {
  creditItemId: number;
  delta?: number;
  value?: number;
  reason?: string;
}

interface CreditItemLite {
  id: number;
  category?: string;
}

// 简易 mapping（与后端 category 中文保持一致）
const CATEGORY_LABELS: Record<string, string> = {
  de: "德育",
  zhi: "智育",
  ti: "体育",
  mei: "美育",
  lao: "劳育",
};

// 中文类别与内部键互转
const CATEGORY_KEY_TO_CN: Record<string, string> = { de: "德", zhi: "智", ti: "体", mei: "美", lao: "劳" };
const CATEGORY_CN_TO_KEY: Record<string, string> = Object.fromEntries(Object.entries(CATEGORY_KEY_TO_CN).map(([k, v]) => [v, k]));

export default function MonitorCreditManagePage() {
  const { user, isClassMonitor, user: authUser, loading } = useAuth();
  const monitorClassId =
    authUser && typeof authUser === "object"
      ? (authUser as { monitorClassId?: number }).monitorClassId
      : undefined;
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null);
  const [mode, setMode] = useState<"delta" | "set">("delta");
  const [formReason, setFormReason] = useState("");
  const [formValue, setFormValue] = useState(""); // 输入分值
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({ open: false, msg: "", severity: "success" });
  const [creditItems, setCreditItems] = useState<CreditItemLite[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 1) 权限控制：非班长或无班级 -> 重定向/提示
  useEffect(() => {
    if (loading) return;
    if (!user) return; // AuthLayout 会处理未登录
    if (!isClassMonitor || !monitorClassId) {
      setError("当前账号不是班长，无法访问班级学分管理");
    }
  }, [isClassMonitor, monitorClassId, user, loading]);

  // 2) 拉取 credit items 用于映射 category => itemId
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/credits/items");
        if (res.ok) {
          const list: CreditItemLite[] = await res.json();
          setCreditItems(list || []);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const itemIdByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of creditItems) {
      if (!it || !it.id) continue;
      const catRaw = it.category || '';
      // 取首字符做一次粗略匹配（后端可能返回 "德" 或 "德育"）
      const first = catRaw.charAt(0);
      // 优先：若本身就是内部 key
      let internalKey = CATEGORY_CN_TO_KEY[catRaw] || CATEGORY_CN_TO_KEY[first] || (CATEGORY_KEY_TO_CN[catRaw] ? catRaw : '');
      // 如果仍未匹配，且是拼音之一（de/zhi/ti/mei/lao），直接用
      if (!internalKey && ['de','zhi','ti','mei','lao'].includes(catRaw)) internalKey = catRaw;
      if (internalKey) {
        map[internalKey] = it.id;
      }
    }
    return map;
  }, [creditItems]);

  // 3) 拉取本班学生汇总
  const loadClassStudents = useCallback(async () => {
    if (!monitorClassId) return;
    setLoadingData(true);
    setError(null);
    try {
      const res = await fetch(`/api/credits/class/${monitorClassId}/students`);
      if (!res.ok) throw new Error("无法获取班级学生学分");
      const raw: RawRow[] = await res.json();
      const mapped: StudentRow[] = (raw || []).map((r) => ({
        id: r.id,
        studentNo: r.studentId, // 后端 DTO 学号字段名
        studentName: r.studentName,
        classId: monitorClassId,
        className: r.class,
        de: r["德"],
        zhi: r["智"],
        ti: r["体"],
        mei: r["美"],
        lao: r["劳"],
        total: r.total,
        status: r.status,
      }));
      setRows(mapped);
    } catch (e) {
      setError((e as Error).message || "加载失败");
    } finally {
      setLoadingData(false);
    }
  }, [monitorClassId]);

  useEffect(() => {
    if (monitorClassId && isClassMonitor) loadClassStudents();
  }, [monitorClassId, isClassMonitor, loadClassStudents]);

  const [selectedCategoryForEdit, setSelectedCategoryForEdit] =
    useState<string>("de");
  const [previewNewScore, setPreviewNewScore] = useState<number | null>(null);

  const categoryOptions = useMemo(
    () =>
      Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v })),
    []
  );

  const getOriginalScore = useCallback(
    (row: StudentRow | null, cat: string): number | null => {
      if (!row) return null;
      const val = row[cat];
      return typeof val === "number" ? val : null;
    },
    []
  );

  const recalcPreview = useCallback(
    (
      base: number | null,
      mode: "delta" | "set",
      input: string
    ): number | null => {
      if (base == null && mode === "delta") return null;
      const num = Number(input);
      if (isNaN(num)) return null;
      let result = mode === "delta" ? (base ?? 0) + num : num;
      if (result < 0) result = 0;
      if (result > 100) result = 100;
      return Number(result.toFixed(2));
    },
    []
  );

  useEffect(() => {
    const orig = getOriginalScore(editTarget, selectedCategoryForEdit);
    setPreviewNewScore(recalcPreview(orig, mode, formValue));
  }, [
    editTarget,
    selectedCategoryForEdit,
    mode,
    formValue,
    getOriginalScore,
    recalcPreview,
  ]);

  const openEditDialog = (row: StudentRow) => {
    setEditTarget(row);
    setMode("delta");
    setFormReason("");
    setFormValue("");
    const firstCat = categoryOptions[0]?.key || "de";
    setSelectedCategoryForEdit(firstCat);
    setOpenEdit(true);
  };

  const handleSubmit = async () => {
    if (!editTarget) return;
    const num = Number(formValue);
    if (isNaN(num)) {
      setSnack({ open: true, msg: "请输入合法数字", severity: "error" });
      return;
    }
    if (mode === "set" && (num < 0 || num > 100)) {
      setSnack({ open: true, msg: "设值需在 0~100 之间", severity: "error" });
      return;
    }
    if (mode === "delta" && (num < -100 || num > 100)) {
      setSnack({
        open: true,
        msg: "增减幅度建议在 -100~100 之间",
        severity: "error",
      });
    }

    let itemId = itemIdByCategory[selectedCategoryForEdit];
    // 回退：如果没有匹配到，尝试用中文首字匹配
    if (!itemId) {
      const cn = CATEGORY_KEY_TO_CN[selectedCategoryForEdit];
      // 在 creditItems 中找包含该中文首字的记录
      const found = creditItems.find(ci => (ci.category||'').startsWith(cn));
      if (found) itemId = found.id;
    }
    if (!itemId) { setSnack({open:true,msg:`未找到对应主项目ID (分类: ${selectedCategoryForEdit})`,severity:'error'}); return; }

    // 预览已经 clamp 到 0~100，不再重复校验
    let url = '';
    const payload: UpdateScorePayload = { creditItemId: itemId, reason: formReason || undefined };
    if (mode === 'delta') { url = `/api/credits/students/${editTarget.id}/update-score`; payload.delta = num; }
    else { url = `/api/credits/students/${editTarget.id}/set-score`; payload.value = num; }

    try {
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setSnack({open:true,msg:'提交成功',severity:'success'});
      setOpenEdit(false);
      loadClassStudents();
    } catch (e) {
      setSnack({open:true,msg:`失败: ${(e as Error).message||'未知错误'}`,severity:'error'});
    }
  };

  const handleCloseSnack = () => setSnack((s) => ({ ...s, open: false }));
  const scoreChipColor = (
    v?: number
  ): "default" | "success" | "info" | "warning" | "error" => {
    if (v == null || isNaN(v)) return "default";
    if (v >= 80) return "success";
    if (v >= 60) return "info";
    if (v >= 40) return "warning";
    return "error";
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error" fontSize={14}>
          {error}
        </Typography>
      </Box>
    );
  }
  if (!isClassMonitor || !monitorClassId) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography fontSize={14}>非班长账号，暂无权限。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          position: "sticky",
          top: 0,
          zIndex: 5,
          pb: 1,
        }}
      >
        <Typography variant="h6" fontSize={18} fontWeight={600}>
          班级学分管理
        </Typography>
        <Chip
          size="small"
          color="primary"
          label={`班级ID: ${monitorClassId}`}
        />
        <IconButton size="small" onClick={loadClassStudents}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
      {loadingData ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={34} />
          <Typography mt={1} fontSize={13} color="text.secondary">
            加载中...
          </Typography>
        </Box>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {rows.map((r) => (
            <Card
              key={r.id}
              variant="outlined"
              sx={{ borderRadius: 2, position: "relative" }}
            >
              <CardContent sx={{ pb: "12px!important" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography fontSize={15} fontWeight={600}>
                    {r.studentName}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary">
                    {r.studentNo}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  gap={0.75}
                  sx={{ mb: 1 }}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <Chip
                      key={k}
                      label={`${label} ${(r[k] as number | undefined) ?? "-"}`}
                      color={scoreChipColor(r[k] as number | undefined)}
                      size="small"
                      variant="outlined"
                      // 移除点击编辑行为
                      sx={{ cursor: "default" }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`总分 ${r.total ?? "-"}`} />
                  {r.status && (
                    <Chip size="small" color="secondary" label={r.status} />
                  )}
                </Stack>
                <IconButton
                  size="small"
                  onClick={() => openEditDialog(r)}
                  sx={{ position: "absolute", top: 6, right: 4, opacity: 0.6 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>学生</TableCell>
                <TableCell>学号</TableCell>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <TableCell key={k}>{v}</TableCell>
                ))}
                <TableCell>总分</TableCell>
                <TableCell>评价</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>{r.studentNo}</TableCell>
                  {Object.keys(CATEGORY_LABELS).map((cat) => (
                    <TableCell key={cat}>
                      <span>
                        {((r as StudentRow)[cat] as string | number) ?? "-"}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell>{r.total ?? "-"}</TableCell>
                  <TableCell>{r.status ?? "-"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          调整学分
          <IconButton size="small" onClick={() => setOpenEdit(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <Typography fontSize={13} color="text.secondary">
            学生：{editTarget?.studentName}（学号 {editTarget?.studentNo}）
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {categoryOptions.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                color={
                  selectedCategoryForEdit === opt.key ? "primary" : "default"
                }
                variant={
                  selectedCategoryForEdit === opt.key ? "filled" : "outlined"
                }
                size="small"
                onClick={() => setSelectedCategoryForEdit(opt.key)}
              />
            ))}
          </Stack>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={mode === "delta" ? "contained" : "outlined"}
              size="small"
              onClick={() => setMode("delta")}
            >
              增减(Δ)
            </Button>
            <Button
              variant={mode === "set" ? "contained" : "outlined"}
              size="small"
              onClick={() => setMode("set")}
            >
              设值(=)
            </Button>
          </Box>
          <TextField
            size="small"
            label={
              mode === "delta"
                ? "增减分值(可正可负, 建议 -100~100)"
                : "设为分值 (0~100)"
            }
            value={formValue}
            placeholder={mode === "delta" ? "+5 或 -3" : "80"}
            onChange={(e) =>
              setFormValue(e.target.value.replace(/[^0-9+\-\.]/g, ""))
            }
            inputProps={{ inputMode: "decimal", pattern: "[0-9+-.]*" }}
            fullWidth
          />
          <TextField
            size="small"
            label="原因(可选)"
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            multiline
            minRows={2}
          />
          <Box sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>
            {(() => {
              const orig = getOriginalScore(
                editTarget,
                selectedCategoryForEdit
              );
              const preview = previewNewScore;
              return (
                <>
                  <div>
                    原分：{orig ?? "—"}
                    {orig != null && " 分"}
                  </div>
                  {mode === "delta" &&
                    formValue &&
                    !isNaN(Number(formValue)) && (
                      <div>
                        计算：{orig ?? 0}{" "}
                        {(Number(formValue) >= 0 ? "+" : "") + formValue} ={" "}
                        {preview ?? "—"} 分
                      </div>
                    )}
                  {mode === "set" && formValue && !isNaN(Number(formValue)) && (
                    <div>将设为：{preview ?? formValue} 分</div>
                  )}
                  <div>
                    预览新分（已限制 0~100）：<strong>{preview ?? "—"}</strong>
                  </div>
                </>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            startIcon={<UndoIcon />}
            onClick={() => {
              setFormValue("");
              setFormReason("");
              setPreviewNewScore(
                getOriginalScore(editTarget, selectedCategoryForEdit)
              );
            }}
          >
            重置输入
          </Button>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSubmit}
          >
            提交
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3200}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* TODO: 后续步骤：
        1) sm 以下切换为 Card 列表视图 (mobile-first)。
        2) 顶部添加搜索与状态过滤下拉。
        3) 骨架加载 + 重试按钮。
        4) Dialog 显示原值，提交中禁用按钮。
        5) 分值 Chips 颜色根据区间 (≥80 success, ≥60 info, ≥40 warning, else error)。
      */}
    </Box>
  );
}
