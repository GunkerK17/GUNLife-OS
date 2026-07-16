"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Gift,
  ListChecks,
  Minus,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trophy,
  Trash2,
} from "lucide-react";
import {
  deleteJournalEntry,
  saveJournalEntry,
} from "@/app/(dashboard)/dashboard/journal/actions";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizeActionError } from "@/lib/localize-action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JournalPageData } from "@/lib/queries/journal";
import type {
  JournalRow,
  JournalWellbeing,
  Mood,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type JournalClientProps = JournalPageData;
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const moodOptions: Array<{
  color: string;
  emoji: string;
  en: string;
  value: Mood;
  vi: string;
}> = [
  { value: "great", emoji: "😄", vi: "Rất tốt", en: "Great", color: "#34d399" },
  { value: "good", emoji: "🙂", vi: "Tốt", en: "Good", color: "#22d3ee" },
  { value: "okay", emoji: "😐", vi: "Bình thường", en: "Okay", color: "#a78bfa" },
  { value: "bad", emoji: "😞", vi: "Không tốt", en: "Bad", color: "#fbbf24" },
  { value: "terrible", emoji: "😫", vi: "Rất tệ", en: "Terrible", color: "#fb7185" },
];

const resetHabits = [
  {
    key: "morning-no-phone",
    vi: "30 phút đầu ngày không điện thoại",
    en: "No phone for the first 30 minutes",
  },
  { key: "single-task", vi: "Làm một việc một lúc", en: "Single-tasked" },
  { key: "workout", vi: "Tập luyện / vận động", en: "Worked out / moved" },
  {
    key: "night-no-scroll",
    vi: "Không lướt vô thức buổi tối",
    en: "No mindless night scrolling",
  },
] as const;

const quickStimuliOptions = [
  { key: "short-video", emoji: "📱", vi: "Video ngắn", en: "Short videos", weight: 3 },
  { key: "social-scroll", emoji: "🌀", vi: "Lướt mạng", en: "Social scrolling", weight: 3 },
  { key: "gaming", emoji: "🎮", vi: "Chơi game", en: "Gaming", weight: 4 },
  { key: "porn", emoji: "🔞", vi: "Nội dung 18+", en: "Adult content", weight: 8 },
  { key: "masturbation", emoji: "⚡", vi: "Thủ dâm", en: "Masturbation", weight: 6 },
  { key: "junk-food", emoji: "🍟", vi: "Đồ ăn vặt", en: "Snacks", weight: 3 },
  { key: "shopping", emoji: "🛍️", vi: "Mua sắm", en: "Shopping", weight: 5 },
] as const;

const copy = {
  vi: {
    title: "Nhật ký",
    subtitle: "Ghi lại điều đã xảy ra, cảm xúc và bài học của mỗi ngày.",
    today: "Hôm nay",
    entry: "Trang viết trong ngày",
    entryHint: "Viết tự do — LifeOS sẽ tự lưu sau khi bạn dừng gõ 1 giây.",
    placeholder:
      "Hôm nay có gì đáng nhớ? Điều gì khiến bạn vui, mệt hoặc biết ơn? Bạn muốn làm tốt hơn điều gì vào ngày mai?",
    mood: "Hôm nay bạn cảm thấy thế nào?",
    words: "từ",
    characters: "ký tự",
    saveNow: "Lưu ngay",
    saved: "Đã lưu",
    saving: "Đang lưu...",
    unsaved: "Chưa lưu",
    empty: "Chưa viết",
    delete: "Xóa trang này",
    deleteConfirm: "Xóa nhật ký của ngày này? Thao tác này không thể hoàn tác.",
    calendar: "Lịch viết",
    calendarHint: "Ngày có chấm là ngày đã ghi nhật ký.",
    stats: "Nhịp viết",
    quickStart: "Check-in 2 phút",
    quickStartHint:
      "Làm lần lượt 4 bước bên dưới. Mọi thay đổi đều tự lưu, bạn không cần tính điểm bằng tay.",
    completedSteps: "bước hoàn thành",
    stepFoundation: "Nhập 3 chỉ số",
    stepImpulse: "Kiểm tra hành vi ngoài kế hoạch",
    stepAnchors: "Tick việc tốt đã làm",
    stepReflect: "Viết ít nhất 10 từ",
    foundation: "Nền tảng hôm nay",
    noUnplannedStimuli: "Hôm nay không có lần nào ngoài kế hoạch",
    reviewed: "Đã kiểm tra",
    result: "Kết quả tự động",
    scoreHelp: "Điểm và XP được tính thế nào?",
    resetTitle: "Dopamine Reset",
    resetHint:
      "Check-in thói quen tập trung và xao nhãng. Điểm chỉ dùng để tự theo dõi, không phải chỉ số y khoa.",
    controlScore: "Điểm tự kiểm soát",
    urge: "Mức thôi thúc muốn lướt",
    urgeLow: "Ít",
    urgeHigh: "Rất mạnh",
    sleep: "Ngủ",
    deepWork: "Deep work",
    socialMedia: "Mạng xã hội",
    hours: "giờ",
    minutes: "phút",
    trigger: "Thứ dễ kéo bạn mất tập trung nhất hôm nay",
    triggerPlaceholder: "Ví dụ: video ngắn, stress, buồn chán...",
    resetHabits: "Các điểm neo trong ngày",
    quickStimuli: "Ngoài kế hoạch / mất kiểm soát",
    quickStimuliHint:
      "Mỗi dấu + là 1 lần ngoài kế hoạch, không phải số phút. Nếu không có lần nào, bấm xác nhận bên dưới.",
    focusXp: "Focus XP",
    weeklyXp: "XP trong 7 ngày",
    reward: "Phần thưởng đã chọn",
    plannedReward: "Chọn một phần thưởng có chủ đích",
    plannedRewardHint:
      "Cùng một hoạt động ở đây sẽ không bị trừ điểm vì bạn đã chọn trước và dùng trong giới hạn.",
    rewardPlaceholder: "Ví dụ: xem phim 30 phút, cà phê ngon, đi chơi...",
    claimReward: "Đã nhận thưởng",
    rewardLocked: "Hoàn thành thêm một việc quan trọng để mở phần thưởng.",
    trend: "Xu hướng kiểm soát 7 ngày",
    noResetData: "Check-in vài ngày để thấy xu hướng.",
    totalEntries: "Tổng số ngày viết",
    streak: "Chuỗi hiện tại",
    days: "ngày",
    totalWords: "Tổng số từ",
    favoriteMood: "Cảm xúc thường gặp",
    noMood: "Chưa đủ dữ liệu",
    history: "Nhật ký trước đây",
    historyHint: "Tìm và mở lại bất kỳ ngày nào bạn đã viết.",
    search: "Tìm trong nội dung nhật ký...",
    noResults: "Không tìm thấy nhật ký phù hợp.",
    openDay: "Mở ngày này",
    selected: "Đang xem",
    demo: "Chế độ demo: kết nối Supabase để lưu nhật ký.",
    badge: "NHẬT KÝ OS",
    average: "TB",
  },
  en: {
    title: "Journal",
    subtitle: "Capture what happened, how you felt, and what each day taught you.",
    today: "Today",
    entry: "Daily entry",
    entryHint: "Write freely — LifeOS saves one second after you stop typing.",
    placeholder:
      "What stood out today? What made you happy, tired, or grateful? What would you like to do better tomorrow?",
    mood: "How are you feeling today?",
    words: "words",
    characters: "characters",
    saveNow: "Save now",
    saved: "Saved",
    saving: "Saving...",
    unsaved: "Unsaved",
    empty: "Not written",
    delete: "Delete this entry",
    deleteConfirm: "Delete this journal entry? This cannot be undone.",
    calendar: "Writing calendar",
    calendarHint: "A dot means an entry exists for that day.",
    stats: "Writing rhythm",
    quickStart: "2-minute check-in",
    quickStartHint:
      "Complete the four steps below. Everything saves automatically; you do not calculate scores yourself.",
    completedSteps: "steps completed",
    stepFoundation: "Enter three metrics",
    stepImpulse: "Review unplanned behaviors",
    stepAnchors: "Check positive anchors",
    stepReflect: "Write at least 10 words",
    foundation: "Today’s foundation",
    noUnplannedStimuli: "No unplanned moments today",
    reviewed: "Reviewed",
    result: "Automatic result",
    scoreHelp: "How are score and XP calculated?",
    resetTitle: "Dopamine Reset",
    resetHint:
      "Track focus and distraction habits. This is a personal reflection score, not a medical metric.",
    controlScore: "Self-control score",
    urge: "Urge to scroll",
    urgeLow: "Low",
    urgeHigh: "Very strong",
    sleep: "Sleep",
    deepWork: "Deep work",
    socialMedia: "Social media",
    hours: "hours",
    minutes: "minutes",
    trigger: "Biggest distraction trigger today",
    triggerPlaceholder: "For example: short videos, stress, boredom...",
    resetHabits: "Daily anchors",
    quickStimuli: "Unplanned / out of control",
    quickStimuliHint:
      "Each + means one unplanned moment, not minutes. If there were none, confirm that below.",
    focusXp: "Focus XP",
    weeklyXp: "XP in 7 days",
    reward: "Chosen reward",
    plannedReward: "Choose an intentional reward",
    plannedRewardHint:
      "The same activity here does not reduce your score because it was chosen in advance and used within a limit.",
    rewardPlaceholder: "For example: 30 minutes of a show, good coffee, going out...",
    claimReward: "Reward claimed",
    rewardLocked: "Complete one more meaningful action to unlock a reward.",
    trend: "7-day control trend",
    noResetData: "Check in for a few days to see your trend.",
    totalEntries: "Total entries",
    streak: "Current streak",
    days: "days",
    totalWords: "Total words",
    favoriteMood: "Most common mood",
    noMood: "Not enough data",
    history: "Past entries",
    historyHint: "Search and reopen anything you have written.",
    search: "Search journal content...",
    noResults: "No matching journal entries.",
    openDay: "Open this day",
    selected: "Viewing",
    demo: "Demo mode: connect Supabase to save journal entries.",
    badge: "JOURNAL OS",
    average: "AVG",
  },
} as const;

function parseDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateValue: string, amount: number) {
  const date = parseDate(dateValue);
  date.setDate(date.getDate() + amount);
  return dateString(date);
}

