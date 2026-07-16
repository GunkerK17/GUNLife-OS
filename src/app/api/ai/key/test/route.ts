import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  apiKey: z.string().trim().min(20).max(256),
  locale: z.enum(["vi", "en"]).default("vi"),
  model: z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9._-]+$/),
});

function geminiError(locale: "vi" | "en", status: number, fallback?: string) {
  if (status === 429) {
    return locale === "vi"
      ? "Key đã hết quota hoặc đang bị giới hạn. Hãy chờ quota reset hoặc dùng key thuộc Google Project khác."
      : "This key is out of quota or rate limited. Wait for a reset or use a key from another Google Project.";
  }
  if (status === 401 || status === 403) {
    return locale === "vi"
      ? "Key không hợp lệ, đã bị khóa hoặc chưa được phép dùng Gemini API."
      : "The key is invalid, blocked, or not allowed to use the Gemini API.";
  }
  if (status === 404) {
    return locale === "vi"
      ? "Không tìm thấy model Gemini này. Hãy kiểm tra lại tên model."
      : "This Gemini model was not found. Check the model name.";
  }
  return fallback ||
    (locale === "vi"
      ? "Gemini không phản hồi. Hãy thử lại sau."
      : "Gemini did not respond. Try again later.");
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${parsed.data.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": parsed.data.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply only with OK" }] }],
        generationConfig: { maxOutputTokens: 8, temperature: 0 },
      }),
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      {
        error: geminiError(
          parsed.data.locale,
          response.status,
          data?.error?.message,
        ),
      },
      { status: response.status },
    );
  }

  return NextResponse.json({ ok: true, model: parsed.data.model });
}
