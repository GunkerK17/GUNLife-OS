"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const localeOptions: Array<{ label: string; value: Locale }> = [
  { label: "VN", value: "vi" },
  { label: "EN", value: "en" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    router.refresh();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1",
        compact ? "w-fit" : "w-full",
      )}
      aria-label={t("common.language")}
    >
      {!compact ? (
        <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-950/45 text-slate-400">
          <Languages className="size-4" />
        </div>
      ) : null}
      {localeOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => changeLocale(option.value)}
          className={cn(
            "h-8 flex-1 rounded-lg px-3 text-xs font-black",
            locale === option.value
              ? "bg-[linear-gradient(135deg,#22d3ee,#22c55e)] text-slate-950 hover:text-slate-950"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
            compact && "w-10 flex-none px-0",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
