import type {
    CalendarClient,
    CalendarServices,
    EditPanelContext,
    FoundationCalendarEvent,
    LaneAxis,
    NotifyMessage,
    OverrideAction,
    Subscribe,
} from '@schemastud/big-calendar';
// The generated calendar projection DTO (slice 05, ADR-0070), sliced off the app's single
// generated.d.ts and delivered via @splicewire/_resources. This build-time dependency is
// LOAD-BEARING (rehome-ui): the satellite's typing IS the projection — never a local copy —
// so the PHP source of truth genuinely travels into this package. tsup keeps the `import
// type` in the shipped dist/index.d.ts.
import type { CalendarEventData } from '@splicewire/_resources/types/calendar';

export type {
    CalendarEventData,
    // Re-exported from the foundation so a host types off one entry point (rehome-ui §profile).
    CalendarClient,
    CalendarServices,
    EditPanelContext,
    FoundationCalendarEvent,
    LaneAxis,
    NotifyMessage,
    OverrideAction,
    Subscribe,
};

/** Which of the two mounts this is (PRD §3): they differ ONLY in the client adapter + provenance. */
export type CalendarMount = 'aggregate' | 'single';

/** A calendar Composition summary — the aggregate mount discovers all calendar-profile ones. */
export interface CalendarSummary {
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
export interface RefParts {
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
export interface CalendarTransport {
    /** All calendar-profile Compositions (aggregate mount only). */
    listCalendars(): Promise<CalendarSummary[]>;
    /** The slice-05 projection events for one calendar. */
    listEvents(compositionId: string, range?: { start: Date; end: Date }): Promise<CalendarEventData[]>;
    /** Re-anchor a resident Release. */
    reAnchor(compositionId: string, target: RefParts, newDate: Date): Promise<void>;
    /** Create a one-off Release on a date. */
    createRelease(compositionId: string, input: { date: Date } & Record<string, unknown>): Promise<CalendarEventData>;
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
export interface CompositionCalendarProps {
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
    renderEditPanel?: (ctx: EditPanelContext) => import('react').ReactNode;
    /** Feedback → the host's toaster (e.g. sonner); the notify action drives re-anchor undo. */
    notify?: (msg: NotifyMessage) => void;
    onError?: (err: unknown) => void;
    /** Real-time → the host transport (Echo/websocket/poll), scoped per mount. */
    subscribe?: Subscribe;
    defaultDate?: Date;
    height?: number | string;
}
