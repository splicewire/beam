import {
  messageOf,
  statusOf
} from "./chunk-2FFLR2EZ.js";
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
} from "./chunk-MJ746IU4.js";
import "./chunk-5APTQIDU.js";
import {
  ReleasePanel,
  ReleaseRecordingSummary,
  VersionRecordingReferences
} from "./chunk-E33ACEYB.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";
import {
  NoticeError,
  notice,
  noticeOf,
  say
} from "./chunk-2G4AXCDS.js";
import {
  englishBeamUxMessages,
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

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
  saveLabel,
  saveDisabled,
  editorDisabled,
  publicationControls,
  onClose
}) {
  const m = useBeamUxMessages();
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
              title: m.t("splicewire-beam-ux::messages.overlay_dismiss"),
              "aria-label": m.t("splicewire-beam-ux::messages.overlay_dismiss"),
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
      /* @__PURE__ */ jsx("fieldset", { disabled: editorDisabled, children: /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsx("p", { className: "mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground", children: region.note })
    ] })
  ] });
}

// src/RegionCanvas.tsx
import { Button, cn as cn2 } from "@schemastud/ui";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var LIST_ROWS = [
  { slug: "frontend-foundations", titleKey: "splicewire-beam-ux::messages.region_sample_frontend_foundations" },
  { slug: "data-modeling", titleKey: "splicewire-beam-ux::messages.region_sample_data_modeling" },
  { slug: "live-systems-design", titleKey: "splicewire-beam-ux::messages.region_sample_live_systems_design" }
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
  const m = useBeamUxMessages();
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
          region.kind === "richtext" && /* @__PURE__ */ jsx2("p", { className: "whitespace-pre-wrap break-words text-sm text-muted-foreground", children: !engaged ? m.t("splicewire-beam-ux::messages.region_engage_to_preview") : bodyError ? m.t("splicewire-beam-ux::messages.region_body_unavailable") : bodyLoading ? m.t("splicewire-beam-ux::messages.region_body_loading") : bodyExcerpt(body) || m.t("splicewire-beam-ux::messages.region_body_no_text") }),
          region.kind === "form" && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx2("div", { className: "text-[11px] font-medium uppercase tracking-wide text-primary", children: m.t("splicewire-beam-ux::messages.region_sample_new_cohort") }),
              /* @__PURE__ */ jsx2("div", { className: "text-lg font-semibold", children: m.t("splicewire-beam-ux::messages.region_sample_frontend_foundations") }),
              /* @__PURE__ */ jsx2("div", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.region_sample_cohort_seats") })
            ] }),
            /* @__PURE__ */ jsx2(Button, { size: "sm", children: m.t("splicewire-beam-ux::messages.region_sample_enroll") })
          ] }),
          region.kind === "frame" && /* @__PURE__ */ jsx2("div", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.region_sample_enrollment_roster") }),
          region.kind === "list" && /* @__PURE__ */ jsx2("div", { className: "flex gap-2", children: LIST_ROWS.map((r) => /* @__PURE__ */ jsx2(
            "span",
            {
              className: "rounded border bg-background px-2 py-1 text-xs",
              children: m.t(r.titleKey)
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
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs3("div", { className: "beam-ux-structure-grid grid grid-cols-1 gap-6", children: [
    /* @__PURE__ */ jsx3("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs3("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs3("section", { className: "rounded-lg border bg-card", children: [
        /* @__PURE__ */ jsx3("div", { className: "border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: m.t("splicewire-beam-ux::messages.structure_composition_tree", { path: treeKindPath(pageTree) }) }),
        /* @__PURE__ */ jsx3("div", { className: "p-2", children: /* @__PURE__ */ jsx3(TreeRow, { node: pageTree, depth: 0, selected, onSelect }) })
      ] }),
      selectedRegion && /* @__PURE__ */ jsxs3("section", { children: [
        /* @__PURE__ */ jsx3("div", { className: "mb-2 flex items-center gap-2", children: /* @__PURE__ */ jsx3("span", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: m.t("splicewire-beam-ux::messages.structure_placement_config") }) }),
        renderEditor(selectedRegion)
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("aside", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx3("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: m.t("splicewire-beam-ux::messages.structure_component_palette") }),
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
      /* @__PURE__ */ jsx3("p", { className: "px-1 text-[11px] leading-relaxed text-muted-foreground", children: m.t("splicewire-beam-ux::messages.structure_explainer") })
    ] })
  ] });
}

// src/UxBuilder.tsx
import { LayoutTemplate, MousePointerSquareDashed } from "lucide-react";
import { useMemo, useState as useState2 } from "react";
import { cn as cn4 } from "@schemastud/ui";

// src/use-region-publication.tsx
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function useRegionPublication(id, bodyBound, readOnly = false) {
  const m = useBeamUxMessages();
  const { client } = useUxBuilderServices();
  const notify = useNotify();
  const cache = useQueryClient();
  const query = useEntryBody(id);
  const complete = Boolean(client.saveDraft && client.publish && client.listVersions && client.restoreVersion);
  const incomplete = bodyBound && !complete && Boolean(client.saveDraft || client.publish || client.listVersions || client.restoreVersion);
  const publicationEnabled = bodyBound && complete;
  const [loaded, setLoaded] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState(null);
  const [notice2, setNotice] = useState(null);
  const [history, setHistory] = useState(null);
  const [choice, setChoice] = useState(null);
  const read = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const before = await client.listVersions(id);
      const envelope2 = await client.loadBody(id);
      const state = await client.listVersions(id);
      if (before.headVersion === state.headVersion) return { envelope: envelope2, state };
    }
    throw new NoticeError(notice("splicewire-beam-ux::messages.publication_changed_while_loading"));
  };
  useEffect(() => {
    if (!publicationEnabled) return;
    let live = true;
    read().then((value) => {
      if (live) setLoaded(value);
    }).catch((failure) => {
      if (live) setError(noticeOf(failure, notice("splicewire-beam-ux::messages.publication_history_load_failed")));
    });
    return () => {
      live = false;
    };
  }, [id, client, publicationEnabled]);
  const envelope = loaded?.envelope ?? query.data;
  const body = draft ?? envelope?.body ?? {};
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(envelope?.body ?? {});
  const refreshBody = (value) => {
    cache.setQueryData(["beam-ux", "entry-body", id], value);
    void cache.invalidateQueries({ queryKey: ["beam-ux", "entry-body", id] });
  };
  const run = async (action) => {
    if (locked.current || readOnly || incomplete || !bodyBound) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (failure) {
      const status = failure?.response?.status ?? failure?.status;
      const message = status === 409 ? notice("splicewire-beam-ux::messages.publication_conflict") : status === 403 ? notice("splicewire-beam-ux::messages.publication_forbidden") : noticeOf(failure, notice("splicewire-beam-ux::messages.publication_action_failed"));
      setError(message);
      notify({ type: "error", message: say(m, message) });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const save = async () => {
    if (!loaded || !client.saveDraft) throw new NoticeError(notice("splicewire-beam-ux::messages.publication_history_not_loaded"));
    const sent = body;
    const state = await client.saveDraft(id, sent, loaded.state.headVersion, "UX builder draft");
    if (!state.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.publication_save_returned_no_version"));
    const nextEnvelope = { ...loaded.envelope, body: sent };
    setLoaded({ envelope: nextEnvelope, state });
    setDraft(null);
    setHistory(null);
    refreshBody(nextEnvelope);
    return state;
  };
  const onSave = () => void run(async () => {
    if (publicationEnabled) {
      await save();
      setNotice(notice("splicewire-beam-ux::messages.publication_draft_saved"));
      notify({ type: "success", message: m.t("splicewire-beam-ux::messages.publication_draft_saved") });
    } else {
      const value = await client.saveBody(id, body);
      refreshBody(value);
      setDraft(null);
      notify({ type: "success", message: m.t("splicewire-beam-ux::messages.publication_saved") });
    }
  });
  const publishRef = async (ref) => {
    const state = await client.publish(id, ref);
    setLoaded((previous) => previous && { ...previous, state });
    setHistory(null);
    setChoice(null);
    const message = state.compileError ? notice("splicewire-beam-ux::messages.publication_failed", { error: state.compileError }) : state.release && state.release.status !== "published" ? notice("splicewire-beam-ux::messages.publication_release_status", { status: state.release.status }) : state.publishedVersion === ref ? notice("splicewire-beam-ux::messages.publication_published") : notice("splicewire-beam-ux::messages.publication_pending");
    setNotice(message);
    notify({ type: state.compileError ? "error" : "success", message: say(m, message) });
  };
  const publish = () => void run(async () => {
    if (!loaded) throw new NoticeError(notice("splicewire-beam-ux::messages.publication_history_not_loaded"));
    const state = dirty ? await save() : loaded.state;
    if (!state.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.publication_requires_saved_version"));
    if (client.previewVersion || client.listReleases && client.releaseCommand) {
      const releases = client.listReleases && client.releaseCommand ? (await client.listReleases()).filter((release) => ["draft", "in_review", "approved", "scheduled"].includes(release.status)) : [];
      setChoice({ ref: state.headVersion, releases, selected: releases[0]?.id ?? "" });
    } else await publishRef(state.headVersion);
  });
  const preview = (ref) => {
    if (!client.previewVersion) return;
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      setError(notice("splicewire-beam-ux::messages.publication_allow_popups"));
      return;
    }
    tab.opener = null;
    void run(async () => {
      try {
        const value = await client.previewVersion(id, ref);
        tab.location.href = value.url;
      } catch (failure) {
        tab.close();
        throw failure;
      }
    });
  };
  const controls = publicationEnabled && !readOnly ? /* @__PURE__ */ jsxs4("section", { "aria-label": m.t("splicewire-beam-ux::messages.publication_label"), className: "space-y-2 border-t p-3", children: [
    !loaded && error && /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy, onClick: () => void run(async () => {
      setLoaded(await read());
    }), children: m.t("splicewire-beam-ux::messages.publication_retry_history") }),
    loaded && /* @__PURE__ */ jsxs4("p", { children: [
      loaded.state.headReadable ? m.t("splicewire-beam-ux::messages.publication_draft_version", { version: loaded.state.headReadable }) : m.t("splicewire-beam-ux::messages.publication_no_saved_draft"),
      loaded.state.publishedReadable ? ` ${m.t("splicewire-beam-ux::messages.publication_readers_see", { version: loaded.state.publishedReadable })}` : ` ${m.t("splicewire-beam-ux::messages.publication_not_published")}`
    ] }),
    error && loaded && /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || dirty || !!choice, onClick: () => void run(async () => {
      const value = await read();
      setLoaded(value);
      setHistory(null);
      refreshBody(value.envelope);
    }), children: m.t("splicewire-beam-ux::messages.publication_reload_server_version") }),
    /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || !loaded || !!choice, onClick: publish, children: m.t("splicewire-beam-ux::messages.publication_publish") }),
    /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || !loaded || !!choice, onClick: () => void run(async () => {
      if (history) setHistory(null);
      else setHistory(await client.listVersions(id));
    }), children: m.t("splicewire-beam-ux::messages.publication_history") }),
    choice && /* @__PURE__ */ jsxs4("div", { role: "dialog", "aria-label": m.t("splicewire-beam-ux::messages.publication_publish_saved_version"), children: [
      /* @__PURE__ */ jsx4("p", { children: m.t("splicewire-beam-ux::messages.publication_choice_prompt") }),
      /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy, onClick: () => void run(() => publishRef(choice.ref)), children: m.t("splicewire-beam-ux::messages.publication_publish_now") }),
      client.previewVersion && /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy, onClick: () => preview(choice.ref), children: m.t("splicewire-beam-ux::messages.publication_preview_saved_version") }),
      client.listReleases && client.releaseCommand && /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4("select", { "aria-label": m.t("splicewire-beam-ux::messages.publication_open_release"), disabled: busy, value: choice.selected, onChange: (event) => setChoice({ ...choice, selected: event.target.value }), children: choice.releases.map((release) => /* @__PURE__ */ jsx4("option", { value: release.id, children: release.title }, release.id)) }),
        /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || !choice.selected, onClick: () => void run(async () => {
          const updated = await client.releaseCommand(choice.selected, { action: "member", entryId: id, ref: choice.ref });
          setNotice(notice("splicewire-beam-ux::messages.publication_added_to_release", { title: updated.title }));
          setChoice(null);
        }), children: m.t("splicewire-beam-ux::messages.publication_add_to_release") })
      ] }),
      /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy, onClick: () => setChoice(null), children: m.t("splicewire-beam-ux::messages.publication_cancel") })
    ] }),
    history && /* @__PURE__ */ jsxs4("aside", { "aria-label": m.t("splicewire-beam-ux::messages.publication_history"), children: [
      history.versions.length === 0 && /* @__PURE__ */ jsx4("p", { children: m.t("splicewire-beam-ux::messages.publication_no_versions") }),
      history.versions.map((version) => /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsxs4("span", { children: [
          version.readable,
          version.isPublished ? ` ${m.t("splicewire-beam-ux::messages.publication_published_marker")}` : "",
          version.isHead ? ` ${m.t("splicewire-beam-ux::messages.publication_draft_marker")}` : ""
        ] }),
        client.previewVersion && /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || !!choice, onClick: () => preview(version.id), children: m.t("splicewire-beam-ux::messages.publication_preview_version", { version: version.readable }) }),
        /* @__PURE__ */ jsx4("button", { type: "button", disabled: busy || dirty || !!choice, onClick: () => void run(async () => {
          await client.restoreVersion(id, version.id);
          const value = await read();
          setLoaded(value);
          setDraft(null);
          setHistory(value.state);
          refreshBody(value.envelope);
          setNotice(notice("splicewire-beam-ux::messages.publication_restored"));
        }), children: m.t("splicewire-beam-ux::messages.publication_restore_version", { version: version.readable }) })
      ] }, version.id)),
      dirty && /* @__PURE__ */ jsx4("p", { children: m.t("splicewire-beam-ux::messages.publication_save_before_restore") })
    ] })
  ] }) : null;
  return {
    schema: envelope?.schema ?? null,
    body,
    onChange: (value) => {
      if (!locked.current && !readOnly && !choice) setDraft(value);
    },
    onSave,
    onDiscard: () => {
      if (!locked.current && !choice) setDraft(null);
    },
    saving: busy,
    saveLabel: publicationEnabled ? m.t("splicewire-beam-ux::messages.publication_save_draft") : void 0,
    saveDisabled: readOnly || incomplete || !!choice || publicationEnabled && !loaded,
    disabled: readOnly || incomplete || busy || !!choice || publicationEnabled && !loaded,
    controls: /* @__PURE__ */ jsxs4(Fragment2, { children: [
      incomplete && /* @__PURE__ */ jsx4("p", { role: "alert", children: m.t("splicewire-beam-ux::messages.publication_incomplete_transport") }),
      error && /* @__PURE__ */ jsx4("p", { role: "alert", children: say(m, error) }),
      notice2 && /* @__PURE__ */ jsx4("p", { role: "status", children: say(m, notice2) }),
      controls
    ] })
  };
}

