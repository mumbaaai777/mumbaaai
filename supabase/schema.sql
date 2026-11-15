-- MumbaAai / Mumbaa Radio database. Run once in Supabase SQL Editor (safe to re-run).
-- Mirrors packages/shared/src/types.ts.
create extension if not exists pgcrypto;

-- ---------- admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;
drop policy if exists "admins see admins" on public.admins;
create policy "admins see admins" on public.admins for select to authenticated using (public.is_admin());

-- helper: standard admin-write policies for a table
create or replace function public._admin_policies(t text) returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists "admin all" on public.%I', t);
  execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
end $$;

-- ---------- ads ----------
create table if not exists public.ads (
  id text primary key default gen_random_uuid()::text,
  advertiser text not null, category text not null, title text not null, body text, cta text,
  image_url text, link text not null, placement text not null, zones text[] not null default '{}',
  start_date date not null, end_date date not null, budget_inr numeric not null default 0,
  pricing_model text not null default 'cpm', rate_inr numeric, status text not null default 'draft',
  impressions bigint not null default 0, clicks bigint not null default 0, created_at timestamptz not null default now()
);
select public._admin_policies('ads');
drop policy if exists "public active ads" on public.ads;
create policy "public active ads" on public.ads for select to anon, authenticated using (status = 'active');
create or replace function public.track_ad(p_ad_id text, p_kind text) returns void
  language sql security definer set search_path = public as $$
  update public.ads set impressions = impressions + (p_kind = 'impression')::int, clicks = clicks + (p_kind = 'click')::int
  where id = p_ad_id and status = 'active' $$;
grant execute on function public.track_ad(text, text) to anon, authenticated;

-- ---------- jobs ----------
create table if not exists public.jobs (
  id text primary key default gen_random_uuid()::text,
  title text not null, company text not null, zone text not null, locality text, job_type text not null,
  salary_min_inr numeric, salary_max_inr numeric, description text, whatsapp_number text not null,
  sponsored boolean not null default false, status text not null default 'active', posted_at timestamptz not null default now()
);
select public._admin_policies('jobs');
drop policy if exists "public jobs" on public.jobs;
create policy "public jobs" on public.jobs for select to anon, authenticated using (status = 'active');

-- ---------- alerts ----------
create table if not exists public.alerts (
  id text primary key default gen_random_uuid()::text,
  title text not null, body text, severity text not null default 'info', kind text not null default 'other',
  zones text[] not null default '{}', starts_at timestamptz not null default now(), ends_at timestamptz,
  active boolean not null default true
);
select public._admin_policies('alerts');
drop policy if exists "public alerts" on public.alerts;
create policy "public alerts" on public.alerts for select to anon, authenticated using (active);

-- ---------- radio ----------
create table if not exists public.radio_schedule (
  id text primary key default gen_random_uuid()::text,
  title text not null, description text, rj_id text, rj_name text,
  start_time text not null, end_time text not null, language text not null default 'mixed',
  days int[] not null default '{}', sort_order int
);
select public._admin_policies('radio_schedule');
drop policy if exists "public schedule" on public.radio_schedule;
create policy "public schedule" on public.radio_schedule for select to anon, authenticated using (true);

create table if not exists public.rj_profiles (
  id text primary key default gen_random_uuid()::text,
  name text not null, bio text, photo_url text, languages text[] not null default '{}', instagram text,
  active boolean not null default true
);
select public._admin_policies('rj_profiles');
drop policy if exists "public rjs" on public.rj_profiles;
create policy "public rjs" on public.rj_profiles for select to anon, authenticated using (active);

-- ---------- listener reports (traffic / train tips) ----------
create table if not exists public.listener_reports (
  id text primary key default gen_random_uuid()::text,
  kind text not null, zone text not null, location text not null check (char_length(location) <= 120),
  line text, message text not null check (char_length(message) <= 280), reporter_name text check (char_length(reporter_name) <= 40),
  status text not null default 'pending', created_at timestamptz not null default now()
);
select public._admin_policies('listener_reports');
drop policy if exists "submit report" on public.listener_reports;
create policy "submit report" on public.listener_reports for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "public approved reports" on public.listener_reports;
create policy "public approved reports" on public.listener_reports for select to anon, authenticated using (status = 'approved');

