import {
  OperatorLayout
} from "./chunk-NMV4AJX2.js";
import {
  SiteLayout
} from "./chunk-RWQQDTZ5.js";
import {
  BeamAccountLayout
} from "./chunk-QRADWOWP.js";
import "./chunk-KUXBZNAJ.js";
import "./chunk-IHHHPJVP.js";
import "./chunk-73MHV75H.js";
import "./chunk-LZNX4YUE.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-YAINAZ7K.js";
import "./chunk-5A4XHNWR.js";
import "./chunk-6C5PVJOV.js";
import "./chunk-L5EIPFNI.js";
import "./chunk-PGZP7A2Q.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

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
  const messages = useBeamMessages();
  const signedIn = Boolean(auth?.user);
  const home = realm === "operator" && signedIn ? { href: "/operator", label: messages.t("splicewire-beam-inertia::messages.chrome_go_operator") } : signedIn ? { href: "/dashboard", label: messages.t("splicewire-beam-inertia::messages.chrome_go_dashboard") } : { href: "/", label: messages.t("splicewire-beam-inertia::messages.chrome_go_home") };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title }),
    /* @__PURE__ */ jsxs(
      "main",
      {
        className: "mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16",
        "data-testid": "error-page",
        "data-status": status,
        children: [
          /* @__PURE__ */ jsx(
            "p",
            {
              className: "font-mono text-sm",
              style: { color: muted, margin: 0 },
              children: messages.t("splicewire-beam-inertia::messages.chrome_error_status", { status })
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
                children: messages.t("splicewire-beam-inertia::messages.chrome_go_back")
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
//# sourceMappingURL=error-FQ7LQADG.js.map