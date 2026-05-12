import { AnimatedContent } from './ReactBits/ReactBits';
import React, { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { authFetch, clearAuthCookies, getCookie, extractErrorMessage, REFRESH_COOKIE } from './api';
import { Input, CloseButton } from './Reusables';
import logger from './logger';
import {
  validateUsername,
  validateEmail,
  validateChangePasswordForm,
  validateTOTPCode,
  hasErrors,
  type FieldErrors,
} from './validators';
import { usePrefs, clearLocalPrefs } from './Prefs';
import { t, useLanguage, SUPPORTED_LANGUAGES } from './i18n';

function SettingsSection(props: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">{props.title}</h2>
      <p className="text-sm text-indigo-300/50 font-light leading-relaxed">{props.description}</p>
      <div className="space-y-3 text-indigo-50">{props.children}</div>
    </section>
  )
}

// ─── Username Modal ───────────────────────────────────────────────────────────

function UsernameUpdateModal(props: { onClose: () => void; onSuccess: (newUsername: string) => void }) {
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validateUsername(newUsername);
    if (v) {
      setUsernameError(v);
      return;
    }
    setUsernameError('');
    setSubmitting(true);

    try {
      const response = await authFetch('/api/users/change-username/', {
        method: 'POST',
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to update username.');
        logger.error('settings.username_change_failed', { status: response.status });
        throw new Error(msg);
      }

      logger.action('settings.username_change');
      props.onSuccess(newUsername);
      props.onClose();
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : 'Failed to update username.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_username_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-username" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              {t('settings.new_username')}
            </label>
            <Input
              id="new-username"
              type="text"
              required
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder={t('placeholder.username')}
              className="w-full"
            />
          </div>
          {usernameError && <p className="text-red-300/80 text-sm">{usernameError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('common.saving') : t('settings.update_username')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────

function PasswordUpdateModal(props: { isOpen: boolean; onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'oldPassword' | 'newPassword' | 'repeatPassword'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!props.isOpen) return null;

  const closeModal = () => {
    setOldPassword('');
    setNewPassword('');
    setRepeatPassword('');
    setPasswordError('');
    setFieldErrors({});
    setSuccess(false);
    props.onClose();
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errs = validateChangePasswordForm({ oldPassword, newPassword, repeatPassword });
    setFieldErrors(errs);
    if (hasErrors(errs)) {
      setPasswordError('');
      return;
    }
    setPasswordError('');
    setSubmitting(true);

    try {
      const response = await authFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to update password.');
        logger.error('settings.password_change_failed', { status: response.status });
        throw new Error(msg);
      }

      logger.action('settings.password_change');
      setSuccess(true);
      setTimeout(closeModal, 800);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_password_title')}</h3>
          <CloseButton onClick={closeModal} />
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="current-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              {t('settings.current_password')}
            </label>
            <Input
              id="current-password"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder={t('placeholder.current_password')}
              className="w-full"
              aria-invalid={Boolean(fieldErrors.oldPassword)}
            />
            {fieldErrors.oldPassword && <p className="text-red-300/80 text-xs">{fieldErrors.oldPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              {t('settings.new_password')}
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t('placeholder.new_password')}
              className="w-full"
              aria-invalid={Boolean(fieldErrors.newPassword)}
            />
            {fieldErrors.newPassword && <p className="text-red-300/80 text-xs">{fieldErrors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="repeat-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              {t('settings.repeat_password')}
            </label>
            <Input
              id="repeat-password"
              type="password"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              placeholder={t('placeholder.repeat_password')}
              className="w-full"
              aria-invalid={Boolean(fieldErrors.repeatPassword)}
            />
            {fieldErrors.repeatPassword && <p className="text-red-300/80 text-xs">{fieldErrors.repeatPassword}</p>}
          </div>
          {passwordError && <p className="text-red-300/80 text-sm">{passwordError}</p>}
          {success && <p className="text-green-300/80 text-sm">{t('settings.password_updated')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('common.saving') : t('settings.update_password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Email Modal ──────────────────────────────────────────────────────────────

function EmailUpdateModal(props: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!props.isOpen) return null;

  const closeModal = () => {
    setEmail('');
    setEmailError('');
    setSuccess(false);
    props.onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validateEmail(email);
    if (v) {
      setEmailError(v);
      return;
    }
    setEmailError('');
    setSubmitting(true);

    try {
      const response = await authFetch('/api/users/change-email/', {
        method: 'PUT',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to update email.');
        logger.error('settings.email_change_failed', { status: response.status });
        throw new Error(msg);
      }

      logger.action('settings.email_change');
      setSuccess(true);
      setTimeout(closeModal, 800);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to update email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_email_title')}</h3>
          <CloseButton onClick={closeModal} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-email" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              {t('settings.new_email_label')}
            </label>
            <Input
              id="new-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('placeholder.email')}
              className="w-full"
            />
          </div>
          {emailError && <p className="text-red-300/80 text-sm">{emailError}</p>}
          {success && <p className="text-green-300/80 text-sm">{t('settings.email_updated')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('common.saving') : t('settings.update_email')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Avatar Upload Modal ──────────────────────────────────────────────────────

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

function AvatarUpdateModal(props: { onClose: () => void; onSuccess: (url: string | null) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = event.target.files?.[0];
    if (!f) { setFile(null); return; }
    if (!ALLOWED_AVATAR_TYPES.includes(f.type)) {
      setError('Image type must be JPG, PNG, or WebP.');
      setFile(null);
      return;
    }
    if (f.size > MAX_AVATAR_SIZE) {
      setError('Image must be smaller than 5MB.');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Pick an image first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const response = await authFetch('/api/users/profile/me/', { method: 'PATCH', body: fd });
      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to upload avatar.');
        logger.error('settings.avatar_upload_failed', { status: response.status });
        throw new Error(msg);
      }
      const data = await response.json();
      logger.action('settings.avatar_upload');
      props.onSuccess(typeof data.avatar === 'string' ? data.avatar : null);
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.avatar_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover avatar-ring" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300/40 text-xs">
                {t('settings.avatar_no_image')}
              </div>
            )}
            <label className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">
              {file ? t('settings.avatar_choose_different') : t('settings.avatar_choose')}
              <input
                type="file"
                accept={ALLOWED_AVATAR_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-indigo-300/40">{t('settings.avatar_hint')}</p>
          </div>
          {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting || !file} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('settings.avatar_uploading') : t('settings.avatar_upload')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 2FA Setup Modal ──────────────────────────────────────────────────────────

function TwoFactorSetupModal(props: { onClose: () => void; onEnabled: () => void }) {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/users/2fa/enable/', { method: 'POST' });
        if (!response.ok) {
          const msg = await extractErrorMessage(response, 'Failed to start 2FA setup.');
          throw new Error(msg);
        }
        const data: { secret: string; qr_uri: string } = await response.json();
        if (cancelled) return;
        setSecret(data.secret);
        setQrUri(data.qr_uri);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to start 2FA setup.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validateTOTPCode(code);
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await authFetch('/api/users/2fa/verify/', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Invalid verification code.');
        logger.warn('settings.2fa_verify_failed', { status: response.status });
        throw new Error(msg);
      }
      logger.action('settings.2fa_enabled');
      props.onEnabled();
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.2fa_enable_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        {loading && <p className="text-indigo-300/60 text-sm py-4 text-center">{t('settings.2fa_generating')}</p>}

        {!loading && qrUri && (
          <>
            <p className="text-indigo-300/60 text-xs leading-relaxed mb-4">
              {t('settings.2fa_scan_desc')}
            </p>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={qrUri} size={180} level="M" />
              </div>
            </div>

            {secret && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.2fa_manual_secret')}</p>
                <div className="settings-row settings-row-box">
                  <span className="text-indigo-100 text-xs font-mono break-all">{secret}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(secret).catch(() => {})}
                    className="glass glass-hover rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer"
                  >
                    {t('settings.2fa_copy')}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="totp-code" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
                  {t('settings.2fa_verification_code')}
                </label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  className="w-full text-center tracking-[0.4em]"
                />
              </div>
              {error && <p className="text-red-300/80 text-sm">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
                  {submitting ? t('auth.verifying') : t('settings.2fa_enable_submit')}
                </button>
              </div>
            </form>
          </>
        )}

        {!loading && !qrUri && error && (
          <div className="space-y-3">
            <p className="text-red-300/80 text-sm">{error}</p>
            <div className="flex justify-end">
              <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteAccountModal(props: { isOpen: boolean; onClose: () => void; onDeleted: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!props.isOpen) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await authFetch('/api/users/delete/', { method: 'DELETE' });
      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to delete account.');
        logger.error('settings.account_delete_failed', { status: response.status });
        throw new Error(msg);
      }
      logger.action('settings.account_delete');
      clearLocalPrefs();
      clearAuthCookies();
      props.onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-semibold text-red-300/90 tracking-wide">{t('settings.delete_account_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <p className="text-indigo-300/50 text-sm pb-4 font-light leading-relaxed">
          {t('settings.delete_account_desc')}
        </p>
        {error && <p className="text-red-300/80 text-sm pb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={handleDelete} disabled={submitting} className="rounded-lg px-4 py-1.5 text-sm font-medium bg-red-500/20 border border-red-500/40 hover:bg-red-500/35 text-red-200 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
            {submitting ? t('settings.deleting') : t('settings.delete_my_account')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Settings ─────────────────────────────────────────────────────────

function AccountSettings(props: { setLoggedIn?: (value: boolean) => void }) {
  const [username, setUsername] = useState<string>('…');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.username) setUsername(data.username);
        if (data?.email) setUserEmail(data.email);
        if (typeof data?.is_verified === 'boolean') setIsVerified(data.is_verified);
      })
      .catch(() => {});

    authFetch('/api/users/profile/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.two_factor_enabled === 'boolean') {
          setTwoFactorEnabled(data.two_factor_enabled);
        }
        if (data && typeof data.avatar === 'string') {
          setAvatar(data.avatar);
        }
      })
      .catch(() => {});
  }, []);

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      const r = await authFetch('/api/users/resend-verification/', { method: 'POST' });
      setResendStatus(r.ok ? 'sent' : 'error');
    } catch {
      setResendStatus('error');
    }
  };

  const handleLogout = async () => {
    logger.action('auth.logout');
    const refresh = getCookie(REFRESH_COOKIE);
    if (refresh) {
      try {
        await authFetch('/api/users/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // Proceed with local logout regardless
      }
    }
    clearLocalPrefs();
    clearAuthCookies();
    props.setLoggedIn?.(false);
    window.location.reload();
  };


  return (
    <>
      <SettingsSection title={t('settings.section.account')} description={t('settings.section.account.desc')}>
        <div className="space-y-4">

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('profile.avatar')}</p>
            <div className="settings-row settings-row-box">
              <div className="flex items-center gap-3 min-w-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover avatar-ring shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 shrink-0" />
                )}
                <span className="text-indigo-300/40 text-xs truncate">{t('settings.avatar_hint_short')}</span>
              </div>
              <button type="button" onClick={() => setIsAvatarModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                {t('common.change')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.change_username_title')}</p>
            <div className="settings-row settings-row-box">
              <span className="text-indigo-100 text-sm">{username}</span>
              <button type="button" onClick={() => setIsUsernameModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                {t('common.change')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.password')}</p>
            <div className="settings-row settings-row-box">
              <span className="text-indigo-100 text-sm tracking-widest">••••••••</span>
              <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                {t('common.change')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.email_label')}</p>
            <div className="settings-row settings-row-box">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-indigo-100 text-sm truncate">{userEmail || '…'}</span>
                  {isVerified === false && (
                    <span className="text-yellow-400/90 text-xs font-medium border border-yellow-400/30 bg-yellow-400/10 rounded px-1.5 py-0.5 shrink-0">{t('settings.unverified')}</span>
                  )}
                </div>
                {isVerified === false && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                    className="text-yellow-400/70 hover:text-yellow-300 text-xs underline underline-offset-2 text-left cursor-pointer disabled:cursor-default disabled:no-underline disabled:opacity-60 w-fit"
                  >
                    {resendStatus === 'sending' ? t('settings.resend_sending') : resendStatus === 'sent' ? t('settings.resend_sent') : resendStatus === 'error' ? t('settings.resend_failed') : t('settings.resend_verification')}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setIsEmailModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer shrink-0">
                {t('common.change')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.two_factor')}</p>
            <div className="settings-row settings-row-box">
              <span className={`text-xs ${twoFactorEnabled ? 'text-green-300/80' : 'text-indigo-300/40'}`}>
                {twoFactorEnabled === null ? '…' : twoFactorEnabled ? t('settings.two_factor.enabled') : t('settings.two_factor.disabled')}
              </span>
              {!twoFactorEnabled && (
                <button type="button" onClick={() => setIsTwoFactorModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                  {t('common.enable')}
                </button>
              )}
            </div>
          </div>

          <div className="divider-glow my-2" />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLogout} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('auth.sign_out')}
            </button>
          </div>
        </div>
      </SettingsSection>

      {isUsernameModalOpen && (
        <UsernameUpdateModal
          onClose={() => setIsUsernameModalOpen(false)}
          onSuccess={(newUsername) => setUsername(newUsername)}
        />
      )}

      <PasswordUpdateModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <EmailUpdateModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
      {isAvatarModalOpen && (
        <AvatarUpdateModal
          onClose={() => setIsAvatarModalOpen(false)}
          onSuccess={(url) => setAvatar(url)}
        />
      )}
      {isTwoFactorModalOpen && (
        <TwoFactorSetupModal
          onClose={() => setIsTwoFactorModalOpen(false)}
          onEnabled={() => setTwoFactorEnabled(true)}
        />
      )}
    </>
  )
}

function GeneralSettings() {
  useLanguage();
  const { prefs, updatePrefs } = usePrefs();
  return (
    <SettingsSection title={t('settings.section.personalized')} description={t('settings.section.personalized.desc')}>
      <div className="space-y-4">

        <div className="space-y-1.5">
          <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.language')}</p>
          <div className="settings-row settings-row-box">
            <span className="text-indigo-100 text-sm">
              {SUPPORTED_LANGUAGES.find(l => l.code === prefs.language)?.label ?? 'English'}
            </span>
            <select
              value={prefs.language}
              onChange={e => updatePrefs({ language: e.target.value })}
              className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer bg-transparent border-0 outline-none"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#0d0d1a] text-indigo-100">
                  {l.native} — {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.theme')}</p>
          <div className="settings-row settings-row-box">
            <span className="text-indigo-100 text-sm">
              {prefs.theme === 'light' ? t('settings.theme.light') : t('settings.theme.dark')}
            </span>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(th => (
                <button
                  key={th}
                  type="button"
                  onClick={() => updatePrefs({ theme: th })}
                  className={`rounded-lg px-3 py-1 text-xs font-medium tracking-wide duration-200 ease-out cursor-pointer border ${
                    prefs.theme === th
                      ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                      : 'glass glass-hover glow-indigo border-transparent text-indigo-300/70 hover:text-white'
                  }`}
                >
                  {th === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.sound')}</p>
          <div className="settings-row settings-row-box">
            <div>
              <span className="text-indigo-100 text-sm">{t('settings.sound')}</span>
              <p className="text-indigo-300/40 text-xs mt-0.5">{t('settings.sound.desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => updatePrefs({ sound: !prefs.sound })}
              className={`rounded-lg px-3 py-1 text-xs font-medium tracking-wide duration-200 ease-out cursor-pointer border ${
                prefs.sound
                  ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                  : 'glass glass-hover glow-indigo border-transparent text-indigo-300/40 hover:text-indigo-300/70'
              }`}
            >
              {prefs.sound ? t('settings.sound_on') : t('settings.sound_off')}
            </button>
          </div>
        </div>

      </div>
    </SettingsSection>
  )
}

function PrivacySettings(props: { setLoggedIn?: (value: boolean) => void }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleted = () => {
    clearLocalPrefs();
    clearAuthCookies();
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  return (
    <>
      <SettingsSection title={t('settings.section.privacy')} description={t('settings.section.privacy.desc')}>
        <div className="space-y-1.5">
          <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.delete_account_title')}</p>
          <div className="settings-row settings-row-box">
            <span className="text-indigo-300/40 text-xs font-light">{t('settings.delete_account_desc')}</span>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-lg px-3 py-1 text-xs font-medium bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300/80 hover:text-red-200 tracking-wide duration-200 ease-out cursor-pointer shrink-0"
            >
              {t('auth.delete_account')}
            </button>
          </div>
        </div>
      </SettingsSection>
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

function Settings(props: { personal?: boolean; func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void }) {
  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[60rem] mx-3 sm:mx-auto">
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">{t('settings.title')}</h1>
        <CloseButton onClick={() => props.func && props.func(false)} />
      </div>
      <div className="mx-3 sm:mx-4 mb-4 mt-2 rounded-xl border border-white/6 bg-white/2 p-4 sm:p-5 md:p-6">
        <div className="space-y-6">
          <AccountSettings setLoggedIn={props.setLoggedIn} />
          <div className="divider-glow" />
          <GeneralSettings />
          <div className="divider-glow" />
          <PrivacySettings setLoggedIn={props.setLoggedIn} />
        </div>
      </div>
    </div>
  )
}

function SettingsContainer(props: { func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void }) {
  useLanguage();
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={1}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0.1}
      disappearDuration={0.5}
      onDisappearanceComplete={() => props.func && props.func(false)}
    >
        <AnimatedContent
          distance={50}
          direction="vertical"
          reverse={false}
          duration={1}
          ease="power3.out"
          initialOpacity={1}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={.1}
        >
          <Settings func={setVisible} setLoggedIn={props.setLoggedIn} />
        </AnimatedContent>
    </AnimatedContent>
  )
}

export default SettingsContainer
