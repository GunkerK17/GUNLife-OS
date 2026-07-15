"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicStoragePath } from "@/lib/supabase/storage-url";
import type {
  ActivityRow,
  ActivityType,
} from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const activityTypes = [
  "football",
  "running",
  "walking",
  "cycling",
  "tabata",
  "swimming",
  "other",
] as const satisfies readonly ActivityType[];

const activityImageBucket = "lifeos-activities";
const maxActivityImageSize = 5 * 1024 * 1024;
const activityImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
}, z.string().url("Image link must be a valid URL.").optional());

const optionalNumber = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    schema.optional(),
  );

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

function getActivityImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

async function uploadActivityImage({
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

  if (!activityImageTypes.includes(file.type)) {
    return {
      ok: false,
      error: "Activity photo must be a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > maxActivityImageSize) {
    return { ok: false, error: "Activity photo must be smaller than 5MB." };
  }

  const extension = imageExtension(file.type);
  const path = `${userId}/${logDate}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(activityImageBucket)
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
          ? "Activity image bucket is missing. Run migration 005 first."
          : error.message,
    };
  }

  const { data } = supabase.storage.from(activityImageBucket).getPublicUrl(path);

  return { ok: true, data: { imageUrl: data.publicUrl } };
}

async function removeActivityImage(
  imageUrl: string | null | undefined,
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const path = publicStoragePath(imageUrl, activityImageBucket);

  if (path) {
    await supabase.storage.from(activityImageBucket).remove([path]);
  }
}

const activitySchema = z.object({
  id: z.string().uuid().optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(activityTypes),
  duration_min: optionalNumber(z.coerce.number().int().min(0).max(1440)),
  calories_burned: optionalNumber(z.coerce.number().int().min(0).max(5000)),
  avg_heart_rate: optionalNumber(z.coerce.number().int().min(0).max(250)),
  max_heart_rate: optionalNumber(z.coerce.number().int().min(0).max(250)),
  distance_km: optionalNumber(z.coerce.number().min(0).max(1000)),
  note: optionalText,
  image_url: optionalUrl,
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

function parseActivityForm(formData: FormData) {
  const parsed = activitySchema.safeParse({
    id: formData.get("id") || undefined,
    log_date: formData.get("log_date"),
    type: formData.get("type"),
    duration_min: formData.get("duration_min"),
    calories_burned: formData.get("calories_burned"),
    avg_heart_rate: formData.get("avg_heart_rate"),
    max_heart_rate: formData.get("max_heart_rate"),
    distance_km: formData.get("distance_km"),
    note: formData.get("note"),
    image_url: formData.get("image_url"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message } as const;
  }

  return { ok: true, data: parsed.data } as const;
}

function revalidateActivities() {
  revalidatePath("/dashboard/activities");
  revalidatePath("/dashboard");
}

export async function createActivityLog(
  formData: FormData,
): Promise<ActionResult<{ log: ActivityRow }>> {
  const parsed = parseActivityForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadActivityImage({
    file: getActivityImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("activities")
    .insert({
      user_id: auth.user.id,
      log_date: parsed.data.log_date,
      type: parsed.data.type,
      duration_min: parsed.data.duration_min ?? null,
      calories_burned: parsed.data.calories_burned ?? null,
      avg_heart_rate: parsed.data.avg_heart_rate ?? null,
      max_heart_rate: parsed.data.max_heart_rate ?? null,
      distance_km: parsed.data.distance_km ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    await removeActivityImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not log activity." };
  }

  revalidateActivities();

  return { ok: true, data: { log: data } };
}

export async function updateActivityLog(
  formData: FormData,
): Promise<ActionResult<{ log: ActivityRow }>> {
  const parsed = parseActivityForm(formData);

  if (!parsed.ok || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.ok ? "Missing activity id." : parsed.error,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadActivityImage({
    file: getActivityImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("activities")
    .update({
      log_date: parsed.data.log_date,
      type: parsed.data.type,
      duration_min: parsed.data.duration_min ?? null,
      calories_burned: parsed.data.calories_burned ?? null,
      avg_heart_rate: parsed.data.avg_heart_rate ?? null,
      max_heart_rate: parsed.data.max_heart_rate ?? null,
      distance_km: parsed.data.distance_km ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    await removeActivityImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not update activity." };
  }

  if (imageUpload.data.imageUrl) {
    await removeActivityImage(parsed.data.image_url, auth.supabase);
  }

  revalidateActivities();

  return { ok: true, data: { log: data } };
}

export async function deleteActivityLog(
  activityId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(activityId).success) {
    return { ok: false, error: "Invalid activity id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: findError } = await auth.supabase
    .from("activities")
    .select("image_url")
    .eq("id", activityId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (findError || !existingLog) {
    return { ok: false, error: findError?.message ?? "Activity not found." };
  }

  const { error } = await auth.supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeActivityImage(existingLog.image_url, auth.supabase);

  revalidateActivities();

  return { ok: true, data: { id: activityId } };
}

export async function removeActivityPhoto(
  activityId: string,
): Promise<ActionResult<{ log: ActivityRow }>> {
  if (!z.string().uuid().safeParse(activityId).success) {
    return { ok: false, error: "Invalid activity id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: findError } = await auth.supabase
    .from("activities")
    .select("image_url")
    .eq("id", activityId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (findError || !existingLog) {
    return { ok: false, error: findError?.message ?? "Activity not found." };
  }

  const { data, error } = await auth.supabase
    .from("activities")
    .update({ image_url: null })
    .eq("id", activityId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not remove photo." };
  }

  await removeActivityImage(existingLog.image_url, auth.supabase);

  revalidateActivities();

  return { ok: true, data: { log: data } };
}
