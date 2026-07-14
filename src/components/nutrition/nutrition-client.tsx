"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Flame,
  ImageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Utensils,
  Zap,
} from "lucide-react";
import {
  createNutritionLog,
  deleteNutritionLog,
  removeNutritionPhoto,
  updateNutritionLog,
  type ActionResult,
} from "@/app/(dashboard)/dashboard/nutrition/actions";
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
  MealType,
  NutritionLogRow,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type NutritionClientProps = {
  selectedDate: string;
  initialLogs: NutritionLogRow[];
  initialWeekLogs: NutritionLogRow[];
  initialMonthLogs: NutritionLogRow[];
  supabaseReady: boolean;
};

type NutritionFormAction = (
  formData: FormData,
) => Promise<ActionResult<{ log: NutritionLogRow }>>;
type Accent = "emerald" | "cyan" | "amber" | "violet" | "rose";
type PhotoScope = "week" | "month";

const nutritionCopy = {
  en: {
    title: "Nutrition",
    subtitle: "Track meals, calories, macros, and food photos by day.",
    today: "Today",
    demo: "Demo mode: add Supabase env to save nutrition logs.",
    calories: "Calories",
    meals: "Meals",
    loggedToday: "logged today",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    goal: "goal",
    of: "of",
    macroBalance: "Macro balance",
    dailySplit: "Daily nutrition split",
    splitHint: "Calories are tracked directly; the macro split estimates energy from protein, carbs, and fat.",
    proteinKcal: "Protein kcal",
    carbKcal: "Carb kcal",
    fatKcal: "Fat kcal",
    chart: "Nutrition chart",
    chartTitle: "Calories + macros",
    activeDays: "active days",
    best: "best",
    photoHistory: "Photo history",
    foodPhotos: "Food photos",
    photoHint: "Food photos stay in Nutrition and can be filtered by the week or month being viewed.",
    week: "Week",
    month: "Month",
    noFoodPhotos: "No food photos",
    noFoodPhotosHint: "Log a meal and upload a photo to see it here.",
    meal: "Meal",
    date: "Date",
    foodName: "Food name",
    foodPlaceholder: "Chicken rice, Greek yogurt...",
    quantity: "Quantity",
    unit: "Unit",
    unitPlaceholder: "plate, bowl, gram...",
    uploadPhoto: "Upload food photo",
    uploadPhotoHint: "Upload from your device: JPG, PNG, WEBP or GIF up to 5 MB.",
    note: "Note",
    notePlaceholder: "How did this meal feel?",
    saving: "Saving...",
    saveMeal: "Save meal",
    logMeal: "Log meal",
    openPhoto: "Open food photo",
    noPhoto: "No photo yet",
    editMeal: "Edit meal",
    editMealHint: "Update calories, macros, notes, or replace the photo.",
    removePhoto: "Remove photo",
    noMealLogged: "No meal logged",
    weeklySummary: "Weekly summary",
    dailyMeals: "Daily meals",
    dailyMealsHint: "Log meals for this date. Photos stay inside their own day.",
    logMealHint: "Save calories, macros, quantity, notes, and a food photo.",
    dailyAnalysis: "Daily analysis",
    kcalLeft: "kcal left",
    noMealYet: "No meal logged yet",
    goalHint: "Current daily target",
    deleteConfirm: "Delete this meal log?",
    removePhotoConfirm: "Remove this food photo?",
    deleted: "Meal deleted.",
    photoRemoved: "Food photo removed.",
    logged: "Meal logged.",
    updated: "Meal updated.",
    mealTypes: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snack: "Snack",
    },
    mealHints: {
      breakfast: "first meal",
      lunch: "midday fuel",
      dinner: "evening meal",
      snack: "quick bite",
    },
  },
  vi: {
    title: "Dinh dưỡng",
    subtitle: "Theo dõi bữa ăn, calo, macro và ảnh món ăn theo từng ngày.",
    today: "Hôm nay",
    demo: "Chế độ demo: thêm Supabase env để lưu nhật ký dinh dưỡng.",
    calories: "Calo",
    meals: "Bữa ăn",
    loggedToday: "đã ghi hôm nay",
    protein: "Đạm",
    carbs: "Tinh bột",
    fat: "Chất béo",
    goal: "mục tiêu",
    of: "trên",
    macroBalance: "Cân bằng macro",
    dailySplit: "Phân bổ dinh dưỡng trong ngày",
    splitHint: "Calo được ghi trực tiếp; tỷ lệ macro ước tính năng lượng từ đạm, tinh bột và chất béo.",
    proteinKcal: "Calo từ đạm",
    carbKcal: "Calo từ tinh bột",
    fatKcal: "Calo từ chất béo",
    chart: "Biểu đồ dinh dưỡng",
    chartTitle: "Calo và macro",
    activeDays: "ngày có dữ liệu",
    best: "cao nhất",
    photoHistory: "Lịch sử ảnh",
    foodPhotos: "Ảnh món ăn",
    photoHint: "Ảnh món ăn được lưu trong Dinh dưỡng và lọc theo tuần hoặc tháng đang xem.",
    week: "Tuần",
    month: "Tháng",
    noFoodPhotos: "Chưa có ảnh món ăn",
    noFoodPhotosHint: "Ghi một bữa ăn và tải ảnh lên để xem tại đây.",
    meal: "Bữa ăn",
    date: "Ngày",
    foodName: "Tên món",
    foodPlaceholder: "Cơm gà, sữa chua Hy Lạp...",
    quantity: "Số lượng",
    unit: "Đơn vị",
    unitPlaceholder: "đĩa, tô, gram...",
    uploadPhoto: "Tải ảnh món ăn",
    uploadPhotoHint: "Tải từ thiết bị: JPG, PNG, WEBP hoặc GIF tối đa 5 MB.",
    note: "Ghi chú",
    notePlaceholder: "Cảm nhận sau bữa ăn này...",
    saving: "Đang lưu...",
    saveMeal: "Lưu bữa ăn",
    logMeal: "Ghi bữa ăn",
    openPhoto: "Mở ảnh món ăn",
    noPhoto: "Chưa có ảnh",
    editMeal: "Sửa bữa ăn",
    editMealHint: "Cập nhật calo, macro, ghi chú hoặc thay ảnh.",
    removePhoto: "Xóa ảnh",
    noMealLogged: "Chưa ghi bữa ăn",
    weeklySummary: "Tổng kết tuần",
    dailyMeals: "Bữa ăn trong ngày",
    dailyMealsHint: "Ghi bữa ăn cho ngày này. Ảnh luôn nằm đúng ngày đã ghi.",
    logMealHint: "Lưu calo, macro, số lượng, ghi chú và ảnh món ăn.",
    dailyAnalysis: "Phân tích trong ngày",
    kcalLeft: "kcal còn lại",
    noMealYet: "Hôm nay chưa ghi bữa ăn",
    goalHint: "Mục tiêu mỗi ngày hiện tại",
    deleteConfirm: "Xóa bữa ăn này?",
    removePhotoConfirm: "Xóa ảnh món ăn này?",
    deleted: "Đã xóa bữa ăn.",
    photoRemoved: "Đã xóa ảnh món ăn.",
    logged: "Đã ghi bữa ăn.",
    updated: "Đã cập nhật bữa ăn.",
    mealTypes: {
      breakfast: "Bữa sáng",
      lunch: "Bữa trưa",
      dinner: "Bữa tối",
      snack: "Ăn nhẹ",
    },
    mealHints: {
      breakfast: "bữa đầu ngày",
      lunch: "năng lượng giữa ngày",
      dinner: "bữa cuối ngày",
      snack: "bữa ăn nhanh",
    },
  },
} as const;

