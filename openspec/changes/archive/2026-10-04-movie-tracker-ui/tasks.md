## 1. Theme tokens and motion

- [x] 1.1 Update the light and dark token values in `src/app/globals.css` to the design.md mapping (canvas, surface, raised, border, foreground, muted, accent, primary, destructive, ring) and verify both themes render without hardcoded colors by grepping components for raw hex
- [x] 1.2 Add motion custom properties `--dur-fast: 150ms`, `--dur: 200ms`, `--dur-slow: 250ms`, `--ease`, and define only fade, slide, hover, and skeleton keyframes; verify `prefers-reduced-motion: reduce` collapses transitions to an immediate change
- [x] 1.3 Add the pre-paint theme script to `src/app/layout.tsx` that reads the stored theme and sets `data-theme` on `<html>`; verify no flash of the wrong theme on reload with each preference and that `ThemeSwitcher` still toggles and persists

## 2. Shared state and UI primitives

- [x] 2.1 Extend `AsyncView` with shared `EmptyState`, `Skeleton*`, and `ErrorState` primitives (with retry) and verify existing consumers still render loading, empty, and error correctly via component tests
- [x] 2.2 Add the `MovieCard` component (poster 2:3, title, year, rating badge, genres, watched action, poster fallback) and verify card content and the no-poster fallback with component tests
- [x] 2.3 Add the search field with filter chips (title, genre, actor, year) and reset behavior; verify active filters render as removable chips and reset clears them with component tests
- [x] 2.4 Add the decimal rating input (0–10) with range validation, the comment field, and the watch-date control; verify valid decimals are accepted and out-of-range values are rejected with a message (default step 0.5)
- [x] 2.5 Add the `StatCard`, `PrivacyToggle` (`role="switch"`, `aria-checked`), friend/request list item, group card, and admin member panel primitives; verify each renders its variants with component tests

## 3. Navigation shell

- [x] 3.1 Define a single section list (Home/Search, My Films, Profile, Friends, Groups, Settings) and render the desktop sidebar rail plus top bar (search, theme switch, account menu) from it in `src/app/(app)/layout.tsx`; verify the six sections and active-section marking on desktop
- [x] 3.2 Render the mobile shell (top bar + bottom tab bar for five sections with Settings via account/Profile) from the same section list; verify all sections are reachable and the current one is marked on a mobile viewport
- [x] 3.3 Add the routes in the design.md depth map and verify each key screen (film card, rating form, profile, other profile, statistics, friend requests, group card, group admin, privacy settings) is at most 3 transitions from Home

## 4. Discovery screens

- [x] 4.1 Build the Home/Search screen combining the search field, filter entry point, recent activity, and a compact statistics summary; verify the no-query state shows recent/suggestions instead of results
- [x] 4.2 Build the search results screen with the filtered card grid; verify filtered results render, the empty state appears for no matches, and loading shows a skeleton grid
- [x] 4.3 Build the film card screen (`/film/[tmdbId]`) with the watched action and open the rating/comment form as a modal/sheet; verify saving displays the film in My Films with the entered rating, comment, and date
- [x] 4.4 Verify the rating form is keyboard operable and traps focus, and that Escape closes it and returns focus to the trigger

## 5. Films, profile, and statistics

- [x] 5.1 Build My Films listing watched records and opening an individual record; verify records show rating and date and a record opens within the depth budget
- [x] 5.2 Build the profile screen for the current user and for other users; verify identity, statistics, and recent records render and the relationship action (add friend) appears for other users
- [x] 5.3 Build the statistics presentation (count, average rating, genre breakdown, year distribution) with `StatCard`; verify all four are shown when available
- [x] 5.4 Implement the restricted states for a hidden profile and hidden statistics, showing the restricted state to non-permitted viewers while the owner still sees their values

## 6. Friends, groups, and settings

- [x] 6.1 Build the friends section (profile search, incoming/outgoing requests with accept/decline, current friends list with profile links); verify the pending count is visible and request actions update the list
- [x] 6.2 Build the groups list and group card with members and group statistics; verify the card opens within the depth budget
- [x] 6.3 Build the group admin panel (member management, role change, invite by handle, remove member) and the no-permission state for non-admins; verify admin controls appear only for admins
- [x] 6.4 Build the Settings screen with theme selection and profile/statistics privacy toggles; verify controls reflect the new value and show a saving/saved indication

## 7. Accessibility and motion verification

- [x] 7.1 Verify contrast in both themes: normal text ≥4.5:1, large text and control boundaries ≥3:1, including the dark maroon action on the near-black canvas, using an automated contrast check
- [x] 7.2 Verify visible focus on every interactive element in both themes and logical keyboard order through navigation, search, filters, rating entry, and form submission
- [x] 7.3 Verify accessible names on all controls (including icon-only theme switch), programmatically associated field errors, 44px touch targets, and `aria-live` announcements for search results and errors
- [x] 7.4 Verify only fade, slide, hover, and skeleton animations are used, all within 150–250 ms, and that reduced-motion disables continuous motion

## 8. Integration verification

- [x] 8.1 Run `npm run lint`, `npm run typecheck`, and `npm run test` and confirm all pass
- [x] 8.2 Add or extend a critical-path e2e test covering theme switch persistence, search → film card → rate and save, and opening a group admin panel; verify `npm run test:e2e:critical` passes
