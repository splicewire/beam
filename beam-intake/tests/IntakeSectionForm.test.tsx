import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntakeProvider } from '../src/provider';
import { IntakeSectionForm } from '../src/IntakeSectionForm';
import { emptySection, populatedSection, receipt } from '../src/story-fixtures';
import type { IntakeServices, EntityIntakeFormSectionData } from '../src/types';

afterEach(cleanup);
function mount(
    services: IntakeServices,
    section: EntityIntakeFormSectionData = populatedSection,
    disabled = false,
) {
    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <IntakeProvider services={services}>
                <IntakeSectionForm section={section} disabled={disabled} />
            </IntakeProvider>
        </QueryClientProvider>,
    );
}
const renderForm: NonNullable<IntakeServices['renderForm']> = ({
    formData,
    disabled,
    onChange,
    onSubmit,
}) => (
    <form
        onSubmit={(event) => {
            event.preventDefault();
            onSubmit(formData);
        }}
    >
        <input
            aria-label="Name"
            value={String(formData.name ?? '')}
            disabled={disabled}
            onChange={(event) => onChange({ name: event.target.value })}
        />
        <button type="submit" disabled={disabled}>
            Send section
        </button>
    </form>
);

describe('isolated intake section', () => {
    it('submits the exact selected section and fields through the adapter, then resets receipt on edits', async () => {
        const submit = vi.fn(async () => receipt);
        mount({ client: { submit }, renderForm });
        fireEvent.click(screen.getByRole('button', { name: 'Send section' }));
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain(
                receipt.submission_id,
            ),
        );
        expect(submit).toHaveBeenCalledWith('contact', { name: 'Alex' });
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'Sam' },
        });
        expect(screen.queryByRole('status')).toBeNull();
    });
    it('shows pending and disables the form until the server receipt arrives', async () => {
        let resolve: (value: typeof receipt) => void = () => {};
        const pending = new Promise<typeof receipt>((done) => {
            resolve = done;
        });
        mount({ client: { submit: () => pending }, renderForm });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() =>
            expect(screen.getByRole('button').hasAttribute('disabled')).toBe(
                true,
            ),
        );
        expect(screen.getByRole('status').textContent).toContain(
            'Submitting section',
        );
        resolve(receipt);
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain(
                receipt.submission_id,
            ),
        );
    });
    it('ignores renderer changes and duplicate submissions while transport is in flight', async () => {
        let reject: (reason: Error) => void = () => {};
        const pending = new Promise<typeof receipt>((_, fail) => {
            reject = fail;
        });
        const submit = vi.fn(() => pending);
        mount({
            client: { submit },
            renderForm: (props) => (
                <>
                    <p data-testid="draft">{String(props.formData.name)}</p>
                    <button
                        onClick={() => {
                            props.onSubmit(props.formData);
                            props.onChange({ name: 'Discarded during submit' });
                            props.onSubmit({ name: 'Duplicate' });
                        }}
                    >
                        Send
                    </button>
                </>
            ),
        });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(submit).toHaveBeenCalledOnce());
        fireEvent.click(screen.getByRole('button'));
        expect(submit).toHaveBeenCalledOnce();
        expect(screen.getByRole('status').textContent).toContain(
            'Submitting section',
        );
        expect(screen.getByTestId('draft').textContent).toBe('Alex');
        reject(new Error('Rejected'));
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toContain('Rejected'),
        );
        expect(screen.getByTestId('draft').textContent).toBe('Alex');
    });
    it('surfaces rejection, clears it on edit, and permits a retry', async () => {
        const submit = vi
            .fn()
            .mockRejectedValueOnce(new Error('Section not authorized'))
            .mockResolvedValue(receipt);
        const onError = vi.fn();
        mount({ client: { submit }, renderForm, onError });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toContain(
                'Section not authorized',
            ),
        );
        expect(onError).toHaveBeenCalledOnce();
        expect(screen.queryByRole('status')).toBeNull();
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'Sam' },
        });
        expect(screen.queryByRole('alert')).toBeNull();
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain(
                receipt.submission_id,
            ),
        );
        expect(submit).toHaveBeenLastCalledWith('contact', { name: 'Sam' });
    });
    it('uses meaningful dependency-free feedback for non-Error failures', async () => {
        mount({
            client: {
                submit: async () => {
                    throw null;
                },
            },
            renderForm,
        });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toContain(
                'Unable to submit this section.',
            ),
        );
    });
    it('blocks submissions when externally disabled, including custom render slots', () => {
        const submit = vi.fn(async () => receipt);
        mount(
            {
                client: { submit },
                renderForm: (props) => (
                    <button onClick={() => props.onSubmit({})}>Override</button>
                ),
            },
            emptySection,
            true,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(submit).not.toHaveBeenCalled();
    });
    it('mounts the real foundation form and submits an empty DTO fixture without Laravel', async () => {
        const submit = vi.fn(async () => receipt);
        mount({ client: { submit } }, emptySection);
        expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
        await waitFor(() => expect(submit).toHaveBeenCalledWith('contact', {}));
        expect(screen.getByRole('status').textContent).toContain(
            receipt.submission_id,
        );
    });

    it('names the section once: the default form drops the schema root title the card header already shows', async () => {
        mount({ client: { submit: vi.fn(async () => receipt) } });
        await screen.findByLabelText('Name');
        expect(screen.getAllByText(String(populatedSection.schema.title))).toHaveLength(1);
    });
});
