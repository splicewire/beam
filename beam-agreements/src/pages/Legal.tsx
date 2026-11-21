import { effectiveDate, type LegalVersionFull, type LegalVersionSummary, META_STYLE, PAGE_STYLE, TEXT_STYLE } from './legal-shared';

/**
 * agreements 09: the PUBLIC legal page (`legal/{key}`, Inertia page `agreements/legal`). It shows the version in force,
 * with its label, effective date, what changed and full text, then every earlier version, each linked to its own page.
 * The server never sends a version before its effective date. Styling is inline only: a host's Tailwind doesn't scan
 * node_modules.
 */
export interface LegalProps {
    /** The server also sends `key`; React keeps it out of props, and the page doesn't need it. */
    title: string;
    current: LegalVersionFull;
    earlier: LegalVersionSummary[];
}

export default function Legal({ title, current, earlier }: LegalProps) {
    return (
        <main data-beam-agreements="legal" style={PAGE_STYLE}>
            <header style={{ display: 'grid', gap: 4 }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h1>
                <p style={META_STYLE}>
                    Version {current.label} · in effect since {effectiveDate(current.effectiveAt)}
                </p>
            </header>
            {current.summary ? (
                <p data-beam-agreements="summary" style={{ margin: 0 }}>
                    <strong>What changed:</strong> {current.summary}
                </p>
            ) : null}
            <article style={TEXT_STYLE}>{current.content}</article>
            {earlier.length > 0 ? (
                <section aria-labelledby="beam-agreements-earlier" style={{ display: 'grid', gap: 8 }}>
                    <h2 id="beam-agreements-earlier" style={{ fontSize: '1.125rem', margin: 0 }}>
                        Earlier versions
                    </h2>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: 4 }}>
                        {earlier.map((version) => (
                            <li key={version.digest}>
                                {version.url ? <a href={version.url}>Version {version.label}</a> : <>Version {version.label}</>}
                                <span style={META_STYLE}> · in effect from {effectiveDate(version.effectiveAt)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </main>
    );
}