function monthLabel(monthValue: string, locale: "vi" | "en") {
  const [year, month] = monthValue.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function entryDateLabel(dateValue: string, locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(parseDate(dateValue));
}

function shortDateLabel(dateValue: string, locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDate(dateValue));
}

function countWords(content: string | null) {
  const value = content?.trim();
  return value ? value.split(/\s+/).length : 0;
}

function excerpt(content: string | null) {
  const value = content?.trim() ?? "";
  return value.length > 150 ? `${value.slice(0, 150)}…` : value;
}

function moodMeta(mood: Mood | null) {
  return moodOptions.find((item) => item.value === mood) ?? null;
}

function normalizeWellbeing(
  value: JournalWellbeing | null | undefined,
): JournalWellbeing {
  return {
    deepWorkMin: value?.deepWorkMin,
    habits: Array.isArray(value?.habits) ? value.habits : [],
    quickReviewDone: value?.quickReviewDone ?? false,
    quickStimuli:
      value?.quickStimuli && typeof value.quickStimuli === "object"
        ? value.quickStimuli
        : {},
    rewardClaimed: value?.rewardClaimed ?? false,
    rewardKey: value?.rewardKey ?? "",
    rewardNote: value?.rewardNote ?? "",
    sleepHours: value?.sleepHours,
    socialMediaMin: value?.socialMediaMin,
    trigger: value?.trigger ?? "",
    urgeLevel: value?.urgeLevel,
  };
}

function hasResetData(value: JournalWellbeing | null | undefined) {
  return Boolean(
    value?.deepWorkMin != null ||
      value?.sleepHours != null ||
      value?.socialMediaMin != null ||
      value?.urgeLevel != null ||
      value?.trigger?.trim() ||
      value?.habits?.length ||
      Object.values(value?.quickStimuli ?? {}).some((count) => count > 0),
  );
}

