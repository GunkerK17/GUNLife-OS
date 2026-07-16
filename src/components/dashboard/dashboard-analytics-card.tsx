"use client";

import { BarChart3, Gauge } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import type { DashboardAnalyticsData } from "@/lib/queries/dashboard-analytics";
import { cn } from "@/lib/utils";

const copy = {
  vi: {
    activeDays: "Có vận động",
    activeTime: "Tổng thời gian vận động",
    averagesHint: "Trung bình và tổng số liệu của đúng khoảng ngày phía trên.",
    calories: "Tổng calories đốt",
    chartHint: "Xanh lá: điểm tổng hợp · Xanh dương: % block Timeline đã hoàn thành.",
    chartTitle: "Mỗi ngày bạn hoàn thành được bao nhiêu?",
    consistencyDisclaimer:
      "Đây là điểm duy trì thói quen trong ngày, không phải điểm sức khỏe y tế.",
    dailyScore: "Điểm ngày",
    dateRangeHint: "so sánh điểm tổng hợp trong ngày và tỷ lệ hoàn thành Timeline.",
    doneTasks: "việc xong",
    formulaActivity: "Có Workout / Activity",
    formulaJournal: "Có viết nhật ký",
    formulaNutrition: "Có ghi dinh dưỡng",
    formulaTimeline: "% Timeline hoàn thành",
    formulaTitle: "Điểm ngày được tính thế nào?",
    formulaWeight: "Có check-in cân nặng",
    journal: "Nhật ký",
    lifeScoreAverage: "Điểm ngày trung bình",
    nutrition: "Dinh dưỡng",
    resultTitle: "Kết quả trong 7 ngày",
    scale: "Thang điểm 0–100",
    section: "Thống kê 7 ngày",
    timelineAverage: "Timeline trung bình",
    timelineDone: "Timeline hoàn thành",
    title: "Mức độ hoàn thành trong 7 ngày gần nhất",
    weight: "Cân nặng",
  },
  en: {
    activeDays: "Active",
    activeTime: "Total active time",
    averagesHint: "Averages and totals for the exact date range above.",
    calories: "Total calories burned",
    chartHint: "Green: combined daily score · Blue: completed Timeline blocks.",
    chartTitle: "How much did you complete each day?",
    consistencyDisclaimer:
      "This is a daily consistency score, not a medical health score.",
    dailyScore: "Daily score",
    dateRangeHint: "compares the combined daily score with Timeline completion.",
    doneTasks: "tasks done",
    formulaActivity: "Workout / Activity logged",
    formulaJournal: "Journal written",
    formulaNutrition: "Nutrition logged",
    formulaTimeline: "Timeline completion",
    formulaTitle: "How is the daily score calculated?",
    formulaWeight: "Weight check-in",
    journal: "Journal",
    lifeScoreAverage: "Average daily score",
    nutrition: "Nutrition",
    resultTitle: "7-day result",
    scale: "0–100 scale",
    section: "7-day analytics",
    timelineAverage: "Average Timeline",
    timelineDone: "Timeline completed",
    title: "Completion over the last 7 days",
    weight: "Weight",
  },
} as const;

function formatShortDate(dateString: string, locale: "vi" | "en") {
  const date = new Date(`${dateString}T00:00:00+07:00`);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).format(date);
}

