/* eslint-disable */
// =============================================================================
// story-harness — the shared Storybook fixtures for the @splicewire/beam-mainframe
// catalog (component-seams map, ticket 24). NOT part of the shipped package: tsup
// builds only the `index.ts` graph (see tsup.config.ts `entry: { index }`), so this
// file — imported solely by `*.stories.tsx` — never enters `dist`.
//
// WHY A HARNESS AT ALL (the honest enumeration, recorded in the ticket resolution):
// `beam-mainframe` ships NO rendered surface of its own. Its `src` is pure mechanism —
// the frozen slot contract (contract.ts), two registry factories (slot-registry.ts /
// mainframe-registry.ts), the `can`-gated resolver (resolve.ts), and the host→Mainframe
// delegation seam (react.tsx: provider/hooks/`MainframeOutlet`). `MainframeOutlet`
// renders NOTHING of its own — it delegates to a **host-registered** Mainframe
// component. There is no `DeskMainframe` component exported from the package.
//
// So the ONE catalog-worthy rendered surface is the *shape the seam produces*: a
// representative outer-shell Mainframe that reads the resolved slots and places the
// frozen slot set (brand / rail / topBar / main / overlay / status). This harness
// supplies exactly that — a `DeskMainframe` demo shell (mirroring the shells the
// package's own `seam.test.tsx` builds: `ModeA` / `WindowLike` / `FocusLike`) skinned
// entirely from the workbench semantic tokens (`bg-sidebar`, `bg-card`,
// `text-muted-foreground`, …) so it re-skins correctly under `.dark` with zero
// ticket-32 hex debt — plus the four-kind injection mock (ticket 15's pattern): the
// slot registry + mainframe registry + `can` predicate, driven through the REAL
// `<MainframeProvider>` / `<MainframeOutlet>` seam. Fixtures only; no app coupling.
// =============================================================================
import { useMemo, type ReactNode } from 'react';

import {
    MainframeProvider,
    MainframeOutlet,
    createSlotRegistry,
    createMainframeRegistry,
    type Mainframe,
    type MainframeCan,
    type ResolvedSlots,
    type SlotContributionInput,
} from '@schemastud/mainframe';

// ── The DeskMainframe demo shell ────────────────────────────────────────────────
// A representative OUTER shell that reads the resolved slots and places the frozen
// core+optional slot set. This is the concrete surface the mainframe seam *produces*;
// the app's real `DeskMainframe` is a shell of exactly this shape registered against
// the same frozen contract. Skinned only with semantic tokens (re-skins under `.dark`).

/** Small glyph placeholders so the shell reads without importing any icon library. */
function Glyph({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-accent text-[11px] font-semibold text-sidebar-active-foreground">
            {children}
        </span>
    );
}

/**
 * The demo outer shell. A `Mainframe` = `({ slots, ctx }) => ReactNode` that owns
 * placement. Grid: a fixed rail column + a `[topBar / main / status]` content column;
 * the `overlay` slot floats above everything (the mode's overlay zone). Reads every
 * frozen slot through the resolver's `node()/items()/main()` API.
 */
