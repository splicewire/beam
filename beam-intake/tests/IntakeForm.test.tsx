import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntakeForm, PublicIntakeProvider, pointerTokens, submitToIntakeDoor, toErrorSchema, type PublicIntakeServices } from '../src/IntakeForm';
import { IntakeProvider } from '../src/provider';
import type { IntakeFormRenderProps } from '../src/types';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

const CONTACT = {
    type: 'object',
    properties: { email: { type: 'string', format: 'email', title: 'Email' }, seats: { type: 'integer', title: 'Seats' }, note: { type: 'string', title: 'Note' } },
    required: ['email'],
};

/** Mount through a host renderForm, the seam IntakeSectionForm shares, and capture what the form hands it. */
function mount(services: Partial<PublicIntakeServices>, props: Partial<Parameters<typeof IntakeForm>[0]> = {}) {
    const rendered: { current?: IntakeFormRenderProps } = {};
    render(<IntakeProvider services={{ client: { submit: vi.fn() }, renderForm: form => { rendered.current = form; return <p>host form</p>; } }}>
        <PublicIntakeProvider value={{ schemas: { contact: CONTACT }, ...services }}>
            <IntakeForm captureKey="contact" {...props} />
        </PublicIntakeProvider>
    </IntakeProvider>);

    return rendered;
}

it('sends the submission with the honeypot field the page names, leaving empty fields out, then shows the success message (EP-07d)', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true });
    const rendered = mount({ submit, honeypotField: 'nickname' }, { submitLabel: 'Join', successMessage: 'You are on the list.' });
    expect(rendered.current?.schema).toBe(CONTACT);
    expect(rendered.current?.submitLabel).toBe('Join');

    act(() => rendered.current!.onSubmit({ email: 'ada@example.test', seats: 3, note: '' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith('contact', { email: 'ada@example.test', seats: 3, nickname: '' }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'You are on the list.');
});

it("hands the door's 422 errors to the renderer and turns a 429 into the throttle message", async () => {
    const submit = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 422, message: 'The submission for [contact] is invalid.', errors: { '/email': ['Must be an email.'] } })
        .mockResolvedValueOnce({ ok: false, status: 429, errors: {} });
    const rendered = mount({ submit });

    act(() => rendered.current!.onSubmit({ email: 'nope' }));
    await waitFor(() => expect(rendered.current?.errors).toEqual({ '/email': ['Must be an email.'] }));
    expect(screen.getByRole('alert').textContent).toBe('The submission for [contact] is invalid.');

    act(() => rendered.current!.onSubmit({ email: 'nope' }));
    expect(await screen.findByText(/Too many submissions/)).toBeTruthy();
});

it('is a sealed preview in the editor, and a key with no schema renders a notice', () => {
    const submit = vi.fn();
    const rendered = mount({ submit }, { preview: true });
    expect(rendered.current?.disabled).toBe(true);
    act(() => rendered.current!.onSubmit({ email: 'a@b.test' }));
    expect(submit).not.toHaveBeenCalled();
    cleanup();

    render(<PublicIntakeProvider value={{ schemas: {} }}><IntakeForm captureKey="private" /></PublicIntakeProvider>);
    expect(screen.getByRole('note').textContent).toBe('This form is not available.');
    cleanup();
    render(<PublicIntakeProvider value={{ schemas: {} }}><IntakeForm captureKey="contact" preview /></PublicIntakeProvider>);
    expect(screen.getByRole('note').textContent).toBe('Intake form · contact');
});

it('draws its fields with SchemaForm when no host renderer is mounted', () => {
    const { container } = render(<PublicIntakeProvider value={{ schemas: { contact: CONTACT } }}><IntakeForm captureKey="contact" /></PublicIntakeProvider>);

    expect(container.querySelector('#root_email')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(container.querySelector('input[name="website"][aria-hidden="true"]')).not.toBeNull();
});

it('posts to the public intake door with the CSRF header the other transports send, and reads its error body', async () => {
    document.cookie = 'XSRF-TOKEN=abc%3D';
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 201 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Invalid.', errors: { '/email': ['Required.'] } }), { status: 422 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await submitToIntakeDoor('forms/contact', { email: 'a@b.test' })).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/beam/intake/forms/contact');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ email: 'a@b.test' }), headers: { 'X-XSRF-TOKEN': 'abc=' } });
    expect(await submitToIntakeDoor('contact', {})).toEqual({ ok: false, status: 422, message: 'Invalid.', errors: { '/email': ['Required.'] } });
});

it('decodes the door\'s JSON Pointer error paths per RFC 6901 (~1 is /, ~0 is ~)', () => {
    expect(pointerTokens('')).toEqual([]);
    expect(pointerTokens('/email')).toEqual(['email']);
    expect(pointerTokens('/a~1b')).toEqual(['a/b']);
    expect(pointerTokens('/m~0n')).toEqual(['m~n']);
    expect(pointerTokens('/~01'), '~0 is decoded after ~1, so ~01 is ~1, not /').toEqual(['~1']);
    expect(pointerTokens('/address/street')).toEqual(['address', 'street']);
});

it('puts a field named with / or ~ in its own error when SchemaForm draws it', async () => {
    const schema = { type: 'object', properties: { 'a/b': { type: 'string', title: 'Slash' } } };
    const submit = vi.fn().mockResolvedValue({ ok: false, status: 422, errors: { '/a~1b': ['Slash is wrong.'] } });
    render(<PublicIntakeProvider value={{ schemas: { slash: schema }, submit }}><IntakeForm captureKey="slash" /></PublicIntakeProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Slash is wrong.')).toBeTruthy();
});

it('a network failure leaves the form usable with a retryable error, and no unhandled rejection', async () => {
    const submit = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({ ok: true });
    const rendered = mount({ submit });

    act(() => rendered.current!.onSubmit({ email: 'ada@example.test' }));

    expect(await screen.findByText(/could not be sent/)).toBeTruthy();
    await waitFor(() => expect(rendered.current?.disabled).toBe(false));
    act(() => rendered.current!.onSubmit({ email: 'ada@example.test' }));
    expect(await screen.findByRole('status')).toBeTruthy();
});

it('never lets a server error path reach Object.prototype (__proto__, constructor, prototype)', async () => {
    const schema = toErrorSchema({ '/__proto__': ['polluted'], '/a/__proto__': ['polluted'], '/constructor/prototype': ['polluted'], '/b/prototype': ['polluted'], '/email': ['Kept.'] });

    expect(Object.prototype).not.toHaveProperty('__errors');
    expect(({} as Record<string, unknown>).__errors).toBeUndefined();
    expect(Object.getPrototypeOf(schema)).toBeNull();
    expect(Object.keys(schema)).toEqual(['email']);
    expect((schema.email as Record<string, unknown>).__errors).toEqual(['Kept.']);

    const submit = vi.fn().mockResolvedValue({ ok: false, status: 422, message: 'Invalid.', errors: JSON.parse('{"/__proto__":["polluted"],"/a/__proto__":["polluted"]}') });
    const { container } = render(<PublicIntakeProvider value={{ schemas: { contact: CONTACT }, submit }}><IntakeForm captureKey="contact" /></PublicIntakeProvider>);
    // The email is required: left empty, the validator stops the submit before any server error exists.
    fireEvent.change(container.querySelector('#root_email')!, { target: { value: 'ada@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    // The 422 message shows only once the hostile errors have been drawn through SchemaForm.
    expect(await screen.findByText('Invalid.')).toBeTruthy();
    expect(submit).toHaveBeenCalledOnce();
    expect(Object.prototype).not.toHaveProperty('__errors');
});
