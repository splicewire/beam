import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentOutlineNodeView, ContentSectionNodeView } from '../src/index';
import { makeNodeProps } from '../src/story-harness';

// Localization 30 part S1: beam-content's node-view chrome reads the reader's catalog through the seam, and is the
// pre-30 English, byte for byte, without one. The provider module is loaded lazily, so at the parent (no seam yet)
// these render English and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-content::messages.article_title': { text: 'Título del artículo', sourceLocale: 'es' },
        'splicewire-beam-content::messages.section_heading_numbered': { text: 'Encabezado de sección :number', sourceLocale: 'es' },
        'splicewire-beam-content::messages.add_section': { text: 'Añadir sección', sourceLocale: 'es' },
        'splicewire-beam-content::messages.context': { text: 'Contexto', sourceLocale: 'es' },
        'splicewire-beam-content::messages.strategy': { text: 'Estrategia', sourceLocale: 'es' },
    },
};

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

describe('beam-content in the reader\'s locale', () => {
    it('labels the outline in Spanish, numbering through a parameter', async () => {
        render(await inLocale(spanish, <ContentOutlineNodeView {...makeNodeProps({ title: 'T', excerpt: '', sectionHeadings: ['One'] })} />));
        expect(screen.getByLabelText('Título del artículo')).toBeDefined();
        expect(screen.getByLabelText('Encabezado de sección 1')).toBeDefined();
        expect(screen.getByText('Añadir sección')).toBeDefined();
    });

    it('labels the section chrome in Spanish; the authored strategy renders as given', async () => {
        render(await inLocale(spanish, <ContentSectionNodeView {...makeNodeProps({ heading: 'x', strategy: 'First', groundingTokens: ['fda'] })} />));
        fireEvent.click(screen.getByText('Contexto'));
        expect(screen.getByText('Estrategia')).toBeDefined();
        expect(screen.getByText('First')).toBeDefined();
    });

    it('is the pre-30 English without a catalog', () => {
        render(<ContentOutlineNodeView {...makeNodeProps({ title: '', excerpt: '', sectionHeadings: [] })} />);
        expect(screen.getByPlaceholderText('Article title…')).toBeDefined();
        expect(screen.getByText('No sections planned yet. Add the headings this article will expand into.')).toBeDefined();
    });
});
