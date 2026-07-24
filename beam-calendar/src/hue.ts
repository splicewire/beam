import type { CalendarEventData } from './types';

/**
 * The two hue axes, chosen per mount (PRD §4, §4.2). The foundation receives an ALREADY-
 * resolved `colorToken` (a design-token name the vendored theme maps to a colour) and stays
 * source-blind. Fill-vs-dash (resident vs virtual) is orthogonal and lives in the foundation.
 */
export type HueAxis = (dto: CalendarEventData, owningCalendarId: string) => string;

/** The palette of design-token names the theme resolves (`--rbc-hue-<token>`). */
const PALETTE = ['sky', 'violet', 'amber', 'emerald', 'rose', 'cyan', 'indigo', 'pink', 'blue', 'slate'] as const;

/** Deterministically map an opaque id onto the palette (stable across renders, no state). */
function paletteFor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return PALETTE[hash % PALETTE.length];
}

/** Single mount: hue = Kind → token (status is secondary chrome via the badge). */
const KIND_HUE: Record<string, string> = {
    'composition-ref': 'sky',
    series: 'violet',
    'idea-ref': 'amber',
    decommission: 'rose',
    'disclosure-ref': 'emerald',
};

export const kindHue: HueAxis = (dto) => (dto.kind ? (KIND_HUE[dto.kind] ?? paletteFor(dto.kind)) : 'slate');

/**
 * Aggregate mount: hue = PROVENANCE → token. Provenance is the OWNING CALENDAR (PRD §3/§6:
 * "per-calendar color" so a merged grid tells you which calendar an event belongs to), not
 * the referenced published composition — that stays a deep-link in the badge.
 */
export const provenanceHue: HueAxis = (_dto, owningCalendarId) => paletteFor(owningCalendarId);
