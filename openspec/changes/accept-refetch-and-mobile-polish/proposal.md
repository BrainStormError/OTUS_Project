## Why

After a user accepts a friend request or a group invitation, the UI does not
reflect the new relationship everywhere: an accepted group never appears in the
user's group list until a full page reload, and the dedicated friend-requests
screen gives no feedback and never refreshes. Separately, the sign-in screen is
not horizontally centered on wide viewports, and two mobile tab-bar labels are
left-aligned when they wrap onto a second line.

## What Changes

- Accepting a group invitation immediately shows the group in the user's group
  list and removes the invitation, without a manual reload.
- Accepting an incoming friend request refreshes the friends data so the new
  friend is visible and the pending count is consistent, including on the
  dedicated requests screen, which also gains success/failure feedback.
- The sign-in screen is horizontally centered on large viewports.
- Labels on the mobile bottom tab bar are centered when they wrap to a second
  line.
- Phone responsiveness is verified across the shell and key screens; fixes are
  applied only where a concrete defect is found.

## Capabilities

### New Capabilities
<!-- None: all behavior changes fall under existing capabilities. -->

### Modified Capabilities
- `groups/invitations`: accepting an invitation makes the group visible in the user's group list immediately, without a page reload.
- `social/user-search`: accepting an incoming friend request refreshes the friends view so the new friend and the pending-request count are consistent.
- `ui/screens`: the sign-in screen is horizontally centered within the viewport on large and small screens.
- `ui/navigation`: mobile bottom tab-bar labels are centered when they wrap.

## Impact

- UI components: `FriendsView`, `FriendRequestsView`, `GroupInvitations`, `GroupsView`, the sign-in page, and the shared navigation links.
- No API, database, or dependency changes.
- No breaking changes.
- Out of scope: items 1–4 of the original review list.
