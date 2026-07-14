import { cn } from "@/lib/utils";

type AlertMessageProps = {
  error?: string;
  message?: string;
};

export function AlertMessage({ error, message }: AlertMessageProps) {
  const text = error ?? message;

  if (!text) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        error
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      )}
    >
      {text}
    </div>
  );
}
