import { describe, it, expect } from 'vitest';
import { parsePasswordResetRoute } from './PasswordResetConfirm';

describe('parsePasswordResetRoute', () => {
  it('parses uid + token from path', () => {
    expect(parsePasswordResetRoute('/password-reset/abc/xyz/')).toEqual({ uid: 'abc', token: 'xyz' });
  });

  it('parses without trailing slash', () => {
    expect(parsePasswordResetRoute('/password-reset/abc/xyz')).toEqual({ uid: 'abc', token: 'xyz' });
  });

  it('returns null on unrelated path', () => {
    expect(parsePasswordResetRoute('/')).toBeNull();
    expect(parsePasswordResetRoute('/projects/123')).toBeNull();
  });

  it('returns null on incomplete path', () => {
    expect(parsePasswordResetRoute('/password-reset/abc')).toBeNull();
  });
});
