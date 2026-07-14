import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BodyMeasurementRow,
  WeightLogRow,
} from "@/lib/supabase/database.types";

export type WeightPageData = {
  selectedDate: string;
  logs: WeightLogRow[];
  weekLogs: WeightLogRow[];
  monthLogs: WeightLogRow[];
  measurements: BodyMeasurementRow[];
  monthMeasurements: BodyMeasurementRow[];
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

const demoLogs: WeightLogRow[] = [
  {
    id: "demo-weight-today",
    user_id: "demo",
    log_date: getBangkokDateString(),
    weight_kg: 72.4,
    body_fat_pct: 18.5,
    muscle_kg: 33.2,
    visceral_fat: 7,
    note: "Morning body check",
    image_url: null,
    created_at: nowIso,
  },
];

const demoMeasurements: BodyMeasurementRow[] = [
  {
    id: "demo-measurement",
    user_id: "demo",
    measured_at: getBangkokDateString(),
    chest_cm: 96,
    waist_cm: 78,
    hip_cm: 94,
    arm_cm: 34,
    thigh_cm: 56,
    calf_cm: 38,
    note: "Monthly gym scan",
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

export function isValidWeightDate(value: string | undefined) {
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
      id: "demo-weight-prev-a",
      log_date: toLocalDateString(new Date(year, month - 1, Math.max(1, day - 4))),
      weight_kg: 72.9,
      body_fat_pct: 18.9,
      muscle_kg: 33,
    },
    {
      ...demoLogs[0],
      id: "demo-weight-prev-b",
      log_date: toLocalDateString(new Date(year, month - 1, Math.max(1, day - 9))),
      weight_kg: 73.3,
      body_fat_pct: 19.1,
      muscle_kg: 32.8,
    },
  ];
}

export async function getWeightPageData(
  requestedDate?: string,
): Promise<WeightPageData> {
  const selectedDate = isValidWeightDate(requestedDate)
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
      measurements: demoMeasurements.map((measurement) => ({
        ...measurement,
        measured_at: selectedDate,
      })),
      monthMeasurements: demoMeasurements.map((measurement) => ({
        ...measurement,
        measured_at: selectedDate,
      })),
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
    logsResult,
    weekLogsResult,
    monthLogsResult,
    measurementsResult,
    monthMeasurementsResult,
  ] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", week.start)
      .lte("log_date", week.end)
      .order("log_date", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", month.start)
      .lte("log_date", month.end)
      .order("log_date", { ascending: true }),
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", user.id)
      .eq("measured_at", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", user.id)
      .gte("measured_at", month.start)
      .lte("measured_at", month.end)
      .order("measured_at", { ascending: true }),
  ]);

  if (
    logsResult.error ||
    weekLogsResult.error ||
    monthLogsResult.error ||
    measurementsResult.error ||
    monthMeasurementsResult.error
  ) {
    return {
      selectedDate,
      logs: [],
      weekLogs: [],
      monthLogs: [],
      measurements: [],
      monthMeasurements: [],
      supabaseReady: true,
    };
  }

  return {
    selectedDate,
    logs: logsResult.data ?? [],
    weekLogs: weekLogsResult.data ?? [],
    monthLogs: monthLogsResult.data ?? [],
    measurements: measurementsResult.data ?? [],
    monthMeasurements: monthMeasurementsResult.data ?? [],
    supabaseReady: true,
  };
}
