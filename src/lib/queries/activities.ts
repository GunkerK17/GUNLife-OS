import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityRow } from "@/lib/supabase/database.types";

export type ActivitiesPageData = {
  selectedDate: string;
  logs: ActivityRow[];
  weekLogs: ActivityRow[];
  monthLogs: ActivityRow[];
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

const demoLogs: ActivityRow[] = [
  {
    id: "demo-football",
    user_id: "demo",
    log_date: getBangkokDateString(),
    type: "football",
    duration_min: 90,
    calories_burned: 680,
    avg_heart_rate: 142,
    max_heart_rate: 178,
    distance_km: 7.4,
    note: "Evening match · high intensity",
    image_url: null,
    created_at: nowIso,
  },
  {
    id: "demo-walk",
    user_id: "demo",
    log_date: getBangkokDateString(),
    type: "walking",
    duration_min: 28,
    calories_burned: 120,
    avg_heart_rate: 96,
    max_heart_rate: 118,
    distance_km: 2.2,
    note: "Light recovery walk",
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

export function isValidActivityDate(value: string | undefined) {
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
  return [
    ...demoLogs.map((log) => ({ ...log, log_date: selectedDate })),
    {
      ...demoLogs[0],
      id: "demo-football-prev",
      log_date: toLocalDateString(
        new Date(
          Number(selectedDate.slice(0, 4)),
          Number(selectedDate.slice(5, 7)) - 1,
          Math.max(1, Number(selectedDate.slice(8, 10)) - 2),
        ),
      ),
      calories_burned: 610,
      duration_min: 82,
      distance_km: 6.9,
      avg_heart_rate: 136,
      max_heart_rate: 171,
    },
    {
      ...demoLogs[1],
      id: "demo-run-prev",
      type: "running" as const,
      log_date: toLocalDateString(
        new Date(
          Number(selectedDate.slice(0, 4)),
          Number(selectedDate.slice(5, 7)) - 1,
          Math.max(1, Number(selectedDate.slice(8, 10)) - 5),
        ),
      ),
      calories_burned: 320,
      duration_min: 35,
      distance_km: 4.8,
      avg_heart_rate: 128,
      max_heart_rate: 156,
    },
  ];
}

export async function getActivitiesPageData(
  requestedDate?: string,
): Promise<ActivitiesPageData> {
  const selectedDate = isValidActivityDate(requestedDate)
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
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", week.start)
      .lte("log_date", week.end)
      .order("log_date", { ascending: true }),
    supabase
      .from("activities")
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
