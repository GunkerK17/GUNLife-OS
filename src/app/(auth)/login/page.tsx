"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  BadgeCheck,
  Braces,
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { signInWithGoogle, signInWithPassword } from "@/lib/auth/actions";
import { GunLifeLogo } from "@/components/brand/gunlifeos-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { AlertMessage } from "@/components/shared/alert-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const pillarMeta = [
  {
    icon: Trophy,
    tone: "from-cyan-400 to-blue-500",
  },
  {
    icon: Braces,
    tone: "from-sky-400 to-cyan-300",
  },
  {
    icon: Dumbbell,
    tone: "from-emerald-300 to-green-500",
  },
];

const loginCopy = {
  en: {
    signingIn: "Signing in...",
    signIn: "Sign in",
    welcome: "Welcome back",
    welcomeHint: "Sign in to your GunLifeOS command center",
    google: "Continue with Google",
    or: "or",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    hidePassword: "Hide password",
    showPassword: "Show password",
    remember: "Remember me",
    noAccount: "Don't have an account?",
    register: "Register",
    secure: "Secure login with Supabase Auth",
    beta: "Private beta",
    commandLayer: "Daily command layer",
    headline1: "Your life.",
    headline2: "Upgraded.",
    headline3: "Every day.",
    hero: "GunLifeOS is your personal operating system for football, coding, training, goals, and money. Track the grind, then level up.",
    pillars: [
      { title: "Football", description: "Track games, stamina, stats, and weekly performance." },
      { title: "Code", description: "Ship projects, keep focus blocks, and review progress." },
      { title: "Training", description: "Plan workouts, record sets, and level up every day." },
    ],
    stats: [
      { label: "Daily score", value: "86%" },
      { label: "Focus streak", value: "12d" },
      { label: "Next block", value: "Gym" },
    ],
  },
  vi: {
    signingIn: "Đang đăng nhập...",
    signIn: "Đăng nhập",
    welcome: "Chào mừng trở lại",
    welcomeHint: "Đăng nhập vào trung tâm điều hành GunLifeOS",
    google: "Tiếp tục với Google",
    or: "hoặc",
    email: "Email",
    password: "Mật khẩu",
    forgot: "Quên mật khẩu?",
    hidePassword: "Ẩn mật khẩu",
    showPassword: "Hiện mật khẩu",
    remember: "Ghi nhớ đăng nhập",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký",
    secure: "Đăng nhập an toàn với Supabase Auth",
    beta: "Bản thử nghiệm riêng",
    commandLayer: "Trung tâm điều hành mỗi ngày",
    headline1: "Cuộc sống của bạn.",
    headline2: "Được nâng cấp.",
    headline3: "Mỗi ngày.",
    hero: "GunLifeOS là hệ điều hành cá nhân cho bóng đá, lập trình, tập luyện, mục tiêu và tài chính. Theo dõi hành trình rồi nâng cấp bản thân.",
    pillars: [
      { title: "Bóng đá", description: "Theo dõi trận đấu, thể lực, chỉ số và hiệu suất theo tuần." },
      { title: "Lập trình", description: "Hoàn thành dự án, giữ nhịp tập trung và xem lại tiến độ." },
      { title: "Tập luyện", description: "Lên lịch tập, ghi set và tiến bộ mỗi ngày." },
    ],
    stats: [
      { label: "Điểm ngày", value: "86%" },
      { label: "Chuỗi tập trung", value: "12 ngày" },
      { label: "Việc tiếp theo", value: "Gym" },
    ],
  },
} as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <GunLifeLogo
      className={compact ? "gap-2.5" : "gap-3"}
      markClassName={compact ? "size-11" : "size-14"}
    />
  );
}

