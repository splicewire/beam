import type { ComponentType, ReactNode } from 'react';
import type { LinkComponent, SiteNavData } from '../site/types.js';

/**
 * The entry payload `PublicEntryController` composes (ADR-0209 §6, ADR-0213 §4). `layout`/`template`
 * arrive already RESOLVED — the server walked the containment chain it was holding anyway, so the
 * client never has to know an entry has ancestors at all.
 */
export type EntryPayload = {
    id: string;
    slug: string;
    title: string | null;
    type: string | null;
    format: string | null;
    url: string | null;
    /** The inherited chrome name, or null when nothing in the chain declares one. */
    layout?: string | null;
    template?: string | null;
};

export type EntryArtifactPayload = {
    url: string;
    version: string | null;
};

/**
 * The props every layout and every template receives. One shape for both, because the difference
 * between them is what fills the hole (ADR-0213 §1) and not what they are told — a template that
 * wanted the nav to render a "next page" pager should not have to be a layout to get it.
 */
export type ChromeProps = {
    entry: EntryPayload;
    /** The already-gated realm projection. Null when the mount was made with `withNav: false`. */
    nav: SiteNavData | null;
    /** The host's router link. The package imports no router (ADR-0213 §2 invariant ii). */
    linkComponent?: LinkComponent;
    /** The current URL, for active-state and for re-scanning the on-this-page column. */
    currentHref?: string;
    /** Host chrome the layout places but never authors: a header, a footer, extra rail content. */
    slots?: ChromeSlots;
    /** Per-part class overrides. The package names no colour and no font (invariant i). */
    classNames?: Record<string, string | undefined>;
    children: ReactNode;
};

export type ChromeSlots = {
    header?: ReactNode;
    footer?: ReactNode;
    /** Rendered above the rail — a version switcher, a search box, a "back to site" link. */
    railTop?: ReactNode;
    /** Rendered above the body inside `main` — a breadcrumb is the intended occupant. */
    breadcrumb?: ReactNode;
};

export type ChromeComponent = ComponentType<ChromeProps>;
