## Context

See proposal.md - Why. Current state:

- Personal screens fetch their reads on mount through `useApi` / `useApiAll`, which start a `loading` state and issue a `fetch` each time the screen mounts.
- `records-store.ts` and `watchlist-store.ts` already hold optimistic mutation state and reconcile server data into it (`handle.reconcile(...)`, `useReconcileOnSignature`), so the store is already the source of truth for rendering.
- Mutations call `router.refresh()` in eighteen places, each asking the server to render the document again.
- Most `Link`s outside the navigation shell do not set `prefetch`, so Next.js prefetches them in production when they enter the viewport.
- `read-cache-invalidation` adds a single invalidation helper plus signals; this change consumes them instead of inventing a second refresh path.

## Goals / Non-Goals

**Goals:**

- Zero read requests when moving between personal sections after the first load.
- No server document render per mutation.
- No destination reads caused by displaying or hovering lists and chrome.
- A defined loading and failure behavior for a store-first screen.

**Non-Goals:**

- Changing the static-shell document strategy or the browser cache policy.
- Caching or storing multi-author data (feed, group details, discussions) - those stay live.
- Splitting the records endpoint by media kind.

## Decisions

### 1. One session loader in the application shell, feeding a generic read store

The shell loads the signed-in user's data once per cold start - identity, records, watch-later list for both kinds, friends list, groups list, and settings - and hydrates a generic store keyed by resource. Screens subscribe to the store and render; they no longer fetch on mount. The existing list stores keep owning mutation state and reconciling loaded data.

**Alternatives:** keeping per-mount `useApi` and relying on the browser cache was rejected - each mount still performs a fetch call, enters a loading state, and re-renders, which is exactly the per-navigation work this change removes. A data library (SWR/React Query) was rejected - a new dependency for a small, closed set of reads.

### 2. Mutations refresh through the invalidation helper, not `router.refresh()`

After a successful mutation the store already reflects the change and the invalidation helper reloads the affected reads. `router.refresh()` is removed at each of the eighteen sites unless review shows a server-rendered value the screen genuinely needs; none is expected, because documents are static shells.

**Risk control:** removal is site-by-site with the flow's test or manual check, and the e2e mutation flows remain the guard.

### 3. Per-link `prefetch={false}` for chrome and list links

Next.js has no global switch for link prefetching, so every link outside the navigation shell gets `prefetch={false}`: the top-bar brand, both account-menu links, the shell back links (film, series, group, group admin), cards (group, title), list rows (friend, watch-list), feed items, profile and record views, the statistics page link, and the group-admin link. A grep for `<Link` verifies the inventory; a test asserts that hovering and rendering lists issues no prefetch.

**Alternative:** leaving defaults and relying on the browser cache - rejected: prefetch requests still reach the server and render the document, the exact cost being removed.

### 4. Loading and failure behavior

Cold start shows the existing loading state until the session load completes. Later navigation renders from the store with no placeholder. A failed resource surfaces an error with a retry on the screen that needs it; one failed resource does not blank unrelated sections.

## Risks / Trade-offs

- [Stale store because an invalidation path was missed] -> the invalidation helper and signals from `read-cache-invalidation` are the only refresh path; the `records-freshness` end-to-end test guards the behavior.
- [Removing `router.refresh()` breaks a flow that relied on the server render] -> site-by-site review, keep the call where a flow needs it, and cover mutations with the existing end-to-end flows.
- [A link is missed in the prefetch inventory] -> grep check over `<Link` plus the no-prefetch test.
- [Larger client memory footprint] -> the stored set is the user's own lists, bounded by the existing page limits; no unbounded accumulation across sessions.
- [First click on a list item is not pre-warmed] -> accepted, consistent with the shell-link decision in `nav-prefetch-dedup`.

## Migration Plan

Client-only change: no schema, data, or server migration. Deploy the application; rollback is a code revert. The session loader starts on the next page load, so no cache priming is required.
