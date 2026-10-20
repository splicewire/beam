// src/blueprint.ts
function toDraft(blueprint) {
  return {
    name: blueprint.name,
    places: [...blueprint.places ?? []],
    initial: [...blueprint.initial ?? (blueprint.places?.[0] ? [blueprint.places[0]] : [])],
    transitions: (blueprint.transitions ?? []).map((t) => ({
      name: t.name,
      from: [...t.from],
      to: [...t.to],
      guard: t.guard ?? null,
      effects: [...t.effects ?? []],
      metadata: t.metadata ?? null,
      reason: t.reason ?? null
    })),
    metadata: blueprint.metadata ?? null
  };
}

// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var WorkflowsServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[workflows] ${event.message}`);
  else console.info(`[workflows] ${event.message}`);
}
function WorkflowsProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(WorkflowsServicesContext.Provider, { value: services, children });
}
function useWorkflowsServices() {
  const services = useContext(WorkflowsServicesContext);
  if (!services) {
    throw new Error("Workflows components must be rendered inside a <WorkflowsProvider>.");
  }
  return services;
}
function useNotify() {
  return useWorkflowsServices().notify ?? consoleNotify;
}
var noopSubscribe = () => () => {
};
function useSubscribe() {
  return useWorkflowsServices().subscribe ?? noopSubscribe;
}

// src/WorkflowGraph.tsx
import {
  Background,
  MarkerType,
  Position,
  ReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

// src/workflowLayout.ts
var NODE_WIDTH = 150;
var NODE_HEIGHT = 32;
var X_GAP = NODE_WIDTH + 130;
var Y_GAP = 90;
var GRAPH_ZOOM = 0.9;
var GRAPH_PADDING = 28;
function layoutBounds(nodes) {
  if (nodes.length === 0) return { width: 0, height: 0 };
  const width = Math.max(...nodes.map((n) => n.position.x)) + NODE_WIDTH;
  const height = Math.max(...nodes.map((n) => n.position.y)) + NODE_HEIGHT;
  return { width, height };
}
function graphCanvasSize(nodes) {
  const { width, height } = layoutBounds(nodes);
  return {
    minWidth: Math.ceil(width * GRAPH_ZOOM + GRAPH_PADDING * 2),
    height: Math.max(120, Math.ceil(height * GRAPH_ZOOM + GRAPH_PADDING * 2))
  };
}
function rankPlaces(blueprint) {
  const rank = /* @__PURE__ */ new Map();
  const adjacency = /* @__PURE__ */ new Map();
  for (const t of blueprint.transitions) {
    for (const from of t.from) {
      for (const to of t.to) {
        adjacency.set(from, [...adjacency.get(from) ?? [], to]);
      }
    }
  }
  const initial = blueprint.initial.length > 0 ? blueprint.initial : blueprint.places.slice(0, 1);
  const queue = [];
  for (const place of initial) {
    if (blueprint.places.includes(place) && !rank.has(place)) {
      rank.set(place, 0);
      queue.push(place);
    }
  }
  while (queue.length > 0) {
    const node = queue.shift();
    const depth = rank.get(node) ?? 0;
    for (const next of adjacency.get(node) ?? []) {
      if (!rank.has(next)) {
        rank.set(next, depth + 1);
        queue.push(next);
      }
    }
  }
  const maxRank = rank.size > 0 ? Math.max(...rank.values()) : 0;
  for (const place of blueprint.places) {
    if (!rank.has(place)) {
      rank.set(place, maxRank + 1);
    }
  }
  return rank;
}
function layoutBlueprint(blueprint) {
  const rank = rankPlaces(blueprint);
  const initial = new Set(blueprint.initial);
  const seenPerRank = /* @__PURE__ */ new Map();
  const nodes = blueprint.places.map((place) => {
    const r = rank.get(place) ?? 0;
    const row = seenPerRank.get(r) ?? 0;
    seenPerRank.set(r, row + 1);
    return {
      id: place,
      position: { x: r * X_GAP, y: row * Y_GAP },
      data: { label: place, initial: initial.has(place) }
    };
  });
  const placeSet = new Set(blueprint.places);
  const edges = [];
  for (const t of blueprint.transitions) {
    const guarded = Boolean(t.guard);
    const hasEffect = (t.effects?.length ?? 0) > 0;
    const glyphs = `${guarded ? "\u{1F512}" : ""}${hasEffect ? "\u26A1" : ""}`;
    const label = glyphs ? `${glyphs} ${t.name}` : t.name;
    for (const from of t.from) {
      for (const to of t.to) {
        if (!placeSet.has(from) || !placeSet.has(to)) continue;
        edges.push({
          id: `${t.name}:${from}->${to}`,
          source: from,
          target: to,
          label,
          guarded,
          hasEffect
        });
      }
    }
  }
  return { nodes, edges };
}

// src/WorkflowGraph.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function WorkflowGraph({ blueprint }) {
  const { nodes, edges, canvas } = useMemo(() => {
    const layout = layoutBlueprint(blueprint);
    const canvas2 = graphCanvasSize(layout.nodes);
    const rfNodes = layout.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: { label: n.data.label },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      // The initial place gets the accent ring so the entry point reads at a glance.
      style: {
        width: NODE_WIDTH,
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        border: n.data.initial ? "2px solid var(--beam-green)" : "1px solid var(--beam-ink-15)",
        background: "var(--beam-surface)"
      }
    }));
    const rfEdges = layout.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      labelStyle: { fontSize: 11 },
      // A padded chip behind the label so it stays legible where it crosses another edge.
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "var(--beam-surface, #fff)" },
      markerEnd: { type: MarkerType.ArrowClosed },
      style: e.guarded ? { stroke: "var(--beam-amber)" } : void 0
    }));
    return { nodes: rfNodes, edges: rfEdges, canvas: canvas2 };
  }, [blueprint]);
  const pane = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const el = pane.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth - el.clientWidth > GRAPH_PADDING);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvas.minWidth, nodes.length]);
  if (nodes.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex h-[420px] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--beam-ink-08)] p-6 text-center", children: [
      /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium", children: "No places yet" }),
      /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: "Add a place to the workflow and its graph will draw here." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full min-w-0", children: [
    /* @__PURE__ */ jsx2(
      "div",
      {
        ref: pane,
        className: "w-full overflow-x-auto rounded-md border border-[var(--beam-ink-08)]",
        "data-testid": "workflow-graph",
        children: /* @__PURE__ */ jsx2("div", { style: { minWidth: canvas.minWidth, height: canvas.height }, children: /* @__PURE__ */ jsx2(
          ReactFlow,
          {
            nodes,
            edges,
            fitView: true,
            fitViewOptions: { padding: 0, minZoom: GRAPH_ZOOM, maxZoom: GRAPH_ZOOM },
            minZoom: GRAPH_ZOOM,
            maxZoom: GRAPH_ZOOM,
            nodesDraggable: false,
            nodesConnectable: false,
            elementsSelectable: false,
            panOnDrag: false,
            zoomOnScroll: false,
            zoomOnPinch: false,
            zoomOnDoubleClick: false,
            preventScrolling: false,
            proOptions: { hideAttribution: true },
            children: /* @__PURE__ */ jsx2(Background, {})
          }
        ) })
      }
    ),
    overflowing && /* @__PURE__ */ jsxs(
      "p",
      {
        className: "mt-1 text-right text-[11px] text-muted-foreground",
        "data-testid": "workflow-graph-scroll-hint",
        children: [
          "Scroll sideways to see all ",
          nodes.length,
          " places \u2192"
        ]
      }
    )
  ] });
}

// src/WorkflowDiff.tsx
import { useMemo as useMemo2, useState as useState2 } from "react";
import { SimpleSelect } from "@schemastud/ui";

// src/workflowDelta.ts
function transitionKey(t) {
  return `${t.name}|${[...t.from].sort().join(",")}\u2192${[...t.to].sort().join(",")}`;
}
function arrayDelta(from, to) {
  const fromSet = new Set(from);
  const toSet = new Set(to);
  return {
    added: to.filter((x) => !fromSet.has(x)),
    removed: from.filter((x) => !toSet.has(x))
  };
}
function diffBlueprints(from, to) {
  const places = arrayDelta(from.places, to.places);
  const fromByKey = new Map(from.transitions.map((t) => [transitionKey(t), t]));
  const toByKey = new Map(to.transitions.map((t) => [transitionKey(t), t]));
  const transitions = [];
  for (const [key, t] of fromByKey) {
    if (!toByKey.has(key)) {
      transitions.push({ key, name: t.name, from: t.from, to: t.to, status: "removed" });
    }
  }
  for (const [key, t] of toByKey) {
    const prior = fromByKey.get(key);
    if (!prior) {
      transitions.push({ key, name: t.name, from: t.from, to: t.to, status: "added" });
      continue;
    }
    const guardMoved = (prior.guard ?? null) !== (t.guard ?? null);
    const effectDelta = arrayDelta(prior.effects ?? [], t.effects ?? []);
    const effectsMoved = effectDelta.added.length > 0 || effectDelta.removed.length > 0;
    if (guardMoved || effectsMoved) {
      transitions.push({
        key,
        name: t.name,
        from: t.from,
        to: t.to,
        status: "changed",
        ...guardMoved ? { guard: { from: prior.guard ?? null, to: t.guard ?? null } } : {},
        ...effectsMoved ? { effects: effectDelta } : {}
      });
    }
  }
  return { places, transitions };
}
function isEmptyDiff(diff) {
  return diff.places.added.length === 0 && diff.places.removed.length === 0 && diff.transitions.length === 0;
}

