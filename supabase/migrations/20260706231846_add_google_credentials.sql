create table if not exists public.google_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_credentials is
  'Per-user Google OAuth refresh token, upserted at each dashboard login. Exchanged server-side for short-lived Calendar API access tokens so the dashboard can reconstruct past-day outcomes (done vs not-done) from the live calendar. Read/written only server-side; RLS scopes every row to its owner.';

alter table public.google_credentials enable row level security;

create policy "own creds - select" on public.google_credentials
  for select using (auth.uid() = user_id);

create policy "own creds - insert" on public.google_credentials
  for insert with check (auth.uid() = user_id);

create policy "own creds - update" on public.google_credentials
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
