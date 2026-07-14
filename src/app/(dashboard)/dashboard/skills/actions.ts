"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatSkillTaskTimelineNote,
  serializeSkillTaskDetailNote,
} from "@/lib/skill-task-detail";
import type {
  SkillDailyTaskRow,
  TaskStatus,
} from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const taskStatuses = ["pending", "done", "skipped"] as const satisfies readonly TaskStatus[];

const optionalText = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.string().trim().optional(),
);

const skillTaskDetailsSchema = z.object({
  task_id: z.string().uuid(),
  description: z.string().trim().min(2, "Task needs at least 2 characters."),
  duration_min: z.coerce.number().int().min(0).max(1440),
  lesson_url: optionalText,
  notes: optionalText,
  result: optionalText,
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

function revalidateSkills() {
  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");
}

export async function setSkillTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult<{ task: SkillDailyTaskRow }>> {
  if (!z.string().uuid().safeParse(taskId).success || !taskStatuses.includes(status)) {
    return { ok: false, error: "Invalid skill task status request." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: task, error } = await auth.supabase
    .from("skill_daily_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Could not update skill task." };
  }

  await auth.supabase
    .from("timeline_logs")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("user_id", auth.user.id)
    .eq("source_type", "skill_daily_task")
    .eq("source_id", taskId);

  revalidateSkills();

  return { ok: true, data: { task } };
}

export async function updateSkillTaskDetails(
  formData: FormData,
): Promise<ActionResult<{ task: SkillDailyTaskRow }>> {
  const parsed = skillTaskDetailsSchema.safeParse({
    task_id: formData.get("task_id"),
    description: formData.get("description"),
    duration_min: formData.get("duration_min"),
    lesson_url: formData.get("lesson_url"),
    notes: formData.get("notes"),
    result: formData.get("result"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const detail = {
    lessonUrl: parsed.data.lesson_url ?? "",
    notes: parsed.data.notes ?? "",
    result: parsed.data.result ?? "",
  };

  const { data: task, error } = await auth.supabase
    .from("skill_daily_tasks")
    .update({
      description: parsed.data.description,
      duration_min: parsed.data.duration_min,
      note: serializeSkillTaskDetailNote(detail),
    })
    .eq("id", parsed.data.task_id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Could not update skill task." };
  }

  await auth.supabase
    .from("timeline_logs")
    .update({
      title: parsed.data.description,
      duration_min: parsed.data.duration_min,
      note: formatSkillTaskTimelineNote(detail),
    })
    .eq("user_id", auth.user.id)
    .eq("source_type", "skill_daily_task")
    .eq("source_id", parsed.data.task_id);

  revalidateSkills();
  revalidatePath(`/dashboard/skills/task/${parsed.data.task_id}`);

  return { ok: true, data: { task } };
}
