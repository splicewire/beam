import { useEffect, useRef, useState } from "react";
import type { JsonBlock, JsonDoc } from "../blockdoc/json";
import { useCanvas, CanvasRuntimeProvider } from "./context";
import { CanvasSiblings } from "./CanvasSiblings";
import { edgeAt, type CanvasNodeProps } from "./CanvasNode";
import { islandProps } from "./props";
import { bindingRuntime, type BindingPayload } from "../bindings/runtime";
import { renderNode } from "./TreeRender";
import { componentValue, authoredEntry } from "./authored-components";

/** Component markup stays sealed; caller-owned Slot regions carry their original editable paths. */
export function CanvasInstance({
  node: block,
  path,
  ...rest
}: Omit<CanvasNodeProps, "node"> & { node: JsonBlock }) {
  const config = useCanvas();
  if (block.repeat)
    return (
      <>
        {bindingRuntime.repeat(
          config.bindings?.[block.id ?? ""],
          (record) => (
            <CanvasRuntimeProvider
              key={JSON.stringify(record.fields)}
              config={{
                ...config,
                record,
                bindings: record.bindings as BindingPayload | undefined,
              }}
            >
              <CanvasInstance
                {...rest}
                path={path}
                node={{ ...block, repeat: undefined }}
              />
            </CanvasRuntimeProvider>
          ),
          () => (
            <CanvasSiblings
              {...rest}
              nodes={block.repeat?.empty ?? []}
              parent={`${path}.repeat.empty`}
            />
          )
        )}
      </>
    );
  if (block.when && !bindingRuntime.when(block.when, config.record))
    return (
      <div data-bd-path={path}>Component hidden by its display condition</div>
    );
  return <RenderedInstance {...rest} path={path} block={block} />;
}
function RenderedInstance({
  block,
  path,
  ...rest
}: Omit<CanvasNodeProps, "node"> & { block: JsonBlock }) {
  const config = useCanvas();
  const Comp = config.registry[block.name!];
  const element = useRef<HTMLDivElement>(null);
  const entry = authoredEntry(config, block.name);
  const port = config.componentAuthoring;
  const latest = useRef(port);
  latest.current = port;
  const check = port?.client.componentCapabilities;
  const [admission, setAdmission] = useState<{
    id: string;
    check: typeof check;
    canEdit: boolean;
  } | null>(null);
  useEffect(() => {
    let live = true;
    if (entry && check)
      void check(entry.id).then(
        (value) => {
          if (live)
            setAdmission({ id: entry.id, check, canEdit: value.canEdit });
        },
        () => {
          if (live) setAdmission(null);
        }
      );
    return () => {
      live = false;
    };
  }, [entry?.id, port?.entryId, check]);
  const canEdit =
    !!entry &&
    admission?.id === entry.id &&
    admission.check === check &&
    admission.canEdit &&
    !!port?.open;
  const values = {
    ...islandProps(block, config.styleRegistry),
    ...Object.fromEntries(
      block.props
        .filter((prop) => prop.kind === "field")
        .map((prop) => [
          prop.name,
          bindingRuntime.attribute(
            config.record,
            String(prop.value),
            prop.name
          ),
        ])
    ),
    ...Object.fromEntries(
      block.props
        .filter((prop) => prop.kind === "prop")
        .map((prop) => [prop.name, componentValue(config, String(prop.value))])
    ),
  };
  const slots = slotDefaults(entry?.body ?? []);
  const defaults = Object.fromEntries(
    (entry?.definition.props ?? [])
      .filter((prop) => prop.default != null)
      .map((prop) => [prop.name, prop.default])
  );
  const fallbackConfig = {
    ...config,
    record: undefined,
    bindings: entry?.bindings ?? {},
    componentProps: { ...defaults, ...values },
  };
  const subtree = (nodes: JsonDoc, parent: string, name: string) => (
    <div
      data-bd-slot={parent}
      style={{ pointerEvents: "auto", minHeight: 24 }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        rest.dnd.onDragOverNode(`${parent}.${nodes.length}`, "before");
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        rest.dnd.onDrop(event.dataTransfer);
      }}
    >
      {nodes.length ? (
        <CanvasSiblings {...rest} nodes={nodes} parent={parent} />
      ) : (
        <div style={{ pointerEvents: "none" }}>
          {(slots.get(name) ?? []).map((node, index) =>
            renderNode(node, `${parent}.fallback.${index}`, fallbackConfig)
          )}
        </div>
      )}
    </div>
  );
  const declaration = config.profile?.nodes.find(
    (item) => item.name === block.name
  );
  const named = new Set([
    ...(declaration?.slots ?? []).map((slot) => slot.name),
    ...Object.keys(block.slots ?? {}),
  ]);
  const content = Object.fromEntries(
    [...named].map((name) => [
      name,
      subtree(block.slots?.[name] ?? [], `${path}.slots.${name}`, name),
    ])
  );
  const children =
    block.children.length ||
    declaration?.admitsChildCategories === null ||
    (declaration?.admitsChildCategories?.length ?? 0) > 0
      ? subtree(block.children, path, "children")
      : undefined;
  const open = () => {
    if (canEdit && entry && element.current)
      port!.open!(entry, { ...values, ...content, children }, element.current);
  };
  return (
    <div
      ref={element}
      tabIndex={-1}
      data-bd-path={path}
      className="ve-island"
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        rest.dnd.onDragStart(path);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        rest.dnd.onDragOverNode(
          path,
          edgeAt(event.currentTarget, event.clientY)
        );
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        rest.dnd.onDrop(event.dataTransfer);
      }}
      onDragEnd={rest.dnd.onDragEnd}
      onDoubleClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("[data-bd-slot]")
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        open();
      }}
    >
      {canEdit && (
        <button
          type="button"
          data-component-action
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
        >
          Edit component
        </button>
      )}
      <div style={{ pointerEvents: "none" }}>
        <Comp {...values} {...content}>
          {children}
        </Comp>
      </div>
    </div>
  );
}
function slotDefaults(doc: JsonDoc): Map<string, JsonDoc> {
  const found = new Map<string, JsonDoc>();
  const stack = [...doc];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.kind !== "block") continue;
    if (node.name === "Slot")
      found.set(
        String(
          node.props.find((prop) => prop.name === "name")?.value ?? "children"
        ),
        node.children
      );
    stack.push(
      ...node.children,
      ...Object.values(node.slots ?? {}).flat(),
      ...(node.repeat?.empty ?? [])
    );
  }
  return found;
}
