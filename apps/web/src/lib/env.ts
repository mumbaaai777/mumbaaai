const clean = (v?: string) => (v && v.trim() ? v.trim().replace(/\/+$/, '') : undefined);

/** Default test stream: Radio Paradise 128 kbps MP3 (listener-supported, CORS-enabled). Verified 2026-11-13. */
export const DEFAULT_TEST_STREAM = 'https://stream.radioparadise.com/mp3-128';

export const env = {
  supabaseUrl: clean(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  apiUrl: clean(import.meta.env.VITE_API_URL),
  radioUrl: clean(import.meta.env.VITE_RADIO_STREAM_URL) ?? DEFAULT_TEST_STREAM,
  radioIsTest: !clean(import.meta.env.VITE_RADIO_STREAM_URL) || import.meta.env.VITE_RADIO_IS_TEST !== 'false',
  base: import.meta.env.BASE_URL,
};

export const asset = (p: string) => `${env.base}${p.replace(/^\//, '')}`;
