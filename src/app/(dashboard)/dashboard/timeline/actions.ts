"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  TaskStatus,
  TimelineCategory,
  TimelineLogRow,
  TimelineTemplateRow,
} from "@/lib/supabase/database.types";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const categories = [
  "sleep",
  "gym",
  "work",
  "study",
  "sport",
  "meal",
  "rest",
  "other",
] as const satisfies readonly TimelineCategory[];

const statuses = ["pending", "done", "skipped"] as const satisfies readonly TaskStatus[];

const optionalText = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.string().trim().optional(),
);

const timelineLogSchema = z.object({
  id: z.string().uuid().optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(2, "Title needs at least 2 characters"),
  category: z.enum(categories),
  source_type: z.enum(["workout_plan"]).optional(),
  source_id: z.string().uuid().optional(),
  start_time: optionalText,
  end_time: optionalText,
  duration_min: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().positive().max(1440).optional(),
  ),
  note: optionalText,
  repeat_weekly: z.string().optional(),
});

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Title needs at least 2 characters"),
  category: z.enum(categories),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_min: z.coerce.number().int().positive().max(1440),
  repeat_days: z.string().trim().optional(),
  is_active: z.string().optional(),
});

async function getAuthedSupabase() {
  if (!hasSupabaseConfig()) {
    return { ok: false, error: "Supabase is not configured yet." } as const;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to sign in first." } as const;
  }

  return { ok: true, supabase, user } as const;
}

