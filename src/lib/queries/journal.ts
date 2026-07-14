import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JournalRow } from "@/lib/supabase/database.types";

export type JournalPageData = {
  entries: JournalRow[];
  selectedDate: string;
  supabaseReady: boolean;
};

export function getBangkokJournalDate(date = new Date()) {
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

function isValidDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function demoEntries(selectedDate: string): JournalRow[] {
  const now = new Date().toISOString();
  const [year, month, day] = selectedDate.split("-").map(Number);
  const previous = new Date(year, month - 1, day - 1);
  const previousDate = `${previous.getFullYear()}-${String(
    previous.getMonth() + 1,
  ).padStart(2, "0")}-${String(previous.getDate()).padStart(2, "0")}`;

  return [
    {
      id: "demo-journal-today",
      user_id: "demo",
      log_date: selectedDate,
      content:
        "Hôm nay mình giữ được nhịp tốt. Buổi tập ổn, công việc tập trung hơn và mình muốn tiếp tục duy trì điều này vào ngày mai.",
      mood: "good",
      wellbeing: {
        deepWorkMin: 90,
        habits: ["morning-no-phone", "workout", "single-task"],
        quickReviewDone: true,
        quickStimuli: { "short-video": 1, "social-scroll": 1 },
        rewardClaimed: false,
        rewardKey: "gaming",
        rewardNote: "Xem một tập phim sau khi hoàn thành việc chính",
        sleepHours: 7.5,
        socialMediaMin: 42,
        trigger: "Video ngắn khi thấy mệt",
        urgeLevel: 2,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-journal-previous",
      user_id: "demo",
      log_date: previousDate,
      content:
        "Một ngày khá bận nhưng mình vẫn hoàn thành phần quan trọng nhất. Cần ngủ sớm hơn để ngày mai có nhiều năng lượng.",
      mood: "okay",
      wellbeing: {
        deepWorkMin: 45,
        habits: ["single-task"],
        quickReviewDone: true,
        quickStimuli: { "short-video": 3, gaming: 1 },
        rewardClaimed: false,
        rewardKey: "",
        rewardNote: "",
        sleepHours: 6,
        socialMediaMin: 110,
        trigger: "Căng thẳng sau giờ làm",
        urgeLevel: 4,
      },
      created_at: now,
      updated_at: now,
    },
  ];
}

export async function getJournalPageData(
  requestedDate?: string,
): Promise<JournalPageData> {
  const selectedDate = isValidDate(requestedDate)
    ? requestedDate!
    : getBangkokJournalDate();

  if (!hasSupabaseConfig()) {
    return {
      entries: demoEntries(selectedDate),
      selectedDate,
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

  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(500);

  return {
    entries: error ? [] : (data ?? []),
    selectedDate,
    supabaseReady: true,
  };
}
