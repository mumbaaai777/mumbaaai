// Set your own password, and invite other admins / editors by email.
import { useState } from 'react';
import { KeyRound, UserPlus, Trash2 } from 'lucide-react';
import { db, isDemo } from '../lib/data';
import { useAuth } from '../lib/auth';
import { useRows } from '../lib/useRows';
import { Btn, inputCls } from '../components/Resource';

export default function Account() {
  const { email } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [invite, setInvite] = useState('');
  const [invMsg, setInvMsg] = useState<string | null>(null);
  const { rows, reload } = useRows<{ id: string; email: string }>('admin_invites');

  const setPassword = async () => {
    if (pw.length < 8) return setPwMsg('Use at least 8 characters.');
    if (pw !== pw2) return setPwMsg('The two passwords do not match.');
    if (isDemo) return setPwMsg('Works once Supabase is connected.');
    const { error } = await db.client!.auth.updateUser({ password: pw });
    setPwMsg(error ? error.message : 'Password saved. Next time, sign in with your email and this password.');
    if (!error) { setPw(''); setPw2(''); }
  };
  const addInvite = async () => {
    const e = invite.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setInvMsg('Enter a valid email.');
    try {
      await db.insert('admin_invites', { email: e });
      setInvite('');
      setInvMsg(`${e} is invited. Once they have a sign-in for this admin, they become an admin the first time they sign in.`);
      reload();
    } catch (x) { setInvMsg((x as Error).message); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Admins & password</h1>
      <section className="card space-y-3 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink"><KeyRound size={18} /> Your password</h2>
        <p className="text-sm text-muted">Signed in as {email}. Set or change the password for this admin account.</p>
        <input type="password" autoComplete="new-password" className={inputCls} placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input type="password" autoComplete="new-password" className={inputCls} placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <Btn onClick={setPassword}>Save password</Btn>
        {pwMsg && <p className="text-sm text-ink-soft">{pwMsg}</p>}
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink"><UserPlus size={18} /> Add an admin or editor</h2>
        <div className="flex gap-2">
          <input className={inputCls} placeholder="name@example.com" value={invite} onChange={(e) => setInvite(e.target.value)} />
          <Btn onClick={addInvite}>Add</Btn>
        </div>
        {invMsg && <p className="text-sm text-ink-soft">{invMsg}</p>}
        <ul className="divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={r.id ?? r.email} className="flex items-center justify-between py-2">
              <span>{r.email}</span>
              <button className="text-live-ink" aria-label="Remove" onClick={async () => { await db.client?.from('admin_invites').delete().eq('email', r.email); reload(); }}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
