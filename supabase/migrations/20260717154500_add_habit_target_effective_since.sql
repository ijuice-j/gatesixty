-- A habit's target can be added, changed, or removed after the fact, but the schema kept
-- no record of WHEN. So a no-entry day in the past was judged against whatever target the
-- habit holds NOW: set a goal today on a habit you'd tracked untracked for a month, and
-- that month of un-logged days retroactively became "missed" against a goal that did not
-- exist then. `target_snapshot` already fixes this for the days you LOGGED — it freezes
-- the goal onto the entry. This is the same fix for the days you didn't: the ones with no
-- entry to carry a snapshot.
--
-- `target_effective_since` is the viewer-local date the CURRENT target took effect. It is
-- NULL exactly when the habit has no target (untracked). A no-entry day before it was
-- lived under no goal and earns no verdict; on or after it, the current target applies.
-- A numeric target CHANGE (50 -> 100) does not move it: a no-entry day scores 0, which is
-- below any positive target, so the boundary only has to track the untracked <-> tracked
-- edge, which is the only one that flips a verdict.

alter table public.habits
  add column target_effective_since date;

-- Backfill: a tracked habit has been tracked since it was created. `created_at` is
-- timestamptz, forced to a UTC date here — so this can be off by a day at the edges for
-- existing rows, the same one-day slip the created_on conversion carries and acceptable
-- for one-time historical data. (There are no tracked rows at time of writing; this is
-- correctness for any that pre-date the column.)
update public.habits
  set target_effective_since = (created_at at time zone 'UTC')::date
  where target is not null;

-- Lenient on purpose. It forbids the one combination the app never writes — untracked
-- with a date — while still ALLOWING (tracked, NULL). During a rollout the not-yet-updated
-- code inserts a tracked habit without this column; rejecting that would break creates for
-- the length of a deploy. The app maintains the tighter invariant (NULL iff untracked) in
-- createHabit / updateHabit; this constraint is the floor, not the ceiling.
alter table public.habits
  add constraint habits_effective_since_untracked_null
  check (target is not null or target_effective_since is null);
