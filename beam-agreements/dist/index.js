import {
  AgreementMemberWidget,
  AgreementPrompt,
  registerAgreementWidgets
} from "./chunk-X4RUJNEM.js";
import {
  AgreementsRequired,
  createStepUp
} from "./chunk-EZO5HDLM.js";
import {
  Legal
} from "./chunk-QHEEXVWK.js";
import {
  LegalVersion
} from "./chunk-K5XRFNYE.js";
import {
  Consent
} from "./chunk-LIGECN7D.js";
import {
  AgreementStepUp,
  PRIMARY,
  SECONDARY
} from "./chunk-6DWJYBPW.js";
import "./chunk-NRVEU3PX.js";

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

// src/interlock/refusal.ts
import { FrameActionError } from "@schemastud/frame";
var AGREEMENTS_RESOURCE = "agreements";
function agreementsFrom(transport) {
  return async (key) => {
    try {
      return await transport.get(AGREEMENTS_RESOURCE, key);
    } catch (error) {
      if (error instanceof FrameActionError && error.status === 404) return null;
      throw error;
    }
  };
}
function isOutstanding(value) {
  if (!value || typeof value !== "object") return false;
  const r = value;
  return typeof r.key === "string" && typeof r.version === "number" && typeof r.digest === "string" && typeof r.title === "string" && (typeof r.acceptOperation === "string" || r.acceptOperation === null) && (typeof r.member === "string" || r.member === null);
}
function refusalOf(error) {
  if (!(error instanceof FrameActionError) || error.status !== 428) return null;
  const body = error.body;
  const list = body?.requirements ?? body?.data?.requirements;
  if (!Array.isArray(list) || list.length === 0 || !list.every(isOutstanding)) return null;
  return list;
}
var AgreementTextMismatchError = class extends Error {
  constructor(key) {
    super(`The agreement changed while it was being shown. Nothing was done; please try again.`);
    this.key = key;
    this.name = "AgreementTextMismatchError";
  }
  key;
};
var AgreementUnavailableError = class extends Error {
  constructor(key) {
    super(`This agreement isn't available to accept right now. Nothing was done.`);
    this.key = key;
    this.name = "AgreementUnavailableError";
  }
  key;
};
async function presentRefused(requirement, read) {
  if (requirement.acceptOperation === null && requirement.member === null) {
    throw new AgreementUnavailableError(requirement.key);
  }
  const row = await read(requirement.key);
  const version = row?.version;
  if (!version || typeof version.content !== "string") throw new AgreementUnavailableError(requirement.key);
  if (version.digest !== requirement.digest) return "moved";
  return {
    key: requirement.key,
    title: requirement.title,
    label: version.label,
    digest: version.digest,
    content: version.content,
    summary: version.summary ?? null,
    remedy: requirement.acceptOperation !== null ? { accept: requirement.acceptOperation } : { member: requirement.member, version: requirement.version }
  };
}

