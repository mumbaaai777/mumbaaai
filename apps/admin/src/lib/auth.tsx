import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db, isDemo } from './data';

interface AuthState {
  email: string | null;
  isAdmin: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>; // returns error message
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);
const DEMO_KEY = 'mumbaaai.admin.demo-session';
export const DEMO_EMAIL = 'demo@mumbaaai.app';
export const DEMO_PASSWORD = 'demo';

async function checkAdmin(): Promise<boolean> {
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
      return 'Signed in, but this account is not in the admins table. Ask an owner to add your user id.';
    }
    return null;
  };
  const signOut = async () => {
    if (isDemo) sessionStorage.removeItem(DEMO_KEY);
    else await db.client!.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
  };
  return <Ctx.Provider value={{ email, isAdmin, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}
