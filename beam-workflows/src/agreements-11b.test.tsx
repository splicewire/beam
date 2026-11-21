import type { WorkflowBlueprintData, WorkflowProjectionData, WorkflowTransitionData } from '@splicewire/beam-resources/types/workflows';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowsProvider } from './provider';
import type { WorkflowsClient } from './types';
import { paramChoices, WorkflowEditor } from './WorkflowEditor';
import { WorkflowActions } from './WorkflowStepper';

// agreements 11b (lead rulings Q-11b-a and Q-11b-e): a guard param picked from declared choices, and a refused move shown
// with its reason and a slot for a way to satisfy its guard. Generic: nothing here knows about agreements.

afterEach(cleanup);

/** The provider every workflows component mounts under; no client call is made here. */
const inProvider = (children: ReactNode) => (
    <WorkflowsProvider services={{ client: {} as WorkflowsClient, notify: () => {} }}>{children}</WorkflowsProvider>
);

const agreementGuard = {
    name: 'agreement-is-current',
    label: 'Agreement is current',
    paramsSchema: {
        type: 'object',
        required: ['agreement'],
        properties: {
            agreement: {
                type: 'string',
                title: 'Agreement',
                oneOf: [
                    { const: 'terms', title: 'Terms of Service' },
                    { const: 'privacy', title: 'Privacy notice' },
                ],
            },
        },
    },
};

describe('a guard param picked from declared choices', () => {
    it('reads oneOf const+title, or a plain enum, and nothing else', () => {
        expect(paramChoices(agreementGuard.paramsSchema.properties.agreement)).toEqual([
            { value: 'terms', label: 'Terms of Service' },
            { value: 'privacy', label: 'Privacy notice' },
        ]);
        expect(paramChoices({ type: 'string', enum: ['a', 'b'] })).toEqual([
            { value: 'a', label: 'a' },
            { value: 'b', label: 'b' },
        ]);
        expect(paramChoices({ type: 'string' })).toBeNull();
        expect(paramChoices({ type: 'string', oneOf: [] })).toBeNull();
        expect(paramChoices({ type: 'boolean', enum: [true] })).toBeNull();
    });

    it('renders the param as a Select showing the chosen title, not a free-text input', () => {
        const blueprint: WorkflowBlueprintData = {
            name: 'Reports',
            places: ['draft', 'submitted'],
            initial: ['draft'],
            transitions: [
                {
                    name: 'submit',
                    from: ['draft'],
                    to: ['submitted'],
                    guard: 'agreement-is-current',
                    effects: [],
                    metadata: { guardParams: { agreement: 'terms' } },
                    reason: null,
                },
            ],
            metadata: null,
        };
        render(<WorkflowEditor initial={blueprint} guards={[agreementGuard]} effects={[]} principals={[]} onSave={() => {}} />);

        const picker = screen.getByRole('combobox', { name: 'Agreement' });
        expect(picker.textContent).toContain('Terms of Service');
        expect(document.getElementById('param-agreement')?.tagName).not.toBe('INPUT');
    });
});

describe('<WorkflowActions> shows a refused move with its reason', () => {
    const refused: WorkflowTransitionData = {
        name: 'submit',
        from: ['draft'],
        to: ['submitted'],
        guard: 'agreement-is-current',
        effects: [],
        metadata: { guardParams: { agreement: 'terms' } },
        reason: 'To take this step, accept Terms of Service first.',
    };
    const projection: WorkflowProjectionData = {
        type: 'report',
        current: 'draft',
        places: ['draft', 'submitted', 'archived'],
        available: ['archive'],
        transitions: [
            refused,
            { name: 'archive', from: ['draft'], to: ['archived'], guard: null, effects: [], metadata: null, reason: null },
        ],
    };

    it('renders the available move as before, and the refused one disabled with the guard sentence and the slot', () => {
        const renderBlocked = vi.fn((t: WorkflowTransitionData) => <button type="button">Satisfy {String(t.metadata?.guardParams?.agreement)}</button>);
        render(inProvider(<WorkflowActions projection={projection} channel={null} onTransition={() => {}} renderBlocked={renderBlocked} />));

        expect(screen.getByRole('button', { name: 'Archive' }).hasAttribute('disabled')).toBe(false);
        const blocked = screen.getByRole('button', { name: 'Submit' });
        expect(blocked.hasAttribute('disabled')).toBe(true);
        expect(blocked.getAttribute('aria-describedby')).toBe('refused-reason-submit');
        expect(screen.getByText('To take this step, accept Terms of Service first.')).toBeTruthy();
        expect(renderBlocked).toHaveBeenCalledWith(refused);
        expect(screen.getByRole('button', { name: 'Satisfy terms' })).toBeTruthy();
    });

    it('shows the reason without a slot, and nothing refused when every move is available', () => {
        const { unmount } = render(inProvider(<WorkflowActions projection={projection} channel={null} onTransition={() => {}} />));
        expect(screen.getByText('To take this step, accept Terms of Service first.')).toBeTruthy();
        unmount();

        render(
            inProvider(
                <WorkflowActions
                    projection={{ ...projection, available: ['archive', 'submit'], transitions: [{ ...refused, reason: null }, projection.transitions[1]] }}
                    channel={null}
                    onTransition={() => {}}
                />,
            ),
        );
        expect(screen.getByRole('button', { name: 'Submit' }).hasAttribute('disabled')).toBe(false);
        expect(document.querySelector('[data-workflow-refused]')).toBeNull();
    });
});