function SubmitButton({ text }: { text: (typeof loginCopy)["en"] | (typeof loginCopy)["vi"] }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-lg border-0 bg-[linear-gradient(100deg,#0891b2_0%,#22c55e_100%)] text-base font-extrabold text-white shadow-[0_18px_45px_rgba(34,197,94,0.32)] transition-transform hover:scale-[1.01] hover:brightness-110 disabled:scale-100 disabled:opacity-70"
    >
      {pending ? text.signingIn : text.signIn}
      {!pending ? <ArrowRight className="ml-2 size-4" /> : null}
    </Button>
  );
}

function LoginCard() {
  const { locale } = useI18n();
  const text = loginCopy[locale];
  const searchParams = useSearchParams();
  const passwordInputId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const error = searchParams.get("error") ?? undefined;
  const message = searchParams.get("message") ?? undefined;

  return (
    <Card className="lifeos-card-enter relative w-full overflow-hidden rounded-xl border-white/15 bg-slate-950/78 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(34,211,238,0.14)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,#67e8f9,#86efac,transparent)]" />
      <CardHeader className="items-center space-y-3 px-5 pb-3 pt-6 text-center sm:px-8">
        <div className="grid size-14 place-items-center rounded-full border border-cyan-300/45 bg-cyan-300/10 text-cyan-100 shadow-[0_0_38px_rgba(34,211,238,0.34)]">
          <LockKeyhole className="size-6" />
        </div>
        <div>
          <CardTitle className="text-3xl font-black tracking-tight text-white">
            {text.welcome}
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-slate-300">
            {text.welcomeHint}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-6 sm:px-8">
        <AlertMessage error={error} message={message} />

        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full rounded-lg border-white/15 bg-white/[0.03] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-300/45 hover:bg-white/[0.07] hover:text-white"
          >
            <span className="mr-2 grid size-5 place-items-center rounded-full bg-white text-xs font-black text-slate-950">
              G
            </span>
            {text.google}
          </Button>
        </form>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="h-px flex-1 bg-white/10" />
          {text.or}
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form action={signInWithPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-white">
              {text.email}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-lg border-white/15 bg-slate-950/60 pl-11 text-white placeholder:text-slate-500 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/25"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor={passwordInputId}
                className="text-sm font-bold text-white"
              >
                {text.password}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
              >
                {text.forgot}
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={passwordInputId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••"
                className="h-12 rounded-lg border-white/15 bg-slate-950/60 pl-11 pr-12 text-white placeholder:text-slate-500 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/25"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 grid size-5 -translate-y-1/2 place-items-center text-slate-400 transition-colors hover:text-white"
                aria-label={showPassword ? text.hidePassword : text.showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                name="remember"
                defaultChecked
                className="border-emerald-300/60 bg-white/5 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-slate-950"
              />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal text-slate-300"
              >
                {text.remember}
              </Label>
            </div>
          </div>

          <SubmitButton text={text} />
        </form>

        <p className="text-center text-sm text-slate-300">
          {text.noAccount}{" "}
          <Link
            href="/register"
            className="font-bold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            {text.register}
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <ShieldCheck className="size-4" />
          {text.secure}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroPanel() {
  const { locale } = useI18n();
  const text = loginCopy[locale];

  return (
    <section className="lifeos-page-enter relative hidden min-h-[680px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:flex lg:flex-col 2xl:min-h-[720px]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(0deg,rgba(34,197,94,0.22),transparent)]" />
      <div className="absolute left-[42%] top-20 h-[520px] w-px rotate-[20deg] bg-[linear-gradient(180deg,transparent,#22d3ee,#22c55e,transparent)] opacity-60" />

      <div className="relative z-10">
        <BrandMark />
      </div>

      <div className="relative z-10 mt-auto grid items-start gap-6 pb-6 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 max-w-[34rem]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
            <BadgeCheck className="size-3.5" />
            {text.commandLayer}
          </div>
          <h1 className="text-balance text-5xl font-black leading-[0.96] tracking-tight text-white">
            {text.headline1}
            <br />
            {text.headline2}
            <br />
            <span className="bg-[linear-gradient(90deg,#22d3ee,#4ade80)] bg-clip-text text-transparent">
              {text.headline3}
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
            {text.hero}
          </p>
        </div>

        <div className="hidden w-full rounded-xl border border-cyan-300/20 bg-slate-950/65 p-5 font-mono text-xs leading-7 text-cyan-200/85 shadow-[0_0_60px_rgba(34,211,238,0.12)] 2xl:block">
          <p className="text-emerald-300">function improve() {"{"}</p>
          <p className="pl-4">discipline();</p>
          <p className="pl-4">focus();</p>
          <p className="pl-4">consistency();</p>
          <p className="text-emerald-300">{"}"}</p>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-3 gap-4">
        {pillarMeta.map((pillar, index) => {
          const PillarIcon = pillar.icon;
          const content = text.pillars[index];

          return (
            <article
              key={content.title}
              className="rounded-xl border border-white/10 bg-slate-950/62 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur"
            >
              <div
                className={cn(
                  "mx-auto mb-4 grid size-12 place-items-center rounded-full bg-gradient-to-br text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.22)]",
                  pillar.tone,
                )}
              >
                <PillarIcon className="size-6" />
              </div>
              <p className="text-sm font-black uppercase tracking-wide text-white">
                {content.title}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {content.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="relative z-10 mt-7 hidden grid-cols-3 gap-3 2xl:grid">
        {text.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobilePillars() {
  const { locale } = useI18n();
  const text = loginCopy[locale];

  return (
    <div className="grid grid-cols-3 gap-2 border-t border-white/10 bg-slate-950/80 px-4 py-4 lg:hidden">
      {pillarMeta.map((pillar, index) => {
        const PillarIcon = pillar.icon;
        const content = text.pillars[index];

        return (
          <div key={content.title} className="text-center">
            <div
              className={cn(
                "mx-auto grid size-9 place-items-center rounded-full bg-gradient-to-br text-slate-950",
                pillar.tone,
              )}
            >
              <PillarIcon className="size-4" />
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white">
              {content.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function LoginScreen() {
  const { locale } = useI18n();
  const text = loginCopy[locale];

  return (
    <main className="fixed inset-0 z-50 min-h-svh overflow-y-auto overflow-x-hidden bg-[#02050b] text-white">
      <div className="lifeos-ambient pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(34,211,238,0.16),transparent_34%),linear-gradient(245deg,rgba(34,197,94,0.14),transparent_36%),linear-gradient(180deg,#050914_0%,#02050b_55%,#010308_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />

      <div className="relative mx-auto grid min-h-svh w-full max-w-[1440px] items-center gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,460px)] lg:px-8 xl:gap-8">
        <HeroPanel />

        <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-[460px]">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <BrandMark compact />
            <LanguageSwitcher compact />
          </div>

          <div className="mb-3 hidden items-center justify-end gap-3 lg:flex">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              {text.beta}
            </span>
            <LanguageSwitcher compact />
          </div>

          <LoginCard />
          <MobilePillars />
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-[#02050b]" />}>
      <LoginScreen />
    </Suspense>
  );
}
