import type { ClientCatalog } from '@schemastud/messages';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { IntakeForm, PublicIntakeProvider, type PublicIntakeServices } from '../src/IntakeForm';
import { IntakeProvider } from '../src/provider';
import type { IntakeFormRenderProps } from '../src/types';

// Localization 30 part S2: beam-intake's form copy reads the reader's catalog through the seam, and is the pre-30
// English, byte for byte, without one. The provider module is loaded lazily, so at the parent (no seam yet) these
// render English and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-intake::messages.unavailable': { text: 'Este formulario no está disponible.', sourceLocale: 'es' },
        'splicewire-beam-intake::messages.send': { text: 'Enviar', sourceLocale: 'es' },
        'splicewire-beam-intake::messages.rate_limited': { text: 'Demasiados envíos. Espera un minuto.', sourceLocale: 'es' },
    },
};
type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
let provider: Provider | null | undefined;
async function messageProvider(): Promise<Provider | null> {
    if (provider !== undefined) return provider;
    try {
        provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        provider = null;
    }
    return provider;
}
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={catalog}>{children}</Provider> : children;
}
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };

afterEach(cleanup);

const CONTACT = { type: 'object', properties: { email: { type: 'string', title: 'Email' } } };

function tree(services: Partial<PublicIntakeServices>, captureKey: string, rendered: { current?: IntakeFormRenderProps }) {
    return (
        <IntakeProvider services={{ client: { submit: vi.fn() }, renderForm: (form) => { rendered.current = form; return <p>host form</p>; } }}>
            <PublicIntakeProvider value={{ schemas: { contact: CONTACT }, ...services }}>
                <IntakeForm captureKey={captureKey} />
            </PublicIntakeProvider>
        </IntakeProvider>
    );
}

it('says an unknown form is unavailable, and labels the submit, in Spanish', async () => {
    const rendered: { current?: IntakeFormRenderProps } = {};
    render(await inLocale(spanish, tree({}, 'missing', rendered)));
    expect(screen.getByRole('note').textContent).toBe('Este formulario no está disponible.');
    cleanup();
    render(await inLocale(spanish, tree({}, 'contact', rendered)));
    expect(rendered.current?.submitLabel).toBe('Enviar');
});

it('keeps a failure as a notice, so it re-renders in the locale the reader switches to', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: false, status: 429, errors: {} });
    const rendered: { current?: IntakeFormRenderProps } = {};
    const view = render(await inLocale(english, tree({ submit }, 'contact', rendered)));
    act(() => rendered.current!.onSubmit({ email: 'a@b.test' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Too many submissions. Please wait a minute and try again.'));
    view.rerender(await inLocale(spanish, tree({ submit }, 'contact', rendered)) as never);
    expect(screen.getByRole('alert').textContent).toBe('Demasiados envíos. Espera un minuto.');
});
