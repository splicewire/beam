import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RunnerTransformEditor } from './runner-transform-editor';
import { MockTransformsProvider, SAMPLE_TRANSFORMS } from './story-harness';

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
