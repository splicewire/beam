import {
  richMessage
} from "./chunk-5APTQIDU.js";
import {
  notice,
  say
} from "./chunk-2G4AXCDS.js";
import {
  englishBeamUxMessages,
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

// src/config/ConfigArea.tsx
import { useMemo, useState } from "react";
import {
  ListShell,
  resourceQueryKey,
  useFrameInjection,
  useResourceRecord
} from "@schemastud/frame";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, cn as cn2 } from "@schemastud/ui";
import { AlertTriangle, Search, X } from "lucide-react";

// src/config/model.ts
var TIER_ORDER = ["package", "host", "provider", "operator", "tenant"];
var TIER_LABEL = {
  package: "splicewire-beam-ux::messages.config_tier_package",
  host: "splicewire-beam-ux::messages.config_tier_host",
  provider: "splicewire-beam-ux::messages.config_tier_provider",
  operator: "splicewire-beam-ux::messages.config_tier_operator",
  tenant: "splicewire-beam-ux::messages.config_tier_tenant"
};
var TIER_WORD = {
  package: "splicewire-beam-ux::messages.config_tier_word_package",
  host: "splicewire-beam-ux::messages.config_tier_word_host",
  provider: "splicewire-beam-ux::messages.config_tier_word_provider",
  operator: "splicewire-beam-ux::messages.config_tier_word_operator",
  tenant: "splicewire-beam-ux::messages.config_tier_word_tenant"
};
var EFFECT_COPY = {
  live: { labelKey: "splicewire-beam-ux::messages.config_effect_live", longKey: "splicewire-beam-ux::messages.config_effect_live_long" },
  reload: { labelKey: "splicewire-beam-ux::messages.config_effect_reload", longKey: "splicewire-beam-ux::messages.config_effect_reload_long" },
  deploy: { labelKey: "splicewire-beam-ux::messages.config_effect_deploy", longKey: "splicewire-beam-ux::messages.config_effect_deploy_long" }
};
var KEY_FILTERS = ["all", "changeable", "deploy", "env", "secrets"];
var KEY_FILTER_LABEL = {
  all: "splicewire-beam-ux::messages.config_filter_all",
  changeable: "splicewire-beam-ux::messages.config_filter_changeable",
  deploy: "splicewire-beam-ux::messages.config_filter_deploy",
  env: "splicewire-beam-ux::messages.config_filter_env",
  secrets: "splicewire-beam-ux::messages.config_filter_secrets"
};
function matchesFilter(key, filter) {
  switch (filter) {
    case "changeable":
      return key.overridable;
    case "deploy":
      return key.effect === "deploy";
    case "env":
      return key.env !== null;
    case "secrets":
      return key.secret;
    default:
      return true;
  }
}
function family(root) {
  return root.split(".")[0] ?? root;
}
function unescapeToken(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
function pointerTokens(pointer) {
  if (pointer === "" || pointer === "/") return [];
  return pointer.replace(/^\//, "").split("/").map(unescapeToken);
}
function isNode(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nodeAt(schema, pointer) {
  let node = schema;
  for (const token of pointerTokens(pointer)) {
    if (!isNode(node)) return void 0;
    const properties = node.properties;
    if (isNode(properties) && isNode(properties[token])) {
      node = properties[token];
    } else if (isNode(node.additionalProperties)) {
      node = node.additionalProperties;
    } else if (isNode(node.items) && /^\d+$/.test(token)) {
      node = node.items;
    } else {
      return void 0;
    }
  }
  return isNode(node) ? node : void 0;
}
function humanize(token) {
  const words = token.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_\-.]+/g, " ").trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : token;
}
function keyLabel(schema, pointer) {
  const title = nodeAt(schema, pointer)?.title;
  if (typeof title === "string" && title.trim() !== "") return title;
  const tokens = pointerTokens(pointer);
  return humanize(tokens[tokens.length - 1] ?? pointer);
}
function keyDescription(schema, pointer) {
  const description = nodeAt(schema, pointer)?.description;
  return typeof description === "string" && description.trim() !== "" ? description : void 0;
}
function cascade(key) {
  const rank = (tier) => TIER_ORDER.indexOf(tier);
  const ordered = [...key.layers].sort((a, b) => rank(b.tier) - rank(a.tier));
  const winner = ordered.find((l) => l.tier === key.tier && !l.shadowed && !l.removed);
  return ordered.map((layer) => ({
    layer,
    standing: layer.removed ? "removed" : layer.shadowed ? "shadowed" : layer === winner ? "wins" : "loses"
  }));
}
function formatValue(value) {
  if (value === null) return JSON.stringify(null);
  if (value === void 0) return "\u2014";
  if (typeof value === "string") return value === "" ? '""' : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length === 0 ? "[]" : JSON.stringify(value);
  if (typeof value === "object") return Object.keys(value).length === 0 ? "{}" : JSON.stringify(value);
  return String(value);
}
function asConfigSection(row) {
  if (typeof row !== "object" || row === null) return null;
  const r = row;
  return typeof r.id === "string" && typeof r.root === "string" && Array.isArray(r.keys) && isNode(r.schema) ? row : null;
}
function deploySource(section, key) {
  if (key.env) return { kind: "env", name: key.env.name };
  if (key.tier === "provider") return { kind: "provider", name: notice("splicewire-beam-ux::messages.config_tier_word_provider") };
  const file = key.tier === "package" ? section.files.package : section.files.host ?? section.files.package;
  return { kind: "file", name: file ?? notice("splicewire-beam-ux::messages.config_the_config_file") };
}

// src/config/parts.tsx
import { useContext, useId } from "react";
import {
  asWidget,
  UnboundWidget,
  useRjsfRegistry,
  widgetProps,
  WidgetRegistryContext
} from "@schemastud/seam";
import { cn } from "@schemastud/ui";
import { FileCode2, KeyRound, RotateCw, Rocket, TerminalSquare, Zap } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
var TIER_DOT = {
  package: "bg-muted-foreground/45",
  host: "bg-foreground/75",
  provider: "bg-warning",
  operator: "bg-primary",
  tenant: "bg-primary"
};
function TierPill({ tier, className }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs(
    "span",
    {
      "data-config-tier": tier,
      className: cn(
        "inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 font-mono text-[10.5px] leading-none",
        tier === "operator" || tier === "tenant" ? "border-primary/25 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
        tier === "provider" && "border-warning/40 bg-warning/10 text-warning-foreground",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("span", { className: cn("size-1.5 rounded-full", TIER_DOT[tier]), "aria-hidden": true }),
        m.t(TIER_LABEL[tier])
      ]
    }
  );
}
var EFFECT_ICON = { live: Zap, reload: RotateCw, deploy: Rocket };
function EffectTag({ effect, className }) {
  const m = useBeamUxMessages();
  const Icon = EFFECT_ICON[effect];
  return /* @__PURE__ */ jsxs(
    "span",
    {
      "data-config-effect": effect,
      title: m.t(EFFECT_COPY[effect].longKey),
      className: cn(
        "inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10.5px]",
        effect === "live" ? "text-primary" : effect === "reload" ? "text-info" : "text-muted-foreground",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "size-3", "aria-hidden": true }),
        m.t(EFFECT_COPY[effect].labelKey)
      ]
    }
  );
}
function envState(set) {
  if (set === true) return "splicewire-beam-ux::messages.config_env_set";
  if (set === false) return "splicewire-beam-ux::messages.config_env_unset";
  return "splicewire-beam-ux::messages.config_env_unknown";
}
function FedBy({ section, keyData, compact }) {
  const m = useBeamUxMessages();
  const env = keyData.env;
  if (env) {
    const where = env.file ? `${env.file}${env.line === null ? "" : `:${env.line}`}` : m.t("splicewire-beam-ux::messages.config_declared_on_key");
    return /* @__PURE__ */ jsxs("span", { "data-config-fed-by": "env", className: "block min-w-0 font-mono text-[11px] text-muted-foreground", title: where, children: [
      /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-1", children: [
        /* @__PURE__ */ jsx(TerminalSquare, { className: "size-3 flex-none", "aria-hidden": true }),
        /* @__PURE__ */ jsx("span", { className: cn("truncate", env.set === true && "text-info"), children: env.name })
      ] }),
      !compact && /* @__PURE__ */ jsx("span", { className: "block pl-4 text-[10.5px]", children: m.t(envState(env.set)) })
    ] });
  }
  if (keyData.tier === "provider") {
    return /* @__PURE__ */ jsx("span", { "data-config-fed-by": "provider", className: "font-mono text-[11px] text-warning-foreground", children: m.t("splicewire-beam-ux::messages.config_written_by_provider") });
  }
  const file = keyData.tier === "package" ? section.files.package : section.files.host ?? section.files.package;
  return /* @__PURE__ */ jsxs("span", { "data-config-fed-by": "file", className: "inline-flex min-w-0 items-center gap-1 font-mono text-[11px] text-muted-foreground", title: file ?? "", children: [
    /* @__PURE__ */ jsx(FileCode2, { className: "size-3 flex-none", "aria-hidden": true }),
    /* @__PURE__ */ jsx("span", { className: "truncate", children: file ?? "\u2014" })
  ] });
}
function SecretValue({ set, className }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("span", { "data-config-secret": set ? "set" : "unset", className: cn("inline-flex items-center gap-1.5 font-mono text-xs", set ? "text-foreground" : "text-muted-foreground", className), children: [
    /* @__PURE__ */ jsx(KeyRound, { className: "size-3", "aria-hidden": true }),
    set ? m.t("splicewire-beam-ux::messages.config_secret_set") : m.t("splicewire-beam-ux::messages.config_secret_not_set")
  ] });
}
function PlainValue({ value, className, struck }) {
  const text = formatValue(value);
  return /* @__PURE__ */ jsx(
    "span",
    {
      "data-config-value": "plain",
      title: text.length > 48 ? text : void 0,
      className: cn(
        "block truncate font-mono text-xs tabular-nums",
        value === null && "text-muted-foreground",
        struck && "text-muted-foreground line-through decoration-muted-foreground/60",
        className
      ),
      children: text
    }
  );
}
var READ_FORM_CONTEXT = {};
function ReadValue({ schema, pointer, value, label }) {
  const registry = useContext(WidgetRegistryContext);
  const rjsfRegistry = useRjsfRegistry(schema, READ_FORM_CONTEXT);
  const id = useId();
  const node = nodeAt(schema, pointer);
  if (!node || !registry) return /* @__PURE__ */ jsx(PlainValue, { value });
  const resolved = registry.resolveEntry(node, "detail");
  if (resolved.bound === false && resolved.name !== void 0) {
    return /* @__PURE__ */ jsx(UnboundWidget, { context: "detail", name: resolved.name, label });
  }
  const Widget = asWidget(resolved.widget);
  if (!Widget) return /* @__PURE__ */ jsx(PlainValue, { value });
  const tokens = pointerTokens(pointer);
  return /* @__PURE__ */ jsx("span", { "data-config-value": "widget", className: "block min-w-0", children: /* @__PURE__ */ jsx(
    Widget,
    {
      ...widgetProps({
        registry: rjsfRegistry,
        schema: node,
        value,
        name: tokens[tokens.length - 1] ?? "",
        id,
        label,
        readonly: true,
        disabled: true,
        options: resolved.options
      })
    }
  ) });
}
function KeyValue({ section, keyData, label }) {
  if (keyData.secret) return /* @__PURE__ */ jsx(SecretValue, { set: keyData.set });
  return /* @__PURE__ */ jsx(ReadValue, { schema: section.schema, pointer: keyData.pointer, value: keyData.value, label });
}

