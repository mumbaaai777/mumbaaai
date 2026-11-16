import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { db } from './data';

// Anonymous "who is live" signal for the admin dashboard (Supabase Realtime presence).
// Sends only a random per-tab id and whether the radio is playing. No personal data.
export function usePresence(listening: boolean) {
  const chRef = useRef<RealtimeChannel | null>(null);
  const listenRef = useRef(listening);
  listenRef.current = listening;
  useEffect(() => {
    const client = db.client;
    if (!client) return;
    const id = Math.random().toString(36).slice(2, 10);
    const ch = client.channel('live-users', { config: { presence: { key: id } } });
    ch.subscribe((s) => {
      if (s === 'SUBSCRIBED') void ch.track({ listening: listenRef.current });
    });
    chRef.current = ch;
    return () => {
      chRef.current = null;
      void client.removeChannel(ch);
    };
  }, []);
  useEffect(() => {
    void chRef.current?.track({ listening });
  }, [listening]);
}
