import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { fetchAgreement, type AgreementReader } from './agreement-read';

type AgreementMember = { key: string; version: number; digest: string };

type AgreementMemberOptions = {
    key?: string;
    version?: number;
    digest?: string;
    readUrl?: string;
    title?: string;
    label?: string;
    kind?: string;
    content?: string;
    legalUrl?: string | null;
    /** agreements 16: false hides the Agreement's title (a host whose checkbox label already says it); default true. */
    showTitle?: boolean;
};

type AgreementContent = { title: string; content: string; digest: string; kind?: string; legalUrl?: string | null };

interface AgreementMemberWidgetProps {
    id?: string;
    idSchema?: { $id?: string };
    fieldPathId?: { path?: unknown[] };
    name?: string;
    label?: string;
    value?: unknown;
    formData?: unknown;
    disabled?: boolean;
    readonly?: boolean;
    readOnly?: boolean;
    options?: unknown;
    uiSchema?: { 'ui:options'?: unknown };
    schema?: { title?: string };
    // RJSF's custom widget and composite-field callbacks differ after the first value argument.
    onChange: (value: any, pathOrError?: any, errorSchema?: any) => void;
    /**
     * agreements 15: the host's reader of `readUrl`, given by {@link AgreementPrompt} or by registerAgreementWidgets'
     * options. Absent, the widget reads it with a same-origin `fetch`, as before.
     */
    read?: AgreementReader;
}

function optionsOf(options: unknown): AgreementMemberOptions {
    return options && typeof options === 'object' ? (options as AgreementMemberOptions) : {};
}

