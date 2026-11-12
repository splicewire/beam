import {
  messageOf,
  pageStateOf,
  retryUnlessClientError,
  statusOf,
  transportOf
} from "./chunk-2FFLR2EZ.js";

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