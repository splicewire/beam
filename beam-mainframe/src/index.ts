/**
 * @splicewire/beam-mainframe — the app-level frame that hosts schemastud Frames.
 *
 * Ticket 03 output: the delegation + registry **seam** every mode plugs into. No modes ship here
 * (`desk` → ticket 04, `window` → ticket 05); this is the mechanism alone. See ADR-0099 for doctrine.
 */

// The frozen slot contract (ticket 01) as types + tables.
export {
    CORE_SLOTS,
    OPTIONAL_SLOTS,
    SLOT_FILL_TYPES,
    SLOT_ZONES,
    DEFAULT_ORDER,
    DEFAULT_ZONE,
    type CoreSlotName,
    type OptionalSlotName,
    type SlotName,
    type FillType,
    type MainPayload,
    type MainRender,
} from './contract';

// The named-slot registry (the socket — compose-many-by-name; SSR-safe per scope).
export {
    createSlotRegistry,
    type SlotRegistry,
    type SlotContribution,
    type SlotContributionInput,
} from './slot-registry';

// The Mainframe registry (register a mode-layout by name).
export {
    createMainframeRegistry,
    type MainframeRegistry,
    type MainframeRegistration,
    type Mainframe,
    type MainframeProps,
    type MainframeContext,
    type CustomSlotSpec,
    type RegisterOptions,
} from './mainframe-registry';

// The resolver (gate by `can`, sort ordered, single-node winner, unknown-slot dev-warn).
export { resolveSlots, type ResolvedSlots, type MainframeCan, type ResolveParams } from './resolve';

// The OOTB host-shell factory (the layer above the seam): a host writes ~15 lines of config and gets
// the framed `domain`/`window` layout. Modes + `useBeamUxEntry` + `isPuckBody` bundle here (ticket 06).
export {
    createMainframeHost,
    useBeamUxEntry,
    isPuckBody,
    DomainMainframe,
    WindowMainframe,
    defaultRibbon,
    type MainframeHostConfig,
    type HostPageContext,
    type HostEntryBody,
    type BeamUxEntryContext,
    type RibbonProps,
    type RibbonRender,
} from './host';

// The React seam (host delegation): provider, hooks, the delegation outlet, declarative contribution.
export {
    MainframeProvider,
    MainframeOutlet,
    useMainframe,
    useSlotRegistry,
    useResolvedSlots,
    useSlot,
    type MainframeInjection,
} from './react';
