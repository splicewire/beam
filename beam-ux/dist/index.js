import {
  ReleasePanel
} from "./chunk-K76H6RPL.js";
import {
  styleRegistry
} from "./chunk-RNDA3EP6.js";
import "./chunk-2NOVFPER.js";

// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var UxBuilderServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[beam-ux] ${event.message}`);
  else console.info(`[beam-ux] ${event.message}`);
}
function UxBuilderProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(UxBuilderServicesContext.Provider, { value: services, children });
}
function useUxBuilderServices() {
  const services = useContext(UxBuilderServicesContext);
  if (!services) {
    throw new Error("BeamUx components must be rendered inside a <UxBuilderProvider>.");
  }
  return services;
}
function useNotify() {
  return useUxBuilderServices().notify ?? consoleNotify;
}

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
var entryBodyKey = (id) => ["beam-ux", "entry-body", id];
function useEntryBody(id) {
  const { client } = useUxBuilderServices();
  return useQuery({
    queryKey: entryBodyKey(id ?? ""),
    queryFn: () => client.loadBody(id),
    enabled: id != null && id !== ""
  });
}
function useSaveEntryBody() {
  const { client } = useUxBuilderServices();
  const notify = useNotify();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => client.saveBody(id, body),
    onSuccess: (data, { id }) => {
      qc.setQueryData(entryBodyKey(id), data);
      qc.invalidateQueries({ queryKey: entryBodyKey(id) });
      notify({ type: "success", message: "Saved." });
    },
    onError: () => {
      notify({ type: "error", message: "Save failed." });
    }
  });
}

// src/useCan.ts
import { useFrameInjection } from "@schemastud/frame";
var CRUD_OPERATIONS = /* @__PURE__ */ new Set([
  "viewAny",
  "view",
  "create",
  "update",
  "delete"
]);
function useCan(resource, operation) {
  const frame = useFrameInjection();
  if (CRUD_OPERATIONS.has(operation)) {
    return frame.can(operation, resource);
  }
  return frame.manifestFor?.(resource)?.can?.actions?.[operation] === true;
}

// src/RegionInspector.tsx
import { Badge as Badge2, cn as cn2 } from "@schemastud/ui";

// src/kindIcon.ts
import { Boxes, FileText, LayoutTemplate, Table2 } from "lucide-react";
var KIND_ICON = {
  richtext: FileText,
  form: LayoutTemplate,
  frame: Table2,
  list: Boxes
};

// src/RegionEditorBody.tsx
import { Link2 } from "lucide-react";
import { useState } from "react";
import { SchemaForm } from "@schemastud/seam";
import { Badge, Button, Input, Textarea, cn } from "@schemastud/ui";

// src/css.ts
var UX_BUILDER_CSS = `
/* the floating in-context region editor (RegionOverlay) \u2014 Tailwind's 2xl shadow. Utility names are
   kept out of this string's comments on purpose: the string ships in dist, and a host that scans it
   would generate a rule from the prose (beam-docs-satellite 63). */
.beam-ux-overlay { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }

/* the fixed dock the overlay floats in, in overlay placement (UxBuilder) */
.beam-ux-overlay-dock {
  position: fixed;
  right: var(--beam-ux-overlay-inset, 1.5rem);
  top: var(--beam-ux-overlay-top, 6rem);
  z-index: 40;
  width: var(--beam-ux-overlay-width, 380px);
}

/* an engageable region on the live canvas (RegionBlock): hover ring, and the label tab that
   reveals on hover or engage */
.beam-ux-region:not([data-engaged]):hover {
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 20%, transparent);
}
.beam-ux-region-tab {
  top: -0.625rem;
  opacity: 0;
  transition-property: opacity;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.beam-ux-region:hover .beam-ux-region-tab,
.beam-ux-region[data-engaged] .beam-ux-region-tab { opacity: 1; }

/* the "opaque island" scrim over a self-loading frame preview (RegionEditorBody) */
.beam-ux-scrim {
  background-image: linear-gradient(to top, color-mix(in oklab, var(--background) 70%, transparent), transparent);
}

/* the caption beside the mode toggle \u2014 hidden on a narrow viewport (UxBuilder) */
.beam-ux-mode-hint { display: none; }
@media (min-width: 48rem) { .beam-ux-mode-hint { display: inline; } }

/* the two-column geometries: composition tree + editor (StructurePanel), canvas + docked inspector
   (UxBuilder). Single column below the lg breakpoint, as the utilities were. */
@media (min-width: 64rem) {
  .beam-ux-structure-grid { grid-template-columns: minmax(0, 1fr) var(--beam-ux-structure-aside, 300px); }
  .beam-ux-inspector-grid { grid-template-columns: minmax(0, 1fr) minmax(var(--beam-ux-inspector-min, 360px), var(--beam-ux-inspector-max, 400px)); }
}
`;

