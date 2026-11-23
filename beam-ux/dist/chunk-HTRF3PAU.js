import {
  notice
} from "./chunk-YARN53FB.js";
import {
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

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
function provenance(key) {
  const rank = (tier) => TIER_ORDER.indexOf(tier);
  const closed = closedTiers(key).filter((tier) => rank(tier) <= rank(key.ceiling));
  const rows = cascade(key).map((row) => ({ kind: "layer", ...row }));
  for (const tier of closed) {
    const at = rows.findIndex((row) => rank(row.kind === "layer" ? row.layer.tier : row.tier) < rank(tier));
    rows.splice(at < 0 ? rows.length : at, 0, { kind: "closed", tier });
  }
  return rows;
}
function closedTiers(key) {
  return [...key.closed ?? []].sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
}
function closedToRealm(key, realm) {
  return (key.closed ?? []).includes(realm);
}
function isListKey(schema, pointer) {
  const type = nodeAt(schema, pointer)?.type;
  return type === "array" || Array.isArray(type) && type.includes("array");
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
function admitsTenant(key) {
  return TIER_ORDER.indexOf(key.ceiling) >= TIER_ORDER.indexOf("tenant");
}
function sectionForRealm(section, realm) {
  if (realm === "operator") return section;
  return {
    ...section,
    // A layer's `source` names a file or env reference, so it goes too.
    files: { package: null, host: null },
    keys: section.keys.filter(admitsTenant).map((key) => ({ ...key, env: null, layers: key.layers.map((layer) => ({ ...layer, source: null })) }))
  };
}
function keyFor(section, pointer) {
  const exact = section.keys.find((k) => k.pointer === pointer);
  if (exact) return exact;
  const tokens = pointerTokens(pointer);
  let owner;
  for (const key of section.keys) {
    const own = pointerTokens(key.pointer);
    if (own.length < tokens.length && own.every((t, i) => t === tokens[i]) && (!owner || own.length > pointerTokens(owner.pointer).length)) {
      owner = key;
    }
  }
  return owner;
}
function valueAt(section, pointer) {
  let node = section.values;
  for (const token of pointerTokens(pointer)) {
    if (Array.isArray(node) && /^\d+$/.test(token)) node = node[Number(token)];
    else if (typeof node === "object" && node !== null && token in node) node = node[token];
    else return void 0;
  }
  return node;
}
function resolveConfigValue(section, pointer) {
  const key = keyFor(section, pointer);
  if (key?.secret) return { value: void 0, key, secret: true, set: key.set };
  const value = valueAt(section, pointer);
  return { value, key, secret: false, set: value !== void 0 };
}
function draftFor(section, pointer) {
  return section.overrides.find((o) => o.pointer === pointer);
}
function hasPendingDraft(section) {
  return section.pins.draftPending;
}
function isLocked(key) {
  return key.lock !== null;
}
function canEdit(section, key, realm) {
  if (!key.overridable || key.effect === "deploy") return false;
  if (TIER_ORDER.indexOf(key.ceiling) < TIER_ORDER.indexOf(section.tier)) return false;
  if (realm === "tenant" && isLocked(key)) return false;
  if (closedToRealm(key, realm)) return false;
  return true;
}
function allowsNull(schema, pointer) {
  const node = nodeAt(schema, pointer);
  if (!node) return false;
  const type = node.type;
  return node.nullable === true || type === "null" || Array.isArray(type) && type.includes("null");
}
function keyDiff(section) {
  return section.overrides.map((o) => {
    const secret = o.secret || keyFor(section, o.pointer)?.secret === true;
    return {
      pointer: o.pointer,
      op: o.op,
      from: secret ? void 0 : valueAt(section, o.pointer),
      to: secret || o.op === "unset" ? void 0 : o.op === "null" ? null : o.value,
      secret
    };
  });
}
function toDraftValue(value) {
  return JSON.stringify(value === void 0 ? null : value);
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

export {
  TIER_ORDER,
  TIER_LABEL,
  TIER_WORD,
  EFFECT_COPY,
  KEY_FILTERS,
  KEY_FILTER_LABEL,
  matchesFilter,
  family,
  pointerTokens,
  nodeAt,
  keyLabel,
  keyDescription,
  cascade,
  provenance,
  closedTiers,
  closedToRealm,
  isListKey,
  formatValue,
  asConfigSection,
  admitsTenant,
  sectionForRealm,
  keyFor,
  valueAt,
  resolveConfigValue,
  draftFor,
  hasPendingDraft,
  isLocked,
  canEdit,
  allowsNull,
  keyDiff,
  toDraftValue,
  deploySource,
  TierPill,
  EffectTag,
  envState,
  FedBy,
  SecretValue,
  PlainValue,
  ReadValue,
  KeyValue
};
//# sourceMappingURL=chunk-HTRF3PAU.js.map