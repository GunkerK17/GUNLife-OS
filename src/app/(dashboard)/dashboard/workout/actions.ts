"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  WorkoutExerciseRow,
  WorkoutLogRow,
  WorkoutPlanRow,
} from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const dayValues = ["0", "1", "2", "3", "4", "5", "6"] as const;
const workoutImageBucket = "lifeos-workout";
const maxWorkoutImageSize = 5 * 1024 * 1024;
const workoutImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const optionalText = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess((value) => {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
}, z.string().url("Video link must be a valid URL.").optional());

const optionalNumber = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    schema.optional(),
  );

const planSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Plan name needs at least 2 characters"),
  day_of_week: z.enum(dayValues),
  description: optionalText,
  is_active: z.string().optional(),
});

const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  plan_id: z.string().uuid(),
  exercise_name: z
    .string()
    .trim()
    .min(2, "Exercise name needs at least 2 characters"),
  muscle_group: optionalText,
  sets: optionalNumber(z.coerce.number().int().min(1).max(30)),
  reps: optionalNumber(z.coerce.number().int().min(1).max(300)),
  weight_kg: optionalNumber(z.coerce.number().min(0).max(1000)),
  rest_sec: optionalNumber(z.coerce.number().int().min(0).max(3600)),
  order_index: optionalNumber(z.coerce.number().int().min(0).max(999)),
  note: optionalUrl,
});

