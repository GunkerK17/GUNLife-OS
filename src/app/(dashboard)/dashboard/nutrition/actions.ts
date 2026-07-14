"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType, NutritionLogRow } from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const mealTypes = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const satisfies readonly MealType[];

const nutritionImageBucket = "lifeos-nutrition";
const maxNutritionImageSize = 5 * 1024 * 1024;
const nutritionImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

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

const nutritionSchema = z.object({
  id: z.string().uuid().optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(mealTypes),
  food_name: z.string().trim().min(1, "Food name is required."),
  calories: optionalNumber(z.coerce.number().min(0).max(20000)),
  protein_g: optionalNumber(z.coerce.number().min(0).max(1000)),
  carbs_g: optionalNumber(z.coerce.number().min(0).max(1000)),
  fat_g: optionalNumber(z.coerce.number().min(0).max(1000)),
  quantity: optionalNumber(z.coerce.number().min(0).max(100000)),
  unit: optionalText,
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

function getNutritionImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

async function uploadNutritionImage({
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

  if (!nutritionImageTypes.includes(file.type)) {
    return {
      ok: false,
      error: "Food photo must be a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > maxNutritionImageSize) {
    return { ok: false, error: "Food photo must be smaller than 5MB." };
  }

  const extension = imageExtension(file.type);
  const path = `${userId}/${logDate}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(nutritionImageBucket)
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
          ? "Nutrition image bucket is missing. Run migration 006 first."
          : error.message,
    };
  }

  const { data } = supabase.storage
    .from(nutritionImageBucket)
    .getPublicUrl(path);

  return { ok: true, data: { imageUrl: data.publicUrl } };
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

function parseNutritionForm(formData: FormData) {
  const parsed = nutritionSchema.safeParse({
    id: formData.get("id") || undefined,
    log_date: formData.get("log_date"),
    meal_type: formData.get("meal_type"),
    food_name: formData.get("food_name"),
    calories: formData.get("calories"),
    protein_g: formData.get("protein_g"),
    carbs_g: formData.get("carbs_g"),
    fat_g: formData.get("fat_g"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    note: formData.get("note"),
    image_url: formData.get("image_url"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message } as const;
  }

  return { ok: true, data: parsed.data } as const;
}

function revalidateNutrition() {
  revalidatePath("/dashboard/nutrition");
  revalidatePath("/dashboard");
}

export async function createNutritionLog(
  formData: FormData,
): Promise<ActionResult<{ log: NutritionLogRow }>> {
  const parsed = parseNutritionForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadNutritionImage({
    file: getNutritionImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("nutrition_logs")
    .insert({
      user_id: auth.user.id,
      log_date: parsed.data.log_date,
      meal_type: parsed.data.meal_type,
      food_name: parsed.data.food_name,
      calories: parsed.data.calories ?? null,
      protein_g: parsed.data.protein_g ?? null,
      carbs_g: parsed.data.carbs_g ?? null,
      fat_g: parsed.data.fat_g ?? null,
      quantity: parsed.data.quantity ?? null,
      unit: parsed.data.unit ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not log meal." };
  }

  revalidateNutrition();

  return { ok: true, data: { log: data } };
}

export async function updateNutritionLog(
  formData: FormData,
): Promise<ActionResult<{ log: NutritionLogRow }>> {
  const parsed = parseNutritionForm(formData);

  if (!parsed.ok || !parsed.data.id) {
    return {
      ok: false,
      error: parsed.ok ? "Missing nutrition log id." : parsed.error,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const imageUpload = await uploadNutritionImage({
    file: getNutritionImage(formData),
    logDate: parsed.data.log_date,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  if (!imageUpload.ok) {
    return { ok: false, error: imageUpload.error };
  }

  const { data, error } = await auth.supabase
    .from("nutrition_logs")
    .update({
      log_date: parsed.data.log_date,
      meal_type: parsed.data.meal_type,
      food_name: parsed.data.food_name,
      calories: parsed.data.calories ?? null,
      protein_g: parsed.data.protein_g ?? null,
      carbs_g: parsed.data.carbs_g ?? null,
      fat_g: parsed.data.fat_g ?? null,
      quantity: parsed.data.quantity ?? null,
      unit: parsed.data.unit ?? null,
      note: parsed.data.note ?? null,
      image_url: imageUpload.data.imageUrl ?? parsed.data.image_url ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update meal." };
  }

  revalidateNutrition();

  return { ok: true, data: { log: data } };
}

export async function deleteNutritionLog(
  logId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid nutrition log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateNutrition();

  return { ok: true, data: { id: logId } };
}

export async function removeNutritionPhoto(
  logId: string,
): Promise<ActionResult<{ log: NutritionLogRow }>> {
  if (!z.string().uuid().safeParse(logId).success) {
    return { ok: false, error: "Invalid nutrition log id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("nutrition_logs")
    .update({ image_url: null })
    .eq("id", logId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not remove photo." };
  }

  revalidateNutrition();

  return { ok: true, data: { log: data } };
}
