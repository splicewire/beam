import {
  ThemeEditor,
  UxBuilderProvider
} from "./chunk-JDVYJNNB.js";
import "./chunk-SR6UINVU.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";

// src/entries/EntriesSeat.tsx
import { EditShell, ListShell } from "@schemastud/frame";
import { Button as Button2 } from "@schemastud/ui";
import { useId, useState as useState2 } from "react";

// src/entries/EntryWorkflow.tsx
import { Button } from "@schemastud/ui";
import {
  WorkflowActions,
  WorkflowStepperTrack,
  WorkflowsProvider,
  useWorkflowsServices
} from "@splicewire/beam-workflows";
import { useCallback, useEffect, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function EntryWorkflow({ entryId, binding }) {
  return /* @__PURE__ */ jsx(WorkflowsProvider, { services: binding.services, children: /* @__PURE__ */ jsx(EntryWorkflowState, { entryId, kind: binding.kind, queue: binding.queue }) });
}
function EntryWorkflowState({ entryId, kind, queue }) {
  const { client } = useWorkflowsServices();
  const [projection, setProjection] = useState(void 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setProjection(void 0);
    client.projection(kind, entryId).then((p) => !cancelled && setProjection(p)).catch((e) => !cancelled && setError(message(e, "load")));
    return () => {
      cancelled = true;
    };
  }, [client, kind, entryId, retry]);
  const onTransition = useCallback(
    async (name) => {
      setPending(true);
      setError(null);
      try {
        setProjection(await client.transition(kind, entryId, name));
      } catch (e) {
        setError(message(e, "transition"));
      } finally {
        setPending(false);
      }
    },
    [client, kind, entryId]
  );
  if (projection === void 0 && !error) {
    return /* @__PURE__ */ jsx("p", { role: "status", "aria-busy": "true", className: "text-sm text-muted-foreground", children: "Loading workflow state\u2026" });
  }
  if (projection === null) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This entry has no publish workflow." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", "aria-busy": pending, children: [
    queue && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: queue }),
    error && /* @__PURE__ */ jsxs("div", { role: "alert", className: "space-y-3 text-sm", children: [
      /* @__PURE__ */ jsx("p", { className: "text-destructive", children: error }),
      projection === void 0 && /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setRetry((value) => value + 1), children: "Try again" })
    ] }),
    projection && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(WorkflowStepperTrack, { places: projection.places, current: projection.current }),
      /* @__PURE__ */ jsx(
        WorkflowActions,
        {
          projection,
          channel: null,
          onTransition: (name) => void onTransition(name),
          pending
        }
      )
    ] })
  ] });
}
function message(e, what) {
  const detail = e instanceof Error ? e.message : String(e);
  return what === "load" ? `Could not load the workflow state (${detail}).` : `The transition did not apply: ${detail}`;
}

