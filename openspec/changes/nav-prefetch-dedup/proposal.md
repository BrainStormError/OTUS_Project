## Why

The navigation shell issues up to ten RSC payload requests for a single section visit: an idle warm-up prefetches all seven sections on every full load, hover and focus each prefetch the same link again, and the activation adds its own request. On the single-vCPU host shared by two users that redundant server rendering is the remaining per-navigation cost. Read responses also carry no browser cache policy, so returning to a section or repeating a search re-renders and re-serializes data that has not changed.

## What Changes

- **Shell links stop prefetching entirely.** The idle warm-up effect and the `onPointerEnter`/`onFocus` handlers are removed from the navigation links; `prefetch={false}` stays. An activation becomes the only request a section navigation makes.
- **Read responses declare a browser cache policy.** TMDB-derived reads (`/api/search`, `/api/catalog/detail`) are served with `Cache-Control: private, max-age=3600`; personal reads (`/api/feed`, `/api/records`, `/api/watchlist`) with `Cache-Control: private, max-age=30`. Repeat views within the policy window never reach the server.
- **Not changing:** link targets and the section set, the route freshness window (`staleTimes`), catalog cards (they already do not prefetch), and the server-side TMDB response cache.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ui/navigation`: the "Shell links prefetch their destination" requirement changes — shell links no longer prefetch on hover, focus, or idle time; activation is the only request. Card grids still do not prefetch.
- `platform/http-contract`: adds a requirement that authorized read responses carry a browser cache policy sized per data class, so unchanged data is not re-rendered and re-serialized on repeat views.

## Impact

- **Code:** `src/components/layout/nav-links.tsx`; routes `src/app/api/search/route.ts`, `src/app/api/catalog/detail/route.ts`, `src/app/api/feed/route.ts`, `src/app/api/records/route.ts`, `src/app/api/watchlist/route.ts`.
- **Tests:** unit tests asserting navigation links no longer call `router.prefetch`; route tests asserting the `Cache-Control` header per data class.
- **Behavior:** the first activation after a full load is no longer prepared ahead of time (a normal navigation request runs); repeated views are served from the browser cache within the policy window — up to an hour for TMDB data, 30 seconds for personal data.
- **Coordination:** `runtime-cost-trims` modifies the same navigation requirement and must be archived first (or its delta is superseded here); `static-shell` adds read-contract requirements to the same `platform/http-contract` capability. The application heap bound (`NODE_OPTIONS` 256 -> 320 MB) is recorded in `budget-revision`, not in this change.
