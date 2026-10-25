import { authoredEntry } from "./authored-components";
import { useEffect, useState } from "react";
import type {
  ComponentCanvasData,
  ComponentPropType,
  EntryComponentCapabilitiesOutputData,
} from "@splicewire/beam-resources/types/beam-ux";
import type { JsonDoc } from "../blockdoc/json";
import { getAt, isJsonBlock, updateAt } from "../blockdoc/json";
import { wrapBlocks } from "./commands";
import { useCanvas } from "./context";
import { bindingFields, collectionOffers, recordOffer } from "./binding-edit";
import {
  detachComponent,
  extractComponent,
  makeComponentProp,
} from "./component-authoring";

/** Server creation precedes the one local page edit; failures never guess a successful swap. */
export function ComponentTools({
  doc,
  paths,
  readOnly,
  onChange,
}: {
  doc: JsonDoc;
  paths: string[];
  readOnly: boolean;
  onChange: (next: JsonDoc, expected: JsonDoc) => void;
}) {
  const config = useCanvas();
  const port = config.componentAuthoring;
  const path = paths.length === 1 ? paths[0] : null;
  const selected = path ? getAt(doc, path) : null;
  const entry = authoredEntry(
    config,
    selected && isJsonBlock(selected) ? selected.name : null
  );
  const [name, setName] = useState("");
  const [propName, setPropName] = useState("");
  const [property, setProperty] = useState("");
  const [type, setType] = useState<ComponentPropType>("text");
  const [choices, setChoices] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const check = port?.client.componentCapabilities;
  const [admission, setAdmission] = useState<{
    id: string;
    check: typeof check;
    value: EntryComponentCapabilitiesOutputData;
  } | null>(null);
  useEffect(() => {
    let live = true;
    if (entry && check)
      void check(entry.id).then(
        (value) => {
          if (live) setAdmission({ id: entry.id, check, value });
        },
        () => {
          if (live) setAdmission(null);
        }
      );
    return () => {
      live = false;
    };
  }, [entry?.id, check, port?.entryId]);
  const canEdit =
    !!entry &&
    admission?.id === entry.id &&
    admission.check === check &&
    admission.value.canEdit;
  const run = (operation: () => void) => {
    try {
      operation();
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  const make = async () => {
    if (!port?.client.createComponent || !paths.length || busy || readOnly)
      return;
    let created: string | null = null;
    setBusy(true);
    setError(null);
    try {
      let snapshot = doc;
      let selectedPath = paths[0];
      if (paths.length > 1) {
        snapshot = wrapBlocks(doc, paths, "flex", config.profile);
        selectedPath = paths
          .slice()
          .sort(
            (a, b) => Number(a.split(".").at(-1)) - Number(b.split(".").at(-1))
          )[0];
      }
      const node = getAt(snapshot, selectedPath);
      if (!node || !isJsonBlock(node))
        throw Error("Select a block or sibling blocks");
      const offers = collectionOffers(config.profile);
      const offer = recordOffer(
        doc,
        selectedPath,
        offers,
        config.bindingPreview?.recordCollection
      );
      const types = Object.fromEntries(
        (offer ? bindingFields(offer.schema) : []).map((field) => [
          field.path,
          field.type === "boolean"
            ? "toggle"
            : field.type === "number" || field.type === "integer"
            ? "number"
            : "text",
        ])
      ) as Record<string, ComponentPropType>;
      const extracted = extractComponent(node, name, types);
      const result = await port.client.createComponent(port.entryId, {
        title: name,
        body: [extracted.body],
      });
      created = result.id;
      await port.refresh();
      onChange(
        updateAt(snapshot, selectedPath, () => extracted.instance),
        doc
      );
      setName("");
    } catch (reason) {
      setError(
        `${reason instanceof Error ? reason.message : String(reason)}${
          created
            ? ` Component entry ${created} was retained. The page swap was not applied; no deletion was attempted.`
            : ""
        }`
      );
    } finally {
      setBusy(false);
    }
  };
  const duplicate = async (entry: ComponentCanvasData) => {
    if (!port?.client.duplicateComponent || busy || readOnly) return;
    setBusy(true);
    setError(null);
    try {
      const result = await port.client.duplicateComponent(entry.id);
      await port.refresh();
      setError(
        `Component copy ${result.id} created. Existing instances still use the original.`
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };
  const root =
    doc.length === 1 && isJsonBlock(doc[0]) && doc[0].component ? doc[0] : null;
  return (
    <section aria-label="Component authoring">
      {error && <p role="status">{error}</p>}
      {port?.client.createComponent && paths.length > 0 && (
        <>
          <label>
            Component name
            <input
              aria-label="Component name"
              value={name}
              disabled={readOnly || busy}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={readOnly || busy || !name}
            onClick={() => void make()}
          >
            Make component
          </button>
        </>
      )}
      {entry && path && selected && isJsonBlock(selected) && (
        <>
          <button
            type="button"
            disabled={readOnly || busy}
            onClick={() =>
              run(() =>
                onChange(
                  updateAt(doc, path, () => detachComponent(selected, entry)),
                  doc
                )
              )
            }
          >
            Detach component
          </button>
          {canEdit && port?.client.duplicateComponent && (
            <button
              type="button"
              disabled={readOnly || busy}
              onClick={() => void duplicate(entry)}
            >
              Duplicate component
            </button>
          )}
        </>
      )}
      {root && path && selected && isJsonBlock(selected) && (
        <fieldset disabled={readOnly || busy}>
          <legend>Make a prop</legend>
          <label>
            Prop name
            <input
              aria-label="Prop name"
              value={propName}
              onChange={(event) => setPropName(event.target.value)}
            />
          </label>
          <label>
            Prop type
            <select
              aria-label="Prop type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ComponentPropType)
              }
            >
              {["text", "number", "toggle", "choice", "link", "image"].map(
                (value) => (
                  <option key={value}>{value}</option>
                )
              )}
            </select>
          </label>
          {type === "choice" && (
            <label>
              Choices
              <input
                aria-label="Choices"
                value={choices}
                onChange={(event) => setChoices(event.target.value)}
              />
            </label>
          )}
          <label>
            Literal value
            <select
              aria-label="Literal value"
              value={property}
              onChange={(event) => setProperty(event.target.value)}
            >
              <option value="">First literal text</option>
              {selected.props
                .filter((prop) =>
                  ["string", "number", "boolean"].includes(prop.kind)
                )
                .map((prop) => (
                  <option key={prop.name} value={prop.name}>
                    {prop.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!propName}
            onClick={() =>
              run(() => {
                const text = selected.children.findIndex(
                  (node) => node.kind === "text" && !node.field && !node.prop
                );
                if (!property && text < 0)
                  throw Error(
                    "Select a block with literal text or a literal property"
                  );
                onChange(
                  [
                    makeComponentProp(
                      root,
                      property ? path : `${path}.${text}`,
                      property || null,
                      {
                        name: propName,
                        type,
                        required: false,
                        default: null,
                        choices:
                          type === "choice"
                            ? choices
                                .split(",")
                                .map((value) => value.trim())
                                .filter(Boolean)
                            : [],
                      }
                    ),
                  ],
                  doc
                );
              })
            }
          >
            Make prop
          </button>
        </fieldset>
      )}
    </section>
  );
}
