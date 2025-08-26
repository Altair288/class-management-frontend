"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
  Paper,
  Alert,
  LinearProgress,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

interface CreditItem {
  id: number;
  category: string;
  itemName: string;
  initialScore: number;
  maxScore: number;
  description: string;
  enabled: boolean;
}

interface CreditSubitem {
  id: number;
  itemId: number;
  subitemName: string;
  initialScore: number;
  maxScore: number;
  weight: number; // 0-1
  enabled: boolean;
}

export default function CreditsConfigPage() {
  // 固定五类
  const categories = useMemo(() => ["德", "智", "体", "美", "劳"], []);
  const [activeTab, setActiveTab] = useState(0);

  // 当前主项目
  const [currentItem, setCurrentItem] = useState<CreditItem | null>(null);
  const [itemForm, setItemForm] = useState({
    itemName: "",
    initialScore: 0,
    maxScore: 100,
    description: "",
    enabled: true,
  });

  // 子项目
  const [subitems, setSubitems] = useState<CreditSubitem[]>([]);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<CreditSubitem | null>(null);
  const [subForm, setSubForm] = useState({
    subitemName: "",
    initialScore: 0,
    maxScore: 100,
    weight: 0,
    enabled: true,
  });

  // 权重验证和提示
  const totalWeight = useMemo(() => {
    return subitems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [subitems]);

  const isWeightValid = totalWeight <= 1.0;

  // 新增：是否存在启用中的子项目
  const hasEnabledSub = useMemo(() => subitems.some(s => !!s.enabled), [subitems]);

  const [loading, setLoading] = useState(false);
  // 成功提示
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  // 新增：统一系统消息框
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const openToast = (message: string, severity: "success" | "error" | "info" | "warning" = "success") =>
    setToast({ open: true, message, severity });

  const getErrMsg = (err: any) => {
    // 兼容后端全局异常返回 { code, message }
    const data = err?.response?.data;
    if (data?.message) return data.message;
    if (typeof data === "string") return data;
    if (err?.message) return err.message;
    return "请求失败，请稍后重试";
  };

  const activeCategory = categories[activeTab];

  // 保证每类有一个主项目，并加载子项目
  const ensureItemAndLoad = async (category: string) => {
    setLoading(true);
    try {
      const res = await axios.get<CreditItem[]>("/api/credits/items", { params: { category } });
      let item = res.data && res.data.length > 0 ? res.data[0] : null;
      if (!item) {
        const created = await axios.post<CreditItem>("/api/credits/items", {
          category,
          itemName: `${category}育学分`,
          initialScore: 0,
          maxScore: 100,
          description: "",
          enabled: true,
        });
        item = created.data;
      }
      setCurrentItem(item);
      setItemForm({
        itemName: item.itemName,
        initialScore: item.initialScore,
        maxScore: item.maxScore,
        description: item.description,
        enabled: item.enabled,
      });
      const subRes = await axios.get<CreditSubitem[]>(`/api/credits/items/${item.id}/subitems`);
      setSubitems(subRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ensureItemAndLoad(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 保存主项目
  const handleSaveItem = async () => {
    if (!currentItem) return;
    if (
      itemForm.initialScore > itemForm.maxScore ||
      itemForm.initialScore < 0 ||
      itemForm.initialScore > 100 ||
      itemForm.maxScore < 0 ||
      itemForm.maxScore > 100
    )
      return;
    setLoading(true);
    try {
      await axios.post(`/api/credits/items/${currentItem.id}`, {
        category: activeCategory,
        itemName: itemForm.itemName,
        initialScore: itemForm.initialScore,
        maxScore: itemForm.maxScore,
        description: itemForm.description,
        enabled: itemForm.enabled,
      });
      await ensureItemAndLoad(activeCategory);
      openToast("保存成功", "success");
    } catch (e) {
      openToast(getErrMsg(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItemEnabled = async () => {
    if (!currentItem) return;
    setLoading(true);
    try {
      await axios.post(`/api/credits/items/${currentItem.id}`, {
        category: activeCategory,
        itemName: itemForm.itemName,
        initialScore: itemForm.initialScore,
        maxScore: itemForm.maxScore,
        description: itemForm.description,
        enabled: !itemForm.enabled,
      });
      await ensureItemAndLoad(activeCategory);
    } finally {
      setLoading(false);
    }
  };

  // 子项目对话框
  const openAddSubDialog = () => {
    setEditingSub(null);
    setSubForm({ subitemName: "", initialScore: 0, maxScore: 100, weight: 0, enabled: true });
    setSubDialogOpen(true);
  };

  const openEditSubDialog = (s: CreditSubitem) => {
    setEditingSub(s);
    setSubForm({
      subitemName: s.subitemName,
      initialScore: Number(s.initialScore) || 0,
      maxScore: Number(s.maxScore) || 100,
      weight: Number(s.weight) || 0,
      enabled: !!s.enabled,
    });
    setSubDialogOpen(true);
  };

  const handleSaveSub = async () => {
    if (!currentItem) return;
    if (!subForm.subitemName) return;
    if (
      subForm.initialScore > subForm.maxScore ||
      subForm.weight < 0 ||
      subForm.weight > 1 ||
      subForm.initialScore < 0 ||
      subForm.initialScore > 100 ||
      subForm.maxScore < 0 ||
      subForm.maxScore > 100
    )
      return;
    setLoading(true);
    try {
      if (editingSub) {
        await axios.post(`/api/credits/subitems/${editingSub.id}`, {
          subitemName: subForm.subitemName,
          initialScore: subForm.initialScore,
          maxScore: subForm.maxScore,
          weight: subForm.weight,
          enabled: subForm.enabled,
        });
        openToast("保存成功", "success");
      } else {
        await axios.post(`/api/credits/items/${currentItem.id}/subitems`, {
          subitemName: subForm.subitemName,
          initialScore: subForm.initialScore,
          maxScore: subForm.maxScore,
          weight: subForm.weight,
          enabled: subForm.enabled,
        });
        openToast("添加成功", "success");
      }
      setSubDialogOpen(false);
      const subRes = await axios.get<CreditSubitem[]>(`/api/credits/items/${currentItem.id}/subitems`);
      setSubitems(subRes.data || []);
    } catch (e) {
      openToast(getErrMsg(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSub = async (id: number) => {
    if (!currentItem) return;
    setLoading(true);
    try {
      await axios.delete(`/api/credits/subitems/${id}`);
      const subRes = await axios.get<CreditSubitem[]>(`/api/credits/items/${currentItem.id}/subitems`);
      setSubitems(subRes.data || []);
      openToast("已删除", "success");
    } catch (e) {
      openToast(getErrMsg(e), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Box sx={{ p: 2, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        {/* 简洁的页头 */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, backgroundColor: "#1976d2", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              component={Link}
              href="/admin/credits"
              sx={{
                mr: 2,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                学分配置管理
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                德、智、体、美、劳五育学分配置
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 加载进度条 */}
        {loading && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress />
          </Box>
        )}

        {/* 主配置卡片 */}
        <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
          {/* 分类标签栏 */}
          <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 48,
                "& .MuiTab-root": {
                  minHeight: 48,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "#666",
                  "&.Mui-selected": {
                    color: "#1976d2",
                    fontWeight: 600,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 2,
                  backgroundColor: "#1976d2",
                },
              }}
            >
              {categories.map((category) => (
                <Tab key={category} label={`${category}育`} />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 2 }}>
            {/* 主项目配置区域 */}
            <Paper sx={{ p: 3, mb: 2, backgroundColor: "#e9e9e94b", borderRadius: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#1976d2", flex: 1 }}
                >
                  {activeCategory}育学分 - 主项目配置
                </Typography>
                <Chip
                  label={itemForm.enabled ? "已启用" : "已停用"}
                  color={itemForm.enabled ? "primary" : "default"}
                  size="small"
                />
              </Box>

              {/* 紧凑的表单布局 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <TextField
                  label="项目名称"
                  size="small"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="初始分值"
                  size="small"
                  type="number"
                  value={itemForm.initialScore}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const clamped = isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
                    setItemForm({ ...itemForm, initialScore: clamped });
                  }}
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  error={
                    itemForm.initialScore > itemForm.maxScore ||
                    itemForm.initialScore < 0 ||
                    itemForm.initialScore > 100
                  }
                  helperText={
                    itemForm.initialScore < 0 || itemForm.initialScore > 100
                      ? "范围 0 ~ 100"
                      : itemForm.initialScore > itemForm.maxScore
                      ? "不能大于最大分值"
                      : ""
                  }
                />
                <TextField
                  label="最大分值"
                  size="small"
                  type="number"
                  value={itemForm.maxScore}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const clamped = isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
                    setItemForm({ ...itemForm, maxScore: clamped });
                  }}
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  error={
                    itemForm.initialScore > itemForm.maxScore ||
                    itemForm.maxScore < 0 ||
                    itemForm.maxScore > 100
                  }
                  helperText={
                    itemForm.maxScore < 0 || itemForm.maxScore > 100
                      ? "范围 0 ~ 100"
                      : itemForm.initialScore > itemForm.maxScore
                      ? "需不小于初始分值"
                      : ""
                  }
                />
              </Box>

              <TextField
                label="项目描述"
                size="small"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder={`请输入${activeCategory}育学分的详细描述...`}
                sx={{ mb: 1.5 }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={itemForm.enabled}
                      onChange={() => handleToggleItemEnabled()}
                    />
                  }
                  label="启用此项目"
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveItem}
                  disabled={
                    loading ||
                    !currentItem ||
                    !itemForm.itemName ||
                    itemForm.initialScore > itemForm.maxScore ||
                    itemForm.initialScore < 0 ||
                    itemForm.initialScore > 100 ||
                    itemForm.maxScore < 0 ||
                    itemForm.maxScore > 100
                  }
                >
                  保存配置
                </Button>
              </Box>
            </Paper>

            {/* 子项目管理区域 */}
            <Paper sx={{ 
                borderRadius: 2.5,
                backgroundColor: "#e3f2fd",
                borderBottom: "1px solid #bbdefb",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1976d2" }}>
                    子项目权重配置
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#1565c0" }}>
                    权重合计: {totalWeight.toFixed(2)} {!isWeightValid && "⚠️ 超出1.0"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={openAddSubDialog}
                  disabled={!currentItem || loading}
                >
                  添加子项目
                </Button>
              </Box>

              {/* 新增：使用说明（当未启用任何子项目时显示），紧凑不占空间 */}
              {!hasEnabledSub && (
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{ mx: 2, my: 1, py: 0.5 }}
                >
                  提示：未使用子项目配置时，系统将直接按照当前主项目（{activeCategory}育）的计分规则进行计分。
                </Alert>
              )}

              {/* 权重提示 */}
              {!isWeightValid && (
                <Alert severity="warning" sx={{ m: 1 }}>
                  权重总和为 {totalWeight.toFixed(2)}，超过了1.0，请调整各子项目权重。
                </Alert>
              )}

              <Box sx={{ p: 2, backgroundColor: "white" }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>子项目名称</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>权重</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>初始分</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>最大分</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subitems.map((subitem, index) => (
                        <TableRow
                          key={subitem.id}
                          hover
                          sx={{
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mr: 1, minWidth: 24, height: 20 }}
                              />
                              {subitem.subitemName}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {Number(subitem.weight).toFixed(2)}
                              <Box
                                sx={{
                                  width: 40,
                                  height: 4,
                                  backgroundColor: "#e0e0e0",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${Math.min(Number(subitem.weight) * 100, 100)}%`,
                                    height: "100%",
                                    backgroundColor:
                                      Number(subitem.weight) > 0.5 ? "#ff9800" : "#2196f3",
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{subitem.initialScore}</TableCell>
                          <TableCell>{subitem.maxScore}</TableCell>
                          <TableCell>
                            <Chip
                              label={subitem.enabled ? "启用" : "停用"}
                              size="small"
                              color={subitem.enabled ? "primary" : "default"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => openEditSubDialog(subitem)}
                              sx={{ color: "#1976d2" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSub(subitem.id)}
                              sx={{ color: "#d32f2f" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subitems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                            <Typography variant="body2" sx={{ color: "#757575" }}>
                              暂无子项目配置，点击右上角添加子项目按钮开始配置
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </CardContent>
        </Card>

        {/* 简洁的子项目编辑对话框 */}
        <Dialog
          open={subDialogOpen}
          onClose={() => setSubDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 2,
            }}
          >
            <SettingsIcon />
            {editingSub ? "编辑子项目" : "添加子项目"}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
              <TextField
                label="子项目名称"
                size="small"
                value={subForm.subitemName}
                onChange={(e) => setSubForm({ ...subForm, subitemName: e.target.value })}
                fullWidth
              />
              <TextField
                label="权重系数 (0-1)"
                size="small"
                type="number"
                value={subForm.weight}
                onChange={(e) => setSubForm({ ...subForm, weight: Number(e.target.value) })}
                fullWidth
                error={subForm.weight < 0 || subForm.weight > 1}
                helperText={subForm.weight < 0 || subForm.weight > 1 ? "权重范围：0 ~ 1" : ""}
              />
              <TextField
                label="初始分值"
                size="small"
                type="number"
                value={subForm.initialScore}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const clamped = isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
                  setSubForm({ ...subForm, initialScore: clamped });
                }}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={
                  subForm.initialScore > subForm.maxScore ||
                  subForm.initialScore < 0 ||
                  subForm.initialScore > 100
                }
                helperText={
                  subForm.initialScore < 0 || subForm.initialScore > 100
                    ? "范围 0 ~ 100"
                    : subForm.initialScore > subForm.maxScore
                    ? "不能大于最大分值"
                    : ""
                }
              />
              <TextField
                label="最大分值"
                size="small"
                type="number"
                value={subForm.maxScore}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const clamped = isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
                  setSubForm({ ...subForm, maxScore: clamped });
                }}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={
                  subForm.initialScore > subForm.maxScore ||
                  subForm.maxScore < 0 ||
                  subForm.maxScore > 100
                }
                helperText={
                  subForm.maxScore < 0 || subForm.maxScore > 100
                    ? "范围 0 ~ 100"
                    : subForm.initialScore > subForm.maxScore
                    ? "需不小于初始分值"
                    : ""
                }
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={subForm.enabled}
                    onChange={(e) => setSubForm({ ...subForm, enabled: e.target.checked })}
                  />
                }
                label="启用此子项目"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setSubDialogOpen(false)}
              variant="outlined"
              size="small"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveSub}
              variant="contained"
              size="small"
              disabled={
                loading ||
                !subForm.subitemName ||
                subForm.initialScore > subForm.maxScore ||
                subForm.weight < 0 ||
                subForm.weight > 1 ||
                subForm.initialScore < 0 ||
                subForm.initialScore > 100 ||
                subForm.maxScore < 0 ||
                subForm.maxScore > 100
              }
            >
              {editingSub ? "保存修改" : "添加子项目"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* 成功提示 */}
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={toast.open}
          autoHideDuration={3000}
          onClose={(_, reason) => {
            if (reason === "clickaway") return;
            setToast((t) => ({ ...t, open: false }));
          }}
          message={toast.message}
          sx={{
            '& .MuiSnackbarContent-root': {
              borderRadius: '15px',
            },
          }}
        >
          <Alert
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
