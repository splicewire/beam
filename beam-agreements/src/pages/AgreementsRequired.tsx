import { createSessionRequest } from '@schemastud/frame/session';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgreementStepUp, PRIMARY, SECONDARY } from '../interlock/AgreementStepUp';
import type { OutstandingRequirement, PresentedAgreement } from '../interlock/refusal';
import { createStepUp } from '../interlock/stepUp';

/**
 * agreements 07: the agreement prompt a refused PAGE visit lands on (the seam's `beam.agreements.required`, Inertia page
 * `agreements/required`). It is 06's step-up, not a second one: the same `createStepUp` controller and the same
 * `<AgreementStepUp>` dialog.
 *
 * The server already read each Agreement's text and kept it only where the version in force has the refusal's digest
 * (06's rule); a `moved` one has no text, and this page offers to try again, which re-asks the route for a fresh refusal.
 * Accepting records each through the accept operation and then goes where the person was going (the route's gate
 * re-asks). Declining stays here with a way back. Styling is inline only: a host's Tailwind doesn't scan node_modules.
 */
export interface AgreementsRequiredProps {
    requirements: Array<OutstandingRequirement & { label: string | null; content: string | null; summary?: string | null; moved: boolean }>;
    intended: string;
    back: string;
    acceptUrl: string | null;
    /** How to go to `intended` after accepting. Default: a full navigation. */
    visit?: (url: string) => void;
}

type State = 'asking' | 'declined' | 'moved' | 'saving' | { error: string };

/**
 * review P2 1 (defence in depth; the server already keeps only same-origin destinations): a same-origin path for `url`,
 * or `fallback`. Same-origin is a relative path or an http(s) URL with this page's scheme, host and port; anything else
 * (another host, `//evil.example`, `javascript:`) is replaced, so neither "Go back" nor accepting sends anyone off-site.
 */
export function sameOrigin(url: string, fallback: string, origin: string = window.location.origin): string {
    if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) return url;
    try {
        const parsed = new URL(url, origin);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.origin === origin) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
    } catch {
        // not a URL at all
    }
    return fallback;
}

export default function AgreementsRequired({ requirements, intended: rawIntended, back: rawBack, acceptUrl, visit }: AgreementsRequiredProps) {
    const back = sameOrigin(rawBack, '/');
    const intended = sameOrigin(rawIntended, back);
    const stepUp = useMemo(() => createStepUp(), []);
    const request = useMemo(() => createSessionRequest(), []);
    const moved = requirements.some((r) => r.moved || r.content === null || r.label === null);
    const [state, setState] = useState<State>(moved ? 'moved' : 'asking');
    const go = visit ?? ((url: string) => window.location.assign(url));

    const presented: PresentedAgreement[] = useMemo(
        () =>
            requirements.map((r) => ({
                key: r.key,
                title: r.title,
                label: r.label ?? '',
                digest: r.digest,
                content: r.content ?? '',
                summary: r.summary ?? null,
                remedy: { accept: r.acceptOperation ?? 'agreements.accept' },
            })),
        [requirements],
    );

    const ask = useCallback(async () => {
        setState('asking');
        if (!(await stepUp.ask(presented))) {
            setState('declined');
            return;
        }
        if (acceptUrl === null) {
            setState({ error: "This app can't record acceptance right now. Nothing was done." });
            return;
        }
        setState('saving');
        try {
            for (const agreement of presented) {
                await request('POST', acceptUrl, undefined, { agreement: agreement.key, version: agreement.label, digest: agreement.digest });
            }
        } catch (error) {
            setState({ error: error instanceof Error && error.message ? error.message : 'Accepting failed. Nothing was done.' });
            return;
        }
        go(intended);
    }, [stepUp, presented, acceptUrl, request, intended, go]);

    useEffect(() => {
        if (!moved) void ask();
        // Asked once on arrival; "Review again" asks again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const titles = requirements.map((r) => r.title).join(', ');

    return (
        <main data-beam-agreements="required" style={{ maxWidth: '40rem', margin: '3rem auto', padding: '0 1rem', display: 'grid', gap: 12 }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Before you continue</h1>
            {state === 'moved' ? (
                <>
                    <p style={{ margin: 0 }}>{titles} changed while you were on your way. Nothing was done.</p>
                    <p style={{ margin: 0 }}>
                        <a href={intended}>Try again</a> · <a href={back}>Go back</a>
                    </p>
                </>
            ) : state === 'declined' ? (
                <>
                    <p role="status" style={{ margin: 0 }}>
                        You didn't accept {titles}, so nothing was done.
                    </p>
                    <p style={{ margin: 0, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button type="button" style={PRIMARY} onClick={() => void ask()}>
                            Review again
                        </button>
                        <a href={back}>Go back</a>
                    </p>
                </>
            ) : typeof state === 'object' ? (
                <>
                    <p role="alert" style={{ margin: 0 }}>
                        {state.error}
                    </p>
                    <p style={{ margin: 0, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button type="button" style={SECONDARY} onClick={() => void ask()}>
                            Try again
                        </button>
                        <a href={back}>Go back</a>
                    </p>
                </>
            ) : (
                <p role="status" style={{ margin: 0 }}>
                    {state === 'saving' ? 'Recording your agreement…' : `To continue, please read and accept ${titles}.`}
                </p>
            )}
            <AgreementStepUp controller={stepUp} />
        </main>
    );
}
