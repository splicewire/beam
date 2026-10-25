// @vitest-environment node
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { bindingRuntime } from './runtime.js';
import { richFieldComponents } from './rich-field.js';

it('executes the PHP-generated module with request-only records, nested repeats and conditions', () => {
    const source = readFileSync(new URL('./binding-module.fixture.txt', import.meta.url), 'utf8');
    // Test-only execution of a committed PHP-generated fixture, through the same classic JSX factory.
    const code = transformSync(source, { loader: 'tsx', format: 'cjs', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' }).code;
    const module = { exports: {} as { default?: React.ComponentType<Record<string, unknown>> } };
    new Function('React', 'module', 'exports', code)(React, module, module.exports);
    const Body = module.exports.default!;
    const props = { bindingRuntime, components: richFieldComponents, record: { fields: { title: "Record <title>" } } };
    const bindings = { outer: { records: [
        { title: '<visitor>', body: '**Rich**', bindings: { inner: { records: [{ title: 'Related' }] } } },
        { title: '', body: 'Hidden by condition' },
    ] } };
    const html = renderToStaticMarkup(React.createElement(Body, { ...props, bindings }));
    expect(html).toContain('<h1>Record &lt;title&gt;</h1>');
    expect(html).toContain('&lt;visitor&gt;');
    expect(html).toContain('<strong>Rich</strong>');
    expect(html).toContain('<p>Related</p>');
    expect(html).not.toContain('Hidden by condition');
    expect(renderToStaticMarkup(React.createElement(Body, props))).toContain('No records');
});
