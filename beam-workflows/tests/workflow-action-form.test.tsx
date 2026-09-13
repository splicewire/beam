import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
import { WorkflowActionForm } from '../src/index';

afterEach(cleanup);
const projection: WorkflowProjectionData = {
    type: 'article', current: 'draft', places: ['draft', 'published', 'unpublished'], available: ['publish'],
    transitions: [
        { name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null },
        { name: 'unpublish', from: ['published'], to: ['unpublished'], guard: null, effects: [], metadata: null },
    ],
};

describe('WorkflowActionForm', () => {
    it('offers a future transition and submits the intended instant through its injected callback', async () => {
        const schedule = vi.fn().mockResolvedValue(undefined);
        render(<WorkflowActionForm projection={projection} initialTransition="unpublish"
            initialLocalTime="2026-09-15T09:30" initialTimezone="Asia/Kathmandu" onSchedule={schedule} />);
        expect(screen.getByText(/not available from the subject/)).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Schedule transition' }));
        await waitFor(() => expect(schedule).toHaveBeenCalledWith({
            transition: 'unpublish', dueAt: '2026-09-15T03:45:00.000Z', timezone: 'Asia/Kathmandu',
        }));
    });
    it('requires an explicit repeated-hour choice and resets that choice after editing time', async () => {
        const schedule = vi.fn().mockResolvedValue(undefined);
        render(<WorkflowActionForm projection={projection} initialTransition="publish"
            initialLocalTime="2026-11-01T01:30" initialTimezone="America/New_York" onSchedule={schedule} />);
        const button = screen.getByRole('button', { name: 'Schedule transition' });
        expect(button.hasAttribute('disabled')).toBe(true);
        fireEvent.click(screen.getAllByRole('radio')[1]);
        fireEvent.click(button);
        await waitFor(() => expect(schedule).toHaveBeenCalledWith(expect.objectContaining({ dueAt: '2026-11-01T06:30:00.000Z' })));
        await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
        fireEvent.change(screen.getByLabelText('Date and time'), { target: { value: '2026-11-01T01:45' } });
        expect(button.hasAttribute('disabled')).toBe(true);
    });
    it('keeps the draft after a rejected save and prevents duplicate in-flight requests', async () => {
        let reject: (error: Error) => void = () => {};
        const schedule = vi.fn(() => new Promise<void>((_resolve, failure) => { reject = failure; }));
        render(<WorkflowActionForm projection={projection} initialTransition="publish"
            initialLocalTime="2026-09-15T12:00" initialTimezone="UTC" onSchedule={schedule} />);
        const form = screen.getByRole('form', { name: 'Schedule workflow transition' });
        fireEvent.submit(form);
        fireEvent.submit(form);
        expect(schedule).toHaveBeenCalledTimes(1);
        reject(new Error('Permission to schedule this subject was revoked.'));
        await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Permission'));
        expect((screen.getByLabelText('Date and time') as HTMLInputElement).value).toBe('2026-09-15T12:00');
        expect(screen.getByRole('button', { name: 'Schedule transition' }).hasAttribute('disabled')).toBe(false);
    });
    it('does not permit missing subjects, vanished transitions, or daylight-saving gaps', () => {
        const schedule = vi.fn();
        const { rerender } = render(<WorkflowActionForm projection={projection} initialTransition="publish"
            initialLocalTime="2026-03-08T02:30" initialTimezone="America/New_York" onSchedule={schedule} />);
        expect(screen.getByRole('alert').textContent).toContain('does not exist');
        expect(screen.getByRole('button', { name: 'Schedule transition' }).hasAttribute('disabled')).toBe(true);
        rerender(<WorkflowActionForm projection={null} onSchedule={schedule} />);
        fireEvent.submit(screen.getByRole('form', { name: 'Schedule workflow transition' }));
        expect(schedule).not.toHaveBeenCalled();
    });
});
