import { createSessionRequest, type SessionRequest } from '@schemastud/frame/session';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PRIMARY, SECONDARY } from '../interlock/AgreementStepUp';

/** agreements 09: one notice as `GET agreements/notices` serves it. */
export interface AgreementNotice {
    key: string;
    /** agreements 10b: the Agreement's kind. A `notice` is acknowledged; anything else is agreed to. */
    kind?: string;
    title: string;
    label: string;
    digest: string;
    effectiveAt: string;
    summary: string | null;
    version: number;
    readUrl: string;
    legalUrl: string | null;
}

export interface AgreementNoticesProps {
    /** The seam's notices route. Default `/agreements/notices`. */
    url?: string;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
}

const DISMISSED = 'beam-agreements:dismissed';

/** Dismissal is per person (this browser) and per VERSION (key and digest): a newer version asks again. */
function dismissedKey(notice: Pick<AgreementNotice, 'key' | 'digest'>): string {
    return `${DISMISSED}:${notice.key}:${notice.digest}`;
}

function isDismissed(notice: AgreementNotice): boolean {
    try {
        return window.localStorage.getItem(dismissedKey(notice)) === '1';
    } catch {
        return false;
    }
}

function rememberDismissed(notice: AgreementNotice): void {
    try {
        window.localStorage.setItem(dismissedKey(notice), '1');
    } catch {
        // Storage blocked: the notice is hidden for this page view only.
    }
}

/**
 * agreements 09 (reach `notice`): the signed-in person's dismissible notices of a new material version, each with what
 * changed and a link to read it. Nothing is blocked. Dismissing records NOTHING on the server (a dismissal is not an
 * Assent); "I agree" runs the ordinary accept operation. Renders nothing when there is nothing to tell. Put it once in
 * the signed-in layout.
 */
export function AgreementNotices({ url = '/agreements/notices', request: injected }: AgreementNoticesProps) {
    const request = useMemo(() => injected ?? createSessionRequest(), [injected]);
    const [notices, setNotices] = useState<AgreementNotice[]>([]);
    const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
    const [acknowledgeUrl, setAcknowledgeUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<{ key: string; message: string } | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        request<{ data: AgreementNotice[]; acceptUrl: string | null; acknowledgeUrl?: string | null }>('GET', url, undefined, undefined, { signal: controller.signal })
            .then(({ data }) => {
                setNotices((data?.data ?? []).filter((notice) => !isDismissed(notice)));
                setAcceptUrl(data?.acceptUrl ?? null);
                setAcknowledgeUrl(data?.acknowledgeUrl ?? null);
            })
            .catch(() => {
                // A notice is never worth an error on every page: show nothing.
            });
        return () => controller.abort();
    }, [request, url]);

    const remove = useCallback((notice: AgreementNotice) => setNotices((current) => current.filter((n) => n !== notice)), []);

    const dismiss = useCallback(
        (notice: AgreementNotice) => {
            rememberDismissed(notice);
            remove(notice);
        },
        [remove],
    );

    /** agreements 10b (Q-10b-e): a notice kind is ACKNOWLEDGED (its own operation); anything else is agreed to. */
    const isNotice = (notice: AgreementNotice) => notice.kind === 'notice';
    const urlFor = useCallback((notice: AgreementNotice) => (isNotice(notice) ? acknowledgeUrl : acceptUrl), [acceptUrl, acknowledgeUrl]);

    const agree = useCallback(
        async (notice: AgreementNotice) => {
            const target = urlFor(notice);
            if (target === null) return;
            setBusy(notice.key);
            setError(null);
            try {
                await request('POST', target, undefined, { agreement: notice.key, version: notice.label, digest: notice.digest });
                remove(notice);
            } catch (e) {
                setError({ key: notice.key, message: e instanceof Error && e.message ? e.message : 'Accepting failed. Nothing was done.' });
            } finally {
                setBusy(null);
            }
        },
        [urlFor, request, remove],
    );

    if (notices.length === 0) return null;

    return (
        <section data-beam-agreements="notices" aria-label="Agreement updates" style={{ display: 'grid', gap: 8 }}>
            {notices.map((notice) => (
                <div
                    key={`${notice.key}:${notice.digest}`}
                    role="status"
                    style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '12px 16px', display: 'grid', gap: 8 }}
                >
                    <p style={{ margin: 0 }}>
                        <strong>{notice.title}</strong> has a new version ({notice.label}).
                    </p>
                    {notice.summary ? (
                        <p data-beam-agreements="summary" style={{ margin: 0 }}>
                            <strong>What changed:</strong> {notice.summary}
                        </p>
                    ) : null}
                    {error?.key === notice.key ? (
                        <p role="alert" style={{ margin: 0 }}>
                            {error.message}
                        </p>
                    ) : null}
                    <p style={{ margin: 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <a href={notice.legalUrl ?? notice.readUrl}>Read it</a>
                        {urlFor(notice) !== null ? (
                            <button type="button" style={PRIMARY} disabled={busy === notice.key} onClick={() => void agree(notice)}>
                                {busy === notice.key ? 'Recording…' : isNotice(notice) ? 'Acknowledge' : 'I agree'}
                            </button>
                        ) : null}
                        <button type="button" style={SECONDARY} onClick={() => dismiss(notice)}>
                            Dismiss
                        </button>
                    </p>
                </div>
            ))}
        </section>
    );
}
