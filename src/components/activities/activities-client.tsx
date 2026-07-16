"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  BarChart3,
  Bike,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Flame,
  HeartPulse,
  ImageIcon,
  Pencil,
  Plus,
  Route,
  Timer,
  Trash2,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import {
  createActivityLog,
  deleteActivityLog,
  removeActivityPhoto,
  updateActivityLog,
  type ActionResult,
} from "@/app/(dashboard)/dashboard/activities/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizeActionError } from "@/lib/localize-action-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ActivityRow,
  ActivityType,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type ActivitiesClientProps = {
  selectedDate: string;
  initialLogs: ActivityRow[];
  initialWeekLogs: ActivityRow[];
  initialMonthLogs: ActivityRow[];
  supabaseReady: boolean;
};

type ActivityFormAction = (
  formData: FormData,
) => Promise<ActionResult<{ log: ActivityRow }>>;
type Accent = "emerald" | "cyan" | "amber" | "violet" | "rose";
type PhotoScope = "week" | "month";

const activitiesCopy = {
  en: {
    title: "Activities",
    subtitle: "Track football, running, cardio, calories, and heart rate.",
    today: "Today",
    demo: "Demo mode: add Supabase env to save activity logs.",
    sessions: "Sessions",
    loggedToday: "logged today",
    distance: "Distance",
    totalDistance: "total distance",
    duration: "Duration",
    activeTime: "active time",
    calories: "Calories",
    burnedToday: "burned today",
    avgHr: "Avg HR",
    max: "max",
    heartRate: "heart rate",
    trendChart: "Trend chart",
    chartTitle: "Calories, time & heart rate",
    avgHeartRate: "average HR",
    time: "Time",
    sharedScale: "Shared scale from 0 to",
    day: "Day",
    activeDaysMonth: "active days this month",
    sharedAxis: "Shared Y-axis uses real values: kcal, minutes, and bpm",
    chartAria: "Activity combined trend chart",
    dailyAnalysis: "Daily analysis",
    aboveMonthly: "Above monthly rhythm",
    loggedTrackable: "Logged and trackable",
    noData: "No data yet",
    datasetHint: "Activities here become your long-term movement dataset.",
    vsMonthAvg: "vs month avg kcal",
    activeDuration: "active duration",
    distanceToday: "distance today",
    photoHistory: "Photo history",
    activityPhotos: "Activity photos",
    photoHistoryHint: "Photos stay in Activities and can be filtered by the week or month of the selected date.",
    week: "Week",
    month: "Month",
    noPhotos: "No activity photos",
    noPhotosHint: "Log an activity and upload a photo to see it here.",
    activityType: "Activity type",
    distanceKm: "Distance (km)",
    avgHrField: "Average heart rate",
    maxHrField: "Maximum heart rate",
    uploadPhoto: "Upload activity photo",
    uploadHint: "JPG, PNG, WEBP or GIF up to 5 MB. A new upload replaces the current photo.",
    note: "Note",
    notePlaceholder: "Match score, pace, route, feeling...",
    saving: "Saving...",
    updateActivity: "Update activity",
    logActivity: "Log activity",
    openPhoto: "Open activity photo",
    noPhoto: "No photo yet",
    editActivity: "Edit activity",
    editHint: "Update distance, calories, heart rate, photo, or notes.",
    removePhoto: "Remove photo",
    deleteConfirm: "Delete this activity log?",
    removePhotoConfirm: "Remove this activity photo?",
    activityDeleted: "Activity deleted.",
    photoRemoved: "Activity photo removed.",
    activityLogged: "Activity logged.",
    activityUpdated: "Activity updated.",
    trackingLog: "Tracking log",
    trackingHint: "Only activities on this date appear here. Photos stay inside their own day.",
    logDescription: "Save duration, calories, distance, heart rate, photo, and notes.",
    noActivities: "No activities yet",
    noActivitiesHint: "Log football, running, walking, or any cardio for this day.",
    weeklySummary: "Weekly summary",
    activityTypes: {
      football: "Football",
      running: "Running",
      walking: "Walking",
      cycling: "Cycling",
      tabata: "Tabata",
      swimming: "Swimming",
      other: "Other",
    },
  },
  vi: {
    title: "Hoạt động",
    subtitle: "Theo dõi bóng đá, chạy bộ, cardio, calo và nhịp tim.",
    today: "Hôm nay",
    demo: "Chế độ demo: thêm Supabase env để lưu dữ liệu hoạt động.",
    sessions: "Buổi hoạt động",
    loggedToday: "đã ghi hôm nay",
    distance: "Quãng đường",
    totalDistance: "tổng quãng đường",
    duration: "Thời lượng",
    activeTime: "thời gian vận động",
    calories: "Calo",
    burnedToday: "đốt trong hôm nay",
    avgHr: "Nhịp tim TB",
    max: "cao nhất",
    heartRate: "nhịp tim",
    trendChart: "Biểu đồ xu hướng",
    chartTitle: "Calo, thời gian và nhịp tim",
    avgHeartRate: "nhịp tim trung bình",
    time: "Thời gian",
    sharedScale: "Thang đo chung từ 0 đến",
    day: "Ngày",
    activeDaysMonth: "ngày có hoạt động trong tháng",
    sharedAxis: "Trục Y dùng giá trị thật: kcal, phút và bpm",
    chartAria: "Biểu đồ xu hướng hoạt động tổng hợp",
    dailyAnalysis: "Phân tích trong ngày",
    aboveMonthly: "Cao hơn nhịp vận động tháng",
    loggedTrackable: "Đã ghi và có thể theo dõi",
    noData: "Chưa có dữ liệu",
    datasetHint: "Mỗi hoạt động được lưu để tạo dữ liệu vận động dài hạn của bạn.",
    vsMonthAvg: "so với calo TB tháng",
    activeDuration: "thời gian vận động",
    distanceToday: "quãng đường hôm nay",
    photoHistory: "Lịch sử ảnh",
    activityPhotos: "Ảnh hoạt động",
    photoHistoryHint: "Ảnh được lưu trong Hoạt động và lọc theo tuần hoặc tháng của ngày đang xem.",
    week: "Tuần",
    month: "Tháng",
    noPhotos: "Chưa có ảnh hoạt động",
    noPhotosHint: "Ghi một hoạt động và tải ảnh lên để xem tại đây.",
    activityType: "Loại hoạt động",
    distanceKm: "Quãng đường (km)",
    avgHrField: "Nhịp tim trung bình",
    maxHrField: "Nhịp tim cao nhất",
    uploadPhoto: "Tải ảnh hoạt động",
    uploadHint: "JPG, PNG, WEBP hoặc GIF tối đa 5 MB. Ảnh mới sẽ thay ảnh hiện tại.",
    note: "Ghi chú",
    notePlaceholder: "Tỷ số, pace, cung đường, cảm nhận...",
    saving: "Đang lưu...",
    updateActivity: "Cập nhật hoạt động",
    logActivity: "Ghi hoạt động",
    openPhoto: "Mở ảnh hoạt động",
    noPhoto: "Chưa có ảnh",
    editActivity: "Sửa hoạt động",
    editHint: "Cập nhật quãng đường, calo, nhịp tim, ảnh hoặc ghi chú.",
    removePhoto: "Xóa ảnh",
    deleteConfirm: "Xóa hoạt động này?",
    removePhotoConfirm: "Xóa ảnh của hoạt động này?",
    activityDeleted: "Đã xóa hoạt động.",
    photoRemoved: "Đã xóa ảnh hoạt động.",
    activityLogged: "Đã ghi hoạt động.",
    activityUpdated: "Đã cập nhật hoạt động.",
    trackingLog: "Nhật ký theo dõi",
    trackingHint: "Chỉ hoạt động của ngày này xuất hiện tại đây. Ảnh luôn nằm đúng ngày đã ghi.",
    logDescription: "Lưu thời lượng, calo, quãng đường, nhịp tim, ảnh và ghi chú.",
    noActivities: "Ngày này chưa có hoạt động",
    noActivitiesHint: "Ghi bóng đá, chạy bộ, đi bộ hoặc bất kỳ bài cardio nào cho ngày này.",
    weeklySummary: "Tổng kết tuần",
    activityTypes: {
      football: "Bóng đá",
      running: "Chạy bộ",
      walking: "Đi bộ",
      cycling: "Đạp xe",
      tabata: "Tabata",
      swimming: "Bơi lội",
      other: "Khác",
    },
  },
} as const;

