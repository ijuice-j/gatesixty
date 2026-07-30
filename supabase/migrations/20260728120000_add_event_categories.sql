-- Event categories: a name for a Google Calendar colour.
--
-- The problem this solves: an event's title is the INSTANCE, not the kind. "Alchemist"
-- and "Great Expectations" are both Reading, and nothing in either string says so. A
-- title rule can group "Code LSP" with "Design LastSeenPlaying" because those share a
-- token; no rule can group two book names without one entry per book.
--
-- So the grouping signal is the one Google already carries and already syncs: colorId
-- "1".."11". You set the colour once on the event (a recurring series inherits it), and
-- this table says what that colour MEANS. Google stores the signal; the meaning is ours,
-- because Google has nowhere to put it.
--
-- Nothing is stored per event. A category is resolved at READ time from the live
-- event's colorId, which is what makes recolouring retroactive: change a colour in
-- Google and every past occurrence reclassifies on the next sync, with no backfill.
-- That property is the whole reason this table is keyed by colour and not by event.

create table public.event_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  color_id   smallint not null,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Google's event palette is exactly eleven entries. A twelfth category is not a
  -- bigger number here; it's a different mechanism (title rules), deliberately not
  -- built yet. Rejecting it at the DB keeps that boundary honest.
  constraint event_categories_color_id_range check (color_id between 1 and 11),
  constraint event_categories_name_len       check (length(btrim(name)) between 1 and 40),

  -- One meaning per colour. Two names on one colour is unresolvable: an event carries
  -- a single colorId and could not be told which it belonged to.
  unique (user_id, color_id)
);

comment on table public.event_categories is
  'Names a Google Calendar colorId ("1".."11") so calendar blocks roll up by category on the week and month reviews. No row per event: the category is resolved at read time from the live event colour, so recolouring in Google reclassifies history with no backfill.';
comment on column public.event_categories.color_id is
  'Google Calendar colorId, 1-11. NOT the hex - hex is a presentation value mirrored in two places (dashboard and mobile) and would silently break this mapping if either drifted. An event with no colorId is Uncategorised and has no row here.';
comment on column public.event_categories.name is
  'What the colour means to you: "Reading", "LastSeenPlaying". Exclusive by construction - an event has one colour, so it lands in exactly one category and hours never double-count across a rollup.';

create index event_categories_user_idx on public.event_categories (user_id, color_id);

alter table public.event_categories enable row level security;

create policy event_categories_select_own on public.event_categories
  for select using ((select auth.uid()) = user_id);
create policy event_categories_insert_own on public.event_categories
  for insert with check ((select auth.uid()) = user_id);
create policy event_categories_update_own on public.event_categories
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy event_categories_delete_own on public.event_categories
  for delete using ((select auth.uid()) = user_id);

create trigger event_categories_set_updated_at
  before update on public.event_categories
  for each row execute function public.set_updated_at();
