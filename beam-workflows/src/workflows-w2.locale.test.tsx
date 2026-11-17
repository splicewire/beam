import type { ClientCatalog } from '@schemastud/messages';
import type { CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkflowActionDetail } from './WorkflowActionDetail';
import { WorkflowActionForm } from './WorkflowActionForm';

// Localization 30 part W2: beam-workflows' action and reaction surfaces read the reader's catalog through the seam, and
// are the pre-30 English, byte for byte, without one. The provider module is loaded lazily, so at the parent these
// render English and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-workflows::messages.action_transition': { text: 'Transición', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.action_submit': { text: 'Programar transición', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.detail_cancel_schedule': { text: 'Cancelar programación', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.detail_update_failed': { text: 'No se pudo actualizar esta acción.', sourceLocale: 'es' },
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
async function inLocale(value: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={value}>{children}</Provider> : children;
}

const projection: WorkflowProjectionData = {
    type: 'article', current: 'draft', places: ['draft', 'published'], available: ['publish'],
    transitions: [{ name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null, reason: null }],
};

function pendingAction(): CalendarActionRecordData {
    return {
        id: 'action-1', revision: 2, status: 'pending', current_attempt_id: null, attempt_number: 0,
        due_at: '2026-09-15T13:30:00+00:00', timezone: 'America/New_York', kind: 'kind.workflow-transition',
        payload: { subject_kind: 'article', subject_id: 'article-1', transition: 'publish' },
        principal: 'user:1', creator: 'user:1', origin: null, correlation_id: null,
        calendar_id: null, series_id: null, recurrence_id: null, attempts: [],
    } as unknown as CalendarActionRecordData;
}

afterEach(cleanup);

describe('beam-workflows W2 copy reads the seam', () => {
    it("labels the action form in the reader's locale; a host's submitLabel still wins over the catalog default", async () => {
        const form = (label?: string) => <WorkflowActionForm projection={projection} onSchedule={async () => {}} submitLabel={label} />;
        const view = render(await inLocale(spanish, form()));

        expect(screen.queryByText('Transición')).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Programar transición' })).not.toBeNull();

        view.rerender(await inLocale(spanish, form('Plan it')));
        expect(screen.queryByRole('button', { name: 'Plan it' })).not.toBeNull();

        view.rerender(await inLocale(english, form()));
        expect(screen.queryByRole('button', { name: 'Schedule transition' })).not.toBeNull();
    });

    it('keeps a failed update as a key, so a live locale switch re-renders it', async () => {
        // A rejection that is not an Error carries no message of its own, so the package's line renders.
        const detail = <WorkflowActionDetail action={pendingAction()} onCancel={() => Promise.reject('nope')} />;
        const view = render(await inLocale(spanish, detail));

        // Assert the localized control first, so the parent fails on this ASSERTION, not on a lookup error.
        const cancel = screen.queryByRole('button', { name: 'Cancelar programación' });
        expect(cancel).not.toBeNull();
        fireEvent.click(cancel!);
        await waitFor(() => expect(screen.queryByText('No se pudo actualizar esta acción.')).not.toBeNull());

        view.rerender(await inLocale(english, detail));
        expect(screen.queryByText('This action could not be updated. Refresh its details and try again.')).not.toBeNull();
        expect(screen.queryByText('No se pudo actualizar esta acción.')).toBeNull();
    });
});
