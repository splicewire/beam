// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var TransformsServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[transforms] ${event.message}`);
  else console.info(`[transforms] ${event.message}`);
}
function TransformsProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(TransformsServicesContext.Provider, { value: services, children });
}
function useTransformsServices() {
  const services = useContext(TransformsServicesContext);
  if (!services) {
    throw new Error("Transforms components must be rendered inside a <TransformsProvider>.");
  }
  return services;
}
function useNotify() {
  return useTransformsServices().notify ?? consoleNotify;
}
function useTransformsCan() {
  const can = useTransformsServices().can;
  return { create: can?.create ?? true, update: can?.update ?? true, delete: can?.delete ?? true };
}

// src/runner-transform-editor.tsx
import { useState } from "react";
import { Badge } from "@schemastud/ui";
import { Button } from "@schemastud/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@schemastud/ui";
import { Input } from "@schemastud/ui";
import { Label } from "@schemastud/ui";
import { Textarea } from "@schemastud/ui";

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
var KEY = ["beam-transforms"];
function useTransforms() {
  const { client } = useTransformsServices();
  return useQuery({ queryKey: KEY, queryFn: () => client.list() });
}
function useCreateTransform() {
  const { client, onError } = useTransformsServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => onError?.(err)
  });
}
function useUpdateTransform(id) {
  const { client, onError } = useTransformsServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => onError?.(err)
  });
}
function useDeleteTransform() {
  const { client, onError } = useTransformsServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => onError?.(err)
  });
}
function useTestTransform(id) {
  const { client, onError } = useTransformsServices();
  return useMutation({
    mutationFn: (input) => client.test(id, input),
    onError: (err) => onError?.(err)
  });
}

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";

// messages.default.json
var messages_default_default = {
  version: 1,
  package: "@splicewire/beam-transforms",
  sourceLocale: "en",
  namespace: "splicewire-beam-transforms",
  sharesWith: null,
  messages: {
    "splicewire-beam-transforms::messages.choose": "Choose a transform to view and test it.",
    "splicewire-beam-transforms::messages.code_placeholder": "// read { input, grant } on stdin; write one JSON object on stdout",
    "splicewire-beam-transforms::messages.delete": "Delete",
    "splicewire-beam-transforms::messages.disabled": "disabled",
    "splicewire-beam-transforms::messages.empty": "No transforms yet",
    "splicewire-beam-transforms::messages.empty_hint": "Write your first one in the editor, then save it to list it here.",
    "splicewire-beam-transforms::messages.field_code": "Code",
    "splicewire-beam-transforms::messages.field_name": "Name",
    "splicewire-beam-transforms::messages.field_net": "Requested network",
    "splicewire-beam-transforms::messages.field_runtime": "Runtime",
    "splicewire-beam-transforms::messages.field_sample": "Test \u2014 sample input",
    "splicewire-beam-transforms::messages.field_visibility": "Sharing",
    "splicewire-beam-transforms::messages.forbidden": "You do not have access to transforms.",
    "splicewire-beam-transforms::messages.grant_denied": "denied: :axis",
    "splicewire-beam-transforms::messages.grant_effective": "effective net: :net",
    "splicewire-beam-transforms::messages.grant_requested": "requested net: :net",
    "splicewire-beam-transforms::messages.grant_title": "Effective grant (= requested \u2229 policy)",
    "splicewire-beam-transforms::messages.intro": "Sandboxed, user-authored transforms of another tool \u2014 code that runs deny-by-default in a scoped sandbox.",
    "splicewire-beam-transforms::messages.load_failed": "Could not load transforms.",
    "splicewire-beam-transforms::messages.loading": "Loading\u2026",
    "splicewire-beam-transforms::messages.net": "net: :net",
    "splicewire-beam-transforms::messages.net_none": "none",
    "splicewire-beam-transforms::messages.net_open": "open",
    "splicewire-beam-transforms::messages.net_scoped": "scoped",
    "splicewire-beam-transforms::messages.new": "New",
    "splicewire-beam-transforms::messages.pane_details": "Transform details",
    "splicewire-beam-transforms::messages.pane_edit": "Edit transform",
    "splicewire-beam-transforms::messages.pane_new": "New transform",
    "splicewire-beam-transforms::messages.read_only": "You can view and test transforms, but not change them.",
    "splicewire-beam-transforms::messages.request_review_save": "Request review & save",
    "splicewire-beam-transforms::messages.retry": "Retry",
    "splicewire-beam-transforms::messages.review_required": "Review required \u2014 :open and :platform publishing are trust-gated (effective grant floors to deny-by-default until approved).",
    "splicewire-beam-transforms::messages.run": "Run",
    "splicewire-beam-transforms::messages.runtime_javy": "JavaScript (sandboxed, default)",
    "splicewire-beam-transforms::messages.runtime_node": "Node.js (full runtime)",
    "splicewire-beam-transforms::messages.runtime_python": "Python (full runtime)",
    "splicewire-beam-transforms::messages.runtime_python_wasi": "Python (sandboxed, pure Python)",
    "splicewire-beam-transforms::messages.sample_invalid": "Sample input is not valid JSON.",
    "splicewire-beam-transforms::messages.save": "Save",
    "splicewire-beam-transforms::messages.save_failed": "Could not save the transform.",
    "splicewire-beam-transforms::messages.saved": 'Transform ":name" saved.',
    "splicewire-beam-transforms::messages.test_wall_ms": ":wallms",
    "splicewire-beam-transforms::messages.title": "Transforms",
    "splicewire-beam-transforms::messages.unsandboxed": "unsandboxed",
    "splicewire-beam-transforms::messages.visibility_platform": "platform",
    "splicewire-beam-transforms::messages.visibility_private": "private",
    "splicewire-beam-transforms::messages.visibility_tenant": "tenant"
  }
};

