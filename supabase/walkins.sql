alter table public.jobs add column if not exists walk_in boolean not null default false, add column if not exists walkin_date date, add column if not exists walkin_time text, add column if not exists walkin_venue text;
notify pgrst, 'reload schema';
