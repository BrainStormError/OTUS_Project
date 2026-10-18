## 1. Client route reuse

- [x] 1.1 Remove `prefetch={false}` from the seven shell navigation links in `src/components/layout/nav-links.tsx` (default prefetch intent only, never `prefetch={true}`) and verify a unit test asserts shell links pass no prefetch prop while card, list-row, and menu links still pass `prefetch={false}`
- [x] 1.2 Raise `experimental.staleTimes` to the maximum window (one year, static and dynamic, aligned with the flight policy) in `next.config.js` and verify `npm run build` succeeds and a served response advertises the window (`x-nextjs-stale-time: 31536000`)

## 2. Navigation payload cache policy

- [x] 2.1 Serve flight responses (`_rsc` / `RSC`-header requests) as `private, max-age=31536000` and the HTML document as `private, no-cache` from `src/proxy.ts`, skipping public paths and static assets, and verify header tests assert both values per response class on a running build (apply the `headers()` fallback from design decision 5 if middleware response headers do not override the built-in policy)
- [x] 2.2 Verify read responses keep their own policy (`private, max-age=...` per data class) and `/_next/static` keeps `public, max-age=31536000, immutable` — covered by header tests that fail if the proxy overwrites them

## 3. Deployment cache clear

- [x] 3.1 Add the build-marker cookie flow to `src/proxy.ts` (build id read once at startup from the runtime output) and verify unit tests: marker mismatch -> response carries `Clear-Site-Data: "cache"` and refreshes the marker; marker match -> no directive; the directive never contains `storage`
- [x] 3.2 Verify the theme preference survives a cache clear (test asserting the clear targets only the HTTP cache and `localStorage` handling is untouched)

## 4. Navigation behavior tests

- [x] 4.1 Update the `nav-prefetch-dedup` navigation tests: visible shell links prefetch their destination at most once per freshness window, activating a prefetched shell link issues no request, and title cards still do not prefetch (matches the `ui/navigation` delta)
- [x] 4.2 Add end-to-end coverage: revisiting a section inside a session issues no navigation request, and repeating a navigation after a reload is served from the browser cache without reaching the server

## 5. Full verification

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:integration` and verify all pass
- [x] 5.2 On a production build, verify manually: tab changes issue no `_rsc` on revisits; reload plus repeat navigation shows disk-cache responses in the network log; a response with a mismatched build marker clears the browser HTTP cache exactly once
