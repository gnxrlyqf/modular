// Reusable input validators. Pure functions: each returns null on valid, error string on invalid.

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

export function validateRequired(value: string | null | undefined, fieldLabel = 'This field'): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return `${fieldLabel} is required.`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const required = validateRequired(value, 'Email');
  if (required) return required;
  if (!EMAIL_RE.test(value.trim())) return 'Invalid email format.';
  if (value.length > 254) return 'Email is too long.';
  return null;
}

export function validateUsername(value: string): string | null {
  const required = validateRequired(value, 'Username');
  if (required) return required;
  const v = value.trim();
  if (v.length < 3) return 'Username must be at least 3 characters.';
  if (v.length > 30) return 'Username must be at most 30 characters.';
  if (!USERNAME_RE.test(v)) return 'Username may only contain letters, digits, ., -, _.';
  return null;
}

export function validatePasswordStrength(value: string): string | null {
  const required = validateRequired(value, 'Password');
  if (required) return required;
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password is too long.';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain a letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain a digit.';
  if (/^\d+$/.test(value)) return 'Password cannot be entirely numeric.';
  return null;
}

export function validatePasswordsMatch(a: string, b: string): string | null {
  if (a !== b) return 'Passwords do not match.';
  return null;
}

export function validateTOTPCode(value: string): string | null {
  const required = validateRequired(value, 'Code');
  if (required) return required;
  if (!/^\d{6}$/.test(value.trim())) return 'Code must be 6 digits.';
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > 500) return 'Bio must be at most 500 characters.';
  return null;
}

// Form-level helpers ---------------------------------------------------------

export function validateLoginForm(input: { username: string; password: string }): FieldErrors<'username' | 'password'> {
  const errs: FieldErrors<'username' | 'password'> = {};
  const u = validateRequired(input.username, 'Username');
  if (u) errs.username = u;
  const p = validateRequired(input.password, 'Password');
  if (p) errs.password = p;
  return errs;
}

export function validateSignupForm(input: {
  username: string;
  email: string;
  password: string;
  repeatPassword: string;
}): FieldErrors<'username' | 'email' | 'password' | 'repeatPassword'> {
  const errs: FieldErrors<'username' | 'email' | 'password' | 'repeatPassword'> = {};
  const u = validateUsername(input.username);
  if (u) errs.username = u;
  const e = validateEmail(input.email);
  if (e) errs.email = e;
  const p = validatePasswordStrength(input.password);
  if (p) errs.password = p;
  const m = validatePasswordsMatch(input.password, input.repeatPassword);
  if (m) errs.repeatPassword = m;
  return errs;
}

export function validateChangePasswordForm(input: {
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}): FieldErrors<'oldPassword' | 'newPassword' | 'repeatPassword'> {
  const errs: FieldErrors<'oldPassword' | 'newPassword' | 'repeatPassword'> = {};
  const o = validateRequired(input.oldPassword, 'Current password');
  if (o) errs.oldPassword = o;
  const n = validatePasswordStrength(input.newPassword);
  if (n) errs.newPassword = n;
  const m = validatePasswordsMatch(input.newPassword, input.repeatPassword);
  if (m) errs.repeatPassword = m;
  return errs;
}

export function validateEmailForm(email: string): FieldErrors<'email'> {
  const errs: FieldErrors<'email'> = {};
  const e = validateEmail(email);
  if (e) errs.email = e;
  return errs;
}

export function validateUsernameForm(username: string): FieldErrors<'username'> {
  const errs: FieldErrors<'username'> = {};
  const u = validateUsername(username);
  if (u) errs.username = u;
  return errs;
}

export function hasErrors(errs: FieldErrors): boolean {
  return Object.values(errs).some((v) => Boolean(v));
}
