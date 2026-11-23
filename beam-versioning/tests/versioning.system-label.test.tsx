import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { VersionsList } from '../src/index';
import type { VersionData } from '../src/index';

// 69: the two known SYSTEM labels ("published" from laravel-beam-embed's EmbedPublisher, "restore of v{n}" from
// laravel-beam-versioning's VersionsController) render through beam-versioning's catalog at read time. The stored label,
// the slug and the ref are untouched. English is byte-identical, and a near-miss of either pattern is the user's own
// text, rendered verbatim in every locale.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-versioning::messages.label_published': { text: 'publicada', sourceLocale: 'es' },
        'splicewire-beam-versioning::messages.label_restore_of': { text: 'restauración de :version', sourceLocale: 'es' },
    },
};

const row = (id: string, label: string): VersionData =>
    ({ id, version: Number(id), readable: `v${id}`, label, createdBy: null, createdAt: null, isHead: false }) as VersionData;

// "restore of v1-published" is the restored published embed: the source version's handle is slugged (Str::slug).
const SYSTEM = [row('1', 'published'), row('2', 'restore of v1'), row('3', 'restore of v1-published')];
// One near-miss per pattern at least: casing / trailing text for "published"; casing outside Str::slug's output and
// trailing text for "restore of {handle}" (the /^restore of (v\d+(?:-[a-z0-9]+)*)$/ match).
const NEAR_MISSES = ['Published', 'published v2', 'restore of v1-Published', 'restore of v3 draft'];
const nearMissRows = NEAR_MISSES.map((label, i) => row(String(10 + i), label));

function list(versions: VersionData[], catalog?: ClientCatalog): ReactNode {
    const tree = <VersionsList versions={versions} onRestore={() => {}} />;
    return catalog ? <MessageProvider value={catalog}>{tree}</MessageProvider> : tree;
}

const labelTexts = () => Array.from(document.body.querySelectorAll('span.truncate'), (el) => el.textContent);

afterEach(cleanup);

describe('known system version labels', () => {
    it('renders both system labels in Spanish', () => {
        render(list(SYSTEM, spanish));
        expect(labelTexts()).toEqual(['publicada', 'restauración de v1', 'restauración de v1-published']);
    });

    it('is byte-identical English without a catalog', () => {
        render(list(SYSTEM));
        expect(labelTexts()).toEqual(['published', 'restore of v1', 'restore of v1-published']);
        expect(screen.getByText('published')).toBeDefined();
        expect(screen.getByText('restore of v1')).toBeDefined();
        expect(screen.getByText('restore of v1-published')).toBeDefined();
    });

    it('renders every near-miss verbatim, in Spanish and in English', () => {
        render(list(nearMissRows, spanish));
        expect(labelTexts()).toEqual(NEAR_MISSES);
        cleanup();
        render(list(nearMissRows));
        expect(labelTexts()).toEqual(NEAR_MISSES);
    });
});
