/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_RADIO_STREAM_URL?: string;
  readonly VITE_RADIO_IS_TEST?: string;
  readonly VITE_BASE?: string;
  readonly VITE_RADIO_WHATSAPP?: string;
}
