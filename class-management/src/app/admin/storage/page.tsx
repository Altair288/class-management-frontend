"use client";
import { useState, useMemo, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import { 
          Tabs, Tab, Chip, Paper, Box, Typography, 
          Button, IconButton, Tooltip, Switch, Table, 
          TableHead, TableRow, TableCell, TableBody, 
          Dialog, DialogTitle, DialogContent, DialogActions, 
          TextField, InputAdornment, Stack, FormControlLabel, 
          Snackbar, Alert, CircularProgress, MenuItem, 
          FormControl, InputLabel, Select, LinearProgress, Divider 
       } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Inventory2';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios, { AxiosError } from 'axios';

// ---------------- 后端 DTO 类型定义 ----------------
interface ConnectionDTO {
  id?: number;
  name: string;
  provider: string; // "MINIO"
  endpointUrl: string;
  accessKeyEncrypted?: string;
  secretKeyEncrypted?: string;
  secureFlag: boolean;
  pathStyleAccess: boolean;
  defaultPresignExpireSeconds: number;
  active: boolean;
  lastTestStatus?: string; // SUCCESS / FAIL / NONE
  lastTestError?: string;
  lastTestTime?: string; // 如果后端有返回
}

interface FileStorageConfigDTO {
  id?: number;
  bucketName: string;
  bucketPurpose: string;
  connectionId: number;
  basePath?: string;
  maxFileSize?: number; // bytes
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  retentionDays?: number;
  autoCleanup: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SaveStorageConfigRequest
  extends Omit<FileStorageConfigDTO, "createdAt" | "updatedAt" | "enabled"> {
  enabled?: boolean; // 新增时可一并启用
}

interface ApiErrorBody {
  timestamp?: string;
  path?: string;
  code?: string;
  message?: string;
}

interface BusinessPurposeInfo { code:string; label:string; description?:string; module?:string; recommended?:boolean; }

// 常用文件类型（扩展名 -> 对应 MIME 列表）用于快速选择
const COMMON_FILE_TYPES: { label: string; ext: string; mimes: string[] }[] = [
  { label: "JPEG", ext: "jpg", mimes: ["image/jpeg"] },
  { label: "PNG", ext: "png", mimes: ["image/png"] },
  { label: "GIF", ext: "gif", mimes: ["image/gif"] },
  { label: "WEBP", ext: "webp", mimes: ["image/webp"] },
  { label: "SVG", ext: "svg", mimes: ["image/svg+xml"] },
  { label: "PDF", ext: "pdf", mimes: ["application/pdf"] },
  { label: "TXT", ext: "txt", mimes: ["text/plain"] },
  { label: "JSON", ext: "json", mimes: ["application/json"] },
  { label: "XML", ext: "xml", mimes: ["application/xml", "text/xml"] },
  { label: "DOC", ext: "doc", mimes: ["application/msword"] },
  { label: "DOCX", ext: "docx", mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  { label: "XLS", ext: "xls", mimes: ["application/vnd.ms-excel"] },
  { label: "XLSX", ext: "xlsx", mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  { label: "PPT", ext: "ppt", mimes: ["application/vnd.ms-powerpoint"] },
  { label: "PPTX", ext: "pptx", mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"] },
  { label: "ZIP", ext: "zip", mimes: ["application/zip"] },
  { label: "GZIP", ext: "gz", mimes: ["application/gzip"] },
  { label: "TAR", ext: "tar", mimes: ["application/x-tar"] },
  { label: "MP3", ext: "mp3", mimes: ["audio/mpeg"] },
  { label: "WAV", ext: "wav", mimes: ["audio/wav", "audio/x-wav"] },
  { label: "MP4", ext: "mp4", mimes: ["video/mp4"] },
  { label: "MOV", ext: "mov", mimes: ["video/quicktime"] },
  { label: "AVI", ext: "avi", mimes: ["video/x-msvideo"] },
  { label: "CSV", ext: "csv", mimes: ["text/csv"] },
  { label: "MD", ext: "md", mimes: ["text/markdown"] },
];

export default function StorageConfigPage() {
  const [tab, setTab] = useState(0); // 0: 连接  1: 存储配置
  // 2: 文件测试

  // 连接
  const [connections, setConnections] = useState<ConnectionDTO[]>([]);
  const [connLoading, setConnLoading] = useState(false);
  const [connDialogOpen, setConnDialogOpen] = useState(false);
  const [editingConn, setEditingConn] = useState<ConnectionDTO | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [connForm, setConnForm] = useState({
    name: "",
    endpointUrl: "",
    accessKey: "",
    secretKey: "",
    pathStyleAccess: true,
    secureFlag: false,
    defaultPresignExpireSeconds: 600,
    active: true,
  });

  // 存储配置
  const [configs, setConfigs] = useState<FileStorageConfigDTO[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] =
    useState<FileStorageConfigDTO | null>(null);
  const [configForm, setConfigForm] = useState<SaveStorageConfigRequest>({
    bucketName: "",
    bucketPurpose: "",
    connectionId: 0,
    basePath: "",
    maxFileSize: undefined,
    allowedExtensions: [],
    allowedMimeTypes: [],
    retentionDays: 365,
    autoCleanup: false,
    enabled: true,
  });
  // 人类友好 MaxSize 输入（支持 10Mi / 1Gi / 500K / 123 等）
  const [maxSizeInput, setMaxSizeInput] = useState("");
  const [maxSizeError, setMaxSizeError] = useState<string | null>(null);
  const [extInput, setExtInput] = useState("");
  const [mimeInput, setMimeInput] = useState("");
  const [deletingConfigId, setDeletingConfigId] = useState<number | null>(null);
  const [purposeOptions, setPurposeOptions] = useState<BusinessPurposeInfo[]>([]);

  // 通知
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, msg: "", severity: "success" });
  const openToast = (
    msg: string,
    severity: typeof toast.severity = "success"
  ) => setToast({ open: true, msg, severity });
  // ---- API helpers ----
  const api = axios.create({ baseURL: "" }); // 使用相对路径，方便代理
  const parseErr = (e: unknown): string => {
    if (axios.isAxiosError(e)) {
      const ae = e as AxiosError<ApiErrorBody>;
      return (
        ae.response?.data?.message || ae.response?.data?.code || ae.message
      );
    }
    return e instanceof Error ? e.message : "请求失败";
  };

  // ---- 加载数据 ----
  useEffect(() => {
    (async () => {
      setConnLoading(true);
      try {
        const { data } = await api.get<ConnectionDTO[]>(
          "/api/object-storage/connections"
        );
        setConnections(data || []);
      } catch (e) {
        openToast("加载连接失败: " + parseErr(e), "error");
      } finally {
        setConnLoading(false);
      }
    })();
    (async () => {
      setConfigLoading(true);
      try {
        const { data } = await api.get<FileStorageConfigDTO[]>(
          "/api/object-storage/storage-configs"
        );
        setConfigs(data || []);
      } catch (e) {
        openToast("加载存储配置失败: " + parseErr(e), "error");
      } finally {
        setConfigLoading(false);
      }
    })();
    (async () => {
      try {
        const { data } = await api.get<BusinessPurposeInfo[]>("/api/object-storage/purposes");
        setPurposeOptions(data || []);
  } catch{ /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 连接操作 ----
  const openAddConnection = () => {
    setEditingConn(null);
    setConnForm({
      name: "",
      endpointUrl: "",
      accessKey: "",
      secretKey: "",
      pathStyleAccess: true,
      secureFlag: false,
      defaultPresignExpireSeconds: 600,
      active: true,
    });
    setConnDialogOpen(true);
  };
  const openEditConnection = (c: ConnectionDTO) => {
    setEditingConn(c);
    setConnForm({
      name: c.name,
      // 显示时去掉协议，用户只编辑 host[:port]
      endpointUrl: c.endpointUrl.replace(/^https?:\/\//i, ""),
      accessKey: "",
      secretKey: "",
      pathStyleAccess: c.pathStyleAccess,
      secureFlag: c.secureFlag,
      defaultPresignExpireSeconds: c.defaultPresignExpireSeconds,
      active: c.active,
    });
    setConnDialogOpen(true);
  };
  const saveConnection = async () => {
    if (!connForm.name || !connForm.endpointUrl) return;
    // 统一去掉可能粘贴的协议前缀
    const hostPort = connForm.endpointUrl.replace(/^https?:\/\//i, "").trim();
    // 根据 secureFlag 组装最终 endpointUrl
    const fullEndpoint = `${connForm.secureFlag ? "https" : "http"}://${hostPort}`;
    const payload: Partial<ConnectionDTO> & {
      id?: number;
      accessKeyEncrypted?: string;
      secretKeyEncrypted?: string;
      provider: string;
    } = {
      id: editingConn?.id,
      name: connForm.name,
      provider: "MINIO",
      endpointUrl: fullEndpoint,
      pathStyleAccess: connForm.pathStyleAccess,
      secureFlag: connForm.secureFlag,
      defaultPresignExpireSeconds: connForm.defaultPresignExpireSeconds,
      active: connForm.active,
    };
    if (connForm.accessKey) payload.accessKeyEncrypted = connForm.accessKey; // 按后端约定：纯文本将自行包装
    if (connForm.secretKey) payload.secretKeyEncrypted = connForm.secretKey;
    try {
      const { data } = await api.post<ConnectionDTO>(
        "/api/object-storage/connections",
        payload
      );
      openToast(editingConn ? "连接已更新" : "连接已创建", "success");
      setConnDialogOpen(false);
      // 合并/替换
      setConnections((prev) => {
        const exists = prev.find((p) => p.id === data.id);
        if (exists) return prev.map((p) => (p.id === data.id ? data : p));
        return [...prev, data];
      });
    } catch (e) {
      openToast(parseErr(e), "error");
    }
  };
  const toggleConnectionActive = async (c: ConnectionDTO) => {
    // 通过再次保存更新 active
    try {
      const payload = { ...c, active: !c.active };
      const { data } = await api.post<ConnectionDTO>(
        "/api/object-storage/connections",
        payload
      );
      setConnections((prev) => prev.map((x) => (x.id === data.id ? data : x)));
    } catch (e) {
      openToast("切换失败: " + parseErr(e), "error");
    }
  };
  const testConnection = async (c: ConnectionDTO) => {
    if (!c.id) return;
    setTestingId(c.id);
    try {
      const { data } = await api.post<ConnectionDTO>(
        `/api/object-storage/connections/${c.id}/test`
      );
      openToast("测试完成", "info");
      setConnections((prev) => prev.map((x) => (x.id === data.id ? data : x)));
    } catch (e) {
      openToast("测试失败: " + parseErr(e), "error");
    } finally {
      setTestingId(null);
    }
  };
  const deleteConnectionLocal = (id?: number) => {
    if (!id) return;
    // 调用后端删除
    (async () => {
      try {
        await api.delete(`/api/object-storage/connections/${id}`);
        setConnections((prev) => prev.filter((c) => c.id !== id));
        openToast('连接已删除','success');
      } catch(e){
        openToast('删除失败: ' + parseErr(e), 'error');
      }
    })();
  }; // 使用后端删除接口

  // ---- 存储配置操作 ----
  const openAddConfig = () => {
    setEditingConfig(null);
    setConfigForm({
      bucketName: "",
      bucketPurpose: "",
      connectionId: connections[0]?.id || 0,
      basePath: "",
      maxFileSize: undefined,
      allowedExtensions: [],
      allowedMimeTypes: [],
      retentionDays: 365,
      autoCleanup: false,
      enabled: true,
    });
    setMaxSizeInput("");
    setMaxSizeError(null);
    setExtInput("");
    setMimeInput("");
    setConfigDialogOpen(true);
  };
  const openEditConfig = (cfg: FileStorageConfigDTO) => {
    setEditingConfig(cfg);
    setConfigForm({ ...cfg });
    if(cfg.maxFileSize){
      // 优先 Gi / Mi / Ki 输出整除的人类可读格式
      const v = cfg.maxFileSize;
      const Gi = 1024**3, Mi = 1024**2, Ki = 1024;
      let display = String(v);
      if(v % Gi === 0) display = (v / Gi) + 'Gi';
      else if(v % Mi === 0) display = (v / Mi) + 'Mi';
      else if(v % Ki === 0) display = (v / Ki) + 'Ki';
      setMaxSizeInput(display);
    } else {
      setMaxSizeInput("");
    }
    setMaxSizeError(null);
    setConfigDialogOpen(true);
  };
  const pushExt = () => {
    const v = extInput.trim().toLowerCase().replace(/^\./, "");
    if (v && !configForm.allowedExtensions.includes(v))
      setConfigForm((f) => ({
        ...f,
        allowedExtensions: [...f.allowedExtensions, v],
      }));
    setExtInput("");
  };
  const pushMime = () => {
    const v = mimeInput.trim();
    if (v && !configForm.allowedMimeTypes.includes(v))
      setConfigForm((f) => ({
        ...f,
        allowedMimeTypes: [...f.allowedMimeTypes, v],
      }));
    setMimeInput("");
  };
  const removeExt = (x: string) => {
    // 若是常用映射里的扩展，复用 toggle 逻辑保证同步清理其关联且未被其它扩展需要的 MIME
    if (COMMON_FILE_TYPES.some(t => t.ext === x)) {
      toggleCommonFileType(x);
      return;
    }
    // 否则仅移除扩展本身
    setConfigForm((f) => ({
      ...f,
      allowedExtensions: f.allowedExtensions.filter((e) => e !== x),
    }));
  };
  const removeMime = (x: string) =>
    setConfigForm((f) => ({
      ...f,
      allowedMimeTypes: f.allowedMimeTypes.filter((e) => e !== x),
    }));

  // 切换常用文件类型：添加/移除扩展，同时维护 MIME（移除时仅移除不再被其它已选映射引用的 MIME）
  const toggleCommonFileType = (ext: string) => {
    const mapping = COMMON_FILE_TYPES.find((t) => t.ext === ext);
    if (!mapping) return;
    setConfigForm((f) => {
      const has = f.allowedExtensions.includes(ext);
      if (has) {
        const newExts = f.allowedExtensions.filter((e) => e !== ext);
        // 重新计算剩余扩展需要的 MIME
        const remainingNeededMimes = new Set<string>();
        for (const e of newExts) {
          const m2 = COMMON_FILE_TYPES.find((t) => t.ext === e);
            m2?.mimes.forEach((m) => remainingNeededMimes.add(m));
        }
        const newMimes = f.allowedMimeTypes.filter(
          (m) => !mapping.mimes.includes(m) || remainingNeededMimes.has(m)
        );
        return { ...f, allowedExtensions: newExts, allowedMimeTypes: newMimes };
      } else {
        const newExts = [...f.allowedExtensions, ext];
        const newMimes = [...f.allowedMimeTypes];
        mapping.mimes.forEach((m) => {
          if (!newMimes.includes(m)) newMimes.push(m);
        });
        return { ...f, allowedExtensions: newExts, allowedMimeTypes: newMimes };
      }
    });
  };
  const saveConfig = async () => {
    if (
      !configForm.bucketName ||
      !configForm.bucketPurpose ||
      !configForm.connectionId
    ) {
      openToast("必填字段缺失", "warning");
      return;
    }
    // 解析 max size 必填
    const parsed = parseMaxSize(maxSizeInput);
    if(parsed.error){ setMaxSizeError(parsed.error); openToast(parsed.error, 'error'); return; }
    if(parsed.value == null){ setMaxSizeError('请填写文件大小'); openToast('请填写文件大小','error'); return; }
    setConfigForm(f=> ({ ...f, maxFileSize: parsed.value }));
    const payload: SaveStorageConfigRequest = { ...configForm };
    payload.maxFileSize = parsed.value!;
    try {
      const { data } = await api.post<FileStorageConfigDTO>(
        "/api/object-storage/storage-configs",
        payload
      );
      openToast(editingConfig ? "配置已更新" : "配置已创建", "success");
      setConfigDialogOpen(false);
      setConfigs((prev) => {
        const exists = prev.find((p) => p.id === data.id);
        if (exists) return prev.map((p) => (p.id === data.id ? data : p));
        return [...prev, data];
      });
    } catch (e) {
      openToast("保存失败: " + parseErr(e), "error");
    }
  };
  const toggleConfigEnabled = async (cfg: FileStorageConfigDTO) => {
    if (!cfg.id) return;
    try {
      const { data } = await api.post<FileStorageConfigDTO>(
        `/api/object-storage/storage-configs/${cfg.id}/enable`,
        null,
        { params: { enabled: !cfg.enabled } }
      );
      setConfigs((prev) => prev.map((x) => (x.id === data.id ? data : x)));
    } catch (e) {
      openToast("切换失败: " + parseErr(e), "error");
    }
  };
  const deleteConfig = async () => {
    if (!deletingConfigId) return;
    try {
      await api.delete(
        `/api/object-storage/storage-configs/${deletingConfigId}`
      );
      openToast("已删除", "success");
      setConfigs((prev) => prev.filter((c) => c.id !== deletingConfigId));
    } catch (e) {
      openToast("删除失败: " + parseErr(e), "error");
    } finally {
      setDeletingConfigId(null);
    }
  };

  // 统计
  const activeConnection = useMemo(
    () => connections.find((c) => c.active),
    [connections]
  );
  const enabledConfigCount = useMemo(
    () => configs.filter((c) => c.enabled).length,
    [configs]
  );

  // -------- 文件测试状态 --------
  interface UploadTempItem {
    file: File;
    status: 'pending' | 'creating' | 'uploading' | 'confirming' | 'done' | 'error';
    progress: number; // 0-100
    error?: string;
    fileObjectId?: number;
    objectKey?: string;
    downloadUrl?: string;
  }
  const [testBucketPurpose, setTestBucketPurpose] = useState("");
  const [testBusinessType, setTestBusinessType] = useState("DEMO");
  const [testBusinessId, setTestBusinessId] = useState<number | ''>("");
  const [testFiles, setTestFiles] = useState<UploadTempItem[]>([]);
  const [listing, setListing] = useState(false); // 文件列表加载中占位
  interface FileObjectDTO { id: number; originalFilename: string; sizeBytes: number; status: string; createdAt?: string; }
  const [fileList, setFileList] = useState<FileObjectDTO[]>([]);
  const [loadingDownloadId, setLoadingDownloadId] = useState<number | null>(null);

  // ---- 文件上传/列表/下载相关函数 ----
  const findConfigByPurpose = (purpose: string) => configs.find(c=> c.bucketPurpose === purpose);

  const validateBeforeUpload = (file: File): string | null => {
    const cfg = findConfigByPurpose(testBucketPurpose || '');
    if(!cfg) return '未找到对应存储配置';
  if(typeof cfg.maxFileSize === 'number' && cfg.maxFileSize > 0 && file.size > cfg.maxFileSize) return '超出最大尺寸限制';
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    if(cfg.allowedExtensions.length>0 && ext && !cfg.allowedExtensions.map(e=>e.toLowerCase()).includes(ext)) return '扩展名不允许';
    // MIME 只能在 confirm 时传递，这里做基本校验（若列表非空则必须在其中）
    if(cfg.allowedMimeTypes.length>0 && file.type && !cfg.allowedMimeTypes.includes(file.type)) return 'MIME 类型不允许';
    return null;
  };

  const createUpload = async (item: UploadTempItem, index: number) => {
    try {
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'creating', progress:0, error:undefined}: p));
      const payload = {
        bucketPurpose: testBucketPurpose,
        originalFilename: item.file.name,
        businessRefType: testBusinessType,
        businessRefId: Number(testBusinessId),
        expectedSize: item.file.size
      };
      const { data } = await api.post('/api/object-storage/upload/create', payload);
      return data; // createUploadResponse
    } catch(e){
      const msg = parseErr(e);
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error: msg}: p));
      return null;
    }
  };

  const putFile = async (item: UploadTempItem, index: number, presignUrl: string, fileObjectId: number) => {
    try {
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'uploading', fileObjectId, progress:0 }: p));
      // 使用 XMLHttpRequest 以便获取进度
      await new Promise<void>((resolve,reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignUrl, true);
        xhr.upload.onprogress = (ev)=>{
          if(ev.lengthComputable){
            const percent = Math.round(ev.loaded / ev.total * 100);
            setTestFiles(prev => prev.map((p,i)=> i===index? {...p, progress: percent}: p));
          }
        };
        xhr.onload = ()=>{
          if(xhr.status >=200 && xhr.status <300) resolve(); else reject(new Error('PUT失败:'+xhr.status));
        };
        xhr.onerror = ()=> reject(new Error('网络错误'));
        xhr.send(item.file);
      });
      return true;
    } catch(e){
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error: (e as Error).message}: p));
      return false;
    }
  };

  const confirmUpload = async (item: UploadTempItem, index: number) => {
    try {
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'confirming'}: p));
      if(!item.fileObjectId){
        // 不应发生，做保护
        console.warn('confirmUpload 缺少 fileObjectId', item);
        setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error:'缺少 fileObjectId'}: p));
        return;
      }
      try {
        const resp = await api.post('/api/object-storage/upload/confirm', {
          fileObjectId: item.fileObjectId,
          sizeBytes: item.file.size,
          mimeType: (item.file.type || 'application/octet-stream').toLowerCase()
        });
        console.debug('confirmUpload success', resp.data);
        setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'done', progress:100}: p));
      } catch(err: unknown){
        const msg = parseErr(err);
        console.error('confirmUpload failed', msg, err);
        // 如果是“当前状态不允许确认”尝试刷新一次列表（可能已经被确认或状态已变更）
        if(/当前状态不允许确认/i.test(msg)){
          await loadFileList();
        }
        setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error: msg}: p));
      }
    } catch(e){
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error: parseErr(e)}: p));
    }
  };

  const startUploadOne = async (index: number) => {
    const item = testFiles[index];
    if(!item || item.status !== 'pending') return;
    const vErr = validateBeforeUpload(item.file);
    if(vErr){
      setTestFiles(prev => prev.map((p,i)=> i===index? {...p, status:'error', error: vErr}: p));
      return;
    }
    const createResp = await createUpload(item, index);
    if(!createResp || !createResp.fileObjectId){
      return; // 已标记错误
    }
    const fileObjectId = createResp.fileObjectId as number;
    const ok = await putFile(item, index, createResp.presignUrl, fileObjectId);
    if(!ok) return;
    // 直接构造包含 fileObjectId 的最新 item 传入 confirm，避免依赖异步 state 读取
    const latest: UploadTempItem = { ...item, fileObjectId };
    await confirmUpload(latest, index);
    // 上传完成刷新文件列表
    await loadFileList();
  };

  const startBatchUpload = async () => {
    for(let i=0;i<testFiles.length;i++){
      if(testFiles[i].status==='pending'){
        await startUploadOne(i);
      }
    }
  };

  const loadFileList = async () => {
    if(!testBucketPurpose || !testBusinessType || testBusinessId==='') return;
    try {
      setListing(true);
      const { data } = await api.get(`/api/object-storage/business/${encodeURIComponent(testBusinessType)}/${testBusinessId}/files`, { params: { bucketPurpose: testBucketPurpose }});
      // 后端返回 FileObjectDTO[]
      setFileList(data || []);
    } catch(e){
      openToast('加载文件列表失败: '+parseErr(e), 'error');
    } finally {
      setListing(false);
    }
  };

  const downloadFile = async (id: number) => {
    try {
      setLoadingDownloadId(id);
      const { data } = await api.get(`/api/object-storage/files/${id}/download-info`);
      if(data && data.downloadUrl){
        window.open(data.downloadUrl, '_blank');
      } else {
        openToast('未获取到 downloadUrl', 'warning');
      }
    } catch(e){
      openToast('下载信息获取失败: '+parseErr(e), 'error');
    } finally {
      setLoadingDownloadId(null);
    }
  };


  // ---- Max Size 解析函数 ----
  function parseMaxSize(raw: string): { value?: number; error?: string } {
    if(!raw) return { error: '文件大小为必填' };
    const s = raw.trim();
    const re = /^([0-9]+)(\.?[0-9]*)?\s*(B|K|KB|M|MB|G|GB|Mi|Gi|Ki)?$/i;
    const m = s.match(re);
    if(!m) return { error: '格式错误，示例: 10Mi / 512K / 1Gi / 1048576' };
    const intPart = m[1];
    const fracPart = m[2] || '';
    const unit = (m[3] || 'B').toUpperCase();
    const num = parseFloat(intPart + fracPart);
    if(isNaN(num)) return { error: '数值解析失败' };
    let multiplier = 1;
    switch(unit){
      case 'B': multiplier = 1; break;
      case 'K': case 'KB': multiplier = 1000; break;
      case 'M': case 'MB': multiplier = 1000**2; break;
      case 'G': case 'GB': multiplier = 1000**3; break;
      case 'KI': multiplier = 1024; break;
      case 'MI': multiplier = 1024**2; break;
      case 'GI': multiplier = 1024**3; break;
      default: return { error: '不支持的单位' };
    }
    const value = Math.floor(num * multiplier);
    if(value <=0) return { error: '大小必须大于 0' };
    if(value > 5 * 1024**4) return { error: '数值过大' }; // >5 TiB 直接拒绝
    return { value };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ p: 2, minHeight: "100vh" }}>
        {/* 头部卡片 */}
        <Paper
          sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 3,
            background: (t) =>
              t.palette.mode === "light"
                ? `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`
                : alpha("#2196f3", 0.3),
            color: "#fff",
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              component={Link}
              href="/admin/dashboard"
              sx={{ color: "#fff" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                对象存储配置
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                MinIO 连接与存储配置管理（实时接口）
              </Typography>
            </Box>
            <Chip
              label={
                activeConnection
                  ? `当前启用: ${activeConnection.name}`
                  : "未启用连接"
              }
              color={activeConnection ? "success" : "default"}
              variant="outlined"
              sx={{
                bgcolor: alpha("#fff", 0.15),
                color: "#fff",
                borderColor: alpha("#fff", 0.5),
              }}
            />
            <Chip
              label={`启用配置 ${enabledConfigCount}`}
              color="secondary"
              variant="outlined"
              sx={{
                bgcolor: alpha("#fff", 0.15),
                color: "#fff",
                borderColor: alpha("#fff", 0.4),
              }}
            />
          </Box>
        </Paper>

        <Paper sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
              // 让指示线在圆角容器内且带圆角
              "& .MuiTabs-indicator": {
                height: 3,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              },
            }}
          >
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="连接配置"
            />
            <Tab icon={<StorageIcon />} iconPosition="start" label="存储配置" />
            <Tab icon={<UploadFileIcon />} iconPosition="start" label="文件测试" />
          </Tabs>
        </Paper>

        {tab === 0 && (
          <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                对象存储连接
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={openAddConnection}
              >
                新增连接
              </Button>
            </Box>
            {connLoading && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>名称</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="center">路径风格</TableCell>
                  <TableCell align="center">HTTPS</TableCell>
                  <TableCell align="center">Presign(s)</TableCell>
                  <TableCell align="center">测试</TableCell>
                  <TableCell align="center">状态</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connections.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.endpointUrl}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={c.pathStyleAccess ? "Path" : "Virtual"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {c.secureFlag ? "✅" : "❌"}
                    </TableCell>
                    <TableCell align="center">
                      {c.defaultPresignExpireSeconds}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          c.lastTestError ||
                          (c.lastTestStatus ? c.lastTestStatus : "未测试")
                        }
                      >
                        <span>
                          <Chip
                            size="small"
                            color={
                              c.lastTestStatus === "SUCCESS"
                                ? "success"
                                : c.lastTestStatus === "FAIL"
                                ? "error"
                                : "default"
                            }
                            icon={
                              c.lastTestStatus === "SUCCESS" ? (
                                <CloudDoneIcon />
                              ) : c.lastTestStatus === "FAIL" ? (
                                <CloudOffIcon />
                              ) : undefined
                            }
                            label={c.lastTestStatus || "NONE"}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={c.active}
                        onChange={() => toggleConnectionActive(c)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Tooltip title="测试连接">
                          <span>
                            <IconButton
                              size="small"
                              disabled={testingId === c.id}
                              onClick={() => testConnection(c)}
                              color="primary"
                            >
                              {testingId === c.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <RefreshIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="编辑">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => openEditConnection(c)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="本地移除(无后端接口)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteConnectionLocal(c.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {connections.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      {connLoading
                        ? "正在加载..."
                        : "暂无连接，点击右上方“新增连接”"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tab === 1 && (
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                存储配置 (bucketPurpose)
              </Typography>
              <Button
                startIcon={<AddIcon />}
                size="small"
                variant="contained"
                onClick={openAddConfig}
              >
                新增配置
              </Button>
            </Box>
            {configLoading && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Bucket</TableCell>
                  <TableCell>BasePath</TableCell>
                  <TableCell>关联连接</TableCell>
                  <TableCell align="center">限制Ext</TableCell>
                  <TableCell align="center">限制MIME</TableCell>
                  <TableCell align="center">Retention</TableCell>
                  <TableCell align="center">AutoCleanup</TableCell>
                  <TableCell align="center">启用</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.map((cfg) => (
                  <TableRow key={cfg.id} hover>
                    <TableCell>
                      <Chip size="small" label={cfg.bucketPurpose} />
                    </TableCell>
                    <TableCell>{cfg.bucketName}</TableCell>
                    <TableCell>{cfg.basePath || "-"}</TableCell>
                    <TableCell>{cfg.connectionId}</TableCell>
                    <TableCell align="center">
                      {cfg.allowedExtensions.length || "∞"}
                    </TableCell>
                    <TableCell align="center">
                      {cfg.allowedMimeTypes.length || "∞"}
                    </TableCell>
                    <TableCell align="center">
                      {cfg.retentionDays || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {cfg.autoCleanup ? "✅" : "❌"}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={cfg.enabled}
                        onChange={() => toggleConfigEnabled(cfg)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => openEditConfig(cfg)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeletingConfigId(cfg.id!)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {configs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      {configLoading
                        ? "正在加载..."
                        : "暂无配置，点击右上方“新增配置”"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tab === 2 && (
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              文件上传/下载测试
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              选择启用的 bucketPurpose 与业务标识，添加文件后执行：CreateUpload -&gt; PUT -&gt; ConfirmUpload。
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>bucketPurpose</InputLabel>
                <Select
                  label="bucketPurpose"
                  value={testBucketPurpose}
                  onChange={(e)=> setTestBucketPurpose(e.target.value)}
                >
                  {configs.filter(c=>c.enabled).map(cfg => (
                    <MenuItem key={cfg.id} value={cfg.bucketPurpose}>{cfg.bucketPurpose}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="业务类型"
                value={testBusinessType}
                onChange={(e)=> setTestBusinessType(e.target.value)}
              />
              <TextField
                size="small"
                label="业务ID"
                type="number"
                value={testBusinessId}
                onChange={(e)=> setTestBusinessId(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Button
                variant="outlined"
                disabled={!testBucketPurpose || !testBusinessType || testBusinessId === ''}
                onClick={()=>{ setListing(true); setTimeout(()=>{ setListing(false); /* future: fetch list then setFileList */}, 600); }}
              >加载文件列表</Button>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                disabled={!testBucketPurpose || !testBusinessType || testBusinessId === ''}
              >
                选择文件
                <input
                  hidden
                  multiple
                  type="file"
                  onChange={(e)=>{
                    const files = Array.from(e.target.files || []);
                    if(files.length){
                      setTestFiles(prev => ([...prev, ...files.map(f=>({ file: f, status: 'pending' as const, progress: 0 }))]));
                    }
                    e.target.value='';
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                disabled={testFiles.filter(f=> f.status==='pending').length === 0}
                onClick={()=> startBatchUpload()}
              >开始上传</Button>
            </Stack>
            <Box>
              {testFiles.length === 0 && <Typography variant="body2" color="text.secondary">未选择任何文件。</Typography>}
              <Stack spacing={1}>
                {testFiles.map((it, idx)=>(
                  <Paper key={idx} variant="outlined" sx={{ p:1, display:'flex', alignItems:'center', gap:1 }}>
                    <Box flexGrow={1}>
                      <Typography variant="body2" noWrap>{it.file.name}</Typography>
                      <LinearProgress value={it.progress} variant="determinate" sx={{ height: 6, borderRadius: 1, mt: 0.5 }} />
                    </Box>
                    <Chip size="small" label={it.status} color={it.status==='done'? 'success' : it.status==='error' ? 'error' : 'default'} />
                    <IconButton size="small" disabled={it.status !== 'pending'} onClick={()=> setTestFiles(prev => prev.filter((_,i)=> i!==idx))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" gutterBottom>业务文件列表 (占位)</Typography>
            {listing && <Typography variant="body2">正在加载列表...</Typography>}
            {!listing && fileList.length === 0 && (
              <Typography variant="body2" color="text.secondary">暂无数据。</Typography>
            )}
            {!listing && fileList.length > 0 && (
              <Table size="small" sx={{ mt:1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>文件名</TableCell>
                    <TableCell align="right">大小</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>创建时间</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fileList.map(f => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.id}</TableCell>
                      <TableCell>{f.originalFilename}</TableCell>
                      <TableCell align="right">{(f.sizeBytes/1024).toFixed(1)} KB</TableCell>
                      <TableCell>{f.status}</TableCell>
                      <TableCell>{f.createdAt || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" disabled={loadingDownloadId===f.id} onClick={()=> downloadFile(f.id)}>
                          {loadingDownloadId===f.id? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        )}

        {/* 连接编辑对话框 */}
        <Dialog
          open={connDialogOpen}
          onClose={() => setConnDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          <DialogTitle sx={{ pb: 1.5 }}>
            {editingConn ? "编辑连接" : "新增连接"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                background: (t) =>
                  alpha(
                    t.palette.primary.main,
                    t.palette.mode === "light" ? 0.03 : 0.12
                  ),
              }}
            >
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                基本信息
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 0.5 }}>
                <Box
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                >
                  <TextField
                    label="名称"
                    value={connForm.name}
                    onChange={(e) =>
                      setConnForm((f) => ({ ...f, name: e.target.value }))
                    }
                    size="small"
                    fullWidth
                    autoFocus
                  />
                </Box>
                <Box
                  sx={{ flexBasis: { xs: "100%", md: "66.666%" }, flexGrow: 2 }}
                >
                  <TextField
                    label="Endpoint URL"
                    placeholder="例如: localhost:9000 或 minio.company.com:9000 (无需 http://)"
                    value={connForm.endpointUrl}
                    onChange={(e) => {
                      const v = e.target.value;
                      // 自动剥离协议，保持输入只有 host[:port]
                      const stripped = v.replace(/^https?:\/\//i, "");
                      setConnForm((f) => ({ ...f, endpointUrl: stripped }));
                    }}
                    size="small"
                    fullWidth
                    helperText={
                      connForm.secureFlag
                        ? "将以 https:// 前缀提交"
                        : "将以 http:// 前缀提交"
                    }
                  />
                </Box>
                <Box
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                >
                  <TextField
                    label="Access Key"
                    value={connForm.accessKey}
                    onChange={(e) =>
                      setConnForm((f) => ({ ...f, accessKey: e.target.value }))
                    }
                    size="small"
                    fullWidth
                    placeholder={editingConn ? "需重新输入" : ""}
                  />
                </Box>
                <Box
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                >
                  <TextField
                    label="Secret Key"
                    type={showSecret ? "text" : "password"}
                    value={connForm.secretKey}
                    onChange={(e) =>
                      setConnForm((f) => ({ ...f, secretKey: e.target.value }))
                    }
                    size="small"
                    fullWidth
                    placeholder={editingConn ? "需重新输入" : ""}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowSecret((s) => !s)}
                          >
                            {showSecret ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                >
                  <TextField
                    label="Presign 过期时间"
                    type="number"
                    value={connForm.defaultPresignExpireSeconds}
                    onChange={(e) =>
                      setConnForm((f) => ({
                        ...f,
                        defaultPresignExpireSeconds:
                          Number(e.target.value) || 0,
                      }))
                    }
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">秒</InputAdornment>
                      ),
                    }}
                    helperText="默认预签名 URL 失效时间"
                  />
                </Box>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                高级与启用
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                mt={1}
                flexWrap="wrap"
              >
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={connForm.pathStyleAccess}
                      onChange={(e) =>
                        setConnForm((f) => ({
                          ...f,
                          pathStyleAccess: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Path Style"
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={connForm.secureFlag}
                      onChange={(e) =>
                        setConnForm((f) => ({
                          ...f,
                          secureFlag: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="HTTPS"
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={connForm.active}
                      onChange={(e) =>
                        setConnForm((f) => ({ ...f, active: e.target.checked }))
                      }
                    />
                  }
                  label="启用"
                />
                {editingConn && (
                  <Tooltip title="测试连接">
                    <span>
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        disabled={testingId === editingConn.id}
                        variant="outlined"
                        onClick={() =>
                          editingConn && testConnection(editingConn)
                        }
                      >
                        {testingId === editingConn.id
                          ? "测试中..."
                          : "测试连接"}
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Path Style 适合兼容 S3 的私有部署；Access/Secret
                留空表示不修改。
              </Typography>
            </Paper>
            <Alert
              severity="info"
              variant="outlined"
              sx={{ borderStyle: "dashed" }}
            >
              保存后密钥不会以明文返回；再次编辑需重新输入。
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button onClick={() => setConnDialogOpen(false)}>取消</Button>
            <Button
              variant="contained"
              disabled={!connForm.name || !connForm.endpointUrl}
              onClick={saveConnection}
            >
              {editingConn ? "保存修改" : "创建连接"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 存储配置编辑对话框 */}
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          <DialogTitle>
            {editingConfig ? "编辑存储配置" : "新增存储配置"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                基本信息
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 0.5 }}>
                <TextField
                  select
                  label="用途"
                  value={configForm.bucketPurpose || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if(v === '__custom__'){
                      // 设为空等待下一个自定义输入框填写
                      setConfigForm(f=> ({...f, bucketPurpose: '' }));
                    } else {
                      setConfigForm(f=> ({...f, bucketPurpose: String(v) }));
                    }
                  }}
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                  disabled={!!editingConfig}
                  helperText={editingConfig ? "不可修改" : "内置用途或选择自定义"}
                >
                  {purposeOptions.map(p => (
                    <MenuItem key={p.code} value={p.code}>{p.label} {p.recommended? '(推荐)':''}</MenuItem>
                  ))}
                  <MenuItem value="__custom__">自定义...</MenuItem>
                </TextField>
                {(!editingConfig && !purposeOptions.find(p=> p.code === configForm.bucketPurpose)) && (
                  <TextField
                    label="自定义用途标识"
                    value={configForm.bucketPurpose}
                    onChange={(e)=> setConfigForm(f=> ({...f, bucketPurpose: e.target.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g,'_')}))}
                    size="small"
                    sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                    placeholder="例如 LEAVE_ATTACHMENT"
                    helperText="建议使用大写 + 下划线，具有语义且稳定不可随意修改"
                  />
                )}
                <TextField
                  label="Bucket 名称"
                  value={configForm.bucketName}
                  onChange={(e) =>
                    setConfigForm((f) => ({
                      ...f,
                      bucketName: e.target.value.trim(),
                    }))
                  }
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                />
                <TextField
                  select
                  label="关联连接"
                  value={configForm.connectionId || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConfigForm((f) => ({
                      ...f,
                      connectionId: typeof v === 'number' ? v : Number(v) || 0,
                    }));
                  }}
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                  helperText={connections.length === 0 ? "请先创建连接" : "选择一个已存在连接"}
                  disabled={connections.length === 0}
                >
                  {editingConfig && configForm.connectionId && !connections.find(c=> c.id === configForm.connectionId) && (
                    <MenuItem value={configForm.connectionId}>ID: {configForm.connectionId} (已不在连接列表)</MenuItem>
                  )}
                  {connections.map(c=> (
                    <MenuItem key={c.id} value={c.id!}>{c.name} (ID:{c.id})</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Base Path"
                  value={configForm.basePath}
                  onChange={(e) =>
                    setConfigForm((f) => ({ ...f, basePath: e.target.value }))
                  }
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                  placeholder="可为空"
                />
                <TextField
                  label="Max Size"
                  value={maxSizeInput}
                  onChange={(e)=> {
                    const v = e.target.value;
                    setMaxSizeInput(v);
                    if(maxSizeError){
                      const r = parseMaxSize(v);
                      setMaxSizeError(r.error || null);
                    }
                  }}
                  onBlur={()=> {
                    if(!maxSizeInput){ setMaxSizeError('文件大小为必填'); return; }
                    const r = parseMaxSize(maxSizeInput);
                    setMaxSizeError(r.error || null);
                  }}
                  error={!!maxSizeError}
                  helperText={maxSizeError || '必填，支持: 10Mi / 512K / 1Gi / 1048576 (B,K,Ki,M,Mi,G,Gi)'}
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                  placeholder="例如 10Mi 或 512K"
                  required
                />
                <TextField
                  label="RetentionDays"
                  type="number"
                  value={configForm.retentionDays ?? ""}
                  onChange={(e) =>
                    setConfigForm((f) => ({
                      ...f,
                      retentionDays: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  size="small"
                  sx={{ flexBasis: { xs: "100%", md: "33.333%" }, flexGrow: 1 }}
                  placeholder="逻辑删除天数"
                />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                扩展名限制
              </Typography>
              {/* 固定输入行 */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  label="新增扩展"
                  value={extInput}
                  onChange={(e) => setExtInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); pushExt(); }
                  }}
                  placeholder="如: jpg"
                  sx={{ width: 180 }}
                />
                <Button variant="contained" size="small" onClick={pushExt}>添加</Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                  已选 {configForm.allowedExtensions.length || 0}
                </Typography>
              </Box>
              {/* 已选扩展 Chips 区域 */}
              <Box sx={{
                maxHeight: 96,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
                border: theme => `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
                mb: 1,
              }}>
                {configForm.allowedExtensions.length === 0 && (
                  <Typography variant="caption" color="text.secondary">暂无限制（为空表示不限制）</Typography>
                )}
                {configForm.allowedExtensions.map(ext => (
                  <Chip key={ext} size="small" label={ext} onDelete={() => removeExt(ext)} />
                ))}
              </Box>
              {/* 常用快捷选择 */}
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>常用类型</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COMMON_FILE_TYPES.map(t => {
                  const active = configForm.allowedExtensions.includes(t.ext);
                  return (
                    <Chip
                      key={t.ext}
                      label={t.label}
                      color={active ? 'primary' : 'default'}
                      variant={active ? 'filled' : 'outlined'}
                      size="small"
                      onClick={() => toggleCommonFileType(t.ext)}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                点击常用类型快速添加/移除；自动同步 MIME。
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                MIME 限制
              </Typography>
              {/* 固定输入行 */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  label="新增 MIME"
                  value={mimeInput}
                  onChange={(e) => setMimeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); pushMime(); } }}
                  placeholder="如: image/jpeg"
                  sx={{ width: 220 }}
                />
                <Button variant="contained" size="small" onClick={pushMime}>添加</Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                  已选 {configForm.allowedMimeTypes.length || 0}
                </Typography>
              </Box>
              <Box sx={{
                maxHeight: 96,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
                border: theme => `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
              }}>
                {configForm.allowedMimeTypes.length === 0 && (
                  <Typography variant="caption" color="text.secondary">暂无限制（为空表示不限制）</Typography>
                )}
                {configForm.allowedMimeTypes.map(m => (
                  <Chip key={m} size="small" label={m} onDelete={() => removeMime(m)} />
                ))}
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                功能开关
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                mt={1}
                flexWrap="wrap"
              >
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={configForm.autoCleanup}
                      onChange={(e) =>
                        setConfigForm((f) => ({
                          ...f,
                          autoCleanup: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Auto Cleanup"
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={!!configForm.enabled}
                      onChange={(e) =>
                        setConfigForm((f) => ({
                          ...f,
                          enabled: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="启用"
                />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                AutoCleanup=true 时由后端定时任务按 retentionDays 标记删除。
              </Typography>
            </Paper>
            <Alert severity="info" variant="outlined">
              objectKey 生成规则: [basePath/]yyyy/MM/dd/uuid.ext
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigDialogOpen(false)}>取消</Button>
            <Button
              variant="contained"
              onClick={saveConfig}
              disabled={
                !configForm.bucketPurpose ||
                !configForm.bucketName ||
                !configForm.connectionId ||
                !!maxSizeError ||
                !maxSizeInput
              }
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* 删除配置确认 */}
        <Dialog
          open={!!deletingConfigId}
          onClose={() => setDeletingConfigId(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              删除前请确保无引用文件；若后端返回引用错误请先清理文件。
            </Alert>
            <Typography variant="body2">
              确定要删除该存储配置 (ID: {deletingConfigId}) ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeletingConfigId(null)}>取消</Button>
            <Button color="error" variant="contained" onClick={deleteConfig}>
              删除
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={2800}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
