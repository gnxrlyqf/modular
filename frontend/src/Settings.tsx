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
import OverlayShell from './OverlayShell';
import { AvatarRing, StatusPill, Toggle, PillButton } from './OverlayParts';

import defaultProfileImg from './assets/default_profile.png';
const FALLBACK_AVATAR = defaultProfileImg;

// ─── Username Modal ───────────────────────────────────────────────────────────

function UsernameUpdateModal(props: { onClose: () => void; onSuccess: (newUsername: string) => void }) {
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validateUsername(newUsername);
    if (v) { setUsernameError(v); return; }
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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_username_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-username" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.new_username')}</label>
            <Input id="new-username" type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder={t('placeholder.username')} className="w-full" />
          </div>
          {usernameError && <p className="text-red-300/80 text-sm">{usernameError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('common.saving') : t('settings.update_username')}</button>
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
    setOldPassword(''); setNewPassword(''); setRepeatPassword('');
    setPasswordError(''); setFieldErrors({}); setSuccess(false);
    props.onClose();
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errs = validateChangePasswordForm({ oldPassword, newPassword, repeatPassword });
    setFieldErrors(errs);
    if (hasErrors(errs)) { setPasswordError(''); return; }
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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_password_title')}</h3>
          <CloseButton onClick={closeModal} />
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="current-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.current_password')}</label>
            <Input id="current-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={t('placeholder.current_password')} className="w-full" aria-invalid={Boolean(fieldErrors.oldPassword)} />
            {fieldErrors.oldPassword && <p className="text-red-300/80 text-xs">{fieldErrors.oldPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.new_password')}</label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('placeholder.new_password')} className="w-full" aria-invalid={Boolean(fieldErrors.newPassword)} />
            {fieldErrors.newPassword && <p className="text-red-300/80 text-xs">{fieldErrors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="repeat-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.repeat_password')}</label>
            <Input id="repeat-password" type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} placeholder={t('placeholder.repeat_password')} className="w-full" aria-invalid={Boolean(fieldErrors.repeatPassword)} />
            {fieldErrors.repeatPassword && <p className="text-red-300/80 text-xs">{fieldErrors.repeatPassword}</p>}
          </div>
          {passwordError && <p className="text-red-300/80 text-sm">{passwordError}</p>}
          {success && <p className="text-green-300/80 text-sm">{t('settings.password_updated')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('common.saving') : t('settings.update_password')}</button>
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

  const closeModal = () => { setEmail(''); setEmailError(''); setSuccess(false); props.onClose(); };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validateEmail(email);
    if (v) { setEmailError(v); return; }
    setEmailError('');
    setSubmitting(true);
    try {
      const response = await authFetch('/api/users/change-email/', { method: 'PUT', body: JSON.stringify({ email }) });
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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.change_email_title')}</h3>
          <CloseButton onClick={closeModal} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-email" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.new_email_label')}</label>
            <Input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('placeholder.email')} className="w-full" />
          </div>
          {emailError && <p className="text-red-300/80 text-sm">{emailError}</p>}
          {success && <p className="text-green-300/80 text-sm">{t('settings.email_updated')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('common.saving') : t('settings.update_email')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Avatar Upload Modal ──────────────────────────────────────────────────────

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

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
    if (!ALLOWED_AVATAR_TYPES.includes(f.type)) { setError('Image type must be JPG, PNG, or WebP.'); setFile(null); return; }
    if (f.size > MAX_AVATAR_SIZE) { setError('Image must be smaller than 5MB.'); setFile(null); return; }
    setFile(f);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) { setError('Pick an image first.'); return; }
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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
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
              <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300/40 text-xs">{t('settings.avatar_no_image')}</div>
            )}
            <label className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">
              {file ? t('settings.avatar_choose_different') : t('settings.avatar_choose')}
              <input type="file" accept={ALLOWED_AVATAR_TYPES.join(',')} onChange={handleFileChange} className="hidden" />
            </label>
            <p className="text-xs text-indigo-300/40">{t('settings.avatar_hint')}</p>
          </div>
          {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting || !file} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('settings.avatar_uploading') : t('settings.avatar_upload')}</button>
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
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError('');
    try {
      const response = await authFetch('/api/users/2fa/verify/', { method: 'POST', body: JSON.stringify({ code }) });
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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('settings.2fa_enable_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        {loading && <p className="text-indigo-300/60 text-sm py-4 text-center">{t('settings.2fa_generating')}</p>}
        {!loading && qrUri && (
          <>
            <p className="text-indigo-300/60 text-xs leading-relaxed mb-4">{t('settings.2fa_scan_desc')}</p>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-lg"><QRCodeSVG value={qrUri} size={180} level="M" /></div>
            </div>
            {secret && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.2fa_manual_secret')}</p>
                <div className="settings-row settings-row-box">
                  <span className="text-indigo-100 text-xs font-mono break-all">{secret}</span>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(secret).catch(() => {})} className="glass glass-hover rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('settings.2fa_copy')}</button>
                </div>
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="totp-code" className="block text-xs text-indigo-300/50 tracking-wide uppercase">{t('settings.2fa_verification_code')}</label>
                <Input id="totp-code" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" autoFocus className="w-full text-center tracking-[0.4em]" />
              </div>
              {error && <p className="text-red-300/80 text-sm">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.cancel')}</button>
                <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('auth.verifying') : t('settings.2fa_enable_submit')}</button>
              </div>
            </form>
          </>
        )}
        {!loading && !qrUri && error && (
          <div className="space-y-3">
            <p className="text-red-300/80 text-sm">{error}</p>
            <div className="flex justify-end">
              <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.close')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────

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
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-card max-w-md font-lexend">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-semibold text-red-300/90 tracking-wide">{t('settings.delete_account_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <p className="text-indigo-300/50 text-sm pb-4 font-light leading-relaxed">{t('settings.delete_account_desc')}</p>
        {error && <p className="text-red-300/80 text-sm pb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">{t('common.cancel')}</button>
          <button type="button" onClick={handleDelete} disabled={submitting} className="rounded-lg px-4 py-1.5 text-sm font-medium bg-red-500/20 border border-red-500/40 hover:bg-red-500/35 text-red-200 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">{submitting ? t('settings.deleting') : t('settings.delete_my_account')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pencil icon ──────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ─── Account pane ─────────────────────────────────────────────────────────────

function AccountPane(props: { setLoggedIn?: (value: boolean) => void }) {
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
    authFetch('/api/users/me/').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.username) setUsername(data.username);
      if (data?.email) setUserEmail(data.email);
      if (typeof data?.is_verified === 'boolean') setIsVerified(data.is_verified);
    }).catch(() => {});
    authFetch('/api/users/profile/me/').then(r => r.ok ? r.json() : null).then(data => {
      if (data && typeof data.two_factor_enabled === 'boolean') setTwoFactorEnabled(data.two_factor_enabled);
      if (data && typeof data.avatar === 'string') setAvatar(data.avatar);
    }).catch(() => {});
  }, []);

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      const r = await authFetch('/api/users/resend-verification/', { method: 'POST' });
      setResendStatus(r.ok ? 'sent' : 'error');
    } catch { setResendStatus('error'); }
  };

  const handleLogout = async () => {
    logger.action('auth.logout');
    const refresh = getCookie(REFRESH_COOKIE);
    if (refresh) {
      try { await authFetch('/api/users/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }); } catch { /* proceed */ }
    }
    clearLocalPrefs();
    clearAuthCookies();
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  const avatarSrc = avatar || FALLBACK_AVATAR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0 4px' }}>
        <AvatarRing src={avatarSrc} alt={username} size={80} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)', letterSpacing: '-0.015em', marginBlockEnd: 4 }}>{username}</div>
          <PillButton variant="solid" onClick={() => setIsAvatarModalOpen(true)}>
            {t('overlays.settings.avatar.upload')}
          </PillButton>
        </div>
      </div>

      {/* Field rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Username */}
        <div className="field-row">
          <span className="field-label">{t('overlays.settings.field.username')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{username}</span>
            <StatusPill color="var(--success)" text={t('overlays.settings.field.username.status')} />
          </div>
          <button type="button" className="field-edit-btn" onClick={() => setIsUsernameModalOpen(true)} aria-label={t('common.change')}>
            <PencilIcon />
          </button>
        </div>

        {/* Password */}
        <div className="field-row">
          <span className="field-label">{t('overlays.settings.field.password')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="field-value" style={{ letterSpacing: '0.3em' }}>••••••••</span>
            <StatusPill color="var(--accent-2)" text={t('overlays.settings.field.password.status')} />
          </div>
          <button type="button" className="field-edit-btn" onClick={() => setIsPasswordModalOpen(true)} aria-label={t('common.change')}>
            <PencilIcon />
          </button>
        </div>

        {/* Email */}
        <div className="field-row" style={{ alignItems: 'flex-start' }}>
          <span className="field-label" style={{ paddingBlockStart: 2 }}>{t('overlays.settings.field.email')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{userEmail || '…'}</span>
              {isVerified !== false ? (
                <StatusPill color="var(--success)" text={t('overlays.settings.field.email.status')} />
              ) : (
                <StatusPill color="var(--warning)" text={t('overlays.settings.field.email.unverified')} />
              )}
            </div>
            {isVerified === false && (
              <button type="button" onClick={handleResendVerification} disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warning)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', opacity: resendStatus === 'sending' || resendStatus === 'sent' ? 0.5 : 1 }}>
                {resendStatus === 'sending' ? t('settings.resend_sending') : resendStatus === 'sent' ? t('settings.resend_sent') : resendStatus === 'error' ? t('settings.resend_failed') : t('settings.resend_verification')}
              </button>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>{t('overlays.settings.field.email.hint')}</span>
          </div>
          <button type="button" className="field-edit-btn" style={{ marginBlockStart: 2 }} onClick={() => setIsEmailModalOpen(true)} aria-label={t('common.change')}>
            <PencilIcon />
          </button>
        </div>

        {/* 2FA */}
        <div className="field-row">
          <span className="field-label">{t('overlays.settings.field.2fa')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {twoFactorEnabled !== null && (
              <StatusPill
                color={twoFactorEnabled ? 'var(--success)' : 'var(--sub)'}
                text={twoFactorEnabled ? t('settings.two_factor.enabled') : t('settings.two_factor.disabled').split(' ')[0]}
              />
            )}
          </div>
          {!twoFactorEnabled && (
            <button type="button" className="field-edit-btn" style={{ opacity: 1, color: 'var(--accent)' }} onClick={() => setIsTwoFactorModalOpen(true)} aria-label={t('common.enable')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </button>
          )}
          {twoFactorEnabled && (
            <Toggle
              checked={true}
              onChange={() => {/* no disable endpoint */}}
              label={t('settings.two_factor')}
              disabled
            />
          )}
        </div>
      </div>

      {/* Sessions callout */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid var(--panel-edge-bright)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', marginBlockEnd: 2 }}>{t('overlays.settings.sessions.title')}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', letterSpacing: '0.05em' }}>{t('overlays.settings.sessions.desc')}</div>
        </div>
        <StatusPill color="var(--accent)" text="1 ACTIVE" />
      </div>

      {/* Modals */}
      {isUsernameModalOpen && <UsernameUpdateModal onClose={() => setIsUsernameModalOpen(false)} onSuccess={(u) => setUsername(u)} />}
      <PasswordUpdateModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <EmailUpdateModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
      {isAvatarModalOpen && <AvatarUpdateModal onClose={() => setIsAvatarModalOpen(false)} onSuccess={(url) => setAvatar(url)} />}
      {isTwoFactorModalOpen && <TwoFactorSetupModal onClose={() => setIsTwoFactorModalOpen(false)} onEnabled={() => setTwoFactorEnabled(true)} />}

      {/* Sign out */}
      <div style={{ marginBlockStart: 'auto', paddingBlockStart: 8 }}>
        <PillButton variant="danger" onClick={handleLogout}>{t('overlays.settings.sign_out')}</PillButton>
      </div>
    </div>
  );
}

// ─── Appearance pane ──────────────────────────────────────────────────────────

function AppearancePane() {
  useLanguage();
  const { prefs, updatePrefs } = usePrefs();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Language */}
      <div className="field-row">
        <span className="field-label">{t('settings.language')}</span>
        <select value={prefs.language} onChange={e => updatePrefs({ language: e.target.value })}
          style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--field-bg)', border: '1px solid var(--panel-edge)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', outline: 'none' }}>
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code} style={{ background: 'var(--bg-1)' }}>{l.native} — {l.label}</option>
          ))}
        </select>
        <span />
      </div>

      {/* Theme */}
      <div className="field-row">
        <span className="field-label">{t('settings.theme')}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light'] as const).map(th => (
            <button key={th} type="button" onClick={() => updatePrefs({ theme: th })}
              className={`pill-btn ${prefs.theme === th ? 'pill-btn--solid' : 'pill-btn--outline'}`}
              style={{ fontSize: 11, padding: '4px 12px' }}>
              {th === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}
            </button>
          ))}
        </div>
        <span />
      </div>
    </div>
  );
}

// ─── Audio pane ───────────────────────────────────────────────────────────────

function AudioPane() {
  useLanguage();
  const { prefs, updatePrefs } = usePrefs();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* UI Sounds */}
      <div className="field-row">
        <span className="field-label">{t('settings.sound')}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub)' }}>{prefs.sound ? t('settings.sound_on') : t('settings.sound_off')}</span>
        <Toggle checked={Boolean(prefs.sound)} onChange={(v) => updatePrefs({ sound: v })} label={t('settings.sound')} />
      </div>
    </div>
  );
}

