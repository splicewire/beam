// @vitest-environment jsdom
/**
 * The "Page properties" window's body (owner report 2026-09-24: "the 'window' when you edit a page
 * should be the form for the page/entry, right?"). It was a stub — slug + "Edit content" — and is now
 * Frame's form over the page's `beam-ux-entry` row, beside the "Edit content" handoff to the canvas.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./entry-properties-form', () => ({
    default: ({ entryId }: { entryId: string }) => <form data-testid="entry-form" data-entry-id={entryId} />,
}));

import { PageProperties } from './page-properties';

afterEach(cleanup);

const noop = () => {};

describe('PageProperties', () => {
    it('carries the entry FORM for the page under it, addressed by id', async () => {
        render(
            <PageProperties
                slug="about"
                entryId="01a07898-4dd7-7386-8166-e0e4725e83f3"
                editable
                editing={false}
                onEditContent={noop}
                onExitContent={noop}
            />,
        );

        const form = await screen.findByTestId('entry-form');
        expect(form.getAttribute('data-entry-id')).toBe('01a07898-4dd7-7386-8166-e0e4725e83f3');
    });

    it('keeps "Edit content" as the handoff to the in-place editor for the body', () => {
        const onEditContent = vi.fn();
        render(
            <PageProperties
                slug="about"
                entryId="e1"
                editable
                editing={false}
                onEditContent={onEditContent}
                onExitContent={noop}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Edit content/ }));
        expect(onEditContent).toHaveBeenCalledOnce();
    });

    it('says so, rather than guessing a row, when the page beneath is not this slug', () => {
        render(
            <PageProperties slug="about" entryId={null} editable editing={false} onEditContent={noop} onExitContent={noop} />,
        );

        expect(screen.queryByTestId('entry-form')).toBeNull();
        expect(screen.getByRole('note').textContent).toContain('Open the about page');
    });
});