// src/config/ConfigArea.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ConfigArea({ resource, section, onSectionChange, className }) {
  const [own, setOwn] = useState(null);
  const active = section === void 0 ? own : section;
  const pick = (id) => {
    setOwn(id);
    onSectionChange?.(id);
  };
  return /* @__PURE__ */ jsxs2("div", { "data-beam-config-area": true, className: cn2("flex min-h-0 flex-col md:flex-row", className), children: [
    /* @__PURE__ */ jsx2("aside", { className: "flex-none border-b bg-card/50 md:w-64 md:border-b-0 md:border-r", children: /* @__PURE__ */ jsx2(SectionRail, { resource, active, onPick: pick }) }),
    /* @__PURE__ */ jsx2("div", { className: "min-w-0 flex-1 space-y-4 p-4 md:p-6", children: active === null ? /* @__PURE__ */ jsx2(SectionsIndex, { resource, onPick: pick }) : /* @__PURE__ */ jsx2(SectionView, { resource, id: active, onBack: () => pick(null) }) })
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
  const [q, setQ] = useState("");
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
      /* @__PURE__ */ jsx2(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: m.t("splicewire-beam-ux::messages.config_find_section"), "aria-label": m.t("splicewire-beam-ux::messages.config_find_section"), className: "h-8 pl-7 text-sm" })
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
function SectionView({ resource, id, onBack }) {
  const m = useBeamUxMessages();
  const record = useResourceRecord(resource, id);
  const section = asConfigSection(record.data);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  if (record.isPending) return /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_loading_section") });
  if (!section) return /* @__PURE__ */ jsx2("p", { className: "text-sm text-destructive", children: m.t("splicewire-beam-ux::messages.config_section_read_failed") });
  const keys = section.keys.filter((k) => matchesFilter(k, filter));
  const inspected = section.keys.find((k) => k.pointer === selected) ?? null;
  return /* @__PURE__ */ jsxs2("div", { "data-config-section": section.root, className: "space-y-4", children: [
    /* @__PURE__ */ jsx2(SectionHeader, { section, onBack }),
    /* @__PURE__ */ jsx2(SectionNotices, { section }),
    /* @__PURE__ */ jsx2(FilterChips, { section, filter, setFilter }),
    /* @__PURE__ */ jsxs2("div", { className: cn2("grid gap-4", inspected && "xl:grid-cols-[minmax(0,1fr)_22rem]"), children: [
      /* @__PURE__ */ jsx2(KeyTable, { section, keys, selected, onSelect: setSelected, filter }),
      inspected && /* @__PURE__ */ jsx2(CascadeInspector, { section, keyData: inspected, onClose: () => setSelected(null) })
    ] })
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
function CascadeInspector({ section, keyData, onClose }) {
  const m = useBeamUxMessages();
  const schema = section.schema;
  const label = keyLabel(schema, keyData.pointer);
  const description = keyDescription(schema, keyData.pointer);
  const layers = cascade(keyData);
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
        onClose && /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "ghost", className: "h-7 px-2", onClick: onClose, "aria-label": m.t("splicewire-beam-ux::messages.config_close_inspector"), children: /* @__PURE__ */ jsx2(X, { className: "size-3.5" }) })
      ] }),
      description && /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: description }),
      /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-3 pt-1", children: [
        /* @__PURE__ */ jsx2(EffectTag, { effect: keyData.effect }),
        /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: keyData.overridable ? m.t("splicewire-beam-ux::messages.config_overridable_up_to", { tier: m.t(TIER_WORD[keyData.ceiling]) }) : m.t("splicewire-beam-ux::messages.config_not_overridable") })
      ] })
    ] }),
    /* @__PURE__ */ jsx2(ChangeNote, { section, keyData }),
    /* @__PURE__ */ jsx2("ol", { className: "space-y-2", "aria-label": m.t("splicewire-beam-ux::messages.config_layers"), children: layers.map(({ layer, standing }, i) => /* @__PURE__ */ jsxs2(
      "li",
      {
        "data-config-layer": layer.tier,
        "data-config-standing": standing,
        className: cn2("rounded-lg border", standing === "wins" ? "ring-1 ring-primary/25" : "opacity-80"),
        children: [
          /* @__PURE__ */ jsxs2("header", { className: "flex items-center justify-between gap-2 border-b px-3 py-1.5", children: [
            /* @__PURE__ */ jsx2(TierPill, { tier: layer.tier }),
            /* @__PURE__ */ jsx2("span", { className: "truncate font-mono text-[10.5px] text-muted-foreground", title: layer.source ?? "", children: layer.source ?? "\u2014" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "space-y-0.5 px-3 py-2", children: [
            keyData.secret ? standing === "wins" ? /* @__PURE__ */ jsx2(SecretValue, { set: keyData.set }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.config_withheld") }) : /* @__PURE__ */ jsx2(PlainValue, { value: layer.value, struck: standing !== "wins" }),
            (standing === "shadowed" || standing === "removed") && /* @__PURE__ */ jsx2("p", { className: "font-mono text-[10.5px] text-muted-foreground", children: m.t(STANDING_NOTE[standing]) })
          ] })
        ]
      },
      `${layer.tier}-${i}`
    )) }),
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
export {
  CascadeInspector,
  ConfigArea,
  EFFECT_COPY,
  EffectTag,
  FedBy,
  KEY_FILTERS,
  KeyValue,
  ReadValue,
  SecretValue,
  SectionRail,
  SectionView,
  SectionsIndex,
  TIER_LABEL,
  TIER_ORDER,
  TierPill,
  cascade,
  keyLabel,
  matchesFilter,
  nodeAt
};
//# sourceMappingURL=config.js.map