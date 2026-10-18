import { describe, expect, it } from 'vitest';
import { parse } from './lens.js';
import { jsonToTsx, toJson } from './json.js';

describe('ADR-0229 binding declarations', () => {
    it('round trips literal bindings as data, including the empty subtree', () => {
        const source = '<p bdRepeat={{collection:"articles",empty:[]}} bdWhen={{all:[{field:"title",operator:"is set"}]}} title={bdField("title")}>{bdText("title", "Untitled")}</p>;';
        const doc = toJson(parse(source));
        expect(doc[0]).toMatchObject({
            repeat: { collection: 'articles', empty: [] },
            when: { all: [{ field: 'title', operator: 'is set' }] },
            props: [{ name: 'title', kind: 'field', value: 'title' }],
            children: [{ kind: 'text', field: 'title', value: 'Untitled' }],
            dynamic: false,
        });
        expect(toJson(parse(jsonToTsx(doc)))).toEqual(doc);
    });

    it.each(['path', '`title`', 'getPath()', '"x" + "y"', '...paths'])('refuses nonliteral helper argument %s', (argument) => {
        expect(() => parse(`<p title={bdField(${argument})} />`)).toThrow(/literal/);
        expect(() => parse(`<p>{bdText(${argument}, "fallback")}</p>`)).toThrow(/literal/);
        expect(() => parse(`<p>{bdText("title", ${argument})}</p>`)).toThrow(/literal/);
    });

    it.each(['x()', '__proto__.x', 'x.constructor', 'x..y'])('refuses invalid field path %s', (path) => {
        expect(() => parse(`<p title={bdField(${JSON.stringify(path)})} />`)).toThrow(/field path/);
    });

    it('does not reclassify ordinary expressions as bindings', () => {
        expect(toJson(parse('<p title={call()}>{other()}</p>'))[0]).toMatchObject({
            props: [{ kind: 'expression' }], children: [{ kind: 'opaque' }], dynamic: true,
        });
    });
});
