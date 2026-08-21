import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PROSE_CSS, Prose } from './Prose.js';

describe('Prose', () => {
    it('wraps a body and injects the scale', () => {
        const { container } = render(
            <Prose>
                <h1>Documentation</h1>
                <p>Body text.</p>
            </Prose>,
        );

        const root = container.querySelector('[data-beam-prose]');
        expect(root?.tagName).toBe('ARTICLE');
        expect(root?.querySelector('style')?.textContent).toBe(PROSE_CSS);
        expect(screen.getByRole('heading', { name: 'Documentation' })).toBeTruthy();
    });

    /**
     * The contract that keeps this usable by a beam site that is not Splicewire (ADR-0210 §5): the
     * package picks the SCALE, the host picks the palette and the fonts. A literal colour or font
     * family here would be inherited by every host that renders an entry body.
     */
    it('names no colour or font outside a --beam-* token', () => {
        // Strip every `var(--beam-*, …)` wrapper, leaving only what a host could NOT override. Anything
        // colour- or font-shaped that survives is a value the package chose on the host's behalf.
        const outsideTokens = PROSE_CSS.replace(/var\(--beam-[a-z-]+/g, 'var(');

        expect(outsideTokens, 'hex colours are never overridable').not.toMatch(/#[0-9a-f]{3,8}\b/i);

        // The only colour values a theme-neutral stylesheet may use resolve against what the host has
        // ALREADY set, rather than asserting a palette of their own. Note there is no allowance for a
        // "neutral" grey: the code-block fallback derives from `currentColor` via color-mix precisely so
        // that even the un-themed case is the host's colour, not a grey this package picked.
        const colourValues = [...outsideTokens.matchAll(/(?:^|[\s;{])(?:color|background):\s*([^;]+);/g)].map((m) =>
            m[1].trim(),
        );

        for (const value of colourValues) {
            expect(value, `"${value}" is a palette choice, not a token`).toMatch(
                /^(inherit|currentColor|transparent|none|var\()/,
            );
        }

        for (const family of [...outsideTokens.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1].trim())) {
            expect(family, `"${family}" is a font choice, not a token`).toMatch(/^(inherit|var\()/);
        }
    });

    it('lets a host replace the stylesheet, and opt out of it entirely', () => {
        const { container: replaced } = render(<Prose css=".x{}">body</Prose>);
        expect(replaced.querySelector('style')?.textContent).toBe('.x{}');

        const { container: none } = render(<Prose css="">body</Prose>);
        expect(none.querySelector('style')).toBeNull();
    });

    it('applies host classes and renders the element the host asks for', () => {
        const { container } = render(
            <Prose as="div" className="host-layer">
                body
            </Prose>,
        );

        const root = container.querySelector('[data-beam-prose]');
        expect(root?.tagName).toBe('DIV');
        expect(root?.className).toBe('host-layer');
    });

    /**
     * A reference surface embedded in a body is a whole application, not an article — it must escape the
     * measure rather than be boxed inside it. Ticket 07 hit this the other way round on `splicewire/www`.
     */
    it('lets a full-bleed child escape the measure', () => {
        expect(PROSE_CSS).toContain('[data-beam-prose] > [data-beam-full-bleed]');
        expect(PROSE_CSS).toContain('max-width: none');
    });
});
