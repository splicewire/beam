import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RegionBlock } from './RegionCanvas';
import type { Region } from './types';
const region: Region = {
    id: 'body',
    label: 'Privacy',
    kind: 'richtext',
    recordId: 'entry-a',
    note: 'page · site',
};

it('shows the engaged entry body instead of the canvas fixture copy', () => {
    render(
        <RegionBlock
            region={region}
            engaged
            onEngage={vi.fn()}
            body={{ content: '# Our actual privacy terms\nWe retain audit records.' }}
        />
    );
    expect(screen.getByText(/Our actual privacy terms/)).toBeTruthy();
    expect(screen.getByText(/We retain audit records/)).toBeTruthy();
    expect(screen.queryByText('Build things that ship.')).toBeNull();
    expect(screen.queryByText(/Cohort-based programs/)).toBeNull();
});

it('extracts bounded JsonDoc text without executing markup or hydrating components', () => {
    render(
        <RegionBlock
            region={region}
            engaged
            onEngage={vi.fn()}
            body={[{ kind: 'text', value: '<script>literal only</script>' }]}
        />
    );
    expect(screen.getByText('<script>literal only</script>')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
});
it('distinguishes loading, refused and empty saved bodies', () => {
    const { rerender } = render(
        <RegionBlock region={region} engaged onEngage={vi.fn()} bodyLoading />
    );
    expect(screen.getByText('Loading saved body…')).toBeTruthy();
    rerender(<RegionBlock region={region} engaged onEngage={vi.fn()} bodyError />);
    expect(screen.getByText('Body unavailable.')).toBeTruthy();
    rerender(<RegionBlock region={region} engaged onEngage={vi.fn()} body={{ content: '' }} />);
    expect(screen.getByText('No text in this body.')).toBeTruthy();
});
it('caps a long saved excerpt', () => {
    render(
        <RegionBlock
            region={region}
            engaged
            onEngage={vi.fn()}
            body={{ content: 'x'.repeat(2000) }}
        />
    );
    expect(screen.getByText(/^x+$/).textContent?.length).toBe(1200);
});
