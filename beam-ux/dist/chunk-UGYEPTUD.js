import {
  ReleasePanel,
  VersionRecordingReferences
} from "./chunk-SR6UINVU.js";
import {
  styleRegistry
} from "./chunk-J4K4YBKB.js";

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
  const savesDraft = Boolean(client.saveDraft && client.listVersions);
  const mutation = useMutation({
    mutationFn: async ({ id, body }) => {
      if (client.saveDraft && client.listVersions) {
        const current = await client.listVersions(id);
        return client.saveDraft(id, body, current.headVersion, "UX builder draft");
      }
      return client.saveBody(id, body);
    },
    onSuccess: (data, { id }) => {
      if (!savesDraft) {
        qc.setQueryData(entryBodyKey(id), data);
      }
      qc.invalidateQueries({ queryKey: entryBodyKey(id) });
      notify({
        type: "success",
        message: savesDraft ? "Draft saved." : "Saved."
      });
    },
    onError: () => {
      notify({ type: "error", message: "Save failed." });
    }
  });
  return {
    ...mutation,
    saveLabel: savesDraft ? "Save draft" : void 0
  };
}
function useRegionPreviews(entryId) {
  const { client } = useUxBuilderServices();
  const query = useQuery({
    queryKey: ["beam-ux", "region-releases"],
    queryFn: () => client.listReleases(),
    enabled: Boolean(client.listReleases),
    retry: false
  });
  const previewState = !client.listReleases || query.isError ? "unavailable" : query.isPending ? "loading" : "ready";
  const previews = (query.data ?? []).filter(
    (release) => ["draft", "in_review", "approved", "scheduled"].includes(release.status) && release.members.some((member) => member.entryId === entryId)
  ).map((release) => ({
    id: release.id,
    title: release.title,
    href: release.previewHref ?? null
  }));
  return { previews, previewState };
}

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
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function RegionEditorBody({
  region,
  schema,
  body,
  onChange,
  onSave,
  onDiscard,
  saving,
  saveLabel,
  saveDisabled
}) {
  switch (region.kind) {
    case "form":
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2(
          FormEditor,
          {
            schema,
            body: Array.isArray(body) ? {} : body,
            onChange: (next) => onChange(next)
          }
        ),
        /* @__PURE__ */ jsx2(
          EditorActions,
          {
            onSave,
            onDiscard,
            saving,
            saveLabel,
            saveDisabled
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
            saving,
            saveLabel,
            saveDisabled
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
  saving,
  saveLabel,
  saveDisabled
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 border-t pt-4", children: [
    /* @__PURE__ */ jsx2(Button, { size: "sm", onClick: onSave, disabled: saving || saveDisabled, children: saving ? "Saving\u2026" : saveLabel ?? "Save" }),
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
  const isDocument = Array.isArray(body);
  const content = isDocument ? firstTextValue(body) : typeof body[CONTENT_KEY] === "string" ? body[CONTENT_KEY] : "";
  const preserved = isDocument ? [] : Object.keys(body).filter((key) => key !== CONTENT_KEY);
  const frontmatter = isDocument ? void 0 : body[FRONTMATTER_KEY];
  const fields = frontmatter && typeof frontmatter === "object" && !Array.isArray(frontmatter) ? Object.keys(frontmatter) : preserved;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx2(
      Textarea,
      {
        value: content,
        onChange: (e) => onChange(isDocument ? replaceFirstTextValue(body, e.target.value) : { ...body, [CONTENT_KEY]: e.target.value }),
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
function findEditableTextNode(nodes) {
  let firstText = null;
  const visit = (items) => {
    for (const node of items) {
      if (node.kind === "text") {
        firstText ??= node;
        if (node.value !== "") return node;
      } else if (node.kind === "block") {
        const child = visit(node.children);
        if (child?.value !== void 0 && child.value !== "") return child;
        for (const slotNodes of Object.values(node.slots ?? {})) {
          const slot = visit(slotNodes);
          if (slot?.value !== void 0 && slot.value !== "") return slot;
        }
      }
    }
    return null;
  };
  return visit(nodes) ?? firstText;
}
function firstTextValue(nodes) {
  return findEditableTextNode(nodes)?.value ?? "";
}
function replaceFirstTextValue(nodes, value) {
  const target = findEditableTextNode(nodes);
  if (!target) return [...nodes, { kind: "text", value }];
  const replace = (node) => {
    if (node.kind === "text") {
      return node === target ? { ...node, value } : node;
    }
    if (node.kind !== "block") return node;
    const children = node.children.map(replace);
    const slots = node.slots ? Object.fromEntries(Object.entries(node.slots).map(([name, slotNodes]) => [name, slotNodes.map(replace)])) : void 0;
    return slots === void 0 ? { ...node, children } : { ...node, children, slots };
  };
  return nodes.map(replace);
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
  saving,
  saveLabel,
  saveDisabled,
  previews = [],
  previewState = "unavailable"
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
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap gap-2 text-xs", children: [
        region.url ? /* @__PURE__ */ jsx3("a", { href: region.url, target: "_blank", rel: "noopener noreferrer", children: "View" }) : /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: "View unavailable" }),
        previewState === "loading" ? /* @__PURE__ */ jsx3("span", { children: "Loading Preview\u2026" }) : previewState === "unavailable" ? /* @__PURE__ */ jsx3("span", { children: "Preview unavailable" }) : previews.length === 0 ? /* @__PURE__ */ jsx3("span", { children: "No open Release" }) : previews.map(
          (preview) => preview.href ? /* @__PURE__ */ jsxs2(
            "a",
            {
              href: preview.href,
              target: "_blank",
              rel: "noopener noreferrer",
              children: [
                "Preview ",
                preview.title
              ]
            },
            preview.id
          ) : /* @__PURE__ */ jsxs2("span", { children: [
            "Preview ",
            preview.title,
            " unavailable"
          ] }, preview.id)
        )
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
          saving,
          saveLabel,
          saveDisabled
        }
      ),
      /* @__PURE__ */ jsx3("p", { className: "mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground", children: region.note })
    ] })
  ] });
}

