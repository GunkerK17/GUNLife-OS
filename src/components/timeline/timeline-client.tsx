"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { LucideIcon } from "lucide-react";
import { localizeActionError } from "@/lib/localize-action-error";
import {
  localizeGeneratedTaskDescription,
  localizeGeneratedTimelineNote,
} from "@/lib/localize-generated-content";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Focus,
  MoreVertical,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
  Utensils,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import {
  createTimelineBlock,
  createTimelineBlockFromTemplate,
  createTimelineTemplate,
  deleteTimelineBlock,
  deleteTimelineTemplate,
  setTimelineLogStatus,
  updateTimelineBlock,
  updateTimelineTemplate,
} from "@/app/(dashboard)/dashboard/timeline/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/providers/i18n-provider";
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
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import type {
  TaskStatus,
  TimelineCategory,
  TimelineLogRow,
  TimelineTemplateRow,
  WorkoutPlanRow,
} from "@/lib/supabase/database.types";

type TimelineClientProps = {
  selectedDate: string;
  initialLogs: TimelineLogRow[];
  initialTemplates: TimelineTemplateRow[];
  initialWorkoutPlans: WorkoutPlanRow[];
  generated: boolean;
  supabaseReady: boolean;
};

const timelineCopy = {
  en: {
    title: "Timeline",
    subtitle: "Plan your day. Stay focused. Get things done.",
    previousDay: "Previous day",
    nextDay: "Next day",
    today: "Today",
    now: "Now",
    generated: "Timeline was auto-generated from goals and skills for this date.",
    dailyOverview: "Daily overview",
    blocks: "Blocks",
    pending: "Pending",
    skipped: "Skipped",
    focus: "Focus",
    rate: "Rate",
    date: "Date",
    done: "Done",
    waiting: "waiting",
    doneCaption: "done",
    skippedCaption: "skipped",
    doneDuration: "done duration",
    great: "great",
    keepGoing: "keep going",
    dayTimeline: "Day timeline",
    presets: "Presets",
    managePresets: "Manage presets",
    presetsDescription: "Presets are reusable quick-add blocks. They never auto-add to other days.",
    noTemplates: "No presets yet. Create one above, then press Use to add it to this day.",
    presetOnly: "Preset only",
    use: "Use",
    edit: "Edit",
    delete: "Delete",
    addTask: "Add task",
    editBlock: "Edit timeline block",
    addBlock: "Add timeline block",
    blockDescription: "Create a daily block with optional time, or save it as a reusable preset.",
    noBlocks: "No blocks for this date yet",
    noBlocksHint: "Add a block for this day. Pick Workout / Gym to link the timeline with a workout plan.",
    addFirstBlock: "Add first block",
    anytime: "Anytime",
    flexible: "Flexible",
    linkedWorkout: "Linked workout",
    workout: "Workout",
    undo: "Undo",
    completedAt: "completed",
    taskSummary: "Task summary",
    totalTasks: "Total tasks",
    completed: "Completed",
    completionRate: "Completion rate",
    focusBlocks: "Focus blocks",
    noFocusBlocks: "No focus blocks yet.",
    totalFocusTime: "Total focus time",
    timeOptional: "time is optional",
    fieldTitle: "Title",
    titlePlaceholder: "Deep Work Session",
    category: "Category",
    duration: "Duration",
    linkWorkoutPlan: "Link workout plan",
    linkWorkoutHint: "Choose this date's workout so Timeline and Workout stay in sync.",
    openWorkout: "Open workout",
    manualGymBlock: "Manual gym block",
    noWorkoutPlan: "No workout plan exists for this date. The block will still be saved, but it will not be linked to exercises.",
    note: "Note",
    notePlaceholder: "Optional note...",
    timeRange: "Time range",
    start: "Start",
    end: "End",
    timeHint: "Leave both empty for an anytime block. End time can calculate duration.",
    saveAsPreset: "Save as preset",
    saveAsPresetHint: "Reuse this block later.",
    deleteBlock: "Delete block",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save changes",
    presetTitle: "Preset title",
    presetPlaceholder: "Gym / Study / Lunch...",
    startTime: "Start time",
    updatePreset: "Update preset",
    createPreset: "Create preset",
    connectUpdate: "Connect Supabase to update real timeline data.",
    connectSave: "Connect Supabase to save timeline blocks.",
    connectTemplates: "Connect Supabase to save presets.",
    connectUseTemplate: "Connect Supabase to add presets to timeline.",
    connectDeleteTemplate: "Connect Supabase to delete presets.",
    connectDelete: "Connect Supabase to delete timeline blocks.",
    deleteConfirm: "Delete this block from the selected date?",
    openWorkoutFor: "Open workout for",
    markDone: "Mark as done",
    skipTask: "Skip task",
    undoTask: "Undo task status",
    editTask: "Edit task",
    deleteTask: "Delete task",
    categories: {
      sleep: "Sleep",
      gym: "Workout / Gym",
      work: "Work",
      study: "Focus",
      sport: "Sport",
      meal: "Meal",
      rest: "Routine",
      other: "Personal",
    },
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  vi: {
    title: "Lịch ngày",
    subtitle: "Lên kế hoạch ngày mới. Giữ tập trung. Hoàn thành từng việc.",
    previousDay: "Ngày trước",
    nextDay: "Ngày sau",
    today: "Hôm nay",
    now: "Nay",
    generated: "Lịch ngày được tự động tạo từ Mục tiêu và Kỹ năng cho ngày này.",
    dailyOverview: "Tổng quan trong ngày",
    blocks: "Công việc",
    pending: "Đang chờ",
    skipped: "Bỏ qua",
    focus: "Tập trung",
    rate: "Tỷ lệ",
    date: "Ngày",
    done: "Xong",
    waiting: "đang chờ",
    doneCaption: "đã xong",
    skippedCaption: "đã bỏ qua",
    doneDuration: "thời gian đã hoàn thành",
    great: "rất tốt",
    keepGoing: "tiếp tục nhé",
    dayTimeline: "Lịch công việc",
    presets: "Mẫu nhanh",
    managePresets: "Quản lý mẫu nhanh",
    presetsDescription: "Mẫu nhanh giúp thêm lại công việc. Mẫu không tự xuất hiện ở ngày khác.",
    noTemplates: "Chưa có mẫu nhanh. Hãy tạo một mẫu ở trên rồi bấm Dùng để thêm vào ngày này.",
    presetOnly: "Chỉ là mẫu",
    use: "Dùng",
    edit: "Sửa",
    delete: "Xóa",
    addTask: "Thêm việc",
    editBlock: "Sửa công việc",
    addBlock: "Thêm công việc vào lịch",
    blockDescription: "Tạo công việc cho ngày này, thời gian có thể để trống hoặc lưu thành mẫu dùng lại.",
    noBlocks: "Ngày này chưa có công việc",
    noBlocksHint: "Thêm một công việc. Chọn Tập luyện / Gym để liên kết với giáo án Workout.",
    addFirstBlock: "Thêm việc đầu tiên",
    anytime: "Không cố định",
    flexible: "Linh hoạt",
    linkedWorkout: "Đã liên kết tập luyện",
    workout: "Tập luyện",
    undo: "Hoàn tác",
    completedAt: "hoàn thành lúc",
    taskSummary: "Tổng kết công việc",
    totalTasks: "Tổng công việc",
    completed: "Hoàn thành",
    completionRate: "Tỷ lệ hoàn thành",
    focusBlocks: "Khung giờ tập trung",
    noFocusBlocks: "Chưa có khung giờ tập trung.",
    totalFocusTime: "Tổng thời gian tập trung",
    timeOptional: "không bắt buộc thời gian",
    fieldTitle: "Tên công việc",
    titlePlaceholder: "Ví dụ: Làm việc tập trung",
    category: "Danh mục",
    duration: "Thời lượng",
    linkWorkoutPlan: "Liên kết giáo án tập",
    linkWorkoutHint: "Chọn buổi tập của ngày này để Lịch ngày và Workout đồng bộ với nhau.",
    openWorkout: "Mở Tập luyện",
    manualGymBlock: "Buổi tập nhập thủ công",
    noWorkoutPlan: "Ngày này chưa có giáo án tập. Công việc vẫn được lưu nhưng chưa liên kết tới bài tập.",
    note: "Ghi chú",
    notePlaceholder: "Ghi chú không bắt buộc...",
    timeRange: "Khung thời gian",
    start: "Bắt đầu",
    end: "Kết thúc",
    timeHint: "Để trống cả hai nếu không cố định giờ. Giờ kết thúc có thể dùng để tính thời lượng.",
    saveAsPreset: "Lưu thành mẫu nhanh",
    saveAsPresetHint: "Dùng lại công việc này vào ngày khác.",
    deleteBlock: "Xóa công việc",
    cancel: "Hủy",
    saving: "Đang lưu...",
    saveChanges: "Lưu thay đổi",
    presetTitle: "Tên mẫu",
    presetPlaceholder: "Gym / Học / Ăn trưa...",
    startTime: "Giờ bắt đầu",
    updatePreset: "Cập nhật mẫu",
    createPreset: "Tạo mẫu",
    connectUpdate: "Hãy kết nối Supabase để cập nhật dữ liệu lịch thật.",
    connectSave: "Hãy kết nối Supabase để lưu công việc.",
    connectTemplates: "Hãy kết nối Supabase để lưu mẫu nhanh.",
    connectUseTemplate: "Hãy kết nối Supabase để thêm mẫu vào lịch.",
    connectDeleteTemplate: "Hãy kết nối Supabase để xóa mẫu nhanh.",
    connectDelete: "Hãy kết nối Supabase để xóa công việc.",
    deleteConfirm: "Xóa công việc này khỏi ngày đang chọn?",
    openWorkoutFor: "Mở buổi tập",
    markDone: "Đánh dấu hoàn thành",
    skipTask: "Bỏ qua công việc",
    undoTask: "Hoàn tác trạng thái",
    editTask: "Sửa công việc",
    deleteTask: "Xóa công việc",
    categories: {
      sleep: "Ngủ",
      gym: "Tập luyện / Gym",
      work: "Công việc",
      study: "Tập trung",
      sport: "Thể thao",
      meal: "Bữa ăn",
      rest: "Thói quen",
      other: "Cá nhân",
    },
    weekdays: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  },
} as const;

function useTimelineCopy() {
  const { locale } = useI18n();

  return { locale, text: timelineCopy[locale] };
}

type CategoryMeta = {
  icon: LucideIcon;
  text: string;
  bg: string;
  border: string;
  dot: string;
};

const categoryOptions: TimelineCategory[] = [
  "sleep",
  "gym",
  "work",
  "study",
  "sport",
  "meal",
  "rest",
  "other",
];

const categoryMeta: Record<TimelineCategory, CategoryMeta> = {
  sleep: {
    icon: Moon,
    text: "text-violet-300",
    bg: "bg-violet-400/10",
    border: "border-violet-300/30",
    dot: "bg-violet-300",
  },
  gym: {
    icon: Dumbbell,
    text: "text-sky-300",
    bg: "bg-sky-400/10",
    border: "border-sky-300/30",
    dot: "bg-sky-300",
  },
  work: {
    icon: BriefcaseBusiness,
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-300/30",
    dot: "bg-amber-300",
  },
  study: {
    icon: BookOpen,
    text: "text-teal-300",
    bg: "bg-teal-400/10",
    border: "border-teal-300/30",
    dot: "bg-teal-300",
  },
  sport: {
    icon: Zap,
    text: "text-green-300",
    bg: "bg-green-400/10",
    border: "border-green-300/30",
    dot: "bg-green-300",
  },
  meal: {
    icon: Utensils,
    text: "text-orange-300",
    bg: "bg-orange-400/10",
    border: "border-orange-300/30",
    dot: "bg-orange-300",
  },
  rest: {
    icon: Waves,
    text: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-300/25",
    dot: "bg-slate-300",
  },
  other: {
    icon: Sparkles,
    text: "text-cyan-300",
    bg: "bg-cyan-400/10",
    border: "border-cyan-300/30",
    dot: "bg-cyan-300",
  },
};

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
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

function formatDisplayDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return toLocalDateString(date);
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getBangkokTodayString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function formatTime(time: string | null, anytime = "Anytime") {
  return time ? time.slice(0, 5) : anytime;
}

function timeInputValue(time?: string | null) {
  return time ? time.slice(0, 5) : "";
}

function timeToMinutes(time: string | null) {
  if (!time) {
    return null;
  }

  const [hour, minute] = time.slice(0, 5).split(":").map(Number);

  return hour * 60 + minute;
}

function addMinutesToTime(time: string | null, minutes: number | null) {
  const startMinutes = timeToMinutes(time);

  if (startMinutes == null || !minutes) {
    return null;
  }

  const totalMinutes = (startMinutes + minutes) % (24 * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeRangeLabel(log: TimelineLogRow, anytime: string) {
  if (!log.start_time) {
    return anytime;
  }

  const endTime = addMinutesToTime(log.start_time, log.duration_min);

  return endTime ? `${formatTime(log.start_time)} - ${endTime}` : formatTime(log.start_time);
}

function formatCompletedAt(value: string | null, locale: "vi" | "en") {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function sortLogs(logs: TimelineLogRow[]) {
  return [...logs].sort((firstLog, secondLog) =>
    (firstLog.start_time ?? "99:99").localeCompare(
      secondLog.start_time ?? "99:99",
    ),
  );
}

function completionRate(logs: TimelineLogRow[]) {
  if (logs.length === 0) {
    return 0;
  }

  return Math.round(
    (logs.filter((log) => log.status === "done").length / logs.length) * 100,
  );
}

function durationLabel(minutes: number | null, locale: Locale, flexible: string) {
  if (!minutes) {
    return flexible;
  }

  if (minutes < 60) {
    return locale === "vi" ? `${minutes} phút` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (locale === "vi") {
    return remaining > 0 ? `${hours} giờ ${remaining} phút` : `${hours} giờ`;
  }

  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function focusTimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours}h ${String(remaining).padStart(2, "0")}m`;
}

function statusLabel(status: TaskStatus, text: (typeof timelineCopy)[Locale]) {
  if (status === "done") {
    return text.done;
  }

  if (status === "skipped") {
    return text.skipped;
  }

  return text.pending;
}

function monthMatrix(dateString: string) {
  const [selectedYear, selectedMonth, selectedDay] = dateString
    .split("-")
    .map(Number);
  const selected = new Date(selectedYear, selectedMonth - 1, selectedDay);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = toLocalDateString(date);

    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      selected: key === dateString,
    };
  });
}

function sortTemplates(templates: TimelineTemplateRow[]) {
  return [...templates].sort((first, second) =>
    first.start_time.localeCompare(second.start_time),
  );
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-emerald-400"
      : value >= 50
        ? "bg-amber-400"
        : "bg-slate-500";

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function CategorySelect({
  defaultValue,
  onValueChange,
  value,
}: {
  defaultValue?: TimelineCategory;
  onValueChange?: (value: TimelineCategory) => void;
  value?: TimelineCategory;
}) {
  const { text } = useTimelineCopy();
  const selectProps =
    value === undefined
      ? { defaultValue: defaultValue ?? "work" }
      : {
          value,
          onChange: (event: ChangeEvent<HTMLSelectElement>) =>
            onValueChange?.(event.target.value as TimelineCategory),
        };

  return (
    <select
      name="category"
      {...selectProps}
      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-emerald-300/50"
    >
      {categoryOptions.map((category) => (
        <option key={category} value={category}>
          {text.categories[category]}
        </option>
      ))}
    </select>
  );
}

function TimelineBlockForm({
  selectedDate,
  workoutPlans = [],
  log,
  onSubmit,
  onCancel,
  onDelete,
  pending,
}: {
  selectedDate: string;
  workoutPlans: WorkoutPlanRow[];
  log?: TimelineLogRow | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  pending: boolean;
}) {
  const { locale, text } = useTimelineCopy();
  const defaultEndTime = addMinutesToTime(log?.start_time ?? null, log?.duration_min ?? null);
  const [category, setCategory] = useState<TimelineCategory>(log?.category ?? "work");
  const [title, setTitle] = useState(log?.title ?? "");
  const [durationValue, setDurationValue] = useState(
    log?.duration_min ? String(log.duration_min) : "",
  );
  const [noteValue, setNoteValue] = useState(log?.note ?? "");
  const [selectedWorkoutPlanId, setSelectedWorkoutPlanId] = useState(
    log?.source_type === "workout_plan" ? (log.source_id ?? "") : "",
  );

  function selectWorkoutPlan(planId: string) {
    setSelectedWorkoutPlanId(planId);

    const plan = workoutPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    setTitle(`${text.workout} — ${plan.name}`);
    setCategory("gym");

    if (!durationValue) {
      setDurationValue("75");
    }

    if (!noteValue && plan.description) {
      setNoteValue(plan.description);
    }
  }

  function handleCategoryChange(nextCategory: TimelineCategory) {
    setCategory(nextCategory);

    if (nextCategory !== "gym") {
      setSelectedWorkoutPlanId("");
      return;
    }

    if (!selectedWorkoutPlanId && workoutPlans.length === 1) {
      selectWorkoutPlan(workoutPlans[0].id);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {log ? <input type="hidden" name="id" value={log.id} /> : null}
      <input type="hidden" name="log_date" value={selectedDate} />
      <input
        type="hidden"
        name="source_type"
        value={category === "gym" && selectedWorkoutPlanId ? "workout_plan" : ""}
      />

      <div className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-slate-400">
        <CalendarDays className="size-4 text-emerald-300" />
        <span className="font-semibold text-white">{formatDisplayDate(selectedDate, locale)}</span>
        <span className="hidden sm:inline">· {text.timeOptional}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.86fr]">
        <div className="space-y-2">
          <Label htmlFor="timeline-title" className="text-white">
            {text.fieldTitle}
          </Label>
          <Input
            id="timeline-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={text.titlePlaceholder}
            className="h-10 rounded-xl border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
            required
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">{text.category}</Label>
              <CategorySelect value={category} onValueChange={handleCategoryChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline-duration" className="text-white">
                {text.duration}
              </Label>
              <Input
                id="timeline-duration"
                name="duration_min"
                type="number"
                min={1}
                max={1440}
                value={durationValue}
                onChange={(event) => setDurationValue(event.target.value)}
                placeholder="60"
                className="h-10 rounded-xl border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {category === "gym" ? (
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="timeline-workout-plan" className="text-white">
                    {text.linkWorkoutPlan}
                  </Label>
                  <p className="mt-1 text-xs text-slate-400">
                    {text.linkWorkoutHint}
                  </p>
                </div>
                <Link
                  href={`/dashboard/workout?date=${selectedDate}`}
                  className="shrink-0 rounded-lg border border-cyan-300/20 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10"
                >
                  {text.openWorkout}
                </Link>
              </div>
              <select
                id="timeline-workout-plan"
                name="source_id"
                value={selectedWorkoutPlanId}
                onChange={(event) => selectWorkoutPlan(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-cyan-300/50"
              >
                <option value="">{text.manualGymBlock}</option>
                {workoutPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              {workoutPlans.length === 0 ? (
                <p className="mt-2 text-xs text-amber-200/90">
                  {text.noWorkoutPlan}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="timeline-note" className="text-white">
              {text.note}
            </Label>
            <Textarea
              id="timeline-note"
              name="note"
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              placeholder={text.notePlaceholder}
              className="min-h-16 rounded-xl border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
              <Clock3 className="size-4 text-emerald-300" />
              {text.timeRange}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <Label htmlFor="timeline-start" className="text-slate-300">
                  {text.start}
                </Label>
                <Input
                  id="timeline-start"
                  name="start_time"
                  type="time"
                  defaultValue={timeInputValue(log?.start_time)}
                  className="h-10 rounded-xl border-white/10 bg-slate-950/70 text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeline-end" className="text-slate-300">
                  {text.end}
                </Label>
                <Input
                  id="timeline-end"
                  name="end_time"
                  type="time"
                  defaultValue={defaultEndTime ?? ""}
                  className="h-10 rounded-xl border-white/10 bg-slate-950/70 text-white [color-scheme:dark]"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {text.timeHint}
            </p>
          </div>

          {!log ? (
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
              <Checkbox
                name="repeat_weekly"
                className="mt-0.5 border-emerald-300/40 bg-white/5 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-slate-950"
              />
              <span>
                <span className="block font-semibold text-white">
                  {text.saveAsPreset}
                </span>
                <span className="text-xs text-slate-400">
                  {text.saveAsPresetHint}
                </span>
              </span>
            </label>
          ) : null}

          {log && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={pending}
              className="h-10 w-full rounded-xl border border-rose-300/20 bg-rose-400/5 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
            >
              <Trash2 className="mr-2 size-4" />
              {text.deleteBlock}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
          >
            {text.cancel}
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-bold text-slate-950 shadow-[0_16px_40px_rgba(34,197,94,0.18)] hover:opacity-95"
        >
          {pending ? text.saving : log ? text.saveChanges : text.addBlock}
        </Button>
      </div>
    </form>
  );
}

function TemplateForm({
  template,
  onSubmit,
  onCancel,
  pending,
}: {
  template?: TimelineTemplateRow | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  pending: boolean;
}) {
  const { text } = useTimelineCopy();

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-white">{text.presetTitle}</Label>
          <Input
            name="title"
            defaultValue={template?.title}
            placeholder={text.presetPlaceholder}
            className="h-11 border-white/10 bg-slate-950/70 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">{text.category}</Label>
          <CategorySelect defaultValue={template?.category} />
        </div>
        <div className="space-y-2">
          <Label className="text-white">{text.startTime}</Label>
          <Input
            name="start_time"
            type="time"
            defaultValue={formatTime(template?.start_time ?? "08:00")}
            className="h-11 border-white/10 bg-slate-950/70 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">{text.duration}</Label>
          <Input
            name="duration_min"
            type="number"
            min={1}
            defaultValue={template?.duration_min ?? 60}
            className="h-11 border-white/10 bg-slate-950/70 text-white"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10 flex-1 border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
          >
            {text.cancel}
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          className="h-10 flex-1 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
        >
          {pending ? text.saving : template ? text.updatePreset : text.createPreset}
        </Button>
      </div>
    </form>
  );
}

export function TimelineClient({
  selectedDate,
  initialLogs,
  initialTemplates,
  initialWorkoutPlans = [],
  generated,
  supabaseReady,
}: TimelineClientProps) {
  const router = useRouter();
  const { locale, text } = useTimelineCopy();
  const [logs, setLogs] = useState(() => sortLogs(initialLogs));
  const [templates, setTemplates] = useState(initialTemplates);
  const [workoutPlans, setWorkoutPlans] = useState(initialWorkoutPlans);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimelineLogRow | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const touchStartRef = useRef<{ id: string; x: number } | null>(null);

  useEffect(() => {
    setLogs(sortLogs(initialLogs));
    setTemplates(initialTemplates);
    setWorkoutPlans(initialWorkoutPlans);
    setError(null);
    setEditingLog(null);
    setEditingTemplateId(null);
    setIsSheetOpen(false);
    touchStartRef.current = null;
  }, [selectedDate, initialLogs, initialTemplates, initialWorkoutPlans]);

  const summary = useMemo(() => {
    const done = logs.filter((log) => log.status === "done").length;
    const skipped = logs.filter((log) => log.status === "skipped").length;
    const pending = logs.filter((log) => log.status === "pending").length;
    const doneMinutes = logs
      .filter((log) => log.status === "done")
      .reduce((total, log) => total + (log.duration_min ?? 0), 0);

    return {
      done,
      skipped,
      pending,
      total: logs.length,
      doneMinutes,
      rate: completionRate(logs),
    };
  }, [logs]);

  const selectedMonthLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00+07:00`);

    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date);
  }, [locale, selectedDate]);
  const todayDate = useMemo(() => getBangkokTodayString(), []);
  const isToday = selectedDate === todayDate;

  function navigateToDate(dateString: string) {
    router.push(`/dashboard/timeline?date=${dateString}`);
  }

  function optimisticStatus(logId: string, status: TaskStatus) {
    if (!supabaseReady) {
      setError(text.connectUpdate);
      return;
    }

    const previousLogs = logs;
    const completedAt = status === "done" ? new Date().toISOString() : null;

    setLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId ? { ...log, status, completed_at: completedAt } : log,
      ),
    );
    setError(null);

    startTransition(() => {
      void (async () => {
        const result = await setTimelineLogStatus(logId, status);

        if (!result.ok) {
          setLogs(previousLogs);
          setError(localizeActionError(result.error, locale));
          return;
        }

        setLogs((currentLogs) =>
          sortLogs(
            currentLogs.map((log) =>
              log.id === logId ? result.data.log : log,
            ),
          ),
        );
      })();
    });
  }

  function handleBlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabaseReady) {
      setError(text.connectSave);
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        if (editingLog) {
          const result = await updateTimelineBlock(formData);

          if (!result.ok) {
            setError(localizeActionError(result.error, locale));
            return;
          }

          setLogs((currentLogs) =>
            sortLogs(
              currentLogs.map((log) =>
                log.id === result.data.log.id ? result.data.log : log,
              ),
            ),
          );
        } else {
          const result = await createTimelineBlock(formData);

          if (!result.ok) {
            setError(localizeActionError(result.error, locale));
            return;
          }

          setLogs((currentLogs) =>
            sortLogs([...currentLogs, result.data.log]),
          );

          if (result.data.template) {
            setTemplates((currentTemplates) =>
              sortTemplates([...currentTemplates, result.data.template!]),
            );
          }
        }

        setError(null);
        setEditingLog(null);
        setIsSheetOpen(false);
        router.refresh();
      })();
    });
  }

  function handleTemplateSubmit(
    event: FormEvent<HTMLFormElement>,
    template?: TimelineTemplateRow | null,
  ) {
    event.preventDefault();

    if (!supabaseReady) {
      setError(text.connectTemplates);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const action = template ? updateTimelineTemplate : createTimelineTemplate;

    startTransition(() => {
      void (async () => {
        const result = await action(formData);

        if (!result.ok) {
          setError(localizeActionError(result.error, locale));
          return;
        }

        setTemplates((currentTemplates) => {
          const nextTemplates = template
            ? currentTemplates.map((item) =>
                item.id === result.data.template.id
                  ? result.data.template
                  : item,
              )
            : [...currentTemplates, result.data.template];

          return [...nextTemplates].sort((first, second) =>
            first.start_time.localeCompare(second.start_time),
          );
        });
        setEditingTemplateId(null);
        setError(null);
        router.refresh();
      })();
    });
  }

  function handleTemplateUse(template: TimelineTemplateRow) {
    if (!supabaseReady) {
      setError(text.connectUseTemplate);
      return;
    }

    setError(null);

    startTransition(() => {
      void (async () => {
        const result = await createTimelineBlockFromTemplate(
          template.id,
          selectedDate,
        );

        if (!result.ok) {
          setError(localizeActionError(result.error, locale));
          return;
        }

        setLogs((currentLogs) =>
          sortLogs([
            ...currentLogs.filter(
              (log) =>
                log.template_id !== template.id || log.status !== "pending",
            ),
            result.data.log,
          ]),
        );

        if (result.data.template) {
          setTemplates((currentTemplates) =>
            currentTemplates.map((item) =>
              item.id === result.data.template?.id
                ? result.data.template
                : item,
            ),
          );
        }

        router.refresh();
      })();
    });
  }

  function handleTemplateDelete(templateId: string) {
    if (!supabaseReady) {
      setError(text.connectDeleteTemplate);
      return;
    }

    const previousTemplates = templates;
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId),
    );

    startTransition(() => {
      void (async () => {
        const result = await deleteTimelineTemplate(templateId);

        if (!result.ok) {
          setTemplates(previousTemplates);
          setError(localizeActionError(result.error, locale));
        }
      })();
    });
  }

  function handleBlockDelete(log: TimelineLogRow) {
    if (!supabaseReady) {
      setError(text.connectDelete);
      return;
    }

    if (
      !window.confirm(
        `${text.deleteConfirm}\n${localizeGeneratedTaskDescription(log.title, locale)}`,
      )
    ) {
      return;
    }

    const previousLogs = logs;

    setLogs((currentLogs) => currentLogs.filter((item) => item.id !== log.id));
    setError(null);

    if (editingLog?.id === log.id) {
      setEditingLog(null);
      setIsSheetOpen(false);
    }

    startTransition(() => {
      void (async () => {
        const result = await deleteTimelineBlock(log.id);

        if (!result.ok) {
          setLogs(previousLogs);
          setError(localizeActionError(result.error, locale));
        }
      })();
    });
  }

  function openAddSheet() {
    setEditingLog(null);
    setIsSheetOpen(true);
  }

  function openEditSheet(log: TimelineLogRow) {
    setEditingLog(log);
    setIsSheetOpen(true);
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-3 overflow-hidden pb-20 sm:space-y-4 lg:pb-0">
      <header className="flex flex-col gap-2.5 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid sm:size-11">
            <CalendarDays className="size-4 sm:size-5" />
          </div>
          <div>
            <h1 className="text-[1.7rem] font-black leading-none tracking-tight text-white sm:text-3xl">
              {text.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {text.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center xl:justify-end">
          <div className="flex h-10 min-w-0 items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 sm:h-11">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigateToDate(shiftDate(selectedDate, -1))}
              className="h-10 w-10 shrink-0 rounded-none px-0 text-slate-300 hover:bg-white/[0.06] hover:text-white sm:h-11 sm:w-11"
              aria-label={text.previousDay}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <label className="flex min-w-0 flex-1 items-center gap-2 border-x border-white/10 px-2 text-sm text-slate-200 sm:px-3">
              <CalendarDays className="size-4 text-slate-400" />
              <span className="hidden font-medium sm:inline">
                {formatDisplayDate(selectedDate, locale)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => navigateToDate(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] sm:w-[138px] sm:flex-none"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigateToDate(shiftDate(selectedDate, 1))}
              className="h-10 w-10 shrink-0 rounded-none px-0 text-slate-300 hover:bg-white/[0.06] hover:text-white sm:h-11 sm:w-11"
              aria-label={text.nextDay}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigateToDate(todayDate)}
            disabled={isToday}
            className={cn(
              "h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white sm:h-11 sm:px-4",
              isToday &&
                "border-emerald-300/20 bg-emerald-400/10 text-emerald-300 opacity-100",
            )}
          >
            <span className="hidden min-[420px]:inline">{text.today}</span>
            <span className="min-[420px]:hidden">{text.now}</span>
          </Button>
        </div>
      </header>

      {generated ? (
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {text.generated}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <Panel className="overflow-hidden border-emerald-300/30">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_34%),linear-gradient(135deg,rgba(34,197,94,0.12),rgba(15,23,42,0.1))] p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
              {text.dailyOverview}
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              {formatDisplayDate(selectedDate, locale)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: text.blocks,
              value: String(summary.total),
              icon: CheckCircle2,
              caption: `${summary.done} ${text.doneCaption}`,
            },
            {
              label: text.pending,
              value: String(summary.pending),
              icon: Clock3,
              caption: text.waiting,
            },
            {
              label: text.skipped,
              value: String(summary.skipped),
              icon: SkipForward,
              caption: text.skippedCaption,
            },
            {
              label: text.focus,
              value: focusTimeLabel(summary.doneMinutes),
              icon: Focus,
              caption: text.doneDuration,
            },
            {
              label: text.rate,
              value: `${summary.rate}%`,
              icon: Flame,
              caption: summary.rate >= 80 ? text.great : text.keepGoing,
            },
            {
              label: text.date,
              value: selectedDate.slice(5),
              icon: CalendarDays,
              caption: selectedMonthLabel,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 sm:size-8">
                    <Icon className="size-4" />
                  </span>
                  <p className="truncate text-xs font-medium text-slate-400">
                    {item.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-black text-white sm:text-2xl">
                  {item.value}
                </p>
                {item.label === text.rate ? (
                  <ProgressBar value={summary.rate} />
                ) : null}
                <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
                  {item.caption}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      <section className="grid min-w-0 items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="min-w-0 overflow-hidden p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-2 sm:gap-3">
            <h2 className="font-bold text-white">{text.dayTimeline}</h2>
            <div className="flex flex-wrap justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white sm:px-4 sm:text-sm"
                  >
                    <Settings2 className="mr-2 size-4" />
                    <span className="hidden min-[380px]:inline">{text.presets}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[86vh] overflow-y-auto border-white/10 bg-slate-950 text-white sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">{text.managePresets}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {text.presetsDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <TemplateForm
                      pending={isPending}
                      onSubmit={(event) => handleTemplateSubmit(event)}
                    />

                    <div className="space-y-3">
                      {templates.length === 0 ? (
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                          {text.noTemplates}
                        </p>
                      ) : null}

                      {templates.map((template) => {
                        const meta = categoryMeta[template.category];
                        const Icon = meta.icon;
                        const isEditing = editingTemplateId === template.id;

                        return (
                          <div
                            key={template.id}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "grid size-10 place-items-center rounded-lg",
                                    meta.bg,
                                    meta.text,
                                  )}
                                >
                                  <Icon className="size-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-white">{template.title}</p>
                                  <p className="text-xs text-slate-400">
                                    {formatTime(template.start_time, text.anytime)} •{" "}
                                    {durationLabel(template.duration_min, locale, text.flexible)} •{" "}
                                    {text.presetOnly}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleTemplateUse(template)}
                                  disabled={isPending}
                                  className="h-9 border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15 hover:text-emerald-200"
                                >
                                  <Plus className="mr-1 size-4" />
                                  {text.use}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditingTemplateId(isEditing ? null : template.id)
                                  }
                                  className="h-9 border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                                >
                                  {text.edit}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleTemplateDelete(template.id)}
                                  className="h-9 border border-rose-300/20 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                                >
                                  {text.delete}
                                </Button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="mt-4">
                                <TemplateForm
                                  template={template}
                                  pending={isPending}
                                  onCancel={() => setEditingTemplateId(null)}
                                  onSubmit={(event) =>
                                    handleTemplateSubmit(event, template)
                                  }
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isSheetOpen}
                onOpenChange={(open) => {
                  setIsSheetOpen(open);
                  if (!open) {
                    setEditingLog(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    onClick={openAddSheet}
                    className="h-9 rounded-full bg-emerald-400/15 px-4 text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Plus className="mr-2 size-4" />
                    {text.addTask}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[88vh] w-[calc(100vw-1.5rem)] overflow-hidden rounded-[1.5rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.16),transparent_36%),linear-gradient(180deg,#081321_0%,#030711_62%,#02040a_100%)] p-0 text-white shadow-[0_28px_110px_rgba(0,0,0,0.72),0_0_80px_rgba(34,197,94,0.18)] sm:max-w-3xl">
                  <DialogHeader className="relative overflow-hidden border-b border-white/10 bg-white/[0.045] px-4 py-4 text-left backdrop-blur md:px-5">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,#22d3ee,#22c55e,transparent)]" />
                    <div className="flex items-center gap-3 pr-10">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_28px_rgba(34,197,94,0.18)]">
                        {editingLog ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-lg font-black tracking-tight text-white md:text-xl">
                          {editingLog ? text.editBlock : text.addBlock}
                        </DialogTitle>
                        <DialogDescription className="mt-1 max-w-md text-sm leading-5 text-slate-400">
                          {text.blockDescription}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="max-h-[calc(88vh-88px)] overflow-y-auto px-4 py-4 md:px-5">
                    <TimelineBlockForm
                      selectedDate={selectedDate}
                      workoutPlans={workoutPlans}
                      log={editingLog}
                      pending={isPending}
                      onCancel={() => {
                        setEditingLog(null);
                        setIsSheetOpen(false);
                      }}
                      onDelete={
                        editingLog ? () => handleBlockDelete(editingLog) : undefined
                      }
                      onSubmit={handleBlockSubmit}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative min-w-0 space-y-2 before:absolute before:left-[9px] before:top-4 before:h-[calc(100%-32px)] before:w-px before:bg-emerald-300/25 sm:before:left-[11px]">
            {logs.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <CalendarDays className="mx-auto size-8 text-slate-500" />
                <h3 className="mt-3 font-bold text-white">{text.noBlocks}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                  {text.noBlocksHint}
                </p>
                <Button
                  type="button"
                  onClick={openAddSheet}
                  className="mt-4 h-9 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                >
                  <Plus className="mr-2 size-4" />
                  {text.addFirstBlock}
                </Button>
              </div>
            ) : null}

            {logs.map((log) => {
              const meta = categoryMeta[log.category];
              const Icon = meta.icon;
              const completedAt = formatCompletedAt(log.completed_at, locale);
              const isDone = log.status === "done";
              const isSkipped = log.status === "skipped";
              const localizedTitle = localizeGeneratedTaskDescription(log.title, locale);
              const localizedNote = localizeGeneratedTimelineNote(log.note, locale);

              return (
                <div
                  key={log.id}
                  className={cn(
                    "group relative grid min-w-0 grid-cols-[58px_minmax(0,1fr)] gap-2 rounded-xl border border-transparent p-1 transition-colors sm:p-1.5 lg:grid-cols-[88px_minmax(0,1fr)_auto]",
                    "hover:border-white/10 hover:bg-white/[0.03]",
                    isSkipped && "opacity-55",
                  )}
                  onTouchStart={(event) => {
                    touchStartRef.current = {
                      id: log.id,
                      x: event.touches[0].clientX,
                    };
                  }}
                  onTouchEnd={(event) => {
                    const start = touchStartRef.current;
                    if (!start || start.id !== log.id) {
                      return;
                    }

                    const delta = event.changedTouches[0].clientX - start.x;
                    if (delta > 72) {
                      optimisticStatus(log.id, "done");
                    } else if (delta < -72) {
                      optimisticStatus(log.id, "skipped");
                    }
                    touchStartRef.current = null;
                  }}
                >
                  <div className="flex min-w-0 items-start gap-1.5 sm:gap-2">
                    <span
                      className={cn(
                        "mt-4 size-2.5 rounded-full border border-slate-950 shadow-[0_0_16px_currentColor]",
                        isDone ? "bg-emerald-400 text-emerald-400" : "bg-slate-950 text-slate-500",
                        isSkipped && "bg-slate-700 text-slate-700",
                      )}
                    />
                    <span className="mt-2.5 min-w-0 text-[11px] leading-5 tabular-nums text-slate-400 sm:text-xs">
                      <span className="block font-semibold text-slate-200">
                        {log.start_time ? formatTime(log.start_time, text.anytime) : text.anytime}
                      </span>
                      {log.start_time && log.duration_min ? (
                        <span>→ {addMinutesToTime(log.start_time, log.duration_min)}</span>
                      ) : null}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-2 rounded-xl border bg-slate-950/60 p-2 sm:grid-cols-[38px_minmax(0,1fr)] sm:gap-2.5 sm:p-2.5",
                      meta.border,
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-8 place-items-center rounded-lg shadow-[0_0_24px_rgba(52,211,153,0.12)] sm:size-9",
                        meta.bg,
                        meta.text,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-white lg:truncate lg:text-base",
                            isDone && "text-slate-400 line-through",
                          )}
                        >
                          {localizedTitle}
                        </p>
                        <span
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] font-semibold",
                            meta.border,
                            meta.bg,
                            meta.text,
                          )}
                        >
                          {text.categories[log.category]}
                        </span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400">
                          {durationLabel(log.duration_min, locale, text.flexible)}
                        </span>
                        <span className="rounded-md border border-cyan-300/15 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-200 sm:hidden">
                          {timeRangeLabel(log, text.anytime)}
                        </span>
                        {log.category === "gym" ? (
                          <Link
                            href={`/dashboard/workout?date=${selectedDate}`}
                            className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-400/15"
                          >
                            {text.linkedWorkout}
                          </Link>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400 sm:text-sm lg:line-clamp-1">
                        {localizedNote || statusLabel(log.status, text)}
                        {completedAt ? ` • ${text.completedAt} ${completedAt}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-start gap-1.5 sm:gap-2 lg:col-start-auto lg:flex-nowrap lg:justify-end">
                    {log.category === "gym" ? (
                      <Button
                        asChild
                        variant="ghost"
                        className="h-8 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 text-cyan-200 hover:bg-cyan-400/15 hover:text-cyan-100"
                      >
                        <Link
                          href={`/dashboard/workout?date=${selectedDate}`}
                          aria-label={`${text.openWorkoutFor} ${localizedTitle}`}
                        >
                          <Dumbbell className="size-4 min-[420px]:mr-1" />
                          <span className="hidden min-[420px]:inline">
                            {text.workout}
                          </span>
                        </Link>
                      </Button>
                    ) : null}
                    {log.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => optimisticStatus(log.id, "done")}
                          aria-label={`${text.markDone}: ${localizedTitle}`}
                          className="h-8 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2.5 text-emerald-300 hover:bg-emerald-400/15 hover:text-emerald-200"
                        >
                          <Check className="size-4 min-[420px]:mr-1" />
                          <span className="hidden min-[420px]:inline">{text.done}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => optimisticStatus(log.id, "skipped")}
                          aria-label={`${text.skipTask}: ${localizedTitle}`}
                          className="h-8 rounded-lg border border-white/10 px-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        >
                          <SkipForward className="size-4 min-[420px]:mr-1" />
                          <span className="hidden min-[420px]:inline">{text.skipped}</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => optimisticStatus(log.id, "pending")}
                        aria-label={`${text.undoTask}: ${localizedTitle}`}
                        className="h-8 rounded-lg border border-white/10 px-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <RotateCcw className="size-4 min-[420px]:mr-1" />
                        <span className="hidden min-[420px]:inline">{text.undo}</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openEditSheet(log)}
                      className="h-8 rounded-lg border border-white/10 px-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      aria-label={`${text.editTask}: ${localizedTitle}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleBlockDelete(log)}
                      disabled={isPending}
                      className="h-8 rounded-lg border border-rose-300/20 px-2.5 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                      aria-label={`${text.deleteTask}: ${localizedTitle}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <MoreVertical className="hidden size-4 text-slate-600 sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="min-w-0 space-y-3">
          <Panel className="hidden min-w-0 overflow-hidden p-4 xl:block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">{selectedMonthLabel}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateToDate(shiftDate(selectedDate, -30))}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => navigateToDate(shiftDate(selectedDate, 30))}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
              {text.weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
              {monthMatrix(selectedDate).map((day) => (
                <button
                  key={day.key}
                  onClick={() => navigateToDate(day.key)}
                  className={cn(
                    "relative grid size-8 place-items-center rounded-full text-sm transition-colors",
                    !day.inMonth && "text-slate-700",
                    day.inMonth && "text-slate-300 hover:bg-white/[0.06]",
                    day.selected &&
                      "bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.35)]",
                  )}
                >
                  {day.day}
                  {day.inMonth && !day.selected && day.day % 3 === 0 ? (
                    <span className="absolute bottom-1 size-1 rounded-full bg-emerald-400" />
                  ) : null}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="min-w-0 overflow-hidden p-3 sm:p-4">
            <h2 className="mb-4 font-bold text-white">{text.taskSummary}</h2>
            <div className="flex items-center gap-4">
              <div
                className="grid size-28 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#22c55e 0 ${summary.rate}%, #38bdf8 ${summary.rate}% ${
                    summary.rate + summary.skipped * 8
                  }%, rgba(255,255,255,0.1) ${summary.rate + summary.skipped * 8}% 100%)`,
                }}
              >
                <div className="grid size-20 place-items-center rounded-full bg-slate-950 text-center">
                  <div>
                    <p className="text-2xl font-black text-white">{summary.total}</p>
                    <p className="text-xs text-slate-400">{text.totalTasks}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                {[
                  [text.completed, summary.done, "bg-emerald-400"],
                  [text.skipped, summary.skipped, "bg-sky-400"],
                  [text.pending, summary.pending, "bg-slate-400"],
                ].map(([label, value, color]) => (
                  <div key={label as string} className="flex items-center gap-2 text-slate-300">
                    <span className={cn("size-2 rounded-full", color as string)} />
                    <span className="font-semibold text-white">{value}</span>
                    {label}
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3">
                  <p className="text-2xl font-black text-emerald-300">
                    {summary.rate}%
                  </p>
                  <p className="text-xs text-slate-400">{text.completionRate}</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="min-w-0 overflow-hidden p-3 sm:p-4">
            <h2 className="mb-4 font-bold text-white">{text.focusBlocks}</h2>
            <div className="space-y-2">
              {logs
                .filter((log) => ["work", "study", "gym"].includes(log.category))
                .slice(0, 4)
                .map((log) => {
                  const meta = categoryMeta[log.category];
                  const Icon = meta.icon;

                  return (
                    <div
                      key={`focus-${log.id}`}
                      className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:gap-3 sm:p-2.5"
                    >
                      <div className={cn("grid size-8 place-items-center rounded-lg sm:size-9", meta.bg, meta.text)}>
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 break-words text-xs font-bold leading-5 text-white sm:truncate sm:text-sm">
                          {localizeGeneratedTaskDescription(log.title, locale)}
                        </p>
                        <p className="truncate text-[11px] text-slate-400 sm:text-xs">
                          {formatTime(log.start_time, text.anytime)} • {statusLabel(log.status, text)}
                          <span className="sm:hidden"> • {durationLabel(log.duration_min, locale, text.flexible)}</span>
                        </p>
                      </div>

                      <p className={cn("hidden shrink-0 text-sm font-bold sm:block", meta.text)}>
                        {durationLabel(log.duration_min, locale, text.flexible)}
                      </p>
                    </div>
                  );
                })}

              {logs.filter((log) => ["work", "study", "gym"].includes(log.category))
                .length === 0 ? (
                <p className="text-sm text-slate-400">{text.noFocusBlocks}</p>
              ) : null}
            </div>
            <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
              <span className="text-slate-400">{text.totalFocusTime}</span>
              <span className="shrink-0 font-black text-emerald-300">
                {focusTimeLabel(summary.doneMinutes)}
              </span>
            </div>
          </Panel>
        </div>
      </section>

      <button
        type="button"
        onClick={openAddSheet}
        className="fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#22c55e)] text-slate-950 shadow-[0_18px_45px_rgba(34,197,94,0.35)] lg:hidden"
        aria-label={text.addBlock}
      >
        <Plus className="size-6" />
      </button>

      <Link
        href={`/dashboard/timeline?date=${shiftDate(selectedDate, -1)}`}
        className="sr-only"
      >
        <ArrowLeft /> {text.previousDay}
      </Link>
      <Link
        href={`/dashboard/timeline?date=${shiftDate(selectedDate, 1)}`}
        className="sr-only"
      >
        <ArrowRight /> {text.nextDay}
      </Link>
    </div>
  );
}