// src/WorkflowDiff.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function WorkflowDiff({
  versions,
  lineageKey
}) {
  const ordered = useMemo2(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
  const [fromId, setFromId] = useState2(() => ordered.at(-2)?.id ?? ordered[0]?.id ?? "");
  const [toId, setToId] = useState2(() => ordered.at(-1)?.id ?? "");
  const diff = useMemo2(() => {
    const from = ordered.find((v) => v.id === fromId);
    const to = ordered.find((v) => v.id === toId);
    if (!from || !to) return null;
    return diffBlueprints(
      toDraft({ ...from.blueprint, name: from.blueprint.name ?? lineageKey }),
      toDraft({ ...to.blueprint, name: to.blueprint.name ?? lineageKey })
    );
  }, [ordered, fromId, toId, lineageKey]);
  if (ordered.length < 2) return null;
  const options = ordered.map((v) => ({ value: v.id, label: `v${v.version}` }));
  return /* @__PURE__ */ jsxs2("div", { className: "mb-4 space-y-3 rounded-md border border-[var(--beam-ink-08)] p-3", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx3("span", { className: "font-mono text-[11px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Compare" }),
      /* @__PURE__ */ jsx3(
        SimpleSelect,
        {
          className: "w-24",
          "aria-label": "Diff from version",
          value: fromId,
          onValueChange: setFromId,
          options
        }
      ),
      /* @__PURE__ */ jsx3("span", { className: "text-[var(--beam-ink-45)]", children: "\u2192" }),
      /* @__PURE__ */ jsx3(
        SimpleSelect,
        {
          className: "w-24",
          "aria-label": "Diff to version",
          value: toId,
          onValueChange: setToId,
          options
        }
      )
    ] }),
    diff && isEmptyDiff(diff) ? /* @__PURE__ */ jsx3("p", { className: "text-xs text-[var(--beam-ink-50)]", children: "No structural changes between these versions." }) : diff && /* @__PURE__ */ jsxs2("div", { className: "space-y-3 font-mono text-[12px]", children: [
      (diff.places.added.length > 0 || diff.places.removed.length > 0) && /* @__PURE__ */ jsxs2("section", { className: "space-y-0.5", children: [
        /* @__PURE__ */ jsx3("div", { className: "text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Places" }),
        diff.places.added.map((p) => /* @__PURE__ */ jsxs2(Line, { kind: "added", children: [
          "+ ",
          p
        ] }, `+${p}`)),
        diff.places.removed.map((p) => /* @__PURE__ */ jsxs2(Line, { kind: "removed", children: [
          "- ",
          p
        ] }, `-${p}`))
      ] }),
      diff.transitions.length > 0 && /* @__PURE__ */ jsxs2("section", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx3("div", { className: "text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Transitions" }),
        diff.transitions.map((d) => /* @__PURE__ */ jsx3(TransitionRow, { delta: d }, d.key))
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex gap-3 text-[10px] text-[var(--beam-ink-45)]", children: [
      /* @__PURE__ */ jsxs2("span", { children: [
        /* @__PURE__ */ jsx3(Mark, { kind: "added", children: "+" }),
        " added"
      ] }),
      /* @__PURE__ */ jsxs2("span", { children: [
        /* @__PURE__ */ jsx3(Mark, { kind: "removed", children: "-" }),
        " removed"
      ] }),
      /* @__PURE__ */ jsxs2("span", { children: [
        /* @__PURE__ */ jsx3(Mark, { kind: "changed", children: "~" }),
        " changed"
      ] })
    ] })
  ] });
}
function TransitionRow({ delta }) {
  const route = `${delta.from.join(",") || "\u2205"} \u2192 ${delta.to.join(",") || "\u2205"}`;
  const sign = delta.status === "added" ? "+" : delta.status === "removed" ? "-" : "~";
  const kind = delta.status;
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsxs2(Line, { kind, children: [
      sign,
      " ",
      delta.name,
      " ",
      /* @__PURE__ */ jsx3("span", { className: "text-[var(--beam-ink-45)]", children: route })
    ] }),
    delta.guard && /* @__PURE__ */ jsxs2("div", { className: "pl-4 text-[var(--beam-ink-60)]", children: [
      "guard ",
      delta.guard.from ?? "\u2205",
      " \u2192 ",
      delta.guard.to ?? "\u2205"
    ] }),
    delta.effects && delta.effects.added.map((e) => /* @__PURE__ */ jsxs2("div", { className: "pl-4", children: [
      /* @__PURE__ */ jsx3(Mark, { kind: "added", children: "effect +" }),
      " ",
      e
    ] }, `+${e}`)),
    delta.effects && delta.effects.removed.map((e) => /* @__PURE__ */ jsxs2("div", { className: "pl-4", children: [
      /* @__PURE__ */ jsx3(Mark, { kind: "removed", children: "effect -" }),
      " ",
      e
    ] }, `-${e}`))
  ] });
}
var KIND_CLASS = {
  added: "text-[var(--beam-green)]",
  removed: "text-destructive",
  changed: "text-[var(--beam-amber)]"
};
function Line({ kind, children }) {
  return /* @__PURE__ */ jsx3("div", { className: KIND_CLASS[kind], children });
}
function Mark({ kind, children }) {
  return /* @__PURE__ */ jsx3("span", { className: KIND_CLASS[kind], children });
}

// src/RecipientPicker.tsx
import { Check, Plus, TriangleAlert, X } from "lucide-react";
import { useState as useState3 } from "react";
import { Input, Popover, PopoverContent, PopoverTrigger } from "@schemastud/ui";

// src/principals.ts
function principalRows(kinds) {
  const rows = [];
  for (const k of kinds) {
    if (k.kind === "role") {
      for (const option of k.options ?? []) {
        rows.push({ token: `role:${option.value}`, label: option.label, group: "role" });
      }
    } else {
      rows.push({ token: `${k.kind}:`, label: k.label, group: "flat" });
    }
  }
  return rows;
}
function tokenKind(token) {
  return token.split(":", 1)[0] ?? "";
}
function classifyToken(token, rows) {
  const match = rows.find((r) => r.token === token);
  return {
    token,
    label: match ? match.label : token,
    kind: tokenKind(token),
    known: Boolean(match)
  };
}
function toChips(tokens, rows) {
  return tokens.map((token) => classifyToken(token, rows));
}
function toggleToken(tokens, token) {
  return tokens.includes(token) ? tokens.filter((t) => t !== token) : [...tokens, token];
}

