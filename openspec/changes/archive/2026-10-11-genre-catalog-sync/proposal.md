## Why

Genre search is fragile and incomplete. The genre dropdown is derived from a single page of "popular" TMDB results, so most genres can never be chosen; the local `genres` table is only a save-time whitelist and is never surfaced; genre names depend on a live TMDB genre call that can fail the whole search; and a multi-genre search is effectively AND even though the requirement is OR. Storing the full genre set locally removes the single-page limitation and the live-dependency, and gives prod and tests one deterministic source.

## What Changes

- Add a deploy-time sync that fetches all film and TV genres from TMDB and upserts them into the existing `genres` table, reusing the current HTTP client and the `pg` script pattern.
- Run the sync as a step in the deploy flow after migrations, best-effort: a failed sync warns and does not fail the deploy, because the table is already populated.
- Serve the stored genres to the client (new read-only endpoint) and use them as the source of genre options and names on Home and in the add-record modal, replacing derivation from a single popular page.
- Make multi-value genre search OR semantics (TMDB `with_genres` joined with `|`), matching the "matches any selected value" requirement.
- Fix the add-record modal to filter results by genre ids rather than by genre names.
- Treat the `genres` table as the single genre catalog for both production and tests; the seed becomes the offline fixture.

## Capabilities

### New Capabilities
- `catalog/genres`: the genre catalog — sync all film and TV genres from TMDB into local storage, expose them, and use them as the source of genre options, names, and search matching.

### Modified Capabilities
<!-- None: the screen requirement already mandates catalog-wide genre options and any-value (OR) matching; this change fixes the implementation to satisfy it, so no screen requirement changes. -->

## Impact

- Scripts and deploy: `scripts/sync-genres.ts` (new), `package.json` (`db:sync-genres`), `scripts/deploy.sh` (sync step after migrate, forwarding `TMDB_ACCESS_TOKEN`).
- Catalog module: `src/modules/catalog/client.ts` (`with_genres` separator), `repository.ts` (list genres), `service.ts`, `domain.ts`.
- API: new `src/app/api/genres/route.ts`.
- Screens/features: `HomeView.tsx`, `AddRecordModal.tsx` (genre options source and id-based filtering).
- Data: existing `genres` table (`..._media_and_genres.sql`) is reused unchanged; no new migration.
- No new dependencies.