function formText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  const meridiemMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (meridiemMatch) {
    const rawHour = Number(meridiemMatch[1]);
    const minute = meridiemMatch[2];
    const meridiem = meridiemMatch[3].toUpperCase();
    const hour =
      meridiem === "PM" && rawHour !== 12
        ? rawHour + 12
        : meridiem === "AM" && rawHour === 12
          ? 0
          : rawHour;

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const twentyFourHourMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!twentyFourHourMatch) {
    return null;
  }

  const hour = Number(twentyFourHourMatch[1]);
  const minute = Number(twentyFourHourMatch[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function deriveDuration(
  startTime: string | null,
  endTime: string | null,
  durationMin: number | undefined,
) {
  if (durationMin) {
    return durationMin;
  }

  if (!startTime || !endTime) {
    return null;
  }

  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const duration = end > start ? end - start : end + 24 * 60 - start;

  return duration > 0 ? duration : null;
}

function addMinutesToTime(value: string, durationMin: number) {
  const totalMinutes = (minutesFromTime(value) + durationMin) % (24 * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeRanges(startTime: string | null, durationMin: number | null) {
  if (!startTime) {
    return [];
  }

  const start = minutesFromTime(startTime);
  const duration = Math.min(durationMin && durationMin > 0 ? durationMin : 1, 1440);

  if (duration >= 1440) {
    return [{ start: 0, end: 1440 }];
  }

  const end = (start + duration) % (24 * 60);

  return end > start
    ? [{ start, end }]
    : [
        { start, end: 1440 },
        { start: 0, end },
      ];
}

function rangesOverlap(
  first: { start: number; end: number },
  second: { start: number; end: number },
) {
  return first.start < second.end && second.start < first.end;
}

function hasTimeConflict(
  firstStart: string | null,
  firstDuration: number | null,
  secondStart: string | null,
  secondDuration: number | null,
) {
  const firstRanges = timeRanges(firstStart, firstDuration);
  const secondRanges = timeRanges(secondStart, secondDuration);

  return firstRanges.some((firstRange) =>
    secondRanges.some((secondRange) => rangesOverlap(firstRange, secondRange)),
  );
}

function timeRangeMessage(startTime: string | null, durationMin: number | null) {
  if (!startTime) {
    return "Anytime";
  }

  return durationMin
    ? `${startTime.slice(0, 5)} - ${addMinutesToTime(startTime, durationMin)}`
    : startTime.slice(0, 5);
}

async function validateTimelineTimeAvailable({
  supabase,
  userId,
  logDate,
  startTime,
  durationMin,
  excludeLogId,
}: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
  logDate: string;
  startTime: string | null;
  durationMin: number | null;
  excludeLogId?: string;
}): Promise<ActionResult<null>> {
  if (!startTime) {
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from("timeline_logs")
    .select("id,title,start_time,duration_min")
    .eq("user_id", userId)
    .eq("log_date", logDate);

  if (error) {
    return { ok: false, error: "Could not validate timeline time." };
  }

  const conflictingLog = (data ?? []).find((log) => {
    if (log.id === excludeLogId || !log.start_time) {
      return false;
    }

    return hasTimeConflict(
      startTime,
      durationMin,
      log.start_time,
      log.duration_min,
    );
  });

  if (conflictingLog) {
    return {
      ok: false,
      error: `Time overlaps with "${conflictingLog.title}" (${timeRangeMessage(
        conflictingLog.start_time,
        conflictingLog.duration_min,
      )}).`,
    };
  }

  return { ok: true, data: null };
}

function parseTimelineLogForm(formData: FormData) {
  const rawStartTime = formText(formData.get("start_time"));
  const rawEndTime = formText(formData.get("end_time"));
  const startTime = normalizeTime(rawStartTime);
  const endTime = normalizeTime(rawEndTime);

  if (rawStartTime && !startTime) {
    return { ok: false, error: "Start time is not valid." } as const;
  }

  if (rawEndTime && !endTime) {
    return { ok: false, error: "End time is not valid." } as const;
  }

  if (endTime && !startTime) {
    return { ok: false, error: "Add a start time if you set an end time." } as const;
  }

  const parsed = timelineLogSchema.safeParse({
    id: formData.get("id") || undefined,
    log_date: formData.get("log_date"),
    title: formData.get("title"),
    category: formData.get("category"),
    source_type: formData.get("source_type") || undefined,
    source_id: formData.get("source_id") || undefined,
    start_time: startTime ?? undefined,
    end_time: endTime ?? undefined,
    duration_min: formData.get("duration_min"),
    note: formData.get("note"),
    repeat_weekly: formData.get("repeat_weekly") || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = String(firstIssue.path[0] ?? "");
    const friendlyError =
      field === "category"
        ? "Choose a valid category."
        : field === "duration_min"
          ? "Duration must be between 1 and 1440 minutes."
          : firstIssue.message;

    return { ok: false, error: friendlyError } as const;
  }

  const durationMin = deriveDuration(startTime, endTime, parsed.data.duration_min);

  if (parsed.data.repeat_weekly === "on" && (!startTime || !durationMin)) {
    return {
      ok: false,
      error: "Saving as a preset needs a start time and either an end time or duration.",
    } as const;
  }

  if (parsed.data.source_type === "workout_plan" && !parsed.data.source_id) {
    return {
      ok: false,
      error: "Choose a workout plan or use Manual gym block.",
    } as const;
  }

  if (parsed.data.source_type && parsed.data.category !== "gym") {
    return {
      ok: false,
      error: "Workout plans can only be linked to Gym blocks.",
    } as const;
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      start_time: startTime,
      end_time: endTime,
      duration_min: durationMin,
    },
  } as const;
}

export async function setTimelineLogStatus(
  logId: string,
  status: TaskStatus,
): Promise<ActionResult<{ log: TimelineLogRow }>> {
  if (!statuses.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_logs")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update block." };
  }

  if (data.source_type === "goal_daily_task" && data.source_id) {
    await auth.supabase
      .from("goal_daily_tasks")
      .update({ status })
      .eq("id", data.source_id)
      .eq("user_id", auth.user.id);
  }

  if (data.source_type === "skill_daily_task" && data.source_id) {
    await auth.supabase
      .from("skill_daily_tasks")
      .update({ status })
      .eq("id", data.source_id)
      .eq("user_id", auth.user.id);
  }

  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard");

  return { ok: true, data: { log: data } };
}

export async function createTimelineBlock(
  formData: FormData,
): Promise<ActionResult<{ log: TimelineLogRow; template?: TimelineTemplateRow }>> {
  const parsed = parseTimelineLogForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const timeValidation = await validateTimelineTimeAvailable({
    supabase: auth.supabase,
    userId: auth.user.id,
    logDate: parsed.data.log_date,
    startTime: parsed.data.start_time,
    durationMin: parsed.data.duration_min,
  });

  if (!timeValidation.ok) {
    return { ok: false, error: timeValidation.error };
  }

  let template: TimelineTemplateRow | undefined;
  const shouldSavePreset = parsed.data.repeat_weekly === "on";

  if (shouldSavePreset) {
    const { data: templateData, error: templateError } = await auth.supabase
      .from("timeline_templates")
      .insert({
        user_id: auth.user.id,
        title: parsed.data.title,
        category: parsed.data.category,
        start_time: parsed.data.start_time!,
        duration_min: parsed.data.duration_min!,
        repeat_days: "",
        color: null,
        icon: null,
        is_active: false,
      })
      .select("*")
      .single();

    if (templateError || !templateData) {
      return {
        ok: false,
        error: templateError?.message ?? "Could not create weekly template.",
      };
    }

    template = templateData;
  }

  const { data, error } = await auth.supabase
    .from("timeline_logs")
    .insert({
      user_id: auth.user.id,
      template_id: null,
      source_type: parsed.data.source_type ?? null,
      source_id: parsed.data.source_id ?? null,
      log_date: parsed.data.log_date,
      title: parsed.data.title,
      category: parsed.data.category,
      start_time: parsed.data.start_time,
      duration_min: parsed.data.duration_min,
      status: "pending",
      note: parsed.data.note || null,
      completed_at: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create block." };
  }

  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");

  return { ok: true, data: { log: data, template } };
}

export async function updateTimelineBlock(
  formData: FormData,
): Promise<ActionResult<{ log: TimelineLogRow }>> {
  const parsed = parseTimelineLogForm(formData);

  if (!parsed.ok || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.ok ? "Missing block id." : parsed.error,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const timeValidation = await validateTimelineTimeAvailable({
    supabase: auth.supabase,
    userId: auth.user.id,
    logDate: parsed.data.log_date,
    startTime: parsed.data.start_time,
    durationMin: parsed.data.duration_min,
    excludeLogId: parsed.data.id,
  });

  if (!timeValidation.ok) {
    return { ok: false, error: timeValidation.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_logs")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      source_type: parsed.data.source_type ?? null,
      source_id: parsed.data.source_id ?? null,
      start_time: parsed.data.start_time,
      duration_min: parsed.data.duration_min,
      note: parsed.data.note || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update block." };
  }

  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");

  return { ok: true, data: { log: data } };
}

export async function deleteTimelineBlock(
  logId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid timeline block id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: existingLogError } = await auth.supabase
    .from("timeline_logs")
    .select("id,log_date")
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingLogError || !existingLog) {
    return {
      ok: false,
      error: existingLogError?.message ?? "Timeline block not found.",
    };
  }

  const { error } = await auth.supabase
    .from("timeline_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { count } = await auth.supabase
    .from("timeline_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("log_date", existingLog.log_date);

  if (count === 0) {
    await auth.supabase.from("timeline_generation_suppression").upsert(
      {
        user_id: auth.user.id,
        log_date: existingLog.log_date,
        reason: "cleared_timeline_day",
      },
      { onConflict: "user_id,log_date" },
    );
  }

  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");

  return { ok: true, data: { id: logId } };
}

export async function createTimelineBlockFromTemplate(
  templateId: string,
  logDate: string,
): Promise<ActionResult<{ log: TimelineLogRow; template?: TimelineTemplateRow }>> {
  if (!z.string().uuid().safeParse(templateId).success) {
    return { ok: false, error: "Invalid template id." };
  }

  if (!z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(logDate).success) {
    return { ok: false, error: "Invalid date." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: template, error: templateError } = await auth.supabase
    .from("timeline_templates")
    .select("*")
    .eq("id", templateId)
    .eq("user_id", auth.user.id)
    .single();

  if (templateError || !template) {
    return {
      ok: false,
      error: templateError?.message ?? "Template not found.",
    };
  }

  let updatedTemplate: TimelineTemplateRow | undefined;

  if (template.is_active) {
    const { data: inactiveTemplate, error: inactiveError } = await auth.supabase
      .from("timeline_templates")
      .update({ is_active: false })
      .eq("id", template.id)
      .eq("user_id", auth.user.id)
      .select("*")
      .single();

    if (inactiveError || !inactiveTemplate) {
      return {
        ok: false,
        error: inactiveError?.message ?? "Could not turn template into a preset.",
      };
    }

    updatedTemplate = inactiveTemplate;

    const { error: cleanupError } = await auth.supabase
      .from("timeline_logs")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("template_id", template.id)
      .eq("status", "pending");

    if (cleanupError) {
      return {
        ok: false,
        error: cleanupError.message,
      };
    }
  }

  const timeValidation = await validateTimelineTimeAvailable({
    supabase: auth.supabase,
    userId: auth.user.id,
    logDate,
    startTime: template.start_time,
    durationMin: template.duration_min,
  });

  if (!timeValidation.ok) {
    return { ok: false, error: timeValidation.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_logs")
    .insert({
      user_id: auth.user.id,
      template_id: null,
      log_date: logDate,
      title: template.title,
      category: template.category,
      start_time: template.start_time,
      duration_min: template.duration_min,
      status: "pending",
      note: "Added from preset",
      completed_at: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Could not add template to timeline.",
    };
  }

  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");

  return { ok: true, data: { log: data, template: updatedTemplate } };
}

export async function createTimelineTemplate(
  formData: FormData,
): Promise<ActionResult<{ template: TimelineTemplateRow }>> {
  const parsed = templateSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    start_time: formData.get("start_time"),
    duration_min: formData.get("duration_min"),
    repeat_days: formData.getAll("repeat_days").join(","),
    is_active: formData.get("is_active") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const startTime = normalizeTime(parsed.data.start_time);

  if (!startTime) {
    return { ok: false, error: "Start time is not valid." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_templates")
    .insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      start_time: startTime,
      duration_min: parsed.data.duration_min,
      repeat_days: "",
      color: null,
      icon: null,
      is_active: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create template." };
  }

  revalidatePath("/dashboard/timeline");

  return { ok: true, data: { template: data } };
}

export async function updateTimelineTemplate(
  formData: FormData,
): Promise<ActionResult<{ template: TimelineTemplateRow }>> {
  const parsed = templateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    category: formData.get("category"),
    start_time: formData.get("start_time"),
    duration_min: formData.get("duration_min"),
    repeat_days: formData.getAll("repeat_days").join(","),
    is_active: formData.get("is_active") || undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.error?.issues[0]?.message ?? "Missing template id.",
    };
  }

  const startTime = normalizeTime(parsed.data.start_time);

  if (!startTime) {
    return { ok: false, error: "Start time is not valid." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_templates")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      start_time: startTime,
      duration_min: parsed.data.duration_min,
      repeat_days: "",
      is_active: false,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update template." };
  }

  revalidatePath("/dashboard/timeline");

  return { ok: true, data: { template: data } };
}

export async function setTimelineTemplateActive(
  templateId: string,
  isActive: boolean,
): Promise<ActionResult<{ template: TimelineTemplateRow }>> {
  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("timeline_templates")
    .update({ is_active: isActive })
    .eq("id", templateId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update template." };
  }

  revalidatePath("/dashboard/timeline");

  return { ok: true, data: { template: data } };
}

export async function deleteTimelineTemplate(
  templateId: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("timeline_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/timeline");

  return { ok: true, data: { id: templateId } };
}
