import * as react from 'react';
import { ReactNode } from 'react';
import { OverrideAction, LaneAxis, EditPanelContext, NotifyMessage, Subscribe, CalendarClient, FoundationCalendarEvent } from '@schemastud/big-calendar';
export { CalendarClient, CalendarServices, EditPanelContext, FoundationCalendarEvent, LaneAxis, NotifyMessage, OverrideAction, Subscribe } from '@schemastud/big-calendar';
import { CalendarEventData } from '@splicewire/_resources/types/calendar';
export { CalendarEventData } from '@splicewire/_resources/types/calendar';
import { CompositionCellData } from '@splicewire/_resources/types/cell';
export { CompositionCellData } from '@splicewire/_resources/types/cell';
import * as _tanstack_react_query from '@tanstack/react-query';

/** Which of the two mounts this is (PRD §3): they differ ONLY in the client adapter + provenance. */
type CalendarMount = 'aggregate' | 'single';
/** A calendar Composition summary — the aggregate mount discovers all calendar-profile ones. */
interface CalendarSummary {
    id: string;
    title: string | null;
}
/**
 * The decoded write-target the satellite's `ref` codec carries (PRD §3.2). The foundation
 * treats `ref` as opaque; the satellite encodes `(owning calendar, cell | series+recurrence)`
 * into it so a write routes to the right composition and targets the right cell/occurrence —
 * this is why interaction "falls out": a resident ref edits the cell, a non-resident ref
 * (no cellId) materializes/overrides the occurrence.
 */
interface RefParts {
    /** The CALENDAR Composition the cell lives in — the write target + aggregate provenance axis. */
    compositionId: string;
    /** The stored cell id (a resident Release); null for a virtual Occurrence. */
    cellId: string | null;
    /** The series cell back-pointer (ADR-0070); null for a non-series event. */
    seriesRef: string | null;
    /** The RFC-5545 RECURRENCE-ID coordinate; null for a non-series event. */
    recurrenceId: string | null;
}
/**
 * The minimal transport the HOST injects (PRD §7.3): relative-endpoint IO scoped per
 * composition. All URL/route()/HTTP concerns live in the host adapter that fills this — the
 * satellite only maps + routes + merges. `target` is the decoded {@see RefParts}; the host
 * never decodes.
 */
interface CalendarTransport {
    /** All calendar-profile Compositions (aggregate mount only). */
    listCalendars(): Promise<CalendarSummary[]>;
    /** The slice-05 projection events for one calendar. */
    listEvents(compositionId: string, range?: {
        start: Date;
        end: Date;
    }): Promise<CalendarEventData[]>;
    /** Re-anchor a resident Release. */
    reAnchor(compositionId: string, target: RefParts, newDate: Date): Promise<void>;
    /** Create a one-off Release on a date. */
    createRelease(compositionId: string, input: {
        date: Date;
    } & Record<string, unknown>): Promise<CalendarEventData>;
    /** Edit a stored cell's fields. */
    editCell(compositionId: string, target: RefParts, patch: Record<string, unknown>): Promise<void>;
    /** Materialize a non-resident occurrence into a stored Release. */
    materialize(compositionId: string, target: RefParts): Promise<CalendarEventData>;
    /** Override a non-resident occurrence: pin | skip | replaceTemplate. */
    override(compositionId: string, target: RefParts, action: OverrideAction): Promise<CalendarEventData>;
}
/**
 * The satellite's public component contract. The two mounts differ ONLY in `mount` (+ the
 * required `compositionId` for single). The host injects transport + feedback + the
 * load-bearing `renderEditPanel` (its Sheet + CellFormPanel, which cannot enter a package) +
 * real-time `subscribe`; the satellite supplies the vocab-aware chrome (event badge,
 * provenance/status facets, lane headers) itself.
 */
