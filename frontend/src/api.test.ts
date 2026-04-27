import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './api';

function makeResponse(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('extractErrorMessage', () => {
  it('reads new error envelope: details first', async () => {
    const res = makeResponse({
      error: {
        code: 'INVALID_INPUT',
        message: 'Validation failed.',
        details: { email: ['Invalid email format.'] },
      },
    });
    expect(await extractErrorMessage(res, 'fallback')).toBe('Invalid email format.');
  });

  it('reads new error envelope: falls back to message', async () => {
    const res = makeResponse({
      error: { code: 'PERMISSION_DENIED', message: 'Forbidden.', details: {} },
    });
    expect(await extractErrorMessage(res, 'fallback')).toBe('Forbidden.');
  });

  it('reads legacy {detail} shape', async () => {
    const res = makeResponse({ detail: 'Authentication required.' });
    expect(await extractErrorMessage(res, 'fallback')).toBe('Authentication required.');
  });

  it('reads legacy field-error shape', async () => {
    const res = makeResponse({ password: ['Too short.'] });
    expect(await extractErrorMessage(res, 'fallback')).toBe('Too short.');
  });

  it('returns fallback on broken JSON', async () => {
    const res = new Response('<html>500</html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
    expect(await extractErrorMessage(res, 'fallback')).toBe('fallback');
  });
});
