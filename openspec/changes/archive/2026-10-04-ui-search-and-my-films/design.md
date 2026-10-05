## Context

See `proposal.md` — Why. Current behavior comes from the completed `movie-tracker-ui` change: the shell (`src/app/(app)/layout.tsx`) renders `SidebarRail`, `TopBar`, `MobileTabBar`; `TopBar` hosts `GlobalSearch`, `ThemeSwitcher`, and `AccountMenu`; Home (`HomeView.tsx`) combines a film `SearchField`, a statistics summary, recent activity, and popular films; My Films (`MyFilmsView.tsx` plus `films/page.tsx`) is a list of `<Link>` rows to `/films/[id]` with a header button to `/films/stats`; `RatingForm` and `Modal` already exist; watched records are stored in `localStorage` and merged with sample data (`record-store.ts`, `data.ts`).

Two constraints shape this change. First, the film catalog search (title/genre/actor/year) does not apply to friends or groups, which search different entities. Second, the capabilities `ui/screens` and `ui/navigation` currently exist only inside the unarchived `movie-tracker-ui` change, not in `openspec/specs/`; this change modifies them, so `movie-tracker-ui` must be synced/archived before this change is archived.

## Goals / Non-Goals

**Goals:**

- Localize search to the sections that own the data, and remove it from the top bar.
- Make My Films self-contained: list, live filtering, in-place comment expansion, and add/edit/delete via one modal.
- Remove statistics from Home and My Films while keeping the Profile and Group statistics screens.
- Add scoped search with fallback to Friends and Groups.

**Non-Goals:**

- No new backend, data model, or persistence changes; watched records stay in `localStorage`.
- No redesign of the shell, theme tokens, film card, or the Profile/Group statistics screens.
- No change to the discovery film card's rating/comment modal behavior beyond modal reuse.

## Decisions

### Section-local search, two variants

My Films reuses the existing film `SearchField` and applies it live to the merged watched records. Friends and Groups get a simple text search over their own entity lists. Home keeps the film `SearchField` but applies the query only on submit.

- Why: film filters (title/genre/actor/year) are meaningless for users and groups, so sharing the film field there would be misleading; a text search matches the requirement.
- Alternative: one generic search component for all four sections (rejected: forces irrelevant filter controls onto Friends/Groups).

### Home search becomes submit-driven

Home currently derives results from `useState` on every keystroke. It changes to hold the committed query/filters and only recompute on the "Найти" action; typing alone shows no results.

- Why: explicit requirement; also separates Home's behavior from My Films' live filtering.
- Alternative: keep live filtering everywhere (rejected: contradicts the stated requirement).

### My Films comment expansion and modal editing

Each list row becomes a button with `aria-expanded`/`aria-controls` that toggles an in-place comment region (never navigating). The edit action opens the existing `Modal` containing `RatingForm`, extended with a delete action; the add action opens the same modal with empty initial values. Rating, date, title, and year stay as they are.

- Why: keeps the list context, reuses the existing form and modal, and satisfies add/edit/delete with one component.
- Alternative: keep navigating to `/films/[id]` (rejected by requirement); a separate add screen (rejected: the add modal mirrors edit).
- Alternative: separate delete confirmation page (rejected: delete lives in the edit modal as stated).

### Remove now-orphaned surfaces

Removing the top-bar `GlobalSearch` leaves the standalone `/search` route and `SearchResultsView` unreachable, and removing the My Films statistics button leaves `/films/stats` unreachable. Both are removed; results are shown inline where the search lives.

- Why: avoid dead code and stale routes; the tab-local search covers the same need.
- Alternative: keep `/search` reachable from Home results (rejected: Home already renders results inline and the requirement puts search in tabs).

### Scoped-then-fallback search semantics

Friends search runs against the user's friends first; only when that yields no matches does it query all non-hidden profiles. Groups search does the same against the user's groups, then all non-visible-restricted groups. Hidden/restricted entries are excluded from the fallback.

- Why: matches the requirement and keeps hidden profiles/groups out of public fallback results.
- Alternative: always search all profiles (rejected: the requirement prefers the user's own circle first).

### Capability base ordering

`ui/screens` and `ui/navigation` deltas are `MODIFIED`/`REMOVED` against the `movie-tracker-ui` spec. Because that base is not yet in `openspec/specs/`, `openspec validate` reports an INFO that archive would refuse the delta. The base must be synced (by archiving `movie-tracker-ui`) before this change is archived.

- Why: this change revises behavior the earlier change defined; declaring it as a brand-new capability would duplicate that capability.
- Alternative: declare `ui/screens`/`ui/navigation` as new capabilities here (rejected: creates duplicate capability specs and collides when `movie-tracker-ui` archives).

## Risks / Trade-offs

- Removing `/search` and `/films/stats` invalidates `tests/unit/routes.test.ts` and parts of `tests/unit/screens.test.tsx`; update the route-depth map and the My Films expectations alongside.
- Home switching to submit-driven behavior breaks `tests/unit/search.test.tsx`'s "results once a query is entered"; update that test to submit first.
- In-place expansion plus a modal edit must not conflict on keyboard/focus → reuse `Modal` focus handling and use a button with `aria-expanded` for the row.
- Fallback search must exclude hidden profiles/groups or it leaks restricted data → filter restricted entries out of the fallback branch and cover with a test.
- Archive ordering (see Decisions) is easy to miss → note it in `tasks.md` and the change summary.

## Assumptions

- Adding a record from My Films uses an "Add" action that opens the same modal as editing. Because a new record needs a film, the modal offers film selection (a searchable picker over the catalog) when it is opened with no film context; when entered from a film context, that film is preselected. This keeps a single modal for both add and edit.
