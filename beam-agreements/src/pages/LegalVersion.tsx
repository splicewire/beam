import { effectiveDate, type LegalVersionFull, META_STYLE, PAGE_STYLE, TEXT_STYLE } from './legal-shared';

/**
 * agreements 09: one version of an Agreement in full, public (`legal/{key}/versions/{label}`, Inertia page
 * `agreements/legal-version`), with a link back to the version in force.
 */
export interface LegalVersionProps {
    /** The server also sends `key`; React keeps it out of props, and the page doesn't need it. */
    title: string;
    version: LegalVersionFull;
    legalUrl: string | null;
}

export default function LegalVersion({ title, version, legalUrl }: LegalVersionProps) {
    return (
        <main data-beam-agreements="legal-version" style={PAGE_STYLE}>
            <header style={{ display: 'grid', gap: 4 }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h1>
                <p style={META_STYLE}>
                    Version {version.label} · in effect from {effectiveDate(version.effectiveAt)}
                </p>
                {legalUrl ? (
                    <p style={{ margin: 0 }}>
                        <a href={legalUrl}>Read the version in force</a>
                    </p>
                ) : null}
            </header>
            {version.summary ? (
                <p data-beam-agreements="summary" style={{ margin: 0 }}>
                    <strong>What changed:</strong> {version.summary}
                </p>
            ) : null}
            <article style={TEXT_STYLE}>{version.content}</article>
        </main>
    );
}
