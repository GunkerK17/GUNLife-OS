"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ChangeEventHandler, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Dumbbell,
  ExternalLink,
  Flame,
  HeartPulse,
  ImageIcon,
  LoaderCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  addWorkoutLogPhoto,
  createWorkoutExercise,
  createWorkoutLog,
  createWorkoutPlan,
  deleteWorkoutExercise,
  deleteWorkoutLog,
  deleteWorkoutPlan,
  updateWorkoutExercise,
  updateWorkoutPlan,
  type ActionResult,
} from "@/app/(dashboard)/dashboard/workout/actions";
import { localizeActionError } from "@/lib/localize-action-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useI18n } from "@/components/providers/i18n-provider";
import type { Locale } from "@/lib/i18n";
import type { WorkoutPlanWithExercises } from "@/lib/queries/workout";
import type {
  WorkoutExerciseRow,
  WorkoutLogRow,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { isTimelineWorkoutLog } from "@/lib/workout-timeline";

type WorkoutClientProps = {
  selectedDate: string;
  initialPlans: WorkoutPlanWithExercises[];
  initialLogs: WorkoutLogRow[];
  initialWeekLogs: WorkoutLogRow[];
  initialMonthLogs: WorkoutLogRow[];
  supabaseReady: boolean;
};

type WorkoutAction<T> = (formData: FormData) => Promise<ActionResult<T>>;
type PhotoScope = "week" | "month";

type ExerciseCatalogItem = {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  instruction: string;
};

type ExerciseCatalogResponse = {
  items: ExerciseCatalogItem[];
  total: number;
  catalogTotal: number;
  bodyParts: string[];
  equipments: string[];
  error?: string;
};

const workoutCopy = {
  en: {
    activePlan: "Active plan",
    activePlanHint: "Active plans can appear in Timeline on their workout day.",
    addBodyPhoto: "Add body check / workout photo",
    addExercise: "Add exercise",
    addExerciseDesc: "Add one movement with sets, reps, kg and rest.",
    allBodyParts: "All body parts",
    allEquipment: "All equipment",
    addPhoto: "Add workout photo",
    avg: "avg",
    avgHr: "Avg HR",
    burnedToday: "burned today",
    calories: "Calories",
    completeWorkout: "Complete workout",
    completed: "Completed",
    completing: "Completing...",
    createPlan: "Create plan",
    createPlanDesc: "Pick a workout day and build your exercise list.",
    createWorkoutPlan: "Create workout plan",
    day: "day",
    deleteExerciseConfirm: "Delete this exercise?",
    deletePlan: "Delete plan",
    deletePlanConfirm: "Delete this workout plan and its exercises?",
    demoMode: "Demo mode: add Supabase env to save workout plans and logs.",
    description: "Description",
    descriptionPlaceholder: "Chest, shoulders and triceps with clean reps.",
    donePhotoCalories: "Done + photo/calo",
    duration: "Duration",
    editExercise: "Edit exercise",
    editExerciseDesc: "Tune sets, reps, weight and rest for this movement.",
    editPlan: "Edit plan",
    editPlanDesc: "Update schedule or deactivate this workout plan.",
    estimatedPlan: "estimated plan",
    exercise: "Exercise",
    exercisePlaceholder: "Bench Press",
    exerciseAdded: "Exercise added.",
    exerciseBoard: "Exercise board",
    exerciseBoardHint: "Sets, reps, weight and rest — the numbers that matter.",
    exerciseDeleted: "Exercise deleted.",
    exercises: "exercises",
    exerciseUpdated: "Exercise updated.",
    exerciseLibrary: "Exercise library",
    exerciseLibraryHint: "Search 1,324 movements by name, muscle or equipment.",
    free: "free",
    freeWorkout: "Free workout",
    fullBody: "Full body",
    catalogLoading: "Loading exercise library...",
    catalogResults: "matches",
    catalogUnavailable: "Library unavailable. You can still enter the exercise manually.",
    dataSource: "Metadata: exercises-dataset (MIT)",
    equipment: "Equipment",
    instructionHint: "Paste a YouTube, TikTok or Instagram link to open while training.",
    instructionVideo: "Instruction video",
    intensity: "Intensity",
    kg: "Kg",
    logDeleted: "Workout log deleted.",
    loggedToday: "logged today",
    logWorkout: "Log workout",
    logWorkoutDesc: "Mark the workout done, save calories and attach a photo.",
    max: "max",
    maxHr: "Max HR",
    manualEntry: "Manual details",
    minuteSession: "min session",
    month: "Month",
    muscleGroup: "Muscle group",
    newPlan: "New plan",
    noActivePlan: "No active plan for this day. Pick a plan or create one.",
    noDay: "No day",
    noExercises: "No exercises yet",
    noExercisesHint: "Add your first movement to make this plan useful.",
    noPlan: "No workout plan yet",
    noPhotos: "No workout photos",
    noPhotosHint: "Log a workout and upload a photo; it will appear here.",
    notLogged: "Not logged yet",
    notLoggedHint: "Finish the workout, then log duration and calories here.",
    notLoggedYet: "not logged yet",
    note: "Session note",
    notePlaceholder: "What felt strong? What should improve next?",
    photoAdded: "Workout photo added.",
    photoHistory: "Photo history",
    photoHistoryHint: "Photos stay in Workout and can be filtered by week or month.",
    planCreated: "Workout plan created.",
    planDeleted: "Workout plan deleted.",
    planHint: "Create a plan, add exercises, then log your session after training.",
    planName: "Plan name",
    planPlaceholder: "Upper Body Strength",
    plannedReps: "planned reps",
    plannedSets: "Planned sets",
    planUpdated: "Workout plan updated.",
    progression: "Progression",
    recovery: "Recovery",
    reps: "Reps",
    rest: "rest",
    restSeconds: "Rest seconds",
    savePhoto: "Upload",
    saving: "Saving...",
    searchExercises: "Search exercises...",
    selectedFromCatalog: "Selected from catalog",
    scheduledToday: "Scheduled today",
    sessionLogs: "Session logs",
    sets: "Sets",
    sleep: "sleep",
    subtitle: "Plan gym, track sets/reps/kg and log every session.",
    timePerWeek: "/week",
    today: "Today",
    todayPlan: "Today plan",
    todayTag: "today",
    targetMuscle: "Target",
    trainingFocus: "Training focus",
    updateExercise: "Update exercise",
    updatePlan: "Update plan",
    uploadFormats: "JPG, PNG, WEBP or GIF · max 5MB.",
    volume: "Volume",
    watchVideo: "Watch video",
    week: "Week",
    workout: "Workout",
    workoutDay: "Workout day",
    workoutLogged: "Workout logged and marked done.",
    workoutPhoto: "Workout photo",
    workoutPhotos: "Workout photos",
  },
  vi: {
    activePlan: "Giáo án đang hoạt động",
    activePlanHint: "Giáo án đang hoạt động có thể xuất hiện trong Lịch ngày vào đúng ngày tập.",
    addBodyPhoto: "Thêm ảnh body / ảnh tập luyện",
    addExercise: "Thêm bài tập",
    addExerciseDesc: "Thêm một động tác với số hiệp, số lần, mức tạ và thời gian nghỉ.",
    allBodyParts: "Tất cả vùng cơ thể",
    allEquipment: "Tất cả dụng cụ",
    addPhoto: "Thêm ảnh tập luyện",
    avg: "trung bình",
    avgHr: "Nhịp tim TB",
    burnedToday: "đã đốt hôm nay",
    calories: "Calo",
    completeWorkout: "Hoàn thành buổi tập",
    completed: "Đã hoàn thành",
    completing: "Đang hoàn thành...",
    createPlan: "Tạo giáo án",
    createPlanDesc: "Chọn ngày tập và xây dựng danh sách bài tập.",
    createWorkoutPlan: "Tạo giáo án tập luyện",
    day: "ngày",
    deleteExerciseConfirm: "Xóa bài tập này?",
    deletePlan: "Xóa giáo án",
    deletePlanConfirm: "Xóa giáo án này cùng toàn bộ bài tập bên trong?",
    demoMode: "Chế độ demo: thêm Supabase env để lưu giáo án và nhật ký tập.",
    description: "Mô tả",
    descriptionPlaceholder: "Ngực, vai và tay sau với kỹ thuật chuẩn.",
    donePhotoCalories: "Tập xong + ảnh/calo",
    duration: "Thời lượng",
    editExercise: "Sửa bài tập",
    editExerciseDesc: "Điều chỉnh số hiệp, số lần, mức tạ và thời gian nghỉ.",
    editPlan: "Sửa giáo án",
    editPlanDesc: "Cập nhật lịch hoặc tạm ngưng giáo án này.",
    estimatedPlan: "ước tính theo giáo án",
    exercise: "Bài tập",
    exercisePlaceholder: "Đẩy ngực ghế ngang",
    exerciseAdded: "Đã thêm bài tập.",
    exerciseBoard: "Danh sách bài tập",
    exerciseBoardHint: "Hiệp, lần, mức tạ và thời gian nghỉ — những chỉ số quan trọng.",
    exerciseDeleted: "Đã xóa bài tập.",
    exercises: "bài tập",
    exerciseUpdated: "Đã cập nhật bài tập.",
    exerciseLibrary: "Thư viện bài tập",
    exerciseLibraryHint: "Tìm trong 1.324 động tác theo tên, nhóm cơ hoặc dụng cụ.",
    free: "tự do",
    freeWorkout: "Buổi tập tự do",
    fullBody: "Toàn thân",
    catalogLoading: "Đang tải thư viện bài tập...",
    catalogResults: "kết quả",
    catalogUnavailable: "Tạm thời không tải được thư viện. Bạn vẫn có thể nhập bài tập thủ công.",
    dataSource: "Dữ liệu: exercises-dataset (MIT)",
    equipment: "Dụng cụ",
    instructionHint: "Dán link YouTube, TikTok hoặc Instagram để mở khi tập.",
    instructionVideo: "Video hướng dẫn",
    intensity: "Cường độ",
    kg: "Kg",
    logDeleted: "Đã xóa nhật ký tập.",
    loggedToday: "đã ghi hôm nay",
    logWorkout: "Ghi nhận buổi tập",
    logWorkoutDesc: "Đánh dấu đã tập xong, lưu calo và đính kèm ảnh.",
    max: "tối đa",
    maxHr: "Nhịp tim tối đa",
    manualEntry: "Thông số thủ công",
    minuteSession: "phút tập",
    month: "Tháng",
    muscleGroup: "Nhóm cơ",
    newPlan: "Giáo án mới",
    noActivePlan: "Ngày này chưa có giáo án hoạt động. Chọn hoặc tạo một giáo án.",
    noDay: "Chưa chọn ngày",
    noExercises: "Chưa có bài tập",
    noExercisesHint: "Thêm động tác đầu tiên để bắt đầu xây dựng giáo án.",
    noPlan: "Chưa có giáo án tập",
    noPhotos: "Chưa có ảnh tập luyện",
    noPhotosHint: "Ghi nhận buổi tập và tải ảnh lên; ảnh sẽ xuất hiện tại đây.",
    notLogged: "Chưa ghi nhận",
    notLoggedHint: "Tập xong rồi ghi thời lượng và calo tại đây.",
    notLoggedYet: "chưa ghi nhận",
    note: "Ghi chú buổi tập",
    notePlaceholder: "Hôm nay điểm nào tốt? Lần sau cần cải thiện gì?",
    photoAdded: "Đã thêm ảnh tập luyện.",
    photoHistory: "Lịch sử ảnh",
    photoHistoryHint: "Ảnh được lưu trong Tập luyện và lọc theo tuần hoặc tháng.",
    planCreated: "Đã tạo giáo án tập luyện.",
    planDeleted: "Đã xóa giáo án tập luyện.",
    planHint: "Tạo giáo án, thêm bài tập rồi ghi nhận kết quả sau khi tập.",
    planName: "Tên giáo án",
    planPlaceholder: "Sức mạnh thân trên",
    plannedReps: "lần lặp dự kiến",
    plannedSets: "Số hiệp dự kiến",
    planUpdated: "Đã cập nhật giáo án.",
    progression: "Tăng tiến",
    recovery: "Phục hồi",
    reps: "Số lần",
    rest: "nghỉ",
    restSeconds: "Thời gian nghỉ (giây)",
    savePhoto: "Tải lên",
    saving: "Đang lưu...",
    searchExercises: "Tìm bài tập...",
    selectedFromCatalog: "Đã chọn từ thư viện",
    scheduledToday: "Lịch tập hôm nay",
    sessionLogs: "Nhật ký buổi tập",
    sets: "Số hiệp",
    sleep: "ngủ",
    subtitle: "Lên giáo án, theo dõi hiệp/lần/kg và ghi lại từng buổi tập.",
    timePerWeek: "/tuần",
    today: "Hôm nay",
    todayPlan: "Giáo án hôm nay",
    todayTag: "hôm nay",
    targetMuscle: "Cơ mục tiêu",
    trainingFocus: "Trọng tâm tập luyện",
    updateExercise: "Cập nhật bài tập",
    updatePlan: "Cập nhật giáo án",
    uploadFormats: "JPG, PNG, WEBP hoặc GIF · tối đa 5MB.",
    volume: "Tổng tải",
    watchVideo: "Xem video",
    week: "Tuần",
    workout: "Tập luyện",
    workoutDay: "Ngày tập",
    workoutLogged: "Đã ghi nhận và hoàn thành buổi tập.",
    workoutPhoto: "Ảnh tập luyện",
    workoutPhotos: "Ảnh tập luyện",
  },
} as const;

type WorkoutCopy = (typeof workoutCopy)[Locale];

function useWorkoutCopy() {
  const { locale } = useI18n();

  return { locale, text: workoutCopy[locale] };
}

const dayOptions = [
  { value: "0", short: "Sun", label: "Sunday" },
  { value: "1", short: "Mon", label: "Monday" },
  { value: "2", short: "Tue", label: "Tuesday" },
  { value: "3", short: "Wed", label: "Wednesday" },
  { value: "4", short: "Thu", label: "Thursday" },
  { value: "5", short: "Fri", label: "Friday" },
  { value: "6", short: "Sat", label: "Saturday" },
];

const dayNamesVi: Record<string, { short: string; label: string }> = {
  "0": { short: "CN", label: "Chủ nhật" },
  "1": { short: "T2", label: "Thứ hai" },
  "2": { short: "T3", label: "Thứ ba" },
  "3": { short: "T4", label: "Thứ tư" },
  "4": { short: "T5", label: "Thứ năm" },
  "5": { short: "T6", label: "Thứ sáu" },
  "6": { short: "T7", label: "Thứ bảy" },
};

const muscleOptions = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Core",
  "Full body",
  "Conditioning",
];

