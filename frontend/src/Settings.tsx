import { AnimatedContent } from './ReactBits/ReactBits';
import React, { useEffect, useRef, useState } from "react";

type SettingKey = "profile" | "account" | "general" | "privacy";

type ProfilePlaceholderData = {
  username: string;
  profilePictureUrl: string;
};

async function fetchProfilePlaceholders(): Promise<ProfilePlaceholderData> {
  // Replace with your real API call.
  return {
    username: "maria.codes",
    profilePictureUrl: "https://picsum.photos/seed/project1/600/600",
  };
}

function SettingButton(props: {
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`group w-full p-2 py-3 text-xl rounded-md ease-in-out duration-100 cursor-pointer text-left ${
        props.active
          ? "text-indigo-100"
          : "hover:bg-white/30 text-indigo-100"
      }`}
    >
      <div
        className={`flex flex-row gap-2 ease-in-out duration-100 group-hover:translate-x-2 ${
          props.active ? "translate-x-2" : ""
        }`}
      >
        {props.children}
      </div>
    </button>
  )
}

function AbstractSettingPanel(props: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-70">
      <h2 className="text-3xl text-white font-medium">{props.title}</h2>
      <p className="text-xl text-indigo-100 pt-1 pb-5">{props.description}</p>
      <div className="space-y-3 text-indigo-50">{props.children}</div>
    </div>
  )
}

function ProfileSettings() {
  const [usernamePlaceholder, setUsernamePlaceholder] = useState("Loading username...");
  const [profilePicturePlaceholder, setProfilePicturePlaceholder] = useState("Loading profile picture...");
  const [profilePictureSrc, setProfilePictureSrc] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPlaceholders = async () => {
      const data = await fetchProfilePlaceholders();
      if (!mounted) return;
      setUsernamePlaceholder(data.username);
      setProfilePicturePlaceholder(data.profilePictureUrl);
      setProfilePictureSrc(data.profilePictureUrl);
    };

    loadPlaceholders();

    return () => {
      mounted = false;
    };
  }, []);

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const localImageUrl = URL.createObjectURL(selectedFile);
    setProfilePictureSrc(localImageUrl);
  };

  return (
    <AbstractSettingPanel
      title="Profile"
      description="Customize your public profile details."
    >
      <div className="rounded-md border border-white/20 bg-white/5 p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="profile-username" className="block text-indigo-50 text-sm">
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            placeholder={usernamePlaceholder}
            className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-indigo-50 text-sm">
            Profile Picture
          </label>
          <div className="pt-2 flex flex-col items-start gap-2">
            <p className="text-sm text-indigo-100">Click image to change</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <img
                src={profilePictureSrc || profilePicturePlaceholder}
                alt="Current profile"
                className="h-24 w-24 rounded-full object-cover border border-white/30 bg-white/10"
              />
            </button>
            <input
              ref={fileInputRef}
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </AbstractSettingPanel>
  )
}

