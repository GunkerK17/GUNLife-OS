"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}, z.string().nullable());

const nullableNumber = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return Number(value);
}, z.number().finite().nullable());

const nullableInteger = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return Number(value);
}, z.number().int().finite().nullable());

const settingsSchema = z.object({
  fullName: nullableString,
  bio: nullableString,
  dateOfBirth: nullableString,
  heightCm: nullableNumber,
  targetWeightKg: nullableNumber,
  jobTitle: nullableString,
  company: nullableString,
  education: nullableString,
  dailyCalorieGoal: nullableInteger,
  dailyProteinGoal: nullableInteger,
  dailyCarbsGoal: nullableInteger,
  dailyFatGoal: nullableInteger,
});

function redirectSettings(type: "error" | "message", message: string): never {
  redirect(`/dashboard/settings?${type}=${encodeURIComponent(message)}`);
}

export async function updateProfileSettings(formData: FormData) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text =
    locale === "vi"
      ? {
          missingSupabase: "Chưa cấu hình Supabase trong .env.local",
          invalid: "Dữ liệu cài đặt không hợp lệ",
          expired: "Phiên đăng nhập đã hết hạn",
          saved: "Đã lưu cài đặt cá nhân",
        }
      : {
          missingSupabase: "Supabase is not configured in .env.local",
          invalid: "Settings data is invalid",
          expired: "Your session has expired",
          saved: "Personal settings saved",
        };

  if (!hasSupabaseConfig()) {
    redirectSettings("error", text.missingSupabase);
  }

  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    bio: formData.get("bio"),
    dateOfBirth: formData.get("dateOfBirth"),
    heightCm: formData.get("heightCm"),
    targetWeightKg: formData.get("targetWeightKg"),
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    education: formData.get("education"),
    dailyCalorieGoal: formData.get("dailyCalorieGoal"),
    dailyProteinGoal: formData.get("dailyProteinGoal"),
    dailyCarbsGoal: formData.get("dailyCarbsGoal"),
    dailyFatGoal: formData.get("dailyFatGoal"),
  });

  if (!parsed.success) {
    redirectSettings("error", text.invalid);
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectSettings("error", text.expired);
  }

  const { error: publicUserError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: parsed.data.fullName,
      avatar_url:
        typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
    },
    { onConflict: "id" },
  );

  if (publicUserError) {
    redirectSettings("error", publicUserError.message);
  }

  if (parsed.data.fullName) {
    await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
      },
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      bio: parsed.data.bio,
      date_of_birth: parsed.data.dateOfBirth,
      height_cm: parsed.data.heightCm,
      target_weight_kg: parsed.data.targetWeightKg,
      job_title: parsed.data.jobTitle,
      company: parsed.data.company,
      education: parsed.data.education,
      daily_calorie_goal: parsed.data.dailyCalorieGoal ?? 2200,
      daily_protein_goal: parsed.data.dailyProteinGoal ?? 150,
      daily_carbs_goal: parsed.data.dailyCarbsGoal ?? 250,
      daily_fat_goal: parsed.data.dailyFatGoal ?? 65,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    redirectSettings("error", profileError.message);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirectSettings("message", text.saved);
}
