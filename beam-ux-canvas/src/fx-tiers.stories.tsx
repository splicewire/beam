import type { Meta, StoryObj } from '@storybook/react-vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'storybook/test';
import { canWebGl } from './capability';
import { FxBoundary } from './fx-boundary';
import { FxCanvas } from './fx-canvas';
import { FxEffect, type FxPlacement } from './fx-effect';
import type { EffectTier } from './tiers';

/**
 * Canvas / FxEffect tiers — the package's first story. Its treatment axis is the effects **tier**
 * (`off | lite | full`, fed to a Persuade boundary as the user tier) on a real DOM child, with the
 * overlay `placement` (`under | over`). The overlay is a lazily imported WebGL scene mounted through
 * the lifecycle seam (`FxCanvas`).
 *
 * What each environment can prove (landing-motion build/01, receipts 1 and 3):
 *  - **The Storybook test runner** forces `prefers-reduced-motion: reduce` for every story
 *    (`.storybook/test-runner.ts` preVisit), and the tier rule returns `off` under reduced motion.
 *    So there every tier arg renders the **bare DOM twin** — the children byte-identical to `off`,
 *    no wrapper, no `data-fx-tier`, 0 `<canvas>` — and the `play` below asserts exactly that. It is
 *    the DOM twin and the kill switch, never live tiers and never pixels.
 *  - **Live tiers** (no-preference media, WebGL available) are the ecosystem harness's
 *    (`harness/specs/g1-beam-ux-canvas-tiers.spec.ts`), driving this story's iframe by args.
 *
 * `spacer` (px) pushes the effect below the fold, so the harness can watch the lazy mount wait
 * for the element to approach the viewport.
 */
interface TierArgs {
    tier: EffectTier;
    placement: FxPlacement;
    spacer: number;
}

const demoScene = () => import('./fx-tiers.story-scene').then((m) => m.createDemoScene());

/** The real DOM the effect decorates. Classes only (no inline styles), so markup compares byte-for-byte. */
function RealCopy() {
    return (
        <section className="flex w-[560px] flex-col gap-3 p-10" data-testid="real-copy">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Effects decorate, never replace</p>
            <h2 className="text-3xl font-semibold">Make a song from a memory</h2>
            <p className="text-base">The headline, copy and button are the real, focusable DOM at every tier.</p>
            <button type="button" className="w-fit rounded-md border px-4 py-2">
                Start
            </button>
        </section>
    );
}

const TWIN = renderToStaticMarkup(<RealCopy />);

const meta = {
    title: 'Canvas/FxEffect tiers',
    parameters: { layout: 'centered' },
    argTypes: {
        tier: { control: 'inline-radio', options: ['off', 'lite', 'full'] },
        placement: { control: 'inline-radio', options: ['under', 'over'] },
        spacer: { control: 'number' },
    },
    args: { tier: 'full', placement: 'under', spacer: 0 },
    render: ({ tier, placement, spacer }) => (
        <>
            {Number(spacer) > 0 && <div data-testid="spacer" style={{ height: `${Number(spacer)}px` }} />}
            <FxBoundary mode="persuade" userTier={tier}>
                <FxEffect kind="scene" placement={placement} overlay={<FxCanvas scene={demoScene} />}>
                    <RealCopy />
                </FxEffect>
            </FxBoundary>
        </>
    ),
    play: async ({ canvasElement, args }) => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const live = !reduced && canWebGl() && args.tier !== 'off';
        const effect = canvasElement.querySelector('[data-fx-tier]');
        if (!live) {
            // The bare DOM twin: byte-identical children, no wrapper, no data-fx-tier, 0 <canvas>.
            const html = canvasElement.innerHTML.replace(/^<div data-testid="spacer"[^>]*><\/div>/, '');
            await expect(html).toBe(TWIN);
            await expect(effect).toBeNull();
            await expect(canvasElement.querySelectorAll('canvas').length).toBe(0);
            return;
        }
        await expect(effect?.getAttribute('data-fx-tier')).toBe(args.tier);
        await expect(effect?.getAttribute('data-fx-placement')).toBe(args.placement);
    },
} satisfies Meta<TierArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `off` — the bare DOM twin at every environment. */
export const Off: Story = { args: { tier: 'off' } };

/** `lite` — DPR ≤ 1.5; live only with WebGL and no reduced motion. */
export const Lite: Story = { args: { tier: 'lite' } };

/** `full` — DPR ≤ 2; live only with WebGL and no reduced motion. */
export const Full: Story = { args: { tier: 'full' } };
