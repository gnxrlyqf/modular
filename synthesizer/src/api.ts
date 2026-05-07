const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function getCookie(name: string): string | null {
  const entry = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

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
      }
    }
  }

  return response;
}