function useActivitiesCopy() {
  const { locale } = useI18n();

  return { locale, text: activitiesCopy[locale] };
}

const accentClasses: Record<Accent, string> = {
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  rose: "border-rose-300/20 bg-rose-400/10 text-rose-300",
  violet: "border-violet-300/20 bg-violet-400/10 text-violet-300",
};

const activityMeta: Record<
  ActivityType,
  { icon: ReactNode; accent: Accent }
> = {
  football: {
    icon: <Trophy className="size-4" />,
    accent: "emerald",
  },
  running: {
    icon: <Zap className="size-4" />,
    accent: "cyan",
  },
  walking: {
    icon: <Activity className="size-4" />,
    accent: "violet",
  },
  cycling: {
    icon: <Bike className="size-4" />,
    accent: "amber",
  },
  tabata: {
    icon: <Flame className="size-4" />,
    accent: "rose",
  },
  swimming: {
    icon: <Waves className="size-4" />,
    accent: "cyan",
  },
  other: {
    icon: <Activity className="size-4" />,
    accent: "emerald",
  },
};

const activityTypes = Object.keys(activityMeta) as ActivityType[];

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "lifeos-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <Label className="text-xs font-bold text-slate-200">{children}</Label>;
}

function getBangkokTodayString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(new Date());

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find(
    (part) => part.type === "month",
  )?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return toLocalDateString(date);
}

function formatDisplayDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Bangkok",
    weekday: "short",
    year: "numeric",
  }).format(date);
}

function formatNumber(value: number, locale: Locale = "en") {
  return value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 });
}

function niceAxisMax(value: number) {
  if (value <= 10) {
    return 10;
  }

  if (value <= 50) {
    return Math.ceil(value / 10) * 10;
  }

  if (value <= 200) {
    return Math.ceil(value / 25) * 25;
  }

  if (value <= 500) {
    return Math.ceil(value / 50) * 50;
  }

  return Math.ceil(value / 100) * 100;
}

