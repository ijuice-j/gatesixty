-- Gate60 activity tracking: ledger of past event outcomes.
-- Rows are written only when an event ends with a "done" intent set.
-- Absence of a row for a past calendar occurrence means "not done".

create table public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  gcal_event_id text not null,
  occurred_on   date not null,
  title         text not null,
  planned_start timestamptz,
  planned_end   timestamptz,
  color         text,
  done          boolean not null default true,
  ended_at      timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, gcal_event_id, occurred_on)
);

comment on table public.activity_logs is
  'Per-occurrence outcome ledger. Snapshot columns are frozen at commit time because the source Google Calendar event may later change or be deleted.';

alter table public.activity_logs enable row level security;

create policy "activity_logs_select_own" on public.activity_logs
  for select using ((select auth.uid()) = user_id);
create policy "activity_logs_insert_own" on public.activity_logs
  for insert with check ((select auth.uid()) = user_id);
create policy "activity_logs_update_own" on public.activity_logs
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "activity_logs_delete_own" on public.activity_logs
  for delete using ((select auth.uid()) = user_id);

create index activity_logs_user_date_idx on public.activity_logs (user_id, occurred_on);

-- Keep updated_at fresh on any row change.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activity_logs_set_updated_at
  before update on public.activity_logs
  for each row execute function public.set_updated_at();
