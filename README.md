# GateSixty

Monorepo for **GateSixty** — a flip-clock + Google Calendar day tracker growing
into an all-in-one productivity tool.

## Structure

| Path | What |
|------|------|
| [`mobile/`](mobile/) | The Flutter tablet app — an always-on landscape flip clock that shows your current/next calendar event, with a mark-done button that records what you actually did. Riverpod + go_router. |
| [`dashboard/`](dashboard/) | The Next.js web dashboard — review past events (done vs. not-done, reconstructed by diffing Google Calendar against the ledger) and what's upcoming. |

## Backend

Supabase project `fcmztsyvrqltidpcohhs` holds the `activity_logs` outcome
ledger (owner-only RLS). The project-scoped MCP config lives in `.mcp.json`.

## Workflow

**Never push directly to `main`** — branch and open a PR (see `CLAUDE.md`).

### Mobile (Flutter)
```bash
cd mobile
flutter pub get
dart run build_runner build   # generate Riverpod code
flutter run
```

### Dashboard (Next.js)
```bash
cd dashboard
pnpm install
pnpm dev
```