// src/RegionEditorBody.tsx
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function RegionEditorBody({
  region,
  schema,
  body,
  onChange,
  onSave,
  onDiscard,
  saving
}) {
  switch (region.kind) {
    case "form":
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2(FormEditor, { schema, body, onChange }),
        /* @__PURE__ */ jsx2(
          EditorActions,
          {
            onSave,
            onDiscard,
            saving
          }
        )
      ] });
    case "richtext":
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2(RichtextEditor, { body, onChange }),
        /* @__PURE__ */ jsx2(
          EditorActions,
          {
            onSave,
            onDiscard,
            saving
          }
        )
      ] });
    case "frame":
      return /* @__PURE__ */ jsx2(FrameEditor, {});
    case "list":
      return /* @__PURE__ */ jsx2(ListEditor, {});
  }
}
function EditorActions({
  onSave,
  onDiscard,
  saving
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 border-t pt-4", children: [
    /* @__PURE__ */ jsx2(Button, { size: "sm", onClick: onSave, disabled: saving, children: saving ? "Saving\u2026" : "Save" }),
    /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "ghost", onClick: onDiscard, disabled: saving || !onDiscard, children: "Discard" })
  ] });
}
function FormEditor({
  schema,
  body,
  onChange
}) {
  if (!schema) {
    return /* @__PURE__ */ jsx2("div", { className: "rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground", children: "This region has no schema." });
  }
  return /* @__PURE__ */ jsx2(
    SchemaForm,
    {
      schema,
      formData: body,
      uiSchema: {
        "ui:options": { label: false },
        "ui:submitButtonOptions": { norender: true }
      },
      onChange: (e) => onChange(e.formData ?? {})
    }
  );
}
var CONTENT_KEY = "content";
var FRONTMATTER_KEY = "frontmatter";
function RichtextEditor({
  body,
  onChange
}) {
  const content = typeof body[CONTENT_KEY] === "string" ? body[CONTENT_KEY] : "";
  const preserved = Object.keys(body).filter((key) => key !== CONTENT_KEY);
  const frontmatter = body[FRONTMATTER_KEY];
  const fields = frontmatter && typeof frontmatter === "object" && !Array.isArray(frontmatter) ? Object.keys(frontmatter) : preserved;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx2(
      Textarea,
      {
        value: content,
        onChange: (e) => onChange({ ...body, [CONTENT_KEY]: e.target.value }),
        rows: 18,
        spellCheck: false,
        "aria-label": "MDX source",
        placeholder: "# Heading\n\nThis region has no content yet. Write MDX here, then Save.",
        className: "font-mono text-xs"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground", children: [
      fields.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10px]", children: "preserved" }),
        fields.map((key) => /* @__PURE__ */ jsx2(
          "span",
          {
            className: "rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]",
            children: key
          },
          key
        ))
      ] }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10px]", children: "no frontmatter on this body" }),
      /* @__PURE__ */ jsx2("span", { className: "ml-auto font-mono text-[10px]", children: "mdx source" })
    ] })
  ] });
}
function FrameEditor() {
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-md border", children: [
    /* @__PURE__ */ jsx2("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs("div", { className: "border-b bg-muted/40 px-3 py-2 text-xs", children: [
      /* @__PURE__ */ jsx2("span", { className: "font-mono", children: "frame:enrollment" }),
      " \u2014 self-loading"
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "divide-y", children: ["A. Mensah", "R. Okafor", "J. Park"].map((n) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsx2("span", { className: "flex-1", children: n }),
      /* @__PURE__ */ jsx2(Badge, { variant: "secondary", className: "text-[10px]", children: "enrolled" })
    ] }, n)) }),
    /* @__PURE__ */ jsx2("div", { className: "beam-ux-scrim pointer-events-none absolute inset-0" }),
    /* @__PURE__ */ jsx2("div", { className: "relative border-t bg-muted/40 px-3 py-1.5 text-center font-mono text-[10px] text-muted-foreground", children: "opaque EditShell island \xB7 self-loads/saves via FrameProvider" })
  ] });
}
var LIST_ROWS = [
  { slug: "frontend-foundations", title: "Frontend Foundations", format: "cohort", seats: 8 },
  { slug: "data-modeling", title: "Data Modeling", format: "self-paced", seats: 0 },
  { slug: "live-systems-design", title: "Live Systems Design", format: "live", seats: 3 }
];
function ListEditor() {
  const [slug, setSlug] = useState(LIST_ROWS[0].slug);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-background p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
        /* @__PURE__ */ jsx2(Link2, { className: "size-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx2("span", { className: "font-mono", children: "route" }),
        /* @__PURE__ */ jsx2("span", { className: "font-mono text-muted-foreground", children: "/programs/" }),
        /* @__PURE__ */ jsx2(
          Input,
          {
            value: slug,
            onChange: (e) => setSlug(e.target.value),
            className: "h-7 w-48 font-mono text-xs"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
        "The list component reads ",
        /* @__PURE__ */ jsx2("span", { className: "font-mono", children: "{slug}" }),
        " from the route and resolves its collection \u2014 dropped into a template placement, it is the page\u2019s data spine."
      ] })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "divide-y rounded-md border", children: LIST_ROWS.map((r) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "flex items-center gap-3 px-3 py-2 text-sm",
          r.slug === slug && "bg-primary/5"
        ),
        children: [
          /* @__PURE__ */ jsx2("span", { className: "flex-1 font-medium", children: r.title }),
          /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "text-[10px]", children: r.format }),
          /* @__PURE__ */ jsx2("span", { className: "w-16 text-right font-mono text-xs text-muted-foreground", children: r.seats > 0 ? `${r.seats} seats` : "full" })
        ]
      },
      r.slug
    )) })
  ] });
}

