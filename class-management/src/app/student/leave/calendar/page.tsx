"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

// 使用 Next.js 代理
const API_BASE_URL = "/api";

// 后端日历事件 DTO （与后端字段保持一致）
interface LeaveCalendarDTO {
  requestId: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  status: string;
  startDate: string; // ISO 字符串
  endDate: string; // ISO 字符串
}

// 前端渲染使用的事件结构
interface LeaveEvent {
  requestId: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  status: string;
  start: Date;
  end: Date;
  startYmd: string;
  endYmd: string;
  color: { primary: string; bg: string };
}

const statusPaletteMap: Record<
  string,
  "warning" | "success" | "error" | "info"
> = {
  待审批: "warning",
  已批准: "success",
  已拒绝: "error",
};

export default function StudentLeaveCalendarPage() {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [direction, setDirection] = useState<1 | -1 | 0>(0);

  const ymd = (d: Date) =>
    `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
      2,
      "0"
    )}-${`${d.getDate()}`.padStart(2, "0")}`;
  const isoStartOfDay = (d: Date) =>
    new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    ).toISOString();
  const isoEndOfDay = (d: Date) =>
    new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    ).toISOString();

  const typePaletteMap = useMemo<
    Record<
      string,
      "primary" | "success" | "warning" | "error" | "info" | "secondary"
    >
  >(
    () => ({
      annual: "primary",
      sick: "success",
      personal: "warning",
      emergency: "error",
    }),
    []
  );
  const typeColor = useCallback(
    (code: string) => {
      const key = typePaletteMap[code] || "info";
      const paletteSection = theme.palette[
        key as keyof typeof theme.palette
      ] as { main: string };
      const main = paletteSection.main;
      return {
        primary: main,
        bg: alpha(main, theme.palette.mode === "light" ? 0.15 : 0.28),
      };
    },
    [theme, typePaletteMap]
  );

  const getStatusInfo = useCallback(
    (status: string) => {
      const key = statusPaletteMap[status] || "info";
      const paletteSection = theme.palette[
        key as keyof typeof theme.palette
      ] as { main: string };
      const main = paletteSection.main;
      return {
        label: status,
        color: main,
        bgColor: alpha(main, theme.palette.mode === "light" ? 0.15 : 0.25),
      };
    },
    [theme]
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay();
    const arr: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startDow - 1; i >= 0; i--)
      arr.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++)
      arr.push({ date: new Date(year, month, d), isCurrentMonth: true });
    const remain = 42 - arr.length;
    for (let d = 1; d <= remain; d++)
      arr.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    return arr;
  };

  const navigatePrevious = () => {
    const nd = new Date(currentDate);
    nd.setMonth(nd.getMonth() - 1);
    setDirection(-1);
    setCurrentDate(nd);
  };
  const navigateNext = () => {
    const nd = new Date(currentDate);
    nd.setMonth(nd.getMonth() + 1);
    setDirection(1);
    setCurrentDate(nd);
  };
  const goToToday = () => {
    setDirection(0);
    setCurrentDate(new Date());
  };
  const formatDateRange = () =>
    `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
  const handleEventClick = (ev: LeaveEvent) => {
    setSelectedEvent(ev);
    setDetailDialog(true);
  };

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const controller = new AbortController();
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("start", isoStartOfDay(start));
        params.set("end", isoEndOfDay(end));
        const res = await fetch(
          `${API_BASE_URL}/leave/calendar?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("加载失败");
        const list: LeaveCalendarDTO[] = await res.json();
        const mapped: LeaveEvent[] = list.map((it) => {
          const s = new Date(it.startDate);
          const e = new Date(it.endDate);
          return {
            requestId: it.requestId,
            studentId: it.studentId,
            studentName: it.studentName,
            studentNo: it.studentNo,
            leaveTypeCode: it.leaveTypeCode,
            leaveTypeName: it.leaveTypeName,
            status: it.status,
            start: s,
            end: e,
            startYmd: ymd(s),
            endYmd: ymd(e),
            color: typeColor(it.leaveTypeCode),
          };
        });
        setEvents(mapped);
      } catch (err) {
        console.error(err);
        setEvents([]);
      }
    })();
    return () => controller.abort();
  }, [currentDate, typeColor]);

  // 生成用于连续条渲染的数据结构：按周分组 6 周，每周 7 天
  const buildWeeks = (days: { date: Date; isCurrentMonth: boolean }[]) => {
    const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks; // length 6
  };

  interface SpanSegment {
    key: string;
    from: number;
    to: number;
    event: LeaveEvent;
    isStart: boolean;
    isEnd: boolean;
    row?: number;
  }

  const computeWeekSpans = (
    week: { date: Date; isCurrentMonth: boolean }[]
  ): SpanSegment[] => {
    // 每个事件如果覆盖该周任意一天 -> 生成一个 segment，from/to 为列索引
    const spans: SpanSegment[] = [];
    const weekStart = week[0].date;
    const weekEnd = week[6].date;
    const weekStartYmd = ymd(weekStart);
    const weekEndYmd = ymd(weekEnd);
    events.forEach((ev) => {
      if (ev.endYmd < weekStartYmd || ev.startYmd > weekEndYmd) return; // 不在此周
      // 确定从哪天开始、结束（裁剪）
      let fromIdx = week.findIndex(
        (d) =>
          ymd(d.date) ===
          (ev.startYmd < weekStartYmd ? weekStartYmd : ev.startYmd)
      );
      if (fromIdx === -1) fromIdx = 0;
      let toIdx = week.findIndex(
        (d) => ymd(d.date) === (ev.endYmd > weekEndYmd ? weekEndYmd : ev.endYmd)
      );
      if (toIdx === -1) toIdx = 6;
      spans.push({
        key: `${ev.requestId}-${fromIdx}-${toIdx}`,
        from: fromIdx,
        to: toIdx,
        event: ev,
        isStart: ev.startYmd >= weekStartYmd,
        isEnd: ev.endYmd <= weekEndYmd,
      });
    });
    // 简单按长度 & 起点排序
    spans.sort(
      (a, b) =>
        a.from - b.from ||
        b.to - b.from - (a.to - a.from) ||
        a.event.requestId - b.event.requestId
    );
    // 行布局（贪心）
    const rows: SpanSegment[][] = [];
    spans.forEach((span) => {
      let placed = false;
      for (let r = 0; r < rows.length; r++) {
        const conflict = rows[r].some(
          (s) => !(span.to < s.from || span.from > s.to)
        );
        if (!conflict) {
          span.row = r;
          rows[r].push(span);
          placed = true;
          break;
        }
      }
      if (!placed) {
        span.row = rows.length;
        rows.push([span]);
      }
    });
    return spans;
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weeks = buildWeeks(days);
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    return (
      <Box>
        {/* 周标题行 - 无底边框，淡色文字 */}
        <Box
          sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", mb: 1 }}
        >
          {weekDays.map((d, i) => (
            <Box
              key={d}
              sx={(t) => ({
                textAlign: "center",
                fontWeight: 500,
                fontSize: "0.7rem",
                letterSpacing: ".5px",
                color:
                  i === 0 || i === 6
                    ? t.palette.error.main
                    : t.palette.text.secondary,
                opacity: 0.85,
              })}
            >
              {d}
            </Box>
          ))}
        </Box>
        {/* 周循环 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {weeks.map((week, wi) => {
            const spans = computeWeekSpans(week);
            return (
              <Box key={wi}>
                {/* 日期行 */}
                <Box
                  sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}
                >
                  {week.map((info, di) => {
                    const isToday =
                      info.date.toDateString() === new Date().toDateString();
                    const isWeekend =
                      info.date.getDay() === 0 || info.date.getDay() === 6;
                    return (
                      <Box
                        key={di}
                        sx={(t) => ({
                          height: 64,
                          px: 0.4,
                          borderRadius: 3,
                          position: "relative",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background .18s",
                          "&:hover": {
                            backgroundColor: t.palette.action.hover,
                          },
                        })}
                      >
                        <Box
                          sx={(t) => ({
                            width: 28,
                            height: 28,
                            borderRadius: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isToday
                              ? t.palette.primary.main + "22"
                              : "transparent",
                            border: isToday
                              ? `1.5px solid ${t.palette.primary.main}`
                              : "1px solid transparent",
                            color: isToday
                              ? t.palette.primary.main
                              : info.isCurrentMonth
                              ? isWeekend
                                ? t.palette.error.main
                                : t.palette.text.primary
                              : t.palette.text.disabled,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            letterSpacing: ".5px",
                          })}
                        >
                          {info.date.getDate()}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                {/* 连续事件条层 (多行 + 渐变提示) */}
                {spans.length > 0 && (
                  <Box
                    sx={{
                      position: "relative",
                      mt: 0.2,
                      pb: spans.some((s) => (s.row || 0) > 0) ? 0.4 : 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7,1fr)",
                        columnGap: 0.4,
                      }}
                    >
                      {spans.map((span) => {
                        const colSpan = span.to - span.from + 1;
                        const gradientLeft = !span.isStart;
                        const gradientRight = !span.isEnd;
                        return (
                          <Box
                            key={span.key}
                            onClick={() => handleEventClick(span.event)}
                            sx={(t) => ({
                              gridColumn: `${span.from + 1} / span ${colSpan}`,
                              mt: span.row ? span.row * 0.55 + "rem" : 0,
                              height: 18,
                              display: "flex",
                              alignItems: "center",
                              position: "relative",
                              background: span.event.color.primary,
                              color: t.palette.getContrastText(
                                span.event.color.primary
                              ),
                              fontSize: "0.55rem",
                              fontWeight: 500,
                              px: 0.8,
                              borderRadius:
                                span.isStart && span.isEnd
                                  ? "999px"
                                  : span.isStart
                                  ? "999px 0 0 999px"
                                  : span.isEnd
                                  ? "0 999px 999px 0"
                                  : "0",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              "&:hover": { filter: "brightness(1.05)" },
                            })}
                          >
                            <Box
                              component="span"
                              sx={{ position: "relative", zIndex: 2 }}
                            >
                              {span.event.leaveTypeName}
                            </Box>
                            {(gradientLeft || gradientRight) && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  pointerEvents: "none",
                                }}
                              >
                                {gradientLeft && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: "100%",
                                      background: `linear-gradient(90deg, ${span.event.color.primary} 10%, rgba(0,0,0,0))`,
                                    }}
                                  />
                                )}
                                <Box sx={{ flex: 1 }} />
                                {gradientRight && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: "100%",
                                      background: `linear-gradient(270deg, ${span.event.color.primary} 10%, rgba(0,0,0,0))`,
                                    }}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Box
        sx={{
          px: { xs: 1, sm: 2 },
          pt: 1.5,
          pb: 2,
          backgroundColor: "transparent",
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 顶部导航 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={navigatePrevious}
              sx={(t) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: "transparent",
                color: t.palette.text.primary,
                "&:hover": { backgroundColor: t.palette.action.hover },
              })}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={navigateNext}
              sx={(t) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: "transparent",
                color: t.palette.text.primary,
                "&:hover": { backgroundColor: t.palette.action.hover },
              })}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
          <Button
            startIcon={<TodayIcon />}
            size="small"
            onClick={goToToday}
            sx={(t) => ({
              borderRadius: 10,
              px: 1.6,
              py: 0.7,
              fontSize: "0.65rem",
              letterSpacing: ".5px",
              backgroundColor: t.palette.action.hover,
              color: t.palette.text.primary,
              fontWeight: 500,
              "&:hover": {
                backgroundColor: t.palette.primary.main,
                color: t.palette.primary.contrastText,
              },
            })}
          >
            今天
          </Button>
        </Box>
        {/* 年月标题 */}
        <Typography
          variant="h4"
          sx={(t) => ({
            fontWeight: 700,
            mb: 2.5,
            letterSpacing: "2px",
            fontSize: "2.1rem",
            color: t.palette.text.primary,
          })}
        >
          {formatDateRange()}
        </Typography>
        {/* 主体：日历动画切换 */}
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              initial={{
                opacity: 0,
                x: direction === 1 ? 120 : direction === -1 ? -120 : 0,
                scale: 0.95,
                rotateY: direction === 1 ? 15 : direction === -1 ? -15 : 0,
                filter: 'blur(3px)'
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                rotateY: 0,
                filter: 'blur(0px)'
              }}
              exit={{
                opacity: 0,
                x: direction === 1 ? -120 : direction === -1 ? 120 : -40,
                scale: 0.92,
                rotateY: direction === 1 ? -12 : direction === -1 ? 12 : 8,
                filter: 'blur(3px)'
              }}
              transition={{
                opacity: { duration: 0.20 },
                x: { type: 'spring', stiffness: 180, damping: 22, mass: 0.8 },
                rotateY: { type: 'spring', stiffness: 150, damping: 20 },
                scale: { type: 'spring', stiffness: 130, damping: 18 },
                filter: { duration: 0.38 }
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {renderMonthView()}
            </motion.div>
          </AnimatePresence>
        </Box>

        <Dialog
          open={detailDialog}
          onClose={() => setDetailDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, backdropFilter: "blur(16px)" } }}
        >
          <DialogTitle
            sx={(t) => ({ backgroundColor: t.palette.action.hover })}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              请假详情
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {selectedEvent && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    p: 2.5,
                    backgroundColor: selectedEvent.color.bg,
                    borderRadius: 2,
                    border: `1px solid ${selectedEvent.color.primary}30`,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: selectedEvent.color.primary,
                      width: 56,
                      height: 56,
                      fontWeight: 600,
                    }}
                  >
                    {selectedEvent.studentName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedEvent.studentName}
                    </Typography>
                    <Chip
                      label={selectedEvent.studentNo}
                      size="small"
                      sx={(t) => ({
                        backgroundColor: t.palette.action.hover,
                        fontSize: "0.65rem",
                        height: 22,
                      })}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={(t) => ({
                        color: t.palette.text.secondary,
                        mb: 0.5,
                        display: "block",
                      })}
                    >
                      请假类型
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: selectedEvent.color.primary,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedEvent.leaveTypeName}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={(t) => ({
                        color: t.palette.text.secondary,
                        mb: 0.5,
                        display: "block",
                      })}
                    >
                      审批状态
                    </Typography>
                    {(() => {
                      const info = getStatusInfo(selectedEvent.status);
                      return (
                        <Chip
                          label={info.label}
                          size="small"
                          sx={{
                            backgroundColor: info.bgColor,
                            color: info.color,
                            fontWeight: 600,
                            height: 26,
                            fontSize: "0.7rem",
                          }}
                        />
                      );
                    })()}
                  </Box>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={(t) => ({
                      color: t.palette.text.secondary,
                      mb: 0.5,
                      display: "block",
                    })}
                  >
                    请假时间
                  </Typography>
                  <Box
                    sx={(t) => ({
                      p: 2,
                      backgroundColor: t.palette.action.hover,
                      borderRadius: 2,
                    })}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedEvent.startYmd === selectedEvent.endYmd
                        ? `${selectedEvent.startYmd}（单日）`
                        : `${selectedEvent.startYmd} 至 ${selectedEvent.endYmd}`}
                    </Typography>
                    {selectedEvent.startYmd !== selectedEvent.endYmd && (
                      <Typography
                        variant="caption"
                        sx={(t) => ({ color: t.palette.text.secondary })}
                      >
                        共计{" "}
                        {Math.ceil(
                          (new Date(selectedEvent.endYmd).getTime() -
                            new Date(selectedEvent.startYmd).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{" "}
                        天
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setDetailDialog(false)}
              variant="contained"
              size="small"
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
