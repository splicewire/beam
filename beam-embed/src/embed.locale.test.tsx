// @vitest-environment jsdom
import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Localization 30 part S4: beam-embed's privacy console reads the reader's catalog through the seam, its hand-rolled
// plurals on m.choice and its bold/code sentences one line each, and is the pre-30 English, byte for byte, without
// one. The provider module is loaded lazily, so at the parent these render English and fail on the ASSERTIONS.
const state = vi.hoisted(() => ({ wouldPrune: 1, chats: [] as { id: string; title: string; retention_days: number; corpus_optin: boolean }[] }));
vi.mock('./api', () => ({
    useRetentionPosture: () => ({ data: { default_days: 90, chats: state.chats }, isPending: false, isError: false }),
    useEraseSubject: () => ({ mutate: vi.fn(), isPending: false }),
    usePrunePreview: () => ({ data: { would_prune: state.wouldPrune }, isPending: false, isError: false, isSuccess: true }),
    usePruneSessions: () => ({ mutate: vi.fn(), isPending: false }),
    useRetentionServices: () => ({}),
    apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { CorpusConsentCard, PrivacyRetentionPage } from './PrivacyRetentionPage';

const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-embed::messages.page_title': { text: 'Privacidad y retención', sourceLocale: 'es' },
        'splicewire-beam-embed::messages.prune_preview': {
            text: ':n sesión caducada se eliminaría ahora.|:n sesiones caducadas se eliminarían ahora.',
            sourceLocale: 'es',
        },
        'splicewire-beam-embed::messages.consent_summary': {
            text: ':opted de :total chat publicado acepta el corpus.|:opted de :total chats publicados aceptan el corpus.',
            sourceLocale: 'es',
        },
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
const sentence = (start: string) =>
    screen.getByText((_, node) => node?.tagName === 'SPAN' && (node.textContent ?? '').startsWith(start)).textContent;

afterEach(cleanup);

describe('beam-embed in the reader\'s locale', () => {
    it('titles the console in Spanish and chooses the prune preview\'s plural form', async () => {
        state.wouldPrune = 1;
        render(await inLocale(spanish, <PrivacyRetentionPage canManage />));
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacidad y retención');
        expect(sentence('1 ')).toBe('1 sesión caducada se eliminaría ahora.');
        cleanup();
        state.wouldPrune = 3;
        render(await inLocale(spanish, <PrivacyRetentionPage canManage />));
        expect(sentence('3 ')).toBe('3 sesiones caducadas se eliminarían ahora.');
    });

    it('chooses the consent summary\'s plural form by the published chat count', async () => {
        state.chats = [
            { id: '1', title: 'A', retention_days: 30, corpus_optin: true },
            { id: '2', title: 'B', retention_days: 30, corpus_optin: false },
        ];
        render(await inLocale(spanish, <CorpusConsentCard />));
        expect(screen.getByText('1 de 2 chats publicados aceptan el corpus.')).toBeDefined();
        state.chats = [];
    });

    it('is the pre-30 English without a catalog, singular and plural', () => {
        state.wouldPrune = 1;
        render(<PrivacyRetentionPage canManage />);
        expect(sentence('1 ')).toBe('1 session past their window would be removed by a prune right now.');
        expect(screen.getByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').startsWith('Retention is')).textContent).toBe(
            'Retention is not auto-enforced — nothing sweeps on a schedule. Sessions past their window persist until you prune below. Default window is 90 days.',
        );
        cleanup();
        state.wouldPrune = 2;
        render(<PrivacyRetentionPage canManage />);
        expect(sentence('2 ')).toBe('2 sessions past their window would be removed by a prune right now.');
    });
});
