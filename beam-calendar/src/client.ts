import type { CalendarClient } from '@schemastud/big-calendar';
import { decodeRef } from './codec';
import { kindHue, provenanceHue, type HueAxis } from './hue';
import { toFoundationEvent } from './mapEvent';
import type { CalendarTransport } from './types';

/**
 * The two client adapters — the ONLY thing the two mounts differ in (PRD §3, §5.3). Both map
 * the `_resources` projection DTO into `FoundationCalendarEvent` and route every write to the
 * correct composition by decoding the write-target `ref`. All URL/HTTP concerns live in the
 * injected `transport` (host-side); these adapters are pure map + merge + route.
 */

/** Single-composition mount (Studio): one calendar fixed; hue = Kind. */
export function createSingleClient(
    transport: CalendarTransport,
    compositionId: string,
    hue: HueAxis = kindHue,
): CalendarClient {
    return {
        listEvents: async (range) =>
            (await transport.listEvents(compositionId, range)).map((d) => toFoundationEvent(d, compositionId, hue)),
        reAnchor: (ref, newDate) => transport.reAnchor(decodeRef(ref).compositionId, decodeRef(ref), newDate),
        createEvent: async (input) =>
            toFoundationEvent(await transport.createRelease(compositionId, input), compositionId, hue),
        editCell: (ref, patch) => transport.editCell(decodeRef(ref).compositionId, decodeRef(ref), patch),
        materialize: async (ref) => {
            const target = decodeRef(ref);
            return toFoundationEvent(await transport.materialize(target.compositionId, target), target.compositionId, hue);
        },
        override: async (ref, action) => {
            const target = decodeRef(ref);
            return toFoundationEvent(await transport.override(target.compositionId, target, action), target.compositionId, hue);
        },
    };
}

/**
 * Aggregate mount (main page): every calendar-profile Composition fetched + merged; hue =
 * provenance (owning calendar). Each write routes to the right composition by decoding the
 * `ref` — the merged grid never misfires a write across calendars (PRD §5.3).
 */
export function createAggregateClient(
    transport: CalendarTransport,
    hue: HueAxis = provenanceHue,
): CalendarClient {
    return {
        listEvents: async (range) => {
            const calendars = await transport.listCalendars();
            const perCalendar = await Promise.all(
                calendars.map(async (calendar) =>
                    (await transport.listEvents(calendar.id, range)).map((d) => toFoundationEvent(d, calendar.id, hue)),
                ),
            );
            return perCalendar.flat();
        },
        reAnchor: (ref, newDate) => {
            const target = decodeRef(ref);
            return transport.reAnchor(target.compositionId, target, newDate);
        },
        // Aggregate create is ambiguous (which calendar?) — the host's edit panel picks the
        // calendar in create mode and calls transport.createRelease directly. The foundation's
        // empty-cell click opens that panel; it never calls this path.
        createEvent: () =>
            Promise.reject(new Error('Aggregate create must target a calendar — use the edit panel (create mode).')),
        editCell: (ref, patch) => {
            const target = decodeRef(ref);
            return transport.editCell(target.compositionId, target, patch);
        },
        materialize: async (ref) => {
            const target = decodeRef(ref);
            return toFoundationEvent(await transport.materialize(target.compositionId, target), target.compositionId, hue);
        },
        override: async (ref, action) => {
            const target = decodeRef(ref);
            return toFoundationEvent(await transport.override(target.compositionId, target, action), target.compositionId, hue);
        },
    };
}
