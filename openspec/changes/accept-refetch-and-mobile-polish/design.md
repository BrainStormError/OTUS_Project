## Context

See proposal.md — Why. The affected screens are client components that receive
server-loaded collections as props and keep them in `useState`:

- `GroupInvitations` holds invitations in local state and is rendered next to
  `GroupsView`, whose `groups` prop comes from the server component
  `groups/page.tsx`. Accepting an invitation currently mutates only the local
  invitation list, so the newly joined group never reaches `GroupsView`.
- `FriendsView` and `FriendRequestsView` update requests/friends in local state;
  neither asks the server for a fresh view after a decision.

The sign-in page and the mobile tab bar are pure layout issues.

## Goals / Non-Goals

**Goals:**
- Accepted friend requests and group invitations are reflected across the
  relevant views without a manual reload.
- Each accept/decline failure is surfaced and does not leave a phantom state.
- Sign-in form and wrapped mobile tab labels are centered.

**Non-Goals:**
- Introducing a client data-cache library (SWR/React Query) or global state.
- Changing API routes, server queries, or the database.
- Redesigning any screen beyond the two alignment fixes.

## Decisions

### Use `router.refresh()` after a successful decision

Next.js App Router `router.refresh()` re-runs the server components on the
current route and reconciles them with the existing client tree, keeping local
component state. This is the smallest change that makes server-derived data
(the group list, the friends list) current.

- Alternative: re-fetch each collection from `/api/...` inside the client.
  Rejected — more code, duplicates server-side query logic, and no benefit here.
- Alternative: a data-cache library. Rejected as over-engineering for two
  screens.

### Keep the optimistic local update, then reconcile

Existing components already remove the handled item locally (and
`FriendsView` adds the new friend optimistically). Keep that for immediacy,
call `router.refresh()` on success, and roll back local state on failure. Note
that `useState(initialProp)` does not re-initialize when the prop changes after
`router.refresh()`, which is desirable: the already-removed invitation/request
stays removed while the rest of the server data updates.

### Backfill feedback and rollback on the dedicated requests screen

`FriendRequestsView` currently fires the request without awaiting it, without
rollback, and without feedback. Bring it in line with `FriendsView`: await the
decision, show a toast, restore the item on failure, and refresh on success.

## Risks / Trade-offs

- [`router.refresh()` re-renders server components on the route, which may
  briefly show stale-then-updated data] -> Acceptable for a user-initiated
  action; local optimistic state hides the gap for the item the user acted on.
- [State initialized from props can diverge from refreshed props] -> Intentional
  here (removed items must not reappear); if a prop ever needs to re-seed the
  state, that must be handled explicitly.
- [Layout fixes are visually verifiable only in a browser] -> Verify with
  Playwright at phone and wide-desktop widths; phone adaptivity (proposal item
  7) is checked, and fixed only if a concrete defect appears.
