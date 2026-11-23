import {
  richMessage
} from "./chunk-5APTQIDU.js";
import {
  EFFECT_COPY,
  EffectTag,
  FedBy,
  KEY_FILTERS,
  KEY_FILTER_LABEL,
  KeyValue,
  PlainValue,
  ReadValue,
  SecretValue,
  TIER_LABEL,
  TIER_ORDER,
  TIER_WORD,
  TierPill,
  admitsTenant,
  allowsNull,
  asConfigSection,
  canEdit,
  cascade,
  closedTiers,
  closedToRealm,
  deploySource,
  draftFor,
  envState,
  family,
  formatValue,
  hasPendingDraft,
  isListKey,
  isLocked,
  keyDescription,
  keyDiff,
  keyFor,
  keyLabel,
  matchesFilter,
  nodeAt,
  pointerTokens,
  provenance,
  resolveConfigValue,
  sectionForRealm,
  toDraftValue,
  valueAt
} from "./chunk-HTRF3PAU.js";
import {
  say
} from "./chunk-YARN53FB.js";
import {
  englishBeamUxMessages,
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/config/ConfigArea.tsx
import { useMemo, useState as useState2 } from "react";
import {
  ListShell,
  resourceQueryKey,
  useFrameInjection,
  useResourceRecord
} from "@schemastud/frame";
import { useQuery } from "@tanstack/react-query";
import { Button as Button2, Input as Input2, cn as cn2 } from "@schemastud/ui";
import { AlertTriangle, Search, X } from "lucide-react";

// src/config/edit.tsx
import { useContext, useId, useState } from "react";
import {
  useResourceAction
} from "@schemastud/frame";
import { asWidget, useRjsfRegistry, widgetProps, WidgetRegistryContext } from "@schemastud/seam";
import { Button, Input, cn } from "@schemastud/ui";
import { History, Lock, LockOpen, Rocket, Undo2 } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
var RELEASE_KIND_CONFIG = "config-override";
function useConfigOp(resource, name) {
  const call = useResourceAction(resource, name);
  return {
    ...call,
    run: (data) => call.invoke({ data })
  };
}
function RefusalNote({ error }) {
  if (!error) return null;
  const fields = error.errors;
  const lines = fields && Object.keys(fields).length > 0 ? Object.values(fields).flat() : [error.message];
  return /* @__PURE__ */ jsx("ul", { "data-config-refusal": true, role: "alert", className: "space-y-0.5 text-xs text-destructive", children: lines.map((line, i) => /* @__PURE__ */ jsx("li", { children: line }, i)) });
}
var DRAFT_OP_LABEL = {
  set: "splicewire-beam-ux::messages.config_draft_set",
  null: "splicewire-beam-ux::messages.config_draft_null",
  unset: "splicewire-beam-ux::messages.config_draft_unset"
};
var EDIT_FORM_CONTEXT = {};
function EditValue({
  schema,
  pointer,
  value,
  secret,
  onChange
}) {
  const registry = useContext(WidgetRegistryContext);
  const rjsfRegistry = useRjsfRegistry(schema, EDIT_FORM_CONTEXT);
  const id = useId();
  const node = nodeAt(schema, pointer);
  const label = keyLabel(schema, pointer);
  const tokens = pointerTokens(pointer);
  if (node && registry && !secret) {
    const resolved = registry.resolveEntry(node, "form");
    const Widget = asWidget(resolved.widget);
    if (Widget) {
      return /* @__PURE__ */ jsx("span", { "data-config-edit": "widget", className: "block min-w-0", children: /* @__PURE__ */ jsx(
        Widget,
        {
          ...widgetProps({
            registry: rjsfRegistry,
            schema: node,
            value,
            name: tokens[tokens.length - 1] ?? "",
            id,
            label,
            readonly: false,
            disabled: false,
            options: resolved.options,
            onChange: (next) => onChange(next, true)
          })
        }
      ) });
    }
  }
  const type = Array.isArray(node?.type) ? node?.type.find((t) => t !== "null") : node?.type;
  if (secret) {
    return /* @__PURE__ */ jsx(Input, { id, "aria-label": label, type: "password", autoComplete: "off", onChange: (e) => onChange(e.target.value, e.target.value !== "") });
  }
  if (Array.isArray(node?.enum)) {
    return /* @__PURE__ */ jsx(
      "select",
      {
        id,
        "aria-label": label,
        className: "h-8 rounded-md border bg-background px-2 text-sm",
        defaultValue: value === void 0 ? "" : JSON.stringify(value),
        onChange: (e) => onChange(JSON.parse(e.target.value), true),
        children: node.enum.map((choice) => /* @__PURE__ */ jsx("option", { value: JSON.stringify(choice), children: formatValue(choice) }, JSON.stringify(choice)))
      }
    );
  }
  if (type === "boolean") {
    return /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx("input", { id, type: "checkbox", defaultChecked: value === true, onChange: (e) => onChange(e.target.checked, true) }),
      label
    ] });
  }
  if (type === "integer" || type === "number") {
    return /* @__PURE__ */ jsx(
      Input,
      {
        id,
        "aria-label": label,
        type: "number",
        step: type === "integer" ? 1 : "any",
        min: typeof node?.minimum === "number" ? node.minimum : void 0,
        max: typeof node?.maximum === "number" ? node.maximum : void 0,
        defaultValue: typeof value === "number" ? value : void 0,
        onChange: (e) => {
          const n = e.target.valueAsNumber;
          onChange(n, Number.isFinite(n) && (type === "number" || Number.isInteger(n)));
        }
      }
    );
  }
  if (type === "string") {
    return /* @__PURE__ */ jsx(Input, { id, "aria-label": label, defaultValue: typeof value === "string" ? value : "", onChange: (e) => onChange(e.target.value, true) });
  }
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      id,
      "aria-label": label,
      className: "min-h-16 w-full rounded-md border bg-background p-2 font-mono text-xs",
      defaultValue: value === void 0 ? "" : JSON.stringify(value, null, 2),
      onChange: (e) => {
        try {
          onChange(JSON.parse(e.target.value), true);
        } catch {
          onChange(void 0, false);
        }
      }
    }
  );
}
function EditSlot(props) {
  const { root, pins } = props.section;
  return /* @__PURE__ */ jsx(EditSlotFields, { ...props }, `${root}:${props.realm}:${pins.draft ?? "-"}:${pins.published ?? "-"}:${pins.draftPending ? 1 : 0}`);
}
function EditSlotFields({
  resource,
  section,
  keyData,
  realm
}) {
  const m = useBeamUxMessages();
  const save = useConfigOp(resource, "save-draft");
  const schema = section.schema;
  const draft = draftFor(section, keyData.pointer);
  const start = draft?.op === "set" && !draft.secret ? draft.value : keyData.secret ? void 0 : keyData.value;
  const [value, setValue] = useState(start);
  const [valid, setValid] = useState(true);
  const [dirty, setDirty] = useState(false);
  if (!canEdit(section, keyData, realm)) {
    if (closedToRealm(keyData, realm)) {
      return /* @__PURE__ */ jsxs("p", { "data-config-closed-reason": realm, className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Lock, { className: "size-3", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_closed_reason", { tier: m.t(TIER_WORD[realm]) })
      ] });
    }
    if (realm === "tenant" && keyData.lock) {
      return /* @__PURE__ */ jsxs("p", { "data-config-locked": true, className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Lock, { className: "size-3", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_locked_by_operator", { reason: keyData.lock.reason })
      ] });
    }
    return null;
  }
  const send = (op) => save.run({ root: section.root, pointer: keyData.pointer, op, value: op === "set" ? toDraftValue(value) : null });
  return /* @__PURE__ */ jsxs("section", { "data-config-edit-slot": keyData.pointer, "aria-label": m.t("splicewire-beam-ux::messages.config_edit_slot"), className: "space-y-2 rounded-lg border p-3", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xs font-medium", children: m.t("splicewire-beam-ux::messages.config_edit_slot") }),
      draft && /* @__PURE__ */ jsx("span", { "data-config-draft": draft.op, className: "font-mono text-[10.5px] text-primary", children: m.t(DRAFT_OP_LABEL[draft.op]) })
    ] }),
    /* @__PURE__ */ jsx(
      EditValue,
      {
        schema,
        pointer: keyData.pointer,
        value,
        secret: keyData.secret,
        onChange: (next, ok) => {
          setValue(next);
          setValid(ok);
          setDirty(true);
        }
      }
    ),
    isListKey(schema, keyData.pointer) && // config-sections 21: a list is saved whole. An index is a position, not a record, so no tier overrides one item.
    /* @__PURE__ */ jsx("p", { "data-config-list-rule": true, className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_list_rule") }),
    !valid && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: m.t("splicewire-beam-ux::messages.config_value_invalid") }),
    /* @__PURE__ */ jsx(RefusalNote, { error: save.error }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx(Button, { size: "sm", disabled: !save.available || !dirty || !valid || save.pending, onClick: () => send("set"), children: m.t("splicewire-beam-ux::messages.config_save_draft") }),
      allowsNull(schema, keyData.pointer) && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", disabled: !save.available || save.pending, onClick: () => send("null"), children: m.t("splicewire-beam-ux::messages.config_set_null") }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", disabled: !save.available || save.pending, onClick: () => send("unset"), children: [
        /* @__PURE__ */ jsx(Undo2, { className: "mr-1 size-3.5", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_inherit")
      ] })
    ] })
  ] });
}
function LockControl({
  resource,
  section,
  keyData,
  realm
}) {
  const m = useBeamUxMessages();
  const lock = useConfigOp(resource, "lock");
  const [reason, setReason] = useState("");
  if (realm !== "operator" || TIER_ORDER.indexOf(keyData.ceiling) < TIER_ORDER.indexOf("tenant")) return null;
  const locked = isLocked(keyData);
  return /* @__PURE__ */ jsxs("section", { "data-config-lock": locked ? "locked" : "open", className: "space-y-2 rounded-lg border p-3", children: [
    locked ? /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-xs", children: [
        /* @__PURE__ */ jsx(Lock, { className: "size-3", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_locked_for_tenants", { reason: keyData.lock?.reason ?? "" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", disabled: !lock.available || lock.pending, onClick: () => lock.run({ root: section.root, pointer: keyData.pointer, locked: false, reason: null }), children: [
        /* @__PURE__ */ jsx(LockOpen, { className: "mr-1 size-3.5", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_unlock")
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          "aria-label": m.t("splicewire-beam-ux::messages.config_lock_reason"),
          placeholder: m.t("splicewire-beam-ux::messages.config_lock_reason"),
          value: reason,
          onChange: (e) => setReason(e.target.value),
          className: "h-8 min-w-0 flex-1"
        }
      ),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", disabled: !lock.available || lock.pending || reason.trim() === "", onClick: () => lock.run({ root: section.root, pointer: keyData.pointer, locked: true, reason }), children: [
        /* @__PURE__ */ jsx(Lock, { className: "mr-1 size-3.5", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_lock_for_tenants")
      ] })
    ] }),
    /* @__PURE__ */ jsx(RefusalNote, { error: lock.error })
  ] });
}
function DiffValue({ value, secret, inherit, struck }) {
  const m = useBeamUxMessages();
  if (secret) return /* @__PURE__ */ jsx(SecretValue, { set: true });
  if (inherit) return /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_diff_inherit") });
  return /* @__PURE__ */ jsx(PlainValue, { value, struck });
}
function releaseState(joined, release, section) {
  if (!joined || joined.release !== release.id || joined.root !== section.root || !hasPendingDraft(section)) return "target";
  if (section.pins.draft === joined.draft) return "added";
  return section.pins.draft !== null && joined.draft !== null && section.pins.draft > joined.draft ? "stale" : "target";
}
function ReleaseNote({ release, state }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("div", { "data-config-release-target": release.id, "data-config-release-state": state, className: "text-xs text-muted-foreground", children: [
    state === "target" && /* @__PURE__ */ jsx("p", { children: m.t("splicewire-beam-ux::messages.config_release_target", { title: release.title }) }),
    /* @__PURE__ */ jsxs("p", { role: "status", "aria-live": "polite", className: "text-foreground", children: [
      state === "added" && m.t("splicewire-beam-ux::messages.config_added_to_release", { title: release.title }),
      state === "stale" && m.t("splicewire-beam-ux::messages.config_release_stale", { title: release.title })
    ] })
  ] });
}
function DraftBar({
  resource,
  section,
  release
}) {
  const m = useBeamUxMessages();
  const publish = useConfigOp(resource, "publish");
  const discard = useConfigOp(resource, "discard-draft");
  const [adding, setAdding] = useState(false);
  const [releaseError, setReleaseError] = useState(null);
  const [joined, setJoined] = useState(null);
  if (!hasPendingDraft(section) && section.overrides.length === 0) return null;
  const schema = section.schema;
  const lines = keyDiff(section);
  const busy = publish.pending || discard.pending || adding;
  const addToRelease = async (target) => {
    setAdding(true);
    setReleaseError(null);
    setJoined(null);
    const draft = section.pins.draft;
    try {
      await target.command({ action: "member", kind: RELEASE_KIND_CONFIG, ref: section.root });
      setJoined({ release: target.id, root: section.root, draft });
    } catch (reason) {
      setReleaseError(reason instanceof Error ? reason : new Error(String(reason)));
    } finally {
      setAdding(false);
    }
  };
  return /* @__PURE__ */ jsxs("section", { "data-config-draft-bar": true, "aria-label": m.t("splicewire-beam-ux::messages.config_draft_bar"), className: "sticky top-0 z-10 space-y-2 rounded-lg border bg-card p-3 shadow-sm", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: m.choice("splicewire-beam-ux::messages.config_changes_pending", lines.length, { count: lines.length }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        release && /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            variant: "outline",
            disabled: busy || !hasPendingDraft(section),
            onClick: () => void addToRelease(release),
            children: m.t("splicewire-beam-ux::messages.config_add_to_release")
          }
        ),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", disabled: busy || !discard.available, onClick: () => discard.run({ root: section.root }), children: m.t("splicewire-beam-ux::messages.config_discard_draft") }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: busy || !publish.available, onClick: () => publish.run({ root: section.root }), children: [
          /* @__PURE__ */ jsx(Rocket, { className: "mr-1 size-3.5", "aria-hidden": true }),
          m.t("splicewire-beam-ux::messages.config_publish")
        ] })
      ] })
    ] }),
    release && /* @__PURE__ */ jsx(ReleaseNote, { release, state: releaseState(joined, release, section) }),
    /* @__PURE__ */ jsx("ol", { "data-config-diff": true, className: "space-y-1", children: lines.map((line) => /* @__PURE__ */ jsxs("li", { "data-config-diff-line": line.pointer, className: "grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate", children: keyLabel(schema, line.pointer) }),
      /* @__PURE__ */ jsx(DiffValue, { value: line.from, secret: line.secret, struck: true }),
      /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-muted-foreground", children: "\u2192" }),
      /* @__PURE__ */ jsx(DiffValue, { value: line.to, secret: line.secret, inherit: line.op === "unset" })
    ] }, line.pointer)) }),
    /* @__PURE__ */ jsx(RefusalNote, { error: publish.error ?? discard.error ?? releaseError })
  ] });
}
function asVersions(data) {
  const versions = data?.versions;
  return Array.isArray(versions) ? versions : [];
}
function VersionsPanel({ resource, section }) {
  const m = useBeamUxMessages();
  const versions = useConfigOp(resource, "versions");
  const restore = useConfigOp(resource, "restore");
  const list = asVersions(versions.result?.data);
  return /* @__PURE__ */ jsxs("section", { "data-config-versions": true, className: "space-y-2 rounded-lg border p-3", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-1.5 text-xs font-medium", children: [
        /* @__PURE__ */ jsx(History, { className: "size-3.5", "aria-hidden": true }),
        m.t("splicewire-beam-ux::messages.config_versions")
      ] }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", disabled: !versions.available || versions.pending, onClick: () => versions.run({ root: section.root }), children: m.t("splicewire-beam-ux::messages.config_show_versions") })
    ] }),
    versions.result && list.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_no_versions") }),
    /* @__PURE__ */ jsx("ol", { className: "space-y-1", children: [...list].sort((a, b) => b.version - a.version).map((v) => /* @__PURE__ */ jsxs("li", { "data-config-version": v.version, className: cn("flex flex-wrap items-center justify-between gap-2 text-xs", v.published && "font-medium"), children: [
      /* @__PURE__ */ jsxs("span", { children: [
        m.t("splicewire-beam-ux::messages.config_version_n", { version: v.version }),
        v.label && ` \xB7 ${v.label}`,
        v.published && ` \xB7 ${m.t("splicewire-beam-ux::messages.config_version_published")}`,
        v.draft && ` \xB7 ${m.t("splicewire-beam-ux::messages.config_version_draft")}`
      ] }),
      !v.draft && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "h-7", disabled: !restore.available || restore.pending, onClick: () => restore.run({ root: section.root, version: v.version }), children: m.t("splicewire-beam-ux::messages.config_restore_as_draft") })
    ] }, v.id)) }),
    /* @__PURE__ */ jsx(RefusalNote, { error: versions.error ?? restore.error })
  ] });
}

