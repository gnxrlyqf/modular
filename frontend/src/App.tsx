import { useState, useRef, useEffect } from "react";

import { AnimatedContent } from './ReactBits/ReactBits'
import LoginOverlay from "./Login";
import { ProjectsContainer } from "./Projects";
import ProfileContainer from "./Profile";
import DashboardContainer from "./Dashboard";
import SettingsContainer from "./Settings";
import { UserSearchContainer } from "./UserSearch";
import { AdminContainer, useIsAdmin } from "./Admin";
import PasswordResetConfirmPage, { parsePasswordResetRoute } from "./PasswordResetConfirm";
import PublicProfileContainer from "./PublicProfile";
import StarField from "./StarField";
import { XyloProvider } from "./Xylophone";
import CosmicLanding, { CosmicNebula } from "./Cosmic";
import logger from './logger';
import { authFetch, clearAuthCookies } from './api';

const ACCESS_COOKIE_NAME = "accessToken";
const SYNTH_URL = (import.meta.env.VITE_SYNTHESIZER_URL as string | undefined) ?? 'http://localhost:5174';

function hasCookie(cookieName: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .some((entry) => entry.startsWith(`${cookieName}=`));
}

function TopBar(props: {
  func?: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onProfileOpen?: () => void;
  onProjectsOpen?: () => void;
  onLeaderboardOpen?: () => void;
  onUsersOpen?: () => void;
  onAdminOpen?: () => void;
}) {
  const userPath =
    "M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z";

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // px coords relative to the wrapper — shared by both the border ring and interior tint
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div className="flex justify-center w-full z-10 px-3 sm:px-6">
      {/* ── Glow wrapper: overflow visible so border ring can paint outside nav ── */}
      <div ref={wrapperRef} className="navbar-glow-wrapper mt-3 sm:mt-5 mx-[5px] w-full max-w-[1300px]">
      <nav className="navbar w-full">
        {/* ── Content animates in, glass shell does not ── */}
        <AnimatedContent
          className="flex items-center w-full"
          distance={30}
          direction="vertical"
          reverse={false}
          duration={0.8}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={0.1}
        >
          <div className="relative z-10 grid grid-cols-3 items-center w-full">

            {/* ── Left: Logo ── */}
            <div className="flex items-center gap-2.5 justify-start">
              <div className="navbar-logo-icon" />
              <span className="navbar-logo-text">Lmoussiqar</span>
            </div>

            {/* ── Center: Nav links styled as xylophone bars ── */}
            <div className="hidden md:flex items-center gap-3 justify-center">
              <button type="button" data-xylo-note="C4" className="xylo-note xylo-note--c4" onClick={() => props.isLoggedIn ? props.onLeaderboardOpen?.() : props.func?.()}>leaderboard</button>
              <button
                type="button"
                data-xylo-note="E4"
                className="xylo-note xylo-note--e4"
                onClick={() => props.isLoggedIn ? props.onProjectsOpen?.() : props.func?.()}
              >
                community
              </button>
              <button type="button" data-xylo-note="G4" className="xylo-note xylo-note--g4" onClick={() => { if (!props.isLoggedIn) props.func?.(); }}>blog</button>
              <button type="button" data-xylo-note="B4" className="xylo-note xylo-note--b4" onClick={() => { if (!props.isLoggedIn) props.func?.(); }}>docs</button>
            </div>
            {/* Hidden on mobile for clean minimal view */}

            {/* ── Right: Actions ── */}
            <div className="flex items-center gap-3 justify-end">
              {props.isLoggedIn ? (
                <>
                  {props.isAdmin && (
                    <button
                      type="button"
                      onClick={() => props.onAdminOpen?.()}
                      data-xylo-note="A4"
                      className="xylo-note xylo-note--a4"
                      aria-label="Admin"
                    >
                      admin
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Search"
                    onClick={() => props.onUsersOpen?.()}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onProfileOpen?.()}
                    className="navbar-avatar"
                    aria-label="Profile"
                  >
                    <svg width="15" height="15" viewBox="2 2 20 20" fill="none">
                      <path d={userPath} stroke="currentColor" strokeWidth={1.8} />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => props.func?.()}
                  data-xylo-note="C5"
                  className="xylo-note xylo-note--c5"
                >
                  Get Started
                </button>
              )}
            </div>

          </div>
        </AnimatedContent>
      </nav>
      </div>
    </div>
  );
}

