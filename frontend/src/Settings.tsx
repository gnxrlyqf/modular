import { AnimatedContent } from './ReactBits/ReactBits';
import React, { useEffect, useState } from "react";
import { authFetch, clearAuthCookies, getCookie, extractErrorMessage, REFRESH_COOKIE } from './api';
import { Input, CloseButton } from './Reusables';
import logger from './logger';

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
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!props.isOpen) return null;

  const closeModal = () => {
    setOldPassword('');
    setNewPassword('');
    setPasswordError('');
    setSuccess(false);
    props.onClose();
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
              required
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="Enter current password"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-xs text-indigo-300/50 tracking-wide uppercase">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              className="w-full"
            />
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
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.username) setUsername(data.username); })
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
    <div className="font-lexend overlay-panel rounded-2xl z-50 max-w-200 mx-auto">
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">Settings</h1>
        <CloseButton onClick={() => props.func && props.func(false)} />
      </div>
      <div className="mx-4 mb-4 mt-2 rounded-xl border border-white/6 bg-white/2 p-5 md:p-6">
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
