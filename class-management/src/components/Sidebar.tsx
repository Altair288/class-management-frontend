"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
// import ScoreIcon from "@mui/icons-material/Score";
// import NotificationsIcon from "@mui/icons-material/Notifications";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import Link from "next/link";

const menu = [
  {
    section: "班级事务",
    items: [
      {
        text: "仪表盘",
        icon: <DashboardIcon />,
        href: "/admin/dashboard",
        key: "dashboard",
      },
      {
        text: "班级管理",
        icon: <ClassOutlinedIcon />,
        key: "class-manage",
        children: [
          { text: "班级列表", href: "/admin/class", key: "class-list" },
          { text: "创建班级", href: "/admin/class/create", key: "class-create" },
        ],
      },
      {
        text: "请假管理",
        icon: <PersonIcon />,
        key: "leave",
        children: [
          { text: "申请请假", href: "/admin/leave/apply", key: "leave-apply" },
          { text: "管理总览", href: "/admin/leave", key: "leave-overview" },
          { text: "数据仪表板", href: "/admin/leave/dashboard", key: "leave-dashboard" },
          { text: "审批处理", href: "/admin/leave/approval", key: "leave-approval" },
          { text: "日历视图", href: "/admin/leave/calendar", key: "leave-calendar" },
          { text: "学生管理", href: "/admin/leave/students", key: "leave-students" },
          { text: "系统配置", href: "/admin/leave/config", key: "leave-config" },
          { text: "审计日志", href: "/admin/leave/logs", key: "leave-logs" },
        ],
      },
      {
        text: "德育学分管理",
        icon: <AssignmentIcon />,
        href: "/admin/credits",
        key: "credits",
      },
      // {
      //   text: "管理待定（占位）",
      //   icon: <ScoreIcon />,
      //   href: "/admin/grades",
      //   key: "grades",
      // },
      // {
      //   text: "管理待定（占位）",
      //   icon: <NotificationsIcon />,
      //   href: "/admin/notice",
      //   key: "notice",
      // },
      // {
      //   text: "管理待定（占位）",
      //   icon: <ScoreIcon />,
      //   href: "/admin/grades2",
      //   key: "grades2",
      // },
      // {
      //   text: "管理待定（占位）",
      //   icon: <NotificationsIcon />,
      //   href: "/admin/notice2",
      //   key: "notice2",
      // },
    ],
  },
  {
    section: "系统管理",
    items: [
      {
        text: "用户管理",
        icon: <SupervisorAccountIcon />,
        key: "users",
        children: [
          { text: "角色管理", href: "/admin/users/roles", key: "user-roles" },
          { text: "教师管理", href: "/admin/users/teachers", key: "user-teachers" },
        ],
      },
    ],
  },
];

// 递归查找当前选中的菜单项key和父级key
type MenuChild = {
  text: string;
  href: string;
  key: string;
};

type MenuItem = {
  text: string;
  icon?: React.ReactNode;
  href?: string;
  key: string;
  children?: MenuChild[];
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

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
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [isClient, setIsClient] = useState(false);

  // 确保组件在客户端水合完成后再渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 选中项和父级项
  const { selectedKey, parentKey } = findSelectedKeys(menu, pathname);

  // 自动展开当前父菜单
  useEffect(() => {
    if (parentKey) {
      setOpenMenus((prev) => ({ ...prev, [parentKey]: true }));
    }
  }, [parentKey]);

  // 如果侧边栏关闭或还未完成客户端水合则不渲染
  if (!open || !isClient) return null;

  const handleToggle = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box
      sx={{
        width: 240,
        bgcolor: "#fff",
        height: "calc(100vh - 64px)", // 减去Topbar的高度
        borderRight: "1px solid #e0e0e0",
        position: "fixed",
        left: 0,
        top: 64, // 调整为与Topbar高度对齐，避免叠加
        transition: "width 0.4s cubic-bezier(0.77, 0, 0.175, 1)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        boxShadow: 3,
      }}
    >

      <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
        {menu.map((section) => (
          <Box key={section.section} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                px: 2,
                mb: 1,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                display: "block",
              }}
            >
              {section.section}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const hasChildren = !!item.children;
                const isOpen = openMenus[item.key];
                // 父菜单高亮：自己被选中或有子菜单被选中
                const isSelected = selectedKey === item.key || parentKey === item.key;
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
                              bgcolor: "primary.50",
                              color: "primary.main",
                              boxShadow: "0 2px 4px rgba(0,123,255,0.1)",
                            }),
                            "&:hover": {
                              bgcolor: selectedKey === item.key ? "primary.50" : "#f8f9fa",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 36,
                              color: selectedKey === item.key ? "primary.main" : "#888",
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
                          hasChildren
                            ? handleToggle(item.key)
                            : undefined
                        }
                        selected={isSelected}
                        sx={{
                          mx: 1,
                          my: 0.25,
                          borderRadius: 1.5,
                          minHeight: 40,
                          ...(isSelected && {
                            bgcolor: "primary.50",
                            color: "primary.main",
                            boxShadow: "0 2px 4px rgba(0,123,255,0.1)",
                          }),
                          "&:hover": {
                            bgcolor: isSelected ? "primary.50" : "#f8f9fa",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isSelected ? "primary.main" : "#888",
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
                        {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
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
                                    bgcolor: "primary.50",
                                    color: "primary.main",
                                    boxShadow: "0 2px 4px rgba(0,123,255,0.1)",
                                  }),
                                  "&:hover": {
                                    bgcolor: selectedKey === child.key ? "primary.50" : "#f8f9fa",
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={child.text}
                                  primaryTypographyProps={{
                                    fontWeight: selectedKey === child.key ? 700 : 500,
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