interface CompositionCalendarProps {
    mount: CalendarMount;
    /** Required for the single mount — the one calendar this view is scoped to. */
    compositionId?: string;
    /** The host transport (relative endpoints; no URLs in the package boundary). */
    transport: CalendarTransport;
    /** The opaque lane axis (channels). One lane collapses; >1 renders channels-as-lanes. */
    lanes?: LaneAxis[];
    /**
     * The calendars for the aggregate provenance facet. When the host already has them (it does —
     * it needs them for the create-picker), pass them in so the satellite does NOT issue a second
     * `listCalendars` fetch. Omitted → the satellite fetches its own (single mount ignores this).
     */
    calendars?: CalendarSummary[];
    /** The host's edit Sheet + CellFormPanel, in resident-edit / reference / create modes. */
    renderEditPanel?: (ctx: EditPanelContext) => react.ReactNode;
    /** Feedback → the host's toaster (e.g. sonner); the notify action drives re-anchor undo. */
    notify?: (msg: NotifyMessage) => void;
    onError?: (err: unknown) => void;
    /** Real-time → the host transport (Echo/websocket/poll), scoped per mount. */
    subscribe?: Subscribe;
    defaultDate?: Date;
    height?: number | string;
}

/**
 * The ONE vocab-aware calendar component, mounted twice (PRD §3, the keystone). The two mounts
 * differ ONLY in the injected `client` adapter (aggregate fetch-all-merge / single fixed) + the
 * provenance-driven facets. It sits on the source-blind `@schemastud/big-calendar` foundation,
 * types off the `@splicewire/_resources` projection DTO, and NEVER imports react-big-calendar.
 *
 * The host injects transport + feedback + the load-bearing `renderEditPanel` (its Sheet +
 * CellFormPanel, which cannot enter a package) + real-time `subscribe`; the satellite supplies
 * the vocab chrome (event badge, provenance/status facets, lane headers) and the hue axis.
 */
declare function CompositionCalendar({ mount, compositionId, transport, lanes, calendars: calendarsProp, renderEditPanel, notify, onError, subscribe, defaultDate, height, }: CompositionCalendarProps): react.JSX.Element;

/**
 * The two hue axes, chosen per mount (PRD §4, §4.2). The foundation receives an ALREADY-
 * resolved `colorToken` (a design-token name the vendored theme maps to a colour) and stays
 * source-blind. Fill-vs-dash (resident vs virtual) is orthogonal and lives in the foundation.
 */
type HueAxis = (dto: CalendarEventData, owningCalendarId: string) => string;
declare const kindHue: HueAxis;
/**
 * Aggregate mount: hue = PROVENANCE → token. Provenance is the OWNING CALENDAR (PRD §3/§6:
 * "per-calendar color" so a merged grid tells you which calendar an event belongs to), not
 * the referenced published composition — that stays a deep-link in the badge.
 */
declare const provenanceHue: HueAxis;

/**
 * The two client adapters — the ONLY thing the two mounts differ in (PRD §3, §5.3). Both map
 * the `_resources` projection DTO into `FoundationCalendarEvent` and route every write to the
 * correct composition by decoding the write-target `ref`. All URL/HTTP concerns live in the
 * injected `transport` (host-side); these adapters are pure map + merge + route.
 */
/** Single-composition mount (Studio): one calendar fixed; hue = Kind. */
declare function createSingleClient(transport: CalendarTransport, compositionId: string, hue?: HueAxis): CalendarClient;
/**
 * Aggregate mount (main page): every calendar-profile Composition fetched + merged; hue =
 * provenance (owning calendar). Each write routes to the right composition by decoding the
 * `ref` — the merged grid never misfires a write across calendars (PRD §5.3).
 */
declare function createAggregateClient(transport: CalendarTransport, hue?: HueAxis): CalendarClient;

/**
 * The satellite's `meta` bag (PRD §8) — the vocab the foundation NEVER reads, handed back to
 * the satellite's own `renderX` chrome. Kept typed here so the badge/facets are type-safe.
 */
interface CalendarEventMeta {
    status: string;
    kind: string | null;
    seriesRef: string | null;
    recurrenceId: string | null;
    /** The referenced published Composition (deep-link `/studio/{id}`); distinct from the owning calendar. */
    referencedCompositionId: string | null;
}
/** Read the satellite meta bag back off a foundation event. */
declare function readMeta(event: FoundationCalendarEvent): CalendarEventMeta;
/**
 * Map the slice-05 projection DTO INTO a {@see FoundationCalendarEvent} (PRD §4.2). The
 * foundation cannot depend on `@splicewire/_resources`, so this mapping lives here.
 *
 *  - `sourceId` (top-level, routable) = the OWNING CALENDAR — the write target and the
 *    aggregate provenance axis. The referenced published composition lives in `meta`.
 *    The foundation's field was called `compositionId` until this very mapping — filling a
 *    "composition" field with a calendar id and parking the real composition in `meta` — was
 *    taken as evidence the field name was wrong rather than the mapping.
 *  - `colorToken` is resolved by the mount's `hue` axis; the foundation just paints it.
 *  - `resident = !virtual`; `ref` encodes the full write-target (owning calendar + cell |
 *    series+recurrence) so a write routes correctly.
 *  - `meta` carries status/kind/series/referenced-composition for the satellite's chrome.
 */
