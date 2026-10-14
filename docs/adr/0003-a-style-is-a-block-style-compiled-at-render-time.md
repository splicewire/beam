# A style is a Block Style, compiled at render time

Status: accepted
Date: 2026-10-14

The authoring editor (`@splicewire/beam-ux` canvas) writes a block's look as a **Block Style**: a structured object with a
base layer, a layer for each breakpoint and a layer for each element state, whose values may be token references
(`var(--…)`). At render time it becomes CSS through a content-hashed class (`bs-…`), emitted in one `<style>` per rendered
entry inside a cascade layer after Tailwind's `utilities`. This is the same request-time route the theme entry already
takes (`ThemeResolver` + `CssBodyCodec` in `splicewire/laravel-beam-ux`). The editor's panels never write classes. Decided
in editor-parity ticket 04 (splicewire-ecosystem `.scratch/splicewire/splicewire-ecosystem/editor-parity/`).

## Why not Tailwind utilities

The class chips already take Tailwind: their suggestion pool is Tailwind utilities (`beam-ux/src/canvas/templates.ts`),
so `md:p-12` can be typed today. Nothing generates its CSS. Tailwind v4 builds from scanned source at build time, and an
entry lives in the database. Measured 2026-10-13: the beam site's built `app-5lXvhK4y.css` carries the 63 `md:`/`hover:`
utilities its source uses and none of five unused ones probed. A new utility renders only where the disk mirror writes a
file and something rebuilds. That excludes the flagship (no mirror), production (no rebuild on save) and any tenant site.
Inline `style` cannot hold a media query or `:hover`, so it cannot carry breakpoints or states at all.

## The shape

- **Breakpoints** are mobile-first `min-width`, using the host's Tailwind breakpoint names and values, so a Block Style
  layer and a developer's `md:` class mean the same width. Authors do not define breakpoints.
- **States** are `hover`, `focus-visible` and `active`, applied on top of each breakpoint layer.
- Both come from one registry. Adding a state (`disabled`, say) is a list entry plus its selector, not new machinery.
- **Precedence.** A Block Style beats a class. The inspector shows a class-sourced value as inherited, and editing it
  writes a Block Style override. The class itself is untouched.
- **In `.tsx`** a Block Style is a `bdStyle={{ … }}` object-literal prop. The BlockDoc lens reads and prints that one prop
  with a literal-only grammar it owns, and every other object-literal prop stays opaque. A developer's `className` and
  `style={{…}}` therefore stay byte-identical. The legacy inline `style` string migrates into the base layer.
- **Tokens** may vary by breakpoint, using the same list: `ThemeEditor` emits per-breakpoint `:root` overrides in
  `@media` blocks.

## Considered and not taken

- **A class manager** (Webflow-style named classes). "Change it once, it changes everywhere" comes from components and
  tokens instead. A third place a value can come from is what makes class systems hard to follow. Named Style Presets
  stay a deferred option.
- **A stable per-block id** as the selector. A content hash needs nothing minted or stored, survives reorders and shares one
  rule between identical styles. `data-bd-path` changes on reorder, so it can't anchor a style.
- **A JSON-string attribute** (`data-bd-style='{…}'`) round-trips through today's lens unchanged, but reads badly in a
  git diff. **A sidecar `.css` per entry** splits one entry across two files.

## Deferred, not refused

Additional states, Style Presets, a "tokens only" lock for a host or realm, colour-scheme token modes (dark), and component
variants (named Block Style overrides on a component).
