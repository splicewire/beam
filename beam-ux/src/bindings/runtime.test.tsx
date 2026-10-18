import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { bindingRuntime } from './runtime.js';

it('renders only the supplied records, with text escaping and an empty-state fallback', () => {
    const render = (record: Record<string, unknown>) => createElement('p', null, bindingRuntime.text(record, 'title', 'Empty title'));
    const empty = () => createElement('p', null, 'No records');
    expect(renderToStaticMarkup(bindingRuntime.repeat({ records: [{ title: '<script>alert(1)</script>' }, { title: null }], page: 1, hasMore: false }, render, empty)))
        .toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><p>Empty title</p>');
    expect(renderToStaticMarkup(bindingRuntime.repeat(undefined, render, empty))).toBe('<p>No records</p>');
});

it('treats rich/object fields as unavailable to plain text and never follows prototype properties', () => {
    expect(bindingRuntime.text({ title: { html: '<script>' } }, 'title', 'fallback')).toBe('fallback');
    expect(bindingRuntime.field(Object.create({ title: 'inherited' }), 'title')).toBeUndefined();
    expect(() => bindingRuntime.field({}, '__proto__.secret')).toThrow(/field path/);
    expect(bindingRuntime.text({ title: 0 }, 'title', 'fallback')).toBe('0');
});

it('evaluates the declared operators over the already supplied record', () => {
    const record = { title: 'Hello world', count: 4, list: ['a', 'b'], date: '2026-10-18', empty: '' };
    for (const [field, operator, value] of [
        ['title', 'is set', null], ['empty', 'is empty', null], ['count', 'equals', 4],
        ['count', 'does not equal', 3], ['count', 'greater than', 3], ['count', 'less than', 5],
        ['title', 'contains', 'world'], ['list', 'contains', 'b'], ['date', 'greater than', '2026-10-17'],
    ] as const) {
        expect(bindingRuntime.when({ all: [{ field, operator, value }] }, record)).toBe(true);
    }
    expect(bindingRuntime.when({ any: [{ field: 'count', operator: 'equals', value: 9 }, { field: 'title', operator: 'is empty' }] }, record)).toBe(false);
    expect(bindingRuntime.when({ all: [{ field: 'title', operator: 'greater than', value: 'A' }] }, record)).toBe(false);
});
