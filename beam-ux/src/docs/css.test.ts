import { describe, expect, it } from 'vitest';
import { DOCS_TEMPLATE_CSS } from './css.js';

// Launch ticket 05 item 6: on an entry page the list markers, the blockquote bar and the code block sat OUTSIDE the text
// column (`inertia-site-entry--about`). The template set its gutter as `padding-inline` on every child, and Prose's own
// block rules (`ul`/`ol` padding-inline-start, `pre` and `blockquote` padding) are more specific, so they REPLACED the
// gutter: list text landed on the column edge with its markers hanging past it, and pre/blockquote boxes ran edge to edge.
// The child box itself is the column now (width and max-width less two gutters), so a block's own padding sits inside it.
const rule = (selector: string): string => {
    const at = DOCS_TEMPLATE_CSS.indexOf(`${selector} {`);
    if (at === -1) throw new Error(`no ${selector} rule`);
    return DOCS_TEMPLATE_CSS.slice(at, DOCS_TEMPLATE_CSS.indexOf('}', at));
};

describe('the prose template column', () => {
    it('sets the gutter on the column box, not as child padding a prose block can override', () => {
        const column = rule('.beam-tpl-prose > *');
        expect(column).not.toMatch(/padding-inline/);
        expect(column).toContain('calc(100% - 2 * var(--beam-gutter, 1.5rem))');
        expect(column).toContain('calc(var(--beam-measure, 48rem) - 2 * var(--beam-gutter, 1.5rem))');
    });

    it('lets a full-bleed child span the template', () => {
        const bleed = rule('.beam-tpl-prose > [data-beam-full-bleed]');
        expect(bleed).toContain('max-width: none');
        expect(bleed).toContain('width: 100%');
    });
});
