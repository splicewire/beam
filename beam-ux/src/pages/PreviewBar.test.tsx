import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewBar, PreviewBoundary } from './SiteEntry.js';

describe('PreviewBar', () => {
    it('names the preview and offers exit, with View as me only when the server permits it', () => {
        const { rerender } = render(<PreviewBar preview={{ label: 'Spring release', exitUrl: '/preview/exit' }} />);

        expect(screen.getByRole('complementary', { name: 'Preview mode' }).textContent).toContain('Spring release');
        expect(screen.getByRole('link', { name: 'Exit preview' }).getAttribute('href')).toBe('/preview/exit');
        expect(screen.queryByRole('link', { name: 'View as me' })).toBeNull();

        rerender(<PreviewBar preview={{ label: 'Spring release', exitUrl: '/preview/exit', viewAsMeUrl: '/preview/as-me' }} />);
        expect(screen.getByRole('link', { name: 'View as me' }).getAttribute('href')).toBe('/preview/as-me');
    });

    it('lets forms validate but prevents their submission and explains the limitation', () => {
        const submit = vi.fn();
        render(
            <PreviewBoundary preview={{ label: 'Spring release', exitUrl: '/preview/exit' }}>
                <form onSubmit={submit}>
                    <input required aria-label="Required field" />
                    <button type="submit">Send</button>
                </form>
            </PreviewBoundary>,
        );

        expect(screen.getByText(/forms validate but do not submit/i)).toBeTruthy();
        const form = screen.getByRole('button', { name: 'Send' }).closest('form');
        expect(form).not.toBeNull();
        expect(fireEvent.submit(form!)).toBe(false);
        expect(submit).not.toHaveBeenCalled();
    });
});
