## 1. Remove shell prefetching

- [x] 1.1 Remove the idle warm-up from `src/components/layout/nav-links.tsx`: delete the `useEffect` warm-up, the `scheduleIdle` helper, and the `warmedHrefs` set. **Verify:** `Select-String` for `requestIdleCallback|warmedHrefs|scheduleIdle` over `src` finds nothing; `npm run typecheck` passes.
- [x] 1.2 Remove the `onPointerEnter` and `onFocus` prefetch handlers from the shell links, keeping `prefetch={false}` so activation is the only request. **Verify:** `src/components/layout/nav-links.tsx` no longer imports or calls `useRouter(...).prefetch`; `npm run lint` passes.
- [x] 1.3 Update the navigation unit tests: rewrite `tests/unit/nav-prefetch.test.tsx` so hover, focus, and activation assert that `prefetch` is never called while the catalog-card assertion stays; delete `tests/unit/nav-idle-warm.test.tsx` or replace it with an assertion that idle timers issue no prefetch. **Verify:** `npm test` passes.

## 2. Browser cache policy for reads

- [x] 2.1 Add `Cache-Control: private, max-age=3600` to `/api/search` and `/api/catalog/detail` responses. **Verify:** route tests assert the header on a successful read; `npm test` passes.
- [x] 2.2 Add `Cache-Control: private, max-age=30` to `/api/feed`, `/api/records`, and `/api/watchlist` responses. **Verify:** route tests assert the header on a successful read; `npm test` passes.
- [x] 2.3 Confirm no read response is marked `public` or `s-maxage` and that mutation responses carry no cache policy change. **Verify:** test or review of the response helper shows only `private` policies on GET reads.

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, and `npm run test:integration`. **Verify:** all commands complete without errors.
      Results: `lint` 0 errors (2 pre-existing `no-img-element` warnings), `typecheck` clean, `deps:check` no violations (251 modules), `test` 657/657, `test:integration` 173/173.
- [ ] 3.2 After deploying to the stand, check DevTools with the `_rsc` filter: hovering over or focusing a shell link issues no request, an activation issues exactly one, and repeating a search within an hour is served without a server request. **Verify:** counts recorded in this task.
- [x] 3.3 Confirm archive order before this change is archived: `runtime-cost-trims` first (same navigation requirement), `static-shell` before the `platform/http-contract` delta merges. **Verify:** order recorded in this task.
      Recorded order: `runtime-cost-trims` → `static-shell` → `nav-prefetch-dedup`. Confirmed against the deltas: `runtime-cost-trims` carries a `ui/navigation` delta (same capability as this change, currently 15/16 — its stand check 8.2 is still open), and `static-shell` carries a `platform/http-contract` delta (same capability as this change's read-cache requirement, currently 22/24 — tasks 7.2/7.3 still open). Archive neither dependent change before its deltas are reconciled with this one.
