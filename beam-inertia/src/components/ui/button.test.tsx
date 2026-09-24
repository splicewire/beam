import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Button } from './button';

// Halving the bright dark-scheme primary and its dark label over a dark canvas was unreadable
// (settings Save while processing, beam VR pass 2); a disabled primary takes the muted pair instead.
it('gives a disabled primary the muted surface and ink instead of half opacity', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'));
    expect(html).toContain('disabled:bg-muted');
    expect(html).toContain('disabled:text-muted-foreground');
    expect(html).toContain('disabled:opacity-100');
});

it('leaves the outline variant on the base dimming', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true, variant: 'outline' }, 'Cancel'));
    expect(html).toContain('disabled:opacity-50');
    expect(html).not.toContain('disabled:bg-muted');
});
