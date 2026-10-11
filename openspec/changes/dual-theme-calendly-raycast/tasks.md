## 1. Token foundation

- [x] 1.1 Rewrite the `:root` (light) block in `src/app/globals.css` to the Calendly palette (Cloud canvas, Paper surfaces, Ink Navy text, Signal Blue primary, Slate Gray muted, Hairline border, Pebble input fill); verify the light theme renders the new colors on Home and My Films
- [x] 1.2 Rewrite the `[data-theme='dark']` block to the Raycast palette (Void Black canvas, Ink surfaces, Pure White/Ash text, Mist primary with Iron foreground, hairline border, Obsidian recessed); verify the dark theme renders the new colors on the same screens
- [x] 1.3 Add a `--brand-mark` token (Coral Pulse) used only by the brand mark/badge and confirm no primary button uses it; verify the logo/app mark shows coral in dark and the primary CTA does not

## 2. Radius and elevation tokens

- [x] 2.1 Add control-radius and card-radius tokens (8px / 16px) and map them so `Button`/`Input` use the control radius and `Card` uses the card radius; verify button/input corners are 8px and cards are 16px in both themes
- [x] 2.2 Add `--elevation-card` and `--elevation-raised` tokens plus `.elevation-*` utilities: Calendly blue-tinted stack for light, Raycast inset "key" stack for dark; apply them in `Card`, `Modal`, and the account-menu popover and verify the two themes show the intended elevation with no outer drop-shadow in dark

## 3. Typography

- [x] 3.1 Load Inter, Manrope, and a monospace via `next/font` in `src/app/layout.tsx` into `--font-sans`/`--font-mono`; verify the font files are self-hosted and the build succeeds under the existing CSP
- [x] 3.2 Apply the theme typeface (Inter dark, Manrope light) through a `[data-theme]` font-family rule and use the monospace for technical metadata (for example the footer/version text); verify switching themes changes the typeface and metadata renders monospace

## 4. Accessibility re-check

- [x] 4.1 Verify normal text contrast is at least 4.5:1 and large text/control borders at least 3:1 in both themes; confirm muted dark text uses Ash, not Smoke, and fix any token that fails
- [x] 4.2 Verify the focus ring is visible (≥3:1) in both themes on buttons, inputs, links, and nav items

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, and `npm test` and confirm all pass, updating any tests that asserted old token values or shadow utilities
- [ ] 5.2 Manually walk Home, My Films, My Series, Friends, Groups, Settings, and the login screen in both themes and confirm each matches its reference composition with no leftover Ad-hoc colors or shadows
