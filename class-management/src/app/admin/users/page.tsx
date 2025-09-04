"use client";

import { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Typography,
	Card,
	CardContent,
	TextField,
	InputAdornment,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Checkbox,
	FormControlLabel,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Tabs,
	Tab,
	Snackbar,
	Alert,
	CircularProgress,
	Tooltip,
  
} from '@mui/material';
import {
	Search as SearchIcon,
	Refresh as RefreshIcon,
	Edit as EditIcon,
	Group as GroupIcon,
	AccountTree as AccountTreeIcon,
	Person as PersonIcon,
	Save as SaveIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// ================= Types =================
interface Teacher {
	id: number;
	name: string;
	teacherNo: string;
	phone?: string;
	email?: string;
	createdAt?: string;
	roles?: string[]; // 组织角色（非系统账号角色）
	homeroomClassId?: number | null;
	homeroomClassName?: string | null;
	departmentName?: string | null;
	grade?: string | null;
}

interface Department {
	id: number;
	name: string;
	code: string;
	enabled: boolean;
}

interface ClassItem {
	id: number;
	name: string;
	grade: string;
	department?: { id: number; name: string } | null;
	teacher?: { id: number; name: string } | null; // 班主任
}

// 组织角色常量
const ORG_ROLES = ['班主任', '系部主任', '年级主任', '校长'];

// ================= Mock 数据（前端本地模拟，可随时替换为真实接口） =================
const mockDepartments: Department[] = [
	{ id: 1, name: '计算机系', code: 'CS', enabled: true },
	{ id: 2, name: '外语系', code: 'FL', enabled: true },
	{ id: 3, name: '数学系', code: 'MATH', enabled: true },
];

const mockClasses: ClassItem[] = [
	{ id: 101, name: '计算机 23-1 班', grade: '高一', department: { id: 1, name: '计算机系' }, teacher: { id: 11, name: '王强' } },
	{ id: 102, name: '计算机 23-2 班', grade: '高一', department: { id: 1, name: '计算机系' }, teacher: { id: 12, name: '李丽' } },
	{ id: 103, name: '外语 23-1 班', grade: '高一', department: { id: 2, name: '外语系' }, teacher: { id: 13, name: '周敏' } },
	{ id: 201, name: '计算机 22-1 班', grade: '高二', department: { id: 1, name: '计算机系' }, teacher: { id: 11, name: '王强' } },
	{ id: 202, name: '数学 22-1 班', grade: '高二', department: { id: 3, name: '数学系' }, teacher: { id: 14, name: '赵云' } },
];

let mockTeachers: Teacher[] = [
	{ id: 11, name: '王强', teacherNo: 'T2023001', phone: '13800000011', email: 'wangqiang@example.com', roles: ['班主任', '年级主任'], homeroomClassId: 101, homeroomClassName: '计算机 23-1 班', departmentName: '计算机系', grade: '高一' },
	{ id: 12, name: '李丽', teacherNo: 'T2023002', phone: '13800000012', email: 'lili@example.com', roles: ['班主任'], homeroomClassId: 102, homeroomClassName: '计算机 23-2 班', departmentName: '计算机系', grade: '高一' },
	{ id: 13, name: '周敏', teacherNo: 'T2023003', phone: '13800000013', email: 'zhoumin@example.com', roles: ['系部主任'], departmentName: '外语系', grade: '高一' },
	{ id: 14, name: '赵云', teacherNo: 'T2023004', roles: ['班主任'], homeroomClassId: 202, homeroomClassName: '数学 22-1 班', departmentName: '数学系', grade: '高二' },
	{ id: 99, name: '校长', teacherNo: 'T0000001', roles: ['校长'], departmentName: '计算机系', grade: '高一' },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const teacherApi = {
	listTeachers: async (): Promise<Teacher[]> => { await delay(120); return JSON.parse(JSON.stringify(mockTeachers)); },
	listClasses: async (): Promise<ClassItem[]> => { await delay(100); return JSON.parse(JSON.stringify(mockClasses)); },
	listDepartments: async (): Promise<Department[]> => { await delay(80); return JSON.parse(JSON.stringify(mockDepartments)); },
	updateTeacherRoles: async (teacherId: number, payload: { roles: string[]; homeroomClassId?: number | null }) => {
		await delay(150);
		mockTeachers = mockTeachers.map(t => t.id === teacherId ? {
			...t,
			roles: [...payload.roles],
			homeroomClassId: payload.roles.includes('班主任') ? payload.homeroomClassId || undefined : undefined,
			homeroomClassName: payload.roles.includes('班主任') ? (mockClasses.find(c => c.id === payload.homeroomClassId)?.name || undefined) : undefined,
		} : t);
		return mockTeachers.find(t => t.id === teacherId);
	},
};

// ================= Component =================
export default function UsersPage() {
	const [tab, setTab] = useState(0);
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loading, setLoading] = useState(false);
		// 错误信息直接通过 snackbar 呈现，不单独保留 state
	const [search, setSearch] = useState('');
	const [filterGrade, setFilterGrade] = useState<string>('');
	const [filterDept, setFilterDept] = useState<string>('');
	const [filterRole, setFilterRole] = useState<string>('');

	// 编辑对话框
	const [editDialog, setEditDialog] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
	const [roleDraft, setRoleDraft] = useState<string[]>([]);
	const [draftHomeroomClassId, setDraftHomeroomClassId] = useState<number | ''>('');
	const [saving, setSaving] = useState(false);

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
		{ open: false, message: '', severity: 'info' }
	);

	// 组织岗位映射（可视化配置）
	const [principalId, setPrincipalId] = useState<number | null>(() => {
		const p = mockTeachers.find(t => t.roles?.includes('校长'));
		return p ? p.id : null;
	});
	const [gradeLeaders, setGradeLeaders] = useState<Record<string, number | null>>(() => {
		const map: Record<string, number | null> = {};
		mockTeachers.forEach(t => {
			if (t.roles?.includes('年级主任') && t.grade) map[t.grade] = t.id;
		});
		return map;
	});
	const [departmentHeads, setDepartmentHeads] = useState<Record<string, number | null>>(() => {
		const map: Record<string, number | null> = {};
		mockTeachers.forEach(t => {
			if (t.roles?.includes('系部主任') && t.departmentName) map[t.departmentName] = t.id;
		});
		return map;
	});

	// 流程图交互状态
	const [activeNode, setActiveNode] = useState<'principal' | 'grade' | 'department' | 'class' | null>('principal');
	const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
	const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

	// 加载数据
	const loadAll = async () => {
		setLoading(true);
		const [t, c, d] = await Promise.all([
			teacherApi.listTeachers(),
			teacherApi.listClasses(),
			teacherApi.listDepartments(),
		]);
		setTeachers(t); setClasses(c); setDepartments(d); setLoading(false);
	};

	useEffect(() => { loadAll(); }, []);

	// 过滤后的教师
	const filteredTeachers = useMemo(() => {
		return teachers.filter(t => {
			const kw = search.trim();
			if (kw && !(`${t.name}${t.teacherNo}`.includes(kw))) return false;
			if (filterGrade && t.grade !== filterGrade) return false;
			if (filterDept && t.departmentName !== filterDept) return false;
			if (filterRole && !(t.roles || []).includes(filterRole)) return false;
			return true;
		});
	}, [teachers, search, filterGrade, filterDept, filterRole]);

	const uniqueGrades = useMemo(() => Array.from(new Set(classes.map(c => c.grade))).sort(), [classes]);
	const uniqueDepartments = useMemo(() => Array.from(new Set(departments.map(d => d.name))), [departments]);

	// 组织结构构建： grade -> department -> classes
	const orgTree = useMemo(() => {
		const gradeMap: Record<string, { departments: Record<string, { classes: ClassItem[] }> }> = {};
		classes.forEach(c => {
			if (!gradeMap[c.grade]) gradeMap[c.grade] = { departments: {} };
			const deptName = c.department?.name || '未分配系部';
			if (!gradeMap[c.grade].departments[deptName]) gradeMap[c.grade].departments[deptName] = { classes: [] };
			gradeMap[c.grade].departments[deptName].classes.push(c);
		});
		return gradeMap;
	}, [classes]);

	const openEdit = (t: Teacher) => {
		setEditingTeacher(t);
		setRoleDraft([...(t.roles || [])]);
		setDraftHomeroomClassId(t.homeroomClassId || '');
		setEditDialog(true);
	};

	const toggleRoleDraft = (role: string) => {
		setRoleDraft(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
	};

	const saveTeacherRoles = async () => {
		if (!editingTeacher) return;
		setSaving(true);
		if (roleDraft.includes('班主任') && !draftHomeroomClassId) {
			setSnackbar({ open: true, message: '请选择班主任对应的班级', severity: 'error' });
			setSaving(false);
			return;
		}
		const homeroomClassId = roleDraft.includes('班主任') ? (draftHomeroomClassId === '' ? null : Number(draftHomeroomClassId)) : null;
		await teacherApi.updateTeacherRoles(editingTeacher.id, { roles: roleDraft, homeroomClassId });
		setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? {
			...t,
			roles: [...roleDraft],
			homeroomClassId: homeroomClassId ?? undefined,
			homeroomClassName: homeroomClassId ? (classes.find(c => c.id === homeroomClassId)?.name || null) : null,
		} : t));
		setSnackbar({ open: true, message: '已保存', severity: 'success' });
		setEditDialog(false);
		setSaving(false);
	};

	// ========== 可视化配置：内部更新工具 ==========
	const updateTeacherRoleSet = (teacherId: number | null, role: string, scopeFilter?: (t: Teacher) => boolean) => {
		setTeachers(prev => prev.map(t => {
			// 移除角色（如果该角色在该作用域只能唯一）
			if (!teacherId || (scopeFilter && scopeFilter(t)) || role === '校长' || role === '年级主任' || role === '系部主任') {
				if (t.roles?.includes(role)) {
					return { ...t, roles: t.roles.filter(r => r !== role) };
				}
			}
			return t;
		}));
		if (teacherId) {
			setTeachers(prev => prev.map(t => t.id === teacherId ? {
				...t,
				roles: t.roles ? (t.roles.includes(role) ? t.roles : [...t.roles, role]) : [role]
			} : t));
		}
	};

	const handleAssignPrincipal = (id: number | '') => {
		const newId = id === '' ? null : Number(id);
		updateTeacherRoleSet(newId, '校长', () => true);
		setPrincipalId(newId);
		setSnackbar({ open: true, message: '已更新校长', severity: 'success' });
	};

	const handleAssignGradeLeader = (grade: string, id: number | '') => {
		const newId = id === '' ? null : Number(id);
		updateTeacherRoleSet(newId, '年级主任', t => t.grade === grade);
		setGradeLeaders(prev => ({ ...prev, [grade]: newId }));
		setSnackbar({ open: true, message: `已更新${grade}年级主任`, severity: 'success' });
	};

	const handleAssignDepartmentHead = (deptName: string, id: number | '') => {
		const newId = id === '' ? null : Number(id);
		updateTeacherRoleSet(newId, '系部主任', t => t.departmentName === deptName);
		setDepartmentHeads(prev => ({ ...prev, [deptName]: newId }));
		setSnackbar({ open: true, message: `已更新${deptName}系部主任`, severity: 'success' });
	};

	const handleAssignHomeroomInline = (classId: number, teacherId: number | '') => {
		const newId = teacherId === '' ? null : Number(teacherId);
		// 去掉之前的班主任角色如果原来是这个班的教师
		setTeachers(prev => prev.map(t => {
			if (t.homeroomClassId === classId && t.id !== newId) {
				// 移除班主任角色
				return { ...t, homeroomClassId: undefined, homeroomClassName: undefined, roles: (t.roles || []).filter(r => r !== '班主任') };
			}
			return t;
		}));
		if (newId) {
			const cls = classes.find(c => c.id === classId);
			setTeachers(prev => prev.map(t => t.id === newId ? {
				...t,
				roles: t.roles ? (t.roles.includes('班主任') ? t.roles : [...t.roles, '班主任']) : ['班主任'],
				homeroomClassId: classId,
				homeroomClassName: cls?.name || undefined,
				grade: cls?.grade || t.grade,
				departmentName: cls?.department?.name || t.departmentName,
			} : t));
		}
		setSnackbar({ open: true, message: '班主任已更新', severity: 'success' });
	};

	const renderTeacherList = () => (
		<Card sx={{ 
			borderRadius: '8px', 
			border: '1px solid #e8eaed', 
			boxShadow: 'none',
			overflow: 'hidden'
		}}>
			<CardContent sx={{ p: 0 }}>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									姓名
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									工号
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									联系方式
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									班主任班级
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									所属系部
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									年级
								</TableCell>
								<TableCell sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									组织角色
								</TableCell>
								<TableCell align="right" sx={{ 
									fontWeight: 600, 
									color: '#4a5568',
									borderBottom: '1px solid #e8eaed',
									py: 2
								}}>
									操作
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredTeachers.map((t, index) => (
								<TableRow 
									key={t.id} 
									hover
									sx={{
										'&:hover': {
											backgroundColor: '#f8f9fa'
										},
										borderBottom: index === filteredTeachers.length - 1 ? 'none' : '1px solid #f0f2f5'
									}}
								>
									<TableCell sx={{ py: 2.5 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
											<Box sx={{
												width: 32,
												height: 32,
												borderRadius: '8px',
												backgroundColor: '#e2e8f0',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center'
											}}>
												<PersonIcon fontSize="small" sx={{ color: '#718096' }} />
											</Box>
											<Typography sx={{ fontWeight: 500, color: '#1a202c' }}>{t.name}</Typography>
										</Box>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: '#718096', fontFamily: 'monospace' }}>
											{t.teacherNo}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Box>
											<Typography variant="body2" sx={{ color: '#1a202c', fontWeight: 500 }}>
												{t.phone || '—'}
											</Typography>
											<Typography variant="caption" sx={{ color: '#a0aec0' }}>
												{t.email || ''}
											</Typography>
										</Box>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: '#1a202c' }}>
											{t.homeroomClassName || '—'}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: '#1a202c' }}>
											{t.departmentName || '—'}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: '#1a202c' }}>
											{t.grade || '—'}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
											{(t.roles || []).length === 0 && (
												<Chip 
													label="无" 
													size="small" 
													sx={{ 
														backgroundColor: '#f7fafc', 
														color: '#a0aec0',
														border: '1px solid #e2e8f0',
														fontWeight: 500
													}} 
												/>
											)}
											{(t.roles || []).map(r => (
												<Chip 
													key={r} 
													label={r} 
													size="small" 
													sx={{
														backgroundColor: r === '校长' ? '#fed7d7' : r === '年级主任' ? '#feebc8' : '#e2e8f0',
														color: r === '校长' ? '#c53030' : r === '年级主任' ? '#c05621' : '#4a5568',
														border: r === '校长' ? '1px solid #feb2b2' : r === '年级主任' ? '1px solid #fbd38d' : '1px solid #cbd5e0',
														fontWeight: 500
													}}
												/>
											))}
										</Box>
									</TableCell>
									<TableCell align="right" sx={{ py: 2.5 }}>
										<Tooltip title="编辑角色">
											<IconButton 
												size="small" 
												onClick={() => openEdit(t)}
												sx={{
													backgroundColor: '#f8f9fa',
													border: '1px solid #e8eaed',
													borderRadius: '6px',
													'&:hover': {
														backgroundColor: '#e2e8f0',
														borderColor: '#cbd5e0'
													}
												}}
											>
												<EditIcon fontSize="small" sx={{ color: '#718096' }} />
											</IconButton>
										</Tooltip>
									</TableCell>
								</TableRow>
							))}
							{filteredTeachers.length === 0 && !loading && (
								<TableRow>
									<TableCell colSpan={8} align="center" sx={{ py: 8, color: '#a0aec0' }}>
										<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
											<GroupIcon sx={{ fontSize: 48, color: '#e2e8f0' }} />
											<Typography variant="body2">暂无教师数据</Typography>
										</Box>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
				{loading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
						<CircularProgress size={28} sx={{ color: '#4a5568' }} />
					</Box>
				)}
			</CardContent>
		</Card>
	);

	const renderOrgTree = () => (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			{/* 顶部流程图 */}
			<Card sx={{ 
				borderRadius: '16px', 
				border: '1px solid #e8eaed', 
				boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
				overflow: 'hidden'
			}}>
				<CardContent sx={{ p: 4 }}>
					<Typography variant="h6" sx={{ 
						fontWeight: 700, 
						color: '#1a202c',
						mb: 3,
						textAlign: 'center'
					}}>
						组织架构流程图
					</Typography>
					
					{/* 流程图主体 */}
					<Box sx={{ 
						display: 'flex', 
						alignItems: 'center', 
						justifyContent: 'center',
						gap: 3,
						flexWrap: 'wrap',
						mb: 3
					}}>
						{/* 校长节点 */}
						<Box 
							onClick={() => setActiveNode('principal')}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1,
								cursor: 'pointer',
								p: 2,
								borderRadius: '12px',
								border: activeNode === 'principal' ? '2px solid #c53030' : '2px solid transparent',
								backgroundColor: activeNode === 'principal' ? '#fff5f5' : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: '#fff5f5',
									borderColor: '#feb2b2'
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: '#fed7d7',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: '2px solid #feb2b2'
							}}>
								<PersonIcon sx={{ color: '#c53030', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
								校长
							</Typography>
							{principalId && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: '#48bb78'
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{ 
							width: 0, 
							height: 0, 
							borderLeft: '8px solid #cbd5e0',
							borderTop: '6px solid transparent',
							borderBottom: '6px solid transparent'
						}} />

						{/* 年级主任节点 */}
						<Box 
							onClick={() => setActiveNode('grade')}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1,
								cursor: 'pointer',
								p: 2,
								borderRadius: '12px',
								border: activeNode === 'grade' ? '2px solid #c05621' : '2px solid transparent',
								backgroundColor: activeNode === 'grade' ? '#fffaf0' : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: '#fffaf0',
									borderColor: '#fbd38d'
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: '#feebc8',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: '2px solid #fbd38d'
							}}>
								<AccountTreeIcon sx={{ color: '#c05621', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
								年级主任
							</Typography>
							{Object.keys(gradeLeaders).length > 0 && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: '#48bb78'
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{ 
							width: 0, 
							height: 0, 
							borderLeft: '8px solid #cbd5e0',
							borderTop: '6px solid transparent',
							borderBottom: '6px solid transparent'
						}} />

						{/* 系部主任节点 */}
						<Box 
							onClick={() => setActiveNode('department')}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1,
								cursor: 'pointer',
								p: 2,
								borderRadius: '12px',
								border: activeNode === 'department' ? '2px solid #4a5568' : '2px solid transparent',
								backgroundColor: activeNode === 'department' ? '#f7fafc' : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: '#f7fafc',
									borderColor: '#cbd5e0'
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: '#e2e8f0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: '2px solid #cbd5e0'
							}}>
								<GroupIcon sx={{ color: '#4a5568', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
								系部主任
							</Typography>
							{Object.keys(departmentHeads).length > 0 && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: '#48bb78'
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{ 
							width: 0, 
							height: 0, 
							borderLeft: '8px solid #cbd5e0',
							borderTop: '6px solid transparent',
							borderBottom: '6px solid transparent'
						}} />

						{/* 班主任节点 */}
						<Box 
							onClick={() => setActiveNode('class')}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1,
								cursor: 'pointer',
								p: 2,
								borderRadius: '12px',
								border: activeNode === 'class' ? '2px solid #38a169' : '2px solid transparent',
								backgroundColor: activeNode === 'class' ? '#f0fff4' : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: '#f0fff4',
									borderColor: '#9ae6b4'
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: '#c6f6d5',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: '2px solid #9ae6b4'
							}}>
								<PersonIcon sx={{ color: '#38a169', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
								班主任
							</Typography>
							{teachers.some(t => t.homeroomClassId) && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: '#48bb78'
								}} />
							)}
						</Box>
					</Box>
				</CardContent>
			</Card>

			{/* 主要内容区域 - 左侧详情 + 右侧节点图 */}
			<Box sx={{ display: 'flex', gap: 4, minHeight: '500px' }}>
				{/* 左侧详情区域 */}
				<Box sx={{ flex: 1 }}>
					{activeNode === 'principal' && (
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card sx={{ 
								borderRadius: '12px', 
								border: '2px solid #fed7d7', 
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: '#c53030'
								}} />
								<CardContent sx={{ p: 4, backgroundColor: '#fffafa' }}>
									<Typography variant="h5" sx={{ 
										fontWeight: 700, 
										color: '#1a202c',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<PersonIcon sx={{ color: '#c53030', fontSize: 32 }} />
										校长配置
									</Typography>
									<Typography variant="body1" sx={{ color: '#718096', mb: 4 }}>
										校长是学校的最高管理者，负责学校整体运营、战略决策和对外事务。
									</Typography>
									<FormControl fullWidth size="medium">
										<InputLabel sx={{ color: '#718096' }}>选择校长</InputLabel>
										<Select 
											label="选择校长" 
											value={principalId ?? ''} 
											onChange={e => handleAssignPrincipal(e.target.value as number | '')}
											sx={{
												backgroundColor: 'white',
												borderRadius: '12px',
												'& .MuiOutlinedInput-notchedOutline': {
													borderColor: '#fed7d7'
												},
												'&:hover .MuiOutlinedInput-notchedOutline': {
													borderColor: '#feb2b2'
												},
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
													borderColor: '#c53030'
												}
											}}
										>
											<MenuItem value=""><em>未指派</em></MenuItem>
											{teachers.map(t => (
												<MenuItem key={t.id} value={t.id}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
														<Box sx={{
															width: 32,
															height: 32,
															borderRadius: '50%',
															backgroundColor: '#fed7d7',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center'
														}}>
															<PersonIcon sx={{ color: '#c53030', fontSize: 16 }} />
														</Box>
														<Box>
															<Typography>{t.name}</Typography>
															<Typography variant="caption" sx={{ color: '#718096' }}>
																{t.teacherNo} • {t.departmentName && `${t.departmentName}系`}
															</Typography>
														</Box>
													</Box>
												</MenuItem>
											))}
										</Select>
									</FormControl>
									{principalId && (
										<Box sx={{ mt: 3, p: 3, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fed7d7' }}>
											<Typography variant="body2" sx={{ color: '#38a169', fontWeight: 600 }}>
												✓ 校长已配置
											</Typography>
											<Typography variant="body2" sx={{ color: '#718096', mt: 1 }}>
												当前校长：{teachers.find(t => t.id === principalId)?.name}
											</Typography>
										</Box>
									)}
								</CardContent>
							</Card>
						</motion.div>
					)}

					{activeNode === 'grade' && (
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card sx={{ 
								borderRadius: '12px', 
								border: '2px solid #feebc8', 
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: '#c05621'
								}} />
								<CardContent sx={{ p: 4, backgroundColor: '#fffbf5' }}>
									<Typography variant="h5" sx={{ 
										fontWeight: 700, 
										color: '#1a202c',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<AccountTreeIcon sx={{ color: '#c05621', fontSize: 32 }} />
										年级主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: '#718096', mb: 4 }}>
										年级主任负责特定年级的教学管理、学生管理和教师协调工作。
									</Typography>
									
									{Object.keys(orgTree).length === 0 ? (
										<Alert severity="info" sx={{ borderRadius: '8px' }}>
											暂无年级数据
										</Alert>
									) : (
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
											{Object.keys(orgTree).sort().map(grade => (
												<Box 
													key={grade}
													sx={{ 
														p: 3, 
														backgroundColor: 'white', 
														borderRadius: '8px', 
														border: selectedGrade === grade ? '2px solid #c05621' : '1px solid #feebc8',
														cursor: 'pointer',
														transition: 'all 0.3s ease',
														'&:hover': {
															borderColor: '#fbd38d'
														}
													}}
													onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
														<Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
															{grade}
														</Typography>
														<Box sx={{ flex: 1 }} />
														{gradeLeaders[grade] && (
															<Chip 
																label="已配置" 
																size="small" 
																sx={{ 
																	backgroundColor: '#d4edda',
																	color: '#155724',
																	fontWeight: 600
																}} 
															/>
														)}
													</Box>
													<FormControl fullWidth size="medium">
														<InputLabel sx={{ color: '#718096' }}>选择年级主任</InputLabel>
														<Select 
															label="选择年级主任" 
															value={gradeLeaders[grade] ?? ''} 
															onChange={e => handleAssignGradeLeader(grade, e.target.value as number | '')}
															sx={{
																backgroundColor: '#fafbfc',
																borderRadius: '8px',
																'& .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#feebc8'
																},
																'&:hover .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#fbd38d'
																},
																'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#c05621'
																}
															}}
														>
															<MenuItem value=""><em>未指派</em></MenuItem>
															{teachers.filter(t => !t.roles?.includes('校长')).map(t => (
																<MenuItem key={t.id} value={t.id}>
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
																		<Typography>{t.name}</Typography>
																		<Typography variant="caption" sx={{ color: '#718096' }}>
																			{t.departmentName && `${t.departmentName}系`}
																		</Typography>
																	</Box>
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</Box>
											))}
										</Box>
									)}
								</CardContent>
							</Card>
						</motion.div>
					)}

					{activeNode === 'department' && (
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card sx={{ 
								borderRadius: '12px', 
								border: '2px solid #e2e8f0', 
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: '#4a5568'
								}} />
								<CardContent sx={{ p: 4, backgroundColor: '#f8f9fa' }}>
									<Typography variant="h5" sx={{ 
										fontWeight: 700, 
										color: '#1a202c',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<GroupIcon sx={{ color: '#4a5568', fontSize: 32 }} />
										系部主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: '#718096', mb: 4 }}>
										系部主任负责特定专业系部的教学计划、课程安排和师资管理。
									</Typography>
									
									{departments.length === 0 ? (
										<Alert severity="info" sx={{ borderRadius: '8px' }}>
											暂无系部数据
										</Alert>
									) : (
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
											{departments.map(dept => (
												<Box 
													key={dept.id}
													sx={{ 
														p: 3, 
														backgroundColor: 'white', 
														borderRadius: '8px', 
														border: selectedDepartment === dept.name ? '2px solid #4a5568' : '1px solid #e2e8f0',
														cursor: 'pointer',
														transition: 'all 0.3s ease',
														'&:hover': {
															borderColor: '#cbd5e0'
														}
													}}
													onClick={() => setSelectedDepartment(selectedDepartment === dept.name ? null : dept.name)}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
														<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', flex: 1 }}>
															{dept.name}
														</Typography>
														{departmentHeads[dept.name] && (
															<Chip 
																label="已配置" 
																size="small" 
																sx={{ 
																	backgroundColor: '#d4edda',
																	color: '#155724',
																	fontWeight: 600
																}} 
															/>
														)}
													</Box>
													<FormControl fullWidth size="medium">
														<InputLabel sx={{ color: '#718096' }}>选择系部主任</InputLabel>
														<Select 
															label="选择系部主任" 
															value={departmentHeads[dept.name] ?? ''} 
															onChange={e => handleAssignDepartmentHead(dept.name, e.target.value as number | '')}
															sx={{
																backgroundColor: '#fafbfc',
																borderRadius: '8px',
																'& .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#e2e8f0'
																},
																'&:hover .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#cbd5e0'
																},
																'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
																	borderColor: '#4a5568'
																}
															}}
														>
															<MenuItem value=""><em>未指派</em></MenuItem>
															{teachers.filter(t => !t.roles?.includes('校长')).map(t => (
																<MenuItem key={t.id} value={t.id}>
																	{t.name}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</Box>
											))}
										</Box>
									)}
								</CardContent>
							</Card>
						</motion.div>
					)}

					{activeNode === 'class' && (
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card sx={{ 
								borderRadius: '12px', 
								border: '2px solid #c6f6d5', 
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: '#38a169'
								}} />
								<CardContent sx={{ p: 4, backgroundColor: '#f0fff4' }}>
									<Typography variant="h5" sx={{ 
										fontWeight: 700, 
										color: '#1a202c',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<PersonIcon sx={{ color: '#38a169', fontSize: 32 }} />
										班主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: '#718096', mb: 4 }}>
										班主任负责班级的日常管理、学生思想教育和家校沟通工作。
									</Typography>
									
									{Object.keys(orgTree).length === 0 ? (
										<Alert severity="info" sx={{ borderRadius: '8px' }}>
											暂无班级数据
										</Alert>
									) : (
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											{Object.entries(orgTree).sort().map(([grade, deptMap]) => (
												<Box key={grade}>
													<Typography variant="h6" sx={{ 
														fontWeight: 600, 
														color: '#1a202c',
														mb: 3,
														display: 'flex',
														alignItems: 'center',
														gap: 2
													}}>
														<Box sx={{
															width: 6,
															height: 24,
															backgroundColor: '#38a169',
															borderRadius: '3px'
														}} />
														{grade}
													</Typography>
													{Object.entries(deptMap.departments).map(([deptName, payload]) => (
														<Box key={deptName} sx={{ mb: 3, ml: 2 }}>
															<Typography variant="subtitle1" sx={{ 
																fontWeight: 600, 
																color: '#4a5568',
																mb: 2
															}}>
																{deptName}
															</Typography>
															<Box sx={{ 
																display: 'grid', 
																gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
																gap: 2
															}}>
																{payload.classes.map(c => {
																	const currentHomeroom = teachers.find(t => t.homeroomClassId === c.id);
																	return (
																		<Card 
																			key={c.id} 
																			sx={{ 
																				border: '1px solid #c6f6d5', 
																				borderRadius: '8px',
																				overflow: 'hidden',
																				'&:hover': {
																					borderColor: '#9ae6b4',
																					boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
																				}
																			}}
																		>
																			<Box sx={{
																				position: 'absolute',
																				top: 0,
																				left: 0,
																				right: 0,
																				height: 3,
																				backgroundColor: currentHomeroom ? '#38a169' : '#e2e8f0'
																			}} />
																			<CardContent sx={{ p: 3 }}>
																				<Typography variant="body1" sx={{ 
																					fontWeight: 600, 
																					color: '#1a202c',
																					mb: 2
																				}}>
																					{c.name}
																				</Typography>
																				<FormControl size="small" fullWidth>
																					<InputLabel sx={{ color: '#718096' }}>选择班主任</InputLabel>
																					<Select 
																						label="选择班主任" 
																						value={currentHomeroom?.id ?? ''} 
																						onChange={e => handleAssignHomeroomInline(c.id, e.target.value as number | '')}
																						sx={{
																							backgroundColor: '#fafbfc',
																							borderRadius: '6px',
																							'& .MuiOutlinedInput-notchedOutline': {
																								borderColor: '#c6f6d5'
																							},
																							'&:hover .MuiOutlinedInput-notchedOutline': {
																								borderColor: '#9ae6b4'
																							},
																							'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
																								borderColor: '#38a169'
																							}
																						}}
																					>
																						<MenuItem value=""><em>未指派</em></MenuItem>
																						{teachers.filter(t => 
																							!t.roles?.includes('校长') && 
																							(!t.homeroomClassId || t.homeroomClassId === c.id)
																						).map(t => (
																							<MenuItem key={t.id} value={t.id}>
																								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
																									<Typography>{t.name}</Typography>
																									<Typography variant="caption" sx={{ color: '#718096' }}>
																										{t.teacherNo}
																									</Typography>
																								</Box>
																							</MenuItem>
																						))}
																					</Select>
																				</FormControl>
																				{currentHomeroom && (
																					<Box sx={{ mt: 2, p: 2, backgroundColor: '#f0fff4', borderRadius: '6px', border: '1px solid #c6f6d5' }}>
																						<Typography variant="body2" sx={{ color: '#38a169', fontWeight: 600 }}>
																							✓ 班主任：{currentHomeroom.name}
																						</Typography>
																					</Box>
																				)}
																			</CardContent>
																		</Card>
																	);
																})}
															</Box>
														</Box>
													))}
												</Box>
											))}
										</Box>
									)}
								</CardContent>
							</Card>
						</motion.div>
					)}
				</Box>

				{/* 右侧节点图 */}
				<Box sx={{ width: '240px', flexShrink: 0 }}>
					<Card sx={{ 
						borderRadius: '12px', 
						border: '1px solid #e8eaed', 
						boxShadow: 'none',
						position: 'sticky',
						top: '20px'
					}}>
						<CardContent sx={{ p: 3 }}>
							<Typography variant="subtitle1" sx={{ 
								fontWeight: 600, 
								color: '#1a202c',
								mb: 3,
								textAlign: 'center'
							}}>
								当前位置
							</Typography>
							
							{/* 节点导航 */}
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{/* 校长节点 */}
								<Box 
									onClick={() => setActiveNode('principal')}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										p: 2,
										borderRadius: '8px',
										backgroundColor: activeNode === 'principal' ? '#fff5f5' : '#f8f9fa',
										border: activeNode === 'principal' ? '2px solid #feb2b2' : '1px solid #e8eaed',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: '#fff5f5'
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: '#fed7d7',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<PersonIcon sx={{ color: '#c53030', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
										校长
									</Typography>
									{principalId && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: '#48bb78',
											ml: 'auto'
										}} />
									)}
								</Box>
								
								{/* 连接线 */}
								{activeNode !== 'principal' && (
									<Box sx={{ 
										width: 2, 
										height: 12, 
										backgroundColor: '#e8eaed',
										alignSelf: 'center'
									}} />
								)}

								{/* 年级主任节点 */}
								<Box 
									onClick={() => setActiveNode('grade')}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										p: 2,
										borderRadius: '8px',
										backgroundColor: activeNode === 'grade' ? '#fffaf0' : '#f8f9fa',
										border: activeNode === 'grade' ? '2px solid #fbd38d' : '1px solid #e8eaed',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: '#fffaf0'
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: '#feebc8',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<AccountTreeIcon sx={{ color: '#c05621', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
										年级主任
									</Typography>
									{Object.keys(gradeLeaders).length > 0 && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: '#48bb78',
											ml: 'auto'
										}} />
									)}
								</Box>

								{/* 连接线 */}
								{(activeNode === 'department' || activeNode === 'class') && (
									<Box sx={{ 
										width: 2, 
										height: 12, 
										backgroundColor: '#e8eaed',
										alignSelf: 'center'
									}} />
								)}

								{/* 系部主任节点 */}
								<Box 
									onClick={() => setActiveNode('department')}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										p: 2,
										borderRadius: '8px',
										backgroundColor: activeNode === 'department' ? '#f7fafc' : '#f8f9fa',
										border: activeNode === 'department' ? '2px solid #cbd5e0' : '1px solid #e8eaed',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: '#f7fafc'
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: '#e2e8f0',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<GroupIcon sx={{ color: '#4a5568', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
										系部主任
									</Typography>
									{Object.keys(departmentHeads).length > 0 && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: '#48bb78',
											ml: 'auto'
										}} />
									)}
								</Box>

								{/* 连接线 */}
								{activeNode === 'class' && (
									<Box sx={{ 
										width: 2, 
										height: 12, 
										backgroundColor: '#e8eaed',
										alignSelf: 'center'
									}} />
								)}

								{/* 班主任节点 */}
								<Box 
									onClick={() => setActiveNode('class')}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										p: 2,
										borderRadius: '8px',
										backgroundColor: activeNode === 'class' ? '#f0fff4' : '#f8f9fa',
										border: activeNode === 'class' ? '2px solid #9ae6b4' : '1px solid #e8eaed',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: '#f0fff4'
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: '#c6f6d5',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<PersonIcon sx={{ color: '#38a169', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
										班主任
									</Typography>
									{teachers.some(t => t.homeroomClassId) && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: '#48bb78',
											ml: 'auto'
										}} />
									)}
								</Box>
							</Box>

							{/* 配置统计 */}
							<Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e8eaed' }}>
								<Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, display: 'block', mb: 2 }}>
									配置统计
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography variant="caption" sx={{ color: '#718096' }}>校长</Typography>
										<Typography variant="caption" sx={{ color: principalId ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
											{principalId ? '已配置' : '未配置'}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography variant="caption" sx={{ color: '#718096' }}>年级主任</Typography>
										<Typography variant="caption" sx={{ color: Object.keys(gradeLeaders).length > 0 ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
											{Object.keys(gradeLeaders).length}/{Object.keys(orgTree).length}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography variant="caption" sx={{ color: '#718096' }}>系部主任</Typography>
										<Typography variant="caption" sx={{ color: Object.keys(departmentHeads).length > 0 ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
											{Object.keys(departmentHeads).length}/{departments.length}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography variant="caption" sx={{ color: '#718096' }}>班主任</Typography>
										<Typography variant="caption" sx={{ color: teachers.filter(t => t.homeroomClassId).length > 0 ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
											{teachers.filter(t => t.homeroomClassId).length}/{classes.length}
										</Typography>
									</Box>
								</Box>
							</Box>
						</CardContent>
					</Card>
				</Box>
			</Box>
		</Box>
	);

	return (
		<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
			<Box sx={{ 
				p: 3, 
				backgroundColor: '#fafbfc', 
				minHeight: '100vh'
			}}>
				<Box sx={{ 
					mb: 4, 
					p: 3, 
					backgroundColor: 'white', 
					borderRadius: '12px',
					border: '1px solid #e8eaed',
					boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
				}}>
					<Typography variant="h4" sx={{ 
						fontWeight: 600, 
						mb: 1, 
						color: '#1a202c',
						letterSpacing: '-0.025em'
					}}>
						用户管理
					</Typography>
					<Typography variant="body1" sx={{ 
						color: '#718096',
						lineHeight: 1.6
					}}>
						管理教师信息与组织架构，配置岗位角色与职责分工
					</Typography>
				</Box>

				<Box sx={{ 
					backgroundColor: 'white',
					borderRadius: '12px',
					border: '1px solid #e8eaed',
					overflow: 'hidden',
					boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
				}}>
					<Tabs 
						value={tab} 
						onChange={(e, v) => setTab(v)} 
						sx={{ 
							borderBottom: '1px solid #e8eaed',
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 500,
								fontSize: '0.95rem',
								minHeight: 56,
								color: '#718096',
								'&.Mui-selected': {
									color: '#1a202c',
									fontWeight: 600
								}
							},
							'& .MuiTabs-indicator': {
								backgroundColor: '#4a5568',
								height: 2
							}
						}}
					>
						<Tab label="教师列表" icon={<GroupIcon />} iconPosition="start" />
						<Tab label="组织结构" icon={<AccountTreeIcon />} iconPosition="start" />
					</Tabs>

				{tab === 0 && (
					<Box sx={{ 
						p: 3,
						display: 'flex', 
						flexWrap: 'wrap', 
						gap: 2, 
						alignItems: 'center',
						backgroundColor: '#f8f9fa',
						borderBottom: '1px solid #e8eaed'
					}}>
						<TextField
							size="small"
							placeholder="搜索姓名或工号"
							value={search}
							onChange={e => setSearch(e.target.value)}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'white',
									borderRadius: '8px',
									'& fieldset': {
										borderColor: '#e8eaed'
									},
									'&:hover fieldset': {
										borderColor: '#cbd5e0'
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4a5568'
									}
								}
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" sx={{ color: '#a0aec0' }} />
									</InputAdornment>
								)
							}}
						/>
						<FormControl size="small" sx={{ minWidth: 120 }}>
							<InputLabel sx={{ color: '#718096' }}>年级</InputLabel>
							<Select 
								value={filterGrade} 
								label="年级" 
								onChange={e => setFilterGrade(e.target.value)}
								sx={{
									backgroundColor: 'white',
									borderRadius: '8px',
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: '#e8eaed'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#cbd5e0'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#4a5568'
									}
								}}
							>
								<MenuItem value=""><em>全部</em></MenuItem>
								{uniqueGrades.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
							</Select>
						</FormControl>
						<FormControl size="small" sx={{ minWidth: 140 }}>
							<InputLabel sx={{ color: '#718096' }}>系部</InputLabel>
							<Select 
								value={filterDept} 
								label="系部" 
								onChange={e => setFilterDept(e.target.value)}
								sx={{
									backgroundColor: 'white',
									borderRadius: '8px',
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: '#e8eaed'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#cbd5e0'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#4a5568'
									}
								}}
							>
								<MenuItem value=""><em>全部</em></MenuItem>
								{uniqueDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
							</Select>
						</FormControl>
						<FormControl size="small" sx={{ minWidth: 160 }}>
							<InputLabel sx={{ color: '#718096' }}>组织角色</InputLabel>
							<Select 
								value={filterRole} 
								label="组织角色" 
								onChange={e => setFilterRole(e.target.value)}
								sx={{
									backgroundColor: 'white',
									borderRadius: '8px',
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: '#e8eaed'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#cbd5e0'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#4a5568'
									}
								}}
							>
								<MenuItem value=""><em>全部</em></MenuItem>
								{ORG_ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
							</Select>
						</FormControl>
						<IconButton 
							onClick={loadAll}
							sx={{ 
								backgroundColor: 'white',
								border: '1px solid #e8eaed',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: '#f8f9fa',
									borderColor: '#cbd5e0'
								}
							}}
						>
							<RefreshIcon sx={{ color: '#718096' }} />
						</IconButton>
					</Box>
				)}

				{tab === 0 && (
					<Box sx={{ p: 3 }}>
						{renderTeacherList()}
					</Box>
				)}
				{tab === 1 && (
					<Box sx={{ p: 3 }}>
						{renderOrgTree()}
					</Box>
				)}
				</Box>
			</Box>

			{/* 编辑角色弹窗 */}
			<Dialog 
				open={editDialog} 
				onClose={() => setEditDialog(false)} 
				maxWidth="sm" 
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '12px',
						boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
					}
				}}
			>
				<DialogTitle sx={{ 
					p: 3, 
					pb: 1,
					color: '#1a202c',
					fontWeight: 600
				}}>
					教师角色分配
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					{editingTeacher && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							<Box sx={{ 
								p: 3, 
								backgroundColor: '#f8f9fa', 
								borderRadius: '8px',
								border: '1px solid #e8eaed'
							}}>
								<Typography variant="subtitle1" sx={{ 
									fontWeight: 600, 
									color: '#1a202c',
									mb: 0.5
								}}>
									{editingTeacher.name}
								</Typography>
								<Typography variant="body2" sx={{ 
									color: '#718096',
									fontFamily: 'monospace'
								}}>
									{editingTeacher.teacherNo}
								</Typography>
							</Box>
							
							<Box>
								<Typography variant="body2" sx={{ 
									color: '#718096', 
									mb: 2,
									fontWeight: 500
								}}>
									选择该教师的组织岗位
								</Typography>
								<Box sx={{ 
									display: 'grid', 
									gridTemplateColumns: 'repeat(2, 1fr)', 
									gap: 2
								}}>
									{ORG_ROLES.map(r => (
										<FormControlLabel
											key={r}
											control={
												<Checkbox 
													checked={roleDraft.includes(r)} 
													onChange={() => toggleRoleDraft(r)}
													sx={{
														color: '#cbd5e0',
														'&.Mui-checked': {
															color: '#4a5568'
														}
													}}
												/>
											}
											label={
												<Typography sx={{ 
													fontWeight: 500,
													color: roleDraft.includes(r) ? '#1a202c' : '#718096'
												}}>
													{r}
												</Typography>
											}
											sx={{
												border: '1px solid #e8eaed',
												borderRadius: '8px',
												p: 1.5,
												m: 0,
												backgroundColor: roleDraft.includes(r) ? '#f0f4f8' : 'white',
												borderColor: roleDraft.includes(r) ? '#cbd5e0' : '#e8eaed'
											}}
										/>
									))}
								</Box>
							</Box>
							
							{roleDraft.includes('班主任') && (
								<FormControl size="small" fullWidth>
									<InputLabel sx={{ color: '#718096' }}>班主任班级</InputLabel>
									<Select
										label="班主任班级"
										value={draftHomeroomClassId}
										onChange={e => setDraftHomeroomClassId(e.target.value as number)}
										sx={{
											borderRadius: '8px',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: '#e8eaed'
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: '#cbd5e0'
											},
											'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
												borderColor: '#4a5568'
											}
										}}
									>
										{classes.map(c => (
											<MenuItem key={c.id} value={c.id}>
												{c.name}（{c.grade} / {c.department?.name || '无系部'}）
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
							
							<Alert 
								severity="info" 
								sx={{ 
									borderRadius: '8px',
									border: '1px solid #bee3f8',
									backgroundColor: '#ebf8ff',
									color: '#2b6cb0'
								}}
							>
								说明：这里的岗位与账号系统角色不同，仅用于组织/审批链条（如班主任、年级主任）。
							</Alert>
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 3, pt: 0 }}>
					<Button 
						onClick={() => setEditDialog(false)}
						sx={{ 
							color: '#718096',
							textTransform: 'none',
							fontWeight: 500
						}}
					>
						取消
					</Button>
					<Button 
						variant="contained" 
						startIcon={<SaveIcon />} 
						disabled={saving} 
						onClick={saveTeacherRoles} 
						sx={{ 
							boxShadow: 'none',
							backgroundColor: '#4a5568',
							color: 'white',
							textTransform: 'none',
							fontWeight: 500,
							borderRadius: '8px',
							'&:hover': {
								backgroundColor: '#2d3748',
								boxShadow: 'none'
							},
							'&:disabled': {
								backgroundColor: '#e2e8f0',
								color: '#a0aec0'
							}
						}}
					>
						{saving ? '保存中...' : '保存'}
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar(s => ({ ...s, open: false }))}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert 
					severity={snackbar.severity} 
					onClose={() => setSnackbar(s => ({ ...s, open: false }))} 
					sx={{ 
						width: '100%',
						borderRadius: '8px',
						fontWeight: 500
					}}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</motion.div>
	);
}