// src/RecipientPicker.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function RecipientPicker({
  label,
  value,
  onChange,
  kinds
}) {
  const [raw, setRaw] = useState3("");
  const rows = principalRows(kinds);
  const chips = toChips(value, rows);
  const flatRows = rows.filter((r) => r.group === "flat");
  const roleRows = rows.filter((r) => r.group === "role");
  function toggle(token) {
    onChange(toggleToken(value, token));
  }
  function addRaw() {
    const token = raw.trim();
    if (token !== "" && token.includes(":") && !value.includes(token)) {
      onChange([...value, token]);
    }
    setRaw("");
  }
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx4("span", { className: "block text-sm text-[var(--beam-ink-60)]", children: label }),
    /* @__PURE__ */ jsx4("div", { className: "*:w-full", children: /* @__PURE__ */ jsxs3(Popover, { children: [
      /* @__PURE__ */ jsx4(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs3(
        "div",
        {
          role: "button",
          tabIndex: 0,
          className: "flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-left text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
          children: [
            chips.length === 0 ? /* @__PURE__ */ jsx4("span", { className: "text-[var(--beam-ink-45)]", children: "Choose recipients\u2026" }) : chips.map((chip) => /* @__PURE__ */ jsxs3(
              "span",
              {
                className: `inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${chip.known ? "border-[var(--beam-ink-15)] bg-[var(--beam-ink-05)]" : "border-dashed border-destructive/50 bg-destructive/5"}`,
                children: [
                  !chip.known && /* @__PURE__ */ jsx4(
                    TriangleAlert,
                    {
                      className: "size-3 text-destructive",
                      "aria-label": "Undeclared token"
                    }
                  ),
                  /* @__PURE__ */ jsx4(
                    "span",
                    {
                      className: `font-mono text-[9px] tracking-[0.06em] uppercase ${chip.known ? "text-[var(--beam-ink-45)]" : "text-destructive"}`,
                      children: chip.kind
                    }
                  ),
                  chip.known ? chip.label : chip.token.slice(chip.kind.length + 1) || chip.token,
                  /* @__PURE__ */ jsx4(
                    "span",
                    {
                      role: "button",
                      tabIndex: -1,
                      "aria-label": `Remove ${chip.label}`,
                      onClick: (e) => {
                        e.stopPropagation();
                        toggle(chip.token);
                      },
                      className: "flex size-3.5 items-center justify-center rounded hover:bg-[var(--beam-ink-08)]",
                      children: /* @__PURE__ */ jsx4(X, { className: "size-2.5" })
                    }
                  )
                ]
              },
              chip.token
            )),
            /* @__PURE__ */ jsx4(Plus, { className: "ml-auto size-3.5 text-[var(--beam-ink-45)]" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs3(PopoverContent, { className: "w-64 p-1", children: [
        flatRows.map((row) => /* @__PURE__ */ jsx4(
          ChecklistRow,
          {
            label: row.label,
            selected: value.includes(row.token),
            onClick: () => toggle(row.token)
          },
          row.token
        )),
        roleRows.length > 0 && /* @__PURE__ */ jsxs3(Fragment, { children: [
          /* @__PURE__ */ jsx4("div", { className: "px-2 pt-2 pb-1 font-mono text-[9px] tracking-[0.1em] text-[var(--beam-ink-45)] uppercase", children: "By role" }),
          roleRows.map((row) => /* @__PURE__ */ jsx4(
            ChecklistRow,
            {
              label: row.label,
              selected: value.includes(row.token),
              onClick: () => toggle(row.token)
            },
            row.token
          ))
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "px-2 pt-2 pb-1 font-mono text-[9px] tracking-[0.1em] text-[var(--beam-ink-45)] uppercase", children: "Advanced" }),
        /* @__PURE__ */ jsx4("div", { className: "flex gap-1 px-1 pb-1", children: /* @__PURE__ */ jsx4(
          Input,
          {
            value: raw,
            onChange: (e) => setRaw(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRaw();
              }
            },
            placeholder: "kind:selector \u2014 e.g. team:eng",
            className: "h-7 text-xs",
            "aria-label": "Raw principal token"
          }
        ) })
      ] })
    ] }) })
  ] });
}
function ChecklistRow({
  label,
  selected,
  onClick
}) {
  return /* @__PURE__ */ jsxs3(
    "button",
    {
      type: "button",
      onClick,
      "aria-pressed": selected,
      className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--beam-ink-05)]",
      children: [
        /* @__PURE__ */ jsx4("span", { className: "flex size-3.5 items-center justify-center", children: selected && /* @__PURE__ */ jsx4(Check, { className: "size-3.5 text-[var(--beam-green)]" }) }),
        label
      ]
    }
  );
}

// src/WorkflowEditor.tsx
import { ChevronDown, Plus as Plus2, Trash2 } from "lucide-react";
import { useEffect, useMemo as useMemo3, useRef as useRef2, useState as useState4 } from "react";
import { Button, Card, CardContent, Input as Input2, Label, SimpleSelect as SimpleSelect2, Switch } from "@schemastud/ui";

// src/effectParams.ts
function effectParamsMap(transition) {
  return transition.metadata?.effect_params ?? {};
}
function effectParamsOf(transition, ref) {
  return effectParamsMap(transition)[ref] ?? {};
}
function attachEffect(transition, ref) {
  if (transition.effects.includes(ref)) return transition;
  return { ...transition, effects: [...transition.effects, ref] };
}
function detachEffect(transition, ref) {
  const map = { ...effectParamsMap(transition) };
  delete map[ref];
  return {
    ...transition,
    effects: transition.effects.filter((x) => x !== ref),
    metadata: writeEffectParamsMap(transition.metadata, map)
  };
}
function setEffectParams(transition, ref, params) {
  const map = { ...effectParamsMap(transition), [ref]: params };
  return { ...transition, metadata: writeEffectParamsMap(transition.metadata, map) };
}
function writeEffectParamsMap(metadata, map) {
  const next = { ...metadata ?? {} };
  if (Object.keys(map).length === 0) {
    delete next.effect_params;
  } else {
    next.effect_params = map;
  }
  return Object.keys(next).length === 0 ? null : next;
}
function effectHasParams(effect) {
  return Object.keys(paramProperties(effect)).length > 0;
}
function effectNeedsSetup(effect, params) {
  const props = paramProperties(effect);
  const required = effect.paramsSchema?.required ?? [];
  return required.some((key) => {
    const value = params[key] ?? props[key]?.default;
    return value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0;
  });
}
function paramProperties(effect) {
  return effect.paramsSchema?.properties ?? {};
}

// src/humanizeWorkflowKey.ts
function humanizeWorkflowKey(key) {
  const spaced = key.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// src/WorkflowEditor.tsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function WorkflowEditor({
  initial,
  guards,
  effects = [],
  principals = [],
  saving = false,
  canSave = true,
  error,
  onSave
}) {
  const [draft, setDraft] = useState4(initial);
  const [view, setView] = useState4("edit");
  const guardByName = useMemo3(() => Object.fromEntries(guards.map((g) => [g.name, g])), [guards]);
  function patch(next) {
    setDraft((d) => ({ ...d, ...next }));
  }
  function addPlace() {
    const name = `place_${draft.places.length + 1}`;
    patch({ places: [...draft.places, name] });
  }
  function renamePlace(index, value) {
    const places = draft.places.slice();
    places[index] = value;
    patch({ places });
  }
  function removePlace(index) {
    const place = draft.places[index];
    patch({
      places: draft.places.filter((_, i) => i !== index),
      initial: draft.initial.filter((p) => p !== place)
    });
  }
  function patchTransition(index, next) {
    const transitions = draft.transitions.slice();
    transitions[index] = { ...transitions[index], ...next };
    patch({ transitions });
  }
  function addTransition() {
    patch({
      transitions: [
        ...draft.transitions,
        {
          name: `transition_${draft.transitions.length + 1}`,
          from: [],
          to: [],
          guard: null,
          effects: [],
          metadata: null,
          reason: null
        }
      ]
    });
  }
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-6", children: [
    error && /* @__PURE__ */ jsx5("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: error }),
    /* @__PURE__ */ jsx5("div", { className: "flex gap-1 border-b border-[var(--beam-ink-08)]", children: ["edit", "graph"].map((tab) => /* @__PURE__ */ jsx5(
      "button",
      {
        type: "button",
        onClick: () => setView(tab),
        "aria-pressed": view === tab,
        className: `-mb-px border-b-2 px-3 py-1.5 text-sm capitalize ${view === tab ? "border-[var(--beam-green)] text-[var(--beam-ink-80)]" : "border-transparent text-[var(--beam-ink-45)] hover:text-[var(--beam-ink-60)]"}`,
        children: tab === "graph" ? "Graph" : "Edit"
      },
      tab
    )) }),
    view === "graph" && /* @__PURE__ */ jsx5(WorkflowGraph, { blueprint: draft }),
    view === "edit" && /* @__PURE__ */ jsxs4(Fragment2, { children: [
      /* @__PURE__ */ jsxs4("section", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx5("h3", { className: "font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Places" }),
          /* @__PURE__ */ jsxs4(Button, { size: "sm", variant: "ghost", onClick: addPlace, children: [
            /* @__PURE__ */ jsx5(Plus2, { className: "size-3" }),
            " Add place"
          ] })
        ] }),
        draft.places.map((place, index) => /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx5(
            Input2,
            {
              className: "flex-1",
              value: place,
              "aria-label": `Place ${index + 1} name`,
              onChange: (e) => renamePlace(index, e.target.value)
            }
          ),
          /* @__PURE__ */ jsxs4("label", { className: "flex items-center gap-1.5 text-xs text-[var(--beam-ink-50)]", children: [
            /* @__PURE__ */ jsx5(
              "input",
              {
                type: "radio",
                name: "initial",
                className: "accent-[var(--beam-green)]",
                checked: draft.initial.includes(place),
                onChange: () => patch({ initial: [place] })
              }
            ),
            "initial"
          ] }),
          /* @__PURE__ */ jsx5(
            Button,
            {
              size: "sm",
              variant: "ghost",
              "aria-label": `Remove place ${place}`,
              onClick: () => removePlace(index),
              children: /* @__PURE__ */ jsx5(Trash2, { className: "size-3" })
            }
          )
        ] }, index))
      ] }),
      /* @__PURE__ */ jsxs4("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx5("h3", { className: "font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Transitions" }),
          /* @__PURE__ */ jsxs4(Button, { size: "sm", variant: "ghost", onClick: addTransition, children: [
            /* @__PURE__ */ jsx5(Plus2, { className: "size-3" }),
            " Add transition"
          ] })
        ] }),
        draft.transitions.map((transition, index) => {
          const guard = transition.guard ? guardByName[transition.guard] : void 0;
          return /* @__PURE__ */ jsx5(Card, { children: /* @__PURE__ */ jsxs4(CardContent, { className: "space-y-3 p-3", children: [
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx5(
                Input2,
                {
                  className: "flex-1",
                  value: transition.name,
                  "aria-label": `Transition ${index + 1} name`,
                  onChange: (e) => patchTransition(index, { name: e.target.value })
                }
              ),
              /* @__PURE__ */ jsx5(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  "aria-label": `Remove transition ${transition.name}`,
                  onClick: () => patch({
                    transitions: draft.transitions.filter(
                      (_, i) => i !== index
                    )
                  }),
                  children: /* @__PURE__ */ jsx5(Trash2, { className: "size-3" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsx5(
                PlaceSelect,
                {
                  label: "From",
                  places: draft.places,
                  value: transition.from,
                  onChange: (from) => patchTransition(index, { from })
                }
              ),
              /* @__PURE__ */ jsx5(
                PlaceSelect,
                {
                  label: "To",
                  places: draft.places,
                  value: transition.to,
                  onChange: (to) => patchTransition(index, { to })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx5(Label, { className: "text-[var(--beam-ink-50)]", children: "Guard" }),
              /* @__PURE__ */ jsx5(
                SimpleSelect2,
                {
                  className: "w-64",
                  "aria-label": `Guard for transition ${transition.name}`,
                  value: transition.guard ?? "",
                  onValueChange: (value) => patchTransition(index, { guard: value || null }),
                  options: [
                    { value: "", label: "\u2014 none \u2014" },
                    ...guards.map((g) => ({
                      value: g.name,
                      label: g.label
                    }))
                  ]
                }
              )
            ] }),
            guard && /* @__PURE__ */ jsx5(
              GuardParams,
              {
                guard,
                value: transition.metadata?.guardParams ?? {},
                onChange: (guardParams) => patchTransition(index, {
                  metadata: {
                    ...transition.metadata,
                    guardParams
                  }
                })
              }
            ),
            effects.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-1.5 border-t border-[var(--beam-ink-08)] pt-2", children: [
              /* @__PURE__ */ jsx5(Label, { className: "text-[var(--beam-ink-50)]", children: "When it fires" }),
              /* @__PURE__ */ jsx5("div", { className: "flex flex-col gap-1.5", children: effects.map((e) => /* @__PURE__ */ jsx5(
                EffectRow,
                {
                  effect: e,
                  on: transition.effects.includes(e.name),
                  params: effectParamsOf(
                    transition,
                    e.name
                  ),
                  onToggle: (checked) => patchTransition(
                    index,
                    checked ? attachEffect(
                      transition,
                      e.name
                    ) : detachEffect(
                      transition,
                      e.name
                    )
                  ),
                  onParamsChange: (params) => patchTransition(
                    index,
                    setEffectParams(
                      transition,
                      e.name,
                      params
                    )
                  ),
                  principals
                },
                e.name
              )) })
            ] })
          ] }) }, index);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-end gap-3", children: [
      !canSave && /* @__PURE__ */ jsx5("span", { className: "text-xs text-[var(--beam-ink-45)]", children: "Read-only \u2014 you lack the workflow-author permission." }),
      /* @__PURE__ */ jsx5(Button, { disabled: saving || !canSave, onClick: () => onSave(draft), children: saving ? "Saving\u2026" : "Save as new version" })
    ] })
  ] });
}
function PlaceSelect({
  label,
  places,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx5(Label, { className: "text-xs text-[var(--beam-ink-50)]", children: label }),
    /* @__PURE__ */ jsx5(
      "select",
      {
        multiple: true,
        "aria-label": label,
        className: "block h-24 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        value,
        onChange: (e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value)),
        children: places.map((p) => /* @__PURE__ */ jsx5("option", { value: p, children: p }, p))
      }
    )
  ] });
}
function GuardParams({
  guard,
  value,
  onChange
}) {
  const properties = guard.paramsSchema?.properties ?? {};
  if (Object.keys(properties).length === 0) return null;
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-2 rounded-md bg-[var(--beam-ink-05)] p-3", children: [
    /* @__PURE__ */ jsxs4("div", { className: "font-mono text-[10px] tracking-[0.1em] text-[var(--beam-ink-45)] uppercase", children: [
      humanizeWorkflowKey(guard.name),
      " params"
    ] }),
    /* @__PURE__ */ jsx5(PrimitiveParamFields, { properties, value, onChange })
  ] });
}
function EffectParams({
  effect,
  value,
  onChange,
  principals
}) {
  const properties = effect.paramsSchema?.properties ?? {};
  const arrayProps = Object.entries(properties).filter(([, s]) => s.type === "array");
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-2 rounded-md border-l-2 border-[var(--beam-green)] bg-[var(--beam-ink-05)] p-3", children: [
    /* @__PURE__ */ jsxs4("div", { className: "font-mono text-[10px] tracking-[0.1em] text-[var(--beam-ink-45)] uppercase", children: [
      humanizeWorkflowKey(effect.name),
      " params"
    ] }),
    arrayProps.map(([key, schema]) => /* @__PURE__ */ jsx5(
      RecipientPicker,
      {
        label: schema.title ?? key,
        kinds: principals,
        value: Array.isArray(value[key]) ? value[key] : [],
        onChange: (next) => onChange({ ...value, [key]: next })
      },
      key
    )),
    /* @__PURE__ */ jsx5(PrimitiveParamFields, { properties, value, onChange })
  ] });
}
function EffectRow({
  effect,
  on,
  params,
  onToggle,
  onParamsChange,
  principals
}) {
  const hasParams = effectHasParams(effect);
  const [expanded, setExpanded] = useState4(false);
  const wasOn = useRef2(on);
  useEffect(() => {
    if (on && !wasOn.current) setExpanded(true);
    if (!on) setExpanded(false);
    wasOn.current = on;
  }, [on]);
  const needsSetup = on && hasParams && effectNeedsSetup(effect, params);
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx5(
        Switch,
        {
          checked: on,
          onCheckedChange: onToggle,
          "aria-label": `Attach ${effect.label}`
        }
      ),
      /* @__PURE__ */ jsx5("span", { className: "text-[var(--beam-ink-60)]", children: effect.label }),
      on && hasParams && /* @__PURE__ */ jsxs4(
        "button",
        {
          type: "button",
          onClick: () => setExpanded((e) => !e),
          "aria-expanded": expanded,
          className: "flex items-center gap-0.5 font-mono text-[10px] tracking-[0.08em] text-[var(--beam-ink-45)] uppercase hover:text-[var(--beam-ink-60)]",
          children: [
            /* @__PURE__ */ jsx5(
              ChevronDown,
              {
                className: `size-3 transition-transform ${expanded ? "" : "-rotate-90"}`
              }
            ),
            "params"
          ]
        }
      ),
      needsSetup && /* @__PURE__ */ jsx5(
        "span",
        {
          title: "A required param is still empty",
          "aria-label": "Needs setup",
          className: "size-1.5 rounded-full bg-destructive"
        }
      )
    ] }),
    on && hasParams && expanded && /* @__PURE__ */ jsx5("div", { className: "pl-8", children: /* @__PURE__ */ jsx5(
      EffectParams,
      {
        effect,
        value: params,
        onChange: onParamsChange,
        principals
      }
    ) })
  ] });
}
function PrimitiveParamFields({
  properties,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsx5(Fragment2, { children: Object.entries(properties).map(
    ([key, schema]) => schema.type === "boolean" ? /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx5(Label, { htmlFor: `param-${key}`, className: "text-[var(--beam-ink-60)]", children: schema.title ?? key }),
      /* @__PURE__ */ jsx5(
        Switch,
        {
          id: `param-${key}`,
          checked: Boolean(value[key] ?? schema.default ?? false),
          onCheckedChange: (checked) => onChange({ ...value, [key]: checked })
        }
      )
    ] }, key) : schema.type === "string" || schema.type === "number" ? /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx5(Label, { htmlFor: `param-${key}`, className: "text-[var(--beam-ink-60)]", children: schema.title ?? key }),
      /* @__PURE__ */ jsx5(
        Input2,
        {
          id: `param-${key}`,
          type: schema.type === "number" ? "number" : "text",
          value: String(value[key] ?? schema.default ?? ""),
          onChange: (e) => onChange({ ...value, [key]: e.target.value })
        }
      )
    ] }, key) : null
  ) });
}

