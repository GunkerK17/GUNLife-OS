"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  BrainCircuit,
  CalendarCheck,
  Check,
  Flame,
  FolderKanban,
  HeartPulse,
  MessageSquareText,
  Pencil,
  Pin,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizeActionError } from "@/lib/localize-action-error";
import { Button } from "@/components/ui/button";
import type {
  AiConversation,
  AiConversationCategory,
  AiMessage,
  AiPageData,
} from "@/lib/queries/ai";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | AiConversationCategory;

const categories: Array<{
  color: string;
  icon: typeof Bot;
  value: AiConversationCategory;
}> = [
  { value: "general", icon: MessageSquareText, color: "text-slate-300" },
  { value: "daily", icon: CalendarCheck, color: "text-cyan-300" },
  { value: "health", icon: HeartPulse, color: "text-rose-300" },
  { value: "goals", icon: Target, color: "text-emerald-300" },
  { value: "finance", icon: WalletCards, color: "text-amber-300" },
  { value: "learning", icon: BrainCircuit, color: "text-violet-300" },
];

const prompts = {
  vi: [
    { icon: CalendarCheck, text: "Hôm nay tôi nên ưu tiên 3 việc gì?" },
    { icon: Flame, text: "Phân tích nhịp sống 7 ngày gần đây của tôi." },
    { icon: Target, text: "Mục tiêu nào đang có nguy cơ chậm tiến độ?" },
    { icon: WalletCards, text: "Tóm tắt tài chính tháng này thật dễ hiểu." },
  ],
  en: [
    { icon: CalendarCheck, text: "What are my top three priorities today?" },
    { icon: Flame, text: "Analyze my rhythm over the last seven days." },
    { icon: Target, text: "Which goal is at risk of falling behind?" },
    { icon: WalletCards, text: "Summarize this month’s finances simply." },
  ],
};

function conversationLabel(conversation: AiConversation, fallback = "New chat") {
  return (
    conversation.title ||
    conversation.messages.find((item) => item.role === "user")?.content ||
    fallback
  );
}

