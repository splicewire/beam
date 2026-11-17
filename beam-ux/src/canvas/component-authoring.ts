import type {
  ComponentCanvasData,
  ComponentPropData,
  ComponentPropType,
} from "@splicewire/beam-resources/types/beam-ux";
import {
  getAt,
  isJsonBlock,
  updateAt,
  type JsonBlock,
  type JsonDoc,
  type JsonNode,
  type JsonProp,
} from "../blockdoc/json.js";
import { freshBlockIds } from "../blockdoc/identity.js";
import { readComponentDefinition } from "../blockdoc/component-interface.js";
import {NoticeError,notice as line} from '../message-descriptor.js';

const GATES = new Set(["data-view-gate", "data-edit-gate"]);
function literal(value: JsonProp): string | number | boolean | null {
  if (["expression", "field", "prop"].includes(value.kind))
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_a_literal_value_is_required'));
  if (value.value == null) return null;
  if (["string", "number", "boolean"].includes(typeof value.value))
    return value.value as string | number | boolean;
  throw new NoticeError(line('splicewire-beam-ux::messages.authoring_a_scalar_literal_value_is_required'));
}
function scalar(
  name: string,
  value: string | number | boolean | null
): JsonProp {
  return {
    name,
    kind:
      typeof value === "boolean"
        ? "boolean"
        : typeof value === "number"
        ? "number"
        : "string",
    value: value ?? "",
  };
}
function mergeStyles(
  base: JsonBlock["style"],
  override: JsonBlock["style"]
): JsonBlock["style"] {
  if (!override) return base;
  const layers = structuredClone(base?.layers ?? []);
  for (const layer of override.layers) {
    const index = layers.findIndex(
      (old) =>
        (old.breakpoint ?? null) === (layer.breakpoint ?? null) &&
        (old.state ?? null) === (layer.state ?? null)
    );
    if (index < 0) layers.push(structuredClone(layer));
    else
      layers[index] = {
        ...layers[index],
        declarations: { ...layers[index].declarations, ...layer.declarations },
      };
  }
  return { layers };
}

/** One level at the shown Working Head. Caller-owned Slot content never enters component prop scope. */
export function detachComponent(
  instance: JsonBlock,
  entry: ComponentCanvasData | undefined
): JsonBlock {
  if (!entry) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_is_available_only_for_an_authored_compone'));
  if (instance.name !== entry.definition.name)
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_the_instance_must_match_the_component_name'));
  if (entry.body.length !== 1 || !isJsonBlock(entry.body[0]))
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_an_authored_component_must_have_one_root'));
  if (entry.body[0].repeat && instance.repeat)
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_cannot_combine_the_instance_repeat_and_th'));
  const values = new Map<string, JsonProp>();
  for (const prop of entry.definition.props) {
    const supplied = instance.props.find((value) => value.name === prop.name);
    if (supplied?.kind === "expression")
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_cannot_substitute_an_executable_expressio'));
    if (supplied) values.set(prop.name, supplied);
    else if (prop.default != null)
      values.set(prop.name, scalar(prop.name, prop.default));
    else if (prop.required)
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_required_prop_missing',{name:prop.name}));
  }
  const substitute = (nodes: JsonDoc, repeatScope = false): JsonDoc =>
    nodes.flatMap((node): JsonDoc => {
      if (node.kind === "opaque")
        throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_cannot_copy_executable_source'));
      if (node.kind === "text") {
        if (!node.prop) return [structuredClone(node)];
        const value = values.get(node.prop);
        const { prop: _, field: __, ...text } = node;
        if (value?.kind === "field") {
          if (repeatScope)
            throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_would_move_a_caller_field_into_a_componen'));
          return [{ ...text, field: String(value.value) }];
        }
        if (value?.kind === "prop")
          return [{ ...text, prop: String(value.value) }];
        return [{ ...text, value: value ? String(literal(value) ?? "") : "" }];
      }
      const scoped = repeatScope || !!node.repeat;
      if (node.name === "Slot") {
        const name =
          node.props.find((value) => value.name === "name")?.value ??
          "children";
        const supplied =
          name === "children"
            ? instance.children.length
              ? instance.children
              : undefined
            : instance.slots?.[String(name)];
        if (scoped && supplied?.length)
          throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_would_move_caller_slot_content_into_a_com'));
        return supplied === undefined
          ? substitute(node.children, scoped)
          : structuredClone(supplied);
      }
      return [
        {
          ...structuredClone(node),
          props: node.props.map((prop) => {
            if (prop.kind !== "prop") return structuredClone(prop);
            const value = values.get(String(prop.value));
            if (scoped && value?.kind === "field")
              throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_would_move_a_caller_field_into_a_componen'));
            return value
              ? { ...structuredClone(value), name: prop.name }
              : scalar(prop.name, null);
          }),
          children: substitute(node.children, scoped),
          ...(node.slots
            ? {
                slots: Object.fromEntries(
                  Object.entries(node.slots).map(([name, content]) => [
                    name,
                    substitute(content, scoped),
                  ])
                ),
              }
            : {}),
          ...(node.repeat
            ? {
                repeat: {
                  ...structuredClone(node.repeat),
                  // Empty runs in the incoming Record scope, outside this node's Repeat.
                  empty: substitute(node.repeat.empty ?? [], repeatScope),
                },
              }
            : {}),
        },
      ];
    });
  const [root] = substitute(entry.body);
  if (!root || !isJsonBlock(root)) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_detach_requires_a_block_root'));
  delete root.component;
  root.style = mergeStyles(root.style, instance.style);
  root.repeat = structuredClone(instance.repeat ?? root.repeat);
  root.when = structuredClone(instance.when ?? root.when);
  for (const prop of instance.props.filter((prop) => GATES.has(prop.name))) {
    root.props = [
      ...root.props.filter((old) => old.name !== prop.name),
      structuredClone(prop),
    ];
  }
  return freshBlockIds(root);
}

