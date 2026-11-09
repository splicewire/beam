import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhpApiReference } from './PhpApiReference';
import type { DocsTransport } from './publications';
import wire from '../tests/fixtures/php-api-wire.json';

/**
 * Catalog stories for {@link PhpApiReference}, the browsable PHP API reference (php-api-reference slice 3). Its axis is
 * **the audience the artifact was generated for**: `public` (only `@api` symbols, citations stripped, withheld paragraphs
 * absent) and `internal` (every non-private symbol and its whole comment). Every story answers through a stub transport
 * over REAL producer output (laravel-beam-docs 2a1dc5af's generator over its PHP fixtures; `tests/fixtures/php-api-wire.json`),
 * so the catalog makes no request. Open a symbol from the rail; the URL gains `?symbol=`.
 */
const meta = {
    title: 'BeamDocs/PhpApiReference',
    component: PhpApiReference,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof PhpApiReference>;

export default meta;

const serving = (audience: 'public' | 'internal'): DocsTransport => async (url) => {
    const { index, symbols } = (wire as any).audiences[audience];
    if (url.endsWith('/php-api-index')) return { data: index };
    const fqn = new URL(url, 'http://catalog').searchParams.get('fqn');
    if (fqn && symbols[fqn]) return { data: symbols[fqn] };
    throw new Error('404');
};

/** The public reference: what a public docs site shows. */
export const PublicAudience: StoryObj = {
    render: () => <PhpApiReference endpoint="/beam/docs" transport={serving('public')} />,
};

/** The internal reference: a private docs site's, with unmarked symbols and each whole comment. */
export const InternalAudience: StoryObj = {
    render: () => <PhpApiReference endpoint="/beam/docs" transport={serving('internal')} />,
};

/** Off for this reader (the server answers 404): the component renders nothing. */
export const Off: StoryObj = {
    render: () => <PhpApiReference endpoint="/beam/docs" transport={async () => { throw new Error('404'); }} />,
};
