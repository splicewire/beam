import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import {
    WorkflowReactionForm,
    type WorkflowReactionCircuitFieldProps,
} from '../src/WorkflowReactionForm';
import { WorkflowReactionHistory } from '../src/WorkflowReactionHistory';

afterEach(cleanup);
const projection: WorkflowProjectionData = {
    type: 'article',
    current: 'draft',
    places: ['draft', 'published'],
    available: ['publish'],
    transitions: [
        {
            name: 'publish',
            from: ['draft'],
            to: ['published'],
            guard: null,
            effects: [],
            metadata: null,
            reason: null,
        },
        {
            name: 'unpublish',
            from: ['published'],
            to: ['draft'],
            guard: null,
            effects: [],
            metadata: null,
            reason: null,
        },
    ],
};

it('configures a relative transition from the selected subject and actual-transition policy', async () => {
    const configure = vi.fn().mockResolvedValue(undefined);
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            calendarId="calendar:1"
            initialTimezone="America/New_York"
            onConfigure={configure}
        />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await waitFor(() =>
        expect(configure).toHaveBeenCalledWith({
            subject_kind: 'article',
            subject_id: '1',
            transition: 'publish',
            action_kind: 'kind.workflow-transition',
            action_payload: {
                subject_kind: 'article',
                subject_id: '1',
                transition: 'unpublish',
            },
            calendar_days: 30,
            timezone: 'America/New_York',
            calendar_id: 'calendar:1',
        }),
    );
    expect(screen.getByText(/actual successful transition/)).toBeDefined();
});

it('gets Circuit payload from the host and preserves a refused configuration for recovery', async () => {
    const configure = vi.fn().mockRejectedValue(new Error('Circuit permission was removed.'));
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            initialTimezone="UTC"
            onConfigure={configure}
            circuitChoices={[{ id: 'circuit:1', label: 'Distribute publication' }]}
            circuitAction={(id) => ({
                action_kind: 'kind.run-circuit',
                action_payload: { circuit_id: id, params: {} },
            })}
        />,
    );
    fireEvent.change(screen.getByLabelText('Calendar days later'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Follow-up action'), {
        target: { value: 'circuit' },
    });
    fireEvent.change(screen.getByLabelText('Circuit'), {
        target: { value: 'circuit:1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('permission'));
    expect(configure).toHaveBeenCalledWith(
        expect.objectContaining({
            calendar_days: 0,
            action_payload: { circuit_id: 'circuit:1', params: {} },
        }),
    );
});

const runCircuit = (id: string) => ({
    action_kind: 'kind.run-circuit',
    action_payload: { circuit_id: id, params: {} },
});

function chooseCircuitDestination() {
    fireEvent.change(screen.getByLabelText('Follow-up action'), {
        target: { value: 'circuit' },
    });
}

it('(a) a host Circuit field replaces the select and gets the label wiring', () => {
    const field = vi.fn((props: WorkflowReactionCircuitFieldProps) => (
        <button type="button" id={props.id} aria-labelledby={props.labelId}>
            Host circuit control
        </button>
    ));
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            onConfigure={vi.fn()}
            circuitChoices={[{ id: 'circuit:1', label: 'Distribute publication' }]}
            circuitAction={runCircuit}
            renderCircuitField={field}
        />,
    );
    chooseCircuitDestination();
    expect(screen.queryByRole('combobox', { name: 'Circuit' })).toBeNull();
    expect(screen.getByLabelText('Circuit').textContent).toBe('Host circuit control');
    const props = field.mock.lastCall![0];
    expect(props).toMatchObject({ value: '', disabled: false });
    expect(document.getElementById(props.id)?.tagName).toBe('BUTTON');
    expect(document.getElementById(props.labelId)?.textContent).toBe('Circuit');
    expect(document.getElementById(props.labelId)?.getAttribute('for')).toBe(props.id);
});

it('(b) an id the host field sets outside circuitChoices enables submit and reaches circuitAction', async () => {
    const configure = vi.fn().mockResolvedValue(undefined);
    const action = vi.fn(runCircuit);
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            initialTimezone="UTC"
            onConfigure={configure}
            circuitChoices={[{ id: 'circuit:1', label: 'Distribute publication' }]}
            circuitAction={action}
            renderCircuitField={({ onChange }) => (
                <button type="button" onClick={() => onChange('circuit:created')}>
                    Create a circuit
                </button>
            )}
        />,
    );
    chooseCircuitDestination();
    const submit = screen.getByRole('button', { name: 'Add follow-up' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Create a circuit' }));
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => expect(configure).toHaveBeenCalledTimes(1));
    expect(action).toHaveBeenCalledWith('circuit:created');
    expect(configure).toHaveBeenCalledWith(
        expect.objectContaining({
            action_kind: 'kind.run-circuit',
            action_payload: { circuit_id: 'circuit:created', params: {} },
        }),
    );
});

it('(c) the host field gets disabled while onConfigure is pending', async () => {
    const field = vi.fn(({ onChange }: WorkflowReactionCircuitFieldProps) => (
        <button type="button" onClick={() => onChange('circuit:1')}>
            Pick
        </button>
    ));
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            initialTimezone="UTC"
            onConfigure={() => new Promise<void>(() => {})}
            circuitAction={runCircuit}
            renderCircuitField={field}
        />,
    );
    chooseCircuitDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(field.mock.lastCall![0]).toMatchObject({ value: 'circuit:1', disabled: false });
    fireEvent.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await waitFor(() => expect(field.mock.lastCall![0].disabled).toBe(true));
});

