"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

// 菜单结构增加 allowedRoles 控制显示（缺省表示所有登录用户）
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | string;

interface MenuChild {
  text: string;
  href: string;
  key: string;
  allowedRoles?: Role[];
}

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  href?: string;
  key: string;
  allowedRoles?: Role[];
  children?: MenuChild[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

const adminMenu: MenuSection[] = [
  {
    section: "班级事务",
    items: [
      { text: "仪表盘", icon: <DashboardIcon />, href: "/admin/dashboard", key: "dashboard", allowedRoles: ['ADMIN','TEACHER'] },
      {
        text: "班级管理",
        icon: <ClassOutlinedIcon />,
        key: "class-manage",
        allowedRoles: ['ADMIN','TEACHER'],
        children: [
          { text: "班级列表", href: "/admin/class", key: "class-list", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "创建班级", href: "/admin/class/create", key: "class-create", allowedRoles: ['ADMIN'] },
        ],
      },
      {
        text: "请假管理",
        icon: <PersonIcon />,
        key: "leave",
        allowedRoles: ['ADMIN','TEACHER'],
        children: [
          { text: "申请请假", href: "/admin/leave/apply", key: "leave-apply", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "管理总览", href: "/admin/leave", key: "leave-overview", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "数据仪表板", href: "/admin/leave/dashboard", key: "leave-dashboard", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "审批处理", href: "/admin/leave/approval", key: "leave-approval", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "日历视图", href: "/admin/leave/calendar", key: "leave-calendar", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "学生管理", href: "/admin/leave/students", key: "leave-students", allowedRoles: ['ADMIN','TEACHER'] },
          { text: "系统配置", href: "/admin/leave/config", key: "leave-config", allowedRoles: ['ADMIN'] },
        ],
      },
      { text: "德育学分管理", icon: <AssignmentIcon />, href: "/admin/credits", key: "credits", allowedRoles: ['ADMIN','TEACHER'] },
    ],
  },
  {
    section: "系统管理",
    items: [
      {
        text: "用户管理",
        icon: <SupervisorAccountIcon />,
        key: "users",
        allowedRoles: ['ADMIN'],
        children: [
          { text: "角色管理", href: "/admin/users/roles", key: "user-roles", allowedRoles: ['ADMIN'] },
          { text: "教师管理", href: "/admin/users/teachers", key: "user-teachers", allowedRoles: ['ADMIN'] },
        ],
      },
      { text: "存储配置", icon: <CloudQueueIcon />, href: "/admin/storage", key: "storage-config", allowedRoles: ['ADMIN'] },
      { text: "日志中心", icon: <AssignmentIcon />, href: "/admin/log", key: "log-center", allowedRoles: ['ADMIN','TEACHER'] },
    ],
  },
];

// 学生专属菜单（后续你创建 /student 路由后即可使用）
const studentMenu: MenuSection[] = [
  {
    section: '学习与请假',
    items: [
      { text: '仪表盘', icon: <DashboardIcon />, href: '/student/dashboard', key: 'stu-dashboard', allowedRoles: ['STUDENT'] },
      { text: '我的消息', icon: <PersonIcon />, href: '/student/notifications', key: 'stu-notifications', allowedRoles: ['STUDENT'] },
      { text: '提交请假', icon: <AssignmentIcon />, href: '/student/leave/apply', key: 'stu-leave-apply', allowedRoles: ['STUDENT'] },
      { text: '请假日历', icon: <ClassOutlinedIcon />, href: '/student/leave/calendar', key: 'stu-leave-calendar', allowedRoles: ['STUDENT'] },
    ]
  }
];

// 递归查找当前选中的菜单项key和父级key
// ---- 以上已重新定义类型 ----

function findSelectedKeys(
  menu: MenuSection[],
  pathname: string
): { selectedKey: string; parentKey: string | null } {
  for (const section of menu) {
    for (const item of section.items) {
      if (item.href === pathname) return { selectedKey: item.key, parentKey: null };
      if (item.children) {
        const child = item.children.find(child => child.href === pathname);
        if (child) return { selectedKey: child.key, parentKey: item.key };
      }
    }
  }
  return { selectedKey: "dashboard", parentKey: null };
}

export default function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const theme = useTheme();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [isClient, setIsClient] = useState(false);
  const { user, loading, isStudent } = useAuth();

  const activeMenu: MenuSection[] = useMemo(() => {
    const base = isStudent ? studentMenu : adminMenu;
    const role = user?.userType as Role | undefined;
    if (!role) return [];
    // 过滤角色不允许的项
    return base.map(section => {
      const items = section.items
        .filter(it => !it.allowedRoles || it.allowedRoles.includes(role))
        .map(it => {
          if (!it.children) return it;
          const children = it.children.filter(c => !c.allowedRoles || c.allowedRoles.includes(role));
            return { ...it, children };
        })
        .filter(it => !it.children || it.children.length > 0);
      return { ...section, items };
    }).filter(sec => sec.items.length > 0);
  }, [isStudent, user]);

  // 确保组件在客户端水合完成后再渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 选中项和父级项（基于过滤后的菜单）
  const { selectedKey, parentKey } = useMemo(() => findSelectedKeys(activeMenu, pathname), [activeMenu, pathname]);

  // 自动展开当前父菜单
  useEffect(() => {
    if (parentKey) {
      setOpenMenus((prev) => ({ ...prev, [parentKey]: true }));
    }
  }, [parentKey]);

  // 如果侧边栏关闭或还未完成客户端水合则不渲染
  if (!open || !isClient) return null;
  if (loading) return null; // 加载期间不显示，避免闪烁
  if (!user) return null; // 未登录不显示
  if (activeMenu.length === 0) return null; // 角色无菜单

  const handleToggle = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box
      sx={{
        width: 240,
        bgcolor: theme.palette.background.paper,
        height: "calc(100vh - 64px)", // 减去Topbar的高度
        borderRight: `1px solid ${theme.palette.divider}`,
        position: "fixed",
        left: 0,
        top: 64, // 调整为与Topbar高度对齐，避免叠加
        transition: "width 0.4s cubic-bezier(0.77, 0, 0.175, 1)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        boxShadow: theme.shadows[3],
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          pt: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {activeMenu.map((section) => (
          <Box key={section.section} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                px: 2,
                mb: 1,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              {section.section}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const hasChildren = !!item.children;
                const isOpen = openMenus[item.key];
                // 父菜单高亮：自己被选中或有子菜单被选中
                const isSelected =
                  selectedKey === item.key || parentKey === item.key;
                return (
                  <Box key={item.key}>
                    {item.href ? (
                      <Link href={item.href}>
                        <ListItemButton
                          selected={selectedKey === item.key}
                          sx={{
                            mx: 1,
                            my: 0.25,
                            borderRadius: 1.5,
                            minHeight: 40,
                            ...(selectedKey === item.key && {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              boxShadow: `0 2px 4px ${alpha(
                                theme.palette.primary.main,
                                0.2
                              )}`,
                            }),
                            "&:hover": {
                              bgcolor:
                                selectedKey === item.key
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 36,
                              color:
                                selectedKey === item.key
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                              justifyContent: "center",
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: selectedKey === item.key ? 700 : 500,
                            }}
                          />
                        </ListItemButton>
                      </Link>
                    ) : (
                      <ListItemButton
                        onClick={() =>
                          hasChildren ? handleToggle(item.key) : undefined
                        }
                        selected={isSelected}
                        sx={{
                          mx: 1,
                          my: 0.25,
                          borderRadius: 1.5,
                          minHeight: 40,
                          ...(isSelected && {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                            boxShadow: `0 2px 4px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          }),
                          "&:hover": {
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.1)
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isSelected
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            justifyContent: "center",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        />
                        {hasChildren &&
                          (isOpen ? <ExpandLess /> : <ExpandMore />)}
                      </ListItemButton>
                    )}
                    {/* 子菜单 */}
                    {hasChildren && (
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List disablePadding sx={{ pl: 3, py: 0.5 }}>
                          {item.children!.map((child) => (
                            <Link href={child.href} key={child.key}>
                              <ListItemButton
                                selected={selectedKey === child.key}
                                sx={{
                                  mx: 1,
                                  my: 0.25,
                                  borderRadius: 1.5,
                                  minHeight: 36,
                                  ...(selectedKey === child.key && {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                    color: theme.palette.primary.main,
                                    boxShadow: `0 2px 4px ${alpha(
                                      theme.palette.primary.main,
                                      0.2
                                    )}`,
                                  }),
                                  "&:hover": {
                                    bgcolor:
                                      selectedKey === child.key
                                        ? alpha(theme.palette.primary.main, 0.1)
                                        : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={child.text}
                                  primaryTypographyProps={{
                                    fontWeight:
                                      selectedKey === child.key ? 700 : 500,
                                    fontSize: 14,
                                  }}
                                />
                              </ListItemButton>
                            </Link>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}