function formatDuration(minutes: number, locale: Locale = "en") {
  if (minutes < 60) {
    return locale === "vi" ? `${minutes} phút` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (locale === "vi") {
    return remaining ? `${hours} giờ ${remaining} phút` : `${hours} giờ`;
  }

  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function createActivitiesPath(date: string) {
  return `/dashboard/activities?date=${date}`;
}

function metricText(value: number, suffix = "", locale: Locale = "en") {
  return `${formatNumber(value, locale)}${suffix}`;
}

function metricSum(logs: ActivityRow[], key: keyof ActivityRow) {
  return logs.reduce((total, log) => {
    const value = log[key];

    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function averageHeartRate(logs: ActivityRow[]) {
  const values = logs
    .map((log) => log.avg_heart_rate)
    .filter((value): value is number => typeof value === "number" && value > 0);

  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function maxHeartRate(logs: ActivityRow[]) {
  return Math.max(0, ...logs.map((log) => log.max_heart_rate ?? 0));
}

function upsertLog(logs: ActivityRow[], nextLog: ActivityRow) {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [nextLog, ...logs];
  }

  return logs.map((log) => (log.id === nextLog.id ? nextLog : log));
}

function activityPhotoLogs(logs: ActivityRow[]) {
  return logs
    .filter((log) => Boolean(log.image_url))
    .sort((first, second) => {
      if (first.log_date !== second.log_date) {
        return second.log_date.localeCompare(first.log_date);
      }

      return second.created_at.localeCompare(first.created_at);
    });
}

function weekDays(selectedDate: string, locale: Locale) {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  const weekday = selected.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      key: toLocalDateString(date),
      label: new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "short",
      }).format(date),
    };
  });
}

function monthDays(selectedDate: string, locale: Locale) {
  const [year, month] = selectedDate.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, dayIndex) => {
    const date = new Date(year, month - 1, dayIndex + 1);

    return {
      day: dayIndex + 1,
      key: toLocalDateString(date),
      label: String(dayIndex + 1).padStart(2, "0"),
      weekday: new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "short",
      }).format(date),
    };
  });
}

function activeDayCount(logs: ActivityRow[]) {
  return new Set(logs.map((log) => log.log_date)).size;
}

function MetricCard({
  accent = "emerald",
  icon,
  label,
  sub,
  value,
}: {
  accent?: Accent;
  icon: ReactNode;
  label: string;
  sub: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg border sm:size-8",
            accentClasses[accent],
          )}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
        {sub}
      </p>
    </div>
  );
}

