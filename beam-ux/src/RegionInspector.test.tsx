import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RegionInspector } from './RegionInspector';

const props = {
    region: {
        id: 'body',
        label: 'About',
        kind: 'richtext' as const,
        recordId: 'entry-a',
        note: '',
        url: '/company/about',
    },
    schema: null,
    body: { content: '' },
    onChange: vi.fn(),
    onSave: vi.fn(),
};
it('uses the served page and release addresses in the inspector header', () => {
    render(
        <RegionInspector
            {...props}
            previews={[
                {
                    id: 'release-a',
                    title: 'Launch',
                    href: '/_beam/preview/open/release-a',
                },
            ]}
            previewState="ready"
        />
    );
    expect(screen.getByRole('link', { name: 'View' }).getAttribute('href')).toBe('/company/about');
    expect(screen.getByRole('link', { name: 'Preview Launch' }).getAttribute('href')).toBe(
        '/_beam/preview/open/release-a'
    );
});
it('distinguishes a successful empty release list from an unavailable preview capability', () => {
    const { rerender } = render(<RegionInspector {...props} previews={[]} previewState="ready" />);
    expect(screen.getByText('No open Release')).toBeTruthy();
    rerender(<RegionInspector {...props} previews={[]} previewState="unavailable" />);
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
    expect(screen.queryByText('No open Release')).toBeNull();
});
