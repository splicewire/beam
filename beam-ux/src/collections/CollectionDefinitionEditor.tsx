import { useMemo, useState } from "react";
import { statusOf, messageOf } from "../state/page-state";
import { SchemaForm, type SchemaNode } from "@schemastud/seam";
import type {
  CollectionDefinitionInputData,
  SchemaRegistrationConfirmationData,
  SchemaVersionImpactData,
  SchemaRegistryImpactResponseData,
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

/** Reuse Beam's transport status/message helpers; hosts can pass their HTTP error unchanged. */
function impactOf(failure: unknown): SchemaVersionImpactData | null {
  if (failure instanceof CollectionRegistrationImpact) return failure.impact;
  if (
    statusOf(failure) !== 409 ||
    failure === null ||
    typeof failure !== "object"
  )
    return null;
  const body = (
    failure as { response?: { data?: SchemaRegistryImpactResponseData } }
  ).response?.data;
  const impact = body?.data;
  return impact &&
    typeof impact.schemaFingerprint === "string" &&
    Array.isArray(impact.pages)
    ? impact
    : null;
}

/** Match the guard's page pins plus published parent-declaration dependencies. */
function confirmationOf(
  impact: SchemaVersionImpactData,
): SchemaRegistrationConfirmationData {
  const pins = new Map<string, string>();
  for (const page of impact.pages) {
    pins.set(page.id, page.publishedVersion);
    for (const [id, pin] of Object.entries(page.dependencies ?? {})) {
      if (!pins.has(id)) pins.set(id, pin);
    }
  }
  return {
    schemaFingerprint: impact.schemaFingerprint,
    publishedVersions: Object.fromEntries(pins),
  };
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
      const impact = impactOf(failure);
      if (impact) {
        setPending({ impact, value: proposal });
      }
      setError(
        messageOf(failure) ??
          (failure instanceof Error
            ? failure.message
            : "The Collection could not be saved."),
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
              void submit(pending.value, confirmationOf(pending.impact))
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