function ActivityTrendChart({
  monthLogs,
  onSelectDate,
  selectedDate,
}: {
  monthLogs: ActivityRow[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const { locale, text } = useActivitiesCopy();
  const days = monthDays(selectedDate, locale);
  const rows = days.map((day, index) => {
    const dayLogs = monthLogs.filter((log) => log.log_date === day.key);

    return {
      avgHeartRate: averageHeartRate(dayLogs),
      calories: metricSum(dayLogs, "calories_burned"),
      duration: metricSum(dayLogs, "duration_min"),
      index,
      key: day.key,
      label: day.label,
      sessions: dayLogs.length,
    };
  });
  const selectedRow =
    rows.find((row) => row.key === selectedDate) ??
    rows.find((row) => row.sessions > 0) ??
    rows[0];
  const previousRow = [...rows]
    .reverse()
    .find((row) => row.key < selectedDate && row.sessions > 0);
  const calorieDelta = previousRow
    ? selectedRow.calories - previousRow.calories
    : 0;
  const heartDelta = previousRow
    ? selectedRow.avgHeartRate - previousRow.avgHeartRate
    : 0;
  const durationDelta = previousRow
    ? selectedRow.duration - previousRow.duration
    : 0;

  const xForIndex = (index: number) =>
    days.length <= 1 ? 50 : 2 + (index / (days.length - 1)) * 96;
  const axisMax = niceAxisMax(
    Math.max(
      1,
      ...rows.flatMap((row) => [row.calories, row.duration, row.avgHeartRate]),
    ),
  );
  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    label: Math.round(axisMax * ratio),
    ratio,
  }));
  const yForValue = (value: number, maxValue: number) =>
    88 - Math.min(1, value / maxValue) * 76;
  const dataRows = rows.filter((row) => row.sessions > 0);
  const smoothPathFor = (
    metric: "avgHeartRate" | "calories" | "duration",
    maxValue: number,
  ) => {
    const points = dataRows
      .filter((row) => row[metric] > 0)
      .map((row) => ({
        x: xForIndex(row.index),
        y: yForValue(row[metric], maxValue),
      }));

    if (points.length === 0) {
      return "";
    }

    if (points.length === 1) {
      const point = points[0];

      return `M ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }

    return points
      .map((point, index) => {
        if (index === 0) {
          return `M ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
        }

        const previous = points[index - 1];
        const beforePrevious = points[index - 2] ?? previous;
        const next = points[index + 1] ?? point;
        const controlOne = {
          x: previous.x + (point.x - beforePrevious.x) / 6,
          y: previous.y + (point.y - beforePrevious.y) / 6,
        };
        const controlTwo = {
          x: point.x - (next.x - previous.x) / 6,
          y: point.y - (next.y - previous.y) / 6,
        };

        return `C ${controlOne.x.toFixed(2)},${controlOne.y.toFixed(
          2,
        )} ${controlTwo.x.toFixed(2)},${controlTwo.y.toFixed(
          2,
        )} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      })
      .join(" ");
  };
  const areaPathFor = (
    metric: "avgHeartRate" | "calories" | "duration",
    maxValue: number,
  ) => {
    const points = dataRows
      .filter((row) => row[metric] > 0)
      .map((row) => ({
        x: xForIndex(row.index),
        y: yForValue(row[metric], maxValue),
      }));
    const linePath = smoothPathFor(metric, maxValue);

    if (!linePath || points.length === 0) {
      return "";
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return `${linePath} L ${lastPoint.x.toFixed(2)},88 L ${firstPoint.x.toFixed(
      2,
    )},88 Z`;
  };
  const chartSeries = [
    {
      color: "#facc15",
      fill: "activity-calories-fill",
      line: "activity-calories-line",
      label: text.calories,
      max: axisMax,
      metric: "calories" as const,
      suffix: "kcal",
      value: String(selectedRow.calories),
    },
    {
      color: "#22d3ee",
      fill: "activity-duration-fill",
      line: "activity-duration-line",
      label: text.duration,
      max: axisMax,
      metric: "duration" as const,
      suffix: "min",
      value: String(selectedRow.duration),
    },
    {
      color: "#fb7185",
      fill: "activity-heart-fill",
      line: "activity-heart-line",
      label: text.avgHr,
      max: axisMax,
      metric: "avgHeartRate" as const,
      suffix: "bpm",
      value: selectedRow.avgHeartRate ? String(selectedRow.avgHeartRate) : "--",
    },
  ];

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <BarChart3 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              {text.trendChart}
            </p>
            <h2 className="mt-1 text-base font-black leading-tight text-white sm:text-lg">
              {text.chartTitle}
            </h2>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-amber-300">
            {selectedRow.calories} kcal
            <span className="ml-2 text-slate-500">
              {previousRow ? `${calorieDelta >= 0 ? "+" : ""}${calorieDelta}` : text.today.toLowerCase()}
            </span>
          </span>
          <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-rose-300">
            {selectedRow.avgHeartRate || "--"} bpm
            <span className="ml-2 text-slate-500">
              {previousRow ? `${heartDelta >= 0 ? "+" : ""}${heartDelta}` : text.avgHeartRate}
            </span>
          </span>
          <span className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-cyan-300">
            {formatDuration(selectedRow.duration, locale)}
            <span className="ml-2 text-slate-500">
              {previousRow ? `${durationDelta >= 0 ? "+" : ""}${durationDelta}m` : text.time.toLowerCase()}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-bold text-slate-400">
            <span className="size-2 rounded-full bg-amber-300" />
            {text.calories.toLowerCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-bold text-slate-400">
            <span className="size-2 rounded-full bg-rose-300" />
            {text.avgHr}
          </span>
        </div>
      </div>

      <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#121a35]/85 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-3">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {chartSeries.map((series) => (
                <span
                  key={series.metric}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-black text-slate-300"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  {series.label}
                </span>
              ))}
            </div>
            <span className="hidden text-[11px] font-bold text-slate-500 lg:inline">
              {text.sharedScale} {axisMax}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-200">
              {text.day} {String(selectedRow.index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] gap-2 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-3">
            <div className="relative h-[220px] text-[8px] font-black text-slate-400 sm:h-[260px] sm:text-[10px] lg:h-[300px]">
              {yAxisTicks.map((tick) => (
                <span
                  key={tick.ratio}
                  className="absolute right-0 -translate-y-1/2 text-slate-500"
                  style={{ top: `${12 + (1 - tick.ratio) * 76}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>

            <div className="relative h-[220px] min-w-0 sm:h-[260px] lg:h-[300px]">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                aria-label={text.chartAria}
              >
                <defs>
                  <filter id="activity-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="activity-calories-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                  <linearGradient id="activity-calories-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="activity-duration-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="activity-duration-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="activity-heart-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                  <linearGradient id="activity-heart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {[12, 31, 50, 69, 88].map((line) => (
                  <line
                    key={line}
                    x1="0"
                    x2="100"
                    y1={line}
                    y2={line}
                    stroke="rgba(148,163,184,0.14)"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {rows
                  .filter((row) => row.index % 5 === 0 || row.key === selectedDate)
                  .map((row) => (
                    <line
                      key={row.key}
                      x1={xForIndex(row.index)}
                      x2={xForIndex(row.index)}
                      y1="12"
                      y2="88"
                      stroke="rgba(148,163,184,0.08)"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                <line
                  x1={xForIndex(selectedRow.index)}
                  x2={xForIndex(selectedRow.index)}
                  y1="10"
                  y2="90"
                  stroke="rgba(52,211,153,0.42)"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />

                {chartSeries.map((series) => (
                  <path
                    key={`${series.metric}-fill`}
                    d={areaPathFor(series.metric, series.max)}
                    fill={`url(#${series.fill})`}
                    stroke="none"
                  />
                ))}
                {chartSeries.map((series) => (
                  <path
                    key={`${series.metric}-line`}
                    d={smoothPathFor(series.metric, series.max)}
                    fill="none"
                    stroke={`url(#${series.line})`}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.4"
                    filter="url(#activity-line-glow)"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {chartSeries.map((series) =>
                  dataRows
                    .filter((row) => row[series.metric] > 0)
                    .map((row) => (
                      <circle
                        key={`${series.metric}-${row.key}`}
                        cx={xForIndex(row.index)}
                        cy={yForValue(row[series.metric], series.max)}
                        r={row.key === selectedDate ? 1.8 : 1.1}
                        fill={series.color}
                        stroke="#111827"
                        strokeWidth="0.75"
                        vectorEffect="non-scaling-stroke"
                      />
                    )),
                )}
              </svg>
            </div>
          </div>

          <div className="ml-10 mt-2 h-6 text-[7px] font-bold text-slate-500 sm:ml-[56px] sm:h-7 sm:text-[10px]">
            <div className="relative h-full">
              {rows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => onSelectDate(row.key)}
                  className={cn(
                    "absolute top-0 -translate-x-1/2 rounded-md px-0.5 py-1 transition hover:bg-white/[0.06] hover:text-slate-200 sm:rounded-lg sm:px-1",
                    row.sessions > 0 && "text-slate-300",
                    row.key === selectedDate && "bg-emerald-400/15 text-emerald-200",
                  )}
                  style={{ left: `${xForIndex(row.index)}%` }}
                >
                  {String(row.index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-2 text-[11px] font-bold text-slate-400 sm:flex sm:flex-wrap sm:text-xs">
        <span className="min-w-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
          {dataRows.length} {text.activeDaysMonth}
        </span>
        <span className="min-w-0 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-1.5 leading-relaxed sm:rounded-full">
          {text.sharedAxis}
        </span>
      </div>
    </Panel>
  );
}

function DailyInsightPanel({
  logs,
  monthLogs,
}: {
  logs: ActivityRow[];
  monthLogs: ActivityRow[];
}) {
  const { locale, text } = useActivitiesCopy();
  const dayCalories = metricSum(logs, "calories_burned");
  const dayDuration = metricSum(logs, "duration_min");
  const dayDistance = metricSum(logs, "distance_km");
  const activeDays = Math.max(1, activeDayCount(monthLogs));
  const averageCalories = Math.round(metricSum(monthLogs, "calories_burned") / activeDays);
  const averageDuration = Math.round(metricSum(monthLogs, "duration_min") / activeDays);
  const status =
    dayCalories > averageCalories && dayDuration >= averageDuration
      ? text.aboveMonthly
      : dayCalories || dayDuration
        ? text.loggedTrackable
        : text.noData;

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(15,23,42,0.42)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
          {text.dailyAnalysis}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{status}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {text.datasetHint}
        </p>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs text-slate-400">{text.vsMonthAvg}</p>
          <p className="mt-1 text-xl font-black text-amber-300">
            {dayCalories}/{averageCalories}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs text-slate-400">{text.activeDuration}</p>
          <p className="mt-1 text-xl font-black text-violet-300">
            {formatDuration(dayDuration, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs text-slate-400">{text.distanceToday}</p>
          <p className="mt-1 text-xl font-black text-cyan-300">
            {metricText(dayDistance, "km")}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ActivityPhotoHistoryPanel({
  monthLogs,
  onSelectDate,
  scope,
  selectedDate,
  setScope,
  weekLogs,
}: {
  monthLogs: ActivityRow[];
  onSelectDate: (date: string) => void;
  scope: PhotoScope;
  selectedDate: string;
  setScope: (scope: PhotoScope) => void;
  weekLogs: ActivityRow[];
}) {
  const { locale, text } = useActivitiesCopy();
  const photos = activityPhotoLogs(scope === "week" ? weekLogs : monthLogs);

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            {text.photoHistory}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            {text.activityPhotos}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {text.photoHistoryHint}
          </p>
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 rounded-xl border border-white/10 bg-slate-950/70 p-1 sm:w-auto">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScope(option)}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-black capitalize text-slate-400 transition",
                scope === option && "bg-emerald-400/15 text-emerald-200",
              )}
            >
              {option === "week" ? text.week : text.month}
            </button>
          ))}
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((log) => {
            return (
              <button
                key={log.id}
                type="button"
                onClick={() => onSelectDate(log.log_date)}
                className={cn(
                  "group min-w-0 overflow-hidden rounded-xl border bg-white/[0.035] text-left transition hover:-translate-y-0.5 hover:border-emerald-300/40",
                  log.log_date === selectedDate
                    ? "border-emerald-300/50 shadow-[0_0_26px_rgba(34,197,94,0.14)]"
                    : "border-white/10",
                )}
              >
                <span
                  className="block aspect-[4/3] w-full bg-cover bg-center transition group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(2,6,23,0.03),rgba(2,6,23,0.58)),url("${log.image_url}")`,
                  }}
                />
                <span className="block p-2.5">
                  <span className="block truncate text-xs font-black text-white">
                    {text.activityTypes[log.type]} · {formatDisplayDate(log.log_date, locale)}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                    {log.duration_min ?? 0}m · {log.calories_burned ?? 0} kcal
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center">
          <ImageIcon className="mx-auto size-7 text-slate-500" />
          <p className="mt-2 text-sm font-bold text-white">{text.noPhotos}</p>
          <p className="mt-1 text-xs text-slate-500">
            {text.noPhotosHint}
          </p>
        </div>
      )}
    </Panel>
  );
}

function ActivityTypeSelect({ defaultValue }: { defaultValue?: ActivityType }) {
  const { text } = useActivitiesCopy();

  return (
    <select
      name="type"
      defaultValue={defaultValue ?? "football"}
      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-emerald-300/50"
    >
      {activityTypes.map((type) => (
        <option key={type} value={type}>
          {text.activityTypes[type]}
        </option>
      ))}
    </select>
  );
}

function ActivityForm({
  log,
  onSubmit,
  pending,
  selectedDate,
}: {
  log?: ActivityRow;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { text } = useActivitiesCopy();

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="space-y-4">
      {log ? <input type="hidden" name="id" value={log.id} /> : null}
      <input type="hidden" name="log_date" value={log?.log_date ?? selectedDate} />
      <input type="hidden" name="image_url" value={log?.image_url ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel>{text.activityType}</FieldLabel>
          <ActivityTypeSelect defaultValue={log?.type} />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.duration}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="duration_min"
            defaultValue={log?.duration_min ?? ""}
            placeholder="90"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.distanceKm}</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.01"
            name="distance_km"
            defaultValue={log?.distance_km ?? ""}
            placeholder="7.5"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.calories}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="calories_burned"
            defaultValue={log?.calories_burned ?? ""}
            placeholder="520"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.avgHrField}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="avg_heart_rate"
            defaultValue={log?.avg_heart_rate ?? ""}
            placeholder="135"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.maxHrField}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="max_heart_rate"
            defaultValue={log?.max_heart_rate ?? ""}
            placeholder="175"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.uploadPhoto}</FieldLabel>
        <Input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="h-11 cursor-pointer border-dashed border-cyan-300/25 bg-slate-950/70 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/15 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-cyan-200"
        />
        <p className="text-[11px] text-slate-500">
          {text.uploadHint}
        </p>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.note}</FieldLabel>
        <Textarea
          name="note"
          defaultValue={log?.note ?? ""}
          placeholder={text.notePlaceholder}
          className="min-h-20 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? text.saving : log ? text.updateActivity : text.logActivity}
      </Button>
    </form>
  );
}

