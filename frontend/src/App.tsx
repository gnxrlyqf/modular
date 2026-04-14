import { useState, useRef, useEffect } from "react";

import { AnimatedContent } from './ReactBits/ReactBits'
import LoginOverlay from "./Login";
import { ProjectsContainer } from "./Projects";
import ProfileContainer from "./Profile";
import SettingsContainer from "./Settings";
import { UserSearchContainer } from "./UserSearch";
import StarField from "./StarField";

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
  onProfileOpen?: () => void;
  onProjectsOpen?: () => void;
  onUsersOpen?: () => void;
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
    <div className="flex justify-center w-full z-10 px-6">
      {/* ── Glow wrapper: overflow visible so border ring can paint outside nav ── */}
      <div ref={wrapperRef} className="navbar-glow-wrapper mt-5 mx-[5px] w-full max-w-[1300px]">
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
          <div className="relative z-10 flex items-center w-full">

            {/* ── Left: Logo ── */}
            <div className="flex items-center gap-2.5 flex-1">
              <div className="navbar-logo-icon" />
              <span className="navbar-logo-text">lhrba</span>
            </div>

            {/* ── Center: Nav links ── */}
            <div className="flex items-center gap-7">
              <button type="button" className="nav-link">leaderboard</button>
              <button
                type="button"
                className="nav-link"
                onClick={() => props.onProjectsOpen?.()}
              >
                community
              </button>
              <button type="button" className="nav-link">blog</button>
              <button type="button" className="nav-link">docs</button>
            </div>

            {/* ── Right: Actions ── */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              {props.isLoggedIn ? (
                <>
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
                  className="btn-get-started"
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
  const [showLogin, setShowLogin] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    hasCookie(ACCESS_COOKIE_NAME)
  );

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLoginOpen = () => {
    setShowProjects(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowLogin(true);
  };
  const handleProjectsOpen = () => {
    setShowLogin(false); setShowProfile(false); setShowSettings(false); setShowUserSearch(false);
    setShowProjects(true);
  };
  const handleProfileOpen = () => {
    setShowLogin(false); setShowProjects(false); setShowSettings(false); setShowUserSearch(false);
    setShowProfile(true);
  };
  const handleUserSearchOpen = () => {
    setShowLogin(false); setShowProjects(false); setShowProfile(false); setShowSettings(false);
    setShowUserSearch(true);
  };

  return (
    <div>
      {/* ─── Star field background ─── */}
      <StarField />

      {/* ─── Hero section (normal flow, behind fixed layer) ─── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
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
          <h1 className="font-peachy text-5xl md:text-7xl text-center leading-tight">
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
          <p className="font-lexend text-indigo-300/50 text-lg md:text-xl mt-8 text-center max-w-xl mx-auto font-light tracking-wide">
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
            onProfileOpen={handleProfileOpen}
            onProjectsOpen={handleProjectsOpen}
            onUsersOpen={handleUserSearchOpen}
          />
        </div>
        <div className="pt-4 pb-8">
          {showProjects && <ProjectsContainer func={setShowProjects} />}
          {showUserSearch && <UserSearchContainer func={setShowUserSearch} />}
          {showProfile && (
            <ProfileContainer func={setShowProfile} set={setShowSettings} />
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
    </div>
  );
}

export default App;
