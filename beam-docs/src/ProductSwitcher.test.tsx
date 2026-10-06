import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductSwitcher } from './ProductSwitcher';

/**
 * docs-walkthrough DOC-16 (C-6): the product switcher is data (`DocsChromeData.related`) with one disclosure contract. A
 * click toggles; hover only previews and never flips the state a click will flip; Escape and a pointer outside dismiss.
 * The flagship's hand pill closed on the click that followed a hover (shots 40/41).
 */
const related = [
    { key: 'beam', name: 'Beam', tagline: 'Build your own app on Beam', href: 'https://splicewire.test/beam', docs: 'https://splicewire.test/beam/docs' },
];

const panel = () => screen.queryByRole('dialog');
const trigger = () => screen.getByRole('button', { name: /beam/i });

describe('ProductSwitcher', () => {
    it('renders nothing where there is no other product', () => {
        const { container } = render(<ProductSwitcher related={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('stays open on the click that follows a hover', () => {
        render(<ProductSwitcher related={related} />);
        fireEvent.pointerEnter(trigger().parentElement!);
        expect(panel()).not.toBeNull();

        fireEvent.click(trigger());
        expect(panel()).not.toBeNull();

        fireEvent.pointerLeave(trigger().parentElement!);
        expect(panel(), 'a clicked switcher survives the pointer leaving').not.toBeNull();
    });

    it('a second click closes it, and a hover alone is only a preview', () => {
        render(<ProductSwitcher related={related} />);
        fireEvent.click(trigger());
        fireEvent.click(trigger());
        expect(panel()).toBeNull();

        fireEvent.pointerEnter(trigger().parentElement!);
        fireEvent.pointerLeave(trigger().parentElement!);
        expect(panel()).toBeNull();
    });

    it('closes on Escape and on a pointer outside', () => {
        render(<ProductSwitcher related={related} />);
        fireEvent.click(trigger());
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(panel()).toBeNull();

        fireEvent.click(trigger());
        fireEvent.pointerDown(document.body);
        expect(panel()).toBeNull();
    });

    it('offers each product with its tagline, its site and its docs', () => {
        render(<ProductSwitcher related={related} />);
        fireEvent.click(trigger());

        expect(panel()?.textContent).toContain('Build your own app on Beam');
        const links = [...panel()!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
        expect(links).toEqual(['https://splicewire.test/beam', 'https://splicewire.test/beam/docs']);
    });
});
