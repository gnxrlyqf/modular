/**
 * i18n module — placeholder implementation.
 *
 * Locale JSON files under `./locales/` contain every UI key. Non-English
 * files currently have empty-string values; fill them in to add a translation.
 *
 * Usage:
 *   import { t } from './i18n';
 *   <h1>{t('settings.title')}</h1>
 *
 * When a key is missing in the active locale the English value is used as
 * fallback. When the English value is also missing the raw key is returned.
 */

import { useState, useEffect } from 'react';
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';

type LocaleMap = typeof en;
export type I18nKey = keyof LocaleMap;

const LOCALES: Record<string, Partial<LocaleMap>> = { en, ar, fr, es, de };

let _lang = 'en';
const _listeners = new Set<() => void>();

/** Returns current active language code. */
export function getLang(): string { return _lang; }

/** Called by PrefsProvider whenever the language preference changes. */
export function setI18nLanguage(lang: string): void {
  const newLang = lang in LOCALES ? lang : 'en';
  if (newLang !== _lang) {
    _lang = newLang;
    _listeners.forEach(listener => listener());
  }
}

/**
 * Translate a key into the current language.
 * Falls back to English, then to the raw key string.
 */
export function t(key: I18nKey): string {
  const dict = LOCALES[_lang] ?? LOCALES.en;
  const val = dict[key];
  if (val) return val;
  // fallback to English
  const enVal = en[key];
  if (enVal) return enVal;
  return key;
}

export const SUPPORTED_LANGUAGES: Array<{ code: string; label: string; native: string; rtl?: boolean }> = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'ar', label: 'Arabic',   native: 'العربية', rtl: true },
  { code: 'fr', label: 'French',   native: 'Français' },
  { code: 'es', label: 'Spanish',  native: 'Español' },
  { code: 'de', label: 'German',   native: 'Deutsch' },
];

/** Hook to subscribe to language changes and trigger re-renders. */
export function useLanguage(): string {
  const [lang, setLang] = useState(_lang);

  useEffect(() => {
    const listener = () => setLang(_lang);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return lang;
}
