export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

export function getCookie(name: string): string | null {
  const entry = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

export function clearAuthCookies(): void {
  const sec = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${sec}`;
  document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${sec}`;
}

/**
 * Authenticated fetch wrapper. Automatically attaches the JWT Bearer token,
 * attempts a silent token refresh on 401, and clears cookies if refresh fails.
 * Sets Content-Type: application/json when the body is a JSON string.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const buildHeaders = (token: string | null): Record<string, string> => {
    const h: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string' && !h['Content-Type']) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  };

  let response = await fetch(url, { ...options, headers: buildHeaders(getCookie(ACCESS_COOKIE)) });

  if (response.status === 401) {
    const refresh = getCookie(REFRESH_COOKIE);
    if (refresh) {
      const refreshResp = await fetch('/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (refreshResp.ok) {
        const data: { access: string } = await refreshResp.json();
        const sec = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(data.access)}; Max-Age=86400; Path=/; SameSite=Lax${sec}`;
        sendInternalLog('info', 'auth.token_refresh', data.access);
        response = await fetch(url, { ...options, headers: buildHeaders(data.access) });
      } else {
        sendInternalLog('warning', 'auth.session_expired', getCookie(ACCESS_COOKIE));
        clearAuthCookies();
      }
    }
  }

  return response;
}

/** Fire-and-forget log from inside api.ts (avoids circular import with logger.ts). */
function sendInternalLog(level: string, message: string, token: string | null) {
  if (!token) return;
  fetch('/api/logs/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ level, message, context: null }),
  }).catch(() => {});
}

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  detail?: unknown;
  message?: unknown;
};

function firstStringFromDetails(details: unknown): string | null {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) {
    for (const v of details) {
      const s = firstStringFromDetails(v);
      if (s) return s;
    }
    return null;
  }
  if (typeof details === 'object') {
    for (const v of Object.values(details as Record<string, unknown>)) {
      const s = firstStringFromDetails(v);
      if (s) return s;
    }
  }
  return null;
}

/** Extract a human-readable error message from an API error response. */
export async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: ErrorEnvelope | Record<string, unknown> = await response.json();

    if (data && typeof data === 'object' && 'error' in data && data.error && typeof data.error === 'object') {
      const env = (data as ErrorEnvelope).error!;
      const msgFromDetails = firstStringFromDetails(env.details);
      if (msgFromDetails) return msgFromDetails;
      if (typeof env.message === 'string' && env.message.trim()) return env.message;
    }

    const flat = data as Record<string, unknown>;
    const direct = flat.detail ?? flat.message;
    if (typeof direct === 'string' && direct.trim()) return direct;

    const firstField = Object.values(flat)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0] as string;
    if (typeof firstField === 'string') return firstField;
  } catch {
    // ignore parse errors
  }
  return fallback;
}
