/**
 * The CSS `<RealmNav>` injects, as a **string** — see `src/css.ts` for the contract (render-time
 * `<style>`, never an import-time injection; tokens with plain fallbacks; no hex).
 *
 * Three of the rail's utilities lived only inside this package's dist and rendered only at a host
 * whose Tailwind scanned it (beam-docs-satellite 62). `tracking-[0.1em]` was the sharpest: it sat in
 * the same literal as `text-sidebar-foreground/55`, which every host emits, so the group label rendered
 * in the right colour at the wrong letter-spacing — half a class list, harder to notice than none.
 */

/**
 * The active item's text colour, as a token with a plain fallback.
 *
 * `sidebar-active-foreground` is **not** one of shadcn's eight standard sidebar tokens — it was invented
 * by splicewire-app, the only host that defines it. Read raw, with the standard `--sidebar-foreground`
 * as the fallback, so any other host adopting the rail gets a colour rather than nothing.
 *
 * The chain names the RAW `--sidebar-*` properties, not the `--color-*` theme keys: splicewire-app
 * declares its palette in `@theme inline`, which resolves `--color-*` at BUILD time and emits none of
 * them as runtime custom properties, so a `--color-` chain would be undefined at the one host that
 * matters. The un-prefixed properties are real `:root` declarations in both the flagship
 * (`ui/src/index.css`) and a stock starter (`resources/css/app.css`).
 */
export const SIDEBAR_ACTIVE_FG = 'var(--sidebar-active-foreground,var(--sidebar-foreground))';

export const REALM_NAV_CSS = `
.beam-nav-label { letter-spacing: 0.1em; }
.beam-nav-icon { width: 17px; height: 17px; }
.beam-nav-item[data-active='true'] { color: ${SIDEBAR_ACTIVE_FG}; }
.beam-nav-item[data-active='false']:hover { color: ${SIDEBAR_ACTIVE_FG}; }
`;
