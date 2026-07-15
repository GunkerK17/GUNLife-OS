"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";

export default function DashboardError({ reset }: { reset: () => void }) {
  const { locale } = useI18n();
  const vietnamese = locale === "vi";

  return (
    <div className="grid min-h-[60vh] place-items-center px-2 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-rose-300/20 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.12),transparent_42%),rgba(2,6,23,0.82)] p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-300">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-white">
          {vietnamese ? "Có lỗi khi tải dữ liệu" : "Something went wrong"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          {vietnamese
            ? "Dữ liệu của bạn vẫn an toàn. Hãy thử tải lại màn hình này; nếu lỗi lặp lại, kiểm tra kết nối Supabase."
            : "Your data is still safe. Retry this screen, and check the Supabase connection if the error persists."}
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-6 h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] px-5 font-black text-slate-950 hover:opacity-90"
        >
          <RefreshCcw className="size-4" />
          {vietnamese ? "Thử lại" : "Try again"}
        </Button>
      </section>
    </div>
  );
}
