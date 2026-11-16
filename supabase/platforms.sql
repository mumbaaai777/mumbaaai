-- Boarding platforms entered by admins (used by Ask Aai and the Local & Metro planner).
create table if not exists public.station_platforms (
  id uuid primary key default gen_random_uuid(),
  station text not null,
  line text not null check (line in ('western','central','harbour','trans_harbour')),
  towards text,
  platform text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.station_platforms enable row level security;
select public._admin_policies('station_platforms');
drop policy if exists "public platforms" on public.station_platforms;
create policy "public platforms" on public.station_platforms for select to anon, authenticated using (true);
insert into public.station_platforms (station, line, towards, platform, note)
select * from (values ('CSMT','harbour',null,'1 or 2','Harbour line terminus'), ('Kurla','harbour',null,'7 or 8',null), ('Thane','trans_harbour',null,'9 or 10',null)) v(station,line,towards,platform,note)
where not exists (select 1 from public.station_platforms);
notify pgrst, 'reload schema';
