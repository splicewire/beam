import { Clapperboard } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Gallery } from '../src/Gallery';
import { PrototypeDesk } from '../src/PrototypeDesk';

const NAV = [{ items: [{ key: 'studio', label: 'Studio', icon: Clapperboard }] }];

/** The opening tag of the element carrying `data-testid="<id>"`. */
function tagOf(html: string, id: string): string {
    const at = html.indexOf(`data-testid="${id}"`);
    expect(at).toBeGreaterThan(-1);
    return html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1);
}

describe('PrototypeDesk (beam VR pass 2)', () => {
    it('paints the dotted canvas through the data-canvas cascade, not only the host utility', () => {
        const html = renderToStaticMarkup(
            <PrototypeDesk nav={NAV} canvas="dotted">
                <p>body</p>
            </PrototypeDesk>,
        );
        const main = html.slice(html.indexOf('<main'), html.indexOf('>', html.indexOf('<main')) + 1);
        expect(main).toContain('data-canvas="dotted"');
        expect(main).toContain('canvas-surface');
    });

    it('marks the flat canvas as flat', () => {
        const html = renderToStaticMarkup(
            <PrototypeDesk nav={NAV} canvas="flat">
                <p>body</p>
            </PrototypeDesk>,
        );
        expect(html).toContain('data-canvas="flat"');
    });

    it('keeps a full-height top bar when there is no brand, breadcrumb or action', () => {
        const html = renderToStaticMarkup(
            <PrototypeDesk nav={NAV}>
                <p>body</p>
            </PrototypeDesk>,
        );
        expect(tagOf(html, 'desk-topbar')).toContain('min-h-12');
    });
});

describe('Gallery (beam VR pass 2)', () => {
    it('insets the header inside the same max-width box as the group sections', () => {
        const html = renderToStaticMarkup(
            <MemoryRouter>
                <Gallery glob={{ './admin/01-settings.tsx': () => Promise.resolve({ default: () => null }) }} />
            </MemoryRouter>,
        );
        const header = tagOf(html, 'gallery-header');
        const main = tagOf(html, 'gallery-main');
        for (const cls of ['mx-auto', 'max-w-5xl', 'px-8']) {
            expect(header).toContain(cls);
            expect(main).toContain(cls);
        }
        // The full-width <header> itself carries no horizontal inset of its own.
        const outer = html.slice(html.indexOf('<header'), html.indexOf('>', html.indexOf('<header')) + 1);
        expect(outer).not.toMatch(/\bpx-/);
    });
});
