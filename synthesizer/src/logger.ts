import { authFetch, getCookie, ACCESS_COOKIE } from './api';

const LOG_ENDPOINT = '/api/logs/';

type LogLevel = 'info' | 'warning' | 'error' | 'debug' | 'action';

function send(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const body = JSON.stringify({ level, message, context: context ?? null });
  const opts: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };

  if (getCookie(ACCESS_COOKIE)) {
    authFetch(LOG_ENDPOINT, { method: 'POST', body }).catch(() => {});
  } else {
    fetch(LOG_ENDPOINT, opts).catch(() => {});
  }
}

const logger = {
  info:   (message: string, context?: Record<string, unknown>) => send('info', message, context),
  warn:   (message: string, context?: Record<string, unknown>) => send('warning', message, context),
  error:  (message: string, context?: Record<string, unknown>) => send('error', message, context),
  debug:  (message: string, context?: Record<string, unknown>) => send('debug', message, context),
  action: (message: string, context?: Record<string, unknown>) => send('action', message, context),
};

export default logger;
