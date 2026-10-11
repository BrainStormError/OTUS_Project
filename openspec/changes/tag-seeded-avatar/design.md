## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- Identity is rendered as plain text plus a `UserRound` placeholder icon in `EditableIdentity` (own profile), `ProfileView` (other profile), and `FriendListItem` (also used by `FriendRequestItem`); the top-bar `AccountMenu` shows text only, and `AdminMemberPanel` renders its own name/handle rows.
- `PublicUser.avatarUrl` exists but is never written or read.
- Every account has a non-null, unique tag: `deriveHandle` (`src/modules/auth/repository.ts`) generates one from the email when absent, and `users.handle` uniqueness is enforced. The tag therefore works as a stable per-user seed with no collisions between users.
- Headless surfaces already carry the tag alongside the name (activity `actorHandle`, discussions `authorHandle`, ratings `handle`), so no data plumbing is needed.
- Layering rule (`platform/architecture-boundaries`): `components/ui` MUST NOT import `modules`. The avatar must be a pure presentational primitive that receives the seed as a prop.
- The session cookie is `httpOnly` with a 30-day max age; client code cannot read it, so a client cache cannot be tied to the cookie's expiry directly.

## Goals / Non-Goals

**Goals:**
- One shared `Avatar` primitive, seeded by the tag, that looks identical for a user on every surface, device, and session.
- Zero server storage and zero network for the avatar; all work happens in the browser.
- Negligible client cost even in long lists.

**Non-Goals:**
- No upload, storage, moderation, or persistence of avatar images.
- No randomness that would need to be remembered (a stored nonce/seed).
- Not rolling the avatar into dense activity/discussion/rating rows; display is limited to identity surfaces (see `specs/ui/avatar/spec.md`).

## Decisions

### 1. Visual: gradient blob from overlapping radial gradients

A circular SVG built from a base tone plus two soft color spots positioned and sized from the seed:

```
<svg viewBox="0 0 64 64">
  <clipPath id=uniq><circle cx=32 cy=32 r=32/></clipPath>
  <g clip-path="url(#uniq)">
    <rect fill="hsl(h1)"/>                              base tone
    <circle cx=x1 cy=y1 r=r1 fill="url(#g2)"/>           spot 2 (radial, transparent edge)
    <circle cx=x2 cy=y2 r=r2 fill="url(#g3)"/>           spot 3 (radial, transparent edge)
  </g>
</svg>
```

Spots use radial gradients that fade to transparent, so colors blend without any `filter`/`feTurbulence`, keeping it cheap on long lists.

- Alternatives considered: a pixel identicon (more "readable" but visually busy and slower to recognize as a person); an initial letter on a flat color (simplest, but only 26 + palette states and reads as a label, not a person); `feTurbulence`-displaced blob (heavier per element); DiceBear or Gravatar (a dependency, or a third-party network request — rejected for both).
- Palette tension: `ui/design-system` forbids gradients and acid colors on the **fill of a primary action**. The avatar is a decorative, non-interactive element, so a gradient is compliant; to stay in the matte spirit, HSL saturation and lightness are constrained to a soft range rather than the full color wheel.

### 2. Seed: the tag, with a stable identifier fallback

The seed is the user's tag. Where a tag can be absent (`Actor.handle` is typed nullable), the caller passes the already-established stable fallback used by that module (`String(id)`), so the avatar never changes for a given account.

- Alternatives: the display name (mutable, not unique, collides visually); the email (private, must not be used as a render seed); a UUID (no need — the tag is already unique and stored).

### 3. Deterministic pure function plus a client wrapper with in-memory memoization

- A pure generator derives the blob's parameters from the seed using integer-only math (a rolling hash in the style of `deriveHandle`, then a small seeded PRNG such as mulberry32 built on `Math.imul`/shifts) so results are deterministic across engines. No `Math.random`.
- The component memoizes the derived **parameters** in a module-level `Map<seed, params>`. Each instance renders its SVG with a unique id from React `useId`, so repeated avatars never collide on `clipPath`/gradient ids in the DOM.
- Nothing is persisted. The map lives only in the tab's memory and is gone on reload, which is exactly the "until the cookie expires or the user signs out" boundary.

- Alternatives considered: `localStorage` or a readable companion cookie holding a seed (adds persistence the requirement explicitly rules out); the Cache API/IndexedDB (storage and complexity for no gain — the function is microseconds); server-side rendering of the same SVG (would remove the one-frame placeholder, but the requirement is explicit that generation happens in the browser; the generator stays a pure function so this remains a trivial future option).

### 4. Component boundary and API

- New primitive at `src/components/ui/avatar.tsx`: a `'use client'` component taking `seed` (string), a `size`, and an optional `label`. No import from `modules`.
- Sizes come from context: roughly 32px (top bar), 40px (list items), 64px (profiles). One visual, scaled.
- Reused by `AccountMenu`, `EditableIdentity`, `ProfileView`, `FriendListItem` (and thus `FriendRequestItem`), and `AdminMemberPanel`; the placeholder `UserRound` is removed from those spots.

### 5. Accessibility

Decorative when the same user's name/tag sits in the same element (`aria-hidden`); when standalone it is `role="img"` with an `aria-label` naming the user.

## Risks / Trade-offs

- Duplicate SVG `defs` ids across many inline avatars -> use a unique id per instance (`useId`), memoize only the numeric parameters.
- First-paint placeholder then swap (client-only generation) -> reserve the avatar's box so there is no layout shift; keep the neutral placeholder circle visually close to the blob's size.
- Gradient reads as off-brand against the matte system -> constrain saturation/lightness; avatar stays decorative and never becomes a primary action.
- Determinism drift if floating point is used -> keep derivation to integer math only.
- Very long lists -> cost is a hash plus a map lookup per item after the first; negligible.

## Migration Plan

Additive UI change plus removal of one dead field. No database or API change, no dependency change, no feature flag. Deploy by shipping the component and wiring the surfaces; roll back by reverting the front-end files. Existing accounts automatically get an avatar from their current tag.

## Open Questions

- Exact aesthetic tuning (number of spots, saturation/lightness ranges, default size scale) can be settled during implementation without affecting the specs or the approach.
