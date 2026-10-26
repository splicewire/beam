import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import { parseFrontmatter, serializeFrontmatter, serializeMdx } from './authoring';
import { MdxEditor } from './mdx-editor';

describe('parseFrontmatter / serializeMdx — split and rejoin', () => {
    const doc = ['---', 'title: Sample edited', 'navOrder: 2', '---', '', '# Body', '', 'A paragraph.', ''].join('\n');

    it('splits a leading --- block from the body', () => {
        const parsed = parseFrontmatter(doc);

        expect(parsed.hasFrontmatter).toBe(true);
        expect(parsed.frontmatter).toEqual({ title: 'Sample edited', navOrder: '2' });
        expect(parsed.body).toBe('\n# Body\n\nA paragraph.\n');
    });

    it('losslessly round-trips a --- block + body', () => {
        expect(serializeMdx(parseFrontmatter(doc))).toBe(doc);
    });

    it('mutating a parsed field reserializes predictably', () => {
        const parsed = parseFrontmatter(doc);
        parsed.frontmatter.title = 'A new title';

        expect(serializeMdx(parsed)).toContain('title: A new title');
        expect(serializeMdx(parsed)).toContain('# Body');
    });

    it('treats a document with no --- block as all body (no empty block on reserialize)', () => {
        const bare = '# Just a body\n';
        const parsed = parseFrontmatter(bare);

        expect(parsed.hasFrontmatter).toBe(false);
        expect(parsed.frontmatter).toEqual({});
        expect(serializeMdx(parsed)).toBe(bare);
    });

    it('serializeFrontmatter builds a document from a map + body', () => {
        const raw = serializeFrontmatter({ title: 'X' }, '\n# Hi\n');
        expect(raw).toBe('---\ntitle: X\n---\n\n# Hi\n');
        expect(parseFrontmatter(raw).frontmatter).toEqual({ title: 'X' });
    });
});

describe('MdxEditor', () => {
    it('renders an editable buffer seeded with the value', () => {
        const html = renderToStaticMarkup(
            createElement(MdxEditor, {
                value: '# Hello, editor',
                onChange: () => {},
                preview: false,
            }),
        );

        expect(html).toContain('<textarea');
        expect(html).toContain('# Hello, editor');
    });

    it('mounts a preview pane by default (the live RuntimeMdx target)', () => {
        const html = renderToStaticMarkup(
            createElement(MdxEditor, {
                value: '# Hello',
                onChange: () => {},
                // RuntimeMdx compiles in an effect (not during SSR), so the pane is present but empty
                // here; the buffer→preview recompile is exercised in the app-level ticket 04.
                previewClassName: 'preview-pane',
            }),
        );

        expect(html).toContain('preview-pane');
    });
});
