// ══════════════════════════════════════════════════════════════════
//  SQL Journey Pro — Supabase Client
//  
//  Setup:
//  1. Create a project at https://app.supabase.com
//  2. Copy your project URL and anon key
//  3. Create a .env file in the project root (copy from .env.example):
//       VITE_SUPABASE_URL=https://xxxx.supabase.co
//       VITE_SUPABASE_ANON_KEY=eyJhbGc...
//  4. Run the SQL schema below in Supabase → SQL Editor → New query
//  
//  Without these env vars the app works perfectly via localStorage fallback.
// ══════════════════════════════════════════════════════════════════
//
//  ┌──────────────────────────────────────────────────────────────┐
//  │  SUPABASE SQL SCHEMA — paste into Supabase SQL Editor        │
//  └──────────────────────────────────────────────────────────────┘
//
//  -- 1. PROFILES
//  create table public.profiles (
//    id          uuid references auth.users(id) on delete cascade primary key,
//    name        text        not null,
//    email       text        not null,
//    pts         integer     default 0,
//    coins       integer     default 30,
//    streak      integer     default 0,
//    joined      date        default now(),
//    updated_at  timestamptz default now()
//  );
//  alter table public.profiles enable row level security;
//  create policy "own profile select" on public.profiles for select using (auth.uid() = id);
//  create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
//  create policy "own profile update" on public.profiles for update using (auth.uid() = id);
//
//  -- 2. PROGRESS (completed challenges)
//  create table public.progress (
//    id            uuid        default gen_random_uuid() primary key,
//    user_id       uuid        references public.profiles(id) on delete cascade,
//    challenge_id  integer     not null,
//    completed_at  timestamptz default now(),
//    used_hint     boolean     default false,
//    pts_earned    integer     default 0,
//    unique(user_id, challenge_id)
//  );
//  alter table public.progress enable row level security;
//  create policy "own progress" on public.progress for all using (auth.uid() = user_id);
//
//  -- 3. ACHIEVEMENTS
//  create table public.achievements (
//    id             uuid        default gen_random_uuid() primary key,
//    user_id        uuid        references public.profiles(id) on delete cascade,
//    achievement_id text        not null,
//    unlocked_at    timestamptz default now(),
//    unique(user_id, achievement_id)
//  );
//  alter table public.achievements enable row level security;
//  create policy "own achievements" on public.achievements for all using (auth.uid() = user_id);
//
//  -- 4. CERTIFICATES
//  create table public.certificates (
//    id                   uuid        default gen_random_uuid() primary key,
//    user_id              uuid        references public.profiles(id) on delete cascade unique,
//    certificate_unlocked boolean     default false,
//    issued_at            timestamptz default now(),
//    final_score          integer,
//    total_pts            integer
//  );
//  alter table public.certificates enable row level security;
//  create policy "own certificate" on public.certificates for all using (auth.uid() = user_id);
//
//  -- 5. Auto-update updated_at on profiles
//  create or replace function handle_updated_at()
//  returns trigger language plpgsql as $$
//  begin new.updated_at = now(); return new; end; $$;
//  create trigger on_profile_update before update on public.profiles
//    for each row execute procedure handle_updated_at();
//
// ══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_KEY.length > 20
);

export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,        // Supabase handles its own session storage
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (import.meta.env.DEV) {
  console.log(`[SQL Journey Pro] Storage: ${SUPABASE_CONFIGURED ? '☁️ Supabase' : '💾 localStorage fallback'}`);
}
