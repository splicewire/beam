// @vitest-environment jsdom
/**
 * Launch ticket 05 slice 4 (owner ruling, option A): the editor bar's mark is a monogram of the app's name in the
 * accent colour, never an empty square, and the chrome spells no brand of its own.
 */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CanvasProvider } from './context';
import { monogram } from './monogram';
import { PageEditor, __resetEditMode } from './PageEditor';
import { VisualEditor } from './VisualEditor';

vi.mock('../editor/local-session', async original => ({
    ...await original<typeof import('../editor/local-session')>(),
    IndexedDbSessions: class { async forEntry() { return []; } async write() {} close() {} },
}));
afterEach(() => { cleanup(); __resetEditMode(); });

it('draws the first letter or digit of a name, upper-cased, and nothing for no name', () => {
    expect(monogram('acme app')).toBe('A');
    expect(monogram('  Splicewire · editor')).toBe('S');
    expect(monogram('· 9lives')).toBe('9');
    expect(monogram('élan')).toBe('É');
    expect(monogram('')).toBe('');
    expect(monogram(' · ')).toBe('');
});

const config = { registry: {}, MdxView: () => null, MdxEdit: () => null };
const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [{ kind: 'text' as const, value: 'Body' }] }];

const state = { id: 'home', headVersion: 'v1', headReadable: 'v1', publishedVersion: 'v1', publishedReadable: 'v1', draftPending: false, versions: [], compileError: null };

async function pageEditor(brand?: string) {
    const view = render(<CanvasProvider config={config}>
        <PageEditor slug="home" entryId="home" userId="author" body={body} brand={brand}
            transport={{ saveBody: vi.fn(), saveDraft: vi.fn(), listVersions: async () => state, publish: vi.fn(),
                restoreVersion: vi.fn(), loadBody: async () => ({ body }) }} />
    </CanvasProvider>);
    await act(async () => { window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } })); });

    return view.container;
}

it('marks the page editor bar with a monogram of its brand', async () => {
    const bar = await pageEditor('Acme · editor');

    expect(bar.querySelector('.pe-mark')?.textContent).toBe('A');
    expect(bar.querySelector('.pe-brand')?.textContent).toBe('AAcme · editor');
});

it('draws no empty mark when the page editor has no brand', async () => {
    const bar = await pageEditor();

    expect(bar.querySelector('.pe-bar')).not.toBeNull();
    expect(bar.querySelector('.pe-mark')).toBeNull();
    expect(bar.querySelector('.pe-brand')?.textContent).toBe('editing · home');
});

it('marks the visual editor bar with a monogram of its brand', () => {
    const { container } = render(<CanvasProvider config={config}>
        <VisualEditor value={body} onChange={() => {}} onSave={async () => {}} brand="Acme · editor" />
    </CanvasProvider>);

    expect(container.querySelector('.ve-mark')?.textContent).toBe('A');
});
