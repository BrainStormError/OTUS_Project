## Context

See `proposal.md` for motivation. Current constraints that shape the approach:

- Genres are already a table (`genres (id smallint PK, name)`, `..._media_and_genres.sql`) with a `UNIQUE(name)` index, currently used only as a save-time whitelist (`selectKnownGenreIds`). TMDB genres are fetched today only through the catalog client (`genreListRaw`) and cached in memory (`genreMap`, 10 min).
- The Home genre dropdown is derived from one page of `searchCatalog({ kind: 'film' })` results; the same derivation feeds the add-record modal.
- Multi-genre search without a title uses TMDB `/discover` with `with_genres` joined by `,` (AND); with a title it uses `/search` (no genre param) then filters in memory with `.some()` (OR).
- There is no scheduler in the repo. Deployment works by running a small, isolated migrator image once per release (`scripts/deploy.sh`: `db -> migrate -> up`). The runner image is `next` standalone output and does not ship `scripts/` or `tsx`; the migrator image ships only `scripts/migrate.cjs` and installs only `node-pg-migrate`.
- `scripts/*.ts` run under `tsx` with `.env` loaded (e.g. `db:seed`); scripts import `src` via relative paths (`verify-env.ts`), not the `@/` alias.

## Goals / Non-Goals

**Goals:**
- Refresh the full film+TV genre set from TMDB once per deployment, idempotently, without a scheduler.
- Make the stored catalog the source of genre options and genre names so screens no longer depend on a live TMDB genre call.
- Correct multi-genre matching to OR on both search paths and fix the add-record modal's genre filter.

**Non-Goals:**
- Caching the title catalog locally (search results still come from live TMDB).
- Pagination or result-set size changes.
- Per-genre `kind` splitting (film vs TV) and multi-locale names (see Open Questions).
- Any change to the `genres` schema.

## Decisions

### D1: Sync runs as a deploy step via the migrator image, not at runtime
The runner image cannot execute repo scripts (standalone build) and there is no scheduler, so the sync is a one-off command executed during deploy after migrations, reusing the migrator image.
- Add `scripts/sync-genres.cjs` (CommonJS, Node 22 global `fetch`) and `COPY` it into the migrator image; add `pg` explicitly to the migrator deps (`npm install --no-save node-pg-migrate@7.6.1 pg@8.23.1`) instead of relying on the transitive copy.
- `scripts/deploy.sh` runs the same image with a command override between migrate and up:
  `docker run --rm --network ${COMPOSE_PROJECT}_default -e DATABASE_URL -e TMDB_ACCESS_TOKEN "$MIGRATE_IMAGE" node scripts/sync-genres.cjs`.
- Alternatives: lazy runtime upsert (rejected — writes on a read path, needs a background/timer the repo lacks); network call inside a migration (rejected — migrations must stay offline and deterministic); a separate syncer image (rejected — more surface for one short-lived step).

### D2: Make the sync best-effort so it cannot roll back a deploy
`deploy.sh` uses `set -euo pipefail` with an `ERR` trap that rolls back to the previous image, so a TMDB outage must not fail the deploy. The sync invocation is guarded (`... || echo "warning: genre sync skipped"`) so a non-zero exit logs a warning and continues while the previously stored catalog is preserved.
- Alternative: fail-fast (rejected — a transient TMDB error would roll back an otherwise good release for a table that is already populated).

### D3: Reuse the `genres` table unchanged; upsert keyed on `id`
`INSERT ... ON CONFLICT (id) DO UPDATE SET name = excluded.name`, so re-runs are idempotent and shared film/TV ids update in place. The `UNIQUE(name)` index stays; if TMDB returns two ids with the same localized name, the conflicting row is skipped and logged rather than failing the whole sync.
- Alternative: add a `kind` column (deferred — see Open Questions); drop `UNIQUE(name)` via a new migration (rejected — no schema change wanted here).

### D4: Serve the catalog from the database through a client endpoint
Add `GET /api/genres` (via the existing `withRoute` wrapper) returning the stored genres sorted by name, backed by a new `listGenres()` in `modules/catalog/repository.ts`. Client components (`HomeView` on mount, `AddRecordModal` on open) fetch it, mirroring how they already fetch `/api/search` for options.
- Alternatives: pass genres as props from server pages (rejected — `AddRecordModal` is deep inside `MyFilmsView` and the pages already delegate option loading to clients); keep deriving from popular results (rejected — the bug being fixed).

### D5: Genre names come from the stored catalog, not a live TMDB call
`searchCatalog` resolves genre ids to names from the stored catalog (loaded once per request from the DB) instead of `genreMap`'s live `/genre/.../list` call, removing a failure mode where a TMDB genre outage fails the whole search. Unknown ids fall back to the raw id string, as today.
- Alternative: keep the live cache and layer the DB on top (rejected — unnecessary; the sync keeps the table fresh).

### D6: OR semantics via the TMDB separator; drop the broken modal filter
Change the `/discover` genre param to join ids with `|` (`client.ts`), matching the existing in-memory `.some()` filter and the requirement. In `AddRecordModal`, send the selected genre ids as the `genre` query param (same path as Home) and delete the local filter that compared ids against genre names.

## Risks / Trade-offs

- [Transitive `pg` in the migrator image] -> install `pg` explicitly in the migrator deps stage.
- [Best-effort sync swallows a real, persistent failure] -> the warning is emitted on every deploy; the stale list is visible and the runbook can trigger the sync manually with the same command.
- [`UNIQUE(name)` collision on localized names across film/TV] -> skip-and-log on conflict; revisit if it happens (see Open Questions).
- [Catalog freshness] -> genres change rarely, so refresh-on-deploy is acceptable; a genre introduced between deploys renders as its raw id until the next deploy.
- [Search cannot be genuinely offline] -> by design (D5/Non-Goals); the DB provides options and names, not matching.

## Migration Plan

1. Ship `scripts/sync-genres.cjs` and the migrator image change; ship `scripts/deploy.sh` with the guarded sync step.
2. First deploy after the change populates the table (previously seeded data is preserved by the upsert).
3. Rollback uses the existing previous-image path; the `genres` table is not schema-changed, so a rollback leaves it populated and harmless.

## Open Questions

- Should the catalog carry a `kind` (film vs TV) so the option list excludes TV-only genres on a film search, or is the current union acceptable? Deferred; if adopted it needs a schema column and would refine the "every genre is offered" scenario.
- Should names be stored per locale instead of a single `ru-RU` value, if the UI ever becomes multilingual? Deferred.
