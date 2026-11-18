// src/internal/RecordBrowser.tsx
import { useState } from "react";
import { EditShell, ListShell, useFrameInjection } from "@schemastud/frame";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function RecordBrowser({ resource }) {
  const [opened, setOpened] = useState(null);
  const { Button } = useFrameInjection().primitives;
  if (opened === null) {
    return /* @__PURE__ */ jsx(
      ListShell,
      {
        resource,
        onOpen: (record) => {
          const id = record.id;
          if (id !== null && id !== void 0) setOpened(String(id));
        }
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => setOpened(null), children: "Back to the list" }),
    /* @__PURE__ */ jsx(EditShell, { resource, id: opened, readOnly: true, schemaPurpose: "read", container: "bare" })
  ] });
}

// src/account/AgreementsAndConsents.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function AgreementsAndConsents(props) {
  return /* @__PURE__ */ jsx2(EntriesScreen, { ...props, label: "Agreements & consents" }, props.resource);
}
function OrganisationAgreements(props) {
  return /* @__PURE__ */ jsx2(EntriesScreen, { ...props, label: "Agreed for the organisation" }, props.resource);
}
function EntriesScreen({ resource, heading, label }) {
  return /* @__PURE__ */ jsxs2("section", { "aria-label": label, "data-beam-agreements": "entries", children: [
    /* @__PURE__ */ jsx2("h2", { children: heading ?? label }),
    /* @__PURE__ */ jsx2(RecordBrowser, { resource })
  ] });
}

// src/internal/NestedFrame.tsx
import { useMemo, useState as useState2, useSyncExternalStore } from "react";
import { FrameProvider, useFrameInjection as useFrameInjection2 } from "@schemastud/frame";
import { jsx as jsx3 } from "react/jsx-runtime";
function createOwnUrlState() {
  let current = new URLSearchParams();
  const listeners = /* @__PURE__ */ new Set();
  const snapshot = () => current;
  const subscribe = (notify) => {
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  };
  return function useOwnUrlState() {
    const params = useSyncExternalStore(subscribe, snapshot, snapshot);
    return [
      params,
      (updater) => {
        current = updater(new URLSearchParams(current));
        listeners.forEach((notify) => notify());
      }
    ];
  };
}
function NestedFrame({ transport, children }) {
  const injection = useFrameInjection2();
  const [useUrlState] = useState2(createOwnUrlState);
  const value = useMemo(
    () => ({ ...injection, useUrlState, ...transport ? { transport } : {} }),
    [injection, useUrlState, transport]
  );
  return (
    // frame:override a nested re-scope: this list keeps its own filters, sort and page (and, for one party's history, a narrowed transport) so it never mixes them with the host's list or a sibling list; the host's kit supplies everything else.
    /* @__PURE__ */ jsx3(FrameProvider, { value, children })
  );
}

// src/operator/CoverageCard.tsx
import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { resourceQueryKey, useFrameInjection as useFrameInjection3 } from "@schemastud/frame";
import { DashboardCard } from "@schemastud/frame/cards";
import { useRjsfRegistry, widgetProps } from "@schemastud/seam";
import { jsx as jsx4 } from "react/jsx-runtime";
var ROOT = { type: "object" };
var NO_PARAMS = {};
function CoverageCard({ resource, params = NO_PARAMS }) {
  const { transport } = useFrameInjection3();
  const registry = useRjsfRegistry(ROOT);
  const id = useId();
  const summary = useQuery({
    queryKey: resourceQueryKey(transport, resource, "summary", params),
    queryFn: () => transport.summary(resource, params),
    // Never a placeholder, whatever the host's query client defaults to: a previous request's figures (another
    // resource, other params, another transport's authority) must not stand in for this one's.
    placeholderData: () => void 0
  });
  if (summary.isPending) return /* @__PURE__ */ jsx4("div", { "data-beam-agreements": "coverage", "aria-busy": "true" });
  if (summary.isError) {
    return /* @__PURE__ */ jsx4("div", { "data-beam-agreements": "coverage", role: "alert", children: summary.error.message });
  }
  const payload = summary.data;
  const row = { resource, context: "summary", label: payload.label, icon: payload.icon, href: "", summary: payload };
  return /* @__PURE__ */ jsx4("div", { "data-beam-agreements": "coverage", children: /* @__PURE__ */ jsx4(
    DashboardCard,
    {
      ...widgetProps({ registry, schema: ROOT, value: row, name: "", id, label: payload.label, readonly: true, disabled: true, options: {} })
    }
  ) });
}

// src/operator/OperatorRegistry.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function OperatorRegistry({ agreements, versions, entries, coverage, heading }) {
  return /* @__PURE__ */ jsxs3("section", { "aria-label": "Agreements registry", "data-beam-agreements": "registry", children: [
    /* @__PURE__ */ jsx5("h2", { children: heading ?? "Agreements registry" }),
    coverage ? /* @__PURE__ */ jsx5(CoverageCard, { resource: coverage }, coverage) : null,
    /* @__PURE__ */ jsx5(Part, { label: "Agreements", resource: agreements }),
    /* @__PURE__ */ jsx5(Part, { label: "Versions", resource: versions }),
    /* @__PURE__ */ jsx5(Part, { label: "Entries", resource: entries })
  ] });
}
function Part({ label, resource }) {
  return /* @__PURE__ */ jsxs3("section", { "aria-label": label, "data-beam-agreements": "registry-list", children: [
    /* @__PURE__ */ jsx5("h3", { children: label }),
    /* @__PURE__ */ jsx5(NestedFrame, { children: /* @__PURE__ */ jsx5(RecordBrowser, { resource }) }, resource)
  ] });
}

// src/operator/PartyHistory.tsx
import { useMemo as useMemo2 } from "react";
import { useFrameInjection as useFrameInjection4 } from "@schemastud/frame";

// src/operator/scopeTransport.ts
function scopeTransport(transport, resource, scope) {
  const narrowed = (target, params) => target === resource ? { ...params, ...scope } : params;
  const scoped = Object.create(transport);
  scoped.list = (target, params) => transport.list(target, narrowed(target, params) ?? {});
  scoped.get = (target, id, params) => transport.get(target, id, narrowed(target, params));
  scoped.summary = (target, params) => transport.summary(target, narrowed(target, params) ?? {});
  scoped.getFormSchema = (target, form, purpose, params) => transport.getFormSchema(target, form, purpose, narrowed(target, params));
  const getActionSchema = transport.getActionSchema;
  if (getActionSchema) {
    scoped.getActionSchema = (target, action, params) => getActionSchema.call(transport, target, action, narrowed(target, params));
  }
  return scoped;
}

// src/operator/PartyHistory.tsx
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function PartyHistory({ resource, scope, heading }) {
  const { transport: hostTransport } = useFrameInjection4();
  const scopeKey = JSON.stringify(Object.entries(scope).sort(([a], [b]) => a.localeCompare(b)));
  const transport = useMemo2(() => scopeTransport(hostTransport, resource, scope), [hostTransport, resource, scopeKey]);
  return /* @__PURE__ */ jsxs4("section", { "aria-label": "History", "data-beam-agreements": "party-history", children: [
    /* @__PURE__ */ jsx6("h2", { children: heading ?? "History" }),
    /* @__PURE__ */ jsx6(NestedFrame, { transport, children: /* @__PURE__ */ jsx6(RecordBrowser, { resource }) }, `${resource}|${scopeKey}`)
  ] });
}
export {
  AgreementsAndConsents,
  CoverageCard,
  OperatorRegistry,
  OrganisationAgreements,
  PartyHistory
};
//# sourceMappingURL=index.js.map