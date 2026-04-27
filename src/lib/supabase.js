import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// ENV VARIABLES
// ─────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─────────────────────────────────────────────
// DEBUG (DEV ONLY)
// ─────────────────────────────────────────────
if (import.meta.env.DEV) {
  console.log('[Supabase URL]', SUPABASE_URL);
  console.log('[Supabase KEY exists]', !!SUPABASE_ANON_KEY);
}

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────
export const SUPABASE_CONFIGURED =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.length > 0 &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  SUPABASE_ANON_KEY.length > 0;

// ─────────────────────────────────────────────
// SAFE CLIENT (NEVER THROW CRASH)
// ─────────────────────────────────────────────
export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ─────────────────────────────────────────────
// WARNING (CLEAR ERROR IN CONSOLE)
// ─────────────────────────────────────────────
if (!SUPABASE_CONFIGURED && import.meta.env.DEV) {
  console.warn(
    '⚠️ Supabase is NOT configured. App will use fallback mode (localStorage).'
  );
}
