import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  let user = null;

  if (hasSupabaseConfig()) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const profile = authUser
      ? await supabase
          .from("user_profiles")
          .select("date_of_birth")
          .eq("user_id", authUser.id)
          .maybeSingle()
      : null;

    user = authUser
      ? {
          email: authUser.email,
          fullName:
            typeof authUser.user_metadata.full_name === "string"
              ? authUser.user_metadata.full_name
              : null,
          avatarUrl:
            typeof authUser.user_metadata.avatar_url === "string"
              ? authUser.user_metadata.avatar_url
              : typeof authUser.user_metadata.picture === "string"
              ? authUser.user_metadata.picture
              : null,
          dateOfBirth: profile?.data?.date_of_birth ?? null,
        }
      : null;
  }

  return (
    <DashboardChrome user={user} supabaseConfigured={hasSupabaseConfig()}>
      {children}
    </DashboardChrome>
  );
}
