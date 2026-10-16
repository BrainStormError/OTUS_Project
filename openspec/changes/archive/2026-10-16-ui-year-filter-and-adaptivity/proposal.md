## Why

Three reported UI issues remain in the tracker. The year filter's increment/decrement steppers let a bound drift past the current calendar year (they even jump to the current year from an empty field), which produces empty results that look like a data bug. On My Films and My Series the year filter matches a title's release year even though those screens list watch dates, so a "year" search misses records the user actually watched that year. And the layout clips content on small screens: the year range control overflows the add/search dialog at narrow widths, the group ratings table is cut off instead of scrolling, and the top bar crowds the account menu on the narrowest phones.

## What Changes

- Make the year filter manual numeric entry: remove the increment and decrement controls on both bounds, reset a bound typed above the current calendar year to the current year when the field is committed (the user leaves it), and when the lower bound is entered above the upper bound, clear the upper bound so the range stays valid instead of being rejected.
- Lay the year range out on its own row beneath the title and genre fields with the field hints "с" and "по", and show its active filter block as "с X по Y" with each bound individually removable.
- On My Films and My Series filter the year by the record's watch date, not the title's release year, and label that field "год просмотра"; Home and the add/group search keep release-year filtering labelled "Год".
- Adapt the layout from 320 px phones to 1440 px desktops: the from–to year control wraps or stacks instead of overflowing its panel, the group ratings table scrolls horizontally instead of clipping columns, and the top bar keeps the wordmark and account menu from overlapping at the narrowest width.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/screens`: the year filter is manual entry that resets a bound typed above the current year to the current year on commit, with the lower-bound-above-upper-bound rule clearing the upper bound; the year range sits on its own row beneath the title and genre fields with "с"/"по" hints and its active block reads "с X по Y" with each bound individually removable; My Films (and My Series by parity) filter the year by watch date and label the field "год просмотра".

- `ui/design-system`: the adaptive-layout requirement names the supported widths (320/375/768/1024/1440) and requires the range control not to overflow and wide tables to scroll; the control-geometry requirement covers the year range stacking instead of overflowing.

## Impact

- **UI:** `src/components/features/movie-tracker/SearchField.tsx` (remove `Minus`/`Plus` steppers and the `step` logic, reset a bound typed above the current year to the current year on blur, resolve an inverted range by clearing the upper bound, add a `yearLabel` prop, move the range to its own row with "с"/"по" hints), `FilterChips.tsx` (a per-value prefix so the year block reads "с X по Y" while each bound keeps its own remove control), `MyFilmsView.tsx` and `MySeriesView.tsx` (match year by `watchedAt`, pass the watch-year label), `filters.ts` (a watch-date-based match helper), `GroupRatings.tsx` (scroll instead of clip the ratings table).
- **Tests:** `tests/unit/search.test.tsx` (manual year entry, above-current-year reset on blur, clearing the upper bound, the "с X по Y" year block with per-bound removal), `tests/unit/filters.test.ts` (watch-year match), `tests/unit/screens.test.tsx` (My Films year by watch date; group ratings scroll container).
- **Specs:** no new capability; two existing specs (`ui/screens`, `ui/design-system`) gain deltas.
- **No data, API, or dependency changes.** The catalog/TMDB search path and its year-range parameters are untouched.
