/**
 * `@splicewire/beam-ux/desk` — the operator floating dock.
 *
 * Its OWN subpath, deliberately not folded into `./shell`. That barrel re-exports
 * `default-desktop.tsx`, which imports `@inertiajs/react`; anything reaching the dock through it
 * would drag Inertia in transitively, and the dock is the one OS surface a react-router host is most
 * likely to want. Keeping them apart is hygiene, not taxonomy.
 *
 * This entry imports no router and no host page. The Inertia wiring a host needs — `usePage()` for
 * `inControlPanel`, `router.post('/logout')` for sign-out, `router.on('before', …)` for the nav guard
 * — stays at the host, which is where this package's own import-boundary gate
 * (`scripts/check-imports.mjs`, "a package imports no router") requires it to live.
 */
export { OperatorDesk } from './OperatorDesk';
export type {
    OperatorDeskProps,
    OperatorTool,
    OperatorDeskLink,
    OperatorDeskNavGuardApi,
} from './OperatorDesk';
export { OPERATOR_DESK_CSS, OPERATOR_DESK_TASKBAR_CENTER_CSS } from './css';
