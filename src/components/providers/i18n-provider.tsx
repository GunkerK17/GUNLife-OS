"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLocale,
  dictionaries,
  isLocale,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const storageKey = "lifeos.locale";
const localeCookieMaxAge = 60 * 60 * 24 * 365;
const I18nContext = createContext<I18nContextValue | null>(null);

function getTranslation(locale: Locale, key: TranslationKey) {
  const [section, item] = key.split(".") as [
    keyof typeof dictionaries.en,
    string,
  ];
  const sectionValue = dictionaries[locale][section] as Record<string, string>;

  return sectionValue[item] ?? key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(storageKey);

    if (isLocale(storedLocale)) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      document.cookie = `${storageKey}=${storedLocale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(storageKey, nextLocale);
    document.documentElement.lang = nextLocale;
    document.cookie = `${storageKey}=${nextLocale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
