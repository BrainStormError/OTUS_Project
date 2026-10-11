## 1. Genre sync script and deploy step

- [ ] 1.1 Add `scripts/sync-genres.cjs` (CommonJS, Node 22 global `fetch`, `pg`): fetch `/genre/movie/list` and `/genre/tv/list` with `language=ru-RU`, then `INSERT INTO genres (id, name) ... ON CONFLICT (id) DO UPDATE SET name = excluded.name`, skipping and logging any row that violates `UNIQUE(name)`; verify by running it against the dev database and checking `SELECT count(*) FROM genres` grows/settles and a second run leaves the count unchanged
- [ ] 1.2 Add `"db:sync-genres": "node --env-file-if-exists=.env scripts/sync-genres.cjs"` to `package.json`; verify `npm run db:sync-genres` runs and populates the table
- [ ] 1.3 In `Dockerfile`, install `pg` in the migrator deps stage and `COPY scripts/sync-genres.cjs` into the migrator image; verify `docker build --target migrator .` succeeds and the script is present in the image
- [ ] 1.4 In `scripts/deploy.sh`, add a guarded sync step after migrate that runs the migrator image with a command override (`node scripts/sync-genres.cjs`) forwarding `DATABASE_URL` and `TMDB_ACCESS_TOKEN`, so a non-zero exit warns and continues; verify `DRY_RUN=1` prints the step and that forcing a sync failure still reaches the `up` step without triggering rollback

## 2. Catalog repository and service

- [x] 2.1 Add `listGenres()` to `src/modules/catalog/repository.ts` returning `{ id, name }[]` ordered by name; verify with a query test returning seeded rows
- [x] 2.2 In `src/modules/catalog/service.ts`, resolve genre ids to names from the stored catalog for search results instead of the live TMDB genre call, falling back to the raw id when a name is unknown; verify a search returns localized names and still succeeds when the TMDB genre endpoint is unavailable

## 3. Genres endpoint

- [x] 3.1 Add `GET /api/genres` (`src/app/api/genres/route.ts`) using `withRoute` and `getActor`, returning the stored genres sorted by name; verify the response contains the seeded genres with id and name

## 4. Search semantics and modal fix

- [x] 4.1 In `src/modules/catalog/client.ts`, join `with_genres` ids with `|` so multiple genres match any value; verify a multi-genre discover search returns titles matching any selected genre
- [x] 4.2 In `AddRecordModal.tsx`, send the selected genre ids as the `genre` query param to `/api/search` and remove the local filter that compared ids against genre names; verify selecting a genre returns matching catalog items instead of an empty list

## 5. Wire genre options to the catalog

- [x] 5.1 In `HomeView.tsx`, load genre options from `/api/genres` (keeping year options derived as today); verify the genre filter offers the full catalog, not only genres in the popular results
- [x] 5.2 In `AddRecordModal.tsx`, load genre options from `/api/genres`; verify the offered options stay the full catalog after a search changes the result set

## 6. Verification

- [x] 6.1 Update unit/integration tests so genre options come from the stored catalog and multi-genre matching is OR, using the seeded `genres` table as the fixture; verify `npm test` passes
- [x] 6.2 Run `npm run lint`, `npm run typecheck`, and `npm test`; verify all pass
- [ ] 6.3 Walk Home and My Films with the dev seed: open the genre filter, confirm the full list appears, select several genres and confirm OR results, and confirm the add-record modal filters by genre; verify against the running app
