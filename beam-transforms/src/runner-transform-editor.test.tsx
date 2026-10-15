import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TransformsProvider } from './provider';
import { RunnerTransformEditor } from './runner-transform-editor';
import { makeTransformsClient, MockTransformsProvider, SAMPLE_TRANSFORMS } from './story-harness';
import type { RunnerTransformInput } from './types';

const READ_ONLY_NOTICE = 'You can view and test transforms, but not change them.';

// Isolation-mount bar (ADR-0116 §8a): the surface mounts and renders off a pure fixture provider —
// no Laravel, no app, no @/ — proving it is genuinely portable. If this compiles + mounts, the
// four-kind injection contract is wired correctly.

it('mounts off a pure fixture provider and lists transforms', async () => {
    render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    expect(screen.getByText('Fetch enrichment')).toBeTruthy();
});

it('shows the deny-by-default effective-grant readout for a floored request', async () => {
    render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    // The floored transform advertises its narrowed net on the list card.
    await waitFor(() => expect(screen.getByText('Fetch enrichment')).toBeTruthy());
    expect(screen.getAllByText(/net: none/).length).toBeGreaterThan(0);
});

it('says there are no transforms yet instead of leaving the list blank', async () => {
    render(
        <MockTransformsProvider config={{ transforms: [] }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('No transforms yet')).toBeTruthy());
});

it('drops the empty-state prompt once transforms exist', async () => {
    render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    expect(screen.queryByText('No transforms yet')).toBeNull();
});

it('keeps the editor and paired fields single-column at narrow widths without changing the desktop panes', async () => {
    const { container } = render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    const layout = container.firstElementChild;
    expect(layout?.className).toContain('grid-cols-1');
    expect(layout?.className).toContain('lg:grid-cols-[320px_1fr]');

    for (const input of [screen.getByLabelText('Name'), screen.getByLabelText('Requested network')]) {
        expect(input.parentElement?.parentElement?.className).toContain('grid-cols-1');
        expect(input.parentElement?.parentElement?.className).toContain('sm:grid-cols-2');
    }
});

// MED-1: the editor follows the host's write policy. `can` is optional and defaults to all-true, so a host
// that passes nothing keeps full controls.
const READ_ONLY = { create: false, update: false, delete: false };

it('offers New, Save and Delete when the host passes no capabilities', async () => {
    render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy();
    fireEvent.click(screen.getByText('Shape payload'));
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Save/ })).toBeTruthy();
    expect((screen.getByLabelText('Name') as HTMLInputElement).readOnly).toBe(false);
    expect(screen.queryByText(READ_ONLY_NOTICE)).toBeNull();
});

it('shows a read-only actor the list and Test, but no New, Save or Delete', async () => {
    render(
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }} services={{ can: READ_ONLY }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    expect(screen.getByText(READ_ONLY_NOTICE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New' })).toBeNull();
    // Nothing selected: no blank "New transform" form to fill in.
    expect(screen.queryByText('New transform')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();

    fireEvent.click(screen.getByText('Shape payload'));
    expect(screen.getByText('Transform details')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect((screen.getByLabelText('Name') as HTMLInputElement).readOnly).toBe(true);
    expect((screen.getByLabelText('Code') as HTMLTextAreaElement).readOnly).toBe(true);
    for (const select of ['Runtime', 'Requested network', 'Sharing']) {
        expect((screen.getByLabelText(select) as HTMLSelectElement).disabled).toBe(true);
    }
    // Test rides read access, so it stays.
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect((screen.getByLabelText('Test — sample input') as HTMLTextAreaElement).readOnly).toBe(false);
});

it('applies each capability on its own', async () => {
    render(
        <MockTransformsProvider
            config={{ transforms: SAMPLE_TRANSFORMS }}
            services={{ can: { create: false, update: true, delete: false } }}
        >
            <RunnerTransformEditor />
        </MockTransformsProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'New' })).toBeNull();
    expect(screen.queryByText(READ_ONLY_NOTICE)).toBeNull();
    fireEvent.click(screen.getByText('Shape payload'));
    expect(screen.getByRole('button', { name: /Save/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect((screen.getByLabelText('Name') as HTMLInputElement).readOnly).toBe(false);
});

// Tower's RunnerTransformInputData is a strict DTO whose wire key is `requestedGrant`; an unknown key is a 422
// ('Unknown input field [requested_grant]'), which this surface would only show as a failed-save toast.
it('sends the requested grant as requestedGrant on create and update', async () => {
    const base = makeTransformsClient({ transforms: SAMPLE_TRANSFORMS });
    const create = vi.fn(async (input: RunnerTransformInput) => ({ ...SAMPLE_TRANSFORMS[0], id: 'new', name: input.name ?? 'New' }));
    const update = vi.fn(async (id: string, input: RunnerTransformInput) => ({ ...SAMPLE_TRANSFORMS[0], id, name: input.name ?? 'x' }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
        <QueryClientProvider client={queryClient}>
            <TransformsProvider services={{ client: { ...base, create, update } }}>
                <RunnerTransformEditor />
            </TransformsProvider>
        </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Shape payload')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'probe' } });
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'print("{}")' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toHaveProperty('requestedGrant');
    expect(create.mock.calls[0][0]).not.toHaveProperty('requested_grant');

    fireEvent.click(screen.getByText('Shape payload'));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toHaveProperty('requestedGrant');
    expect(update.mock.calls[0][1]).not.toHaveProperty('requested_grant');
});
