"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  JournalRow,
  JournalWellbeing,
} from "@/lib/supabase/database.types";

export type JournalActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const journalSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().max(20000),
  mood: z.enum(["great", "good", "okay", "bad", "terrible"]).nullable(),
  wellbeing: z
    .object({
      deepWorkMin: z.number().int().min(0).max(1440).optional(),
      habits: z.array(z.string().max(50)).max(10).optional(),
      quickReviewDone: z.boolean().optional(),
      quickStimuli: z
        .record(z.string().max(50), z.number().int().min(0).max(50))
        .optional(),
      rewardClaimed: z.boolean().optional(),
      rewardKey: z.string().max(50).optional(),
      rewardNote: z.string().max(300).optional(),
      sleepHours: z.number().min(0).max(24).optional(),
      socialMediaMin: z.number().int().min(0).max(1440).optional(),
      trigger: z.string().max(500).optional(),
      urgeLevel: z.number().int().min(1).max(5).optional(),
    })
    .nullable(),
});

async function getAuthedSupabase() {
  if (!hasSupabaseConfig()) {
    return { ok: false, error: "Supabase is not configured yet." } as const;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập trước." } as const;
  }

  return { ok: true, supabase, user } as const;
}

function refreshJournal() {
  revalidatePath("/dashboard/journal");
  revalidatePath("/dashboard");
}

export async function saveJournalEntry(input: {
  content: string;
  logDate: string;
  mood: string | null;
  wellbeing: JournalWellbeing | null;
}): Promise<JournalActionResult<{ entry: JournalRow }>> {
  const parsed = journalSchema.safeParse({
    content: input.content,
    log_date: input.logDate,
    mood: input.mood,
    wellbeing: input.wellbeing,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("journals")
    .upsert(
      {
        user_id: auth.user.id,
        log_date: parsed.data.log_date,
        content: parsed.data.content.trim() || null,
        mood: parsed.data.mood,
        wellbeing: parsed.data.wellbeing ?? {},
      },
      { onConflict: "user_id,log_date" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message.includes("wellbeing")
          ? "Hãy chạy migration 009_journal_wellbeing.sql trước."
          : error?.message ?? "Không thể lưu nhật ký.",
    };
  }

  refreshJournal();
  return { ok: true, data: { entry: data } };
}

export async function deleteJournalEntry(
  logDate: string,
): Promise<JournalActionResult<{ logDate: string }>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
    return { ok: false, error: "Ngày nhật ký không hợp lệ." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("journals")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("log_date", logDate);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshJournal();
  return { ok: true, data: { logDate } };
}
