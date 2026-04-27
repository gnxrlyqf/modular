import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUsername,
  validatePasswordStrength,
  validatePasswordsMatch,
  validateTOTPCode,
  validateLoginForm,
  validateSignupForm,
  validateChangePasswordForm,
  hasErrors,
} from './validators';

describe('validateEmail', () => {
  it('rejects empty string', () => {
    expect(validateEmail('')).toMatch(/required/i);
  });

  it('rejects malformed email', () => {
    expect(validateEmail('foo')).toMatch(/invalid/i);
    expect(validateEmail('foo@')).toMatch(/invalid/i);
    expect(validateEmail('foo@bar')).toMatch(/invalid/i);
  });

  it('accepts valid email', () => {
    expect(validateEmail('jane.doe@example.com')).toBeNull();
  });
});

describe('validateUsername', () => {
  it('requires 3+ chars', () => {
    expect(validateUsername('ab')).toMatch(/at least/i);
  });

  it('rejects bad chars', () => {
    expect(validateUsername('hello world')).toMatch(/letters/i);
    expect(validateUsername('💀exotic')).toMatch(/letters/i);
  });

  it('accepts allowed chars', () => {
    expect(validateUsername('john_doe.42')).toBeNull();
  });
});

describe('validatePasswordStrength', () => {
  it('rejects short passwords', () => {
    expect(validatePasswordStrength('abc')).toMatch(/at least 8/);
  });

  it('requires letter and digit', () => {
    expect(validatePasswordStrength('aaaaaaaa')).toMatch(/digit/i);
    expect(validatePasswordStrength('12345678')).toMatch(/numeric|letter/i);
  });

  it('accepts strong password', () => {
    expect(validatePasswordStrength('GoodPass234')).toBeNull();
  });
});

describe('validatePasswordsMatch', () => {
  it('rejects mismatch', () => {
    expect(validatePasswordsMatch('a', 'b')).toMatch(/match/i);
  });

  it('accepts match', () => {
    expect(validatePasswordsMatch('same', 'same')).toBeNull();
  });
});

describe('validateTOTPCode', () => {
  it('requires 6 digits', () => {
    expect(validateTOTPCode('123')).toMatch(/6 digits/i);
    expect(validateTOTPCode('abcdef')).toMatch(/6 digits/i);
  });

  it('accepts 6 digits', () => {
    expect(validateTOTPCode('123456')).toBeNull();
  });
});

describe('form validators', () => {
  it('login form rejects empty', () => {
    const errs = validateLoginForm({ username: '', password: '' });
    expect(hasErrors(errs)).toBe(true);
    expect(errs.username).toBeTruthy();
    expect(errs.password).toBeTruthy();
  });

  it('login form passes when filled', () => {
    const errs = validateLoginForm({ username: 'a', password: 'b' });
    expect(hasErrors(errs)).toBe(false);
  });

  it('signup form catches mismatched passwords', () => {
    const errs = validateSignupForm({
      username: 'alice',
      email: 'a@b.co',
      password: 'GoodPass234',
      repeatPassword: 'GoodPass235',
    });
    expect(errs.repeatPassword).toMatch(/match/i);
  });

  it('change-password form catches all bad fields', () => {
    const errs = validateChangePasswordForm({
      oldPassword: '',
      newPassword: 'short',
      repeatPassword: 'mismatch',
    });
    expect(errs.oldPassword).toBeTruthy();
    expect(errs.newPassword).toBeTruthy();
    expect(errs.repeatPassword).toBeTruthy();
  });
});

describe('hasErrors', () => {
  it('returns false on empty', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns false when all values undefined', () => {
    expect(hasErrors({ a: undefined, b: undefined })).toBe(false);
  });

  it('returns true on any string', () => {
    expect(hasErrors({ a: 'oops' })).toBe(true);
  });
});
