import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentOutlineNodeView, ContentSectionNodeView, registerContentNodeViews } from '../src/index';
import { makeNodeProps } from '../src/story-harness';

/**
 * §8a isolation mount (rehome-ui): the NodeViews render off a plain attrs bag — no editor, no
 * Laravel, no `@/` — and patch attrs through the injected `updateAttrs`. If a view had smuggled an
 * app coupling, importing `../src/index` would fail to resolve and this file wouldn't load.
 */

describe('ContentSectionNodeView', () => {
    it('renders the heading and patches it through updateAttrs', () => {
        const updateAttrs = vi.fn();
        render(<ContentSectionNodeView {...makeNodeProps({ heading: 'Why rapid cooling matters' }, { updateAttrs })} />);

        const input = screen.getByLabelText('Section heading') as HTMLInputElement;
        expect(input.value).toBe('Why rapid cooling matters');
        fireEvent.change(input, { target: { value: 'Edited heading' } });
        expect(updateAttrs).toHaveBeenCalledWith({ heading: 'Edited heading' });
    });

    it('surfaces generation context (strategy/grounding) behind the Context toggle', () => {
        render(
            <ContentSectionNodeView
                {...makeNodeProps({ heading: 'x', strategy: 'First', groundingTokens: ['fda'] })}
            />,
        );
        fireEvent.click(screen.getByText('Context'));
        expect(screen.getByText('First')).toBeDefined();
        expect(screen.getByText('fda')).toBeDefined();
    });
});

describe('ContentOutlineNodeView', () => {
    it('renders title, excerpt and ordered section headings', () => {
        render(
            <ContentOutlineNodeView
                {...makeNodeProps({
                    title: 'Cooling Cooked Foods',
                    excerpt: 'A short excerpt.',
                    sectionHeadings: ['One', 'Two'],
                })}
            />,
        );
        expect((screen.getByLabelText('Article title') as HTMLInputElement).value).toBe('Cooling Cooked Foods');
        expect((screen.getByLabelText('Section heading 1') as HTMLInputElement).value).toBe('One');
        expect((screen.getByLabelText('Section heading 2') as HTMLInputElement).value).toBe('Two');
    });

    it('adds and removes section headings through updateAttrs', () => {
        const updateAttrs = vi.fn();
        render(
            <ContentOutlineNodeView
                {...makeNodeProps({ title: 't', excerpt: '', sectionHeadings: ['One'] }, { updateAttrs })} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Add section' }));
        expect(updateAttrs).toHaveBeenCalledWith({ sectionHeadings: ['One', ''] });

        fireEvent.click(screen.getByRole('button', { name: 'Remove section 1' }));
        expect(updateAttrs).toHaveBeenCalledWith({ sectionHeadings: [] });
    });
});

describe('registerContentNodeViews', () => {
    it('registers both content node types on the injected registry', () => {
        const registered: string[] = [];
        registerContentNodeViews({
            registerNodeView: (name) => registered.push(name),
            resolveNodeView: () => undefined,
        });
        expect(registered).toEqual(['content_section', 'content_outline']);
    });
});
