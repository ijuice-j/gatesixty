-- A third repetition mode: specific weekdays. Habits already repeat daily (every day) or
-- weekly (a Mon–Sun quota); neither can say "on these weekdays" — where missing Monday is a
-- miss and Tuesday is simply off. The unit of judgment is still the DAY, so this is not a
-- new `period`: it's a daily habit with a filter on which weekdays count.
--
-- `weekdays` holds the scheduled weekday indices, Mon-first (0=Mon … 6=Sun) to match
-- lib/time.ts weekdayIndex. NULL means every day — the daily behaviour every existing habit
-- keeps, untouched. Only meaningful on a daily habit.

alter table public.habits
  add column weekdays smallint[];

-- Set only on a daily habit; non-empty; every element a real weekday. Element uniqueness is
-- deduped in createHabit before the write (awkward to state in a CHECK, cheap in the action).
alter table public.habits
  add constraint habits_weekdays_valid check (
    weekdays is null
    or (
      period = 'day'
      and array_length(weekdays, 1) between 1 and 7
      and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  );
