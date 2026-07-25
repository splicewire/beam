import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import {
    MockMainframe,
    populatedCore,
    railFill,
    railFooterFill,
    statusStartFill,
    statusEndFill,
    overlayCenterFill,
    overlayCornerFill,
    overlayEdgeFill,
    actionFill,
    mainFill,
    brandFill,
    topBarLeadFill,
} from './story-harness';
import type { Mainframe, FixtureContribution } from './story-harness';

/**
 * `@splicewire/beam-mainframe` — the DeskMainframe OUTER shell + overlay slot
 * (component-seams map, ticket 24; ADR-0092/0099).
 *
 * IMPORTANT (recorded in the ticket resolution): this package ships NO rendered
 * component. Its `src` is pure mechanism — the frozen slot contract, the two registry
 * factories, the `can`-gated resolver, and the host→Mainframe delegation seam. The ONE
 * catalog-worthy rendered surface is the *shell the seam produces*: an outer Mainframe
 * that reads the resolved slots and places the frozen slot set. `./story-harness`
 * supplies that demo `DeskMainframe` (skinned only with semantic tokens, so it re-skins
 * under `.dark`) and drives it through the REAL `<MainframeProvider>`/`<MainframeOutlet>`
 * seam over fixture contributions — so every story exercises the actual resolve → gate
 * → sort → place path, not a hand-mocked `ResolvedSlots`.
 *
 * Treatment axes (ticket 13): ambient token + light⊗dark are inherited from the
 * workbench (`.storybook/preview.*`). The shell exposes no `variant`/`size`/`tone`/
 * `density` prop — those are absent-not-a-gap (rule of sanction). The axes it DOES
 * express: **states** (minimal / populated / overlay-open / gated) and **viewport**
 * (the shell is viewport-sensitive — the rail collapses on mobile).
 */
