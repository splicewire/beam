// @splicewire/beam-calendar — the vocab-aware calendar satellite (big-calendar-surface
// PRD §3/§4/§5/§7). ONE CompositionCalendar, mounted twice (aggregate + single), on the
// source-blind @schemastud/big-calendar foundation + the @splicewire/_resources projection
// DTO. It knows calendar/composition/channel/ADR-0070 exist and spreads the aggregate-vs-
// single difference across the vendor seam; it NEVER imports react-big-calendar.

// The keystone component.
export { CompositionCalendar } from './CompositionCalendar';

// The client adapters (the ONLY thing the two mounts differ in) + the DTO→foundation mapping.
export { createAggregateClient, createSingleClient } from './client';
export { toFoundationEvent, readMeta, type CalendarEventMeta } from './mapEvent';

// The ref + resident codec (the write-target token the foundation carries opaquely).
export { encodeRef, decodeRef, isResidentRef } from './codec';

// The two hue axes (single = Kind, aggregate = provenance) + the axis type.
export { kindHue, provenanceHue, type HueAxis } from './hue';

// The vocab renderX chrome (also exported so a host can compose it).
export { EventBadge, LaneHeader, Filters, type FacetState } from './chrome';

// ── The rehomed CalendarCellForm surface (frame-canonical-forms ticket 02) ──────────────
// A pre-packaged, DTO-first data-surface (rehome-ui / ADR-0116): the purpose-built calendar
// item editor, typed off the @splicewire/_resources CompositionCell DTO, with its four
// host-couplings injected via the four kinds (client REQUIRED / notify·onError / renderX /
// subscribe-none). Its react-query layer travels inside the package (cell-hooks) and calls the
// injected client.
export { CalendarCellForm, isFriendlyCalendarKind } from './CalendarCellForm';
export { CalendarCellFormProvider, useCellFormServices, useCellNotify } from './cell-provider';
export { useCompositionCells, useCompositionProfiles, useSaveCell } from './cell-hooks';
export type {
    CompositionCellData,
    CalendarCell,
    CalendarCellKind,
    CalendarProfile,
    SaveCellInput,
    CellClientError,
    CalendarCellClient,
    CellNotifyMessage,
    CellContentPickerProps,
    CalendarCellFormServices,
} from './cell-types';

// types.ts: the generated projection DTO (re-exported off @splicewire/_resources) + the
// four-kind foundation contract + the satellite-facing transport/props/ref types.
export type {
    CalendarEventData,
    CalendarClient,
    CalendarServices,
    EditPanelContext,
    FoundationCalendarEvent,
    LaneAxis,
    NotifyMessage,
    OverrideAction,
    Subscribe,
    CalendarMount,
    CalendarSummary,
    RefParts,
    CalendarTransport,
    CompositionCalendarProps,
} from './types';
