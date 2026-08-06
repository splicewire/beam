import { describe, expect, it } from 'vitest';
import { metaAreaCrumbs, metaAreaForPath, navGroupForPath, sectionMetaForPath } from './sectionMeta.js';
import type { MetaArea, SectionMeta } from './types.js';

const SECTIONS: SectionMeta[] = [
    { key: 'studio', label: 'Studio', defaultPath: '/studio', match: '/studio' },
    {
        key: 'knowledge',
        label: 'Knowledge',
        defaultPath: '/knowledge',
        match: '/knowledge',
        groups: [
            {
                match: '/knowledge/graph',
                tabs: [
                    { path: '/knowledge/graph', label: 'Overview', end: true },
                    { path: '/knowledge/graph/concepts', label: 'Concepts' },
                ],
            },
        ],
    },
];

const AREAS: MetaArea[] = [
    {
        root: { label: 'Settings', path: '/settings' },
        match: '/settings',
        tabs: [
            { path: '/settings/account', label: 'Account' },
            { path: '/settings/billing', label: 'Billing' },
        ],
    },
];

describe('sectionMetaForPath', () => {
    it('resolves the section by prefix (longest match wins)', () => {
        expect(sectionMetaForPath(SECTIONS, '/knowledge/graph/concepts')?.key).toBe('knowledge');
        expect(sectionMetaForPath(SECTIONS, '/studio/abc')?.key).toBe('studio');
        expect(sectionMetaForPath(SECTIONS, '/nope')).toBeUndefined();
    });
});

describe('navGroupForPath', () => {
    it('activates the group whose match prefixes the path', () => {
        const section = sectionMetaForPath(SECTIONS, '/knowledge/graph/concepts');
        expect(navGroupForPath(section, '/knowledge/graph/concepts')?.match).toBe('/knowledge/graph');
        expect(navGroupForPath(section, '/knowledge')).toBeUndefined();
    });
});

describe('metaAreaForPath + metaAreaCrumbs', () => {
    it('folds a meta-area path into its root + current-tab crumbs', () => {
        expect(metaAreaForPath(AREAS, '/settings/billing')?.root.label).toBe('Settings');
        expect(metaAreaCrumbs(AREAS, '/settings/billing')).toEqual([
            { label: 'Settings', path: '/settings' },
            { label: 'Billing' },
        ]);
        expect(metaAreaCrumbs(AREAS, '/studio')).toBeUndefined();
    });
});
