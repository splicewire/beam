import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Button } from './button';

// Halving the bright dark-scheme primary and its dark label over a dark canvas was unreadable
// (settings Save while processing, beam VR pass 2); a disabled primary takes a foreground tint instead.
it('gives a disabled primary a foreground tint and dimmed label instead of half opacity', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'));
    expect(html).toContain('disabled:bg-foreground/10');
    expect(html).toContain('disabled:text-foreground/55');
    expect(html).toContain('disabled:opacity-100');
});

it('keeps a disabled outline framed by a foreground hairline with a dimmed label', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true, variant: 'outline' }, 'Cancel'));
    expect(html).toContain('disabled:border-foreground/15');
    expect(html).toContain('disabled:text-foreground/55');
    expect(html).toContain('disabled:opacity-100');
    expect(html).not.toContain('disabled:opacity-50');
});

it('gives a disabled secondary the tint instead of half opacity', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true, variant: 'secondary' }, 'Later'));
    expect(html).toContain('disabled:bg-foreground/10');
    expect(html).toContain('disabled:text-foreground/55');
    expect(html).not.toContain('disabled:opacity-50');
});

it('leaves the ghost variant on the base dimming', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true, variant: 'ghost' }, 'Skip'));
    expect(html).toContain('disabled:opacity-50');
    expect(html).not.toContain('disabled:bg-foreground/10');
});