const muscleNamesVi: Record<string, string> = {
  Back: "Lưng",
  Biceps: "Tay trước",
  Chest: "Ngực",
  Conditioning: "Thể lực",
  Core: "Cơ lõi",
  "Full body": "Toàn thân",
  Glutes: "Mông",
  Legs: "Chân",
  Shoulders: "Vai",
  Triceps: "Tay sau",
};

function catalogMuscleOption(exercise: ExerciseCatalogItem) {
  const searchValue = [
    exercise.bodyPart,
    exercise.target,
    exercise.muscleGroup,
    ...exercise.secondaryMuscles,
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");

  if (searchValue.includes("chest") || searchValue.includes("pectoral")) {
    return "Chest";
  }

  if (
    searchValue.includes("back") ||
    searchValue.includes("lat") ||
    searchValue.includes("rhomboid")
  ) {
    return "Back";
  }

  if (searchValue.includes("shoulder") || searchValue.includes("delt")) {
    return "Shoulders";
  }

  if (searchValue.includes("biceps")) {
    return "Biceps";
  }

  if (searchValue.includes("triceps")) {
    return "Triceps";
  }

  if (searchValue.includes("glute")) {
    return "Glutes";
  }

  if (
    searchValue.includes("waist") ||
    searchValue.includes("abs") ||
    searchValue.includes("core") ||
    searchValue.includes("oblique")
  ) {
    return "Core";
  }

  if (searchValue.includes("cardio")) {
    return "Conditioning";
  }

  if (
    searchValue.includes("leg") ||
    searchValue.includes("quad") ||
    searchValue.includes("hamstring") ||
    searchValue.includes("calf") ||
    searchValue.includes("calves")
  ) {
    return "Legs";
  }

  return "Full body";
}

function titleCaseExerciseLabel(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("en-US") + word.slice(1))
    .join(" ");
}

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