/** Selection-only transform. The caller creates the server entry before applying the Local Session swap. */
export function extractComponent(
  selection: JsonBlock,
  name: string,
  fieldTypes: Record<string, ComponentPropType>
): { body: JsonBlock; instance: JsonBlock } {
  const definition = readComponentDefinition({ name, props: [] });
  const fields = new Map<string, string>();
  const props: JsonProp[] = [];
  const reference = (field: string): string => {
    const old = fields.get(field);
    if (old) return old;
    const type = fieldTypes[field];
    if (!type)
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_choose_declared_type',{field}));
    const name = `value${fields.size + 1}`;
    fields.set(field, name);
    definition.props.push({
      name,
      type,
      required: true,
      default: null,
      choices: [],
    });
    props.push({ name, kind: "field", value: field });
    return name;
  };
  const visit = (node: JsonNode, callerScope: boolean): JsonNode => {
    if (node.kind === "opaque")
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_an_authored_component_cannot_capture_executable_'));
    if (node.kind === "text") {
      if (!node.field || !callerScope) return structuredClone(node);
      if (["number", "toggle"].includes(fieldTypes[node.field]))
        throw new NoticeError(line('splicewire-beam-ux::messages.authoring_a_component_text_reference_needs_a_string_prop_k'));
      const { field, ...text } = node;
      return { ...text, prop: reference(field) };
    }
    // A condition reading the caller cannot become a component Record read. No undeclared prop-condition syntax.
    if (callerScope && node.when)
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_move_this_caller_record_condition_to_the_selecte'));
    const childScope = callerScope && !node.repeat;
    return {
      ...structuredClone(node),
      props: node.props.map((prop) =>
        callerScope && prop.kind === "field"
          ? { ...prop, kind: "prop", value: reference(String(prop.value)) }
          : structuredClone(prop)
      ),
      children: node.children.map((child) => visit(child, childScope)),
      ...(node.slots
        ? {
            slots: Object.fromEntries(
              Object.entries(node.slots).map(([key, content]) => [
                key,
                content.map((child) => visit(child, childScope)),
              ])
            ),
          }
        : {}),
      ...(node.repeat
        ? {
            repeat: {
              ...structuredClone(node.repeat),
              empty: (node.repeat.empty ?? []).map((child) =>
                visit(child, callerScope)
              ),
            },
          }
        : {}),
    };
  };
  const { repeat, when, component: _, ...plain } = selection;
  const gates = plain.props.filter((prop) => GATES.has(prop.name));
  const body = visit(
    { ...plain, props: plain.props.filter((prop) => !GATES.has(prop.name)) },
    true
  ) as JsonBlock;
  body.component = definition;
  const instance: JsonBlock = {
    kind: "block",
    name,
    isComponent: true,
    dynamic: false,
    id: selection.id,
    props: [...props, ...structuredClone(gates)],
    children: [],
    ...(repeat ? { repeat: structuredClone(repeat) } : {}),
    ...(when ? { when: structuredClone(when) } : {}),
  };
  return { body: freshBlockIds(body), instance };
}

/** A literal becomes a typed default; this is a component document edit, never an instance override. */
export function makeComponentProp(
  root: JsonBlock,
  path: string,
  attribute: string | null,
  prop: ComponentPropData
): JsonBlock {
  if (!root.component)
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_open_an_authored_component_to_declare_a_prop'));
  if (root.component.props.some((old) => old.name === prop.name))
    throw new NoticeError(line('splicewire-beam-ux::messages.authoring_this_prop_name_is_already_declared'));
  const target = getAt([root], path);
  if (!target) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_select_a_literal_value'));
  let fallback: string | number | boolean | null;
  let replacement: JsonNode;
  if (attribute === null) {
    if (target.kind !== "text" || target.field || target.prop)
      throw new NoticeError(line('splicewire-beam-ux::messages.authoring_select_literal_text'));
    fallback = target.value;
    replacement = { ...target, prop: prop.name };
  } else {
    if (!isJsonBlock(target)) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_select_a_literal_property'));
    const value = target.props.find((value) => value.name === attribute);
    if (!value) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_select_a_literal_property'));
    fallback = literal(value);
    replacement = {
      ...target,
      props: target.props.map((value) =>
        value.name === attribute
          ? { ...value, kind: "prop", value: prop.name }
          : value
      ),
    };
  }
  const definition = readComponentDefinition({
    ...root.component,
    props: [...root.component.props, { ...prop, default: fallback }],
  });
  const [next] = updateAt([root], path, () => replacement);
  if (!isJsonBlock(next)) throw new NoticeError(line('splicewire-beam-ux::messages.authoring_a_component_requires_a_block_root'));
  return { ...next, component: definition };
}