function useNutritionCopy() {
  const { locale } = useI18n();

  return { locale, text: nutritionCopy[locale] };
}

const accentClasses: Record<Accent, string> = {
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  rose: "border-rose-300/20 bg-rose-400/10 text-rose-300",
  violet: "border-violet-300/20 bg-violet-400/10 text-violet-300",
};

const mealMeta: Record<
  MealType,
  { icon: ReactNode; accent: Accent }
> = {
  breakfast: {
    icon: <Coffee className="size-4" />,
    accent: "amber",
  },
  lunch: {
    icon: <Utensils className="size-4" />,
    accent: "emerald",
  },
  dinner: {
    icon: <Utensils className="size-4" />,
    accent: "cyan",
  },
  snack: {
    icon: <Zap className="size-4" />,
    accent: "violet",
  },
};

const mealOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const calorieGoal = 2200;
const proteinGoal = 140;
const carbsGoal = 250;
const fatGoal = 70;

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
        "min-w-0 max-w-full rounded-xl border border-white/10 bg-slate-950/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
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

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return toDateString(date);
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    year: "numeric",
  }).format(date);
}

function createNutritionPath(date: string) {
  return `/dashboard/nutrition?date=${date}`;
}

function metricSum(
  logs: NutritionLogRow[],
  key: keyof Pick<
    NutritionLogRow,
    "calories" | "protein_g" | "carbs_g" | "fat_g"
  >,
) {
  return logs.reduce((total, log) => total + (Number(log[key]) || 0), 0);
}

