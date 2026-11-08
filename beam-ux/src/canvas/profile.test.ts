import { describe, expect, it } from 'vitest';
import type { BlockdocManifest } from '@schemastud/blockdoc';
import { profileTemplates, profileAttrs, assertDocRegistry, setProfileAttrs } from './profile';
import type { JsonBlock } from '../blockdoc/json';

const block = (name: string): JsonBlock => ({ kind: 'block', name, isComponent: false, dynamic: false, props: [], children: [] });
const profile = {
    profile: 'host', version: 1, 'x-admits-code': false,
    doc: { admitsChildCategories: ['html'] },
    nodes: [{ name: 'p', category: 'html', admitsChildCategories: [], attrsSchema: {
        type: 'object', properties: { title: { type: 'string' }, click: { type: 'string' } }, additionalProperties: false,
    } }],
} satisfies BlockdocManifest & { 'x-admits-code': boolean };

const component = (name: string, children: JsonBlock['children'] = [], slots?: JsonBlock['slots']): JsonBlock =>
    ({ kind: 'block', name, isComponent: true, dynamic: false, props: [], children, ...(slots ? { slots } : {}) });

describe('server Manifest Profile canvas bridge', () => {
    // Ticket 15 shape C (the root's three conditions, 2026-11-08): the registry is checked against the components a
    // document USES, not against every component its profile declares. A host profile may declare components a client
    // cannot render (the six host Auth* nodes, which only beam-inertia registers); declared and unused, they are no error.
    it('refuses a component the document USES that the JS registry lacks, naming it (condition 1)', () => {
        expect(() => assertDocRegistry([component('Card')], {})).toThrow('Card');
        expect(() => assertDocRegistry([component('Card')], { Card: () => null })).not.toThrow();
        // Found wherever it sits: a child, a named slot.
        expect(() => assertDocRegistry([block('section'), { ...block('div'), children: [component('Aside')] }], {})).toThrow('Aside');
        expect(() => assertDocRegistry([component('Card', [], { aside: [component('Panel')] })], { Card: true })).toThrow('Panel');
        expect(() => assertDocRegistry([component('Card'), component('Panel'), component('Card')], {}))
            .toThrow('Components used in this document are missing from the JS registry: Card, Panel');
    });
    it('does not refuse a declared component the document does not use (condition 2)', () => {
        expect(() => assertDocRegistry([block('p'), component('DemoHero')], { DemoHero: true })).not.toThrow();
        expect(() => assertDocRegistry([], {})).not.toThrow();
        // Lower-case HTML is never a registry entry.
        expect(() => assertDocRegistry([block('p'), block('div')], {})).not.toThrow();
    });
    it('omits a declared component the JS registry lacks from the insert palette (condition 2)', () => {
        const declared = { ...profile, nodes: [...profile.nodes,
            { name: 'DemoHero', category: 'html', admitsChildCategories: [] },
            { name: 'AuthLogin', category: 'html', admitsChildCategories: [] }] };
        const templates = [{ label: 'p', make: () => block('p') }];
        expect(profileTemplates(templates, declared, [], null, { DemoHero: true }).map(t => t.label)).toEqual(['p', 'Demo Hero']);
    });
    it('offers the same palette as before when the registry holds every component (condition 3)', () => {
        const declared = { ...profile, nodes: [...profile.nodes,
            { name: 'DemoHero', category: 'html', admitsChildCategories: [] },
            { name: 'AuthLogin', category: 'html', admitsChildCategories: [] }] };
        const templates = [{ label: 'p', make: () => block('p') }];
        const full = { DemoHero: true, AuthLogin: true };
        expect(profileTemplates(templates, declared, [], null, full).map(t => t.label))
            .toEqual(profileTemplates(templates, declared, [], null).map(t => t.label));
        expect(profileTemplates(templates, declared, [], null, full).map(t => t.label)).toEqual(['p', 'Demo Hero', 'Auth Login']);
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
