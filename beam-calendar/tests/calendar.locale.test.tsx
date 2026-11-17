import type { ClientCatalog } from '@schemastud/messages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Filters } from '../src/chrome';
import { CalendarCellForm, CalendarCellFormProvider, type CalendarCellClient } from '../src/index';

// Localization 30 part C: beam-calendar's copy reads the reader's catalog through the seam, and is the pre-30 English,
// byte for byte, without one. The provider module is loaded lazily, so at the parent (no seam yet) these render English
// and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-calendar::messages.status_approved': { text: 'Aprobado', sourceLocale: 'es' },
        'splicewire-beam-calendar::messages.status_needs_review': { text: 'Necesita revisión', sourceLocale: 'es' },
        'splicewire-beam-calendar::messages.chrome_status': { text: 'Estado', sourceLocale: 'es' },
        'splicewire-beam-calendar::messages.form_schedule_release': { text: 'Programar publicación', sourceLocale: 'es' },
        'splicewire-beam-calendar::messages.form_error_content': { text: 'Elige el contenido que publicar.', sourceLocale: 'es' },
    },
};
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };

type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
async function messageProvider(): Promise<Provider | null> {
    try {
        return (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        return null;
    }
}
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={catalog}>{children}</Provider> : children;
}

afterEach(cleanup);

describe('beam-calendar copy reads the seam', () => {
    it('names statuses and the facet group in the reader\'s locale; a projected status stays as the server sent it', async () => {
        const filters = (
            <Filters
                calendars={[]}
                statuses={['approved', 'needs_review', 'awaiting_payment']}
                active={{ statuses: new Set(), calendars: new Set() }}
                onToggleCalendar={() => {}}
                onToggleStatus={() => {}}
            />
        );
        const view = render(await inLocale(spanish, filters));

        expect(screen.queryByRole('button', { name: 'Aprobado' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Necesita revisión' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Awaiting payment' })).not.toBeNull();
        expect(view.container.querySelector('[aria-label="Estado"]')).not.toBeNull();

        view.rerender(filters);
        expect(screen.queryByRole('button', { name: 'Approved' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Needs review' })).not.toBeNull();
    });

    it('keeps a validation error as a key, so a live locale switch re-renders it', async () => {
        const client: CalendarCellClient = {
            listCells: () => Promise.resolve([]),
            listProfiles: () => Promise.resolve([{ name: 'calendar', cellKinds: [] }]),
            saveCell: vi.fn(() => Promise.resolve()),
        } as unknown as CalendarCellClient;
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const form = (
            <QueryClientProvider client={qc}>
                <CalendarCellFormProvider services={{ client }}>
                    <CalendarCellForm compositionId="cal-x" initialDate={new Date(2026, 6, 20)} onSaved={() => {}} />
                </CalendarCellFormProvider>
            </QueryClientProvider>
        );
        const view = render(await inLocale(spanish, form));

        await waitFor(() => expect(screen.queryByRole('button', { name: 'Programar publicación' })).not.toBeNull());
        fireEvent.click(screen.getByRole('button', { name: 'Programar publicación' }));
        await waitFor(() => expect(screen.queryByText('Elige el contenido que publicar.')).not.toBeNull());

        view.rerender(await inLocale(english, form));

        expect(screen.queryByText('Choose the content to publish.')).not.toBeNull();
        expect(screen.queryByText('Elige el contenido que publicar.')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Schedule release' })).not.toBeNull();
    });
});
