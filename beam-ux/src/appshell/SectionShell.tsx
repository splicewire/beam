// @splicewire/beam-ux/appshell — the thin section shells + sub-tab-strip renderer (Frame OS ticket 19).
//
// The section-layout / SectionBar shell-nesting mechanism, made generic. Two pieces travel:
//   - {@link SectionShell} — the thin content container the host's manifest-generated section leaves
//     nest under (splicewire-app's KnowledgeLayout / ComplianceLayout / SettingsLayout are all this
//     one wrapper with a different max-width). Router-neutral: the host wraps its own `<Outlet/>` as
//     `children`; the shell only frames it.
//   - {@link SectionTabStrip} — the repeated sub-tab `<nav>{tabs.map(<NavLink/>)}</nav>` block the
//     host's SectionBar renders four times (section tabs, meta-area tabs, group tabs, record tabs)
//     with byte-identical classes. The host injects its router `<Link>` + the (already-filtered) tab
//     roster; the strip owns the DOM + the default classes (overridable), so every strip is identical.
//
// The SectionBar's per-section BREADCRUMB DATA logic (composition/fragment/circuit detail hooks) does
// NOT travel — it is irreducibly host-domain (it names the host's resources + endpoints). The host
// keeps a thin SectionBar that resolves its rosters via the packaged `sectionMeta` resolvers and
// renders the strips via {@link SectionTabStrip}.
import type { ReactNode } from 'react';
import type { SectionLinkComponent, SectionTab } from './types.js';

/** The default frame widths splicewire-app's section layouts used (all `<Outlet/>` containers). */
const SHELL_VARIANTS = {
    /** KnowledgeLayout / ComplianceLayout — a spaced full-width column. */
    stack: 'space-y-4',
    /** SettingsLayout — a centered, capped column. */
    contained: 'mx-auto max-w-5xl',
} as const;

export type SectionShellVariant = keyof typeof SHELL_VARIANTS;

export interface SectionShellProps {
    /** The nested section content — the host wraps its router `<Outlet/>` here. */
    children: ReactNode;
    /** The frame width. Defaults to `stack`. */
    variant?: SectionShellVariant;
    /** Class override — replaces the variant's default entirely when set. */
    className?: string;
}

/**
 * The thin section shell — a content container the section's leaves nest under. The sub-tab strip
 * lives in the top-bar SectionBar (one nav grammar), so this owns ONLY the framing box.
 */
export function SectionShell({ children, variant = 'stack', className }: SectionShellProps) {
    return <div className={className ?? SHELL_VARIANTS[variant]}>{children}</div>;
}

/** The default strip classes — the ones splicewire-app rendered host-locally (byte-for-byte). */
const STRIP_DEFAULTS = {
    /** Section / meta-area strip: the primary sub-tab nav. */
    nav: 'flex items-center gap-1',
    /** Group / record strip: a divider-separated secondary strip. */
    navDivided: 'flex items-center gap-1 border-l border-border/60 pl-3',
} as const;

export interface SectionTabStripProps {
    /** The (already host-filtered) tabs to render. */
    tabs: SectionTab[];
    /** The router link component (react-router `NavLink` wrapper / Inertia `Link`). Injected. */
    linkComponent: SectionLinkComponent;
    /** ARIA label for the `<nav>`. */
    ariaLabel: string;
    /**
     * `divided` renders the secondary (group / record) strip with the left divider; `primary` (the
     * default) renders the main section / meta-area strip.
     */
    variant?: 'primary' | 'divided';
    /** Class override for the `<nav>` (replaces the variant default). */
    className?: string;
    /** Whether the tab's active `end`-match is the compact (group/record) padding. Cosmetic parity. */
    compact?: boolean;
}

/**
 * One sub-tab strip: `<nav>{tabs.map(<Link/>)}</nav>`. The link owns its own active styling (the
 * host's `NavLink` render-prop), so this renders exactly the host's prior DOM — it just stops the
 * four copies of the loop from living in the host. Renders nothing for an empty tab set.
 */
export function SectionTabStrip({
    tabs,
    linkComponent: Link,
    ariaLabel,
    variant = 'primary',
    className,
}: SectionTabStripProps) {
    if (tabs.length === 0) return null;
    const navClass =
        className ?? (variant === 'divided' ? STRIP_DEFAULTS.navDivided : STRIP_DEFAULTS.nav);
    return (
        <nav className={navClass} aria-label={ariaLabel}>
            {tabs.map((tab) => (
                <Link key={tab.path} to={tab.path} end={tab.end}>
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
