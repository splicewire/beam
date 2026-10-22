import {
  OperatorLayout
} from "./chunk-TUELYIZM.js";
import "./chunk-BBYPLYMO.js";
import {
  SiteLayout
} from "./chunk-L3DFB4QY.js";
import {
  BeamAccountLayout
} from "./chunk-EFXMP2UY.js";
import "./chunk-UEQF4DVZ.js";
import "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import "./chunk-6C5PVJOV.js";
import "./chunk-L5EIPFNI.js";
import "./chunk-2XTQOEA4.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/error.tsx
import { Head, Link } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function errorLayout(props) {
  if (!props.auth?.user) return SiteLayout;
  return props.realm === "operator" ? OperatorLayout : BeamAccountLayout;
}
var muted = "var(--st-muted, var(--muted-foreground))";
var border = "var(--st-border, var(--border))";
function ErrorPage({ status, title, message, realm, auth }) {
  const signedIn = Boolean(auth?.user);
  const home = realm === "operator" && signedIn ? { href: "/operator", label: "Go to the operator console" } : signedIn ? { href: "/dashboard", label: "Go to your dashboard" } : { href: "/", label: "Go to the home page" };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title }),
    /* @__PURE__ */ jsxs(
      "main",
      {
        className: "mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16",
        "data-testid": "error-page",
        "data-status": status,
        children: [
          /* @__PURE__ */ jsxs(
            "p",
            {
              className: "font-mono text-sm",
              style: { color: muted, margin: 0 },
              children: [
                "Error ",
                status
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "h1",
            {
              className: "text-3xl font-semibold tracking-tight",
              style: { margin: 0 },
              children: title
            }
          ),
          /* @__PURE__ */ jsx("p", { style: { color: muted, margin: 0, lineHeight: 1.6 }, children: message }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                href: home.href,
                className: "rounded-md px-4 py-2 text-sm font-medium",
                style: {
                  background: "var(--st-accent, var(--primary))",
                  color: "var(--st-accent-fg, var(--primary-foreground))"
                },
                children: home.label
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => window.history.back(),
                className: "rounded-md px-4 py-2 text-sm font-medium",
                style: {
                  background: "transparent",
                  color: "inherit",
                  border: `1px solid ${border}`,
                  cursor: "pointer"
                },
                children: "Go back"
              }
            )
          ] })
        ]
      }
    )
  ] });
}
ErrorPage.layout = (props) => errorLayout(props);
export {
  ErrorPage as default,
  errorLayout
};
//# sourceMappingURL=error-QJYYTVWZ.js.map