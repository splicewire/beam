import { RouteObject } from 'react-router';
import * as react from 'react';
import { ComponentType, ReactNode } from 'react';

/**
 * Dependency-free default class-name merge (rehome-ui injection contract).
 *
 * The prototyping chrome needs *a* `cn`, but the package must not force a clsx/tailwind-merge
 * dependency on every host — so this bundled default is a tiny clsx-shaped truthy-join with no
 * Tailwind conflict resolution. Hosts that want proper utility de-duplication pass their own
 * (e.g. `@schemastud/ui`'s `cn`) through the injection points; this is only the fallback.
 */
type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | null | undefined>;
type Cn = (...inputs: ClassValue[]) => string;
/** clsx-shaped, dependency-free. Joins truthy class values; no Tailwind conflict de-dup. */
declare const cn: Cn;

/**
 * The glob→route mount utility — the heart of the rushing-prototype runtime (ADR-0116).
 *
 * A host writes ONE line — `import.meta.glob<Record<string, unknown>>('../_prototype/**​/*.tsx')`
 * — and passes the result here. That glob is a Vite compile-time macro resolved AT THE CALL SITE;
 * it CANNOT live inside this package (the load-bearing seam). Everything around it — the
 * `_`-prefixed-dir filter, the flat-slug parse, the `*Prototype`-or-default lazy resolve (all in the
 * shared `discovery` grammar) — is what this function carries, so it stops being copy-pasted runtime
 * in every repo.
 *
 * The host keeps the `import.meta.env.DEV ? [...] : []` guard around the call so the whole branch
 * (and its lazily-imported chunks) tree-shakes out of production — asserted by the packaged
 * `beam-verify-prototype-boundary` CLI.
 */
/** The shape of a lazy (non-eager) `import.meta.glob` result: path → module loader. */
type PrototypeGlob = Record<string, () => Promise<Record<string, unknown>>>;
interface CreatePrototypeRoutesOptions {
    /** Route namespace the prototypes mount under. Default `/_prototype`. */
    namespace?: string;
    /**
     * Auto-mount the `Gallery` index at the namespace root (`/_prototype`). Default `true` — a host
     * gets the clickable index for free. Set `false` to mount your own index route.
     */
    gallery?: boolean;
    /** Override the bundled `cn` — threaded into the auto-mounted `Gallery`. */
    cn?: Cn;
}
/**
 * Build the `RouteObject[]` for every auto-discovered prototype (+ the gallery index by default).
 *
 * @param glob  the host's `import.meta.glob` result (lazy, non-eager).
 * @param opts  `namespace` (default `/_prototype`), `gallery` (default true), `cn` override.
 */
declare function createPrototypeRoutes(glob: PrototypeGlob, opts?: CreatePrototypeRoutesOptions): RouteObject[];

/**
 * Generic types for the prototyping runtime (rehome-ui / ADR-0116). Host-agnostic: the
 * splicewire nav *data* stays in the host's `nav.ts`; only the *shapes* live here so the
 * packaged chrome (PrototypeDesk, SettingsFrame, VariantBar) can type its props.
 */

/** A lucide-react (or any) icon component. Typed structurally so the package needn't import lucide. */
type IconComponent = ComponentType<{
    className?: string;
    strokeWidth?: number;
}>;
/** One rail nav row. `proposed`/`ticket` are prototype-only affordances (a marked redesign delta). */
interface NavItem {
    key: string;
    label: string;
    icon: IconComponent;
    /** true = a redesign proposal not in today's shipped rail; the desk marks it with a ring-dot. */
    proposed?: boolean;
    /** originating ticket, for the proposed-delta marker tooltip. */
    ticket?: string;
}
/** A labelled group of rail nav rows. */
interface NavGroup {
    label?: string;
    items: NavItem[];
}
/** One tab in a `SettingsFrame` sub-nav. */
interface NavTab {
    key: string;
    label: string;
    icon: IconComponent;
}
/** One entry in a `VariantBar` `?variant=` switcher. */
interface VariantSpec {
    key: string;
    label: string;
}

interface GalleryProps {
    /** The host's `import.meta.glob` result (same one passed to `createPrototypeRoutes`). */
    glob: PrototypeGlob;
    /** Route namespace the prototypes mount under. Default `/_prototype`. */
    namespace?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}
declare function Gallery({ glob, namespace, cn }: GalleryProps): react.JSX.Element;

interface VariantBarProps {
    variants: VariantSpec[];
    active: string;
    onSelect: (key: string) => void;
    hint?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}
declare function VariantBar({ variants, active, onSelect, hint, cn, }: VariantBarProps): react.JSX.Element;

interface SettingsFrameProps {
    active: string;
    /** Sub-nav tabs (host-owned data). The active one is highlighted; these are display-only. */
    tabs: NavTab[];
    children: ReactNode;
    /** Heading above the sub-nav. Defaults to "Settings". */
    title?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}
declare function SettingsFrame({ active, tabs, children, title, cn, }: SettingsFrameProps): react.JSX.Element;

interface PrototypeDeskProps {
    /** The rail nav groups (host-owned data). */
    nav: NavGroup[];
    /** The brand lockup rendered at the rail top. Omit for a host with no brand mark. */
    BrandComponent?: ComponentType;
    /** active nav key */
    active?: string;
    /** topBar.lead — breadcrumb / section title */
    breadcrumb?: ReactNode;
    /** topBar.actions — right-aligned safe verbs + primary CTA */
    actions?: ReactNode;
    /** canvas policy: Settings/meta = flat, work = dotted (recipe ground-truth) */
    canvas?: 'flat' | 'dotted';
    /** the `main` slot fill — the only real variable */
    children: ReactNode;
    /** root-level floating affordances (overlay slot) */
    overlay?: ReactNode;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}
/** The desk shell skin. Wrap a prototype's `main` content in this for shipped-shell fidelity. */
declare function PrototypeDesk({ nav, BrandComponent, active, breadcrumb, actions, canvas, children, overlay, cn, }: PrototypeDeskProps): react.JSX.Element;
/** A breadcrumb helper matching the real SectionBar look (`Settings › Account`). */
declare function Crumb({ trail }: {
    trail: string[];
}): react.JSX.Element;

export { type ClassValue, type Cn, type CreatePrototypeRoutesOptions, Crumb, Gallery, type GalleryProps, type IconComponent, type NavGroup, type NavItem, type NavTab, PrototypeDesk, type PrototypeDeskProps, type PrototypeGlob, SettingsFrame, type SettingsFrameProps, VariantBar, type VariantBarProps, type VariantSpec, cn, createPrototypeRoutes };