// src/RegionInspector.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function RegionInspector({
  region,
  schema,
  body,
  onChange,
  onSave,
  onDiscard,
  saving
}) {
  const Icon = KIND_ICON[region.kind];
  return /* @__PURE__ */ jsxs2("div", { className: "rounded-lg border bg-card", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-2 border-b px-4 py-3", children: [
      /* @__PURE__ */ jsx3(Icon, { className: "mt-0.5 size-4 flex-none text-muted-foreground" }),
      /* @__PURE__ */ jsxs2("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx3("span", { className: "truncate text-sm font-semibold", children: region.label }),
        /* @__PURE__ */ jsxs2("div", { className: "mt-1 flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsx3("span", { className: "font-mono text-[10px] text-muted-foreground", children: region.recordLabel ?? region.recordId }),
          /* @__PURE__ */ jsx3(Badge2, { variant: "secondary", className: cn2("font-mono text-[10px]"), children: region.kind })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "p-4", children: [
      /* @__PURE__ */ jsx3(
        RegionEditorBody,
        {
          region,
          schema,
          body,
          onChange,
          onSave,
          onDiscard,
          saving
        }
      ),
      /* @__PURE__ */ jsx3("p", { className: "mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground", children: region.note })
    ] })
  ] });
}

// src/ThemeEditor.tsx
import { useState as useState2 } from "react";
import { useMutation as useMutation2, useQuery as useQuery2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function ThemeEditor({
  entryId,
  label = "Theme tokens",
  note = "Save creates a theme draft. Publish releases the saved version, or submits it for review when required."
}) {
  const [breakpoint, setBreakpoint] = useState2("");
  const { client } = useUxBuilderServices();
  const cache = useQueryClient2();
  const query = useEntryBody(entryId);
  const [draft, setDraft] = useState2(null);
  const [releaseId, setReleaseId] = useState2("");
  const [publication, setPublication] = useState2(null);
  const versionKey = ["theme-versions", entryId];
  const versions = useQuery2({ queryKey: versionKey, queryFn: () => client.listVersions(entryId), enabled: !!client.listVersions });
  const releases = useQuery2({ queryKey: ["theme-releases", entryId], queryFn: () => client.listReleases(), enabled: !!client.listReleases });
  const save = useMutation2({
    mutationFn: async (body2) => {
      const base = versions.data?.headVersion;
      if (!client.saveDraft || !base) throw new Error("A saved base version and draft transport are required to edit this theme.");
      return client.saveDraft(entryId, body2, base);
    },
    onSuccess: async (state, savedBody) => {
      cache.setQueryData(versionKey, state);
      await query.refetch();
      setDraft((current) => current === savedBody ? null : current);
    }
  });
  const join = useMutation2({ mutationFn: async () => {
    const ref = versions.data?.headVersion;
    if (!client.releaseCommand || !releaseId || !ref) throw new Error("Choose a Release and a saved theme version.");
    return client.releaseCommand(releaseId, { action: "member", entryId, ref });
  } });
  const publish = useMutation2({ mutationFn: async () => {
    if (!client.createRelease || !client.releaseCommand) throw new Error("Release publication is unavailable.");
    const state = draft === null ? versions.data : await save.mutateAsync(draft);
    if (!state?.headVersion) throw new Error("Save a theme version before publishing.");
    if (state.compileError) throw new Error(state.compileError);
    let release = await client.createRelease(entryId, `Publish: ${label}`);
    setPublication(release);
    try {
      release = await client.releaseCommand(release.id, { action: "member", entryId, ref: state.headVersion });
      setPublication(release);
      release = await client.releaseCommand(release.id, { action: release.reviewRequired ? "submit" : "publish" });
      setPublication(release);
    } catch (error) {
      throw new Error(`Release "${release.title}" (${release.id}): ${error instanceof Error ? error.message : "Publication failed."}`);
    }
    await Promise.all([versions.refetch(), query.refetch(), ...client.listReleases ? [releases.refetch()] : []]);
    return release;
  } });
  if (query.isPending) {
    return /* @__PURE__ */ jsx4("p", { role: "status", className: "rounded-lg border bg-card p-4 text-sm text-muted-foreground", children: "Loading the theme\u2026" });
  }
  if (query.isError || !query.data) {
    return /* @__PURE__ */ jsx4("p", { role: "alert", className: "rounded-lg border bg-card p-4 text-sm text-destructive", children: "The theme entry could not be loaded." });
  }
  const loaded = query.data.body ?? {};
  const body = draft ?? loaded;
  const responsive = body.responsive ?? {};
  const layers = responsive.tokens ?? {};
  const visibleBody = breakpoint ? layers[breakpoint] ?? {} : body;
  const changeLayer = (next) => setDraft(breakpoint ? { ...body, responsive: { ...responsive, tokens: { ...layers, [breakpoint]: next } } } : { ...body, ...next });
  const region = {
    id: "theme",
    label,
    kind: "form",
    recordId: entryId,
    recordLabel: query.data.slug,
    note
  };
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsxs3("label", { children: [
      "Token breakpoint ",
      /* @__PURE__ */ jsxs3("select", { value: breakpoint, onChange: (e) => setBreakpoint(e.target.value), children: [
        /* @__PURE__ */ jsx4("option", { value: "", children: "Base" }),
        Object.keys(styleRegistry({ responsive }).breakpoints).map((name) => /* @__PURE__ */ jsx4("option", { value: name, children: name }, name))
      ] })
    ] }),
    /* @__PURE__ */ jsx4(
      RegionInspector,
      {
        region,
        schema: query.data.schema ?? null,
        body: visibleBody,
        onChange: changeLayer,
        onSave: () => save.mutate(body),
        onDiscard: draft === null ? void 0 : () => setDraft(null),
        saving: save.isPending || publish.isPending
      }
    ),
    save.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: save.error.message }),
    save.isSuccess && !publication && /* @__PURE__ */ jsx4("p", { role: "status", children: "Theme draft saved. Readers still receive the published theme." }),
    client.createRelease && client.releaseCommand && /* @__PURE__ */ jsx4(
      "button",
      {
        type: "button",
        disabled: save.isPending || publish.isPending || !versions.data?.headVersion,
        onClick: () => publish.mutate(),
        children: "Publish"
      }
    ),
    publish.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: publish.error.message }),
    publish.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: publication?.status === "published" ? "Theme published." : "Theme Release submitted for review." }),
    publication && client.releaseCommand && /* @__PURE__ */ jsx4(
      ReleasePanel,
      {
        release: publication,
        entries: [{ id: entryId, title: label, versions: versions.data?.versions.map((version) => ({ id: version.id, label: version.readable })) ?? [] }],
        onCommand: async (command) => {
          const next = await client.releaseCommand(publication.id, command);
          setPublication(next);
          await Promise.all([versions.refetch(), query.refetch()]);
        }
      }
    ),
    client.listReleases && client.releaseCommand && /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsxs3("label", { children: [
        "Release ",
        /* @__PURE__ */ jsxs3("select", { value: releaseId, onChange: (event) => setReleaseId(event.target.value), children: [
          /* @__PURE__ */ jsx4("option", { value: "", children: "Choose a Release" }),
          releases.data?.map((release) => /* @__PURE__ */ jsx4("option", { value: release.id, children: release.title }, release.id))
        ] })
      ] }),
      /* @__PURE__ */ jsx4(
        "button",
        {
          disabled: join.isPending || !releaseId || !versions.data?.headVersion,
          onClick: () => join.mutate(),
          children: "Add saved theme to Release"
        }
      ),
      join.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: join.error.message }),
      join.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: "Saved theme version added to the Release." })
    ] })
  ] });
}

