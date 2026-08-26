/**
 * @splicewire/beam-mainframe — the CMS-authoring host layer, ONLY.
 *
 * Frame OS ADR-0011: the generic Mainframe engine — the slot contract, the two registries, the
 * resolver, and the React delegation seam — lives in `@schemastud/mainframe`. Ticket 01 (EXPAND)
 * relocated it there and had this barrel temporarily re-forward it for compat; ticket 02 (CONTRACT,
 * this state) **removes that re-forward**. The relocation is now real: consumers of the generic
 * engine import `createSlotRegistry`/`resolveSlots`/`MainframeOutlet`/`MainframeProvider`/`CORE_SLOTS`
 * etc. directly from `@schemastud/mainframe`, and this package exports ONLY the CMS-authoring layer
 * below. (A guard test — src/__tests__/barrel-contract.test.ts — asserts the generic primitives are
 * no longer re-exported here, so a future accidental re-forward is caught.)
 *
 * What is authored here: `createMainframeHost`, the `domain`/`window` modes, `useBeamUxEntry`,
 * `isPuckBody`, and the edit-affordance host wiring (see host.tsx). host.tsx / story-harness.tsx
 * import their engine primitives directly from `@schemastud/mainframe`.
 */

// --- The CMS-authoring host layer (the only thing this package exports) ----------------------------
export {
    createMainframeHost,
    useBeamUxEntry,
    isPuckBody,
    entryRefLabel,
    DomainMainframe,
    WindowMainframe,
    defaultRibbon,
    type EntryRef,
    type MainframeHostConfig,
    type HostPageContext,
    type HostEntryBody,
    type BeamUxEntryContext,
    type RibbonProps,
    type RibbonRender,
} from './host';
