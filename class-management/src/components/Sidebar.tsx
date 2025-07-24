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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import DescriptionIcon from "@mui/icons-material/Description";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LayersIcon from "@mui/icons-material/Layers";
import Link from "next/link";
import Image from "next/image";

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
        key: "credits",
        children: [
          { text: "班级列表", href: "/admin/class", key: "class-list" },
          { text: "创建班级", href: "/admin/class/create", key: "class-create" },
        ],
      },
      {
        text: "德育学分管理",
        icon: <LayersIcon />,
        href: "/admin/credits",
        key: "credits",
      },
      {
        text: "请假管理",
        icon: <FolderOpenIcon />,
        key: "leave",
        children: [
          { text: "请假申请列表", href: "/admin/leave/apply", key: "leave-apply" },
          { text: "请假审批", href: "/admin/leave/approve", key: "leave-approve" },
        ],
      },
      {
        text: "成绩管理",
        icon: <MenuBookIcon />,
        href: "/admin/grades",
        key: "grades",
      },
      {
        text: "班级通知",
        icon: <DescriptionIcon />,
        href: "/admin/notice",
        key: "notice",
      },
    ],
  },
  {
    section: "系统管理",
    items: [
      {
        text: "用户管理",
        icon: <SupportAgentIcon />,
        href: "/admin/users",
        key: "users",
      },
    ],
  },
];

export default function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [collapsed, setCollapsed] = useState(false);
  
  // 根据当前路径设置选中项
  const [selected, setSelected] = useState<string>(() => {
    const match = menu.flatMap(section => section.items)
      .find(item => {
        if (item.href === pathname) return true;
        if (item.children) {
          return item.children.some(child => child.href === pathname);
        }
        return false;
      });
    return match?.key || "dashboard";
  });

  // 路径变化时更新选中项
  useEffect(() => {
    const match = menu.flatMap(section => section.items)
      .find(item => {
        if (item.href === pathname) return true;
        if (item.children) {
          return item.children.some(child => child.href === pathname);
        }
        return false;
      });
    if (match) setSelected(match.key);
  }, [pathname]);

  // 如果侧边栏关闭则不渲染
  if (!open) return null;
  

  const handleToggle = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (key: string) => {
    setSelected(key);
  };

  return (
    <Box
      sx={{
        width: collapsed ? 64 : 240,
        bgcolor: "#fff",
        height: "100vh",
        borderRight: "1px solid #e0e0e0",
        position: "fixed",
        left: 0,
        top: 0,
        transition: "width 0.4s cubic-bezier(0.77, 0, 0.175, 1)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        boxShadow: collapsed ? 1 : 3,
      }}
    >
      {/* Logo & Collapse Button */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 3, pb: 2 }}>
        <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="SaasAble" width={32} height={32} />
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              ml: 1,
              letterSpacing: 1,
              flex: 1,
            }}
          >
            学生管理系统
          </Typography>
        )}
        <Box
          component="button"
          aria-label="toggle sidebar"
          onClick={() => setCollapsed((v) => !v)}
          sx={{
            ml: "auto",
            border: "none",
            background: "none",
            cursor: "pointer",
            p: 1,
            borderRadius: "50%",
            "&:hover": { bgcolor: "#f5f7fa" },
          }}
        >
          <svg width="20" height="20" fill="none">
            <rect width="20" height="20" rx="6" fill="#f5f7fa" />
            <rect x="6" y="9" width="8" height="2" rx="1" fill="#888" />
            <rect x="9" y="6" width="2" height="8" rx="1" fill="#888" />
          </svg>
        </Box>
      </Box>
      {/* <Divider /> */}
      <Box sx={{ flex: 1, overflowY: "auto", mt: 1 }}>
        {menu.map((section) => (
          <Box key={section.section} sx={{ mb: 1 }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  color: "#888",
                  px: 2,
                  mt: 2,
                  mb: 0.5,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "none",
                }}
              >
                {section.section}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const hasChildren = !!item.children;
                const isOpen = openMenus[item.key];
                const isSelected = selected === item.key;
                return (
                  <Box key={item.key}>
                    {item.href ? (
                      <Link href={item.href} passHref legacyBehavior>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => handleSelect(item.key)}
                          sx={{
                            mx: 1,
                            my: 0.5,
                            borderRadius: 2,
                            minHeight: 44,
                            ...(isSelected && {
                              bgcolor: "primary.50",
                              color: "primary.main",
                              boxShadow: "0 0 0 2px #e3e8ff",
                            }),
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
                          {!collapsed && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontWeight: isSelected ? 700 : 500,
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Link>
                    ) : (
                      <ListItemButton
                        onClick={() =>
                          hasChildren
                            ? handleToggle(item.key)
                            : handleSelect(item.key)
                        }
                        selected={isSelected}
                        sx={{
                          mx: 1,
                          my: 0.5,
                          borderRadius: 2,
                          minHeight: 44,
                          ...(isSelected && {
                            bgcolor: "primary.50",
                            color: "primary.main",
                            boxShadow: "0 0 0 2px #e3e8ff",
                          }),
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
                        {!collapsed && (
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isSelected ? 700 : 500,
                            }}
                          />
                        )}
                        {hasChildren &&
                          (!collapsed ? (
                            isOpen ? <ExpandLess /> : <ExpandMore />
                          ) : null)}
                      </ListItemButton>
                    )}
                    {/* 子菜单 */}
                    {hasChildren && (
                      <Collapse in={isOpen && !collapsed} timeout="auto" unmountOnExit>
                        <List disablePadding sx={{ pl: 4 }}>
                          {item.children!.map((child) => (
                            <Link href={child.href} passHref legacyBehavior key={child.key}>
                              <ListItemButton
                                selected={selected === child.key}
                                onClick={() => handleSelect(child.key)}
                                sx={{
                                  mx: 1,
                                  my: 0.5,
                                  borderRadius: 2,
                                  minHeight: 36,
                                  ...(selected === child.key && {
                                    bgcolor: "primary.50",
                                    color: "primary.main",
                                    boxShadow: "0 0 0 2px #e3e8ff",
                                  }),
                                }}
                              >
                                <ListItemText
                                  primary={child.text}
                                  primaryTypographyProps={{
                                    fontWeight: selected === child.key ? 700 : 500,
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