// src/UxBuilder.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function placementFor(kind, placement) {
  if (kind === "list") return "overlay";
  return placement;
}
function RegionInspectorConnected({ region, readOnly }) {
  const editor = useRegionPublication(region.recordId, region.kind === "form" || region.kind === "richtext", readOnly);
  const preview = useRegionPreviews(region.recordId);
  return /* @__PURE__ */ jsx5(RegionInspector, { region, ...editor, ...preview, editorDisabled: editor.disabled, publicationControls: editor.controls });
}
function RegionOverlayConnected({ region, onClose, readOnly }) {
  const editor = useRegionPublication(region.recordId, region.kind === "form" || region.kind === "richtext", readOnly);
  return /* @__PURE__ */ jsx5(RegionOverlay, { region, onClose, ...editor, editorDisabled: editor.disabled, publicationControls: editor.controls });
}
function ModeToggle({ mode, onChange }) {
  return /* @__PURE__ */ jsx5("div", { className: "flex items-center rounded-md border bg-card p-0.5 text-xs", children: ["overlay", "structure"].map((m) => /* @__PURE__ */ jsxs5(
    "button",
    {
      type: "button",
      onClick: () => onChange(m),
      className: cn4(
        "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium capitalize transition-colors",
        mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      ),
      children: [
        m === "overlay" ? /* @__PURE__ */ jsx5(MousePointerSquareDashed, { className: "size-3.5" }) : /* @__PURE__ */ jsx5(LayoutTemplate, { className: "size-3.5" }),
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
  initialEngaged,
  readOnly = false
}) {
  const m = useBeamUxMessages();
  const [mode, setMode] = useState2(initialMode);
  const [engaged, setEngaged] = useState2(initialEngaged ?? regions[0]?.id ?? null);
  const [selected, setSelected] = useState2(regions[0]?.id ?? null);
  const active = useMemo(() => regions.find((r) => r.id === engaged) ?? null, [regions, engaged]);
  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selected) ?? null,
    [regions, selected]
  );
  const activeBody = useEntryBody(mode === "overlay" ? active?.recordId ?? null : null);
  const dockPlacement = active ? placementFor(active.kind, editorPlacement) : editorPlacement;
  const dockInInspector = dockPlacement === "inspector";
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx5("style", { children: UX_BUILDER_CSS }),
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx5("span", { className: "beam-ux-mode-hint font-mono text-[11px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.builder_mode_hint") }),
      /* @__PURE__ */ jsx5(ModeToggle, { mode, onChange: setMode })
    ] }),
    mode === "structure" ? /* @__PURE__ */ jsx5(
      StructurePanel,
      {
        pageTree,
        palette,
        selected,
        selectedRegion,
        onSelect: setSelected,
        renderEditor: (region) => /* @__PURE__ */ jsx5(RegionInspectorConnected, { region, readOnly }, region.recordId)
      }
    ) : dockInInspector ? (
      /* INSPECTOR placement — docked right-hand column, always present. */
      /* @__PURE__ */ jsxs5("div", { className: "beam-ux-inspector-grid grid grid-cols-1 gap-6", children: [
        /* @__PURE__ */ jsx5(
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
        /* @__PURE__ */ jsx5("aside", { className: "lg:sticky lg:top-2 lg:self-start", children: active ? /* @__PURE__ */ jsx5(RegionInspectorConnected, { region: active, readOnly }, active.recordId) : /* @__PURE__ */ jsx5("div", { className: "rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.builder_engage_hint") }) })
      ] })
    ) : (
      /* OVERLAY placement — full-width canvas + a floating in-context panel. */
      /* @__PURE__ */ jsxs5("div", { className: "relative", children: [
        /* @__PURE__ */ jsx5("div", { className: "max-w-3xl", children: /* @__PURE__ */ jsx5(
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
        active && /* @__PURE__ */ jsx5("div", { className: "beam-ux-overlay-dock", children: /* @__PURE__ */ jsx5(
          RegionOverlayConnected,
          {
            readOnly,
            region: active,
            onClose: () => setEngaged(null)
          },
          active.recordId
        ) })
      ] })
    )
  ] });
}