function formatTime(value: string, locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AiClient({
  aiReady,
  conversations: initialConversations,
  supabaseReady,
}: AiPageData) {
  const router = useRouter();
  const { locale } = useI18n();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [draftMessages, setDraftMessages] = useState<AiMessage[]>([]);
  const [newCategory, setNewCategory] =
    useState<AiConversationCategory>("general");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] =
    useState<AiConversationCategory>("general");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [activeId, conversations],
  );
  const editingConversation = useMemo(
    () => conversations.find((item) => item.id === editingId) ?? null,
    [conversations, editingId],
  );
  const deletingConversation = useMemo(
    () => conversations.find((item) => item.id === deletingId) ?? null,
    [conversations, deletingId],
  );
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return conversations
      .filter(
        (conversation) =>
          (categoryFilter === "all" || conversation.category === categoryFilter) &&
          (!query || conversationLabel(conversation).toLocaleLowerCase(locale).includes(query)),
      )
      .sort((left, right) => {
        if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      });
  }, [categoryFilter, conversations, locale, search]);

  const messages = activeConversation?.messages ?? draftMessages;
  const text =
    locale === "vi"
      ? {
          title: "LifeOS AI Coach",
          subtitle: "Hỏi trực tiếp trên dữ liệu Timeline, sức khỏe, mục tiêu và tài chính của bạn.",
          history: "Thư viện hội thoại",
          newChat: "Chat mới",
          search: "Tìm cuộc trò chuyện...",
          all: "Tất cả",
          emptyList: "Chưa có hội thoại trong hạng mục này.",
          emptyTitle: "Bạn muốn cải thiện điều gì hôm nay?",
          emptyHint: "AI chỉ đọc dữ liệu thuộc tài khoản của bạn và trả lời theo bối cảnh LifeOS hiện tại.",
          placeholder: "Hỏi LifeOS Coach...",
          keyMissing: "Chưa có Gemini API key. Điền GEMINI_API_KEY trong .env.local rồi khởi động lại server.",
          supabaseMissing: "Cần kết nối Supabase để AI đọc dữ liệu cá nhân.",
          rename: "Quản lý cuộc trò chuyện",
          titleLabel: "Tên cuộc trò chuyện",
          categoryLabel: "Hạng mục",
          save: "Lưu thay đổi",
          cancel: "Hủy",
          deleteTitle: "Xóa cuộc trò chuyện?",
          deleteHint: "Toàn bộ tin nhắn trong cuộc trò chuyện này sẽ bị xóa vĩnh viễn.",
          delete: "Xóa vĩnh viễn",
          pinned: "Đã ghim",
          messages: "tin nhắn",
          conversations: "cuộc trò chuyện",
          analyzing: "LifeOS Coach đang phân tích dữ liệu...",
          updateError: "Không thể cập nhật cuộc trò chuyện.",
          deleteError: "Không thể xóa cuộc trò chuyện.",
          requestError: "Yêu cầu AI thất bại.",
          categories: {
            general: "Chung",
            daily: "Hằng ngày",
            health: "Sức khỏe",
            goals: "Mục tiêu",
            finance: "Tài chính",
            learning: "Học tập",
          },
        }
      : {
          title: "LifeOS AI Coach",
          subtitle: "Ask questions grounded in your Timeline, health, goals, and finance data.",
          history: "Conversation library",
          newChat: "New chat",
          search: "Search conversations...",
          all: "All",
          emptyList: "No conversations in this category.",
          emptyTitle: "What would you like to improve today?",
          emptyHint: "AI only reads data owned by your account and answers from your current LifeOS context.",
          placeholder: "Ask LifeOS Coach...",
          keyMissing: "Gemini API key is missing. Add GEMINI_API_KEY to .env.local and restart the server.",
          supabaseMissing: "Connect Supabase so AI can read your personal data.",
          rename: "Manage conversation",
          titleLabel: "Conversation name",
          categoryLabel: "Category",
          save: "Save changes",
          cancel: "Cancel",
          deleteTitle: "Delete conversation?",
          deleteHint: "Every message in this conversation will be permanently deleted.",
          delete: "Delete permanently",
          pinned: "Pinned",
          messages: "messages",
          conversations: "conversations",
          analyzing: "LifeOS Coach is analyzing your data...",
          updateError: "Unable to update conversation.",
          deleteError: "Unable to delete conversation.",
          requestError: "AI request failed.",
          categories: {
            general: "General",
            daily: "Daily",
            health: "Health",
            goals: "Goals",
            finance: "Finance",
            learning: "Learning",
          },
        };

  function categoryMeta(category: AiConversationCategory) {
    const meta = categories.find((item) => item.value === category) ?? categories[0];
    return { ...meta, label: text.categories[category] };
  }

  function newChat() {
    setActiveId(null);
    setDraftMessages([]);
    setNewCategory(categoryFilter === "all" ? "general" : categoryFilter);
    setInput("");
    setError("");
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function chooseConversation(id: string) {
    setActiveId(id);
    setDraftMessages([]);
    setError("");
  }

  function openEdit(conversation: AiConversation) {
    setEditingId(conversation.id);
    setEditTitle(conversationLabel(conversation, text.newChat));
    setEditCategory(conversation.category);
  }

  async function updateConversation(
    id: string,
    changes: { category?: AiConversationCategory; isPinned?: boolean; title?: string },
  ) {
    setManaging(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error
            ? localizeActionError(result.error, locale)
            : text.updateError,
        );
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                category: result.conversation.category,
                is_pinned: result.conversation.is_pinned,
                title: result.conversation.title,
                updated_at: result.conversation.updated_at,
              }
            : conversation,
        ),
      );
      setEditingId(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.updateError);
    } finally {
      setManaging(false);
    }
  }

  async function deleteConversation(id: string) {
    setManaging(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error
            ? localizeActionError(result.error, locale)
            : text.deleteError,
        );
      }

      const remaining = conversations.filter((conversation) => conversation.id !== id);
      setConversations(remaining);
      if (activeId === id) {
        setActiveId(remaining[0]?.id ?? null);
        setDraftMessages([]);
      }
      setDeletingId(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.deleteError);
    } finally {
      setManaging(false);
    }
  }

  async function sendMessage(message = input) {
    const content = message.trim();
    if (!content || pending || !aiReady || !supabaseReady) return;

    const optimistic: AiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const previousMessages = activeConversation?.messages ?? draftMessages;
    if (activeId) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeId
            ? { ...conversation, messages: [...conversation.messages, optimistic] }
            : conversation,
        ),
      );
    } else {
      setDraftMessages((current) => [...current, optimistic]);
    }
    setInput("");
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeConversation?.category ?? newCategory,
          conversationId: activeId,
          locale,
          message: content,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error
            ? localizeActionError(result.error, locale)
            : text.requestError,
        );
      }

      const nextMessages = result.messages as AiMessage[];
      const nextId = result.conversationId as string | null;
      const nextCategory = result.category as AiConversationCategory;
      if (nextId) {
        setConversations((current) => {
          const existing = current.find((item) => item.id === nextId);
          const nextConversation: AiConversation = existing
            ? {
                ...existing,
                category: nextCategory,
                messages: nextMessages,
                updated_at: new Date().toISOString(),
              }
            : {
                category: nextCategory,
                created_at: new Date().toISOString(),
                id: nextId,
                is_pinned: false,
                messages: nextMessages,
                title: content.length > 54 ? `${content.slice(0, 54)}…` : content,
                updated_at: new Date().toISOString(),
                user_id: "current",
              };
          return [nextConversation, ...current.filter((item) => item.id !== nextId)];
        });
        setActiveId(nextId);
        setDraftMessages([]);
      }
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.requestError);
      if (activeId) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeId
              ? { ...conversation, messages: previousMessages }
              : conversation,
          ),
        );
      } else {
        setDraftMessages(previousMessages);
      }
    } finally {
      setPending(false);
    }
  }

  const activeCategory = categoryMeta(
    activeConversation?.category ?? newCategory,
  );
  const ActiveCategoryIcon = activeCategory.icon;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-96px)] min-w-0 w-full max-w-[1500px] flex-col gap-4 overflow-hidden pb-20 lg:pb-2">
      <header className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.14)]">
          <BrainCircuit className="size-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Gemini · LifeOS context</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{text.title}</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">{text.subtitle}</p>
        </div>
      </header>

      {!aiReady || !supabaseReady ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {!supabaseReady ? text.supabaseMissing : text.keyMissing}
        </div>
      ) : null}

      <div className="grid min-h-0 min-w-0 flex-1 gap-3 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="lifeos-panel min-w-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-white">{text.history}</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">{conversations.length} {text.conversations}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={newChat} className="size-9 rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200" title={text.newChat}>
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.025] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/25" />
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => setCategoryFilter("all")} className={cn("shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-black", categoryFilter === "all" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-200" : "border-white/[0.07] text-slate-500")}>
              {text.all}
            </button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button key={category.value} type="button" onClick={() => setCategoryFilter(category.value)} className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", categoryFilter === category.value ? "border-cyan-300/25 bg-cyan-400/10" : "border-white/[0.07] bg-white/[0.02]", category.color)} title={text.categories[category.value]}>
                  <Icon className="size-3.5" />
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[calc(100vh-315px)] lg:space-y-2 lg:overflow-y-auto lg:pr-1">
            {filteredConversations.length === 0 ? (
              <div className="min-w-full rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">{text.emptyList}</div>
            ) : null}
            {filteredConversations.map((conversation) => {
              const meta = categoryMeta(conversation.category);
              const CategoryIcon = meta.icon;
              return (
                <div key={conversation.id} className={cn("group min-w-[240px] rounded-xl border p-2 transition lg:min-w-0", activeId === conversation.id ? "border-cyan-300/30 bg-cyan-400/10" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]")}>
                  <button type="button" onClick={() => chooseConversation(conversation.id)} className="w-full px-1 text-left">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={cn("size-3.5 shrink-0", meta.color)} />
                      <p className="min-w-0 flex-1 truncate text-xs font-black text-white">{conversationLabel(conversation, text.newChat)}</p>
                      {conversation.is_pinned ? <Pin className="size-3 rotate-45 text-amber-300" /> : null}
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-500">{meta.label} · {conversation.messages.length} {text.messages}</p>
                  </button>
                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-white/[0.06] pt-1.5 opacity-100 lg:opacity-0 lg:transition lg:group-hover:opacity-100">
                    <button type="button" onClick={() => void updateConversation(conversation.id, { isPinned: !conversation.is_pinned })} className={cn("grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-amber-300", conversation.is_pinned && "text-amber-300")} title={text.pinned}><Pin className="size-3.5" /></button>
                    <button type="button" onClick={() => openEdit(conversation)} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-cyan-300" title={text.rename}><Pencil className="size-3.5" /></button>
                    <button type="button" onClick={() => setDeletingId(conversation.id)} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-rose-400/10 hover:text-rose-300" title={text.delete}><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="lifeos-panel flex min-h-[620px] min-w-0 flex-col overflow-hidden lg:min-h-0">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035]", activeCategory.color)}><ActiveCategoryIcon className="size-4" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{activeConversation ? conversationLabel(activeConversation, text.newChat) : text.newChat}</p>
                <p className="text-[10px] text-slate-500">{activeCategory.label}</p>
              </div>
            </div>
            {activeConversation ? (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => void updateConversation(activeConversation.id, { isPinned: !activeConversation.is_pinned })} className={cn("size-8 rounded-lg text-slate-500 hover:text-amber-300", activeConversation.is_pinned && "text-amber-300")}><Pin className="size-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(activeConversation)} className="size-8 rounded-lg text-slate-500 hover:text-cyan-300"><Pencil className="size-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDeletingId(activeConversation.id)} className="size-8 rounded-lg text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="size-3.5" /></Button>
              </div>
            ) : (
              <select value={newCategory} onChange={(event) => setNewCategory(event.target.value as AiConversationCategory)} className="h-9 rounded-xl border border-white/10 bg-slate-950 px-2 text-xs font-bold text-slate-300 outline-none [color-scheme:dark]">
                {categories.map((category) => <option key={category.value} value={category.value}>{text.categories[category.value]}</option>)}
              </select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {messages.length ? (
              <div className="mx-auto max-w-4xl space-y-4">
                {messages.map((message) => (
                  <article key={message.id} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                    {message.role === "assistant" ? <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><Bot className="size-4" /></div> : null}
                    <div className={cn("max-w-[86%] rounded-2xl border px-4 py-3", message.role === "assistant" ? "border-white/10 bg-white/[0.035] text-slate-200" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-50")}>
                      <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                      <p className="mt-2 text-[9px] font-bold text-slate-600">{formatTime(message.createdAt, locale)}</p>
                    </div>
                    {message.role === "user" ? <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200"><UserRound className="size-4" /></div> : null}
                  </article>
                ))}
                {pending ? <div className="flex items-center gap-3 text-xs font-bold text-cyan-200"><div className="grid size-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10"><Sparkles className="size-4 animate-pulse" /></div>{text.analyzing}</div> : null}
              </div>
            ) : (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center py-12 text-center">
                <div className="grid size-20 place-items-center rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle,rgba(34,211,238,0.18),rgba(34,197,94,0.05))] text-cyan-200"><BrainCircuit className="size-9" /></div>
                <h2 className="mt-5 text-2xl font-black text-white">{text.emptyTitle}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{text.emptyHint}</p>
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {prompts[locale].map((prompt) => {
                    const Icon = prompt.icon;
                    return <button key={prompt.text} type="button" onClick={() => void sendMessage(prompt.text)} disabled={!aiReady || !supabaseReady} className="flex min-h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-left text-xs font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-400/[0.06] disabled:opacity-40"><Icon className="size-4 shrink-0 text-cyan-300" />{prompt.text}</button>;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-slate-950/75 p-3 sm:p-4">
            {error ? <p className="mb-2 rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</p> : null}
            <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 focus-within:border-cyan-300/30">
              <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={text.placeholder} rows={1} className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-600" />
              <Button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || pending || !aiReady || !supabaseReady} className="size-10 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] p-0 text-slate-950"><Send className="size-4" /></Button>
            </div>
          </div>
        </section>
      </div>

      {editingConversation ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#07111f] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between border-b border-white/10 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),rgba(34,197,94,0.08))] p-4">
              <div className="flex gap-3"><div className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300"><FolderKanban className="size-5" /></div><div><h2 className="font-black text-white">{text.rename}</h2><p className="mt-1 text-xs text-slate-400">{editingConversation.messages.length} {text.messages}</p></div></div>
              <button type="button" onClick={() => setEditingId(null)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"><X className="size-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <label className="block"><span className="text-xs font-bold text-slate-300">{text.titleLabel}</span><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={100} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-300">{text.categoryLabel}</span><select value={editCategory} onChange={(event) => setEditCategory(event.target.value as AiConversationCategory)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none [color-scheme:dark]">{categories.map((category) => <option key={category.value} value={category.value}>{text.categories[category.value]}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2 pt-1"><Button type="button" variant="ghost" onClick={() => setEditingId(null)} className="h-11 rounded-xl border border-white/10 text-slate-300">{text.cancel}</Button><Button type="button" disabled={managing || !editTitle.trim()} onClick={() => void updateConversation(editingConversation.id, { title: editTitle.trim(), category: editCategory })} className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950"><Check className="mr-2 size-4" />{text.save}</Button></div>
            </div>
          </div>
        </div>
      ) : null}

      {deletingConversation ? (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/82 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-300/20 bg-[#0b111d] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
            <div className="grid size-12 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-300"><Trash2 className="size-5" /></div>
            <h2 className="mt-4 text-xl font-black text-white">{text.deleteTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text.deleteHint}</p>
            <p className="mt-3 truncate rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-bold text-white">{conversationLabel(deletingConversation, text.newChat)}</p>
            <div className="mt-5 grid grid-cols-2 gap-2"><Button type="button" variant="ghost" onClick={() => setDeletingId(null)} className="h-11 rounded-xl border border-white/10 text-slate-300">{text.cancel}</Button><Button type="button" disabled={managing} onClick={() => void deleteConversation(deletingConversation.id)} className="h-11 rounded-xl bg-rose-500 font-black text-white hover:bg-rose-400"><Trash2 className="mr-2 size-4" />{text.delete}</Button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
