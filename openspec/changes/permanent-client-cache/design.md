## Context

See proposal.md - Why. Current state that shapes the design:

- All pages are statically prerendered (`compute: static`); screens fetch their
  data client-side through the read store, so a navigation payload is a data-free
  shell.
- The client route cache (Next 16 segment cache) stores a reusable route entry
  only when the route tree arrives with fresh prefetch hints. The build-time
  flight payloads carry the `InliningHintsStale` bit, so a lazy navigation
  creates an entry that expires immediately (`staleAt = -1`) - every tab change
  therefore re-fetches `?_rsc` forever. Per-segment prefetch payloads carry
  fresh hints and an explicit `staleTime`, which is the only path that produces
  a durable entry.
- Documents and flight responses are served `Cache-Control: s-maxage=31536000`;
  browsers ignore `s-maxage` (shared-cache directive) and Caddy does not cache,
  so nothing stores them. Documents carry an ETag and the standalone server
  answers `304 Not Modified` to a matching `If-None-Match` (verified); flight
  responses carry no validator at all.
- `src/proxy.ts` already wraps every response (CSP) and reads build artifacts at
  startup (the csp-hashes pattern); the build id is available in the runtime
  output (`.next/BUILD_ID`).
- Reads already have their own policy and invalidation; the cold start already
  reloads personal reads with `cache: 'reload'`, so losing cached reads costs
  nothing extra.

## Goals / Non-Goals

**Goals:**

- Revisiting a route costs the server nothing: within a session from memory,
  across reloads from the browser disk cache.
- A new build can never serve a stale payload to a client that loads the
  document.
- The remaining recurring server work is read loading, mutations, and one
  conditional document check per application open.

**Non-Goals:**

- Changing read caching or invalidation (owned by `read-cache-invalidation`).
- Keeping a tab that was left open across a deployment working without a manual
  reload (accepted F5).
- Any caching in shared caches (CDN, proxy) - everything stays `private`.

## Decisions

### 1. Shell links use the framework's default prefetch; everything else keeps `prefetch={false}`

Removing `prefetch={false}` from the seven shell links restores the `auto`
intent, which resolves to per-segment prefetching - the payload with fresh hints
that makes the route cache work. `prefetch={true}` is explicitly not used: its
`Full` strategy returns the same stale-hint payload a lazy navigation gets, and
the immediate-expiry loop would survive the change. Cards, list rows, and menu
entries keep `prefetch={false}`; the custom idle warm-up that caused the old
prefetch storm stays removed.

**Alternative:** include the build id in the `_rsc` cache key so the browser
cache self-invalidates on deploy - rejected for now: the hash is computed on the
client and re-validated on the server inside Next internals with no hook, so it
needs a two-sided patch of the framework kept alive across upgrades; a
one-sided patch forces a 307 redirect on every navigation. Revisit if Next
exposes the cache key.

### 2. Long client cache windows; the flight payload is a build artifact

`staleTimes` (static and dynamic) rises to the maximum window - one year,
aligned with the flight policy - since the in-memory entry should never expire
within a session. Flight responses are served
`private, max-age=31536000`: the payload is a data-free shell whose staleness
cannot mislead the user (all data comes from the read layer), and build changes
are handled by decision 4 instead of by a short window. Short windows were
rejected: they re-download unchanged payloads on a schedule, which is the load
this change removes.

### 3. The document is revalidated every use (variant chosen over long caching)

The document is served `private, no-cache` and revalidated through its existing
ETag: one conditional request per open, answered `304` without a body, and a
stale document - whose markup references deleted chunk URLs - can never render.

**Alternative:** cache the document long and rely on `Clear-Site-Data` - rejected
because browsers without `Clear-Site-Data` support (Safari) would serve a broken
page until a manual reload; the document is the one response where staleness
breaks the application rather than degrading a transition.

### 4. Deployment clears the HTTP cache once per client via `Clear-Site-Data`

`proxy.ts` compares a build-marker cookie against the running build id (read
once at startup, like csp-hashes) and, on mismatch, sets
`Clear-Site-Data: "cache"` on the response and refreshes the marker. Only
`"cache"` is used - `"storage"` would wipe the theme preference in
`localStorage`. The clear reaches cached flight payloads and cached reads; the
reads are already reloaded on cold start, so only the navigation payloads are
actually lost.

### 5. Headers are declared in `headers()`, not in the proxy (fallback taken)

Document and flight responses share the same path and differ only by the `RSC`
request header or the `_rsc` query parameter. Verified on a running build: this
Next version strips both the `RSC` header and the `_rsc` parameter from the
request the proxy sees, so the proxy cannot split the two classes; a proxy-set
header also wins over a `headers()` rule for the same key. The primary
"set the policy in the proxy" plan is therefore not viable, and the planned
fallback is used instead: two `headers()` rules - the document policy
(`private, no-cache`) where `_rsc` is **missing**, and the flight policy
(`private, max-age=31536000`) where `_rsc` is **present**. `headers()` still
matches on `_rsc` and its value is applied to the served response (verified on
the build for both classes). The rules exclude `api/` and `_next/` so the read
policy and immutable asset headers stay untouched. The proxy keeps only the CSP,
the session guard, and the build marker.

## Risks / Trade-offs

- [Prefetch returns to the shell] -> bounded by design: viewport-only, at most
  once per freshness window per link; the removed warm-up/hover/focus storm was
  custom code and stays removed.
- [Middleware response headers do not override the built-in `s-maxage`] ->
  resolved: the built-in policy *is* overridden, but only by `headers()` (a
  proxy-set header wins over it, and the proxy cannot see the flight markers).
  Decision 5 uses the `headers()` fallback.
- [Browsers without `Clear-Site-Data` (Safari)] -> documents stay safe
  everywhere by decision 3; only flight payloads can go stale there, degrading
  to a hard navigation or one F5 - accepted in the proposal.
- [A tab kept open across a deployment] -> a navigation may hit deleted chunk
  URLs and need one manual reload - accepted in the proposal.
- [Deploy burst: every client re-downloads once] -> accepted; the burst is
  static file serving, and it replaces an indefinite trickle of render work.
- [24h in-memory window serves older shell markup inside a session] -> shells
  carry no user data; data freshness belongs to the read layer and its
  invalidation.
- [Archive ordering: this delta modifies a requirement that `store-backed-views`
  also modifies] -> archive `store-backed-views` first (or supersede its delta),
  as with `read-cache-invalidation`.

## Migration Plan

1. Ship proxy marker + response headers + `staleTimes` + shell-link prefetch in
   one image - they are one contract and each alone leaves a gap.
2. No database or API change.
3. Rollback: the previous image restores the shared-cache policy and disabled
   prefetch; clients that already saw `Clear-Site-Data` simply re-download once.

## Open Questions

(none)
