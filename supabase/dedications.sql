-- Mumbaa Radio dedications (Aap Ki Farmaish / Celebrations).
-- Listeners (anon) can submit; the public can read approved/scheduled/aired rows WITHOUT phone numbers
-- via the dedications_public view; admins (is_admin()) manage everything.
create table if not exists public.dedications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('farmaish','birthday','anniversary','congrats','other')),
  from_name text not null check (char_length(from_name) between 1 and 40),
  from_area text check (char_length(from_area) <= 60),
  to_name text not null check (char_length(to_name) between 1 and 60),
  song text not null check (char_length(song) between 1 and 120),
  message text not null check (char_length(message) between 1 and 280),
  show_pref text,
  phone text check (char_length(phone) <= 15),
  status text not null default 'pending' check (status in ('pending','approved','scheduled','aired','rejected')),
  air_at timestamptz,
  rj_note text,
  created_at timestamptz not null default now()
);
alter table public.dedications enable row level security;

-- anyone may submit, but only as pending
create policy "submit dedication" on public.dedications for insert to anon, authenticated
  with check (status = 'pending' and air_at is null);
-- admins see and manage all
create policy "admins read dedications" on public.dedications for select to authenticated using (public.is_admin());
create policy "admins update dedications" on public.dedications for update to authenticated using (public.is_admin());
create policy "admins delete dedications" on public.dedications for delete to authenticated using (public.is_admin());
-- public wall: a view with no phone column, approved rows only (views run with the owner's rights)
create or replace view public.dedications_public as
  select id, kind, from_name, from_area, to_name, song, message, show_pref, status, air_at, created_at
  from public.dedications where status in ('approved','scheduled','aired');
grant select on public.dedications_public to anon, authenticated;