function metricText(value: number, suffix = "", locale: Locale = "en") {
  return `${value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  })}${suffix}`;
}

function macroCalories(logs: NutritionLogRow[]) {
  return {
    protein: metricSum(logs, "protein_g") * 4,
    carbs: metricSum(logs, "carbs_g") * 4,
    fat: metricSum(logs, "fat_g") * 9,
  };
}

function progressPercent(value: number, goal: number) {
  return Math.min(100, Math.round((value / Math.max(1, goal)) * 100));
}

function upsertLog(logs: NutritionLogRow[], nextLog: NutritionLogRow) {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [nextLog, ...logs];
  }

  return logs.map((log, index) => (index === existingIndex ? nextLog : log));
}

function weekDays(selectedDate: string, locale: Locale) {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  const weekday = selected.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = new Date(selected);
  start.setDate(selected.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      key: toDateString(date),
      label: new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { weekday: "short" }).format(
        date,
      ),
    };
  });
}

function monthDays(selectedDate: string) {
  const [year, month] = selectedDate.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);

    return {
      key: toDateString(date),
      day: index + 1,
    };
  });
}

function nutritionPhotoLogs(logs: NutritionLogRow[]) {
  return logs
    .filter((log) => Boolean(log.image_url))
    .sort((first, second) => {
      if (first.log_date !== second.log_date) {
        return second.log_date.localeCompare(first.log_date);
      }

      return second.created_at.localeCompare(first.created_at);
    });
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <Label className="text-xs font-black text-slate-200">{children}</Label>;
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
            "grid size-8 place-items-center rounded-lg border",
            accentClasses[accent],
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function MacroProgress({
  accent,
  goal,
  label,
  value,
}: {
  accent: Accent;
  goal: number;
  label: string;
  value: number;
}) {
  const percent = progressPercent(value, goal);
  const colorClass = {
    amber: "bg-amber-300",
    cyan: "bg-cyan-300",
    emerald: "bg-emerald-300",
    rose: "bg-rose-300",
    violet: "bg-violet-300",
  }[accent];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-xs font-bold text-slate-400">
          {metricText(value, "g")} / {goal}g
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={cn("h-full rounded-full", colorClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function MealTypeSelect({ defaultValue }: { defaultValue?: MealType }) {
  const { text } = useNutritionCopy();

  return (
    <select
      name="meal_type"
      defaultValue={defaultValue ?? "breakfast"}
      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-emerald-300/50"
    >
      {mealOrder.map((meal) => (
        <option key={meal} value={meal}>
          {text.mealTypes[meal]}
        </option>
      ))}
    </select>
  );
}

function NutritionForm({
  log,
  onSubmit,
  pending,
  selectedDate,
}: {
  log?: NutritionLogRow;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { locale, text } = useNutritionCopy();

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="space-y-4">
      {log ? <input type="hidden" name="id" value={log.id} /> : null}
      <input type="hidden" name="log_date" value={log?.log_date ?? selectedDate} />
      <input type="hidden" name="image_url" value={log?.image_url ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel>{text.meal}</FieldLabel>
          <MealTypeSelect defaultValue={log?.meal_type} />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.date}</FieldLabel>
          <Input
            name="display_date"
            value={formatDisplayDate(log?.log_date ?? selectedDate, locale)}
            readOnly
            className="h-11 border-white/10 bg-slate-950/70 text-slate-300"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.foodName}</FieldLabel>
        <Input
          name="food_name"
          defaultValue={log?.food_name}
          placeholder={text.foodPlaceholder}
          className="h-11 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="grid gap-2">
          <FieldLabel>{text.calories}</FieldLabel>
          <Input
            name="calories"
            type="number"
            min="0"
            step="1"
            defaultValue={log?.calories ?? ""}
            placeholder="520"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.protein}</FieldLabel>
          <Input
            name="protein_g"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.protein_g ?? ""}
            placeholder="35"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.carbs}</FieldLabel>
          <Input
            name="carbs_g"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.carbs_g ?? ""}
            placeholder="60"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.fat}</FieldLabel>
          <Input
            name="fat_g"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.fat_g ?? ""}
            placeholder="18"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel>{text.quantity}</FieldLabel>
          <Input
            name="quantity"
            type="number"
            min="0"
            step="0.1"
            defaultValue={log?.quantity ?? ""}
            placeholder="1"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{text.unit}</FieldLabel>
          <Input
            name="unit"
            defaultValue={log?.unit ?? ""}
            placeholder={text.unitPlaceholder}
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
          className="h-11 border-dashed border-cyan-300/25 bg-cyan-400/5 text-sm text-slate-300 file:text-slate-200"
        />
        <p className="text-[11px] text-slate-500">
          {text.uploadPhotoHint}
        </p>
      </div>

      <div className="grid gap-2">
        <FieldLabel>{text.note}</FieldLabel>
        <Textarea
          name="note"
          defaultValue={log?.note ?? ""}
          placeholder={text.notePlaceholder}
          className="min-h-24 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? text.saving : log ? text.saveMeal : text.logMeal}
      </Button>
    </form>
  );
}

