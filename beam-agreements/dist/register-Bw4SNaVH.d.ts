import { WidgetRegistry } from '@schemastud/seam';
import * as react from 'react';

/**
 * agreements 06 / 15: the shape of beam's 428 body, read with no transport attached. The body is beam's
 * RequirementRefusalData (agreements 04): one OutstandingRequirementData per unmet Requirement, each naming exactly one
 * remedy: `acceptOperation` (call it, then replay) or `member` (replay with the agreement member added to that input
 * member). This module imports nothing, so a client that is not built on frame's transport (commerce's host adapter,
 * agreements 15) reads the same body with the same parser the interlock uses.
 */
interface OutstandingRequirement {
    key: string;
    /** The 1-based ordinal of the version the server wants (the plane's int `version`, agreements 04). */
    version: number;
    digest: string;
    kind: string;
    title: string;
    scope: string;
    subject: string | number | null;
    /** For the REST-backed member widget; the 428 dialog reads by key through frame's transport. */
    readUrl: string;
    acceptOperation: string | null;
    member: string | null;
}
/**
 * The outstanding Requirements a 428 body names, or null when the body isn't beam's refusal. Takes the parsed body
 * (`{requirements}`, or the same wrapped in `data`); the caller has already established the status is 428.
 */
declare function requirementsOf(body: unknown): OutstandingRequirement[] | null;

/**
 * agreements 15: how the widgets read one Agreement from its `readUrl` (the `beam.agreements.agreements.show` resource).
 *
 * The 428 body and the sign-up schema name the Agreement by a root-relative `readUrl` and carry no content, so a widget
 * must read it. With no reader the widget reads it itself with a same-origin `fetch` that carries cookies only, which is
 * enough for a host whose SPA and API share an origin and a session. A host whose API is on another origin, or
 * authenticates with a bearer token, gives a reader built on its own transport. The reader resolves the resource's
 * `data` and rejects when the read is refused (401, 403, 404) or fails. The widget then refuses to collect a member.
 */
/** The show resource's `data`: one Agreement and its current version. Every field is checked before use. */
interface AgreementRead {
    key?: unknown;
    kind?: unknown;
    title?: unknown;
    version?: {
        digest?: unknown;
        content?: unknown;
        label?: unknown;
        effectiveAt?: unknown;
        summary?: unknown;
    } | null;
}
/** A host's read of `readUrl` through its own transport: resolves the resource's `data`, rejects on any refusal. */
type AgreementReader = (readUrl: string) => Promise<AgreementRead | null | undefined>;

interface AgreementPromptProps {
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
declare function AgreementPrompt({ agreementKey, readUrl, required, version, digest, kind, title: embeddedTitle, label, effectiveAt, summary, content: embeddedContent, legalUrl, value, onChange, read }: AgreementPromptProps): react.JSX.Element | null;

interface AgreementWidgetOptions {
    /**
     * agreements 15: how 'agreement-member' reads an Agreement it is not given the text of, through the host's own
     * transport. Absent, it reads with a same-origin `fetch`, as before.
     */
    read?: AgreementReader;
}
/** The shared lazy widget-registration module for frame kits and frame-vocabulary. */
declare function registerAgreementWidgets(registry: WidgetRegistry, options?: AgreementWidgetOptions): void;

export { type AgreementReader as A, type OutstandingRequirement as O, AgreementPrompt as a, type AgreementPromptProps as b, requirementsOf as c, type AgreementRead as d, type AgreementWidgetOptions as e, registerAgreementWidgets as r };
