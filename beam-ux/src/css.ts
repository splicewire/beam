/**
 * The structural CSS the UX-builder chrome injects, as a **string** — the same contract as
 * `docs/css.ts` and `<Prose>`: the package ships no `.css` file and is `sideEffects: false`, so a
 * stylesheet import is something a bundler is entitled to drop, and an import-time injection is
 * exactly what tree-shaking removes. Each component renders this sheet itself, inline, so it travels
 * with the markup it styles.
 *
 * ## Why these rules are not Tailwind utilities
 *
 * They were (beam-docs-satellite 62). A host's Tailwind scans the host's own sources, not
 * `node_modules/@splicewire/beam-ux/dist`, so a utility that exists only inside this package's bundle
 * is a class name with no rule behind it: correct markup, absent styling, HTTP 200 — and only an
 * emitted-class-set diff can see it. Sixteen literals depended on the host deriving its scan scope
 * (`familySources()` in `@schemastud/seam/vite`); the ones that belong to the builder chrome live
 * here now, and `utility-literals.test.tsx` is what stops the seventeenth.
 *
 * ## Every value is a token with a plain fallback
 *
 * The package picks the ARRANGEMENT (a rail width, an inset, a ring); the host picks what those are by
 * redefining `--beam-ux-*` on any ancestor. Colour is read from the shadcn semantic set every host
 * already defines at `:root` (`--primary`, `--background`, `--card`) — never a hex, never one host's
 * brand prefix. The defaults are the numbers the utilities had hardcoded (`300px`, `360px`/`400px`,
 * `1.5rem` for `right-6`, `6rem` for `top-24`, `-0.625rem` for `-top-2.5`), so the lift changes no
 * pixel on a host that redefines nothing.
 */
export const UX_BUILDER_CSS = `
/* the floating in-context region editor (RegionOverlay) — Tailwind's 2xl shadow. Utility names are
   kept out of this string's comments on purpose: the string ships in dist, and a host that scans it
   would generate a rule from the prose (beam-docs-satellite 63). */
.beam-ux-overlay { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }

/* the fixed dock the overlay floats in, in overlay placement (UxBuilder) */
.beam-ux-overlay-dock {
  position: fixed;
  right: var(--beam-ux-overlay-inset, 1.5rem);
  top: var(--beam-ux-overlay-top, 6rem);
  z-index: 40;
  width: var(--beam-ux-overlay-width, 380px);
}

/* an engageable region on the live canvas (RegionBlock): hover ring, and the label tab that
   reveals on hover or engage */
.beam-ux-region:not([data-engaged]):hover {
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 20%, transparent);
}
.beam-ux-region-tab {
  top: -0.625rem;
  opacity: 0;
  transition-property: opacity;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.beam-ux-region:hover .beam-ux-region-tab,
.beam-ux-region[data-engaged] .beam-ux-region-tab { opacity: 1; }

/* the "opaque island" scrim over a self-loading frame preview (RegionEditorBody) */
.beam-ux-scrim {
  background-image: linear-gradient(to top, color-mix(in oklab, var(--background) 70%, transparent), transparent);
}

/* the caption beside the mode toggle — hidden on a narrow viewport (UxBuilder) */
.beam-ux-mode-hint { display: none; }
@media (min-width: 48rem) { .beam-ux-mode-hint { display: inline; } }

/* the two-column geometries: composition tree + editor (StructurePanel), canvas + docked inspector
   (UxBuilder). Single column below the lg breakpoint, as the utilities were. */
@media (min-width: 64rem) {
  .beam-ux-structure-grid { grid-template-columns: minmax(0, 1fr) var(--beam-ux-structure-aside, 300px); }
  .beam-ux-inspector-grid { grid-template-columns: minmax(0, 1fr) minmax(var(--beam-ux-inspector-min, 360px), var(--beam-ux-inspector-max, 400px)); }
}
`;
