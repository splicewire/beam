import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import { WorkflowActionDetail } from '../src/index';

afterEach(cleanup);
function blockedAction(): CalendarActionRecordData {
    return {
        id: 'action-1', revision: 2, status: 'blocked', current_attempt_id: 'attempt-1', attempt_number: 1,
        due_at: '2026-09-15T13:30:00+00:00', timezone: 'America/New_York', kind: 'kind.workflow-transition',
        payload: { subject_kind: 'article', subject_id: 'article-1', transition: 'publish' },
        principal: 'user:1', creator: 'user:1', origin: null, correlation_id: null,
        calendar_id: null, series_id: null, recurrence_id: null,
        attempts: [{ id: 'attempt-1', revision: 1, number: 1, status: 'blocked',
            blockers: ['Review is incomplete.'], result: {}, due_at: '2026-09-15T13:30:00+00:00',
            started_at: '2026-09-15T13:31:00+00:00', completed_at: '2026-09-15T13:31:01+00:00' }],
    };
}
describe('WorkflowActionDetail', () => {
    it('shows a refusal and its intended and actual times without claiming application', () => {
        const { container } = render(<WorkflowActionDetail action={blockedAction()} onRetry={async () => {}} />);
        expect(screen.getByText('Review is incomplete.')).toBeDefined();
        expect(screen.getByText('The workflow did not advance. Resolve the blockers below, then retry explicitly.')).toBeDefined();
        expect(screen.queryByText('Applied')).toBeNull();
        expect(container.querySelector('time[datetime="2026-09-15T13:31:01+00:00"]')).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel schedule' })).toBeNull();
    });
    it('keeps immutable refusal history visible when a retry is pending', () => {
        const action = blockedAction();
        action.status = 'pending'; action.revision = 3; action.current_attempt_id = 'attempt-2'; action.attempt_number = 2;
        action.attempts.push({ id: 'attempt-2', number: 2, revision: 3, status: 'pending', blockers: [], result: {},
            due_at: '2026-09-15T14:00:00+00:00', started_at: null, completed_at: null });
        render(<WorkflowActionDetail action={action} onCancel={async () => {}} onRetry={async () => {}} />);
        expect(screen.getByText('Attempt 1: Blocked')).toBeDefined();
        expect(screen.getByText('Attempt 2: Pending')).toBeDefined();
        expect(screen.getByText('Review is incomplete.')).toBeDefined();
        expect(screen.queryByRole('button', { name: 'Retry now' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Cancel schedule' })).toBeDefined();
    });
    it('surfaces a retry conflict while retaining history for recovery', async () => {
        const retry = vi.fn().mockRejectedValue(new Error('This schedule changed. Refresh before retrying.'));
        render(<WorkflowActionDetail action={blockedAction()} onRetry={retry} />);
        fireEvent.click(screen.getByRole('button', { name: 'Retry now' }));
        await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Refresh'));
        expect(screen.getByText('Review is incomplete.')).toBeDefined();
        expect(retry).toHaveBeenCalledTimes(1);
    });
    it('shows successful application and provides no terminal mutation controls', () => {
        const action = blockedAction(); action.status = 'applied'; action.attempts[0].status = 'applied'; action.attempts[0].blockers = [];
        render(<WorkflowActionDetail action={action} onCancel={async () => {}} onRetry={async () => {}} onEdit={() => {}} />);
        expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