function getWeekday(dateString: string) {
  return new Date(`${dateString}T00:00:00+07:00`).getDay();
}

function planMatchesDay(plan: WorkoutPlanWithExercises, weekday: number) {
  return plan.day_of_week
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .includes(String(weekday));
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

function dayLabel(value: string, locale: Locale, text: WorkoutCopy) {
  const parts = value
    .split(/[,\s]+/)
    .map((part) =>
      locale === "vi"
        ? dayNamesVi[part]?.short
        : dayOptions.find((day) => day.value === part)?.short,
    )
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : text.noDay;
}

function formatWeight(value: number | null, locale: Locale) {
  if (value == null) {
    return locale === "vi" ? "trọng lượng cơ thể" : "body";
  }

  return `${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}kg`;
}

function formatRest(value: number | null, locale: Locale, text: WorkoutCopy) {
  if (!value) {
    return text.free;
  }

  if (value < 60) {
    return locale === "vi" ? `${value} giây` : `${value}s`;
  }

  const minute = Math.floor(value / 60);
  const second = value % 60;

  if (locale === "vi") {
    return second ? `${minute} phút ${second} giây` : `${minute} phút`;
  }

  return second ? `${minute}m ${second}s` : `${minute}m`;
}

function isHttpUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function plannedVolume(exercises: WorkoutExerciseRow[]) {
  return exercises.reduce((total, exercise) => {
    const sets = exercise.sets ?? 0;
    const reps = exercise.reps ?? 0;
    const weight = exercise.weight_kg ?? 0;

    return total + sets * reps * weight;
  }, 0);
}

function plannedSets(exercises: WorkoutExerciseRow[]) {
  return exercises.reduce((total, exercise) => total + (exercise.sets ?? 0), 0);
}

function plannedReps(exercises: WorkoutExerciseRow[]) {
  return exercises.reduce(
    (total, exercise) => total + (exercise.sets ?? 0) * (exercise.reps ?? 0),
    0,
  );
}

function metricText(value: number, locale: Locale) {
  return value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: 0,
  });
}

