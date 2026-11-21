/** agreements 09: one version as the seam's public legal pages serve it (LegalPagesController::present()). */
export interface LegalVersionSummary {
    label: string;
    /** ISO-8601. */
    effectiveAt: string;
    material: boolean;
    digest: string;
    summary: string | null;
    url: string | null;
}

export interface LegalVersionFull extends LegalVersionSummary {
    content: string;
}

/** The effective date as a reader sees it: the calendar date, in UTC so every reader sees the same day. */
export function effectiveDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export const PAGE_STYLE = { maxWidth: '44rem', margin: '3rem auto', padding: '0 1rem', display: 'grid', gap: 16 } as const;
export const META_STYLE = { margin: 0, fontSize: '0.875rem', opacity: 0.75 } as const;
export const TEXT_STYLE = { whiteSpace: 'pre-wrap', lineHeight: 1.6 } as const;
