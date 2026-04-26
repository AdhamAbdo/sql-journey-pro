-- ══════════════════════════════════════════════════════════════════
--  SQL Journey Pro — Supabase Schema
--  
--  This script creates all necessary tables for user authentication,
--  progress tracking, achievements, and certificates.
-- ══════════════════════════════════════════════════════════════════

-- 1. PROFILES (user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  pts         INTEGER DEFAULT 0,
  coins       INTEGER DEFAULT 30,
  streak      INTEGER DEFAULT 0,
  joined      DATE DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "own profile select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own profile insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. PROGRESS (completed challenges)
CREATE TABLE IF NOT EXISTS public.progress (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id  INTEGER NOT NULL,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  used_hint     BOOLEAN DEFAULT FALSE,
  pts_earned    INTEGER DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Enable Row Level Security
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy for progress
CREATE POLICY "own progress" ON public.progress
  FOR ALL USING (auth.uid() = user_id);

-- 3. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policy for achievements
CREATE POLICY "own achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id);

-- 4. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  certificate_unlocked BOOLEAN DEFAULT FALSE,
  issued_at            TIMESTAMPTZ DEFAULT NOW(),
  final_score          INTEGER,
  total_pts            INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policy for certificates
CREATE POLICY "own certificate" ON public.certificates
  FOR ALL USING (auth.uid() = user_id);

-- 5. Auto-update updated_at trigger on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;

-- Create trigger
CREATE TRIGGER on_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();
