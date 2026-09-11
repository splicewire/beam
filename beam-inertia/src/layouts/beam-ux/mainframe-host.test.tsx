// @vitest-environment jsdom
/**
 * The FORMAT fork in front of the in-place authoring renderers (G2-BEAM-AUTHOR-ENTRY, 2026-09-11).
 *
 * Measured on beam.test: the operator dock's "Edit content" opened the JsonDoc canvas on the mdx
 * `/docs` entry showing one empty `div.page` node; Save wrote that tree over the `{frontmatter,content}`
 * particle, the disk mirror wrote a 0-byte `docs.mdx`, the compile produced an empty artifact, and the
 * public page went blank for every visitor. `EntryBodySaveOp` refuses the write now; this is the half
 * that keeps an author from being handed an editor whose every Save is refused.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { EntryRef } from '@splicewire/beam-mainframe';

import { CanvasOrRefusal } from './mainframe-host';

const ref = (format: string | null): EntryRef => ({
    id: '01a001bc-0000-7000-8000-0000000000bb',
    slug: 'docs',
    format,
});

const CANVAS = <div data-testid="canvas">the visual editor</div>;

// This package runs vitest WITHOUT `globals`, so testing-library's auto-cleanup never registers and a
// previous render stays in the document — a refusal test would then find the PRIOR case's canvas and
// pass or fail for the wrong reason. Explicit, because the implicit one is not available here.
afterEach(cleanup);

describe('CanvasOrRefusal', () => {
    it('mounts the canvas for a tsx entry — the one format whose codec can store a block document', () => {
        render(<CanvasOrRefusal entry={ref('tsx')}>{CANVAS}</CanvasOrRefusal>);

        expect(screen.getByTestId('canvas')).toBeTruthy();
    });

    it('refuses an mdx entry and NAMES the format instead of rendering the canvas', () => {
        render(<CanvasOrRefusal entry={ref('mdx')}>{CANVAS}</CanvasOrRefusal>);

        expect(screen.queryByTestId('canvas')).toBeNull();
        // The author asked to edit this page, so silence would read as a broken editor. The refusal
        // states the format and what saving one here would have done.
        expect(screen.getByRole('note').textContent).toContain('mdx');
        expect(screen.getByRole('note').textContent).toContain('empty file');
    });

    it('refuses a css theme entry too — the gate is the codec capability, not an mdx special case', () => {
        render(<CanvasOrRefusal entry={ref('css')}>{CANVAS}</CanvasOrRefusal>);

        expect(screen.queryByTestId('canvas')).toBeNull();
        expect(screen.getByRole('note').textContent).toContain('css');
    });

    it('refuses an UNKNOWN format — null is "the page did not say", never "anything goes"', () => {
        // `?beam_entry=<slug>` and the component-name guess carry no format. A permissive default there
        // would re-open the hole for exactly the refs nobody verified.
        render(<CanvasOrRefusal entry={ref(null)}>{CANVAS}</CanvasOrRefusal>);

        expect(screen.queryByTestId('canvas')).toBeNull();
        expect(screen.getByRole('note').textContent).toContain('does not say what it is authored as');
    });
});