// src/WorkflowMigrate.tsx
import { TriangleAlert as TriangleAlert2 } from "lucide-react";
import { useEffect as useEffect2, useMemo as useMemo4, useState as useState5 } from "react";
import { Button as Button2, SimpleSelect as SimpleSelect3 } from "@schemastud/ui";

// src/migratePlan.ts
function initialPlaceMap(fromPlaces, toPlaces) {
  const toSet = new Set(toPlaces);
  const map = {};
  for (const place of fromPlaces) {
    map[place] = toSet.has(place) ? place : "";
  }
  return map;
}
function mapComplete(map) {
  const values = Object.values(map);
  return values.length > 0 && values.every((target) => target !== "");
}
function resolvedMap(map) {
  return Object.fromEntries(Object.entries(map).filter(([, target]) => target !== ""));
}
function blockedHeadline(report) {
  if (report.unmappable.length === 0) return null;
  const n = report.unmappable.length;
  return `${n} record${n === 1 ? "" : "s"} blocked all ${report.total} \u2014 nothing was migrated.`;
}

// src/utils.ts
function errorMessage(error, fallback = "Something went wrong.") {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

// src/WorkflowMigrate.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function WorkflowMigrate({
  versions,
  lineageKey
}) {
  const ordered = useMemo4(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
  const [fromId, setFromId] = useState5(() => ordered[0]?.id ?? "");
  const [toId, setToId] = useState5(() => ordered.at(-1)?.id ?? "");
  const [map, setMap] = useState5({});
  const [report, setReport] = useState5(null);
  const [running, setRunning] = useState5(false);
  const { client, onError } = useWorkflowsServices();
  const notify = useNotify();
  const from = ordered.find((v) => v.id === fromId);
  const to = ordered.find((v) => v.id === toId);
  const fromDraft = useMemo4(
    () => from ? toDraft({ ...from.blueprint, name: from.blueprint.name ?? lineageKey }) : null,
    [from, lineageKey]
  );
  const toDraftBp = useMemo4(
    () => to ? toDraft({ ...to.blueprint, name: to.blueprint.name ?? lineageKey }) : null,
    [to, lineageKey]
  );
  useEffect2(() => {
    if (fromDraft && toDraftBp) {
      setMap(initialPlaceMap(fromDraft.places, toDraftBp.places));
      setReport(null);
    }
  }, [fromDraft, toDraftBp]);
  if (ordered.length < 2 || !fromDraft || !toDraftBp) return null;
  const sameVersion = fromId === toId;
  const complete = mapComplete(map);
  const blocked = report ? blockedHeadline(report) : null;
  async function run(dryRun) {
    setRunning(true);
    try {
      const data = await client.migrate(lineageKey, {
        from: fromId,
        to: toId,
        map: resolvedMap(map),
        dryRun
      });
      setReport(data);
      if (data.applied) {
        notify({
          type: "success",
          message: `Migrated ${data.migrated} record(s) onto the target version.`
        });
      } else if (dryRun && data.unmappable.length === 0) {
        notify({
          type: "success",
          message: `Dry run: ${data.migrated} record(s) would migrate.`
        });
      }
    } catch (error) {
      notify({ type: "error", message: errorMessage(error, "Migration failed") });
      onError?.(error);
    } finally {
      setRunning(false);
    }
  }
  return /* @__PURE__ */ jsxs5("div", { className: "mb-4 space-y-3 rounded-md border border-[var(--beam-amber)]/30 bg-[var(--beam-amber)]/5 p-3", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx6("span", { className: "font-mono text-[11px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Migrate records" }),
      /* @__PURE__ */ jsx6(
        SimpleSelect3,
        {
          className: "w-24",
          "aria-label": "Migrate from version",
          value: fromId,
          onValueChange: setFromId,
          options: ordered.map((v) => ({ value: v.id, label: `v${v.version}` }))
        }
      ),
      /* @__PURE__ */ jsx6("span", { className: "text-[var(--beam-ink-45)]", children: "\u2192" }),
      /* @__PURE__ */ jsx6(
        SimpleSelect3,
        {
          className: "w-24",
          "aria-label": "Migrate to version",
          value: toId,
          onValueChange: setToId,
          options: ordered.map((v) => ({ value: v.id, label: `v${v.version}` }))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs5("p", { className: "text-xs text-[var(--beam-ink-50)]", children: [
      "Re-pins records currently on the ",
      /* @__PURE__ */ jsx6("b", { children: "from" }),
      " version onto the ",
      /* @__PURE__ */ jsx6("b", { children: "to" }),
      " version. This touches only records directly on this workflow \u2014 not any ",
      /* @__PURE__ */ jsx6("code", { children: "$ref" }),
      "'d children (those are a separate cohort). The whole run is all-or-nothing."
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "grid gap-3", children: [
      /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx6("div", { className: "mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase", children: "From" }),
        /* @__PURE__ */ jsx6(WorkflowGraph, { blueprint: fromDraft })
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx6("div", { className: "mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase", children: "To" }),
        /* @__PURE__ */ jsx6(WorkflowGraph, { blueprint: toDraftBp })
      ] })
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx6("div", { className: "font-mono text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Place mapping" }),
      fromDraft.places.map((place) => /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx6("span", { className: "w-40 font-mono text-[var(--beam-ink-60)]", children: place }),
        /* @__PURE__ */ jsx6("span", { className: "text-[var(--beam-ink-45)]", children: "\u2192" }),
        /* @__PURE__ */ jsx6(
          SimpleSelect3,
          {
            className: "w-48",
            "aria-label": `Map ${place} to`,
            value: map[place] ?? "",
            onValueChange: (value) => {
              setMap((m) => ({ ...m, [place]: value }));
              setReport(null);
            },
            options: [
              { value: "", label: "\u2014 choose \u2014" },
              ...toDraftBp.places.map((p) => ({ value: p, label: p }))
            ]
          }
        )
      ] }, place))
    ] }),
    report && blocked && /* @__PURE__ */ jsxs5("div", { className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive", children: [
      /* @__PURE__ */ jsx6(TriangleAlert2, { className: "mt-0.5 size-4 shrink-0" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx6("div", { className: "font-medium", children: blocked }),
        /* @__PURE__ */ jsxs5("ul", { className: "mt-1 font-mono text-xs", children: [
          report.unmappable.slice(0, 8).map((u) => /* @__PURE__ */ jsxs5("li", { children: [
            u.id,
            " \u2014 unmapped place \u201C",
            u.place,
            "\u201D"
          ] }, u.id)),
          report.unmappable.length > 8 && /* @__PURE__ */ jsxs5("li", { children: [
            "\u2026and ",
            report.unmappable.length - 8,
            " more"
          ] })
        ] })
      ] })
    ] }),
    report && !blocked && /* @__PURE__ */ jsx6("div", { className: "rounded-md border border-[var(--beam-green)]/30 bg-[var(--beam-green)]/5 p-2 text-sm text-[var(--beam-ink-70)]", children: report.applied ? `Migrated ${report.migrated} of ${report.total} record(s).` : `Dry run: all ${report.total} record(s) map cleanly and would migrate.` }),
    /* @__PURE__ */ jsxs5("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx6(
        Button2,
        {
          variant: "outline",
          size: "sm",
          disabled: running || sameVersion || !complete,
          onClick: () => run(true),
          children: running ? "Checking\u2026" : "Preview (dry run)"
        }
      ),
      /* @__PURE__ */ jsx6(
        Button2,
        {
          size: "sm",
          disabled: running || sameVersion || !complete || !report || blocked !== null || report.applied,
          onClick: () => run(false),
          children: "Migrate records"
        }
      )
    ] })
  ] });
}

