import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

type AgreementMember = { key: string; version: number; digest: string };

type AgreementMemberOptions = {
    key?: string;
    version?: number;
    digest?: string;
    readUrl?: string;
    title?: string;
    label?: string;
};

type AgreementContent = { title: string; content: string; digest: string };
type AgreementReadResponse = {
    data?: {
        key?: unknown;
        title?: unknown;
        version?: { digest?: unknown; content?: unknown } | null;
    };
};

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
    const complete = key !== '' && version !== undefined && typeof expectedDigest === 'string' && expectedDigest !== '' && readUrl !== '';
    const member = value && typeof value === 'object' ? (value as Partial<AgreementMember>) : undefined;
    const onChangeRef = useRef(emitChange);
    onChangeRef.current = emitChange;
    const valueRef = useRef(value);
    valueRef.current = value;
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
            emitChange(undefined, 'The current agreement could not be verified.');
            return () => { cancelled = true; };
        }

        void fetch(readUrl, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                // In particular, never turn an authorization or missing-row response into usable form state.
                if (response.status === 401 || response.status === 403 || response.status === 404 || !response.ok) {
                    throw new Error('Agreement read failed.');
                }
                return response.json() as Promise<AgreementReadResponse>;
            })
            .then(({ data }) => {
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
                    onChangeRef.current(undefined, 'The current agreement could not be verified.');
                    return;
                }
                setAgreement({
                    title: typeof data.title === 'string' ? data.title : options.title ?? key,
                    content: current.content,
                    digest: current.digest,
                });
                const existing = valueRef.current && typeof valueRef.current === 'object'
                    ? (valueRef.current as Partial<AgreementMember>)
                    : undefined;
                if (
                    valueRef.current !== undefined &&
                    (existing?.key !== key || existing.version !== version || existing.digest !== current.digest)
                ) onChangeRef.current(undefined);
            })
            .catch(() => {
                if (!cancelled) {
                    setUnavailable(true);
                    onChangeRef.current(undefined, 'The current agreement could not be verified.');
                }
            });

        return () => { cancelled = true; };
    }, [complete, expectedDigest, key, options.title, readUrl]);

    const locked = Boolean(disabled || readonly || !complete || !digestMatches);

    const change = (event: ChangeEvent<HTMLInputElement>) => {
        emitChange(
            event.currentTarget.checked && version !== undefined && digestMatches
                ? { key, version, digest: agreement.digest } satisfies AgreementMember
                : undefined,
        );
    };

    return (
        <fieldset data-agreement-member={key || undefined} disabled={locked} style={{ border: 0, margin: 0, padding: 0 }}>
            {agreement ? <legend style={{ fontWeight: 600, marginBottom: 8 }}>{agreement.title}</legend> : null}
            {agreement ? <div data-agreement-text="" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{agreement.content}</div> : null}
            {unavailable ? <p role="alert">This agreement changed or is unavailable. Reload the form before accepting.</p> : null}
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
        </fieldset>
    );
}
