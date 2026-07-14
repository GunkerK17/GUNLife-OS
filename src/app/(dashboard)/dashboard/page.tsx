import Link from "next/link";
import { cookies } from "next/headers";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  ImagePlus,
  ListChecks,
  NotebookPen,
  Scale,
  SkipForward,
  Target,
  Utensils,
  WalletCards,
} from "lucide-react";
import { DashboardAnalyticsCard } from "@/components/dashboard/dashboard-analytics-card";
import { setTimelineLogStatus } from "@/app/(dashboard)/dashboard/timeline/actions";
import {
  addWorkoutLogPhoto,
  createWorkoutLog,
} from "@/app/(dashboard)/dashboard/workout/actions";
import { Button } from "@/components/ui/button";
import {
  getBangkokDateString,
  getTimelinePageData,
} from "@/lib/queries/timeline";
import {
  getWorkoutPageData,
  type WorkoutPageData,
} from "@/lib/queries/workout";
import {
  getFinancePageData,
  type FinancePageData,
} from "@/lib/queries/finance";
import {
  getDashboardAnalytics,
  type DashboardAnalyticsData,
} from "@/lib/queries/dashboard-analytics";
import {
  getDashboardDailySummary,
  type DashboardDailySummary,
} from "@/lib/queries/dashboard-summary";
import type {
  TimelineLogRow,
  TransactionRow,
  WalletRow,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import {
  localizeGeneratedTaskDescription,
  localizeGeneratedTimelineNote,
} from "@/lib/localize-generated-content";

type DashboardPageProps = {
  searchParams?: {
    date?: string;
  };
};

type TimelineSummary = {
  total: number;
  done: number;
  pending: number;
  skipped: number;
  doneMinutes: number;
  rate: number;
};

type WorkoutSummary = {
  sessions: number;
  calories: number;
  durationMin: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  latestName: string;
  latestNote: string | null;
  latestImageUrl: string | null;
  latestLog: WorkoutPageData["logs"][number] | null;
  planId: string | null;
  exercises: WorkoutPageData["plans"][number]["exercises"];
};

const dashboardCopy = {
  en: {
    active: "active",
    activeAccounts: "active accounts",
    activeGoals: "active goals",
    activeTime: "Active time",
    activities: "Activities",
    assets: "Assets",
    avgHr: "Avg HR",
    badge: "Dashboard",
    blocks: "blocks",
    blocksSkipped: "blocks skipped",
    bodyFat: "Body fat",
    calories: "Calories",
    carbs: "Carbs",
    change: "Change",
    chooseWorkoutPhoto: "Choose workout photo",
    completedBlocks: "completed blocks",
    completion: "Completion",
    control: "Control",
    dailyBalance: "daily balance",
    dailyBlocks: "Daily blocks",
    debt: "Debt",
    deepWork: "Deep work",
    detail: "Detail",
    distance: "Distance",
    done: "Done",
    doneDuration: "done duration",
    energyIn: "Energy in",
    entrySaved: "Entry saved",
    exercises: "exercises",
    fat: "Fat",
    finance: "Finance",
    focusTime: "Focus time",
    goals: "Goals",
    hr: "HR",
    kcalBurned: "kcal burned",
    latest: "Latest",
    lifeScore: "Life score",
    markWorkoutDone: "Mark workout done",
    maxHr: "Max HR",
    mealsOn: "meals on",
    mood: "Mood",
    muscle: "Muscle",
    netMoney: "Net money",
    noCheckin: "No check-in yet",
    noData: "No data",
    noDuration: "No duration",
    noTimelineBlocks: "No timeline blocks yet",
    noWorkout: "No workout",
    noWorkoutOn: "No workout on",
    notLogged: "Not logged",
    open: "Open",
    openTimelineHint: "Open Timeline to add blocks for this day.",
    pending: "pending",
    positive: "Positive",
    protein: "Protein",
    reflectDay: "Reflect and close the day",
    review: "Review",
    saveWorkoutPhoto: "Save workout photo",
    session: "session",
    sessions: "sessions",
    skip: "Skip",
    skipped: "Skipped",
    status: "Status",
    statusDone: "done",
    statusPending: "pending",
    statusSkipped: "skipped",
    subtitle: "One calendar controls every daily stat",
    tickDoneHint: "Tick done to create a workout log and sync Timeline.",
    time: "Time",
    timeline: "Timeline",
    timelineBlocks: "Timeline Blocks",
    title: "GunLifeOS overview",
    today: "Today",
    trackedActivities: "tracked activities",
    undo: "Undo",
    view: "View",
    waiting: "waiting",
    walletsAccounts: "wallets and accounts",
    weight: "Weight",
    workout: "Workout",
    workoutCompleted: "Workout completed",
    workoutLogged: "Workout logged",
    workoutPhoto: "Workout photo",
    writeToday: "Write today",
    journal: "Journal",
    nutrition: "Nutrition",
  },
  vi: {
    active: "đang hoạt động",
    activeAccounts: "tài khoản đang dùng",
    activeGoals: "mục tiêu đang chạy",
    activeTime: "Thời gian vận động",
    activities: "Hoạt động",
    assets: "Tài sản",
    avgHr: "Nhịp tim TB",
    badge: "Tổng quan",
    blocks: "khối",
    blocksSkipped: "khối đã bỏ qua",
    bodyFat: "Mỡ cơ thể",
    calories: "Calo",
    carbs: "Tinh bột",
    change: "Thay đổi",
    chooseWorkoutPhoto: "Chọn ảnh tập luyện",
    completedBlocks: "khối đã hoàn thành",
    completion: "Hoàn thành",
    control: "Kiểm soát",
    dailyBalance: "cân bằng trong ngày",
    dailyBlocks: "Lịch trong ngày",
    debt: "Nợ",
    deepWork: "Tập trung sâu",
    detail: "Chi tiết",
    distance: "Quãng đường",
    done: "Xong",
    doneDuration: "thời gian đã hoàn thành",
    energyIn: "Năng lượng nạp",
    entrySaved: "Đã ghi nhật ký",
    exercises: "bài tập",
    fat: "Chất béo",
    finance: "Tài chính",
    focusTime: "Thời gian tập trung",
    goals: "Mục tiêu",
    hr: "Nhịp tim",
    kcalBurned: "kcal đã đốt",
    latest: "Gần nhất",
    lifeScore: "Điểm sống",
    markWorkoutDone: "Đánh dấu đã tập xong",
    maxHr: "Nhịp tim tối đa",
    mealsOn: "bữa ăn trong",
    mood: "Tâm trạng",
    muscle: "Cơ",
    netMoney: "Tài sản ròng",
    noCheckin: "Chưa check-in",
    noData: "Chưa có dữ liệu",
    noDuration: "Chưa có thời lượng",
    noTimelineBlocks: "Ngày này chưa có lịch",
    noWorkout: "Chưa có buổi tập",
    noWorkoutOn: "Chưa có buổi tập vào",
    notLogged: "Chưa ghi",
    open: "Mở",
    openTimelineHint: "Mở Lịch ngày để thêm công việc cho hôm nay.",
    pending: "đang chờ",
    positive: "Tích cực",
    protein: "Đạm",
    reflectDay: "Nhìn lại và khép lại ngày hôm nay",
    review: "Cần xem lại",
    saveWorkoutPhoto: "Lưu ảnh tập luyện",
    session: "buổi",
    sessions: "buổi",
    skip: "Bỏ qua",
    skipped: "Đã bỏ qua",
    status: "Trạng thái",
    statusDone: "xong",
    statusPending: "đang chờ",
    statusSkipped: "đã bỏ qua",
    subtitle: "Một lịch chung điều khiển toàn bộ chỉ số trong ngày",
    tickDoneHint: "Đánh dấu xong để tạo nhật ký tập và đồng bộ Lịch ngày.",
    time: "Thời gian",
    timeline: "Lịch ngày",
    timelineBlocks: "Các khối lịch",
    title: "Tổng quan GunLifeOS",
    today: "Hôm nay",
    trackedActivities: "hoạt động đã ghi",
    undo: "Hoàn tác",
    view: "Xem",
    waiting: "đang chờ",
    walletsAccounts: "ví và tài khoản",
    weight: "Cân nặng",
    workout: "Tập luyện",
    workoutCompleted: "Đã hoàn thành buổi tập",
    workoutLogged: "Đã ghi buổi tập",
    workoutPhoto: "Ảnh tập luyện",
    writeToday: "Viết hôm nay",
    journal: "Nhật ký",
    nutrition: "Dinh dưỡng",
  },
} as const;

type DashboardCopy = (typeof dashboardCopy)[Locale];

async function updateDashboardTimelineStatus(formData: FormData) {
  "use server";

  const logId = formData.get("logId");
  const status = formData.get("status");

  if (
    typeof logId !== "string" ||
    (status !== "done" && status !== "skipped" && status !== "pending")
  ) {
    return;
  }

  await setTimelineLogStatus(logId, status);
}

async function uploadDashboardWorkoutPhoto(formData: FormData) {
  "use server";

  await addWorkoutLogPhoto(formData);
}

async function completeDashboardWorkout(formData: FormData) {
  "use server";

  await createWorkoutLog(formData);
}

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
        "min-w-0 max-w-full rounded-2xl border border-white/10 bg-slate-950/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatShortDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatTime(value: string | null, locale: Locale) {
  if (!value) {
    return locale === "vi" ? "Linh hoạt" : "Anytime";
  }

  const [hour, minute] = value.split(":");
  return `${hour}:${minute}`;
}

