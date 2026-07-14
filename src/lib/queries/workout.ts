import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  WorkoutExerciseRow,
  WorkoutLogRow,
  WorkoutPlanRow,
} from "@/lib/supabase/database.types";

export type WorkoutPlanWithExercises = WorkoutPlanRow & {
  exercises: WorkoutExerciseRow[];
};

export type WorkoutPageData = {
  selectedDate: string;
  plans: WorkoutPlanWithExercises[];
  logs: WorkoutLogRow[];
  weekLogs: WorkoutLogRow[];
  monthLogs: WorkoutLogRow[];
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

const demoPlans: WorkoutPlanWithExercises[] = [
  {
    id: "demo-plan-push",
    user_id: "demo",
    name: "Push Strength",
    day_of_week: "1,4",
    description: "Chest, shoulders, triceps. Heavy but clean reps.",
    is_active: true,
    created_at: nowIso,
    exercises: [
      {
        id: "demo-ex-1",
        user_id: "demo",
        plan_id: "demo-plan-push",
        exercise_name: "Bench Press",
        muscle_group: "Chest",
        sets: 4,
        reps: 8,
        weight_kg: 60,
        rest_sec: 120,
        order_index: 0,
        note: "Pause first rep, control negative.",
        created_at: nowIso,
      },
      {
        id: "demo-ex-2",
        user_id: "demo",
        plan_id: "demo-plan-push",
        exercise_name: "Overhead Press",
        muscle_group: "Shoulders",
        sets: 3,
        reps: 8,
        weight_kg: 32.5,
        rest_sec: 90,
        order_index: 1,
        note: "Brace core before every set.",
        created_at: nowIso,
      },
      {
        id: "demo-ex-3",
        user_id: "demo",
        plan_id: "demo-plan-push",
        exercise_name: "Cable Triceps Pushdown",
        muscle_group: "Triceps",
        sets: 3,
        reps: 12,
        weight_kg: 25,
        rest_sec: 60,
        order_index: 2,
        note: null,
        created_at: nowIso,
      },
    ],
  },
  {
    id: "demo-plan-legs",
    user_id: "demo",
    name: "Athletic Legs",
    day_of_week: "2,6",
    description: "Legs, core, conditioning for football.",
    is_active: true,
    created_at: nowIso,
    exercises: [
      {
        id: "demo-ex-4",
        user_id: "demo",
        plan_id: "demo-plan-legs",
        exercise_name: "Back Squat",
        muscle_group: "Legs",
        sets: 5,
        reps: 5,
        weight_kg: 70,
        rest_sec: 150,
        order_index: 0,
        note: "Explosive up, full depth.",
        created_at: nowIso,
      },
    ],
  },
];

export function getBangkokDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function isValidWorkoutDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthRange(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}

function weekRange(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}

function withExercises(
  plans: WorkoutPlanRow[],
  exercises: WorkoutExerciseRow[],
): WorkoutPlanWithExercises[] {
  return plans.map((plan) => ({
    ...plan,
    exercises: exercises
      .filter((exercise) => exercise.plan_id === plan.id)
      .sort((first, second) => first.order_index - second.order_index),
  }));
}

export async function getWorkoutPageData(
  requestedDate?: string,
): Promise<WorkoutPageData> {
  const selectedDate = isValidWorkoutDate(requestedDate)
    ? requestedDate!
    : getBangkokDateString();
  const week = weekRange(selectedDate);
  const month = monthRange(selectedDate);

  if (!hasSupabaseConfig()) {
    return {
      selectedDate,
      plans: demoPlans,
      logs: [],
      weekLogs: [],
      monthLogs: [],
      supabaseReady: false,
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    plansResult,
    exercisesResult,
    logsResult,
    weekLogsResult,
    monthLogsResult,
  ] =
    await Promise.all([
    supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("workout_exercises")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", week.start)
      .lte("log_date", week.end)
      .order("log_date", { ascending: true }),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", month.start)
      .lte("log_date", month.end)
      .order("log_date", { ascending: true }),
  ]);

  if (
    plansResult.error ||
    exercisesResult.error ||
    logsResult.error ||
    weekLogsResult.error ||
    monthLogsResult.error
  ) {
    return {
      selectedDate,
      plans: [],
      logs: [],
      weekLogs: [],
      monthLogs: [],
      supabaseReady: true,
    };
  }

  return {
    selectedDate,
    plans: withExercises(plansResult.data ?? [], exercisesResult.data ?? []),
    logs: logsResult.data ?? [],
    weekLogs: weekLogsResult.data ?? [],
    monthLogs: monthLogsResult.data ?? [],
    supabaseReady: true,
  };
}
