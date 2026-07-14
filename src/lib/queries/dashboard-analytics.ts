import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBangkokDateString } from "@/lib/queries/timeline";

export type DashboardDayAnalytics = {
  activeMinutes: number;
  burnedCalories: number;
  date: string;
  journalWritten: boolean;
  lifeScore: number;
  nutritionLogged: boolean;
  timelineDone: number;
  timelineRate: number;
  timelineTotal: number;
  weightLogged: boolean;
};

export type DashboardAnalyticsData = {
  days: DashboardDayAnalytics[];
};

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyDays(selectedDate: string) {
  return Array.from({ length: 7 }, (_, index) => ({
    activeMinutes: 0,
    burnedCalories: 0,
    date: shiftDate(selectedDate, index - 6),
    journalWritten: false,
    lifeScore: 0,
    nutritionLogged: false,
    timelineDone: 0,
    timelineRate: 0,
    timelineTotal: 0,
    weightLogged: false,
  }));
}

export async function getDashboardAnalytics(
  requestedDate?: string,
): Promise<DashboardAnalyticsData> {
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate
    : getBangkokDateString();
  const days = emptyDays(selectedDate);
  if (!hasSupabaseConfig()) {
    return {
      days: days.map((day, index) => ({
        ...day,
        activeMinutes: index % 2 ? 45 : 70,
        burnedCalories: index % 2 ? 240 : 420,
        journalWritten: index > 2,
        lifeScore: 56 + index * 6,
        nutritionLogged: index !== 1,
        timelineDone: 3 + (index % 3),
        timelineRate: 55 + index * 5,
        timelineTotal: 6,
        weightLogged: index === 0 || index === 6,
      })),
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const start = days[0].date;
  const end = days[6].date;
  const [timeline, workouts, activities, nutrition, weights, journals] =
    await Promise.all([
      supabase.from("timeline_logs").select("log_date,status,duration_min").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
      supabase.from("workout_logs").select("log_date,duration_min,calories_burned").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
      supabase.from("activities").select("log_date,duration_min,calories_burned").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
      supabase.from("nutrition_logs").select("log_date").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
      supabase.from("weight_logs").select("log_date").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
      supabase.from("journals").select("log_date,content,mood").eq("user_id", user.id).gte("log_date", start).lte("log_date", end),
    ]);

  return {
    days: days.map((day) => {
      const timelineLogs = (timeline.data ?? []).filter((item) => item.log_date === day.date);
      const done = timelineLogs.filter((item) => item.status === "done").length;
      const timelineRate = timelineLogs.length
        ? Math.round((done / timelineLogs.length) * 100)
        : 0;
      const workoutLogs = (workouts.data ?? []).filter((item) => item.log_date === day.date);
      const activityLogs = (activities.data ?? []).filter((item) => item.log_date === day.date);
      const activeMinutes = [...workoutLogs, ...activityLogs].reduce(
        (total, item) => total + (item.duration_min ?? 0),
        0,
      );
      const burnedCalories = [...workoutLogs, ...activityLogs].reduce(
        (total, item) => total + (item.calories_burned ?? 0),
        0,
      );
      const nutritionLogged = (nutrition.data ?? []).some((item) => item.log_date === day.date);
      const weightLogged = (weights.data ?? []).some((item) => item.log_date === day.date);
      const journalWritten = (journals.data ?? []).some(
        (item) => item.log_date === day.date && (item.content?.trim() || item.mood),
      );
      const lifeScore = Math.min(
        100,
        Math.round(
          timelineRate * 0.5 +
            (activeMinutes > 0 ? 20 : 0) +
            (nutritionLogged ? 12 : 0) +
            (journalWritten ? 10 : 0) +
            (weightLogged ? 8 : 0),
        ),
      );

      return {
        activeMinutes,
        burnedCalories,
        date: day.date,
        journalWritten,
        lifeScore,
        nutritionLogged,
        timelineDone: done,
        timelineRate,
        timelineTotal: timelineLogs.length,
        weightLogged,
      };
    }),
  };
}