function durationLabel(
  minutes: number | null,
  locale: Locale,
  text: DashboardCopy,
) {
  if (!minutes) {
    return text.noDuration;
  }

  if (minutes < 60) {
    return locale === "vi" ? `${minutes} phút` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (locale === "vi") {
    return remainingMinutes
      ? `${hours} giờ ${remainingMinutes} phút`
      : `${hours} giờ`;
  }

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function focusTimeLabel(minutes: number, locale: Locale) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return locale === "vi"
    ? `${hours} giờ ${String(remainingMinutes).padStart(2, "0")} phút`
    : `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

function financeWalletMovement(
  walletId: string,
  transactions: TransactionRow[],
) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "income" && transaction.wallet_id === walletId) {
      return total + transaction.amount;
    }

    if (transaction.type === "expense" && transaction.wallet_id === walletId) {
      return total - transaction.amount;
    }

    if (transaction.type === "transfer") {
      if (transaction.wallet_id === walletId) {
        return total - transaction.amount;
      }

      if (transaction.destination_wallet_id === walletId) {
        return total + transaction.amount;
      }
    }

    return total;
  }, 0);
}

function financeWalletValue(
  wallet: WalletRow,
  transactions: TransactionRow[],
) {
  const movement = financeWalletMovement(wallet.id, transactions);

  return wallet.type === "credit"
    ? Math.max(0, wallet.balance - movement)
    : wallet.balance + movement;
}

function formatCompactVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function ratioPercent(current: number, target: number) {
  return target > 0 ? clampPercent((current / target) * 100) : 0;
}

function buildFinanceSummary(data: FinancePageData) {
  const activeWallets = data.wallets.filter((wallet) => wallet.is_active);
  const assets = activeWallets
    .filter((wallet) => wallet.type !== "credit")
    .reduce(
      (total, wallet) => total + financeWalletValue(wallet, data.transactions),
      0,
    );
  const debt = activeWallets
    .filter((wallet) => wallet.type === "credit")
    .reduce(
      (total, wallet) => total + financeWalletValue(wallet, data.transactions),
      0,
    );

  return {
    accounts: activeWallets.length,
    assets,
    debt,
    net: assets - debt,
  };
}

function weekdayFromDate(dateString: string) {
  return new Date(`${dateString}T00:00:00+07:00`).getDay();
}

function planMatchesDate(
  plan: WorkoutPageData["plans"][number],
  selectedDate: string,
) {
  const weekday = String(weekdayFromDate(selectedDate));

  return plan.day_of_week
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(weekday);
}

function getPlannedWorkout(
  data: WorkoutPageData,
  selectedDate: string,
) {
  return (
    data.plans.find((plan) => plan.is_active && planMatchesDate(plan, selectedDate)) ??
    data.plans.find((plan) => plan.is_active) ??
    data.plans[0] ??
    null
  );
}

function buildWorkoutSummary(
  data: WorkoutPageData,
  selectedDate: string,
  text: DashboardCopy,
): WorkoutSummary {
  const latestLog = data.logs[0] ?? null;
  const latestPlan = latestLog?.plan_id
    ? data.plans.find((plan) => plan.id === latestLog.plan_id)
    : null;
  const plannedPlan = latestPlan ?? getPlannedWorkout(data, selectedDate);
  const heartRateLogs = data.logs.filter((log) => log.avg_heart_rate);
  const avgHeartRate = heartRateLogs.length
    ? Math.round(
        heartRateLogs.reduce(
          (total, log) => total + (log.avg_heart_rate ?? 0),
          0,
        ) / heartRateLogs.length,
      )
    : null;
  const maxHeartRate = data.logs.reduce<number | null>((max, log) => {
    if (!log.max_heart_rate) {
      return max;
    }

    return max ? Math.max(max, log.max_heart_rate) : log.max_heart_rate;
  }, null);

  return {
    sessions: data.logs.length,
    calories: data.logs.reduce(
      (total, log) => total + (log.calories_burned ?? 0),
      0,
    ),
    durationMin: data.logs.reduce(
      (total, log) => total + (log.duration_min ?? 0),
      0,
    ),
    avgHeartRate,
    maxHeartRate,
    latestName: plannedPlan?.name ?? (latestLog ? text.workoutLogged : text.noWorkout),
    latestNote: latestLog?.note ?? null,
    latestImageUrl: latestLog?.image_url ?? null,
    latestLog,
    planId: plannedPlan?.id ?? null,
    exercises: plannedPlan?.exercises ?? [],
  };
}

function buildSummary(logs: TimelineLogRow[]): TimelineSummary {
  const done = logs.filter((log) => log.status === "done").length;
  const skipped = logs.filter((log) => log.status === "skipped").length;
  const pending = logs.length - done - skipped;
  const doneMinutes = logs
    .filter((log) => log.status === "done")
    .reduce((total, log) => total + (log.duration_min ?? 0), 0);

  return {
    total: logs.length,
    done,
    pending,
    skipped,
    doneMinutes,
    rate: logs.length ? Math.round((done / logs.length) * 100) : 0,
  };
}

function statusClass(status: TimelineLogRow["status"]) {
  if (status === "done") {
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "skipped") {
    return "border-amber-300/25 bg-amber-400/10 text-amber-200";
  }

  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function timelineRowClass(status: TimelineLogRow["status"]) {
  if (status === "done") {
    return "border-emerald-300/35 bg-emerald-400/[0.08] shadow-[0_0_28px_rgba(34,197,94,0.14)]";
  }

  if (status === "skipped") {
    return "border-amber-300/25 bg-amber-400/[0.06] opacity-70 grayscale-[0.2]";
  }

  return "border-white/10 bg-white/[0.03]";
}

function DashboardTimelineCard({
  locale,
  logs,
  selectedDate,
  summary,
  text,
}: {
  locale: Locale;
  logs: TimelineLogRow[];
  selectedDate: string;
  summary: TimelineSummary;
  text: DashboardCopy;
}) {
  const visibleLogs = logs.slice(0, 3);

  return (
    <Panel className="overflow-hidden">
      <div className="grid gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(34,197,94,0.11),rgba(15,23,42,0.1))] p-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300">
            {text.timeline}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">
            {text.dailyBlocks}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatShortDate(selectedDate, locale)}
          </p>
        </div>

        <div className="flex justify-start md:justify-end">
          <Button
            asChild
            className="h-9 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] px-3 text-xs font-black text-slate-950 hover:opacity-90"
          >
            <Link href={`/dashboard/timeline?date=${selectedDate}`}>
              {text.open}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 p-2.5 lg:grid-cols-[190px_1fr]">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {[
            {
              label: text.timeline,
              value: `${summary.done}/${summary.total}`,
              caption: text.completedBlocks,
              icon: ListChecks,
            },
            {
              label: text.completion,
              value: `${summary.rate}%`,
              caption: `${summary.pending} ${text.pending}`,
              icon: CheckCircle2,
            },
            {
              label: text.focusTime,
              value: focusTimeLabel(summary.doneMinutes, locale),
              caption: text.doneDuration,
              icon: Clock3,
            },
            {
              label: text.skipped,
              value: String(summary.skipped),
              caption: text.blocksSkipped,
              icon: SkipForward,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-400">{item.label}</p>
                  <Icon className="size-4 text-emerald-300" />
                </div>
                <p className="mt-1 text-lg font-black text-white">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.caption}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">{text.timelineBlocks}</h2>
              <p className="text-xs text-slate-400">{formatShortDate(selectedDate, locale)}</p>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-300">
              {logs.length} {text.blocks}
            </span>
          </div>

          <div className="relative space-y-2 before:absolute before:left-[19px] before:top-4 before:h-[calc(100%-32px)] before:w-px before:bg-emerald-300/20">
            {visibleLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
                <p className="font-bold text-white">{text.noTimelineBlocks}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {text.openTimelineHint}
                </p>
              </div>
            ) : null}

            {visibleLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "relative grid grid-cols-[58px_1fr] items-center gap-2 rounded-xl border p-2.5 transition-all xl:grid-cols-[58px_1fr_auto]",
                  timelineRowClass(log.status),
                )}
              >
                <span
                  className={cn(
                    "absolute left-[15px] top-1/2 z-10 size-2 -translate-y-1/2 rounded-full border border-slate-950 shadow-[0_0_14px_currentColor]",
                    log.status === "done" && "bg-emerald-400 text-emerald-400",
                    log.status === "skipped" && "bg-amber-300 text-amber-300",
                    log.status === "pending" && "bg-slate-950 text-slate-500",
                  )}
                />
                <div
                  className={cn(
                    "pl-5 text-xs font-bold tabular-nums text-slate-300",
                    log.status === "done" && "text-emerald-200",
                    log.status === "skipped" && "text-amber-200",
                  )}
                >
                  {formatTime(log.start_time, locale)}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-sm font-bold text-white",
                      log.status === "done" && "text-emerald-100 line-through decoration-emerald-300/70",
                      log.status === "skipped" && "text-slate-400 line-through decoration-amber-300/60",
                    )}
                  >
                    {localizeGeneratedTaskDescription(log.title, locale)}
                  </p>
                  <p
                    className={cn(
                      "truncate text-xs text-slate-400",
                      log.status === "done" && "text-emerald-200/75",
                      log.status === "skipped" && "text-amber-100/55",
                    )}
                  >
                    {localizeGeneratedTimelineNote(log.note, locale) ||
                      durationLabel(log.duration_min, locale, text)}
                  </p>
                </div>
                <div className="col-span-2 flex flex-wrap items-center justify-end gap-1.5 xl:col-span-1">
                  {log.status === "pending" ? (
                    <>
                      <form action={updateDashboardTimelineStatus}>
                        <input type="hidden" name="logId" value={log.id} />
                        <input type="hidden" name="status" value="done" />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="h-7 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/15 hover:text-emerald-200"
                        >
                          <Check className="mr-1 size-3.5" />
                          {text.done}
                        </Button>
                      </form>
                      <form action={updateDashboardTimelineStatus}>
                        <input type="hidden" name="logId" value={log.id} />
                        <input type="hidden" name="status" value="skipped" />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="h-7 rounded-lg border border-white/10 px-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        >
                          <SkipForward className="mr-1 size-3.5" />
                          {text.skip}
                        </Button>
                      </form>
                    </>
                  ) : (
                    <form action={updateDashboardTimelineStatus}>
                      <input type="hidden" name="logId" value={log.id} />
                      <input type="hidden" name="status" value="pending" />
                      <Button
                        type="submit"
                        variant="ghost"
                        className="h-7 rounded-lg border border-white/10 px-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        {text.undo}
                      </Button>
                    </form>
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-[10px] font-black uppercase",
                      statusClass(log.status),
                    )}
                  >
                    {log.status === "done"
                      ? text.statusDone
                      : log.status === "skipped"
                        ? text.statusSkipped
                        : text.statusPending}
                  </span>
                </div>
              </div>
            ))}

            {logs.length > visibleLogs.length ? (
              <Button
                asChild
                variant="ghost"
                className="h-9 w-full rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Link href={`/dashboard/timeline?date=${selectedDate}`}>
                  {locale === "vi"
                    ? `Xem thêm ${logs.length - visibleLogs.length} mục trong Lịch ngày`
                    : `View ${logs.length - visibleLogs.length} more in Timeline`}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DashboardDateControls({
  selectedDate,
  text,
}: {
  selectedDate: string;
  text: DashboardCopy;
}) {
  const todayDate = getBangkokDateString();
  const isToday = selectedDate === todayDate;

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex h-10 w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 sm:w-auto">
        <Button
          asChild
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-none px-0 text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <Link href={`/dashboard?date=${shiftDate(selectedDate, -1)}`}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <form
          action="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2 border-x border-white/10 px-2 text-sm text-slate-200 sm:flex-none sm:px-3"
        >
          <CalendarDays className="size-4 text-slate-400" />
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] sm:w-[132px] sm:flex-none"
          />
          <button className="hidden rounded-lg px-2 text-xs font-black text-emerald-300 hover:bg-white/[0.06] min-[390px]:block">
            {text.view}
          </button>
        </form>
        <Button
          asChild
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-none px-0 text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <Link href={`/dashboard?date=${shiftDate(selectedDate, 1)}`}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>

      <Button
        asChild
        variant="ghost"
        className={cn(
          "h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-300 hover:bg-white/[0.07] hover:text-white sm:w-auto",
          isToday && "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
        )}
      >
        <Link href={`/dashboard?date=${todayDate}`}>{text.today}</Link>
      </Button>
    </div>
  );
}

function WorkoutDailyCard({
  locale,
  selectedDate,
  text,
  workoutData,
}: {
  locale: Locale;
  selectedDate: string;
  text: DashboardCopy;
  workoutData: WorkoutPageData;
}) {
  const workout = buildWorkoutSummary(workoutData, selectedDate, text);
  const visibleExercises = workout.exercises.slice(0, 3);
  const estimatedDuration = workout.durationMin || Math.max(45, workout.exercises.length * 15);

  return (
    <Panel className="overflow-hidden transition hover:border-cyan-300/25 hover:bg-white/[0.045]">
      <div className="grid min-h-[210px] sm:grid-cols-[minmax(0,1fr)_116px]">
        <div className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-black text-white">{text.workout}</p>
              <p className="mt-1 text-xs text-slate-400">
                {workout.sessions
                  ? `${workout.sessions} ${workout.sessions === 1 ? text.session : text.sessions} • ${durationLabel(workout.durationMin, locale, text)}`
                  : `${text.noWorkoutOn} ${formatShortDate(selectedDate, locale)}`}
              </p>
            </div>
            {workout.latestLog ? (
              <div
                className="grid size-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(34,197,94,0.16)]"
                title={text.workoutCompleted}
              >
                <CheckCircle2 className="size-5" />
              </div>
            ) : (
              <form action={completeDashboardWorkout}>
                <input type="hidden" name="log_date" value={selectedDate} />
                {workout.planId ? (
                  <input type="hidden" name="plan_id" value={workout.planId} />
                ) : null}
                <input type="hidden" name="duration_min" value={estimatedDuration} />
                <input
                  type="hidden"
                  name="note"
                  value={locale === "vi" ? "Hoàn thành từ Dashboard" : "Completed from dashboard"}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-0 text-cyan-300 hover:bg-emerald-400/15 hover:text-emerald-200"
                  title={text.markWorkoutDone}
                  aria-label={text.markWorkoutDone}
                >
                  <Check className="size-5" />
                </Button>
              </form>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Flame className="size-3.5 text-orange-300" />
                kcal
              </div>
              <p className="mt-1 text-lg font-black text-cyan-300">
                {workout.calories || 0}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock3 className="size-3.5 text-emerald-300" />
                {text.time}
              </div>
              <p className="mt-1 text-lg font-black text-white">
                {durationLabel(workout.durationMin, locale, text)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <HeartPulse className="size-3.5 text-rose-300" />
                {text.hr}
              </div>
              <p className="mt-1 text-lg font-black text-white">
                {workout.avgHeartRate ? `${workout.avgHeartRate}` : "--"}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black text-white">
                {workout.latestName}
              </p>
              <Link
                href={`/dashboard/workout?date=${selectedDate}`}
                className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
              >
                {text.detail}
              </Link>
            </div>
            {workout.latestNote ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                {workout.latestNote}
              </p>
            ) : null}
            <div className="mt-2 space-y-1.5">
              {visibleExercises.length > 0 ? (
                visibleExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5"
                  >
                    <span className="truncate text-xs font-bold text-slate-200">
                      {exercise.exercise_name}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">
                      {exercise.sets ?? "-"}x{exercise.reps ?? "-"}
                      {exercise.weight_kg ? ` • ${exercise.weight_kg}kg` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-slate-400">
                  {text.tickDoneHint}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-t border-white/10 bg-white/[0.025] p-3 sm:flex sm:flex-col sm:border-l sm:border-t-0">
          <div
            aria-label={text.workoutPhoto}
            role="img"
            className={cn(
              "grid h-20 place-items-center rounded-2xl border border-white/10 bg-slate-950/70 text-cyan-300 sm:h-24",
              workout.latestImageUrl && "bg-cover bg-center",
            )}
            style={
              workout.latestImageUrl
                ? { backgroundImage: `url(${workout.latestImageUrl})` }
                : undefined
            }
          >
            {!workout.latestImageUrl ? <ImagePlus className="size-6" /> : null}
          </div>

          {workout.latestLog ? (
            <form
              action={uploadDashboardWorkoutPhoto}
              className="grid grid-cols-2 gap-2 sm:mt-3"
              encType="multipart/form-data"
            >
              <input type="hidden" name="log_id" value={workout.latestLog.id} />
              <label
                className="grid h-9 cursor-pointer place-items-center rounded-lg border border-dashed border-cyan-300/25 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15"
                title={text.chooseWorkoutPhoto}
                aria-label={text.chooseWorkoutPhoto}
              >
                <ImagePlus className="size-4" />
                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                />
              </label>
              <Button
                type="submit"
                variant="ghost"
                className="h-9 rounded-lg border border-white/10 px-0 text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200"
                title={text.saveWorkoutPhoto}
                aria-label={text.saveWorkoutPhoto}
              >
                <Check className="size-4" />
              </Button>
            </form>
          ) : (
            <form action={completeDashboardWorkout} className="sm:mt-3">
              <input type="hidden" name="log_date" value={selectedDate} />
              {workout.planId ? (
                <input type="hidden" name="plan_id" value={workout.planId} />
              ) : null}
              <input type="hidden" name="duration_min" value={estimatedDuration} />
              <input
                type="hidden"
                name="note"
                value={locale === "vi" ? "Hoàn thành từ Dashboard" : "Completed from dashboard"}
              />
              <Button
                type="submit"
                variant="ghost"
                className="h-9 w-full rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-0 text-emerald-300 hover:bg-emerald-400/15 hover:text-emerald-200"
                title={text.markWorkoutDone}
                aria-label={text.markWorkoutDone}
              >
                <Check className="size-4" />
              </Button>
            </form>
          )}

          <div className="col-span-2 space-y-1 border-t border-white/10 pt-3 text-[11px] text-slate-400 sm:mt-auto">
            <p>{text.maxHr}: {workout.maxHeartRate ? `${workout.maxHeartRate} bpm` : "--"}</p>
            <p>{workout.exercises.length} {text.exercises}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DashboardKpiStrip({
  analytics,
  daily,
  financeData,
  locale,
  summary,
  text,
  workoutData,
}: {
  analytics: DashboardAnalyticsData;
  daily: DashboardDailySummary;
  financeData: FinancePageData;
  locale: Locale;
  summary: TimelineSummary;
  text: DashboardCopy;
  workoutData: WorkoutPageData;
}) {
  const todayAnalytics = analytics.days.at(-1);
  const workout = buildWorkoutSummary(workoutData, todayAnalytics?.date ?? "", text);
  const finance = buildFinanceSummary(financeData);
  const activeMinutes = workout.durationMin + daily.activities.durationMin;
  const caloriesBurned = workout.calories + daily.activities.calories;
  const kpis = [
    {
      accent: "text-emerald-300",
      caption: text.dailyBalance,
      icon: Gauge,
      label: text.lifeScore,
      value: `${todayAnalytics?.lifeScore ?? 0}`,
    },
    {
      accent: "text-cyan-300",
      caption: `${summary.pending} ${text.waiting}`,
      icon: ListChecks,
      label: text.timeline,
      value: `${summary.done}/${summary.total}`,
    },
    {
      accent: "text-violet-300",
      caption: `${daily.activities.sessions + workout.sessions} ${text.sessions}`,
      icon: Activity,
      label: text.activeTime,
      value: durationLabel(activeMinutes, locale, text),
    },
    {
      accent: "text-orange-300",
      caption: `${caloriesBurned} ${text.kcalBurned}`,
      icon: Flame,
      label: text.energyIn,
      value: `${daily.nutrition.calories}`,
    },
    {
      accent: finance.net >= 0 ? "text-emerald-300" : "text-rose-300",
      caption: `${finance.accounts} ${text.activeAccounts}`,
      icon: WalletCards,
      label: text.netMoney,
      value: formatCompactVnd(finance.net),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((item, index) => {
        const Icon = item.icon;

        return (
          <Panel
            key={item.label}
            className={cn(
              "overflow-hidden p-3.5",
              index === kpis.length - 1 && "col-span-2 md:col-span-1",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className={cn("mt-1.5 truncate text-2xl font-black", item.accent)}>
                  {item.value}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {item.caption}
                </p>
              </div>
              <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]", item.accent)}>
                <Icon className="size-4" />
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function DailyModuleCard({
  accent,
  caption,
  href,
  icon: Icon,
  metrics,
  progress,
  title,
  value,
}: {
  accent: string;
  caption: string;
  href: string;
  icon: typeof Utensils;
  metrics: Array<{ label: string; value: string }>;
  progress?: number;
  title: string;
  value: string;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <Panel className="group h-full overflow-hidden p-3.5 transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-white/[0.045]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">{title}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{caption}</p>
          </div>
          <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]", accent)}>
            <Icon className="size-4" />
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
          <p className={cn("truncate text-xl font-black", accent)}>{value}</p>
          <ArrowRight className="mb-1 size-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
        </div>

        {typeof progress === "number" ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
              style={{ width: `${clampPercent(progress)}%` }}
            />
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <p className="truncate text-[10px] text-slate-600">{metric.label}</p>
              <p className="mt-0.5 truncate text-xs font-black text-slate-300">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </Link>
  );
}

function PrimaryModuleGrid({
  daily,
  locale,
  selectedDate,
  text,
}: {
  daily: DashboardDailySummary;
  locale: Locale;
  selectedDate: string;
  text: DashboardCopy;
}) {
  const nutritionProgress = ratioPercent(
    daily.nutrition.calories,
    daily.nutrition.calorieGoal,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DailyModuleCard
        accent="text-orange-300"
        caption={`${daily.nutrition.meals} ${text.mealsOn} ${formatShortDate(selectedDate, locale)}`}
        href={`/dashboard/nutrition?date=${selectedDate}`}
        icon={Utensils}
        metrics={[
          { label: text.protein, value: `${Math.round(daily.nutrition.protein)}g` },
          { label: text.carbs, value: `${Math.round(daily.nutrition.carbs)}g` },
          { label: text.fat, value: `${Math.round(daily.nutrition.fat)}g` },
        ]}
        progress={nutritionProgress}
        title={text.nutrition}
        value={`${daily.nutrition.calories} / ${daily.nutrition.calorieGoal} kcal`}
      />
      <DailyModuleCard
        accent="text-cyan-300"
        caption={`${daily.activities.sessions} ${text.trackedActivities}`}
        href={`/dashboard/activities?date=${selectedDate}`}
        icon={Footprints}
        metrics={[
          { label: text.distance, value: `${daily.activities.distanceKm} km` },
          { label: text.calories, value: `${daily.activities.calories} kcal` },
          { label: text.avgHr, value: daily.activities.avgHeartRate ? `${daily.activities.avgHeartRate}` : "--" },
        ]}
        title={text.activities}
        value={durationLabel(daily.activities.durationMin, locale, text)}
      />
    </div>
  );
}

function SecondaryModuleGrid({
  daily,
  financeData,
  locale,
  selectedDate,
  text,
}: {
  daily: DashboardDailySummary;
  financeData: FinancePageData;
  locale: Locale;
  selectedDate: string;
  text: DashboardCopy;
}) {
  const finance = buildFinanceSummary(financeData);
  const weightChange = daily.weight.changeKg;
  const goalRate = daily.goals.totalToday
    ? ratioPercent(daily.goals.doneToday, daily.goals.totalToday)
    : daily.goals.topGoalProgress;
  const moodLabel = daily.journal.mood
    ? daily.journal.mood.charAt(0).toUpperCase() + daily.journal.mood.slice(1)
    : text.notLogged;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DailyModuleCard
        accent="text-sky-300"
        caption={daily.weight.logDate ? `${text.latest} ${formatShortDate(daily.weight.logDate, locale)}` : text.noCheckin}
        href={`/dashboard/weight?date=${selectedDate}`}
        icon={Scale}
        metrics={[
          { label: text.change, value: weightChange == null ? "--" : `${weightChange > 0 ? "+" : ""}${weightChange} kg` },
          { label: text.bodyFat, value: daily.weight.bodyFatPct == null ? "--" : `${daily.weight.bodyFatPct}%` },
          { label: text.muscle, value: daily.weight.muscleKg == null ? "--" : `${daily.weight.muscleKg} kg` },
        ]}
        title={text.weight}
        value={daily.weight.weightKg == null ? text.noData : `${daily.weight.weightKg} kg`}
      />
      <DailyModuleCard
        accent="text-emerald-300"
        caption={daily.goals.topGoalTitle ?? `${daily.goals.activeGoals} ${text.activeGoals}`}
        href={`/dashboard/goals?date=${selectedDate}`}
        icon={Target}
        metrics={[
          { label: text.done, value: String(daily.goals.doneToday) },
          { label: text.waiting, value: String(Math.max(0, daily.goals.totalToday - daily.goals.doneToday - daily.goals.skippedToday)) },
          { label: text.skipped, value: String(daily.goals.skippedToday) },
        ]}
        progress={goalRate}
        title={text.goals}
        value={daily.goals.totalToday ? `${daily.goals.doneToday}/${daily.goals.totalToday} ${text.today.toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US")}` : `${daily.goals.activeGoals} ${text.active}`}
      />
      <DailyModuleCard
        accent={finance.net >= 0 ? "text-violet-300" : "text-rose-300"}
        caption={`${finance.accounts} ${text.walletsAccounts}`}
        href={`/dashboard/finance?month=${selectedDate.slice(0, 7)}`}
        icon={WalletCards}
        metrics={[
          { label: text.assets, value: formatCompactVnd(finance.assets) },
          { label: text.debt, value: formatCompactVnd(finance.debt) },
          { label: text.status, value: finance.net >= 0 ? text.positive : text.review },
        ]}
        title={text.finance}
        value={formatCompactVnd(finance.net)}
      />
      <DailyModuleCard
        accent="text-fuchsia-300"
        caption={daily.journal.contentPreview ?? text.reflectDay}
        href={`/dashboard/journal?date=${selectedDate}`}
        icon={NotebookPen}
        metrics={[
          { label: text.mood, value: moodLabel },
          { label: text.control, value: daily.journal.controlScore == null ? "--" : `${daily.journal.controlScore}/100` },
          { label: text.deepWork, value: locale === "vi" ? `${daily.journal.deepWorkMin} phút` : `${daily.journal.deepWorkMin}m` },
        ]}
        progress={daily.journal.controlScore ?? undefined}
        title={text.journal}
        value={daily.journal.written ? text.entrySaved : text.writeToday}
      />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text = dashboardCopy[locale];
  const [data, workoutData, financeData, analyticsData, dailySummary] =
    await Promise.all([
      getTimelinePageData(searchParams?.date),
      getWorkoutPageData(searchParams?.date),
      getFinancePageData(searchParams?.date?.slice(0, 7)),
      getDashboardAnalytics(searchParams?.date),
      getDashboardDailySummary(searchParams?.date),
    ]);
  const summary = buildSummary(data.logs);

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1700px] space-y-4 overflow-hidden">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
            {text.badge}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            {text.title}
          </h1>
          <p className="text-sm text-slate-400">
            {text.subtitle} • {formatDisplayDate(data.selectedDate, locale)}
          </p>
        </div>
        <DashboardDateControls selectedDate={data.selectedDate} text={text} />
      </header>

      <DashboardKpiStrip
        analytics={analyticsData}
        daily={dailySummary}
        financeData={financeData}
        locale={locale}
        summary={summary}
        text={text}
        workoutData={workoutData}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.85fr)] 2xl:grid-cols-[minmax(0,1.45fr)_minmax(480px,0.95fr)]">
        <DashboardTimelineCard
          locale={locale}
          logs={data.logs}
          selectedDate={data.selectedDate}
          summary={summary}
          text={text}
        />
        <div className="grid gap-3">
          <WorkoutDailyCard
            locale={locale}
            selectedDate={data.selectedDate}
            text={text}
            workoutData={workoutData}
          />
          <PrimaryModuleGrid
            daily={dailySummary}
            locale={locale}
            selectedDate={data.selectedDate}
            text={text}
          />
        </div>
      </div>

      <SecondaryModuleGrid
        daily={dailySummary}
        financeData={financeData}
        locale={locale}
        selectedDate={data.selectedDate}
        text={text}
      />
      <DashboardAnalyticsCard data={analyticsData} />
    </div>
  );
}
