import { createDataSource } from '@mumbaaai/shared';
import { env } from './env';

export const db = createDataSource(env.supabaseUrl, env.supabaseAnonKey);
export const isDemo = db.mode === 'demo';
