import { useMemo, useState } from "react";
import { SchemaForm, type SchemaNode } from "@schemastud/seam";
import type {
  CollectionDefinitionInputData,
  SchemaRegistrationConfirmationData,
  SchemaVersionImpactData,
} from "./generated";

/** An existing registry 409 supplies the exact proposal and publication pins requiring review. */
export class CollectionRegistrationImpact extends Error {
  constructor(
    public readonly impact: SchemaVersionImpactData,
    message = "Review the affected published pages before saving this version.",
  ) {
    super(message);
  }
}

/** Field definitions use the server's declared Data schema and the shared form renderer. */
export function CollectionDefinitionEditor({
  schema,
  initial,
  onSave,
  onCancel,
}: {
  schema: SchemaNode;
  initial: Partial<CollectionDefinitionInputData>;
  onSave(value: CollectionDefinitionInputData): Promise<void>;
  onCancel(): void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    impact: SchemaVersionImpactData;
    value: CollectionDefinitionInputData;
  } | null>(null);
  // Confirmation is a server-issued proposal capability, never an editable form field.
  const visibleSchema = useMemo(
    () => ({
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties ?? {}).filter(
          ([key]) => key !== "registrationConfirmation",
        ),
      ),
      required: Array.isArray(schema.required)
        ? schema.required.filter(
            (key) =>
              typeof key === "string" && key !== "registrationConfirmation",
          )
        : undefined,
    }),
    [schema],
  );
  const submit = async (
    value: CollectionDefinitionInputData,
    confirmation: SchemaRegistrationConfirmationData | null = null,
  ) => {
    setSaving(true);
    setError(null);
    setPending(null);
    const proposal = {
      ...value,
      baseVersion: initial.baseVersion ?? 0,
      registrationConfirmation: confirmation,
    };
    try {
      await onSave(proposal);
    } catch (failure) {
      if (failure instanceof CollectionRegistrationImpact) {
        setPending({ impact: failure.impact, value: proposal });
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "The Collection could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <section aria-label="Collection fields" className="space-y-4">
      <h2 className="text-lg font-semibold">Collection fields</h2>
      <p>
        Save registers a new version. Existing Records use the latest schema.
      </p>
      {error && <p role="alert">{error}</p>}
      {pending && (
        <section aria-label="Published pages affected" className="space-y-3">
          <h3>Published pages affected</h3>
          <ul>
            {pending.impact.pages.map((page) => (
              <li key={page.id}>
                <strong>{page.title}</strong>: {page.fields.join(", ")}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void submit(pending.value, {
                schemaFingerprint: pending.impact.schemaFingerprint,
                publishedVersions: Object.fromEntries(
                  pending.impact.pages.map((page) => [
                    page.id,
                    page.publishedVersion,
                  ]),
                ),
              })
            }
          >
            Confirm and save version
          </button>
        </section>
      )}
      <SchemaForm
        schema={visibleSchema}
        formData={draft}
        disabled={saving}
        uiSchema={{
          baseVersion: { "ui:widget": "hidden" },
          stem: { "ui:readonly": (initial.baseVersion ?? 0) > 0 },
        }}
        onChange={({ formData }) => {
          setDraft(formData);
          setPending(null);
          setError(null);
        }}
        onSubmit={({ formData }) => void submit(formData)}
      >
        <div className="flex gap-2">
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save version"}
          </button>
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </SchemaForm>
    </section>
  );
}
