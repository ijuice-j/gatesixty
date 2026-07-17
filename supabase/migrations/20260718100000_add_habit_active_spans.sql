-- A habit's lifespan is not one interval — it's a UNION of them. `archived_at` is a single
-- mutable column: archive sets it, restore nulls it, and the restore erases that the pause
-- ever happened. Track a habit Jan–Feb, archive it while injured, restore it in July, and
-- `[created_on, archived_on)` reads as live all spring — so the months you deliberately
-- stopped asking about start handing you misses you never earned.
--
-- active_spans is the real shape: an ascending, non-overlapping array of the periods the
-- habit was actually active. Each is {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD" | null},
-- viewer-local, half-open [start, end) like every other date window in the app. The last
-- span's `end` is null exactly when the habit is active now. A day inside no span was not
-- being tracked, and earns no verdict.
--
-- `archived_at` stays as-is — it's still the "currently archived?" flag the manage page
-- splits on. active_spans is the history it never kept.

alter table public.habits
  add column active_spans jsonb not null default '[]'::jsonb,
  add constraint habits_active_spans_is_array check (jsonb_typeof(active_spans) = 'array');

-- Backfill: reconstruct each existing habit's single known interval from the columns that
-- held it. created_at/archived_at are timestamptz forced to a UTC date — the same ≤1-day
-- edge slip the created_on conversion carries, acceptable for one-time historical data.
update public.habits
  set active_spans = jsonb_build_array(
    jsonb_build_object(
      'start', (created_at at time zone 'UTC')::date,
      'end',   case when archived_at is null
                    then null
                    else (archived_at at time zone 'UTC')::date end
    )
  );

-- A habit created by not-yet-deployed code won't send active_spans, and an empty array
-- would make the habit invisible everywhere (no span = never live). Fill it from
-- created_at so a create during a rollout is still a live habit. New code sends the span
-- explicitly, viewer-local, which this leaves untouched.
create or replace function public.habits_default_active_span()
returns trigger language plpgsql as $$
begin
  if new.active_spans is null or new.active_spans = '[]'::jsonb then
    new.active_spans := jsonb_build_array(
      jsonb_build_object(
        'start', (coalesce(new.created_at, now()) at time zone 'UTC')::date,
        'end', null
      )
    );
  end if;
  return new;
end $$;

create trigger habits_default_active_span
  before insert on public.habits
  for each row execute function public.habits_default_active_span();