// src/WorkflowStepper.tsx
import { Loader2 } from "lucide-react";
import { useEffect as useEffect3, useRef as useRef3 } from "react";
import {
  Badge,
  Button as Button3,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn
} from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function WorkflowStepperTrack({
  places,
  current,
  badgePlaces = [],
  badgeClassName,
  trailing
}) {
  if (badgePlaces.includes(current)) {
    return /* @__PURE__ */ jsxs6(
      Badge,
      {
        variant: "outline",
        className: cn(
          "gap-1.5 font-mono text-[10.5px] tracking-[0.08em] uppercase",
          badgeClassName ?? "border-[var(--beam-amber)]/45 text-[var(--beam-amber)]"
        ),
        children: [
          /* @__PURE__ */ jsx7("span", { className: "size-1.5 rounded-full bg-[var(--beam-amber)]" }),
          humanizeWorkflowKey(current)
        ]
      }
    );
  }
  const steps = places.filter((p) => !badgePlaces.includes(p));
  const activeIndex = Math.max(0, steps.indexOf(current));
  return /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2.5", children: [
    /* @__PURE__ */ jsx7("div", { className: "flex items-center gap-1.5", "aria-label": `Lifecycle: ${current}`, children: steps.map((step, index) => {
      const isActive = index === activeIndex;
      const isPast = index < activeIndex;
      return /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxs6(
          "span",
          {
            className: cn(
              "flex items-center gap-1 rounded-[20px] border px-[9px] py-0.5 font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase",
              isActive ? "border-[var(--beam-green)]/45 text-[var(--beam-green)]" : isPast ? "border-transparent text-[var(--beam-ink-45)]" : "border-[var(--beam-ink-15)] text-[var(--beam-ink-35)]"
            ),
            children: [
              /* @__PURE__ */ jsx7(
                "span",
                {
                  className: cn(
                    "size-1.5 rounded-full",
                    isActive ? "bg-[var(--beam-green)]" : isPast ? "bg-[var(--beam-ink-45)]" : "bg-[var(--beam-ink-20)]"
                  )
                }
              ),
              step
            ]
          }
        ),
        index < steps.length - 1 && /* @__PURE__ */ jsx7("span", { className: "text-[var(--beam-ink-22)]", children: "\u2192" })
      ] }, step);
    }) }),
    trailing
  ] });
}
function WorkflowActions({
  projection,
  channel,
  onTransition,
  onStatusEmitted,
  pending = false,
  confirm = {}
}) {
  const subscribe = useSubscribe();
  const emittedRef = useRef3(onStatusEmitted);
  emittedRef.current = onStatusEmitted;
  useEffect3(() => {
    if (!channel) return;
    return subscribe(channel, ".status.emitted", () => emittedRef.current?.());
  }, [channel, subscribe]);
  const available = projection?.available ?? [];
  return /* @__PURE__ */ jsxs6(Fragment3, { children: [
    available.map((name) => {
      const cfg = confirm[name];
      return /* @__PURE__ */ jsxs6(
        Button3,
        {
          size: "sm",
          variant: "outline",
          disabled: pending,
          className: cn(
            cfg?.emphasize && "border-[var(--beam-green)] font-semibold text-[var(--beam-green)] hover:bg-[var(--beam-green)]/10 hover:text-[var(--beam-green)]"
          ),
          onClick: () => cfg?.onOpenChange ? cfg.onOpenChange(true) : onTransition(name),
          children: [
            pending && /* @__PURE__ */ jsx7(Loader2, { className: "animate-spin" }),
            cfg?.triggerLabel ?? humanizeWorkflowKey(name),
            cfg && "\u2026"
          ]
        },
        name
      );
    }),
    Object.entries(confirm).map(
      ([name, cfg]) => cfg.onOpenChange ? /* @__PURE__ */ jsx7(Dialog, { open: cfg.open ?? false, onOpenChange: cfg.onOpenChange, children: /* @__PURE__ */ jsxs6(DialogContent, { children: [
        /* @__PURE__ */ jsxs6(DialogHeader, { children: [
          /* @__PURE__ */ jsx7(DialogTitle, { children: cfg.title }),
          cfg.description && /* @__PURE__ */ jsx7(DialogDescription, { children: cfg.description })
        ] }),
        cfg.preview,
        /* @__PURE__ */ jsxs6(DialogFooter, { children: [
          /* @__PURE__ */ jsx7(
            Button3,
            {
              variant: "ghost",
              disabled: pending,
              onClick: () => cfg.onOpenChange?.(false),
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs6(Button3, { disabled: pending, onClick: () => onTransition(name), children: [
            pending && /* @__PURE__ */ jsx7(Loader2, { className: "animate-spin" }),
            cfg.confirmLabel ?? cfg.title
          ] })
        ] })
      ] }) }, name) : null
    )
  ] });
}

// src/WorkflowsAdminPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 as Trash22 } from "lucide-react";
import { useEffect as useEffect4, useMemo as useMemo5, useState as useState6 } from "react";
import {
  Button as Button4,
  Card as Card2,
  CardContent as CardContent2,
  CardHeader,
  CardTitle,
  Input as Input3,
  Label as Label2,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch as Switch2,
  cn as cn2
} from "@schemastud/ui";
import { Fragment as Fragment4, jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
function typeLabel(types, key) {
  return types.find((t) => t.key === key)?.label ?? key;
}
function WorkflowsAdminPage() {
  const qc = useQueryClient();
  const { client, onError, onSelectLineage } = useWorkflowsServices();
  const notify = useNotify();
  const [selectedKey, setSelectedKey] = useState6(null);
  const [showMigrate, setShowMigrate] = useState6(false);
  const [query, setQuery] = useState6("");
  const [scope, setScope] = useState6("all");
  const [activateOnSave, setActivateOnSave] = useState6(true);
  const lineages = useQuery({
    queryKey: ["beam-workflows", "lineages"],
    queryFn: () => client.listLineages()
  });
  const catalog = useQuery({
    queryKey: ["beam-workflows", "catalog"],
    queryFn: () => client.catalog()
  });
  const canAuthor = catalog.data?.canAuthor ?? false;
  const coverage = useQuery({
    queryKey: ["beam-workflows", "coverage", selectedKey],
    enabled: Boolean(selectedKey),
    queryFn: () => client.coverage(selectedKey)
  });
  const countByVersion = new Map((coverage.data?.versions ?? []).map((v) => [v.id, v.count]));
  const selected = lineages.data?.find((l) => l.key === selectedKey) ?? null;
  const activeVersion = selected?.versions.find((v) => v.isActive) ?? selected?.versions.at(-1);
  useEffect4(() => {
    onSelectLineage?.(selected);
  }, [selected, onSelectLineage]);
  const filteredLineages = useMemo5(() => {
    const needle = query.trim().toLowerCase();
    return (lineages.data ?? []).filter((l) => {
      if (scope === "system" && !l.isSystem) return false;
      if (scope === "custom" && l.isSystem) return false;
      if (!needle) return true;
      return l.name.toLowerCase().includes(needle) || l.key.toLowerCase().includes(needle);
    });
  }, [lineages.data, query, scope]);
  const invalidateLineages = () => qc.invalidateQueries({ queryKey: ["beam-workflows", "lineages"] });
  const save = useMutation({
    mutationFn: (blueprint) => client.saveVersion(selectedKey, blueprint, activateOnSave),
    onSuccess: () => {
      notify({ type: "success", message: "Saved a new version" });
      invalidateLineages();
    },
    onError: (error) => {
      notify({ type: "error", message: errorMessage(error, "Could not save the workflow") });
      onError?.(error);
    }
  });
  const bind = useMutation({
    mutationFn: (vars) => client.bind(vars),
    onSuccess: () => {
      notify({ type: "success", message: "Binding updated" });
      invalidateLineages();
    },
    onError: (error) => {
      notify({ type: "error", message: errorMessage(error, "Could not update the binding") });
      onError?.(error);
    }
  });
  const unbind = useMutation({
    mutationFn: (typeKey) => client.unbind(typeKey),
    onSuccess: () => {
      notify({ type: "success", message: "Type unbound \u2014 now unmanaged" });
      invalidateLineages();
    },
    onError: (error) => {
      notify({ type: "error", message: errorMessage(error, "Could not unbind the type") });
      onError?.(error);
    }
  });
  return (
    // Full-bleed (admin-redesign ticket 08): the desk shell owns the outer gutter, so the surface
    // drops its own `mx-auto max-w-5xl px-6 py-8` and spans the framed main.
    /* @__PURE__ */ jsxs7("div", { children: [
      /* @__PURE__ */ jsx8("h1", { className: "mb-1 text-xl font-semibold", children: "Workflows" }),
      /* @__PURE__ */ jsx8("p", { className: "mb-6 text-sm text-[var(--beam-ink-55)]", children: "Definition lineages, their immutable versions, and the types they govern. Editing forks a new version \u2014 objects already running stay on the version they started on." }),
      /* @__PURE__ */ jsxs7("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]", children: [
        /* @__PURE__ */ jsxs7("aside", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs7("div", { className: "mb-2 space-y-1.5", children: [
            /* @__PURE__ */ jsx8(
              Input3,
              {
                value: query,
                onChange: (e) => setQuery(e.target.value),
                placeholder: "Filter workflows\u2026",
                "aria-label": "Filter workflows",
                className: "h-8 text-sm"
              }
            ),
            /* @__PURE__ */ jsx8("div", { className: "flex gap-1", children: ["all", "system", "custom"].map((s) => /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                onClick: () => setScope(s),
                "aria-pressed": scope === s,
                className: cn2(
                  "rounded-md border px-2 py-0.5 text-[11px] capitalize",
                  scope === s ? "border-[var(--beam-green)] text-[var(--beam-green)]" : "border-[var(--beam-ink-12)] text-[var(--beam-ink-45)] hover:bg-[var(--beam-ink-03)]"
                ),
                children: s
              },
              s
            )) })
          ] }),
          lineages.isPending && /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: "Loading\u2026" }),
          !lineages.isPending && filteredLineages.length === 0 && /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: "No workflows match." }),
          filteredLineages.map((lineage) => /* @__PURE__ */ jsxs7(
            "button",
            {
              "data-lineage-key": lineage.key,
              onClick: () => setSelectedKey(lineage.key),
              className: cn2(
                "block w-full rounded-md border px-3 py-2 text-left text-sm",
                selectedKey === lineage.key ? "border-[var(--beam-green)] bg-[var(--beam-green)]/5" : "border-[var(--beam-ink-12)] hover:bg-[var(--beam-ink-03)]"
              ),
              children: [
                /* @__PURE__ */ jsx8("div", { className: "font-medium", children: lineage.name }),
                /* @__PURE__ */ jsx8("div", { className: "font-mono text-[11px] text-[var(--beam-ink-45)]", children: lineage.key }),
                /* @__PURE__ */ jsxs7("div", { className: "mt-1 flex flex-wrap gap-1 text-[10px]", children: [
                  lineage.isSystem && /* @__PURE__ */ jsx8("span", { className: "rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5 uppercase", children: "system" }),
                  /* @__PURE__ */ jsxs7("span", { className: "rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5", children: [
                    "v",
                    lineage.versions.length
                  ] }),
                  lineage.boundTypes.map((type) => /* @__PURE__ */ jsx8(
                    "span",
                    {
                      className: "rounded bg-[var(--beam-green)]/10 px-1.5 py-0.5 text-[var(--beam-green)]",
                      children: typeLabel(catalog.data?.types ?? [], type)
                    },
                    type
                  ))
                ] })
              ]
            },
            lineage.key
          ))
        ] }),
        /* @__PURE__ */ jsx8("main", { children: !selected ? /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: "Select a workflow to view its versions and edit it." }) : /* @__PURE__ */ jsxs7(Fragment4, { children: [
          /* @__PURE__ */ jsx8(
            BindingPanel,
            {
              lineage: selected,
              activeBlueprint: activeVersion?.blueprint,
              guards: catalog.data?.guards ?? [],
              types: catalog.data?.types ?? [],
              binding: bind.isPending,
              canAuthor,
              onBind: (typeKey, params) => bind.mutate({ typeKey, lineageRef: selected.key, params }),
              onUnbind: (typeKey) => unbind.mutate(typeKey)
            }
          ),
          /* @__PURE__ */ jsxs7("div", { className: "mb-4 space-y-1.5", children: [
            /* @__PURE__ */ jsx8("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: selected.versions.map((v) => {
              const count = countByVersion.get(v.id) ?? 0;
              return /* @__PURE__ */ jsxs7(
                "span",
                {
                  className: cn2(
                    "rounded-md border px-2 py-1 font-mono",
                    v.isActive ? "border-[var(--beam-green)] text-[var(--beam-green)]" : "border-[var(--beam-ink-15)] text-[var(--beam-ink-45)]"
                  ),
                  children: [
                    "v",
                    v.version,
                    v.isActive ? " \xB7 active" : "",
                    count > 0 ? ` \xB7 ${count} rec` : ""
                  ]
                },
                v.id
              );
            }) }),
            /* @__PURE__ */ jsx8("p", { className: "text-xs text-[var(--beam-ink-50)]", children: coverage.isPending ? "Checking coverage\u2026" : (coverage.data?.total ?? 0) === 0 ? "No records are running under this workflow yet." : `Governing ${coverage.data?.total} record${coverage.data?.total === 1 ? "" : "s"} (pinned on first transition).` })
          ] }),
          /* @__PURE__ */ jsx8(WorkflowDiff, { versions: selected.versions, lineageKey: selected.key }),
          selected.versions.length >= 2 && canAuthor && /* @__PURE__ */ jsxs7("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                onClick: () => setShowMigrate((s) => !s),
                "aria-expanded": showMigrate,
                className: "text-xs text-[var(--beam-amber)] hover:underline",
                children: showMigrate ? "Hide" : "Migrate records to another version\u2026"
              }
            ),
            showMigrate && /* @__PURE__ */ jsx8("div", { className: "mt-2", children: /* @__PURE__ */ jsx8(
              WorkflowMigrate,
              {
                versions: selected.versions,
                lineageKey: selected.key
              }
            ) })
          ] }),
          activeVersion && catalog.data && /* @__PURE__ */ jsxs7(Fragment4, { children: [
            canAuthor && /* @__PURE__ */ jsxs7("label", { className: "mb-3 flex items-center gap-2 text-xs text-[var(--beam-ink-60)]", children: [
              /* @__PURE__ */ jsx8(
                Switch2,
                {
                  checked: activateOnSave,
                  onCheckedChange: setActivateOnSave,
                  "aria-label": "Activate the new version on save"
                }
              ),
              "Activate on save",
              /* @__PURE__ */ jsx8("span", { className: "text-[var(--beam-ink-45)]", children: activateOnSave ? "\u2014 new subjects pin to this version" : "\u2014 fork inert; the active version is unchanged" })
            ] }),
            /* @__PURE__ */ jsx8(
              WorkflowEditor,
              {
                initial: toDraft({
                  ...activeVersion.blueprint,
                  name: activeVersion.blueprint.name ?? selected.key
                }),
                guards: catalog.data.guards,
                effects: catalog.data.effects,
                principals: catalog.data.principals,
                saving: save.isPending,
                canSave: canAuthor,
                error: save.isError ? errorMessage(save.error, "Save failed") : null,
                onSave: (blueprint) => save.mutate(blueprint)
              },
              `${selected.key}-${activeVersion.id}`
            )
          ] })
        ] }) })
      ] })
    ] })
  );
}
function BindingPanel({
  lineage,
  activeBlueprint,
  guards,
  types,
  binding,
  canAuthor,
  onBind,
  onUnbind
}) {
  const [typeKey, setTypeKey] = useState6("");
  const [params, setParams] = useState6({});
  const paramFields = (() => {
    const guardByName = Object.fromEntries(guards.map((g) => [g.name, g]));
    const used = new Set(
      (activeBlueprint?.transitions ?? []).map((t) => t.guard).filter(Boolean)
    );
    const fields = [];
    used.forEach((name) => {
      const props = guardByName[name]?.paramsSchema?.properties ?? {};
      Object.entries(props).forEach(
        ([key, schema]) => fields.push({ key, title: schema.title ?? key, type: schema.type })
      );
    });
    return fields;
  })();
  return /* @__PURE__ */ jsxs7(Card2, { className: "mb-5", children: [
    /* @__PURE__ */ jsx8(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx8(CardTitle, { className: "font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: "Governed types" }) }),
    /* @__PURE__ */ jsxs7(CardContent2, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs7("div", { className: "space-y-1.5", children: [
        lineage.boundTypes.length === 0 && /* @__PURE__ */ jsx8("p", { className: "text-sm text-[var(--beam-ink-50)]", children: "No type is governed by this workflow yet." }),
        lineage.boundTypes.map((type) => /* @__PURE__ */ jsxs7(
          "div",
          {
            className: "flex items-center justify-between rounded-md bg-[var(--beam-ink-04)] px-3 py-1.5 text-sm",
            children: [
              /* @__PURE__ */ jsxs7("span", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx8("span", { children: typeLabel(types, type) }),
                type.includes("://") && /* @__PURE__ */ jsx8("span", { className: "max-w-[260px] truncate text-[10px] text-[var(--beam-ink-45)]", children: type })
              ] }),
              /* @__PURE__ */ jsxs7(
                Button4,
                {
                  size: "sm",
                  variant: "ghost",
                  disabled: !canAuthor,
                  className: "h-auto py-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive",
                  onClick: () => onUnbind(type),
                  children: [
                    /* @__PURE__ */ jsx8(Trash22, { className: "size-3" }),
                    " Unbind (\u2192 unmanaged)"
                  ]
                }
              )
            ]
          },
          type
        ))
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "flex flex-wrap items-end gap-4 border-t border-[var(--beam-ink-08)] pt-3", children: [
        /* @__PURE__ */ jsxs7("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx8(Label2, { htmlFor: "bind-type-key", className: "text-xs text-[var(--beam-ink-50)]", children: "Type" }),
          /* @__PURE__ */ jsxs7(Select, { value: typeKey || void 0, onValueChange: setTypeKey, children: [
            /* @__PURE__ */ jsx8(
              SelectTrigger,
              {
                id: "bind-type-key",
                className: "w-64",
                "aria-label": "Type to govern",
                children: /* @__PURE__ */ jsx8(SelectValue, { placeholder: "Select a type\u2026" })
              }
            ),
            /* @__PURE__ */ jsx8(SelectContent, { children: types.filter((t) => !lineage.boundTypes.includes(t.key)).map((t) => /* @__PURE__ */ jsx8(SelectItem, { value: t.key, textValue: t.label, children: /* @__PURE__ */ jsxs7("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx8("span", { children: t.label }),
              t.key.includes("://") && /* @__PURE__ */ jsx8("span", { className: "max-w-[260px] truncate text-[10px] text-[var(--beam-ink-45)]", children: t.key })
            ] }) }, t.key)) })
          ] })
        ] }),
        paramFields.map(
          (field) => field.type === "boolean" ? /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-2 pb-2", children: [
            /* @__PURE__ */ jsx8(
              Switch2,
              {
                id: `bind-param-${field.key}`,
                checked: Boolean(params[field.key] ?? false),
                onCheckedChange: (checked) => setParams((p) => ({ ...p, [field.key]: checked }))
              }
            ),
            /* @__PURE__ */ jsx8(
              Label2,
              {
                htmlFor: `bind-param-${field.key}`,
                className: "text-sm text-[var(--beam-ink-60)]",
                children: field.title
              }
            )
          ] }, field.key) : /* @__PURE__ */ jsxs7("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx8(
              Label2,
              {
                htmlFor: `bind-param-${field.key}`,
                className: "text-xs text-[var(--beam-ink-50)]",
                children: field.title
              }
            ),
            /* @__PURE__ */ jsx8(
              Input3,
              {
                id: `bind-param-${field.key}`,
                className: "w-32",
                value: String(params[field.key] ?? ""),
                onChange: (e) => setParams((p) => ({ ...p, [field.key]: e.target.value }))
              }
            )
          ] }, field.key)
        ),
        /* @__PURE__ */ jsx8(
          Button4,
          {
            disabled: binding || typeKey.trim() === "" || !canAuthor,
            onClick: () => onBind(typeKey.trim(), params),
            children: "Bind type"
          }
        )
      ] })
    ] })
  ] });
}

