-- Invite admins/editors by email: they sign in with an email link and become admins (safe to re-run).
create table if not exists public.admin_invites (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security;
drop policy if exists "admins manage invites" on public.admin_invites;
create policy "admins manage invites" on public.admin_invites for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.claim_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and exists (select 1 from public.admin_invites where lower(email) = lower(auth.email())) then
    insert into public.admins (user_id, email) values (auth.uid(), auth.email()) on conflict (user_id) do nothing;
  end if;
  return public.is_admin();
end $$;
grant execute on function public.claim_admin() to authenticated;
insert into public.admin_invites (email) values ('mumbaaai777@gmail.com'), ('traderdev25007@gmail.com') on conflict do nothing;
