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
        const column = rule('.beam-tpl-prose[data-beam-prose] > *');
        expect(column).not.toMatch(/padding-inline/);
        expect(column).toContain('calc(100% - 2 * var(--beam-gutter, 1.5rem))');
        expect(column).toContain('calc(var(--beam-measure, 48rem) - 2 * var(--beam-gutter, 1.5rem))');
    });

    it('outranks a prose element rule that sets its own width, so a table stays in the column', () => {
        // Prose's `[data-beam-prose] table { width: 100% }` is (0,1,1); a bare `.beam-tpl-prose > *` (0,1,0) lost to it
        // and the table filled the whole template once the gutter stopped being padding. The column rule is (0,2,0).
        expect(DOCS_TEMPLATE_CSS).not.toMatch(/^\.beam-tpl-prose > \* \{/m);
        expect(DOCS_TEMPLATE_CSS).toMatch(/^\.beam-tpl-prose\[data-beam-prose\] > \* \{/m);
    });

    it('lets a full-bleed child span the template', () => {
        const bleed = rule('.beam-tpl-prose > [data-beam-full-bleed]');
        expect(bleed).toContain('max-width: none');
        expect(bleed).toContain('width: 100%');
    });
});
