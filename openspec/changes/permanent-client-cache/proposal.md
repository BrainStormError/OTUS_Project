## Why

Navigation still reaches the server on every section change. Two gaps keep the
client from reusing anything: route-cache entries expire immediately (the
build-time flight payloads carry stale inlining hints, so the router never
stores a reusable entry), and navigation payloads are served with a shared-cache
policy (`s-maxage`) that browsers ignore. On the starved single-CPU host each of
these requests costs seconds; repeated navigation should cost the server
nothing.

## What Changes

- **Shell links restore Next's default viewport prefetch.** `prefetch={false}`
  is removed from the seven shell navigation links (and only from them), so the
  client receives per-segment payloads with valid freshness hints and can cache
  a route. Card, list-row, and menu links keep `prefetch={false}`; hover and
  focus must not trigger prefetches of their own.
- **The client route cache window grows from five minutes to a full day.**
  `staleTimes` for both static and dynamic routes is raised so a visited route
  stays reusable for an entire session instead of being re-fetched per click.
- **Navigation payloads become browser-cacheable.** Flight (`_rsc`) responses
  are served `private, max-age=31536000`, so a repeated navigation edge is
  served from the browser disk cache across page reloads. The HTML document is
  served `private, no-cache` and is revalidated on every use through its
  existing ETag, so it can never be stale. Both stay private: no shared cache
  may store them.
- **A deployment clears the client's HTTP cache exactly once.** The proxy
  compares a build-marker cookie against the running build and, on mismatch,
  answers with `Clear-Site-Data: "cache"` (never `"storage"` — the theme lives
  in `localStorage`) and refreshes the marker. A new build can therefore never
  meet a stale cached payload.
- **Accepted fallback:** a tab kept open across a deployment, or a browser
  without `Clear-Site-Data` support, may need one manual reload (F5). This is a
  documented acceptance, not a defect to fix here.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ui/navigation`: the "Navigation shell links SHALL NOT prefetch their
  destinations" requirement changes — shell links prefetch their destination
  once per freshness window via the framework's viewport prefetch, while
  non-shell links (cards, list rows, menus) must not prefetch; and the "Moving
  between sections SHALL reuse ... a short freshness window" requirement moves
  to long-lived cached navigation that survives revisits within the session and
  is invalidated by a deployment.
- `platform/http-contract`: adds a cache policy for navigation payloads
  (documents revalidated every use via ETag; flight responses cacheable for a
  long time) and a requirement that a deployment clears the browser HTTP cache
  once per client.

## Impact

- **Code:** `next.config.js` (`staleTimes`, response headers for documents and
  flight payloads); `src/proxy.ts` (build-marker cookie, `Clear-Site-Data`
  response); `src/components/layout/nav-links.tsx` (drop `prefetch={false}` on
  shell links).
- **Tests:** header assertions per response class (document, flight, reads);
  proxy tests for the build-marker cookie and the `Clear-Site-Data` response;
  navigation tests updated to expect shell-link prefetch and to keep card links
  non-prefetching (the `nav-prefetch-dedup` assertions are reversed for shell
  links only).
- **Behavior:** navigation between visited sections no longer issues a request;
  a repeated navigation edge after a reload is served from the browser cache;
  after a deployment the client pays one cache-clear and re-download instead of
  serving stale payloads.
- **Coordination:** the navigation-reuse delta modifies a requirement that
  `store-backed-views` also modifies and which is not yet archived — archive
  `store-backed-views` first (or supersede its delta). `read-cache-invalidation`
  leaves the read-response policy untouched; its requirement text is the base
  for the new navigation-payload policy.