function App() {
  const resetRoute = typeof window !== 'undefined' ? parsePasswordResetRoute(window.location.pathname) : null;
  if (resetRoute) {
    return (
      <XyloProvider>
        <CosmicNebula />
        <StarField />
        <PasswordResetConfirmPage uid={resetRoute.uid} token={resetRoute.token} />
      </XyloProvider>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const [showLogin, setShowLogin] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [projectsInitialOrdering, setProjectsInitialOrdering] = useState('-created_at');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [publicProfileUser, setPublicProfileUser] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    hasCookie(ACCESS_COOKIE_NAME)
  );
  const { isAdmin, refresh: refreshAdmin } = useIsAdmin();
  const [verifiedToast, setVerifiedToast] = useState<'success' | 'failure' | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const v = params.get('verified');
    if (v === '1') return 'success';
    if (v === '0') return 'failure';
    return null;
  });

  useEffect(() => {
    if (verifiedToast === null) return;
    // Strip the query param so refresh doesn't replay the toast.
    const url = new URL(window.location.href);
    url.searchParams.delete('verified');
    window.history.replaceState({}, '', url.toString());
    const t = setTimeout(() => setVerifiedToast(null), 5000);
    return () => clearTimeout(t);
  }, [verifiedToast]);

  useEffect(() => {
    if (!hasCookie(ACCESS_COOKIE_NAME)) {
      setIsLoggedIn(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/users/me/');
        if (cancelled) return;
        if (response.ok) {
          setIsLoggedIn(true);
          const me: { username: string } = await response.json();
          if (!cancelled) setCurrentUsername(me.username);
        } else {
          clearAuthCookies();
          setIsLoggedIn(false);
          logger.warn('auth.session_invalid', { status: response.status });
        }
      } catch {
        if (cancelled) return;
        clearAuthCookies();
        setIsLoggedIn(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLoginSuccess = () => {
    logger.info('auth.login_success');
    setIsLoggedIn(true);
    setShowLogin(false);
    refreshAdmin();
  };

  const handleLoginOpen = () => {
    logger.action('nav.login_open');
    setShowProjects(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(false); setShowDashboard(false); setPublicProfileUser(null);
    setShowLogin(true);
  };
  const handleProjectsOpen = () => {
    logger.action('nav.projects_open');
    setShowLogin(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(false); setShowDashboard(false); setPublicProfileUser(null);
    setProjectsInitialOrdering('-created_at');
    setShowProjects(true);
  };

  const anyOverlayOpen =
    showProjects || showUserSearch || showAdmin || showProfile || showSettings || showDashboard || publicProfileUser !== null;

  const pendingLeaderboardScroll = useRef(false);

  useEffect(() => {
    if (!anyOverlayOpen && pendingLeaderboardScroll.current) {
      pendingLeaderboardScroll.current = false;
      setTimeout(() => {
        document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [anyOverlayOpen]);

  const handleLeaderboardOpen = () => {
    logger.action('nav.leaderboard_open');
    if (anyOverlayOpen) {
      pendingLeaderboardScroll.current = true;
      setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
      setShowUserSearch(false); setShowAdmin(false); setShowDashboard(false); setPublicProfileUser(null);
    } else {
      document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const handleProfileOpen = () => {
    logger.action('nav.profile_open');
    setShowLogin(false); setShowProjects(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(false); setShowDashboard(false); setPublicProfileUser(null);
    setShowProfile(true);
  };
  const handleUserSearchOpen = () => {
    logger.action('nav.user_search_open');
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
    setShowAdmin(false); setShowDashboard(false); setPublicProfileUser(null);
    setShowUserSearch(true);
  };
  const handleAdminOpen = () => {
    logger.action('nav.admin_open');
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setPublicProfileUser(null);
    setShowAdmin(true);
  };

  const handleDashboardOpen = () => {
    logger.action('nav.dashboard_open');
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
    setShowUserSearch(false); setShowAdmin(false); setPublicProfileUser(null);
    setShowDashboard(true);
  };

  const handlePublicProfileOpen = (username: string) => {
    logger.action('nav.public_profile_open', { username });
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
    setShowUserSearch(false); setShowAdmin(false); setShowDashboard(false);
    setPublicProfileUser(username);
  };

  const handleNewProject = async () => {
    try {
      const response = await authFetch('/api/projects/', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          config: { camera: { x: 0, y: 0 }, modules: [], cables: [] },
        }),
      });
      if (!response.ok) return;
      const created: { id: string } = await response.json();
      window.open(`${SYNTH_URL}?project=${created.id}`, '_blank', 'noreferrer');
    } catch { /* ignore */ }
  };

  const handleTryIt = () => {
    window.open(SYNTH_URL, '_blank', 'noreferrer');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showLogin) { setShowLogin(false); return; }
      if (publicProfileUser) { setPublicProfileUser(null); return; }
      if (showUserSearch) { setShowUserSearch(false); return; }
      if (showAdmin) { setShowAdmin(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showDashboard) { setShowDashboard(false); return; }
      if (showProfile) { setShowProfile(false); return; }
      if (showProjects) { setShowProjects(false); return; }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showLogin, showProjects, showProfile, showSettings, showDashboard, showUserSearch, showAdmin, publicProfileUser]);

  return (
    <XyloProvider>
    <div>
      {/* ─── Cosmic background atmosphere ─── */}
      <CosmicNebula />
      {/* ─── Star field — rotating music notes ─── */}
      <StarField />

      {/* ─── Fixed layer: sticky navbar + cosmic landing / overlay panels ─── */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="sticky top-0 z-20">
          <TopBar
            func={handleLoginOpen}
            isLoggedIn={isLoggedIn}
            isAdmin={Boolean(isAdmin)}
            onProfileOpen={handleProfileOpen}
            onProjectsOpen={handleProjectsOpen}
            onLeaderboardOpen={handleLeaderboardOpen}
            onUsersOpen={handleUserSearchOpen}
            onAdminOpen={handleAdminOpen}
          />
        </div>
        <div className="pt-4 pb-8">
          {showProjects && <ProjectsContainer func={setShowProjects} currentUsername={currentUsername ?? undefined} onUserClick={handlePublicProfileOpen} initialOrdering={projectsInitialOrdering} />}
          {publicProfileUser && <PublicProfileContainer username={publicProfileUser} func={(v) => { if (!v) setPublicProfileUser(null); }} onMessage={() => {}} />}
          {showUserSearch && <UserSearchContainer func={setShowUserSearch} onUserClick={handlePublicProfileOpen} />}
          {showAdmin && isAdmin && <AdminContainer func={setShowAdmin} />}
          {showProfile && (
            <ProfileContainer func={setShowProfile} set={setShowSettings} setLoggedIn={setIsLoggedIn} onOpenDashboard={handleDashboardOpen} />
          )}
          {showDashboard && (
            <DashboardContainer func={setShowDashboard} />
          )}
          {showSettings && (
            <SettingsContainer
              func={setShowSettings}
              setLoggedIn={setIsLoggedIn}
            />
          )}
          {!anyOverlayOpen && (
            <AnimatedContent
              distance={30}
              direction="vertical"
              reverse={false}
              duration={1}
              ease="power3.out"
              initialOpacity={0}
              animateOpacity
              scale={1}
              threshold={0.1}
              delay={0.2}
            >
              <CosmicLanding
                onGetStarted={isLoggedIn ? handleProjectsOpen : handleLoginOpen}
                isLoggedIn={isLoggedIn}
                onNewProject={handleNewProject}
                onTryIt={handleTryIt}
                onOpenLeaderboard={isLoggedIn ? handleLeaderboardOpen : handleLoginOpen}
              />
            </AnimatedContent>
          )}
        </div>
      </div>

      {/* ─── Login modal (fixed inset-0, handles its own backdrop) ─── */}
      {showLogin && (
        <LoginOverlay func={setShowLogin} onSuccess={handleLoginSuccess} />
      )}

      {/* ─── Email-verified toast ─── */}
      {verifiedToast && (
        <div
          role="status"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
        >
          <div
            className={`font-lexend modal-card !p-4 max-w-sm flex items-center gap-3 ${
              verifiedToast === 'success' ? 'border-green-400/40' : 'border-red-400/40'
            }`}
          >
            <span className={`text-xl ${verifiedToast === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {verifiedToast === 'success' ? '✓' : '✕'}
            </span>
            <div className="text-sm text-indigo-100">
              {verifiedToast === 'success'
                ? 'Email verified! You can now log in.'
                : 'Activation link is invalid or expired.'}
            </div>
            <button
              type="button"
              onClick={() => setVerifiedToast(null)}
              aria-label="Dismiss"
              className="ml-2 text-indigo-300/60 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
    </XyloProvider>
  );
}

export default App;
