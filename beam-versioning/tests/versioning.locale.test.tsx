import { createMessages, type ClientCatalog } from '@schemastud/messages';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { VersionRestoreDialog, VersionsList, relativeTime } from '../src/index';
import type { VersionData } from '../src/index';

// Vite's import.meta.glob, typed here (vite is not a direct dependency of this package); the call stays the literal
// `import.meta.glob(…)` form Vite transforms.
declare global {
    interface ImportMeta {
        glob<T>(pattern: string, options: { import: string }): Record<string, () => Promise<T>>;
    }
}

// Localization 30 part S1: beam-versioning's list, restore dialog and relative times read the reader's catalog through
// the seam, and are the pre-30 English, byte for byte, without one. The provider module and the package catalog are
// loaded lazily, so at the parent these render English and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-versioning::messages.loading': { text: 'Cargando versiones…', sourceLocale: 'es' },
        'splicewire-beam-versioning::messages.restore_named': { text: 'Restaurar :version', sourceLocale: 'es' },
        'splicewire-beam-versioning::messages.restore_title': { text: '¿Restaurar :version?', sourceLocale: 'es' },
        'splicewire-beam-versioning::messages.time_minutes_ago': { text: 'hace :count min', sourceLocale: 'es' },
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

const v1: VersionData = { id: 'a1', version: 1, readable: 'v1', label: null, createdBy: null, createdAt: null, isHead: false } as VersionData;

afterEach(cleanup);

describe('beam-versioning in the reader\'s locale', () => {
    it('renders the list chrome in Spanish, the version handle passing through', async () => {
        render(await inLocale(spanish, <VersionsList versions={undefined} isLoading onRestore={() => {}} />));
        expect(screen.getByText('Cargando versiones…')).toBeDefined();
        cleanup();
        render(await inLocale(spanish, <VersionsList versions={[v1]} onRestore={() => {}} />));
        expect(screen.getByLabelText('Restaurar v1')).toBeDefined();
    });

    it('titles the restore dialog in Spanish', async () => {
        render(await inLocale(spanish, <VersionRestoreDialog version={v1} pending={false} onConfirm={() => {}} onCancel={() => {}} />));
        expect(screen.getByText('¿Restaurar v1?')).toBeDefined();
    });

    it('formats a relative time with the messages it is given', async () => {
        const load = import.meta.glob<{ messages: Record<string, string> }>('../messages.default.json', { import: 'default' })['../messages.default.json'];
        const defaults = load ? await load() : null;
        const fiveMinutes = new Date(Date.now() - 5 * 60_000).toISOString();
        const localized = defaults
            ? (relativeTime as (iso: string, m: unknown) => string)(fiveMinutes, createMessages(defaults.messages, { catalog: spanish }))
            : relativeTime(fiveMinutes);
        expect(localized).toBe('hace 5 min');
    });

    it('is the pre-30 English without a catalog', () => {
        render(<VersionsList versions={[]} onRestore={() => {}} />);
        expect(screen.getByText('No versions yet — save one to capture this milestone.')).toBeDefined();
        expect(relativeTime(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago');
    });
});