/** A named schema widget for a member of one frozen Agreement version. */
export function AgreementMemberWidget(props: AgreementMemberWidgetProps) {
    const id = props.id ?? props.idSchema?.$id;
    const label = props.label ?? props.schema?.title;
    const value = props.value ?? props.formData;
    const disabled = props.disabled;
    const readonly = props.readonly ?? props.readOnly;
    const onChange = props.onChange;
    const emitChange = (next: unknown, error?: string) => {
        const errorSchema = error ? { __errors: [error] } : undefined;
        // RJSF composite fields receive an explicit path. Omitting it applies the new value at the form root.
        if (props.fieldPathId !== undefined) {
            const changeField = onChange as unknown as (value: unknown, path?: unknown[], errorSchema?: unknown) => void;
            if (errorSchema) changeField(next, props.fieldPathId.path ?? [], errorSchema);
            else changeField(next, props.fieldPathId.path ?? []);
        }
        else if (errorSchema) onChange(next, errorSchema);
        else onChange(next);
    };
    const options = optionsOf(props.options ?? props.uiSchema?.['ui:options']);
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const key = options.key ?? '';
    const version = typeof options.version === 'number' && Number.isInteger(options.version) ? options.version : undefined;
    const expectedDigest = options.digest;
    const readUrl = options.readUrl ?? (key === '' ? '' : `/beam/agreements/agreements/${encodeURIComponent(key)}`);
    // The show resource does not expose the requirements plane's ordinal. Requiring the schema digest lets this
    // widget prove that the text it displays is exactly the version the form will submit alongside that ordinal.
    const embedded = typeof options.kind === 'string' && typeof options.content === 'string';
    const complete = key !== '' && version !== undefined && typeof expectedDigest === 'string' && expectedDigest !== '' && (embedded || readUrl !== '');
    const member = value && typeof value === 'object' ? (value as Partial<AgreementMember>) : undefined;
    const onChangeRef = useRef(emitChange);
    onChangeRef.current = emitChange;
    const valueRef = useRef(value);
    valueRef.current = value;
    const readRef = useRef(props.read);
    readRef.current = props.read;
    const [agreement, setAgreement] = useState<AgreementContent | null>(null);
    const [unavailable, setUnavailable] = useState(false);

    const digestMatches = agreement !== null && agreement.digest === expectedDigest;
    const checked = digestMatches && member?.key === key && member.version === version && member.digest === agreement.digest;

    useEffect(() => {
        let cancelled = false;
        setAgreement(null);
        setUnavailable(false);

        if (!complete) {
            setUnavailable(true);
            // `undefined` is defaulted to `{}` for object fields by some RJSF versions. A null
            // keeps this object-typed field invalid, so an unverified assent cannot pass submit.
            emitChange(null, 'The current agreement could not be verified.');
            return () => { cancelled = true; };
        }

        if (embedded) {
            setAgreement({
                title: options.title ?? key,
                content: options.content as string,
                digest: expectedDigest as string,
                kind: options.kind,
                legalUrl: options.legalUrl,
            });
            const existing = valueRef.current && typeof valueRef.current === 'object'
                ? (valueRef.current as Partial<AgreementMember>)
                : undefined;
            if (options.kind === 'notice') {
                if (valueRef.current !== undefined) onChangeRef.current(undefined);
            } else if (
                existing?.key !== key || existing.version !== version || existing.digest !== expectedDigest
            ) onChangeRef.current(null);
            return () => { cancelled = true; };
        }

        void Promise.resolve()
            .then(() => (readRef.current ?? fetchAgreement)(readUrl))
            .then((data) => {
                const current = data?.version;
                if (cancelled) return;
                if (
                    !current ||
                    data?.key !== key ||
                    typeof current.digest !== 'string' ||
                    current.digest === '' ||
                    current.digest !== expectedDigest ||
                    typeof current.content !== 'string'
                ) {
                    setUnavailable(true);
                    onChangeRef.current(null, 'The current agreement could not be verified.');
                    return;
                }
                setAgreement({
                    title: typeof data.title === 'string' ? data.title : options.title ?? key,
                    content: current.content,
                    digest: current.digest,
                    kind: typeof data.kind === 'string' ? data.kind : undefined,
                    legalUrl: options.legalUrl,
                });
                const existing = valueRef.current && typeof valueRef.current === 'object'
                    ? (valueRef.current as Partial<AgreementMember>)
                    : undefined;
                if (data.kind === 'notice') {
                    if (valueRef.current !== undefined) onChangeRef.current(undefined);
                } else if (
                    existing?.key !== key || existing.version !== version || existing.digest !== current.digest
                ) onChangeRef.current(null);
            })
            .catch(() => {
                if (!cancelled) {
                    setUnavailable(true);
                    onChangeRef.current(null, 'The current agreement could not be verified.');
                }
            });

        return () => { cancelled = true; };
    }, [complete, embedded, expectedDigest, key, options.content, options.kind, options.legalUrl, options.title, readUrl]);

    const locked = Boolean(disabled || readonly || !complete || !digestMatches);

    const change = (event: ChangeEvent<HTMLInputElement>) => {
        emitChange(
            event.currentTarget.checked && version !== undefined && digestMatches
                ? { key, version, digest: agreement.digest } satisfies AgreementMember
                : null,
        );
    };

    return (
        <fieldset data-agreement-member={key || undefined} disabled={locked} style={{ border: 0, margin: 0, padding: 0 }}>
            {agreement && options.showTitle !== false ? <legend style={{ fontWeight: 600, marginBottom: 8 }}>{agreement.title}</legend> : null}
            {agreement ? <div data-agreement-text="" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{agreement.content}</div> : null}
            {agreement?.legalUrl ? <a href={agreement.legalUrl}>Read the full agreement</a> : null}
            {unavailable ? <p role="alert">This agreement changed or is unavailable. Reload the form before accepting.</p> : null}
            {agreement?.kind === 'notice' ? null : (
                <label htmlFor={checkboxId} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input
                        id={checkboxId}
                        type="checkbox"
                        name={props.name}
                        aria-label={options.label ?? label}
                        checked={checked}
                        disabled={locked}
                        onChange={change}
                    />
                    <span>{options.label ?? label}</span>
                </label>
            )}
        </fieldset>
    );
}
