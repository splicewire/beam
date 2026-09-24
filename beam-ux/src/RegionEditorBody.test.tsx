import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegionEditorBody } from './RegionEditorBody';
import { treeKindPath } from './StructurePanel';
import type { Region, RegionKind, TreeNode } from './types';

/**
 * beam-docs-satellite 64. `RichtextEditor` took ZERO parameters and the Save control lived inside
 * `FormEditor`, so every entry whose body returns `schema: null` — which is every real entry on the
 * wire, and therefore the whole `kind: 'richtext'` population — rendered a placeholder with no way to
 * commit. These cases fail against that code: the first two find no textarea, the third finds no
 * Save button on the richtext branch.
 */

function region(kind: RegionKind): Region {
    return { id: 'body', label: 'Docs', kind, recordId: 'e1', note: 'page · site' };
}

function mount(kind: RegionKind, body: Record<string, unknown>, handlers = {}) {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    render(
        <RegionEditorBody
            region={region(kind)}
            schema={null}
            body={body}
            onChange={onChange}
            onSave={onSave}
            onDiscard={onDiscard}
            {...handlers}
        />,
    );
    return { onChange, onSave, onDiscard };
}

const source = () => screen.getByLabelText('MDX source') as HTMLTextAreaElement;
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

const MDX_BODY = { frontmatter: { title: 'Docs', segment: 'docs' }, content: '# Hello\n' };

describe('the richtext editor is bound to the body', () => {
    it('renders the body content, not placeholder copy', () => {
        mount('richtext', MDX_BODY);
        expect(source().value).toBe('# Hello\n');
        // The literal the mock shipped, hard-coded into a package-tier editor for every host.
        expect(screen.queryByText(/Build things that ship/)).toBeNull();
    });

    it('an empty body shows an empty value with a writing prompt, not a blank box', () => {
        mount('richtext', {});
        expect(source().value).toBe('');
        expect(source().placeholder).toMatch(/no content yet/);
    });

    it('edits `content` and spreads every other key through untouched', async () => {
        const { onChange } = mount('richtext', MDX_BODY);
        await userEvent.type(source(), '!');
        // `MdxBody::decode()` re-emits the `---` block from `frontmatter`; dropping it here would
        // silently rewrite the author's file on the next save.
        expect(onChange).toHaveBeenCalledWith({
            frontmatter: MDX_BODY.frontmatter,
            content: '# Hello\n!',
        });
    });

    it('names the keys it is preserving', () => {
        mount('richtext', MDX_BODY);
        expect(screen.getByText('title')).toBeTruthy();
        expect(screen.getByText('segment')).toBeTruthy();
    });

    it('reads a flattened body — `enrich-page-schemas` emits frontmatter beside `content`', () => {
        mount('richtext', { heading: 'Docs', content: 'prose' });
        expect(source().value).toBe('prose');
        expect(screen.getByText('heading')).toBeTruthy();
    });
});

describe('the commit row wraps every body-bound editor', () => {
    it.each(['form', 'richtext'] as const)('%s can save and discard', async (kind) => {
        const { onSave, onDiscard } = mount(kind, MDX_BODY);
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
        expect(onSave).toHaveBeenCalledOnce();
        expect(onDiscard).toHaveBeenCalledOnce();
    });

    it('renders Discard disabled rather than inert when no host supplies one', () => {
        render(
            <RegionEditorBody
                region={region('richtext')}
                schema={null}
                body={MDX_BODY}
                onChange={vi.fn()}
                onSave={vi.fn()}
            />,
        );
        expect(button('Discard').disabled).toBe(true);
    });

    it.each(['frame', 'list'] as const)('%s gets no commit row — it is not bound to body', (kind) => {
        mount(kind, MDX_BODY);
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });
});

describe('the composition-tree header states the rungs the tree carries', () => {
    const page: TreeNode = {
        id: 'p',
        label: 'Docs',
        kind: 'page',
        children: [{ id: 'r', label: 'Body', kind: 'region', regionId: 'body' }],
    };

    it('reads page › region over the page-rooted tree every host produces today', () => {
        expect(treeKindPath(page)).toBe('page › region');
    });

    it('grows the upper rungs the day something resolves them', () => {
        const composed: TreeNode = {
            id: 'l',
            label: 'Site',
            kind: 'layout',
            children: [{ id: 't', label: 'Doc', kind: 'template', children: [page] }],
        };
        expect(treeKindPath(composed)).toBe('layout › template › page › region');
    });
});
