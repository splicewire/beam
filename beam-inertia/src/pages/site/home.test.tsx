// @vitest-environment jsdom
/**
 * The read fork on `site/home` (G2-BEAM-AUTHOR-ENTRY, measured on beam.test 2026-09-11).
 *
 * An owner authored `/` and Save reported "Saved" — truthfully: the body reached the particle and the
 * artifact compiled with the new heading in it. No reader ever saw the change, as owner or guest,
 * reload after reload. The cause was this page: `<PageEditor body={null}>` seeds from
 * `fallbackDoc(slug)` and its READ mode is `TreeRender` over that seed, so the surface a reader got was
 * a packaged DEFAULT TREE no save could reach. The body was not lost; it was unreachable.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({ Head: () => null }));
vi.mock('../../layouts/site-layout', () => ({ default: ({ children }: { children: unknown }) => <>{children as never}</> }));
vi.mock('../../editor/page-editor', () => ({
    default: ({ entryId }: { entryId?: string | null }) => <div data-testid="editor">editor:{String(entryId)}</div>,
}));
vi.mock('../../editor/canvas-config', () => ({ canvasConfig: { registry: { DemoHero: () => null } } }));
vi.mock('@splicewire/beam-ux/site', () => ({
    EntryBody: ({ artifact, components }: { artifact: { url: string }; components?: object }) => (
        <div data-testid="artifact" data-components={Object.keys(components ?? {}).join(',')}>
            {artifact.url}
        </div>
    ),
}));

const editMode = vi.hoisted(() => ({ value: false }));
vi.mock('@splicewire/beam-ux/canvas', () => ({ useEditMode: () => editMode.value }));

import SiteHome from './home';

const ENTRY = {
    id: '01a001bc-0000-7000-8000-0000000000aa',
    slug: 'home',
    format: 'tsx',
    artifact: { url: '/beam/ux/artifacts/01a001bc/abc123', version: 'abc123' },
};

afterEach(() => {
    cleanup();
    editMode.value = false;
});

describe('site/home — read fork', () => {
    it('a reader gets the COMPILED ARTIFACT when the entry has one, not the packaged default tree', () => {
        render(<SiteHome entry={ENTRY} />);

        expect(screen.getByTestId('artifact').textContent).toBe(ENTRY.artifact.url);
        expect(screen.queryByTestId('editor')).toBeNull();
    });

    it('hands the artifact the SAME island registry the canvas edits through', () => {
        // The default tree seeds a `<DemoHero>` island. The canvas resolves that name through its
        // CanvasConfig registry; the compiled artifact resolves it through this prop (the compiler runs
        // without `providerImportSource`). Measured on beam.test 2026-09-11: without it the saved page
        // threw `DemoHero is not defined` and took the WHOLE page down, not just the body.
        render(<SiteHome entry={ENTRY} />);

        expect(screen.getByTestId('artifact').getAttribute('data-components')).toContain('DemoHero');
    });

    it('falls back to the packaged default tree when the entry has NO artifact', () => {
        // A database that was never seeded, or a page never authored. The default tree is the honest
        // answer there — and the reason this page is a useful out-of-the-box front door at all.
        render(<SiteHome entry={{ ...ENTRY, artifact: null }} />);

        expect(screen.getByTestId('editor')).toBeTruthy();
        expect(screen.queryByTestId('artifact')).toBeNull();
    });

    it('falls back when the page is bound to no entry at all', () => {
        render(<SiteHome />);

        expect(screen.getByTestId('editor').textContent).toBe('editor:null');
    });

    it('an AUTHOR in window mode always gets the editor, even with an artifact present', () => {
        // The editor edits the SOURCE body; the artifact is a module compiled from it. An author who
        // has just saved must see their own document, not a compilation of it.
        editMode.value = true;
        render(<SiteHome entry={ENTRY} />);

        expect(screen.getByTestId('editor')).toBeTruthy();
        expect(screen.queryByTestId('artifact')).toBeNull();
    });
});
