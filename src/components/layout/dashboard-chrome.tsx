"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bot,
  BookOpen,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Plus,
  Scale,
  Settings,
  Sparkles,
  Target,
  UserRound,
  Utensils,
  WalletCards,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GunLifeLogo } from "@/components/brand/gunlifeos-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/components/providers/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { getLifeLevel } from "@/lib/life-level";
import { cn } from "@/lib/utils";

type DashboardUser = {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
};

type DashboardChromeProps = {
  children: React.ReactNode;
  user: DashboardUser | null;
  supabaseConfigured: boolean;
};

type NavItem = {
  titleKey: TranslationKey;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: Home },
  { titleKey: "nav.timeline", href: "/dashboard/timeline", icon: CalendarDays },
  { titleKey: "nav.workout", href: "/dashboard/workout", icon: Dumbbell },
  { titleKey: "nav.activities", href: "/dashboard/activities", icon: Activity },
  { titleKey: "nav.nutrition", href: "/dashboard/nutrition", icon: Utensils },
  { titleKey: "nav.weight", href: "/dashboard/weight", icon: Scale },
  { titleKey: "nav.goals", href: "/dashboard/goals", icon: Target },
  { titleKey: "nav.skills", href: "/dashboard/skills", icon: GraduationCap },
  { titleKey: "nav.finance", href: "/dashboard/finance", icon: WalletCards },
  { titleKey: "nav.journal", href: "/dashboard/journal", icon: BookOpen },
  { titleKey: "nav.ai", href: "/dashboard/ai", icon: Bot },
];

const bottomNavItems: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: Home },
  { titleKey: "nav.timeline", href: "/dashboard/timeline", icon: CalendarDays },
  { titleKey: "nav.workout", href: "/dashboard/workout", icon: Dumbbell },
  { titleKey: "nav.profile", href: "/dashboard/settings", icon: UserRound },
];

function getInitials(user: DashboardUser | null) {
  const displayName = user?.fullName ?? user?.email ?? "LifeOS";

  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AppLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="GunLifeOS dashboard"
      className="min-w-0 rounded-xl outline-none ring-emerald-300/60 focus-visible:ring-2"
    >
      <GunLifeLogo
        markClassName={mobile ? "size-10" : undefined}
        showTagline={!mobile}
      />
    </Link>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive =
    item.href === "/dashboard"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white",
        isActive &&
          "bg-[linear-gradient(90deg,rgba(34,197,94,0.28),rgba(34,211,238,0.08))] text-white shadow-[inset_3px_0_0_#22c55e,0_12px_30px_rgba(34,197,94,0.12)]",
      )}
    >
      <Icon
        className={cn(
          "size-4 text-slate-400 transition-colors group-hover:text-emerald-300",
          isActive && "text-emerald-300",
        )}
      />
      <span className="truncate">{t(item.titleKey)}</span>
    </Link>
  );
}

