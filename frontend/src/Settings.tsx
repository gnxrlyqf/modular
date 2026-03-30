import { AnimatedContent } from './ReactBits/ReactBits';
import React, { useState } from "react";

function SettingsSection(props: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-3xl text-white font-medium">{props.title}</h2>
      <p className="text-xl text-indigo-100 pt-1 pb-2">{props.description}</p>
      <div className="space-y-3 text-indigo-50">{props.children}</div>
    </section>
  )
}

function UsernameUpdateModal(props: { onClose: () => void }) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const handleUsernameSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsernameError("");

    try {
      const response = await fetch('/api/users/change-username/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: newUsername,
          password: currentPasswordForUsername,
        }),
      });

      if (!response.ok) {
        let message = 'Failed to update username.';
        try {
          const data = await response.json();
          if (typeof data?.detail === 'string' && data.detail.trim()) {
            message = data.detail;
          }
        } catch {
          // Keep fallback message when response body is not JSON.
        }
        throw new Error(message);
      }

      props.onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update username.';
      setUsernameError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-indigo-950/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-indigo-500/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-2xl text-indigo-50">Change Username</h3>
          <button
            type="button"
            onClick={() => props.onClose()}
            className="rounded-md px-2 py-1 text-indigo-100 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-username" className="block text-sm text-indigo-50">
              New Username
            </label>
            <input
              id="new-username"
              type="text"
              required
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
              placeholder="your.new.username"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="current-password-username" className="block text-sm text-indigo-50">
              Current Password
            </label>
            <input
              id="current-password-username"
              type="password"
              required
              value={currentPasswordForUsername}
              onChange={(event) => setCurrentPasswordForUsername(event.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
              placeholder="Enter current password"
            />
          </div>
          {usernameError && <p className="text-red-200 text-sm">{usernameError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => props.onClose()}
              className="cursor-pointer rounded-md bg-white/15 px-4 py-2 text-sm text-indigo-50 hover:bg-white/25"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-indigo-200 px-4 py-2 text-sm text-indigo-900 hover:bg-indigo-100"
            >
              Update Username
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordUpdateModal(props: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");

  if (!props.isOpen) return null;

  const closeModal = () => {
    setNewPassword("");
    setCurrentPasswordForPassword("");
    props.onClose();
  };

  const handlePasswordSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-indigo-950/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-indigo-500/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-2xl text-indigo-50">Change Password</h3>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md px-2 py-1 text-indigo-100 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm text-indigo-50">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="current-password-password" className="block text-sm text-indigo-50">
              Current Password
            </label>
            <input
              id="current-password-password"
              type="password"
              required
              value={currentPasswordForPassword}
              onChange={(event) => setCurrentPasswordForPassword(event.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
              placeholder="Enter current password"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="cursor-pointer rounded-md bg-white/15 px-4 py-2 text-sm text-indigo-50 hover:bg-white/25"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-indigo-200 px-4 py-2 text-sm text-indigo-900 hover:bg-indigo-100"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountSettings(props: {setLoggedIn?: (value: boolean) => void}) {
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `accessToken=; Max-Age=0; Path=/; SameSite=Lax${secureFlag}`;
    document.cookie = `refreshToken=; Max-Age=0; Path=/; SameSite=Lax${secureFlag}`;
    document.cookie = `authToken=; Max-Age=0; Path=/; SameSite=Lax${secureFlag}`;
    props.setLoggedIn?.(false);
    window.location.reload();
  };

  return (
    <>
      <SettingsSection
        title="Account"
        description="Manage account and security preferences."
      >
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-5">
          <div className="space-y-2">
            <p className="block text-indigo-50 text-sm">Username</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-white/30 bg-white/10 px-3 py-2">
              <span className="text-indigo-100">lhrbation</span>
              <button
                type="button"
                onClick={() => setIsUsernameModalOpen(true)}
                className="cursor-pointer rounded-md bg-white/20 px-3 py-1.5 text-sm text-indigo-50 hover:bg-white/30"
              >
                Change Username
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="block text-indigo-50 text-sm">Password</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-white/30 bg-white/10 px-3 py-2">
              <span className="text-indigo-100">••••••••</span>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="cursor-pointer rounded-md bg-white/20 px-3 py-1.5 text-sm text-indigo-50 hover:bg-white/30"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label htmlFor="account-oauth" className="block text-indigo-50 text-sm">
              OAuth Connections
            </label>
            <input
              id="account-oauth"
              type="text"
              value="Google, GitHub"
              readOnly
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-100 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="cursor-pointer rounded-md bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 text-sm transition-colors"
            >
              Delete Account
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md bg-white/20 hover:bg-white/30 text-indigo-50 px-4 py-2 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </SettingsSection>

      {isUsernameModalOpen && <UsernameUpdateModal onClose={() => setIsUsernameModalOpen(false)} />}

      <PasswordUpdateModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  )
}

function GeneralSettings() {
  return (
    <SettingsSection
      title="General"
      description="Control the default app behavior and appearance."
    >
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">General content placeholder</div>
    </SettingsSection>
  )
}

function PrivacySettings() {
  return (
    <SettingsSection
      title="Privacy"
      description="Choose how your data and activity are shared."
    >
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">Privacy content placeholder</div>
    </SettingsSection>
  )
}

function Settings(props: {personal?: boolean; func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void}) {
  return (
    <div className="font-lexend backdrop-blur bg-indigo-400/50 rounded-2xl z-50 max-w-200 mx-auto">
      <button onClick={() => props.func && props.func(false)} className="m-3">
        <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
      </button>
      <p className="text-center text-4xl pb-5 text-indigo-100">
        Settings
      </p>
      <div className="m-3 rounded-xl border border-white/20 bg-white/5 p-4 md:p-6">
        <div className="space-y-6">
          <AccountSettings setLoggedIn={props.setLoggedIn} />

          <div className="border-t border-white/20" />

          <GeneralSettings />

          <div className="border-t border-white/20" />

          <PrivacySettings />
        </div>
      </div>
    </div>
  )
}

function SettingsContainer(props: {func?: (value: boolean) => void; setLoggedIn?: (value: boolean) => void}) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={0}
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
          initialOpacity={0}
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