-- Anonymous daily visitor count. One row per random browser id per IST day. No personal data.
create table if not exists public.daily_visits (
  day date not null,
  visitor text not null,
  listened boolean not null default false,
  primary key (day, visitor)
);
alter table public.daily_visits enable row level security;
-- No direct table access; only the functions below.
create or replace function public.record_visit(v text, listening boolean default false) returns void
language sql security definer set search_path = public as $$
  insert into public.daily_visits(day, visitor, listened)
  values ((now() at time zone 'Asia/Kolkata')::date, left(v, 32), listening)
  on conflict (day, visitor) do update set listened = daily_visits.listened or excluded.listened;
$$;
grant execute on function public.record_visit(text, boolean) to anon, authenticated;
create or replace function public.visit_stats(days int default 7)
returns table(day date, visitors bigint, listeners bigint)
language sql security definer set search_path = public as $$
  select d.day, count(*), count(*) filter (where d.listened)
  from public.daily_visits d
  where public.is_admin() and d.day > (now() at time zone 'Asia/Kolkata')::date - days
  group by d.day order by d.day desc;
$$;
grant execute on function public.visit_stats(int) to authenticated;
notify pgrst, 'reload schema';
