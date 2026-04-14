import { useEffect, useRef, useState } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { Projects } from "./Projects";
import { authFetch } from "./api";
import { CloseButton } from "./Reusables";
import logger from './logger';

type UserInfo = {
  id: number;
  username: string;
};

type UserProfile = {
  display_name: string;
  bio: string;
  avatar: string | null;
};

const FALLBACK_AVATAR = "https://picsum.photos/600/600";

function Profile(props: { func: (value: boolean) => void; set: (value: boolean) => void }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [meResp, profileResp] = await Promise.all([
          authFetch('/api/users/me/'),
          authFetch('/api/users/profile/me/'),
        ]);

        if (!meResp.ok || !profileResp.ok) {
          throw new Error('Failed to load profile.');
        }

        const [me, prof] = await Promise.all([
          meResp.json() as Promise<UserInfo>,
          profileResp.json() as Promise<UserProfile>,
        ]);

        logger.action('profile.view', { username: me.username });
        setUserInfo(me);
        setProfile(prof);
      } catch (err) {
        logger.error('profile.load_error');
        setError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const displayName = profile?.display_name || userInfo?.username || '—';
  const username = userInfo?.username ?? '—';
  const bio = profile?.bio || '';
  const avatarSrc = profile?.avatar ?? FALLBACK_AVATAR;

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 max-w-200 mx-auto">
      {/* Header row: close + settings */}
      <div className="flex items-center justify-between px-4 pt-4">
        <CloseButton onClick={() => { props.set(false); props.func(false); }} />
        <button type="button" aria-label="Settings"
          onClick={() => { logger.action('profile.open_settings'); props.func(false); props.set(true); }}
          className="btn-close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="px-6 py-8 text-indigo-300/50 text-sm text-center font-light">Loading profile…</div>
      )}

      {!loading && error && (
        <div className="px-6 pb-4 text-red-300/80 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="px-6 py-5">
          <div className="flex items-center gap-5">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover avatar-ring"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white leading-tight truncate">{displayName}</h2>
              <p className="text-sm text-indigo-300/60 mt-0.5">@{username}</p>
            </div>
          </div>
          {bio && (
            <p className="mt-4 text-indigo-100/80 text-sm leading-relaxed">{bio}</p>
          )}
        </div>
      )}

      <div className="divider-glow mx-4" />

      <Projects user={userInfo?.username} />
    </div>
  )
}

function ProfileContainer(props: { func: (value: boolean) => void; set: (value: boolean) => void }) {
  const [visible, setVisible] = useState(true);
  const openSettingsOnCloseRef = useRef(false);

  const handleClose = () => {
    openSettingsOnCloseRef.current = false;
    setVisible(false);
  };

  const handleOpenSettings = () => {
    openSettingsOnCloseRef.current = true;
    setVisible(false);
  };

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
      disappearDuration={0.25}
      onDisappearanceComplete={() => {
        props.set(openSettingsOnCloseRef.current);
        props.func(false);
        openSettingsOnCloseRef.current = false;
      }}
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
          <Profile func={handleClose} set={handleOpenSettings}/>
        </AnimatedContent>
    </AnimatedContent>
  )
}

export default ProfileContainer
