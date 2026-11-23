import { WidgetRegistry } from '@schemastud/seam';
import * as react from 'react';

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

export { AgreementPrompt as A, type AgreementPromptProps as a, registerAgreementWidgets as r };
