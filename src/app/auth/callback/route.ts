import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeRedirectPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function redirectWithError(origin: string, message: string) {
  const redirectUrl = new URL("/login", origin);
  redirectUrl.searchParams.set("error", message);

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));

  if (oauthError) {
    return redirectWithError(requestUrl.origin, oauthError);
  }

  if (!hasSupabaseConfig()) {
    return redirectWithError(
      requestUrl.origin,
      "Chưa cấu hình Supabase env trong .env.local",
    );
  }

  if (!code) {
    return redirectWithError(
      requestUrl.origin,
      "Google không trả mã đăng nhập. Hãy thử lại.",
    );
  }

  const supabase = createSupabaseServerClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectWithError(requestUrl.origin, exchangeError.message);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectWithError(
      requestUrl.origin,
      userError?.message ?? "Không lấy được thông tin tài khoản Google.",
    );
  }

  if (!user.email) {
    return redirectWithError(
      requestUrl.origin,
      "Tài khoản Google không trả email.",
    );
  }

  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;
  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata.picture === "string"
        ? user.user_metadata.picture
        : null;

  const { error: userSyncError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );

  if (userSyncError) {
    return redirectWithError(requestUrl.origin, userSyncError.message);
  }

  const { error: profileSyncError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: user.id,
      },
      { onConflict: "user_id" },
    );

  if (profileSyncError) {
    return redirectWithError(requestUrl.origin, profileSyncError.message);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