function focusTimeLabel(minutes: number, locale: "vi" | "en") {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return locale === "vi"
    ? `${hours}g ${String(remainingMinutes).padStart(2, "0")}p`
    : `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

export function DashboardAnalyticsCard({ data }: { data: DashboardAnalyticsData }) {
  const { locale } = useI18n();
  const text = copy[locale];
  const averageScore = Math.round(
    data.days.reduce((total, day) => total + day.lifeScore, 0) /
      Math.max(data.days.length, 1),
  );
  const averageTimeline = Math.round(
    data.days.reduce((total, day) => total + day.timelineRate, 0) /
      Math.max(data.days.length, 1),
  );
  const activeDays = data.days.filter((day) => day.activeMinutes > 0).length;
  const totalActiveMinutes = data.days.reduce(
    (total, day) => total + day.activeMinutes,
    0,
  );
  const burnedCalories = data.days.reduce(
    (total, day) => total + day.burnedCalories,
    0,
  );
  const journalDays = data.days.filter((day) => day.journalWritten).length;
  const nutritionDays = data.days.filter((day) => day.nutritionLogged).length;
  const weightDays = data.days.filter((day) => day.weightLogged).length;
  const firstDate = data.days[0]?.date ?? "";
  const lastDate = data.days.at(-1)?.date ?? firstDate;
  const rangeLabel = firstDate
    ? `${formatShortDate(firstDate, locale)} – ${formatShortDate(lastDate, locale)}`
    : "—";

  return (
    <section className="lifeos-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[linear-gradient(120deg,rgba(34,211,238,0.09),rgba(34,197,94,0.08),transparent)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300">
            {text.section}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">{text.title}</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {rangeLabel} · {text.dateRangeHint}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/[0.06] px-2.5 py-1.5">
            <span className="size-2 rounded-full bg-emerald-400" /> {text.dailyScore}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-300/15 bg-cyan-400/[0.06] px-2.5 py-1.5">
            <span className="size-2 rounded-full bg-cyan-400" /> {text.timelineDone}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-3 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-black text-white">{text.chartTitle}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{text.chartHint}</p>
            </div>
            <span className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-slate-400 sm:block">
              {text.scale}
            </span>
          </div>

          <div className="min-w-0 p-2.5 sm:p-4">
            <div className="min-w-0">
              <div className="grid min-w-0 grid-cols-[26px_minmax(0,1fr)] gap-2 sm:grid-cols-[34px_minmax(0,1fr)] sm:gap-3">
                <div className="relative h-48 text-[9px] font-bold tabular-nums text-slate-600">
                  {[100, 75, 50, 25, 0].map((value) => (
                    <span key={value} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - value}%` }}>
                      {value}
                    </span>
                  ))}
                </div>
                <div className="relative h-48">
                  {[100, 75, 50, 25, 0].map((value) => (
                    <span key={value} className="absolute inset-x-0 border-t border-dashed border-white/[0.07]" style={{ top: `${100 - value}%` }} />
                  ))}
                  <div className="relative grid h-full min-w-0 grid-cols-7 gap-1 px-0.5 sm:gap-2 sm:px-1 lg:gap-3">
                    {data.days.map((day) => (
                      <div key={day.date} className="flex h-full min-w-0 items-end justify-center gap-0.5 sm:gap-1">
                        <div className="relative w-2.5 min-w-0 rounded-t-sm bg-[linear-gradient(180deg,#6ee7b7,#16a34a)] shadow-[0_0_18px_rgba(52,211,153,0.18)] sm:w-5 sm:rounded-t-md lg:w-7 lg:rounded-t-lg" style={{ height: `${Math.max(day.lifeScore, 2)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-black tabular-nums text-emerald-300 sm:-top-6 sm:text-[9px] lg:text-[10px]">{day.lifeScore}</span>
                        </div>
                        <div className="relative w-2.5 min-w-0 rounded-t-sm bg-[linear-gradient(180deg,#67e8f9,#0284c7)] shadow-[0_0_18px_rgba(34,211,238,0.16)] sm:w-5 sm:rounded-t-md lg:w-7 lg:rounded-t-lg" style={{ height: `${Math.max(day.timelineRate, 2)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-black tabular-nums text-cyan-300 sm:-top-6 sm:text-[9px] lg:text-[10px]">{day.timelineRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ml-8 mt-2 grid min-w-0 grid-cols-7 gap-1 px-0.5 sm:ml-[47px] sm:gap-2 sm:px-1 lg:gap-3">
                {data.days.map((day) => {
                  const date = new Date(`${day.date}T00:00:00+07:00`);
                  const label = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
                    timeZone: "Asia/Bangkok",
                    weekday: "short",
                  }).format(date);
                  return (
                    <div key={day.date} className="min-w-0 rounded-md border border-white/[0.07] bg-white/[0.025] px-0.5 py-1.5 text-center sm:rounded-lg sm:p-2">
                      <p className="truncate text-[7px] font-black uppercase text-white sm:text-[9px] lg:text-[10px]">{label} {day.date.slice(8)}</p>
                      <p className="mt-1 hidden text-[9px] font-bold text-slate-500 sm:block">{day.timelineDone}/{day.timelineTotal} {text.doneTasks}</p>
                      <p className="mt-0.5 hidden text-[9px] text-violet-300 lg:block">{day.activeMinutes}m · {day.burnedCalories} kcal</p>
                      <div className="mt-1 flex items-center justify-center gap-0.5 sm:mt-2 sm:gap-1">
                        <span className={cn("size-1.5 rounded-full", day.nutritionLogged ? "bg-orange-300" : "bg-slate-800")} />
                        <span className={cn("size-1.5 rounded-full", day.weightLogged ? "bg-sky-300" : "bg-slate-800")} />
                        <span className={cn("size-1.5 rounded-full", day.journalWritten ? "bg-fuchsia-300" : "bg-slate-800")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-white">{text.resultTitle}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{text.averagesHint}</p>
              </div>
              <BarChart3 className="size-5 text-emerald-300" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: text.lifeScoreAverage, value: `${averageScore}/100`, accent: "text-emerald-300" },
                { label: text.timelineAverage, value: `${averageTimeline}%`, accent: "text-cyan-300" },
                { label: text.activeTime, value: focusTimeLabel(totalActiveMinutes, locale), accent: "text-violet-300" },
                { label: text.calories, value: `${burnedCalories.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} kcal`, accent: "text-orange-300" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/[0.07] bg-slate-950/40 p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-600">{item.label}</p>
                  <p className={cn("mt-1 text-base font-black", item.accent)}>{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {text.activeDays} {activeDays}/7 · {text.journal} {journalDays}/7 · {text.nutrition} {nutritionDays}/7 · {text.weight} {weightDays}/7
            </p>
          </div>

          <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.055] p-3.5">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-emerald-300" />
              <p className="text-xs font-black text-white">{text.formulaTitle}</p>
            </div>
            <div className="mt-3 space-y-2 text-[11px] text-slate-400">
              <p className="flex justify-between gap-3"><span>{text.formulaTimeline}</span><strong className="text-emerald-200">{locale === "vi" ? "tối đa 50đ" : "up to 50"}</strong></p>
              <p className="flex justify-between gap-3"><span>{text.formulaActivity}</span><strong className="text-violet-200">20</strong></p>
              <p className="flex justify-between gap-3"><span>{text.formulaNutrition}</span><strong className="text-orange-200">12</strong></p>
              <p className="flex justify-between gap-3"><span>{text.formulaJournal}</span><strong className="text-fuchsia-200">10</strong></p>
              <p className="flex justify-between gap-3"><span>{text.formulaWeight}</span><strong className="text-sky-200">8</strong></p>
            </div>
            <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">{text.consistencyDisclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
