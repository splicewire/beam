import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';

/** One field of a flat intake schema, as the server resolves it (EP-07d). */
export interface IntakeFieldSchema {
    type?: string | string[];
    title?: string;
    description?: string;
    format?: string;
    enum?: Array<string | number>;
}

/** The JSON Schema a public intake capture key validates against, resolved by the server for the page. */
export interface PublicIntakeSchema {
    type?: string;
    properties?: Record<string, IntakeFieldSchema>;
    required?: string[];
}

export type PublicIntakeResult =
    | { ok: true }
    | { ok: false; status: number; message?: string; errors: Record<string, string[]> };

/**
 * What a page gives its forms: the schema each capture key renders (the page's `intakeForms`), how a submission is
 * sent (laravel-beam's public intake door by default), and the honeypot field the door's middleware watches.
 */
export interface PublicIntakeServices {
    schemas: Record<string, PublicIntakeSchema>;
    submit?: (captureKey: string, payload: Record<string, unknown>) => Promise<PublicIntakeResult>;
    honeypotField?: string;
}

const PublicIntakeContext = createContext<PublicIntakeServices>({ schemas: {} });

export function PublicIntakeProvider({ value, children }: { value: PublicIntakeServices; children: ReactNode }) {
    return <PublicIntakeContext.Provider value={value}>{children}</PublicIntakeContext.Provider>;
}

/**
 * POST a submission to laravel-beam's public intake door (`POST /beam/intake/{schema}`). The door answers 422 with
 * errors keyed by JSON pointer (`/field`, or `''` for the document) and 429 past its throttle.
 */
export async function submitToIntakeDoor(
    captureKey: string,
    payload: Record<string, unknown>,
    endpoint = '/beam/intake',
): Promise<PublicIntakeResult> {
    const response = await fetch(`${endpoint}/${encodeURI(captureKey)}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        return { ok: true };
    }
    const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };

    return { ok: false, status: response.status, message: body.message, errors: body.errors ?? {} };
}

export interface IntakeFormProps {
    captureKey: string;
    submitLabel?: string;
    successMessage?: string;
    /** In the editor the form is a sealed preview: it shows its fields and never submits. */
    preview?: boolean;
}

/**
 * EP-07d: the packaged form Code Component. It renders the fields of the intake schema its `captureKey` names and
 * sends the submission to the submissions ledger through the public intake door. The page carries the schema (the
 * server resolves it for a public key only), so a key the page was given no schema for renders a notice, not a form.
 */
export function IntakeForm({ captureKey, submitLabel = 'Send', successMessage = 'Thank you. Your submission was received.', preview = false }: IntakeFormProps) {
    const { schemas, submit = submitToIntakeDoor, honeypotField = 'website' } = useContext(PublicIntakeContext);
    const schema = schemas[captureKey];
    const [values, setValues] = useState<Record<string, string | number | boolean>>({});
    const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent'; message?: string; errors: Record<string, string[]> }>({ status: 'idle', errors: {} });

    if (!schema) {
        return <div role="note" data-beam-intake-form={captureKey}>This form is not available.</div>;
    }
    if (state.status === 'sent') {
        return <div role="status" data-beam-intake-form={captureKey}>{successMessage}</div>;
    }
    const fields = Object.entries(schema.properties ?? {});
    const required = new Set(schema.required ?? []);
    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (preview || state.status === 'sending') return;
        const honeypot = (new FormData(event.currentTarget).get(honeypotField) ?? '') as string;
        setState({ status: 'sending', errors: {} });
        // An empty optional field is left out rather than sent as '', which a typed schema would refuse.
        const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
        const result = await submit(captureKey, { ...payload, [honeypotField]: honeypot });
        setState(result.ok
            ? { status: 'sent', errors: {} }
            : { status: 'idle', errors: result.errors, message: result.status === 429 ? 'Too many submissions. Please wait a minute and try again.' : result.message });
    };

    return <form data-beam-intake-form={captureKey} noValidate onSubmit={event => void onSubmit(event)}>
        {state.message && <p role="alert">{state.message}</p>}
        {state.errors[''] && <p role="alert">{state.errors[''].join(' ')}</p>}
        {fields.map(([name, field]) => {
            const label = field.title ?? name;
            const type = [field.type ?? 'string'].flat().find(candidate => candidate !== 'null') ?? 'string';
            const errors = state.errors[`/${name}`];
            const common = { id: `intake-${captureKey}-${name}`, name, disabled: preview, 'aria-invalid': errors ? true : undefined, required: required.has(name) };
            return <div key={name}>
                <label htmlFor={common.id}>{label}</label>
                {type === 'boolean'
                    ? <input type="checkbox" {...common} checked={values[name] === true} onChange={event => setValues({ ...values, [name]: event.target.checked })} />
                    : field.enum
                        ? <select {...common} value={String(values[name] ?? '')} onChange={event => setValues({ ...values, [name]: event.target.value })}>
                            <option value="" />
                            {field.enum.map(option => <option key={String(option)} value={String(option)}>{String(option)}</option>)}
                        </select>
                        : field.format === 'textarea'
                            ? <textarea {...common} value={String(values[name] ?? '')} onChange={event => setValues({ ...values, [name]: event.target.value })} />
                            : <input type={field.format === 'email' ? 'email' : type === 'number' || type === 'integer' ? 'number' : 'text'} {...common}
                                value={String(values[name] ?? '')} onChange={event => setValues({ ...values,
                                    [name]: (type === 'number' || type === 'integer') && event.target.value !== '' ? Number(event.target.value) : event.target.value })} />}
                {field.description && <small>{field.description}</small>}
                {errors && <span role="alert">{errors.join(' ')}</span>}
            </div>;
        })}
        {/* The honeypot the door's middleware watches: hidden from people, filled only by bots. */}
        <input type="text" name={honeypotField} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }} defaultValue="" />
        <button type="submit" disabled={preview || state.status === 'sending'}>{submitLabel}</button>
    </form>;
}