// src/WorkflowActionForm.tsx
import { useId, useMemo as useMemo6, useRef as useRef4, useState as useState7 } from "react";
import { Button as Button5, Input as Input4 } from "@schemastud/ui";

// src/workflowActionTime.ts
function workflowActionInstants(local, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
  const wall = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) return [];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const wallAt = (instant) => {
    const fields = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    return Date.parse(`${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}Z`);
  };
  const offsets = /* @__PURE__ */ new Set();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = wall + hours * 36e5;
    offsets.add(wallAt(sample) - sample);
  }
  return [...offsets].map((offset) => wall - offset).filter((instant) => wallAt(instant) === wall).sort((a, b) => a - b).map((instant) => new Date(instant).toISOString());
}

// src/WorkflowActionForm.tsx
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function WorkflowActionForm({
  projection,
  subjectLabel,
  subjectPicker,
  initialTransition = "",
  initialLocalTime = "",
  initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onSchedule,
  submitLabel = "Schedule transition"
}) {
  const id = useId();
  const [transition, setTransition] = useState7(initialTransition);
  const [localTime, setLocalTime] = useState7(initialLocalTime);
  const [timezone, setTimezone] = useState7(initialTimezone);
  const [foldInstant, setFoldInstant] = useState7("");
  const [pending, setPending] = useState7(false);
  const submitting = useRef4(false);
  const [error, setError] = useState7(null);
  const names = [...new Set(projection?.transitions.map((item) => item.name) ?? [])];
  const timing = useMemo6(() => {
    try {
      return { instants: workflowActionInstants(localTime, timezone), error: null };
    } catch {
      return { instants: [], error: "Enter a valid IANA timezone, such as America/New_York." };
    }
  }, [localTime, timezone]);
  const dueAt = timing.instants.length === 1 ? timing.instants[0] : timing.instants.includes(foldInstant) ? foldInstant : "";
  const timingError = timing.error ?? (localTime && timing.instants.length === 0 ? "This local time does not exist in that timezone. Choose another time." : null);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !dueAt || !names.includes(transition)) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onSchedule({ transition, dueAt, timezone });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The transition could not be scheduled. Try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsx9("form", { onSubmit: submit, className: "space-y-4", "aria-label": "Schedule workflow transition", "aria-busy": pending, children: /* @__PURE__ */ jsxs8("fieldset", { disabled: pending, className: "space-y-4", children: [
    subjectPicker,
    subjectLabel ? /* @__PURE__ */ jsx9("p", { className: "text-sm font-medium", children: subjectLabel }) : null,
    /* @__PURE__ */ jsxs8("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx9("label", { htmlFor: `${id}-transition`, className: "text-sm font-medium", children: "Transition" }),
      /* @__PURE__ */ jsxs8(
        "select",
        {
          id: `${id}-transition`,
          value: transition,
          required: true,
          className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          onChange: (event) => setTransition(event.target.value),
          children: [
            /* @__PURE__ */ jsx9("option", { value: "", children: "Choose a transition\u2026" }),
            names.map((name) => /* @__PURE__ */ jsx9("option", { value: name, children: humanizeWorkflowKey(name) }, name))
          ]
        }
      ),
      !projection ? /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "Choose a subject with a workflow to see its transitions." }) : null,
      projection && names.length === 0 ? /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "This workflow has no transitions to schedule." }) : null,
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "The subject must pass its workflow checks when this runs. Scheduling does not approve it." }),
      transition && names.includes(transition) && !projection?.available.includes(transition) ? /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "This transition is not available from the subject\u2019s current state. It can run later if the required state and checks are satisfied." }) : null
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxs8("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx9("label", { htmlFor: `${id}-time`, className: "text-sm font-medium", children: "Date and time" }),
        /* @__PURE__ */ jsx9(
          Input4,
          {
            id: `${id}-time`,
            type: "datetime-local",
            required: true,
            value: localTime,
            "aria-describedby": timingError ? `${id}-time-error` : void 0,
            "aria-invalid": Boolean(timingError),
            onChange: (event) => {
              setLocalTime(event.target.value);
              setFoldInstant("");
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx9("label", { htmlFor: `${id}-zone`, className: "text-sm font-medium", children: "Timezone" }),
        /* @__PURE__ */ jsx9(
          Input4,
          {
            id: `${id}-zone`,
            required: true,
            value: timezone,
            placeholder: "America/New_York",
            "aria-describedby": timing.error ? `${id}-time-error` : void 0,
            "aria-invalid": Boolean(timing.error),
            onChange: (event) => {
              setTimezone(event.target.value);
              setFoldInstant("");
            }
          }
        )
      ] })
    ] }),
    timingError ? /* @__PURE__ */ jsx9("p", { id: `${id}-time-error`, role: "alert", className: "text-sm text-destructive", children: timingError }) : null,
    timing.instants.length > 1 ? /* @__PURE__ */ jsxs8("fieldset", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx9("legend", { className: "text-sm font-medium", children: "This time occurs twice. Choose which occurrence." }),
      timing.instants.map((instant) => /* @__PURE__ */ jsxs8("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx9(
          "input",
          {
            type: "radio",
            name: `${id}-fold`,
            value: instant,
            checked: foldInstant === instant,
            onChange: () => setFoldInstant(instant)
          }
        ),
        new Intl.DateTimeFormat(void 0, { timeZone: timezone, dateStyle: "medium", timeStyle: "long" }).format(new Date(instant))
      ] }, instant))
    ] }) : null,
    dueAt ? /* @__PURE__ */ jsxs8("p", { className: "text-sm text-muted-foreground", children: [
      "Scheduled instant: ",
      /* @__PURE__ */ jsx9("time", { dateTime: dueAt, children: dueAt })
    ] }) : null,
    error ? /* @__PURE__ */ jsx9("p", { role: "alert", className: "text-sm text-destructive", children: error }) : null,
    /* @__PURE__ */ jsx9(Button5, { type: "submit", disabled: pending || !dueAt || !names.includes(transition), children: pending ? "Saving\u2026" : submitLabel })
  ] }) });
}

