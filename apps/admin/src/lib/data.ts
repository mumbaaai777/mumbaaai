import { createDataSource } from '@mumbaaai/shared';

const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
export const db = createDataSource(clean(import.meta.env.VITE_SUPABASE_URL), clean(import.meta.env.VITE_SUPABASE_ANON_KEY));
export const isDemo = db.mode === 'demo';
export const webUrl = clean(import.meta.env.VITE_WEB_URL) ?? '../';
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
