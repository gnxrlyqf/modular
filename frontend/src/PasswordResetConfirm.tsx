import { useState, type FormEvent } from 'react';
import { Input } from './Reusables';
import { extractErrorMessage } from './api';
import logger from './logger';
import { validatePasswordStrength, validatePasswordsMatch } from './validators';
import { t, useLanguage } from './i18n';

const CONFIRM_ENDPOINT = '/api/users/password-reset-confirm/';

type Props = {
  uid: string;
  token: string;
};

export default function PasswordResetConfirmPage({ uid, token }: Props) {
  useLanguage();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pwError, setPwError] = useState<string | undefined>(undefined);
  const [matchError, setMatchError] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pw = validatePasswordStrength(password);
    const m = validatePasswordsMatch(password, repeat);
    setPwError(pw ?? undefined);
    setMatchError(m ?? undefined);
    if (pw || m) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(CONFIRM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, 'Could not reset password.');
        logger.warn('auth.password_reset_confirm_failed', { status: res.status });
        throw new Error(msg);
      }
      logger.info('auth.password_reset_confirm_success');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    window.location.assign('/');
  };

  if (done) {
    return (
      <div className="font-lexend min-h-screen flex items-center justify-center px-4">
        <div className="modal-card max-w-md w-full text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            {t('auth.reset_done_title')}
          </h2>
          <p className="text-indigo-300/70 text-sm">
            {t('auth.reset_done_desc')}
          </p>
          <button
            type="button"
            onClick={goHome}
            data-xylo-note="C5"
            className="xylo-note xylo-note--submit"
          >
            {t('auth.back_to_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-lexend min-h-screen flex items-center justify-center px-4">
      <div className="modal-card max-w-md w-full">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent text-center tracking-wide mb-4">
          {t('auth.set_new_password_title')}
        </h2>
        <p className="text-indigo-300/50 text-xs text-center mb-8">
          {t('auth.set_new_password_desc')}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-5" noValidate>
          <div>
            <Input
              type="password"
              placeholder={t('placeholder.new_password_field')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              aria-invalid={Boolean(pwError)}
            />
            {pwError && <p className="text-red-300/80 text-xs mt-1 ml-1">{pwError}</p>}
          </div>
          <div>
            <Input
              type="password"
              placeholder={t('placeholder.repeat_new_field')}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(matchError)}
            />
            {matchError && <p className="text-red-300/80 text-xs mt-1 ml-1">{matchError}</p>}
          </div>
          {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            data-xylo-note="C5"
            className="xylo-note xylo-note--submit"
          >
            {submitting ? t('auth.reset_submitting') : t('auth.reset_submit')}
          </button>
          <button
            type="button"
            onClick={goHome}
            data-xylo-note="A5"
            className="xylo-note xylo-note--link text-sm self-center"
          >
            {t('common.cancel')}
          </button>
        </form>
      </div>
    </div>
  );
}

export function parsePasswordResetRoute(pathname: string): { uid: string; token: string } | null {
  const m = pathname.match(/^\/password-reset\/([^/]+)\/([^/]+)\/?$/);
  if (!m) return null;
  return { uid: m[1], token: m[2] };
}
