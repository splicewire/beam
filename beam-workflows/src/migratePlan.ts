/**
 * Pure planning helpers for the marking-migration wizard (beam-workflows-ux ticket 20, Surface 3). The
 * place-mapping is an explicit, reviewable author choice (a hard UI constraint), so the default map +
 * completeness check live here, unit-tested without a DOM. The wizard wraps the artisan-only
 * `MarkingMigrator` over HTTP — the actual re-pin is all-or-nothing on the server.
 */

/** The server's `MigrationReport` shape (mirrors `MigrationReport::toArray()`). */
export type MigrationReport = {
    lineageKey: string;
    fromVersionId: string;
    toVersionId: string;
    total: number;
    migrated: number;
    unmappable: Array<{ id: string; place: string }>;
    applied: boolean;
    dryRun: boolean;
};

export type PlaceMap = Record<string, string>;

/**
 * The default old→new place map: each `from`-version place maps to the same-named `to`-version place
 * when one exists, else to '' (an unmapped place the author MUST resolve — a removed/renamed place).
 */
export function initialPlaceMap(fromPlaces: string[], toPlaces: string[]): PlaceMap {
    const toSet = new Set(toPlaces);
    const map: PlaceMap = {};
    for (const place of fromPlaces) {
        map[place] = toSet.has(place) ? place : '';
    }

    return map;
}

/** Every `from` place must map to a declared `to` place before a run can be attempted. */
export function mapComplete(map: PlaceMap): boolean {
    const values = Object.values(map);

    return values.length > 0 && values.every((target) => target !== '');
}

/** Drop empty entries so the request only carries resolved mappings. */
export function resolvedMap(map: PlaceMap): PlaceMap {
    return Object.fromEntries(Object.entries(map).filter(([, target]) => target !== ''));
}

/**
 * The all-or-nothing headline (a hard UI constraint — "3 blocked all 142" must read unmistakably). Null
 * when nothing is blocked.
 */
export function blockedHeadline(report: MigrationReport): string | null {
    if (report.unmappable.length === 0) return null;

    const n = report.unmappable.length;

    return `${n} record${n === 1 ? '' : 's'} blocked all ${report.total} — nothing was migrated.`;
}
