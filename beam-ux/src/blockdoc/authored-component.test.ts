import { describe, expect, it } from 'vitest';
import { parse } from './lens.js';
import { toJson, jsonToTsx } from './json.js';
import { readComponentDefinition } from './component-interface.js';

describe('versioned root component interface', () => {
    it('reads root prop references before or after their interface declaration and retains literal Slots', () => {
        const declaration = JSON.stringify({name: 'Card', props: [{name: 'title', type: 'text', default: 'Untitled'}]});
        for (const attrs of [`title={title} bdComponent={${declaration}}`, `bdComponent={${declaration}} title={title}`]) {
            const doc = toJson(parse(`<section ${attrs}><h2>{title}</h2><Slot><p>Fallback</p></Slot></section>`));
            expect(doc[0]).toMatchObject({component: {name: 'Card'}, props: [{name: 'title', kind: 'prop', value: 'title'}]});
            expect(jsonToTsx(doc)).toContain('<Slot>');
            expect(toJson(parse(jsonToTsx(doc)))).toEqual(doc);
        }
    });
    it('keeps an image prop a typed scalar string rather than guessing from an object or URI schema', () => {
        expect(readComponentDefinition({name: 'Cover', props: [{name: 'photo', type: 'image', default: '/cover.png'}]}).props?.[0])
            .toMatchObject({name: 'photo', type: 'image', default: '/cover.png'});
        expect(() => readComponentDefinition({name: 'Cover', props: [{name: 'photo', type: 'image', default: {url: '/cover.png'}}]})).toThrow();
    });
    it('refuses mismatched defaults and caller declarations of component runtime channels', () => {
        expect(() => readComponentDefinition({name: 'Slot', props: []})).toThrow();
        for (const prop of [{name: 'count', type: 'number', default: '3'}, {name: 'bindings', type: 'text'}]) {
            expect(() => readComponentDefinition({name: 'Card', props: [prop]})).toThrow();
        }
    });
});