// No `component` on the meta: the catalogued surface is the demo shell driven through
// the seam by `MockMainframe`, which every story `render`s with fixture contributions —
// none passes component `args` directly, so a component-typed meta would demand a
// phantom `args`. A bare meta + `StoryObj` (render-only) is the honest shape here.
const meta = {
    title: 'Mainframe/DeskMainframe',
    parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ── States ──────────────────────────────────────────────────────────────────────

/**
 * The minimal shell: only the core slots a mode MUST place, and `main` empty. Proves
 * the frozen-slot layout renders skinned with the barest fill — the resolver still
 * places every core slot; the empty `main` shows its placeholder.
 */
export const Minimal: Story = {
    render: () => (
        <MockMainframe
            contributions={[
                { slot: 'brand', key: 'logo', node: brandFill },
                { slot: 'rail', key: 'nav', node: railFill },
                { slot: 'topBar.lead', key: 'title', node: topBarLeadFill },
            ]}
        />
    ),
};

/**
 * The fully-populated shell: brand + rail + topBar (lead + start/end actions) + a framed
 * `main` page + a status strip + a rail footer. The everyday desk surface. Shows the full
 * frozen-slot layout with every core+optional slot filled.
 */
export const Populated: Story = {
    render: () => (
        <MockMainframe
            payload="Showing 4 of 128 posts."
            contributions={[
                ...populatedCore,
                { slot: 'railFooter', key: 'user', node: railFooterFill },
                { slot: 'status', key: 'saved', node: statusStartFill, zone: 'start' },
                { slot: 'status', key: 'presence', node: statusEndFill, zone: 'end' },
            ]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Settle the framed content so a future VR baseline captures the populated shell.
        await expect(await canvas.findByText('All posts')).toBeInTheDocument();
        await expect(canvas.getByText(/Showing 4 of 128 posts/)).toBeInTheDocument();
    },
};

/**
 * Overlay-open — the `overlay` core slot populated across all three zones (`center`
 * modal, `corner` toast, `edge` docked panel). This is the mainframe's floating overlay
 * zone (ticket 03's L3 "closest thing to a registry"): the mode places it above the
 * whole shell. `play`-awaits the modal so VR captures the settled overlay-open state.
 */
export const OverlayOpen: Story = {
    render: () => (
        <MockMainframe
            payload="Showing 4 of 128 posts."
            contributions={[
                ...populatedCore,
                { slot: 'overlay', key: 'confirm', node: overlayCenterFill, zone: 'center' },
                { slot: 'overlay', key: 'toast', node: overlayCornerFill, zone: 'corner' },
                { slot: 'overlay', key: 'inspector', node: overlayEdgeFill, zone: 'edge' },
            ]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Publish this post?')).toBeInTheDocument();
        await expect(canvas.getByText('Draft saved just now')).toBeInTheDocument();
        await expect(canvas.getByText('Inspector')).toBeInTheDocument();
    },
};

/**
 * Entitlement-gated — the SAME contribution set rendered with a `can` predicate that
 * denies `compose.edit`. The gated actions + the edit overlay drop to empty; the shell
 * gates *thinner*, not into a separate render path (ADR-0099 — the public "view" falls
 * out of the entitlement axis). The visitor sees brand/rail/main but no New-post button,
 * no edge inspector.
 */
export const EntitlementGated: Story = {
    render: () => (
        <MockMainframe
            payload="Showing 4 of 128 posts."
            can={(cap) => cap !== 'compose.edit'}
            contributions={[
                { slot: 'brand', key: 'logo', node: brandFill },
                { slot: 'rail', key: 'nav', node: railFill },
                { slot: 'topBar.lead', key: 'title', node: topBarLeadFill },
                { slot: 'topBar.actions', key: 'filter', node: actionFill('Filter'), zone: 'start' },
                // Gated: only an editor sees these.
                { slot: 'topBar.actions', key: 'new', node: actionFill('New post', true), zone: 'end', can: 'compose.edit' },
                { slot: 'overlay', key: 'inspector', node: overlayEdgeFill, zone: 'edge', can: 'compose.edit' },
                { slot: 'main', key: 'page', render: mainFill },
            ]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('All posts')).toBeInTheDocument();
        // The ungated affordance survives...
        await expect(canvas.getByText('Filter')).toBeInTheDocument();
        // ...the gated ones dropped to empty (visitor view).
        await expect(canvas.queryByText('New post')).toBeNull();
        await expect(canvas.queryByText('Inspector')).toBeNull();
    },
};

// ── Viewport — the shell is viewport-sensitive (rail collapse) ────────────────────

/**
 * A rail-collapsed shell variant: the same demo shell shape, but the rail column shrinks
 * to an icon strip (the mobile collapse). Registered as a swapped `shell` so the story
 * exercises the collapse without a `variant` prop the package doesn't expose — the shell
 * is viewport-sensitive; on mobile the rail recedes to a rail of glyphs.
 */
const CollapsedRailMainframe: Mainframe = ({ slots, ctx }) => (
    <div
        className="relative grid h-[560px] w-[420px] max-w-full overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
        style={{ gridTemplateColumns: '3.25rem 1fr' }}
        data-testid="deskmainframe-collapsed"
    >
        <aside className="flex flex-col items-center gap-3 bg-sidebar p-2 text-sidebar-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sm text-sidebar">◆</span>
            {['D', 'C', '◷', 'M', '⚙'].map((g, i) => (
                <span
                    key={i}
                    className={
                        'grid h-8 w-8 place-items-center rounded-md text-xs ' +
                        (i === 0 ? 'bg-sidebar-accent text-sidebar-active-foreground' : 'text-sidebar-foreground')
                    }
                >
                    {g}
                </span>
            ))}
        </aside>
        <div className="grid min-w-0 grid-rows-[auto_1fr]">
            <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
                <div className="min-w-0 truncate text-sm font-medium text-card-foreground">
                    {slots.node('topBar.lead')}
                </div>
                <div className="flex items-center gap-1.5">
                    {slots.items('topBar.actions', 'end').map((n, i) => (
                        <span key={i}>{n}</span>
                    ))}
                </div>
            </header>
            <main className="min-w-0 overflow-auto bg-background p-4">{slots.main(ctx.payload)}</main>
        </div>
    </div>
);

/** The rail-collapsed shell on a mobile viewport. */
export const MobileRailCollapsed: Story = {
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
        layout: 'fullscreen',
    },
    render: () => {
        const contributions: FixtureContribution[] = [
            { slot: 'topBar.lead', key: 'title', node: topBarLeadFill },
            { slot: 'topBar.actions', key: 'new', node: actionFill('New', true), zone: 'end' },
            { slot: 'main', key: 'page', render: mainFill },
        ];
        return <MockMainframe shell={CollapsedRailMainframe} contributions={contributions} payload="4 posts" />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('All posts')).toBeInTheDocument();
    },
};
