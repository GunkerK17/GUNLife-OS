import { GunLifeLogo } from "@/components/brand/gunlifeos-logo";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.035] ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1460px] space-y-4 pb-20 lg:pb-6">
      <div className="flex items-center gap-3 py-2 lg:hidden">
        <GunLifeLogo compact />
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/[0.07]" />
      </div>

      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-emerald-300/15" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/[0.08]" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-white/[0.045]" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Skeleton className="h-[380px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Skeleton className="h-[182px]" />
          <Skeleton className="h-[182px]" />
        </div>
      </div>
    </div>
  );
}
