import "server-only";

import { redirect } from "next/navigation";
import { getBangkokDateString } from "@/lib/queries/timeline";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JournalWellbeing, Mood } from "@/lib/supabase/database.types";

export type DashboardDailySummary = {
  activities: {
    avgHeartRate: number | null;
    calories: number;
    distanceKm: number;
    durationMin: number;
    maxHeartRate: number | null;
    sessions: number;
  };
  goals: {
    activeGoals: number;
    doneToday: number;
    skippedToday: number;
    topGoalProgress: number;
    topGoalTitle: string | null;
    totalToday: number;
  };
  journal: {
    contentPreview: string | null;
    controlScore: number | null;
    deepWorkMin: number;
    mood: Mood | null;
    written: boolean;
  };
  nutrition: {
    calorieGoal: number;
    calories: number;
    carbsGoal: number;
    carbs: number;
    fatGoal: number;
    fat: number;
    meals: number;
    proteinGoal: number;
    protein: number;
  };
  weight: {
    bodyFatPct: number | null;
    changeKg: number | null;
    imageUrl: string | null;
    logDate: string | null;
    muscleKg: number | null;
    weightKg: number | null;
  };
};

const emptySummary: DashboardDailySummary = {
  activities: {
    avgHeartRate: null,
    calories: 0,
    distanceKm: 0,
    durationMin: 0,
    maxHeartRate: null,
    sessions: 0,
  },
  goals: {
    activeGoals: 0,
    doneToday: 0,
    skippedToday: 0,
    topGoalProgress: 0,
    topGoalTitle: null,
    totalToday: 0,
  },
  journal: {
    contentPreview: null,
    controlScore: null,
    deepWorkMin: 0,
    mood: null,
    written: false,
  },
  nutrition: {
    calorieGoal: 2000,
    calories: 0,
    carbsGoal: 250,
    carbs: 0,
    fatGoal: 65,
    fat: 0,
    meals: 0,
    proteinGoal: 120,
    protein: 0,
  },
  weight: {
    bodyFatPct: null,
    changeKg: null,
    imageUrl: null,
    logDate: null,
    muscleKg: null,
    weightKg: null,
  },
};

function validDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function journalControlScore(value: JournalWellbeing | null | undefined) {
  if (!value) return null;

  const hasData =
    value.quickReviewDone ||
    Boolean(value.habits?.length) ||
    Boolean(value.deepWorkMin) ||
    Boolean(value.sleepHours) ||
    Boolean(value.socialMediaMin) ||
    Boolean(value.urgeLevel) ||
    Object.values(value.quickStimuli ?? {}).some((count) => count > 0);

  if (!hasData) return null;

  const unplannedCount = Object.values(value.quickStimuli ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
  const score =
    45 +
    Math.min(20, (value.habits?.length ?? 0) * 5) +
    Math.min(20, Math.round((value.deepWorkMin ?? 0) / 6)) +
    Math.min(10, Math.round((value.sleepHours ?? 0) * 1.25)) -
    Math.min(25, Math.round((value.socialMediaMin ?? 0) / 6)) -
    Math.min(20, (value.urgeLevel ?? 0) * 2) -
    Math.min(30, unplannedCount * 5);

  return clamp(Math.round(score), 0, 100);
}

function progress(current: number | null, target: number | null) {
  if (!target || target <= 0) return 0;
  return clamp(Math.round(((current ?? 0) / target) * 100), 0, 100);
}

export async function getDashboardDailySummary(
  requestedDate?: string,
): Promise<DashboardDailySummary> {
  const selectedDate = validDate(requestedDate)
    ? requestedDate!
    : getBangkokDateString();

  if (!hasSupabaseConfig()) {
    return {
      activities: {
        avgHeartRate: 128,
        calories: 320,
        distanceKm: 4.8,
        durationMin: 42,
        maxHeartRate: 164,
        sessions: 1,
      },
      goals: {
        activeGoals: 2,
        doneToday: 1,
        skippedToday: 0,
        topGoalProgress: 43,
        topGoalTitle: "30-day consistency",
        totalToday: 2,
      },
      journal: {
        contentPreview: "Kept the main priorities moving today.",
        controlScore: 82,
        deepWorkMin: 90,
        mood: "good",
        written: true,
      },
      nutrition: {
        calorieGoal: 2200,
        calories: 1680,
        carbsGoal: 250,
        carbs: 186,
        fatGoal: 65,
        fat: 48,
        meals: 4,
        proteinGoal: 140,
        protein: 118,
      },
      weight: {
        bodyFatPct: 17.8,
        changeKg: -0.4,
        imageUrl: null,
        logDate: selectedDate,
        muscleKg: 34.2,
        weightKg: 72.4,
      },
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    nutritionResult,
    profileResult,
    activitiesResult,
    weightsResult,
    goalsResult,
    goalTasksResult,
    journalResult,
  ] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("calories,protein_g,carbs_g,fat_g")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate),
    supabase
      .from("user_profiles")
      .select(
        "daily_calorie_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("activities")
      .select(
        "duration_min,calories_burned,distance_km,avg_heart_rate,max_heart_rate",
      )
      .eq("user_id", user.id)
      .eq("log_date", selectedDate),
    supabase
      .from("weight_logs")
      .select("log_date,weight_kg,body_fat_pct,muscle_kg,image_url")
      .eq("user_id", user.id)
      .lte("log_date", selectedDate)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("goals")
      .select("id,title,current_value,target_value,status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_daily_tasks")
      .select("goal_id,status")
      .eq("user_id", user.id)
      .eq("task_date", selectedDate),
    supabase
      .from("journals")
      .select("content,mood,wellbeing")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const nutritionLogs = nutritionResult.data ?? [];
  const profile = profileResult.data;
  const activityLogs = activitiesResult.data ?? [];
  const weights = weightsResult.data ?? [];
  const goals = goalsResult.data ?? [];
  const goalTasks = goalTasksResult.data ?? [];
  const journal = journalResult.data;
  const latestWeight = weights[0] ?? null;
  const previousWeight = weights[1] ?? null;
  const heartRateLogs = activityLogs.filter(
    (log) => typeof log.avg_heart_rate === "number",
  );
  const topGoal = [...goals].sort(
    (left, right) =>
      progress(right.current_value, right.target_value) -
      progress(left.current_value, left.target_value),
  )[0];

  return {
    activities: {
      avgHeartRate: heartRateLogs.length
        ? Math.round(
            heartRateLogs.reduce(
              (total, log) => total + (log.avg_heart_rate ?? 0),
              0,
            ) / heartRateLogs.length,
          )
        : null,
      calories: activityLogs.reduce(
        (total, log) => total + (log.calories_burned ?? 0),
        0,
      ),
      distanceKm: Number(
        activityLogs
          .reduce((total, log) => total + (log.distance_km ?? 0), 0)
          .toFixed(1),
      ),
      durationMin: activityLogs.reduce(
        (total, log) => total + (log.duration_min ?? 0),
        0,
      ),
      maxHeartRate: activityLogs.reduce<number | null>((highest, log) => {
        if (log.max_heart_rate == null) return highest;
        return highest == null ? log.max_heart_rate : Math.max(highest, log.max_heart_rate);
      }, null),
      sessions: activityLogs.length,
    },
    goals: {
      activeGoals: goals.length,
      doneToday: goalTasks.filter((task) => task.status === "done").length,
      skippedToday: goalTasks.filter((task) => task.status === "skipped").length,
      topGoalProgress: topGoal
        ? progress(topGoal.current_value, topGoal.target_value)
        : 0,
      topGoalTitle: topGoal?.title ?? null,
      totalToday: goalTasks.length,
    },
    journal: {
      contentPreview: journal?.content?.trim().slice(0, 120) || null,
      controlScore: journalControlScore(journal?.wellbeing),
      deepWorkMin: journal?.wellbeing?.deepWorkMin ?? 0,
      mood: journal?.mood ?? null,
      written: Boolean(journal?.content?.trim() || journal?.mood),
    },
    nutrition: {
      calorieGoal: profile?.daily_calorie_goal ?? emptySummary.nutrition.calorieGoal,
      calories: nutritionLogs.reduce(
        (total, log) => total + (log.calories ?? 0),
        0,
      ),
      carbsGoal: profile?.daily_carbs_goal ?? emptySummary.nutrition.carbsGoal,
      carbs: nutritionLogs.reduce(
        (total, log) => total + (log.carbs_g ?? 0),
        0,
      ),
      fatGoal: profile?.daily_fat_goal ?? emptySummary.nutrition.fatGoal,
      fat: nutritionLogs.reduce((total, log) => total + (log.fat_g ?? 0), 0),
      meals: nutritionLogs.length,
      proteinGoal:
        profile?.daily_protein_goal ?? emptySummary.nutrition.proteinGoal,
      protein: nutritionLogs.reduce(
        (total, log) => total + (log.protein_g ?? 0),
        0,
      ),
    },
    weight: {
      bodyFatPct: latestWeight?.body_fat_pct ?? null,
      changeKg:
        latestWeight && previousWeight
          ? Number((latestWeight.weight_kg - previousWeight.weight_kg).toFixed(1))
          : null,
      imageUrl: latestWeight?.image_url ?? null,
      logDate: latestWeight?.log_date ?? null,
      muscleKg: latestWeight?.muscle_kg ?? null,
      weightKg: latestWeight?.weight_kg ?? null,
    },
  };
}
