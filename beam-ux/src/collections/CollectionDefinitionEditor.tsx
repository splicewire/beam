import { useState } from "react";
import { SchemaForm, type SchemaNode } from "@schemastud/seam";
import type { CollectionDefinitionInputData } from "./generated";

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
  return (
    <section aria-label="Collection fields" className="space-y-4">
      <h2 className="text-lg font-semibold">Collection fields</h2>
      <p>
        Save registers a new version. Existing Records use the latest schema.
      </p>
      {error && <p role="alert">{error}</p>}
      <SchemaForm
        schema={schema}
        formData={draft}
        disabled={saving}
        uiSchema={{
          baseVersion: { "ui:widget": "hidden" },
          stem: { "ui:readonly": (initial.baseVersion ?? 0) > 0 },
        }}
        onChange={({ formData }) => setDraft(formData)}
        onSubmit={async ({ formData }) => {
          setSaving(true);
          setError(null);
          try {
            await onSave({
              ...formData,
              baseVersion: initial.baseVersion ?? 0,
            });
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "The Collection could not be saved.",
            );
          } finally {
            setSaving(false);
          }
        }}
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
