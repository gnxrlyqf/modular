import { useEffect, useRef, useState } from "react";
import { Projects } from "./Projects";
import { authFetch, clearAuthCookies, getCookie, REFRESH_COOKIE } from "./api";
import { clearLocalPrefs } from './Prefs';
import logger from './logger';
import { t, useLanguage } from './i18n';
import OverlayShell from './OverlayShell';
import { AvatarRing, PillButton } from './OverlayParts';

type ProfileContainerProps = {
  func: (value: boolean) => void;
  set: (value: boolean) => void;
  setLoggedIn?: (value: boolean) => void;
  onOpenDashboard?: () => void;
};

type UserInfo = {
  id: number;
  username: string;
};

type UserProfile = {
  display_name: string;
  bio: string;
  avatar: string | null;
};

import defaultProfileImg from './assets/default_profile.png';
const FALLBACK_AVATAR = defaultProfileImg;

// ─── Settings gear icon ───────────────────────────────────────────────────────

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z" />
      <path d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

// ─── Profile inner component ──────────────────────────────────────────────────

function Profile(props: {
  onClose: () => void;
  onOpenSettings: () => void;
  setLoggedIn?: (value: boolean) => void;
  onOpenDashboard?: () => void;
}) {
  useLanguage();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);

  const handleOpenDashboard = () => {
    logger.action('profile.open_dashboard');
    if (props.onOpenDashboard) {
      props.onOpenDashboard();
      props.onClose();
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logger.action('auth.logout');
    const refresh = getCookie(REFRESH_COOKIE);
    if (refresh) {
      try {
        await authFetch('/api/users/logout/', { method: 'POST', body: JSON.stringify({ refresh }) });
      } catch { /* proceed */ }
    }
    clearLocalPrefs();
    clearAuthCookies();
    props.setLoggedIn?.(false);
    props.onClose();
    window.location.reload();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [meResp, profileResp, projectsResp] = await Promise.all([
          authFetch('/api/users/me/'),
          authFetch('/api/users/profile/me/'),
          authFetch('/api/search/?page=1'),
        ]);
        if (!meResp.ok || !profileResp.ok) throw new Error('Failed to load profile.');
        const [me, prof] = await Promise.all([
          meResp.json() as Promise<UserInfo>,
          profileResp.json() as Promise<UserProfile>,
        ]);
        if (projectsResp.ok) {
          const pd = await projectsResp.json();
          setProjectCount(typeof pd.count === 'number' ? pd.count : null);
        }
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

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <PillButton variant="outline" onClick={handleOpenDashboard} aria-label={t('profile.dashboard')}>
        <GridIcon /> {t('profile.dashboard')}
      </PillButton>
      <PillButton variant="icon" onClick={props.onOpenSettings} aria-label="Settings">
        <GearIcon />
      </PillButton>
    </div>
  );

  const customTitle = (
    <span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>{displayName} </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--sub)', letterSpacing: '0.05em' }}>@{username}</span>
    </span>
  );

  return (
    <OverlayShell
      kicker={t('overlays.profile.kicker')}
      title={customTitle}
      headerRight={headerRight}
      width={1080}
      maxHeight="92vh"
      onClose={props.onClose}
    >
      {loading && (
        <div style={{ padding: '32px 28px', color: 'var(--sub)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
          {t('profile.loading')}
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '16px 28px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* ── Identity strip ── */}
          <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid var(--panel-edge)' }}>
            <AvatarRing src={avatarSrc} alt={displayName} size={64} />

            {/* Meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--sub)', marginBlockEnd: 4 }}>
                {t('overlays.profile.member_since')} May 2026
              </div>
              {bio && (
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                  "{bio}"
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ paddingInline: 20, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--text)', lineHeight: 1.1 }}>
                {projectCount ?? '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBlockStart: 2 }}>
                {t('overlays.profile.stats.projects')}
              </div>
            </div>
          </div>

          {/* ── Patches section ── */}
          <div style={{ padding: '0 28px 28px' }}>
            <Projects user={userInfo?.username} />
          </div>

          {/* Sign out */}
          <div style={{ padding: '12px 28px 20px', borderTop: '1px solid var(--panel-edge)', display: 'flex', justifyContent: 'flex-end' }}>
            <PillButton variant="danger" onClick={handleLogout}>
              {loggingOut ? t('auth.signing_out') : t('auth.sign_out')}
            </PillButton>
          </div>
        </>
      )}
    </OverlayShell>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ProfileContainer(props: ProfileContainerProps) {
  const openSettingsRef = useRef(false);

  const handleClose = () => {
    const openSettings = openSettingsRef.current;
    openSettingsRef.current = false;
    props.set(openSettings);
    props.func(false);
  };

  const handleOpenSettings = () => {
    openSettingsRef.current = true;
    props.set(true);
    props.func(false);
  };

  return (
    <Profile
      onClose={handleClose}
      onOpenSettings={handleOpenSettings}
      setLoggedIn={props.setLoggedIn}
      onOpenDashboard={props.onOpenDashboard}
    />
  );
}

export default ProfileContainer;