function createWorkoutPath(date: string) {
  return `/dashboard/workout?date=${date}`;
}

function photoLogs(logs: WorkoutLogRow[]) {
  return logs
    .filter((log) => Boolean(log.image_url))
    .sort((first, second) => {
      if (first.log_date !== second.log_date) {
        return second.log_date.localeCompare(first.log_date);
      }

      return second.created_at.localeCompare(first.created_at);
    });
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent = "emerald",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "emerald" | "cyan" | "amber" | "violet";
}) {
  const accentClass = {
    amber: "text-amber-300 bg-amber-400/10 border-amber-300/20",
    cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-300/20",
    emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-300/20",
    violet: "text-violet-300 bg-violet-400/10 border-violet-300/20",
  }[accent];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg border sm:size-8",
            accentClass,
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

function WorkoutPhotoHistoryPanel({
  monthLogs,
  onSelectDate,
  scope,
  selectedDate,
  setScope,
  weekLogs,
}: {
  monthLogs: WorkoutLogRow[];
  onSelectDate: (date: string) => void;
  scope: PhotoScope;
  selectedDate: string;
  setScope: (scope: PhotoScope) => void;
  weekLogs: WorkoutLogRow[];
}) {
  const { locale, text } = useWorkoutCopy();
  const photos = photoLogs(scope === "week" ? weekLogs : monthLogs);

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            {text.photoHistory}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            {text.workoutPhotos}
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
                scope === option && "bg-cyan-400/15 text-cyan-200",
              )}
            >
              {option === "week" ? text.week : text.month}
            </button>
          ))}
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => onSelectDate(log.log_date)}
              className={cn(
                "group min-w-0 overflow-hidden rounded-xl border bg-white/[0.035] text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40",
                log.log_date === selectedDate
                  ? "border-cyan-300/50 shadow-[0_0_26px_rgba(34,211,238,0.14)]"
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
                <span className="block text-xs font-black text-white">
                  {formatDisplayDate(log.log_date, locale)}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                  {log.duration_min ?? 0}{locale === "vi" ? " phút" : "m"} · {log.calories_burned ?? 0} kcal
                </span>
              </span>
            </button>
          ))}
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

function NativeSelect({
  name,
  defaultValue,
  value,
  onChange,
  children,
}: {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={onChange}
      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15"
    >
      {children}
    </select>
  );
}

