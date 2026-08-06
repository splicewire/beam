/**
 * @splicewire/beam-mainframe — the CMS-authoring host layer over the generic Mainframe engine.
 *
 * Frame OS ADR-0011 (ticket 01, EXPAND phase): the generic engine — the slot contract, the two
 * registries, the resolver, and the React delegation seam — relocated to `@schemastud/mainframe`.
 * This barrel **re-exports** those primitives so every existing consumer import keeps resolving
 * unchanged. Ticket 02 (CONTRACT phase) removes the generic re-export and points consumers directly
 * at `@schemastud/mainframe`; until then this forward is intentional.
 *
 * What stays authored here is the CMS-authoring layer: `createMainframeHost`, the `domain`/`window`
 * modes, `useBeamUxEntry`, `isPuckBody`, and the edit-affordance host wiring (see host.tsx).
 */

// --- Re-exported generic engine (relocated to @schemastud/mainframe; forwarded for compat) --------
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
    createSlotRegistry,
    type SlotRegistry,
    type SlotContribution,
    type SlotContributionInput,
    createMainframeRegistry,
    type MainframeRegistry,
    type MainframeRegistration,
    type Mainframe,
    type MainframeProps,
    type MainframeContext,
    type CustomSlotSpec,
    type RegisterOptions,
    resolveSlots,
    type ResolvedSlots,
    type MainframeCan,
    type ResolveParams,
    MainframeProvider,
    MainframeOutlet,
    useMainframe,
    useSlotRegistry,
    useResolvedSlots,
    useSlot,
    type MainframeInjection,
} from '@schemastud/mainframe';

// --- The CMS-authoring host layer (stays here) ----------------------------------------------------
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
