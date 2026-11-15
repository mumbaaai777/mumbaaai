-- Mumbaa Aai News (e-paper). Run in Supabase SQL Editor after schema.sql (safe to re-run).
create table if not exists public.paper_articles (
  id text primary key default gen_random_uuid()::text,
  edition_date date not null default (now() at time zone 'Asia/Kolkata')::date,
  layout text not null default 'standard' check (layout in ('lead','standard','photo','brief','opinion','ad_full','ad_half','ad_strip')),
  section text not null default 'city',
  position int not null default 10,
  headline jsonb not null default '{}'::jsonb,
  standfirst jsonb, body jsonb,
  image_url text, image_caption text, byline text,
  source_name text, source_url text,
  is_auto boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
create index if not exists paper_articles_edition on public.paper_articles (edition_date desc, position);
select public._admin_policies('paper_articles');
drop policy if exists "public published paper" on public.paper_articles;
create policy "public published paper" on public.paper_articles for select to anon, authenticated using (status = 'published');

insert into public.rate_card (id, placement, pricing_model, price_inr, notes) values
  ('rc-p1','paper_full','flat_daily',2500,'Full-width ad in the daily e-paper'),
  ('rc-p2','paper_half','flat_daily',1200,'Half-column ad box in the e-paper'),
  ('rc-p3','paper_strip','flat_daily',600,'Thin strip between stories')
on conflict (id) do nothing;
