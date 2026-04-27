import { useState, useRef, useEffect } from "react";

import { AnimatedContent } from './ReactBits/ReactBits'
import LoginOverlay from "./Login";
import { ProjectsContainer } from "./Projects";
import ProfileContainer from "./Profile";
import SettingsContainer from "./Settings";
import { UserSearchContainer } from "./UserSearch";
import { AdminContainer, useIsAdmin } from "./Admin";
import PasswordResetConfirmPage, { parsePasswordResetRoute } from "./PasswordResetConfirm";
import StarField from "./StarField";
import { XyloProvider } from "./Xylophone";
import logger from './logger';
import { authFetch, clearAuthCookies } from './api';

const ACCESS_COOKIE_NAME = "accessToken";

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
              <span className="navbar-logo-text">lhrba</span>
            </div>

            {/* ── Center: Nav links styled as xylophone bars ── */}
            <div className="hidden md:flex items-center gap-3 justify-center">
              <button type="button" data-xylo-note="C4" className="xylo-note xylo-note--c4">leaderboard</button>
              <button
                type="button"
                data-xylo-note="E4"
                className="xylo-note xylo-note--e4"
                onClick={() => props.onProjectsOpen?.()}
              >
                community
              </button>
              <button type="button" data-xylo-note="G4" className="xylo-note xylo-note--g4">blog</button>
              <button type="button" data-xylo-note="B4" className="xylo-note xylo-note--b4">docs</button>
            </div>
            {/* On mobile: just a Community button to keep core nav reachable */}
            <div className="md:hidden flex items-center justify-center">
              <button
                type="button"
                data-xylo-note="E4"
                className="xylo-note xylo-note--e4 text-xs"
                onClick={() => props.onProjectsOpen?.()}
              >
                community
              </button>
            </div>

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
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
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
    setShowAdmin(false);
    setShowLogin(true);
  };
  const handleProjectsOpen = () => {
    logger.action('nav.projects_open');
    setShowLogin(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(false);
    setShowProjects(true);
  };
  const handleProfileOpen = () => {
    logger.action('nav.profile_open');
    setShowLogin(false); setShowProjects(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(false);
    setShowProfile(true);
  };
  const handleUserSearchOpen = () => {
    logger.action('nav.user_search_open');
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
    setShowAdmin(false);
    setShowUserSearch(true);
  };
  const handleAdminOpen = () => {
    logger.action('nav.admin_open');
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowAdmin(true);
  };

  return (
    <XyloProvider>
    <div>
      {/* ─── Star field background ─── */}
      <StarField />

      {/* ─── Hero section (normal flow, behind fixed layer) ─── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center pointer-events-none select-none px-4" style={{ zIndex: 1 }}>
        <AnimatedContent
          distance={40}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          threshold={0.1}
          delay={0.3}
        >
          <h1 className="font-peachy text-4xl sm:text-5xl md:text-7xl text-center leading-tight">
            <span className="bg-gradient-to-r from-indigo-300 via-blue-200 to-indigo-400 bg-clip-text text-transparent">
              Your modular synthesizer
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              built in&nbsp;web.
            </span>
          </h1>
        </AnimatedContent>

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
          delay={0.6}
        >
          <p className="font-lexend text-indigo-300/50 text-base sm:text-lg md:text-xl mt-6 sm:mt-8 text-center max-w-xl mx-auto font-light tracking-wide">
            Learn how sound works. Create music. Share with the world.
          </p>
        </AnimatedContent>
      </div>

      {/* ─── Fixed layer: sticky navbar + overlay panels ─── */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="sticky top-0 z-20">
          <TopBar
            func={handleLoginOpen}
            isLoggedIn={isLoggedIn}
            isAdmin={Boolean(isAdmin)}
            onProfileOpen={handleProfileOpen}
            onProjectsOpen={handleProjectsOpen}
            onUsersOpen={handleUserSearchOpen}
            onAdminOpen={handleAdminOpen}
          />
        </div>
        <div className="pt-4 pb-8">
          {showProjects && <ProjectsContainer func={setShowProjects} />}
          {showUserSearch && <UserSearchContainer func={setShowUserSearch} />}
          {showAdmin && isAdmin && <AdminContainer func={setShowAdmin} />}
          {showProfile && (
            <ProfileContainer func={setShowProfile} set={setShowSettings} setLoggedIn={setIsLoggedIn} />
          )}
          {showSettings && (
            <SettingsContainer
              func={setShowSettings}
              setLoggedIn={setIsLoggedIn}
            />
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
