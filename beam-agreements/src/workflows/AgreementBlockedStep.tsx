import { createSessionRequest, type SessionRequest } from '@schemastud/frame/session';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AgreementStepUp, SECONDARY } from '../interlock/AgreementStepUp';
import type { AgreementRow, PresentedAgreement } from '../interlock/refusal';
import { createStepUp } from '../interlock/stepUp';

/** The workflow guard the seam registers (agreements 11b, lead ruling Q-11b-c). */
export const AGREEMENT_GUARD = 'agreement-is-current';

/** The projected transition fields this reads (beam-workflows' WorkflowTransitionData, structurally; no dependency). */
export interface BlockedTransition {
    name: string;
    guard: string | null;
    metadata: Record<string, unknown> | null;
    reason: string | null;
}

export interface AgreementBlockedStepOptions {
    /** Called after the person accepted: refetch the projection, so the move becomes available. */
    onAccepted: () => void;
    /** The seam's agreements show route, by key. Default `/beam/agreements/agreements/{key}`. */
    readUrl?: (key: string) => string;
    /** The seam's accept operation. Default `/beam/agreements/agreements/accept`. */
    acceptUrl?: string;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
}

/** The Agreement a refused move's guard names, or null when the move isn't held by the agreement guard. */
export function blockedAgreementKey(transition: BlockedTransition): string | null {
    if (transition.guard !== AGREEMENT_GUARD || transition.reason === null) return null;
    const params = (transition.metadata?.guardParams ?? null) as Record<string, unknown> | null;
    return typeof params?.agreement === 'string' && params.agreement !== '' ? params.agreement : null;
}

/**
 * agreements 11b (lead ruling Q-11b-e): a `renderBlocked` for beam-workflows' `<WorkflowActions>`. On a move refused by
 * "Agreement is current" it offers 06's accept step, in place: the step-up dialog on the Agreement's exact text, then
 * the ordinary accept operation, then `onAccepted` so the host refetches the projection. Any other refused move gets
 * nothing extra (its reason still shows).
 *
 *     <WorkflowActions projection={p} … renderBlocked={agreementBlockedStep({ onAccepted: refetch })} />
 */
export function agreementBlockedStep(options: AgreementBlockedStepOptions): (transition: BlockedTransition) => ReactNode {
    return (transition) => {
        const key = blockedAgreementKey(transition);
        return key === null ? null : <AgreementBlockedStep agreementKey={key} {...options} />;
    };
}

export function AgreementBlockedStep({
    agreementKey,
    onAccepted,
    readUrl = (key) => `/beam/agreements/agreements/${encodeURIComponent(key)}`,
    acceptUrl = '/beam/agreements/agreements/accept',
    request: injected,
}: AgreementBlockedStepOptions & { agreementKey: string }) {
    const request = useMemo(() => injected ?? createSessionRequest(), [injected]);
    const stepUp = useMemo(() => createStepUp(), []);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const review = useCallback(async () => {
        setBusy(true);
        setError(null);
        try {
            const { data } = await request<{ data: AgreementRow }>('GET', readUrl(agreementKey));
            const row = data?.data;
            const version = row?.version;
            if (!version || typeof version.content !== 'string') {
                setError("This agreement can't be shown right now. Nothing was done.");
                return;
            }
            const presented: PresentedAgreement = {
                key: agreementKey,
                title: row?.title ?? agreementKey,
                label: version.label,
                digest: version.digest,
                content: version.content,
                summary: version.summary ?? null,
                remedy: { accept: 'agreements.accept' },
            };
            if (!(await stepUp.ask([presented]))) return;
            await request('POST', acceptUrl, undefined, { agreement: agreementKey, version: version.label, digest: version.digest });
            onAccepted();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : 'Accepting failed. Nothing was done.');
        } finally {
            setBusy(false);
        }
    }, [request, readUrl, agreementKey, stepUp, acceptUrl, onAccepted]);

    return (
        <span data-beam-agreements="blocked-step" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <button type="button" style={SECONDARY} disabled={busy} onClick={() => void review()}>
                {busy ? 'Opening…' : 'Review and accept'}
            </button>
            {error !== null ? (
                <span role="alert" style={{ fontSize: '0.8125rem' }}>
                    {error}
                </span>
            ) : null}
            <AgreementStepUp controller={stepUp} />
        </span>
    );
}
