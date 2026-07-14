"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ImageIcon,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Scale,
  Trash2,
} from "lucide-react";
import {
  createWeightLog,
  deleteWeightLog,
  removeWeightPhoto,
  updateWeightLog,
  type ActionResult,
} from "@/app/(dashboard)/dashboard/weight/actions";
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
import type { WeightLogRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type WeightClientProps = {
  selectedDate: string;
  initialLogs: WeightLogRow[];
  initialWeekLogs: WeightLogRow[];
  initialMonthLogs: WeightLogRow[];
  supabaseReady: boolean;
};

type WeightFormAction = (
  formData: FormData,
) => Promise<ActionResult<{ log: WeightLogRow }>>;
type Accent = "emerald" | "cyan" | "amber" | "violet" | "rose";
type PhotoScope = "week" | "month";

const weightCopy = {
  en: {
    title: "Weight & Body",
    subtitle: "Track daily home weight, body photos, and month-end gym scans.",
    today: "Today",
    demo: "Demo mode: add Supabase env to save body checks.",
    weight: "Weight",
    todayCheck: "today check",
    notLogged: "not logged",
    monthChange: "Month change",
    latestVsFirst: "latest vs first",
    gymFat: "Gym fat",
    gymMuscle: "Gym muscle",
    latestScan: "latest scan",
    photos: "Photos",
    thisMonth: "this month",
    dailyBodyCheck: "Daily body check",
    dailyHint: "Daily home weigh-in: weight, body photo, and a quick note.",
    updateCheck: "Update check",
    logBodyCheck: "Log body check",
    updateBodyCheck: "Update body check",
    bodyCheckDescription: "Save the home weigh-in data for this day.",
    noBodyCheck: "No body check yet",
    noBodyCheckHint: "Log your weight and upload a body photo for this date.",
    weightKg: "Weight (kg) *",
    bodyFat: "Body fat %",
    muscleKg: "Muscle (kg)",
    visceralFat: "Visceral fat",
    bodyPhoto: "Body photo",
    uploadHint: "Upload from your device: JPG, PNG, WEBP or GIF up to 5 MB.",
    note: "Note",
    notePlaceholder: "Morning check, after workout, fasting...",
    dailyFormHint: "Daily home check: weight, body photo, and a short note.",
    compositionFormHint: "Month-end gym scan: weight, body fat, muscle, and visceral fat.",
    saving: "Saving...",
    saveGymScan: "Save gym scan",
    saveDailyCheck: "Save daily check",
    logDailyCheck: "Log daily check",
    openPhoto: "Open body check photo",
    noPhoto: "No body photo yet",
    dailyWeighIn: "Daily weigh-in",
    photoSaved: "Photo saved",
    scanLinked: "Gym scan linked",
    editDaily: "Edit daily weigh-in",
    editDailyHint: "Update weight, note, or replace the body photo for this day.",
    removePhoto: "Remove photo",
    monthlyTrend: "Monthly trend",
    trendTitle: "Weight + body composition",
    bodyChecks: "body checks",
    weightBar: "weight bar",
    fatDot: "fat dot",
    muscleDot: "muscle dot",
    photoHistory: "Photo history",
    bodyPhotos: "Body check photos",
    photoHistoryHint: "Body check photos stay in Weight and can be filtered by the week or month being viewed.",
    week: "Week",
    month: "Month",
    noBodyPhotos: "No body photos",
    noBodyPhotosHint: "Log a body check and upload a photo to see it here.",
    fat: "fat",
    monthlyGymScan: "Monthly gym scan",
    bodyComposition: "Body composition",
    bodyCompositionHint: "Daily weight stays in the chart. Log the full body scan when you measure at the gym.",
    latestWeight: "latest weight",
    logComposition: "Log body composition",
    gymComposition: "Gym body composition",
    gymCompositionHint: "Use this for gym or InBody measurements near month-end.",
    weeklyChecks: "Weekly checks",
    deleteConfirm: "Delete this body check?",
    removePhotoConfirm: "Remove this body photo?",
    deleted: "Body check deleted.",
    photoRemoved: "Body photo removed.",
    saved: "Body check saved.",
    updated: "Body check updated.",
    compositionSaved: "Gym body composition saved.",
  },
  vi: {
    title: "Cân nặng & Cơ thể",
    subtitle: "Theo dõi cân nặng hằng ngày, ảnh cơ thể và chỉ số đo cuối tháng tại gym.",
    today: "Hôm nay",
    demo: "Chế độ demo: thêm Supabase env để lưu dữ liệu body check.",
    weight: "Cân nặng",
    todayCheck: "đã cân hôm nay",
    notLogged: "chưa ghi",
    monthChange: "Thay đổi trong tháng",
    latestVsFirst: "mới nhất so với đầu tháng",
    gymFat: "Mỡ cơ thể",
    gymMuscle: "Khối lượng cơ",
    latestScan: "lần đo gần nhất",
    photos: "Ảnh body",
    thisMonth: "trong tháng này",
    dailyBodyCheck: "Body check hằng ngày",
    dailyHint: "Cân tại nhà mỗi ngày: cân nặng, ảnh cơ thể và ghi chú ngắn.",
    updateCheck: "Cập nhật",
    logBodyCheck: "Ghi body check",
    updateBodyCheck: "Cập nhật body check",
    bodyCheckDescription: "Lưu dữ liệu cân tại nhà cho ngày này.",
    noBodyCheck: "Ngày này chưa có body check",
    noBodyCheckHint: "Ghi cân nặng và tải ảnh cơ thể cho ngày này.",
    weightKg: "Cân nặng (kg) *",
    bodyFat: "Tỷ lệ mỡ %",
    muscleKg: "Khối lượng cơ (kg)",
    visceralFat: "Mỡ nội tạng",
    bodyPhoto: "Ảnh cơ thể",
    uploadHint: "Tải từ thiết bị: JPG, PNG, WEBP hoặc GIF tối đa 5 MB.",
    note: "Ghi chú",
    notePlaceholder: "Cân buổi sáng, sau tập, lúc đói...",
    dailyFormHint: "Cân tại nhà mỗi ngày: cân nặng, ảnh body và ghi chú ngắn.",
    compositionFormHint: "Đo cuối tháng tại gym: cân nặng, % mỡ, cơ và mỡ nội tạng.",
    saving: "Đang lưu...",
    saveGymScan: "Lưu chỉ số gym",
    saveDailyCheck: "Lưu body check",
    logDailyCheck: "Ghi body check",
    openPhoto: "Mở ảnh body check",
    noPhoto: "Chưa có ảnh cơ thể",
    dailyWeighIn: "Cân hằng ngày",
    photoSaved: "Đã lưu ảnh",
    scanLinked: "Có chỉ số gym",
    editDaily: "Sửa body check hằng ngày",
    editDailyHint: "Cập nhật cân nặng, ghi chú hoặc thay ảnh cơ thể của ngày này.",
    removePhoto: "Xóa ảnh",
    monthlyTrend: "Xu hướng trong tháng",
    trendTitle: "Cân nặng và thành phần cơ thể",
    bodyChecks: "ngày đã check",
    weightBar: "cột cân nặng",
    fatDot: "chấm tỷ lệ mỡ",
    muscleDot: "chấm khối lượng cơ",
    photoHistory: "Lịch sử ảnh",
    bodyPhotos: "Ảnh body check",
    photoHistoryHint: "Ảnh body check được lưu trong Cân nặng và lọc theo tuần hoặc tháng đang xem.",
    week: "Tuần",
    month: "Tháng",
    noBodyPhotos: "Chưa có ảnh body",
    noBodyPhotosHint: "Ghi một body check và tải ảnh lên để xem tại đây.",
    fat: "mỡ",
    monthlyGymScan: "Đo chỉ số gym hằng tháng",
    bodyComposition: "Thành phần cơ thể",
    bodyCompositionHint: "Cân nặng hằng ngày nằm trên biểu đồ. Ghi đầy đủ chỉ số khi bạn đo tại gym.",
    latestWeight: "cân nặng gần nhất",
    logComposition: "Ghi thành phần cơ thể",
    gymComposition: "Chỉ số cơ thể tại gym",
    gymCompositionHint: "Dùng cho số đo tại gym hoặc InBody vào gần cuối tháng.",
    weeklyChecks: "Body check trong tuần",
    deleteConfirm: "Xóa body check này?",
    removePhotoConfirm: "Xóa ảnh cơ thể này?",
    deleted: "Đã xóa body check.",
    photoRemoved: "Đã xóa ảnh cơ thể.",
    saved: "Đã lưu body check.",
    updated: "Đã cập nhật body check.",
    compositionSaved: "Đã lưu chỉ số cơ thể tại gym.",
  },
} as const;

function useWeightCopy() {
  const { locale } = useI18n();

  return { locale, text: weightCopy[locale] };
}

const accentClasses: Record<Accent, string> = {
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  rose: "border-rose-300/20 bg-rose-400/10 text-rose-300",
  violet: "border-violet-300/20 bg-violet-400/10 text-violet-300",
};

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

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return toDateString(date);
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

function createWeightPath(date: string) {
  return `/dashboard/weight?date=${date}`;
}

function metricText(value: number | null | undefined, suffix = "", locale: Locale = "en") {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Number(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 1,
  })}${suffix}`;
}

function upsertLog(logs: WeightLogRow[], nextLog: WeightLogRow) {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [nextLog, ...logs];
  }

  return logs.map((log, index) => (index === existingIndex ? nextLog : log));
}

function latestLog(logs: WeightLogRow[]) {
  return [...logs].sort((first, second) => {
    if (first.log_date !== second.log_date) {
      return second.log_date.localeCompare(first.log_date);
    }

    return second.created_at.localeCompare(first.created_at);
  })[0];
}

function firstLog(logs: WeightLogRow[]) {
  return [...logs].sort((first, second) => {
    if (first.log_date !== second.log_date) {
      return first.log_date.localeCompare(second.log_date);
    }

    return first.created_at.localeCompare(second.created_at);
  })[0];
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

function photoLogs(logs: WeightLogRow[]) {
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

function WeightForm({
  log,
  mode = "daily",
  onSubmit,
  pending,
  selectedDate,
}: {
  log?: WeightLogRow;
  mode?: "daily" | "composition";
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { locale, text } = useWeightCopy();
  const isComposition = mode === "composition";

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="space-y-4">
      {log ? <input type="hidden" name="id" value={log.id} /> : null}
      <input type="hidden" name="log_date" value={log?.log_date ?? selectedDate} />
      <input type="hidden" name="image_url" value={log?.image_url ?? ""} />
      {!isComposition ? (
        <>
          <input
            type="hidden"
            name="body_fat_pct"
            value={log?.body_fat_pct ?? ""}
          />
          <input type="hidden" name="muscle_kg" value={log?.muscle_kg ?? ""} />
          <input
            type="hidden"
            name="visceral_fat"
            value={log?.visceral_fat ?? ""}
          />
        </>
      ) : null}

      <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3">
        <p className="text-sm font-black text-white">
          {formatDisplayDate(log?.log_date ?? selectedDate, locale)}
        </p>
      </div>

      <p className="text-xs text-slate-400">
        {isComposition
          ? text.compositionFormHint
          : text.dailyFormHint}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel>{text.weightKg}</FieldLabel>
          <Input
            name="weight_kg"
            type="number"
            min="1"
            step="0.1"
            required
            defaultValue={log?.weight_kg ?? ""}
            placeholder="72.4"
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        {isComposition ? (
          <div className="grid gap-2">
            <FieldLabel>{text.bodyFat}</FieldLabel>
            <Input
              name="body_fat_pct"
              type="number"
              min="0"
              step="0.1"
              defaultValue={log?.body_fat_pct ?? ""}
              placeholder="18.5"
              className="h-11 border-white/10 bg-slate-950/70 text-white"
            />
          </div>
        ) : null}
      </div>

      {isComposition ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel>{text.muscleKg}</FieldLabel>
            <Input
              name="muscle_kg"
              type="number"
              min="0"
              step="0.1"
              defaultValue={log?.muscle_kg ?? ""}
              placeholder="33.2"
              className="h-11 border-white/10 bg-slate-950/70 text-white"
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel>{text.visceralFat}</FieldLabel>
            <Input
              name="visceral_fat"
              type="number"
              min="0"
              step="1"
              defaultValue={log?.visceral_fat ?? ""}
              placeholder="7"
              className="h-11 border-white/10 bg-slate-950/70 text-white"
            />
          </div>
        </div>
      ) : null}

      {!isComposition ? (
        <div className="grid gap-2">
        <FieldLabel>{text.bodyPhoto}</FieldLabel>
        <Input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="h-11 border-dashed border-cyan-300/25 bg-cyan-400/5 text-sm text-slate-300 file:text-slate-200"
        />
        <p className="text-[11px] text-slate-500">
          {text.uploadHint}
        </p>
        </div>
      ) : null}

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
        {pending
          ? text.saving
          : isComposition
            ? text.saveGymScan
            : log
              ? text.saveDailyCheck
              : text.logDailyCheck}
      </Button>
    </form>
  );
}

function BodyCheckCard({
  log,
  onDelete,
  onRemovePhoto,
  onUpdate,
  pending,
}: {
  log: WeightLogRow;
  onDelete: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { locale, text } = useWeightCopy();
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.09),transparent_30%),rgba(255,255,255,0.035)] p-3 transition hover:border-cyan-300/25 lg:grid-cols-[190px_minmax(0,1fr)_auto]">
      {log.image_url ? (
        <a
          href={log.image_url}
          target="_blank"
          rel="noreferrer"
          className="min-h-44 overflow-hidden rounded-xl border border-cyan-300/20 bg-cover bg-center shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(2,6,23,0.03),rgba(2,6,23,0.55)),url("${log.image_url}")`,
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
        <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
          {formatDisplayDate(log.log_date, locale)}
        </Badge>
        <h3 className="mt-3 text-3xl font-black text-white">
          {metricText(log.weight_kg, "kg", locale)}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            {text.dailyWeighIn}
          </span>
          {log.image_url ? (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
              {text.photoSaved}
            </span>
          ) : null}
          {log.body_fat_pct || log.muscle_kg || log.visceral_fat ? (
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-violet-200">
              {text.scanLinked}
            </span>
          ) : null}
        </div>
        {log.note ? (
          <p className="mt-3 text-sm leading-5 text-slate-300">{log.note}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 lg:flex-col lg:justify-start">
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
              <DialogTitle className="text-xl font-black">
                {text.editDaily}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {text.editDailyHint}
              </DialogDescription>
            </DialogHeader>
            <WeightForm
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

function WeightTrendChart({
  monthLogs,
  onSelectDate,
  selectedDate,
}: {
  monthLogs: WeightLogRow[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const { locale, text } = useWeightCopy();
  const days = monthDays(selectedDate);
  const rows = days.map((day) => {
    const log = latestLog(monthLogs.filter((item) => item.log_date === day.key));

    return {
      ...day,
      log,
      weight: log?.weight_kg ?? null,
      fat: log?.body_fat_pct ?? null,
      muscle: log?.muscle_kg ?? null,
    };
  });
  const weights = rows
    .map((row) => row.weight)
    .filter((value): value is number => value != null);
  const minWeight = Math.min(...weights, 0);
  const maxWeight = Math.max(...weights, 1);
  const range = Math.max(1, maxWeight - minWeight);
  const activeDays = rows.filter((row) => row.log).length;

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              {text.monthlyTrend}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {text.trendTitle}
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
            {activeDays} {text.bodyChecks}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300">
            {metricText(minWeight, "kg", locale)} - {metricText(maxWeight, "kg", locale)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-3">
        <div className="grid h-56 min-w-0 grid-cols-[repeat(31,minmax(0,1fr))] items-end gap-px pb-1 sm:gap-1">
          {rows.map((row) => {
            const selected = row.key === selectedDate;
            const height = row.weight
              ? Math.max(12, ((row.weight - minWeight) / range) * 130 + 18)
              : 8;

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
                <span className="relative flex h-[150px] items-end">
                  <span
                    className={cn(
                      "w-1.5 rounded-full bg-emerald-300/90 shadow-[0_0_16px_rgba(52,211,153,0.2)] transition sm:w-2.5",
                      !row.weight && "bg-white/10 shadow-none",
                    )}
                    style={{ height: `${height}px` }}
                  />
                  {row.fat ? (
                    <span className="absolute -left-1 bottom-10 size-2 rounded-full bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.35)]" />
                  ) : null}
                  {row.muscle ? (
                    <span className="absolute -right-1 bottom-20 size-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "rounded px-0 py-1 text-[7px] font-black text-slate-500 sm:rounded-lg sm:px-0.5 sm:text-[9px]",
                    row.log && "text-slate-300",
                    selected && "bg-emerald-400/15 text-emerald-200",
                  )}
                >
                  {String(row.day).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            {text.weightBar}
          </span>
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-rose-200">
            {text.fatDot}
          </span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
            {text.muscleDot}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function WeightPhotoHistoryPanel({
  monthLogs,
  onSelectDate,
  scope,
  selectedDate,
  setScope,
  weekLogs,
}: {
  monthLogs: WeightLogRow[];
  onSelectDate: (date: string) => void;
  scope: PhotoScope;
  selectedDate: string;
  setScope: (scope: PhotoScope) => void;
  weekLogs: WeightLogRow[];
}) {
  const { locale, text } = useWeightCopy();
  const photos = photoLogs(scope === "week" ? weekLogs : monthLogs);

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            {text.photoHistory}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            {text.bodyPhotos}
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
                  {metricText(log.weight_kg, "kg", locale)} · {text.fat}{" "}
                  {metricText(log.body_fat_pct, "%", locale)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center">
          <ImageIcon className="mx-auto size-7 text-slate-500" />
          <p className="mt-2 text-sm font-bold text-white">{text.noBodyPhotos}</p>
          <p className="mt-1 text-xs text-slate-500">
            {text.noBodyPhotosHint}
          </p>
        </div>
      )}
    </Panel>
  );
}

function MonthlyGymScanPanel({
  currentLog,
  firstMonthLog,
  latestMonthLog,
  onCompositionSubmit,
  pending,
  selectedDate,
}: {
  currentLog?: WeightLogRow;
  firstMonthLog?: WeightLogRow;
  latestMonthLog?: WeightLogRow;
  onCompositionSubmit: (
    event: FormEvent<HTMLFormElement>,
    close?: () => void,
  ) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { locale, text } = useWeightCopy();
  const [compositionOpen, setCompositionOpen] = useState(false);
  const currentLogHasScan =
    currentLog?.body_fat_pct != null ||
    currentLog?.muscle_kg != null ||
    currentLog?.visceral_fat != null;
  const visibleScanLog = currentLogHasScan ? currentLog : latestMonthLog;
  const weightDelta =
    firstMonthLog && latestMonthLog
      ? Number(latestMonthLog.weight_kg) - Number(firstMonthLog.weight_kg)
      : null;

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(15,23,42,0.42)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
          {text.monthlyGymScan}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">
          {text.bodyComposition}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {text.bodyCompositionHint}
        </p>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-slate-400">{text.latestWeight}</p>
            <p className="mt-1 text-2xl font-black text-white">
              {metricText(visibleScanLog?.weight_kg, "kg", locale)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-slate-400">{text.monthChange}</p>
            <p
              className={cn(
                "mt-1 text-2xl font-black",
                (weightDelta ?? 0) <= 0 ? "text-emerald-300" : "text-amber-300",
              )}
            >
              {weightDelta == null
                ? "--"
                : `${weightDelta > 0 ? "+" : ""}${metricText(weightDelta, "kg", locale)}`}
            </p>
          </div>
          <div className="rounded-xl border border-rose-300/15 bg-rose-400/10 p-3">
            <p className="text-xs text-slate-400">{text.bodyFat}</p>
            <p className="mt-1 text-2xl font-black text-rose-200">
              {metricText(visibleScanLog?.body_fat_pct, "%", locale)}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3">
            <p className="text-xs text-slate-400">{text.muscleKg}</p>
            <p className="mt-1 text-2xl font-black text-cyan-200">
              {metricText(visibleScanLog?.muscle_kg, "kg", locale)}
            </p>
          </div>
        </div>

        <Dialog open={compositionOpen} onOpenChange={setCompositionOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              className="h-10 w-full rounded-xl bg-emerald-400/15 font-bold text-emerald-200 hover:bg-emerald-400/20"
            >
              <Scale className="mr-2 size-4" />
              {text.logComposition}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">
                {text.gymComposition}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {text.gymCompositionHint}
              </DialogDescription>
            </DialogHeader>
            <WeightForm
              log={currentLog}
              mode="composition"
              selectedDate={selectedDate}
              pending={pending}
              onSubmit={(event) =>
                onCompositionSubmit(event, () => setCompositionOpen(false))
              }
            />
          </DialogContent>
        </Dialog>

      </div>
    </Panel>
  );
}

function WeeklySummary({
  onSelectDate,
  selectedDate,
  weekLogs,
}: {
  onSelectDate: (date: string) => void;
  selectedDate: string;
  weekLogs: WeightLogRow[];
}) {
  const { locale, text } = useWeightCopy();
  const week = weekDays(selectedDate, locale);

  return (
    <Panel className="p-4">
      <h2 className="text-lg font-black text-white">{text.weeklyChecks}</h2>
      <div className="mt-4 space-y-2">
        {week.map((day) => {
          const log = latestLog(weekLogs.filter((item) => item.log_date === day.key));

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
                  className={cn(
                    "block h-full rounded-full",
                    log
                      ? "bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                      : "bg-white/10",
                  )}
                  style={{ width: log ? "100%" : "8%" }}
                />
              </span>
              <span className="text-xs font-bold text-slate-400">
                {log ? metricText(log.weight_kg, "kg", locale) : "--"}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function WeightClient({
  selectedDate,
  initialLogs,
  initialWeekLogs,
  initialMonthLogs,
  supabaseReady,
}: WeightClientProps) {
  const router = useRouter();
  const { locale, text } = useWeightCopy();
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
  const currentLog = logs[0];
  const latestMonthLog = latestLog(monthLogs);
  const firstMonthLog = firstLog(monthLogs);
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
  const weightDelta =
    firstMonthLog && latestMonthLog
      ? Number(latestMonthLog.weight_kg) - Number(firstMonthLog.weight_kg)
      : null;

  useEffect(() => {
    setLogs(initialLogs);
    setWeekLogs(initialWeekLogs);
    setMonthLogs(initialMonthLogs);
    setMessage(null);
    setError(null);
  }, [
    initialLogs,
    initialMonthLogs,
    initialWeekLogs,
    selectedDate,
  ]);

  const runFormAction = (
    event: FormEvent<HTMLFormElement>,
    action: WeightFormAction,
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
      setLogs(() => (nextLog.log_date === selectedDate ? [nextLog] : []));
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
      const result = await deleteWeightLog(logId);

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
      const result = await removeWeightPhoto(logId);

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
    router.push(createWeightPath(date));
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-3 overflow-hidden pb-20 sm:space-y-4 lg:pb-0">
      <header className="flex flex-col gap-2.5 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid sm:size-11">
            <Scale className="size-4 sm:size-5" />
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
              icon={<Scale className="size-4" />}
              label={text.weight}
              value={metricText(currentLog?.weight_kg, "kg", locale)}
              sub={currentLog ? text.todayCheck : text.notLogged}
            />
            <MetricCard
              accent="emerald"
              icon={<Activity className="size-4" />}
              label={text.monthChange}
              value={
                weightDelta == null
                  ? "--"
                  : `${weightDelta > 0 ? "+" : ""}${metricText(weightDelta, "kg", locale)}`
              }
              sub={text.latestVsFirst}
            />
            <MetricCard
              accent="rose"
              icon={<Percent className="size-4" />}
              label={text.gymFat}
              value={metricText(latestMonthLog?.body_fat_pct, "%", locale)}
              sub={text.latestScan}
            />
            <MetricCard
              accent="cyan"
              icon={<Dumbbell className="size-4" />}
              label={text.gymMuscle}
              value={metricText(latestMonthLog?.muscle_kg, "kg", locale)}
              sub={text.latestScan}
            />
            <MetricCard
              accent="violet"
              icon={<Camera className="size-4" />}
              label={text.photos}
              value={metricText(photoLogs(monthLogs).length, "", locale)}
              sub={text.thisMonth}
            />
          </div>

          <Panel className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.dailyBodyCheck}
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {formatDisplayDate(selectedDate, locale)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {text.dailyHint}
                </p>
              </div>

              <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-emerald-400/15 font-bold text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Plus className="mr-2 size-4" />
                    {currentLog ? text.updateCheck : text.logBodyCheck}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                      {currentLog ? text.updateBodyCheck : text.logBodyCheck}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {text.bodyCheckDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <WeightForm
                    log={currentLog}
                    selectedDate={selectedDate}
                    pending={isPending}
                    onSubmit={(event) =>
                      runFormAction(
                        event,
                        currentLog ? updateWeightLog : createWeightLog,
                        text.saved,
                        () => setLogDialogOpen(false),
                      )
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4">
              {currentLog ? (
                <BodyCheckCard
                  log={currentLog}
                  pending={isPending}
                  onDelete={runDelete}
                  onRemovePhoto={runRemovePhoto}
                  onUpdate={(event) =>
                    runFormAction(event, updateWeightLog, text.updated)
                  }
                />
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
                  <Scale className="mx-auto size-8 text-emerald-300" />
                  <p className="mt-3 font-black text-white">
                    {text.noBodyCheck}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {text.noBodyCheckHint}
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <WeightTrendChart
            monthLogs={monthLogs}
            selectedDate={selectedDate}
            onSelectDate={goToDate}
          />

          <WeightPhotoHistoryPanel
            selectedDate={selectedDate}
            weekLogs={weekLogs}
            monthLogs={monthLogs}
            scope={photoScope}
            setScope={setPhotoScope}
            onSelectDate={goToDate}
          />
        </div>

        <aside className="space-y-4">
          <MonthlyGymScanPanel
            currentLog={currentLog}
            firstMonthLog={firstMonthLog}
            latestMonthLog={latestMonthLog}
            selectedDate={selectedDate}
            pending={isPending}
            onCompositionSubmit={(event, close) =>
              runFormAction(
                event,
                currentLog ? updateWeightLog : createWeightLog,
                text.compositionSaved,
                close,
              )
            }
          />
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
