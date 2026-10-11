## 1. Group invitation refetch

- [x] 1.1 In `GroupInvitations`, call `router.refresh()` after a successful accept/decline and keep the existing rollback on failure; verify that accepting a group invitation makes the group appear in the "Группы" list on the same page without a manual reload
- [x] 1.2 Verify that a failed invitation decision restores the invitation and shows the existing error toast

## 2. Friend request refetch and feedback

- [x] 2.1 In `FriendsView`, call `router.refresh()` after a successful accept/decline so the friends list and the pending count stay consistent; verify the new friend appears in the "Друзья" tab and the "Заявки" badge decreases without a reload
- [x] 2.2 In `FriendRequestsView`, await the decision, add a success toast, roll back the removed request on failure, and call `router.refresh()` on success; verify the requests page shows feedback and updates the count without a reload
- [x] 2.3 Extend the affected unit tests (`tests/unit/group-feedback.test.tsx`, friends request tests) to assert success refresh and failure rollback; verify the suite passes with the project's test command

## 3. Sign-in screen centering

- [x] 3.1 Center the sign-in form within the viewport on all widths in `src/app/(auth)/login/page.tsx` (for example by removing the fixed-width container constraint or adding `mx-auto`); verify with Playwright at a wide desktop width that the form is horizontally centered in the viewport
- [x] 3.2 Verify with Playwright at a phone width (~360px) that the sign-in form is centered and fully visible without horizontal scrolling

## 4. Mobile tab-bar label centering

- [x] 4.1 Center wrapped labels in the mobile tab bar in `src/components/layout/nav-links.tsx`; verify with Playwright at ~360px width that both lines of "Мои фильмы" and "Мои сериалы" are centered within their tabs
- [x] 4.2 Run the navigation and accessibility unit tests and verify they still pass

## 5. Phone adaptivity verification

- [x] 5.1 Walk the shell and key screens (home, my films, my series, film/series detail, friends, groups, group detail, profile, settings, modals) at ~360/390/414px widths and record any horizontal overflow or clipped control. Found: the top-bar account identity (`account-menu.tsx`) forced ~19px of horizontal page scroll at 360px and ~4px at 390px (0 at 414px); every other screen and the add-record/create-group modals were clean.
- [x] 5.2 For each concrete defect found in 5.1, add a focused fix task and re-verify at the affected width; if no defect is found, record that the pass is clean. Fix: constrain the name/tag spans in `account-menu.tsx` (`w-full min-w-0` alongside the existing `truncate`) so they truncate inside the top-bar column instead of overflowing. Re-verified: `scrollWidth === clientWidth` on all listed routes and modals at 360/390/414px.
- [x] 5.3 Run the full test suite and lint/typecheck and verify they pass
