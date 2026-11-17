import type { ClientCatalog } from '@schemastud/messages';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MdxEditor } from '../runtime/mdx-editor';
import { DoctorOutput } from './doctor-output';

// Localization 30 part S1: beam-mdx's chrome (doctor output, the source editor's label, content and reference chrome)
// reads the reader's catalog through the seam, and is the pre-30 English, byte for byte, without one. The provider
// module is loaded lazily, so at the parent these render English and fail on the Spanish ASSERTIONS.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-mdx::messages.doctor_warn': { text: 'Aviso', sourceLocale: 'es' },
        'splicewire-beam-mdx::messages.doctor_summary': { text: ':passed correctos / :warned avisos / :failed fallos', sourceLocale: 'es' },
        'splicewire-beam-mdx::messages.source_aria': { text: 'Fuente MDX', sourceLocale: 'es' },
    },
};

type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<string> {
    let Provider: Provider | null = null;
    try {
        Provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        Provider = null;
    }
    return renderToStaticMarkup(Provider ? createElement(Provider, { value: catalog, children }) : children);
}

const doctor = 'PASS db: ok\nWARN cache: cold\nFAIL queue: down';

describe('beam-mdx in the reader\'s locale', () => {
    it('labels and tallies doctor output in Spanish; the checks render as given', async () => {
        const html = await inLocale(spanish, createElement(DoctorOutput, { raw: doctor }));
        expect(html).toContain('Aviso');
        expect(html).toContain('1 correctos / 1 avisos / 1 fallos');
        expect(html).toContain('cache');
    });

    it('labels the source editor in Spanish, a caller label still winning', async () => {
        expect(await inLocale(spanish, createElement(MdxEditor, { value: '', onChange: () => {}, preview: false }))).toContain('aria-label="Fuente MDX"');
        expect(await inLocale(spanish, createElement(MdxEditor, { value: '', onChange: () => {}, preview: false, 'aria-label': 'Mine' }))).toContain('aria-label="Mine"');
    });

    it('is the pre-30 English without a catalog', () => {
        const html = renderToStaticMarkup(createElement(DoctorOutput, { raw: doctor }));
        expect(html).toContain('1 passed / 1 warn / 1 failed');
        expect(renderToStaticMarkup(createElement(MdxEditor, { value: '', onChange: () => {}, preview: false }))).toContain('aria-label="MDX source"');
    });
});
