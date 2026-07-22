import { beforeEach, describe, expect, it } from 'vitest';

import {
    buildNavTree,
    clearNavSources,
    getNavSources,
    registerNavSource,
    resolveNavNodes,
    type NavNode,
} from './nav-registry';

beforeEach(() => {
    clearNavSources();
});

describe('registry — compose-many resolution', () => {
    it('concatenates nodes from every registered source (additive)', async () => {
        registerNavSource({
            id: 'a',
            load: async () => [{ title: 'A1', href: '/a/1' }],
        });
        registerNavSource({
            id: 'b',
            load: async () => [
                { title: 'B1', href: '/b/1' },
                { title: 'B2', href: '/b/2' },
            ],
        });

        const nodes = await resolveNavNodes();

        expect(nodes.map((n) => n.title)).toEqual(['A1', 'B1', 'B2']);
    });

    it('orders sources by `order` (unset last), stable for ties', () => {
        registerNavSource({ id: 'first-seen', load: async () => [] });
        registerNavSource({ id: 'ordered', order: 1, load: async () => [] });

        expect(getNavSources().map((s) => s.id)).toEqual([
            'ordered',
            'first-seen',
        ]);
    });

    it('skips a source that throws rather than blanking the sidebar', async () => {
        registerNavSource({
            id: 'ok',
            load: async () => [{ title: 'Ok', href: '/ok' }],
        });
        registerNavSource({
            id: 'broken',
            load: async () => {
                throw new Error('boom');
            },
        });

        const nodes = await resolveNavNodes();

        expect(nodes.map((n) => n.title)).toEqual(['Ok']);
    });
});

describe('buildNavTree — grouping, nesting, ordering', () => {
    const nodes: NavNode[] = [
        // Building track, two groups; navGroupOrder makes Onboarding lead.
        {
            title: 'Getting started',
            href: '/docs/build/getting-started',
            track: 'build',
            group: 'Guides',
        },
        {
            title: 'Setup',
            href: '/docs/build/setup',
            track: 'build',
            group: 'Onboarding',
            groupOrder: 1,
            order: 1,
        },
        {
            title: 'Config',
            href: '/docs/build/config',
            track: 'build',
            group: 'Onboarding',
            parent: 'setup', // nests under Setup
            order: 2,
        },
        // Using track, one group.
        {
            title: 'API keys',
            href: '/docs/using/api-keys',
            track: 'using',
            group: 'Keys',
        },
    ];

    it('partitions by track and honours the given track order', () => {
        const tree = buildNavTree(nodes, ['using', 'build', 'built']);

        expect(tree.map((t) => t.track)).toEqual(['using', 'build']);
    });

    it('sorts groups by groupOrder (declared leads first-seen)', () => {
        const tree = buildNavTree(nodes, ['using', 'build']);
        const build = tree.find((t) => t.track === 'build')!;

        expect(build.groups.map((g) => g.group)).toEqual([
            'Onboarding',
            'Guides',
        ]);
    });

    it('nests one level via parent leaf slug and sorts children by order', () => {
        const tree = buildNavTree(nodes, ['build']);
        const onboarding = tree[0].groups.find(
            (g) => g.group === 'Onboarding',
        )!;

        expect(onboarding.items).toHaveLength(1);
        expect(onboarding.items[0].title).toBe('Setup');
        expect(onboarding.items[0].children?.map((c) => c.title)).toEqual([
            'Config',
        ]);
    });

    it('omits tracks with no nodes', () => {
        const tree = buildNavTree(nodes, ['using', 'build', 'built']);

        expect(tree.some((t) => t.track === 'built')).toBe(false);
    });

    it('round-trips the typed contract from source to tree', async () => {
        registerNavSource({ id: 'app', load: async () => nodes });

        const composed = await resolveNavNodes();
        const tree = buildNavTree(composed, ['using', 'build']);

        expect(tree).toHaveLength(2);
        const build = tree.find((t) => t.track === 'build')!;
        expect(build.groups[0].group).toBe('Onboarding');
    });
});
