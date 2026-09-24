// @vitest-environment jsdom
/**
 * The rendered entry's in-place editor slot (beam.test `/about`, 2026-09-24: "Edit Content doesn't work").
 *
 * `site/entry` had no editor of its own, so the MainframeHost mounted a generic one BESIDE the page: the
 * author saw the unchanged read page with an unframed editor under the footer. The packaged page now
 * hands its body region to `EditableEntryBody`; these are the three answers it may give.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const editMode = vi.hoisted(() => ({ value: false }));
const mounted = vi.hoisted(() => [] as Array<{ slug: string; entryId: string | null }>);

vi.mock('@splicewire/beam-ux/canvas', () => ({
    useEditMode: () => editMode.value,
    canvasAcceptsFormat: (format: string | null) => format === 'tsx',
    canvasRefusalFor: (format: string | null) => `authored as ${format}`,
}));
// The real mainframe host pulls the whole authoring factory; only its format gate is under test here.
vi.mock('@splicewire/beam-mainframe', () => ({
    createMainframeHost: () => () => null,
    useBeamUxEntry: () => null,
}));
vi.mock('./transport', () => ({ bodyClient: {} }));
vi.mock('./page-editor', () => ({
    default: ({ slug, entryId }: { slug: string; entryId: string | null }) => {
        mounted.push({ slug, entryId });

        return <div data-testid="page-editor">{slug}</div>;
    },
}));

import { EditableEntryBody } from './entry-body-editor';

const entry = (format: string) => ({
    id: '01a07898-4dd7-7386-8166-e0e4725e83f3',
    slug: 'about',
    title: 'About',
    type: 'page',
    format,
    url: '/about',
});

const BODY = <p data-testid="read-body">compiled body</p>;

afterEach(() => {
    cleanup();
    editMode.value = false;
    mounted.length = 0;
});

describe('EditableEntryBody', () => {
    it('renders the compiled body for a reader, and loads no editor', () => {
        render(<EditableEntryBody entry={entry('tsx')}>{BODY}</EditableEntryBody>);

        expect(screen.getByTestId('read-body')).toBeTruthy();
        expect(mounted).toEqual([]);
    });

    it('replaces the body with the id-addressed PageEditor while an author edits a tsx entry', async () => {
        editMode.value = true;
        render(<EditableEntryBody entry={entry('tsx')}>{BODY}</EditableEntryBody>);

        expect(await screen.findByTestId('page-editor')).toBeTruthy();
        // In PLACE of the body — the defect was an editor beside an unchanged page.
        expect(screen.queryByTestId('read-body')).toBeNull();
        expect(mounted.at(-1)).toEqual({ slug: 'about', entryId: '01a07898-4dd7-7386-8166-e0e4725e83f3' });
    });

    it('states the refusal in the body region for a format the canvas cannot store', () => {
        editMode.value = true;
        render(<EditableEntryBody entry={entry('mdx')}>{BODY}</EditableEntryBody>);

        expect(screen.getByRole('note').textContent).toContain('mdx');
        expect(screen.queryByTestId('page-editor')).toBeNull();
        expect(mounted).toEqual([]);
    });
});
