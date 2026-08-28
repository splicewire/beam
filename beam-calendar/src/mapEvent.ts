import type { FoundationCalendarEvent } from '@schemastud/big-calendar';
import { encodeRef } from './codec';
import type { HueAxis } from './hue';
import type { CalendarEventData } from './types';

/**
 * The satellite's `meta` bag (PRD §8) — the vocab the foundation NEVER reads, handed back to
 * the satellite's own `renderX` chrome. Kept typed here so the badge/facets are type-safe.
 */
export interface CalendarEventMeta {
    status: string;
    kind: string | null;
    seriesRef: string | null;
    recurrenceId: string | null;
    /** The referenced published Composition (deep-link `/studio/{id}`); distinct from the owning calendar. */
    referencedCompositionId: string | null;
}

/** Read the satellite meta bag back off a foundation event. */
export function readMeta(event: FoundationCalendarEvent): CalendarEventMeta {
    return event.meta as unknown as CalendarEventMeta;
}

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
export function toFoundationEvent(
    dto: CalendarEventData,
    owningCalendarId: string,
    hue: HueAxis,
): FoundationCalendarEvent {
    const start = dto.anchor ? new Date(`${dto.anchor}T00:00:00`) : new Date(NaN);
    const meta: CalendarEventMeta = {
        status: dto.status,
        kind: dto.kind,
        seriesRef: dto.series_ref,
        recurrenceId: dto.recurrence_id,
        referencedCompositionId: dto.composition_id,
    };

    return {
        id: dto.cell_id ?? `${dto.series_ref ?? ''}|${dto.recurrence_id ?? ''}|${dto.anchor ?? ''}`,
        title: dto.title,
        start,
        end: start,
        allDay: true,
        sourceId: owningCalendarId,
        laneId: dto.channel,
        colorToken: hue(dto, owningCalendarId),
        resident: !dto.virtual,
        ref: encodeRef({
            compositionId: owningCalendarId,
            cellId: dto.cell_id,
            seriesRef: dto.series_ref,
            recurrenceId: dto.recurrence_id,
        }),
        meta: meta as unknown as Record<string, unknown>,
    };
}
