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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Change Username</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-username" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              New Username
            </label>
            <Input
              id="new-username"
              type="text"
              required
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder="your.new.username"
              className="w-full"
            />
          </div>
          {usernameError && <p className="text-red-300/80 text-sm">{usernameError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Saving…' : 'Update Username'}
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Change Password</h3>
          <CloseButton onClick={closeModal} />
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="current-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              Current Password
            </label>
            <Input
              id="current-password"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="Enter current password"
              className="w-full"
              aria-invalid={Boolean(fieldErrors.oldPassword)}
            />
            {fieldErrors.oldPassword && <p className="text-red-300/80 text-xs">{fieldErrors.oldPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              className="w-full"
              aria-invalid={Boolean(fieldErrors.newPassword)}
            />
            {fieldErrors.newPassword && <p className="text-red-300/80 text-xs">{fieldErrors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="repeat-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              Repeat New Password
            </label>
            <Input
              id="repeat-password"
              type="password"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              placeholder="Repeat new password"
              className="w-full"
              aria-invalid={Boolean(fieldErrors.repeatPassword)}
            />
            {fieldErrors.repeatPassword && <p className="text-red-300/80 text-xs">{fieldErrors.repeatPassword}</p>}
          </div>
          {passwordError && <p className="text-red-300/80 text-sm">{passwordError}</p>}
          {success && <p className="text-green-300/80 text-sm">Password updated!</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Saving…' : 'Update Password'}
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Change Email</h3>
          <CloseButton onClick={closeModal} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-email" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              New Email Address
            </label>
            <Input
              id="new-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full"
            />
          </div>
          {emailError && <p className="text-red-300/80 text-sm">{emailError}</p>}
          {success && <p className="text-green-300/80 text-sm">Email updated!</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Saving…' : 'Update Email'}
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Change Profile Picture</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover avatar-ring" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300/40 text-xs">
                No image
              </div>
            )}
            <label className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">
              {file ? 'Choose different image' : 'Choose image'}
              <input
                type="file"
                accept={ALLOWED_AVATAR_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-indigo-300/40">JPG, PNG, or WebP — max 5MB.</p>
          </div>
          {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !file} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Uploading…' : 'Upload'}
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Enable Two-Factor Auth</h3>
          <CloseButton onClick={props.onClose} />
        </div>

        {loading && <p className="text-indigo-300/60 text-sm py-4 text-center">Generating secret…</p>}

        {!loading && qrUri && (
          <>
            <p className="text-indigo-300/60 text-xs leading-relaxed mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password…), then enter the 6-digit code below to confirm.
            </p>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={qrUri} size={180} level="M" />
              </div>
            </div>

            {secret && (
              <div className="space-y-1.5 mb-4">
                <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Or enter this secret manually</p>
                <div className="settings-row settings-row-box">
                  <span className="text-indigo-100 text-xs font-mono break-all">{secret}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(secret).catch(() => {})}
                    className="glass glass-hover rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="totp-code" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
                  Verification Code
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
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
                  {submitting ? 'Verifying…' : 'Enable 2FA'}
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
                Close
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
          <h3 className="text-lg font-semibold text-red-300/90 tracking-wide">Delete Account</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <p className="text-indigo-300/50 text-sm pb-4 font-light leading-relaxed">
          This will permanently delete your account and all your projects. This action cannot be undone.
        </p>
        {error && <p className="text-red-300/80 text-sm pb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={submitting} className="rounded-lg px-4 py-1.5 text-sm font-medium bg-red-500/20 border border-red-500/40 hover:bg-red-500/35 text-red-200 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
            {submitting ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Settings ─────────────────────────────────────────────────────────

function AccountSettings(props: { setLoggedIn?: (value: boolean) => void }) {
  const [username, setUsername] = useState<string>('…');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.username) setUsername(data.username); })
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
    clearAuthCookies();
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  const handleDeleted = () => {
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  return (
    <>
      <SettingsSection title="Account" description="Manage your credentials and security preferences.">
        <div className="space-y-4">

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Profile Picture</p>
            <div className="settings-row settings-row-box">
              <div className="flex items-center gap-3 min-w-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover avatar-ring shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 shrink-0" />
                )}
                <span className="text-indigo-300/40 text-xs truncate">JPG, PNG or WebP, max 5MB.</span>
              </div>
              <button type="button" onClick={() => setIsAvatarModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                Change
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Username</p>
            <div className="settings-row settings-row-box">
              <span className="text-indigo-100 text-sm">{username}</span>
              <button type="button" onClick={() => setIsUsernameModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                Change
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Password</p>
            <div className="settings-row settings-row-box">
              <span className="text-indigo-100 text-sm tracking-widest">••••••••</span>
              <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                Change
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Email</p>
            <div className="settings-row settings-row-box">
              <span className="text-indigo-300/40 text-xs">Update the email linked to your account.</span>
              <button type="button" onClick={() => setIsEmailModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                Change
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-indigo-300/50 tracking-wide uppercase">Two-Factor Auth</p>
            <div className="settings-row settings-row-box">
              <span className={`text-xs ${twoFactorEnabled ? 'text-green-300/80' : 'text-indigo-300/40'}`}>
                {twoFactorEnabled === null ? '…' : twoFactorEnabled ? 'Enabled' : 'Disabled — protect your account with a TOTP app.'}
              </span>
              {!twoFactorEnabled && (
                <button type="button" onClick={() => setIsTwoFactorModalOpen(true)} className="glass glass-hover glow-indigo rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
                  Enable
                </button>
              )}
            </div>
          </div>

          <div className="divider-glow my-2" />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="rounded-lg px-4 py-1.5 text-xs font-medium bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300/80 hover:text-red-200 tracking-wide duration-200 ease-out cursor-pointer">
              Delete Account
            </button>
            <button type="button" onClick={handleLogout} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              Sign Out
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
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  )
}

function GeneralSettings() {
  return (
    <SettingsSection title="General" description="Control the default app behavior and appearance.">
      <div className="settings-row-box text-indigo-300/40 text-sm font-light">Coming soon…</div>
    </SettingsSection>
  )
}

function PrivacySettings() {
  return (
    <SettingsSection title="Privacy" description="Choose how your data and activity are shared.">
      <div className="settings-row-box text-indigo-300/40 text-sm font-light">Coming soon…</div>
    </SettingsSection>
  )
}

function Settings(props: { personal?: boolean; func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void }) {
  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[60rem] mx-3 sm:mx-auto">
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">Settings</h1>
        <CloseButton onClick={() => props.func && props.func(false)} />
      </div>
      <div className="mx-3 sm:mx-4 mb-4 mt-2 rounded-xl border border-white/6 bg-white/2 p-4 sm:p-5 md:p-6">
        <div className="space-y-6">
          <AccountSettings setLoggedIn={props.setLoggedIn} />
          <div className="divider-glow" />
          <GeneralSettings />
          <div className="divider-glow" />
          <PrivacySettings />
        </div>
      </div>
    </div>
  )
}

function SettingsContainer(props: { func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void }) {
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
