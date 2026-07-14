import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AiConversationCategory,
  AiConversationRow,
} from "@/lib/supabase/database.types";

export type { AiConversationCategory };

export type AiMessage = {
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "user";
};

export type AiConversation = Omit<AiConversationRow, "messages"> & {
  messages: AiMessage[];
};

export type AiPageData = {
  aiReady: boolean;
  conversations: AiConversation[];
  supabaseReady: boolean;
};

function isAiMessage(value: unknown): value is AiMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<AiMessage>;
  return (
    typeof message.id === "string" &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string" &&
    (message.role === "assistant" || message.role === "user")
  );
}

function normalizeConversation(row: AiConversationRow): AiConversation {
  const messages = Array.isArray(row.messages)
    ? row.messages.filter(isAiMessage)
    : [];

  return {
    ...row,
    category: row.category ?? "general",
    is_pinned: row.is_pinned ?? false,
    messages,
  };
}

export async function getAiPageData(): Promise<AiPageData> {
  if (!hasSupabaseConfig()) {
    return {
      aiReady: Boolean(process.env.GEMINI_API_KEY),
      conversations: [],
      supabaseReady: false,
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(30);

  return {
    aiReady: Boolean(process.env.GEMINI_API_KEY),
    conversations: (data ?? []).map(normalizeConversation),
    supabaseReady: true,
  };
}
