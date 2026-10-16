// src/state/page-state.table.ts
var PAGE_STATE_TABLE = [
  { name: "in flight", transport: { phase: "in-flight" }, outcome: { state: "loading", retry: null } },
  { name: "2xx with rows", transport: { phase: "answered", status: 200, rows: 3 }, outcome: { state: "ready", retry: null } },
  { name: "2xx, zero rows, no filter", transport: { phase: "answered", status: 200, rows: 0 }, outcome: { state: "empty", retry: null, filtered: false } },
  { name: "2xx, zero rows, filter set", transport: { phase: "answered", status: 200, rows: 0, filtered: true }, outcome: { state: "empty", retry: null, filtered: true } },
  { name: "2xx, not a list", transport: { phase: "answered", status: 200 }, outcome: { state: "ready", retry: null } },
  { name: "401", transport: { phase: "answered", status: 401 }, outcome: { state: "forbidden", retry: "never" } },
  { name: "403", transport: { phase: "answered", status: 403 }, outcome: { state: "forbidden", retry: "never" } },
  { name: "402 (gate denial)", transport: { phase: "answered", status: 402 }, outcome: { state: "upsell", retry: "never" } },
  { name: "404", transport: { phase: "answered", status: 404 }, outcome: { state: "not-found", retry: "never" } },
  { name: "422", transport: { phase: "answered", status: 422 }, outcome: { state: "error", retry: "never" } },
  { name: "other 4xx (409)", transport: { phase: "answered", status: 409 }, outcome: { state: "error", retry: "never" } },
  { name: "5xx", transport: { phase: "answered", status: 503 }, outcome: { state: "error", retry: "bounded" } },
  { name: "network failure", transport: { phase: "network-error" }, outcome: { state: "error", retry: "bounded" } }
];

// src/state/page-state.ts
function pageStateOf(transport) {
  if (transport.phase === "in-flight") return { state: "loading", retry: null };
  if (transport.phase === "network-error") return { state: "error", retry: "bounded" };
  const { status } = transport;
  if (status >= 200 && status < 300) {
    if (transport.rows === void 0) return { state: "ready", retry: null };
    return transport.rows > 0 ? { state: "ready", retry: null } : { state: "empty", retry: null, filtered: transport.filtered === true };
  }
  if (status === 401 || status === 403) return { state: "forbidden", retry: "never" };
  if (status === 402) return { state: "upsell", retry: "never" };
  if (status === 404) return { state: "not-found", retry: "never" };
  if (status >= 400 && status < 500) return { state: "error", retry: "never" };
  return { state: "error", retry: "bounded" };
}
function statusOf(error) {
  if (error === null || typeof error !== "object") return null;
  const e = error;
  const status = typeof e.response?.status === "number" ? e.response.status : e.status;
  return typeof status === "number" ? status : null;
}
function messageOf(error) {
  if (error === null || typeof error !== "object") return null;
  const message = error.response?.data?.message;
  return typeof message === "string" && message !== "" ? message : null;
}
function transportOf(query, options = {}) {
  if (query.status === "pending") return { phase: "in-flight" };
  if (query.status === "error") {
    const status = statusOf(query.error);
    return status === null ? { phase: "network-error" } : { phase: "answered", status };
  }
  const list = Array.isArray(query.data) ? query.data : Array.isArray(query.data?.data) ? query.data.data : null;
  if (list === null) return { phase: "answered", status: 200 };
  return options.filtered === void 0 ? { phase: "answered", status: 200, rows: list.length } : { phase: "answered", status: 200, rows: list.length, filtered: options.filtered };
}
function retryUnlessClientError(failureCount, error) {
  const status = statusOf(error);
  if (status !== null && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

// src/state/StateBoundary.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var WAY_BACK_CLASS = "mt-3 inline-flex font-medium underline";
function WayBackLink({ wayBack }) {
  const props = { target: wayBack.target, className: WAY_BACK_CLASS, children: wayBack.label };
  if (wayBack.render) {
    return /* @__PURE__ */ jsx(Fragment, { children: wayBack.render(props) });
  }
  return /* @__PURE__ */ jsx("a", { href: props.target, className: props.className, children: props.children });
}
function ForbiddenState({ label, wayBack }) {
  return /* @__PURE__ */ jsxs("div", { role: "alert", "data-page-state": "forbidden", className: "p-6 text-sm", children: [
    /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
      "You don't have access to ",
      label,
      "."
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "An owner or admin of this workspace can grant it." }),
    wayBack && /* @__PURE__ */ jsx(WayBackLink, { wayBack })
  ] });
}
function StateBoundary({ query, label, filtered, onRetry, upsell, wayBack, children }) {
  const { state, retry } = pageStateOf(transportOf(query, filtered === void 0 ? {} : { filtered }));
  if (state === "forbidden") {
    return /* @__PURE__ */ jsx(ForbiddenState, { label, wayBack });
  }
  let body;
  switch (state) {
    case "ready":
    case "empty":
      body = children;
      break;
    case "loading":
      body = /* @__PURE__ */ jsxs("p", { "aria-busy": "true", className: "p-6 text-sm text-muted-foreground", children: [
        "Loading ",
        label,
        "\u2026"
      ] });
      break;
    case "not-found":
      body = /* @__PURE__ */ jsxs("div", { role: "alert", className: "p-6 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "We couldn't find ",
          label,
          "."
        ] }),
        wayBack && /* @__PURE__ */ jsx(WayBackLink, { wayBack })
      ] });
      break;
    case "upsell":
      body = upsell ?? /* @__PURE__ */ jsxs("div", { role: "alert", className: "p-6 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          label,
          " isn't included in this plan."
        ] }),
        wayBack && /* @__PURE__ */ jsx(WayBackLink, { wayBack })
      ] });
      break;
    default:
      body = /* @__PURE__ */ jsxs("div", { role: "alert", className: "p-6 text-sm", children: [
        /* @__PURE__ */ jsx("p", { children: messageOf(query.error) ?? `${label[0]?.toUpperCase() ?? ""}${label.slice(1)} couldn't load.` }),
        retry === "bounded" && onRetry && /* @__PURE__ */ jsx("button", { type: "button", className: "mt-2 underline", onClick: onRetry, children: "Try again" }),
        wayBack && /* @__PURE__ */ jsx(WayBackLink, { wayBack })
      ] });
  }
  return /* @__PURE__ */ jsx("div", { "data-page-state": state, children: body });
}
export {
  ForbiddenState,
  PAGE_STATE_TABLE,
  StateBoundary,
  messageOf,
  pageStateOf,
  retryUnlessClientError,
  statusOf,
  transportOf
};
//# sourceMappingURL=state.js.map