function controlScore(value: JournalWellbeing | null | undefined) {
  if (!hasResetData(value)) {
    return null;
  }

  let score = 50;
  const sleep = value?.sleepHours;
  const deepWork = value?.deepWorkMin;
  const social = value?.socialMediaMin;
  const urge = value?.urgeLevel;

  if (sleep != null) {
    score += sleep >= 7 && sleep <= 9 ? 15 : sleep >= 6 ? 7 : sleep < 5 ? -12 : 0;
  }
  if (deepWork != null) {
    score += Math.min(20, Math.round(deepWork / 10));
  }
  if (social != null) {
    score += social <= 30 ? 10 : social <= 60 ? 5 : social <= 120 ? -5 : -15;
  }
  if (urge != null) {
    score += (3 - urge) * 5;
  }
  score += Math.min(value?.habits?.length ?? 0, 4) * 5;
  const quickStimuliPenalty = quickStimuliOptions.reduce(
    (total, option) =>
      total + (value?.quickStimuli?.[option.key] ?? 0) * option.weight,
    0,
  );
  score -= Math.min(40, quickStimuliPenalty);

  return Math.min(100, Math.max(0, Math.round(score)));
}

function focusXp(value: JournalWellbeing | null | undefined, journalContent = "") {
  const score = controlScore(value);
  if (score == null && !journalContent.trim()) {
    return 0;
  }

  const deepWorkXp = Math.min(
    30,
    Math.floor((value?.deepWorkMin ?? 0) / 30) * 10,
  );
  const habitXp = Math.min(value?.habits?.length ?? 0, 4) * 8;
  const scoreXp = score != null && score >= 80 ? 20 : score != null && score >= 60 ? 10 : 0;
  const journalXp = journalContent.trim() ? 8 : 0;
  const quickStimuliCount = Object.values(value?.quickStimuli ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
  const intentionalDayXp = hasResetData(value) && quickStimuliCount === 0 ? 10 : 0;

  return Math.min(100, deepWorkXp + habitXp + scoreXp + journalXp + intentionalDayXp);
}

function rewardSuggestion(xp: number, locale: "vi" | "en") {
  if (xp >= 70) {
    return locale === "vi"
      ? "Mở khóa: một phần thưởng lớn có chủ đích — đi chơi, xem phim hoặc một hoạt động bạn thật sự thích."
      : "Unlocked: one intentional bigger reward — go out, watch a movie, or do something you genuinely enjoy.";
  }
  if (xp >= 45) {
    return locale === "vi"
      ? "Mở khóa: 30 phút giải trí có hẹn giờ hoặc một món bạn thích."
      : "Unlocked: 30 minutes of timed entertainment or a favorite treat.";
  }
  if (xp >= 25) {
    return locale === "vi"
      ? "Mở khóa: một phần thưởng nhỏ như cà phê, đi bộ nghe nhạc hoặc nghỉ 15 phút."
      : "Unlocked: a small reward such as coffee, a music walk, or a 15-minute break.";
  }
  return locale === "vi"
    ? "Chưa mở khóa: hoàn thành một block tập trung hoặc một điểm neo trong ngày."
    : "Locked: complete one focus block or one daily anchor.";
}

function scoreTone(score: number | null) {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-200";
  if (score >= 60) return "text-cyan-200";
  if (score >= 40) return "text-amber-200";
  return "text-rose-200";
}

function resetInsight(
  value: JournalWellbeing,
  score: number | null,
  locale: "vi" | "en",
) {
  if (score == null) {
    return locale === "vi"
      ? "Điền vài chỉ số để LifeOS phân tích nhịp tập trung hôm nay."
      : "Add a few metrics so LifeOS can reflect your focus rhythm.";
  }
  const quickStimuliCount = Object.values(value.quickStimuli ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
  if (quickStimuliCount >= 3) {
    return locale === "vi"
      ? "Hôm nay có nhiều lần tìm kích thích nhanh. Đừng cố cấm hết; chọn đúng một trigger và tạo ma sát cho nó vào ngày mai."
      : "There were several quick-stimulation moments today. Do not ban everything; choose one trigger and add friction tomorrow.";
  }
  if ((value.socialMediaMin ?? 0) > 120) {
    return locale === "vi"
      ? "Mạng xã hội đang là yếu tố kéo điểm xuống mạnh nhất. Thử đặt một khung giờ lướt cố định vào ngày mai."
      : "Social media is the biggest drag today. Try one fixed scrolling window tomorrow.";
  }
  if ((value.sleepHours ?? 8) < 6.5) {
    return locale === "vi"
      ? "Thiếu ngủ có thể làm việc chống lại thôi thúc khó hơn. Ưu tiên giờ ngủ trước khi tăng thêm kỷ luật."
      : "Low sleep can make urges harder to manage. Prioritize bedtime before adding more discipline.";
  }
  if ((value.urgeLevel ?? 1) >= 4) {
    return locale === "vi"
      ? "Mức thôi thúc hôm nay khá cao. Ghi lại trigger để nhận ra mẫu lặp thay vì chỉ cố nhịn."
      : "Urges were high today. Capture the trigger so you can spot patterns instead of only resisting.";
  }
  if ((value.deepWorkMin ?? 0) < 30) {
    return locale === "vi"
      ? "Ngày mai chỉ cần đặt một block tập trung 30 phút trước khi mở mạng xã hội."
      : "Tomorrow, place one 30-minute focus block before opening social media.";
  }
  return locale === "vi"
    ? "Nhịp hôm nay khá cân bằng. Giữ nguyên một thói quen hiệu quả nhất thay vì cố tối ưu mọi thứ."
    : "Today looks balanced. Keep the single most effective habit instead of optimizing everything.";
}

function shiftMonth(monthValue: string, amount: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calendarCells(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: dateString(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
}

function calculateStreak(entries: JournalRow[], today: string) {
  const writtenDates = new Set(
    entries
      .filter((entry) => entry.content?.trim() || entry.mood)
      .map((entry) => entry.log_date),
  );
  let cursor = today;

  if (!writtenDates.has(cursor) && writtenDates.has(shiftDate(cursor, -1))) {
    cursor = shiftDate(cursor, -1);
  }

  let streak = 0;
  while (writtenDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

function SaveStatus({
  error,
  state,
  text,
}: {
  error: string;
  state: SaveState;
  text: (typeof copy)["vi"] | (typeof copy)["en"];
}) {
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
        <AlertCircle className="size-3.5" />
        {error || text.unsaved}
      </span>
    );
  }

  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200">
        <Clock3 className="size-3.5 animate-pulse" />
        {text.saving}
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200">
        <Check className="size-3.5" />
        {text.saved}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
      <PenLine className="size-3.5" />
      {state === "dirty" ? text.unsaved : text.empty}
    </span>
  );
}

function ControlTrend({
  data,
  emptyText,
  title,
}: {
  data: Array<{ date: string; score: number | null }>;
  emptyText: string;
  title: string;
}) {
  const { locale } = useI18n();
  const text = copy[locale];
  const points = data
    .map((item, index) => ({
      ...item,
      x: 14 + index * 42,
      y: item.score == null ? null : 12 + (100 - item.score) * 0.72,
    }))
    .filter((item): item is typeof item & { y: number } => item.y != null);
  const average = points.length
    ? Math.round(
        points.reduce((total, item) => total + (item.score ?? 0), 0) /
          points.length,
      )
    : null;

  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_42%),rgba(2,6,23,0.48)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            {text.resetTitle}
          </p>
          <h2 className="mt-1 font-black text-white">{title}</h2>
        </div>
        <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-right">
          <p className="text-[9px] font-bold text-slate-500">{text.average}</p>
          <p className="text-lg font-black text-cyan-200">{average ?? "—"}</p>
        </div>
      </div>
      {points.length ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-slate-950/55 p-2">
          <svg viewBox="0 0 280 108" className="h-32 w-full" role="img" aria-label={title}>
            <defs>
              <linearGradient id="journal-control-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((value) => (
              <line
                key={value}
                x1="8"
                x2="272"
                y1={12 + (100 - value) * 0.72}
                y2={12 + (100 - value) * 0.72}
                stroke="rgba(148,163,184,0.1)"
                strokeDasharray="3 5"
              />
            ))}
            {points.length > 1 ? (
              <>
                <polygon
                  points={`${points.map((item) => `${item.x},${item.y}`).join(" ")} ${points.at(-1)?.x},88 ${points[0].x},88`}
                  fill="url(#journal-control-fill)"
                />
                <polyline
                  points={points.map((item) => `${item.x},${item.y}`).join(" ")}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
            {points.map((item) => (
              <g key={item.date}>
                <circle cx={item.x} cy={item.y} r="4" fill="#020617" stroke="#34d399" strokeWidth="3" />
                <text x={item.x} y="103" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">
                  {item.date.slice(8)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs font-bold text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

export function JournalClient({
  entries,
  selectedDate,
  supabaseReady,
}: JournalClientProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const text = copy[locale];
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
      }).format(new Date()),
    [],
  );
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.log_date === selectedDate) ?? null,
    [entries, selectedDate],
  );
  const [content, setContent] = useState(selectedEntry?.content ?? "");
  const [mood, setMood] = useState<Mood | null>(selectedEntry?.mood ?? null);
  const [wellbeing, setWellbeing] = useState<JournalWellbeing>(() =>
    normalizeWellbeing(selectedEntry?.wellbeing),
  );
  const [saveState, setSaveState] = useState<SaveState>(
    selectedEntry ? "saved" : "idle",
  );
  const [saveError, setSaveError] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [search, setSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(selectedDate.slice(0, 7));
  const [pending, startTransition] = useTransition();
  const latestDraftRef = useRef("");

  useEffect(() => {
    setContent(selectedEntry?.content ?? "");
    setMood(selectedEntry?.mood ?? null);
    setWellbeing(normalizeWellbeing(selectedEntry?.wellbeing));
    setSaveState(selectedEntry ? "saved" : "idle");
    setSaveError("");
    setHasEdited(false);
    setCalendarMonth(selectedDate.slice(0, 7));
  }, [selectedDate, selectedEntry]);

  const persistEntry = useCallback(
    (
      draftContent: string,
      draftMood: Mood | null,
      draftWellbeing: JournalWellbeing,
    ) => {
      if (!supabaseReady) {
        setSaveError(text.demo);
        setSaveState("error");
        return;
      }

      const signature = `${selectedDate}|${draftMood ?? ""}|${draftContent}|${JSON.stringify(draftWellbeing)}`;
      setSaveState("saving");
      setSaveError("");
      startTransition(async () => {
        const result = await saveJournalEntry({
          content: draftContent,
          logDate: selectedDate,
          mood: draftMood,
          wellbeing: draftWellbeing,
        });

        if (!result.ok) {
          setSaveError(localizeActionError(result.error, locale));
          setSaveState("error");
          return;
        }

        if (latestDraftRef.current === signature) {
          setSaveState("saved");
          setHasEdited(false);
        } else {
          setSaveState("dirty");
        }
        router.refresh();
      });
    },
    [locale, router, selectedDate, supabaseReady, text.demo],
  );

  useEffect(() => {
    const signature = `${selectedDate}|${mood ?? ""}|${content}|${JSON.stringify(wellbeing)}`;
    latestDraftRef.current = signature;

    if (!hasEdited) {
      return;
    }

    setSaveState("dirty");
    const timer = window.setTimeout(() => {
      persistEntry(content, mood, wellbeing);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [content, hasEdited, mood, persistEntry, selectedDate, wellbeing]);

  const entryDates = useMemo(
    () => new Set(entries.map((entry) => entry.log_date)),
    [entries],
  );
  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale === "vi" ? "vi" : "en");
    if (!needle) {
      return entries;
    }

    return entries.filter((entry) => {
      const meta = moodMeta(entry.mood);
      return [
        entry.log_date,
        entry.content ?? "",
        meta?.[locale] ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase(locale === "vi" ? "vi" : "en")
        .includes(needle);
    });
  }, [entries, locale, search]);
  const cells = useMemo(() => calendarCells(calendarMonth), [calendarMonth]);
  const totalWords = entries.reduce(
    (total, entry) => total + countWords(entry.content),
    0,
  );
  const streak = calculateStreak(entries, today);
  const moodCounts = moodOptions.map((option) => ({
    ...option,
    count: entries.filter((entry) => entry.mood === option.value).length,
  }));
  const moodTotal = moodCounts.reduce((total, item) => total + item.count, 0);
  const favoriteMood = [...moodCounts].sort((a, b) => b.count - a.count)[0];
  let gradientStart = 0;
  const moodGradient = moodTotal
    ? `conic-gradient(${moodCounts
        .filter((item) => item.count > 0)
        .map((item) => {
          const start = gradientStart;
          gradientStart += (item.count / moodTotal) * 100;
          return `${item.color} ${start}% ${gradientStart}%`;
        })
        .join(",")})`
    : "conic-gradient(#1e293b 0 100%)";
  const wordCount = countWords(content);
  const currentControlScore = controlScore(wellbeing);
  const currentFocusXp = focusXp(wellbeing, content);
  const controlInsight = resetInsight(wellbeing, currentControlScore, locale);
  const sevenDayTrend = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(selectedDate, index - 6);
    const entry = entries.find((item) => item.log_date === date);
    return {
      date,
      score:
        date === selectedDate
          ? currentControlScore
          : controlScore(entry?.wellbeing),
    };
  });
  const weeklyFocusXp = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(selectedDate, index - 6);
    const entry = entries.find((item) => item.log_date === date);
    return date === selectedDate
      ? currentFocusXp
      : focusXp(entry?.wellbeing, entry?.content ?? "");
  }).reduce((total, xp) => total + xp, 0);
  const quickStimuliTotal = Object.values(wellbeing.quickStimuli ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
  const checkInSteps = [
    {
      done:
        wellbeing.sleepHours != null &&
        wellbeing.deepWorkMin != null &&
        wellbeing.socialMediaMin != null,
      label: text.stepFoundation,
    },
    {
      done: quickStimuliTotal > 0 || Boolean(wellbeing.quickReviewDone),
      label: text.stepImpulse,
    },
    {
      done: Boolean(wellbeing.habits?.length),
      label: text.stepAnchors,
    },
    { done: wordCount >= 10, label: text.stepReflect },
  ];
  const completedCheckInSteps = checkInSteps.filter((step) => step.done).length;
  const rewardUnlocked = currentFocusXp >= 25;
  const hasPlannedReward = Boolean(
    wellbeing.rewardKey || wellbeing.rewardNote?.trim(),
  );
  const unlockedReward = rewardSuggestion(currentFocusXp, locale);
  const isToday = selectedDate === today;
  const weekdayLabels =
    locale === "vi"
      ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function navigateToDate(date: string) {
    router.push(`/dashboard/journal?date=${date}`);
  }

  function editContent(value: string) {
    setContent(value);
    setHasEdited(true);
    setSaveError("");
  }

  function selectMood(value: Mood) {
    setMood((current) => (current === value ? null : value));
    setHasEdited(true);
    setSaveError("");
  }

  function updateWellbeing(patch: Partial<JournalWellbeing>) {
    setWellbeing((current) => ({ ...current, ...patch }));
    setHasEdited(true);
    setSaveError("");
  }

  function toggleResetHabit(key: string) {
    const habits = wellbeing.habits ?? [];
    updateWellbeing({
      habits: habits.includes(key)
        ? habits.filter((habit) => habit !== key)
        : [...habits, key],
    });
  }

  function removeEntry() {
    if (!selectedEntry || !window.confirm(text.deleteConfirm)) {
      return;
    }

    setHasEdited(false);
    startTransition(async () => {
      const result = await deleteJournalEntry(selectedDate);
      if (!result.ok) {
        setSaveError(localizeActionError(result.error, locale));
        setSaveState("error");
        return;
      }

      setContent("");
      setMood(null);
      setWellbeing(normalizeWellbeing(null));
      setSaveState("idle");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-4 overflow-hidden pb-24 lg:pb-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-11 place-items-center rounded-xl border border-violet-300/25 bg-violet-400/15 text-violet-200 shadow-[0_0_30px_rgba(167,139,250,0.16)] sm:grid">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">
              {text.badge}
            </p>
            <h1 className="mt-1 text-[1.7rem] font-black leading-none tracking-tight text-white sm:text-3xl">
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
              onClick={() => navigateToDate(shiftDate(selectedDate, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2 border-x border-white/10 px-2 sm:px-3">
              <CalendarDays className="size-4 shrink-0 text-violet-300" />
              <span className="hidden truncate text-sm font-bold text-white sm:inline">
                {entryDateLabel(selectedDate, locale)}
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => navigateToDate(event.target.value)}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold text-white focus-visible:ring-0 sm:w-[142px] sm:flex-none"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-10 w-10 shrink-0 rounded-none text-slate-300 hover:text-white sm:h-11 sm:w-11"
              onClick={() => navigateToDate(shiftDate(selectedDate, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isToday}
            onClick={() => navigateToDate(today)}
            className="h-10 rounded-xl border-violet-300/20 bg-violet-400/10 px-3 font-bold text-violet-200 hover:bg-violet-400/15 sm:h-11"
          >
            <RotateCcw className="size-4 min-[420px]:mr-2" />
            <span className="hidden min-[420px]:inline">{text.today}</span>
          </Button>
        </div>
      </header>

      {!supabaseReady ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demo}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-violet-300/15 bg-slate-950/50 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.15),transparent_38%),rgba(255,255,255,0.025)] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                    {text.entry}
                  </p>
                </div>
                <h2 className="mt-2 text-xl font-black capitalize text-white sm:text-2xl">
                  {entryDateLabel(selectedDate, locale)}
                </h2>
                <p className="mt-1 text-xs text-slate-400">{text.entryHint}</p>
              </div>
              <SaveStatus error={saveError} state={saveState} text={text} />
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <section className="rounded-2xl border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.1),rgba(34,211,238,0.05))] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                    <ListChecks className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">{text.quickStart}</h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      {text.quickStartHint}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 rounded-xl border border-emerald-300/15 bg-slate-950/50 px-3 py-2 text-center">
                  <p className="text-xl font-black text-emerald-200">
                    {completedCheckInSteps}/4
                  </p>
                  <p className="text-[9px] font-bold text-slate-500">
                    {text.completedSteps}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)] transition-all"
                  style={{ width: `${completedCheckInSteps * 25}%` }}
                />
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                {checkInSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] font-bold",
                      step.done
                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                        : "border-white/[0.07] bg-white/[0.025] text-slate-500",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full",
                        step.done
                          ? "bg-emerald-400 text-slate-950"
                          : "border border-white/10 text-slate-500",
                      )}
                    >
                      {step.done ? <Check className="size-3" /> : index + 1}
                    </span>
                    {step.label}
                  </div>
                ))}
              </div>
            </section>

            <div>
              <p className="mb-2 text-xs font-black text-slate-300">{text.mood}</p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectMood(option.value)}
                    className={cn(
                      "group flex min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-2.5 transition sm:flex-row sm:gap-2 sm:px-3",
                      mood === option.value
                        ? "border-violet-300/45 bg-violet-400/15 shadow-[0_0_20px_rgba(167,139,250,0.1)]"
                        : "border-white/[0.08] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]",
                    )}
                  >
                    <span className="text-xl sm:text-2xl">{option.emoji}</span>
                    <span
                      className={cn(
                        "mt-1 truncate text-[9px] font-black sm:mt-0 sm:text-xs",
                        mood === option.value ? "text-white" : "text-slate-500",
                      )}
                    >
                      {option[locale]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_42%),rgba(15,23,42,0.48)]">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white">{text.resetTitle}</h3>
                    </div>
                    <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">
                      {text.resetHint}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-center">
                  <p className="text-sm font-black text-cyan-100">
                    {completedCheckInSteps}/4
                  </p>
                  <p className="text-[9px] font-bold text-cyan-200/60">
                    {text.completedSteps}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1.15fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-cyan-400 text-xs font-black text-slate-950">
                      1
                    </span>
                    <p className="text-xs font-black text-white">{text.foundation}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        key: "sleepHours" as const,
                        label: text.sleep,
                        max: 24,
                        step: 0.5,
                        suffix:
                          locale === "vi" ? "giờ đêm qua" : "hours last night",
                        value: wellbeing.sleepHours,
                      },
                      {
                        key: "deepWorkMin" as const,
                        label: text.deepWork,
                        max: 1440,
                        step: 5,
                        suffix:
                          locale === "vi"
                            ? "phút thật sự tập trung"
                            : "minutes truly focused",
                        value: wellbeing.deepWorkMin,
                      },
                      {
                        key: "socialMediaMin" as const,
                        label: text.socialMedia,
                        max: 1440,
                        step: 5,
                        suffix:
                          locale === "vi"
                            ? "phút từ Screen Time"
                            : "minutes from Screen Time",
                        value: wellbeing.socialMediaMin,
                      },
                    ].map((metric) => (
                      <label
                        key={metric.key}
                        className="min-w-0 rounded-xl border border-white/10 bg-slate-950/50 p-2.5"
                      >
                        <span className="block truncate text-[10px] font-black text-slate-400">
                          {metric.label}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max={metric.max}
                          step={metric.step}
                          value={metric.value ?? ""}
                          onChange={(event) =>
                            updateWellbeing({
                              [metric.key]: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            })
                          }
                          placeholder="0"
                          className="mt-2 h-9 border-white/10 bg-slate-950/70 px-2 text-sm font-black text-white"
                        />
                        <span className="mt-1 block truncate text-[9px] text-slate-600">
                          {metric.suffix}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-black text-slate-300">{text.urge}</p>
                      <p className="text-[9px] font-bold text-slate-600">
                        {text.urgeLow} → {text.urgeHigh}
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            updateWellbeing({
                              urgeLevel:
                                wellbeing.urgeLevel === level ? undefined : level,
                            })
                          }
                          className={cn(
                            "h-9 rounded-lg border text-xs font-black transition",
                            wellbeing.urgeLevel === level
                              ? level >= 4
                                ? "border-rose-300/35 bg-rose-400/15 text-rose-200"
                                : "border-cyan-300/35 bg-cyan-400/15 text-cyan-200"
                              : "border-white/10 bg-white/[0.025] text-slate-500 hover:text-white",
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-emerald-400 text-xs font-black text-slate-950">
                        3
                      </span>
                      <p className="text-xs font-black text-white">{text.resetHabits}</p>
                    </div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {resetHabits.map((habit) => {
                        const active = wellbeing.habits?.includes(habit.key);
                        return (
                          <button
                            key={habit.key}
                            type="button"
                            onClick={() => toggleResetHabit(habit.key)}
                            className={cn(
                              "flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[10px] font-bold transition",
                              active
                                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                                : "border-white/10 bg-white/[0.025] text-slate-500 hover:text-slate-300",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded-md border",
                                active
                                  ? "border-emerald-300/30 bg-emerald-400/15"
                                  : "border-white/10",
                              )}
                            >
                              {active ? <Check className="size-3" /> : null}
                            </span>
                            {habit[locale]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-black text-slate-300">{text.trigger}</span>
                    <Input
                      value={wellbeing.trigger ?? ""}
                      onChange={(event) => updateWellbeing({ trigger: event.target.value })}
                      placeholder={text.triggerPlaceholder}
                      maxLength={500}
                      className="mt-2 h-10 rounded-xl border-white/10 bg-slate-950/65 text-white"
                    />
                  </label>
                </div>
              </div>

              <details open className="border-t border-white/10 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-400 text-xs font-black text-slate-950">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-black text-white">{text.quickStimuli}</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        {text.quickStimuliHint}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-xs font-black",
                      quickStimuliTotal
                        ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
                        : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
                    )}
                  >
                    {quickStimuliTotal}
                  </span>
                </summary>
                {quickStimuliTotal === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateWellbeing({
                        quickReviewDone: !wellbeing.quickReviewDone,
                      })
                    }
                    className={cn(
                      "mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                      wellbeing.quickReviewDone
                        ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.025] text-slate-400 hover:text-white",
                    )}
                  >
                    <Check className="size-3.5" />
                    {wellbeing.quickReviewDone
                      ? text.reviewed
                      : text.noUnplannedStimuli}
                  </button>
                ) : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {quickStimuliOptions.map((option) => {
                    const count = wellbeing.quickStimuli?.[option.key] ?? 0;
                    return (
                      <div
                        key={option.key}
                        className={cn(
                          "rounded-xl border p-2.5 transition",
                          count
                            ? "border-rose-300/20 bg-rose-400/[0.06]"
                            : "border-white/10 bg-white/[0.025]",
                        )}
                      >
                        <div className="flex min-h-10 items-center gap-2">
                          <span className="text-lg">{option.emoji}</span>
                          <p className="text-[10px] font-bold leading-4 text-slate-300">
                            {option[locale]}
                          </p>
                        </div>
                        <div className="mt-2 grid grid-cols-[32px_1fr_32px] items-center gap-1.5">
                          <button
                            type="button"
                            disabled={count === 0}
                            onClick={() =>
                              updateWellbeing({
                                quickReviewDone: true,
                                quickStimuli: {
                                  ...wellbeing.quickStimuli,
                                  [option.key]: Math.max(0, count - 1),
                                },
                              })
                            }
                            className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-500 transition hover:text-white disabled:opacity-30"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="text-center text-lg font-black text-white">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateWellbeing({
                                quickReviewDone: true,
                                quickStimuli: {
                                  ...wellbeing.quickStimuli,
                                  [option.key]: Math.min(50, count + 1),
                                },
                              })
                            }
                            className="grid size-8 place-items-center rounded-lg border border-rose-300/15 bg-rose-400/[0.06] text-rose-200 transition hover:bg-rose-400/10"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>

              <div className="grid gap-3 border-t border-white/10 p-4 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="flex items-center justify-between gap-3 xl:col-span-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                      {text.result}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {locale === "vi"
                        ? "LifeOS tự tính từ những gì bạn vừa nhập; bạn không cần cộng trừ bằng tay."
                        : "LifeOS calculates this from your check-in; no manual math is needed."}
                    </p>
                  </div>
                  <span className={cn("text-xl font-black", scoreTone(currentControlScore))}>
                    {text.controlScore} {currentControlScore ?? "—"}/100
                  </span>
                </div>
                <div className="rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-4 text-amber-300" />
                      <p className="text-xs font-black text-white">{text.focusXp}</p>
                    </div>
                    <p className="text-xl font-black text-amber-200">{currentFocusXp}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#34d399)]"
                      style={{ width: `${Math.min(100, currentFocusXp)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>{text.weeklyXp}</span>
                    <span>{weeklyFocusXp}/350 XP</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (weeklyFocusXp / 350) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-[10px] leading-4 text-amber-100/70">
                    {unlockedReward}
                  </p>
                  <details className="mt-3 rounded-lg border border-white/10 bg-slate-950/40 p-2.5">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-black text-slate-300">
                      <CircleHelp className="size-3.5 text-cyan-300" />
                      {text.scoreHelp}
                    </summary>
                    <div className="mt-2 space-y-1 text-[9px] leading-4 text-slate-500">
                      <p>
                        {locale === "vi"
                          ? "+ Reset: ngủ 7–9 giờ, deep work, điểm neo và ít thôi thúc."
                          : "+ Reset: 7–9 hours sleep, deep work, anchors, and lower urges."}
                      </p>
                      <p>
                        {locale === "vi"
                          ? "− Reset: mạng xã hội dài và các lần kích thích ngoài chủ đích."
                          : "− Reset: long social-media use and unplanned stimulation."}
                      </p>
                      <p>
                        {locale === "vi"
                          ? "+ XP: mỗi 30 phút deep work, điểm neo, viết nhật ký và bonus Reset."
                          : "+ XP: each 30 minutes of deep work, anchors, journaling, and Reset bonuses."}
                      </p>
                    </div>
                  </details>
                </div>

                <div className="rounded-xl border border-violet-300/15 bg-violet-400/[0.06] p-3">
                  <div className="flex items-center gap-2">
                    <Gift className="size-4 text-violet-300" />
                    <p className="text-xs font-black text-white">{text.reward}</p>
                  </div>
                  <p className="mt-3 text-[10px] font-black text-violet-100">
                    {text.plannedReward}
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">
                    {text.plannedRewardHint}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {quickStimuliOptions.map((option) => {
                      const selected = wellbeing.rewardKey === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            updateWellbeing({
                              rewardClaimed: false,
                              rewardKey: selected ? "" : option.key,
                            })
                          }
                          className={cn(
                            "flex min-h-9 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[9px] font-bold transition",
                            selected
                              ? "border-violet-300/30 bg-violet-400/15 text-violet-100"
                              : "border-white/[0.07] bg-white/[0.025] text-slate-500 hover:text-slate-300",
                          )}
                        >
                          <span>{option.emoji}</span>
                          {option[locale]}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    value={wellbeing.rewardNote ?? ""}
                    onChange={(event) => updateWellbeing({ rewardNote: event.target.value })}
                    placeholder={rewardUnlocked ? text.rewardPlaceholder : text.rewardLocked}
                    maxLength={300}
                    className="mt-3 h-10 rounded-xl border-white/10 bg-slate-950/65 text-white"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[
                      { xp: 25, label: locale === "vi" ? "Nhỏ" : "Small" },
                      { xp: 45, label: locale === "vi" ? "Vừa" : "Medium" },
                      { xp: 70, label: locale === "vi" ? "Lớn" : "Large" },
                    ].map((tier) => (
                      <div
                        key={tier.xp}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-center",
                          currentFocusXp >= tier.xp
                            ? "border-emerald-300/20 bg-emerald-400/10"
                            : "border-white/[0.07] bg-white/[0.02]",
                        )}
                      >
                        <p className="text-[10px] font-black text-white">{tier.xp} XP</p>
                        <p className="text-[8px] text-slate-500">{tier.label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!rewardUnlocked || !hasPlannedReward}
                    onClick={() =>
                      updateWellbeing({
                        rewardClaimed: !wellbeing.rewardClaimed,
                      })
                    }
                    className={cn(
                      "mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40",
                      wellbeing.rewardClaimed
                        ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-100"
                        : "border-white/10 bg-white/[0.025] text-slate-400 hover:text-white",
                    )}
                  >
                    <Check className="size-3.5" />
                    {text.claimReward}
                  </button>
                </div>
              </div>

              <div className="border-t border-cyan-300/10 bg-cyan-400/[0.04] px-4 py-3 text-xs leading-5 text-cyan-100/75">
                {controlInsight}
              </div>
            </section>

            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-violet-400 text-xs font-black text-slate-950">
                4
              </span>
              <div>
                <p className="text-xs font-black text-white">
                  {locale === "vi" ? "Viết lại ngày hôm nay" : "Reflect on today"}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {locale === "vi"
                    ? "Chỉ cần 1–3 câu, tối thiểu 10 từ để hoàn thành check-in."
                    : "One to three sentences is enough; write at least 10 words to finish the check-in."}
                </p>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(event) => editContent(event.target.value)}
              placeholder={text.placeholder}
              maxLength={20000}
              className="min-h-[300px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/75 p-4 text-[15px] leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300/40 focus:ring-2 focus:ring-violet-400/10 sm:min-h-[360px] sm:p-5 sm:text-base"
            />

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                <span>
                  {wordCount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {text.words}
                </span>
                <span className="size-1 rounded-full bg-slate-700" />
                <span>
                  {content.length.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {text.characters}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedEntry ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeEntry}
                    disabled={pending}
                    title={text.delete}
                    className="size-10 rounded-xl border border-rose-300/15 bg-rose-400/[0.06] text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => persistEntry(content, mood, wellbeing)}
                  disabled={pending || (!content.trim() && !mood)}
                  className="h-10 flex-1 rounded-xl bg-[linear-gradient(135deg,#a78bfa,#22d3ee)] px-5 font-black text-slate-950 hover:opacity-90 sm:flex-none"
                >
                  <Save className="mr-2 size-4" />
                  {text.saveNow}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <ControlTrend
            data={sevenDayTrend}
            emptyText={text.noResetData}
            title={text.trend}
          />
          <section className="lifeos-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-white">{text.calendar}</h2>
                <p className="mt-1 text-[11px] text-slate-500">{text.calendarHint}</p>
              </div>
              <CalendarDays className="size-5 text-violet-300" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}
                className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-sm font-black capitalize text-white">
                {monthLabel(calendarMonth, locale)}
              </p>
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}
                className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {weekdayLabels.map((label) => (
                <span key={label} className="py-1 text-[9px] font-black uppercase text-slate-600">
                  {label}
                </span>
              ))}
              {cells.map((cell) => {
                const hasEntry = entryDates.has(cell.date);
                const isSelected = cell.date === selectedDate;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => navigateToDate(cell.date)}
                    className={cn(
                      "relative grid aspect-square place-items-center rounded-lg text-xs font-bold transition",
                      isSelected
                        ? "bg-violet-400 text-slate-950 shadow-[0_0_18px_rgba(167,139,250,0.28)]"
                        : cell.inMonth
                          ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          : "text-slate-700 hover:bg-white/[0.03]",
                    )}
                  >
                    {cell.day}
                    {hasEntry ? (
                      <span
                        className={cn(
                          "absolute bottom-1 size-1 rounded-full",
                          isSelected ? "bg-slate-950" : "bg-emerald-400",
                        )}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lifeos-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-white">{text.stats}</h2>
              <Flame className="size-5 text-amber-300" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: text.totalEntries, value: entries.length },
                { label: text.streak, value: `${streak} ${text.days}` },
                {
                  label: text.totalWords,
                  value: totalWords.toLocaleString(locale === "vi" ? "vi-VN" : "en-US"),
                },
              ].map((item) => (
                <div key={item.label} className="lifeos-subpanel p-2.5">
                  <p className="text-lg font-black text-white">{item.value}</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="lifeos-subpanel mt-4 flex items-center gap-4 p-3">
              <div
                className="grid size-20 shrink-0 place-items-center rounded-full"
                style={{ background: moodGradient }}
              >
                <div className="grid size-12 place-items-center rounded-full bg-slate-950 text-xl">
                  {favoriteMood?.count ? favoriteMood.emoji : "—"}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  {text.favoriteMood}
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {favoriteMood?.count ? favoriteMood[locale] : text.noMood}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {moodCounts
                    .filter((item) => item.count > 0)
                    .map((item) => (
                      <span key={item.value} className="text-[10px] font-bold text-slate-500">
                        {item.emoji} {item.count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <section className="lifeos-panel p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">{text.history}</h2>
              <p className="mt-1 text-xs text-slate-500">{text.historyHint}</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.search}
                className="h-10 rounded-xl border-white/10 bg-slate-950/75 pl-9 text-white"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {filteredEntries.length ? (
              filteredEntries.map((entry) => {
                const meta = moodMeta(entry.mood);
                const entryControlScore = controlScore(entry.wellbeing);
                const entryFocusXp = focusXp(
                  entry.wellbeing,
                  entry.content ?? "",
                );
                const isSelected = entry.log_date === selectedDate;
                return (
                  <details
                    key={entry.id}
                    className={cn(
                      "group rounded-xl border bg-white/[0.025] open:bg-white/[0.04]",
                      isSelected ? "border-violet-300/35" : "border-white/10",
                    )}
                  >
                    <summary className="cursor-pointer list-none p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-xl">
                          {meta?.emoji ?? "📝"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-black capitalize text-white">
                              {shortDateLabel(entry.log_date, locale)}
                            </p>
                            {isSelected ? (
                              <span className="shrink-0 rounded-full bg-violet-400/15 px-2 py-1 text-[9px] font-black text-violet-200">
                                {text.selected}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {excerpt(entry.content) || meta?.[locale] || text.empty}
                          </p>
                          <p className="mt-2 text-[10px] font-bold text-slate-600">
                            {countWords(entry.content)} {text.words}
                            {meta ? ` · ${meta[locale]}` : ""}
                            {entryControlScore != null
                              ? ` · Reset ${entryControlScore}/100`
                              : ""}
                            {entryFocusXp ? ` · ${entryFocusXp} XP` : ""}
                          </p>
                        </div>
                      </div>
                    </summary>
                    <div className="border-t border-white/10 px-4 py-3">
                      <p className="max-h-52 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {entry.content || meta?.[locale] || text.empty}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigateToDate(entry.log_date)}
                        className="mt-3 h-9 rounded-xl border border-violet-300/15 bg-violet-400/[0.07] px-3 text-xs font-black text-violet-200 hover:bg-violet-400/10"
                      >
                        <BookOpen className="mr-2 size-3.5" />
                        {text.openDay}
                      </Button>
                    </div>
                  </details>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-slate-500 lg:col-span-2">
                {text.noResults}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