declare function toFoundationEvent(dto: CalendarEventData, owningCalendarId: string, hue: HueAxis): FoundationCalendarEvent;

declare function encodeRef(parts: RefParts): string;
declare function decodeRef(ref: string): RefParts;
/** A resident ref addresses a stored cell (has a cellId); a non-resident ref does not. */
declare function isResidentRef(ref: string): boolean;

/** renderEventBadge (PRD §4.2): series Repeat badge, Kind chrome (title), status dot. */
declare function EventBadge({ event }: {
    event: FoundationCalendarEvent;
}): react.JSX.Element;
/** renderLaneHeader (PRD §4.2): the channel label per lane, as a legend chip. */
declare function LaneHeader({ lane }: {
    lane: LaneAxis;
}): react.JSX.Element;
interface FacetState {
    statuses: Set<string>;
    calendars: Set<string>;
}
/**
 * renderFilters (PRD §5, aggregate only): provenance (owning calendar) + status facets. The
 * satellite holds the facet state; toggling a chip filters the merged grid client-side via the
 * foundation's opaque `filterEvent` predicate (no network refetch). An empty set = "all".
 */
declare function Filters({ calendars, statuses, active, onToggleCalendar, onToggleStatus, }: {
    calendars: {
        id: string;
        label: string;
    }[];
    statuses: string[];
    active: FacetState;
    onToggleCalendar: (id: string) => void;
    onToggleStatus: (status: string) => void;
}): react.JSX.Element;

/**
 * The form-facing cell shape. Structurally the generated {@link CompositionCellData}, but with the
 * two per-profile payloads narrowed from the lossy spatie array-cast (`Array<any>`) to the JSON
 * object map the wire actually delivers — the studio/api.ts precedent. `slots.kind`/`slots.anchor`/
 * `slots.composition_id` etc. are read as object keys, so an `Array<any>` type would be unusable.
 * DTO typing is generic with a default bound to the projection (rehome-ui §profile).
 */
type CalendarCell<T extends CompositionCellData = CompositionCellData> = Omit<T, 'slots' | 'output' | 'children'> & {
    slots: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    children?: CalendarCell[] | null;
};
/**
 * A calendar profile's Kind descriptor — the `/composition-profiles` config the form reads to
 * resolve a short suffix (`series`) to its REAL full schema-$id URL (…/kind/series), which the
 * write path admits on. Config-shaped (no server Data class), so declared here, not projected.
 */
interface CalendarCellKind {
    kind: string;
    label?: string;
    schema?: Record<string, unknown>;
}
/** The calendar profile descriptor the form needs (only the Kind list matters to it). */
interface CalendarProfile {
    name: string;
    cellKinds: CalendarCellKind[];
}
/** The write payload the form posts — a create (with `lane`) or an edit (targeting a `cellId`). */
interface SaveCellInput {
    /** Present ⇒ edit that stored cell; absent ⇒ create a new cell. */
    cellId?: string | null;
    /** The delivery lane a new cell lands on (create only). */
    lane?: string;
    /** The profile-typed cell payload (the compartment truth). */
    slots: Record<string, unknown>;
}
/**
 * A server field-validation failure (422) surfaced by the injected client so the form can map
 * `slots.*` errors onto its fields. The client THROWS this (or any error carrying `.fieldErrors` /
 * `.message`); the form never inspects an HTTP response shape.
 */
interface CellClientError {
    /** Per-field messages keyed by `slots.<field>` (or bare `<field>`); first message wins. */
    fieldErrors?: Record<string, string[]>;
    /** A whole-form message (an admission RuntimeException, a non-422 failure). */
    message?: string;
}
/**
 * The transport the HOST injects (rehome-ui `client`, REQUIRED). A composition-scoped IO seam:
 * relative endpoints only, `compositionId` is a call arg (never a bundled route). The form's
 * react-query layer (hooks.ts) calls THIS — all URL/route()/axios concerns live in the host adapter
 * that fills it. On a save failure the adapter throws a {@link CellClientError} (not a raw axios
 * error) so the form stays HTTP-agnostic.
 */
