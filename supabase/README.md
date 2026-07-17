# Supabase schema

The database behind Gate60 — project `fcmztsyvrqltidpcohhs`. It serves **both**
[`mobile/`](../mobile/) (which writes the outcome ledger) and
[`dashboard/`](../dashboard/) (which reconstructs and reviews it), which is why this
lives at the repo root rather than inside either one.

## migrations/

Every migration applied to the project, filename `<version>_<name>.sql`, matching the
`version` recorded in `supabase_migrations.schema_migrations` exactly.

The first three were reconstructed from the remote's recorded statements after the fact
— they were applied before this directory existed, so the file list now matches the
remote rather than only covering what came later. A directory holding *some* of the
history is worse than none: it looks replayable and isn't.

| Version | What |
|---|---|
| `20260705232247` | `activity_logs` — the outcome ledger, plus `set_updated_at()` |
| `20260705232342` | pin `set_updated_at()`'s `search_path` (linter 0011) |
| `20260706231846` | `google_credentials` — the per-user refresh token |
| `20260717014120` | `habits` + `habit_entries` |
| `20260717014238` | fix a NULL-unsafe CHECK on `habits` |

## The rule

**Apply nothing by hand.** A change made straight against the database is invisible to
this directory, and the drift is silent — nothing fails, the file list is just quietly
wrong. Write the migration, apply it, and commit it in the same change.

There is **one project and no staging**, so a migration here goes to production. Prefer
additive changes; anything that drops or rewrites a column is touching live data with no
second copy of it anywhere.
