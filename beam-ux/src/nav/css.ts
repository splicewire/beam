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

/**
 * The locked row + its upsell popover carry `beam-nav-`-prefixed class names rather than the
 * `upsell-*` / `launcher-scrim` names `@schemastud/mainframe/os` uses for the locked DESKTOP TILE.
 *
 * The two surfaces match in BEHAVIOUR on purpose — a locked row opens the upsell and never
 * navigates, exactly as a locked dock tile opens the upsell and never opens a window — and they must
 * not match in SELECTORS. The desktop chrome deliberately ships no CSS and leaves `.upsell-pop` for
 * the host to style; this package ships its rules inline. Reusing those names would mean this
 * package's sheet silently restyling the host's dock popover wherever both are rendered, which is the
 * class of defect the whole render-time-`<style>` contract exists to avoid.
 */
export const REALM_NAV_CSS = `
.beam-nav-label { letter-spacing: 0.1em; }
.beam-nav-icon { width: 17px; height: 17px; }
.beam-nav-item[data-active='true'] { color: ${SIDEBAR_ACTIVE_FG}; }
.beam-nav-item[data-active='false']:hover { color: ${SIDEBAR_ACTIVE_FG}; }
.beam-nav-item[data-locked='true'] {
  width: 100%;
  cursor: pointer;
  font: inherit;
  text-align: left;
  background: none;
  opacity: var(--beam-nav-locked-opacity, 0.65);
}
.beam-nav-item[data-locked='true']:hover { opacity: 1; }
.beam-nav-lock { flex: none; margin-left: auto; font-size: 0.85em; line-height: 1; }
.beam-nav-upsell-scrim { position: fixed; inset: 0; z-index: 50; }
.beam-nav-upsell {
  position: fixed;
  z-index: 51;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(var(--beam-nav-upsell-width, 22rem), calc(100vw - 2rem));
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: var(--card, var(--background));
  color: var(--card-foreground, var(--foreground));
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
.beam-nav-upsell-title { font-weight: 600; margin-bottom: 0.375rem; }
.beam-nav-upsell-copy { margin: 0 0 1rem; opacity: 0.8; }
`;
