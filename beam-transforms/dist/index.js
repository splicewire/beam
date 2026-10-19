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

// src/runner-transform-editor.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var RUNTIMES = [
  { id: "javy", label: "JavaScript (sandboxed, default)" },
  { id: "python-wasi", label: "Python (sandboxed, pure Python)" },
  { id: "node", label: "Node.js (full runtime)" },
  { id: "python", label: "Python (full runtime)" }
];
var NET = ["none", "scoped", "open"];
var VISIBILITY = ["private", "tenant", "platform"];
var BLANK = { name: "", runtime: "javy", code: "", requestedNet: "none", visibility: "private" };
var selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
function RunnerTransformEditor() {
  const { data: transforms = [], isLoading } = useTransforms();
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
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]", children: [
    /* @__PURE__ */ jsxs("aside", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx2("h1", { className: "text-lg font-semibold", children: "Transforms" }),
        can.create && /* @__PURE__ */ jsx2(
          Button,
          {
            size: "sm",
            onClick: () => {
              setSelectedId(null);
              setDraft(BLANK);
            },
            children: "New"
          }
        )
      ] }),
      /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "Sandboxed, user-authored transforms of another tool \u2014 code that runs deny-by-default in a scoped sandbox." }),
      readOnly && /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "You can view and test transforms, but not change them." }),
      isLoading && /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "Loading\u2026" }),
      !isLoading && transforms.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-4 text-sm", children: [
        /* @__PURE__ */ jsx2("p", { className: "font-medium", children: "No transforms yet" }),
        can.create && /* @__PURE__ */ jsx2("p", { className: "mt-1 text-muted-foreground", children: "Write your first one in the editor, then save it to list it here." })
      ] }),
      /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: transforms.map((t) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => edit(t),
          className: `w-full rounded-md border p-3 text-left hover:bg-accent ${t.id === selectedId ? "border-primary" : "border-border"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx2("span", { className: "font-medium", children: t.name }),
              /* @__PURE__ */ jsx2(Badge, { variant: "secondary", children: t.runtime })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "net: ",
                String(t.effectiveGrant.net ?? "none")
              ] }),
              t.visibility && /* @__PURE__ */ jsxs("span", { children: [
                "\xB7 ",
                t.visibility
              ] }),
              !t.enabled && /* @__PURE__ */ jsx2("span", { children: "\xB7 disabled" })
            ] })
          ]
        }
      ) }, t.id)) })
    ] }),
    selected || can.create ? /* @__PURE__ */ jsx2(
      TransformEditorPane,
      {
        transform: selected,
        draft,
        setDraft,
        onSaved: (t) => setSelectedId(t.id),
        headerExtra: renderHeaderExtra?.(selected) ?? null
      },
      selectedId ?? "new"
    ) : /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "Choose a transform to view and test it." })
  ] });
}
function TransformEditorPane({
  transform,
  draft,
  setDraft,
  onSaved,
  headerExtra
}) {
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
      notify({ type: "success", message: `Transform "${saved.name}" saved.` });
    } catch {
      notify({ type: "error", message: "Could not save the transform." });
    }
  }
  async function runTest() {
    if (!transform) return;
    try {
      setResult(await test.mutateAsync(JSON.parse(sampleInput || "{}")));
    } catch {
      setResult(null);
      notify({ type: "error", message: "Sample input is not valid JSON." });
    }
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsx2(CardTitle, { children: !transform ? "New transform" : editable ? "Edit transform" : "Transform details" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        headerExtra,
        transform && can.delete && /* @__PURE__ */ jsx2(Button, { variant: "destructive", size: "sm", onClick: () => remove.mutate(transform.id), children: "Delete" }),
        editable && /* @__PURE__ */ jsx2(Button, { size: "sm", onClick: save, disabled: !draft.name || !draft.code, children: needsReview ? "Request review & save" : "Save" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-name", children: "Name" }),
          /* @__PURE__ */ jsx2(
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
          /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-runtime", children: "Runtime" }),
          /* @__PURE__ */ jsx2(
            "select",
            {
              id: "rt-runtime",
              className: selectClass,
              disabled: !editable,
              value: draft.runtime,
              onChange: (e) => setDraft({ ...draft, runtime: e.target.value }),
              children: RUNTIMES.map((r) => /* @__PURE__ */ jsx2("option", { value: r.id, children: r.label }, r.id))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-code", children: "Code" }),
        /* @__PURE__ */ jsx2(
          Textarea,
          {
            id: "rt-code",
            className: "h-64 font-mono text-xs",
            readOnly: !editable,
            value: draft.code,
            onChange: (e) => setDraft({ ...draft, code: e.target.value }),
            placeholder: "// read { input, grant } on stdin; write one JSON object on stdout"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-net", children: "Requested network" }),
          /* @__PURE__ */ jsx2(
            "select",
            {
              id: "rt-net",
              className: selectClass,
              disabled: !editable,
              value: draft.requestedNet,
              onChange: (e) => setDraft({ ...draft, requestedNet: e.target.value }),
              children: NET.map((n) => /* @__PURE__ */ jsx2("option", { value: n, children: n }, n))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-visibility", children: "Sharing" }),
          /* @__PURE__ */ jsx2(
            "select",
            {
              id: "rt-visibility",
              className: selectClass,
              disabled: !editable,
              value: draft.visibility,
              onChange: (e) => setDraft({ ...draft, visibility: e.target.value }),
              children: VISIBILITY.map((v) => /* @__PURE__ */ jsx2("option", { value: v, children: v }, v))
            }
          )
        ] })
      ] }),
      transform && /* @__PURE__ */ jsx2(EffectiveGrant, { transform }),
      editable && needsReview && /* @__PURE__ */ jsxs("p", { className: "rounded-md bg-amber-50 p-2 text-xs text-amber-800", children: [
        "Review required \u2014 ",
        /* @__PURE__ */ jsx2("code", { children: "net:open" }),
        " and ",
        /* @__PURE__ */ jsx2("code", { children: "platform" }),
        " publishing are trust-gated (effective grant floors to deny-by-default until approved)."
      ] }),
      transform && /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t pt-4", children: [
        /* @__PURE__ */ jsx2(Label, { htmlFor: "rt-sample", children: "Test \u2014 sample input" }),
        /* @__PURE__ */ jsx2(
          Textarea,
          {
            id: "rt-sample",
            className: "h-24 font-mono text-xs",
            value: sampleInput,
            onChange: (e) => setSampleInput(e.target.value)
          }
        ),
        /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "secondary", onClick: runTest, disabled: test.isPending, children: "Run" }),
        result && /* @__PURE__ */ jsx2(TestResult, { result })
      ] })
    ] })
  ] });
}
function EffectiveGrant({ transform }) {
  const reqNet = String(transform.requestedGrant.net ?? "none");
  const effNet = String(transform.effectiveGrant.net ?? "none");
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3 text-xs", children: [
    /* @__PURE__ */ jsx2("div", { className: "mb-1 font-medium", children: "Effective grant (= requested \u2229 policy)" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
        "requested net: ",
        reqNet
      ] }),
      /* @__PURE__ */ jsxs(Badge, { variant: effNet === reqNet ? "outline" : "destructive", children: [
        "effective net: ",
        effNet
      ] }),
      transform.deniedAxes.map((axis) => /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
        "denied: ",
        axis
      ] }, axis))
    ] })
  ] });
}
function TestResult({ result }) {
  const ok = result.outcome === "success";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1 rounded-md border p-3 text-xs", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx2(Badge, { variant: ok ? "secondary" : "destructive", children: result.outcome }),
      !result.telemetry.sandboxed && /* @__PURE__ */ jsx2(Badge, { variant: "destructive", children: "unsandboxed" }),
      result.telemetry.wallMs !== null && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
        result.telemetry.wallMs,
        "ms"
      ] })
    ] }),
    ok ? /* @__PURE__ */ jsx2("pre", { className: "overflow-x-auto rounded bg-muted p-2", children: JSON.stringify(result.output, null, 2) }) : /* @__PURE__ */ jsx2("p", { className: "text-destructive", children: result.error }),
    result.stderr && /* @__PURE__ */ jsx2("pre", { className: "overflow-x-auto rounded bg-muted p-2 text-muted-foreground", children: result.stderr })
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