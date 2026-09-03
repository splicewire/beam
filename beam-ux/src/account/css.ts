/**
 * The CSS `<AccountShell>` injects, as a **string** — see `src/css.ts` for the contract (render-time
 * `<style>`, never an import-time injection; tokens with plain fallbacks; no hex).
 *
 * Two of the shell's utilities lived only inside this package's dist (beam-docs-satellite 62):
 * `group-data-[collapsible=icon]:hidden` on the action slot, and `gap-y-0.5` on the profile metrics.
 * The first reads the `data-collapsible` attribute the `@schemastud/ui` Sidebar stamps on its root
 * when the rail collapses to icons.
 */
export const ACCOUNT_SHELL_CSS = `
[data-collapsible='icon'] .beam-ux-account-action { display: none; }
.beam-ux-account-metrics { row-gap: 0.125rem; }
`;