interface CalendarCellClient<T extends CompositionCellData = CompositionCellData> {
    /** All cells of a composition — the form reads placed channels off these. */
    listCells(compositionId: string): Promise<CalendarCell<T>[]>;
    /** The composition profiles — the form resolves calendar Kind ids off these. */
    listProfiles(): Promise<CalendarProfile[]>;
    /** Create or edit a cell on a composition. */
    saveCell(compositionId: string, input: SaveCellInput): Promise<void>;
}
/** The success/failure feedback message the form emits (rehome-ui `notify`). */
interface CellNotifyMessage {
    kind: 'success' | 'error';
    text: string;
}
/** What the host renders into the "pick a composition to point at" slot (rehome-ui `renderX`). */
interface CellContentPickerProps {
    /** The currently-selected composition id, or '' for none. */
    value: string;
    /** The human title of the selection (may be '' — the picker resolves it). */
    label: string;
    /** The calendar's own id — a calendar can't schedule itself. */
    excludeId?: string;
    onSelect: (option: {
        id: string;
        title: string;
    }) => void;
}
/**
 * The four-kind service bundle the {@link CalendarCellFormProvider} injects. Drawn ONLY from the
 * four injection kinds (rehome-ui §profile): `client` (REQUIRED), `notify`/`onError` (feedback,
 * optional, dep-free default), `renderContentPicker` (a `renderX` host-chrome slot, optional),
 * `subscribe` (none — omitted). No fifth kind.
 */
interface CalendarCellFormServices<T extends CompositionCellData = CompositionCellData> {
    client: CalendarCellClient<T>;
    notify?: (msg: CellNotifyMessage) => void;
    onError?: (err: unknown) => void;
    /** The composition/content picker chrome (the app's `ContentPicker`, over its own combobox). */
    renderContentPicker?: (props: CellContentPickerProps) => react.ReactNode;
}

declare function CalendarCellForm({ compositionId, initialCell, initialDate, onSaved, }: {
    compositionId: string;
    initialCell?: CalendarCell | null;
    initialDate?: Date | null;
    onSaved: () => void;
}): react.JSX.Element;

declare function CalendarCellFormProvider({ services, children, }: {
    services: CalendarCellFormServices;
    children: ReactNode;
}): react.JSX.Element;
/** Read the injected services. Throws if used outside the provider (a wiring error, not a runtime path). */
declare function useCellFormServices(): CalendarCellFormServices;
/** Fire the injected `notify` (dependency-free default: no-op if the host wired none). */
declare function useCellNotify(): (msg: CellNotifyMessage) => void;

/** All cells of a composition — the form reads its emergent channel set off these. */
declare function useCompositionCells(compositionId?: string): _tanstack_react_query.UseQueryResult<CalendarCell[], Error>;
/** The composition profiles — the form resolves the calendar's real Kind ids off these. */
declare function useCompositionProfiles(): _tanstack_react_query.UseQueryResult<CalendarProfile[], Error>;
/** Create or edit a cell; invalidates the owning composition's cell + profile caches on success. */
declare function useSaveCell(compositionId: string): _tanstack_react_query.UseMutationResult<void, Error, SaveCellInput, unknown>;

export { type CalendarCell, type CalendarCellClient, CalendarCellForm, CalendarCellFormProvider, type CalendarCellFormServices, type CalendarCellKind, type CalendarEventMeta, type CalendarMount, type CalendarProfile, type CalendarSummary, type CalendarTransport, type CellClientError, type CellContentPickerProps, type CellNotifyMessage, CompositionCalendar, type CompositionCalendarProps, EventBadge, type FacetState, Filters, type HueAxis, LaneHeader, type RefParts, type SaveCellInput, createAggregateClient, createSingleClient, decodeRef, encodeRef, isResidentRef, kindHue, provenanceHue, readMeta, toFoundationEvent, useCellFormServices, useCellNotify, useCompositionCells, useCompositionProfiles, useSaveCell };
