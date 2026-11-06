import * as react from 'react';
import { ReactNode } from 'react';
import * as _splicewire__resources_types_intake from '@splicewire/_resources/types/intake';
import { EntityIntakeSectionSubmittedData, EntityIntakeFormSectionData } from '@splicewire/_resources/types/intake';
export { EntityIntakeFormSectionData, EntityIntakeSectionSubmittedData } from '@splicewire/_resources/types/intake';
import * as _tanstack_react_query from '@tanstack/react-query';

type IntakeFields = Record<string, unknown>;
interface IntakeClient<T extends EntityIntakeSectionSubmittedData = EntityIntakeSectionSubmittedData> {
    submit(sectionKey: string, fields: IntakeFields): Promise<T>;
}
/** A form-rendering slot: no endpoint, auth, or entity identity enters the package. */
interface IntakeFormRenderProps {
    schema: EntityIntakeFormSectionData['schema'];
    formData: IntakeFields;
    disabled: boolean;
    onChange(fields: IntakeFields): void;
    onSubmit(fields: IntakeFields): void;
    /** The server's errors for the last submission, keyed by JSON pointer (`/field`; `''` for the document). */
    errors?: Record<string, string[]>;
    /** The submit control's label, where the caller names one (a page IntakeForm does). */
    submitLabel?: string;
}
interface IntakeServices<T extends EntityIntakeSectionSubmittedData = EntityIntakeSectionSubmittedData> {
    client: IntakeClient<T>;
    renderForm?: (props: IntakeFormRenderProps) => ReactNode;
    onError?: (error: unknown) => void;
}

/** Mount with a new key when the selected entity or section changes. */
declare function IntakeSectionForm({ section, disabled, }: {
    section: EntityIntakeFormSectionData;
    disabled?: boolean;
}): react.JSX.Element;

declare function IntakeProvider({ services, children, }: {
    services: IntakeServices;
    children: ReactNode;
}): react.JSX.Element;
/** The host's intake services when an IntakeProvider is mounted, else null (a public page form needs none). */
declare function useOptionalIntakeServices(): IntakeServices | null;

/** Submissions have no package-owned read cache; the receipt belongs to this section. */
declare function useIntakeSubmission(sectionKey: string): _tanstack_react_query.UseMutationResult<_splicewire__resources_types_intake.EntityIntakeSectionSubmittedData, unknown, IntakeFields, unknown>;

/** The JSON Schema a public intake capture key validates against, resolved by the server for the page (EP-07d). */
type PublicIntakeSchema = Record<string, unknown>;
type PublicIntakeResult = {
    ok: true;
} | {
    ok: false;
    status: number;
    message?: string;
    errors: Record<string, string[]>;
};
/**
 * What a page gives its forms: the schema each capture key renders (the page's `intakeForms`), the honeypot field the
 * door's middleware watches (the page's `intakeHoneypotField`, from `beam.core.intake.honeypot.field`), and how a
 * submission is sent (laravel-beam's public intake door by default).
 */
interface PublicIntakeServices {
    schemas: Record<string, PublicIntakeSchema>;
    honeypotField?: string;
    submit?: (captureKey: string, payload: Record<string, unknown>) => Promise<PublicIntakeResult>;
    /** Called after a successful human submission, with the public capture key. */
    onSent?: (captureKey: string) => void;
}
declare function PublicIntakeProvider({ value, children }: {
    value: PublicIntakeServices;
    children: ReactNode;
}): react.JSX.Element;
/**
 * POST a submission to laravel-beam's public intake door (`POST /beam/intake/{schema}`). It sends the CSRF header the
 * other beam transports send, so a host that mounts the door inside its session middleware accepts it too. The door
 * answers 422 with errors keyed by JSON pointer (`/field`, or `''` for the document) and 429 past its throttle.
 */
declare function submitToIntakeDoor(captureKey: string, payload: Record<string, unknown>, endpoint?: string): Promise<PublicIntakeResult>;
/** A JSON Pointer's reference tokens (RFC 6901): split on `/`, then `~1` decodes to `/` and `~0` to `~`, in that order. */
declare function pointerTokens(pointer: string): string[];
/**
 * The door's JSON-pointer errors as an RJSF error schema: `/email` becomes `{ email: { __errors } }`, `''` the root.
 * The error keys come from the server, so every level is a null-prototype object, only own keys are walked, and a
 * path naming `__proto__`, `constructor` or `prototype` is skipped whole: no error path can reach Object.prototype.
 */
declare function toErrorSchema(errors: Record<string, string[]>): Record<string, unknown>;
interface IntakeFormProps {
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
declare function IntakeForm({ captureKey, submitLabel, successMessage, preview }: IntakeFormProps): react.JSX.Element;

export { type IntakeClient, type IntakeFields, IntakeForm, type IntakeFormProps, type IntakeFormRenderProps, IntakeProvider, IntakeSectionForm, type IntakeServices, PublicIntakeProvider, type PublicIntakeResult, type PublicIntakeSchema, type PublicIntakeServices, pointerTokens, submitToIntakeDoor, toErrorSchema, useIntakeSubmission, useOptionalIntakeServices };
