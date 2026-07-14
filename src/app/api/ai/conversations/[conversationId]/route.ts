import { NextResponse } from "next/server";
import { z } from "zod";
import type { AiConversationRow } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z
  .object({
    category: z
      .enum(["general", "daily", "health", "goals", "finance", "learning"])
      .optional(),
    isPinned: z.boolean().optional(),
    title: z.string().trim().min(1).max(100).optional(),
  })
  .refine(
    (value) =>
      value.category !== undefined ||
      value.isPinned !== undefined ||
      value.title !== undefined,
    "No changes supplied.",
  );

type RouteContext = {
  params: { conversationId: string };
};

async function authenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsedId = z.string().uuid().safeParse(params.conversationId);
  const parsedBody = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsedId.success || !parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.success ? "Invalid conversation." : parsedBody.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const { supabase, user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });

  const changes: Partial<AiConversationRow> = {};
  if (parsedBody.data.title !== undefined) changes.title = parsedBody.data.title;
  if (parsedBody.data.category !== undefined) changes.category = parsedBody.data.category;
  if (parsedBody.data.isPinned !== undefined) changes.is_pinned = parsedBody.data.isPinned;

  const { data, error } = await supabase
    .from("ai_conversations")
    .update(changes)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id,title,category,is_pinned,updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });
  return NextResponse.json({ conversation: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const parsedId = z.string().uuid().safeParse(params.conversationId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const { supabase, user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });

  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
