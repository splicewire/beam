/**
 * `@splicewire/beam-ux/appshell` — the operator/console shell scaffolding (Frame OS ticket 19; the
 * three remaining shell promotions after RealmNav → `/nav`, ADR-0015 §B tier map).
 *
 * A fresh mainframe host gets the shell machinery from here instead of hand-wiring it; splicewire-app
 * re-consumes each and renders identically. All three are router-neutral (link/outlet injected) and
 * roster-agnostic (the host supplies its contribution set / section rosters / manifest):
 *
 *   1. {@link useShellMode} / {@link createEffectiveCan} — the AppShell mode-switch + `effectiveCan`
 *      gate. The host owns mode state and hands it to its `MainframeOutlet`; the gate decides WHICH
 *      contributions render (view-as-visitor down-gating). The contribution ROSTER stays host-local.
 *   2. {@link SectionShell} / {@link SectionTabStrip} + the {@link sectionMetaForPath} resolvers —
 *      the section-layout / SectionBar shell-nesting mechanism. The host supplies the section rosters
 *      and its per-section breadcrumb data logic (irreducibly host-domain); the strip + resolvers
 *      are universal.
 *   3. {@link FrameSidePanelOverlay} — the single-host-portal that gathers deep-tree side-panel
 *      requests into one overlay slot (nested-portal problem, solved). Reads the `@schemastud/frame`
 *      `useFrameSidePanelStore` (promoted in ticket 18); renders through the `@schemastud/ui` `Sheet`.
 */

// 1 — mode-switch + effectiveCan core
export {
    useShellMode,
    createEffectiveCan,
    type UseShellModeOptions,
    type ShellModeState,
    type WindowChrome,
    type FocusChrome,
} from './shellMode.js';

// 2 — section-layout / SectionBar mechanism
export {
    SectionShell,
    SectionTabStrip,
    type SectionShellProps,
    type SectionShellVariant,
    type SectionTabStripProps,
} from './SectionShell.js';
export {
    sectionMetaForPath,
    navGroupForPath,
    metaAreaForPath,
    metaAreaCrumbs,
} from './sectionMeta.js';

// 3 — the single-host-portal overlay
export { FrameSidePanelOverlay } from './FrameSidePanelOverlay.js';

// shared types
export type {
    ShellMode,
    Capability,
    MainframeCan,
    SectionTab,
    SectionGroup,
    SectionMeta,
    MetaArea,
    MetaCrumb,
    SectionLinkComponent,
} from './types.js';
