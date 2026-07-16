import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Flame,
  GraduationCap,
  HeartPulse,
  LockKeyhole,
  Mail,
  Ruler,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Utensils,
} from "lucide-react";
import { cookies } from "next/headers";
import { AlertMessage } from "@/components/shared/alert-message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLifeLevel } from "@/lib/life-level";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { updateProfileSettings } from "./actions";

type SettingsPageProps = {
  searchParams?: { error?: string; message?: string };
};

const inputClassName =
  "h-11 rounded-xl border-white/10 bg-slate-950/65 text-white placeholder:text-slate-600 focus-visible:border-emerald-300/45 focus-visible:ring-emerald-300/15";

const settingsCopy = {
  en: {
    eyebrow: "LifeOS profile",
    title: "Personal settings",
    subtitle: "Core data for Dashboard, health goals, nutrition, and your AI context.",
    private: "Only your account can view this data",
    supabaseMissing: "Add Supabase environment variables to save real data.",
    userAlt: "LifeOS user",
    yourProfile: "Your profile",
    explorer: "LifeOS Explorer",
    notSignedIn: "Not signed in",
    completion: "Profile completion",
    lifeLevel: "Life Level",
    level: "Level",
    locked: "Not unlocked",
    xpRule: "Every day lived = 1 XP",
    daysLeft: "days left to reach",
    unlockHint: "Enter your date of birth below. Your age becomes the level and XP increases every day.",
    personalTitle: "Personal profile",
    personalDescription: "Name, birthday, and core information shown across LifeOS.",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email",
    emailHint: "Email is managed by Supabase Auth.",
    birthday: "Date of birth",
    birthdayHint: "Your birthday determines the current Life Level and yearly XP.",
    height: "Height",
    bio: "Short bio",
    bioPlaceholder: "Your current focus, lifestyle, or a personal reminder...",
    healthTitle: "Health targets",
    healthDescription: "Weight and Nutrition use these values to calculate progress.",
    targetWeight: "Target weight",
    caloriesDay: "Calories/day",
    proteinDay: "Protein/day",
    carbsDay: "Carbs/day",
    fatDay: "Fat/day",
    macroTargets: "Macro targets",
    syncNutrition: "Automatically syncs with Nutrition",
    workTitle: "Work & education",
    workDescription: "Context helps AI give advice that better matches your life.",
    job: "Job title",
    jobPlaceholder: "Frontend Developer",
    company: "Company / workplace",
    companyPlaceholder: "Company name or Freelance",
    education: "Education / certificates",
    educationPlaceholder: "School, major, certificates...",
    securityTitle: "Account & security",
    securityDescription: "Authentication and security are managed by Supabase Auth.",
    loginEmail: "Login email",
    unavailable: "Unavailable",
    provider: "Provider",
    emailVerification: "Email verification",
    verified: "Verified",
    unverified: "Not verified",
    sessionProtected: "Session is protected by Supabase Auth",
    saveAll: "Save all settings",
    saveHint: "Dashboard and AI use the new data immediately after saving.",
    save: "Save settings",
  },
  vi: {
    eyebrow: "Hồ sơ LifeOS",
    title: "Cài đặt cá nhân",
    subtitle: "Dữ liệu nền cho Tổng quan, mục tiêu sức khỏe, Dinh dưỡng và ngữ cảnh AI của bạn.",
    private: "Chỉ tài khoản của bạn được xem dữ liệu này",
    supabaseMissing: "Cần thêm biến môi trường Supabase để lưu dữ liệu thật.",
    userAlt: "Người dùng LifeOS",
    yourProfile: "Hồ sơ của bạn",
    explorer: "Người khám phá LifeOS",
    notSignedIn: "Chưa đăng nhập",
    completion: "Độ hoàn thiện hồ sơ",
    lifeLevel: "Cấp độ cuộc sống",
    level: "Cấp",
    locked: "Chưa mở khóa",
    xpRule: "Mỗi ngày sống = 1 XP",
    daysLeft: "ngày nữa để đạt",
    unlockHint: "Điền ngày sinh bên dưới. Hệ thống dùng tuổi làm cấp độ và tự cộng XP mỗi ngày.",
    personalTitle: "Hồ sơ cá nhân",
    personalDescription: "Tên, ngày sinh và thông tin cơ bản hiển thị trong toàn bộ LifeOS.",
    fullName: "Họ tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    email: "Email",
    emailHint: "Email được quản lý bởi Supabase Auth.",
    birthday: "Ngày sinh",
    birthdayHint: "Ngày sinh quyết định Cấp độ cuộc sống và XP của năm hiện tại.",
    height: "Chiều cao",
    bio: "Giới thiệu ngắn",
    bioPlaceholder: "Điều bạn đang tập trung, phong cách sống hoặc một câu nhắc nhở...",
    healthTitle: "Mục tiêu sức khỏe",
    healthDescription: "Cân nặng và Dinh dưỡng dùng các chỉ số này để tính tiến độ.",
    targetWeight: "Cân nặng mục tiêu",
    caloriesDay: "Calories/ngày",
    proteinDay: "Protein/ngày",
    carbsDay: "Carbs/ngày",
    fatDay: "Fat/ngày",
    macroTargets: "Mục tiêu dinh dưỡng",
    syncNutrition: "Tự động đồng bộ với Dinh dưỡng",
    workTitle: "Công việc & học vấn",
    workDescription: "Ngữ cảnh giúp AI đưa ra lời khuyên sát với cuộc sống của bạn hơn.",
    job: "Công việc",
    jobPlaceholder: "Lập trình viên Frontend",
    company: "Công ty / nơi làm việc",
    companyPlaceholder: "Tên công ty hoặc Freelance",
    education: "Học vấn / chứng chỉ",
    educationPlaceholder: "Trường học, chuyên ngành, chứng chỉ...",
    securityTitle: "Tài khoản & bảo mật",
    securityDescription: "Phiên đăng nhập và bảo mật được Supabase Auth quản lý.",
    loginEmail: "Email đăng nhập",
    unavailable: "Chưa có",
    provider: "Nhà cung cấp",
    emailVerification: "Xác thực email",
    verified: "Đã xác thực",
    unverified: "Chưa xác thực",
    sessionProtected: "Phiên đăng nhập đang được Supabase Auth bảo vệ",
    saveAll: "Lưu toàn bộ cài đặt",
    saveHint: "Tổng quan và AI sẽ dùng dữ liệu mới ngay sau khi lưu.",
    save: "Lưu cài đặt",
  },
} as const;

