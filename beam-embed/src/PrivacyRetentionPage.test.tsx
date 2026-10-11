// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
    useEraseSubject: () => ({ mutate: vi.fn(), isPending: false }),
    usePrunePreview: () => ({ data: undefined, isPending: false }),
    usePruneSessions: () => ({ mutate: vi.fn(), isPending: false }),
    apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

import { EraseCard } from './PrivacyRetentionPage';

afterEach(cleanup);

it('labels the erase selector Visitor ID / Session ID, not the raw DTO keys', () => {
    render(<EraseCard disabled={false} />);

    expect(screen.getByRole('button', { name: /Visitor ID/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Session ID/i })).toBeTruthy();
    // The raw camelCase DTO keys are never the visible selector labels.
    expect(screen.queryByText('visitorId')).toBeNull();
    expect(screen.queryByText('sessionId')).toBeNull();
});

it('selecting the human-labelled Session ID still drives the exact sessionId DTO kind', () => {
    render(<EraseCard disabled={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Session ID/i }));
    // kind === 'sessionId' → the id input's placeholder switches to the session hint, proving the
    // human label still selects the exact DTO key that the request and receipt carry.
    expect(screen.getByPlaceholderText('sess_…')).toBeTruthy();
});
