## Context

See `proposal.md` for motivation and `specs/` for required behavior. Current constraints that shape the approach:

- Layered architecture `app -> modules -> core` enforced by dependency-cruiser; `core` is infrastructure and must not know about modules/components. UI primitives must not import modules.
- The `media` table already stores only rated titles: `upsertMedia` is called exclusively from the rating save path (`ratings/service.ts`), so "persist only rated" is existing behavior to preserve, not new.
- `media.external_ref` (string) + `kind` (0 film / 1 series) allow a TMDB id to be the stable external reference with no new table.
- `media.genre_ids` references a local `genres` table that is currently seeded with eight Russian names and surrogate ids, matched by name.
- The rating write path currently trusts client-supplied `title`/`year`/`genres` (`ratings/schema.ts`).
- Environment is fail-fast through `core/config/env.ts`; `withRoute` enforces auth + trusted origin + rate limit; `core/http/timeout.ts` provides `withTimeout`.

## Goals / Non-Goals

**Goals:**

- One server-only catalog module that owns all TMDB access, mapping, and the local catalog read/write, so no UI component talks to TMDB and the token never reaches the client.
- A trustworthy local catalog: metadata comes from TMDB, never from the client.
- Whole-series rating end to end (types, store, screens, tests).

**Non-Goals:**

- Per-episode/per-season rating (deferred).
- Localizing TMDB content beyond requesting a single language from TMDB.
- Persisting posters, cast, overviews, or any rich detail; only the minimal field set is stored.
- Changing auth, friendships, groups, discussions, or the activity feed beyond their media references.

## Decisions

### A dedicated `modules/catalog` owns TMDB

Add `src/modules/catalog` (client + service + types + schema), exported through its `index.ts`. It exposes: search by kind, resolve detail by kind, fetch metadata for saving, and list the local catalog. Rationale: keeps the API key server-side, gives one mapping point, and keeps `core` free of module imports. Alternative considered: a `core/tmdb` client — rejected because TMDB is domain data, not infrastructure, and would leak module concerns upward.

### TMDB v4 REST with bearer token, timeout, and a small TTL cache

Use TMDB v4 read access token (bearer) against `/search/movie`, `/search/tv`, `/movie/{id}`, `/tv/{id}`, and `/genre/{movie|tv}/list`, with `language=ru-RU` and posters from `https://image.tmdb.org/t/p/w500`. Every call is wrapped in `withTimeout` and returns a `Result`. A small in-memory TTL cache fronts search and detail to stay within TMDB rate limits. Alternative considered: no cache — rejected as rate-limit and latency risk on every keystroke.

### Reuse `media`; add `director`; key genres by TMDB id

Extend `media` with `director varchar(200)` rather than create a parallel catalog table, since `media` already is the catalog of rated titles. Re-key `genres` so its `id` equals the TMDB genre id (signed `smallint` fits all current TMDB ids) and its `name` holds the localized name returned by TMDB; `media.genre_ids` then stores TMDB genre ids directly and both the write path and the genre filter use ids. Alternatives considered: keep surrogate ids and add a `genres.tmdb_id` column — rejected as an extra join/lookup for no benefit; match by name — rejected because it breaks under localization.

### Server-side metadata enrichment on save

Change `ratingInput` so the client sends only `mediaKind`, `mediaRef`, `rating`, `comment`, and `watchedAt`. In the rating save path the server calls the catalog module to fetch title/year/director/genres by kind and id, then performs `upsertMedia` with that metadata. If TMDB has no such title, the save fails and no catalog row is written. Rationale: `media` is shared across all users and `upsertMedia` upserts on `(kind, external_ref)`, so trusting client metadata would let any authenticated user overwrite or forge shared catalog rows. Alternative considered (client-supplied metadata) was rejected for exactly that shared-catalog corruption risk.

### Series are rated as a whole

Remove the `SeriesRecord` per-episode mode, seasons/episodes from the series types, the series local store, and the per-episode UI; a series carries a single rating. Remove the `hashId`/`seriesToMovie` shim and use the numeric TMDB series id as `external_ref`. Alternatives considered: keep per-episode — rejected as out of scope and incompatible with the minimal-storage goal.

### Detail resolution is kind-aware

Films resolve at `/film/[tmdbId]` and series at `/series/[tmdbId]`, each calling the catalog module for its kind. The previous single film route that looked up an in-code catalog is replaced. Postponed detail data is fetched live and not stored.

### Search panel: kind selector, reduced filters

The search panel gains a kind selector (films/series) on Home and in the group add-rating modal; My Films and My Series are kind-specific and omit it. Filters reduce to title, a multi-value genre filter (TMDB `with_genres` as OR), and a single year selector. Actor/director filters are dropped because they require separate person-id resolution. Alternative considered: keep actor/director via `/search/person` + `with_people` — rejected as extra calls and UI well beyond the request.

## Risks / Trade-offs

- [TMDB outage or rate limiting breaks search and rating saves] → cache, `withTimeout`, and surface a clear error state; rating save fails closed with no catalog row.
- [Re-keying `genres` changes ids used by existing rows] → the dataset is developer-seeded and truncated/reseeded deterministically; document the reseed step.
- [Removing per-episode support breaks existing series records/tests] → update the seed to whole-series ratings and remove/replace per-episode tests as part of the change.
- [Server-only token leaking to the client] → the token is read only inside the catalog module from the fail-fast env; never expose it through a `NEXT_PUBLIC_*` variable.
- [Popular/trending tiles now depend on a live TMDB call on Home] → use a cached popular/trending request with a graceful fallback to the recent-activity area.

## Migration Plan

1. Add `TMDB_ACCESS_TOKEN` to env schema, `.env.example`, and `verify-env`; add the `media.director` migration and re-key `genres` by TMDB id.
2. Land the catalog module and update the rating write path and seed; re-run `npm run db:seed` to reseed with real TMDB ids.
3. Switch search, detail, and the add-rating modals to the catalog module; remove the demo catalog and per-episode code last.
4. Rollback: revert the page/endpoint changes; because the seed is deterministic and the demo catalog stays in history, reverting the migration and reseeding restores the prior state without data migration.

## Open Questions

- Whether Home's "popular" tiles use TMDB `/trending` or `/movie/popular`; either satisfies the Home requirement and can be chosen during implementation.
