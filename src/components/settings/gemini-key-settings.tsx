"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearGeminiBrowserCredentials,
  DEFAULT_GEMINI_MODEL,
  maskGeminiApiKey,
  readGeminiBrowserCredentials,
  saveGeminiBrowserCredentials,
} from "@/lib/gemini-browser-key";
import { cn } from "@/lib/utils";

type GeminiKeySettingsProps = {
  serverKeyAvailable: boolean;
  userId: string | null;
};

const inputClassName =
  "h-11 rounded-xl border-white/10 bg-slate-950/70 text-white placeholder:text-slate-600 focus-visible:border-cyan-300/40 focus-visible:ring-cyan-300/15";

export function GeminiKeySettings({
  serverKeyAvailable,
  userId,
}: GeminiKeySettingsProps) {
  const { locale } = useI18n();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const text =
    locale === "vi"
      ? {
          title: "Gemini AI",
          description:
            "Thay key trực tiếp trên web và dùng ngay, không cần sửa code hoặc redeploy.",
          personal: "Key cá nhân đang hoạt động",
          system: "Đang dùng key chung của hệ thống",
          unavailable: "Chưa có Gemini API key",
          keyLabel: "Gemini API key mới",
          keyPlaceholder: "Dán API key từ Google AI Studio",
          modelLabel: "Model Gemini",
          save: "Lưu và dùng key này",
          test: "Kiểm tra kết nối",
          delete: "Xóa key cá nhân",
          saved: "Đã lưu. AI Coach sẽ dùng key này ngay từ yêu cầu tiếp theo.",
          deleted: serverKeyAvailable
            ? "Đã xóa key cá nhân. Hệ thống quay lại dùng key chung."
            : "Đã xóa key cá nhân. Bạn cần thêm key mới để dùng AI.",
          valid: "Kết nối Gemini thành công.",
          missing: "Hãy nhập Gemini API key trước.",
          invalidModel: "Tên model không hợp lệ.",
          testFailed: "Không thể kiểm tra Gemini API key.",
          browserOnly:
            "Key chỉ được lưu trong trình duyệt này, không lưu vào Supabase và không hiển thị lại đầy đủ.",
          secureCall:
            "Mỗi yêu cầu AI gửi key qua HTTPS đến server LifeOS và không ghi key vào cuộc trò chuyện.",
          active: "Đang dùng",
          notConfigured: "Chưa cấu hình",
        }
      : {
          title: "Gemini AI",
          description:
            "Replace the key from the web and use it immediately without editing code or redeploying.",
          personal: "Personal key is active",
          system: "Using the shared system key",
          unavailable: "No Gemini API key available",
          keyLabel: "New Gemini API key",
          keyPlaceholder: "Paste a key from Google AI Studio",
          modelLabel: "Gemini model",
          save: "Save and use this key",
          test: "Test connection",
          delete: "Delete personal key",
          saved: "Saved. AI Coach will use this key on the next request.",
          deleted: serverKeyAvailable
            ? "Personal key deleted. LifeOS is using the shared system key again."
            : "Personal key deleted. Add another key to use AI.",
          valid: "Gemini connection succeeded.",
          missing: "Enter a Gemini API key first.",
          invalidModel: "The model name is invalid.",
          testFailed: "Unable to test the Gemini API key.",
          browserOnly:
            "The key is stored only in this browser, never in Supabase, and is never displayed in full again.",
          secureCall:
            "Each AI request sends the key over HTTPS to the LifeOS server and never stores it in conversations.",
          active: "Active",
          notConfigured: "Not configured",
        };

  useEffect(() => {
    const credentials = readGeminiBrowserCredentials(userId);
    if (!credentials) return;
    setSavedKey(credentials.apiKey);
    setModel(credentials.model);
  }, [userId]);

  const candidateKey = apiKey.trim() || savedKey;
  const status = savedKey
    ? text.personal
    : serverKeyAvailable
      ? text.system
      : text.unavailable;

  function validate() {
    setError("");
    setMessage("");
    if (candidateKey.length < 20) {
      setError(text.missing);
      return false;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(model.trim())) {
      setError(text.invalidModel);
      return false;
    }
    return true;
  }

  function saveKey() {
    if (!validate()) return;
    saveGeminiBrowserCredentials({
      apiKey: candidateKey,
      model: model.trim(),
    }, userId);
    setSavedKey(candidateKey);
    setApiKey("");
    setShowKey(false);
    setMessage(text.saved);
  }

  async function testKey() {
    if (!validate()) return;
    setTesting(true);
    try {
      const response = await fetch("/api/ai/key/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: candidateKey,
          locale,
          model: model.trim(),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || text.testFailed);
      setMessage(text.valid);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : text.testFailed,
      );
    } finally {
      setTesting(false);
    }
  }

  function deleteKey() {
    clearGeminiBrowserCredentials(userId);
    setSavedKey("");
    setApiKey("");
    setError("");
    setMessage(text.deleted);
  }

  return (
    <section className="lifeos-panel overflow-hidden border-cyan-300/15">
      <div className="flex items-start gap-3 border-b border-white/[0.07] bg-[linear-gradient(120deg,rgba(34,211,238,0.08),rgba(34,197,94,0.04))] p-3.5 sm:p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20 sm:size-10 sm:rounded-xl">
          <Bot className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-white">{text.title}</h2>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                savedKey || serverKeyAvailable
                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-300/20 bg-amber-400/10 text-amber-200",
              )}
            >
              {savedKey || serverKeyAvailable ? text.active : text.notConfigured}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {text.description}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-3.5 sm:p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <KeyRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white">{status}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
              {savedKey ? maskGeminiApiKey(savedKey) : model}
            </p>
          </div>
          {savedKey ? <CheckCircle2 className="size-4 text-emerald-300" /> : null}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-300">
            {text.keyLabel}
          </Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={savedKey ? maskGeminiApiKey(savedKey) : text.keyPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className={cn(inputClassName, "pr-11 font-mono text-xs")}
            />
            <button
              type="button"
              onClick={() => setShowKey((current) => !current)}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-300">
            {text.modelLabel}
          </Label>
          <Input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className={cn(inputClassName, "font-mono text-xs")}
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs leading-5 text-rose-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2.5 text-xs leading-5 text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            disabled={testing || !candidateKey}
            onClick={() => void testKey()}
            className="h-11 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] text-cyan-200 hover:bg-cyan-400/10 hover:text-cyan-100"
          >
            {testing ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <WandSparkles className="mr-2 size-4" />
            )}
            {text.test}
          </Button>
          <Button
            type="button"
            onClick={saveKey}
            disabled={!candidateKey}
            className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
          >
            <KeyRound className="mr-2 size-4" />
            {text.save}
          </Button>
        </div>

        {savedKey ? (
          <Button
            type="button"
            variant="ghost"
            onClick={deleteKey}
            className="h-10 w-full rounded-xl border border-rose-300/15 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
          >
            <Trash2 className="mr-2 size-4" />
            {text.delete}
          </Button>
        ) : null}

        <div className="space-y-2 rounded-xl border border-white/[0.07] bg-slate-950/50 p-3 text-[10px] leading-4 text-slate-500">
          <p className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
            {text.browserOnly}
          </p>
          <p className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />
            {text.secureCall}
          </p>
        </div>
      </div>
    </section>
  );
}
