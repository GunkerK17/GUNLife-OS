"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicStoragePath } from "@/lib/supabase/storage-url";
import type {
  BodyMeasurementRow,
  WeightLogRow,
} from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const weightImageBucket = "lifeos-weight";
const maxWeightImageSize = 5 * 1024 * 1024;
const weightImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  return value;
}, z.string().url().optional());

const optionalNumber = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    schema.optional(),
  );

const weightSchema = z.object({
  id: z.string().uuid().optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.coerce.number().min(1).max(500),
  body_fat_pct: optionalNumber(z.coerce.number().min(0).max(80)),
  muscle_kg: optionalNumber(z.coerce.number().min(0).max(300)),
  visceral_fat: optionalNumber(z.coerce.number().int().min(0).max(100)),
  note: optionalText,
  image_url: optionalUrl,
});

const measurementSchema = z.object({
  id: z.string().uuid().optional(),
  measured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  chest_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  waist_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  hip_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  arm_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  thigh_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  calf_cm: optionalNumber(z.coerce.number().min(0).max(500)),
  note: optionalText,
  image_url: optionalUrl,
});

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

function getWeightImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

async function uploadWeightImage({
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

  if (!weightImageTypes.includes(file.type)) {
    return {
      ok: false,
      error: "Body photo must be a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > maxWeightImageSize) {
    return { ok: false, error: "Body photo must be smaller than 5MB." };
  }

  const extension = imageExtension(file.type);
  const path = `${userId}/${logDate}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(weightImageBucket)
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
          ? "Weight image bucket is missing. Run migration 007 first."
          : error.message,
    };
  }

  const { data } = supabase.storage.from(weightImageBucket).getPublicUrl(path);

  return { ok: true, data: { imageUrl: data.publicUrl } };
}

async function removeWeightImage(
  imageUrl: string | null | undefined,
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const path = publicStoragePath(imageUrl, weightImageBucket);

  if (path) {
    await supabase.storage.from(weightImageBucket).remove([path]);
  }
}

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

function parseWeightForm(formData: FormData) {
  const parsed = weightSchema.safeParse({
    id: formData.get("id") || undefined,
    log_date: formData.get("log_date"),
    weight_kg: formData.get("weight_kg"),
    body_fat_pct: formData.get("body_fat_pct"),
    muscle_kg: formData.get("muscle_kg"),
    visceral_fat: formData.get("visceral_fat"),
    note: formData.get("note"),
    image_url: formData.get("image_url"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message } as const;
  }

  return { ok: true, data: parsed.data } as const;
}

function parseMeasurementForm(formData: FormData) {
  const parsed = measurementSchema.safeParse({
    id: formData.get("id") || undefined,
    measured_at: formData.get("measured_at"),
    chest_cm: formData.get("chest_cm"),
    waist_cm: formData.get("waist_cm"),
    hip_cm: formData.get("hip_cm"),
    arm_cm: formData.get("arm_cm"),
    thigh_cm: formData.get("thigh_cm"),
    calf_cm: formData.get("calf_cm"),
    note: formData.get("note"),
    image_url: formData.get("image_url"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message } as const;
  }

  return { ok: true, data: parsed.data } as const;
}

function revalidateWeight() {
  revalidatePath("/dashboard/weight");
  revalidatePath("/dashboard");
}

export async function createWeightLog(
  formData: FormData,
): Promise<ActionResult<{ log: WeightLogRow }>> {
  const parsed = parseWeightForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog } = await auth.supabase
    .from("weight_logs")
    .select("image_url")
    .eq("user_id", auth.user.id)
    .eq("log_date", parsed.data.log_date)
    .maybeSingle();

  const imageUpload = await uploadWeightImage({
    file: getWeightImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("weight_logs")
    .upsert(
      {
        user_id: auth.user.id,
        log_date: parsed.data.log_date,
        weight_kg: parsed.data.weight_kg,
        body_fat_pct: parsed.data.body_fat_pct ?? null,
        muscle_kg: parsed.data.muscle_kg ?? null,
        visceral_fat: parsed.data.visceral_fat ?? null,
        note: parsed.data.note ?? null,
        image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
      },
      { onConflict: "user_id,log_date" },
    )
    .select("*")
    .single();

  if (error || !data) {
    await removeWeightImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not save body check." };
  }

  if (imageUpload.data.imageUrl) {
    await removeWeightImage(existingLog?.image_url, auth.supabase);
  }

  revalidateWeight();

  return { ok: true, data: { log: data } };
}

export async function updateWeightLog(
  formData: FormData,
): Promise<ActionResult<{ log: WeightLogRow }>> {
  const parsed = parseWeightForm(formData);

  if (!parsed.ok || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.ok ? "Missing weight log id." : parsed.error,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadWeightImage({
    file: getWeightImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("weight_logs")
    .update({
      log_date: parsed.data.log_date,
      weight_kg: parsed.data.weight_kg,
      body_fat_pct: parsed.data.body_fat_pct ?? null,
      muscle_kg: parsed.data.muscle_kg ?? null,
      visceral_fat: parsed.data.visceral_fat ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    await removeWeightImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not update body check." };
  }

  if (imageUpload.data.imageUrl) {
    await removeWeightImage(parsed.data.image_url, auth.supabase);
  }

  revalidateWeight();

  return { ok: true, data: { log: data } };
}

export async function deleteWeightLog(
  logId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid weight log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: findError } = await auth.supabase
    .from("weight_logs")
    .select("image_url")
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (findError || !existingLog) {
    return { ok: false, error: findError?.message ?? "Body check not found." };
  }

  const { error } = await auth.supabase
    .from("weight_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeWeightImage(existingLog.image_url, auth.supabase);

  revalidateWeight();

  return { ok: true, data: { id: logId } };
}

export async function removeWeightPhoto(
  logId: string,
): Promise<ActionResult<{ log: WeightLogRow }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid weight log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingLog, error: findError } = await auth.supabase
    .from("weight_logs")
    .select("image_url")
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (findError || !existingLog) {
    return { ok: false, error: findError?.message ?? "Body check not found." };
  }

  const { data, error } = await auth.supabase
    .from("weight_logs")
    .update({ image_url: null })
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not remove photo." };
  }

  await removeWeightImage(existingLog.image_url, auth.supabase);

  revalidateWeight();

  return { ok: true, data: { log: data } };
}

export async function createBodyMeasurement(
  formData: FormData,
): Promise<ActionResult<{ measurement: BodyMeasurementRow }>> {
  const parsed = parseMeasurementForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadWeightImage({
    file: getWeightImage(formData),
    logDate: parsed.data.measured_at,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("body_measurements")
    .insert({
      user_id: auth.user.id,
      measured_at: parsed.data.measured_at,
      chest_cm: parsed.data.chest_cm ?? null,
      waist_cm: parsed.data.waist_cm ?? null,
      hip_cm: parsed.data.hip_cm ?? null,
      arm_cm: parsed.data.arm_cm ?? null,
      thigh_cm: parsed.data.thigh_cm ?? null,
      calf_cm: parsed.data.calf_cm ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    await removeWeightImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not save body scan." };
  }

  revalidateWeight();

  return { ok: true, data: { measurement: data } };
}

export async function updateBodyMeasurement(
  formData: FormData,
): Promise<ActionResult<{ measurement: BodyMeasurementRow }>> {
  const parsed = parseMeasurementForm(formData);

  if (!parsed.ok || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.ok ? "Missing body measurement id." : parsed.error,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadWeightImage({
    file: getWeightImage(formData),
    logDate: parsed.data.measured_at,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("body_measurements")
    .update({
      measured_at: parsed.data.measured_at,
      chest_cm: parsed.data.chest_cm ?? null,
      waist_cm: parsed.data.waist_cm ?? null,
      hip_cm: parsed.data.hip_cm ?? null,
      arm_cm: parsed.data.arm_cm ?? null,
      thigh_cm: parsed.data.thigh_cm ?? null,
      calf_cm: parsed.data.calf_cm ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    await removeWeightImage(imageUpload.data.imageUrl, auth.supabase);
    return { ok: false, error: error?.message ?? "Could not update body scan." };
  }

  if (imageUpload.data.imageUrl) {
    await removeWeightImage(parsed.data.image_url, auth.supabase);
  }

  revalidateWeight();

  return { ok: true, data: { measurement: data } };
}

export async function deleteBodyMeasurement(
  measurementId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(measurementId).success) {
    return { ok: false, error: "Invalid body measurement id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: existingMeasurement, error: findError } = await auth.supabase
    .from("body_measurements")
    .select("image_url")
    .eq("id", measurementId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (findError || !existingMeasurement) {
    return {
      ok: false,
      error: findError?.message ?? "Body measurement not found.",
    };
  }

  const { error } = await auth.supabase
    .from("body_measurements")
    .delete()
    .eq("id", measurementId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeWeightImage(existingMeasurement.image_url, auth.supabase);

  revalidateWeight();

  return { ok: true, data: { id: measurementId } };
}
