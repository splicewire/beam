/**
 * `@splicewire/beam-ux/account` — generic authed-account chrome (beam-ux-uplift ticket 13).
 *
 * So a fresh beam host gets its account area OOTB. The deferred JS half of ticket 08, which shipped
 * the DATA CONTRACT (`AccountShellData` + the `laravel-beam-accounts` provider seam). Portable,
 * theme-neutral, framework-neutral surfaces:
 *   - {@link AccountShell} — the AppLayout + sidebar shell: a `@schemastud/ui` Sidebar (brand header
 *     + data-driven nav + an opt-in plan/profile/account/upsell block + a user footer slot) beside
 *     the page `main`, wrapped in the SidebarProvider.
 *   - {@link AccountNav} — the data-driven nav group rendering the projected `account` sitemap rows.
 *
 * The package ships NO palette, fonts, or wordmark and imports NO router — a host supplies its theme
 * via className/style + the `--sidebar*` tokens, injects its `<Link>` through `linkComponent`, and
 * passes the `nav` + `shell` projections (no `usePage`). The Sidebar primitive comes from the
 * `@schemastud/ui` foundation (ticket 13 step 1). All copy comes from the data — never baked in.
 */

export {
    AccountShell,
    type AccountShellProps,
    type AccountShellSections,
} from './AccountShell.js';
export { AccountNav, type AccountNavProps } from './AccountNav.js';
export type {
    AccountNavItem,
    AccountNavData,
    AccountShellData,
    AccountShellPlan,
    AccountShellProfile,
    AccountProfileMetric,
    AccountShellAccount,
    AccountShellUpsell,
    LinkComponent,
} from './types.js';
