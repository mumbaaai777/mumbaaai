// One <audio> element for the whole app, so the Home mini-player and the Radio tab
// control the same stream and playback survives tab changes.
import { usePresence } from './presence';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { env, asset } from './env';

type Status = 'idle' | 'connecting' | 'playing' | 'paused' | 'error';

interface RadioCtx {
  status: Status;
  volume: number;
  setVolume: (v: number) => void;
  toggle: () => void;
  /** true when Web Audio analyser data is available (stream sent CORS headers) */
  hasAnalyser: boolean;
  /** fills `out` with frequency data; returns false when no analyser */
  readFrequencies: (out: Uint8Array<ArrayBuffer>) => boolean;
  isTest: boolean;
  streamUrl: string;
}

const Ctx = createContext<RadioCtx | null>(null);

export function RadioProvider({ children, showTitle }: { children: ReactNode; showTitle?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const corsModeRef = useRef<'anonymous' | 'none'>('anonymous');
  const [status, setStatus] = useState<Status>('idle');
  const [volume, setVol] = useState(() => Number(localStorage.getItem('mumbaaai.volume') ?? 0.9));
  const [hasAnalyser, setHasAnalyser] = useState(false);
  usePresence(status === 'playing');

  const build = useCallback(() => {
    const a = new Audio();
    a.preload = 'none';
    if (corsModeRef.current === 'anonymous') a.crossOrigin = 'anonymous';
    a.volume = volume;
    a.addEventListener('playing', () => setStatus('playing'));
    a.addEventListener('waiting', () => setStatus('connecting'));
    a.addEventListener('pause', () => setStatus((s) => (s === 'error' ? s : 'paused')));
    a.addEventListener('error', () => {
      // A stream without CORS headers fails in anonymous mode: retry plain (no visualiser data).
      if (corsModeRef.current === 'anonymous') {
        corsModeRef.current = 'none';
        audioRef.current = null;
        analyserRef.current = null;
        setHasAnalyser(false);
        const b = build();
        b.src = env.radioUrl;
        b.play().catch(() => setStatus('error'));
        return;
      }
      setStatus('error');
    });
    audioRef.current = a;
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachAnalyser = (a: HTMLAudioElement) => {
    if (corsModeRef.current !== 'anonymous' || analyserRef.current) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(a);
      const an = ctx.createAnalyser();
      an.fftSize = 128;
      an.smoothingTimeConstant = 0.8;
      src.connect(an);
      an.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = an;
      setHasAnalyser(true);
    } catch {
      setHasAnalyser(false);
    }
  };

  const toggle = useCallback(() => {
    let a = audioRef.current;
    if (a && !a.paused) {
      a.pause();
      // Drop the buffered live stream so resuming plays "now", not minutes-old audio.
      a.removeAttribute('src');
      a.load();
      return;
    }
    if (!a) a = build();
    setStatus('connecting');
    a.src = `${env.radioUrl}${env.radioUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
    attachAnalyser(a);
    void ctxRef.current?.resume();
    a.play().catch(() => setStatus('error'));
  }, [build]);

  const setVolume = (v: number) => {
    setVol(v);
    if (audioRef.current) audioRef.current.volume = v;
    localStorage.setItem('mumbaaai.volume', String(v));
  };

  const readFrequencies = useCallback((out: Uint8Array<ArrayBuffer>) => {
    const an = analyserRef.current;
    if (!an || status !== 'playing') return false;
    an.getByteFrequencyData(out);
    return true;
  }, [status]);

  // Lock-screen / headset controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: showTitle || 'Mumbaa Radio',
      artist: env.radioIsTest ? 'Mumbaa Radio · Test stream' : 'Mumbaa Radio',
      artwork: [{ src: asset('icons/icon-512.png'), sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
  }, [showTitle, toggle]);

  return (
    <Ctx.Provider value={{ status, volume, setVolume, toggle, hasAnalyser, readFrequencies, isTest: env.radioIsTest, streamUrl: env.radioUrl }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRadio() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRadio outside provider');
  return v;
}
