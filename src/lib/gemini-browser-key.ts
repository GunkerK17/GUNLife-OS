export const GEMINI_CREDENTIALS_STORAGE_KEY = "lifeos.gemini.credentials.v1";

export type GeminiBrowserCredentials = {
  apiKey: string;
  model: string;
};

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

function storageKey(userId: string | null) {
  return `${GEMINI_CREDENTIALS_STORAGE_KEY}.${userId || "anonymous"}`;
}

export function readGeminiBrowserCredentials(
  userId: string | null,
): GeminiBrowserCredentials | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<GeminiBrowserCredentials>;
    const apiKey = parsed.apiKey?.trim();
    const model = parsed.model?.trim();
    if (!apiKey || !model) return null;

    return { apiKey, model };
  } catch {
    return null;
  }
}

export function saveGeminiBrowserCredentials(
  credentials: GeminiBrowserCredentials,
  userId: string | null,
) {
  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      apiKey: credentials.apiKey.trim(),
      model: credentials.model.trim(),
    }),
  );
}

export function clearGeminiBrowserCredentials(userId: string | null) {
  window.localStorage.removeItem(storageKey(userId));
}

export function maskGeminiApiKey(apiKey: string) {
  if (apiKey.length < 9) return "••••••••";
  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}
