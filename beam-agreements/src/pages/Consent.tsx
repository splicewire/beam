import { createSessionRequest, type SessionRequest } from '@schemastud/frame/session';
import { useMemo, useState } from 'react';
import { PRIMARY, SECONDARY } from '../interlock/AgreementStepUp';
import { META_STYLE, PAGE_STYLE, TEXT_STYLE } from './legal-shared';

/**
 * agreements 12: the counterparty's page, opened from a SIGNED link by a person with no account (the seam's
 * `consent/{id}`, Inertia page `agreements/consent`). It shows only what is needed to decide: what is asked (the title,
 * what changed, the frozen text), who asks, and what it is about. Its actions are the server's own signed URLs: Grant and
 * Decline while the request is waiting, Withdraw after a grant. Nothing here knows who is signed in.
 */
export interface ConsentProps {
    title: string;
    label: string | null;
    content: string | null;
    summary: string | null;
    askedBy: string;
    about: string;
    status: 'requested' | 'granted' | 'declined' | 'withdrawn';
    actions: Partial<Record<'grant' | 'decline' | 'withdraw', string>>;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
    /** After an action: reload the signed page. Injected for tests. */
    reload?: () => void;
}

const SAID: Record<ConsentProps['status'], string> = {
    requested: 'Waiting for your answer.',
    granted: 'You gave your consent. You can withdraw it at any time.',
    declined: 'You declined. Nothing was given.',
    withdrawn: 'You withdrew your consent.',
};

export default function Consent({ title, label, content, summary, askedBy, about, status, actions, request: injected, reload }: ConsentProps) {
    const request = useMemo(() => injected ?? createSessionRequest(), [injected]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const done = reload ?? (() => window.location.reload());

    const act = async (action: 'grant' | 'decline' | 'withdraw') => {
        const url = actions[action];
        if (!url) return;
        setBusy(action);
        setError(null);
        try {
            await request('POST', url);
            done();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : 'That did not work. Nothing was recorded.');
        } finally {
            setBusy(null);
        }
    };

    return (
        <main data-beam-agreements="consent" style={PAGE_STYLE}>
            <header style={{ display: 'grid', gap: 4 }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h1>
                <p style={META_STYLE}>
                    {askedBy} asks for your consent{about ? <> about {about}</> : null}.{label ? <> Version {label}.</> : null}
                </p>
            </header>
            {summary ? (
                <p data-beam-agreements="summary" style={{ margin: 0 }}>
                    <strong>What changed:</strong> {summary}
                </p>
            ) : null}
            {content ? <article style={TEXT_STYLE}>{content}</article> : null}
            <p role="status" data-beam-agreements="consent-status" style={{ margin: 0 }}>
                {SAID[status]}
            </p>
            {error !== null ? (
                <p role="alert" style={{ margin: 0 }}>
                    {error}
                </p>
            ) : null}
            <p style={{ margin: 0, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {actions.grant ? (
                    <button type="button" style={PRIMARY} disabled={busy !== null} onClick={() => void act('grant')}>
                        {busy === 'grant' ? 'Recording…' : 'I consent'}
                    </button>
                ) : null}
                {actions.decline ? (
                    <button type="button" style={SECONDARY} disabled={busy !== null} onClick={() => void act('decline')}>
                        {busy === 'decline' ? 'Recording…' : 'Decline'}
                    </button>
                ) : null}
                {actions.withdraw ? (
                    <button type="button" style={SECONDARY} disabled={busy !== null} onClick={() => void act('withdraw')}>
                        {busy === 'withdraw' ? 'Recording…' : 'Withdraw my consent'}
                    </button>
                ) : null}
            </p>
        </main>
    );
}
