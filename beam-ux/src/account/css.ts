/**
 * The CSS `<AccountShell>` injects, as a **string** — see `src/css.ts` for the contract (render-time
 * `<style>`, never an import-time injection; tokens with plain fallbacks; no hex).
 *
 * Two of the shell's utilities lived only inside this package's dist (beam-docs-satellite 62):
 * `group-data-[collapsible=icon]:hidden` on the action slot, and `gap-y-0.5` on the profile metrics.
 * The first reads the `data-collapsible` attribute the `@schemastud/ui` Sidebar stamps on its root
 * when the rail collapses to icons.
 *
 * Below the Sidebar's 768px mobile breakpoint the rail becomes an off-canvas drawer that only a
 * `SidebarTrigger` opens, so the shell renders a mobile bar carrying one (beam VR pass 2: at 320px the
 * account nav was unreachable). The bar hides at the breakpoint the Sidebar's `useIsMobile` uses.
 *
 * Secondary lines in the sidebar blocks read the SIDEBAR ink, not `--muted-foreground`: the rail keeps
 * its own dark tone in a light page, where page-muted ink ("None on file") was dark on dark.
 */
export const ACCOUNT_SHELL_CSS = `
[data-collapsible='icon'] .beam-ux-account-action { display: none; }
.beam-ux-account-metrics { row-gap: 0.125rem; }
.beam-ux-account-secondary { color: var(--sidebar-foreground, currentColor); opacity: 0.8; }
.beam-ux-account-mobilebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border, currentColor);
  font-weight: 600;
}
@media (min-width: 768px) { .beam-ux-account-mobilebar { display: none; } }
`;
