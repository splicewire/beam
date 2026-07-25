import type { ReactNode } from 'react';

// =============================================================================
// Section-landing pattern — a scannable gateway for a docs root or track landing.
//
// A `SectionLanding` hero (eyebrow + heading + lede) over a `CardGrid` of `Card`s.
// Each card is a single full-card link target: the whole card is the anchor, so the
// hit target is large and forgiving. Router-agnostic — a plain `<a>`, so the kit
// stays free of Inertia; a landing links across doc pages (crawlable). All styling
// rides `.bkit-*` classes in kit.css on the host's `--beam-*` tokens; SVG icons only.
// =============================================================================

/** The hero atop a landing: an optional eyebrow, a heading, and an optional lede. */
export function SectionLanding({
    eyebrow,
    heading,
    lede,
    children,
}: {
    eyebrow?: string;
    heading: string;
    lede?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <section className="bkit-landing">
            <header className="bkit-landing-hero">
                {eyebrow && <p className="bkit-landing-eyebrow">{eyebrow}</p>}
                <h1 className="bkit-landing-heading">{heading}</h1>
                {lede && <p className="bkit-landing-lede">{lede}</p>}
            </header>
            {children}
        </section>
    );
}

/** A responsive 1 → 2 → 3 column grid of cards; reflows to one column when narrow. */
export function CardGrid({ children }: { children?: ReactNode }) {
    return <div className="bkit-card-grid">{children}</div>;
}

/**
 * A single full-card link: an `<a>` wrapping an optional SVG icon, a title, and a
 * blurb. Hover raises the border to the signal green with a subtle lift; the whole
 * card is the click target, keyboard-focusable with a visible ring. `icon` is a
 * ReactNode — pass an inline `<svg>`, never an emoji.
 */
export function Card({
    href,
    title,
    blurb,
    icon,
}: {
    href: string;
    title: string;
    blurb?: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <a href={href} className="bkit-card">
            {icon && <span className="bkit-card-icon">{icon}</span>}
            <span className="bkit-card-title">{title}</span>
            {blurb && <span className="bkit-card-blurb">{blurb}</span>}
        </a>
    );
}
