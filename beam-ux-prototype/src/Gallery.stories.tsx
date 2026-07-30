import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { Gallery } from './Gallery';
import type { PrototypeGlob } from './createPrototypeRoutes';

/**
 * Catalog story for the prototype index (extract ticket 05). Sanctioned treatment axis: the **shape
 * of the discovered set** — many effort groups (the filter `<select>` appears + cards group by dir)
 * vs a single group (no filter). Gallery reads only the glob KEYS (it never calls the loaders), so
 * these stories hand it a synthetic glob of fake module paths. It renders `Link`s, so each story is
 * wrapped in a `MemoryRouter`.
 */

/** Build a fake `import.meta.glob` result from a list of `_prototype/…` paths (loaders are no-ops). */
function fakeGlob(paths: string[]): PrototypeGlob {
    return Object.fromEntries(paths.map((p) => [p, () => Promise.resolve({})]));
}

const MULTI = fakeGlob([
    '../_prototype/admin-redesign/ar01-settings-shell-and-ia.tsx',
    '../_prototype/admin-redesign/ar11-tenant-billing-home.tsx',
    '../_prototype/admin-redesign/ar22-cross-tenant-usage-monitoring.tsx',
    '../_prototype/beamux/04-beamux-ux-builder.tsx',
    '../_prototype/support-embeds/01-published-embeds.tsx',
    '../_prototype/schema-registry/schema-registry-admin.tsx',
    // a root-level prototype + a _-prefixed dir that must be excluded
    '../_prototype/01-mechanism-smoke.tsx',
    '../_prototype/_chrome/PrototypeDesk.tsx',
    '../_prototype/admin-redesign/_fixtures/account.ts',
]);

const SINGLE = fakeGlob([
    '../_prototype/admin-redesign/ar04-api-tokens.tsx',
    '../_prototype/admin-redesign/ar05-team-and-invitations.tsx',
    '../_prototype/admin-redesign/ar06-model-routing-and-embeddings.tsx',
]);

const meta = {
    title: 'UX Prototype/Gallery',
    component: Gallery,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        ),
    ],
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Many effort groups → the filter `<select>` appears; `_chrome`/`_fixtures` are excluded. */
export const MultipleGroups: Story = {
    args: { glob: MULTI },
};

/** A single effort group → no filter control, one section. */
export const SingleGroup: Story = {
    args: { glob: SINGLE },
};

/** A custom namespace flows into every card link + description. */
export const CustomNamespace: Story = {
    args: { glob: SINGLE, namespace: '/playground' },
};