function initials(name: string, email?: string | null) {
  return (name || email || "LifeOS")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SettingsSection({
  children,
  className,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description: string;
  icon: typeof UserRound;
  title: string;
}) {
  return (
    <section
      className={cn(
        "lifeos-panel overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-white/[0.07] bg-white/[0.018] p-3.5 sm:p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15 sm:size-10 sm:rounded-xl">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="font-black text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-3.5 sm:p-4">{children}</div>
    </section>
  );
}

function Field({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-300">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-4 text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text = settingsCopy[locale];
  let authUser = null;
  let publicUser = null;
  let profile = null;

  if (hasSupabaseConfig()) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    authUser = user;

    if (authUser) {
      const [publicUserResult, profileResult] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).maybeSingle(),
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle(),
      ]);

      publicUser = publicUserResult.data;
      profile = profileResult.data;
    }
  }

  const fullName =
    publicUser?.full_name ??
    (typeof authUser?.user_metadata.full_name === "string"
      ? authUser.user_metadata.full_name
      : "");
  const avatarUrl =
    typeof authUser?.user_metadata.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : typeof authUser?.user_metadata.picture === "string"
        ? authUser.user_metadata.picture
        : undefined;
  const lifeLevel = getLifeLevel(profile?.date_of_birth);
  const profileValues = [
    fullName,
    profile?.date_of_birth,
    profile?.height_cm,
    profile?.target_weight_kg,
    profile?.bio,
    profile?.job_title,
    profile?.company,
    profile?.education,
  ];
  const completedFields = profileValues.filter(Boolean).length;
  const completionRate = Math.round((completedFields / profileValues.length) * 100);

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1380px] space-y-4 overflow-hidden">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                {text.eyebrow}
              </p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white md:text-3xl">
                {text.title}
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            {text.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
          <ShieldCheck className="size-4 text-emerald-300" />
          {text.private}
        </div>
      </header>

      <AlertMessage error={searchParams?.error} message={searchParams?.message} />
      {!hasSupabaseConfig() ? (
        <AlertMessage error={text.supabaseMissing} />
      ) : null}

      <section className="lifeos-panel grid overflow-hidden border-emerald-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_34%),rgba(2,8,23,0.62)] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:p-5">
          <Avatar className="size-20 shrink-0 border-2 border-emerald-300/30 shadow-[0_0_40px_rgba(34,197,94,0.2)] md:size-24">
            <AvatarImage src={avatarUrl} alt={fullName || text.userAlt} />
            <AvatarFallback className="bg-emerald-400/10 text-2xl font-black text-emerald-300">
              {initials(fullName, authUser?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              {text.yourProfile}
            </p>
            <h2 className="mt-1 truncate text-2xl font-black text-white md:text-3xl">
              {fullName || text.explorer}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-400">
              {authUser?.email ?? text.notSignedIn}
            </p>
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>{text.completion}</span>
                <span>{completionRate}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] bg-black/10 p-4 md:p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                {text.lifeLevel}
              </p>
              <h3 className="mt-1 text-lg font-black text-white">
                {lifeLevel ? `${text.level} ${lifeLevel.age}` : text.locked}
              </h3>
            </div>
            <div className="grid size-12 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
              <Sparkles className="size-5" />
            </div>
          </div>

          {lifeLevel ? (
            <>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-white">{lifeLevel.daysElapsed} XP</p>
                  <p className="mt-1 text-xs text-slate-400">{text.xpRule}</p>
                </div>
                <p className="text-xs font-bold text-emerald-300">{lifeLevel.progress}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#34d399)] shadow-[0_0_18px_rgba(52,211,153,0.4)]"
                  style={{ width: `${lifeLevel.progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-400">
                <strong className="text-white">{lifeLevel.daysUntilNextLevel}</strong> {text.daysLeft} {text.level} {lifeLevel.nextAge}.
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
              {text.unlockHint}
            </p>
          )}
        </div>
      </section>

      <form action={updateProfileSettings} className="space-y-4">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.6fr)]">
          <div className="space-y-4">
            <SettingsSection
              title={text.personalTitle}
              description={text.personalDescription}
              icon={UserRound}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={text.fullName}>
                  <Input name="fullName" defaultValue={fullName ?? ""} placeholder={text.fullNamePlaceholder} className={inputClassName} />
                </Field>
                <Field label={text.email} hint={text.emailHint}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input value={authUser?.email ?? ""} readOnly className={cn(inputClassName, "pl-10 text-slate-400")} />
                  </div>
                </Field>
                <Field label={text.birthday} hint={text.birthdayHint}>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-300" />
                    <Input name="dateOfBirth" type="date" defaultValue={profile?.date_of_birth ?? ""} className={cn(inputClassName, "pl-10 [color-scheme:dark]")} />
                  </div>
                </Field>
                <Field label={text.height}>
                  <div className="relative">
                    <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-300" />
                    <Input name="heightCm" type="number" min="50" max="260" step="0.1" defaultValue={profile?.height_cm ?? ""} placeholder="170" className={cn(inputClassName, "pl-10 pr-12")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">cm</span>
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label={text.bio}>
                    <Textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} placeholder={text.bioPlaceholder} className="min-h-24 resize-none rounded-xl border-white/10 bg-slate-950/65 text-white placeholder:text-slate-600 focus-visible:border-emerald-300/45 focus-visible:ring-emerald-300/15" />
                  </Field>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title={text.healthTitle}
              description={text.healthDescription}
              icon={HeartPulse}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={text.targetWeight}>
                  <div className="relative">
                    <Target className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-300" />
                    <Input name="targetWeightKg" type="number" step="0.1" defaultValue={profile?.target_weight_kg ?? ""} placeholder="65" className={cn(inputClassName, "pl-10 pr-10")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">kg</span>
                  </div>
                </Field>
                <Field label={text.caloriesDay}>
                  <div className="relative">
                    <Flame className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-orange-300" />
                    <Input name="dailyCalorieGoal" type="number" defaultValue={profile?.daily_calorie_goal ?? 2200} className={cn(inputClassName, "pl-10")} />
                  </div>
                </Field>
                <Field label={text.proteinDay}>
                  <div className="relative">
                    <Activity className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-300" />
                    <Input name="dailyProteinGoal" type="number" defaultValue={profile?.daily_protein_goal ?? 150} className={cn(inputClassName, "pl-10")} />
                  </div>
                </Field>
                <Field label={text.carbsDay}>
                  <Input name="dailyCarbsGoal" type="number" defaultValue={profile?.daily_carbs_goal ?? 250} className={inputClassName} />
                </Field>
                <Field label={text.fatDay}>
                  <Input name="dailyFatGoal" type="number" defaultValue={profile?.daily_fat_goal ?? 65} className={inputClassName} />
                </Field>
                <div className="lifeos-subpanel flex items-center gap-3 p-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-orange-400/10 text-orange-300"><Utensils className="size-4" /></div>
                  <div><p className="text-xs font-bold text-white">{text.macroTargets}</p><p className="mt-0.5 text-[10px] text-slate-500">{text.syncNutrition}</p></div>
                </div>
              </div>
            </SettingsSection>
          </div>

          <div className="space-y-4">
            <SettingsSection title={text.workTitle} description={text.workDescription} icon={BriefcaseBusiness}>
              <div className="space-y-4">
                <Field label={text.job}><Input name="jobTitle" defaultValue={profile?.job_title ?? ""} placeholder={text.jobPlaceholder} className={inputClassName} /></Field>
                <Field label={text.company}><Input name="company" defaultValue={profile?.company ?? ""} placeholder={text.companyPlaceholder} className={inputClassName} /></Field>
                <Field label={text.education}>
                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-3 size-4 text-violet-300" />
                    <Textarea name="education" rows={4} defaultValue={profile?.education ?? ""} placeholder={text.educationPlaceholder} className="min-h-28 resize-none rounded-xl border-white/10 bg-slate-950/65 pl-10 text-white placeholder:text-slate-600 focus-visible:border-emerald-300/45 focus-visible:ring-emerald-300/15" />
                  </div>
                </Field>
              </div>
            </SettingsSection>

            <SettingsSection title={text.securityTitle} description={text.securityDescription} icon={LockKeyhole}>
              <div className="space-y-3">
                <div className="lifeos-row-group divide-y divide-white/[0.06]">
                  {[
                    [text.loginEmail, authUser?.email ?? text.unavailable],
                    [text.provider, authUser?.app_metadata.provider ?? "email"],
                    [text.emailVerification, authUser?.email_confirmed_at ? text.verified : text.unverified],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 px-3 py-3">
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className="max-w-[180px] truncate text-xs font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-300"><CheckCircle2 className="size-4" />{text.sessionProtected}</div>
              </div>
            </SettingsSection>
          </div>
        </div>

        <div className="lifeos-panel relative flex flex-col gap-3 border-emerald-300/10 p-3 sm:flex-row sm:items-center sm:justify-between lg:sticky lg:bottom-3 lg:z-20 lg:bg-slate-950/88">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Save className="size-4" /></div>
            <div><p className="text-sm font-bold text-white">{text.saveAll}</p><p className="text-[11px] text-slate-500">{text.saveHint}</p></div>
          </div>
          <Button type="submit" className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] px-6 font-black text-slate-950 shadow-[0_12px_30px_rgba(34,197,94,0.2)] hover:opacity-90">
            <Save className="mr-2 size-4" />{text.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
