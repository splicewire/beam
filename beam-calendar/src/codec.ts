import type { RefParts } from './types';

/**
 * The `ref` + `resident` codec (PRD §3.2, ADR-0048/0070). The foundation carries `ref` as an
 * OPAQUE string and a `resident` boolean; the satellite encodes the full write-target into
 * `ref` so a later write can route to the owning calendar and target the exact cell or
 * occurrence — without the foundation ever learning the vocabulary.
 *
 * Encoding: a pipe-delimited `v1|compositionId|cellId|seriesRef|recurrenceId` (empty segment =
 * null). Composition/cell ids are UUIDs and series refs are UUIDs, so `|` never collides.
 * `resident === (cellId !== null)`: a resident ref addresses a stored cell (edit); a
 * non-resident ref (no cellId, has seriesRef+recurrenceId) addresses a virtual occurrence
 * (materialize/override). This is why interaction "falls out" from residence.
 */
const PREFIX = 'v1';

export function encodeRef(parts: RefParts): string {
    return [PREFIX, parts.compositionId, parts.cellId ?? '', parts.seriesRef ?? '', parts.recurrenceId ?? ''].join('|');
}

export function decodeRef(ref: string): RefParts {
    const [, compositionId = '', cellId = '', seriesRef = '', recurrenceId = ''] = ref.split('|');
    return {
        compositionId,
        cellId: cellId === '' ? null : cellId,
        seriesRef: seriesRef === '' ? null : seriesRef,
        recurrenceId: recurrenceId === '' ? null : recurrenceId,
    };
}

/** A resident ref addresses a stored cell (has a cellId); a non-resident ref does not. */
export function isResidentRef(ref: string): boolean {
    return decodeRef(ref).cellId !== null;
}
