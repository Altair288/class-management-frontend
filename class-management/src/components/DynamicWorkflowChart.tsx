"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Button,
	Chip
} from '@mui/material';
import {
	Person as PersonIcon,
	AccountTree as AccountTreeIcon,
	Group as GroupIcon,
	Edit as EditIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// === 接口定义 ===
interface RoleDTO {
	id: number;
	code: string;
	displayName: string;
	category: string;
	level: number;
	sortOrder: number;
	description?: string | null;
	enabled: boolean;
}

interface Teacher {
	id: number;
	name: string;
	teacherNo: string;
	phone?: string;
	email?: string;
	roles?: string[];
	homeroomClassId?: number | null;
	homeroomClassName?: string | null;
	departmentId?: number | null;
	departmentName?: string | null;
	grade?: string | null;
}

interface FlowChartNode {
	code: string;
	displayName: string;
	level: number;
	sortOrder: number;
	index: number;
	color: NodeColors;
	icon: React.ReactNode;
	description?: string | null;
}

interface NodeColors {
	bg: string;
	border: string;
	text: string;
	selectedBg: string;
}

interface DynamicWorkflowChartProps {
	assignableRoles: RoleDTO[];
	teachers: Teacher[];
	onNodeClick?: (nodeCode: string) => void;
	onEditTeacher?: (teacher: Teacher) => void;
	onAssignRole?: (roleCode: string) => void;
}

// === 角色代码常量 ===
const ROLE_CODES = {
	PRINCIPAL: 'PRINCIPAL',
	GRADE_LEADER: 'GRADE_HEAD',
	DEPARTMENT_HEAD: 'DEPT_HEAD',
	HOMEROOM_TEACHER: 'HOMEROOM'
} as const;

export default function DynamicWorkflowChart({
	assignableRoles,
	teachers,
	onNodeClick,
	onEditTeacher,
	onAssignRole
}: DynamicWorkflowChartProps) {
	const [activeNode, setActiveNode] = useState<string | null>(null);

	// 获取节点颜色配置
	const getNodeColor = (roleCode: string, index: number): NodeColors => {
		// 为特定角色设置固定颜色，其他角色使用渐变色
		const colorMap: Record<string, NodeColors> = {
			[ROLE_CODES.PRINCIPAL]: {
				bg: '#fed7d7',
				border: '#feb2b2',
				text: '#c53030',
				selectedBg: '#fff5f5'
			},
			[ROLE_CODES.GRADE_LEADER]: {
				bg: '#feebc8',
				border: '#fbd38d',
				text: '#c05621',
				selectedBg: '#fffaf0'
			},
			[ROLE_CODES.DEPARTMENT_HEAD]: {
				bg: '#e2e8f0',
				border: '#cbd5e0',
				text: '#4a5568',
				selectedBg: '#f7fafc'
			},
			[ROLE_CODES.HOMEROOM_TEACHER]: {
				bg: '#c6f6d5',
				border: '#9ae6b4',
				text: '#38a169',
				selectedBg: '#f0fff4'
			}
		};
		
		// 如果有预定义颜色则使用，否则生成渐变色
		if (colorMap[roleCode]) {
			return colorMap[roleCode];
		}
		
		// 为新角色生成渐变色
		const hue = (index * 60) % 360; // 每个角色间隔60度色相
		return {
			bg: `hsl(${hue}, 45%, 85%)`,
			border: `hsl(${hue}, 45%, 70%)`,
			text: `hsl(${hue}, 45%, 30%)`,
			selectedBg: `hsl(${hue}, 45%, 95%)`
		};
	};

	// 获取节点图标
	const getNodeIcon = (roleCode: string): React.ReactNode => {
		const iconMap: Record<string, React.ReactNode> = {
			[ROLE_CODES.PRINCIPAL]: <PersonIcon sx={{ fontSize: 32 }} />,
			[ROLE_CODES.GRADE_LEADER]: <AccountTreeIcon sx={{ fontSize: 32 }} />,
			[ROLE_CODES.DEPARTMENT_HEAD]: <GroupIcon sx={{ fontSize: 32 }} />,
			[ROLE_CODES.HOMEROOM_TEACHER]: <EditIcon sx={{ fontSize: 32 }} />
		};
		
		return iconMap[roleCode] || <PersonIcon sx={{ fontSize: 32 }} />;
	};

	// 动态生成流程图节点数据
	const flowChartNodes = useMemo(() => {
		const enabledRoles = assignableRoles
			.filter(r => r.enabled && r.category === 'APPROVAL')
			.sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder);
		
		return enabledRoles.map((role, index) => ({
			code: role.code,
			displayName: role.displayName,
			level: role.level,
			sortOrder: role.sortOrder,
			index,
			color: getNodeColor(role.code, index),
			icon: getNodeIcon(role.code),
			description: role.description
		}));
	}, [assignableRoles]);

	// 初始化活动节点为第一个节点
	useEffect(() => {
		if (flowChartNodes.length > 0 && !activeNode) {
			setActiveNode(flowChartNodes[0].code);
		}
	}, [flowChartNodes, activeNode]);

	// 处理节点点击
	const handleNodeClick = (nodeCode: string) => {
		setActiveNode(nodeCode);
		onNodeClick?.(nodeCode);
	};

	// 动态渲染角色详情
	const renderRoleDetails = (node: FlowChartNode) => {
		// 获取该角色的教师列表
		const roleTeachers = teachers.filter(t => t.roles?.includes(node.code));
		
		return (
			<Card sx={{
				borderRadius: '16px',
				border: '1px solid #e8eaed',
				boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
				overflow: 'hidden'
			}}>
				<CardContent sx={{ p: 4 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
						<Box sx={{
							width: 48,
							height: 48,
							borderRadius: '12px',
							backgroundColor: node.color.bg,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							border: `2px solid ${node.color.border}`,
							color: node.color.text
						}}>
							{node.icon}
						</Box>
						<Box>
							<Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
								{node.displayName}
							</Typography>
							<Typography variant="body2" sx={{ color: '#718096' }}>
								Level {node.level} • {node.description || '暂无描述'}
							</Typography>
						</Box>
					</Box>

					{roleTeachers.length > 0 ? (
						<Box>
							<Typography variant="subtitle2" sx={{ 
								fontWeight: 600, 
								color: '#4a5568', 
								mb: 2 
							}}>
								当前担任人员 ({roleTeachers.length}人)
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{roleTeachers.map(teacher => (
									<Box key={teacher.id} sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										p: 2,
										bgcolor: '#f8f9fa',
										borderRadius: '8px',
										border: '1px solid #e8eaed'
									}}>
										<Box>
											<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
												{teacher.name}
											</Typography>
											<Typography variant="caption" sx={{ color: '#718096' }}>
												工号：{teacher.teacherNo}
											</Typography>
											{/* 显示额外信息 */}
											{teacher.homeroomClassName && (
												<Chip 
													label={`班主任：${teacher.homeroomClassName}`}
													size="small"
													sx={{ 
														ml: 1, 
														backgroundColor: '#e6fffa', 
														color: '#234e52',
														fontSize: 10
													}}
												/>
											)}
											{teacher.departmentName && (
												<Chip 
													label={teacher.departmentName}
													size="small"
													sx={{ 
														ml: 1, 
														backgroundColor: '#eff6ff', 
														color: '#1e3a8a',
														fontSize: 10
													}}
												/>
											)}
										</Box>
										<Button
											size="small"
											onClick={() => onEditTeacher?.(teacher)}
											sx={{
												color: '#4a5568',
												textTransform: 'none',
												fontWeight: 500
											}}
										>
											编辑
										</Button>
									</Box>
								))}
							</Box>
						</Box>
					) : (
						<Box sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							py: 4,
							bgcolor: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #e8eaed'
						}}>
							<Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
								暂无人员担任此角色
							</Typography>
							<Button
								variant="outlined"
								size="small"
								onClick={() => onAssignRole?.(node.code)}
								sx={{
									color: '#4a5568',
									borderColor: '#cbd5e0',
									textTransform: 'none',
									fontWeight: 500
								}}
							>
								分配人员
							</Button>
						</Box>
					)}
				</CardContent>
			</Card>
		);
	};

	if (flowChartNodes.length === 0) {
		return (
			<Card sx={{
				borderRadius: '16px',
				border: '1px solid #e8eaed',
				boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
			}}>
				<CardContent sx={{ p: 4, textAlign: 'center' }}>
					<Typography variant="h6" sx={{ color: '#718096', mb: 2 }}>
						暂无角色配置
					</Typography>
					<Typography variant="body2" sx={{ color: '#a0aec0' }}>
						请先在角色管理中配置审批角色
					</Typography>
				</CardContent>
			</Card>
		);
	}

	return (
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

					{/* 动态流程图主体 */}
					<Box sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 2,
						flexWrap: 'wrap',
						mb: 3,
						overflowX: 'auto',
						pb: 2
					}}>
						{flowChartNodes.map((node, index) => (
							<React.Fragment key={node.code}>
								{/* 节点 */}
								<motion.div
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.1, duration: 0.3 }}
								>
									<Box
										onClick={() => handleNodeClick(node.code)}
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 1,
											cursor: 'pointer',
											p: 2,
											borderRadius: '12px',
											border: activeNode === node.code ? `2px solid ${node.color.border}` : '2px solid transparent',
											backgroundColor: activeNode === node.code ? node.color.selectedBg : 'transparent',
											transition: 'all 0.3s ease',
											'&:hover': {
												backgroundColor: node.color.selectedBg,
												borderColor: node.color.border
											},
											minWidth: 120
										}}
									>
										<Box sx={{
											width: 60,
											height: 60,
											borderRadius: '12px',
											backgroundColor: node.color.bg,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											border: `2px solid ${node.color.border}`,
											color: node.color.text
										}}>
											{node.icon}
										</Box>
										<Typography variant="body2" sx={{ 
											fontWeight: 600, 
											color: '#1a202c',
											textAlign: 'center',
											fontSize: 12
										}}>
											{node.displayName}
										</Typography>
										{/* 层级指示器 */}
										<Typography variant="caption" sx={{ 
											color: '#718096',
											fontSize: 10
										}}>
											Level {node.level}
										</Typography>
										{/* 状态指示点 - 如果该角色有人担任则显示绿点 */}
										{teachers.some(t => t.roles?.includes(node.code)) && (
											<Box sx={{
												width: 8,
												height: 8,
												borderRadius: '50%',
												backgroundColor: '#48bb78'
											}} />
										)}
									</Box>
								</motion.div>
								
								{/* 箭头 - 不是最后一个节点时显示 */}
								{index < flowChartNodes.length - 1 && (
									<motion.div
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 + 0.15, duration: 0.3 }}
									>
										<Box sx={{
											width: 0,
											height: 0,
											borderLeft: '8px solid #cbd5e0',
											borderTop: '6px solid transparent',
											borderBottom: '6px solid transparent',
											mx: 1
										}} />
									</motion.div>
								)}
							</React.Fragment>
						))}
					</Box>

					{/* 流程图说明 */}
					<Box sx={{
						bgcolor: '#f8f9fa',
						borderRadius: '8px',
						p: 3,
						border: '1px solid #e8eaed'
					}}>
						<Typography variant="body2" sx={{ 
							color: '#4a5568', 
							lineHeight: 1.6,
							textAlign: 'center'
						}}>
							💡 点击节点查看对应层级的人员分配情况。绿点表示该角色已有人员担任。
							<br />
							当前共有 {flowChartNodes.length} 个角色层级，按照 Level 和排序配置动态生成。
						</Typography>
					</Box>
				</CardContent>
			</Card>

			{/* 动态详情展示区域 */}
			<Box sx={{ display: 'flex', gap: 4, minHeight: '400px' }}>
				{/* 左侧详情区域 */}
				<Box sx={{ flex: 1 }}>
					{flowChartNodes.map(node => (
						<Box key={node.code} sx={{ display: activeNode === node.code ? 'block' : 'none' }}>
							{renderRoleDetails(node)}
						</Box>
					))}
				</Box>
				
				{/* 右侧快速操作区域 */}
				<Box sx={{ width: '240px', flexShrink: 0 }}>
					<Card sx={{
						borderRadius: '16px',
						border: '1px solid #e8eaed',
						boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
						overflow: 'hidden'
					}}>
						<CardContent sx={{ p: 3 }}>
							<Typography variant="h6" sx={{
								fontWeight: 700,
								color: '#1a202c',
								mb: 3,
								fontSize: 16
							}}>
								快速导航
							</Typography>
							
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								{flowChartNodes.map(node => {
									const hasTeachers = teachers.some(t => t.roles?.includes(node.code));
									const teacherCount = teachers.filter(t => t.roles?.includes(node.code)).length;
									
									return (
										<Box
											key={node.code}
											onClick={() => handleNodeClick(node.code)}
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												p: 2,
												borderRadius: '8px',
												cursor: 'pointer',
												backgroundColor: activeNode === node.code ? node.color.selectedBg : '#f8f9fa',
												border: activeNode === node.code ? `2px solid ${node.color.border}` : '1px solid #e8eaed',
												transition: 'all 0.2s ease',
												'&:hover': {
													backgroundColor: node.color.selectedBg,
													borderColor: node.color.border
												}
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
												<Box sx={{
													width: 32,
													height: 32,
													borderRadius: '8px',
													backgroundColor: node.color.bg,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													color: node.color.text
												}}>
													<Box sx={{ fontSize: 16 }}>
														{node.icon}
													</Box>
												</Box>
												<Typography variant="body2" sx={{ 
													fontWeight: 600, 
													color: '#1a202c',
													fontSize: 12
												}}>
													{node.displayName}
												</Typography>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Typography variant="caption" sx={{ 
													color: hasTeachers ? '#48bb78' : '#cbd5e0',
													fontWeight: 600,
													fontSize: 10
												}}>
													{teacherCount}人
												</Typography>
												{hasTeachers && (
													<Box sx={{
														width: 6,
														height: 6,
														borderRadius: '50%',
														backgroundColor: '#48bb78'
													}} />
												)}
											</Box>
										</Box>
									);
								})}
							</Box>
						</CardContent>
					</Card>
				</Box>
			</Box>
		</Box>
	);
}