// ─── Privacy pane ─────────────────────────────────────────────────────────────

function PrivacyPane(props: { setLoggedIn?: (value: boolean) => void }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleted = () => {
    clearLocalPrefs();
    clearAuthCookies();
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  return (
    <div>
      <div className="field-row">
        <span className="field-label">{t('settings.delete_account_title')}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>{t('settings.delete_account_desc').slice(0, 40)}…</span>
        <PillButton variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
          {t('auth.delete_account')}
        </PillButton>
      </div>
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDeleted={handleDeleted} />
    </div>
  );
}

// ─── Coming soon pane ─────────────────────────────────────────────────────────

function ComingSoonPane({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
      · {label} · {t('overlays.settings.coming_soon')}
    </div>
  );
}

// ─── Sidebar sections ─────────────────────────────────────────────────────────

type SidebarSection = 'account' | 'audio' | 'appearance' | 'privacy' | 'about';

const SIDEBAR_ITEMS: Array<{ id: SidebarSection; labelKey: string; hintKey: string }> = [
  { id: 'account',    labelKey: 'overlays.settings.sidebar.account',    hintKey: 'overlays.settings.sidebar.account.hint' },
  { id: 'audio',      labelKey: 'overlays.settings.sidebar.audio',      hintKey: 'overlays.settings.sidebar.audio.hint' },
  { id: 'appearance', labelKey: 'overlays.settings.sidebar.appearance', hintKey: 'overlays.settings.sidebar.appearance.hint' },
  { id: 'privacy',    labelKey: 'overlays.settings.sidebar.privacy',    hintKey: 'overlays.settings.sidebar.privacy.hint' },
  { id: 'about',      labelKey: 'overlays.settings.sidebar.about',      hintKey: 'overlays.settings.sidebar.about.hint' },
];

// ─── Settings (redesigned) ────────────────────────────────────────────────────

function Settings(props: { onClose: () => void; setLoggedIn?: (value: boolean) => void }) {
  useLanguage();
  const [section, setSection] = useState<SidebarSection>('account');

  const headerRight = (
    <span className="status-pill" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--accent)', border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {t('overlays.settings.status.saved')} · just now
    </span>
  );

  return (
    <OverlayShell
      kicker={t('overlays.settings.kicker')}
      title={t('settings.title')}
      headerRight={headerRight}
      width={1020}
      maxHeight="90vh"
      onClose={props.onClose}
    >
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, borderInlineEnd: '1px solid var(--panel-edge)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 500 }}>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${section === item.id ? 'active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <div className="sidebar-label" style={{ color: section === item.id ? 'var(--text)' : undefined }}>{t(item.labelKey as Parameters<typeof t>[0])}</div>
              <div className="sidebar-hint">{t(item.hintKey as Parameters<typeof t>[0])}</div>
            </button>
          ))}

          {/* Sign out at bottom */}
          <div style={{ marginBlockStart: 'auto', paddingBlockStart: 12 }}>
            <div style={{ height: 1, background: 'var(--panel-edge)', marginBlockEnd: 12 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', minWidth: 0 }}>
          {section === 'account'    && <AccountPane setLoggedIn={props.setLoggedIn} />}
          {section === 'audio'      && <AudioPane />}
          {section === 'appearance' && <AppearancePane />}
          {section === 'privacy'    && <PrivacyPane setLoggedIn={props.setLoggedIn} />}
          {section === 'about'      && <ComingSoonPane label={t('overlays.settings.sidebar.about')} />}
        </div>
      </div>
    </OverlayShell>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function SettingsContainer(props: { func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void }) {
  useLanguage();

  const handleClose = () => props.func?.(false);

  return <Settings onClose={handleClose} setLoggedIn={props.setLoggedIn} />;
}

export default SettingsContainer;
