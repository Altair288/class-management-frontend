"use client";

import { useEffect, useMemo, useState } from 'react';
import { alpha, Theme } from '@mui/material/styles';
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
	Warning as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// === 后端 DTO 结构 ===
interface TeacherRoleDTO {
	id: number;
	role: string;              // 角色名，例如: 班主任 / 系部主任 / 年级主任 / 校长
	classId?: number | null;
	className?: string | null;
	departmentId?: number | null;
	departmentName?: string | null;
	grade?: string | null;     // 对于年级主任时的年级
	scopeType: 'class' | 'department' | 'grade' | 'school';
}

// ================= Types =================
interface Teacher {
	id: number;
	name: string;
	teacherNo: string;
	phone?: string;
	email?: string;
	createdAt?: string;
	// 将后端传回的 roles 原始数组保留 rawRoles，roles 维护为字符串数组（便于现有 UI includes 判断）
	rawRoles?: TeacherRoleDTO[];
	roles?: OrgRoleCode[]; // 现在存放角色 code
	homeroomClassId?: number | null;
	homeroomClassName?: string | null;
	departmentId?: number | null;
	departmentName?: string | null;
	departmentCode?: string | null;
	grade?: string | null;
}

interface Department {
	id: number;
	name: string;
	code: string;
	enabled: boolean;
	description?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
}

interface ClassItem {
	id: number;
	name: string;
	grade: string;
	department?: { id: number | null; name: string | null | undefined } | null;
	teacher?: { id: number | null; name: string | null | undefined } | null; // 班主任
}

// === 新增：可分配审批角色 DTO（后端 assignable-roles & role-hierarchy 返回） ===
interface RoleDTO {
	id: number;
	code: string;
	displayName: string;
	category: string; // 期望 "APPROVAL" 等
	level: number;
	sortOrder: number;
	description?: string | null;
	enabled: boolean;
}

interface ScopesDTO {
	classes: { id: number; name: string; grade: string; departmentId?: number | null }[];
	departments: { id: number; name: string; code: string }[];
	grades: string[];
}

// === 角色代码常量 & Fallback 映射（与后端约定的 code，需要与后端保持一致） ===
const ROLE_CODES = {
	PRINCIPAL: 'PRINCIPAL',
	GRADE_LEADER: 'GRADE_HEAD', // 修正：与后端保持一致
	DEPARTMENT_HEAD: 'DEPT_HEAD', // 修正：与后端保持一致
	HOMEROOM_TEACHER: 'HOMEROOM' // 修正：与后端保持一致
} as const;

// 语义化角色色彩集中管理（便于统一深浅模式策略）
const roleAccent = (theme: Theme) => ({
  principal: theme.palette.error,
  grade: theme.palette.warning,
  department: theme.palette.info || theme.palette.secondary || theme.palette.primary,
  class: theme.palette.success
});

type OrgRoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES];

const FALLBACK_DISPLAY_NAME: Record<string, string> = {
	[ROLE_CODES.PRINCIPAL]: '校长',
	[ROLE_CODES.GRADE_LEADER]: '年级主任',
	[ROLE_CODES.DEPARTMENT_HEAD]: '系部主任',
	[ROLE_CODES.HOMEROOM_TEACHER]: '班主任'
};

// 根据当前可分配角色构造 displayName->code 映射
function buildDisplayToCode(assignableRoles?: RoleDTO[]): Record<string,string> {
	const map: Record<string,string> = {};
	if (assignableRoles) assignableRoles.forEach(r => { map[r.displayName] = r.code; });
	Object.entries(FALLBACK_DISPLAY_NAME).forEach(([code, display]) => { if (!map[display]) map[display] = code; });
	return map;
}

// 获取角色显示名（优先后端返回 displayName）
function getRoleDisplayName(code: string, assignableRoles: RoleDTO[]): string {
	const found = assignableRoles.find(r => r.code === code);
	return found?.displayName || FALLBACK_DISPLAY_NAME[code] || code;
}

// ================= 工具函数 =================
// 尽量使用宽松但非 any 的类型；后续可根据后端 Swagger 生成精确类型
const mapDtoToTeacher = (dto: Partial<Teacher> & { roles?: TeacherRoleDTO[] }, displayToCode?: Record<string,string>): Teacher => {
	// 后端暂仍返回中文显示名 r.role; 通过映射转换为 code；若找不到则保留原字串（兼容新旧）
	const roleCodes = (dto.roles || []).map((r: TeacherRoleDTO) => {
		if (!displayToCode) return r.role as OrgRoleCode | string;
		return (displayToCode[r.role] || r.role) as OrgRoleCode | string;
	});
	return {
		id: dto.id,
		name: dto.name,
		teacherNo: dto.teacherNo,
		phone: dto.phone,
		email: dto.email,
		homeroomClassId: dto.homeroomClassId,
		homeroomClassName: dto.homeroomClassName,
		grade: dto.grade,
		departmentId: dto.departmentId,
		departmentName: dto.departmentName,
		departmentCode: dto.departmentCode,
		rawRoles: dto.roles || [],
		roles: roleCodes as OrgRoleCode[],
	} as Teacher;
};

