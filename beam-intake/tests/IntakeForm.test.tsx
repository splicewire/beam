import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntakeForm, PublicIntakeProvider, submitToIntakeDoor, type PublicIntakeServices } from '../src/IntakeForm';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const CONTACT = {
    type: 'object',
    properties: { email: { type: 'string', format: 'email', title: 'Email' }, seats: { type: 'integer', title: 'Seats' }, note: { type: 'string', title: 'Note' } },
    required: ['email'],
};

function mount(services: Partial<PublicIntakeServices>, props: Partial<Parameters<typeof IntakeForm>[0]> = {}) {
    return render(<PublicIntakeProvider value={{ schemas: { contact: CONTACT }, ...services }}>
        <IntakeForm captureKey="contact" {...props} />
    </PublicIntakeProvider>);
}

it('renders the schema fields and sends a typed payload with the honeypot field, then shows the success message (EP-07d)', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true });
    mount({ submit }, { submitLabel: 'Join', successMessage: 'You are on the list.' });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.test' } });
    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith('contact', { email: 'ada@example.test', seats: 3, website: '' }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'You are on the list.');
});

it("maps the door's 422 errors onto their fields and a 429 onto the throttle message", async () => {
    const submit = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 422, message: 'The submission for [contact] is invalid.', errors: { '/email': ['Must be an email.'], '': ['Root problem.'] } })
        .mockResolvedValueOnce({ ok: false, status: 429, errors: {} });
    mount({ submit });

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Must be an email.')).toBeTruthy();
    expect(screen.getByText('Root problem.')).toBeTruthy();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText(/Too many submissions/)).toBeTruthy();
});

it('is a sealed preview in the editor, and a key the page was given no schema for renders a notice', () => {
    const submit = vi.fn();
    mount({ submit }, { preview: true });
    expect((screen.getByLabelText('Email') as HTMLInputElement).disabled).toBe(true);
    fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);
    expect(submit).not.toHaveBeenCalled();
    cleanup();

    render(<PublicIntakeProvider value={{ schemas: {} }}><IntakeForm captureKey="private" /></PublicIntakeProvider>);
    expect(screen.getByRole('note').textContent).toBe('This form is not available.');
});

it('posts to the public intake door and reads its error body', async () => {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 201 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Invalid.', errors: { '/email': ['Required.'] } }), { status: 422 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await submitToIntakeDoor('forms/contact', { email: 'a@b.test' })).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/beam/intake/forms/contact');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ email: 'a@b.test' }) });
    expect(await submitToIntakeDoor('contact', {})).toEqual({ ok: false, status: 422, message: 'Invalid.', errors: { '/email': ['Required.'] } });
});
