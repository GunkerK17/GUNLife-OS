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
    subtitle: "Đăng ký nhanh bằng Google hoặc email để vào bảng điều khiển cá nhân.",
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
    <Card className="w-full overflow-visible border-white/80 bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <GunLifeLogo compact markClassName="size-11" />
          <LanguageSwitcher compact />
        </div>
        <div>
          <CardTitle className="text-3xl tracking-tight">
            {text.title}
          </CardTitle>
          <CardDescription className="mt-2">
            {text.subtitle}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <AlertMessage
          error={searchParams?.error}
          message={searchParams?.message}
        />

        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-xs font-semibold">
              G
            </span>
            {text.google}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{text.or}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={signUpWithPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{text.fullName}</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder={text.fullNamePlaceholder}
              className="h-12 bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{text.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{text.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              placeholder={text.passwordPlaceholder}
              className="h-12 bg-white"
              required
            />
          </div>
          <Button
            type="submit"
            className="h-12 w-full bg-[#067044] text-white shadow-[0_16px_40px_rgba(6,112,68,0.28)] hover:bg-[#075f3b]"
          >
            {text.submit}
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-lg border bg-slate-50 px-3 py-2">
            Supabase Auth
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-2">
            Google OAuth
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {text.hasAccount}{" "}
          <Link href="/login" className="font-medium text-foreground">
            {text.login}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
