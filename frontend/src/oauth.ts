import logger from './logger';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './api';

const SOCIAL_AUTH_ENDPOINT = '/api/users/social-auth/';
const CALLBACK_PATH = '/auth-callback.html';

export type OAuthProvider = 'google' | 'facebook' | '42';

type ProviderConfig = {
  authUrl: string;
  clientId: string;
  scope: string;
  responseType: 'token' | 'code';
  extraParams?: Record<string, string>;
};

function env(key: string): string {
  const val = (import.meta.env as Record<string, string | undefined>)[key];
  return val ?? '';
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: env('VITE_GOOGLE_CLIENT_ID'),
    scope: 'openid email profile',
    responseType: 'token',
    extraParams: { include_granted_scopes: 'true', prompt: 'select_account' },
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: env('VITE_FACEBOOK_CLIENT_ID'),
    scope: 'email public_profile',
    responseType: 'token',
  },
  '42': {
    authUrl: 'https://api.intra.42.fr/oauth/authorize',
    clientId: env('VITE_FORTYTWO_CLIENT_ID'),
    scope: 'public',
    responseType: 'code',
  },
};

type CallbackMessage = {
  type: 'oauth-callback';
  state: string;
  access_token?: string;
  code?: string;
  error?: string;
};

export type OAuthResult =
  | { ok: true; access: string; refresh: string }
  | { ok: false; error: string };

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function buildAuthUrl(provider: OAuthProvider, state: string, redirectUri: string): string {
  const cfg = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: cfg.responseType,
    scope: cfg.scope,
    state,
    ...(cfg.extraParams ?? {}),
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

function setAuthCookies(access: string, refresh: string): void {
  const sec = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(access)}; Max-Age=86400; Path=/; SameSite=Lax${sec}`;
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}; Max-Age=604800; Path=/; SameSite=Lax${sec}`;
}

function waitForCallback(popup: Window, expectedState: string): Promise<CallbackMessage | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: CallbackMessage | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      resolve(value);
    };
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as CallbackMessage | undefined;
      if (!data || data.type !== 'oauth-callback') return;
      if (data.state !== expectedState) return;
      finish(data);
    };
    window.addEventListener('message', onMessage);
    const poll = setInterval(() => {
      if (popup.closed) finish(null);
    }, 500);
  });
}

export async function startOAuth(provider: OAuthProvider): Promise<OAuthResult> {
  const cfg = PROVIDERS[provider];
  if (!cfg.clientId) {
    return { ok: false, error: `${provider} OAuth client ID not configured. Set VITE_${provider === '42' ? 'FORTYTWO' : provider.toUpperCase()}_CLIENT_ID.` };
  }

  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const state = randomState();
  const url = buildAuthUrl(provider, state, redirectUri);

  logger.info('oauth.start', { provider });

  const popup = window.open(url, 'oauth-popup', 'width=520,height=640,scrollbars=yes,noopener=no');
  if (!popup) {
    return { ok: false, error: 'Popup blocked. Allow popups and retry.' };
  }

  const msg = await waitForCallback(popup, state);
  try { if (!popup.closed) popup.close(); } catch { /* ignore */ }

  if (!msg) return { ok: false, error: 'OAuth cancelled.' };
  if (msg.error) {
    logger.warn('oauth.provider_error', { provider, error: msg.error });
    return { ok: false, error: msg.error };
  }

  const body: Record<string, string> = { provider };
  if (cfg.responseType === 'code') {
    if (!msg.code) return { ok: false, error: 'Provider did not return a code.' };
    body.code = msg.code;
  } else {
    if (!msg.access_token) return { ok: false, error: 'Provider did not return an access token.' };
    body.access_token = msg.access_token;
  }

  const resp = await fetch(SOCIAL_AUTH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let detail = `Auth failed (${resp.status})`;
    try {
      const body = await resp.json();
      detail = body?.detail ?? body?.error ?? detail;
    } catch { /* ignore */ }
    logger.warn('oauth.backend_failed', { provider, status: resp.status });
    return { ok: false, error: detail };
  }
  const data: unknown = await resp.json();
  if (
    !data || typeof data !== 'object' ||
    typeof (data as { access?: unknown }).access !== 'string' ||
    typeof (data as { refresh?: unknown }).refresh !== 'string'
  ) {
    return { ok: false, error: 'Unexpected response from backend.' };
  }
  const { access, refresh } = data as { access: string; refresh: string };

  setAuthCookies(access, refresh);
  logger.info('oauth.success', { provider });
  return { ok: true, access, refresh };
}
