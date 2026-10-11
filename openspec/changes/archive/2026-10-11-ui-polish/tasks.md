## 1. Filter fixes

- [x] 1.1 In `SearchField.tsx`, generalize `removeFilter` so any active value is cleared when its ✕ is activated (single-value keys clear their key; `genre` removes just that value); verify a unit test shows the year chip's ✕ clears the year and the remaining filters stay
- [x] 1.2 In `SearchField.tsx`, make the year filter start unset, use the current calendar year as the base on the first step, and bound only by the absolute range (1800–2200) instead of the available years; verify stepping from empty selects the current year and an out-of-data year is accepted

## 2. Dialog sizing

- [x] 2.1 Add a wide size to `Modal` (or pass the width via `className`) and use it for `AddRecordModal` (`sm:max-w-2xl`) while keeping `max-h-[90vh]` and internal scroll, leaving `RecordModal` at the default; verify the add dialog shows its search, filters, and results together and stays within a narrow viewport

## 3. Adaptive layout

- [x] 3.1 In `MyFilmsView.tsx` and `MySeriesView.tsx`, change the table container from `overflow-hidden` to `overflow-x-auto` while keeping the rounded border; verify the table scrolls horizontally at 320 px with no clipped columns and rounded corners intact
- [x] 3.2 Audit the shell and main screens at 320 / 768 / 1280 px and fix any remaining clipping or unreachable control; verify each screen is usable at all three widths

## 4. Navigation shell surface

- [x] 4.1 Add/repoint the shell surface tokens (theme brand accent per theme) plus a rail-active surface token, and apply the shell surface to `sidebar-rail.tsx` and `mobile-tab-bar.tsx` with the active item using the rail-active token; verify the panels are visibly distinct from the content cards and the current item reads as selected in both themes
- [x] 4.2 Re-check text, icon, and control contrast on the new surface in both themes (4.5:1 text, 3:1 controls); verify no token fails the accessibility check

## 5. Motion

- [x] 5.1 Add a collapse/expand transition to the sidebar width and a fade/slide reveal to the dropdowns (`GenreDropdown`, account-menu open) using the existing duration/ease tokens; verify each transition runs within 150–250 ms and is suppressed under reduced motion
- [x] 5.2 Update any test asserting `overflow-hidden` on the tables or the old rail color; verify the affected unit tests pass

## 6. Verification

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, and `npm test`; verify all pass
- [x] 6.2 Walk Home and My Films in both themes at 320 / 768 / 1280 px: remove the year chip, step the year from empty, open the add dialog, scroll a wide table, and expand/collapse the sidebar; verify each behaves as specified
