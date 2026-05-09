import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authFetch } from './api';
import { setGlobalXyloMuted } from './Xylophone';
import { setI18nLanguage } from './i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserPrefs = {
  language: string;
  theme: 'dark' | 'light';
  sound: boolean;
  notifications: {
    messages: boolean;
    friend_requests: boolean;
  };
  chat: {
    sound_alerts: boolean;
    auto_open_on_message: boolean;
  };
  accessibility: {
    reduced_motion: boolean;
  };
};

export const DEFAULT_PREFS: UserPrefs = {
  language: 'en',
  theme: 'dark',
  sound: true,
  notifications: {
    messages: true,
    friend_requests: true,
  },
  chat: {
    sound_alerts: false,
    auto_open_on_message: false,
  },
  accessibility: {
    reduced_motion: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);
const LS_KEY = 'Lmoussiqar_prefs';
const SAVE_DEBOUNCE_MS = 900;

function deepMerge(base: UserPrefs, patch: Partial<UserPrefs>): UserPrefs {
  return {
    ...base,
    ...patch,
    notifications: { ...base.notifications, ...patch.notifications },
    chat: { ...base.chat, ...patch.chat },
    accessibility: { ...base.accessibility, ...patch.accessibility },
  };
}

function readLocal(): UserPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return deepMerge(DEFAULT_PREFS, JSON.parse(raw));
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

function applyToDOM(prefs: UserPrefs): void {
  const html = document.documentElement;
  html.setAttribute('data-theme', prefs.theme);
  html.setAttribute('lang', prefs.language);
  html.setAttribute('dir', RTL_LANGS.has(prefs.language) ? 'rtl' : 'ltr');
  html.setAttribute('data-reduced-motion', prefs.accessibility.reduced_motion ? '1' : '0');
  setI18nLanguage(prefs.language);
  setGlobalXyloMuted(!prefs.sound);
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface PrefsCtx {
  prefs: UserPrefs;
  updatePrefs: (patch: Partial<UserPrefs>) => void;
  syncing: boolean;
}

const Ctx = createContext<PrefsCtx>({
  prefs: DEFAULT_PREFS,
  updatePrefs: () => {},
  syncing: false,
});

export function usePrefs(): PrefsCtx {
  return useContext(Ctx);
}

// Apply immediately on module load — before first React render — to prevent
// language/theme/dir flash when page is loaded with a saved preference.
applyToDOM(readLocal());

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  // Read from localStorage immediately for instant apply (no flash).
  const [prefs, setPrefs] = useState<UserPrefs>(readLocal);
  const [syncing, setSyncing] = useState(false);

  // Keep the full def_settings blob so we can merge prefs back in before save.
  const defSettingsRef = useRef<Record<string, unknown>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply DOM effects whenever prefs change.
  useEffect(() => { applyToDOM(prefs); }, [prefs]);

  // Sync from backend once on mount (authenticated users only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/users/profile/me/');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const defSettings: Record<string, unknown> = data.def_settings ?? {};
        defSettingsRef.current = defSettings;
        const backendPrefs = defSettings.prefs as Partial<UserPrefs> | undefined;
        if (backendPrefs && !cancelled) {
          const merged = deepMerge(DEFAULT_PREFS, backendPrefs);
          setPrefs(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
        }
      } catch { /* not authenticated — localStorage value used */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveToBackend = useCallback(async (nextPrefs: UserPrefs) => {
    setSyncing(true);
    try {
      const fullDefSettings = { ...defSettingsRef.current, prefs: nextPrefs };
      const res = await authFetch('/api/users/profile/me/', {
        method: 'PATCH',
        body: JSON.stringify({ def_settings: fullDefSettings }),
      });
      if (res.ok) {
        defSettingsRef.current = fullDefSettings;
      }
    } catch { /* ignore */ } finally {
      setSyncing(false);
    }
  }, []);

  const updatePrefs = useCallback((patch: Partial<UserPrefs>) => {
    setPrefs((cur) => {
      const next = deepMerge(cur, patch);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveToBackend(next), SAVE_DEBOUNCE_MS);
      return next;
    });
  }, [saveToBackend]);

  return (
    <Ctx.Provider value={{ prefs, updatePrefs, syncing }}>
      {children}
    </Ctx.Provider>
  );
}
