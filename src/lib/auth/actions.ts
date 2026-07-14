"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

const authSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
});

const registerSchema = authSchema.extend({
  fullName: z.string().min(2, "Tên cần ít nhất 2 ký tự"),
});

function getAuthText() {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;

  return locale === "vi"
    ? {
        missingSupabase: "Chưa cấu hình Supabase trong .env.local",
        invalidLogin: "Email hoặc mật khẩu không hợp lệ",
        invalidRegister: "Vui lòng kiểm tra họ tên, email và mật khẩu",
        oauthUrl: "Không tạo được đường dẫn đăng nhập Google từ Supabase",
        registered: "Tài khoản đã được tạo. Hãy kiểm tra email nếu Supabase yêu cầu xác nhận.",
      }
    : {
        missingSupabase: "Supabase is not configured in .env.local",
        invalidLogin: "Email or password is invalid",
        invalidRegister: "Please check your name, email, and password",
        oauthUrl: "Could not create the Google sign-in URL from Supabase",
        registered: "Account created. Check your email if Supabase requires confirmation.",
      };
}

function redirectWithMessage(
  path: string,
  type: "error" | "message",
  message: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function signInWithPassword(formData: FormData) {
  const text = getAuthText();
  if (!hasSupabaseConfig()) {
    redirectWithMessage(
      "/login",
      "error",
      text.missingSupabase,
    );
  }

  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/login", "error", text.invalidLogin);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithMessage("/login", "error", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const text = getAuthText();
  if (!hasSupabaseConfig()) {
    redirectWithMessage(
      "/login",
      "error",
      text.missingSupabase,
    );
  }

  const origin =
    headers().get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirectWithMessage("/login", "error", error.message);
  }

  if (!data.url) {
    redirectWithMessage(
      "/login",
      "error",
      text.oauthUrl,
    );
  }

  redirect(data.url);
}

export async function signUpWithPassword(formData: FormData) {
  const text = getAuthText();
  if (!hasSupabaseConfig()) {
    redirectWithMessage(
      "/register",
      "error",
      text.missingSupabase,
    );
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/register", "error", text.invalidRegister);
  }

  const origin =
    headers().get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    redirectWithMessage("/register", "error", error.message);
  }

  redirectWithMessage(
    "/login",
    "message",
    text.registered,
  );
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
