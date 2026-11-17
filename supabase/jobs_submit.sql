-- Employers can submit a job from the web app. It waits as 'pending' until an admin sets it 'active'.
drop policy if exists "submit job" on public.jobs;
create policy "submit job" on public.jobs for insert to anon, authenticated
  with check (status = 'pending' and not sponsored);
notify pgrst, 'reload schema';