function CredentialUpdateModal(props: {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-indigo-950/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-indigo-500/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-2xl text-indigo-50">{props.title}</h3>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-md px-2 py-1 text-indigo-100 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <form onSubmit={props.onSubmit} className="space-y-4">
          {props.children}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              className="rounded-md bg-white/15 px-4 py-2 text-sm text-indigo-50 hover:bg-white/25"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-200 px-4 py-2 text-sm text-indigo-900 hover:bg-indigo-100"
            >
              {props.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountSettings() {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsEmailModalOpen(false);
    setNewEmail("");
    setCurrentPasswordForEmail("");
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPasswordModalOpen(false);
    setNewPassword("");
    setCurrentPasswordForPassword("");
  };

  return (
    <>
      <AbstractSettingPanel
        title="Account"
        description="Manage account and security preferences."
      >
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-5">
          <div className="space-y-2">
            <p className="block text-indigo-50 text-sm">Email</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-white/30 bg-white/10 px-3 py-2">
              <span className="text-indigo-100">name@example.com</span>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="rounded-md bg-white/20 px-3 py-1.5 text-sm text-indigo-50 hover:bg-white/30"
              >
                Change Email
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
                className="rounded-md bg-white/20 px-3 py-1.5 text-sm text-indigo-50 hover:bg-white/30"
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
              className="rounded-md bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 text-sm transition-colors"
            >
              Delete Account
            </button>
            <button
              type="button"
              className="rounded-md bg-white/20 hover:bg-white/30 text-indigo-50 px-4 py-2 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </AbstractSettingPanel>

      <CredentialUpdateModal
        isOpen={isEmailModalOpen}
        title="Change Email"
        submitLabel="Update Email"
        onClose={() => {
          setIsEmailModalOpen(false);
          setNewEmail("");
          setCurrentPasswordForEmail("");
        }}
        onSubmit={handleEmailSubmit}
      >
        <div className="space-y-2">
          <label htmlFor="new-email" className="block text-sm text-indigo-50">
            New Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
            placeholder="new.email@example.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="current-password-email" className="block text-sm text-indigo-50">
            Current Password
          </label>
          <input
            id="current-password-email"
            type="password"
            required
            value={currentPasswordForEmail}
            onChange={(event) => setCurrentPasswordForEmail(event.target.value)}
            className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-indigo-50 placeholder:text-indigo-200/70 outline-none focus:border-indigo-200"
            placeholder="Enter current password"
          />
        </div>
      </CredentialUpdateModal>

      <CredentialUpdateModal
        isOpen={isPasswordModalOpen}
        title="Change Password"
        submitLabel="Update Password"
        onClose={() => {
          setIsPasswordModalOpen(false);
          setNewPassword("");
          setCurrentPasswordForPassword("");
        }}
        onSubmit={handlePasswordSubmit}
      >
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
      </CredentialUpdateModal>
    </>
  )
}

function GeneralSettings() {
  return (
    <AbstractSettingPanel
      title="General"
      description="Control the default app behavior and appearance."
    >
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">General content placeholder</div>
    </AbstractSettingPanel>
  )
}

function PrivacySettings() {
  return (
    <AbstractSettingPanel
      title="Privacy"
      description="Choose how your data and activity are shared."
    >
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">Privacy content placeholder</div>
    </AbstractSettingPanel>
  )
}

function Settings(props: {personal?: boolean; func?: (value: boolean) => void}) {
  const [selectedSetting, setSelectedSetting] = useState<SettingKey>("profile");
  const user = "M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"

  const settingPanels: Record<SettingKey, React.ReactNode> = {
    profile: <ProfileSettings />,
    account: <AccountSettings />,
    general: <GeneralSettings />,
    privacy: <PrivacySettings />,
  };

  return (
    <div className="font-lexend backdrop-blur bg-indigo-400/50 rounded-2xl z-50 max-w-200 mx-auto">
      <button onClick={() => props.func && props.func(false)} className="m-3">
        <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
      </button>
      <p className="text-center text-4xl pb-5 text-indigo-100">
        Settings
      </p>
      <div className='border-2 border-indigo-100 rounded-2xl mx-50'></div>
      <div className='flex flex-col md:flex-row m-3 gap-4'>
        <div className="rounded-lg text-indigo-100 md:w-50 font-lexend p-3 flex flex-col gap-1">
          <SettingButton
            active={selectedSetting === "profile"}
            onClick={() => setSelectedSetting("profile")}
          >
            <svg width="20" viewBox="2 2 20 20" fill="none">
              <path d={user} stroke="currentColor" strokeWidth={2}/>
            </svg>Profile
          </SettingButton>
          <SettingButton
            active={selectedSetting === "account"}
            onClick={() => setSelectedSetting("account")}
          >
            Account
          </SettingButton>
          <SettingButton
            active={selectedSetting === "general"}
            onClick={() => setSelectedSetting("general")}
          >
            General
          </SettingButton>
          <SettingButton
            active={selectedSetting === "privacy"}
            onClick={() => setSelectedSetting("privacy")}
          >
            Privacy
          </SettingButton>
        </div>

        <div className="flex-1 p-3">
          {settingPanels[selectedSetting]}
        </div>
      </div>
    </div>
  )
}

function SettingsContainer(props: {func?: (value: boolean) => void}) {
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
          <Settings func={setVisible}/>
        </AnimatedContent>        
    </AnimatedContent>
  )
}

export default SettingsContainer