// src/WorkflowActionDetail.tsx
import { useRef as useRef5, useState as useState8 } from "react";
import { Badge as Badge2, Button as Button6 } from "@schemastud/ui";
import { Fragment as Fragment5, jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function instantLabel(value, timezone) {
  try {
    return new Intl.DateTimeFormat(void 0, { timeZone: timezone, dateStyle: "medium", timeStyle: "long" }).format(new Date(value));
  } catch {
    return value;
  }
}
function WorkflowActionDetail({ action, subject, onCancel, onRetry, onEdit, renderResult }) {
  const [pending, setPending] = useState8(false);
  const busy = useRef5(false);
  const [error, setError] = useState8(null);
  async function run(callback) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await callback();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This action could not be updated. Refresh its details and try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const transition = typeof action.payload.transition === "string" ? humanizeWorkflowKey(action.payload.transition) : "Workflow transition";
  return /* @__PURE__ */ jsxs9("section", { className: "space-y-4", "aria-label": `${transition} schedule`, "aria-busy": pending, children: [
    /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx10("h3", { className: "text-base font-semibold", children: transition }),
      /* @__PURE__ */ jsx10(Badge2, { variant: "outline", children: humanizeWorkflowKey(action.status) })
    ] }),
    subject,
    /* @__PURE__ */ jsxs9("dl", { className: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm", children: [
      /* @__PURE__ */ jsx10("dt", { className: "text-muted-foreground", children: "Scheduled for" }),
      /* @__PURE__ */ jsx10("dd", { children: /* @__PURE__ */ jsx10("time", { dateTime: action.due_at, children: instantLabel(action.due_at, action.timezone) }) }),
      /* @__PURE__ */ jsx10("dt", { className: "text-muted-foreground", children: "Timezone" }),
      /* @__PURE__ */ jsx10("dd", { className: "break-words", children: action.timezone })
    ] }),
    action.status === "pending" ? /* @__PURE__ */ jsx10("p", { className: "text-sm text-muted-foreground", children: "Waiting to run. Workflow checks and permission will be checked again." }) : null,
    action.status === "blocked" ? /* @__PURE__ */ jsx10("p", { className: "text-sm text-muted-foreground", children: "The workflow did not advance. Resolve the blockers below, then retry explicitly." }) : null,
    action.status === "failed" ? /* @__PURE__ */ jsx10("p", { className: "text-sm text-muted-foreground", children: "The attempt failed. Review its outcome before retrying." }) : null,
    action.status === "cancelled" ? /* @__PURE__ */ jsx10("p", { className: "text-sm text-muted-foreground", children: "This schedule was cancelled." }) : null,
    /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap gap-2", children: [
      action.status === "pending" && onEdit ? /* @__PURE__ */ jsx10(Button6, { variant: "outline", disabled: pending, onClick: onEdit, children: "Reschedule" }) : null,
      action.status === "pending" && onCancel ? /* @__PURE__ */ jsx10(Button6, { variant: "outline", disabled: pending, onClick: () => void run(onCancel), children: "Cancel schedule" }) : null,
      ["blocked", "failed"].includes(action.status) && onRetry ? /* @__PURE__ */ jsx10(Button6, { disabled: pending, onClick: () => void run(onRetry), children: "Retry now" }) : null
    ] }),
    error ? /* @__PURE__ */ jsx10("p", { role: "alert", className: "text-sm text-destructive", children: error }) : null,
    /* @__PURE__ */ jsxs9("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx10("h4", { className: "text-sm font-semibold", children: "Attempt history" }),
      action.attempts.length === 0 ? /* @__PURE__ */ jsx10("p", { className: "text-sm text-muted-foreground", children: "No attempts have been recorded." }) : null,
      /* @__PURE__ */ jsx10("ol", { className: "divide-y divide-border", children: action.attempts.map((attempt) => /* @__PURE__ */ jsxs9("li", { className: "space-y-2 py-3 text-sm", children: [
        /* @__PURE__ */ jsxs9("p", { className: "font-medium", children: [
          "Attempt ",
          attempt.number,
          ": ",
          humanizeWorkflowKey(attempt.status)
        ] }),
        /* @__PURE__ */ jsxs9("dl", { className: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1", children: [
          /* @__PURE__ */ jsx10("dt", { className: "text-muted-foreground", children: "Intended" }),
          /* @__PURE__ */ jsx10("dd", { children: /* @__PURE__ */ jsx10("time", { dateTime: attempt.due_at, children: instantLabel(attempt.due_at, action.timezone) }) }),
          attempt.started_at ? /* @__PURE__ */ jsxs9(Fragment5, { children: [
            /* @__PURE__ */ jsx10("dt", { className: "text-muted-foreground", children: "Started" }),
            /* @__PURE__ */ jsx10("dd", { children: /* @__PURE__ */ jsx10("time", { dateTime: attempt.started_at, children: instantLabel(attempt.started_at, action.timezone) }) })
          ] }) : null,
          attempt.completed_at ? /* @__PURE__ */ jsxs9(Fragment5, { children: [
            /* @__PURE__ */ jsx10("dt", { className: "text-muted-foreground", children: attempt.status === "applied" ? "Applied" : "Finished" }),
            /* @__PURE__ */ jsx10("dd", { children: /* @__PURE__ */ jsx10("time", { dateTime: attempt.completed_at, children: instantLabel(attempt.completed_at, action.timezone) }) })
          ] }) : null
        ] }),
        attempt.blockers.length ? /* @__PURE__ */ jsx10("ul", { className: "list-disc space-y-1 pl-5", children: attempt.blockers.map((blocker, index) => /* @__PURE__ */ jsx10("li", { children: blocker }, index)) }) : null,
        renderResult?.(attempt.result)
      ] }, attempt.id)) })
    ] })
  ] });
}

