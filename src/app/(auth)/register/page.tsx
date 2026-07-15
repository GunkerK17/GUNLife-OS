import Link from "next/link";
import { cookies } from "next/headers";
import { GunLifeLogo } from "@/components/brand/gunlifeos-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { signInWithGoogle, signUpWithPassword } from "@/lib/auth/actions";
import { AlertMessage } from "@/components/shared/alert-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLocale, isLocale } from "@/lib/i18n";

type RegisterPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

const registerCopy = {
  en: {
    title: "Create your GunLifeOS",
    subtitle: "Register quickly with Google or email to open your personal dashboard.",
    google: "Register with Google",
    or: "or",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    submit: "Create account",
    hasAccount: "Already have an account?",
    login: "Sign in",
  },
  vi: {
    title: "Tạo GunLifeOS của bạn",
    subtitle: "Đăng ký nhanh bằng Google hoặc email để mở bảng điều khiển cá nhân.",
    google: "Đăng ký với Google",
    or: "hoặc",
    fullName: "Họ tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    email: "Email",
    password: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    submit: "Tạo tài khoản",
    hasAccount: "Đã có tài khoản?",
    login: "Đăng nhập",
  },
} as const;

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text = registerCopy[locale];

  return (
    <main className="dark relative grid min-h-svh overflow-x-hidden bg-[#02050b] px-3 py-4 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.18),transparent_35%),linear-gradient(180deg,#06101d_0%,#02050b_58%,#010308_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:58px_58px]" />

      <Card className="relative m-auto w-full max-w-md overflow-hidden rounded-2xl border-emerald-300/20 bg-slate-950/80 text-white shadow-[0_30px_100px_rgba(0,0,0,0.58),0_0_70px_rgba(34,197,94,0.1)] backdrop-blur-2xl">
        <div className="h-px bg-[linear-gradient(90deg,transparent,#22d3ee,#22c55e,transparent)]" />
        <CardHeader className="space-y-5 px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <GunLifeLogo compact markClassName="size-10 sm:size-11" />
            <LanguageSwitcher compact />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {text.title}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-slate-400">
              {text.subtitle}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
          <AlertMessage
            error={searchParams?.error}
            message={searchParams?.message}
          />

          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full rounded-xl border-white/10 bg-white/[0.04] text-white shadow-sm hover:border-cyan-300/25 hover:bg-white/[0.08] hover:text-white"
            >
              <span className="mr-2 flex size-5 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">
                G
              </span>
              {text.google}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">{text.or}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form action={signUpWithPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-200">
                {text.fullName}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                placeholder={text.fullNamePlaceholder}
                className="h-12 rounded-xl border-white/10 bg-slate-950/75 text-white placeholder:text-slate-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                {text.email}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl border-white/10 bg-slate-950/75 text-white placeholder:text-slate-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                {text.password}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder={text.passwordPlaceholder}
                className="h-12 rounded-xl border-white/10 bg-slate-950/75 text-white placeholder:text-slate-600"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[linear-gradient(90deg,#22d3ee,#22c55e)] font-black text-slate-950 shadow-[0_16px_40px_rgba(34,197,94,0.22)] hover:brightness-110"
            >
              {text.submit}
            </Button>
          </form>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
              Supabase Auth
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
              Google OAuth
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            {text.hasAccount}{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-300 hover:text-emerald-200"
            >
              {text.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
