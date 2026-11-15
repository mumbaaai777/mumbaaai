import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, RotateCcw, PlugZap } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { askAai } from '../lib/api';
import { env, asset } from '../lib/env';
import { Page } from '../components/motion';
import { AdSlot } from '../components/AdSlot';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  kind?: 'error' | 'notice';
}
const KEY = 'mumbaaai.chat';

/** Minimal, safe Markdown: **bold**, bullet and numbered lists, paragraphs. No HTML injection. */
function Rich({ text }: { text: string }) {
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>));
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]);
          const L = ordered ? 'ol' : 'ul';
          return (
            <L key={i} className={`my-2 space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-marigold`}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>
              ))}
            </L>
          );
        }
        return (
          <p key={i} className="my-1.5 first:mt-0 last:mb-0">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ''))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

/** Reveals an answer word-by-word for a streaming feel (instant when reduced motion is on). */
function Typewriter({ text, onTick }: { text: string; onTick: () => void }) {
  const reduce = useReducedMotion();
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(reduce ? words.length : 0);
  useEffect(() => {
    if (n >= words.length) return;
    const id = setTimeout(() => {
      setN((v) => Math.min(words.length, v + 3));
      onTick();
    }, 28);
    return () => clearTimeout(id);
  }, [n, words.length, onTick]);
  return (
    <>
      <Rich text={words.slice(0, n).join('')} />
      {n < words.length && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-marigold" />}
    </>
  );
}

export default function Ask() {
  const { t, lang } = useI18n();
  const { zone } = useZone();
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as Msg[];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scroll = () => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30)));
    scroll();
  }, [msgs, busy]);

  const send = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', text };
    const history = [...msgs.filter((m) => !m.kind), userMsg];
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    const r = await askAai(history.map(({ role, text }) => ({ role, text })), lang, zone);
    setBusy(false);
    const id = crypto.randomUUID();
    if (r.ok) {
      setFresh(id);
      setMsgs((m) => [...m, { id, role: 'assistant', text: r.answer }]);
    } else {
      const textByReason = { not_connected: t.ask.notConnected, rate_limited: t.ask.rateLimited, error: t.ask.error };
      setMsgs((m) => [...m, { id, role: 'assistant', text: textByReason[r.reason], kind: r.reason === 'not_connected' ? 'notice' : 'error' }]);
    }
  };

  const answered = msgs.some((m) => m.role === 'assistant' && !m.kind);

  return (
    <Page>
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex items-center justify-between pb-4 pt-6 md:pt-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{t.ask.title}</h1>
          {msgs.length > 0 && (
            <button onClick={() => setMsgs([])} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-sm text-ink-soft">
              <RotateCcw size={14} /> {t.ask.clear}
            </button>
          )}
        </div>

        {!env.apiUrl && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-sm text-muted">
            <PlugZap size={18} className="mt-0.5 shrink-0 text-marigold-ink" />
            {t.ask.notConnected}
          </div>
        )}

        <div className="flex items-start gap-3">
          <img src={asset('icons/icon-192.png')} alt="" className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-[15px] leading-relaxed text-ink shadow-card">{t.ask.intro}</div>
        </div>

        {msgs.length === 0 && (
          <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }} className="mt-5 grid gap-2 sm:grid-cols-2">
            {t.ask.suggestions.map((s) => (
              <motion.button
                key={s}
                variants={{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => send(s)}
                className="rounded-2xl border border-line-strong bg-surface px-4 py-3 text-left text-sm text-ink-soft transition-colors hover:border-marigold hover:text-ink"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div className="mt-4 space-y-4" aria-live="polite">
          <AnimatePresence initial={false}>
            {msgs.map((m) =>
              m.role === 'user' ? (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-navy px-4 py-2.5 text-[15px] text-offwhite dark:bg-marigold dark:text-navy">{m.text}</div>
                </motion.div>
              ) : (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                  <img src={asset('icons/icon-192.png')} alt="" className="h-9 w-9 shrink-0 rounded-xl" />
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed ${
                      m.kind === 'error' ? 'border border-live/40 text-live-ink' : m.kind === 'notice' ? 'border border-dashed border-line-strong text-muted' : 'bg-surface text-ink shadow-card'
                    }`}
                  >
                    {m.id === fresh && !m.kind ? <Typewriter text={m.text} onTick={scroll} /> : <Rich text={m.text} />}
                  </div>
                </motion.div>
              ),
            )}
          </AnimatePresence>
          {busy && (
            <div className="flex items-center gap-3 pl-12 text-sm text-muted">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-marigold" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }} />
                ))}
              </span>
              {t.ask.thinking}
            </div>
          )}
          {answered && !busy && (
            <div className="pl-12">
              <AdSlot placement="ask_aai_sponsored" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] mt-6 md:bottom-6"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-card focus-within:border-marigold">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={t.ask.placeholder}
              aria-label={t.ask.placeholder}
              maxLength={2000}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.88 }}
              type="submit"
              disabled={!input.trim() || busy}
              className="grid h-10 w-10 place-items-center rounded-xl bg-marigold text-navy disabled:opacity-40"
              aria-label={t.ask.send}
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </motion.button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">{t.ask.disclaimer}</p>
        </form>
      </div>
    </Page>
  );
}