// src/config/ConfigArea.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ConfigArea({ resource, section, onSectionChange, realm = "operator", release, className }) {
  const [own, setOwn] = useState2(null);
  const active = section === void 0 ? own : section;
  const pick = (id) => {
    setOwn(id);
    onSectionChange?.(id);
  };
  return /* @__PURE__ */ jsxs2("div", { "data-beam-config-area": true, className: cn2("flex min-h-0 flex-col md:flex-row", className), children: [
    /* @__PURE__ */ jsx2("aside", { className: "flex-none border-b bg-card/50 md:w-64 md:border-b-0 md:border-r", children: /* @__PURE__ */ jsx2(SectionRail, { resource, active, onPick: pick }) }),
    /* @__PURE__ */ jsx2("div", { className: "min-w-0 flex-1 space-y-4 p-4 md:p-6", children: active === null ? /* @__PURE__ */ jsx2(SectionsIndex, { resource, onPick: pick }) : /* @__PURE__ */ jsx2(SectionView, { resource, id: active, realm, release, onBack: () => pick(null) }) })
  ] });
}
var RAIL_PAGE_SIZE = 100;
var RAIL_MAX_PAGES = 100;
async function listAllRows(transport, resource, pageSize = RAIL_PAGE_SIZE) {
  const rows = /* @__PURE__ */ new Map();
  const size = { per_page: String(pageSize) };
  let params = size;
  for (let pages = 0; pages < RAIL_MAX_PAGES; pages++) {
    const page = await transport.list(resource, params);
    for (const row of page.data) rows.set(row.id ?? rows.size, row);
    if ("nextCursor" in page) {
      if (page.nextCursor === null) return [...rows.values()];
      params = { ...size, cursor: page.nextCursor };
    } else {
      if (page.data.length === 0 || rows.size >= page.total) return [...rows.values()];
      params = { ...size, page: String(page.page + 1) };
    }
  }
  throw new Error(`[beam-ux/config] ${resource}: more than ${RAIL_MAX_PAGES} pages of ${pageSize}`);
}
function SectionRail({ resource, active, onPick }) {
  const [q, setQ] = useState2("");
  const { transport } = useFrameInjection();
  const m = useBeamUxMessages();
  const list = useQuery({ queryKey: resourceQueryKey(transport, resource, "beam-ux/config", "rail"), queryFn: () => listAllRows(transport, resource) });
  const sections = useMemo(
    () => (list.data ?? []).map((row) => asConfigSection(row)).filter((s) => s !== null),
    [list.data]
  );
  const needle = q.trim().toLowerCase();
  const shown = sections.filter((s) => !needle || `${s.root} ${s.title}`.toLowerCase().includes(needle));
  const families = [...new Set(shown.map((s) => family(s.root)))];
  return /* @__PURE__ */ jsxs2("nav", { "aria-label": m.t("splicewire-beam-ux::messages.config_sections"), className: "flex min-h-0 flex-col", children: [
    /* @__PURE__ */ jsxs2("div", { className: "relative p-3 pb-2", children: [
      /* @__PURE__ */ jsx2(Search, { className: "pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-[40%] text-muted-foreground", "aria-hidden": true }),
      /* @__PURE__ */ jsx2(Input2, { value: q, onChange: (e) => setQ(e.target.value), placeholder: m.t("splicewire-beam-ux::messages.config_find_section"), "aria-label": m.t("splicewire-beam-ux::messages.config_find_section"), className: "h-8 pl-7 text-sm" })
    ] }),
    /* @__PURE__ */ jsxs2(
      "button",
      {
        type: "button",
        onClick: () => onPick(null),
        "aria-current": active === null ? "page" : void 0,
        className: cn2("mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", active === null && "bg-muted font-medium"),
        children: [
          m.t("splicewire-beam-ux::messages.config_all_sections"),
          " ",
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: sections.length })
        ]
      }
    ),
    /* @__PURE__ */ jsxs2("div", { className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4", children: [
      families.map((f) => /* @__PURE__ */ jsxs2("div", { className: "mt-3", children: [
        /* @__PURE__ */ jsx2("div", { className: "px-2 pb-1 text-[11px] font-medium text-muted-foreground", children: f }),
        /* @__PURE__ */ jsx2("ul", { children: shown.filter((s) => family(s.root) === f).map((s) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            onClick: () => onPick(s.id),
            "aria-current": active === s.id ? "page" : void 0,
            className: cn2(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active === s.id && "bg-primary/10 ring-1 ring-primary/15"
            ),
            children: [
              /* @__PURE__ */ jsxs2("span", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx2("span", { className: "block truncate text-sm", children: s.title }),
                /* @__PURE__ */ jsx2("span", { className: "block truncate font-mono text-[10.5px] text-muted-foreground", children: s.root })
              ] }),
              /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] tabular-nums text-muted-foreground", title: m.t("splicewire-beam-ux::messages.config_key_count", { count: s.counts.keys }), children: s.counts.keys })
            ]
          }
        ) }, s.id)) })
      ] }, f)),
      list.isSuccess && shown.length === 0 && /* @__PURE__ */ jsx2("p", { className: "px-2 py-3 text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_no_section_matches") }),
      list.isError && /* @__PURE__ */ jsx2("p", { role: "alert", className: "px-2 py-3 text-xs text-destructive", children: m.t("splicewire-beam-ux::messages.config_sections_list_failed") })
    ] })
  ] });
}
function sectionIndexColumns(m = englishBeamUxMessages) {
  const field = (member) => member;
  return [
    // Headers repeat the declared labels, so the no-manifest fallback reads the same.
    { field: field("root"), header: m.t("splicewire-beam-ux::messages.config_column_root"), cell: (record) => /* @__PURE__ */ jsx2("code", { className: "font-mono text-xs text-muted-foreground", children: asConfigSection(record)?.root }) },
    { field: field("title"), header: m.t("splicewire-beam-ux::messages.config_column_section"), cell: (record) => /* @__PURE__ */ jsx2(SectionCell, { section: asConfigSection(record) }) },
    { field: field("owner"), header: m.t("splicewire-beam-ux::messages.config_column_owner"), cell: (record) => /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs text-muted-foreground", children: asConfigSection(record)?.owner }) }
  ];
}
function SectionCell({ section }) {
  const m = useBeamUxMessages();
  if (!section) return null;
  const { keys, overridable, deploy, secrets } = section.counts;
  const parts = [
    [keys, "keys", m.choice("splicewire-beam-ux::messages.config_count_keys", keys)],
    [overridable, "changeable", m.t("splicewire-beam-ux::messages.config_count_changeable", { count: overridable })],
    [deploy, "deploy", m.t("splicewire-beam-ux::messages.config_count_deploy", { count: deploy })],
    [secrets, "secrets", m.choice("splicewire-beam-ux::messages.config_count_secrets", secrets)]
  ];
  return /* @__PURE__ */ jsxs2("span", { className: "block min-w-0", children: [
    /* @__PURE__ */ jsx2("span", { className: "block text-sm font-medium", children: section.title }),
    /* @__PURE__ */ jsx2("span", { "data-config-counts": true, className: "flex flex-wrap gap-x-2 font-mono text-[10.5px] text-muted-foreground", children: parts.map(([n, kind, word]) => /* @__PURE__ */ jsx2("span", { "data-config-count": kind, className: cn2("tabular-nums", n > 0 && kind !== "keys" && "text-foreground/80"), children: word }, kind)) })
  ] });
}
function SectionsIndex({ resource, onPick }) {
  const m = useBeamUxMessages();
  const columns = useMemo(() => sectionIndexColumns(m), [m]);
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs2("header", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx2("h1", { className: "text-[17px] font-semibold tracking-tight", children: m.t("splicewire-beam-ux::messages.config_heading") }),
      /* @__PURE__ */ jsx2("p", { className: "max-w-[68ch] text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_description") })
    ] }),
    /* @__PURE__ */ jsx2(
      ListShell,
      {
        resource,
        columns,
        onOpen: (record) => {
          const id = record.id;
          if (typeof id === "string") onPick(id);
        },
        paginationPlacement: "bottom"
      }
    )
  ] });
}
function SectionView({
  resource,
  id,
  realm = "operator",
  release,
  onBack
}) {
  const m = useBeamUxMessages();
  const record = useResourceRecord(resource, id);
  const row = asConfigSection(record.data);
  const section = row ? sectionForRealm(row, realm) : null;
  const [filter, setFilter] = useState2("all");
  const [selected, setSelected] = useState2(null);
  if (record.isPending) return /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_loading_section") });
  if (!section) return /* @__PURE__ */ jsx2("p", { className: "text-sm text-destructive", children: m.t("splicewire-beam-ux::messages.config_section_read_failed") });
  const keys = section.keys.filter((k) => matchesFilter(k, filter));
  const inspected = section.keys.find((k) => k.pointer === selected) ?? null;
  return /* @__PURE__ */ jsxs2("div", { "data-config-section": section.root, className: "space-y-4", children: [
    /* @__PURE__ */ jsx2(SectionHeader, { section, onBack }),
    /* @__PURE__ */ jsx2(SectionNotices, { section }),
    /* @__PURE__ */ jsx2(DraftBar, { resource, section, release }),
    /* @__PURE__ */ jsx2(FilterChips, { section, filter, setFilter }),
    /* @__PURE__ */ jsxs2("div", { className: cn2("grid gap-4", inspected && "xl:grid-cols-[minmax(0,1fr)_22rem]"), children: [
      /* @__PURE__ */ jsx2(KeyTable, { section, keys, selected, onSelect: setSelected, filter }),
      inspected && /* @__PURE__ */ jsx2(CascadeInspector, { section, keyData: inspected, onClose: () => setSelected(null), resource, realm })
    ] }),
    /* @__PURE__ */ jsx2(VersionsPanel, { resource, section })
  ] });
}
function SectionHeader({ section, onBack }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs2("header", { className: "space-y-2", children: [
    onBack && /* @__PURE__ */ jsx2("button", { type: "button", onClick: onBack, className: "text-xs text-muted-foreground hover:text-foreground md:hidden", children: m.t("splicewire-beam-ux::messages.config_back_all_sections") }),
    /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-baseline gap-x-3 gap-y-1", children: [
      /* @__PURE__ */ jsx2("h1", { className: "text-[17px] font-semibold tracking-tight", children: section.title }),
      /* @__PURE__ */ jsx2("code", { className: "font-mono text-xs text-muted-foreground", children: section.root })
    ] }),
    section.description && /* @__PURE__ */ jsx2("p", { className: "max-w-[72ch] text-sm text-muted-foreground", children: section.description }),
    /* @__PURE__ */ jsxs2("dl", { className: "flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex gap-1.5", children: [
        /* @__PURE__ */ jsx2("dt", { children: m.t("splicewire-beam-ux::messages.config_meta_owner") }),
        /* @__PURE__ */ jsx2("dd", { className: "text-foreground", children: section.owner })
      ] }),
      section.files.package && /* @__PURE__ */ jsxs2("div", { className: "flex gap-1.5", children: [
        /* @__PURE__ */ jsx2("dt", { children: m.t("splicewire-beam-ux::messages.config_meta_package_file") }),
        /* @__PURE__ */ jsx2("dd", { className: "text-foreground", children: section.files.package })
      ] }),
      section.files.host && /* @__PURE__ */ jsxs2("div", { className: "flex gap-1.5", children: [
        /* @__PURE__ */ jsx2("dt", { children: m.t("splicewire-beam-ux::messages.config_meta_host_file") }),
        /* @__PURE__ */ jsx2("dd", { className: "text-foreground", children: section.files.host })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex gap-1.5", children: [
        /* @__PURE__ */ jsx2("dt", { children: m.t("splicewire-beam-ux::messages.config_meta_keys") }),
        /* @__PURE__ */ jsx2("dd", { className: "text-foreground", children: section.counts.keys })
      ] })
    ] })
  ] });
}
function SectionNotices({ section }) {
  const m = useBeamUxMessages();
  const providers = section.keys.filter((k) => k.tier === "provider");
  if (section.shadowedPackageKeys.length === 0 && providers.length === 0) return null;
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-1.5", children: [
    section.shadowedPackageKeys.length > 0 && /* @__PURE__ */ jsxs2(Notice, { children: [
      m.choice("splicewire-beam-ux::messages.config_host_replaces_keys", section.shadowedPackageKeys.length),
      " ",
      section.shadowedPackageKeys.map((k) => /* @__PURE__ */ jsx2("code", { className: "mr-1 font-mono", children: k }, k))
    ] }),
    providers.length > 0 && /* @__PURE__ */ jsx2(Notice, { children: m.choice("splicewire-beam-ux::messages.config_provider_written_keys", providers.length) })
  ] });
}
function Notice({ children }) {
  return /* @__PURE__ */ jsxs2("p", { role: "note", className: "flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground", children: [
    /* @__PURE__ */ jsx2(AlertTriangle, { className: "mt-px size-3.5 flex-none", "aria-hidden": true }),
    /* @__PURE__ */ jsx2("span", { children })
  ] });
}
function FilterChips({ section, filter, setFilter }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsx2("div", { role: "tablist", "aria-label": m.t("splicewire-beam-ux::messages.config_filter_keys"), className: "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1", children: KEY_FILTERS.map((f) => {
    const n = section.keys.filter((k) => matchesFilter(k, f)).length;
    return /* @__PURE__ */ jsxs2(
      "button",
      {
        role: "tab",
        type: "button",
        "aria-selected": filter === f,
        onClick: () => setFilter(f),
        disabled: n === 0 && f !== "all",
        className: cn2(
          "inline-flex h-7 flex-none items-center gap-1.5 rounded-full border px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          filter === f && "border-foreground/20 bg-card text-foreground shadow-xs"
        ),
        children: [
          m.t(KEY_FILTER_LABEL[f]),
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] tabular-nums", children: n })
        ]
      },
      f
    );
  }) });
}
function KeyTable({
  section,
  keys,
  selected,
  onSelect,
  filter
}) {
  const m = useBeamUxMessages();
  const schema = section.schema;
  if (keys.length === 0) {
    return /* @__PURE__ */ jsx2("p", { className: "rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground", children: filter === "all" ? m.t("splicewire-beam-ux::messages.config_no_keys") : m.t("splicewire-beam-ux::messages.config_no_keys_match") });
  }
  return /* @__PURE__ */ jsx2("div", { className: "overflow-x-auto rounded-lg border bg-card", children: /* @__PURE__ */ jsxs2("table", { className: "w-full min-w-[44rem] table-fixed text-sm", children: [
    /* @__PURE__ */ jsxs2("colgroup", { children: [
      /* @__PURE__ */ jsx2("col", { className: "w-[27%]" }),
      /* @__PURE__ */ jsx2("col", { className: "w-[24%]" }),
      /* @__PURE__ */ jsx2("col", { className: "w-[13%]" }),
      /* @__PURE__ */ jsx2("col", { className: "w-[24%]" }),
      /* @__PURE__ */ jsx2("col", { className: "w-[12%]" })
    ] }),
    /* @__PURE__ */ jsx2("thead", { className: "border-b bg-muted/40 text-left text-[11px] font-medium text-muted-foreground", children: /* @__PURE__ */ jsxs2("tr", { children: [
      /* @__PURE__ */ jsx2("th", { scope: "col", className: "py-2 pl-4 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.config_column_key") }),
      /* @__PURE__ */ jsx2("th", { scope: "col", className: "py-2 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.config_column_value") }),
      /* @__PURE__ */ jsx2("th", { scope: "col", className: "py-2 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.config_column_set_by") }),
      /* @__PURE__ */ jsx2("th", { scope: "col", className: "py-2 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.config_column_fed_by") }),
      /* @__PURE__ */ jsx2("th", { scope: "col", className: "py-2 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.config_column_applies") })
    ] }) }),
    /* @__PURE__ */ jsx2("tbody", { children: keys.map((k) => {
      const label = keyLabel(schema, k.pointer);
      return /* @__PURE__ */ jsxs2(
        "tr",
        {
          "data-config-key": k.pointer,
          className: cn2("border-b align-top last:border-b-0", selected === k.pointer && "bg-primary/5"),
          children: [
            /* @__PURE__ */ jsx2("th", { scope: "row", className: "py-2 pl-4 pr-3 text-left font-normal", children: /* @__PURE__ */ jsxs2(
              "button",
              {
                type: "button",
                onClick: () => onSelect(k.pointer),
                className: "block w-full min-w-0 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                children: [
                  /* @__PURE__ */ jsx2("span", { className: "block truncate text-sm font-medium leading-5", children: label }),
                  /* @__PURE__ */ jsx2("span", { className: "block truncate font-mono text-[10.5px] leading-4 text-muted-foreground", children: k.pointer })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx2("td", { className: "max-w-0 py-2 pr-3", children: /* @__PURE__ */ jsx2(KeyValue, { section, keyData: k, label }) }),
            /* @__PURE__ */ jsx2("td", { className: "py-2 pr-3", children: /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                onClick: () => onSelect(k.pointer),
                "aria-label": m.t("splicewire-beam-ux::messages.config_where_from", { label }),
                className: "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                children: /* @__PURE__ */ jsx2(TierPill, { tier: k.tier })
              }
            ) }),
            /* @__PURE__ */ jsx2("td", { className: "max-w-0 overflow-hidden py-2 pr-3", children: /* @__PURE__ */ jsx2(FedBy, { section, keyData: k }) }),
            /* @__PURE__ */ jsx2("td", { className: "py-2 pr-3", children: /* @__PURE__ */ jsx2(EffectTag, { effect: k.effect }) })
          ]
        },
        k.pointer
      );
    }) })
  ] }) });
}
var STANDING_NOTE = {
  shadowed: "splicewire-beam-ux::messages.config_standing_shadowed",
  removed: "splicewire-beam-ux::messages.config_standing_removed"
};
function CascadeInspector({
  section,
  keyData,
  onClose,
  resource,
  realm = "operator"
}) {
  const m = useBeamUxMessages();
  const schema = section.schema;
  const label = keyLabel(schema, keyData.pointer);
  const description = keyDescription(schema, keyData.pointer);
  const rows = provenance(keyData);
  const closed = closedTiers(keyData);
  return /* @__PURE__ */ jsxs2("aside", { "aria-label": m.t("splicewire-beam-ux::messages.config_cascade_for", { label }), "data-config-inspector": keyData.pointer, className: "space-y-3 rounded-lg border bg-card p-4", children: [
    /* @__PURE__ */ jsxs2("header", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs2("div", { className: "font-mono text-[11px] text-muted-foreground", children: [
            section.root,
            keyData.pointer
          ] }),
          /* @__PURE__ */ jsx2("h2", { className: "text-[15px] font-semibold tracking-tight", children: label })
        ] }),
        onClose && /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "ghost", className: "h-7 px-2", onClick: onClose, "aria-label": m.t("splicewire-beam-ux::messages.config_close_inspector"), children: /* @__PURE__ */ jsx2(X, { className: "size-3.5" }) })
      ] }),
      description && /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: description }),
      /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-3 pt-1", children: [
        /* @__PURE__ */ jsx2(EffectTag, { effect: keyData.effect }),
        /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: keyData.overridable ? m.t("splicewire-beam-ux::messages.config_overridable_up_to", { tier: m.t(TIER_WORD[keyData.ceiling]) }) : m.t("splicewire-beam-ux::messages.config_not_overridable") }),
        closed.map((tier) => /* @__PURE__ */ jsx2("span", { "data-config-closed-to": tier, className: "font-mono text-[10.5px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_closed_to", { tier: m.t(TIER_WORD[tier]) }) }, tier))
      ] })
    ] }),
    /* @__PURE__ */ jsx2(ChangeNote, { section, keyData }),
    resource !== void 0 && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(EditSlot, { resource, section, keyData, realm }, keyData.pointer),
      /* @__PURE__ */ jsx2(LockControl, { resource, section, keyData, realm })
    ] }),
    /* @__PURE__ */ jsx2("ol", { className: "space-y-2", "aria-label": m.t("splicewire-beam-ux::messages.config_layers"), children: rows.map(
      (row, i) => row.kind === "closed" ? /* @__PURE__ */ jsxs2("li", { "data-config-layer": row.tier, "data-config-standing": "closed", className: "rounded-lg border border-dashed", children: [
        /* @__PURE__ */ jsxs2("header", { className: "flex items-center justify-between gap-2 border-b border-dashed px-3 py-1.5", children: [
          /* @__PURE__ */ jsx2(TierPill, { tier: row.tier }),
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_standing_closed") })
        ] }),
        /* @__PURE__ */ jsx2("p", { className: "px-3 py-2 text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_closed_note", { tier: m.t(TIER_WORD[row.tier]) }) })
      ] }, `closed-${row.tier}`) : /* @__PURE__ */ jsxs2(
        "li",
        {
          "data-config-layer": row.layer.tier,
          "data-config-standing": row.standing,
          className: cn2("rounded-lg border", row.standing === "wins" ? "ring-1 ring-primary/25" : "opacity-80"),
          children: [
            /* @__PURE__ */ jsxs2("header", { className: "flex items-center justify-between gap-2 border-b px-3 py-1.5", children: [
              /* @__PURE__ */ jsx2(TierPill, { tier: row.layer.tier }),
              /* @__PURE__ */ jsx2("span", { className: "truncate font-mono text-[10.5px] text-muted-foreground", title: row.layer.source ?? "", children: row.layer.source ?? "\u2014" })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "space-y-0.5 px-3 py-2", children: [
              keyData.secret ? row.standing === "wins" ? /* @__PURE__ */ jsx2(SecretValue, { set: keyData.set }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_withheld") }) : /* @__PURE__ */ jsx2(PlainValue, { value: row.layer.value, struck: row.standing !== "wins" }),
              (row.standing === "shadowed" || row.standing === "removed") && /* @__PURE__ */ jsx2("p", { className: "font-mono text-[10.5px] text-muted-foreground", children: m.t(STANDING_NOTE[row.standing]) })
            ] })
          ]
        },
        `${row.layer.tier}-${i}`
      )
    ) }),
    keyData.env && /* @__PURE__ */ jsxs2("p", { "data-config-env-note": true, className: "font-mono text-[10.5px] text-muted-foreground", children: [
      keyData.env.name,
      ": ",
      m.t(envState(keyData.env.set)),
      keyData.env.file && ` (${keyData.env.file}${keyData.env.line === null ? "" : `:${keyData.env.line}`})`
    ] })
  ] });
}
function ChangeNote({ section, keyData }) {
  const m = useBeamUxMessages();
  if (keyData.effect !== "deploy") {
    return /* @__PURE__ */ jsx2("p", { "data-config-change": keyData.effect, className: "text-xs text-muted-foreground", children: m.t(EFFECT_COPY[keyData.effect].longKey) });
  }
  const source = deploySource(section, keyData);
  return /* @__PURE__ */ jsx2("p", { "data-config-change": "deploy", className: "text-xs text-muted-foreground", children: source.kind === "env" ? /* @__PURE__ */ jsx2(Fragment, { children: richMessage(m, "splicewire-beam-ux::messages.config_deploy_env", { name: /* @__PURE__ */ jsx2("code", { className: "font-mono text-foreground", children: say(m, source.name) }) }) }) : source.kind === "provider" ? /* @__PURE__ */ jsx2(Fragment, { children: m.t("splicewire-beam-ux::messages.config_deploy_provider") }) : /* @__PURE__ */ jsx2(Fragment, { children: richMessage(m, "splicewire-beam-ux::messages.config_deploy_file", { name: /* @__PURE__ */ jsx2("code", { className: "font-mono text-foreground", children: say(m, source.name) }) }) }) });
}

