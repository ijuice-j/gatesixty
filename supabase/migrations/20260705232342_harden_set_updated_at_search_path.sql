-- Pin an empty search_path so the trigger function can't be hijacked by a
-- malicious object in a user-controlled schema (Supabase linter 0011).
-- now() resolves from pg_catalog, which stays implicitly in scope.
alter function public.set_updated_at() set search_path = '';