function NutritionLogCard({
  log,
  onDelete,
  onRemovePhoto,
  onUpdate,
  pending,
}: {
  log: NutritionLogRow;
  onDelete: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useNutritionCopy();
  const [open, setOpen] = useState(false);
  const meta = mealMeta[log.meal_type];

  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_32%),rgba(255,255,255,0.035)] p-3 transition hover:border-emerald-300/25 md:grid-cols-[160px_minmax(0,1fr)_auto]">
      {log.image_url ? (
        <a
          href={log.image_url}
          target="_blank"
          rel="noreferrer"
          className="min-h-36 overflow-hidden rounded-xl border border-cyan-300/20 bg-cover bg-center shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(2,6,23,0.03),rgba(2,6,23,0.55)),url("${log.image_url}")`,
          }}
          aria-label={text.openPhoto}
        />
      ) : (
        <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/15 bg-slate-950/45">
          <div className="text-center">
            <Camera className="mx-auto size-8 text-slate-500" />
            <p className="mt-2 text-xs font-bold text-slate-500">
              {text.noPhoto}
            </p>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-black",
              accentClasses[meta.accent],
            )}
          >
            {meta.icon}
            {text.mealTypes[log.meal_type]}
          </span>
          {log.quantity ? (
            <Badge className="border-white/10 bg-white/[0.05] text-slate-300">
              {metricText(Number(log.quantity), "", locale)} {log.unit ?? ""}
            </Badge>
          ) : null}
        </div>

        <h3 className="mt-3 truncate text-lg font-black text-white">
          {log.food_name}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {metricText(Number(log.calories ?? 0), "", locale)} kcal · P{" "}
          {metricText(Number(log.protein_g ?? 0), "g", locale)} · C{" "}
          {metricText(Number(log.carbs_g ?? 0), "g", locale)} · F{" "}
          {metricText(Number(log.fat_g ?? 0), "g", locale)}
        </p>
        {log.note ? (
          <p className="mt-2 text-sm leading-5 text-slate-300">{log.note}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 md:flex-col md:justify-start">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="border-cyan-300/20 bg-slate-950/60 text-cyan-200"
            >
              <Pencil className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] overflow-y-auto border-cyan-300/20 bg-[#07111d] text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">{text.editMeal}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {text.editMealHint}
              </DialogDescription>
            </DialogHeader>
            <NutritionForm
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

function NutritionTrendChart({
  monthLogs,
  onSelectDate,
  selectedDate,
}: {
  monthLogs: NutritionLogRow[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const { locale, text } = useNutritionCopy();
  const days = monthDays(selectedDate);
  const rows = days.map((day) => {
    const dayLogs = monthLogs.filter((log) => log.log_date === day.key);

    return {
      ...day,
      calories: metricSum(dayLogs, "calories"),
      protein: metricSum(dayLogs, "protein_g"),
      carbs: metricSum(dayLogs, "carbs_g"),
      fat: metricSum(dayLogs, "fat_g"),
      meals: dayLogs.length,
    };
  });
  const maxCalories = Math.max(1, ...rows.map((row) => row.calories), calorieGoal);
  const maxMacro = Math.max(
    1,
    ...rows.flatMap((row) => [row.protein, row.carbs, row.fat]),
    carbsGoal,
  );
  const activeDays = rows.filter((row) => row.meals > 0).length;
  const bestDay = [...rows].sort((first, second) => second.calories - first.calories)[0];

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              {text.chart}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {text.chartTitle}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-amber-200">
            {activeDays} {text.activeDays}
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
            {text.best} {String(bestDay.day).padStart(2, "0")} ·{" "}
            {metricText(bestDay.calories, "", locale)} kcal
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-3">
        <div className="grid h-56 min-w-0 grid-cols-[repeat(31,minmax(0,1fr))] items-end gap-px pb-1 sm:gap-1">
          {rows.map((row) => {
            const selected = row.key === selectedDate;

            return (
              <button
                key={row.key}
                type="button"
                onClick={() => onSelectDate(row.key)}
                className={cn(
                  "group flex h-full min-w-0 flex-col items-center justify-end gap-1 rounded-md px-0 py-2 transition hover:bg-white/[0.04] sm:rounded-xl sm:px-0.5",
                  selected && "bg-emerald-400/10",
                )}
              >
                <span className="flex h-[150px] items-end gap-px sm:gap-0.5">
                  <span
                    className="w-0.5 rounded-full bg-amber-300/90 shadow-[0_0_14px_rgba(252,211,77,0.28)] sm:w-1"
                    style={{
                      height: `${Math.max(6, (row.calories / maxCalories) * 150)}px`,
                    }}
                  />
                  <span
                    className="w-0.5 rounded-full bg-emerald-300/90 shadow-[0_0_14px_rgba(52,211,153,0.22)] sm:w-1"
                    style={{
                      height: `${Math.max(5, (row.protein / maxMacro) * 130)}px`,
                    }}
                  />
                  <span
                    className="w-0.5 rounded-full bg-cyan-300/90 shadow-[0_0_14px_rgba(34,211,238,0.2)] sm:w-1"
                    style={{
                      height: `${Math.max(5, (row.carbs / maxMacro) * 130)}px`,
                    }}
                  />
                  <span
                    className="w-0.5 rounded-full bg-violet-300/90 shadow-[0_0_14px_rgba(196,181,253,0.18)] sm:w-1"
                    style={{
                      height: `${Math.max(5, (row.fat / maxMacro) * 130)}px`,
                    }}
                  />
                </span>
                <span
                  className={cn(
                    "rounded px-0 py-1 text-[7px] font-black text-slate-500 sm:rounded-lg sm:px-0.5 sm:text-[9px]",
                    row.meals > 0 && "text-slate-300",
                    selected && "bg-emerald-400/15 text-emerald-200",
                  )}
                >
                  {String(row.day).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-amber-200">
            {text.calories.toLowerCase()}
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            {text.protein.toLowerCase()}
          </span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
            {text.carbs.toLowerCase()}
          </span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-violet-200">
            {text.fat.toLowerCase()}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function NutritionPhotoHistoryPanel({
  monthLogs,
  onSelectDate,
  scope,
  selectedDate,
  setScope,
  weekLogs,
}: {
  monthLogs: NutritionLogRow[];
  onSelectDate: (date: string) => void;
  scope: PhotoScope;
  selectedDate: string;
  setScope: (scope: PhotoScope) => void;
  weekLogs: NutritionLogRow[];
}) {
  const { locale, text } = useNutritionCopy();
  const photos = nutritionPhotoLogs(scope === "week" ? weekLogs : monthLogs);

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            {text.photoHistory}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">{text.foodPhotos}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {text.photoHint}
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
          {photos.map((log) => {
            return (
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
                  <span className="block truncate text-xs font-black text-white">
                    {text.mealTypes[log.meal_type]} · {formatDisplayDate(log.log_date, locale)}
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-semibold text-slate-400">
                    {log.food_name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center">
          <ImageIcon className="mx-auto size-7 text-slate-500" />
          <p className="mt-2 text-sm font-bold text-white">{text.noFoodPhotos}</p>
          <p className="mt-1 text-xs text-slate-500">
            {text.noFoodPhotosHint}
          </p>
        </div>
      )}
    </Panel>
  );
}

function MealGroup({
  logs,
  meal,
  onDelete,
  onRemovePhoto,
  onUpdate,
  pending,
}: {
  logs: NutritionLogRow[];
  meal: MealType;
  onDelete: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useNutritionCopy();
  const meta = mealMeta[meal];
  const calories = metricSum(logs, "calories");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-xl border",
              accentClasses[meta.accent],
            )}
          >
            {meta.icon}
          </span>
          <div>
            <h3 className="font-black text-white">{text.mealTypes[meal]}</h3>
            <p className="text-xs text-slate-500">{text.mealHints[meal]}</p>
          </div>
        </div>
        <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
          {metricText(calories, "", locale)} kcal
        </Badge>
      </div>

      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <NutritionLogCard
              key={log.id}
              log={log}
              pending={pending}
              onDelete={onDelete}
              onRemovePhoto={onRemovePhoto}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/35 p-4 text-sm text-slate-500">
          {text.noMealLogged}: {text.mealTypes[meal].toLowerCase()}.
        </div>
      )}
    </div>
  );
}

function WeeklySummary({
  onSelectDate,
  selectedDate,
  weekLogs,
}: {
  onSelectDate: (date: string) => void;
  selectedDate: string;
  weekLogs: NutritionLogRow[];
}) {
  const { locale, text } = useNutritionCopy();
  const week = weekDays(selectedDate, locale);
  const maxDayCalories = Math.max(
    1,
    ...week.map((day) =>
      metricSum(
        weekLogs.filter((log) => log.log_date === day.key),
        "calories",
      ),
    ),
  );

  return (
    <Panel className="p-4">
      <h2 className="text-lg font-black text-white">{text.weeklySummary}</h2>
      <div className="mt-4 space-y-2">
        {week.map((day) => {
          const dayLogs = weekLogs.filter((log) => log.log_date === day.key);
          const calories = metricSum(dayLogs, "calories");

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDate(day.key)}
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
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#facc15,#22c55e)]"
                  style={{
                    width: `${Math.max(4, (calories / maxDayCalories) * 100)}%`,
                  }}
                />
              </span>
              <span className="text-xs font-bold text-slate-400">
                {metricText(calories, "", locale)}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function NutritionClient({
  selectedDate,
  initialLogs,
  initialWeekLogs,
  initialMonthLogs,
  supabaseReady,
}: NutritionClientProps) {
  const router = useRouter();
  const { locale, text } = useNutritionCopy();
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

  const week = useMemo(() => weekDays(selectedDate, locale), [locale, selectedDate]);
  const weekDateSet = useMemo(
    () => new Set(week.map((day) => day.key)),
    [week],
  );
  const month = useMemo(() => monthDays(selectedDate), [selectedDate]);
  const monthDateSet = useMemo(
    () => new Set(month.map((day) => day.key)),
    [month],
  );

  const summary = useMemo(
    () => ({
      calories: metricSum(logs, "calories"),
      protein: metricSum(logs, "protein_g"),
      carbs: metricSum(logs, "carbs_g"),
      fat: metricSum(logs, "fat_g"),
      meals: logs.length,
    }),
    [logs],
  );
  const macroSplit = useMemo(() => macroCalories(logs), [logs]);
  const groupedMeals = useMemo(
    () =>
      mealOrder.map((meal) => ({
        meal,
        logs: logs.filter((log) => log.meal_type === meal),
      })),
    [logs],
  );

  const runFormAction = (
    event: FormEvent<HTMLFormElement>,
    action: NutritionFormAction,
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

  const runDelete = (logId: string) => {
    if (!window.confirm(text.deleteConfirm)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await deleteNutritionLog(logId);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
      setWeekLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
      setMonthLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== logId),
      );
      setMessage(text.deleted);
      router.refresh();
    });
  };

  const runRemovePhoto = (logId: string) => {
    if (!window.confirm(text.removePhotoConfirm)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await removeNutritionPhoto(logId);

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
    router.push(createNutritionPath(date));
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-3 overflow-hidden pb-20 sm:space-y-4 lg:pb-0">
      <header className="flex flex-col gap-2.5 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid sm:size-11">
            <Utensils className="size-4 sm:size-5" />
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
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
            <MetricCard
              accent="amber"
              icon={<Flame className="size-4" />}
              label={text.calories}
              value={metricText(summary.calories, "", locale)}
              sub={`${progressPercent(summary.calories, calorieGoal)}% ${text.of} ${calorieGoal}`}
            />
            <MetricCard
              icon={<Utensils className="size-4" />}
              label={text.meals}
              value={metricText(summary.meals, "", locale)}
              sub={text.loggedToday}
            />
            <MetricCard
              accent="emerald"
              icon={<Dumbbell className="size-4" />}
              label={text.protein}
              value={metricText(summary.protein, "g", locale)}
              sub={`${progressPercent(summary.protein, proteinGoal)}% ${text.goal}`}
            />
            <MetricCard
              accent="cyan"
              icon={<Zap className="size-4" />}
              label={text.carbs}
              value={metricText(summary.carbs, "g", locale)}
              sub={`${progressPercent(summary.carbs, carbsGoal)}% ${text.goal}`}
            />
            <MetricCard
              accent="violet"
              icon={<BarChart3 className="size-4" />}
              label={text.fat}
              value={metricText(summary.fat, "g", locale)}
              sub={`${progressPercent(summary.fat, fatGoal)}% ${text.goal}`}
            />
          </div>

          <Panel className="p-3 sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.macroBalance}
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {text.dailySplit}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {text.splitHint}
                </p>
              </div>
              <div className="grid gap-2">
                <MacroProgress
                  accent="emerald"
                  label={text.protein}
                  value={summary.protein}
                  goal={proteinGoal}
                />
                <MacroProgress
                  accent="cyan"
                  label={text.carbs}
                  value={summary.carbs}
                  goal={carbsGoal}
                />
                <MacroProgress
                  accent="violet"
                  label={text.fat}
                  value={summary.fat}
                  goal={fatGoal}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-3">
                <p className="text-xs text-slate-400">{text.proteinKcal}</p>
                <p className="mt-1 text-xl font-black text-emerald-200">
                  {metricText(macroSplit.protein)}
                </p>
              </div>
              <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3">
                <p className="text-xs text-slate-400">{text.carbKcal}</p>
                <p className="mt-1 text-xl font-black text-cyan-200">
                  {metricText(macroSplit.carbs)}
                </p>
              </div>
              <div className="rounded-xl border border-violet-300/15 bg-violet-400/10 p-3">
                <p className="text-xs text-slate-400">{text.fatKcal}</p>
                <p className="mt-1 text-xl font-black text-violet-200">
                  {metricText(macroSplit.fat)}
                </p>
              </div>
            </div>
          </Panel>

          <NutritionTrendChart
            monthLogs={monthLogs}
            selectedDate={selectedDate}
            onSelectDate={goToDate}
          />

          <NutritionPhotoHistoryPanel
            selectedDate={selectedDate}
            weekLogs={weekLogs}
            monthLogs={monthLogs}
            scope={photoScope}
            setScope={setPhotoScope}
            onSelectDate={goToDate}
          />

          <Panel className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.dailyMeals}
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {formatDisplayDate(selectedDate, locale)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {text.dailyMealsHint}
                </p>
              </div>

              <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-emerald-400/15 font-bold text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Plus className="mr-2 size-4" />
                    {text.logMeal}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                      {text.logMeal}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {text.logMealHint}
                    </DialogDescription>
                  </DialogHeader>
                  <NutritionForm
                    selectedDate={selectedDate}
                    pending={isPending}
                    onSubmit={(event) =>
                      runFormAction(
                        event,
                        createNutritionLog,
                        text.logged,
                        () => setLogDialogOpen(false),
                      )
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-3">
              {groupedMeals.map(({ meal, logs: mealLogs }) => (
                <MealGroup
                  key={meal}
                  meal={meal}
                  logs={mealLogs}
                  pending={isPending}
                  onDelete={runDelete}
                  onRemovePhoto={runRemovePhoto}
                  onUpdate={(event) =>
                    runFormAction(event, updateNutritionLog, text.updated)
                  }
                />
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
              {text.dailyAnalysis}
            </p>
            <h2 className="mt-1 text-lg font-black text-white">
              {summary.calories
                ? `${metricText(calorieGoal - summary.calories, "", locale)} ${text.kcalLeft}`
                : text.noMealYet}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {text.goalHint}: {calorieGoal} kcal, P
              {proteinGoal} / C{carbsGoal} / F{fatGoal}.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#facc15,#22c55e)]"
                style={{
                  width: `${progressPercent(summary.calories, calorieGoal)}%`,
                }}
              />
            </div>
          </Panel>

          <WeeklySummary
            selectedDate={selectedDate}
            weekLogs={weekLogs}
            onSelectDate={goToDate}
          />
        </aside>
      </div>
    </div>
  );
}
