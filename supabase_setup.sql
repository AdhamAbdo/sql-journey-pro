-- ================================================================
-- SQL Journey Pro — Supabase Setup
-- Run this in your Supabase SQL editor to create the required tables
-- and the trigger that stores the user's name on signup.
-- ================================================================

-- PROFILES
create table if not exists profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  name      text,
  pts       integer default 0,
  coins     integer default 30,
  streak    integer default 0,
  joined    date default current_date
);

-- PROGRESS
create table if not exists progress (
  user_id      uuid references auth.users(id) on delete cascade,
  challenge_id integer,
  used_hint    boolean default false,
  pts_earned   integer default 0,
  primary key (user_id, challenge_id)
);

-- ACHIEVEMENTS
create table if not exists achievements (
  user_id        uuid references auth.users(id) on delete cascade,
  achievement_id text,
  primary key (user_id, achievement_id)
);

-- CERTIFICATES
create table if not exists certificates (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  certificate_unlocked  boolean default false,
  final_score           integer,
  total_pts             integer,
  issued_at             timestamptz
);

-- ----------------------------------------------------------------
-- TRIGGER: auto-create profile on signup, storing the user's name
-- from user_metadata (set by the app via options.data.name)
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, joined)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    current_date
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies (enable Row Level Security)
alter table profiles     enable row level security;
alter table progress     enable row level security;
alter table achievements enable row level security;
alter table certificates enable row level security;

create policy "Users manage own profile"     on profiles     for all using (auth.uid() = id);
create policy "Users manage own progress"    on progress     for all using (auth.uid() = user_id);
create policy "Users manage own achievements" on achievements for all using (auth.uid() = user_id);
create policy "Users manage own certificate" on certificates for all using (auth.uid() = user_id);