// src/WorkflowReactionForm.tsx
import { useId as useId2, useRef as useRef6, useState as useState9 } from "react";
import { Button as Button7, Input as Input5 } from "@schemastud/ui";
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function WorkflowReactionForm({
  projection,
  subject,
  subjectPicker,
  subjectLabel,
  calendarId = null,
  initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  circuitChoices = [],
  circuitAction,
  onConfigure
}) {
  const id = useId2();
  const names = [...new Set(projection?.transitions.map((transition) => transition.name) ?? [])];
  const [source, setSource] = useState9(names.includes("publish") ? "publish" : "");
  const [target, setTarget] = useState9(names.includes("unpublish") ? "unpublish" : "");
  const [destination, setDestination] = useState9("transition");
  const [circuitId, setCircuitId] = useState9("");
  const [days, setDays] = useState9("30");
  const [timezone, setTimezone] = useState9(initialTimezone);
  const [pending, setPending] = useState9(false);
  const busy = useRef6(false);
  const [error, setError] = useState9(null);
  let validTimezone = true;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    validTimezone = false;
  }
  const calendarDays = destination === "circuit" ? 0 : Number(days);
  const validDays = destination === "circuit" || days !== "" && Number.isInteger(calendarDays) && calendarDays >= 0 && calendarDays <= 36500;
  const validDestination = destination === "transition" ? names.includes(target) : Boolean(circuitAction && circuitChoices.some((choice) => choice.id === circuitId));
  const valid = Boolean(
    subject.subject_id && subject.subject_kind && names.includes(source) && validDestination && validTimezone && validDays
  );
  async function submit(event) {
    event.preventDefault();
    if (busy.current || !valid) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const action = destination === "transition" ? {
        action_kind: "kind.workflow-transition",
        action_payload: { ...subject, transition: target }
      } : circuitAction(circuitId);
      await onConfigure({
        ...subject,
        transition: source,
        ...action,
        calendar_days: calendarDays,
        timezone,
        calendar_id: calendarId
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The follow-up could not be saved. Try again."
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsx11(
    "form",
    {
      "aria-label": "Configure workflow follow-up",
      "aria-busy": pending,
      onSubmit: submit,
      className: "space-y-4",
      children: /* @__PURE__ */ jsxs10("fieldset", { disabled: pending, className: "space-y-4", children: [
        subjectPicker,
        subjectLabel ? /* @__PURE__ */ jsx11("p", { className: "text-sm font-medium", children: subjectLabel }) : null,
        /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-source`, className: "text-sm font-medium", children: "After transition" }),
          /* @__PURE__ */ jsxs10(
            "select",
            {
              id: `${id}-source`,
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              required: true,
              value: source,
              onChange: (event) => setSource(event.target.value),
              children: [
                /* @__PURE__ */ jsx11("option", { value: "", children: "Choose a transition\u2026" }),
                names.map((name) => /* @__PURE__ */ jsx11("option", { value: name, children: humanizeWorkflowKey(name) }, name))
              ]
            }
          ),
          !projection ? /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: "Choose a subject with a workflow to configure a follow-up." }) : null
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-destination`, className: "text-sm font-medium", children: "Follow-up action" }),
          /* @__PURE__ */ jsxs10(
            "select",
            {
              id: `${id}-destination`,
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              value: destination,
              onChange: (event) => setDestination(
                event.target.value === "circuit" ? "circuit" : "transition"
              ),
              children: [
                /* @__PURE__ */ jsx11("option", { value: "transition", children: "Schedule another transition" }),
                circuitAction ? /* @__PURE__ */ jsx11("option", { value: "circuit", children: "Run a Circuit" }) : null
              ]
            }
          )
        ] }),
        destination === "transition" ? /* @__PURE__ */ jsxs10("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-target`, className: "text-sm font-medium", children: "Then transition" }),
            /* @__PURE__ */ jsxs10(
              "select",
              {
                id: `${id}-target`,
                className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                required: true,
                value: target,
                onChange: (event) => setTarget(event.target.value),
                children: [
                  /* @__PURE__ */ jsx11("option", { value: "", children: "Choose a transition\u2026" }),
                  names.map((name) => /* @__PURE__ */ jsx11("option", { value: name, children: humanizeWorkflowKey(name) }, name))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-days`, className: "text-sm font-medium", children: "Calendar days later" }),
            /* @__PURE__ */ jsx11(
              Input5,
              {
                id: `${id}-days`,
                type: "number",
                min: 0,
                max: 36500,
                step: 1,
                required: true,
                value: days,
                "aria-invalid": !validDays,
                onChange: (event) => setDays(event.target.value)
              }
            ),
            !validDays ? /* @__PURE__ */ jsx11("p", { role: "alert", className: "text-sm text-destructive", children: "Enter a whole number from 0 to 36500." }) : null
          ] })
        ] }) : /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-circuit`, className: "text-sm font-medium", children: "Circuit" }),
          /* @__PURE__ */ jsxs10(
            "select",
            {
              id: `${id}-circuit`,
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              required: true,
              value: circuitId,
              onChange: (event) => setCircuitId(event.target.value),
              children: [
                /* @__PURE__ */ jsx11("option", { value: "", children: "Choose a Circuit\u2026" }),
                circuitChoices.map((choice) => /* @__PURE__ */ jsx11("option", { value: choice.id, children: choice.label }, choice.id))
              ]
            }
          ),
          !circuitChoices.length ? /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: "No Circuits are available. Create a Circuit or choose another follow-up action." }) : null
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx11("label", { htmlFor: `${id}-timezone`, className: "text-sm font-medium", children: "Follow-up timezone" }),
          /* @__PURE__ */ jsx11(
            Input5,
            {
              id: `${id}-timezone`,
              required: true,
              value: timezone,
              "aria-invalid": !validTimezone,
              onChange: (event) => setTimezone(event.target.value)
            }
          ),
          !validTimezone ? /* @__PURE__ */ jsx11("p", { role: "alert", className: "text-sm text-destructive", children: "Enter an IANA timezone, such as America/New_York." }) : null
        ] }),
        /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: "Timing starts from the actual successful transition. A delayed or refused transition never creates an early follow-up." }),
        destination === "transition" ? /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: "Calendar days preserve local time. A missing hour moves forward; a repeated hour uses its first occurrence. A newer matching transition replaces a pending follow-up unless you have manually changed it." }) : /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: "The Circuit is requested after the transition commits. Its execution permission and outcome are checked separately." }),
        error ? /* @__PURE__ */ jsx11("p", { role: "alert", className: "text-sm text-destructive", children: error }) : null,
        /* @__PURE__ */ jsx11(Button7, { type: "submit", disabled: !valid || pending, children: pending ? "Saving\u2026" : "Add follow-up" })
      ] })
    }
  );
}

// src/WorkflowReactionHistory.tsx
import { useRef as useRef7, useState as useState10 } from "react";
import { Badge as Badge3, Button as Button8 } from "@schemastud/ui";
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
function WorkflowReactionHistory(props) {
  return /* @__PURE__ */ jsxs11("section", { "aria-label": "Workflow follow-up history", className: "space-y-4", children: [
    /* @__PURE__ */ jsx12("h3", { className: "text-base font-semibold", children: "Configured follow-ups" }),
    !props.reactions.length ? /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: "No follow-ups are configured for this subject." }) : null,
    props.reactions.map((reaction) => /* @__PURE__ */ jsx12(ReactionHistory, { ...props, reaction }, reaction.id))
  ] });
}
function ReactionHistory({
  reaction,
  onDisable,
  onRetry,
  renderActionLink,
  renderTransitionLink,
  renderDelivery,
  describeAction
}) {
  const [pending, setPending] = useState10(false);
  const [error, setError] = useState10(null);
  const busy = useRef7(false);
  async function run(callback) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await callback();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The follow-up could not be updated. Refresh and try again."
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const configuration = reaction.configuration;
  const transition = typeof configuration.action_payload.transition === "string" ? configuration.action_payload.transition : null;
  const actionLabel = describeAction?.(configuration) ?? (transition ? humanizeWorkflowKey(transition) : "Configured action");
  function anchorLabel(value) {
    try {
      return new Intl.DateTimeFormat(void 0, {
        timeZone: configuration.timezone,
        dateStyle: "medium",
        timeStyle: "long"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }
  return /* @__PURE__ */ jsxs11("article", { className: "space-y-3 rounded-lg border border-border p-4", "aria-busy": pending, children: [
    /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs11("h4", { className: "text-sm font-semibold", children: [
        "After ",
        humanizeWorkflowKey(configuration.transition),
        " \u2192 ",
        actionLabel
      ] }),
      /* @__PURE__ */ jsx12(Badge3, { variant: "outline", children: reaction.enabled ? "Enabled" : "Disabled" })
    ] }),
    /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
      configuration.calendar_days === 0 ? "After the transition commits" : `${configuration.calendar_days} calendar days later`,
      " ",
      "\xB7 ",
      configuration.timezone
    ] }),
    reaction.enabled && onDisable ? /* @__PURE__ */ jsx12(
      Button8,
      {
        variant: "outline",
        disabled: pending,
        onClick: () => void run(
          () => onDisable({
            id: reaction.id,
            expected_revision: reaction.revision
          })
        ),
        children: "Disable follow-up"
      }
    ) : null,
    /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: "Disabling stops future captures. Existing deliveries and action history remain." }),
    !reaction.deliveries.length ? /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: reaction.enabled ? "Waiting for a successful transition." : "No deliveries were captured." }) : null,
    /* @__PURE__ */ jsx12("ol", { className: "divide-y divide-border", children: reaction.deliveries.map((delivery) => /* @__PURE__ */ jsxs11("li", { className: "space-y-2 py-3 text-sm", children: [
      /* @__PURE__ */ jsxs11("p", { className: "font-medium", children: [
        "Delivery: ",
        humanizeWorkflowKey(delivery.status)
      ] }),
      /* @__PURE__ */ jsxs11("p", { children: [
        "Anchored to",
        " ",
        /* @__PURE__ */ jsx12("time", { dateTime: delivery.anchored_at, children: anchorLabel(delivery.anchored_at) })
      ] }),
      delivery.status === "scheduled" ? /* @__PURE__ */ jsx12("p", { className: "text-muted-foreground", children: "The action is scheduled. Open its outcome to inspect execution." }) : null,
      delivery.status === "superseded" ? /* @__PURE__ */ jsx12("p", { className: "text-muted-foreground", children: "A newer transition replaced this pending follow-up." }) : null,
      delivery.blockers.length ? /* @__PURE__ */ jsx12("ul", { className: "list-disc space-y-1 pl-5", children: delivery.blockers.map((blocker, index) => /* @__PURE__ */ jsx12("li", { children: blocker }, index)) }) : null,
      /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap gap-3", children: [
        renderTransitionLink?.(delivery.transition_id, {
          subject_kind: configuration.subject_kind,
          subject_id: configuration.subject_id
        }),
        delivery.action_id ? renderActionLink?.(delivery.action_id) : null
      ] }),
      renderDelivery?.(delivery),
      ["blocked", "failed"].includes(delivery.status) && onRetry ? /* @__PURE__ */ jsx12(
        Button8,
        {
          disabled: pending,
          onClick: () => void run(
            () => onRetry({
              id: delivery.id,
              expected_attempts: delivery.attempts
            })
          ),
          children: "Retry delivery"
        }
      ) : null
    ] }, delivery.id)) }),
    error ? /* @__PURE__ */ jsx12("p", { role: "alert", className: "text-sm text-destructive", children: error }) : null
  ] });
}
export {
  RecipientPicker,
  WorkflowActionDetail,
  WorkflowActionForm,
  WorkflowActions,
  WorkflowDiff,
  WorkflowEditor,
  WorkflowGraph,
  WorkflowMigrate,
  WorkflowReactionForm,
  WorkflowReactionHistory,
  WorkflowStepperTrack,
  WorkflowsAdminPage,
  WorkflowsProvider,
  attachEffect,
  blockedHeadline,
  classifyToken,
  detachEffect,
  diffBlueprints,
  effectHasParams,
  effectNeedsSetup,
  effectParamsMap,
  effectParamsOf,
  humanizeWorkflowKey,
  initialPlaceMap,
  isEmptyDiff,
  layoutBlueprint,
  mapComplete,
  principalRows,
  rankPlaces,
  resolvedMap,
  setEffectParams,
  toChips,
  toDraft,
  toggleToken,
  tokenKind,
  useNotify,
  useSubscribe,
  useWorkflowsServices,
  workflowActionInstants
};
//# sourceMappingURL=index.js.map