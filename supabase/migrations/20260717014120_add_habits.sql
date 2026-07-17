-- Habits: a plan you declare.
--
-- activity_logs gets its plan from Google Calendar. A habit has no calendar event
-- behind it, so the plan IS this row. Everything downstream mirrors the ledger:
-- occurred_on is the viewer-local date, only what happened is stored, and no row
-- for a settled day is what "missed" means.

create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  kind        text not null,
  unit        text,
  target      numeric,
  period      text not null default 'day',
  color       text not null default '#6b7280',
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint habits_name_len           check (length(btrim(name)) between 1 and 80),
  constraint habits_kind               check (kind in ('count', 'check')),
  constraint habits_period             check (period in ('day', 'week')),
  constraint habits_color_hex          check (color ~ '^#[0-9a-fA-F]{6}$'),
  constraint habits_unit_count_only    check (kind = 'count' or unit is null),
  constraint habits_target_positive    check (target is null or target > 0),
  -- A check habit is "did you?" — target 1, never null. "Tick it but don't score
  -- it" is not a thing anyone means.
  -- NOTE: this expression is NULL-unsafe and is replaced by the very next
  -- migration. Kept as-is so this file matches what was actually applied.
  constraint habits_check_target_is_one check (kind <> 'check' or target = 1)
);

comment on table public.habits is
  'A habit you declare: a target and a cadence. Unlike activity_logs, whose plan comes from Google Calendar, the plan here is the row itself. Archive via archived_at rather than deleting - entries must outlive the definition.';
comment on column public.habits.target is
  'null = tracked but not scored. Renders as an em dash and drags no average down, exactly like a rest day.';
comment on column public.habits.kind is
  'count = a measured value (45 reps). check = did you or not. Immutable once entries exist: flipping it rewrites what past entries mean. Enforced in the app.';

create index habits_user_idx on public.habits (user_id, sort_order, created_at);

alter table public.habits enable row level security;

create policy habits_select_own on public.habits
  for select using ((select auth.uid()) = user_id);
create policy habits_insert_own on public.habits
  for insert with check ((select auth.uid()) = user_id);
create policy habits_update_own on public.habits
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy habits_delete_own on public.habits
  for delete using ((select auth.uid()) = user_id);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();


-- What you actually logged.

create table public.habit_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id        uuid not null references public.habits (id) on delete cascade,
  occurred_on     date not null,
  value           numeric not null,
  target_snapshot numeric,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint habit_entries_value_nonneg check (value >= 0),
  unique (user_id, habit_id, occurred_on)
);

comment on table public.habit_entries is
  'One row per habit per day - what you logged. No row for a settled day is what "missed" means, the same trick activity_logs plays with its done-only ledger.';
comment on column public.habit_entries.target_snapshot is
  'The target this entry was judged against, frozen at write time. Raising a goal from 50 to 100 must not turn every past success into a failure - the same reason activity_logs snapshots its event columns. null when the habit had no target.';
comment on column public.habit_entries.value is
  'The measured amount. Check habits store 1. No row at all means not logged, which is a different fact from a logged 0.';

create index habit_entries_user_date_idx on public.habit_entries (user_id, occurred_on);

alter table public.habit_entries enable row level security;

create policy habit_entries_select_own on public.habit_entries
  for select using ((select auth.uid()) = user_id);
create policy habit_entries_insert_own on public.habit_entries
  for insert with check ((select auth.uid()) = user_id);
create policy habit_entries_update_own on public.habit_entries
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy habit_entries_delete_own on public.habit_entries
  for delete using ((select auth.uid()) = user_id);

create trigger habit_entries_set_updated_at
  before update on public.habit_entries
  for each row execute function public.set_updated_at();
