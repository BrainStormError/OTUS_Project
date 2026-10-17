# Proposal: store-backed-views

## Why

After prefetching was removed and single-author reads became browser-cacheable, navigation still performs work the client does not need to do: every personal screen fetches its reads on mount through `useApi`, and every successful mutation calls `router.refresh()`, which asks the server to render the document again. The client already keeps this data in its list stores - the screen should read the store, and the session should load the data once. On a single-CPU host every avoided fetch and every avoided server render is directly visible in navigation latency.

## What Changes

- **Personal data is loaded once per session.** A session-level loader in the application shell fetches the signed-in user's reads and feeds them into the client stores; personal screens render from the stores and stop fetching on mount, so moving between Home, My Films, My Series, and the profile issues no read request.
- **Mutations stop re-rendering the document.** The `router.refresh()` calls after successful mutations are removed where the store already reflects the change, leaving the read-invalidation helper as the only refresh path. No server render per mutation.
- **The remaining prefetching is removed.** Links that still rely on Next.js default prefetch - the top-bar brand, the account menu, shell back links, and the links inside lists and cards (friends, groups, watch-list rows, feed items) - get `prefetch={false}`. Hovering or displaying a list must not issue destination reads.
- **Loading and failure behavior is defined for a store-first screen.** The first cold start shows the loading state; later navigation shows data immediately; a failed load surfaces once with a retry instead of leaving a blank section.
- **Not changing:** the static-shell document strategy, the browser cache policy and invalidation from `read-cache-invalidation`, and the fetching behavior of multi-author surfaces (activity feed, group details, discussions), which stay live.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ui/navigation`: "Route navigation reuses loaded state" changes from a short freshness window to state loaded once per session and refreshed by mutations and invalidation signals; and adds a requirement that non-navigation links (chrome, cards, list rows) do not prefetch.

## Impact

- **Code:** the shell (`src/components/layout/app-shell.tsx`) gains the session loader and a generic read store; personal screens drop `useApi` for stored resources; the eighteen `router.refresh()` call sites are reviewed and trimmed; `prefetch={false}` is added to the links listed under What Changes.
- **Tests:** store hydration and read-from-store tests, a test that mutations no longer trigger a document refresh, and a test that hovering or rendering lists issues no prefetch.
- **Dependencies:** builds on `read-cache-invalidation` (invalidation helper and signals) and `nav-prefetch-dedup` (shell links already do not prefetch); it does not change their contracts.
