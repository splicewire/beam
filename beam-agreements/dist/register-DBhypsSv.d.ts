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
}
/** A sign-up or invitation prompt: notices inform; blocking kinds use the shared member widget. */
declare function AgreementPrompt({ agreementKey, readUrl, required, version, digest, kind, title: embeddedTitle, label, effectiveAt, summary, content: embeddedContent, legalUrl, value, onChange }: AgreementPromptProps): react.JSX.Element | null;

/** The shared lazy widget-registration module for frame kits and frame-vocabulary. */
declare function registerAgreementWidgets(registry: WidgetRegistry): void;

export { AgreementPrompt as A, type OutstandingRequirement as O, type AgreementPromptProps as a, requirementsOf as b, registerAgreementWidgets as r };
