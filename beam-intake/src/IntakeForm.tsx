import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { SchemaForm } from '@schemastud/seam';
import { useOptionalIntakeServices } from './provider';
import type { IntakeFields, IntakeFormRenderProps } from './types';

/** The JSON Schema a public intake capture key validates against, resolved by the server for the page (EP-07d). */
export type PublicIntakeSchema = Record<string, unknown>;

export type PublicIntakeResult =
    | { ok: true }
    | { ok: false; status: number; message?: string; errors: Record<string, string[]> };

/**
 * What a page gives its forms: the schema each capture key renders (the page's `intakeForms`), the honeypot field the
 * door's middleware watches (the page's `intakeHoneypotField`, from `beam.core.intake.honeypot.field`), and how a
 * submission is sent (laravel-beam's public intake door by default).
 */
export interface PublicIntakeServices {
    schemas: Record<string, PublicIntakeSchema>;
    honeypotField?: string;
    submit?: (captureKey: string, payload: Record<string, unknown>) => Promise<PublicIntakeResult>;
}

const PublicIntakeContext = createContext<PublicIntakeServices>({ schemas: {} });

export function PublicIntakeProvider({ value, children }: { value: PublicIntakeServices; children: ReactNode }) {
    return <PublicIntakeContext.Provider value={value}>{children}</PublicIntakeContext.Provider>;
}

/** Read Laravel's `XSRF-TOKEN` cookie, as beam's other mutating transports do. */
function xsrfToken(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * POST a submission to laravel-beam's public intake door (`POST /beam/intake/{schema}`). It sends the CSRF header the
 * other beam transports send, so a host that mounts the door inside its session middleware accepts it too. The door
 * answers 422 with errors keyed by JSON pointer (`/field`, or `''` for the document) and 429 past its throttle.
 */
export async function submitToIntakeDoor(
    captureKey: string,
    payload: Record<string, unknown>,
    endpoint = '/beam/intake',
): Promise<PublicIntakeResult> {
    const token = xsrfToken();
    const response = await fetch(`${endpoint}/${encodeURI(captureKey)}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { 'X-XSRF-TOKEN': token } : {}) },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        return { ok: true };
    }
    const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };

    return { ok: false, status: response.status, message: body.message, errors: body.errors ?? {} };
}

/** A JSON Pointer's reference tokens (RFC 6901): split on `/`, then `~1` decodes to `/` and `~0` to `~`, in that order. */
export function pointerTokens(pointer: string): string[] {
    return pointer === '' ? [] : pointer.split('/').slice(1).map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** Tokens no form field can be named and an error path must never walk: they reach an object's prototype. */
const UNSAFE_TOKENS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * The door's JSON-pointer errors as an RJSF error schema: `/email` becomes `{ email: { __errors } }`, `''` the root.
 * The error keys come from the server, so every level is a null-prototype object, only own keys are walked, and a
 * path naming `__proto__`, `constructor` or `prototype` is skipped whole: no error path can reach Object.prototype.
 */
export function toErrorSchema(errors: Record<string, string[]>): Record<string, unknown> {
    const out: Record<string, unknown> = Object.create(null);
    for (const [pointer, messages] of Object.entries(errors)) {
        const path = pointerTokens(pointer);
        if (path.some(token => UNSAFE_TOKENS.has(token))) continue;
        let cursor = out;
        for (const token of path) {
            if (!Object.hasOwn(cursor, token)) cursor[token] = Object.create(null);
            cursor = cursor[token] as Record<string, unknown>;
        }
        cursor.__errors = [...(Object.hasOwn(cursor, '__errors') ? (cursor.__errors as string[]) : []), ...messages];
    }

    return out;
}

export interface IntakeFormProps {
    captureKey: string;
    submitLabel?: string;
    successMessage?: string;
    /** In the editor the form is a sealed preview: it shows its fields and never submits. */
    preview?: boolean;
}

/**
 * EP-07d: the packaged form Code Component. It renders the fields of the intake schema its `captureKey` names, which
 * the page supplies server-resolved for a public key only, and sends each submission to the submissions ledger
 * through the public intake door.
 *
 * Controls come from the same seam as {@see IntakeSectionForm}: the host's `renderForm` service when an
 * IntakeProvider is mounted, else `@schemastud/seam`'s SchemaForm (RJSF), which also types the values and leaves
 * empty optional fields out. The honeypot is the form's own off-screen input, so it reaches the door whichever
 * renderer draws the fields.
 */
export function IntakeForm({ captureKey, submitLabel = 'Send', successMessage = 'Thank you. Your submission was received.', preview = false }: IntakeFormProps) {
    const { schemas, honeypotField = 'website', submit = submitToIntakeDoor } = useContext(PublicIntakeContext);
    const services = useOptionalIntakeServices();
    const honeypot = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<IntakeFields>({});
    const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent'; message?: string; errors: Record<string, string[]> }>({ status: 'idle', errors: {} });
    const schema = schemas[captureKey];

    if (!schema) {
        return <div role="note" data-beam-intake-form={captureKey}>{preview ? `Intake form · ${captureKey}` : 'This form is not available.'}</div>;
    }
    if (state.status === 'sent') {
        return <div role="status" data-beam-intake-form={captureKey}>{successMessage}</div>;
    }
    const send = async (fields: IntakeFields) => {
        if (preview || state.status === 'sending') return;
        setState({ status: 'sending', errors: {} });
        const payload = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== ''));
        try {
            const result = await submit(captureKey, { ...payload, [honeypotField]: honeypot.current?.value ?? '' });
            setState(result.ok
                ? { status: 'sent', errors: {} }
                : { status: 'idle', errors: result.errors, message: result.status === 429 ? 'Too many submissions. Please wait a minute and try again.' : result.message });
        } catch {
            // A network failure never strands the form: it is usable again, the author's entries kept, to retry.
            setState({ status: 'idle', errors: {}, message: 'Your submission could not be sent. Check your connection and try again.' });
        }
    };
    const form: IntakeFormRenderProps = {
        schema,
        formData,
        disabled: preview || state.status === 'sending',
        onChange: setFormData,
        onSubmit: fields => void send(fields),
        errors: state.errors,
        submitLabel,
    };

    return <div data-beam-intake-form={captureKey} aria-busy={state.status === 'sending' || undefined}>
        {state.message && <p role="alert">{state.message}</p>}
        {services?.renderForm ? services.renderForm(form) : (
            <SchemaForm
                schema={schema}
                formData={form.formData}
                disabled={form.disabled}
                extraErrors={toErrorSchema(state.errors) as never}
                onChange={({ formData: next }) => setFormData(next ?? {})}
                onSubmit={({ formData: next }) => form.onSubmit(next ?? {})}
            >
                <button type="submit" disabled={form.disabled}>{submitLabel}</button>
            </SchemaForm>
        )}
        {/* The honeypot the door's middleware watches: off-screen and unannounced, filled only by bots. */}
        <input ref={honeypot} type="text" name={honeypotField} tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: 'absolute', left: '-10000px' }} defaultValue="" />
    </div>;
}
