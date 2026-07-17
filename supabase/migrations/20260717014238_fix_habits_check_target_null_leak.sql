-- `check (kind <> 'check' or target = 1)` did not do its job.
--
-- A CHECK constraint rejects a row only when the expression evaluates to FALSE;
-- NULL passes. For kind='check' with a NULL target that expression is
-- `false or (null = 1)` => `false or null` => NULL, so the exact row the
-- constraint exists to forbid was being accepted.
--
-- `is not distinct from` is NULL-safe: it returns a real false for NULL, so the
-- constraint now evaluates to FALSE and the row is rejected.

alter table public.habits drop constraint habits_check_target_is_one;

alter table public.habits add constraint habits_check_target_is_one
  check (kind <> 'check' or target is not distinct from 1);
