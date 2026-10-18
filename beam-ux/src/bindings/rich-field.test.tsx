import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { RichMarkdown, RichBlockdoc } from './rich-field.js';

it('renders Markdown as elements without HTML, MDX or unsafe links', () => {
    const html = renderToStaticMarkup(createElement(RichMarkdown, { content: '**bold** and *em* [ok](https://example.test)\n\n<script>alert(1)</script>\n\n{steal()}\n\n[bad](javascript:alert)' }));
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>em</em>');
    expect(html).toContain('href="https://example.test"');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('{steal()}');
});

it('renders blockdoc prose through a closed element mapping and discards executable attributes', () => {
    const content = { type: 'doc', content: [{ type: 'paragraph', attrs: { dangerouslySetInnerHTML: { __html: '<script>bad</script>' } }, content: [
        { type: 'text', text: '<safe>', marks: [{ type: 'strong' }, { type: 'link', attrs: { href: 'javascript:bad' } }] },
    ] }, { type: 'script', content: [{ type: 'text', text: 'not executed' }] }] };
    const html = renderToStaticMarkup(createElement(RichBlockdoc, { content }));
    expect(html).toContain('<strong>&lt;safe&gt;</strong>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('href=');
});