it('(d) without circuitAction the host field is never called', () => {
    const field = vi.fn(() => null);
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            onConfigure={vi.fn()}
            renderCircuitField={field}
        />,
    );
    expect(screen.queryByRole('option', { name: 'Run a Circuit' })).toBeNull();
    chooseCircuitDestination();
    expect(field).not.toHaveBeenCalled();
});

it('(d) a host field chosen while circuitAction existed is not called once circuitAction is removed', () => {
    const field = vi.fn(() => <span>Host circuit control</span>);
    const props = {
        projection,
        subject: { subject_kind: 'article', subject_id: '1' },
        onConfigure: vi.fn(),
        renderCircuitField: field,
    };
    const { rerender } = render(<WorkflowReactionForm {...props} circuitAction={runCircuit} />);
    chooseCircuitDestination();
    expect(screen.getByText('Host circuit control')).toBeDefined();
    field.mockClear();
    rerender(<WorkflowReactionForm {...props} />);
    expect(field).not.toHaveBeenCalled();
    expect(screen.queryByText('Host circuit control')).toBeNull();
    expect((screen.getByRole('button', { name: 'Add follow-up' }) as HTMLButtonElement).disabled).toBe(true);
});

it('(e) with the host field and no circuitChoices, the empty-choices message is not shown', () => {
    render(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            onConfigure={vi.fn()}
            circuitAction={runCircuit}
            renderCircuitField={() => <span>Host circuit control</span>}
        />,
    );
    chooseCircuitDestination();
    expect(screen.getByText('Host circuit control')).toBeDefined();
    expect(screen.queryByText(/No Circuits are available/)).toBeNull();
});

it('disables incomplete and duplicate submissions', async () => {
    const configure = vi.fn(() => new Promise<void>(() => {}));
    const { rerender } = render(
        <WorkflowReactionForm
            projection={null}
            subject={{ subject_kind: 'article', subject_id: '' }}
            onConfigure={configure}
        />,
    );
    fireEvent.submit(screen.getByRole('form', { name: 'Configure workflow follow-up' }));
    expect(configure).not.toHaveBeenCalled();
    rerender(
        <WorkflowReactionForm
            projection={projection}
            subject={{ subject_kind: 'article', subject_id: '1' }}
            onConfigure={configure}
        />,
    );
    fireEvent.change(screen.getByLabelText('After transition'), {
        target: { value: 'publish' },
    });
    fireEvent.change(screen.getByLabelText('Then transition'), {
        target: { value: 'unpublish' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Configure workflow follow-up' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Configure workflow follow-up' }));
    expect(configure).toHaveBeenCalledTimes(1);
});

it('keeps blocked delivery history visible and uses displayed revisions for explicit controls', async () => {
    const disable = vi.fn().mockResolvedValue(undefined);
    const retry = vi.fn().mockRejectedValue(new Error('Reload the current delivery.'));
    const transitionLink = vi.fn(() => null);
    render(
        <WorkflowReactionHistory
            reactions={[
                {
                    id: 'binding:1',
                    revision: 2,
                    enabled: true,
                    configuration: {
                        subject_kind: 'article',
                        subject_id: '1',
                        transition: 'publish',
                        action_kind: 'kind.workflow-transition',
                        action_payload: { transition: 'unpublish' },
                        calendar_days: 30,
                        timezone: 'America/New_York',
                        calendar_id: 'calendar:1',
                    },
                    deliveries: [
                        {
                            id: 'delivery:1',
                            status: 'blocked',
                            transition_id: 'fact:1',
                            action_id: 'action:1',
                            anchored_at: '2026-03-01T14:00:00Z',
                            attempts: 1,
                            blockers: ['Permission unavailable.'],
                        },
                    ],
                },
            ]}
            onDisable={disable}
            onRetry={retry}
            renderTransitionLink={transitionLink}
            renderActionLink={(id) => <a href={'/actions/' + id}>View action</a>}
        />,
    );
    expect(screen.getByText('Permission unavailable.')).toBeDefined();
    expect(transitionLink).toHaveBeenCalledWith('fact:1', {
        subject_kind: 'article',
        subject_id: '1',
    });
    expect(screen.getByRole('link', { name: 'View action' }).getAttribute('href')).toBe(
        '/actions/action:1',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry delivery' }));
    await waitFor(() =>
        expect(retry).toHaveBeenCalledWith({
            id: 'delivery:1',
            expected_attempts: 1,
        }),
    );
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Reload'));
    fireEvent.click(screen.getByRole('button', { name: 'Disable follow-up' }));
    await waitFor(() =>
        expect(disable).toHaveBeenCalledWith({
            id: 'binding:1',
            expected_revision: 2,
        }),
    );
});
