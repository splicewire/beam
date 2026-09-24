# Beam UX ships an opt-in token layer

Status: accepted
Date: 2026-09-24

Beam packages read their own tier's raw custom properties (`--beam-paper`, `--beam-ink-45`, `--beam-warn-deep`, …) plus four status semantics shadcn does not define (`--signal`, `--warning`, `--warning-foreground`, `--info`). No package defined them. The Storybook workbench carried a private copy, and the flagship bound a subset onto `--splice-*`. The starters defined none, so beam chrome there rendered with unset variables: hairlines and dimmed text fell back to inherited colour, and `text-warning-foreground` was never generated. Component-seams ticket 07 (2026-07-24, decision 5) had already ruled that packages ship self-contained token defaults and that hosts re-bind them. Only the file was missing.

`@splicewire/beam-ux` now ships two stylesheets:

- `tokens.css` contains every beam-tier colour primitive and the four status semantics, with light values on `:root` and dark values on `.dark`. Aliases are re-declared under `.dark` so that a dark subtree does not inherit a value resolved in light.
- `theme.css` imports `tokens.css` and adds the Tailwind v4 `@theme inline` bridge (`--color-signal`, `--color-warning`, `--color-warning-foreground`, `--color-info`).

A host opts in from its own stylesheet with `@import '@splicewire/beam-ux/theme.css'`. To override a key, the host re-declares it after that import, on `:root` for light and on `.dark` for dark. Overrides are never placed on a component (Model B, own-key indirection). A host with its own palette can bind the keys itself and skip the file. The flagship does this: it binds the keys to `--splice-*` with `color-mix`.

## Why beam-ux, and not a new `@splicewire/beam-theme`

- `beam-ux` is the beam-tier substrate that every host already installs and links locally.
- A new package would add a dependency, an overlay link and a publish to every host before any of them could use one stylesheet.
- The tier is `beam`, not a package, so the file does not belong to a single capability.

## Why this does not break "the package ships no CSS files"

The rule in `site/Prose.tsx` protects styles that the JavaScript depends on. The package is `sideEffects: false`, so a bundler is entitled to drop a `.css` import made from JavaScript. That is why `<Prose>` and the docs, desk and canvas chrome inject their CSS as strings.

These two files are never imported from JavaScript, so there is nothing for a bundler to drop. A host that does not import them loses nothing it had before, because every component still carries its fallback. `sideEffects` stays `false`. `@splicewire/beam-mdx` already ships importable stylesheets under the same reasoning (`./css`, `./kit/css`).

## What the files leave out on purpose

- **Fonts (`--beam-font-*`).** Fonts belong to the host brand (layer 1 in the runbook's theming reference).
- **Site-content hooks (`--beam-fg`, `--beam-fg-muted`, `--beam-heading`, `--beam-accent`, `--beam-border`, `--beam-surface-2`).** `<Prose>` reads these hooks with a fallback to the surrounding ink, so a site renders in its own theme in both schemes. Defining them would override that theme. It would also recolour the operator orb, which reads `--beam-accent`.
- **The shadcn semantics and `--sidebar-*`.** These belong to the host (layer 2).

This keeps the theming-migration 08 ruling (2026-09-02) for `@splicewire/beam-mdx`: content prose reads the host's semantic set and does not get a package palette. The token layer covers chrome only.

## `--beam-muted` is a surface

Before this change, the name had two meanings. `<Prose>` read it as text colour for list markers and blockquotes. The mdx kit and the workbench read it as a fill for code grounds, figures, callouts and `--secondary`. It now means a surface everywhere. Prose reads a new text token, `--beam-fg-muted`, with a `currentColor` fallback, and `<EntryBody>`'s placeholder reads the same token.

A test in `beam-ux/src/theme/tokens.test.ts` enforces this ADR. It scans every beam package's source for `var(--beam-*)` reads, and it fails when a colour key has no default here, when a light key has no dark value, or when the file defines a host hook.
