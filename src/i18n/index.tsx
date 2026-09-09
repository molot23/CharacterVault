import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

export type Locale = 'en' | 'zh-CN';
type TranslationValues = Record<string, string | number>;
type TranslationFunction = (key: string, values?: TranslationValues) => string;

interface I18nContextValue {
  language: Locale;
  setLanguage: (language: Locale) => void;
  t: TranslationFunction;
}

const STORAGE_KEY = 'characterVaultLanguage';
const resources: Record<Locale, unknown> = { en, 'zh-CN': zhCN };
const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh-CN') return stored;
  } catch {
    // Fall back to browser language when storage is unavailable.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
    ? 'zh-CN'
    : 'en';
}

function resolveValue(resource: unknown, key: string): string | undefined {
  let value: unknown = resource;
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key]),
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [language, setLanguageState] = useState<Locale>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Locale) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // The in-memory preference still applies for this session.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback<TranslationFunction>((key, values) => {
    const template =
      resolveValue(resources[language], key) ?? resolveValue(resources.en, key) ?? key;
    return interpolate(template, values);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
