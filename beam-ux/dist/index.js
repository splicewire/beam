import {
  KIND_ICON,
  RegionEditorBody,
  RegionInspector,
  ThemeEditor,
  UX_BUILDER_CSS,
  UxBuilderProvider,
  useEntryBody,
  useNotify,
  useRegionPreviews,
  useSaveEntryBody,
  useUxBuilderServices
} from "./chunk-UGYEPTUD.js";
import {
  ReleasePanel,
  ReleaseRecordingSummary,
  VersionRecordingReferences
} from "./chunk-SR6UINVU.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";

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

// src/RegionOverlay.tsx
import { X } from "lucide-react";
import { Badge, cn } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs("div", { className: cn("beam-ux-overlay rounded-lg border bg-card ring-1 ring-primary/20"), children: [
    /* @__PURE__ */ jsx("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 border-b px-4 py-3", children: [
      /* @__PURE__ */ jsx(Icon, { className: "mt-0.5 size-4 flex-none text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "truncate text-sm font-semibold", children: region.label }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted",
              title: "Dismiss overlay",
              "aria-label": "Dismiss overlay",
              children: /* @__PURE__ */ jsx(X, { className: "size-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-muted-foreground", children: region.recordLabel ?? region.recordId }),
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "font-mono text-[10px]", children: region.kind })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsx("p", { className: "mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground", children: region.note })
    ] })
  ] });
}

