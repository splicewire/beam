import { describe, expect, it } from 'vitest';
import type { BlockdocManifest } from '@schemastud/blockdoc';
import { profileTemplates, profileAttrs, assertProfileRegistry, setProfileAttrs } from './profile';
import type { JsonBlock } from '../blockdoc/json';

const block = (name: string): JsonBlock => ({ kind: 'block', name, isComponent: false, dynamic: false, props: [], children: [] });
const profile = {
    profile: 'host', version: 1, 'x-admits-code': false,
    doc: { admitsChildCategories: ['html'] },
    nodes: [{ name: 'p', category: 'html', admitsChildCategories: [], attrsSchema: {
        type: 'object', properties: { title: { type: 'string' }, click: { type: 'string' } }, additionalProperties: false,
    } }],
} satisfies BlockdocManifest & { 'x-admits-code': boolean };

describe('server Manifest Profile canvas bridge', () => {
    it('refuses a declared component missing from the host JS registry', () => {
        const componentProfile = { ...profile, nodes: [{ ...profile.nodes[0], name: 'Card' }] };
        expect(() => assertProfileRegistry(componentProfile, {})).toThrow('Card');
        expect(() => assertProfileRegistry(componentProfile, { Card: () => null })).not.toThrow();
    });
    it('requires only components reachable through declared child and slot categories', () => {
        const declared = { ...profile, nodes: [
            { name: 'section', category: 'html', admitsChildCategories: ['nested'], slots: [{ name: 'aside', admitsChildCategories: ['sidebar'] }] },
            { name: 'Card', category: 'nested', admitsChildCategories: [] },
            { name: 'Aside', category: 'sidebar', admitsChildCategories: [] },
            { name: 'ContentOutline', category: 'content_outline', admitsChildCategories: null },
            { name: 'ContentSection', category: 'content_section', admitsChildCategories: null },
        ] };
        expect(() => assertProfileRegistry(declared, { Card: true })).toThrow('Aside');
        expect(() => assertProfileRegistry(declared, { Card: true, Aside: true })).not.toThrow();
        expect(() => assertProfileRegistry({ ...declared, nodes: [...declared.nodes,
            { name: 'Unknown', category: 'html', admitsChildCategories: [] }] }, { Card: true, Aside: true })).toThrow('Unknown');
    });
    it('retains conservative registry checks for wildcard and explicit expression admission', () => {
        const nodes = [
            { name: 'section', category: 'html', admitsChildCategories: null },
            { name: 'Unknown', category: 'other', admitsChildCategories: [] },
        ];
        expect(() => assertProfileRegistry({ ...profile, nodes }, {})).toThrow('Unknown');
        expect(() => assertProfileRegistry({ ...profile, doc: null, nodes }, {})).toThrow('Unknown');
        expect(() => assertProfileRegistry({ ...profile, doc: { admitsChildCategories: null }, nodes }, {})).toThrow('Unknown');
        expect(() => assertProfileRegistry({ ...profile, nodes: [{ ...nodes[0], admitsChildCategories: [], contentExpression: 'Unknown*' }, nodes[1]] }, {})).toThrow('Unknown');
        expect(() => assertProfileRegistry({ ...profile, nodes: [{ ...nodes[0], admitsChildCategories: [], slots: [{ name: 'aside', admitsChildCategories: null }] }, nodes[1]] }, {})).toThrow('Unknown');
    });
    it('offers only declared nodes at a legal insertion position', () => {
        const templates = ['p', 'Unknown'].map(name => ({ label: name, make: () => block(name) }));
        expect(profileTemplates(templates, profile, [], null).map(t => t.label)).toEqual(['p']);
        expect(profileTemplates(templates, profile, [block('p')], '0').map(t => t.label)).toEqual([]);
    });
    it("offers the profile's placeable components too, not only the presentation templates", () => {
        // EP-07: a host's placeable components are its profile's NodeTypes. A component without a presentation template
        // (the packaged IntakeForm) was never offered, so an author could not place it (starter receipt 2026-10-25).
        const withComponents = { ...profile, nodes: [...profile.nodes,
            { name: 'IntakeForm', category: 'html', admitsChildCategories: [] },
            { name: 'Card', category: 'html', admitsChildCategories: [] },
            { name: 'Panel', category: 'layout', admitsChildCategories: [] }] };
        const templates = ['p', 'Card'].map(name => ({ label: name, make: () => block(name) }));
        const offered = profileTemplates(templates, withComponents, [], null);

        expect(offered.map(t => t.label)).toEqual(['p', 'Card', 'Intake Form']);
        expect(offered[2].make()).toEqual({ kind: 'block', name: 'IntakeForm', isComponent: true, dynamic: false, props: [], children: [] });
    });
    it('uses declared attrs and hides expression props without deleting their stored value', () => {
        const node = block('p');
        node.props = [{ name: 'title', kind: 'string', value: 'Hello' }, { name: 'click', kind: 'expression', value: 'run()' }];
        const result = profileAttrs(node, profile);
        expect(result.schema.properties).toEqual({ title: { type: 'string' } });
        expect(result.schema.additionalProperties).toBe(false);
        expect(result.attrs).toEqual({ title: 'Hello' });
        expect(node.props[1].value).toBe('run()');
        expect(setProfileAttrs(node, { title: 'Changed', click: 'evil' }, profile).props).toEqual([
            { name: 'title', kind: 'string', value: 'Changed' },
            { name: 'click', kind: 'expression', value: 'run()' },
        ]);
    });
    it('offers no invented inspector attrs for an undeclared legacy node', () => {
        expect(profileAttrs(block('Unknown'), profile).schema).toEqual({ type: 'object', properties: {}, additionalProperties: false });
    });
});
