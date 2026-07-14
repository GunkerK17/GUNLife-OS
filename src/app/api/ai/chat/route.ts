import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AiConversationCategory,
  AiMessage,
} from "@/lib/queries/ai";

export const runtime = "nodejs";

const requestSchema = z.object({
  category: z
    .enum(["general", "daily", "health", "goals", "finance", "learning"])
    .optional(),
  conversationId: z.string().uuid().nullable().optional(),
  locale: z.enum(["vi", "en"]).default("vi"),
  message: z.string().trim().min(1).max(6000),
});

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

function messageTitle(message: string) {
  return message.length > 54 ? `${message.slice(0, 54)}…` : message;
}

function inferCategory(message: string): AiConversationCategory {
  const normalized = message.toLocaleLowerCase("vi");
  if (/tiền|tài chính|chi tiêu|tiết kiệm|ví|finance|money|budget/.test(normalized)) return "finance";
  if (/mục tiêu|goal|tiến độ|kế hoạch/.test(normalized)) return "goals";
  if (/học|kỹ năng|tiếng anh|learn|skill|study/.test(normalized)) return "learning";
  if (/tập|sức khỏe|calo|cân nặng|dinh dưỡng|workout|health|weight/.test(normalized)) return "health";
  if (/hôm nay|timeline|lịch|ưu tiên|today|daily/.test(normalized)) return "daily";
  return "general";
}

function safeMessages(value: unknown): AiMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AiMessage => {
    if (!item || typeof item !== "object") return false;
    const message = item as Partial<AiMessage>;
    return (
      typeof message.id === "string" &&
      typeof message.content === "string" &&
      typeof message.createdAt === "string" &&
      (message.role === "assistant" || message.role === "user")
    );
  });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình trong .env.local." },
      { status: 503 },
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });
  }

  const today = bangkokDate();
  const month = today.slice(0, 7);
  const [
    timelineResult,
    workoutResult,
    goalsResult,
    weightResult,
    journalResult,
    walletsResult,
    transactionsResult,
  ] = await Promise.all([
    supabase.from("timeline_logs").select("title,status,start_time,duration_min").eq("user_id", user.id).eq("log_date", today).order("start_time"),
    supabase.from("workout_logs").select("duration_min,calories_burned,avg_heart_rate,note").eq("user_id", user.id).eq("log_date", today),
    supabase.from("goals").select("title,category,status,current_value,target_value").eq("user_id", user.id).eq("status", "active").limit(12),
    supabase.from("weight_logs").select("log_date,weight_kg,body_fat_pct,muscle_kg").eq("user_id", user.id).order("log_date", { ascending: false }).limit(7),
    supabase.from("journals").select("log_date,mood,content,wellbeing").eq("user_id", user.id).order("log_date", { ascending: false }).limit(7),
    supabase.from("wallets").select("name,type,balance,credit_limit").eq("user_id", user.id).eq("is_active", true),
    supabase.from("transactions").select("tx_date,type,amount,category").eq("user_id", user.id).gte("tx_date", `${month}-01`).order("tx_date", { ascending: false }).limit(100),
  ]);

  let conversation: {
    category: AiConversationCategory;
    id: string;
    messages: unknown;
    title: string | null;
  } | null = null;
  if (parsed.data.conversationId) {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id,title,messages,category")
      .eq("id", parsed.data.conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    conversation = data;
  }

  const history = safeMessages(conversation?.messages).slice(-16);
  const userMessage: AiMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: parsed.data.message,
    createdAt: new Date().toISOString(),
  };
  const context = {
    date: today,
    timeline: timelineResult.data ?? [],
    workouts: workoutResult.data ?? [],
    goals: goalsResult.data ?? [],
    recentWeight: weightResult.data ?? [],
    recentJournal: journalResult.data ?? [],
    wallets: walletsResult.data ?? [],
    monthTransactions: transactionsResult.data ?? [],
  };
  const systemInstruction =
    parsed.data.locale === "vi"
      ? `Bạn là LifeOS Coach, trợ lý cá nhân thực tế và ngắn gọn. Hãy trả lời bằng tiếng Việt. Dùng dữ liệu LifeOS được cung cấp để đưa ra nhận xét cụ thể, nhưng không bịa dữ liệu. Không chẩn đoán y khoa, không đưa ra cam kết tài chính. Nếu thiếu dữ liệu, nói rõ. Ưu tiên 3 việc: nhận ra mẫu, đề xuất bước tiếp theo nhỏ, và hỏi tối đa một câu khi thật sự cần. Dữ liệu hiện tại: ${JSON.stringify(context)}`
      : `You are LifeOS Coach, a practical and concise personal assistant. Use the provided LifeOS data without inventing facts. Do not diagnose medical conditions or make financial guarantees. If data is missing, say so. Prioritize pattern recognition, one small next step, and at most one necessary question. Current data: ${JSON.stringify(context)}`;

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash"}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [...history, userMessage].map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 1200,
        },
      }),
    },
  );

  const geminiData = await geminiResponse.json().catch(() => null);
  if (!geminiResponse.ok) {
    return NextResponse.json(
      { error: geminiData?.error?.message ?? "Gemini API không phản hồi." },
      { status: geminiResponse.status },
    );
  }

  const answer = geminiData?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();
  if (!answer) {
    return NextResponse.json({ error: "Gemini không trả về nội dung." }, { status: 502 });
  }

  const assistantMessage: AiMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: answer,
    createdAt: new Date().toISOString(),
  };
  const messages = [...history, userMessage, assistantMessage];
  let conversationId = conversation?.id ?? null;
  const category =
    parsed.data.category ?? conversation?.category ?? inferCategory(parsed.data.message);

  if (conversationId) {
    await supabase
      .from("ai_conversations")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);
  } else {
    const { data } = await supabase
      .from("ai_conversations")
      .insert({
        category,
        user_id: user.id,
        title: messageTitle(parsed.data.message),
        messages,
      })
      .select("id")
      .single();
    conversationId = data?.id ?? null;
  }

  return NextResponse.json({ answer, category, conversationId, messages });
}
