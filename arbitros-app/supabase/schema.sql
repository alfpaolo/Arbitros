-- Clubs
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

-- Categories
create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  duration_minutes integer not null check (duration_minutes in (60, 90))
);

-- Referees
create table if not exists public.referees (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  is_admin boolean default false,
  home_latitude double precision,
  home_longitude double precision,
  created_at timestamptz default now()
);

-- Availability windows (per referee, day/time range)
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  referee_id uuid not null references public.referees(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  weekday smallint generated always as (extract(dow from start_time)) stored,
  constraint chk_time_range check (end_time > start_time)
);
create index if not exists idx_availability_referee_time on public.availability(referee_id, start_time, end_time);

-- Venues (can be the same as clubs location or specific courts)
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_id uuid references public.clubs(id) on delete set null,
  address text,
  latitude double precision,
  longitude double precision
);

-- Games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  local_club_id uuid not null references public.clubs(id) on delete restrict,
  away_club_id uuid not null references public.clubs(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  category_id integer not null references public.categories(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz generated always as (starts_at + make_interval(mins => (select duration_minutes from public.categories c where c.id = category_id))) stored,
  notes text
);
create index if not exists idx_games_time on public.games(starts_at, ends_at);

-- Assignments (two referees per game)
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  referee_id uuid not null references public.referees(id) on delete cascade,
  role text default 'principal',
  assigned_at timestamptz default now(),
  unique(game_id, referee_id)
);
create index if not exists idx_assignments_game on public.assignments(game_id);

-- Precomputed travel times between venues (optional optimization)
create table if not exists public.venue_distances (
  from_venue_id uuid references public.venues(id) on delete cascade,
  to_venue_id uuid references public.venues(id) on delete cascade,
  minutes integer not null,
  primary key (from_venue_id, to_venue_id)
);

-- Helper: ensure a referee is available for a game
create or replace view public.vw_referee_available_for_game as
select r.id as referee_id, g.id as game_id
from referees r
join games g on true
where exists (
  select 1 from availability a
  where a.referee_id = r.id and a.start_time <= g.starts_at and a.end_time >= g.ends_at
);

-- Constraint triggers can be added later; for now, enforce in app logic.