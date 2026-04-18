import AnimatedContent from './ReactBits/AnimatedContent.tsx'
import { Input, CloseButton } from './Reusables.tsx'
import { extractErrorMessage } from './api.ts'
import { startOAuth, type OAuthProvider } from './oauth.ts'
import logger from './logger'
import { useState, type FormEvent } from 'react'
import type React from 'react'

// ─── Password input with show/hide toggle ─────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="w-full pr-11" />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/30 hover:text-indigo-300/70 transition-colors duration-150 cursor-pointer"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}


const LOGIN_ENDPOINT = '/api/token/';
const SIGNUP_ENDPOINT = '/api/users/register/';
const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REDIRECT_PATH = '/';

type LoginResponse = {
  refresh: string;
  access: string;
};

function isLoginResponse(data: unknown): data is LoginResponse {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.refresh === 'string' && typeof candidate.access === 'string';
}

// ─── Social buttons (OAuth) ───────────────────────────────────────────────────

type SocialButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

function GoogleButton({ onClick, disabled }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="glass glass-hover rounded-lg px-5 py-3 text-base font-medium text-white/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 flex items-center gap-3 w-full justify-center cursor-pointer border border-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{ boxShadow: '0 0 20px rgba(66,133,244,0.12)' }}
    >
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
        <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"/>
        <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"/>
        <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"/>
        <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"/>
      </svg>
      Continue with Google
    </button>
  );
}

function FacebookButton({ onClick, disabled }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="glass glass-hover rounded-lg px-5 py-3 text-base font-medium text-white/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 flex items-center gap-3 w-full justify-center cursor-pointer border border-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{ boxShadow: '0 0 20px rgba(24,119,242,0.12)' }}
    >
      <svg className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <path fill="#1877F2" d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"/>
      </svg>
      Continue with Facebook
    </button>
  );
}

function FortyTwoButton({ onClick, disabled }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="glass glass-hover rounded-lg px-5 py-3 text-base font-medium text-white/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 flex items-center gap-3 w-full justify-center cursor-pointer border border-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{ boxShadow: '0 0 20px rgba(255,255,255,0.12)' }}
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 38 26" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M37.305 9.254h-8.04V0h-8.59l-8.59 9.254v7.594h9.137V26h8.043v-9.152h8.04V9.254zM8.59 9.254L17.18 0H8.59L0 9.254v7.594h8.59V9.254z"/>
      </svg>
      Continue with 42
    </button>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────

function Signup(props: { onToggle: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      logger.warn('signup.validation_failed', { reason: 'missing_fields' });
      setError('Username and password are required.');
      return;
    }

    if (password !== repeatPassword) {
      logger.warn('signup.validation_failed', { reason: 'passwords_mismatch', username });
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    logger.info('signup.attempt', { username });

    try {
      const response = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Sign up failed. Please try again.');
        logger.warn('signup.failed', { username, status: response.status });
        throw new Error(message);
      }

      logger.info('signup.success', { username });
      props.onToggle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed.';
      logger.error('signup.error', { username, message });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent text-center tracking-wide mb-8">Sign up</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-5">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          placeholder="Repeat password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="glass glass-hover glow-indigo rounded-lg px-6 py-4 text-base font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          {isSubmitting ? 'Signing up…' : 'Sign up'}
        </button>
      </form>
      <div className="flex gap-1.5 items-center justify-center text-sm text-indigo-300/50 mt-8">
        <span>Already have an account?</span>
        <button
          type="button"
          className="text-indigo-300 font-medium hover:text-white duration-200 cursor-pointer transition-colors"
          onClick={props.onToggle}
        >
          Log in
        </button>
      </div>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function Login(props: { onSuccess?: () => void; onToggle: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    if (oauthPending) return;
    setError(null);
    setOauthPending(provider);
    try {
      const result = await startOAuth(provider);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      props.onSuccess?.();
      window.location.assign(REDIRECT_PATH);
    } finally {
      setOauthPending(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) {
      logger.warn('login.validation_failed', { reason: 'missing_fields' });
      setError('Username and password are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    logger.info('login.attempt', { username });

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Invalid username or password.');
        logger.warn('login.failed', { username, status: response.status });
        throw new Error(message);
      }
      const data: unknown = await response.json();
      if (!isLoginResponse(data)) {
        logger.error('login.unexpected_response', { username });
        throw new Error('Unexpected login response format.');
      }
      logger.info('login.success', { username });
      const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${ACCESS_COOKIE_NAME}=${encodeURIComponent(data.access)}; Max-Age=86400; Path=/; SameSite=Lax${secureFlag}`;
      document.cookie = `${REFRESH_COOKIE_NAME}=${encodeURIComponent(data.refresh)}; Max-Age=604800; Path=/; SameSite=Lax${secureFlag}`;
      props.onSuccess?.();
      window.location.assign(REDIRECT_PATH);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      logger.error('login.error', { username, message });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent text-center tracking-wide mb-8">Log in</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-5">
        <div className="flex flex-col gap-4">
          <GoogleButton onClick={() => handleOAuth('google')} disabled={oauthPending !== null} />
          <FacebookButton onClick={() => handleOAuth('facebook')} disabled={oauthPending !== null} />
          <FortyTwoButton onClick={() => handleOAuth('42')} disabled={oauthPending !== null} />
        </div>
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-indigo-300/40 text-xs font-medium uppercase tracking-widest">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-red-300/80 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="glass glass-hover glow-indigo rounded-lg px-6 py-4 text-base font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
        <div className="flex gap-1.5 items-center justify-center text-sm text-indigo-300/50 mt-8">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="text-indigo-300 font-medium hover:text-white duration-200 cursor-pointer transition-colors"
            onClick={props.onToggle}
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Login page (card) ────────────────────────────────────────────────────────

function LoginPage(props: { func?: (value: boolean) => void; onSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const toggle = () => setIsLogin(prev => !prev);

  return (
    <AnimatedContent
      distance={50}
      direction="vertical"
      reverse={false}
      duration={0.6}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      visible={true}
      threshold={0.1}
      delay={0.1}
      disappearDuration={0.3}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="font-lexend modal-card mx-4 max-w-md w-full pointer-events-auto">
        <div className="flex justify-end mb-2">
           <CloseButton onClick={() => props.func && props.func(false)} />
        </div>
        <AnimatedContent
          key={isLogin ? 'login' : 'signup'}
          distance={20}
          direction="vertical"
          reverse={false}
          duration={0.4}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={0}
        >
          {isLogin
            ? <Login onSuccess={props.onSuccess} onToggle={toggle} />
            : <Signup onToggle={toggle} />
          }
        </AnimatedContent>
      </div>
    </AnimatedContent>
  );
}

// ─── Overlay (backdrop) ───────────────────────────────────────────────────────

function LoginOverlay(props: { func?: (value: boolean) => void; onSuccess?: () => void }) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="fixed inset-0 z-[40]" // Below modal z-index
      distance={0}
      direction="vertical"
      reverse={false}
      duration={0.6}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0}
      disappearDuration={0.4}
      onDisappearanceComplete={() => props.func && props.func(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <LoginPage func={setVisible} onSuccess={props.onSuccess} />
    </AnimatedContent>
  );
}

export default LoginOverlay;
