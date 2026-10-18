import { describe, expect, it } from 'vitest';
import { parse } from './lens';
import { jsonToTsx, toJson, type JsonBlock } from './json';

const profile = { nodes: [{name: 'Card', category: 'block', admitsChildCategories: ['block'], slots: [{name: 'media', admitsChildCategories: ['image']}], attrsSchema: {type: 'object', properties: {title: {type: 'string'}}}}] };
const context = {profile, component: 'Card'};
describe('declared component props and slots (ux-0231 d8–10)', () => {
    it('recognizes only a declared prop identifier, preserving undeclared code', () => {
        const doc = toJson(parse('<h3 title={title}>{title}{secret}</h3>', context));
        const h3 = doc[0] as JsonBlock;
        expect(h3.props[0]).toMatchObject({kind: 'prop', value: 'title'});
        expect(h3.children[0]).toEqual({kind: 'text', value: '', prop: 'title'});
        expect(h3.children[1].kind).toBe('opaque');
        expect((toJson(parse('<h3>{title}</h3>'))[0] as JsonBlock).children[0].kind).toBe('opaque');
    });
    it('round-trips declared named/default Slot blocks and fallback', () => {
        const doc = toJson(parse('<section>{children}{media ?? <img alt="fallback" />}</section>', context));
        const section = doc[0] as JsonBlock;
        expect(section.children.map(n => n.kind === 'block' && n.name)).toEqual(['Slot', 'Slot']);
        expect(toJson(parse(jsonToTsx(doc), context))).toEqual(doc);
    });
    it('stores JSX-valued attributes as named slot subtrees, never additional roots', () => {
        const doc = toJson(parse('<Card media={<img alt="cover" />}><p>Body</p></Card>', {profile}));
        expect(doc).toHaveLength(1);
        expect((doc[0] as JsonBlock).slots?.media[0]).toMatchObject({kind:'block', name:'img'});
        expect(toJson(parse(jsonToTsx(doc), {profile}))).toEqual(doc);
    });
    it('does not reinterpret an undeclared JSX attribute as a slot', () => {
        const doc = toJson(parse('<Card unknown={<img />} />', {profile}));
        expect(doc).toHaveLength(1);
        expect((doc[0] as JsonBlock).props[0].kind).toBe('expression');
    });
});