// src/ThemeEditor.tsx
import { useState as useState2 } from "react";
import { Button as Button2 } from "@schemastud/ui";
import { useMutation as useMutation2, useQuery as useQuery2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function ThemeEditor({
  entryId,
  label = "Theme tokens",
  note = "Save creates a theme draft. Publish releases the saved version, or submits it for review when required."
}) {
  const [breakpoint, setBreakpoint] = useState2("");
  const [releaseId, setReleaseId] = useState2("");
  const { client } = useUxBuilderServices();
  const cache = useQueryClient2();
  const query = useEntryBody(entryId);
  const [draft, setDraft] = useState2(null);
  const [publication, setPublication] = useState2(null);
  const versionKey = ["theme-versions", entryId];
  const versions = useQuery2({
    queryKey: versionKey,
    queryFn: () => client.listVersions(entryId),
    enabled: !!client.listVersions
  });
  const releases = useQuery2({
    queryKey: ["theme-releases", entryId],
    queryFn: () => client.listReleases(),
    enabled: !!client.listReleases
  });
  const activeRelease = publication ?? releases.data?.slice().sort((a, b) => b.id.localeCompare(a.id)).find(
    (release) => release.members.some((member) => member.entryId === entryId)
  ) ?? null;
  const save = useMutation2({
    mutationFn: async (body2) => {
      const state = versions.data;
      if (!client.saveDraft || !versions.isSuccess || !state)
        throw new Error(
          "Loaded version history and draft transport are required to edit this theme."
        );
      return client.saveDraft(entryId, body2, state.headVersion);
    },
    onSuccess: async (state, savedBody) => {
      cache.setQueryData(versionKey, state);
      await query.refetch();
      setDraft((current) => current === savedBody ? null : current);
    }
  });
  const join = useMutation2({
    mutationFn: async () => {
      const ref = versions.data?.headVersion;
      if (!client.releaseCommand || !releaseId || !ref)
        throw new Error("Choose a Release and a saved theme version.");
      return client.releaseCommand(releaseId, {
        action: "member",
        entryId,
        ref
      });
    }
  });
  const publish = useMutation2({
    mutationFn: async () => {
      if (!client.publish)
        throw new Error("Release publication is unavailable.");
      const state = draft === null ? versions.data : await save.mutateAsync(draft);
      if (!state?.headVersion)
        throw new Error("Save a theme version before publishing.");
      if (state.compileError) throw new Error(state.compileError);
      const result = await client.publish(entryId, state.headVersion);
      const release = result.release;
      if (!release) throw new Error("The server did not return a Release.");
      setPublication(release);
      await Promise.all([
        versions.refetch(),
        query.refetch(),
        ...client.listReleases ? [releases.refetch()] : []
      ]);
      return release;
    }
  });
  if (query.isPending) {
    return /* @__PURE__ */ jsx4(
      "p",
      {
        role: "status",
        className: "rounded-lg border bg-card p-4 text-sm text-muted-foreground",
        children: "Loading the theme\u2026"
      }
    );
  }
  if (query.isError || !query.data) {
    return /* @__PURE__ */ jsx4(
      "p",
      {
        role: "alert",
        className: "rounded-lg border bg-card p-4 text-sm text-destructive",
        children: "The theme entry could not be loaded."
      }
    );
  }
  const loaded = query.data.body ?? {};
  const body = draft ?? loaded;
  const responsive = body.responsive ?? {};
  const layers = responsive.tokens ?? {};
  const visibleBody = breakpoint ? layers[breakpoint] ?? {} : body;
  const changeLayer = (next) => setDraft(
    breakpoint ? {
      ...body,
      responsive: {
        ...responsive,
        tokens: { ...layers, [breakpoint]: next }
      }
    } : { ...body, ...next }
  );
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
      "Token breakpoint",
      " ",
      /* @__PURE__ */ jsxs3(
        "select",
        {
          value: breakpoint,
          onChange: (e) => setBreakpoint(e.target.value),
          children: [
            /* @__PURE__ */ jsx4("option", { value: "", children: "Base" }),
            Object.keys(styleRegistry({ responsive }).breakpoints).map(
              (name) => /* @__PURE__ */ jsx4("option", { value: name, children: name }, name)
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx4(
      RegionInspector,
      {
        region,
        schema: query.data.schema ?? null,
        body: visibleBody,
        onChange: (next) => {
          if (!Array.isArray(next)) changeLayer(next);
        },
        onSave: () => save.mutate(body),
        onDiscard: draft === null ? void 0 : () => setDraft(null),
        saving: save.isPending || publish.isPending,
        saveDisabled: !versions.isSuccess || !versions.data,
        saveLabel: "Save draft"
      }
    ),
    save.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: save.error.message }),
    versions.isError && /* @__PURE__ */ jsxs3("p", { role: "alert", children: [
      "History could not be loaded.",
      " ",
      /* @__PURE__ */ jsx4("button", { type: "button", onClick: () => void versions.refetch(), children: "Retry history" })
    ] }),
    save.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: "Theme draft saved. Readers still receive the published theme." }),
    client.publish && /* @__PURE__ */ jsx4(
      Button2,
      {
        className: "mt-4",
        type: "button",
        disabled: save.isPending || publish.isPending || !versions.data?.headVersion,
        onClick: () => publish.mutate(),
        children: "Publish"
      }
    ),
    publish.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: publish.error.message }),
    publish.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: publication?.status === "published" ? "Theme published." : "Theme Release submitted for review." }),
    versions.data && /* @__PURE__ */ jsxs3(
      "section",
      {
        "aria-label": "Theme history",
        className: "mt-4 space-y-2 rounded-lg border bg-card p-4 text-sm",
        children: [
          /* @__PURE__ */ jsx4("h2", { className: "font-semibold", children: "History" }),
          /* @__PURE__ */ jsxs3("p", { children: [
            "Published: ",
            versions.data.publishedReadable ?? "None"
          ] }),
          /* @__PURE__ */ jsx4("ul", { children: versions.data.versions.map((version) => /* @__PURE__ */ jsxs3("li", { children: [
            version.readable,
            version.id === versions.data?.headVersion ? " \xB7 Head" : "",
            version.id === versions.data?.publishedVersion ? " \xB7 Published" : "",
            /* @__PURE__ */ jsx4(VersionRecordingReferences, { recordings: version.recordings })
          ] }, version.id)) })
        ]
      }
    ),
    activeRelease && client.releaseCommand && /* @__PURE__ */ jsx4(
      ReleasePanel,
      {
        release: activeRelease,
        entries: [
          {
            id: entryId,
            title: label,
            versions: versions.data?.versions.map((version) => ({
              id: version.id,
              label: version.readable
            })) ?? []
          }
        ],
        onCommand: async (command) => {
          const next = await client.releaseCommand(
            activeRelease.id,
            command
          );
          setPublication(next);
          await Promise.all([versions.refetch(), query.refetch()]);
        }
      }
    ),
    client.listReleases && client.releaseCommand && /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsxs3("label", { children: [
        "Release",
        " ",
        /* @__PURE__ */ jsxs3(
          "select",
          {
            value: releaseId,
            onChange: (event) => setReleaseId(event.target.value),
            children: [
              /* @__PURE__ */ jsx4("option", { value: "", children: "Choose a Release" }),
              releases.data?.filter((release) => release.status !== "published").map((release) => /* @__PURE__ */ jsx4("option", { value: release.id, children: release.title }, release.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx4(
        Button2,
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

export {
  UxBuilderProvider,
  useUxBuilderServices,
  useNotify,
  useEntryBody,
  useSaveEntryBody,
  useRegionPreviews,
  KIND_ICON,
  UX_BUILDER_CSS,
  RegionEditorBody,
  RegionInspector,
  ThemeEditor
};
//# sourceMappingURL=chunk-UGYEPTUD.js.map