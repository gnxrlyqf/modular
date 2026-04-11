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
        response = await fetch(url, { ...options, headers: buildHeaders(data.access) });
      } else {
        clearAuthCookies();
      }
    }
  }

  return response;
}

/** Extract a human-readable error message from a DRF error response body. */
export async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    const msg = data?.detail ?? data?.error ?? data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    // Handle field-level errors like { username: ["This field is required."] }
    const firstField = Object.values(data ?? {})[0];
    if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0];
  } catch {
    // ignore parse errors
  }
  return fallback;
}