// src/messages.ts
var englishBeamTransformsMessages = createMessages(messages_default_default.messages);
var useBeamTransformsMessages = () => useMessages(messages_default_default.messages);

// src/rich-message.tsx
import { Fragment } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
function richMessage(messages, key, parts) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  const occurrences = /* @__PURE__ */ new Map();
  return messages.t(key, parameters).split(/(￼\d+￼)/u).map((part, index) => {
    const match = /^￼(\d+)￼$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx2(Fragment, { children: match ? values[Number(match[1])] : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

// src/runner-transform-editor.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var RUNTIMES = [
  { id: "javy", labelKey: "splicewire-beam-transforms::messages.runtime_javy" },
  { id: "python-wasi", labelKey: "splicewire-beam-transforms::messages.runtime_python_wasi" },
  { id: "node", labelKey: "splicewire-beam-transforms::messages.runtime_node" },
  { id: "python", labelKey: "splicewire-beam-transforms::messages.runtime_python" }
];
var NET = [
  { value: "none", labelKey: "splicewire-beam-transforms::messages.net_none" },
  { value: "scoped", labelKey: "splicewire-beam-transforms::messages.net_scoped" },
  { value: "open", labelKey: "splicewire-beam-transforms::messages.net_open" }
];
var VISIBILITY = [
  { value: "private", labelKey: "splicewire-beam-transforms::messages.visibility_private" },
  { value: "tenant", labelKey: "splicewire-beam-transforms::messages.visibility_tenant" },
  { value: "platform", labelKey: "splicewire-beam-transforms::messages.visibility_platform" }
];
function optionLabel(m, options, value) {
  const option = options.find((o) => o.value === value);
  return option ? m.t(option.labelKey) : value;
}
var BLANK = { name: "", runtime: "javy", code: "", requestedNet: "none", visibility: "private" };
var selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
function transformReadStatus(error) {
  if (error === null || typeof error !== "object") return null;
  const response = "response" in error ? error.response : null;
  if (response !== null && typeof response === "object" && "status" in response && typeof response.status === "number") {
    return response.status;
  }
  return "status" in error && typeof error.status === "number" ? error.status : null;
}
function RunnerTransformEditor() {
  const m = useBeamTransformsMessages();
  const query = useTransforms();
  const transforms = query.isSuccess ? query.data : [];
  const status = transformReadStatus(query.error);
  const forbidden = query.isError && (status === 401 || status === 403);
  const retryable = status === null || status >= 500;
  const pageState = query.isPending ? "loading" : query.isError ? forbidden ? "forbidden" : "error" : transforms.length === 0 ? "empty" : "ready";
  const { renderHeaderExtra } = useTransformsServices();
  const can = useTransformsCan();
  const readOnly = !can.create && !can.update && !can.delete;
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const selected = transforms.find((t) => t.id === selectedId) ?? null;
  function edit(t) {
    setSelectedId(t.id);
    setDraft({
      name: t.name,
      runtime: t.runtime,
      code: t.code,
      requestedNet: String(t.requestedGrant.net ?? "none"),
      visibility: t.visibility ?? "private"
    });
  }
  return /* @__PURE__ */ jsxs("div", { "data-page-state": pageState, className: "grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]", children: [
    /* @__PURE__ */ jsxs("aside", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx3("h1", { className: "text-lg font-semibold", children: m.t("splicewire-beam-transforms::messages.title") }),
        query.isSuccess && can.create && /* @__PURE__ */ jsx3(
          Button,
          {
            size: "sm",
            onClick: () => {
              setSelectedId(null);
              setDraft(BLANK);
            },
            children: m.t("splicewire-beam-transforms::messages.new")
          }
        )
      ] }),
      /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.intro") }),
      readOnly && /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.read_only") }),
      query.isPending && /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.loading") }),
      query.isError && /* @__PURE__ */ jsxs("div", { role: "alert", className: "space-y-2 rounded-md border p-4 text-sm", children: [
        /* @__PURE__ */ jsx3("p", { children: forbidden ? m.t("splicewire-beam-transforms::messages.forbidden") : m.t("splicewire-beam-transforms::messages.load_failed") }),
        !forbidden && retryable && /* @__PURE__ */ jsx3(
          Button,
          {
            size: "sm",
            variant: "outline",
            disabled: query.isFetching,
            onClick: () => void query.refetch(),
            children: m.t("splicewire-beam-transforms::messages.retry")
          }
        )
      ] }),
      query.isSuccess && transforms.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-4 text-sm", children: [
        /* @__PURE__ */ jsx3("p", { className: "font-medium", children: m.t("splicewire-beam-transforms::messages.empty") }),
        can.create && /* @__PURE__ */ jsx3("p", { className: "mt-1 text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.empty_hint") })
      ] }),
      /* @__PURE__ */ jsx3("ul", { className: "space-y-2", children: transforms.map((t) => /* @__PURE__ */ jsx3("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => edit(t),
          className: `w-full rounded-md border p-3 text-left hover:bg-accent ${t.id === selectedId ? "border-primary" : "border-border"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx3("span", { className: "font-medium", children: t.name }),
              /* @__PURE__ */ jsx3(Badge, { variant: "secondary", children: t.runtime })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-transforms::messages.net", { net: optionLabel(m, NET, String(t.effectiveGrant.net ?? "none")) }) }),
              t.visibility && /* @__PURE__ */ jsxs("span", { children: [
                "\xB7 ",
                optionLabel(m, VISIBILITY, t.visibility)
              ] }),
              !t.enabled && /* @__PURE__ */ jsxs("span", { children: [
                "\xB7 ",
                m.t("splicewire-beam-transforms::messages.disabled")
              ] })
            ] })
          ]
        }
      ) }, t.id)) })
    ] }),
    query.isSuccess && (selected || can.create ? /* @__PURE__ */ jsx3(
      TransformEditorPane,
      {
        transform: selected,
        draft,
        setDraft,
        onSaved: (t) => setSelectedId(t.id),
        headerExtra: renderHeaderExtra?.(selected) ?? null
      },
      selectedId ?? "new"
    ) : /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.choose") }))
  ] });
}
function TransformEditorPane({
  transform,
  draft,
  setDraft,
  onSaved,
  headerExtra
}) {
  const m = useBeamTransformsMessages();
  const notify = useNotify();
  const can = useTransformsCan();
  const editable = transform ? can.update : can.create;
  const create = useCreateTransform();
  const update = useUpdateTransform(transform?.id ?? "");
  const remove = useDeleteTransform();
  const test = useTestTransform(transform?.id ?? "");
  const [sampleInput, setSampleInput] = useState('{\n  "name": "world"\n}');
  const [result, setResult] = useState(null);
  const needsReview = draft.requestedNet === "open" || draft.visibility === "platform";
  async function save() {
    const body = {
      name: draft.name,
      runtime: draft.runtime,
      code: draft.code,
      requestedGrant: { net: draft.requestedNet },
      visibility: draft.visibility
    };
    try {
      const saved = transform ? await update.mutateAsync(body) : await create.mutateAsync(body);
      onSaved(saved);
      notify({ type: "success", message: m.t("splicewire-beam-transforms::messages.saved", { name: saved.name }) });
    } catch {
      notify({ type: "error", message: m.t("splicewire-beam-transforms::messages.save_failed") });
    }
  }
  async function runTest() {
    if (!transform) return;
    try {
      setResult(await test.mutateAsync(JSON.parse(sampleInput || "{}")));
    } catch {
      setResult(null);
      notify({ type: "error", message: m.t("splicewire-beam-transforms::messages.sample_invalid") });
    }
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsx3(CardTitle, { children: !transform ? m.t("splicewire-beam-transforms::messages.pane_new") : editable ? m.t("splicewire-beam-transforms::messages.pane_edit") : m.t("splicewire-beam-transforms::messages.pane_details") }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        headerExtra,
        transform && can.delete && /* @__PURE__ */ jsx3(Button, { variant: "destructive", size: "sm", onClick: () => remove.mutate(transform.id), children: m.t("splicewire-beam-transforms::messages.delete") }),
        editable && /* @__PURE__ */ jsx3(Button, { size: "sm", onClick: save, disabled: !draft.name || !draft.code, children: needsReview ? m.t("splicewire-beam-transforms::messages.request_review_save") : m.t("splicewire-beam-transforms::messages.save") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-name", children: m.t("splicewire-beam-transforms::messages.field_name") }),
          /* @__PURE__ */ jsx3(
            Input,
            {
              id: "rt-name",
              readOnly: !editable,
              value: draft.name,
              onChange: (e) => setDraft({ ...draft, name: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-runtime", children: m.t("splicewire-beam-transforms::messages.field_runtime") }),
          /* @__PURE__ */ jsx3(
            "select",
            {
              id: "rt-runtime",
              className: selectClass,
              disabled: !editable,
              value: draft.runtime,
              onChange: (e) => setDraft({ ...draft, runtime: e.target.value }),
              children: RUNTIMES.map((r) => /* @__PURE__ */ jsx3("option", { value: r.id, children: m.t(r.labelKey) }, r.id))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-code", children: m.t("splicewire-beam-transforms::messages.field_code") }),
        /* @__PURE__ */ jsx3(
          Textarea,
          {
            id: "rt-code",
            className: "h-64 font-mono text-xs",
            readOnly: !editable,
            value: draft.code,
            onChange: (e) => setDraft({ ...draft, code: e.target.value }),
            placeholder: m.t("splicewire-beam-transforms::messages.code_placeholder")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-net", children: m.t("splicewire-beam-transforms::messages.field_net") }),
          /* @__PURE__ */ jsx3(
            "select",
            {
              id: "rt-net",
              className: selectClass,
              disabled: !editable,
              value: draft.requestedNet,
              onChange: (e) => setDraft({ ...draft, requestedNet: e.target.value }),
              children: NET.map((n) => /* @__PURE__ */ jsx3("option", { value: n.value, children: m.t(n.labelKey) }, n.value))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-visibility", children: m.t("splicewire-beam-transforms::messages.field_visibility") }),
          /* @__PURE__ */ jsx3(
            "select",
            {
              id: "rt-visibility",
              className: selectClass,
              disabled: !editable,
              value: draft.visibility,
              onChange: (e) => setDraft({ ...draft, visibility: e.target.value }),
              children: VISIBILITY.map((v) => /* @__PURE__ */ jsx3("option", { value: v.value, children: m.t(v.labelKey) }, v.value))
            }
          )
        ] })
      ] }),
      transform && /* @__PURE__ */ jsx3(EffectiveGrant, { transform }),
      editable && needsReview && /* @__PURE__ */ jsx3("p", { className: "rounded-md bg-amber-50 p-2 text-xs text-amber-800", children: richMessage(m, "splicewire-beam-transforms::messages.review_required", {
        open: /* @__PURE__ */ jsx3("code", { children: "net:open" }),
        platform: /* @__PURE__ */ jsx3("code", { children: "platform" })
      }) }),
      transform && /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t pt-4", children: [
        /* @__PURE__ */ jsx3(Label, { htmlFor: "rt-sample", children: m.t("splicewire-beam-transforms::messages.field_sample") }),
        /* @__PURE__ */ jsx3(
          Textarea,
          {
            id: "rt-sample",
            className: "h-24 font-mono text-xs",
            value: sampleInput,
            onChange: (e) => setSampleInput(e.target.value)
          }
        ),
        /* @__PURE__ */ jsx3(Button, { size: "sm", variant: "secondary", onClick: runTest, disabled: test.isPending, children: m.t("splicewire-beam-transforms::messages.run") }),
        result && /* @__PURE__ */ jsx3(TestResult, { result })
      ] })
    ] })
  ] });
}
function EffectiveGrant({ transform }) {
  const m = useBeamTransformsMessages();
  const reqNet = String(transform.requestedGrant.net ?? "none");
  const effNet = String(transform.effectiveGrant.net ?? "none");
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3 text-xs", children: [
    /* @__PURE__ */ jsx3("div", { className: "mb-1 font-medium", children: m.t("splicewire-beam-transforms::messages.grant_title") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx3(Badge, { variant: "outline", children: m.t("splicewire-beam-transforms::messages.grant_requested", { net: optionLabel(m, NET, reqNet) }) }),
      /* @__PURE__ */ jsx3(Badge, { variant: effNet === reqNet ? "outline" : "destructive", children: m.t("splicewire-beam-transforms::messages.grant_effective", { net: optionLabel(m, NET, effNet) }) }),
      transform.deniedAxes.map((axis) => /* @__PURE__ */ jsx3(Badge, { variant: "destructive", children: m.t("splicewire-beam-transforms::messages.grant_denied", { axis }) }, axis))
    ] })
  ] });
}
function TestResult({ result }) {
  const m = useBeamTransformsMessages();
  const ok = result.outcome === "success";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1 rounded-md border p-3 text-xs", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx3(Badge, { variant: ok ? "secondary" : "destructive", children: result.outcome }),
      !result.telemetry.sandboxed && /* @__PURE__ */ jsx3(Badge, { variant: "destructive", children: m.t("splicewire-beam-transforms::messages.unsandboxed") }),
      result.telemetry.wallMs !== null && /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: m.t("splicewire-beam-transforms::messages.test_wall_ms", { wall: result.telemetry.wallMs }) })
    ] }),
    ok ? /* @__PURE__ */ jsx3("pre", { className: "overflow-x-auto rounded bg-muted p-2", children: JSON.stringify(result.output, null, 2) }) : /* @__PURE__ */ jsx3("p", { className: "text-destructive", children: result.error }),
    result.stderr && /* @__PURE__ */ jsx3("pre", { className: "overflow-x-auto rounded bg-muted p-2 text-muted-foreground", children: result.stderr })
  ] });
}
export {
  RunnerTransformEditor,
  TransformsProvider,
  useCreateTransform,
  useDeleteTransform,
  useNotify,
  useTestTransform,
  useTransforms,
  useTransformsCan,
  useTransformsServices,
  useUpdateTransform
};
//# sourceMappingURL=index.js.map