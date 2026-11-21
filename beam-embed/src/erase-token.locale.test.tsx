// @vitest-environment jsdom
import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Localization 67: the erase dialog's typed confirm token is ONE key (messages.erase_token). The label shows it, the input's
// placeholder is it, and the destroy button unlocks only when the typed text equals it, upper-cased in the reader's locale.
// So a German reader types the German word (and the English one no longer unlocks), and without a catalog it is ERASE.
vi.mock('./api', () => ({
    useRetentionPosture: () => ({ data: { default_days: 90, chats: [] }, isPending: false, isError: false }),
    useEraseSubject: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
    usePrunePreview: () => ({ data: { would_prune: 0 }, isPending: false, isError: false, isSuccess: true }),
    usePruneSessions: () => ({ mutate: vi.fn(), isPending: false }),
    useRetentionServices: () => ({}),
    apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { EraseCard } from './PrivacyRetentionPage';

const german: ClientCatalog = {
    version: 1,
    locale: 'de',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-embed::messages.erase_token': { text: 'LÖSCHEN', sourceLocale: 'de' },
    },
};

type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    try {
        const Provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
        return <Provider value={catalog}>{children}</Provider>;
    } catch {
        return children;
    }
}

/** Opens the confirm dialog for a visitor and returns its token input and its destroy button. */
function openConfirm(): { input: HTMLInputElement; destroy: HTMLButtonElement } {
    fireEvent.change(screen.getByLabelText('Visitor ID'), { target: { value: 'vis_123' } });
    fireEvent.click(screen.getByRole('button', { name: /erase subject/i }));
    return {
        input: document.getElementById('erase-confirm') as HTMLInputElement,
        destroy: screen.getByRole('button', { name: /erase permanently/i }) as HTMLButtonElement,
    };
}
const type = (input: HTMLInputElement, text: string) => fireEvent.change(input, { target: { value: text } });

afterEach(cleanup);

describe('the typed erase token, in the reader\'s locale', () => {
    it('is ERASE without a catalog: shown, the placeholder, and the only word that unlocks (case-insensitive)', () => {
        render(<EraseCard disabled={false} />);
        const { input, destroy } = openConfirm();
        expect(input.placeholder).toBe('ERASE');
        expect(screen.getByText('ERASE', { selector: 'span' })).toBeDefined();
        expect(destroy.disabled).toBe(true);
        type(input, 'LÖSCHEN');
        expect(destroy.disabled).toBe(true);
        type(input, ' erase ');
        expect(destroy.disabled).toBe(false);
    });

    it('is the German word under a de catalog: the German token unlocks and ERASE does not', async () => {
        render(await inLocale(german, <EraseCard disabled={false} />));
        const { input, destroy } = openConfirm();
        expect(input.placeholder).toBe('LÖSCHEN');
        expect(screen.getByText('LÖSCHEN', { selector: 'span' })).toBeDefined();
        type(input, 'ERASE');
        expect(destroy.disabled).toBe(true);
        type(input, 'löschen'); // upper-cased in de: LÖSCHEN
        expect(destroy.disabled).toBe(false);
    });
});
