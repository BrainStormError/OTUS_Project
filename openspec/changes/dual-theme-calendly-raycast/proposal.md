## Why

The application must ship with an intentional, modern look instead of the current ad-hoc matte palette. `LIGHT_DESIGN.md` (Calendly) and `DARK_DESIGN.md` (Raycast) are the agreed references: light theme = Calendly, dark theme = Raycast. Because all colors already flow through semantic tokens, this can be delivered as a token-level restyle plus a thin component-treatment layer.

## What Changes

- **BREAKING** (visual): restyle the light theme to the Calendly reference — cool near-white canvas, Ink Navy text, a single Signal Blue primary action, hairline borders, 8px buttons, 16–24px cards, blue-tinted elevation.
- **BREAKING** (visual): restyle the dark theme to the Raycast reference — near-black canvas, coral reserved for brand marks only, neutral Mist primary CTA, hairline borders and the inset "key" card treatment, 6–20px radii.
- Add a real interface typeface (Inter, with Manrope as the light-theme alternative) and a monospace for technical metadata, loaded via `next/font`.
- Extend the theme token set with radius and elevation roles so components reference tokens rather than ad-hoc utilities.
- Keep exactly two selectable, persisted themes (light and dark) with the existing switch behavior.

## Capabilities

### New Capabilities
<!-- none: this restyles the existing design foundation -->

### Modified Capabilities
- `ui/design-system`: the two-theme requirement, the palette requirement, the token-set requirement, and typography change — light and dark anchors are replaced by the two style references and new radius/elevation/typography roles are added.

## Impact

- Tokens: `src/app/globals.css` (`:root` and `[data-theme='dark']`, `@theme inline`).
- Fonts: `src/app/layout.tsx`.
- Component styling: `Card`, `Button`, `Badge`, `Input`, `Modal`, and the layout shell.
- Sources of truth: `LIGHT_DESIGN.md`, `DARK_DESIGN.md`.
- Accessibility: contrast must be re-verified for both palettes against the existing `ui/accessibility` requirements.