// src/RegionOverlay.tsx
import { X } from "lucide-react";
import { Badge as Badge3, cn as cn3 } from "@schemastud/ui";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function RegionOverlay({
  region,
  schema,
  body,
  onChange,
  onSave,
  onDiscard,
  saving,
  onClose
}) {
  const Icon = KIND_ICON[region.kind];
  return /* @__PURE__ */ jsxs4("div", { className: cn3("beam-ux-overlay rounded-lg border bg-card ring-1 ring-primary/20"), children: [
    /* @__PURE__ */ jsx5("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-2 border-b px-4 py-3", children: [
      /* @__PURE__ */ jsx5(Icon, { className: "mt-0.5 size-4 flex-none text-muted-foreground" }),
      /* @__PURE__ */ jsxs4("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx5("span", { className: "truncate text-sm font-semibold", children: region.label }),
          /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted",
              title: "Dismiss overlay",
              "aria-label": "Dismiss overlay",
              children: /* @__PURE__ */ jsx5(X, { className: "size-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "mt-1 flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsx5("span", { className: "font-mono text-[10px] text-muted-foreground", children: region.recordLabel ?? region.recordId }),
          /* @__PURE__ */ jsx5(Badge3, { variant: "secondary", className: "font-mono text-[10px]", children: region.kind })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "p-4", children: [
      /* @__PURE__ */ jsx5(
        RegionEditorBody,
        {
          region,
          schema,
          body,
          onChange,
          onSave,
          onDiscard,
          saving
        }
      ),
      /* @__PURE__ */ jsx5("p", { className: "mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground", children: region.note })
    ] })
  ] });
}

// src/RegionCanvas.tsx
import { Button as Button2, cn as cn4 } from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var LIST_ROWS2 = [
  { slug: "frontend-foundations", title: "Frontend Foundations" },
  { slug: "data-modeling", title: "Data Modeling" },
  { slug: "live-systems-design", title: "Live Systems Design" }
];
function RegionBlock({
  region,
  engaged,
  onEngage
}) {
  const Icon = KIND_ICON[region.kind];
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      role: "button",
      tabIndex: 0,
      onClick: onEngage,
      onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && onEngage(),
      "data-engaged": engaged ? "" : void 0,
      className: cn4(
        "beam-ux-region relative block w-full cursor-pointer rounded-lg border bg-card p-4 text-left transition-all",
        engaged ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/40"
      ),
      children: [
        /* @__PURE__ */ jsx6("style", { children: UX_BUILDER_CSS }),
        /* @__PURE__ */ jsxs5("div", { className: cn4(!engaged && "opacity-90"), children: [
          region.kind === "richtext" && /* @__PURE__ */ jsxs5(Fragment3, { children: [
            /* @__PURE__ */ jsx6("div", { className: "text-2xl font-semibold tracking-tight", children: "Build things that ship." }),
            /* @__PURE__ */ jsx6("p", { className: "mt-1 text-sm text-muted-foreground", children: "Cohort-based programs for teams who\u2019d rather practice than watch." })
          ] }),
          region.kind === "form" && /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs5("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx6("div", { className: "text-[11px] font-medium uppercase tracking-wide text-primary", children: "New cohort" }),
              /* @__PURE__ */ jsx6("div", { className: "text-lg font-semibold", children: "Frontend Foundations" }),
              /* @__PURE__ */ jsx6("div", { className: "text-xs text-muted-foreground", children: "cohort \xB7 8 seats left" })
            ] }),
            /* @__PURE__ */ jsx6(Button2, { size: "sm", children: "Enroll" })
          ] }),
          region.kind === "frame" && /* @__PURE__ */ jsx6("div", { className: "text-sm text-muted-foreground", children: "Enrollment roster \xB7 3 enrolled" }),
          region.kind === "list" && /* @__PURE__ */ jsx6("div", { className: "flex gap-2", children: LIST_ROWS2.map((r) => /* @__PURE__ */ jsx6("span", { className: "rounded border bg-background px-2 py-1 text-xs", children: r.title }, r.slug)) })
        ] }),
        /* @__PURE__ */ jsxs5(
          "span",
          {
            className: cn4(
              "beam-ux-region-tab absolute left-3 flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px]",
              engaged && "border-primary text-primary"
            ),
            children: [
              /* @__PURE__ */ jsx6(Icon, { className: "size-3" }),
              region.id
            ]
          }
        )
      ]
    }
  );
}
function RegionCanvas({
  regions,
  engaged,
  onEngage
}) {
  return /* @__PURE__ */ jsx6("div", { className: "space-y-4", children: regions.map((r) => /* @__PURE__ */ jsx6(
    RegionBlock,
    {
      region: r,
      engaged: engaged === r.id,
      onEngage: () => onEngage(r.id)
    },
    r.id
  )) });
}