export const DeskMainframe: Mainframe = ({ slots, ctx }) => {
    return (
        <div
            className="relative grid h-[560px] w-[880px] max-w-full overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
            style={{ gridTemplateColumns: 'var(--rail-w, 13rem) 1fr' }}
            data-testid="deskmainframe"
        >
            {/* Rail — single-node; the deep sidebar column. */}
            <aside className="flex flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground">
                <div className="flex items-center gap-2 text-sidebar-active-foreground">
                    {slots.node('brand') ?? <span className="text-sm font-semibold">brand</span>}
                </div>
                <div className="flex-1">{slots.node('rail')}</div>
                {slots.has('railFooter') && (
                    <div className="border-t border-sidebar-border pt-3 text-xs">
                        {slots.node('railFooter')}
                    </div>
                )}
            </aside>

            {/* Content column: topBar / main / status. */}
            <div className="grid min-w-0 grid-rows-[auto_1fr_auto]">
                {/* Top bar: lead (single-node) on the left, actions (ordered-multi) on the right. */}
                <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
                    <div className="min-w-0 truncate text-sm font-medium text-card-foreground">
                        {slots.node('topBar.lead')}
                    </div>
                    <div className="flex items-center gap-2">
                        {slots.items('topBar.actions').map((node, i) => (
                            <span key={i}>{node}</span>
                        ))}
                    </div>
                </header>

                {/* Main: the render-prop target — the framed page/route content. */}
                <main className="min-w-0 overflow-auto bg-background p-5">
                    {slots.main(ctx.payload) ?? (
                        <div className="grid h-full place-items-center text-sm text-muted-foreground">
                            (main slot empty)
                        </div>
                    )}
                </main>

                {/* Status: optional ordered-multi footer strip. */}
                {slots.has('status') && (
                    <footer className="flex items-center gap-3 border-t border-border bg-card px-5 py-2 text-xs text-muted-foreground">
                        {slots.items('status', 'start').map((node, i) => (
                            <span key={`s-${i}`}>{node}</span>
                        ))}
                        <span className="flex-1" />
                        {slots.items('status', 'end').map((node, i) => (
                            <span key={`e-${i}`}>{node}</span>
                        ))}
                    </footer>
                )}
            </div>

            {/* Overlay: the mode's floating overlay zone (ordered-multi, zones corner/edge/center). */}
            {slots.has('overlay') && (
                <div className="pointer-events-none absolute inset-0" data-testid="overlay-zone">
                    {/* center zone → a modal-ish card */}
                    {slots.items('overlay', 'center').map((node, i) => (
                        <div key={`c-${i}`} className="pointer-events-auto absolute inset-0 grid place-items-center bg-foreground/20 backdrop-blur-[1px]">
                            <div className="max-w-sm rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-lg">
                                {node}
                            </div>
                        </div>
                    ))}
                    {/* corner zone → a toast pinned bottom-right */}
                    <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col gap-2">
                        {slots.items('overlay', 'corner').map((node, i) => (
                            <div key={`k-${i}`} className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                                {node}
                            </div>
                        ))}
                    </div>
                    {/* edge zone → a right-docked panel */}
                    {slots.items('overlay', 'edge').map((node, i) => (
                        <div key={`d-${i}`} className="pointer-events-auto absolute inset-y-0 right-0 w-64 border-l border-border bg-card p-4 text-sm text-card-foreground shadow-xl">
                            {node}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── The injection mock (four-kind, ticket 15's pattern) ─────────────────────────
// A builder that populates a fresh SlotRegistry from a list of contributions, registers
// the demo shell for a mode, and threads a `can` predicate — then a `<MockMainframe>`
// wrapper that drives the REAL provider/outlet seam so a story exercises the whole path
// (resolve → gate → sort → place), never a hand-mocked ResolvedSlots.

export type FixtureContribution = SlotContributionInput;

export interface MockMainframeProps {
    /** Slot contributions to populate the registry with (the "features" of the fixture). */
    contributions: readonly FixtureContribution[];
    /** The host entitlement predicate. Omit → every gated contribution drops (closed by default). */
    can?: MainframeCan;
    /** The render payload handed to the `main` render-prop. */
    payload?: unknown;
    /** The mode key the outlet selects (the demo shell registers under it). Defaults to `desk`. */
    mode?: string;
    /** Optional CSS var overrides for the shell (e.g. a narrower rail for the mobile viewport). */
    style?: React.CSSProperties;
    /** Swap the shell component (e.g. a rail-collapsed variant). Defaults to `DeskMainframe`. */
    shell?: Mainframe;
}

/**
 * Drives the full seam over fixtures: builds both registries, registers the demo shell
 * for `mode`, wraps in the real `<MainframeProvider>`, and renders the real
 * `<MainframeOutlet>`. Every story's slots flow through the actual resolver.
 */
export function MockMainframe({
    contributions,
    can,
    payload,
    mode = 'desk',
    style,
    shell = DeskMainframe,
}: MockMainframeProps) {
    const injection = useMemo(() => {
        const slots = createSlotRegistry();
        const mainframes = createMainframeRegistry();
        mainframes.register(mode, shell);
        for (const c of contributions) slots.contribute(c);
        return { slots, mainframes, can };
    }, [contributions, can, mode, shell]);

    return (
        <div style={style}>
            <MainframeProvider injection={injection}>
                <MainframeOutlet mode={mode} ctx={{ payload }} />
            </MainframeProvider>
        </div>
    );
}

// ── Reusable slot-fill fixtures ─────────────────────────────────────────────────
// Small token-skinned nodes the stories compose into slots. Kept here so each story
// reads as a *composition of fills*, not a wall of JSX.

/** A brand lockup for the `brand` slot. */
export const brandFill = (
    <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-sidebar-primary text-[13px] text-sidebar">◆</span>
        splicewire
    </div>
);

/** A rail nav for the `rail` slot. */
export const railFill = (
    <nav className="flex flex-col gap-1 text-sm">
        {[
            { label: 'Dashboard', active: true },
            { label: 'Content' },
            { label: 'Calendar' },
            { label: 'Members' },
            { label: 'Settings' },
        ].map((item) => (
            <a
                key={item.label}
                className={
                    'rounded-md px-2.5 py-1.5 ' +
                    (item.active
                        ? 'bg-sidebar-accent text-sidebar-active-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60')
                }
            >
                {item.label}
            </a>
        ))}
    </nav>
);

/** A page title for `topBar.lead`. */
export const topBarLeadFill = <span>Content · All posts</span>;

/** A single action button (for `topBar.actions`). */
export function actionFill(label: string, primary = false) {
    return (
        <button
            className={
                'rounded-md px-3 py-1.5 text-xs font-medium ' +
                (primary
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-card-foreground hover:bg-secondary')
            }
        >
            {label}
        </button>
    );
}

/** A `main` render-prop that frames a simple content page. */
export const mainFill = (payload: unknown) => (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">All posts</h1>
        <p className="text-sm text-muted-foreground">
            {typeof payload === 'string' ? payload : 'The framed route/page content renders here.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
            {['Launch announcement', 'Weekly digest', 'Product update', 'Field notes'].map((t) => (
                <div key={t} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm font-medium text-card-foreground">{t}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Draft · edited 2h ago</div>
                </div>
            ))}
        </div>
    </div>
);

/** A status-strip fill (for `status`). */
export const statusStartFill = <span>Saved · all changes synced</span>;
export const statusEndFill = <span className="text-signal">● online</span>;

/** A rail-footer fill (for the optional `railFooter`). */
export const railFooterFill = (
    <div className="flex items-center gap-2 text-sidebar-foreground">
        <Glyph>SR</Glyph>
        <span>stephen@splicewire</span>
    </div>
);

/** Overlay fills, one per zone. */
export const overlayCenterFill = (
    <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">Publish this post?</div>
        <p className="text-xs text-muted-foreground">It will go live immediately on your site.</p>
        <div className="flex justify-end gap-2">
            {actionFill('Cancel')}
            {actionFill('Publish', true)}
        </div>
    </div>
);
export const overlayCornerFill = <span>Draft saved just now</span>;
export const overlayEdgeFill = (
    <div className="space-y-2">
        <div className="text-sm font-semibold text-card-foreground">Inspector</div>
        <p className="text-xs text-muted-foreground">A docked edge-zone overlay panel.</p>
    </div>
);

/** The canonical fully-populated core-slot contribution set (no overlay). */
export const populatedCore: FixtureContribution[] = [
    { slot: 'brand', key: 'logo', node: brandFill },
    { slot: 'rail', key: 'nav', node: railFill },
    { slot: 'topBar.lead', key: 'title', node: topBarLeadFill },
    { slot: 'topBar.actions', key: 'filter', node: actionFill('Filter'), zone: 'start' },
    { slot: 'topBar.actions', key: 'new', node: actionFill('New post', true), zone: 'end' },
    { slot: 'main', key: 'page', render: mainFill },
];

export type { ResolvedSlots, Mainframe };
