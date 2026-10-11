## Context

See proposal.md. Today every color is a semantic CSS variable in `src/app/globals.css`: a light `:root` block (beige canvas, maroon primary, light-sky accent) and a `[data-theme='dark']` block, mapped into Tailwind v4 through `@theme inline` (`--color-*`), with `--radius` (12px) feeding `rounded-lg` for cards and `rounded-md` for controls. Components use `bg-primary`, `text-muted-foreground`, `shadow-sm`/`shadow-lg`, etc. No webfont is loaded anywhere. The content-security policy in `src/proxy.ts` allows `font-src 'self' data:`, so webfonts must be self-hosted.

## Goals / Non-Goals

**Goals:**
- Light theme matches the Calendly reference; dark theme matches the Raycast reference.
- Radius, elevation, and typography become token-driven, not ad-hoc utilities.
- Both themes remain accessible (contrast) and keep the existing persisted switch.

**Non-Goals:**
- Marketing-only constructs from the references: the floating glass navigation pill, the hero gradient banner, and decorative blobs. The app keeps its rail + tab-bar shell and has no hero.
- Changing any component's public API or any data/behavior.
- Adding a third theme or removing the light theme.

## Decisions

- **Keep the `[data-theme]` + `@theme inline` mechanism and restyle the two token blocks.** Implementation is a rewrite of the `:root` (Calendly) and `[data-theme='dark']` (Raycast) variable values, not a new theming system. Alternatives (per-theme stylesheets, class-based palettes) were rejected as duplicate sources of truth.
- **Add radius tokens split by role.** Introduce a control radius (8px) and a card radius (16px) as tokens so `Button`/`Input` use the control radius and `Card` uses the card radius, independent of the 12px `--radius` default. This satisfies the references without a per-component rewrite (both references agree on 8px controls; cards are 16–24px, so 16px is the shared value).
- **Expose elevation as semantic tokens, not raw shadows.** Add `--elevation-card` and `--elevation-raised` variables and small `.elevation-*` utilities in `globals.css`. Light theme uses the Calendly blue-tinted three-layer stack; dark theme uses the Raycast inset "key" treatment (no outer drop shadow). `Card`, `Modal`, and the popover consume these tokens. Rationale: the light and dark treatments are structurally different (outer vs inset), so a single named token per surface keeps components theme-agnostic. Alternative (arbitrary Tailwind shadow classes per component) was rejected for drift.
- **Primary action becomes a token swap.** Light `--primary` = Signal Blue `#006bff` with white foreground; dark `--primary` = Mist `#e6e6e6` with Iron `#454647` foreground. The existing `default` button variant (`bg-primary text-primary-foreground`) then renders correctly in both themes with no variant change.
- **Coral is a separate brand token.** Add `--brand-mark` (`#ff6363`) used only by the logo/app mark and brand badges; dark `--accent` becomes a neutral recessed surface (`#111214`) rather than a chromatic accent, matching the reference's "one coral punctuation" rule.
- **Fonts via `next/font` (self-hosted).** Load Inter (dark), Manrope (light), and a monospace (for technical metadata) into CSS variables `--font-sans` / `--font-mono`, and select the sans per theme with a `[data-theme]` font-family rule. Self-hosting keeps `font-src 'self' data:` valid.
- **Contrast guardrail.** Do not use Raycast's Smoke `#6a6b6c` for body text (≈3.8:1 on `#040506`); use Ash `#9c9c9d` for muted dark-theme text so the existing `ui/accessibility` contrast requirement holds.

## Risks / Trade-offs

- [Coral `#ff6363` breaks the previous "matte, no neon" rule] → The matte-palette requirement is updated by this change to reference the two styles; the rule now forbids accent/gradient on primary actions instead of forbidding saturation outright.
- [Inset "key" shadows are subtle on an almost-black canvas] → Verify cards remain distinguishable from the canvas via the hairline border plus the inset highlight; adjust the highlight alpha if needed.
- [New webfonts increase build/bundle weight] → Use `next/font` with only the needed weights and subsets; self-hosted output avoids external requests.
- [Contrast regressions from the new palettes] → Re-verify each theme's text/controls against 4.5:1 (normal) and 3:1 (large/controls); keep the problematic Smoke value out of text roles.
- [Existing tests assert specific colors/classes] → Update tests that reference old token values or shadow utilities; verify with `npm test`.