function Sidebar({ user }: { user: DashboardUser | null }) {
  const { t } = useI18n();
  const lifeLevel = getLifeLevel(user?.dateOfBirth);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[216px] border-r border-white/10 bg-slate-950/80 p-3.5 shadow-[24px_0_70px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:flex lg:flex-col xl:w-[232px] xl:p-4 2xl:w-[244px]">
      <AppLogo />

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:mt-5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <Link
        href="/dashboard/settings"
        className="group mt-3 block rounded-xl border border-emerald-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_45%),linear-gradient(135deg,rgba(34,197,94,0.09),rgba(255,255,255,0.025))] p-3 transition hover:border-emerald-300/30"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            {t("lifeLevel.title")}
          </p>
          <Sparkles className="size-4 text-cyan-300 transition group-hover:rotate-12" />
        </div>

        {lifeLevel ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-full p-[4px] shadow-[0_0_24px_rgba(34,197,94,0.18)]"
                style={{
                  background: `conic-gradient(#34d399 0 ${lifeLevel.progress}%, rgba(255,255,255,0.08) ${lifeLevel.progress}% 100%)`,
                }}
              >
                <div className="grid size-full place-items-center rounded-full bg-slate-950">
                  <span className="text-lg font-black text-white">{lifeLevel.age}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-black text-white">
                  {t("lifeLevel.level")} {lifeLevel.age}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {lifeLevel.daysElapsed}/{lifeLevel.daysInLevel} XP
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#34d399)] shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                style={{ width: `${lifeLevel.progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {t("lifeLevel.next")} {lifeLevel.nextAge}: {lifeLevel.daysUntilNextLevel} {t("lifeLevel.days")}
            </p>
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-black/10 p-3 text-xs leading-5 text-slate-400">
            {t("lifeLevel.setup")}
          </div>
        )}
      </Link>

      <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3">
          <NavLink
            item={{ titleKey: "nav.settings", href: "/dashboard/settings", icon: Settings }}
          />
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-3 text-[13px] text-slate-300 hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="size-4" />
            {t("nav.logout")}
          </Button>
        </form>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/92 px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center">
        {bottomNavItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium text-slate-500",
                isActive && "text-emerald-300",
              )}
            >
              <Icon className="size-5" />
              {t(item.titleKey)}
            </Link>
          );
        })}

        <Link
          href="/dashboard/timeline"
          className="mx-auto grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#22c55e)] text-slate-950 shadow-[0_10px_30px_rgba(34,197,94,0.35)]"
          aria-label={t("nav.addTask")}
        >
          <Plus className="size-6" />
        </Link>

        {bottomNavItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium text-slate-500",
                isActive && "text-emerald-300",
              )}
            >
              <Icon className="size-5" />
              {t(item.titleKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MobileMenu({ user }: { user: DashboardUser | null }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const displayName = user?.fullName ?? user?.email ?? "GunLifeOS user";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-200"
          aria-label={t("nav.menu")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[min(90vw,380px)] gap-0 border-emerald-300/15 bg-[#020817]/98 p-0 text-white shadow-[30px_0_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
      >
        <SheetHeader className="border-b border-white/10 p-4 pr-14 text-left">
          <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
          <GunLifeLogo />
        </SheetHeader>

        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-emerald-300/25 hover:bg-emerald-400/[0.07]"
        >
          <Avatar className="size-10 shrink-0 border border-emerald-300/20">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-emerald-400/15 font-bold text-emerald-300">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">
              {displayName}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {user?.email ?? t("app.signedIn")}
            </span>
          </span>
        </Link>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            {t("nav.allModules")}
          </p>
          <nav className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </div>

        <SheetFooter className="border-t border-white/10 bg-slate-950/70 p-3">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="size-4 text-emerald-300" />
            {t("nav.settings")}
          </Link>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm text-rose-200 hover:bg-rose-400/10 hover:text-rose-100"
            >
              <LogOut className="size-4" />
              {t("nav.logout")}
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MobileTopBar({ user }: { user: DashboardUser | null }) {
  const displayName = user?.fullName ?? user?.email ?? "LifeOS user";

  return (
    <header className="mb-4 flex min-w-0 items-center justify-between gap-2 lg:hidden">
      <AppLogo mobile />
      <div className="flex shrink-0 items-center gap-1.5">
        <LanguageSwitcher compact />
        <Avatar className="hidden size-9 border border-white/10 min-[390px]:flex">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-emerald-400/15 text-emerald-300">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <MobileMenu user={user} />
      </div>
    </header>
  );
}

function DesktopAccountBar({ user }: { user: DashboardUser | null }) {
  const { t } = useI18n();
  const displayName = user?.fullName ?? user?.email ?? "LifeOS user";

  return (
    <header className="mb-2 hidden h-12 items-center justify-end gap-2 lg:flex">
      <LanguageSwitcher compact />
      <button
        type="button"
        className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-emerald-300/30 hover:text-white"
        aria-label={t("nav.notifications")}
      >
        <Bell className="size-5" />
        <span className="absolute right-3 top-2 size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
      </button>

      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <Avatar className="size-9 border border-emerald-300/25 shadow-[0_0_24px_rgba(34,197,94,0.18)]">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-emerald-400/15 font-bold text-emerald-300">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden max-w-[220px] xl:block">
          <p className="truncate text-sm font-bold text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-400">
            {user?.email ?? t("app.signedIn")}
          </p>
        </div>
      </div>
    </header>
  );
}

function SupabaseMissingMessage() {
  const { t } = useI18n();

  return t("app.supabaseMissing");
}

export function DashboardChrome({
  children,
  user,
  supabaseConfigured,
}: DashboardChromeProps) {
  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#02050b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),transparent_32%),linear-gradient(240deg,rgba(34,197,94,0.14),transparent_35%),linear-gradient(180deg,#06101d_0%,#02050b_52%,#010308_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:58px_58px] opacity-55" />

      <Sidebar user={user} />

      <div className="relative min-h-screen lg:pl-[216px] xl:pl-[232px] 2xl:pl-[244px]">
        <main className="min-w-0 w-full max-w-full overflow-x-hidden px-3 pb-24 pt-3 sm:px-4 lg:px-4 lg:pb-6 lg:pt-3 xl:px-5 2xl:px-7">
          <MobileTopBar user={user} />
          <DesktopAccountBar user={user} />
          {!supabaseConfigured ? (
            <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <SupabaseMissingMessage />
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
