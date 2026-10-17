## Context

See proposal.md for motivation. The relevant current state:

- Shell links live in one client component (`nav-links.tsx`) shared by the desktop rail and the mobile tab bar. Both render `Link` with `prefetch={false}`; on top of that, a module-level `warmedHrefs` set plus `requestIdleCallback` warms every destination on mount, and `onPointerEnter`/`onFocus` prefetch the same destination again.
- The app runs Next.js App Router with no `loading.tsx` anywhere. Without one, a prefetch stores only a partial payload, so an activation always issues its own RSC request in addition to the prefetches.
- Since `static-shell`, documents are static shells and screen data arrives through authorized read requests (`/api/*`, all `force-dynamic`, all `withRoute`). The actor lookup behind every read is already cached in-process for 60 s by `runtime-cost-trims`.
- The host is one vCPU. Every read request that can be avoided is a direct CPU saving.

## Goals / Non-Goals

**Goals:**

- One request per section navigation on the shell links.
- Repeat reads of unchanged data served by the browser without reaching the server.
- No change to link targets, section set, screen behavior, or data freshness beyond the stated cache windows.

**Non-Goals:**

- Reworking the static-shell/read-contract architecture.
- Adding `loading.tsx` skeletons.
- Changing the server-side TMDB cache, Postgres settings, or the application heap bound (the heap change is tracked in `budget-revision`).
- Offloading static assets or compression to the reverse proxy.

## Decisions

**1. Remove prefetching entirely instead of deduplicating it.**
Alternatives considered: a TTL guard around `router.prefetch`, or keeping only hover prefetch. Rejected because the idle warm-up alone renders all seven destinations on every full load, and hover/focus merely duplicate it; deduplication would preserve the dominant cost while adding bookkeeping. Full removal yields a simple contract — activation is the only request — and the trade-off (a first activation after a full load is not prepared in advance) is acceptable on this host.

**2. No `loading.tsx`.**
With prefetching gone, making prefetches "full" has no consumer. Skeletons would add visual noise and another failure surface without a request saving. Revisit only if navigation latency becomes a problem after the change.

**3. Cache windows by data class.**
Catalog reads (`/api/search`, `/api/catalog/detail`) are TMDB-derived and shared across users, so `private, max-age=3600` matches the existing `/api/genres` precedent. Personal reads (`/api/feed`, `/api/records`, `/api/watchlist`) get `private, max-age=30`: long enough to absorb back-and-forth navigation, short enough that the feed cannot drift visibly. `private` keeps shared caches (including the reverse proxy) from ever storing responses; no `public`, no `s-maxage`.

Alternatives: `no-store` for personal reads (rejected — it defeats the goal on repeat navigation); `Vary: Cookie` (unnecessary with `private`, and nothing in the stack caches by default).

**4. Header set in the route handlers, not in edge middleware.**
The policy sits next to the data class it describes, and middleware (which runs on every request) gains no extra work. The existing middleware keeps its current responsibilities.

**5. Mutation responses stay uncached.**
Only GET reads get the header; mutation behavior and the client store's post-mutation refresh are unchanged.

## Risks / Trade-offs

- [TMDB data may be up to one hour old in the browser] → The server-side TMDB cache already serves data up to six hours old; personal state (ratings, lists) is not in these responses and stays on the 30-second class.
- [Personal reads may be up to 30 seconds stale] → Mutation responses are uncached and the client store refreshes after each mutation, so the affected section updates immediately; cross-section freshness within 30 s is already the accepted behavior.
- [First activation after a full load is slower than before] → Accepted by design; measure after deploy. If it hurts, reintroduce hover-only prefetch behind a per-href TTL guard as a follow-up change.
- [Delta conflict: `runtime-cost-trims` modifies the same navigation requirement] → Archive `runtime-cost-trims` first, or merge its delta at archive time; this change replaces the prefetch requirement outright.
- [Delta overlap: `static-shell` adds requirements to `platform/http-contract`] → Both deltas add distinct requirements; apply `static-shell` first.

## Migration Plan

Deploy the application only; no schema, data, or dependency changes. Rollback is a code revert — the cache headers and handlers are additive, and removing them restores the previous behavior immediately. No cache priming or invalidation is needed: entries expire on their own within the stated windows.