function ActivityLogRow({
  log,
  onDelete,
  onRemovePhoto,
  onUpdate,
  pending,
}: {
  log: ActivityRow;
  onDelete: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useActivitiesCopy();
  const [open, setOpen] = useState(false);
  const meta = activityMeta[log.type];

  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.09),transparent_30%),rgba(255,255,255,0.035)] p-3 transition hover:border-cyan-300/25 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        {log.image_url ? (
          <a
            href={log.image_url}
            target="_blank"
            rel="noreferrer"
            className="min-h-44 overflow-hidden rounded-xl border border-cyan-300/20 bg-cover bg-center shadow-[0_0_24px_rgba(34,211,238,0.12)]"
            style={{
              backgroundImage: `linear-gradient(180deg,rgba(2,6,23,0.03),rgba(2,6,23,0.58)),url("${log.image_url}")`,
            }}
            aria-label={text.openPhoto}
          />
        ) : (
          <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-white/15 bg-slate-950/45">
            <div className="text-center">
              <Camera className="mx-auto size-8 text-slate-500" />
              <p className="mt-2 text-xs font-bold text-slate-500">
                {text.noPhoto}
              </p>
            </div>
          </div>
        )}

        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl border",
            accentClasses[meta.accent],
          )}
        >
          {meta.icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{text.activityTypes[log.type]}</p>
            <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
              {formatDuration(log.duration_min ?? 0, locale)}
            </Badge>
            {log.distance_km ? (
              <Badge className="border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                {metricText(log.distance_km, " km", locale)}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {metricText(log.calories_burned ?? 0, " kcal", locale)} · {text.avgHr.toLowerCase()}{" "}
            {log.avg_heart_rate ?? "-"} bpm · {text.max} {log.max_heart_rate ?? "-"} bpm
          </p>
          {log.note ? (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
              {log.note}
            </p>
          ) : null}
        </div>
      </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold text-slate-500">{text.calories}</p>
              <p className="mt-1 text-xl font-black text-amber-300">
                {metricText(log.calories_burned ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold text-slate-500">{text.time}</p>
              <p className="mt-1 text-xl font-black text-violet-300">
                {formatDuration(log.duration_min ?? 0, locale)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold text-slate-500">{text.distance}</p>
              <p className="mt-1 text-xl font-black text-cyan-300">
                {metricText(log.distance_km ?? 0, "km")}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] font-bold text-slate-500">{text.heartRate}</p>
              <p className="mt-1 text-xl font-black text-rose-300">
                {log.avg_heart_rate ?? "--"}
                <span className="ml-1 text-xs text-slate-500">
                  / {log.max_heart_rate ?? "--"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="border-white/10 bg-slate-950/60 text-slate-300 hover:text-white"
            >
              <Pencil className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] overflow-y-auto border-cyan-300/20 bg-[#07111d] text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">
                {text.editActivity}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {text.editHint}
              </DialogDescription>
            </DialogHeader>
            <ActivityForm
              log={log}
              selectedDate={log.log_date}
              pending={pending}
              onSubmit={(event) => {
                onUpdate(event);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {log.image_url ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={pending}
            onClick={() => onRemovePhoto(log.id)}
            className="border-amber-300/20 bg-slate-950/60 text-amber-200 hover:text-amber-100"
            title={text.removePhoto}
          >
            <ImageIcon className="size-4" />
          </Button>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={pending}
          onClick={() => onDelete(log.id)}
          className="border-rose-300/20"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ActivitiesClient({
  selectedDate,
  initialLogs,
  initialWeekLogs,
  initialMonthLogs,
  supabaseReady,
}: ActivitiesClientProps) {
  const router = useRouter();
  const { locale, text } = useActivitiesCopy();
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState(initialLogs);
  const [weekLogs, setWeekLogs] = useState(initialWeekLogs);
  const [monthLogs, setMonthLogs] = useState(initialMonthLogs);
  const [photoScope, setPhotoScope] = useState<PhotoScope>("month");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const today = useMemo(() => getBangkokTodayString(), []);
  const isToday = selectedDate === today;

  useEffect(() => {
    setLogs(initialLogs);
    setWeekLogs(initialWeekLogs);
    setMonthLogs(initialMonthLogs);
    setMessage(null);
    setError(null);
  }, [initialLogs, initialMonthLogs, initialWeekLogs, selectedDate]);

  const summary = useMemo(
    () => ({
      avgHeartRate: averageHeartRate(logs),
      calories: metricSum(logs, "calories_burned"),
      distance: metricSum(logs, "distance_km"),
      duration: metricSum(logs, "duration_min"),
      maxHeartRate: maxHeartRate(logs),
      sessions: logs.length,
    }),
    [logs],
  );

  const weeklySummary = useMemo(
    () => ({
      calories: metricSum(weekLogs, "calories_burned"),
      distance: metricSum(weekLogs, "distance_km"),
      duration: metricSum(weekLogs, "duration_min"),
      sessions: weekLogs.length,
    }),
    [weekLogs],
  );

  const week = useMemo(() => weekDays(selectedDate, locale), [locale, selectedDate]);
  const weekDateSet = useMemo(
    () => new Set(week.map((day) => day.key)),
    [week],
  );
  const month = useMemo(() => monthDays(selectedDate, locale), [locale, selectedDate]);
  const monthDateSet = useMemo(
    () => new Set(month.map((day) => day.key)),
    [month],
  );
  const maxDayCalories = Math.max(
    1,
    ...week.map((day) =>
      metricSum(
        weekLogs.filter((log) => log.log_date === day.key),
        "calories_burned",
      ),
    ),
  );
  const runFormAction = (
    event: FormEvent<HTMLFormElement>,
    action: ActivityFormAction,
    successMessage: string,
    close?: () => void,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await action(formData);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      const nextLog = result.data.log;
      setLogs((currentLogs) => {
        if (nextLog.log_date !== selectedDate) {
          return currentLogs.filter((log) => log.id !== nextLog.id);
        }

        return upsertLog(currentLogs, nextLog);
      });
      setWeekLogs((currentLogs) => {
        if (!weekDateSet.has(nextLog.log_date)) {
          return currentLogs.filter((log) => log.id !== nextLog.id);
        }

        return upsertLog(currentLogs, nextLog);
      });
      setMonthLogs((currentLogs) => {
        if (!monthDateSet.has(nextLog.log_date)) {
          return currentLogs.filter((log) => log.id !== nextLog.id);
        }

        return upsertLog(currentLogs, nextLog);
      });
      setMessage(successMessage);
      close?.();
      router.refresh();
    });
  };

  const runDelete = (activityId: string) => {
    if (!window.confirm(text.deleteConfirm)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await deleteActivityLog(activityId);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      setLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== activityId),
      );
      setWeekLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== activityId),
      );
      setMonthLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== activityId),
      );
      setMessage(text.activityDeleted);
      router.refresh();
    });
  };

  const runRemovePhoto = (activityId: string) => {
    if (!window.confirm(text.removePhotoConfirm)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await removeActivityPhoto(activityId);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      const nextLog = result.data.log;
      setLogs((currentLogs) => upsertLog(currentLogs, nextLog));
      setWeekLogs((currentLogs) => upsertLog(currentLogs, nextLog));
      setMonthLogs((currentLogs) => upsertLog(currentLogs, nextLog));
      setMessage(text.photoRemoved);
      router.refresh();
    });
  };

  const goToDate = (date: string) => {
    router.push(createActivitiesPath(date));
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-3 overflow-hidden pb-20 sm:space-y-4 lg:pb-0">
      <header className="flex flex-col gap-2.5 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid sm:size-11">
            <Activity className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.7rem] font-black leading-none tracking-tight text-white sm:text-3xl">
              {text.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {text.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
          <div className="flex h-10 min-w-0 items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 sm:h-11">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-10 w-10 shrink-0 rounded-none text-slate-300 hover:text-white sm:h-11 sm:w-11"
              onClick={() => goToDate(shiftDate(selectedDate, -1))}
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2 border-x border-white/10 px-2 text-sm font-bold text-white sm:px-3">
              <CalendarDays className="size-4 text-slate-400" />
              <span className="hidden sm:inline">
                {formatDisplayDate(selectedDate, locale)}
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => goToDate(event.target.value)}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold text-white focus-visible:ring-0 sm:w-[142px] sm:flex-none"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-10 w-10 shrink-0 rounded-none text-slate-300 hover:text-white sm:h-11 sm:w-11"
              onClick={() => goToDate(shiftDate(selectedDate, 1))}
            >
              <ChevronRight className="size-4 sm:size-5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isToday}
            onClick={() => goToDate(today)}
            className="h-10 rounded-xl border-emerald-300/20 bg-emerald-400/10 px-3 font-bold text-emerald-200 hover:bg-emerald-400/15 sm:h-11 sm:px-4"
          >
            {text.today}
          </Button>
        </div>
      </header>

      {!supabaseReady ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demo}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
            <MetricCard
              icon={<Activity className="size-4" />}
              label={text.sessions}
              value={metricText(summary.sessions, "", locale)}
              sub={text.loggedToday}
            />
            <MetricCard
              accent="cyan"
              icon={<Route className="size-4" />}
              label={text.distance}
              value={metricText(summary.distance, "km", locale)}
              sub={text.totalDistance}
            />
            <MetricCard
              accent="violet"
              icon={<Timer className="size-4" />}
              label={text.duration}
              value={formatDuration(summary.duration, locale)}
              sub={text.activeTime}
            />
            <MetricCard
              accent="amber"
              icon={<Flame className="size-4" />}
              label={text.calories}
              value={metricText(summary.calories, "", locale)}
              sub={text.burnedToday}
            />
            <MetricCard
              accent="rose"
              icon={<HeartPulse className="size-4" />}
              label={text.avgHr}
              value={summary.avgHeartRate ? `${summary.avgHeartRate}` : "--"}
              sub={summary.maxHeartRate ? `${text.max} ${summary.maxHeartRate} bpm` : text.heartRate}
            />
          </div>

          <ActivityTrendChart
            monthLogs={monthLogs}
            selectedDate={selectedDate}
            onSelectDate={goToDate}
          />

          <ActivityPhotoHistoryPanel
            selectedDate={selectedDate}
            weekLogs={weekLogs}
            monthLogs={monthLogs}
            scope={photoScope}
            setScope={setPhotoScope}
            onSelectDate={goToDate}
          />

          <Panel className="p-3 sm:p-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.trackingLog}
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {formatDisplayDate(selectedDate, locale)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {text.trackingHint}
                </p>
              </div>

              <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    className="h-10 w-full rounded-xl bg-emerald-400/15 font-bold text-emerald-200 hover:bg-emerald-400/20 sm:w-auto"
                  >
                    <Plus className="mr-2 size-4" />
                    {text.logActivity}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                      {text.logActivity}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {text.logDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <ActivityForm
                    selectedDate={selectedDate}
                    pending={isPending}
                    onSubmit={(event) =>
                      runFormAction(
                        event,
                        createActivityLog,
                        text.activityLogged,
                        () => setLogDialogOpen(false),
                      )
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-2">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <ActivityLogRow
                    key={log.id}
                    log={log}
                    pending={isPending}
                    onRemovePhoto={runRemovePhoto}
                    onUpdate={(event) =>
                      runFormAction(
                        event,
                        updateActivityLog,
                        text.activityUpdated,
                      )
                    }
                    onDelete={runDelete}
                  />
                ))
              ) : (
                <div className="min-w-0 rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-3 py-6 text-center sm:p-6">
                  <Activity className="mx-auto size-8 text-emerald-300" />
                  <p className="mt-3 font-black text-white">
                    {text.noActivities}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-400">
                    {text.noActivitiesHint}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <aside className="min-w-0 space-y-4">
          <DailyInsightPanel logs={logs} monthLogs={monthLogs} />

          <Panel className="p-4">
            <h2 className="text-lg font-black text-white">{text.weeklySummary}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs text-slate-400">{text.sessions}</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {weeklySummary.sessions}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs text-slate-400">{text.calories}</p>
                <p className="mt-1 text-2xl font-black text-amber-300">
                  {metricText(weeklySummary.calories, "", locale)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs text-slate-400">{text.distance}</p>
                <p className="mt-1 text-2xl font-black text-cyan-300">
                  {metricText(weeklySummary.distance, "km", locale)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs text-slate-400">{text.time}</p>
                <p className="mt-1 text-2xl font-black text-violet-300">
                  {formatDuration(weeklySummary.duration, locale)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {week.map((day) => {
                const dayLogs = weekLogs.filter((log) => log.log_date === day.key);
                const calories = metricSum(dayLogs, "calories_burned");

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => goToDate(day.key)}
                    className={cn(
                      "grid w-full grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:border-emerald-300/25",
                      day.key === selectedDate &&
                        "border-emerald-300/35 bg-emerald-400/10",
                    )}
                  >
                    <span className="text-xs font-black text-slate-300">
                      {day.label}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <span
                        className="block h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                        style={{
                          width: `${Math.max(
                            4,
                            (calories / maxDayCalories) * 100,
                          )}%`,
                        }}
                      />
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {calories}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

        </aside>
      </div>
    </div>
  );
}

