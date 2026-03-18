import AnimatedContent from './ReactBits/AnimatedContent.tsx'
import {Input, Button} from './Reusables.tsx'
import { useState, type FormEvent } from 'react'

const LOGIN_ENDPOINT = 'https://c7e73032-d72e-445c-bcf6-58f694a5f2ac.mock.pstmn.io/api/auth/login';
const AUTH_COOKIE_NAME = 'authToken';
const REDIRECT_PATH = '/';

type LoginResponse = {
  id: string;
  username: string;
  token: string;
};

function isLoginResponse(data: unknown): data is LoginResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.token === 'string'
  );
}

function Google() {
  return (
    <button
    className="cursor-pointer text-black flex gap-2 items-center bg-white px-2 py-1 rounded-md text-lg hover:bg-zinc-300 hover:scale-105 transition-all ease-in duration-100"
    >
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-6">
        <path
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        fill="#FFC107"
        ></path>
        <path
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        fill="#FF3D00"
        ></path>
        <path
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        fill="#4CAF50"
        ></path>
        <path
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        fill="#1976D2"
        ></path>
    </svg>
    Continue with Google
    </button>
  )
}

function Facebook() {
  return (
  <button
  className="cursor-pointer text-white flex gap-2 items-center bg-blue-600 px-2 py-1 rounded-md text-lg hover:bg-blue-700 hover:scale-105 transition-all ease-in duration-100"
  >
    <svg
    className="w-6 fill-white"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 50 50"
    >
    <path
        d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848 c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588 l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"
    ></path>
    </svg>
    Login with Facebook
  </button>
  )
}

function Signup() {
  return (
    <div>
      <p className="text-indigo-100 text-4xl px-2 items-center text-center">
        Sign up
      </p>
      <div className="mx-auto flex flex-col gap-5 mt-10 mb-5 h-full items-center">

        <Input placeholder="Username" />
        <Input placeholder="Email" />
        <Input placeholder="Password" />
        <Input placeholder="Repeat password" />
        <Button text="Sign up"/>
        <div className="flex flex-row gap-1 mt-3">
          <span>Already have an account?</span>
          <button
            className="text-indigo-100 hover:-translate-y-1 ease-in-out duration-100 cursor-pointer"
            onClick={typeof window !== 'undefined' && (window as any).toggleAuthForm ? (window as any).toggleAuthForm : undefined}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  )
}

function Login(props: {onSuccess?: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid login credentials.');
      }

      const data: unknown = await response.json();

      if (!isLoginResponse(data)) {
        throw new Error('Unexpected login response format.');
      }

      const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(data.token)}; Max-Age=86400; Path=/; SameSite=Lax${secureFlag}`;
      props.onSuccess?.();
      window.location.assign(REDIRECT_PATH);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-indigo-100 text-4xl px-2 items-center text-center">
        Log in
      </p>
      <form onSubmit={handleSubmit} className="mx-auto flex flex-col gap-5 mt-10 mb-5 h-full items-center">
        <div className="flex flex-col gap-3">
          <Google />
          <Facebook />
        </div>
        <span className="text-indigo-100">Or</span>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-red-200 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-block font-lexend leading-6 hover:text-white hover:shadow-xl text-indigo-700 bg-indigo-300 shadow-2xl cursor-pointer rounded-md duration-100 ease-in-out hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="block px-2 py-1 rounded-md bg-indigo-300">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </span>
        </button>
        <div className="flex flex-row gap-1">
          <span>Don't have an account?</span>
          <button
            className="text-indigo-100 hover:-translate-y-1 ease-in-out duration-100 cursor-pointer"
            onClick={typeof window !== 'undefined' && (window as any).toggleAuthForm ? (window as any).toggleAuthForm : undefined}
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}

function LoginPage(props: {func?: (value: boolean) => void; onSuccess?: () => void}) {
  const [isLogin, setIsLogin] = useState(true);

  // Expose toggle function globally for button callbacks
  if (typeof window !== 'undefined') {
    (window as any).toggleAuthForm = () => setIsLogin((prev) => !prev);
  }

  return (
    <AnimatedContent
      distance={50}
      direction="vertical"
      reverse={false}
      duration={.5}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      visible={true}
      threshold={0.1}
      delay={.1}
      disappearDuration={.1}
      className="fixed top-1/4 left-0 right-0 z-50"
    >
      <div className="font-lexend bg-indigo-400/50 rounded-2xl p-3 my-5 mx-auto max-w-120 flex flex-col min-h-100">
        <button onClick={() => {props.func && props.func(false)}}>
          <img src="src/assets/close.svg" alt="close" className="w-7 ease-in-out duration-100 hover:scale-110 cursor-pointer"/>
        </button>
        <AnimatedContent
          key={isLogin ? 'login' : 'signup'}
          distance={0}
          direction="vertical"
          reverse={false}
          duration={.5}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={0}
        >
          {isLogin ? <Login onSuccess={props.onSuccess} /> : <Signup />}
        </AnimatedContent>
      </div>
    </AnimatedContent>
  );
}

function LoginOverlay(props: {func?: (value: boolean) => void; onSuccess?: () => void}) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="absolute bg-white/10 min-h-screen backdrop-blur inset-0"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={.5}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0}
      disappearDuration={.5}
      onDisappearanceComplete={() => props.func && props.func(false)}
    >
      <LoginPage func={setVisible} onSuccess={props.onSuccess} />
    </AnimatedContent>
  );
}

export default LoginOverlay