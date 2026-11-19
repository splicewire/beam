import {
  richMessage
} from "./chunk-5APTQIDU.js";
import {
  ReleasePanel,
  VersionRecordingReferences
} from "./chunk-E33ACEYB.js";
import {
  styleRegistry
} from "./chunk-J4K4YBKB.js";
import {
  NoticeError,
  notice,
  noticeOf,
  say
} from "./chunk-2G4AXCDS.js";
import {
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

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
  const m = useBeamUxMessages();
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
        message: savesDraft ? m.t("splicewire-beam-ux::messages.save_draft_saved") : m.t("splicewire-beam-ux::messages.save_saved")
      });
    },
    onError: () => {
      notify({ type: "error", message: m.t("splicewire-beam-ux::messages.save_failed") });
    }
  });
  return {
    ...mutation,
    saveLabel: savesDraft ? m.t("splicewire-beam-ux::messages.save_draft") : void 0
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
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 border-t pt-4", children: [
    /* @__PURE__ */ jsx2(Button, { size: "sm", onClick: onSave, disabled: saving || saveDisabled, children: saving ? m.t("splicewire-beam-ux::messages.region_saving") : saveLabel ?? m.t("splicewire-beam-ux::messages.region_save") }),
    /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "ghost", onClick: onDiscard, disabled: saving || !onDiscard, children: m.t("splicewire-beam-ux::messages.region_discard") })
  ] });
}
function FormEditor({
  schema,
  body,
  onChange
}) {
  const m = useBeamUxMessages();
  if (!schema) {
    return /* @__PURE__ */ jsx2("div", { className: "rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.region_no_schema") });
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
  const m = useBeamUxMessages();
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
        "aria-label": m.t("splicewire-beam-ux::messages.region_mdx_source_label"),
        placeholder: m.t("splicewire-beam-ux::messages.region_mdx_placeholder"),
        className: "font-mono text-xs"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground", children: [
      fields.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10px]", children: m.t("splicewire-beam-ux::messages.region_preserved") }),
        fields.map((key) => /* @__PURE__ */ jsx2(
          "span",
          {
            className: "rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]",
            children: key
          },
          key
        ))
      ] }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10px]", children: m.t("splicewire-beam-ux::messages.region_no_frontmatter") }),
      /* @__PURE__ */ jsx2("span", { className: "ml-auto font-mono text-[10px]", children: m.t("splicewire-beam-ux::messages.region_mdx_source_tag") })
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
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-md border", children: [
    /* @__PURE__ */ jsx2("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsx2("div", { className: "border-b bg-muted/40 px-3 py-2 text-xs", children: richMessage(m, "splicewire-beam-ux::messages.region_frame_self_loading", { frame: /* @__PURE__ */ jsx2("span", { className: "font-mono", children: "frame:enrollment" }) }) }),
    /* @__PURE__ */ jsx2("div", { className: "divide-y", children: ["A. Mensah", "R. Okafor", "J. Park"].map((n) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsx2("span", { className: "flex-1", children: n }),
      /* @__PURE__ */ jsx2(Badge, { variant: "secondary", className: "text-[10px]", children: m.t("splicewire-beam-ux::messages.region_sample_enrolled") })
    ] }, n)) }),
    /* @__PURE__ */ jsx2("div", { className: "beam-ux-scrim pointer-events-none absolute inset-0" }),
    /* @__PURE__ */ jsx2("div", { className: "relative border-t bg-muted/40 px-3 py-1.5 text-center font-mono text-[10px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.region_frame_island_caption") })
  ] });
}
var LIST_ROWS = [
  { slug: "frontend-foundations", titleKey: "splicewire-beam-ux::messages.region_sample_frontend_foundations", formatKey: "splicewire-beam-ux::messages.region_format_cohort", seats: 8 },
  { slug: "data-modeling", titleKey: "splicewire-beam-ux::messages.region_sample_data_modeling", formatKey: "splicewire-beam-ux::messages.region_format_self_paced", seats: 0 },
  { slug: "live-systems-design", titleKey: "splicewire-beam-ux::messages.region_sample_live_systems_design", formatKey: "splicewire-beam-ux::messages.region_format_live", seats: 3 }
];
function ListEditor() {
  const m = useBeamUxMessages();
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
      /* @__PURE__ */ jsx2("p", { className: "mt-2 text-xs text-muted-foreground", children: richMessage(m, "splicewire-beam-ux::messages.region_list_explainer", { slug: /* @__PURE__ */ jsx2("span", { className: "font-mono", children: "{slug}" }) }) })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "divide-y rounded-md border", children: LIST_ROWS.map((r) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "flex items-center gap-3 px-3 py-2 text-sm",
          r.slug === slug && "bg-primary/5"
        ),
        children: [
          /* @__PURE__ */ jsx2("span", { className: "flex-1 font-medium", children: m.t(r.titleKey) }),
          /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "text-[10px]", children: m.t(r.formatKey) }),
          /* @__PURE__ */ jsx2("span", { className: "w-16 text-right font-mono text-xs text-muted-foreground", children: r.seats > 0 ? m.t("splicewire-beam-ux::messages.region_sample_seats", { count: r.seats }) : m.t("splicewire-beam-ux::messages.region_sample_full") })
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
  editorDisabled,
  publicationControls,
  previews = [],
  previewState = "unavailable"
}) {
  const m = useBeamUxMessages();
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
        region.url ? /* @__PURE__ */ jsx3("a", { href: region.url, target: "_blank", rel: "noopener noreferrer", children: m.t("splicewire-beam-ux::messages.inspector_view") }) : /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: m.t("splicewire-beam-ux::messages.inspector_view_unavailable") }),
        previewState === "loading" ? /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-ux::messages.inspector_preview_loading") }) : previewState === "unavailable" ? /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-ux::messages.inspector_preview_unavailable") }) : previews.length === 0 ? /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-ux::messages.inspector_no_open_release") }) : previews.map(
          (preview) => preview.href ? /* @__PURE__ */ jsx3(
            "a",
            {
              href: preview.href,
              target: "_blank",
              rel: "noopener noreferrer",
              children: m.t("splicewire-beam-ux::messages.inspector_preview_release", { title: preview.title })
            },
            preview.id
          ) : /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-ux::messages.inspector_preview_release_unavailable", { title: preview.title }) }, preview.id)
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "p-4", children: [
      /* @__PURE__ */ jsx3("fieldset", { disabled: editorDisabled, children: /* @__PURE__ */ jsx3(
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
      ) }),
      publicationControls,
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
  label: labelOverride,
  note: noteOverride
}) {
  const m = useBeamUxMessages();
  const label = labelOverride ?? m.t("splicewire-beam-ux::messages.theme_tokens");
  const note = noteOverride ?? m.t("splicewire-beam-ux::messages.theme_note");
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
        throw new NoticeError(notice("splicewire-beam-ux::messages.theme_requires_transport"));
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
        throw new NoticeError(notice("splicewire-beam-ux::messages.theme_choose_release_version"));
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
        throw new NoticeError(notice("splicewire-beam-ux::messages.theme_publication_unavailable"));
      const state = draft === null ? versions.data : await save.mutateAsync(draft);
      if (!state?.headVersion)
        throw new NoticeError(notice("splicewire-beam-ux::messages.theme_save_before_publish"));
      if (state.compileError) throw new Error(state.compileError);
      const result = await client.publish(entryId, state.headVersion);
      const release = result.release;
      if (!release) throw new NoticeError(notice("splicewire-beam-ux::messages.theme_no_release_returned"));
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
        children: m.t("splicewire-beam-ux::messages.theme_loading")
      }
    );
  }
  if (query.isError || !query.data) {
    return /* @__PURE__ */ jsx4(
      "p",
      {
        role: "alert",
        className: "rounded-lg border bg-card p-4 text-sm text-destructive",
        children: m.t("splicewire-beam-ux::messages.theme_load_failed")
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
      m.t("splicewire-beam-ux::messages.theme_token_breakpoint"),
      " ",
      /* @__PURE__ */ jsxs3(
        "select",
        {
          value: breakpoint,
          onChange: (e) => setBreakpoint(e.target.value),
          children: [
            /* @__PURE__ */ jsx4("option", { value: "", children: m.t("splicewire-beam-ux::messages.theme_base") }),
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
        saveLabel: m.t("splicewire-beam-ux::messages.theme_save_draft")
      }
    ),
    save.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: say(m, noticeOf(save.error, save.error.message)) }),
    versions.isError && /* @__PURE__ */ jsxs3("p", { role: "alert", children: [
      m.t("splicewire-beam-ux::messages.theme_history_load_failed"),
      " ",
      /* @__PURE__ */ jsx4("button", { type: "button", onClick: () => void versions.refetch(), children: m.t("splicewire-beam-ux::messages.theme_retry_history") })
    ] }),
    save.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: m.t("splicewire-beam-ux::messages.theme_draft_saved") }),
    client.publish && /* @__PURE__ */ jsx4(
      Button2,
      {
        className: "mt-4",
        type: "button",
        disabled: save.isPending || publish.isPending || !versions.data?.headVersion,
        onClick: () => publish.mutate(),
        children: m.t("splicewire-beam-ux::messages.theme_publish")
      }
    ),
    publish.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: say(m, noticeOf(publish.error, publish.error.message)) }),
    publish.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: publication?.status === "published" ? m.t("splicewire-beam-ux::messages.theme_published") : m.t("splicewire-beam-ux::messages.theme_submitted_for_review") }),
    versions.data && /* @__PURE__ */ jsxs3(
      "section",
      {
        "aria-label": m.t("splicewire-beam-ux::messages.theme_history_label"),
        className: "mt-4 space-y-2 rounded-lg border bg-card p-4 text-sm",
        children: [
          /* @__PURE__ */ jsx4("h2", { className: "font-semibold", children: m.t("splicewire-beam-ux::messages.theme_history") }),
          /* @__PURE__ */ jsx4("p", { children: m.t("splicewire-beam-ux::messages.theme_published_version", { version: versions.data.publishedReadable ?? m.t("splicewire-beam-ux::messages.theme_none") }) }),
          /* @__PURE__ */ jsx4("ul", { children: versions.data.versions.map((version) => /* @__PURE__ */ jsxs3("li", { children: [
            version.readable,
            version.id === versions.data?.headVersion ? ` ${m.t("splicewire-beam-ux::messages.theme_head_marker")}` : "",
            version.id === versions.data?.publishedVersion ? ` ${m.t("splicewire-beam-ux::messages.theme_published_marker")}` : "",
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
        m.t("splicewire-beam-ux::messages.theme_release"),
        " ",
        /* @__PURE__ */ jsxs3(
          "select",
          {
            value: releaseId,
            onChange: (event) => setReleaseId(event.target.value),
            children: [
              /* @__PURE__ */ jsx4("option", { value: "", children: m.t("splicewire-beam-ux::messages.theme_choose_release") }),
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
          children: m.t("splicewire-beam-ux::messages.theme_add_to_release")
        }
      ),
      join.isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: say(m, noticeOf(join.error, join.error.message)) }),
      join.isSuccess && /* @__PURE__ */ jsx4("p", { role: "status", children: m.t("splicewire-beam-ux::messages.theme_added_to_release") })
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
//# sourceMappingURL=chunk-MJ746IU4.js.map