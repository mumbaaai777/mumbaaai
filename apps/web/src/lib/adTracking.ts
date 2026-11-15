import { useEffect, useRef } from 'react';
import { db } from './data';

const seen = new Set<string>(JSON.parse(sessionStorage.getItem('mumbaaai.adseen') ?? '[]') as string[]);

/** Counts one impression per ad per session once ≥50% of the slot is visible for 1 s (IAB-style). */
export function useImpression<T extends HTMLElement>(adId: string | undefined) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !adId || seen.has(adId)) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = window.setTimeout(() => {
            if (seen.has(adId)) return;
            seen.add(adId);
            sessionStorage.setItem('mumbaaai.adseen', JSON.stringify([...seen]));
            void db.trackAd(adId, 'impression');
            io.disconnect();
          }, 1000);
        } else if (timer) window.clearTimeout(timer);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [adId]);
  return ref;
}

export function trackClick(adId: string, link: string) {
  void db.trackAd(adId, 'click');
  window.open(link, '_blank', 'noopener,noreferrer');
}
