import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
import type { CalendarActionData, CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import { Button } from '@schemastud/ui';
import { WorkflowActionForm } from './WorkflowActionForm';
import { WorkflowActionDetail } from './WorkflowActionDetail';

// Explicit test-only loopback host. This story never talks to a default production API.
const base = 'http://127.0.0.1:8767/api/beam/calendar-actions';
const storageKey = 'standalone-calendar-workflow-action';
async function request<T>(path: string, input?: unknown): Promise<T> {
    const response = await fetch(`${base}${path}`, {
        method: input === undefined ? 'GET' : 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? 'The standalone fixture refused this action.');
    return body.data;
}
function StandaloneConsumer() {
    const [projection, setProjection] = useState<WorkflowProjectionData | null>(null);
    const [action, setAction] = useState<CalendarActionRecordData | null>(null);
    const [error, setError] = useState<string | null>(null);
    async function refresh() {
        setProjection(await request<WorkflowProjectionData>('/fixture-projection'));
        const id = sessionStorage.getItem(storageKey);
        if (id) setAction(await request<CalendarActionRecordData>(`/${encodeURIComponent(id)}`));
    }
    useEffect(() => { void refresh().catch((failure: Error) => setError(failure.message)); }, []);
    return <main className="max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Standalone article calendar</h2>
        <p className="text-sm text-muted-foreground">Local integration fixture: Beam calendars and workflows, without Tower or compositions.</p>
        {error ? <p role="alert">{error}</p> : null}
        {action ? <>
            <WorkflowActionDetail action={action} subject={<p>Article 1</p>} />
            <Button variant="outline" onClick={() => void refresh().catch((failure: Error) => setError(failure.message))}>Refresh outcome</Button>
        </> : <WorkflowActionForm projection={projection} subjectLabel="Article 1"
            initialTransition="publish" initialLocalTime="2030-09-15T09:30" initialTimezone="America/New_York"
            onSchedule={async (selection) => {
                const input: CalendarActionData = {
                    kind: 'kind.workflow-transition', payload: { subject_kind: 'article', subject_id: '1', transition: selection.transition },
                    due_at: selection.dueAt, timezone: selection.timezone, calendar_id: null, series_id: null,
                    recurrence_id: null, origin: null, correlation_id: null,
                };
                const record = await request<CalendarActionRecordData>('/schedule', input);
                sessionStorage.setItem(storageKey, record.id);
                setAction(record);
            }} />}
    </main>;
}
const meta = { title: 'Workflows/WorkflowActionStandalone', component: StandaloneConsumer,
    parameters: { layout: 'padded' } } satisfies Meta<typeof StandaloneConsumer>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Reads the loopback fixture at 127.0.0.1:8767, so it is NOT hermetic: excluded from VR, where a
 * baseline would record whatever that server answered (usually "Failed to fetch") on capture day.
 */
export const LiveFixture: Story = { parameters: { vr: { disable: true } } };
