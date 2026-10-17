import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * Uses the VITE_SUPABASE_* variables (public / publishable key) — these ARE part
 * of the client bundle by design and are safe to expose. All real protection
 * comes from Row Level Security policies defined in supabase/migrations/.
 *
 * The server-only SUPABASE_SECRET_KEY must NEVER be referenced here.
 * See .env.local / .env.example for the split.
 */
const runtimeEnv = import.meta.env || {};
const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — running in localStorage-only mode.'
  );
}
