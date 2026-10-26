import { describe, expect, it } from 'vitest';

import { createContent } from './content';
import { contentNavNodes } from './nav';

// ux-0233 d9: a converted file's frontmatter can carry snake_case keys (laravel-beam-ux prints a page's
// unclaimed keys as the PHP reader folds them), an unconverted one camelCase. Both must read the same.
const Page = () => null;

describe('frontmatter keys in either spelling', () => {
    it('reads the nav keys in snake case as in camel case', () => {
        const nodes = contentNavNodes(
            {
                'docs/converted': {
                    default: Page,
                    frontmatter: {
                        title: 'Converted',
                        nav_group: 'Guides',
                        nav_order: 2,
                        nav_group_order: 1,
                        nav_parent: 'docs/intro',
                    },
                },
                'docs/unconverted': {
                    default: Page,
                    frontmatter: {
                        title: 'Unconverted',
                        navGroup: 'Guides',
                        navOrder: 3,
                        navGroupOrder: 1,
                        navParent: 'docs/intro',
                    },
                },
            },
            { trackOf: () => 'docs' },
        );

        const nav = nodes.map(({ group, order, groupOrder, parent }) => ({ group, order, groupOrder, parent }));

        expect(nav).toEqual([
            { group: 'Guides', order: 2, groupOrder: 1, parent: 'docs/intro' },
            { group: 'Guides', order: 3, groupOrder: 1, parent: 'docs/intro' },
        ]);
    });

    it('reads the content keys in snake case, the camel spelling winning when a file has both', () => {
        const content = createContent({
            'essays/converted': {
                default: Page,
                frontmatter: {
                    title: 'Converted',
                    date_published: '2026-10-01',
                    nav_group: 'Writing',
                    schema_type: 'Article',
                    reading_time: '4 min',
                    target_query: 'beam mdx',
                },
            },
            'essays/both': {
                default: Page,
                frontmatter: { title: 'Both', datePublished: '2026-10-02', date_published: '2020-01-01' },
            },
        });

        expect(content.resolveContent('essays/converted')?.frontmatter).toMatchObject({
            datePublished: '2026-10-01',
            navGroup: 'Writing',
            schemaType: 'Article',
            readingTime: '4 min',
            targetQuery: 'beam mdx',
        });
        expect(content.resolveContent('essays/both')?.frontmatter.datePublished).toBe('2026-10-02');
    });
});