// src/interlock/interlock.ts
var AgreementDeclinedError = class extends Error {
  constructor(titles) {
    super(`Not done: ${titles.join(", ")} wasn't accepted.`);
    this.name = "AgreementDeclinedError";
  }
};
var AgreementStillRequiredError = class extends Error {
  constructor(requirements) {
    super(`Still waiting on ${requirements.map((r) => r.title).join(", ")}. Nothing more was tried.`);
    this.requirements = requirements;
    this.name = "AgreementStillRequiredError";
  }
  requirements;
};
function acceptThrough(transport, manifestFor) {
  return async (operation, input) => {
    const [resource, op] = operation.includes(".") ? [operation.slice(0, operation.lastIndexOf(".")), operation.slice(operation.lastIndexOf(".") + 1)] : [AGREEMENTS_RESOURCE, operation];
    const context = manifestFor?.(resource) ?? (await transport.getManifest?.())?.contexts?.[resource];
    const action = context?.actions?.find((a) => a.key === op);
    if (!action || !transport.invoke) throw new Error(`This app can't record acceptance (${operation} isn't offered).`);
    await transport.invoke(action, { id: null, data: input });
  };
}
function withMember(data, path, value) {
  const root = data && typeof data === "object" ? { ...data } : {};
  const parts = path.split(".");
  let node = root;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    node[part] = next && typeof next === "object" ? { ...next } : {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
  return root;
}
function withAgreementInterlock(transport, options) {
  const inner = transport.invoke?.bind(transport);
  if (!inner) return transport;
  async function presentAll(outstanding) {
    const presented = [];
    for (const requirement of outstanding) {
      const shown = await presentRefused(requirement, options.read);
      if (shown === "moved") return "moved";
      presented.push(shown);
    }
    return presented;
  }
  const invoke = async (action, target) => {
    let outstanding;
    try {
      return await inner(action, target);
    } catch (error) {
      outstanding = refusalOf(error);
      if (outstanding === null) throw error;
    }
    let presented = await presentAll(outstanding);
    if (presented === "moved") {
      try {
        return await inner(action, target);
      } catch (error) {
        const fresh = refusalOf(error);
        if (fresh === null) throw error;
        outstanding = fresh;
      }
      presented = await presentAll(outstanding);
      if (presented === "moved") throw new AgreementTextMismatchError(outstanding[0].key);
    }
    if (!await options.ask(presented)) {
      throw new AgreementDeclinedError(presented.map((p) => p.title));
    }
    let data = target.data;
    const accepted = [];
    for (const agreement of presented) {
      if ("accept" in agreement.remedy) {
        await options.accept(agreement.remedy.accept, {
          agreement: agreement.key,
          version: agreement.label,
          digest: agreement.digest
        });
        accepted.push(agreement.key);
      } else {
        data = withMember(data, agreement.remedy.member, {
          key: agreement.key,
          version: agreement.remedy.version,
          digest: agreement.digest
        });
      }
    }
    if (accepted.length > 0) options.onAccepted?.(accepted);
    try {
      return await inner(action, { ...target, data });
    } catch (error) {
      const again = refusalOf(error);
      if (again !== null) throw new AgreementStillRequiredError(again);
      throw error;
    }
  };
  return Object.assign(Object.create(Object.getPrototypeOf(transport)), transport, { invoke });
}

// src/interlock/lock.ts
var ACCEPT = "agreements.accept";
function createAgreementLock(options) {
  const describe = options.describe ?? ((keys) => `Needs your agreement first (${keys.join(", ")}). You'll be shown it before anything happens.`);
  return (_resource, action, _record) => {
    const map = options.abilities() ?? {};
    const unmet = (action.requires ?? []).filter((key) => map[`agreement:${key}`] === false && !options.accepted?.has(key));
    if (unmet.length === 0) return null;
    return {
      label: describe(unmet),
      async unlock() {
        const presented = [];
        for (const key of unmet) {
          const row = await options.read(key);
          const version = row?.version;
          if (!version || typeof version.content !== "string") throw new AgreementUnavailableError(key);
          presented.push({
            key,
            title: row?.title ?? key,
            label: version.label,
            digest: version.digest,
            content: version.content,
            remedy: { accept: ACCEPT }
          });
        }
        if (!await options.ask(presented)) return false;
        for (const agreement of presented) {
          await options.accept(ACCEPT, { agreement: agreement.key, version: agreement.label, digest: agreement.digest });
        }
        options.onAccepted?.(unmet);
        return true;
      }
    };
  };
}

// src/interlock/index.ts
function createAgreementInterlock(options) {
  const stepUp = options.stepUp ?? createStepUp();
  const read = agreementsFrom(options.transport);
  const accept = acceptThrough(options.transport, options.manifestFor);
  const accepted = /* @__PURE__ */ new Set();
  const onAccepted = (keys) => keys.forEach((key) => accepted.add(key));
  return {
    transport: withAgreementInterlock(options.transport, { read, ask: stepUp.ask, accept, onAccepted }),
    actionLock: createAgreementLock({ abilities: options.abilities, read, ask: stepUp.ask, accept, accepted, onAccepted }),
    stepUp
  };
}

// src/pages/index.ts
var beamAgreementsPages = {
  "agreements/required": () => import("./AgreementsRequired-TAJT6B3D.js"),
  // agreements 09: the public legal pages (the seam's AgreementsRoutes::mountPublic()).
  "agreements/legal": () => import("./Legal-J4BZP7UZ.js"),
  "agreements/legal-version": () => import("./LegalVersion-IWKPV6WO.js"),
  // agreements 12: the counterparty's signed page (the seam's AgreementsRoutes::mountConsent()).
  "agreements/consent": () => import("./Consent-XKCPSX2T.js")
};

// src/notices/AgreementNotices.tsx
import { createSessionRequest } from "@schemastud/frame/session";
import { useCallback, useEffect, useMemo as useMemo3, useState as useState3 } from "react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var DISMISSED = "beam-agreements:dismissed";
function dismissedKey(notice) {
  return `${DISMISSED}:${notice.key}:${notice.digest}`;
}
function isDismissed(notice) {
  try {
    return window.localStorage.getItem(dismissedKey(notice)) === "1";
  } catch {
    return false;
  }
}
function rememberDismissed(notice) {
  try {
    window.localStorage.setItem(dismissedKey(notice), "1");
  } catch {
  }
}
function AgreementNotices({ url = "/agreements/notices", request: injected }) {
  const request = useMemo3(() => injected ?? createSessionRequest(), [injected]);
  const [notices, setNotices] = useState3([]);
  const [acceptUrl, setAcceptUrl] = useState3(null);
  const [acknowledgeUrl, setAcknowledgeUrl] = useState3(null);
  const [busy, setBusy] = useState3(null);
  const [error, setError] = useState3(null);
  useEffect(() => {
    const controller = new AbortController();
    request("GET", url, void 0, void 0, { signal: controller.signal }).then(({ data }) => {
      setNotices((data?.data ?? []).filter((notice) => !isDismissed(notice)));
      setAcceptUrl(data?.acceptUrl ?? null);
      setAcknowledgeUrl(data?.acknowledgeUrl ?? null);
    }).catch(() => {
    });
    return () => controller.abort();
  }, [request, url]);
  const remove = useCallback((notice) => setNotices((current) => current.filter((n) => n !== notice)), []);
  const dismiss = useCallback(
    (notice) => {
      rememberDismissed(notice);
      remove(notice);
    },
    [remove]
  );
  const isNotice = (notice) => notice.kind === "notice";
  const urlFor = useCallback((notice) => isNotice(notice) ? acknowledgeUrl : acceptUrl, [acceptUrl, acknowledgeUrl]);
  const agree = useCallback(
    async (notice) => {
      const target = urlFor(notice);
      if (target === null) return;
      setBusy(notice.key);
      setError(null);
      try {
        await request("POST", target, void 0, { agreement: notice.key, version: notice.label, digest: notice.digest });
        remove(notice);
      } catch (e) {
        setError({ key: notice.key, message: e instanceof Error && e.message ? e.message : "Accepting failed. Nothing was done." });
      } finally {
        setBusy(null);
      }
    },
    [urlFor, request, remove]
  );
  if (notices.length === 0) return null;
  return /* @__PURE__ */ jsx7("section", { "data-beam-agreements": "notices", "aria-label": "Agreement updates", style: { display: "grid", gap: 8 }, children: notices.map((notice) => /* @__PURE__ */ jsxs5(
    "div",
    {
      role: "status",
      style: { border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "12px 16px", display: "grid", gap: 8 },
      children: [
        /* @__PURE__ */ jsxs5("p", { style: { margin: 0 }, children: [
          /* @__PURE__ */ jsx7("strong", { children: notice.title }),
          " has a new version (",
          notice.label,
          ")."
        ] }),
        notice.summary ? /* @__PURE__ */ jsxs5("p", { "data-beam-agreements": "summary", style: { margin: 0 }, children: [
          /* @__PURE__ */ jsx7("strong", { children: "What changed:" }),
          " ",
          notice.summary
        ] }) : null,
        error?.key === notice.key ? /* @__PURE__ */ jsx7("p", { role: "alert", style: { margin: 0 }, children: error.message }) : null,
        /* @__PURE__ */ jsxs5("p", { style: { margin: 0, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx7("a", { href: notice.legalUrl ?? notice.readUrl, children: "Read it" }),
          urlFor(notice) !== null ? /* @__PURE__ */ jsx7("button", { type: "button", style: PRIMARY, disabled: busy === notice.key, onClick: () => void agree(notice), children: busy === notice.key ? "Recording\u2026" : isNotice(notice) ? "Acknowledge" : "I agree" }) : null,
          /* @__PURE__ */ jsx7("button", { type: "button", style: SECONDARY, onClick: () => dismiss(notice), children: "Dismiss" })
        ] })
      ]
    },
    `${notice.key}:${notice.digest}`
  )) });
}

// src/account/ConsentRequests.tsx
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function ConsentRequests({ resource, heading }) {
  return /* @__PURE__ */ jsxs6("section", { "aria-label": "Consent requests", "data-beam-agreements": "consent-requests", children: [
    /* @__PURE__ */ jsx8("h2", { children: heading ?? "Consent requests" }),
    /* @__PURE__ */ jsx8(RecordBrowser, { resource })
  ] }, resource);
}

// src/workflows/AgreementBlockedStep.tsx
import { createSessionRequest as createSessionRequest2 } from "@schemastud/frame/session";
import { useCallback as useCallback2, useMemo as useMemo4, useState as useState4 } from "react";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
var AGREEMENT_GUARD = "agreement-is-current";
function blockedAgreementKey(transition) {
  if (transition.guard !== AGREEMENT_GUARD || transition.reason === null) return null;
  const params = transition.metadata?.guardParams ?? null;
  return typeof params?.agreement === "string" && params.agreement !== "" ? params.agreement : null;
}
function agreementBlockedStep(options) {
  return (transition) => {
    const key = blockedAgreementKey(transition);
    return key === null ? null : /* @__PURE__ */ jsx9(AgreementBlockedStep, { agreementKey: key, ...options });
  };
}
function AgreementBlockedStep({
  agreementKey,
  onAccepted,
  readUrl = (key) => `/beam/agreements/agreements/${encodeURIComponent(key)}`,
  acceptUrl = "/beam/agreements/agreements/accept",
  request: injected
}) {
  const request = useMemo4(() => injected ?? createSessionRequest2(), [injected]);
  const stepUp = useMemo4(() => createStepUp(), []);
  const [busy, setBusy] = useState4(false);
  const [error, setError] = useState4(null);
  const review = useCallback2(async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await request("GET", readUrl(agreementKey));
      const row = data?.data;
      const version = row?.version;
      if (!version || typeof version.content !== "string") {
        setError("This agreement can't be shown right now. Nothing was done.");
        return;
      }
      const presented = {
        key: agreementKey,
        title: row?.title ?? agreementKey,
        label: version.label,
        digest: version.digest,
        content: version.content,
        summary: version.summary ?? null,
        remedy: { accept: "agreements.accept" }
      };
      if (!await stepUp.ask([presented])) return;
      await request("POST", acceptUrl, void 0, { agreement: agreementKey, version: version.label, digest: version.digest });
      onAccepted();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Accepting failed. Nothing was done.");
    } finally {
      setBusy(false);
    }
  }, [request, readUrl, agreementKey, stepUp, acceptUrl, onAccepted]);
  return /* @__PURE__ */ jsxs7("span", { "data-beam-agreements": "blocked-step", style: { display: "inline-flex", gap: 8, alignItems: "center" }, children: [
    /* @__PURE__ */ jsx9("button", { type: "button", style: SECONDARY, disabled: busy, onClick: () => void review(), children: busy ? "Opening\u2026" : "Review and accept" }),
    error !== null ? /* @__PURE__ */ jsx9("span", { role: "alert", style: { fontSize: "0.8125rem" }, children: error }) : null,
    /* @__PURE__ */ jsx9(AgreementStepUp, { controller: stepUp })
  ] });
}
export {
  AGREEMENTS_RESOURCE,
  AGREEMENT_GUARD,
  AgreementBlockedStep,
  AgreementDeclinedError,
  AgreementMemberWidget,
  AgreementNotices,
  AgreementPrompt,
  AgreementStepUp,
  AgreementStillRequiredError,
  AgreementTextMismatchError,
  AgreementUnavailableError,
  AgreementsAndConsents,
  AgreementsRequired,
  Consent,
  ConsentRequests,
  CoverageCard,
  Legal,
  LegalVersion,
  OperatorRegistry,
  OrganisationAgreements,
  PartyHistory,
  acceptThrough,
  agreementBlockedStep,
  agreementsFrom,
  beamAgreementsPages,
  blockedAgreementKey,
  createAgreementInterlock,
  createAgreementLock,
  createStepUp,
  presentRefused,
  refusalOf,
  registerAgreementWidgets,
  withAgreementInterlock
};
//# sourceMappingURL=index.js.map