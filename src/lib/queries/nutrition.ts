import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType, NutritionLogRow } from "@/lib/supabase/database.types";

export type NutritionPageData = {
  selectedDate: string;
  logs: NutritionLogRow[];
  weekLogs: NutritionLogRow[];
  monthLogs: NutritionLogRow[];
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

const demoLogs: NutritionLogRow[] = [
  {
    id: "demo-breakfast",
    user_id: "demo",
    log_date: getBangkokDateString(),
    meal_type: "breakfast",
    food_name: "Greek yogurt + banana",
    calories: 320,
    protein_g: 24,
    carbs_g: 42,
    fat_g: 7,
    quantity: 1,
    unit: "bowl",
    note: "Light breakfast",
    image_url: null,
    created_at: nowIso,
  },
  {
    id: "demo-lunch",
    user_id: "demo",
    log_date: getBangkokDateString(),
    meal_type: "lunch",
    food_name: "Chicken rice",
    calories: 620,
    protein_g: 38,
    carbs_g: 76,
    fat_g: 16,
    quantity: 1,
    unit: "plate",
    note: "Post-workout meal",
    image_url: null,
    created_at: nowIso,
  },
];

export function getBangkokDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find(
    (part) => part.type === "month",
  )?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export function isValidNutritionDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
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

function monthRange(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}

function demoMonthLogs(selectedDate: string) {
  const [year, month, day] = selectedDate.split("-").map(Number);

  return [
    ...demoLogs.map((log) => ({ ...log, log_date: selectedDate })),
    {
      ...demoLogs[0],
      id: "demo-breakfast-prev",
      log_date: toLocalDateString(new Date(year, month - 1, Math.max(1, day - 2))),
      calories: 280,
      protein_g: 18,
      carbs_g: 34,
      fat_g: 8,
    },
    {
      ...demoLogs[1],
      id: "demo-dinner-prev",
      meal_type: "dinner" as MealType,
      food_name: "Salmon + rice",
      log_date: toLocalDateString(new Date(year, month - 1, Math.max(1, day - 5))),
      calories: 720,
      protein_g: 44,
      carbs_g: 68,
      fat_g: 26,
    },
  ];
}

export async function getNutritionPageData(
  requestedDate?: string,
): Promise<NutritionPageData> {
  const selectedDate = isValidNutritionDate(requestedDate)
    ? requestedDate!
    : getBangkokDateString();
  const week = weekRange(selectedDate);
  const month = monthRange(selectedDate);

  if (!hasSupabaseConfig()) {
    const logs = demoLogs.map((log) => ({ ...log, log_date: selectedDate }));
    const monthLogs = demoMonthLogs(selectedDate);

    return {
      selectedDate,
      logs,
      weekLogs: monthLogs.filter(
        (log) => log.log_date >= week.start && log.log_date <= week.end,
      ),
      monthLogs,
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

  const [logsResult, weekLogsResult, monthLogsResult] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", week.start)
      .lte("log_date", week.end)
      .order("log_date", { ascending: true }),
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", month.start)
      .lte("log_date", month.end)
      .order("log_date", { ascending: true }),
  ]);

  if (logsResult.error || weekLogsResult.error || monthLogsResult.error) {
    return {
      selectedDate,
      logs: [],
      weekLogs: [],
      monthLogs: [],
      supabaseReady: true,
    };
  }

  return {
    selectedDate,
    logs: logsResult.data ?? [],
    weekLogs: weekLogsResult.data ?? [],
    monthLogs: monthLogsResult.data ?? [],
    supabaseReady: true,
  };
}