// src/author/AuthorNote.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function AuthorNote({ children, className }) {
  const m = useBeamUxMessages();
  if (!import.meta.env?.DEV) {
    return null;
  }
  return /* @__PURE__ */ jsx6(
    "span",
    {
      "data-author-note": "",
      title: m.t("splicewire-beam-ux::messages.author_note_title"),
      className: ["font-mono text-[10px] text-muted-foreground/70", className].filter(Boolean).join(" "),
      children
    }
  );
}

// src/FilesComparisonPanel.tsx
import { useEffect as useEffect2, useId, useRef as useRef2, useState as useState3 } from "react";
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var buttonClassName = "inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50";
function FilesComparisonPanel({ memberId, client, editorHref }) {
  const m = useBeamUxMessages();
  const [inspection, setInspection] = useState3(null);
  const [confirmation, setConfirmation] = useState3(null);
  const [busy, setBusy] = useState3(false);
  const [error, setError] = useState3("");
  const [result, setResult] = useState3(null);
  const [batchResult, setBatchResult] = useState3(null);
  const [resultFormat, setResultFormat] = useState3(null);
  const confirmButton = useRef2(null);
  const takeButton = useRef2(null);
  const restoreButton = useRef2(null);
  const remirrorButton = useRef2(null);
  const takeAllButton = useRef2(null);
  const returnFocus = useRef2(null);
  const reloadButton = useRef2(null);
  const requestEpoch = useRef2(0);
  const headingId = useId();
  const load = async () => {
    const epoch = ++requestEpoch.current;
    setBusy(true);
    setError("");
    setConfirmation(null);
    setInspection(null);
    try {
      if (!client.inspectReleaseFile) throw new NoticeError(notice("splicewire-beam-ux::messages.files_inspection_unavailable"));
      const response = await client.inspectReleaseFile(memberId);
      if (epoch === requestEpoch.current) setInspection(response);
    } catch (failure) {
      if (epoch === requestEpoch.current) setError(noticeOf(failure, notice("splicewire-beam-ux::messages.files_comparison_failed")));
    } finally {
      if (epoch === requestEpoch.current) setBusy(false);
    }
  };
  useEffect2(() => {
    setResult(null);
    setBatchResult(null);
    setResultFormat(null);
    void load();
    return () => {
      requestEpoch.current++;
    };
  }, [memberId, client]);
  useEffect2(() => {
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
      setError(noticeOf(failure, notice("splicewire-beam-ux::messages.files_nothing_confirmed")));
    } finally {
      if (epoch === requestEpoch.current) setBusy(false);
    }
  };
  const drafted = result?.status === "drafted" || result?.status === "drafted-with-compile-error";
  const compileFailed = result?.status === "drafted-with-compile-error" || result?.diagnostic?.code === "compile-failed";
  const mdxLinkRefused = resultFormat === "mdx" || inspection?.format === "mdx" || inspection?.path?.toLowerCase().endsWith(".mdx");
  const href = inspection && result && !mdxLinkRefused && editorHref?.(result.entryId);
  return /* @__PURE__ */ jsxs6("section", { "aria-labelledby": headingId, "aria-busy": busy, className: "space-y-4 rounded-lg border bg-card p-4 text-card-foreground", children: [
    /* @__PURE__ */ jsx7("h2", { id: headingId, className: "text-lg font-semibold", children: m.t("splicewire-beam-ux::messages.files_heading") }),
    /* @__PURE__ */ jsx7("p", { children: m.t("splicewire-beam-ux::messages.files_intro") }),
    /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: reloadButton, type: "button", disabled: busy, onClick: () => void load(), children: m.t("splicewire-beam-ux::messages.files_reload") }),
    error && /* @__PURE__ */ jsx7("p", { role: "alert", children: m.t("splicewire-beam-ux::messages.files_error_retained", { error: say(m, error) }) }),
    result && /* @__PURE__ */ jsxs6("div", { className: "space-y-2 rounded border bg-muted p-3 text-foreground", children: [
      compileFailed ? /* @__PURE__ */ jsx7("p", { role: "alert", children: m.t("splicewire-beam-ux::messages.files_compile_failed") }) : /* @__PURE__ */ jsx7("p", { role: "status", children: result.message }),
      /* @__PURE__ */ jsx7("p", { className: "break-all text-sm", children: m.t("splicewire-beam-ux::messages.files_returned_versions", { head: result.headVersion ?? m.t("splicewire-beam-ux::messages.files_unavailable"), pin: result.publishedVersion ?? m.t("splicewire-beam-ux::messages.files_unavailable") }) }),
      compileFailed && /* @__PURE__ */ jsx7("p", { className: "text-sm", children: m.t("splicewire-beam-ux::messages.files_compile_warning_scope") })
    ] }),
    batchResult && /* @__PURE__ */ jsx7("p", { role: "status", children: m.t("splicewire-beam-ux::messages.files_taken_as_drafts", { count: batchResult.count }) }),
    drafted && href && /* @__PURE__ */ jsx7("a", { href, children: m.t("splicewire-beam-ux::messages.files_open_entry") }),
    inspection && /* @__PURE__ */ jsxs6(Fragment3, { children: [
      /* @__PURE__ */ jsxs6("p", { children: [
        /* @__PURE__ */ jsx7("strong", { children: inspection.state }),
        " \u2014 ",
        inspection.message
      ] }),
      /* @__PURE__ */ jsxs6("dl", { children: [
        /* @__PURE__ */ jsx7("dt", { children: m.t("splicewire-beam-ux::messages.files_file") }),
        /* @__PURE__ */ jsx7("dd", { children: inspection.path ?? m.t("splicewire-beam-ux::messages.files_unavailable") }),
        /* @__PURE__ */ jsx7("dt", { children: m.t("splicewire-beam-ux::messages.files_working_head") }),
        /* @__PURE__ */ jsx7("dd", { className: "break-all", children: inspection.workingHeadVersion }),
        /* @__PURE__ */ jsx7("dt", { children: m.t("splicewire-beam-ux::messages.files_current_published_pin") }),
        /* @__PURE__ */ jsx7("dd", { className: "break-all", children: inspection.publishedVersion })
      ] }),
      inspection.sourceTruncated && /* @__PURE__ */ jsx7("p", { children: m.t("splicewire-beam-ux::messages.files_source_truncated") }),
      /* @__PURE__ */ jsxs6("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs6("div", { children: [
          /* @__PURE__ */ jsx7("h3", { children: m.t("splicewire-beam-ux::messages.files_published_bytes") }),
          /* @__PURE__ */ jsx7("pre", { className: "max-h-80 overflow-auto whitespace-pre-wrap text-xs", children: inspection.publishedSource ?? m.t("splicewire-beam-ux::messages.files_unavailable") })
        ] }),
        /* @__PURE__ */ jsxs6("div", { children: [
          /* @__PURE__ */ jsx7("h3", { children: m.t("splicewire-beam-ux::messages.files_local_bytes") }),
          /* @__PURE__ */ jsx7("pre", { className: "max-h-80 overflow-auto whitespace-pre-wrap text-xs", children: inspection.localSource ?? (inspection.fileExists ? m.t("splicewire-beam-ux::messages.files_unavailable") : m.t("splicewire-beam-ux::messages.files_missing")) })
        ] })
      ] }),
      !confirmation && /* @__PURE__ */ jsxs6("div", { className: "flex gap-4", children: [
        inspection.canTake && client.takeReleaseFile && /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: takeButton, type: "button", disabled: busy, onClick: () => capture("take"), children: m.t("splicewire-beam-ux::messages.files_take") }),
        inspection.canRestore && client.restoreMissingReleaseFile && /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: restoreButton, type: "button", disabled: busy, onClick: () => capture("restore"), children: m.t("splicewire-beam-ux::messages.files_restore") }),
        inspection.state === "differs" && inspection.canRemirror && client.remirrorReleaseFile && /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: remirrorButton, type: "button", disabled: busy, onClick: () => capture("remirror"), children: m.t("splicewire-beam-ux::messages.files_remirror") }),
        inspection.canTakeAll && client.takeAllReleaseFiles && /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: takeAllButton, type: "button", disabled: busy, onClick: captureAll, children: m.t("splicewire-beam-ux::messages.files_take_all") })
      ] }),
      inspection.fileExists && inspection.state !== "unchanged" && /* @__PURE__ */ jsx7("p", { children: m.t("splicewire-beam-ux::messages.files_restore_never_overwrites") })
    ] }),
    confirmation && /* @__PURE__ */ jsxs6("div", { role: "group", "aria-label": m.t("splicewire-beam-ux::messages.files_confirm_group"), className: "flex flex-wrap items-center gap-3 rounded border p-3", children: [
      /* @__PURE__ */ jsx7("p", { children: confirmation.action === "take" ? m.t("splicewire-beam-ux::messages.files_confirm_take_body") : confirmation.action === "restore" ? m.t("splicewire-beam-ux::messages.files_confirm_restore_body") : confirmation.action === "remirror" ? m.t("splicewire-beam-ux::messages.files_confirm_remirror_body") : m.t("splicewire-beam-ux::messages.files_confirm_take_all_body", { count: confirmation.input.items.length }) }),
      confirmation.action === "takeAll" ? /* @__PURE__ */ jsxs6(Fragment3, { children: [
        /* @__PURE__ */ jsx7("p", { className: "break-all text-xs", children: m.t("splicewire-beam-ux::messages.files_captured_states", { count: confirmation.input.items.length }) }),
        /* @__PURE__ */ jsx7("ul", { className: "list-disc pl-5", children: inspection?.takeAllItems?.map((item) => /* @__PURE__ */ jsx7("li", { className: "break-all", children: item.path }, item.memberId)) })
      ] }) : /* @__PURE__ */ jsx7("p", { className: "break-all text-xs", children: m.t("splicewire-beam-ux::messages.files_captured_versions", { head: confirmation.input.expectedHeadVersion, pin: confirmation.input.expectedPublishedVersion, file: confirmation.input.expectedFileSha256 ?? m.t("splicewire-beam-ux::messages.files_absent") }) }),
      /* @__PURE__ */ jsx7("button", { className: buttonClassName, ref: confirmButton, type: "button", disabled: busy || !!error, onClick: () => void submit(), children: confirmation.action === "take" ? m.t("splicewire-beam-ux::messages.files_confirm_take") : confirmation.action === "restore" ? m.t("splicewire-beam-ux::messages.files_confirm_restore") : confirmation.action === "remirror" ? m.t("splicewire-beam-ux::messages.files_confirm_remirror") : m.t("splicewire-beam-ux::messages.files_confirm_take_all") }),
      /* @__PURE__ */ jsx7("button", { className: buttonClassName, type: "button", disabled: busy, onClick: cancel, children: m.t("splicewire-beam-ux::messages.files_cancel") })
    ] })
  ] });
}