const logSchema = z.object({
  plan_id: z.string().uuid().optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_min: optionalNumber(z.coerce.number().int().min(1).max(1440)),
  calories_burned: optionalNumber(z.coerce.number().int().min(0).max(5000)),
  avg_heart_rate: optionalNumber(z.coerce.number().int().min(0).max(250)),
  max_heart_rate: optionalNumber(z.coerce.number().int().min(0).max(250)),
  note: optionalText,
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

function revalidateWorkout() {
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");
}

async function ensurePlanOwner(planId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}

async function getOwnedPlan(planId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function imageExtension(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  if (contentType === "image/gif") {
    return "gif";
  }

  return "jpg";
}

function getWorkoutImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

async function uploadWorkoutImage({
  file,
  logDate,
  supabase,
  userId,
}: {
  file: File | null;
  logDate: string;
  supabase: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
}): Promise<ActionResult<{ imageUrl: string | null }>> {
  if (!file) {
    return { ok: true, data: { imageUrl: null } };
  }

  if (!workoutImageTypes.includes(file.type)) {
    return {
      ok: false,
      error: "Workout photo must be a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > maxWorkoutImageSize) {
    return { ok: false, error: "Workout photo must be smaller than 5MB." };
  }

  const extension = imageExtension(file.type);
  const path = `${userId}/${logDate}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(workoutImageBucket)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return {
      ok: false,
      error:
        error.message === "Bucket not found"
          ? "Workout image bucket is missing. Run the latest Supabase migration first."
          : error.message,
    };
  }

  const { data } = supabase.storage.from(workoutImageBucket).getPublicUrl(path);

  return { ok: true, data: { imageUrl: data.publicUrl } };
}

async function markWorkoutTimelineDone({
  caloriesBurned,
  durationMin,
  logDate,
  planId,
  planName,
  supabase,
  userId,
}: {
  caloriesBurned?: number;
  durationMin?: number;
  logDate: string;
  planId?: string | null;
  planName?: string | null;
  supabase: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("timeline_logs")
    .select("id,title,status,source_type,source_id")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .eq("category", "gym");

  if (error) {
    return;
  }

  const noteParts = [
    "Workout logged",
    durationMin ? `${durationMin} min` : null,
    caloriesBurned ? `${caloriesBurned} kcal` : null,
  ].filter(Boolean);

  if (!data?.length) {
    await supabase.from("timeline_logs").insert({
      user_id: userId,
      template_id: null,
      source_type: planId ? "workout_plan" : "workout_log",
      source_id: planId ?? null,
      log_date: logDate,
      title: planName ? `Gym — ${planName}` : "Workout",
      category: "gym",
      start_time: null,
      duration_min: durationMin ?? null,
      status: "done",
      note: noteParts.join(" • "),
      completed_at: new Date().toISOString(),
    });
    return;
  }

  const normalizedPlanName = planName?.toLowerCase();
  const pendingLogs = data.filter((log) => log.status !== "done");
  const matchingLog =
    pendingLogs.find(
      (log) =>
        planId &&
        log.source_type === "workout_plan" &&
        log.source_id === planId,
    ) ??
    pendingLogs.find((log) =>
      normalizedPlanName
        ? log.title.toLowerCase().includes(normalizedPlanName)
        : true,
    ) ?? pendingLogs[0];

  if (!matchingLog) {
    return;
  }

  await supabase
    .from("timeline_logs")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      source_type: planId ? "workout_plan" : matchingLog.source_type,
      source_id: planId ?? matchingLog.source_id,
      note: noteParts.join(" • "),
    })
    .eq("id", matchingLog.id)
    .eq("user_id", userId);
}

export async function createWorkoutPlan(
  formData: FormData,
): Promise<ActionResult<{ plan: WorkoutPlanRow }>> {
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    day_of_week: formData.get("day_of_week"),
    description: formData.get("description"),
    is_active: formData.get("is_active") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("workout_plans")
    .insert({
      user_id: auth.user.id,
      name: parsed.data.name,
      day_of_week: parsed.data.day_of_week,
      description: parsed.data.description ?? null,
      is_active: parsed.data.is_active === "on",
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create plan." };
  }

  revalidateWorkout();

  return { ok: true, data: { plan: data } };
}

export async function updateWorkoutPlan(
  formData: FormData,
): Promise<ActionResult<{ plan: WorkoutPlanRow }>> {
  const parsed = planSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    day_of_week: formData.get("day_of_week"),
    description: formData.get("description"),
    is_active: formData.get("is_active") || undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.error?.issues[0]?.message ?? "Missing plan id.",
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("workout_plans")
    .update({
      name: parsed.data.name,
      day_of_week: parsed.data.day_of_week,
      description: parsed.data.description ?? null,
      is_active: parsed.data.is_active === "on",
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update plan." };
  }

  revalidateWorkout();

  return { ok: true, data: { plan: data } };
}

export async function deleteWorkoutPlan(
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(planId).success) {
    return { ok: false, error: "Invalid plan id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("workout_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateWorkout();

  return { ok: true, data: { id: planId } };
}

export async function createWorkoutExercise(
  formData: FormData,
): Promise<ActionResult<{ exercise: WorkoutExerciseRow }>> {
  const parsed = exerciseSchema.safeParse({
    plan_id: formData.get("plan_id"),
    exercise_name: formData.get("exercise_name"),
    muscle_group: formData.get("muscle_group"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weight_kg: formData.get("weight_kg"),
    rest_sec: formData.get("rest_sec"),
    order_index: formData.get("order_index"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  if (!(await ensurePlanOwner(parsed.data.plan_id, auth.user.id))) {
    return { ok: false, error: "Workout plan not found." };
  }

  const { data, error } = await auth.supabase
    .from("workout_exercises")
    .insert({
      user_id: auth.user.id,
      plan_id: parsed.data.plan_id,
      exercise_name: parsed.data.exercise_name,
      muscle_group: parsed.data.muscle_group ?? null,
      sets: parsed.data.sets ?? null,
      reps: parsed.data.reps ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      rest_sec: parsed.data.rest_sec ?? null,
      order_index: parsed.data.order_index ?? 0,
      note: parsed.data.note ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not add exercise." };
  }

  revalidateWorkout();

  return { ok: true, data: { exercise: data } };
}

export async function updateWorkoutExercise(
  formData: FormData,
): Promise<ActionResult<{ exercise: WorkoutExerciseRow }>> {
  const parsed = exerciseSchema.safeParse({
    id: formData.get("id"),
    plan_id: formData.get("plan_id"),
    exercise_name: formData.get("exercise_name"),
    muscle_group: formData.get("muscle_group"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weight_kg: formData.get("weight_kg"),
    rest_sec: formData.get("rest_sec"),
    order_index: formData.get("order_index"),
    note: formData.get("note"),
  });

  if (!parsed.success || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.error?.issues[0]?.message ?? "Missing exercise id.",
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  if (!(await ensurePlanOwner(parsed.data.plan_id, auth.user.id))) {
    return { ok: false, error: "Workout plan not found." };
  }

  const { data, error } = await auth.supabase
    .from("workout_exercises")
    .update({
      exercise_name: parsed.data.exercise_name,
      muscle_group: parsed.data.muscle_group ?? null,
      sets: parsed.data.sets ?? null,
      reps: parsed.data.reps ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      rest_sec: parsed.data.rest_sec ?? null,
      order_index: parsed.data.order_index ?? 0,
      note: parsed.data.note ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update exercise." };
  }

  revalidateWorkout();

  return { ok: true, data: { exercise: data } };
}

export async function deleteWorkoutExercise(
  exerciseId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(exerciseId).success) {
    return { ok: false, error: "Invalid exercise id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("workout_exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateWorkout();

  return { ok: true, data: { id: exerciseId } };
}

export async function createWorkoutLog(
  formData: FormData,
): Promise<ActionResult<{ log: WorkoutLogRow }>> {
  const parsed = logSchema.safeParse({
    plan_id: formData.get("plan_id") || undefined,
    log_date: formData.get("log_date"),
    duration_min: formData.get("duration_min"),
    calories_burned: formData.get("calories_burned"),
    avg_heart_rate: formData.get("avg_heart_rate"),
    max_heart_rate: formData.get("max_heart_rate"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const plan = parsed.data.plan_id
    ? await getOwnedPlan(parsed.data.plan_id, auth.user.id)
    : null;

  if (parsed.data.plan_id && !plan) {
    return { ok: false, error: "Workout plan not found." };
  }

  const imageResult = await uploadWorkoutImage({
    file: getWorkoutImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageResult.ok) {
    return { ok: false, error: imageResult.error };
  }

  const { data, error } = await auth.supabase
    .from("workout_logs")
    .insert({
      user_id: auth.user.id,
      plan_id: parsed.data.plan_id ?? null,
      log_date: parsed.data.log_date,
      duration_min: parsed.data.duration_min ?? null,
      calories_burned: parsed.data.calories_burned ?? null,
      avg_heart_rate: parsed.data.avg_heart_rate ?? null,
      max_heart_rate: parsed.data.max_heart_rate ?? null,
      note: parsed.data.note ?? null,
      image_url: imageResult.data.imageUrl,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not log workout." };
  }

  await markWorkoutTimelineDone({
    caloriesBurned: parsed.data.calories_burned,
    durationMin: parsed.data.duration_min,
    logDate: parsed.data.log_date,
    planId: plan?.id ?? parsed.data.plan_id ?? null,
    planName: plan?.name,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  revalidateWorkout();

  return { ok: true, data: { log: data } };
}

export async function deleteWorkoutLog(
  logId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid workout log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("workout_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateWorkout();

  return { ok: true, data: { id: logId } };
}

export async function addWorkoutLogPhoto(
  formData: FormData,
): Promise<ActionResult<{ log: WorkoutLogRow }>> {
  const logId = formData.get("log_id");

  if (typeof logId !== "string" || !z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid workout log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: existingLogError } = await auth.supabase
    .from("workout_logs")
    .select("*")
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingLogError || !existingLog) {
    return {
      ok: false,
      error: existingLogError?.message ?? "Workout log not found.",
    };
  }

  const imageResult = await uploadWorkoutImage({
    file: getWorkoutImage(formData),
    logDate: existingLog.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageResult.ok) {
    return { ok: false, error: imageResult.error };
  }

  if (!imageResult.data.imageUrl) {
    return { ok: false, error: "Choose a workout photo first." };
  }

  const { data, error } = await auth.supabase
    .from("workout_logs")
    .update({ image_url: imageResult.data.imageUrl })
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not add photo." };
  }

  revalidateWorkout();

  return { ok: true, data: { log: data } };
}
