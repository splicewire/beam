import { useEffect, useRef, useState } from 'react';
import { AgreementMemberWidget } from './agreement-member';
import { fetchAgreement, type AgreementRead, type AgreementReader } from './agreement-read';

export interface AgreementPromptProps {
    agreementKey: string;
    readUrl?: string;
    /** Present when the declared Requirement currently blocks this behavior. */
    required?: boolean;
    version?: number;
    digest?: string;
    kind?: string;
    title?: string;
    label?: string;
    effectiveAt?: string;
    summary?: string | null;
    content?: string;
    legalUrl?: string | null;
    value?: unknown;
    onChange: (value: unknown) => void;
    /**
     * agreements 15: reads `readUrl` through the host's own transport (another API origin, a bearer token). Absent,
     * the prompt reads it with a same-origin `fetch`, as before.
     */
    read?: AgreementReader;
}

/** A sign-up or invitation prompt: notices inform; blocking kinds use the shared member widget. */
export function AgreementPrompt({ agreementKey, readUrl, required = true, version, digest, kind, title: embeddedTitle, label, effectiveAt, summary, content: embeddedContent, legalUrl, value, onChange, read }: AgreementPromptProps) {
    const [agreement, setAgreement] = useState<AgreementRead | null>(null);
    const [unavailable, setUnavailable] = useState(false);
    const valueRef = useRef(value);
    valueRef.current = value;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    // A host may pass a fresh reader each render; the read follows the Agreement, not the function's identity.
    const readRef = useRef(read);
    readRef.current = read;

    useEffect(() => {
        let cancelled = false;
        setAgreement(null);
        setUnavailable(false);

        if (typeof kind === 'string' && typeof embeddedContent === 'string' && typeof digest === 'string' && typeof version === 'number') {
            setAgreement({
                key: agreementKey,
                kind,
                title: embeddedTitle ?? agreementKey,
                version: { digest, content: embeddedContent, label, effectiveAt, summary },
            });
            if (kind === 'notice' && valueRef.current !== undefined) onChangeRef.current(undefined);
            return () => { cancelled = true; };
        }

        if (!readUrl) {
            setUnavailable(true);
            return () => { cancelled = true; };
        }

        void Promise.resolve()
            .then(() => (readRef.current ?? fetchAgreement)(readUrl))
            .then((data) => {
                if (cancelled) return;
                if (data?.key !== agreementKey || typeof data.kind !== 'string' || !data.version || typeof data.version.content !== 'string') {
                    setUnavailable(true);
                    return;
                }
                if (data.kind === 'notice' && valueRef.current !== undefined) onChangeRef.current(undefined);
                if (data.kind !== 'notice' && (!required || typeof version !== 'number' || typeof digest !== 'string' || data.version.digest !== digest)) {
                    if (required) setUnavailable(true);
                    else setAgreement(data);
                    return;
                }
                setAgreement(data);
            })
            .catch(() => {
                if (!cancelled) setUnavailable(true);
            });

        return () => { cancelled = true; };
    }, [agreementKey, digest, effectiveAt, embeddedContent, embeddedTitle, kind, label, readUrl, required, summary, version]);

    if (unavailable) {
        return <p role="alert">This agreement changed or is unavailable. Reload the form before continuing.</p>;
    }

    if (agreement === null) return null;

    const title = typeof agreement.title === 'string' ? agreement.title : agreementKey;
    const content = typeof agreement.version?.content === 'string' ? agreement.version.content : '';

    if (agreement.kind === 'notice') {
        return (
            <section role="status" aria-label={title} data-agreement-notice={agreementKey}>
                <h2>{title}</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                {legalUrl ? <a href={legalUrl}>Read the full agreement</a> : null}
            </section>
        );
    }

    if (!required) return null;

    return (
        <AgreementMemberWidget
            id={`agreement-${agreementKey}`}
            name="agreementMembers"
            value={value}
            options={{ key: agreementKey, version, digest, readUrl, kind, content, legalUrl, title, label: `I agree to ${title}` }}
            schema={{ title }}
            read={read}
            onChange={(member) => onChange(member)}
        />
    );
}
