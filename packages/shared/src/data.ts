// Data access used by both apps.
// - "supabase" mode: real reads/writes through supabase-js (RLS decides what each role may do).
// - "demo" mode (no VITE_SUPABASE_* env): seed JSON + localStorage. Web and admin are served from
//   the same origin on GitHub Pages, so admin edits made in demo mode show up in the web app
//   on the same browser — handy for demos, never shared between devices.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { seed } from './seed';

export type TableName =
  | 'ads'
  | 'jobs'
  | 'alerts'
  | 'radio_schedule'
  | 'rj_profiles'
  | 'listener_reports'
  | 'dedications'
  | 'dedications_public'
  | 'business_listings'
  | 'paper_articles'
  | 'news_overrides'
  | 'app_users_stats'
  | 'rate_card';

type Row = Record<string, unknown> & { id?: string };

export interface ListOptions {
  /** simple equality filters */
  eq?: Record<string, string | number | boolean>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface DataSource {
  mode: 'supabase' | 'demo';
  client: SupabaseClient | null;
  list<T = Row>(table: TableName, opts?: ListOptions): Promise<T[]>;
  insert<T = Row>(table: TableName, row: Partial<T>): Promise<T>;
  update<T = Row>(table: TableName, id: string, patch: Partial<T>): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
  /** increments ad impressions/clicks (security-definer RPC in Supabase; local counter in demo) */
  trackAd(adId: string, kind: 'impression' | 'click'): Promise<void>;
  /** uploads to the public `ad-images` bucket; demo mode returns a data URL */
  uploadImage(file: File): Promise<string>;
}

const DEMO_PREFIX = 'mumbaaai.demo.';
const seedFor = (table: TableName): Row[] => {
  if (table === 'news_overrides') return [];
  return (seed as unknown as Record<string, Row[]>)[table] ?? [];
};

function demoLoad(table: TableName): Row[] {
  if (table === 'dedications_public')
    return demoLoad('dedications')
      .filter((r) => ['approved', 'scheduled', 'aired'].includes(String(r.status)))
      .map(({ phone: _p, ...r }) => r);
  try {
    const raw = localStorage.getItem(DEMO_PREFIX + table);
    if (raw) return JSON.parse(raw) as Row[];
  } catch {
    /* ignore */
  }
  return structuredClone(seedFor(table));
}
function demoSave(table: TableName, rows: Row[]) {
  try {
    localStorage.setItem(DEMO_PREFIX + table, JSON.stringify(rows));
  } catch {
    /* quota exceeded (e.g. large data-URL images) — keep in memory only */
  }
}

export function resetDemoData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(DEMO_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function applyList(rows: Row[], opts?: ListOptions): Row[] {
  let out = rows;
  if (opts?.eq) out = out.filter((r) => Object.entries(opts.eq!).every(([k, v]) => r[k] === v));
  if (opts?.order) {
    const { column, ascending = true } = opts.order;
    out = [...out].sort((a, b) => {
      const av = a[column] as string | number;
      const bv = b[column] as string | number;
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
    });
  }
  if (opts?.limit) out = out.slice(0, opts.limit);
  return out;
}

function demoSource(): DataSource {
  return {
    mode: 'demo',
    client: null,
    async list<T>(table: TableName, opts?: ListOptions) {
      return applyList(demoLoad(table), opts) as T[];
    },
    async insert<T>(table: TableName, row: Partial<T>) {
      const rows = demoLoad(table);
      const r = { id: uid(), created_at: new Date().toISOString(), ...(row as Row) };
      rows.unshift(r);
      demoSave(table, rows);
      return r as T;
    },
    async update<T>(table: TableName, id: string, patch: Partial<T>) {
      const rows = demoLoad(table);
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) throw new Error('Not found');
      rows[i] = { ...rows[i], ...(patch as Row) };
      demoSave(table, rows);
      return rows[i] as T;
    },
    async remove(table: TableName, id: string) {
      demoSave(
        table,
        demoLoad(table).filter((r) => r.id !== id),
      );
    },
    async trackAd(adId, kind) {
      const rows = demoLoad('ads');
      const ad = rows.find((r) => r.id === adId);
      if (!ad) return;
      const col = kind === 'impression' ? 'impressions' : 'clicks';
      ad[col] = Number(ad[col] ?? 0) + 1;
      demoSave('ads', rows);
    },
    async uploadImage(file) {
      if (file.size > 400_000) throw new Error('Demo mode stores images in the browser; please use an image under 400 KB.');
      return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(file);
      });
    },
  };
}

function supabaseSource(client: SupabaseClient): DataSource {
  const pk = (table: TableName) => (table === 'app_users_stats' ? 'day' : 'id');
  return {
    mode: 'supabase',
    client,
    async list<T>(table: TableName, opts?: ListOptions) {
      let q = client.from(table).select('*');
      if (opts?.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
      if (opts?.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
    async insert<T>(table: TableName, row: Partial<T>) {
      // listener_reports: anon users can insert but not read back pending rows, so skip `select()`.
      if (table === 'listener_reports' || table === 'dedications' || table === 'business_listings') {
        const { error } = await client.from(table).insert(row as Row);
        if (error) throw error;
        return row as T;
      }
      const { data, error } = await client.from(table).insert(row as Row).select().single();
      if (error) throw error;
      return data as T;
    },
    async update<T>(table: TableName, id: string, patch: Partial<T>) {
      const { data, error } = await client.from(table).update(patch as Row).eq(pk(table), id).select().single();
      if (error) throw error;
      return data as T;
    },
    async remove(table: TableName, id: string) {
      const { error } = await client.from(table).delete().eq(pk(table), id);
      if (error) throw error;
    },
    async trackAd(adId, kind) {
      const { error } = await client.rpc('track_ad', { p_ad_id: adId, p_kind: kind });
      if (error) console.warn('[ads] track failed', error.message);
    },
    async uploadImage(file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `ads/${uid()}.${ext}`;
      const { error } = await client.storage.from('ad-images').upload(path, file, { cacheControl: '31536000', upsert: false });
      if (error) throw error;
      return client.storage.from('ad-images').getPublicUrl(path).data.publicUrl;
    },
  };
}

export function createDataSource(url?: string, anonKey?: string): DataSource {
  if (url && anonKey) {
    return supabaseSource(createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce', detectSessionInUrl: true } }));
  }
  return demoSource();
}
