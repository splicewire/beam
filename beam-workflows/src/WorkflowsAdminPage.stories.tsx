import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { WorkflowsAdminPage } from './WorkflowsAdminPage';
import { MockWorkflowsProvider, makeMockClient } from './story-harness';
import { catalog, lineages } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowsAdminPage} (component-seams ticket 26; beam-workflows v2 ticket 09).
 * The root admin surface — the lineage list (aside), and, on selection, the BindingPanel + version
 * coverage strip + WorkflowDiff + collapsible WorkflowMigrate + the WorkflowEditor. It is the fully
 * TRANSPORT-DRIVEN composite: every panel reads through the injected `client` via react-query, so it
 * renders inside the mock provider.
 *
 * Its axis is **states** of the injected reads: populated list vs. empty list vs. still-loading. The
 * "selected lineage" deep state is driven by user click (the list starts unselected showing the "Select
 * a workflow…" hint) — the `play` fn on Selected clicks the first lineage so a VR baseline captures the
 * full composed editor. No variant/size/tone/density prop (rule of sanction). Chrome mixes semantic
 * tokens (`muted-foreground`, Card/Button/Select from `@schemastud/ui`) with `--swc-*` brand accents on
 * the selected-lineage ring + version badges — partial re-skin under `.dark` (→ ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowsAdminPage',
    component: WorkflowsAdminPage,
    parameters: { layout: 'fullscreen' },
    // The page is full-bleed by design (admin-redesign ticket 08): the host's desk shell owns the outer
    // gutter and the flagship mounts it bare inside that framed main. The story stands in for the shell
    // with the same inset, so the capture shows the page as a host frames it, not flush to the viewport.
    decorators: [
        (Story) => (
            <div className="p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowsAdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The list populated with two lineages; nothing selected yet (the "Select a workflow…" hint). */
export const ListPopulated: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: new RegExp(lineages[0].name) })).toBeInTheDocument();
        await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
    },
};

/** An empty estate — no lineages configured yet (the list renders nothing, the hint shows). */
export const ListEmpty: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages: [] })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('No workflows match.')).toBeInTheDocument();
        await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    },
};

/** The reads hang forever — the "Loading…" state of the lineage list. */
export const Loading: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ hang: true })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Loading…')).toBeInTheDocument();
        await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
    },
};

/**
 * A lineage selected — the full composed surface: BindingPanel, coverage strip, WorkflowDiff, the
 * migrate disclosure, and the WorkflowEditor loaded with the active version. The `play` fn clicks the
 * first lineage and waits for the graphs/editor to settle, so a VR baseline captures the composite.
 */
export const Selected: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        await new Promise((r) => setTimeout(r, 150));
        const firstLineage = canvasElement.querySelector<HTMLButtonElement>('aside button[data-lineage-key]');
        firstLineage?.click();
        await new Promise((r) => setTimeout(r, 350));
    },
};

/**
 * The read-only affordance (admin-redesign ticket 08): a member who clears the read gate but lacks
 * `author-workflows` (`catalog.canAuthor === false`). The lineage list + version coverage still read,
 * but the write affordances are suppressed — Bind/Unbind disabled, the migrate disclosure hidden, the
 * activate toggle absent, and the editor's Save disabled with a "read-only" hint. The gate is still
 * enforced server-side; this only keeps a read-only member from submitting into a 403.
 */
export const ReadOnly: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider
                client={makeMockClient({ lineages, catalog: { ...catalog, canAuthor: false } })}
            >
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        await new Promise((r) => setTimeout(r, 150));
        const firstLineage = canvasElement.querySelector<HTMLButtonElement>('aside button[data-lineage-key]');
        firstLineage?.click();
        await new Promise((r) => setTimeout(r, 350));
    },
};


/** A refused read is an error, never a successful empty lineage list. */
export const ListForbidden: Story = {
    decorators: [(Story) => {
        const client = makeMockClient();
        client.listLineages = async () => { throw Object.assign(new Error('Example private server detail'), { status: 403 }); };
        return <MockWorkflowsProvider client={client}><Story /></MockWorkflowsProvider>;
    }],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent("You don't have access to workflows.");
        await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute('data-page-state', 'forbidden');
        await expect(canvas.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
        await expect(canvas.queryByText('Example private server detail')).not.toBeInTheDocument();
    },
};

/** Network failure follows the same safe read-failure path. */
export const ListFailed: Story = {
    decorators: [(Story) => {
        const client = makeMockClient();
        client.listLineages = async () => { throw new TypeError('Example private transport detail'); };
        return <MockWorkflowsProvider client={client}><Story /></MockWorkflowsProvider>;
    }],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Could not load workflows.');
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
        await expect(canvas.queryByText('Example private transport detail')).not.toBeInTheDocument();
        await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute('data-page-state', 'error');
        await expect(canvas.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    },
};

function recoveryClient(empty: boolean) {
    const client = makeMockClient();
    let attempts = 0;
    client.listLineages = async () => {
        if (attempts++ === 0) throw Object.assign(new Error('Service unavailable'), { status: 503 });
        return empty ? [] : lineages;
    };
    return client;
}

/** Retry invokes the existing read transport again and recovers into a populated list. */
export const RetryToPopulated: Story = {
    decorators: [(Story) => <MockWorkflowsProvider client={recoveryClient(false)}><Story /></MockWorkflowsProvider>],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole('alert');
        await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
        await expect(await canvas.findByRole('button', { name: new RegExp(lineages[0].name) })).toBeInTheDocument();
        await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
    },
};

/** A successful server-error retry may honestly return empty; it never infers permission from a role. */
export const RetryToEmpty: Story = {
    decorators: [(Story) => <MockWorkflowsProvider client={recoveryClient(true)}><Story /></MockWorkflowsProvider>],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole('alert');
        await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
        await expect(await canvas.findByText('No workflows match.')).toBeInTheDocument();
        await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    },
};


/** Authentication refusal is also forbidden, with no retry, for axios-shaped transports. */
export const ListUnauthenticated: Story = {
    decorators: [(Story) => {
        const client = makeMockClient();
        client.listLineages = async () => { throw Object.assign(new Error('Example private authentication detail'), { response: { status: 401 } }); };
        return <MockWorkflowsProvider client={client}><Story /></MockWorkflowsProvider>;
    }],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent("You don't have access to workflows.");
        await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute('data-page-state', 'forbidden');
        await expect(canvas.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
    },
};


/** A server failure is an error with bounded manual recovery, never a forbidden/empty claim. */
export const ListServerFailed: Story = {
    decorators: [(Story) => {
        const client = makeMockClient();
        client.listLineages = async () => { throw Object.assign(new Error('Example private server failure'), { response: { status: 500 } }); };
        return <MockWorkflowsProvider client={client}><Story /></MockWorkflowsProvider>;
    }],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Could not load workflows.');
        await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute('data-page-state', 'error');
        await expect(canvas.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        await expect(canvas.queryByText('No workflows match.')).not.toBeInTheDocument();
    },
};
