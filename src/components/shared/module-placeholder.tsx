import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
  items: string[];
};

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  phase,
  items,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              <Badge variant="secondary">{phase}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="h-10">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-lg border bg-background px-4 py-3 text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