function PlanForm({
  plan,
  onSubmit,
  pending,
}: {
  plan?: WorkoutPlanWithExercises;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useWorkoutCopy();
  const [active, setActive] = useState(plan?.is_active ?? true);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      <input type="hidden" name="is_active" value={active ? "on" : ""} />

      <div className="grid gap-2">
        <FieldLabel>{text.planName}</FieldLabel>
        <Input
          name="name"
          defaultValue={plan?.name ?? ""}
          placeholder={text.planPlaceholder}
          className="h-11 border-white/10 bg-slate-950/70 text-white"
          required
        />
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.workoutDay}</FieldLabel>
        <NativeSelect
          name="day_of_week"
          defaultValue={plan?.day_of_week.split(",")[0] ?? "1"}
        >
          {dayOptions.map((day) => (
            <option key={day.value} value={day.value}>
              {locale === "vi" ? dayNamesVi[day.value]?.label : day.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.description}</FieldLabel>
        <Textarea
          name="description"
          defaultValue={plan?.description ?? ""}
          placeholder={text.descriptionPlaceholder}
          className="min-h-20 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <Checkbox
          checked={active}
          onCheckedChange={(checked) => setActive(checked === true)}
          className="border-emerald-300/40 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-slate-950"
        />
        <span>
          <span className="block text-sm font-bold text-white">
            {text.activePlan}
          </span>
          <span className="text-xs text-slate-400">
            {text.activePlanHint}
          </span>
        </span>
      </label>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? text.saving : plan ? text.updatePlan : text.createPlan}
      </Button>
    </form>
  );
}

function ExerciseForm({
  exercise,
  planId,
  nextOrder,
  onSubmit,
  pending,
}: {
  exercise?: WorkoutExerciseRow;
  planId: string;
  nextOrder: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useWorkoutCopy();
  const [exerciseName, setExerciseName] = useState(
    exercise?.exercise_name ?? "",
  );
  const [muscleGroup, setMuscleGroup] = useState(
    exercise?.muscle_group ?? "Chest",
  );
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogBodyPart, setCatalogBodyPart] = useState("");
  const [catalogEquipment, setCatalogEquipment] = useState("");
  const [catalog, setCatalog] = useState<ExerciseCatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(!exercise);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<ExerciseCatalogItem | null>(null);

  useEffect(() => {
    if (exercise) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true);
      setCatalogError(null);

      try {
        const parameters = new URLSearchParams({ limit: "18" });

        if (catalogQuery.trim()) {
          parameters.set("q", catalogQuery.trim());
        }

        if (catalogBodyPart) {
          parameters.set("bodyPart", catalogBodyPart);
        }

        if (catalogEquipment) {
          parameters.set("equipment", catalogEquipment);
        }

        const response = await fetch(`/api/exercises?${parameters.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ExerciseCatalogResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Exercise catalog request failed.");
        }

        setCatalog(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCatalogError(
          error instanceof Error ? error.message : "Exercise catalog request failed.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCatalogLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [catalogBodyPart, catalogEquipment, catalogQuery, exercise]);

  function selectCatalogExercise(item: ExerciseCatalogItem) {
    setSelectedCatalogItem(item);
    setExerciseName(titleCaseExerciseLabel(item.name));
    setMuscleGroup(catalogMuscleOption(item));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}
      <input type="hidden" name="plan_id" value={planId} />
      <input
        type="hidden"
        name="order_index"
        value={exercise?.order_index ?? nextOrder}
      />

      {!exercise ? (
        <section className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.035]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                <Database className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">
                  {text.exerciseLibrary}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                  {text.exerciseLibraryHint}
                </span>
              </span>
            </div>
            <Badge className="w-fit shrink-0 border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              {catalog?.catalogTotal?.toLocaleString(locale === "vi" ? "vi-VN" : "en-US") ?? "1,324"}
            </Badge>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder={text.searchExercises}
                className="h-11 border-white/10 bg-slate-950/75 pl-9 text-white"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <NativeSelect
                name="catalog_body_part"
                value={catalogBodyPart}
                onChange={(event) => setCatalogBodyPart(event.target.value)}
              >
                <option value="">{text.allBodyParts}</option>
                {(catalog?.bodyParts ?? []).map((bodyPart) => (
                  <option key={bodyPart} value={bodyPart}>
                    {titleCaseExerciseLabel(bodyPart)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                name="catalog_equipment"
                value={catalogEquipment}
                onChange={(event) => setCatalogEquipment(event.target.value)}
              >
                <option value="">{text.allEquipment}</option>
                {(catalog?.equipments ?? []).map((equipment) => (
                  <option key={equipment} value={equipment}>
                    {titleCaseExerciseLabel(equipment)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {catalogLoading ? (
              <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 text-sm font-semibold text-slate-400">
                <LoaderCircle className="size-4 animate-spin text-cyan-300" />
                {text.catalogLoading}
              </div>
            ) : catalogError ? (
              <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
                {text.catalogUnavailable}
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span>
                    {(catalog?.total ?? 0).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {text.catalogResults}
                  </span>
                  {selectedCatalogItem ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Check className="size-3.5" />
                      {text.selectedFromCatalog}
                    </span>
                  ) : null}
                </div>
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:rgba(34,211,238,0.35)_transparent]">
                  {(catalog?.items ?? []).map((item) => {
                    const selected = selectedCatalogItem?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectCatalogExercise(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                          selected
                            ? "border-emerald-300/45 bg-emerald-400/10"
                            : "border-white/[0.07] bg-slate-950/45 hover:border-cyan-300/25 hover:bg-white/[0.045]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-lg border",
                            selected
                              ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-200"
                              : "border-cyan-300/15 bg-cyan-400/[0.08] text-cyan-200",
                          )}
                        >
                          {selected ? <Check className="size-4" /> : <Dumbbell className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-white">
                            {titleCaseExerciseLabel(item.name)}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {[item.target, item.bodyPart, item.equipment]
                              .filter(Boolean)
                              .map(titleCaseExerciseLabel)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <a
              href="https://github.com/hasaneyldrm/exercises-dataset"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-cyan-200"
            >
              {text.dataSource}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </section>
      ) : null}

      <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        {text.manualEntry}
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.exercise}</FieldLabel>
        <Input
          name="exercise_name"
          value={exerciseName}
          onChange={(event) => {
            setExerciseName(event.target.value);

            if (selectedCatalogItem?.name !== event.target.value) {
              setSelectedCatalogItem(null);
            }
          }}
          placeholder={text.exercisePlaceholder}
          className="h-11 border-white/10 bg-slate-950/70 text-white"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel>{text.muscleGroup}</FieldLabel>
          <NativeSelect
            name="muscle_group"
            value={muscleGroup}
            onChange={(event) => setMuscleGroup(event.target.value)}
          >
            {muscleOptions.map((muscle) => (
              <option key={muscle} value={muscle}>
                {locale === "vi" ? muscleNamesVi[muscle] ?? muscle : muscle}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.restSeconds}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="rest_sec"
            defaultValue={exercise?.rest_sec ?? 90}
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      {selectedCatalogItem ? (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/[0.055] p-3">
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className="text-slate-500">{text.targetMuscle}</span>
              <p className="mt-0.5 font-bold text-emerald-100">
                {titleCaseExerciseLabel(selectedCatalogItem.target || selectedCatalogItem.muscleGroup)}
              </p>
            </div>
            <div>
              <span className="text-slate-500">{text.equipment}</span>
              <p className="mt-0.5 font-bold text-emerald-100">
                {titleCaseExerciseLabel(selectedCatalogItem.equipment || "None")}
              </p>
            </div>
          </div>
          {selectedCatalogItem.instruction ? (
            <details className="mt-3 border-t border-white/10 pt-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-cyan-200">
                <BookOpen className="size-4" />
                {locale === "vi" ? "Hướng dẫn tiếng Anh" : "English instructions"}
              </summary>
              <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-400">
                {selectedCatalogItem.instruction}
              </p>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <FieldLabel>{text.sets}</FieldLabel>
          <Input
            type="number"
            min="1"
            name="sets"
            defaultValue={exercise?.sets ?? 3}
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.reps}</FieldLabel>
          <Input
            type="number"
            min="1"
            name="reps"
            defaultValue={exercise?.reps ?? 10}
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.kg}</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.5"
            name="weight_kg"
            defaultValue={exercise?.weight_kg ?? ""}
            placeholder="0"
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.instructionVideo}</FieldLabel>
        <Input
          name="note"
          type="text"
          inputMode="url"
          defaultValue={exercise?.note ?? ""}
          placeholder="https://youtube.com/watch?v=..."
          className="h-11 border-white/10 bg-slate-950/70 text-white"
        />
        <p className="text-xs text-slate-500">
          {text.instructionHint}
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? text.saving : exercise ? text.updateExercise : text.addExercise}
      </Button>
    </form>
  );
}

function LogForm({
  selectedDate,
  plan,
  plannedDuration,
  onSubmit,
  pending,
}: {
  selectedDate: string;
  plan: WorkoutPlanWithExercises | null;
  plannedDuration: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useWorkoutCopy();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="log_date" value={selectedDate} />
      {plan ? <input type="hidden" name="plan_id" value={plan.id} /> : null}

      <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3">
        <p className="text-sm font-black text-white">
          {plan?.name ?? text.freeWorkout}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {formatDisplayDate(selectedDate, locale)} · {plan?.exercises.length ?? 0}{" "}
          {text.exercises}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <FieldLabel>{text.duration}</FieldLabel>
          <Input
            type="number"
            min="1"
            name="duration_min"
            defaultValue={plannedDuration || 60}
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.calories}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="calories_burned"
            placeholder="320"
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <FieldLabel>{text.avgHr}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="avg_heart_rate"
            placeholder="132"
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.maxHr}</FieldLabel>
          <Input
            type="number"
            min="0"
            name="max_heart_rate"
            placeholder="166"
            className="h-10 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.note}</FieldLabel>
        <Textarea
          name="note"
          placeholder={text.notePlaceholder}
          className="min-h-24 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.workoutPhoto}</FieldLabel>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-300/25 bg-cyan-400/5 p-3 transition hover:border-cyan-300/45 hover:bg-cyan-400/10">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <ImageIcon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">
              {text.addBodyPhoto}
            </span>
            <span className="block text-xs text-slate-400">
              {text.uploadFormats}
            </span>
          </span>
          <Input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="max-w-[150px] border-white/10 bg-slate-950/70 text-xs text-slate-300 file:text-slate-200"
          />
        </label>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? text.completing : text.completeWorkout}
      </Button>
    </form>
  );
}

function ExerciseRow({
  exercise,
  planId,
  nextOrder,
  pending,
  onUpdate,
  onDelete,
}: {
  exercise: WorkoutExerciseRow;
  planId: string;
  nextOrder: number;
  pending: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (exerciseId: string) => void;
}) {
  const { locale, text } = useWorkoutCopy();
  const [open, setOpen] = useState(false);

  return (
    <div className="group grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-300/25 hover:bg-white/[0.055] sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
          <Dumbbell className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{exercise.exercise_name}</p>
            {exercise.muscle_group ? (
              <Badge className="border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                {locale === "vi"
                  ? muscleNamesVi[exercise.muscle_group] ?? exercise.muscle_group
                  : exercise.muscle_group}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {exercise.sets ?? 0} {text.sets.toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US")} × {exercise.reps ?? 0} {text.reps.toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US")} ·{" "}
            {formatWeight(exercise.weight_kg, locale)} · {text.rest}{" "}
            {formatRest(exercise.rest_sec, locale, text)}
          </p>
          {isHttpUrl(exercise.note) ? (
            <a
              href={exercise.note!}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/15 hover:text-cyan-100"
            >
              <PlayCircle className="size-3.5" />
              {text.watchVideo}
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
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
                {text.editExercise}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {text.editExerciseDesc}
              </DialogDescription>
            </DialogHeader>
            <ExerciseForm
              exercise={exercise}
              planId={planId}
              nextOrder={nextOrder}
              pending={pending}
              onSubmit={(event) => {
                onUpdate(event);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={pending}
          onClick={() => onDelete(exercise.id)}
          className="border-rose-300/20"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function WorkoutClient({
  selectedDate,
  initialPlans,
  initialLogs,
  initialWeekLogs,
  initialMonthLogs,
  supabaseReady,
}: WorkoutClientProps) {
  const router = useRouter();
  const { locale, text } = useWorkoutCopy();
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState(initialPlans);
  const [logs, setLogs] = useState(initialLogs);
  const [weekLogs, setWeekLogs] = useState(initialWeekLogs);
  const [monthLogs, setMonthLogs] = useState(initialMonthLogs);
  const [photoScope, setPhotoScope] = useState<PhotoScope>("month");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekday = getWeekday(selectedDate);
  const today = getBangkokTodayString();
  const isToday = selectedDate === today;

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setLogs(initialLogs);
    setWeekLogs(initialWeekLogs);
    setMonthLogs(initialMonthLogs);
  }, [initialLogs, initialMonthLogs, initialWeekLogs]);

  useEffect(() => {
    const matchingPlan = initialPlans.find(
      (plan) => plan.is_active && planMatchesDay(plan, weekday),
    );

    setSelectedPlanId((currentPlanId) => {
      if (
        currentPlanId &&
        initialPlans.some((plan) => plan.id === currentPlanId)
      ) {
        return currentPlanId;
      }

      return matchingPlan?.id ?? initialPlans[0]?.id ?? "";
    });
  }, [initialPlans, weekday]);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.is_active),
    [plans],
  );
  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ??
      activePlans[0] ??
      plans[0] ??
      null,
    [activePlans, plans, selectedPlanId],
  );
  const todaysPlans = useMemo(
    () => activePlans.filter((plan) => planMatchesDay(plan, weekday)),
    [activePlans, weekday],
  );
  const exercises = selectedPlan?.exercises ?? [];
  const totalSets = plannedSets(exercises);
  const totalReps = plannedReps(exercises);
  const totalVolume = plannedVolume(exercises);
  const estimatedDuration = Math.max(30, totalSets * 4 + exercises.length * 5);
  const loggedDuration = logs.reduce(
    (total, log) => total + (log.duration_min ?? 0),
    0,
  );
  const loggedCalories = logs.reduce(
    (total, log) => total + (log.calories_burned ?? 0),
    0,
  );

  const runFormAction = <T,>(
    event: FormEvent<HTMLFormElement>,
    action: WorkoutAction<T>,
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

      setMessage(successMessage);
      close?.();
      router.refresh();
    });
  };

  const runDelete = (
    action: (id: string) => Promise<ActionResult<{ id: string }>>,
    id: string,
    successMessage: string,
  ) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await action(id);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      setMessage(successMessage);
      router.refresh();
    });
  };

  const goToDate = (date: string) => {
    router.push(createWorkoutPath(date));
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-3 overflow-hidden pb-20 sm:space-y-4 lg:pb-0">
      <div className="flex flex-col gap-2.5 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid sm:size-11">
            <Dumbbell className="size-4 sm:size-5" />
          </div>
          <div>
            <h1 className="text-[1.7rem] font-black leading-none tracking-tight text-white sm:text-3xl">
              {text.workout}
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
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
            <RotateCcw className="size-4 min-[420px]:mr-2" />
            <span className="hidden min-[420px]:inline">{text.today}</span>
          </Button>
        </div>
      </div>

      {!supabaseReady ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demoMode}
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
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <MetricCard
              icon={<Dumbbell className="size-4" />}
              label={text.plannedSets}
              value={metricText(totalSets, locale)}
              sub={`${metricText(totalReps, locale)} ${text.plannedReps}`}
            />
            <MetricCard
              icon={<BarChart3 className="size-4" />}
              label={text.volume}
              value={`${metricText(totalVolume, locale)}kg`}
              sub="sets × reps × kg"
              accent="cyan"
            />
            <MetricCard
              icon={<Clock3 className="size-4" />}
              label={text.duration}
              value={
                logs.length
                  ? `${loggedDuration}${locale === "vi" ? " phút" : "m"}`
                  : `${estimatedDuration}${locale === "vi" ? " phút" : "m"}`
              }
              sub={logs.length ? text.loggedToday : text.estimatedPlan}
              accent="violet"
            />
            <MetricCard
              icon={<Flame className="size-4" />}
              label={text.calories}
              value={metricText(loggedCalories, locale)}
              sub={logs.length ? text.burnedToday : text.notLoggedYet}
              accent="amber"
            />
          </div>

          <Panel className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.todayPlan}
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {selectedPlan?.name ?? text.noPlan}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-400">
                  {selectedPlan?.description ?? text.planHint}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-emerald-300/20 bg-emerald-400/10 font-bold text-emerald-200 hover:bg-emerald-400/15"
                    >
                      <Plus className="mr-2 size-4" />
                      {text.newPlan}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">
                        {text.createWorkoutPlan}
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {text.createPlanDesc}
                      </DialogDescription>
                    </DialogHeader>
                    <PlanForm
                      pending={isPending}
                      onSubmit={(event) =>
                        runFormAction(
                          event,
                          createWorkoutPlan,
                          text.planCreated,
                          () => setPlanDialogOpen(false),
                        )
                      }
                    />
                  </DialogContent>
                </Dialog>

                {selectedPlan ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-white/10 bg-white/[0.04] font-bold text-slate-200 hover:bg-white/[0.07]"
                      >
                        <Pencil className="mr-2 size-4" />
                        {text.editPlan}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[92vh] overflow-y-auto border-cyan-300/20 bg-[#07111d] text-white sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                          {text.editPlan}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                          {text.editPlanDesc}
                        </DialogDescription>
                      </DialogHeader>
                      <PlanForm
                        plan={selectedPlan}
                        pending={isPending}
                        onSubmit={(event) =>
                          runFormAction(
                            event,
                            updateWorkoutPlan,
                            text.planUpdated,
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              text.deletePlanConfirm,
                            )
                          ) {
                            runDelete(
                              deleteWorkoutPlan,
                              selectedPlan.id,
                              text.planDeleted,
                            );
                          }
                        }}
                        className="h-10 w-full border-rose-300/20"
                      >
                        <Trash2 className="mr-2 size-4" />
                        {text.deletePlan}
                      </Button>
                    </DialogContent>
                  </Dialog>
                ) : null}

                <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={!selectedPlan}
                      className="col-span-2 h-10 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90 sm:col-span-1"
                    >
                      <Check className="mr-2 size-4" />
                      {text.donePhotoCalories}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">
                        {text.logWorkout}
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        {text.logWorkoutDesc}
                      </DialogDescription>
                    </DialogHeader>
                    <LogForm
                      selectedDate={selectedDate}
                      plan={selectedPlan}
                      plannedDuration={estimatedDuration}
                      pending={isPending}
                      onSubmit={(event) =>
                        runFormAction(
                          event,
                          createWorkoutLog,
                          text.workoutLogged,
                          () => setLogDialogOpen(false),
                        )
                      }
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isScheduledToday = planMatchesDay(plan, weekday);

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition sm:p-3",
                      isSelected
                        ? "border-emerald-300/45 bg-emerald-400/12 shadow-[0_0_28px_rgba(34,197,94,0.12)]"
                        : "border-white/10 bg-white/[0.035] hover:border-cyan-300/25",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-black text-white">
                        {plan.name}
                      </p>
                      {isScheduledToday ? (
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-200">
                          {text.todayTag}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {dayLabel(plan.day_of_week, locale, text)} · {plan.exercises.length}{" "}
                      {text.exercises}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  {text.exerciseBoard}
                </h2>
                <p className="text-sm text-slate-400">
                  {text.exerciseBoardHint}
                </p>
              </div>

              <Dialog
                open={exerciseDialogOpen}
                onOpenChange={setExerciseDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    disabled={!selectedPlan}
                    className="h-10 rounded-xl bg-emerald-400/15 font-bold text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Plus className="mr-2 size-4" />
                    {text.addExercise}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] overflow-y-auto border-cyan-300/20 bg-[#07111d] text-white sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                      {text.addExercise}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {text.addExerciseDesc}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedPlan ? (
                    <ExerciseForm
                      planId={selectedPlan.id}
                      nextOrder={exercises.length}
                      pending={isPending}
                      onSubmit={(event) =>
                        runFormAction(
                          event,
                          createWorkoutExercise,
                          text.exerciseAdded,
                          () => setExerciseDialogOpen(false),
                        )
                      }
                    />
                  ) : null}
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-2">
              {exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    planId={selectedPlan?.id ?? ""}
                    nextOrder={exercises.length}
                    pending={isPending}
                    onUpdate={(event) =>
                      runFormAction(
                        event,
                        updateWorkoutExercise,
                        text.exerciseUpdated,
                      )
                    }
                    onDelete={(exerciseId) => {
                      if (window.confirm(text.deleteExerciseConfirm)) {
                        runDelete(
                          deleteWorkoutExercise,
                          exerciseId,
                          text.exerciseDeleted,
                        );
                      }
                    }}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
                  <Sparkles className="mx-auto size-8 text-emerald-300" />
                  <p className="mt-3 font-black text-white">{text.noExercises}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {text.noExercisesHint}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <WorkoutPhotoHistoryPanel
            selectedDate={selectedDate}
            weekLogs={weekLogs}
            monthLogs={monthLogs}
            scope={photoScope}
            setScope={setPhotoScope}
            onSelectDate={goToDate}
          />

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{text.scheduledToday}</h2>
              <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                {locale === "vi"
                  ? dayNamesVi[String(weekday)]?.short
                  : dayOptions[weekday]?.short}
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              {todaysPlans.length > 0 ? (
                todaysPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-emerald-300/25"
                  >
                    <p className="font-black text-white">{plan.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {plan.exercises.length} {text.exercises} ·{" "}
                      {plannedSets(plan.exercises)} {text.sets.toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US")}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-400">
                  {text.noActivePlan}
                </p>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <h2 className="text-lg font-black text-white">{text.sessionLogs}</h2>
            <div className="mt-3 space-y-2">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          {text.completed} · {log.duration_min ?? 0} {text.minuteSession}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {log.calories_burned ?? 0} kcal · {text.avg}{" "}
                          {log.avg_heart_rate ?? "-"} bpm · {text.max}{" "}
                          {log.max_heart_rate ?? "-"} bpm
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        disabled={isPending}
                        onClick={() =>
                          runDelete(
                            deleteWorkoutLog,
                            log.id,
                            text.logDeleted,
                          )
                        }
                        className="border-rose-300/20"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    {log.note && !isTimelineWorkoutLog(log.note) ? (
                      <p className="mt-2 text-sm leading-5 text-slate-300">
                        {log.note}
                      </p>
                    ) : null}
                    {log.image_url ? (
                      <Image
                        src={log.image_url}
                        alt={text.workoutPhoto}
                        width={640}
                        height={360}
                        unoptimized
                        className="mt-3 h-32 w-full rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <form
                        onSubmit={(event) =>
                          runFormAction(
                            event,
                            addWorkoutLogPhoto,
                            text.photoAdded,
                          )
                        }
                        encType="multipart/form-data"
                        className="mt-3 rounded-xl border border-dashed border-cyan-300/25 bg-cyan-400/5 p-3"
                      >
                        <input type="hidden" name="log_id" value={log.id} />
                        <p className="text-xs font-bold text-slate-300">
                          {text.addPhoto}
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <Input
                            type="file"
                            name="image"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="h-9 border-white/10 bg-slate-950/70 text-xs text-slate-300 file:text-slate-200"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isPending}
                            className="bg-cyan-400/15 font-bold text-cyan-100 hover:bg-cyan-400/25"
                          >
                            {text.savePhoto}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <ShieldCheck className="size-7 text-slate-500" />
                  <p className="mt-2 text-sm font-bold text-white">
                    {text.notLogged}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {text.notLoggedHint}
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <h2 className="text-lg font-black text-white">{text.trainingFocus}</h2>
            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Trophy className="size-4 text-amber-300" />
                  {text.progression}
                </span>
                <span className="text-sm font-black text-white">
                  +2.5kg{text.timePerWeek}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <HeartPulse className="size-4 text-rose-300" />
                  {text.recovery}
                </span>
                <span className="text-sm font-black text-white">7h {text.sleep}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Activity className="size-4 text-cyan-300" />
                  {text.intensity}
                </span>
                <span className="text-sm font-black text-white">RPE 7-8</span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
