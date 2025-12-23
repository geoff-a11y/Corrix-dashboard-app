import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

let supabase: SupabaseClient | null = null;

/**
 * Get Supabase client singleton (uses service role key for admin access)
 * Returns null if not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[Supabase] Not configured - SUPABASE_URL or SUPABASE_SERVICE_KEY missing');
    return null;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('[Supabase] Client initialized');
  return supabase;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export default getSupabaseClient;
