import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowActionDetail } from './WorkflowActionDetail';

const meta = {
    title: 'Workflows/WorkflowActionDetail', component: WorkflowActionDetail,
    parameters: { layout: 'padded' },
    args: {
        subject: <p className="text-sm">Example article — synthetic fixture</p>,
        action: {
            id: 'action-1', revision: 2, status: 'blocked', current_attempt_id: 'attempt-1', attempt_number: 1,
            due_at: '2026-09-15T13:30:00+00:00', timezone: 'America/New_York', kind: 'kind.workflow-transition',
            payload: { subject_kind: 'article', subject_id: 'article-1', transition: 'publish' },
            principal: 'user:1', creator: 'user:1', origin: null, correlation_id: null,
            calendar_id: null, series_id: null, recurrence_id: null,
            attempts: [{ id: 'attempt-1', revision: 1, number: 1, status: 'blocked',
                blockers: ['Review is incomplete.'], result: {}, due_at: '2026-09-15T13:30:00+00:00',
                started_at: '2026-09-15T13:31:00+00:00', completed_at: '2026-09-15T13:31:01+00:00' }],
        },
        onRetry: async () => { throw new Error('This schedule changed. Refresh its details before retrying.'); },
    },
    decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof WorkflowActionDetail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blocked: Story = {};
export const PendingRetry: Story = {
    args: { action: { ...meta.args.action, status: 'pending', revision: 3, current_attempt_id: 'attempt-2', attempt_number: 2,
        attempts: [...meta.args.action.attempts, { id: 'attempt-2', number: 2, revision: 3, status: 'pending',
            blockers: [], result: {}, due_at: '2026-09-15T14:00:00+00:00', started_at: null, completed_at: null }] },
        onCancel: async () => {},
    },
};
export const Applied: Story = { args: { action: { ...meta.args.action, status: 'applied',
    attempts: [{ ...meta.args.action.attempts[0], status: 'applied', blockers: [] }] } } };