// src/collections/CollectionDefinitionEditor.tsx
import { useMemo as useMemo2, useState as useState4 } from "react";
import { SchemaForm } from "@schemastud/seam";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var CollectionRegistrationImpact = class extends Error {
  constructor(impact, message) {
    super(message ?? englishBeamUxMessages.t("splicewire-beam-ux::messages.collections_review_impact"));
    this.impact = impact;
    this.defaultMessage = message === void 0;
  }
  impact;
  /** True when no caller message was given: the editor then renders the reader's localized line. */
  defaultMessage;
};
function impactOf(failure) {
  if (failure instanceof CollectionRegistrationImpact) return failure.impact;
  if (statusOf(failure) !== 409 || failure === null || typeof failure !== "object")
    return null;
  const body = failure.response?.data;
  const impact = body?.data;
  return impact && typeof impact.schemaFingerprint === "string" && Array.isArray(impact.pages) ? impact : null;
}
function confirmationOf(impact) {
  const pins = /* @__PURE__ */ new Map();
  for (const page of impact.pages) {
    pins.set(page.id, page.publishedVersion);
    for (const [id, pin] of Object.entries(page.dependencies ?? {})) {
      if (!pins.has(id)) pins.set(id, pin);
    }
  }
  return {
    schemaFingerprint: impact.schemaFingerprint,
    publishedVersions: Object.fromEntries(pins)
  };
}
function CollectionDefinitionEditor({
  schema,
  initial,
  onSave,
  onCancel
}) {
  const m = useBeamUxMessages();
  const [draft, setDraft] = useState4(initial);
  const [saving, setSaving] = useState4(false);
  const [error, setError] = useState4(null);
  const [pending, setPending] = useState4(null);
  const visibleSchema = useMemo2(
    () => ({
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties ?? {}).filter(
          ([key]) => key !== "registrationConfirmation"
        )
      ),
      required: Array.isArray(schema.required) ? schema.required.filter(
        (key) => typeof key === "string" && key !== "registrationConfirmation"
      ) : void 0
    }),
    [schema]
  );
  const submit = async (value, confirmation = null) => {
    setSaving(true);
    setError(null);
    setPending(null);
    const proposal = {
      ...value,
      baseVersion: initial.baseVersion ?? 0,
      registrationConfirmation: confirmation
    };
    try {
      await onSave(proposal);
    } catch (failure) {
      const impact = impactOf(failure);
      if (impact) {
        setPending({ impact, value: proposal });
      }
      setError(
        messageOf(failure) ?? (failure instanceof CollectionRegistrationImpact && failure.defaultMessage ? notice("splicewire-beam-ux::messages.collections_review_impact") : failure instanceof Error ? failure.message : notice("splicewire-beam-ux::messages.collections_save_failed"))
      );
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs7("section", { "aria-label": m.t("splicewire-beam-ux::messages.collections_fields"), className: "space-y-4", children: [
    /* @__PURE__ */ jsx8("h2", { className: "text-lg font-semibold", children: m.t("splicewire-beam-ux::messages.collections_fields") }),
    /* @__PURE__ */ jsx8("p", { children: m.t("splicewire-beam-ux::messages.collections_save_registers_version") }),
    error && /* @__PURE__ */ jsx8("p", { role: "alert", children: say(m, error) }),
    pending && /* @__PURE__ */ jsxs7("section", { "aria-label": m.t("splicewire-beam-ux::messages.collections_pages_affected"), className: "space-y-3", children: [
      /* @__PURE__ */ jsx8("h3", { children: m.t("splicewire-beam-ux::messages.collections_pages_affected") }),
      /* @__PURE__ */ jsx8("ul", { children: pending.impact.pages.map((page) => /* @__PURE__ */ jsxs7("li", { children: [
        /* @__PURE__ */ jsx8("strong", { children: page.title }),
        ": ",
        page.fields.join(", ")
      ] }, page.id)) }),
      /* @__PURE__ */ jsx8(
        "button",
        {
          type: "button",
          disabled: saving,
          onClick: () => void submit(pending.value, confirmationOf(pending.impact)),
          children: m.t("splicewire-beam-ux::messages.collections_confirm_and_save")
        }
      )
    ] }),
    /* @__PURE__ */ jsx8(
      SchemaForm,
      {
        schema: visibleSchema,
        formData: draft,
        disabled: saving,
        uiSchema: {
          baseVersion: { "ui:widget": "hidden" },
          stem: { "ui:readonly": (initial.baseVersion ?? 0) > 0 }
        },
        onChange: ({ formData }) => {
          setDraft(formData);
          setPending(null);
          setError(null);
        },
        onSubmit: ({ formData }) => void submit(formData),
        children: /* @__PURE__ */ jsxs7("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx8("button", { type: "submit", disabled: saving, children: saving ? m.t("splicewire-beam-ux::messages.collections_saving") : m.t("splicewire-beam-ux::messages.collections_save_version") }),
          /* @__PURE__ */ jsx8("button", { type: "button", onClick: onCancel, disabled: saving, children: m.t("splicewire-beam-ux::messages.collections_cancel") })
        ] })
      }
    )
  ] });
}
export {
  AuthorNote,
  CollectionDefinitionEditor,
  CollectionRegistrationImpact,
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