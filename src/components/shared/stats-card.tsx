import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  tone?: "emerald" | "sky" | "amber" | "rose" | "neutral";
  icon: LucideIcon;
};

const toneClasses = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  neutral: "bg-muted text-muted-foreground",
};

export function StatsCard({
  label,
  value,
  unit,
  delta,
  deltaType = "neutral",
  tone = "neutral",
  icon: Icon,
}: StatsCardProps) {
  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tracking-tight">
              {value}
            </span>
            {unit ? (
              <span className="text-sm text-muted-foreground">{unit}</span>
            ) : null}
          </div>
          {delta ? (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                deltaType === "up" && "text-emerald-600 dark:text-emerald-400",
                deltaType === "down" && "text-rose-600 dark:text-rose-400",
                deltaType === "neutral" && "text-muted-foreground",
              )}
            >
              {delta}
            </p>
          ) : null}
        </div>
        <div className={cn("rounded-lg p-2", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