// ================= Component =================
export default function UsersPage() {
	const [tab, setTab] = useState(0);
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	// 新增：动态角色与层级、scopes
	const [assignableRoles, setAssignableRoles] = useState<RoleDTO[]>([]);
	const [gradesFromScope, setGradesFromScope] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	// 错误信息直接通过 snackbar 呈现，不单独保留 state
	const [search, setSearch] = useState('');
	const [filterGrade, setFilterGrade] = useState<string>('');
	const [filterDept, setFilterDept] = useState<string>('');
	const [filterRole, setFilterRole] = useState<string>(''); // 保存 code

	// 编辑对话框
	const [editDialog, setEditDialog] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
	const [roleDraft, setRoleDraft] = useState<OrgRoleCode[]>([]);
	const [draftHomeroomClassId, setDraftHomeroomClassId] = useState<number | ''>('');
	// 角色作用域草稿：key 为角色 code
	const [roleScopeDraft, setRoleScopeDraft] = useState<Record<OrgRoleCode, { grade?: string; departmentId?: number | null }>>({} as Record<OrgRoleCode, { grade?: string; departmentId?: number | null }>);
	const [saving, setSaving] = useState(false);

	// 确认对话框状态
	const [confirmDialog, setConfirmDialog] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState('');
	const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
	// 内联作用域（用于非班主任的年级/系部主任指派）
	const [gradeLeaderScopes, setGradeLeaderScopes] = useState<Record<number, string>>({});
	const [departmentHeadScopes, setDepartmentHeadScopes] = useState<Record<number, number>>({});

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
		{ open: false, message: '', severity: 'info' }
	);

	// 组织岗位映射（从教师数据动态推导）
	const [principalId, setPrincipalId] = useState<number | null>(null);
	const [gradeLeaders, setGradeLeaders] = useState<Record<string, number | null>>({});
	const [departmentHeads, setDepartmentHeads] = useState<Record<string, number | null>>({});

	// 流程图交互状态
	const [activeNode, setActiveNode] = useState<'principal' | 'grade' | 'department' | 'class' | null>('principal');
	const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
	const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

	// 加载数据
	const loadAll = async () => {
		try {
			setLoading(true);
			const [assignableRes, teacherRes, scopesRes] = await Promise.all([
				fetch('/api/teachers/management/assignable-roles', { credentials: 'include' }),
				fetch('/api/teachers/management', { credentials: 'include' }),
				fetch('/api/teachers/management/scopes', { credentials: 'include' })
			]);
			let displayToCode: Record<string,string> = {};
			if (assignableRes.ok) {
				const data = await assignableRes.json();
				if (Array.isArray(data)) setAssignableRoles(data as RoleDTO[]);
				if (Array.isArray(data)) {
					displayToCode = {};
					(data as RoleDTO[]).forEach(r => { displayToCode[r.displayName] = r.code; });
					Object.entries(FALLBACK_DISPLAY_NAME).forEach(([c,d]) => { if (!displayToCode[d]) displayToCode[d] = c; });
				}
			}
			if (!teacherRes.ok) throw new Error('教师数据获取失败');
			const teacherData = await teacherRes.json();
			interface TeacherDtoLikeBase { [k: string]: unknown; roles?: TeacherRoleDTO[] }
			const mapped: Teacher[] = Array.isArray(teacherData) ? (teacherData as TeacherDtoLikeBase[]).map(dto => mapDtoToTeacher(dto as Partial<Teacher> & { roles?: TeacherRoleDTO[] }, displayToCode)) : [];
			setTeachers(mapped as Teacher[]);
			if (scopesRes.ok) {
				const data: ScopesDTO = await scopesRes.json();
				if (Array.isArray(data.classes)) {
					const mappedClasses: ClassItem[] = data.classes.map(c => ({
						id: c.id,
						name: c.name,
						grade: c.grade,
						department: c.departmentId ? { id: c.departmentId, name: (data.departments.find(d => d.id === c.departmentId)?.name) || undefined } : null,
						teacher: undefined
					}));
					setClasses(mappedClasses);
				}
				if (Array.isArray(data.departments)) {
					const mappedDepts = data.departments.map(d => ({ id: d.id, name: d.name, code: d.code, enabled: true })) as Department[];
					setDepartments(mappedDepts);
				}
				if (Array.isArray(data.grades)) {
					setGradesFromScope(data.grades);
				}
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '加载失败';
			setSnackbar({ open: true, message: msg, severity: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadAll(); }, []);

	// 当 teachers 更新时重新推导组织岗位映射
	useEffect(() => {
		if (!teachers || teachers.length === 0) {
			setPrincipalId(null);
			setGradeLeaders({});
			setDepartmentHeads({});
			return;
		}
		const p = teachers.find(t => t.roles?.includes(ROLE_CODES.PRINCIPAL));
		setPrincipalId(p ? p.id : null);
		const gMap: Record<string, number | null> = {};
		const d2c = buildDisplayToCode(assignableRoles);
		teachers.forEach(t => {
			t.rawRoles?.forEach(r => {
				const code = d2c[r.role] || r.role;
				if (code === ROLE_CODES.GRADE_LEADER && r.grade) gMap[r.grade] = t.id;
			});
		});
		setGradeLeaders(gMap);
		const dMap: Record<string, number | null> = {};
		teachers.forEach(t => {
			const d2c2 = buildDisplayToCode(assignableRoles);
			t.rawRoles?.forEach(r => {
				const code = d2c2[r.role] || r.role;
				if (code === ROLE_CODES.DEPARTMENT_HEAD) {
					const deptName = t.departmentName || departments.find(d => d.id === (r.departmentId ?? t.departmentId ?? -1))?.name;
					if (deptName) dMap[deptName] = t.id;
				}
			});
		});
		setDepartmentHeads(dMap);
	}, [teachers, departments, assignableRoles]);

	// 过滤后的教师
	const filteredTeachers = useMemo(() => {
		return teachers.filter(t => {
			const kw = search.trim();
			if (kw && !(`${t.name}${t.teacherNo}`.includes(kw))) return false;
			if (filterGrade && t.grade !== filterGrade) return false;
			if (filterDept && t.departmentName !== filterDept) return false;
			if (filterRole && !(t.roles || []).includes(filterRole as OrgRoleCode)) return false;
			return true;
		});
	}, [teachers, search, filterGrade, filterDept, filterRole]);

	const uniqueGrades = useMemo(() => {
		const result = gradesFromScope.length ? [...gradesFromScope] : Array.from(new Set(classes.map(c => c.grade))).sort();
		return result;
	}, [gradesFromScope, classes]);

	// 动态角色列表（仅展示可分配审批角色的显示名）
	const roleDisplayList = useMemo(() => assignableRoles
		.filter(r => r.enabled)
		.sort((a,b) => a.level - b.level || a.sortOrder - b.sortOrder)
		.map(r => ({ code: r.code, display: r.displayName })), [assignableRoles]);
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

	// 获取教师的基本教学归属信息（排除行政角色的管理范围）
	const getTeacherBasicInfo = (teacher: Teacher) => {
		// 基本原则：
		// 1. 如果是班主任，显示班主任班级的系部和年级
		// 2. 如果不是班主任，显示教师本身的基本归属信息
		// 3. 避免因担任行政职务而显示管理范围
		
		if (teacher.homeroomClassId && teacher.homeroomClassName) {
			// 从班级信息中获取归属
			const classInfo = classes.find(c => c.id === teacher.homeroomClassId);
			if (classInfo) {
				return {
					departmentName: classInfo.department?.name || '未分配系部',
					grade: classInfo.grade,
					source: 'homeroom' // 来源：班主任班级
				};
			}
		}
		
		// 使用教师的基本归属信息
		return {
			departmentName: teacher.departmentName || '—',
			grade: teacher.grade || '—',
			source: 'basic' // 来源：基本信息
		};
	};

	const openEdit = (t: Teacher) => {
		setEditingTeacher(t);
		
		// 将教师的角色显示名转换为角色代码用于对话框
		const displayToCode = buildDisplayToCode(assignableRoles);
		const roleCodes = (t.roles || []).map(displayName => displayToCode[displayName] || displayName);
		setRoleDraft(roleCodes as OrgRoleCode[]);
		
		setDraftHomeroomClassId(t.homeroomClassId || '');
		const scope: Record<OrgRoleCode, { grade?: string; departmentId?: number | null }> = {} as Record<OrgRoleCode, { grade?: string; departmentId?: number | null }>;
		// 从 t.rawRoles 中恢复 scope（兼容旧数据）
		t.rawRoles?.forEach(r => {
			const code = displayToCode[r.role] || r.role;
			if (code === ROLE_CODES.GRADE_LEADER && r.grade) scope[code as OrgRoleCode] = { grade: r.grade };
			if (code === ROLE_CODES.DEPARTMENT_HEAD && r.departmentId) scope[code as OrgRoleCode] = { departmentId: r.departmentId };
		});
		setRoleScopeDraft(scope);
		setEditDialog(true);
	};

	const toggleRoleDraft = (roleCode: OrgRoleCode) => {
		setRoleDraft(prev => {
			if (prev.includes(roleCode)) {
				setRoleScopeDraft(sc => {
					if (!sc[roleCode]) return sc;
					const copy = { ...sc } as Record<OrgRoleCode, { grade?: string; departmentId?: number | null }>; delete copy[roleCode]; return copy;
				});
				if (roleCode === ROLE_CODES.HOMEROOM_TEACHER) setDraftHomeroomClassId('');
				return prev.filter(r => r !== roleCode) as OrgRoleCode[];
			}
			if (roleCode === ROLE_CODES.GRADE_LEADER && editingTeacher && editingTeacher.grade) {
				setRoleScopeDraft(sc => ({ ...sc, [roleCode]: { ...(sc[roleCode]||{}), grade: editingTeacher.grade || '' } }) as typeof sc);
			}
			if (roleCode === ROLE_CODES.DEPARTMENT_HEAD && editingTeacher && editingTeacher.departmentId) {
				setRoleScopeDraft(sc => ({ ...sc, [roleCode]: { ...(sc[roleCode]||{}), departmentId: editingTeacher.departmentId || null } }) as typeof sc);
			}
			return [...prev, roleCode] as OrgRoleCode[];
		});
	};

	const buildRolePayload = (teacher: Teacher, selectedRoles: OrgRoleCode[]) => {
		const existing = teacher.rawRoles || [];
		const displayToCode = buildDisplayToCode();
		return selectedRoles.map(rCode => {
			// 找对应 rawRole id：raw 中可能是 displayName
			const existed = existing.find(er => {
				const code = displayToCode[er.role] || er.role; return code === rCode; });
			if (rCode === ROLE_CODES.HOMEROOM_TEACHER) {
				return { id: existed?.id, role: rCode, classId: draftHomeroomClassId === '' ? null : Number(draftHomeroomClassId), departmentId: null, grade: null, enabled: true };
			}
			if (rCode === ROLE_CODES.GRADE_LEADER) {
				return { id: existed?.id, role: rCode, classId: null, departmentId: null, grade: roleScopeDraft[rCode]?.grade || teacher.grade || null, enabled: true };
			}
			if (rCode === ROLE_CODES.DEPARTMENT_HEAD) {
				return { id: existed?.id, role: rCode, classId: null, departmentId: roleScopeDraft[rCode]?.departmentId ?? teacher.departmentId ?? null, grade: null, enabled: true };
			}
			if (rCode === ROLE_CODES.PRINCIPAL) {
				return { id: existed?.id, role: rCode, classId: null, departmentId: null, grade: null, enabled: true };
			}
			return { id: existed?.id, role: rCode, classId: null, departmentId: null, grade: null, enabled: true };
		});
	};

	const saveTeacherRoles = async () => {
		if (!editingTeacher) return;
		setSaving(true);
		if (roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && !draftHomeroomClassId) {
			setSnackbar({ open: true, message: '请选择班主任对应的班级', severity: 'error' });
			setSaving(false);
			return;
		}
		if (roleDraft.includes(ROLE_CODES.GRADE_LEADER) && !roleScopeDraft[ROLE_CODES.GRADE_LEADER]?.grade) {
			setSnackbar({ open: true, message: '请选择年级主任负责的年级', severity: 'error' });
			setSaving(false);
			return;
		}
		if (roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD) && !roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId) {
			setSnackbar({ open: true, message: '请选择系部主任负责的系部', severity: 'error' });
			setSaving(false);
			return;
		}

		try {
			// 1. 额外的角色一致性验证
			const validationError = validateRoleConsistency();
			if (validationError) {
				setSnackbar({ open: true, message: validationError, severity: 'error' });
				setSaving(false);
				return;
			}

			// 2. 检查是否有角色冲突，需要用户确认
			const conflicts = await checkRoleConflicts();
			if (conflicts.length > 0) {
				const conflictMessage = `检测到角色冲突，将执行以下转移操作：\n\n${conflicts.join('\n')}\n\n是否继续？`;
				
				// 使用自定义确认对话框
				setConfirmMessage(conflictMessage);
				setConfirmCallback(() => async () => {
					await proceedWithSave();
				});
				setConfirmDialog(true);
				setSaving(false);
				return;
			}

			// 没有冲突，直接保存
			await proceedWithSave();
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '保存失败';
			setSnackbar({ open: true, message: msg, severity: 'error' });
		} finally {
			setSaving(false);
		}
	};

	// 实际的保存逻辑
	const proceedWithSave = async () => {
		if (!editingTeacher) return;

		try {
			// 2. 处理唯一角色的转移：先从其他教师移除，再分配给当前教师
			await handleUniqueRoleTransfers();

			// 3. 保存当前教师的角色
			const homeroomClassId = roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) ? (draftHomeroomClassId === '' ? null : Number(draftHomeroomClassId)) : null;
			const rolesPayload = buildRolePayload(editingTeacher, roleDraft);
			
			const res = await fetch(`/api/teachers/management/${editingTeacher.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ homeroomClassId, roles: rolesPayload })
			});
			if (!res.ok) throw new Error('保存失败');
			const updated = await res.json();
			const displayToCode = buildDisplayToCode(assignableRoles);
			const mapped = mapDtoToTeacher(updated, displayToCode);
			setTeachers(prev => prev.map(t => t.id === mapped.id ? mapped : t));
			
			// 同步内联作用域缓存
			if (roleDraft.includes(ROLE_CODES.GRADE_LEADER)) {
				setGradeLeaderScopes(sc => ({ ...sc, [mapped.id]: roleScopeDraft[ROLE_CODES.GRADE_LEADER]?.grade || mapped.grade || '' }));
			} else {
				setGradeLeaderScopes(sc => { if (sc[mapped.id]) { const c = { ...sc }; delete c[mapped.id]; return c; } return sc; });
			}
			if (roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
				const deptId = roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId ?? mapped.departmentId ?? null;
				if (deptId) setDepartmentHeadScopes(sc => ({ ...sc, [mapped.id]: deptId }));
			} else {
				setDepartmentHeadScopes(sc => { if (sc[mapped.id]) { const c = { ...sc }; delete c[mapped.id]; return c; } return sc; });
			}
			setSnackbar({ open: true, message: '已保存', severity: 'success' });
			setEditDialog(false);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '保存失败';
			setSnackbar({ open: true, message: msg, severity: 'error' });
			throw e; // 重新抛出错误
		}
	};

	// 验证角色一致性
	const validateRoleConsistency = (): string | null => {
		if (!editingTeacher) return null;

		// 检查班主任和系部主任角色的一致性
		if (roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && 
			roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
			
			const homeroomClassId = draftHomeroomClassId ? Number(draftHomeroomClassId) : null;
			const deptHeadDeptId = roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId;
			
			if (homeroomClassId && deptHeadDeptId) {
				const homeroomClass = classes.find(c => c.id === homeroomClassId);
				if (homeroomClass && homeroomClass.department?.id !== deptHeadDeptId) {
					const homeroomDeptName = departments.find(d => d.id === homeroomClass.department?.id)?.name || '未知系部';
					const deptHeadDeptName = departments.find(d => d.id === deptHeadDeptId)?.name || '未知系部';
					return `角色冲突：不能同时担任 ${homeroomDeptName} 的班主任和 ${deptHeadDeptName} 的系部主任。请确保班主任和系部主任属于同一系部。`;
				}
			}
		}

		// 检查系部主任是否与其他已存在的同系部班主任冲突
		if (roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
			const targetDeptId = roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId;
			if (targetDeptId) {
				// 查找该系部是否有其他班主任也担任其他系部的系部主任
				const potentialConflicts = teachers.filter(t => {
					if (t.id === editingTeacher.id) return false;
					
					// 该教师是班主任，其班级属于目标系部，但同时担任其他系部主任
					if (t.roles?.includes(ROLE_CODES.HOMEROOM_TEACHER) && 
						t.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD) && 
						t.homeroomClassId) {
						
						const teacherClass = classes.find(c => c.id === t.homeroomClassId);
						if (teacherClass && teacherClass.department?.id === targetDeptId) {
							const teacherDeptHeadDeptId = departmentHeadScopes[t.id] || t.departmentId;
							if (teacherDeptHeadDeptId && teacherDeptHeadDeptId !== targetDeptId) {
								return true;
							}
						}
					}
					return false;
				});

				if (potentialConflicts.length > 0) {
					const deptName = departments.find(d => d.id === targetDeptId)?.name || '未知系部';
					const conflictNames = potentialConflicts.map(t => t.name).join('、');
					return `角色冲突检测：${deptName} 中的班主任 ${conflictNames} 同时担任其他系部主任，这可能导致管理混乱。请先解决这些角色冲突。`;
				}
			}
		}

		return null;
	};

	// 检查角色冲突
	const checkRoleConflicts = async (): Promise<string[]> => {
		if (!editingTeacher) return [];

		const conflicts: string[] = [];

		// 校长角色冲突
		if (roleDraft.includes(ROLE_CODES.PRINCIPAL)) {
			const currentPrincipal = teachers.find(t => t.id !== editingTeacher.id && t.roles?.includes(ROLE_CODES.PRINCIPAL));
			if (currentPrincipal) {
				conflicts.push(`• 校长角色：${currentPrincipal.name} → ${editingTeacher.name}`);
			}
		}

		// 班主任角色冲突（按班级）
		if (roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && draftHomeroomClassId) {
			const currentHomeroom = teachers.find(t => 
				t.id !== editingTeacher.id && 
				t.homeroomClassId === Number(draftHomeroomClassId)
			);
			if (currentHomeroom) {
				const className = classes.find(c => c.id === Number(draftHomeroomClassId))?.name || '未知班级';
				conflicts.push(`• ${className} 班主任：${currentHomeroom.name} → ${editingTeacher.name}`);
			}
		}

		// 年级主任角色冲突（按年级）
		if (roleDraft.includes(ROLE_CODES.GRADE_LEADER)) {
			const targetGrade = roleScopeDraft[ROLE_CODES.GRADE_LEADER]?.grade;
			if (targetGrade) {
				const currentGradeLeader = teachers.find(t => 
					t.id !== editingTeacher.id && 
					t.roles?.includes(ROLE_CODES.GRADE_LEADER) &&
					(gradeLeaderScopes[t.id] === targetGrade || t.grade === targetGrade)
				);
				if (currentGradeLeader) {
					conflicts.push(`• ${targetGrade}年级主任：${currentGradeLeader.name} → ${editingTeacher.name}`);
				}
			}
		}

		// 系部主任角色冲突（按系部）
		if (roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
			const targetDeptId = roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId;
			if (targetDeptId) {
				// 查找所有可能与该系部相关的教师
				const conflictingTeachers = teachers.filter(t => {
					if (t.id === editingTeacher.id) return false;
					
					// 1. 直接担任该系部主任的教师
					if (t.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD) &&
						(departmentHeadScopes[t.id] === targetDeptId || t.departmentId === targetDeptId)) {
						return true;
					}
					
					// 2. 班主任所在班级属于该系部的教师（也可能产生冲突）
					if (t.roles?.includes(ROLE_CODES.HOMEROOM_TEACHER) && t.homeroomClassId) {
						const homeroomClass = classes.find(c => c.id === t.homeroomClassId);
						if (homeroomClass && homeroomClass.department?.id === targetDeptId) {
							// 检查该班主任是否也想担任或已经担任其他系部的系部主任
							const hasOtherDeptHeadRole = t.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD) &&
								(departmentHeadScopes[t.id] !== targetDeptId && t.departmentId !== targetDeptId);
							if (hasOtherDeptHeadRole) {
								return true;
							}
						}
					}
					
					return false;
				});
				
				if (conflictingTeachers.length > 0) {
					const deptName = departments.find(d => d.id === targetDeptId)?.name || '未知系部';
					conflictingTeachers.forEach(teacher => {
						if (teacher.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
							conflicts.push(`• ${deptName} 系部主任：${teacher.name} → ${editingTeacher.name}`);
						}
						// 如果班主任在该系部但担任其他系部主任，需要额外提醒
						if (teacher.roles?.includes(ROLE_CODES.HOMEROOM_TEACHER) && teacher.homeroomClassId) {
							const homeroomClass = classes.find(c => c.id === teacher.homeroomClassId);
							if (homeroomClass && homeroomClass.department?.id === targetDeptId && 
								teacher.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
								const otherDeptId = departmentHeadScopes[teacher.id] || teacher.departmentId;
								const otherDeptName = departments.find(d => d.id === otherDeptId)?.name || '其他系部';
								conflicts.push(`• 注意：${teacher.name} 是 ${deptName} 班主任但担任 ${otherDeptName} 系部主任，可能存在角色冲突`);
							}
						}
					});
				}
			}
		}

		return conflicts;
	};

	// 处理唯一角色的转移
	const handleUniqueRoleTransfers = async () => {
		if (!editingTeacher) return;

		const promises: Promise<void>[] = [];

		// 校长角色转移
		if (roleDraft.includes(ROLE_CODES.PRINCIPAL)) {
			const currentPrincipal = teachers.find(t => t.id !== editingTeacher.id && t.roles?.includes(ROLE_CODES.PRINCIPAL));
			if (currentPrincipal) {
				promises.push(removeRoleFromTeacher(currentPrincipal, ROLE_CODES.PRINCIPAL));
			}
		}

		// 班主任角色转移（按班级）
		if (roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && draftHomeroomClassId) {
			const currentHomeroom = teachers.find(t => 
				t.id !== editingTeacher.id && 
				t.homeroomClassId === Number(draftHomeroomClassId)
			);
			if (currentHomeroom) {
				promises.push(removeRoleFromTeacher(currentHomeroom, ROLE_CODES.HOMEROOM_TEACHER));
			}
		}

		// 年级主任角色转移（按年级）
		if (roleDraft.includes(ROLE_CODES.GRADE_LEADER)) {
			const targetGrade = roleScopeDraft[ROLE_CODES.GRADE_LEADER]?.grade;
			if (targetGrade) {
				const currentGradeLeader = teachers.find(t => 
					t.id !== editingTeacher.id && 
					t.roles?.includes(ROLE_CODES.GRADE_LEADER) &&
					(gradeLeaderScopes[t.id] === targetGrade || t.grade === targetGrade)
				);
				if (currentGradeLeader) {
					promises.push(removeRoleFromTeacher(currentGradeLeader, ROLE_CODES.GRADE_LEADER));
				}
			}
		}

		// 系部主任角色转移（按系部）
		if (roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD)) {
			const targetDeptId = roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId;
			if (targetDeptId) {
				// 查找所有需要移除系部主任角色的教师
				const conflictingTeachers = teachers.filter(t => {
					if (t.id === editingTeacher.id) return false;
					
					// 直接担任该系部主任的教师
					return t.roles?.includes(ROLE_CODES.DEPARTMENT_HEAD) &&
						(departmentHeadScopes[t.id] === targetDeptId || t.departmentId === targetDeptId);
				});
				
				// 移除所有冲突的系部主任角色
				conflictingTeachers.forEach(teacher => {
					promises.push(removeRoleFromTeacher(teacher, ROLE_CODES.DEPARTMENT_HEAD));
				});
				
				// 额外检查：如果当前教师要担任的系部主任职位与其班主任所在系部不一致，给出警告
				// if (roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && draftHomeroomClassId) {
				// 	const homeroomClass = classes.find(c => c.id === Number(draftHomeroomClassId));
				// 	if (homeroomClass && homeroomClass.department?.id !== targetDeptId) {
				// 		console.warn(`警告：${editingTeacher.name} 担任系部主任的系部与其班主任所在系部不一致`);
				// 	}
				// }
			}
		}

		// 并行执行所有角色移除操作
		await Promise.all(promises);
	};

	// 从教师移除特定角色
	const removeRoleFromTeacher = async (teacher: Teacher, roleToRemove: OrgRoleCode) => {
		const newRoles = (teacher.roles || []).filter(r => {
			const displayToCode = buildDisplayToCode();
			const code = displayToCode[r] || r;
			return code !== roleToRemove;
		});
		
		const newRolesPayload = buildRolePayload(teacher, newRoles as OrgRoleCode[]);
		const newHomeroomClassId = roleToRemove === ROLE_CODES.HOMEROOM_TEACHER ? null : teacher.homeroomClassId;

		const res = await fetch(`/api/teachers/management/${teacher.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ 
				homeroomClassId: newHomeroomClassId, 
				roles: newRolesPayload 
			})
		});
		
		if (!res.ok) throw new Error(`移除角色失败: ${teacher.name}`);
		
		const updated = await res.json();
		const displayToCode = buildDisplayToCode(assignableRoles);
		const mapped = mapDtoToTeacher(updated, displayToCode);
		
		// 更新本地状态
		setTeachers(prev => prev.map(t => t.id === mapped.id ? mapped : t));
		
		// 清理缓存
		if (roleToRemove === ROLE_CODES.GRADE_LEADER) {
			setGradeLeaderScopes(sc => { 
				if (sc[mapped.id]) { 
					const c = { ...sc }; 
					delete c[mapped.id]; 
					return c; 
				} 
				return sc; 
			});
		}
		if (roleToRemove === ROLE_CODES.DEPARTMENT_HEAD) {
			setDepartmentHeadScopes(sc => { 
				if (sc[mapped.id]) { 
					const c = { ...sc }; 
					delete c[mapped.id]; 
					return c; 
				} 
				return sc; 
			});
		}
	};

	// ===== 内联指派持久化工具 =====
	interface InlineRolePayload { id?: number | undefined; role: string; classId: number | null; departmentId: number | null; grade: string | null; enabled: boolean }
	const buildInlineRolesPayload = (t: Teacher): InlineRolePayload[] => {
		const existing = t.rawRoles || [];
		return (t.roles || []).map(r => {
			const existed = existing.find(er => er.role === r);
			if (r === ROLE_CODES.HOMEROOM_TEACHER) return { id: existed?.id, role: r, classId: t.homeroomClassId || null, departmentId: null, grade: null, enabled: true };
			if (r === ROLE_CODES.GRADE_LEADER) return { id: existed?.id, role: r, classId: null, departmentId: null, grade: gradeLeaderScopes[t.id] || t.grade || null, enabled: true };
			if (r === ROLE_CODES.DEPARTMENT_HEAD) return { id: existed?.id, role: r, classId: null, departmentId: departmentHeadScopes[t.id] || t.departmentId || null, grade: null, enabled: true };
			if (r === ROLE_CODES.PRINCIPAL) return { id: existed?.id, role: r, classId: null, departmentId: null, grade: null, enabled: true };
			return { id: existed?.id, role: r, classId: null, departmentId: null, grade: null, enabled: true };
		});
	};

	// persistTeacherInline 已弃用，使用 persistTeacherWithPayload 精确控制

	// persistMultiInline 已被精确更新逻辑替换

	// === 精确内联：根据 rawRoles 构造 payload，避免异步 state 竞争 ===
	interface RoleAssignmentInputLite { id?: number; role: string; classId: number | null; departmentId: number | null; grade: string | null; enabled: boolean }
	// mapRawRoles 暂未使用，如需基于 rawRoles 重建集合可恢复

	const persistTeacherWithPayload = async (t: Teacher, homeroomClassId: number | null, rolesPayload: RoleAssignmentInputLite[]) => {
		const res = await fetch(`/api/teachers/management/${t.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ homeroomClassId, roles: rolesPayload })
		});
		if (!res.ok) throw new Error('保存失败');
		const updated = await res.json();
		const displayToCode = buildDisplayToCode(assignableRoles);
		const mapped = mapDtoToTeacher(updated, displayToCode);
		setTeachers(prev => prev.map(pt => pt.id === mapped.id ? mapped : pt));
	};

	// ========== 可视化配置：内部更新工具 ==========
	const updateTeacherRoleSet = (teacherId: number | null, role: OrgRoleCode, scopeFilter?: (t: Teacher) => boolean) => {
		// 移除冲突角色（仅匹配 scopeFilter）
		if (scopeFilter) {
			setTeachers(prev => prev.map(t => {
				if (scopeFilter(t) && t.roles?.includes(role)) {
					return { ...t, roles: t.roles.filter(r => r !== role) };
				}
				return t;
			}));
		}
		// 指派新教师（若不存在则追加该角色代码）
		if (teacherId) {
			setTeachers(prev => prev.map(t => t.id === teacherId ? {
				...t,
				roles: t.roles ? (t.roles.includes(role) ? t.roles : [...t.roles, role]) : [role]
			} : t));
		}
	};

	const handleAssignPrincipal = async (id: number | '') => {
		const newId = id === '' ? null : Number(id);
		const oldId = principalId;

		// 乐观更新：撤销只移除旧的；指派先移除旧，再给新教师添加
		if (!newId && oldId) {
			updateTeacherRoleSet(oldId, ROLE_CODES.PRINCIPAL, t => t.id === oldId);
		} else {
			updateTeacherRoleSet(newId, ROLE_CODES.PRINCIPAL, t => !!t.roles?.includes(ROLE_CODES.PRINCIPAL));
		}
		setPrincipalId(newId);
		setSnackbar({ open: true, message: '已更新校长 (保存中...)', severity: 'info' });
		try {
			if (oldId) {
				const oldTeacher = teachers.find(t => t.id === oldId);
				if (oldTeacher) {
					const remain = (oldTeacher.roles || []).filter(r => r !== ROLE_CODES.PRINCIPAL);
					const payload = buildInlineRolesPayload({ ...oldTeacher, roles: remain });
					await persistTeacherWithPayload(oldTeacher, (oldTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (oldTeacher.homeroomClassId || null) : null, payload);
				}
			}
			if (newId) {
				const newTeacher = teachers.find(t => t.id === newId);
				if (newTeacher) {
					const base = buildInlineRolesPayload(newTeacher).filter(r => r.role !== ROLE_CODES.PRINCIPAL);
					base.push({ id: undefined, role: ROLE_CODES.PRINCIPAL, classId: null, departmentId: null, grade: null, enabled: true });
					await persistTeacherWithPayload(newTeacher, (newTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (newTeacher.homeroomClassId || null) : null, base);
				}
			}
			setSnackbar({ open: true, message: '校长已保存', severity: 'success' });
		} catch {
			setSnackbar({ open: true, message: '保存失败，刷新回滚', severity: 'error' });
			await loadAll();
		}
	};

	const handleAssignGradeLeader = async (grade: string, id: number | '') => {
		const newId = id === '' ? null : Number(id);
		const oldId = gradeLeaders[grade] || null;

		// 本地 optimistic：如果是撤销，只移除 oldId 的角色；如果是指派，移除该年级原负责人角色再给新教师添加
		if (!newId && oldId) {
			updateTeacherRoleSet(oldId, ROLE_CODES.GRADE_LEADER, t => t.id === oldId);
		} else {
			updateTeacherRoleSet(newId, ROLE_CODES.GRADE_LEADER, t => {
				const displayToCode = buildDisplayToCode(assignableRoles);
				const roleEntry = t.rawRoles?.find(r => (displayToCode[r.role] || r.role) === ROLE_CODES.GRADE_LEADER);
				const g = roleEntry?.grade || gradeLeaderScopes[t.id];
				return g === grade;
			});
		}

		setGradeLeaders(prev => ({ ...prev, [grade]: newId }));
		if (newId) setGradeLeaderScopes(sc => ({ ...sc, [newId]: grade }));
		if (oldId && oldId !== newId) setGradeLeaderScopes(sc => { const copy = { ...sc }; delete copy[oldId]; return copy; });
		if (!newId && oldId) setGradeLeaderScopes(sc => { const copy = { ...sc }; delete copy[oldId]; return copy; });

		setSnackbar({ open: true, message: `已更新${grade}年级主任 (保存中...)`, severity: 'info' });

		try {
			// 持久化：先更新旧负责人(移除)，再更新新负责人(添加)
			if (oldId) {
				const oldTeacher = teachers.find(t => t.id === oldId);
				if (oldTeacher) {
					const remainingRoles = (oldTeacher.roles || []).filter(r => r !== ROLE_CODES.GRADE_LEADER);
					const payloadRoles = buildInlineRolesPayload({ ...oldTeacher, roles: remainingRoles });
					await persistTeacherWithPayload(oldTeacher, (oldTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (oldTeacher.homeroomClassId || null) : null, payloadRoles);
				}
			}
			if (newId) {
				const newTeacher = teachers.find(t => t.id === newId);
				if (newTeacher) {
					const baseRoles = buildInlineRolesPayload(newTeacher).filter(r => r.role !== ROLE_CODES.GRADE_LEADER);
					baseRoles.push({ id: undefined, role: ROLE_CODES.GRADE_LEADER, classId: null, departmentId: null, grade, enabled: true });
					await persistTeacherWithPayload(newTeacher, (newTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (newTeacher.homeroomClassId || null) : null, baseRoles);
				}
			}
			setSnackbar({ open: true, message: `${grade}年级主任已保存`, severity: 'success' });
		} catch {
			setSnackbar({ open: true, message: '保存失败，刷新回滚', severity: 'error' });
			await loadAll();
		}
	};

	const handleAssignDepartmentHead = async (deptName: string, id: number | '') => {
		const newId = id === '' ? null : Number(id);
		const oldId = departmentHeads[deptName] || null;
		const deptObj = departments.find(d => d.name === deptName);

		if (!newId && oldId) {
			updateTeacherRoleSet(oldId, ROLE_CODES.DEPARTMENT_HEAD, t => t.id === oldId);
		} else {
			updateTeacherRoleSet(newId, ROLE_CODES.DEPARTMENT_HEAD, t => {
				const displayToCode = buildDisplayToCode(assignableRoles);
				const roleEntry = t.rawRoles?.find(r => (displayToCode[r.role] || r.role) === ROLE_CODES.DEPARTMENT_HEAD);
				const dId = roleEntry?.departmentId || departmentHeadScopes[t.id];
				return dId && deptObj?.id ? dId === deptObj.id : false;
			});
		}
		setDepartmentHeads(prev => ({ ...prev, [deptName]: newId }));
		if (newId && deptObj?.id) setDepartmentHeadScopes(sc => ({ ...sc, [newId]: deptObj.id }));
		if (oldId && oldId !== newId) setDepartmentHeadScopes(sc => { const copy = { ...sc }; delete copy[oldId]; return copy; });
		if (!newId && oldId) setDepartmentHeadScopes(sc => { const copy = { ...sc }; delete copy[oldId]; return copy; });

		setSnackbar({ open: true, message: `已更新${deptName}系部主任 (保存中...)`, severity: 'info' });
		try {
			if (oldId) {
				const oldTeacher = teachers.find(t => t.id === oldId);
				if (oldTeacher) {
					const remain = (oldTeacher.roles || []).filter(r => r !== ROLE_CODES.DEPARTMENT_HEAD);
					const payload = buildInlineRolesPayload({ ...oldTeacher, roles: remain });
					await persistTeacherWithPayload(oldTeacher, (oldTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (oldTeacher.homeroomClassId || null) : null, payload);
				}
			}
			if (newId && deptObj?.id) {
				const newTeacher = teachers.find(t => t.id === newId);
				if (newTeacher) {
					const base = buildInlineRolesPayload(newTeacher).filter(r => r.role !== ROLE_CODES.DEPARTMENT_HEAD);
					base.push({ id: undefined, role: ROLE_CODES.DEPARTMENT_HEAD, classId: null, departmentId: deptObj.id, grade: null, enabled: true });
					await persistTeacherWithPayload(newTeacher, (newTeacher.roles||[]).includes(ROLE_CODES.HOMEROOM_TEACHER) ? (newTeacher.homeroomClassId || null) : null, base);
				}
			}
			setSnackbar({ open: true, message: `${deptName}系部主任已保存`, severity: 'success' });
		} catch {
			setSnackbar({ open: true, message: '保存失败，刷新回滚', severity: 'error' });
			await loadAll();
		}
	};

	const handleAssignHomeroomInline = async (classId: number, teacherId: number | '') => {
		const newId = teacherId === '' ? null : Number(teacherId);
		let oldId: number | null = null;
		teachers.forEach(t => { if (t.homeroomClassId === classId) oldId = t.id; });

		// 乐观本地更新
		setTeachers(prev => prev.map(t => {
			if (t.homeroomClassId === classId && t.id !== newId) {
				return { ...t, homeroomClassId: undefined, homeroomClassName: undefined, roles: (t.roles || []).filter(r => r !== ROLE_CODES.HOMEROOM_TEACHER) };
			}
			return t;
		}));
		if (newId) {
			const cls = classes.find(c => c.id === classId);
			setTeachers(prev => prev.map(t => t.id === newId ? {
				...t,
				roles: t.roles ? (t.roles.includes(ROLE_CODES.HOMEROOM_TEACHER) ? t.roles : [...t.roles, ROLE_CODES.HOMEROOM_TEACHER]) : [ROLE_CODES.HOMEROOM_TEACHER],
				homeroomClassId: classId,
				homeroomClassName: cls?.name || undefined,
				grade: cls?.grade || t.grade,
				departmentName: cls?.department?.name || t.departmentName,
			} : t));
		}
		setSnackbar({ open: true, message: '班主任已更新 (保存中...)', severity: 'info' });
		try {
			if (oldId) {
				const oldTeacher = teachers.find(t => t.id === oldId);
				if (oldTeacher) {
					const remain = (oldTeacher.roles || []).filter(r => r !== ROLE_CODES.HOMEROOM_TEACHER);
					const payload = buildInlineRolesPayload({ ...oldTeacher, roles: remain });
					await persistTeacherWithPayload(oldTeacher, null, payload);
				}
			}
			if (newId) {
				const newTeacher = teachers.find(t => t.id === newId);
				if (newTeacher) {
					const base = buildInlineRolesPayload(newTeacher).filter(r => r.role !== ROLE_CODES.HOMEROOM_TEACHER);
					base.push({ id: undefined, role: ROLE_CODES.HOMEROOM_TEACHER, classId: classId, departmentId: null, grade: null, enabled: true });
					await persistTeacherWithPayload(newTeacher, classId, base);
				}
			}
			setSnackbar({ open: true, message: '班主任已保存', severity: 'success' });
		} catch {
			setSnackbar({ open: true, message: '保存失败，刷新回滚', severity: 'error' });
			await loadAll();
		}
	};

	const renderTeacherList = () => (
			<Card sx={{
				borderRadius: '8px',
				border: '1px solid',
				borderColor: 'divider',
				boxShadow: 'none',
				overflow: 'hidden',
				backgroundColor: 'background.paper'
			}}>
			<CardContent sx={{ p: 0 }}>
				<TableContainer>
					<Table size="small">
							<TableHead>
							<TableRow sx={{ backgroundColor: 'action.hover' }}>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									姓名
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									工号
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									联系方式
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									班主任班级
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									教学归属系部
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									教学归属年级
								</TableCell>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
									组织角色
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
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
										'&:hover': { backgroundColor: 'action.hover' },
										borderBottom: index === filteredTeachers.length - 1 ? 'none' : '1px solid',
										borderColor: 'divider'
									}}
								>
									<TableCell sx={{ py: 2.5 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
											<Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: (theme)=> alpha(theme.palette.primary.main,0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
												<PersonIcon fontSize="small" sx={{ color: 'primary.main' }} />
											</Box>
											<Typography sx={{ fontWeight: 500, color: 'text.primary' }}>{t.name}</Typography>
										</Box>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
											{t.teacherNo}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Box>
											<Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
												{t.phone || '—'}
											</Typography>
											<Typography variant="caption" sx={{ color: 'text.disabled' }}>
												{t.email || ''}
											</Typography>
										</Box>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Typography variant="body2" sx={{ color: 'text.primary' }}>
											{t.homeroomClassName || '—'}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										{(() => {
											const basicInfo = getTeacherBasicInfo(t);
											return (
												<Box>
													<Typography variant="body2" sx={{ color: 'text.primary' }}>
														{basicInfo.departmentName}
													</Typography>
													{basicInfo.source === 'homeroom' && (
														<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
															(来自班主任班级)
														</Typography>
													)}
												</Box>
											);
										})()}
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										{(() => {
											const basicInfo = getTeacherBasicInfo(t);
											return (
												<Box>
													<Typography variant="body2" sx={{ color: 'text.primary' }}>
														{basicInfo.grade}
													</Typography>
													{basicInfo.source === 'homeroom' && (
														<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
															(来自班主任班级)
														</Typography>
													)}
												</Box>
											);
										})()}
									</TableCell>
									<TableCell sx={{ py: 2.5 }}>
										<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
											{(t.roles || []).length === 0 && (
												<Chip label="无" size="small" sx={(theme)=>({ backgroundColor: alpha(theme.palette.text.primary,0.06), color: theme.palette.text.disabled, border: '1px solid', borderColor: 'divider', fontWeight: 500 })} />
											)}
											{(t.roles || []).map(r => {
												const display = getRoleDisplayName(r, assignableRoles);
												return (
													<Chip
														key={r}
														label={display}
														size="small"
														sx={(theme)=>{
															let main = theme.palette.info.main;
															if(r===ROLE_CODES.PRINCIPAL) main = theme.palette.error.main;
															else if(r===ROLE_CODES.GRADE_LEADER) main = theme.palette.warning.main;
															else if(r===ROLE_CODES.DEPARTMENT_HEAD) main = theme.palette.secondary ? theme.palette.secondary.main : theme.palette.primary.light;
															else if(r===ROLE_CODES.HOMEROOM_TEACHER) main = theme.palette.success.main;
															return { backgroundColor: alpha(main,0.15), color: main, fontWeight:500, border: '1px solid', borderColor: alpha(main,0.3) };
														}}
													/>
												);
											})}
										</Box>
									</TableCell>
									<TableCell align="right" sx={{ py: 2.5 }}>
										<Tooltip title="编辑角色">
											<IconButton size="small" onClick={() => openEdit(t)} sx={{ backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '6px', '&:hover': { backgroundColor: (theme)=> alpha(theme.palette.primary.main,0.12) } }}>
												<EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</IconButton>
										</Tooltip>
									</TableCell>
								</TableRow>
							))}
							{filteredTeachers.length === 0 && !loading && (
								<TableRow>
									<TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.disabled' }}>
										<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
											<GroupIcon sx={{ fontSize: 48, color: 'divider' }} />
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
						<CircularProgress size={28} sx={{ color: 'text.secondary' }} />
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
				border: '1px solid',
				borderColor: 'divider',
				boxShadow: 'none',
				backgroundColor: 'background.paper',
				overflow: 'hidden'
			}}>
				<CardContent sx={{ p: 4 }}>
					<Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3, textAlign: 'center' }}>
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
								border: (theme)=> activeNode === 'principal' ? `2px solid ${alpha(roleAccent(theme).principal.main,0.7)}` : '2px solid transparent',
								backgroundColor: (theme)=> activeNode === 'principal' ? alpha(roleAccent(theme).principal.main,0.08) : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: (theme)=> alpha(roleAccent(theme).principal.main,0.08),
									borderColor: (theme)=> alpha(roleAccent(theme).principal.main,0.35)
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: (theme)=> alpha(roleAccent(theme).principal.main,0.18),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: (theme)=> `2px solid ${alpha(roleAccent(theme).principal.main,0.35)}`
							}}>
								<PersonIcon sx={{ color: 'error.main', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
								校长
							</Typography>
							{principalId && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: (theme)=> roleAccent(theme).class.main
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{
							width: 0,
							height: 0,
							borderLeft: '8px solid',
							borderColor: 'divider',
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
								border: (theme)=> activeNode === 'grade' ? `2px solid ${alpha(roleAccent(theme).grade.main,0.6)}` : '2px solid transparent',
								backgroundColor: (theme)=> activeNode === 'grade' ? alpha(roleAccent(theme).grade.main,0.07) : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: (theme)=> alpha(roleAccent(theme).grade.main,0.07),
									borderColor: (theme)=> alpha(roleAccent(theme).grade.main,0.35)
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: (theme)=> alpha(roleAccent(theme).grade.main,0.18),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: (theme)=> `2px solid ${alpha(roleAccent(theme).grade.main,0.35)}`
							}}>
								<AccountTreeIcon sx={{ color: 'warning.main', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
								年级主任
							</Typography>
							{Object.keys(gradeLeaders).length > 0 && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: (theme)=> roleAccent(theme).class.main
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{
							width: 0,
							height: 0,
							borderLeft: '8px solid',
							borderColor: 'divider',
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
								border: (theme)=> activeNode === 'department' ? `2px solid ${alpha(roleAccent(theme).department.main,0.55)}` : '2px solid transparent',
								backgroundColor: (theme)=> activeNode === 'department' ? alpha(roleAccent(theme).department.main,0.07) : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: (theme)=> alpha(roleAccent(theme).department.main,0.07),
									borderColor: (theme)=> alpha(roleAccent(theme).department.main,0.35)
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: (theme)=> alpha(roleAccent(theme).department.main,0.17),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: (theme)=> `2px solid ${alpha(roleAccent(theme).department.main,0.35)}`
							}}>
								<GroupIcon sx={{ color: (theme)=> roleAccent(theme).department.main, fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
								系部主任
							</Typography>
							{Object.keys(departmentHeads).length > 0 && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: (theme)=> roleAccent(theme).class.main
								}} />
							)}
						</Box>

						{/* 箭头 */}
						<Box sx={{
							width: 0,
							height: 0,
							borderLeft: '8px solid',
							borderColor: 'divider',
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
								border: (theme)=> activeNode === 'class' ? `2px solid ${alpha(roleAccent(theme).class.main,0.55)}` : '2px solid transparent',
								backgroundColor: (theme)=> activeNode === 'class' ? alpha(roleAccent(theme).class.main,0.08) : 'transparent',
								transition: 'all 0.3s ease',
								'&:hover': {
									backgroundColor: (theme)=> alpha(roleAccent(theme).class.main,0.08),
									borderColor: (theme)=> alpha(roleAccent(theme).class.main,0.35)
								}
							}}
						>
							<Box sx={{
								width: 60,
								height: 60,
								borderRadius: '12px',
								backgroundColor: (theme)=> alpha(roleAccent(theme).class.main,0.22),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: (theme)=> `2px solid ${alpha(roleAccent(theme).class.main,0.35)}`
							}}>
								<PersonIcon sx={{ color: 'success.main', fontSize: 32 }} />
							</Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
								班主任
							</Typography>
							{teachers.some(t => t.homeroomClassId) && (
								<Box sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									backgroundColor: (theme)=> roleAccent(theme).class.main
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
								border: (theme)=> `2px solid ${alpha(roleAccent(theme).principal.main,0.35)}`,
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'error.main' }} />
								<CardContent sx={{ p: 4, backgroundColor: (theme)=> alpha(theme.palette.error.main,0.04) }}>
									<Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
										<PersonIcon sx={{ color: 'error.main', fontSize: 32 }} />
										校长配置
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
										校长是学校的最高管理者，负责学校整体运营、战略决策和对外事务。
									</Typography>
									<FormControl fullWidth size="medium">
										<InputLabel sx={{ color: 'text.secondary', fontWeight: 500, '&.Mui-focused': { color: 'error.main' }}}>选择校长</InputLabel>
										<Select
											label="选择校长"
											value={principalId ?? ''}
											onChange={e => handleAssignPrincipal(e.target.value as number | '')}
											sx={{
												backgroundColor: 'background.paper',
												borderRadius: '12px',
												'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
												'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'error.light' },
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main', borderWidth: 2 },
												'& .MuiSelect-select': { fontWeight: 600, padding: '12px 14px', textAlign: 'center' },
												'& .MuiSelect-icon': { color: 'error.main' }
											}}
											MenuProps={{
												PaperProps: {
													sx: {
														borderRadius: '12px',
														boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
														border: '1px solid',
														borderColor: 'divider',
														mt: 1,
														maxHeight: 300,
														'& .MuiList-root': {
															padding: '8px'
														}
													}
												},
												anchorOrigin: {
													vertical: 'bottom',
													horizontal: 'left'
												},
												transformOrigin: {
													vertical: 'top',
													horizontal: 'left'
												},
												disablePortal: false
											}}
										>
											<MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.disabled', fontWeight: 500, borderRadius: '8px', m: '4px 8px', transition: 'all 0.2s ease', '&:hover': { backgroundColor: (theme)=> alpha(theme.palette.error.main,0.08), transform: 'translateX(4px)', color: 'error.main' } }}>未指派</MenuItem>
											{teachers.map(t => (
												<MenuItem key={t.id} value={t.id} sx={{
													borderRadius: '8px',
													margin: '4px 8px',
													transition: 'all 0.2s ease',
													'&:hover': { 
														backgroundColor: (theme)=> alpha(theme.palette.error.main,0.06),
														transform: 'translateX(4px)',
														boxShadow: '0 2px 8px rgba(197, 48, 48, 0.1)'
													},
													'&.Mui-selected': { 
														backgroundColor: (theme)=> alpha(theme.palette.error.main,0.20),
														fontWeight: 600,
														'&:hover': { 
															backgroundColor: (theme)=> alpha(theme.palette.error.main,0.30),
															transform: 'translateX(4px)'
														}
													}
												}}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
														<Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: (theme)=> alpha(theme.palette.error.main,0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
															<PersonIcon sx={{ color: 'error.main', fontSize: 16 }} />
														</Box>
														<Box>
															<Typography>{t.name}</Typography>
															<Typography variant="caption" sx={{ color: 'text.secondary' }}>
																{t.teacherNo} • {t.departmentName && `${t.departmentName}系`}
															</Typography>
														</Box>
													</Box>
												</MenuItem>
											))}
										</Select>
									</FormControl>
									{principalId && (
										<Box sx={{ mt: 3, p: 3, backgroundColor: 'background.paper', borderRadius: '8px', border: (theme)=>`1px solid ${alpha(theme.palette.error.main,0.25)}` }}>
											<Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
												✓ 校长已配置
											</Typography>
											<Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
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
								border: (theme)=>`2px solid ${alpha(theme.palette.warning.main,0.5)}`,
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.9)
								}} />
								<CardContent sx={{ p: 4, backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.05) }}>
									<Typography variant="h5" sx={{
										fontWeight: 700,
										color: 'text.primary',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<AccountTreeIcon sx={{ color: 'warning.main', fontSize: 32 }} />
										年级主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
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
														backgroundColor: 'background.paper',
														borderRadius: '8px',
														border: (theme)=> selectedGrade === grade ? `2px solid ${alpha(theme.palette.warning.main,0.6)}` : `1px solid ${alpha(theme.palette.warning.main,0.35)}`,
														cursor: 'pointer',
														transition: 'all 0.3s ease',
														'&:hover': {
															borderColor: (theme)=>alpha(theme.palette.warning.main,0.35)
														}
													}}
													onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
														<Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
															{grade}
														</Typography>
														<Box sx={{ flex: 1 }} />
														{gradeLeaders[grade] && (
															<Chip
																label="已配置"
																size="small"
																sx={{
																	backgroundColor: (theme)=>alpha(theme.palette.success.main,0.18),
																	color: 'success.dark',
																	fontWeight: 600
																}}
															/>
														)}
													</Box>
													<FormControl fullWidth size="medium">
														<InputLabel sx={{ 
															color: 'text.secondary',
															fontWeight: 500,
															'&.Mui-focused': { color: 'warning.main' }
														}}>选择年级主任</InputLabel>
														<Select
															label="选择年级主任"
															value={gradeLeaders[grade] ?? ''}
															onChange={e => handleAssignGradeLeader(grade, e.target.value as number | '')}
															sx={{
																backgroundColor: 'action.hover',
																borderRadius: '12px',
																boxShadow: (theme)=>`0 2px 8px ${alpha(theme.palette.warning.main,0.12)}`,
																transition: 'all 0.2s ease',
																'& .MuiOutlinedInput-notchedOutline': {
																	borderColor: (theme)=>alpha(theme.palette.warning.main,0.25),
																	borderWidth: '1.5px'
																},
																'&:hover': {
																	transform: 'translateY(-1px)',
																	boxShadow: (theme)=>`0 4px 16px ${alpha(theme.palette.warning.main,0.25)}`,
																	'& .MuiOutlinedInput-notchedOutline': {
																		borderColor: (theme)=>alpha(theme.palette.warning.main,0.35)
																	}
																},
																'&.Mui-focused': {
																	transform: 'translateY(-1px)',
																	boxShadow: (theme)=>`0 4px 20px ${alpha(theme.palette.warning.main,0.32)}`,
																	'& .MuiOutlinedInput-notchedOutline': {
																		borderColor: (theme)=>alpha(theme.palette.warning.main,0.6),
																		borderWidth: '2px'
																	}
																},
																'& .MuiSelect-select': {
																	fontWeight: 600,
																	padding: '12px 14px',
																	textAlign: 'center',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center'
																},
																'& .MuiSelect-icon': {
																	color: 'warning.main',
																	transition: 'transform 0.2s ease'
																},
																'&.Mui-focused .MuiSelect-icon': {
																	transform: 'rotate(180deg)'
																}
															}}
															MenuProps={{
																PaperProps: {
																	sx: {
																		borderRadius: '12px',
																		boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
																		border: (theme)=>`1px solid ${alpha(theme.palette.warning.main,0.25)}`,
																		mt: 1,
																		maxHeight: 300,
																		'& .MuiList-root': {
																			padding: '8px'
																		}
																	}
																},
																anchorOrigin: {
																	vertical: 'bottom',
																	horizontal: 'left'
																},
																transformOrigin: {
																	vertical: 'top',
																	horizontal: 'left'
																},
																disablePortal: false
															}}
														>
															<MenuItem value="" sx={{
																fontStyle: 'italic',
																color: 'text.disabled',
																fontWeight: 500,
																borderRadius: '8px',
																margin: '4px 8px',
																transition: 'all 0.2s ease',
																'&:hover': { 
																	backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.06),
																	transform: 'translateX(4px)',
																	color: 'warning.main'
																}
															}}>未指派</MenuItem>
															{teachers.filter(t => !t.roles?.includes(ROLE_CODES.PRINCIPAL)).map(t => (
																<MenuItem key={t.id} value={t.id} sx={{
																	borderRadius: '8px',
																	margin: '4px 8px',
																	transition: 'all 0.2s ease',
																	'&:hover': { 
																		backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.06),
																		transform: 'translateX(4px)',
																		boxShadow: '0 2px 8px rgba(192, 86, 33, 0.1)'
																	},
																	'&.Mui-selected': { 
																		backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.22),
																		fontWeight: 600,
																		'&:hover': { 
																			backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.32),
																			transform: 'translateX(4px)'
																		}
																	}
																}}>
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
																		<Typography>{t.name}</Typography>
																		<Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
								border: (theme)=>`2px solid ${alpha(roleAccent(theme).department.main,0.4)}`,
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: (theme)=>roleAccent(theme).department.main
								}} />
								<CardContent sx={{ p: 4, backgroundColor: 'action.hover' }}>
									<Typography variant="h5" sx={{
										fontWeight: 700,
										color: 'text.primary',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<GroupIcon sx={{ color: (theme)=>roleAccent(theme).department.main, fontSize: 32 }} />
										系部主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
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
														backgroundColor: 'background.paper',
														borderRadius: '8px',
														border: (theme)=> selectedDepartment === dept.name ? `2px solid ${alpha(roleAccent(theme).department.main,0.7)}` : `1px solid ${alpha(roleAccent(theme).department.main,0.25)}`,
														cursor: 'pointer',
														transition: 'all 0.3s ease',
														'&:hover': {
															borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25)
														}
													}}
													onClick={() => setSelectedDepartment(selectedDepartment === dept.name ? null : dept.name)}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
														<Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}>
															{dept.name}
														</Typography>
														{departmentHeads[dept.name] && (
															<Chip
																label="已配置"
																size="small"
																sx={{
																	backgroundColor: (theme)=>alpha(theme.palette.success.main,0.18),
																	color: 'success.dark',
																	fontWeight: 600
																}}
															/>
														)}
													</Box>
													<FormControl fullWidth size="medium">
														<InputLabel sx={{ 
															color: 'text.secondary',
															fontWeight: 500,
															'&.Mui-focused': { color: (theme)=>roleAccent(theme).department.main }
														}}>选择系部主任</InputLabel>
														<Select
															label="选择系部主任"
															value={departmentHeads[dept.name] ?? ''}
															onChange={e => handleAssignDepartmentHead(dept.name, e.target.value as number | '')}
															sx={{
																backgroundColor: 'action.hover',
																borderRadius: '12px',
																boxShadow: '0 2px 8px rgba(74, 85, 104, 0.08)',
																transition: 'all 0.2s ease',
																'& .MuiOutlinedInput-notchedOutline': {
																	borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25),
																	borderWidth: '1.5px'
																},
																'&:hover': {
																	transform: 'translateY(-1px)',
																	boxShadow: '0 4px 16px rgba(74, 85, 104, 0.15)',
																	'& .MuiOutlinedInput-notchedOutline': {
																		borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25)
																	}
																},
																'&.Mui-focused': {
																	transform: 'translateY(-1px)',
																	boxShadow: (theme)=>`0 4px 20px ${alpha(roleAccent(theme).department.main,0.3)}`,
																	'& .MuiOutlinedInput-notchedOutline': {
																		borderColor: (theme)=>roleAccent(theme).department.main,
																		borderWidth: '2px'
																	}
																},
																'& .MuiSelect-select': {
																	fontWeight: 600,
																	padding: '12px 14px',
																	textAlign: 'center',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center'
																},
																'& .MuiSelect-icon': {
																	color: (theme)=>roleAccent(theme).department.main,
																	transition: 'transform 0.2s ease'
																},
																'&.Mui-focused .MuiSelect-icon': {
																	transform: 'rotate(180deg)'
																}
															}}
															MenuProps={{
																PaperProps: {
																	sx: {
																		borderRadius: '12px',
																		boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
																		border: (theme)=>`1px solid ${alpha(roleAccent(theme).department.main,0.25)}`,
																		mt: 1,
																		maxHeight: 300,
																		'& .MuiList-root': {
																			padding: '8px'
																		}
																	}
																},
																anchorOrigin: {
																	vertical: 'bottom',
																	horizontal: 'left'
																},
																transformOrigin: {
																	vertical: 'top',
																	horizontal: 'left'
																},
																disablePortal: false
															}}
														>
															<MenuItem value="" sx={{
																fontStyle: 'italic',
																color: 'text.disabled',
																fontWeight: 500,
																borderRadius: '8px',
																margin: '4px 8px',
																transition: 'all 0.2s ease',
																'&:hover': { 
																	backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.06),
																	transform: 'translateX(4px)',
																	color: (theme)=>roleAccent(theme).department.main
																}
															}}>全部系部</MenuItem>
															{teachers.filter(t => !t.roles?.includes(ROLE_CODES.PRINCIPAL)).map(t => (
																<MenuItem key={t.id} value={t.id} sx={{
																	borderRadius: '8px',
																	margin: '4px 8px',
																	transition: 'all 0.2s ease',
																	'&:hover': { 
																		backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.06),
																		transform: 'translateX(4px)',
																		boxShadow: (theme)=>`0 2px 8px ${alpha(roleAccent(theme).department.main,0.15)}`
																	},
																	'&.Mui-selected': { 
																		backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.15),
																		fontWeight: 600,
																		'&:hover': { 
																			backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.25),
																			transform: 'translateX(4px)'
																		}
																	}
																}}>
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
								border: (theme)=>`2px solid ${alpha(roleAccent(theme).class.main,0.4)}`,
								boxShadow: 'none',
								overflow: 'hidden'
							}}>
								<Box sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									backgroundColor: 'success.main'
								}} />
								<CardContent sx={{ p: 4, backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.08) }}>
									<Typography variant="h5" sx={{
										fontWeight: 700,
										color: 'text.primary',
										mb: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2
									}}>
										<PersonIcon sx={{ color: 'success.main', fontSize: 32 }} />
										班主任配置
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
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
														color: 'text.primary',
														mb: 3,
														display: 'flex',
														alignItems: 'center',
														gap: 2
													}}>
														<Box sx={{
															width: 6,
															height: 24,
															backgroundColor: 'success.main',
															borderRadius: '3px'
														}} />
														{grade}
													</Typography>
													{Object.entries(deptMap.departments).map(([deptName, payload]) => (
														<Box key={deptName} sx={{ mb: 3, ml: 2 }}>
															<Typography variant="subtitle1" sx={{
																fontWeight: 600,
																color: 'text.primary',
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
																				border: (theme)=>`1px solid ${alpha(roleAccent(theme).class.main,0.35)}`,
																				borderRadius: '8px',
																				overflow: 'hidden',
																				'&:hover': {
																					borderColor: (theme)=>alpha(roleAccent(theme).class.main,0.45),
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
																				backgroundColor: (theme)=> currentHomeroom ? theme.palette.success.main : alpha(theme.palette.divider,0.2)
																			}} />
																			<CardContent sx={{ p: 3 }}>
																				<Typography variant="body1" sx={{
																					fontWeight: 600,
																					color: 'text.primary',
																					mb: 2
																				}}>
																					{c.name}
																				</Typography>
																				<FormControl size="small" fullWidth>
																					<InputLabel sx={{ 
																						color: 'text.secondary',
																						fontWeight: 500,
																						fontSize: '0.875rem'
																					}}>选择班主任</InputLabel>
																					<Select
																						label="选择班主任"
																						value={currentHomeroom?.id ?? ''}
																						onChange={e => handleAssignHomeroomInline(c.id, e.target.value as number | '')}
																						sx={{
																							backgroundColor: 'background.paper',
																							borderRadius: '12px',
																							border: (theme)=>`2px solid ${alpha(roleAccent(theme).class.main,0.25)}`,
																							boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
																							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
																							'& .MuiOutlinedInput-notchedOutline': {
																								border: 'none'
																							},
																							'&:hover': {
																								borderColor: (theme)=>alpha(roleAccent(theme).class.main,0.35),
																								transform: 'translateY(-1px)',
																								boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
																							},
																							'&.Mui-focused': {
																								borderColor: 'success.main',
																								boxShadow: (theme)=>`0 0 0 3px ${alpha(roleAccent(theme).class.main,0.25)}`
																							},
																							'& .MuiSelect-select': {
																								padding: '12px 16px',
																								fontSize: '0.875rem',
																								fontWeight: 500,
																								color: 'text.primary',
																								textAlign: 'center',
																								display: 'flex',
																								alignItems: 'center',
																								justifyContent: 'center'
																							}
																						}}
																						MenuProps={{
																							PaperProps: {
																								sx: {
																									borderRadius: '12px',
																									boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
																									border: (theme)=>`1px solid ${alpha(theme.palette.divider,0.6)}`,
																									mt: 1,
																									maxHeight: 300,
																									'& .MuiList-root': {
																										padding: '8px'
																									},
																									'& .MuiMenuItem-root': {
																										margin: '4px 8px',
																										borderRadius: '8px',
																										padding: '10px 12px',
																										transition: 'all 0.2s ease',
																										'&:hover': {
																											backgroundColor: (theme)=>alpha(theme.palette.info.main,0.08),
																											transform: 'translateX(4px)'
																										},
																										'&.Mui-selected': {
																											backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.18),
																											color: 'success.main',
																											fontWeight: 600,
																											'&:hover': {
																												backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.28)
																											}
																										}
																									}
																								}
																							},
																							anchorOrigin: {
																								vertical: 'bottom',
																								horizontal: 'left'
																							},
																							transformOrigin: {
																								vertical: 'top',
																								horizontal: 'left'
																							},
																							disablePortal: false
																						}}
																					>
																						<MenuItem value=""><em>未指派</em></MenuItem>
																						{teachers.filter(t =>
																							!t.roles?.includes(ROLE_CODES.PRINCIPAL) &&
																							(!t.homeroomClassId || t.homeroomClassId === c.id)
																						).map(t => (
																							<MenuItem key={t.id} value={t.id}>
																								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
																									<Typography>{t.name}</Typography>
																									<Typography variant="caption" sx={{ color: 'text.secondary' }}>
																										{t.teacherNo}
																									</Typography>
																								</Box>
																							</MenuItem>
																						))}
																					</Select>
																				</FormControl>
																				{currentHomeroom && (
																					<Box sx={{ mt: 2, p: 2, backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.08), borderRadius: '6px', border: (theme)=>`1px solid ${alpha(roleAccent(theme).class.main,0.35)}` }}>
																						<Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
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
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: 'none',
						position: 'sticky',
						top: '20px',
						backgroundColor: 'background.paper'
					}}>
						<CardContent sx={{ p: 3 }}>
							<Typography variant="subtitle1" sx={{
								fontWeight: 600,
								color: 'text.primary',
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
										backgroundColor: (theme)=> activeNode === 'principal' ? alpha(theme.palette.error.main,0.08) : 'transparent',
										border: (theme)=> activeNode === 'principal' ? `2px solid ${alpha(theme.palette.error.main,0.4)}` : '1px solid',
										borderColor: (theme)=> activeNode === 'principal' ? alpha(theme.palette.error.main,0.4) : 'divider',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: (theme)=> alpha(theme.palette.error.main,0.08)
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: (theme)=> alpha(theme.palette.error.main,0.25),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<PersonIcon sx={{ color: 'error.main', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
										校长
									</Typography>
									{principalId && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: (theme)=> roleAccent(theme).class.main,
											ml: 'auto'
										}} />
									)}
								</Box>

								{/* 连接线 */}
								{activeNode !== 'principal' && (
									<Box sx={{
										width: 2,
										height: 12,
										backgroundColor: 'divider',
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
										backgroundColor: (theme)=> activeNode === 'grade' ? alpha(theme.palette.warning.main,0.08) : 'transparent',
										border: (theme)=> activeNode === 'grade' ? `2px solid ${alpha(theme.palette.warning.main,0.5)}` : '1px solid',
										borderColor: (theme)=> activeNode === 'grade' ? alpha(theme.palette.warning.main,0.5) : 'divider',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: (theme)=> alpha(theme.palette.warning.main,0.08)
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: (theme)=> alpha(theme.palette.warning.main,0.25),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<AccountTreeIcon sx={{ color: 'warning.main', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
										年级主任
									</Typography>
									{Object.keys(gradeLeaders).length > 0 && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: (theme)=> roleAccent(theme).class.main,
											ml: 'auto'
										}} />
									)}
								</Box>

								{/* 连接线 */}
								{(activeNode === 'department' || activeNode === 'class') && (
									<Box sx={{
										width: 2,
										height: 12,
										backgroundColor: 'divider',
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
										backgroundColor: (theme)=> activeNode === 'department' ? alpha(roleAccent(theme).department.main,0.08) : 'transparent',
										border: (theme)=> activeNode === 'department' ? `2px solid ${alpha(roleAccent(theme).department.main,0.45)}` : '1px solid',
										borderColor: (theme)=> activeNode === 'department' ? alpha(roleAccent(theme).department.main,0.45) : 'divider',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: (theme)=> alpha(roleAccent(theme).department.main,0.08)
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: (theme)=> alpha(roleAccent(theme).department.main,0.25),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<GroupIcon sx={{ color: (theme)=> roleAccent(theme).department.main, fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
										系部主任
									</Typography>
									{Object.keys(departmentHeads).length > 0 && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: (theme)=> roleAccent(theme).class.main,
											ml: 'auto'
										}} />
									)}
								</Box>

								{/* 连接线 */}
								{activeNode === 'class' && (
									<Box sx={{
										width: 2,
										height: 12,
										backgroundColor: 'divider',
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
										backgroundColor: (theme)=> activeNode === 'class' ? alpha(roleAccent(theme).class.main,0.1) : 'transparent',
										border: (theme)=> activeNode === 'class' ? `2px solid ${alpha(roleAccent(theme).class.main,0.5)}` : '1px solid',
										borderColor: (theme)=> activeNode === 'class' ? alpha(roleAccent(theme).class.main,0.5) : 'divider',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: (theme)=> alpha(roleAccent(theme).class.main,0.1)
										}
									}}
								>
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '6px',
										backgroundColor: (theme)=> alpha(roleAccent(theme).class.main,0.25),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										<PersonIcon sx={{ color: 'success.main', fontSize: 16 }} />
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
										班主任
									</Typography>
									{teachers.some(t => t.homeroomClassId) && (
										<Box sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: (theme)=> roleAccent(theme).class.main,
											ml: 'auto'
										}} />
									)}
								</Box>
							</Box>

							{/* 配置统计 */}
								<Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 2 }}>
									配置统计
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>校长</Typography>
											<Typography variant="caption" sx={{ color: principalId ? 'success.main' : 'error.main', fontWeight: 600 }}>
											{principalId ? '已配置' : '未配置'}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>年级主任</Typography>
											<Typography variant="caption" sx={{ color: Object.keys(gradeLeaders).length > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
											{Object.keys(gradeLeaders).length}/{Object.keys(orgTree).length}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>系部主任</Typography>
											<Typography variant="caption" sx={{ color: Object.keys(departmentHeads).length > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
											{Object.keys(departmentHeads).length}/{departments.length}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>班主任</Typography>
											<Typography variant="caption" sx={{ color: teachers.filter(t => t.homeroomClassId).length > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
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
				minHeight: '100vh'
			}}>
				<Box sx={{
					mb: 4,
					p: 3,
					backgroundColor: 'background.paper',
					borderRadius: '12px',
					border: '1px solid',
					borderColor: 'divider',
					boxShadow: 'none'
				}}>
					<Typography variant="h4" sx={{
						fontWeight: 600,
						mb: 1,
						color: 'text.primary',
						letterSpacing: '-0.025em'
					}}>
						用户管理
					</Typography>
					<Typography variant="body1" sx={{
						color: 'text.secondary',
						lineHeight: 1.6
					}}>
						管理教师信息与组织架构，配置岗位角色与职责分工
					</Typography>
				</Box>

				<Box sx={{
					backgroundColor: 'background.paper',
					borderRadius: '12px',
					border: '1px solid',
					borderColor: 'divider',
					overflow: 'hidden',
					boxShadow: 'none'
				}}>
					<Tabs
						value={tab}
						onChange={(e, v) => setTab(v)}
						sx={{
							borderBottom: '1px solid',
							borderColor: 'divider',
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 500,
								fontSize: '0.95rem',
								minHeight: 56,
								color: 'text.secondary',
								'&.Mui-selected': {
									color: 'text.primary',
									fontWeight: 600
								}
							},
							'& .MuiTabs-indicator': {
								backgroundColor: 'primary.main',
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
							backgroundColor: (theme)=> theme.palette.mode==='light'? 'background.default' : alpha(theme.palette.primary.main,0.05),
							borderBottom: '1px solid',
							borderColor: 'divider'
						}}>
							<TextField
								size="small"
								placeholder="搜索姓名或工号..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								sx={{
									minWidth: 250,
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'background.paper',
										borderRadius: '12px',
										boxShadow: 'none',
										transition: 'all 0.2s ease',
										'& fieldset': { borderColor: 'divider', borderWidth: 1 },
										'&:hover fieldset': { borderColor: 'primary.light' },
										'&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
										'& .MuiInputBase-input': {
											fontWeight: 500,
											color: 'text.primary',
											'&::placeholder': { color: 'text.disabled', opacity: 1 }
										}
									}
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon fontSize="small" sx={{ color: 'text.secondary', transition: 'color 0.2s ease' }} />
										</InputAdornment>
									)
								}}
							/>
							<FormControl size="small" sx={{ minWidth: 120 }}>
								<InputLabel sx={{ 
									color: 'text.secondary',
									'&.Mui-focused': { color: 'warning.main' },
									fontWeight: 500
								}}>年级</InputLabel>
								<Select
									value={filterGrade}
									label="年级"
									onChange={e => setFilterGrade(e.target.value)}
									sx={{
										backgroundColor: 'background.paper',
										borderRadius: '12px',
										boxShadow: '0 2px 8px rgba(192, 86, 33, 0.08)',
										transition: 'all 0.2s ease',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: (theme)=>alpha(theme.palette.warning.main,0.25),
											borderWidth: '1.5px'
										},
										'&:hover': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 16px rgba(192, 86, 33, 0.15)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: (theme)=>alpha(theme.palette.warning.main,0.35)
											}
										},
										'&.Mui-focused': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 20px rgba(192, 86, 33, 0.2)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: (theme)=>alpha(theme.palette.warning.main,0.6),
												borderWidth: '2px'
											}
										},
										'& .MuiSelect-select': {
											color: 'text.primary',
											fontWeight: 600,
											padding: '10px 14px',
											textAlign: 'center',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center'
										},
										'& .MuiSelect-icon': {
											color: 'warning.main',
											transition: 'transform 0.2s ease'
										},
										'&.Mui-focused .MuiSelect-icon': {
											transform: 'rotate(180deg)'
										}
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												borderRadius: '12px',
												boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
												border: (theme)=>`1px solid ${alpha(theme.palette.warning.main,0.25)}`,
												mt: 1,
												maxHeight: 300,
												'& .MuiList-root': {
													padding: '8px'
												}
											}
										},
										anchorOrigin: {
											vertical: 'bottom',
											horizontal: 'left'
										},
										transformOrigin: {
											vertical: 'top',
											horizontal: 'left'
										},
										disablePortal: false
									}}
								>
									<MenuItem value="" sx={{
										fontStyle: 'italic',
										color: 'text.disabled',
										fontWeight: 500,
										borderRadius: '8px',
										margin: '4px 8px',
										transition: 'all 0.2s ease',
										'&:hover': { 
											backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.06),
											transform: 'translateX(4px)',
											color: 'warning.main'
										}
									}}>全部年级</MenuItem>
									{uniqueGrades.map(g => (
										<MenuItem key={g} value={g} sx={{
												color: 'text.primary',
											fontWeight: 500,
											borderRadius: '8px',
											margin: '4px 8px',
											transition: 'all 0.2s ease',
											'&:hover': { 
												backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.06),
												transform: 'translateX(4px)',
												boxShadow: '0 2px 8px rgba(192, 86, 33, 0.1)'
											},
											'&.Mui-selected': { 
												backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.22),
												fontWeight: 600,
												'&:hover': { 
													backgroundColor: (theme)=>alpha(theme.palette.warning.main,0.32),
													transform: 'translateX(4px)'
												}
											}
										}}>
											{g}年级
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl size="small" sx={{ minWidth: 140 }}>
								<InputLabel sx={{ 
									color: 'text.secondary',
									'&.Mui-focused': { color: (theme)=>roleAccent(theme).department.main },
									fontWeight: 500
								}}>系部</InputLabel>
								<Select
									value={filterDept}
									label="系部"
									onChange={e => setFilterDept(e.target.value)}
									sx={{
										backgroundColor: 'background.paper',
										borderRadius: '12px',
										boxShadow: '0 2px 8px rgba(74, 85, 104, 0.08)',
										transition: 'all 0.2s ease',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25),
											borderWidth: '1.5px'
										},
										'&:hover': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 16px rgba(74, 85, 104, 0.15)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25)
											}
										},
										'&.Mui-focused': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 20px rgba(74, 85, 104, 0.2)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: (theme)=>roleAccent(theme).department.main,
												borderWidth: '2px'
											}
										},
										'& .MuiSelect-select': {
											color: 'text.primary',
											fontWeight: 600,
											padding: '10px 14px',
											textAlign: 'center',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center'
										},
										'& .MuiSelect-icon': {
												color: 'text.primary',
											transition: 'transform 0.2s ease'
										},
										'&.Mui-focused .MuiSelect-icon': {
											transform: 'rotate(180deg)'
										}
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												borderRadius: '12px',
												boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
												border: (theme)=>`1px solid ${alpha(roleAccent(theme).department.main,0.25)}`,
												mt: 1,
												maxHeight: 300,
												'& .MuiList-root': {
													padding: '8px'
												}
											}
										},
										anchorOrigin: {
											vertical: 'bottom',
											horizontal: 'left'
										},
										transformOrigin: {
											vertical: 'top',
											horizontal: 'left'
										},
										disablePortal: false
									}}
								>
									<MenuItem value="" sx={{
										fontStyle: 'italic',
										color: 'text.disabled',
										fontWeight: 500,
										borderRadius: '8px',
										margin: '4px 8px',
										transition: 'all 0.2s ease',
										'&:hover': { 
											backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.06),
											transform: 'translateX(4px)',
											color: 'text.primary'
										}
									}}>全部系部</MenuItem>
									{uniqueDepartments.map(d => (
										<MenuItem key={d} value={d} sx={{
												color: 'text.primary',
											fontWeight: 500,
											borderRadius: '8px',
											margin: '4px 8px',
											transition: 'all 0.2s ease',
											'&:hover': { 
												backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.06),
												transform: 'translateX(4px)',
												boxShadow: (theme)=>`0 2px 8px ${alpha(roleAccent(theme).department.main,0.12)}`
											},
											'&.Mui-selected': { 
												backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.15),
												fontWeight: 600,
												'&:hover': { 
													backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.25),
													transform: 'translateX(4px)'
												}
											}
										}}>
											{d}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl size="small" sx={{ minWidth: 160 }}>
								<InputLabel sx={{ 
									color: 'text.secondary',
									'&.Mui-focused': { color: 'success.main' },
									fontWeight: 500
								}}>组织角色</InputLabel>
								<Select
									value={filterRole}
									label="组织角色"
									onChange={e => setFilterRole(e.target.value)}
									sx={{
										backgroundColor: 'background.paper',
										borderRadius: '12px',
										boxShadow: '0 2px 8px rgba(56, 161, 105, 0.08)',
										transition: 'all 0.2s ease',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: (theme)=>alpha(roleAccent(theme).class.main,0.35),
											borderWidth: '1.5px'
										},
										'&:hover': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 16px rgba(56, 161, 105, 0.15)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: (theme)=>alpha(roleAccent(theme).class.main,0.45)
											}
										},
										'&.Mui-focused': {
											transform: 'translateY(-1px)',
											boxShadow: '0 4px 20px rgba(56, 161, 105, 0.2)',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: 'success.main',
												borderWidth: '2px'
											}
										},
										'& .MuiSelect-select': {
											color: 'text.primary',
											fontWeight: 600,
											padding: '10px 14px',
											textAlign: 'center',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center'
										},
										'& .MuiSelect-icon': {
											color: 'success.main',
											transition: 'transform 0.2s ease'
										},
										'&.Mui-focused .MuiSelect-icon': {
											transform: 'rotate(180deg)'
										}
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												borderRadius: '12px',
												boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
												border: (theme)=>`1px solid ${alpha(roleAccent(theme).class.main,0.35)}`,
												mt: 1,
												maxHeight: 300,
												'& .MuiList-root': {
													padding: '8px'
												}
											}
										},
										anchorOrigin: {
											vertical: 'bottom',
											horizontal: 'left'
										},
										transformOrigin: {
											vertical: 'top',
											horizontal: 'left'
										},
										disablePortal: false
									}}
								>
									<MenuItem value="" sx={{
										fontStyle: 'italic',
										color: 'text.disabled',
										fontWeight: 500,
										borderRadius: '8px',
										margin: '4px 8px',
										transition: 'all 0.2s ease',
										'&:hover': { 
											backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.08),
											transform: 'translateX(4px)',
											color: 'success.main'
										}
									}}>全部角色</MenuItem>
									{roleDisplayList.map(r => (
										<MenuItem key={r.code} value={r.code} sx={{
											color: 'text.primary',
											fontWeight: 500,
											borderRadius: '8px',
											margin: '4px 8px',
											transition: 'all 0.2s ease',
											'&:hover': { 
												backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.08),
												transform: 'translateX(4px)',
												boxShadow: '0 2px 8px rgba(56, 161, 105, 0.1)'
											},
											'&.Mui-selected': { 
												backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.25),
												fontWeight: 600,
												'&:hover': { 
													backgroundColor: (theme)=>alpha(roleAccent(theme).class.main,0.4),
													transform: 'translateX(4px)'
												}
											}
										}}>
											{r.display}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<IconButton
								onClick={loadAll}
								sx={{
									backgroundColor: 'background.paper',
									border: '1px solid #e8eaed',
									borderRadius: '8px',
									'&:hover': {
										backgroundColor: (theme)=> theme.palette.mode==='light'? 'background.default':'background.paper',
										borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25)
									}
								}}
							>
								<RefreshIcon sx={{ color: 'text.secondary' }} />
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
					color: 'text.primary',
					fontWeight: 600
				}}>
					教师角色分配
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					{editingTeacher && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							<Box sx={{
								p: 3,
								backgroundColor: (theme)=> theme.palette.mode==='light'? 'background.default':'background.paper',
								borderRadius: '8px',
								border: (theme)=>`1px solid ${alpha(theme.palette.divider,0.6)}`
							}}>
								<Typography variant="subtitle1" sx={{
									fontWeight: 600,
									color: 'text.primary',
									mb: 0.5
								}}>
									{editingTeacher.name}
								</Typography>
								<Typography variant="body2" sx={{
									color: 'text.secondary',
									fontFamily: 'monospace'
								}}>
									{editingTeacher.teacherNo}
								</Typography>
							</Box>

							<Box>
								<Typography variant="body2" sx={{
									color: 'text.secondary',
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
										{roleDisplayList.map(r => {
											const roleCode = r.code as OrgRoleCode; // 后端返回的 code 与 OrgRoleCode 保持约定
											const isChecked = roleDraft.includes(roleCode);
											return (
										<FormControlLabel
												key={roleCode}
											control={
												<Checkbox
														checked={isChecked}
														onChange={() => toggleRoleDraft(roleCode)}
													sx={{
														color: (theme)=>alpha(roleAccent(theme).department.main,0.45),
														'&.Mui-checked': {
															color: (theme)=>roleAccent(theme).department.main
														}
													}}
												/>
											}
											label={
												<Typography sx={{
														fontWeight: 500,
														color: isChecked ? 'text.primary' : 'text.secondary'
												}}>
													{r.display}
												</Typography>
											}
											sx={{
													border: (theme)=>`1px solid ${alpha(theme.palette.divider,0.6)}`,
													borderRadius: '8px',
													p: 1.5,
													m: 0,
													backgroundColor: isChecked ? (theme)=>alpha(roleAccent(theme).department.main,0.06) : 'background.paper',
													borderColor: (theme)=> isChecked ? alpha(roleAccent(theme).department.main,0.35) : theme.palette.divider
											}}
										/>
										);
										})}
								</Box>
							</Box>

							{roleDraft.includes(ROLE_CODES.HOMEROOM_TEACHER) && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
										班主任班级选择
									</Typography>
									<div style={{ fontSize: '12px', color: 'var(--mui-palette-text-secondary)', marginBottom: '8px' }}>
										调试: 总班级数 {classes.length}, 当前值: {draftHomeroomClassId}, 
										可用班级: {classes
											.filter(c => {
												const assigned = teachers.find(t => t.homeroomClassId === c.id);
												return !assigned || assigned.id === editingTeacher?.id;
											}).length}
									</div>
									<FormControl size="small" fullWidth>
										<InputLabel sx={{ color: 'text.secondary' }}>班主任班级</InputLabel>
										<Select
											label="班主任班级"
											value={draftHomeroomClassId.toString()}
											onChange={e => {
												const val = e.target.value;
												setDraftHomeroomClassId(val === '' ? '' : Number(val));
											}}
											sx={{
												borderRadius: '8px',
												'& .MuiOutlinedInput-notchedOutline': {
													borderColor: (theme)=>alpha(theme.palette.divider,0.4)
												},
												'&:hover .MuiOutlinedInput-notchedOutline': {
													borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25)
												},
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
													borderColor: (theme)=>roleAccent(theme).department.main
												}
											}}
										>
											<MenuItem value=""><em>请选择班级</em></MenuItem>
											{classes
												.filter(c => {
													const assigned = teachers.find(t => t.homeroomClassId === c.id);
													return !assigned || assigned.id === editingTeacher?.id;
												})
												.map(c => {
													return (
														<MenuItem key={c.id} value={c.id}>
															{c.name}（{c.grade} / {c.department?.name || '无系部'}）
														</MenuItem>
													);
												})}
										</Select>
									</FormControl>
									<Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
										可选班级数量: {classes.filter(c => {
											const assigned = teachers.find(t => t.homeroomClassId === c.id);
											return !assigned || assigned.id === editingTeacher?.id;
										}).length} / 总班级数: {classes.length}
									</Typography>
									{classes.length === 0 && (
										<Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
											暂无可选班级数据
										</Typography>
									)}
								</Box>
							)}

							{roleDraft.includes(ROLE_CODES.GRADE_LEADER) && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
										年级主任负责年级
									</Typography>
									<FormControl size="small" fullWidth>
										<InputLabel sx={{ color: 'text.secondary' }}>负责年级</InputLabel>
										<Select
											label="负责年级"
											value={roleScopeDraft[ROLE_CODES.GRADE_LEADER]?.grade || ''}
											onChange={e => {
												setRoleScopeDraft(prev => ({ ...prev, [ROLE_CODES.GRADE_LEADER]: { ...(prev[ROLE_CODES.GRADE_LEADER]||{}), grade: e.target.value as string } }) as typeof prev);
											}}
											sx={{
												borderRadius: '8px',
												'& .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>alpha(theme.palette.divider,0.4) },
												'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25) },
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>alpha(theme.palette.warning.main,0.6) }
											}}
										>
											<MenuItem value=""><em>请选择年级</em></MenuItem>
											{uniqueGrades.map(g => {
												return (
													<MenuItem key={g} value={g}>{g}年级</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
										可选年级数量: {uniqueGrades.length} / 年级列表: {uniqueGrades.join(', ') || '无'}
									</Typography>
									{uniqueGrades.length === 0 && (
										<Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
											暂无可选年级数据
										</Typography>
									)}
								</Box>
							)}

							{roleDraft.includes(ROLE_CODES.DEPARTMENT_HEAD) && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
										系部主任负责系部
									</Typography>
									<FormControl size="small" fullWidth>
										<InputLabel sx={{ color: 'text.secondary' }}>负责系部</InputLabel>
										<Select
											label="负责系部"
											value={roleScopeDraft[ROLE_CODES.DEPARTMENT_HEAD]?.departmentId ?? ''}
											onChange={e => {
												const val = e.target.value as string | number;
												const depId = (val === '' ? null : Number(val));
												setRoleScopeDraft(prev => ({ ...prev, [ROLE_CODES.DEPARTMENT_HEAD]: { ...(prev[ROLE_CODES.DEPARTMENT_HEAD]||{}), departmentId: depId } }) as typeof prev);
											}}
											sx={{
												borderRadius: '8px',
												'& .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>alpha(theme.palette.divider,0.4) },
												'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>alpha(roleAccent(theme).department.main,0.25) },
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: (theme)=>roleAccent(theme).department.main }
											}}
										>
											<MenuItem value=""><em>请选择系部</em></MenuItem>
											{departments.map(d => {
												return (
													<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
										可选系部数量: {departments.length} / 系部列表: {departments.map(d => d.name).join(', ') || '无'}
									</Typography>
									{departments.length === 0 && (
										<Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
											暂无可选系部数据
										</Typography>
									)}
								</Box>
							)}

							<Alert
								severity="info"
								sx={{
									borderRadius: '8px',
									border: '1px solid #bee3f8',
									backgroundColor: (theme)=>alpha(theme.palette.info.main,0.12),
									color: 'info.main'
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
							color: 'text.secondary',
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
							backgroundColor: (theme)=>roleAccent(theme).department.main,
							color: 'white',
							textTransform: 'none',
							fontWeight: 500,
							borderRadius: '8px',
							'&:hover': {
								backgroundColor: (theme)=>alpha(roleAccent(theme).department.main,0.9),
								boxShadow: 'none'
							},
							'&:disabled': {
								backgroundColor: (theme)=>alpha(theme.palette.divider,0.2),
								color: 'text.disabled'
							}
						}}
					>
						{saving ? '保存中...' : '保存'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* 确认对话框 */}
			<Dialog
				open={confirmDialog}
				onClose={() => setConfirmDialog(false)}
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
					color: 'text.primary',
					fontWeight: 600,
					display: 'flex',
					alignItems: 'center',
					gap: 1
				}}>
					<WarningIcon sx={{ color: '#f6ad55' }} />
					角色冲突确认
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					<Typography sx={{ 
						color: 'text.primary', 
						lineHeight: 1.6,
						whiteSpace: 'pre-line'
					}}>
						{confirmMessage}
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
					<Button
						onClick={() => {
							setConfirmDialog(false);
							setConfirmCallback(null);
							setSaving(false);
						}}
						sx={{
							color: 'text.secondary',
							textTransform: 'none',
							fontWeight: 500,
							borderRadius: '8px',
							px: 3
						}}
					>
						取消
					</Button>
					<Button
						variant="contained"
						onClick={async () => {
							setConfirmDialog(false);
							if (confirmCallback) {
								setSaving(true);
								try {
									await confirmCallback();
								} catch {
									// 错误已在 proceedWithSave 中处理
								} finally {
									setSaving(false);
								}
							}
							setConfirmCallback(null);
						}}
						sx={{
							boxShadow: 'none',
							backgroundColor: '#f6ad55',
							color: 'white',
							textTransform: 'none',
							fontWeight: 500,
							borderRadius: '8px',
							px: 3,
							'&:hover': {
								backgroundColor: '#ed8936',
								boxShadow: 'none'
							}
						}}
					>
						确认转移
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

