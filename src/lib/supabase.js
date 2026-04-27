import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─────────────────────────────────────────────
// STRICT CHECK (better debugging)
// ─────────────────────────────────────────────
export const SUPABASE_CONFIGURED =
  typeof SUPABASE_URL === 'string' &&
  typeof SUPABASE_KEY === 'string' &&
  SUPABASE_URL.length > 0 &&
  SUPABASE_KEY.length > 0;

// ─────────────────────────────────────────────
// SAFE CLIENT (NEVER NULL WITHOUT WARNING)
// ─────────────────────────────────────────────
export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : undefined;

// ─────────────────────────────────────────────
// HARD DEBUG (IMPORTANT)
// ─────────────────────────────────────────────
if (import.meta.env.DEV) {
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_KEY exists:', !!SUPABASE_KEY);
  console.log(
    `[SQL Journey Pro] Mode: ${
      SUPABASE_CONFIGURED ? '☁️ Supabase' : '⚠️ MISSING ENV (WILL BREAK AUTH)'
    }`
  );
}
