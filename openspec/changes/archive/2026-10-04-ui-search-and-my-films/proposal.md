## Why

The first UI change put global search in the top bar, surfaced a statistics summary on Home, and made rows in My Films navigate to a separate record screen. In daily use the global search is unrelated to the current tab, statistics clutter Home and My Films, and navigating away from My Films to read a comment is unnecessary friction. This change relocates search into the tabs where it is relevant and turns My Films into a self-contained, editable list.

## What Changes

- Remove the global search field from the top bar (desktop and mobile); the top bar keeps theme switch and account menu only.
- Provide tab-local search on four sections: Home, My Films, Friends, Groups.
- Home: remove the statistics summary; apply search only when the user presses the "Find" button (not on every keystroke). Recent activity and popular films remain.
- My Films: remove statistics entirely; keep the watched-films list; search filters the list immediately as the user types, using the same fields as Home search.
- My Films: clicking a film card expands its comment in place, showing "Нет комментария" when empty, instead of navigating away.
- My Films: an edit action opens a modal to change rating/comment and to delete the record; an add action opens an equivalent modal. Adding no longer opens a separate screen.
- Friends: search first among the user's friends, and when nothing matches, fall back to searching all non-hidden profiles.
- Groups: search first among the user's own groups, and when nothing matches, fall back to all non-hidden groups.
- Statistics remain available only as dedicated screens in Profile and Groups.

**BREAKING** (spec-level): removes the requirement that the top bar provides global search; removes the Home compact-statistics-summary requirement; removes the My Films requirement that selecting a record navigates to a separate view.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/navigation`: the top bar no longer provides global search; search is provided per tab instead of globally.
- `ui/screens`: Home (no statistics, submit-based search), My Films (no statistics, in-place comment expansion, modal edit/delete/add, live filtering search), Friends and Groups (scoped-then-fallback search), and the placement of statistics (Profile and Groups only).

## Impact

- **Presentation layer only.** No data model, TMDB integration, or authorization behavior changes.
- **Affected code (future implementation):** `src/components/layout/top-bar.tsx` and `src/components/layout/global-search.tsx` (remove top-bar search), `src/app/(app)/search/*` and `src/components/features/movie-tracker/SearchResultsView.tsx` (become unreferenced), `src/components/features/movie-tracker/HomeView.tsx` (drop statistics, submit-based search), `MyFilmsView.tsx` and `src/app/(app)/films/page.tsx` (list interactions, modal edit/delete/add, live search, remove statistics entry), `src/components/features/movie-tracker/SearchField.tsx` (support submit vs live modes), `src/app/(app)/friends/page.tsx` and `src/app/(app)/groups/page.tsx` (scoped search with fallback), and `RatingForm.tsx` (reuse in the add/edit modal, add delete).
- **Tests:** `tests/unit/screens.test.tsx` (My Films link assumption), `tests/unit/routes.test.ts` (route-depth map), `tests/unit/search.test.tsx` (Home live-search assumption), and any navigation/shell tests for the top bar.
- **Dependencies:** none expected; `lucide-react`, shadcn-style primitives, and the existing `Modal` are already present.
- **Compatibility:** the film catalog, watched-record storage, and authentication behavior are unchanged. Existing routes for statistics in Profile and Groups are retained.
