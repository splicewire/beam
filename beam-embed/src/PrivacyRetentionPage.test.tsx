// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
    useRetentionPosture: () => ({
        data: { default_days: 90, chats: [{ id: '1', title: 'Support bot', retention_days: 90, corpus_optin: false }] },
        isPending: false,
        isError: false,
    }),
    useEraseSubject: () => ({ mutate: vi.fn(), isPending: false }),
    usePrunePreview: () => ({ data: undefined, isPending: false }),
    usePruneSessions: () => ({ mutate: vi.fn(), isPending: false }),
    apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

import { CorpusConsentCard, EraseCard } from './PrivacyRetentionPage';

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

// Owner review 2026-11-02, 23-d. The card said consent is "Set on the Embed product surface", but nothing
// writes `corpus_optin`: no screen, no API (EmbedPublisher::publish builds embed_policy from four other keys).
it('says training consent cannot be set yet, and points to no surface that does not exist', () => {
    render(<CorpusConsentCard />);

    expect(screen.queryByText(/Embed product surface/i)).toBeNull();
    expect(
        screen.getByText(/There’s no setting for this yet, so new chats are opted out and can’t be opted in\./),
    ).toBeTruthy();
});
