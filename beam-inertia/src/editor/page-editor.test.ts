/**
 * `asDoc` — what counts as a persisted body (G2-BEAM-AUTHOR-EMPTY-ENTRY, 2026-09-11).
 *
 * Untested until this defect. `EntryBodyShowOp` returns `body: []` for a never-authored entry, and the
 * old predicate accepted it (`[].every(…)` is vacuously true), so `VisualEditorMount` skipped its seed
 * and opened the editor on a document with no root: nothing rendered, nothing was selectable, and the
 * entry could not take its first block. Measured on beam.test's `/about`.
 */
import { describe, expect, it } from 'vitest';
import { asDoc } from './page-editor';

describe('asDoc', () => {
    it('accepts a non-empty array of {kind} nodes', () => {
        const body = [{ kind: 'block', name: 'div', isComponent: false, props: [], children: [], dynamic: false }];

        expect(asDoc(body)).toBe(body);
    });

    it('REFUSES an empty array — "never authored" must reach the seed, not pass as a document', () => {
        expect(asDoc([])).toBeNull();
    });

    it('refuses a keyed body (the mdx/tsx-source shape) and anything that is not a node list', () => {
        expect(asDoc({ content: '# Docs', frontmatter: {} })).toBeNull();
        expect(asDoc([{ notANode: true }])).toBeNull();
        expect(asDoc(null)).toBeNull();
        expect(asDoc('')).toBeNull();
    });
});