// src/entries/EntriesSeat.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var ENTRY_RESOURCE = "beam-ux-entry";
var PassthroughContainer = ({ children }) => /* @__PURE__ */ jsx2(Fragment2, { children });
function EntriesSeat({
  manifest,
  form,
  client,
  workflow,
  rowActions,
  notice,
  listSlots,
  editSlots,
  chrome,
  index,
  onEditorClose
}) {
  const can = manifest?.can;
  const [editing, setEditing] = useState2(null);
  const Panel = chrome?.Panel ?? InlinePanel;
  const Tabs = chrome?.Tabs ?? InlineTabs;
  const close = () => {
    setEditing(null);
    onEditorClose?.();
  };
  const open = (entry) => setEditing(
    entry.type === "theme" ? { mode: "theme", id: entry.id, slug: entry.slug ?? entry.id } : { mode: "edit", id: entry.id }
  );
  const shellSlots = { ...editSlots, Container: PassthroughContainer };
  const title = editing?.mode === "new" ? "New entry" : editing?.mode === "theme" ? `Theme \u2014 ${editing.slug}` : "Edit entry";
  const content = (id) => /* @__PURE__ */ jsx2(
    EditShell,
    {
      resource: ENTRY_RESOURCE,
      id,
      readOnly: can?.update !== true,
      container: "panel",
      form,
      onSaved: close,
      onCancel: close,
      slots: shellSlots
    }
  );
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("h1", { className: "text-2xl font-semibold", children: "Entries" }),
        /* @__PURE__ */ jsx2("p", { className: "mt-1 text-sm text-muted-foreground", children: "Every page, component and theme of this site." })
      ] }),
      can?.create && /* @__PURE__ */ jsx2(Button2, { type: "button", onClick: () => setEditing({ mode: "new" }), children: "New entry" })
    ] }),
    notice && /* @__PURE__ */ jsx2("p", { role: "status", className: "rounded-md border px-4 py-3 text-sm", children: notice }),
    index ? index({ open }) : /* @__PURE__ */ jsx2(
      ListShell,
      {
        resource: ENTRY_RESOURCE,
        columns: [],
        manifest,
        onOpen: (record) => open({ id: String(record.id), type: String(record.type), slug: String(record.slug) }),
        slots: {
          ...listSlots,
          // The heading's "New entry" opens the create panel; the toolbar's own create button would be a second one.
          Toolbar: () => null,
          ...rowActions ? { RowActions: rowActions } : {}
        }
      }
    ),
    /* @__PURE__ */ jsxs2(Panel, { open: editing !== null, onOpenChange: (open2) => !open2 ? close() : void 0, title, children: [
      editing?.mode === "theme" && /* @__PURE__ */ jsx2(UxBuilderProvider, { services: { client }, children: /* @__PURE__ */ jsx2(ThemeEditor, { entryId: editing.id }) }),
      editing?.mode === "new" && /* @__PURE__ */ jsx2(
        EditShell,
        {
          resource: ENTRY_RESOURCE,
          id: null,
          container: "panel",
          form,
          onSaved: close,
          onCancel: close,
          slots: shellSlots
        }
      ),
      editing?.mode === "edit" && // An entry's history is the editor dock's Versions panel (restore makes a draft), so there is no Versions tab.
      (workflow ? /* @__PURE__ */ jsx2(
        Tabs,
        {
          tabs: [
            { value: "content", label: "Content", content: content(editing.id) },
            { value: "workflow", label: "Workflow", content: /* @__PURE__ */ jsx2(EntryWorkflow, { entryId: editing.id, binding: workflow }) }
          ]
        }
      ) : content(editing.id))
    ] })
  ] });
}
function InlinePanel({ open, onOpenChange, title, children }) {
  if (!open) {
    return null;
  }
  return /* @__PURE__ */ jsxs2("section", { "aria-label": title, className: "space-y-4 rounded-md border p-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx2("h2", { className: "text-lg font-semibold", children: title }),
      /* @__PURE__ */ jsx2(Button2, { type: "button", variant: "ghost", size: "sm", onClick: () => onOpenChange(false), children: "Close" })
    ] }),
    children
  ] });
}
function InlineTabs({ tabs }) {
  const [active, setActive] = useState2(tabs[0]?.value);
  const id = useId();
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx2("div", { role: "tablist", className: "flex gap-2", children: tabs.map((tab) => /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        role: "tab",
        id: `${id}-${tab.value}-tab`,
        "aria-selected": tab.value === active,
        "aria-controls": `${id}-${tab.value}`,
        className: tab.value === active ? "font-semibold underline underline-offset-4" : "text-muted-foreground",
        onClick: () => setActive(tab.value),
        children: tab.label
      },
      tab.value
    )) }),
    tabs.filter((tab) => tab.value === active).map((tab) => /* @__PURE__ */ jsx2("div", { role: "tabpanel", id: `${id}-${tab.value}`, "aria-labelledby": `${id}-${tab.value}-tab`, children: tab.content }, tab.value))
  ] });
}
export {
  ENTRY_RESOURCE,
  EntriesSeat,
  EntryWorkflow
};
//# sourceMappingURL=entries.js.map