-- ---------- news overrides, stats, rate card ----------
create table if not exists public.news_overrides (
  id text primary key default gen_random_uuid()::text,
  url text not null, action text not null check (action in ('pin','hide')), title text, source text,
  created_at timestamptz not null default now()
);
select public._admin_policies('news_overrides');
drop policy if exists "public overrides" on public.news_overrides;
create policy "public overrides" on public.news_overrides for select to anon, authenticated using (true);

create table if not exists public.app_users_stats (
  day date primary key, daily_active_users int not null default 0, new_installs int not null default 0,
  radio_listeners int not null default 0, ask_aai_queries int not null default 0
);
select public._admin_policies('app_users_stats');

create table if not exists public.rate_card (
  id text primary key default gen_random_uuid()::text,
  placement text not null, pricing_model text not null, price_inr numeric not null, notes text
);
select public._admin_policies('rate_card');
drop policy if exists "public rate card" on public.rate_card;
create policy "public rate card" on public.rate_card for select to anon, authenticated using (true);

-- ---------- dedications (Aap Ki Farmaish / Celebrations) ----------
create table if not exists public.dedications (
  id text primary key default gen_random_uuid()::text,
  kind text not null check (kind in ('farmaish','birthday','anniversary','congrats','other')),
  from_name text not null check (char_length(from_name) between 1 and 40),
  from_area text check (char_length(from_area) <= 60),
  to_name text not null check (char_length(to_name) between 1 and 60),
  song text not null check (char_length(song) between 1 and 120),
  message text not null check (char_length(message) between 1 and 280),
  show_pref text, phone text check (char_length(phone) <= 15),
  status text not null default 'pending' check (status in ('pending','approved','scheduled','aired','rejected')),
  air_at timestamptz, rj_note text, created_at timestamptz not null default now()
);
select public._admin_policies('dedications');
drop policy if exists "submit dedication" on public.dedications;
create policy "submit dedication" on public.dedications for insert to anon, authenticated with check (status = 'pending' and air_at is null);
-- public wall without phone numbers
create or replace view public.dedications_public as
  select id, kind, from_name, from_area, to_name, song, message, show_pref, status, air_at, created_at
  from public.dedications where status in ('approved','scheduled','aired');
grant select on public.dedications_public to anon, authenticated;

-- ---------- Business Connect (Mumbaa Business) ----------
create table if not exists public.business_listings (
  id text primary key default gen_random_uuid()::text,
  intent text not null check (intent in ('seeking','offering')),
  role text not null check (role in ('investor','cofounder','mentor','hire','customer','partner')),
  name text not null check (char_length(name) between 1 and 60),
  founder text not null check (char_length(founder) between 1 and 60),
  sector text not null check (char_length(sector) between 1 and 60),
  stage text, zone text, pitch text not null check (char_length(pitch) between 1 and 300),
  ask text check (char_length(ask) <= 100), whatsapp text not null check (char_length(whatsapp) between 10 and 15),
  website text check (char_length(website) <= 200),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  featured_on_air boolean not null default false, created_at timestamptz not null default now()
);
select public._admin_policies('business_listings');
drop policy if exists "submit listing" on public.business_listings;
create policy "submit listing" on public.business_listings for insert to anon, authenticated with check (status = 'pending' and not featured_on_air);
drop policy if exists "public listings" on public.business_listings;
create policy "public listings" on public.business_listings for select to anon, authenticated using (status = 'approved');

-- ---------- storage for ad / RJ images ----------
insert into storage.buckets (id, name, public) values ('ad-images', 'ad-images', true) on conflict (id) do nothing;
drop policy if exists "admins upload images" on storage.objects;
create policy "admins upload images" on storage.objects for insert to authenticated with check (bucket_id = 'ad-images' and public.is_admin());
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects for select to anon, authenticated using (bucket_id = 'ad-images');

-- After signing up in the admin (Supabase Auth > Users > Add user), make yourself admin:
-- insert into public.admins (user_id, email) select id, email from auth.users where email = 'YOUR_EMAIL';
