// Ref / Receipts — the cross-property citation kit. Both read the manifest from
// <BeamMdxProvider> and the env `links` map from Inertia page props (stubbed in the
// beam Storybook — see .storybook/inertia-react.stub.tsx + the CitationHarness). Storied
// over the fixture manifest (story-harness.tsx), the way ticket 21 fixtured blockdoc.
//
// Axis = STATES: a live cite (dofollow anchor) / a pending cite (degrades to plain text) /
// an unknown key (degrades) / a populated Receipts ledger / an empty ledger (renders null).
// `.sr-ref` + `.receipts` skin off `--sr-*`; ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Ref, Receipts } from './reference';
import { CitationHarness, SiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Citation',
    component: Ref,
    parameters: { layout: 'centered' },
    // Default args satisfy Ref's required `to`/`children`; every story below is render-driven
    // (it wraps Ref/Receipts in the CitationHarness) and ignores these.
    args: { to: 'binding-network-locality', children: 'the claim' },
} satisfies Meta<typeof Ref>;

export default meta;
type Story = StoryObj<typeof meta>;

// A live inline cite — renders as a dotted-underline dofollow anchor at the claim point.
export const RefLive: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>
                    A binding is{' '}
                    <Ref to="binding-network-locality">a network-locality claim</Ref>, not a
                    transport detail — the anchor is the evidence.
                </p>
            </CitationHarness>
        </SiteProse>
    ),
};

// A pending cite — degrades to plain child text (no dead link ever ships).
export const RefPending: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>
                    This claim cites{' '}
                    <Ref to="unpublished-draft">a not-yet-published guide</Ref> — pending, so it
                    renders as plain text.
                </p>
            </CitationHarness>
        </SiteProse>
    ),
};

// An unknown key — also degrades to the child text (an authoring mistake, surfaced only in DEV).
export const RefUnknownKey: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>
                    Referencing <Ref to="does-not-exist">a missing key</Ref> falls back to plain
                    words.
                </p>
            </CitationHarness>
        </SiteProse>
    ),
};

// The populated Receipts ledger — one row per live referenced sibling (kind · title · summary · link).
export const ReceiptsPopulated: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <Receipts keys={['binding-network-locality', 'acme-migration', 'retrieval-first']} />
            </CitationHarness>
        </SiteProse>
    ),
};

// Receipts with a mix of live + pending keys — pending/unknown keys are dropped from the ledger.
export const ReceiptsFiltersPending: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <Receipts keys={['binding-network-locality', 'unpublished-draft', 'missing']} />
            </CitationHarness>
        </SiteProse>
    ),
};

// An empty ledger — no keys (or no live entries) renders nothing.
export const ReceiptsEmpty: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>No receipts below — the block renders null when no live entry remains.</p>
                <Receipts keys={[]} />
            </CitationHarness>
        </SiteProse>
    ),
};
