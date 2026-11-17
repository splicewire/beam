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
import { useBeamUxMessages } from "../messages.js";
import { NoticeError, notice as line, noticeOf, say, type Notice } from "../message-descriptor.js";

/** Only the declared interface edits an instance; the component's internal nodes stay sealed. */
export function ComponentProps({
  path,
  entry,
}: {
  path: string;
  entry: ComponentCanvasData;
}) {
  const m = useBeamUxMessages();
  const config = useCanvas();
  const { commands } = useCanvasSelection();
  const [error, setError] = useState<Notice | null>(null);
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
        throw new NoticeError(line('splicewire-beam-ux::messages.canvas_prop_required_value', { name: prop.name }));
      commands.editBinding!(path, (block: JsonBlock) => ({
        ...block,
        props: [
          ...block.props.filter((old) => old.name !== prop.name),
          ...(value ? [value] : []),
        ],
      }));
      setError(null);
    } catch (reason) {
      setError(noticeOf(reason, String(reason)));
    }
  };
  const literal = (prop: ComponentPropData, value: string | boolean) => {
    if (prop.type === "choice" && !prop.choices.includes(String(value))) {
      setError(line('splicewire-beam-ux::messages.canvas_prop_needs_choice', { name: prop.name }));
      return;
    }
    let next: string | number | boolean = value;
    if (prop.type === "number") {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        !Number.isFinite(Number(value))
      ) {
        setError(line('splicewire-beam-ux::messages.canvas_prop_needs_number', { name: prop.name }));
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
    <section aria-label={m.t('splicewire-beam-ux::messages.canvas_props')}>
      <h3>{m.t('splicewire-beam-ux::messages.canvas_props')}</h3>
      {error && <p role="alert">{say(m, error)}</p>}
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
              {prop.required ? ` ${m.t('splicewire-beam-ux::messages.canvas_prop_required_tag')}` : ""}
            </legend>
            {missing && (
              <p role="alert">
                {m.t('splicewire-beam-ux::messages.canvas_prop_required',{ name: prop.name })}
              </p>
            )}
            {prop.type === "toggle" ? (
              <label>
                {prop.name}
                <input
                  aria-label={m.t('splicewire-beam-ux::messages.canvas_prop_label',{ name: prop.name })}
                  type="checkbox"
                  checked={value === true}
                  onChange={(event) => literal(prop, event.target.checked)}
                />
              </label>
            ) : prop.type === "choice" ? (
              <label>
                {prop.name}
                <select
                  aria-label={m.t('splicewire-beam-ux::messages.canvas_prop_label',{ name: prop.name })}
                  value={String(value)}
                  onChange={(event) => literal(prop, event.target.value)}
                >
                  <option value="">{m.t('splicewire-beam-ux::messages.canvas_choose_value')}</option>
                  {prop.choices.map((choice) => (
                    <option key={choice}>{choice}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                {prop.name}
                <input
                  aria-label={m.t('splicewire-beam-ux::messages.canvas_prop_label',{ name: prop.name })}
                  key={`${path}:${prop.name}:${current?.kind}:${String(
                    current?.value
                  )}`}
                  defaultValue={String(value)}
                  type={prop.type === "number" ? "number" : "text"}
                  onBlur={(event) => {
                    if (event.target.value !== String(value))
                      literal(prop, event.target.value);
                  }}
                />
              </label>
            )}
            <label>
              {m.t('splicewire-beam-ux::messages.canvas_bind_prop',{ name: prop.name })}
              <select
                aria-label={m.t('splicewire-beam-ux::messages.canvas_bind_prop_label',{ name: prop.name })}
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
                <option value="">{m.t('splicewire-beam-ux::messages.canvas_literal_default')}</option>
                {compatible.map((field) => (
                  <option key={field.path} value={field.path}>
                    {field.label} ({field.path})
                  </option>
                ))}
              </select>
            </label>
            {current?.kind === "prop" && (
              <p>
                {m.t('splicewire-beam-ux::messages.canvas_from_enclosing_prop',{ name: String(current.value) })}
              </p>
            )}
            <button type="button" onClick={() => edit(prop, undefined)}>
              {m.t('splicewire-beam-ux::messages.canvas_unset_prop',{ name: prop.name })}
            </button>
          </fieldset>
        );
      })}
      {!entry.definition.props.length && (
        <p>{m.t('splicewire-beam-ux::messages.canvas_no_props')}</p>
      )}
    </section>
  );
}
