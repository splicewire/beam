import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { authoredEntry, withAuthoredComponents } from './authored-components.js';
import { renderNode } from './TreeRender.js';
import type { JsonBlock } from '../blockdoc/json.js';
import type { ComponentCanvasData } from '@splicewire/beam-resources/types/beam-ux';

const block = (name: string, children: JsonBlock['children'] = []): JsonBlock => ({kind: 'block', name, isComponent: /^[A-Z]/.test(name), props: [], children, dynamic: false});
const card: ComponentCanvasData = {id: 'card', definition: {name: 'Card', props: [{name: 'title', type: 'text', default: 'Default', required: false, choices: []}]},
    body: [block('section', [{kind: 'text', value: '', prop: 'title'}, block('Slot')])], bindings: {}, headVersion: 'draft', publishedVersion: 'pin'};

describe('authored Working Head canvas rendering', () => {
    it('renders the current component body, defaults and caller-rendered slot without exposing its internals as instance edits', () => {
        const config = withAuthoredComponents({registry: {}, authoredComponents: [card]});
        const node = block('Card', [block('p', [{kind: 'text', value: 'Caller slot'}])]);
        expect(renderToStaticMarkup(createElement('div', {}, renderNode(node, '0', config))))
            .toContain('<section>Default<p>Caller slot</p></section>');
    });
    it('uses explicit props and forwards instance root classes while keeping the component snapshot unchanged', () => {
        const before = JSON.stringify(card);
        const config = withAuthoredComponents({registry: {}, authoredComponents: [card]});
        const node = {...block('Card'), props: [{name: 'title', kind: 'string' as const, value: 'Instance'}, {name: 'className', kind: 'string' as const, value: 'instance-style'}]};
        expect(renderToStaticMarkup(createElement('div', {}, renderNode(node, '0', config))))
            .toContain('<section class="instance-style">Instance</section>');
        expect(JSON.stringify(card)).toBe(before);
    });
    it('lets a registered Code Component shadow an authored name', () => {
        const config = withAuthoredComponents({registry: {Card: () => createElement('strong', {}, 'Code')}, authoredComponents: [card]});
        expect(renderToStaticMarkup(createElement('div', {}, renderNode(block('Card'), '0', config))))
            .toBe('<div><strong>Code</strong></div>');
    });
    it('retires prior authored renderers when the readable catalogue becomes empty, preserving Code components', () => {
        const Code = () => createElement('strong', {}, 'Code');
        const original = withAuthoredComponents({registry: {Code}, authoredComponents: [card]});
        expect(authoredEntry(original, 'Card')?.id).toBe('card');
        const cleared = withAuthoredComponents({...original, authoredComponents: []});
        expect(cleared.registry.Card).toBeUndefined();
        expect(authoredEntry(cleared, 'Card')).toBeUndefined();
        expect(cleared.registry.Code).toBe(Code);
        expect(original.registry.Card).toBeDefined();
    });
});

it('keeps a caller root Record outside an authored component body',()=>{
 const bound={...card,body:[block('p',[{kind:'text',field:'fields.title',value:'Component fallback'}])]};
 const config=withAuthoredComponents({registry:{},authoredComponents:[bound],record:{fields:{title:'Caller Record'}}});
 expect(renderToStaticMarkup(createElement('div',{},renderNode(block('Card'),'0',config))))
  .toBe('<div><p>Component fallback</p></div>');
});
