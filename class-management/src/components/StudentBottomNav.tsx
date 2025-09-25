"use client";
import React from "react";
import { Paper, Badge, alpha, useTheme, Box, Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import OutboxIcon from "@mui/icons-material/Outbox";
import EventIcon from "@mui/icons-material/Event";
import { usePathname, useRouter } from "next/navigation";
import { useNotificationContext } from "@/context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

function useOptionalNotificationContext() {
  try {
    return useNotificationContext();
  } catch {
    return null;
  }
}

export default function StudentBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const possibleCtx = useOptionalNotificationContext();
  const ctxUnread = possibleCtx ? possibleCtx.unreadCount : 0;

  const items = [
    {
      label: "概览",
      fullLabel: "概览",
      icon: <DashboardIcon fontSize="small" />,
      path: "/student/dashboard",
    },
    {
      label: "消息",
      fullLabel: "消息",
      icon: <MailOutlineIcon fontSize="small" />,
      path: "/student/notifications",
      badge: ctxUnread,
    },
    {
      label: "请假",
      fullLabel: "请假",
      icon: <OutboxIcon fontSize="small" />,
      path: "/student/leave/apply",
    },
    {
      label: "日历",
      fullLabel: "日历",
      icon: <EventIcon fontSize="small" />,
      path: "/student/leave/calendar",
    },
  ];

  // 根据实际路径高亮对应项（保持原逻辑：startsWith）
  const currentIndex = Math.max(
    0,
    items.findIndex((i) => pathname.startsWith(i.path))
  );

  return (
    <Paper
      id="student-bottom-nav"
      elevation={0}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        border: "none",
        boxShadow: "none",
        backdropFilter: "none",
        background: "transparent",
        px: 0,
        pt: 0,
        pb: `calc(8px + env(safe-area-inset-bottom))`,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        <motion.div
          key="capsule"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.94 }}
          transition={{ duration: 0.38, ease: [0.22, 0.7, 0.25, 1] }}
          style={{ pointerEvents: "auto" }}
        >
          <Box
            sx={{
              position: "relative",
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              padding: "6px 8px",
              borderRadius: 32,
              // 通过伪元素做真正玻璃层，避免内容本身被过度模糊
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: 32,
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(40,40,48,0.45)"
                    : "rgba(255,255,255,0.55)",
                backdropFilter: "blur(22px) saturate(170%)",
                WebkitBackdropFilter: "blur(22px) saturate(170%)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 18px -4px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.10)"
                    : "0 8px 22px -6px rgba(31,59,88,0.28), inset 0 0 0 1px rgba(255,255,255,0.50)",
                pointerEvents: "none",
              },
              // 提供额外高光/暗角层
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: 32,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 70%)",
                mixBlendMode:
                  theme.palette.mode === "dark" ? "normal" : "overlay",
                pointerEvents: "none",
              },
              // 内容层
              boxShadow: "none",
              pointerEvents: "auto",
            }}
          >
            {items.map((it, idx) => {
              const active = idx === currentIndex;
              return (
                <Tooltip
                  key={it.path}
                  title={it.fullLabel}
                  arrow
                  enterDelay={600}
                >
                  <motion.div
                    whileHover={{ scale: 1.06, y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 28,
                      mass: 0.7,
                    }}
                    style={{ display: "flex", borderRadius: 24 }}
                  >
                    <Box
                      onClick={() => router.push(it.path)}
                      sx={(t) => ({
                        cursor: "pointer",
                        userSelect: "none",
                        position: "relative",
                        minWidth: 52,
                        height: 40,
                        px: 1.6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: ".80rem",
                        fontWeight: 600,
                        letterSpacing: "1px",
                        borderRadius: 24,
                        color: active
                          ? t.palette.primary.main
                          : t.palette.text.secondary,
                        transition: "color .25s ease, background .3s ease",
                        background: active
                          ? t.palette.mode === "dark"
                            ? "linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.14) 100%)"
                            : "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.78) 100%)"
                          : "transparent",
                        boxShadow: active
                          ? t.palette.mode === "dark"
                            ? "0 4px 10px -2px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.22)"
                            : "0 4px 12px -3px rgba(31,59,88,0.25), 0 0 0 1px rgba(255,255,255,0.9)"
                          : "none",
                        backdropFilter: active ? "blur(2px)" : "none",
                        "&:hover": {
                          color: t.palette.primary.main,
                          background:
                            active && undefined
                              ? alpha(t.palette.primary.main, 0.18)
                              : alpha(t.palette.primary.main, 0.12),
                        },
                      })}
                    >
                      {it.badge ? (
                        <Badge
                          badgeContent={it.badge}
                          color="error"
                          max={99}
                          overlap="circular"
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {it.icon}
                            <Box
                              component="span"
                              sx={{ fontSize: ".74rem", mt: "1px" }}
                            >
                              {it.label}
                            </Box>
                          </Box>
                        </Badge>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {it.icon}
                          <Box
                            component="span"
                            sx={{ fontSize: ".74rem", mt: "1px" }}
                          >
                            {it.label}
                          </Box>
                        </Box>
                      )}
                      {active && (
                        <motion.span
                          layoutId="nav-active-indicator"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 24,
                            zIndex: -1,
                          }}
                        />
                      )}
                    </Box>
                  </motion.div>
                </Tooltip>
              );
            })}
          </Box>
        </motion.div>
      </AnimatePresence>
    </Paper>
  );
}