// src/config/bind.tsx
import { useResourceRecord as useResourceRecord2 } from "@schemastud/frame";
import { cn as cn3 } from "@schemastud/ui";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function useConfigValue(resource, root, pointer, realm = "operator") {
  const record = useResourceRecord2(resource, root);
  const row = asConfigSection(record.data);
  const section = row ? sectionForRealm(row, realm) : null;
  const empty = { value: void 0, key: void 0, secret: false, set: false };
  if (!section) return { ...empty, section: null, isPending: record.isPending, failed: !record.isPending };
  const resolved = resolveConfigValue(section, pointer);
  const visible = realm === "operator" || resolved.key !== void 0;
  return { ...visible ? resolved : empty, section, isPending: false, failed: false };
}
function ConfigFields({ resource, root, pointers, realm = "operator", className }) {
  const m = useBeamUxMessages();
  const record = useResourceRecord2(resource, root);
  const row = asConfigSection(record.data);
  if (record.isPending) return /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_loading_section") });
  if (!row) return /* @__PURE__ */ jsx3("p", { className: "text-sm text-destructive", children: m.t("splicewire-beam-ux::messages.config_section_read_failed") });
  const section = sectionForRealm(row, realm);
  const schema = section.schema;
  const fields = pointers.map((pointer) => ({ pointer, resolved: resolveConfigValue(section, pointer) })).filter(({ resolved }) => realm === "operator" || resolved.key !== void 0);
  return /* @__PURE__ */ jsx3("dl", { "data-config-fields": section.root, className: cn3("grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]", className), children: fields.map(({ pointer, resolved }) => {
    const label = keyLabel(schema, pointer);
    return /* @__PURE__ */ jsxs3("div", { "data-config-field": pointer, className: "contents", children: [
      /* @__PURE__ */ jsx3("dt", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx3("dd", { className: "min-w-0 text-sm", children: resolved.secret ? /* @__PURE__ */ jsx3(SecretValue, { set: resolved.set }) : /* @__PURE__ */ jsx3(ReadValue, { schema, pointer, value: resolved.value, label }) })
    ] }, pointer);
  }) });
}
export {
  CascadeInspector,
  ConfigArea,
  ConfigFields,
  DraftBar,
  EFFECT_COPY,
  EditSlot,
  EffectTag,
  FedBy,
  KEY_FILTERS,
  KeyValue,
  LockControl,
  RELEASE_KIND_CONFIG,
  ReadValue,
  SecretValue,
  SectionRail,
  SectionView,
  SectionsIndex,
  TIER_LABEL,
  TIER_ORDER,
  TierPill,
  VersionsPanel,
  admitsTenant,
  allowsNull,
  canEdit,
  cascade,
  draftFor,
  hasPendingDraft,
  isLocked,
  keyDiff,
  keyFor,
  keyLabel,
  matchesFilter,
  nodeAt,
  resolveConfigValue,
  sectionForRealm,
  toDraftValue,
  useConfigValue,
  valueAt
};
//# sourceMappingURL=config.js.map