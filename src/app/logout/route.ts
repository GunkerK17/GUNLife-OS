import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("message", "Đã đăng xuất.");

  return NextResponse.redirect(redirectUrl);
}