// src/RegionCanvas.tsx
import { Button, cn as cn2 } from "@schemastud/ui";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var LIST_ROWS = [
  { slug: "frontend-foundations", title: "Frontend Foundations" },
  { slug: "data-modeling", title: "Data Modeling" },
  { slug: "live-systems-design", title: "Live Systems Design" }
];
function bodyExcerpt(body) {
  if (!body) return "";
  if (!Array.isArray(body))
    return typeof body.content === "string" ? body.content.slice(0, 1200) : "";
  let result = "";
  let remainingNodes = 256;
  const walk = (nodes) => {
    for (const node of nodes) {
      if (remainingNodes-- <= 0 || result.length >= 1200) break;
      if (node.kind === "text") result += `${node.value} `.slice(0, 1200 - result.length);
      else if (node.kind === "block") walk(node.children);
    }
  };
  walk(body);
  return result.trim();
}
function RegionBlock({
  region,
  engaged,
  onEngage,
  body,
  bodyLoading = false,
  bodyError = false
}) {
  const Icon = KIND_ICON[region.kind];
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      role: "button",
      tabIndex: 0,
      onClick: onEngage,
      onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && onEngage(),
      "data-engaged": engaged ? "" : void 0,
      className: cn2(
        "beam-ux-region relative block w-full cursor-pointer rounded-lg border bg-card p-4 text-left transition-all",
        engaged ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/40"
      ),
      children: [
        /* @__PURE__ */ jsx2("style", { children: UX_BUILDER_CSS }),
        /* @__PURE__ */ jsxs2("div", { className: cn2(!engaged && "opacity-90"), children: [
          region.kind === "richtext" && /* @__PURE__ */ jsx2("p", { className: "whitespace-pre-wrap break-words text-sm text-muted-foreground", children: !engaged ? "Engage to preview the saved body." : bodyError ? "Body unavailable." : bodyLoading ? "Loading saved body\u2026" : bodyExcerpt(body) || "No text in this body." }),
          region.kind === "form" && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx2("div", { className: "text-[11px] font-medium uppercase tracking-wide text-primary", children: "New cohort" }),
              /* @__PURE__ */ jsx2("div", { className: "text-lg font-semibold", children: "Frontend Foundations" }),
              /* @__PURE__ */ jsx2("div", { className: "text-xs text-muted-foreground", children: "cohort \xB7 8 seats left" })
            ] }),
            /* @__PURE__ */ jsx2(Button, { size: "sm", children: "Enroll" })
          ] }),
          region.kind === "frame" && /* @__PURE__ */ jsx2("div", { className: "text-sm text-muted-foreground", children: "Enrollment roster \xB7 3 enrolled" }),
          region.kind === "list" && /* @__PURE__ */ jsx2("div", { className: "flex gap-2", children: LIST_ROWS.map((r) => /* @__PURE__ */ jsx2(
            "span",
            {
              className: "rounded border bg-background px-2 py-1 text-xs",
              children: r.title
            },
            r.slug
          )) })
        ] }),
        /* @__PURE__ */ jsxs2(
          "span",
          {
            className: cn2(
              "beam-ux-region-tab absolute left-3 flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px]",
              engaged && "border-primary text-primary"
            ),
            children: [
              /* @__PURE__ */ jsx2(Icon, { className: "size-3" }),
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
  onEngage,
  body,
  bodyLoading,
  bodyError
}) {
  return /* @__PURE__ */ jsx2("div", { className: "space-y-4", children: regions.map((r) => /* @__PURE__ */ jsx2(
    RegionBlock,
    {
      region: r,
      engaged: engaged === r.id,
      onEngage: () => onEngage(r.id),
      body: engaged === r.id ? body : void 0,
      bodyLoading,
      bodyError
    },
    r.id
  )) });
}

// src/StructurePanel.tsx
import { cn as cn3 } from "@schemastud/ui";
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function TreeRow({
  node,
  depth,
  selected,
  onSelect
}) {
  const isRegion = node.kind === "region";
  const isSel = isRegion && node.regionId === selected;
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsxs3(
      "button",
      {
        type: "button",
        disabled: !isRegion,
        onClick: () => isRegion && node.regionId && onSelect(node.regionId),
        style: { paddingLeft: 8 + depth * 16 },
        className: cn3(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors",
          isRegion ? "hover:bg-muted/60" : "cursor-default text-muted-foreground",
          isSel && "bg-primary/5 font-medium text-foreground"
        ),
        children: [
          /* @__PURE__ */ jsx3("span", { className: "font-mono text-[10px] uppercase text-muted-foreground/70", children: node.kind[0] }),
          /* @__PURE__ */ jsx3("span", { className: "truncate", children: node.label })
        ]
      }
    ),
    node.children?.map((c) => /* @__PURE__ */ jsx3(TreeRow, { node: c, depth: depth + 1, selected, onSelect }, c.id))
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
  return /* @__PURE__ */ jsxs3("div", { className: "beam-ux-structure-grid grid grid-cols-1 gap-6", children: [
    /* @__PURE__ */ jsx3("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs3("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs3("section", { className: "rounded-lg border bg-card", children: [
        /* @__PURE__ */ jsxs3("div", { className: "border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: [
          "Composition tree \u2014 ",
          treeKindPath(pageTree)
        ] }),
        /* @__PURE__ */ jsx3("div", { className: "p-2", children: /* @__PURE__ */ jsx3(TreeRow, { node: pageTree, depth: 0, selected, onSelect }) })
      ] }),
      selectedRegion && /* @__PURE__ */ jsxs3("section", { children: [
        /* @__PURE__ */ jsx3("div", { className: "mb-2 flex items-center gap-2", children: /* @__PURE__ */ jsx3("span", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Placement config" }) }),
        renderEditor(selectedRegion)
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("aside", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx3("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Component palette" }),
      palette.map((p) => {
        const Icon = KIND_ICON[p.kind];
        return /* @__PURE__ */ jsxs3(
          "div",
          {
            className: "flex items-start gap-3 rounded-lg border border-dashed bg-card p-3",
            children: [
              /* @__PURE__ */ jsx3(Icon, { className: "mt-0.5 size-4 flex-none text-muted-foreground" }),
              /* @__PURE__ */ jsxs3("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx3("div", { className: "text-sm font-medium", children: p.label }),
                /* @__PURE__ */ jsx3("div", { className: "text-xs text-muted-foreground", children: p.hint })
              ] }),
              /* @__PURE__ */ jsx3("span", { className: "cursor-grab select-none text-muted-foreground", children: "\u282F" })
            ]
          },
          p.key
        );
      }),
      /* @__PURE__ */ jsx3("p", { className: "px-1 text-[11px] leading-relaxed text-muted-foreground", children: "Structure = the page-composition layer, kept separate from overlay editing. Drag a component into a placement; overlay mode then edits it in situ." })
    ] })
  ] });
}

// src/UxBuilder.tsx
import { LayoutTemplate, MousePointerSquareDashed } from "lucide-react";
import { useMemo, useState } from "react";
import { cn as cn4 } from "@schemastud/ui";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function placementFor(kind, placement) {
  if (kind === "list") return "overlay";
  return placement;
}
function useRegionEditor(region) {
  const query = useEntryBody(region.recordId);
  const save = useSaveEntryBody();
  const [draft, setDraft] = useState(null);
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
    saving: save.isPending,
    saveLabel: save.saveLabel
  };
}
function RegionInspectorConnected({ region }) {
  const editor = useRegionEditor(region);
  const preview = useRegionPreviews(region.recordId);
  return /* @__PURE__ */ jsx4(RegionInspector, { region, ...editor, ...preview });
}
function RegionOverlayConnected({ region, onClose }) {
  const editor = useRegionEditor(region);
  return /* @__PURE__ */ jsx4(RegionOverlay, { region, onClose, ...editor });
}
function ModeToggle({ mode, onChange }) {
  return /* @__PURE__ */ jsx4("div", { className: "flex items-center rounded-md border bg-card p-0.5 text-xs", children: ["overlay", "structure"].map((m) => /* @__PURE__ */ jsxs4(
    "button",
    {
      type: "button",
      onClick: () => onChange(m),
      className: cn4(
        "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium capitalize transition-colors",
        mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      ),
      children: [
        m === "overlay" ? /* @__PURE__ */ jsx4(MousePointerSquareDashed, { className: "size-3.5" }) : /* @__PURE__ */ jsx4(LayoutTemplate, { className: "size-3.5" }),
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
  const [mode, setMode] = useState(initialMode);
  const [engaged, setEngaged] = useState(initialEngaged ?? regions[0]?.id ?? null);
  const [selected, setSelected] = useState(regions[0]?.id ?? null);
  const active = useMemo(() => regions.find((r) => r.id === engaged) ?? null, [regions, engaged]);
  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selected) ?? null,
    [regions, selected]
  );
  const activeBody = useEntryBody(mode === "overlay" ? active?.recordId ?? null : null);
  const dockPlacement = active ? placementFor(active.kind, editorPlacement) : editorPlacement;
  const dockInInspector = dockPlacement === "inspector";
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx4("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx4("span", { className: "beam-ux-mode-hint font-mono text-[11px] text-muted-foreground", children: "editing the app\u2019s own front-end" }),
      /* @__PURE__ */ jsx4(ModeToggle, { mode, onChange: setMode })
    ] }),
    mode === "structure" ? /* @__PURE__ */ jsx4(
      StructurePanel,
      {
        pageTree,
        palette,
        selected,
        selectedRegion,
        onSelect: setSelected,
        renderEditor: (region) => /* @__PURE__ */ jsx4(RegionInspectorConnected, { region }, region.id)
      }
    ) : dockInInspector ? (
      /* INSPECTOR placement — docked right-hand column, always present. */
      /* @__PURE__ */ jsxs4("div", { className: "beam-ux-inspector-grid grid grid-cols-1 gap-6", children: [
        /* @__PURE__ */ jsx4(
          RegionCanvas,
          {
            regions,
            engaged,
            onEngage: setEngaged,
            body: activeBody.data?.body,
            bodyLoading: activeBody.isPending,
            bodyError: activeBody.isError
          }
        ),
        /* @__PURE__ */ jsx4("aside", { className: "lg:sticky lg:top-2 lg:self-start", children: active ? /* @__PURE__ */ jsx4(RegionInspectorConnected, { region: active }, active.id) : /* @__PURE__ */ jsx4("div", { className: "rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground", children: "Engage a region on the left to edit it here." }) })
      ] })
    ) : (
      /* OVERLAY placement — full-width canvas + a floating in-context panel. */
      /* @__PURE__ */ jsxs4("div", { className: "relative", children: [
        /* @__PURE__ */ jsx4("div", { className: "max-w-3xl", children: /* @__PURE__ */ jsx4(
          RegionCanvas,
          {
            regions,
            engaged,
            onEngage: setEngaged,
            body: activeBody.data?.body,
            bodyLoading: activeBody.isPending,
            bodyError: activeBody.isError
          }
        ) }),
        active && /* @__PURE__ */ jsx4("div", { className: "beam-ux-overlay-dock", children: /* @__PURE__ */ jsx4(
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
import { jsx as jsx5 } from "react/jsx-runtime";
function AuthorNote({ children, className }) {
  if (!import.meta.env?.DEV) {
    return null;
  }
  return /* @__PURE__ */ jsx5(
    "span",
    {
      "data-author-note": "",
      title: "Author note (development builds only)",
      className: ["font-mono text-[10px] text-muted-foreground/70", className].filter(Boolean).join(" "),
      children
    }
  );
}

// src/FilesComparisonPanel.tsx
import { useEffect, useId, useRef, useState as useState2 } from "react";
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var buttonClassName = "inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50";
function FilesComparisonPanel({ memberId, client, editorHref }) {
  const [inspection, setInspection] = useState2(null);
  const [confirmation, setConfirmation] = useState2(null);
  const [busy, setBusy] = useState2(false);
  const [error, setError] = useState2("");
  const [result, setResult] = useState2(null);
  const [batchResult, setBatchResult] = useState2(null);
  const [resultFormat, setResultFormat] = useState2(null);
  const confirmButton = useRef(null);
  const takeButton = useRef(null);
  const restoreButton = useRef(null);
  const remirrorButton = useRef(null);
  const takeAllButton = useRef(null);
  const returnFocus = useRef(null);
  const reloadButton = useRef(null);
  const requestEpoch = useRef(0);
  const headingId = useId();
  const load = async () => {
    const epoch = ++requestEpoch.current;
    setBusy(true);
    setError("");
    setConfirmation(null);
    setInspection(null);
    try {
      if (!client.inspectReleaseFile) throw new Error("File inspection is unavailable in this host.");
      const response = await client.inspectReleaseFile(memberId);
      if (epoch === requestEpoch.current) setInspection(response);
    } catch (failure) {
      if (epoch === requestEpoch.current) setError(failure instanceof Error ? failure.message : "Comparison failed.");
    } finally {
      if (epoch === requestEpoch.current) setBusy(false);
    }
  };
  useEffect(() => {
    setResult(null);
    setBatchResult(null);
    setResultFormat(null);
    void load();
    return () => {
      requestEpoch.current++;
    };
  }, [memberId, client]);
  useEffect(() => {
    if (confirmation && !busy && !error) confirmButton.current?.focus();
    else if (!confirmation && !busy && returnFocus.current) {
      ((returnFocus.current === "take" ? takeButton : returnFocus.current === "restore" ? restoreButton : returnFocus.current === "remirror" ? remirrorButton : takeAllButton).current ?? reloadButton.current)?.focus();
      returnFocus.current = null;
    }
  }, [confirmation, busy, error]);
  const cancel = () => {
    returnFocus.current = confirmation?.action ?? null;
    setConfirmation(null);
  };
  const capture = (action) => {
    if (!inspection?.workingHeadVersion || !inspection.publishedVersion || !inspection.fingerprint) return;
    setConfirmation({ action, input: {
      expectedHeadVersion: inspection.workingHeadVersion,
      expectedPublishedVersion: inspection.publishedVersion,
      expectedFileExists: inspection.fileExists,
      expectedFileSha256: inspection.fileSha256,
      fingerprint: inspection.fingerprint,
      confirmed: true
    } });
    setError("");
  };
  const captureAll = () => {
    if (!inspection?.canTakeAll || !inspection.takeAllItems || inspection.takeAllItems.length < 1) return;
    setConfirmation({ action: "takeAll", input: { items: inspection.takeAllItems.map(({ path: _path, ...item }) => ({ ...item })), confirmed: true } });
    setError("");
  };
  const submit = async () => {
    if (!confirmation) return;
    const action = confirmation.action;
    if (action === "take" && !client.takeReleaseFile || action === "restore" && !client.restoreMissingReleaseFile || action === "remirror" && !client.remirrorReleaseFile || action === "takeAll" && !client.takeAllReleaseFiles) return;
    const epoch = requestEpoch.current;
    const format = inspection?.format ?? null;
    setBusy(true);
    setError("");
    try {
      if (action === "takeAll") {
        const response = await client.takeAllReleaseFiles(memberId, confirmation.input);
        if (epoch !== requestEpoch.current) return;
        setBatchResult(response);
        setResult(null);
      } else {
        const operation = action === "take" ? client.takeReleaseFile : action === "restore" ? client.restoreMissingReleaseFile : client.remirrorReleaseFile;
        const response = await operation.call(client, memberId, confirmation.input);
        if (epoch !== requestEpoch.current) return;
        setResult(response);
        setBatchResult(null);
        setResultFormat(format);
      }
      returnFocus.current = action;
      setConfirmation(null);
      if (client.inspectReleaseFile) {
        const updated = await client.inspectReleaseFile(memberId);
        if (epoch === requestEpoch.current) setInspection(updated);
      }
    } catch (failure) {
      if (epoch !== requestEpoch.current) return;
      setInspection(null);
      setError(failure instanceof Error ? failure.message : "Nothing could be confirmed. Reload comparison.");
    } finally {
      if (epoch === requestEpoch.current) setBusy(false);
    }
  };
  const drafted = result?.status === "drafted" || result?.status === "drafted-with-compile-error";
  const compileFailed = result?.status === "drafted-with-compile-error" || result?.diagnostic?.code === "compile-failed";
  const mdxLinkRefused = resultFormat === "mdx" || inspection?.format === "mdx" || inspection?.path?.toLowerCase().endsWith(".mdx");
  const href = inspection && result && !mdxLinkRefused && editorHref?.(result.entryId);
  return /* @__PURE__ */ jsxs5("section", { "aria-labelledby": headingId, "aria-busy": busy, className: "space-y-4 rounded-lg border bg-card p-4 text-card-foreground", children: [
    /* @__PURE__ */ jsx6("h2", { id: headingId, className: "text-lg font-semibold", children: "Current published file" }),
    /* @__PURE__ */ jsx6("p", { children: "Compare the local file with the entry\u2019s current published pin. The historical Release member above stays fixed." }),
    /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: reloadButton, type: "button", disabled: busy, onClick: () => void load(), children: "Reload comparison" }),
    error && /* @__PURE__ */ jsxs5("p", { role: "alert", children: [
      error,
      " The captured inspection is retained. Reload explicitly before a new attempt."
    ] }),
    result && /* @__PURE__ */ jsxs5("div", { className: "space-y-2 rounded border bg-muted p-3 text-foreground", children: [
      compileFailed ? /* @__PURE__ */ jsx6("p", { role: "alert", children: "Draft retained; compilation failed. Published content is unchanged. Review the draft before publication." }) : /* @__PURE__ */ jsx6("p", { role: "status", children: result.message }),
      /* @__PURE__ */ jsxs5("p", { className: "break-all text-sm", children: [
        "Returned working head: ",
        result.headVersion ?? "Unavailable",
        ". Published pin: ",
        result.publishedVersion ?? "Unavailable",
        "."
      ] }),
      compileFailed && /* @__PURE__ */ jsx6("p", { className: "text-sm", children: "This warning describes the save response; later comparison reads do not provide stored compilation history." })
    ] }),
    batchResult && /* @__PURE__ */ jsxs5("p", { role: "status", children: [
      batchResult.count,
      " files were taken as drafts. Published pins and local files are unchanged."
    ] }),
    drafted && href && /* @__PURE__ */ jsx6("a", { href, children: "Open entry" }),
    inspection && /* @__PURE__ */ jsxs5(Fragment2, { children: [
      /* @__PURE__ */ jsxs5("p", { children: [
        /* @__PURE__ */ jsx6("strong", { children: inspection.state }),
        " \u2014 ",
        inspection.message
      ] }),
      /* @__PURE__ */ jsxs5("dl", { children: [
        /* @__PURE__ */ jsx6("dt", { children: "File" }),
        /* @__PURE__ */ jsx6("dd", { children: inspection.path ?? "Unavailable" }),
        /* @__PURE__ */ jsx6("dt", { children: "Working head" }),
        /* @__PURE__ */ jsx6("dd", { className: "break-all", children: inspection.workingHeadVersion }),
        /* @__PURE__ */ jsx6("dt", { children: "Current published pin" }),
        /* @__PURE__ */ jsx6("dd", { className: "break-all", children: inspection.publishedVersion })
      ] }),
      inspection.sourceTruncated && /* @__PURE__ */ jsx6("p", { children: "Source previews are truncated. Validation uses the complete bounded file." }),
      /* @__PURE__ */ jsxs5("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx6("h3", { children: "Current published bytes" }),
          /* @__PURE__ */ jsx6("pre", { className: "max-h-80 overflow-auto whitespace-pre-wrap text-xs", children: inspection.publishedSource ?? "Unavailable" })
        ] }),
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx6("h3", { children: "Local bytes" }),
          /* @__PURE__ */ jsx6("pre", { className: "max-h-80 overflow-auto whitespace-pre-wrap text-xs", children: inspection.localSource ?? (inspection.fileExists ? "Unavailable" : "Missing") })
        ] })
      ] }),
      !confirmation && /* @__PURE__ */ jsxs5("div", { className: "flex gap-4", children: [
        inspection.canTake && client.takeReleaseFile && /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: takeButton, type: "button", disabled: busy, onClick: () => capture("take"), children: "Take file as draft" }),
        inspection.canRestore && client.restoreMissingReleaseFile && /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: restoreButton, type: "button", disabled: busy, onClick: () => capture("restore"), children: "Restore missing published file" }),
        inspection.state === "differs" && inspection.canRemirror && client.remirrorReleaseFile && /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: remirrorButton, type: "button", disabled: busy, onClick: () => capture("remirror"), children: "Re-mirror published file" }),
        inspection.canTakeAll && client.takeAllReleaseFiles && /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: takeAllButton, type: "button", disabled: busy, onClick: captureAll, children: "Take all as drafts" })
      ] }),
      inspection.fileExists && inspection.state !== "unchanged" && /* @__PURE__ */ jsx6("p", { children: "Restore never overwrites an existing file. Preserve or move it before restoring a missing published file." })
    ] }),
    confirmation && /* @__PURE__ */ jsxs5("div", { role: "group", "aria-label": "Confirm file reconciliation", className: "flex flex-wrap items-center gap-3 rounded border p-3", children: [
      /* @__PURE__ */ jsx6("p", { children: confirmation.action === "take" ? "Replace the inspected working draft with this admitted local file body? Prior versions remain in history. The published pin, local file and Git stay unchanged. Publish separately through ordinary review." : confirmation.action === "restore" ? "Create the missing file from the current published pin? Draft, history and Git stay unchanged. Any appearing file blocks creation. An incomplete file is preserved for explicit inspection or moving before retry." : confirmation.action === "remirror" ? "Replace this exact local file with the current published version? Draft and history stay unchanged. If the file changes after inspection, the server refuses and preserves it." : `Take all ${confirmation.input.items.length} changed files as drafts? Published pins and local files remain unchanged; any stale member blocks the entire batch.` }),
      confirmation.action === "takeAll" ? /* @__PURE__ */ jsxs5(Fragment2, { children: [
        /* @__PURE__ */ jsxs5("p", { className: "break-all text-xs", children: [
          "Captured ",
          confirmation.input.items.length,
          " member file states for this batch:"
        ] }),
        /* @__PURE__ */ jsx6("ul", { className: "list-disc pl-5", children: inspection?.takeAllItems?.map((item) => /* @__PURE__ */ jsx6("li", { className: "break-all", children: item.path }, item.memberId)) })
      ] }) : /* @__PURE__ */ jsxs5("p", { className: "break-all text-xs", children: [
        "Captured head ",
        confirmation.input.expectedHeadVersion,
        "; published ",
        confirmation.input.expectedPublishedVersion,
        "; file ",
        confirmation.input.expectedFileSha256 ?? "absent",
        "."
      ] }),
      /* @__PURE__ */ jsx6("button", { className: buttonClassName, ref: confirmButton, type: "button", disabled: busy || !!error, onClick: () => void submit(), children: confirmation.action === "take" ? "Confirm take file as draft" : confirmation.action === "restore" ? "Confirm restore missing file" : confirmation.action === "remirror" ? "Confirm Re-mirror" : "Confirm take all as drafts" }),
      /* @__PURE__ */ jsx6("button", { className: buttonClassName, type: "button", disabled: busy, onClick: cancel, children: "Cancel" })
    ] })
  ] });
}
export {
  AuthorNote,
  FilesComparisonPanel,
  RegionBlock,
  RegionCanvas,
  RegionInspector,
  RegionOverlay,
  ReleasePanel,
  ReleaseRecordingSummary,
  StructurePanel,
  ThemeEditor,
  UX_BUILDER_CSS,
  UxBuilder,
  UxBuilderProvider,
  VersionRecordingReferences,
  placementFor,
  useCan,
  useEntryBody,
  useNotify,
  useSaveEntryBody,
  useUxBuilderServices
};
//# sourceMappingURL=index.js.map