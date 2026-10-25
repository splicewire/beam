import { useState } from "react";
import type {
  ComponentCanvasData,
  ComponentPropData,
} from "@splicewire/beam-resources/types/beam-ux";
import type { JsonBlock, JsonProp } from "../blockdoc/json";
import { getAt, isJsonBlock } from "../blockdoc/json";
import { useCanvas } from "./context";
import { useCanvasSelection } from "./CanvasSelection";
import { bindingFields, collectionOffers, recordOffer } from "./binding-edit";

/** Only the declared interface edits an instance; the component's internal nodes stay sealed. */
export function ComponentProps({
  path,
  entry,
}: {
  path: string;
  entry: ComponentCanvasData;
}) {
  const config = useCanvas();
  const { commands } = useCanvasSelection();
  const [error, setError] = useState<string | null>(null);
  const node = commands ? getAt(commands.doc, path) : null;
  if (!node || !isJsonBlock(node) || !commands?.editBinding) return null;
  const offer = recordOffer(
    commands.doc,
    path,
    collectionOffers(config.profile),
    config.bindingPreview?.recordCollection
  );
  const fields = offer ? bindingFields(offer.schema) : [];
  const edit = (prop: ComponentPropData, value: JsonProp | undefined) => {
    if (commands.readOnly) return;
    try {
      if (!value && prop.required && prop.default === null)
        throw Error(
          `The required prop ${prop.name} needs a literal value or a bound field.`
        );
      commands.editBinding!(path, (block: JsonBlock) => ({
        ...block,
        props: [
          ...block.props.filter((old) => old.name !== prop.name),
          ...(value ? [value] : []),
        ],
      }));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  const literal = (prop: ComponentPropData, value: string | boolean) => {
    if (prop.type === "choice" && !prop.choices.includes(String(value))) {
      setError(`${prop.name} needs one of its declared choices.`);
      return;
    }
    let next: string | number | boolean = value;
    if (prop.type === "number") {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        !Number.isFinite(Number(value))
      ) {
        setError(`${prop.name} needs a finite number.`);
        return;
      }
      next = Number(value);
    }
    edit(prop, {
      name: prop.name,
      kind:
        typeof next === "number"
          ? "number"
          : typeof next === "boolean"
          ? "boolean"
          : "string",
      value: next,
    });
  };
  return (
    <section aria-label="Props">
      <h3>Props</h3>
      {error && <p role="alert">{error}</p>}
      {entry.definition.props.map((prop) => {
        const current = node.props.find((value) => value.name === prop.name);
        const value =
          current?.kind === "field" ? "" : current?.value ?? prop.default ?? "";
        const missing = !current && prop.required && prop.default === null;
        const compatible = fields.filter((field) =>
          prop.type === "number"
            ? ["number", "integer"].includes(field.type)
            : prop.type === "toggle"
            ? field.type === "boolean"
            : field.type === "string"
        );
        return (
          <fieldset key={prop.name} disabled={commands.readOnly}>
            <legend>
              {prop.name}
              {prop.required ? " (required)" : ""}
            </legend>
            {missing && (
              <p role="alert">
                {prop.name} is required. Supply a literal value or bind a field
                before saving.
              </p>
            )}
            {prop.type === "toggle" ? (
              <label>
                {prop.name}
                <input
                  aria-label={`Prop ${prop.name}`}
                  type="checkbox"
                  checked={value === true}
                  onChange={(event) => literal(prop, event.target.checked)}
                />
              </label>
            ) : prop.type === "choice" ? (
              <label>
                {prop.name}
                <select
                  aria-label={`Prop ${prop.name}`}
                  value={String(value)}
                  onChange={(event) => literal(prop, event.target.value)}
                >
                  <option value="">Choose a value</option>
                  {prop.choices.map((choice) => (
                    <option key={choice}>{choice}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                {prop.name}
                <input
                  aria-label={`Prop ${prop.name}`}
                  key={`${path}:${prop.name}:${current?.kind}:${String(
                    current?.value
                  )}`}
                  defaultValue={String(value)}
                  type={prop.type === "number" ? "number" : "text"}
                  onBlur={(event) => literal(prop, event.target.value)}
                />
              </label>
            )}
            <label>
              Bind {prop.name}
              <select
                aria-label={`Bind prop ${prop.name}`}
                value={current?.kind === "field" ? String(current.value) : ""}
                onChange={(event) =>
                  edit(
                    prop,
                    event.target.value
                      ? {
                          name: prop.name,
                          kind: "field",
                          value: event.target.value,
                        }
                      : undefined
                  )
                }
              >
                <option value="">Literal / default</option>
                {compatible.map((field) => (
                  <option key={field.path} value={field.path}>
                    {field.label} ({field.path})
                  </option>
                ))}
              </select>
            </label>
            {current?.kind === "prop" && (
              <p>
                This value comes from the enclosing component prop{" "}
                {String(current.value)}.
              </p>
            )}
            <button type="button" onClick={() => edit(prop, undefined)}>
              Unset prop {prop.name}
            </button>
          </fieldset>
        );
      })}
      {!entry.definition.props.length && (
        <p>This component declares no props.</p>
      )}
    </section>
  );
}