// src/StructurePanel.tsx
import { cn as cn5 } from "@schemastud/ui";
import { Fragment as Fragment4, jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function TreeRow({
  node,
  depth,
  selected,
  onSelect
}) {
  const isRegion = node.kind === "region";
  const isSel = isRegion && node.regionId === selected;
  return /* @__PURE__ */ jsxs6(Fragment4, { children: [
    /* @__PURE__ */ jsxs6(
      "button",
      {
        type: "button",
        disabled: !isRegion,
        onClick: () => isRegion && node.regionId && onSelect(node.regionId),
        style: { paddingLeft: 8 + depth * 16 },
        className: cn5(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors",
          isRegion ? "hover:bg-muted/60" : "cursor-default text-muted-foreground",
          isSel && "bg-primary/5 font-medium text-foreground"
        ),
        children: [
          /* @__PURE__ */ jsx7("span", { className: "font-mono text-[10px] uppercase text-muted-foreground/70", children: node.kind[0] }),
          /* @__PURE__ */ jsx7("span", { className: "truncate", children: node.label })
        ]
      }
    ),
    node.children?.map((c) => /* @__PURE__ */ jsx7(TreeRow, { node: c, depth: depth + 1, selected, onSelect }, c.id))
  ] });
}
function treeKindPath(node) {
  const kinds = [];
  for (let cursor = node; cursor; cursor = cursor.children?.[0]) {
    if (!kinds.includes(cursor.kind)) kinds.push(cursor.kind);
  }
  return kinds.join(" \u203A ");
}
function StructurePanel({
  pageTree,
  palette,
  selected,
  selectedRegion,
  onSelect,
  renderEditor
}) {
  return /* @__PURE__ */ jsxs6("div", { className: "beam-ux-structure-grid grid grid-cols-1 gap-6", children: [
    /* @__PURE__ */ jsx7("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs6("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs6("section", { className: "rounded-lg border bg-card", children: [
        /* @__PURE__ */ jsxs6("div", { className: "border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: [
          "Composition tree \u2014 ",
          treeKindPath(pageTree)
        ] }),
        /* @__PURE__ */ jsx7("div", { className: "p-2", children: /* @__PURE__ */ jsx7(TreeRow, { node: pageTree, depth: 0, selected, onSelect }) })
      ] }),
      selectedRegion && /* @__PURE__ */ jsxs6("section", { children: [
        /* @__PURE__ */ jsx7("div", { className: "mb-2 flex items-center gap-2", children: /* @__PURE__ */ jsx7("span", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Placement config" }) }),
        renderEditor(selectedRegion)
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("aside", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx7("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Component palette" }),
      palette.map((p) => {
        const Icon = KIND_ICON[p.kind];
        return /* @__PURE__ */ jsxs6(
          "div",
          {
            className: "flex items-start gap-3 rounded-lg border border-dashed bg-card p-3",
            children: [
              /* @__PURE__ */ jsx7(Icon, { className: "mt-0.5 size-4 flex-none text-muted-foreground" }),
              /* @__PURE__ */ jsxs6("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx7("div", { className: "text-sm font-medium", children: p.label }),
                /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground", children: p.hint })
              ] }),
              /* @__PURE__ */ jsx7("span", { className: "cursor-grab select-none text-muted-foreground", children: "\u282F" })
            ]
          },
          p.key
        );
      }),
      /* @__PURE__ */ jsx7("p", { className: "px-1 text-[11px] leading-relaxed text-muted-foreground", children: "Structure = the page-composition layer, kept separate from overlay editing. Drag a component into a placement; overlay mode then edits it in situ." })
    ] })
  ] });
}

// src/UxBuilder.tsx
import { LayoutTemplate as LayoutTemplate2, MousePointerSquareDashed } from "lucide-react";
import { useMemo, useState as useState3 } from "react";
import { cn as cn6 } from "@schemastud/ui";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
function placementFor(kind, placement) {
  if (kind === "list") return "overlay";
  return placement;
}
function useRegionEditor(region) {
  const query = useEntryBody(region.recordId);
  const save = useSaveEntryBody();
  const [draft, setDraft] = useState3(null);
  const schema = query.data?.schema ?? null;
  const body = draft ?? query.data?.body ?? {};
  return {
    schema,
    body,
    onChange: setDraft,
    onSave: () => save.mutate({ id: region.recordId, body }),
    // The draft IS the unsaved edit, so dropping it is the whole of Discard — the next render
    // falls back to `query.data.body`, the last thing the server actually stored.
    onDiscard: () => setDraft(null),
    saving: save.isPending
  };
}
function RegionInspectorConnected({ region }) {
  const editor = useRegionEditor(region);
  return /* @__PURE__ */ jsx8(RegionInspector, { region, ...editor });
}
function RegionOverlayConnected({ region, onClose }) {
  const editor = useRegionEditor(region);
  return /* @__PURE__ */ jsx8(RegionOverlay, { region, onClose, ...editor });
}
function ModeToggle({
  mode,
  onChange
}) {
  return /* @__PURE__ */ jsx8("div", { className: "flex items-center rounded-md border bg-card p-0.5 text-xs", children: ["overlay", "structure"].map((m) => /* @__PURE__ */ jsxs7(
    "button",
    {
      type: "button",
      onClick: () => onChange(m),
      className: cn6(
        "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium capitalize transition-colors",
        mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      ),
      children: [
        m === "overlay" ? /* @__PURE__ */ jsx8(MousePointerSquareDashed, { className: "size-3.5" }) : /* @__PURE__ */ jsx8(LayoutTemplate2, { className: "size-3.5" }),
        m
      ]
    },
    m
  )) });
}
function UxBuilder({
  regions,
  pageTree,
  palette,
  editorPlacement = "inspector",
  initialMode = "overlay",
  initialEngaged
}) {
  const [mode, setMode] = useState3(initialMode);
  const [engaged, setEngaged] = useState3(
    initialEngaged ?? regions[0]?.id ?? null
  );
  const [selected, setSelected] = useState3(regions[0]?.id ?? null);
  const active = useMemo(
    () => regions.find((r) => r.id === engaged) ?? null,
    [regions, engaged]
  );
  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selected) ?? null,
    [regions, selected]
  );
  const dockPlacement = active ? placementFor(active.kind, editorPlacement) : editorPlacement;
  const dockInInspector = dockPlacement === "inspector";
  return /* @__PURE__ */ jsxs7("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx8("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs7("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx8("span", { className: "beam-ux-mode-hint font-mono text-[11px] text-muted-foreground", children: "editing the app\u2019s own front-end" }),
      /* @__PURE__ */ jsx8(ModeToggle, { mode, onChange: setMode })
    ] }),
    mode === "structure" ? /* @__PURE__ */ jsx8(
      StructurePanel,
      {
        pageTree,
        palette,
        selected,
        selectedRegion,
        onSelect: setSelected,
        renderEditor: (region) => /* @__PURE__ */ jsx8(RegionInspectorConnected, { region }, region.id)
      }
    ) : dockInInspector ? (
      /* INSPECTOR placement — docked right-hand column, always present. */
      /* @__PURE__ */ jsxs7("div", { className: "beam-ux-inspector-grid grid grid-cols-1 gap-6", children: [
        /* @__PURE__ */ jsx8(RegionCanvas, { regions, engaged, onEngage: setEngaged }),
        /* @__PURE__ */ jsx8("aside", { className: "lg:sticky lg:top-2 lg:self-start", children: active ? /* @__PURE__ */ jsx8(RegionInspectorConnected, { region: active }, active.id) : /* @__PURE__ */ jsx8("div", { className: "rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground", children: "Engage a region on the left to edit it here." }) })
      ] })
    ) : (
      /* OVERLAY placement — full-width canvas + a floating in-context panel. */
      /* @__PURE__ */ jsxs7("div", { className: "relative", children: [
        /* @__PURE__ */ jsx8("div", { className: "max-w-3xl", children: /* @__PURE__ */ jsx8(RegionCanvas, { regions, engaged, onEngage: setEngaged }) }),
        active && /* @__PURE__ */ jsx8("div", { className: "beam-ux-overlay-dock", children: /* @__PURE__ */ jsx8(
          RegionOverlayConnected,
          {
            region: active,
            onClose: () => setEngaged(null)
          },
          active.id
        ) })
      ] })
    )
  ] });
}

// src/author/AuthorNote.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
function AuthorNote({ children, className }) {
  if (!import.meta.env?.DEV) {
    return null;
  }
  return /* @__PURE__ */ jsx9(
    "span",
    {
      "data-author-note": "",
      title: "Author note (development builds only)",
      className: ["font-mono text-[10px] text-muted-foreground/70", className].filter(Boolean).join(" "),
      children
    }
  );
}
export {
  AuthorNote,
  RegionBlock,
  RegionCanvas,
  RegionInspector,
  RegionOverlay,
  ReleasePanel,
  StructurePanel,
  ThemeEditor,
  UX_BUILDER_CSS,
  UxBuilder,
  UxBuilderProvider,
  placementFor,
  useCan,
  useEntryBody,
  useNotify,
  useSaveEntryBody,
  useUxBuilderServices
};
//# sourceMappingURL=index.js.map