"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ExternalLink,
  Flame,
  GraduationCap,
  HeartPulse,
  Link2,
  ListChecks,
  Minus,
  Pencil,
  Plus,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  createGoalPlan,
  deleteGoal,
  setGoalTaskStatus,
  updateGoalTaskDetails,
  updateGoalProgress,
  type ActionResult,
} from "@/app/(dashboard)/dashboard/goals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizeActionError } from "@/lib/localize-action-error";
import { localizeGeneratedTaskDescription } from "@/lib/localize-generated-content";
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
import type { GoalWithTasks } from "@/lib/queries/goals";
import type {
  GoalCategory,
  GoalDailyTaskRow,
  SkillRow,
  TaskStatus,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type SkillWithTasks = SkillRow & {
  tasks: Array<{
    id: string;
    task_date: string;
    description: string;
    duration_min: number | null;
    status: TaskStatus;
  }>;
};

type GoalsClientProps = {
  selectedDate: string;
  initialGoals: GoalWithTasks[];
  initialSkills: SkillWithTasks[];
  supabaseReady: boolean;
};

type Accent = "emerald" | "cyan" | "amber" | "violet" | "rose" | "slate";

const categoryMeta: Record<
  GoalCategory,
  {
    label: string;
    icon: ReactNode;
    accent: Accent;
    dailyPlaceholder: string;
    modules: Array<{ label: string; href: string }>;
  }
> = {
  career: {
    label: "Career",
    icon: <BriefcaseBusiness className="size-4" />,
    accent: "violet",
    dailyPlaceholder: "60 min deep work on portfolio / project",
    modules: [
      { label: "Timeline", href: "/dashboard/timeline" },
      { label: "Journal", href: "/dashboard/journal" },
    ],
  },
  finance: {
    label: "Finance",
    icon: <WalletCards className="size-4" />,
    accent: "amber",
    dailyPlaceholder: "Save 50k + review spending",
    modules: [
      { label: "Finance", href: "/dashboard/finance" },
      { label: "Timeline", href: "/dashboard/timeline" },
    ],
  },
  health: {
    label: "Health",
    icon: <HeartPulse className="size-4" />,
    accent: "emerald",
    dailyPlaceholder: "Workout 45 min + hit protein target",
    modules: [
      { label: "Workout", href: "/dashboard/workout" },
      { label: "Nutrition", href: "/dashboard/nutrition" },
      { label: "Weight", href: "/dashboard/weight" },
    ],
  },
  learning: {
    label: "Learning",
    icon: <GraduationCap className="size-4" />,
    accent: "cyan",
    dailyPlaceholder: "Learn 20 words + speak 20 min",
    modules: [
      { label: "Skills", href: "/dashboard/skills" },
      { label: "Timeline", href: "/dashboard/timeline" },
      { label: "Journal", href: "/dashboard/journal" },
    ],
  },
  other: {
    label: "Other",
    icon: <Target className="size-4" />,
    accent: "slate",
    dailyPlaceholder: "Do the smallest useful action",
    modules: [{ label: "Timeline", href: "/dashboard/timeline" }],
  },
  personal: {
    label: "Personal",
    icon: <Sparkles className="size-4" />,
    accent: "rose",
    dailyPlaceholder: "Read / reflect / practice for 30 min",
    modules: [
      { label: "Journal", href: "/dashboard/journal" },
      { label: "Timeline", href: "/dashboard/timeline" },
    ],
  },
};

const accentClasses: Record<Accent, string> = {
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-200",
  cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
  rose: "border-rose-300/20 bg-rose-400/10 text-rose-200",
  slate: "border-slate-300/15 bg-slate-400/10 text-slate-200",
  violet: "border-violet-300/20 bg-violet-400/10 text-violet-200",
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
        "lifeos-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <Label className="text-xs font-black text-slate-200">{children}</Label>;
}

function GoalMoneyInput({
  defaultValue = 0,
  name,
  quickAmounts = [1000000, 5000000, 10000000, 50000000],
}: {
  defaultValue?: number;
  name: string;
  quickAmounts?: number[];
}) {
  const [value, setValue] = useState(Math.max(0, Math.round(defaultValue)));

  return (
    <div className="space-y-2">
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          inputMode="numeric"
          value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setValue(digits ? Number(digits) : 0);
          }}
          placeholder="0"
          className="h-11 w-full rounded-xl border border-amber-300/20 bg-slate-950/70 px-3 pr-10 text-sm font-black text-amber-200 outline-none transition focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-400/10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
          ₫
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setValue((current) => current + amount)}
            className="h-8 rounded-lg border border-white/10 bg-white/[0.035] text-[10px] font-black text-slate-400 transition hover:border-amber-300/25 hover:bg-amber-400/10 hover:text-amber-200"
          >
            +{amount / 1000000}M
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalSyncedMoneyInput({
  defaultTotal = 0,
  name,
  quickAmounts = [100000, 500000, 1000000, 5000000],
  syncedAmount,
}: {
  defaultTotal?: number;
  name: string;
  quickAmounts?: number[];
  syncedAmount: number;
}) {
  const { locale } = useI18n();
  const defaultAdjustment = Math.max(
    0,
    Math.round(defaultTotal - syncedAmount),
  );
  const [adjustment, setAdjustment] = useState(defaultAdjustment);
  const total = Math.max(0, syncedAmount + adjustment);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={total} />
      <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-400">
            {locale === "vi" ? "Tài chính tự cộng" : "Synced from Finance"}
          </span>
          <span className="font-black text-cyan-200">
            {formatGoalMoney(syncedAmount)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-xs">
          <span className="font-bold text-slate-400">
            {locale === "vi" ? "Tổng lưu vào Mục tiêu" : "Total saved to Goal"}
          </span>
          <span className="font-black text-emerald-200">
            {formatGoalMoney(total)}
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          inputMode="numeric"
          value={
            adjustment
              ? new Intl.NumberFormat("vi-VN").format(adjustment)
              : ""
          }
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setAdjustment(digits ? Number(digits) : 0);
          }}
          placeholder="0"
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 pr-10 text-sm font-black text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
          ₫
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setAdjustment((current) => current + amount)}
            className="h-8 rounded-lg border border-white/10 bg-white/[0.035] text-[10px] font-black text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            +{amount / 1000000}M
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDisplayDate(dateString: string, locale: "vi" | "en") {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function dayLabel(dateString: string, locale: "vi" | "en") {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function shiftGoalDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetweenInclusive(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay).getTime();
  const end = new Date(endYear, endMonth - 1, endDay).getTime();

  return Math.floor((end - start) / 86400000) + 1;
}

function FinanceGoalHistory({
  goal,
  locale,
  selectedDate,
}: {
  goal: GoalWithTasks;
  locale: "vi" | "en";
  selectedDate: string;
}) {
  const trackedDays = Math.min(Math.max(goal.target_days ?? 30, 1), 180);
  const savedValue = Math.max(goal.current_value ?? 0, 0);
  const targetValue = Math.max(goal.target_value ?? 0, 0);
  const contributionByDate = new Map<string, number>();

  goal.contributions.forEach((transaction) => {
    const amount =
      transaction.type === "expense"
        ? -transaction.amount
        : transaction.amount;
    contributionByDate.set(
      transaction.tx_date,
      (contributionByDate.get(transaction.tx_date) ?? 0) + amount,
    );
  });

  const days = Array.from({ length: trackedDays }, (_, index) => {
    const date = shiftGoalDate(goal.start_date, index);
    return {
      amount: contributionByDate.get(date) ?? 0,
      date,
      day: index + 1,
    };
  });
  const depositedAmount = goal.contributions.reduce(
    (total, transaction) =>
      transaction.type === "expense" ? total : total + transaction.amount,
    0,
  );
  const withdrawnAmount = goal.contributions.reduce(
    (total, transaction) =>
      transaction.type === "expense" ? total + transaction.amount : total,
    0,
  );
  const transactionTotal = depositedAmount - withdrawnAmount;
  const openingAmount = Math.max(
    0,
    (goal.current_value ?? 0) - transactionTotal,
  );
  const selectedDay = Math.min(
    Math.max(daysBetweenInclusive(goal.start_date, selectedDate), 1),
    trackedDays,
  );
  const daysLeft = Math.max(trackedDays - selectedDay + 1, 1);
  const remaining = Math.max(targetValue - savedValue, 0);
  const dailyNeed = targetValue > 0 ? remaining / daysLeft : 0;
  const savedProgress =
    targetValue > 0
      ? Math.min(Math.round((savedValue / targetValue) * 100), 100)
      : 0;
  const selectedMonth = selectedDate.slice(0, 7);
  const monthNet = goal.contributions.reduce((total, transaction) => {
    if (!transaction.tx_date.startsWith(selectedMonth)) {
      return total;
    }

    return (
      total +
      (transaction.type === "expense"
        ? -transaction.amount
        : transaction.amount)
    );
  }, 0);
  const manualAmount = savedValue - transactionTotal;
  const segments = Array.from(
    { length: Math.ceil(trackedDays / 30) },
    (_, index) => {
      const startIndex = index * 30;
      const segmentDays = days.slice(startIndex, startIndex + 30);
      const amount = segmentDays.reduce((total, item) => total + item.amount, 0);
      const segmentTarget =
        targetValue > 0 ? (targetValue / trackedDays) * segmentDays.length : 0;
      const progress =
        segmentTarget > 0
          ? Math.min(
              Math.round((Math.max(amount, 0) / segmentTarget) * 100),
              100,
            )
          : 0;

      return {
        amount,
        days: segmentDays,
        endDate: segmentDays.at(-1)?.date ?? goal.start_date,
        index,
        progress,
        startDate: segmentDays[0]?.date ?? goal.start_date,
        target: segmentTarget,
      };
    },
  );

  return (
    <div className="lifeos-subpanel p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-black text-white">
            {locale === "vi"
              ? "Theo dõi quỹ tiết kiệm"
              : "Savings fund tracker"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {locale === "vi"
              ? `Mỗi ô là một ngày: số xanh là tiền nạp, số đỏ là tiền đã rút. ${trackedDays} ngày được chia thành ${segments.length} giai đoạn để dễ theo dõi.`
              : `Each cell is one day: green is money added, red is money withdrawn. ${trackedDays} days are split into ${segments.length} easy-to-read periods.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/finance?action=save&goal=${goal.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
          >
            <Plus className="size-3.5" />
            {locale === "vi" ? "Nạp tiền" : "Add money"}
          </Link>
          <Link
            href={`/dashboard/finance?action=withdraw&goal=${goal.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 text-xs font-black text-rose-200 transition hover:bg-rose-400/15"
          >
            <Minus className="size-3.5" />
            {locale === "vi" ? "Rút tiền" : "Withdraw"}
          </Link>
          <div className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1.5 text-xs font-black text-cyan-200">
            {locale === "vi" ? "Đang xem ngày" : "Viewing day"} {selectedDay}/
            {trackedDays}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.05] p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-200/70">
              {locale === "vi" ? "Tiến độ hiện tại" : "Current progress"}
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {formatGoalMoney(savedValue)}
              <span className="ml-1 text-xs font-bold text-slate-500">
                / {formatGoalMoney(targetValue)}
              </span>
            </p>
          </div>
          <p className="text-2xl font-black text-emerald-200">{savedProgress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
            style={{ width: `${savedProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: locale === "vi" ? "Đang có trong quỹ" : "In the fund",
            value: formatGoalMoney(savedValue),
            hint:
              locale === "vi"
                ? "số dư mục tiêu hiện tại"
                : "current goal balance",
            tone: "text-emerald-200",
          },
          {
            label: locale === "vi" ? "Đã nạp" : "Added",
            value: formatGoalMoney(depositedAmount),
            hint: locale === "vi" ? "giao dịch tiền vào" : "money-in records",
            tone: "text-cyan-200",
          },
          {
            label: locale === "vi" ? "Đã rút" : "Withdrawn",
            value: formatGoalMoney(withdrawnAmount),
            hint: locale === "vi" ? "giao dịch lấy tiền ra" : "money-out records",
            tone: "text-rose-200",
          },
          {
            label: locale === "vi" ? "Còn thiếu" : "Remaining",
            value: formatGoalMoney(remaining),
            hint:
              locale === "vi"
                ? `Cần khoảng ${formatGoalMoney(dailyNeed)}/ngày · Tháng ${selectedMonth}: ${formatGoalMoney(monthNet)}`
                : `About ${formatGoalMoney(dailyNeed)}/day · ${selectedMonth}: ${formatGoalMoney(monthNet)}`,
            tone: "text-violet-200",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="lifeos-subpanel p-3"
          >
            <p className="text-[11px] font-bold text-slate-500">
              {item.label}
            </p>
            <p className={cn("mt-1 truncate text-lg font-black", item.tone)}>
              {item.value}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.index}
            className="lifeos-subpanel p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">
                  {locale === "vi" ? "Giai đoạn" : "Period"} {segment.index + 1}
                  <span className="ml-2 text-xs text-slate-500">
                    {locale === "vi" ? "ngày" : "days"} {segment.index * 30 + 1}
                    –{segment.index * 30 + segment.days.length} ·{" "}
                    {segment.startDate.slice(5)} → {segment.endDate.slice(5)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {locale === "vi" ? "Biến động ròng" : "Net movement"}{" "}
                  <span
                    className={cn(
                      "font-black",
                      segment.amount < 0
                        ? "text-rose-200"
                        : "text-emerald-200",
                    )}
                  >
                    {formatGoalMoney(segment.amount)}
                  </span>
                  {segment.target > 0 ? <> / {formatGoalMoney(segment.target)}</> : null}
                </p>
              </div>
              <div className="min-w-32">
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                    style={{ width: `${segment.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] font-black text-emerald-200">
                  {segment.progress}%
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10 xl:grid-cols-[repeat(15,minmax(0,1fr))]">
              {segment.days.map((item) => (
                <div
                  key={item.date}
                  title={`${item.date}: ${formatGoalMoney(item.amount)}`}
                  className={cn(
                    "min-w-0 rounded-lg border px-1.5 py-2 text-center transition",
                    item.date === selectedDate
                      ? "border-cyan-300/60 bg-cyan-400/15 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                      : item.amount > 0
                        ? "border-emerald-300/25 bg-emerald-400/10"
                        : item.amount < 0
                          ? "border-rose-300/20 bg-rose-400/10"
                          : "border-white/[0.07] bg-white/[0.025]",
                  )}
                >
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    {locale === "vi" ? "Ngày" : "Day"} {item.day}
                  </p>
                  <p
                    className={cn(
                      "mt-1 truncate text-[10px] font-black",
                      item.amount > 0
                        ? "text-emerald-300"
                        : item.amount < 0
                          ? "text-rose-300"
                          : "text-slate-700",
                    )}
                  >
                    {item.amount ? formatGoalMoneyShort(item.amount) : "—"}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-600">
                    {item.date.slice(5)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" />
          {locale === "vi" ? "+ tiền nạp" : "+ money added"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rose-400" />
          {locale === "vi" ? "− tiền rút" : "− money withdrawn"}
        </span>
        <span>
          {locale === "vi"
            ? "Cần tiền gấp: bấm Rút tiền, không sửa số dư bằng tay."
            : "Need the money: use Withdraw instead of editing the balance."}
        </span>
      </div>

      {manualAmount !== 0 || openingAmount > 0 ? (
        <p className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-100/80">
          {locale === "vi"
            ? `Số dư ban đầu / chỉnh tay: ${formatGoalMoney(manualAmount || openingAmount)}. Phần còn lại phía trên lấy từ giao dịch Finance.`
            : `Opening balance / manual adjustment: ${formatGoalMoney(manualAmount || openingAmount)}. The rest comes from Finance transactions.`}
        </p>
      ) : null}
    </div>
  );
}

function isValidResourceUrl(
  value: string | null | undefined,
): value is string {
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

function goalCompletion(goal: GoalWithTasks) {
  const done = goal.tasks.filter((task) => task.status === "done").length;
  const skipped = goal.tasks.filter((task) => task.status === "skipped").length;
  const total = goal.tasks.length || goal.target_days || 1;
  const rate = Math.round((done / total) * 100);

  return {
    done,
    pending: total - done - skipped,
    rate,
    skipped,
    total,
  };
}

function formatGoalMoney(value: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}

function formatGoalMoneyShort(value: number | null) {
  const amount = value ?? 0;
  const absoluteAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absoluteAmount >= 1_000_000_000) {
    return `${sign}${(absoluteAmount / 1_000_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })} tỷ`;
  }

  if (absoluteAmount >= 1_000_000) {
    return `${sign}${(absoluteAmount / 1_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })}tr`;
  }

  if (absoluteAmount >= 1_000) {
    return `${sign}${Math.round(absoluteAmount / 1_000).toLocaleString(
      "vi-VN",
    )}k`;
  }

  return `${sign}${absoluteAmount.toLocaleString("vi-VN")}đ`;
}

function todayTasks(goal: GoalWithTasks, selectedDate: string) {
  return goal.tasks.filter((task) => task.task_date === selectedDate);
}

function roadmapTasks(goal: GoalWithTasks) {
  return [...goal.tasks].sort((first, second) =>
    first.task_date.localeCompare(second.task_date),
  );
}

function linkedSkillTaskForDate(goal: GoalWithTasks, date: string) {
  return (
    goal.linkedSkills
      .flatMap((skill) => skill.tasks)
      .find((task) => task.task_date === date) ?? null
  );
}

function useGoalLabels() {
  const { t } = useI18n();

  return {
    t,
    categoryLabel(category: GoalCategory) {
      if (category === "career") {
        return t("goals.categoryCareer");
      }

      if (category === "finance") {
        return t("goals.categoryFinance");
      }

      if (category === "health") {
        return t("goals.categoryHealth");
      }

      if (category === "learning") {
        return t("goals.categoryLearning");
      }

      if (category === "personal") {
        return t("goals.categoryPersonal");
      }

      return t("goals.categoryOther");
    },
    moduleLabel(href: string, fallback: string) {
      if (href.includes("/timeline")) {
        return t("nav.timeline");
      }

      if (href.includes("/journal")) {
        return t("nav.journal");
      }

      if (href.includes("/finance")) {
        return t("nav.finance");
      }

      if (href.includes("/workout")) {
        return t("nav.workout");
      }

      if (href.includes("/nutrition")) {
        return t("nav.nutrition");
      }

      if (href.includes("/weight")) {
        return t("nav.weight");
      }

      if (href.includes("/skills")) {
        return t("nav.skills");
      }

      return fallback;
    },
    statusLabel(status: TaskStatus | GoalWithTasks["status"]) {
      if (status === "done") {
        return t("goals.done");
      }

      if (status === "skipped") {
        return t("goals.skip");
      }

      if (status === "active") {
        return t("goals.active");
      }

      if (status === "completed") {
        return t("goals.completed");
      }

      if (status === "paused") {
        return t("goals.paused");
      }

      if (status === "abandoned") {
        return t("goals.abandoned");
      }

      return t("goals.pending");
    },
  };
}

function TaskResource({ note }: { note: string | null }) {
  const { t } = useI18n();

  if (!note) {
    return null;
  }

  if (isValidResourceUrl(note)) {
    return (
      <a
        href={note}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black text-cyan-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
      >
        <ExternalLink className="size-3" />
        {t("goals.lessonLink")}
      </a>
    );
  }

  return (
    <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-2 text-xs text-slate-400">
      {note}
    </p>
  );
}

function EditTaskDialog({
  onSubmit,
  pending,
  task,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>, close: () => void) => void;
  pending: boolean;
  task: GoalDailyTaskRow;
}) {
  const { t } = useGoalLabels();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="h-8 w-8 rounded-lg border-white/10 bg-slate-950/60 text-slate-300 hover:text-white"
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-cyan-300/20 bg-[#07111d] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {t("goals.editDayTask")}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {t("goals.editDayTaskHint")} {formatDisplayDate(task.task_date, locale)}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => onSubmit(event, () => setOpen(false))}
        >
          <input type="hidden" name="task_id" value={task.id} />
          <div className="grid gap-2">
            <FieldLabel>{t("goals.whatToDo")} *</FieldLabel>
            <Textarea
              name="description"
              required
              defaultValue={localizeGeneratedTaskDescription(task.description, locale)}
              placeholder={t("goals.taskDescriptionPlaceholder")}
              className="min-h-28 border-white/10 bg-slate-950/70 text-white"
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel>{t("goals.lessonLinkNote")}</FieldLabel>
            <Input
              name="note"
              defaultValue={task.note ?? ""}
              placeholder={t("goals.lessonNotePlaceholder")}
              className="h-11 border-white/10 bg-slate-950/70 text-white"
            />
            <p className="text-[11px] text-slate-500">
              {t("goals.lessonLinkHint")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border-white/10 bg-slate-950/60 font-black text-slate-200"
            >
              {t("goals.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
            >
              {pending ? t("goals.saving") : t("goals.saveDayTask")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCreateForm({
  onSubmit,
  pending,
  selectedDate,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { categoryLabel, t } = useGoalLabels();
  const { locale } = useI18n();
  const [category, setCategory] = useState<GoalCategory>("personal");
  const roadmapHint: Record<GoalCategory, { en: string; vi: string }> = {
    career: {
      vi: "Việc quan trọng → Nâng cấp năng lực → Tạo kết quả → Kết nối → Tổng kết.",
      en: "High-impact work → Skill upgrade → Output → Network → Review.",
    },
    finance: {
      vi: "Kiểm tra tiền → Chuyển khoản tiết kiệm → No-spend → Soát ngân sách → Soát nợ.",
      en: "Money check → Savings transfer → No-spend → Budget review → Debt review.",
    },
    health: {
      vi: "Tập luyện → Dinh dưỡng → Cardio → Check body → Phục hồi.",
      en: "Training → Nutrition → Cardio → Body check → Recovery.",
    },
    learning: {
      vi: "Nền tảng → Tiếp thu → Luyện tập → Đầu ra → Ôn tập → Thử thách.",
      en: "Foundation → Input → Practice → Output → Review → Challenge.",
    },
    other: {
      vi: "Bắt đầu nhỏ → Lặp lại → Theo dõi → Cải thiện → Tổng kết.",
      en: "Start small → Repeat → Track → Improve → Review.",
    },
    personal: {
      vi: "Làm rõ → Thực hiện → Suy ngẫm → Điều chỉnh môi trường → Tổng kết.",
      en: "Clarity → Practice → Reflect → Adjust environment → Review.",
    },
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <FieldLabel>{t("goals.goalTitle")} *</FieldLabel>
        <Input
          name="title"
          required
          placeholder={t("goals.goalTitlePlaceholder")}
          className="h-11 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <FieldLabel>{t("goals.category")}</FieldLabel>
          <select
            name="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as GoalCategory)
            }
            className="h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300/50"
          >
            {Object.keys(categoryMeta).map((value) => (
              <option key={value} value={value}>
                {categoryLabel(value as GoalCategory)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <FieldLabel>{t("goals.startDate")}</FieldLabel>
          <Input
            name="start_date"
            type="date"
            defaultValue={selectedDate}
            required
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel>{t("goals.targetDays")}</FieldLabel>
          <Input
            name="target_days"
            type="number"
            min="1"
            max="365"
            defaultValue="30"
            required
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>

      {category === "finance" ? (
        <div className="grid gap-3 rounded-xl border border-amber-300/20 bg-amber-400/[0.07] p-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel>
              {locale === "vi"
                ? "Số tiền mục tiêu cần tiết kiệm *"
                : "Savings target *"}
            </FieldLabel>
            <GoalMoneyInput
              name="target_value"
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel>
              {locale === "vi"
                ? "Đã tiết kiệm trước đó"
                : "Already saved"}
            </FieldLabel>
            <GoalMoneyInput
              name="current_value"
              defaultValue={0}
              quickAmounts={[100000, 500000, 1000000, 5000000]}
            />
          </div>
          <input type="hidden" name="unit" value="VND" />
          <p className="text-[11px] text-amber-100/70 sm:col-span-2">
            {locale === "vi"
              ? "Tiền chuyển vào ví được liên kết trong Finance sẽ tự cộng vào tiến độ này."
              : "Money transferred to the linked wallet in Finance automatically updates this progress."}
          </p>
        </div>
      ) : null}

      {category === "finance" ? (
        <input
          type="hidden"
          name="daily_task"
          value="Transfer money into the linked savings wallet"
        />
      ) : (
        <div className="grid gap-2">
          <FieldLabel>{t("goals.coreHabit")} *</FieldLabel>
          <Input
            name="daily_task"
            required
            placeholder={categoryMeta[category].dailyPlaceholder}
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
          <p className="text-[11px] text-slate-500">
            {t("goals.coreHabitHint")}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
          {t("goals.roadmapLogic")}
        </p>
        <div className="mt-3 text-xs text-slate-300">
          <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
            <p className="font-black text-emerald-200">
              {categoryLabel(category)}
            </p>
            <p className="mt-1">
              {category === "finance"
                ? locale === "vi"
                  ? "Goal không cần tick từng ngày. Tiến độ chỉ tăng khi bạn chuyển tiền vào ví tiết kiệm được liên kết trong Finance."
                  : "No daily check-ins. Progress only increases when money is transferred into the linked savings wallet in Finance."
                : roadmapHint[category][locale]}
            </p>
          </div>
        </div>
      </div>

      {category !== "finance" ? (
        <div className="grid gap-2">
          <FieldLabel>{t("goals.weeklyFocus")}</FieldLabel>
          <Input
            name="weekly_focus"
            placeholder={t("goals.weeklyFocusPlaceholder")}
            className="h-11 border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      ) : null}

      {category === "learning" ? (
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3">
          <label className="flex items-start gap-3 text-sm font-bold text-white">
            <input
              name="link_skill"
              type="checkbox"
              defaultChecked
              className="mt-1 size-4 accent-cyan-300"
            />
            <span>
              {t("goals.linkToSkills")}
              <span className="mt-1 block text-xs font-medium text-slate-400">
                {t("goals.linkToSkillsHint")}
              </span>
            </span>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_120px]">
            <Input
              name="skill_name"
              placeholder={t("goals.skillNamePlaceholder")}
              className="h-10 border-white/10 bg-slate-950/70 text-white"
            />
            <Input
              name="skill_duration_min"
              type="number"
              min="0"
              max="1440"
              defaultValue="30"
              className="h-10 border-white/10 bg-slate-950/70 text-white"
            />
            <select
              name="skill_level"
              defaultValue="beginner"
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none"
            >
              <option value="beginner">{t("goals.beginner")}</option>
              <option value="intermediate">{t("goals.intermediate")}</option>
              <option value="advanced">{t("goals.advanced")}</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2">
        <FieldLabel>{t("goals.description")}</FieldLabel>
        <Textarea
          name="description"
          placeholder={t("goals.descriptionPlaceholder")}
          className="min-h-24 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? t("goals.creating") : t("goals.createGoalPlan")}
      </Button>
    </form>
  );
}

function TaskStatusButton({
  children,
  disabled,
  onClick,
  status,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  status: TaskStatus;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={status === "done" ? "default" : "outline"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg text-xs font-black",
        status === "done"
          ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/25"
          : status === "skipped"
            ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
            : "border-white/10 bg-slate-950/60 text-slate-300",
      )}
    >
      {children}
    </Button>
  );
}

function GoalCard({
  goal,
  onDelete,
  onTaskDetailsSubmit,
  onProgressSubmit,
  onTaskStatus,
  pending,
  selectedDate,
}: {
  goal: GoalWithTasks;
  onDelete: (goalId: string) => void;
  onTaskDetailsSubmit: (
    event: FormEvent<HTMLFormElement>,
    close: () => void,
  ) => void;
  onProgressSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTaskStatus: (task: GoalDailyTaskRow, status: TaskStatus) => void;
  pending: boolean;
  selectedDate: string;
}) {
  const { categoryLabel, moduleLabel, statusLabel, t } = useGoalLabels();
  const { locale } = useI18n();
  const meta = categoryMeta[goal.category];
  const progress = goalCompletion(goal);
  const isFinanceGoal = goal.category === "finance";
  const moneyProgress =
    isFinanceGoal && goal.target_value
      ? Math.min(
          100,
          Math.round(((goal.current_value ?? 0) / goal.target_value) * 100),
        )
      : progress.rate;
  const financeTransactionTotal = goal.contributions.reduce(
    (total, transaction) =>
      total +
      (transaction.type === "expense"
        ? -transaction.amount
        : transaction.amount),
    0,
  );
  const financeManualAdjustment = (goal.current_value ?? 0) - financeTransactionTotal;
  const linkedWalletBalance = goal.linkedWallets.reduce(
    (total, wallet) => total + wallet.balance,
    0,
  );
  const tasksToday = todayTasks(goal, selectedDate);
  const roadmap = roadmapTasks(goal);

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),rgba(15,23,42,0.38)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl border",
                  accentClasses[meta.accent],
                )}
              >
                {meta.icon}
              </span>
              <Badge
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-black",
                  accentClasses[meta.accent],
                )}
              >
                {categoryLabel(goal.category)}
              </Badge>
              <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-black text-slate-300">
                {statusLabel(goal.status)}
              </Badge>
              {goal.linkedSkills.length > 0 ? (
                <Badge className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black text-cyan-200">
                  {goal.linkedSkills.length} {t("goals.linkedSkills")}
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight text-white">
              {goal.title}
            </h2>
            {goal.description ? (
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                {goal.description}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            disabled={pending}
            onClick={() => onDelete(goal.id)}
            className="self-start border-rose-300/20"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="lifeos-subpanel p-3">
              <p className="text-xs text-slate-400">
                {isFinanceGoal
                  ? locale === "vi"
                    ? "Đã tiết kiệm"
                    : "Saved"
                  : t("goals.dailyPlan")}
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {isFinanceGoal
                  ? formatGoalMoney(goal.current_value)
                  : `${progress.done}/${progress.total}`}
              </p>
              {isFinanceGoal ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  {locale === "vi"
                    ? "Cộng từ giao dịch Finance"
                    : "Synced from Finance transactions"}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-3">
              <p className="text-xs text-slate-400">
                {isFinanceGoal
                  ? locale === "vi"
                    ? "Tiến độ tiết kiệm"
                    : "Savings progress"
                  : t("goals.completion")}
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-200">
                {moneyProgress}%
              </p>
              {isFinanceGoal ? (
                <p className="mt-1 text-[11px] font-bold text-emerald-100/70">
                  {formatGoalMoney(goal.current_value)} /{" "}
                  {formatGoalMoney(goal.target_value)}
                </p>
              ) : null}
            </div>
          </div>

          {!isFinanceGoal ? (
            <>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white">{t("goals.todayAction")}</h3>
              <Link
                href={`/dashboard/timeline?date=${selectedDate}`}
                className="inline-flex items-center gap-1 text-xs font-black text-cyan-200 hover:text-cyan-100"
              >
                {t("goals.openTimeline")} <ArrowRight className="size-3" />
              </Link>
            </div>
            {tasksToday.length > 0 ? (
              <div className="space-y-2">
                {tasksToday.map((task) => {
                  const studyTask = linkedSkillTaskForDate(goal, task.task_date);

                  return (
                  <div
                    key={task.id}
                    className={cn(
                      "grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto]",
                      task.status === "done"
                        ? "border-emerald-300/25 bg-emerald-400/10"
                        : task.status === "skipped"
                          ? "border-amber-300/25 bg-amber-400/10"
                          : "border-white/10 bg-slate-950/50",
                    )}
                  >
                    <div>
                      <p className="text-sm font-black text-white">
                        {localizeGeneratedTaskDescription(task.description, locale)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDisplayDate(task.task_date, locale)} · {statusLabel(task.status)}
                      </p>
                      <TaskResource note={task.note} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {studyTask ? (
                        <Link
                          href={`/dashboard/skills/task/${studyTask.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-black text-cyan-200"
                        >
                          <BookOpen className="size-3" />
                          {t("goals.studyDay")}
                        </Link>
                      ) : null}
                      <EditTaskDialog
                        task={task}
                        pending={pending}
                        onSubmit={onTaskDetailsSubmit}
                      />
                      <TaskStatusButton
                        disabled={pending}
                        status="done"
                        onClick={() => onTaskStatus(task, "done")}
                      >
                        <Check className="mr-1 size-3" />
                        {t("goals.done")}
                      </TaskStatusButton>
                      <TaskStatusButton
                        disabled={pending}
                        status="skipped"
                        onClick={() => onTaskStatus(task, "skipped")}
                      >
                        <SkipForward className="mr-1 size-3" />
                        {t("goals.skip")}
                      </TaskStatusButton>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center">
                <ListChecks className="mx-auto size-7 text-slate-500" />
                <p className="mt-2 text-sm font-bold text-white">
                  {t("goals.noTaskDate")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("goals.noTaskDateHint")}
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  {t("goals.dayRoadmap")}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("goals.dayRoadmapHint")}
                </p>
              </div>
              <Badge className="rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-black text-slate-300">
                {roadmap.length} {t("goals.days")}
              </Badge>
            </div>
            {roadmap.length > 0 ? (
              <div className="grid max-h-96 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {roadmap.map((task, index) => {
                  const studyTask = linkedSkillTaskForDate(goal, task.task_date);

                  return (
                  <div
                    key={task.id}
                    className={cn(
                      "grid gap-3 rounded-xl border p-2.5 sm:grid-cols-[70px_74px_1fr_auto] sm:items-center",
                      task.task_date === selectedDate
                        ? "border-cyan-300/30 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03]",
                    )}
                  >
                    <span className="text-xs font-black text-emerald-200">
                      {t("goals.day")} {index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-400">
                      {dayLabel(task.task_date, locale)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {localizeGeneratedTaskDescription(task.description, locale)}
                      </p>
                      <TaskResource note={task.note} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {isValidResourceUrl(task.note) ? (
                        <a
                          href={task.note}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
                          aria-label={t("goals.lessonLink")}
                        >
                          <Link2 className="size-3.5" />
                        </a>
                      ) : null}
                      {studyTask ? (
                        <Link
                          href={`/dashboard/skills/task/${studyTask.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-black text-cyan-200"
                        >
                          <BookOpen className="size-3" />
                          {t("goals.study")}
                        </Link>
                      ) : null}
                      <EditTaskDialog
                        task={task}
                        pending={pending}
                        onSubmit={onTaskDetailsSubmit}
                      />
                      <span
                        className={cn(
                          "w-fit rounded-full px-2 py-1 text-[10px] font-black uppercase",
                          task.status === "done"
                            ? "bg-emerald-400/15 text-emerald-200"
                            : task.status === "skipped"
                              ? "bg-amber-400/15 text-amber-200"
                              : "bg-white/[0.06] text-slate-400",
                        )}
                      >
                        {statusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center text-sm font-bold text-slate-400">
                {t("goals.noRoadmap")}
              </div>
            )}
          </div>
            </>
          ) : (
            <>
            <div className="rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_42%),rgba(251,191,36,0.05)] p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/20 bg-amber-400/10 text-amber-300">
                  <WalletCards className="size-5" />
                </div>
                <div>
                  <h3 className="font-black text-white">
                    {locale === "vi"
                      ? "Tiến độ lấy từ quỹ tiết kiệm"
                      : "Progress comes from your savings wallet"}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {locale === "vi"
                      ? "Mở Finance, tạo hoặc chọn một ví tiết kiệm và gắn Goal này. Mỗi lần dùng giao dịch “Tiết kiệm” để chuyển tiền vào ví, số tiền đã góp và phần trăm ở đây sẽ tự tăng."
                      : "Open Finance, create or select a savings wallet and link this Goal. Each Save transfer into that wallet automatically increases the saved amount and percentage here."}
                  </p>
                  <Link
                    href="/dashboard/finance"
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"
                  >
                    {locale === "vi"
                      ? "Mở Finance và gắn ví"
                      : "Open Finance and link wallet"}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
            <FinanceGoalHistory
              goal={goal}
              locale={locale}
              selectedDate={selectedDate}
            />
            </>
          )}
        </div>

        <aside className="space-y-3">
          <form
            onSubmit={onProgressSubmit}
            className="lifeos-subpanel p-3"
          >
            <input type="hidden" name="goal_id" value={goal.id} />
            <p className="text-sm font-black text-white">
              {isFinanceGoal
                ? locale === "vi"
                  ? "Đồng bộ tiết kiệm"
                  : "Savings sync"
                : t("goals.updateProgress")}
            </p>
            <div className="mt-3 grid gap-2">
              {isFinanceGoal ? (
                <>
                  <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] p-3">
                    <p className="text-[11px] font-bold text-slate-400">
                      {locale === "vi" ? "Đã tiết kiệm" : "Saved"}
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-200">
                      {formatGoalMoney(goal.current_value)}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      {locale === "vi"
                        ? "Tăng tự động khi tạo giao dịch Tiết kiệm / chuyển tiền vào ví gắn Goal."
                        : "Auto-increases from Save transfers into a linked Goal wallet."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/finance?action=save&goal=${goal.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      <Plus className="size-3.5" />
                      {locale === "vi" ? "Nạp tiền" : "Add money"}
                    </Link>
                    <Link
                      href={`/dashboard/finance?action=withdraw&goal=${goal.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 text-xs font-black text-rose-200 transition hover:bg-rose-400/15"
                    >
                      <Minus className="size-3.5" />
                      {locale === "vi" ? "Rút tiền" : "Withdraw"}
                    </Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
                      <p className="text-[11px] font-bold text-slate-400">
                        {locale === "vi" ? "Từ giao dịch" : "Transactions"}
                      </p>
                      <p className="mt-1 font-black text-cyan-200">
                        {formatGoalMoney(financeTransactionTotal)}
                      </p>
                    </div>
                    <div className="lifeos-subpanel p-3">
                      <p className="text-[11px] font-bold text-slate-400">
                        {locale === "vi" ? "Ví gắn Goal" : "Linked wallets"}
                      </p>
                      <p className="mt-1 font-black text-white">
                        {goal.linkedWallets.length
                          ? `${goal.linkedWallets.length} ví`
                          : locale === "vi"
                            ? "Chưa gắn"
                            : "None"}
                      </p>
                    </div>
                  </div>
                  {goal.linkedWallets.length > 0 ? (
                    <div className="lifeos-subpanel space-y-1.5 p-3">
                      {goal.linkedWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="truncate font-bold text-slate-300">
                            {wallet.name}
                          </span>
                          <span className="shrink-0 font-black text-emerald-200">
                            {formatGoalMoney(wallet.balance)}
                          </span>
                        </div>
                      ))}
                      <p className="border-t border-white/10 pt-2 text-[10px] text-slate-500">
                        {locale === "vi"
                          ? `Số dư ví hiện tại: ${formatGoalMoney(linkedWalletBalance)}`
                          : `Current linked wallet balance: ${formatGoalMoney(linkedWalletBalance)}`}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href="/dashboard/finance"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 text-xs font-black text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-400/15"
                    >
                      {locale === "vi"
                        ? "Gắn ví trong Finance"
                        : "Link wallet in Finance"}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                  <details className="lifeos-subpanel p-3">
                    <summary className="cursor-pointer text-[11px] font-black text-slate-400">
                      {locale === "vi"
                        ? "Chỉnh số dư gốc (chỉ khi nhập sai)"
                        : "Adjust opening balance (corrections only)"}
                    </summary>
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] leading-4 text-amber-100/70">
                        {locale === "vi"
                          ? "Không dùng mục này khi lấy tiền ra. Hãy bấm Rút tiền để hệ thống lưu đúng lịch sử."
                          : "Do not use this when taking money out. Use Withdraw so the history remains accurate."}
                      </p>
                      <GoalSyncedMoneyInput
                        name="current_value"
                        defaultTotal={goal.current_value ?? 0}
                        syncedAmount={financeTransactionTotal}
                        quickAmounts={[100000, 500000, 1000000, 5000000]}
                      />
                      {financeManualAdjustment > 0 ? (
                        <p className="text-[10px] leading-4 text-cyan-100/70">
                          {locale === "vi"
                            ? `${formatGoalMoney(financeManualAdjustment)} hiện là số dư ban đầu/chỉnh tay, không phải giao dịch.`
                            : `${formatGoalMoney(financeManualAdjustment)} is opening/manual balance, not a transaction.`}
                        </p>
                      ) : null}
                    </div>
                  </details>
                  <label className="text-[11px] font-bold text-slate-400">
                    {locale === "vi" ? "Mục tiêu tiền" : "Money target"}
                  </label>
                  <GoalMoneyInput
                    name="target_value"
                    defaultValue={goal.target_value ?? 0}
                  />
                </>
              ) : null}
              <select
                name="status"
                defaultValue={goal.status}
                className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none"
              >
                <option value="active">{t("goals.active")}</option>
                <option value="completed">{t("goals.completed")}</option>
                <option value="paused">{t("goals.paused")}</option>
                <option value="abandoned">{t("goals.abandoned")}</option>
              </select>
              <Button
                type="submit"
                disabled={pending}
                className="h-10 rounded-xl bg-white/[0.06] font-black text-white hover:bg-white/[0.09]"
              >
                {t("goals.saveProgress")}
              </Button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                style={{ width: `${moneyProgress}%` }}
              />
            </div>
          </form>

          <div className="lifeos-subpanel p-3">
            <p className="text-sm font-black text-white">{t("goals.linkedModules")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
                >
                  {moduleLabel(module.href, module.label)}
                </Link>
              ))}
            </div>
          </div>

          {goal.category === "learning" ? (
            <div className="lifeos-subpanel p-3">
            <p className="text-sm font-black text-white">{t("goals.linkedSkillsTitle")}</p>
            {goal.linkedSkills.length > 0 ? (
              <div className="mt-3 space-y-2">
                {goal.linkedSkills.map((skill) => {
                  const done = skill.tasks.filter(
                    (task) => task.status === "done",
                  ).length;

                  return (
                    <Link
                      key={skill.id}
                      href="/dashboard/skills"
                      className="block rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-3 transition hover:border-cyan-300/35"
                    >
                      <p className="font-black text-cyan-100">{skill.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {done}/{skill.tasks.length || skill.target_days || 0} {t("goals.practices")}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                {t("goals.noLinkedSkill")}
              </p>
            )}
            </div>
          ) : null}
        </aside>
      </div>
    </Panel>
  );
}

export function GoalsClient({
  selectedDate,
  initialGoals,
  initialSkills,
  supabaseReady,
}: GoalsClientProps) {
  const router = useRouter();
  const { t } = useGoalLabels();
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeGoals = initialGoals.filter((goal) => goal.status === "active");
  const todayGoalTasks = initialGoals.flatMap((goal) =>
    todayTasks(goal, selectedDate),
  );
  const doneToday = todayGoalTasks.filter((task) => task.status === "done").length;
  const linkedSkillCount = useMemo(
    () =>
      new Set(
        initialGoals.flatMap((goal) => goal.linkedSkills.map((skill) => skill.id)),
      ).size,
    [initialGoals],
  );

  const runFormAction = <T,>(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<ActionResult<T>>,
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

  const runTaskStatus = (task: GoalDailyTaskRow, status: TaskStatus) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await setGoalTaskStatus(task.id, status);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      setMessage(t("goals.taskMarked"));
      router.refresh();
    });
  };

  const runDelete = (goalId: string) => {
    if (
      !window.confirm(
        t("goals.deleteConfirm"),
      )
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await deleteGoal(goalId);

      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }

      setMessage(t("goals.goalDeleted"));
      router.refresh();
    });
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-4 overflow-hidden pb-20 lg:pb-0">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-11 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.18)] sm:grid">
            <Target className="size-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
              {t("goals.badge")}
            </p>
            <h1 className="mt-1 text-[1.8rem] font-black leading-none tracking-tight text-white sm:text-3xl">
              {t("goals.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("goals.subtitle")}
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] px-5 font-black text-slate-950 hover:opacity-90">
              <Plus className="mr-2 size-4" />
              {t("goals.newGoal")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] overflow-y-auto border-emerald-300/20 bg-[#07111d] text-white sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {t("goals.createTitle")}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {t("goals.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <GoalCreateForm
              selectedDate={selectedDate}
              pending={isPending}
              onSubmit={(event) =>
                runFormAction(event, createGoalPlan, t("goals.goalCreated"), () =>
                  setDialogOpen(false),
                )
              }
            />
          </DialogContent>
        </Dialog>
      </header>

      {!supabaseReady ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {t("goals.demoMode")}
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

      <div className="grid gap-3 sm:grid-cols-4">
        <Panel className="p-4">
          <Flame className="size-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {activeGoals.length}
          </p>
          <p className="text-xs text-slate-500">{t("goals.activeGoals")}</p>
        </Panel>
        <Panel className="p-4">
          <ListChecks className="size-5 text-cyan-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {doneToday}/{todayGoalTasks.length}
          </p>
          <p className="text-xs text-slate-500">{t("goals.goalTasksToday")}</p>
        </Panel>
        <Panel className="p-4">
          <GraduationCap className="size-5 text-violet-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {linkedSkillCount}/{initialSkills.length}
          </p>
          <p className="text-xs text-slate-500">{t("goals.linkedSkills")}</p>
        </Panel>
        <Panel className="p-4">
          <CalendarDays className="size-5 text-amber-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {formatDisplayDate(selectedDate, locale).split(",")[0]}
          </p>
          <p className="text-xs text-slate-500">{t("goals.selectedDate")}</p>
        </Panel>
      </div>

      {initialGoals.length > 0 ? (
        <div className="space-y-4">
          {initialGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              selectedDate={selectedDate}
              pending={isPending}
              onDelete={runDelete}
              onTaskDetailsSubmit={(event, close) =>
                runFormAction(
                  event,
                  updateGoalTaskDetails,
                  t("goals.dayTaskUpdated"),
                  close,
                )
              }
              onTaskStatus={runTaskStatus}
              onProgressSubmit={(event) =>
                runFormAction(event, updateGoalProgress, t("goals.goalProgressSaved"))
              }
            />
          ))}
        </div>
      ) : (
        <Panel className="p-8 text-center">
          <BookOpen className="mx-auto size-10 text-slate-500" />
          <h2 className="mt-3 text-2xl font-black text-white">
            {t("goals.noGoals")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            {t("goals.noGoalsHint")}
          </p>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-5 h-11 rounded-xl bg-emerald-400/15 font-black text-emerald-200 hover:bg-emerald-400/20"
          >
            <Plus className="mr-2 size-4" />
            {t("goals.createFirstGoal")}
          </Button>
        </Panel>
      )}

      <Panel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              {t("goals.howItLinks")}
            </p>
            <h2 className="mt-1 text-lg font-black text-white">
              {t("goals.linkFlow")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("goals.linkHint")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/timeline?date=${selectedDate}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-black text-cyan-200"
            >
              {t("nav.timeline")} <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/skills"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm font-black text-violet-200"
            >
              {t("nav.skills")} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
