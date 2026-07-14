import Image from "next/image";
import { cn } from "@/lib/utils";

type GunLifeLogoProps = {
  className?: string;
  compact?: boolean;
  markClassName?: string;
  showTagline?: boolean;
};

export function GunLifeLogo({
  className,
  compact = false,
  markClassName,
  showTagline = true,
}: GunLifeLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative block size-11 shrink-0 overflow-hidden rounded-[14px] border border-emerald-300/20 bg-[#02070b] shadow-[0_0_28px_rgba(34,211,238,0.16)]",
          markClassName,
        )}
      >
        <Image
          src="/brand/gunlifeos-brand.png"
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          priority
          className="pointer-events-none absolute left-1/2 top-1/2 size-[230%] max-w-none -translate-x-1/2 -translate-y-[38%] select-none object-contain"
        />
      </span>

      {!compact ? (
        <span className="min-w-0 leading-none">
          <span className="block truncate text-[19px] font-black tracking-[-0.045em] text-white">
            GunLife<span className="bg-[linear-gradient(90deg,#67e8f9,#4ade80)] bg-clip-text text-transparent">OS</span>
          </span>
          {showTagline ? (
            <span className="mt-1 block truncate text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Control · Focus · Evolve
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
