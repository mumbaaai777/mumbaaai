import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db, isDemo } from './data';

interface AuthState {
  email: string | null;
  isAdmin: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>; // returns error message
  sendLink: (email: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);
const DEMO_KEY = 'mumbaaai.admin.demo-session';
export const DEMO_EMAIL = 'demo@mumbaaai.app';
export const DEMO_PASSWORD = 'demo';

async function checkAdmin(): Promise<boolean> {
  // Invited emails (admin_invites) become admins on first sign-in.
  await db.client!.rpc('claim_admin').then(() => undefined, () => undefined);
  const { data, error } = await db.client!.rpc('is_admin');
  return !error && data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isDemo) {
      const e = sessionStorage.getItem(DEMO_KEY);
      setEmail(e);
      setIsAdmin(Boolean(e));
      setReady(true);
      return;
    }
    const sb = db.client!;
    sb.auth.getSession().then(async ({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setIsAdmin(data.session ? await checkAdmin() : false);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange(async (_e, session) => {
      setEmail(session?.user.email ?? null);
      setIsAdmin(session ? await checkAdmin() : false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (e: string, p: string) => {
    if (isDemo) {
      if (e.trim().toLowerCase() === DEMO_EMAIL && p === DEMO_PASSWORD) {
        sessionStorage.setItem(DEMO_KEY, DEMO_EMAIL);
        setEmail(DEMO_EMAIL);
        setIsAdmin(true);
        return null;
      }
      return `Demo mode: use ${DEMO_EMAIL} / ${DEMO_PASSWORD}`;
    }
    const { error } = await db.client!.auth.signInWithPassword({ email: e.trim(), password: p });
    if (error) return error.message;
    if (!(await checkAdmin())) {
      await db.client!.auth.signOut();
      return 'Signed in, but this email is not an admin. Ask an owner to add it in Admins & password.';
    }
    return null;
  };
  const signUp = async (e: string, p: string) => {
    if (isDemo) return 'Works once Supabase is connected.';
    if (p.length < 8) return 'Use at least 8 characters for the password.';
    const { data, error } = await db.client!.auth.signUp({ email: e.trim(), password: p, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) return error.message.includes('registered') ? 'This email already has a password. Use Sign in.' : error.message;
    if (!data.session) return 'Account created. Open the confirmation email, then sign in.';
    if (!(await checkAdmin())) {
      await db.client!.auth.signOut();
      return 'Account created, but this email is not invited as an admin. Ask an owner to add it in Admins & password.';
    }
    return null;
  };
  const sendLink = async (e: string) => {
    if (isDemo) return 'Sign-in links work once Supabase is connected.';
    const { error } = await db.client!.auth.signInWithOtp({
      email: e.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname },
    });
    return error ? error.message : null;
  };
  const signOut = async () => {
    if (isDemo) sessionStorage.removeItem(DEMO_KEY);
    else await db.client!.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
  };
  return <Ctx.Provider value={{ email, isAdmin, ready, signIn, sendLink, signUp, signOut }}>{children}</Ctx.Provider>;
}
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}
