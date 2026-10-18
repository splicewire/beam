import {
  page_editor_default
} from "./chunk-NYMTT7CR.js";
import "./chunk-RHYFBENH.js";
import "./chunk-7TJWWPG6.js";
import "./chunk-XOBFWNGB.js";
import "./chunk-MTKP2AW3.js";

// src/pages/auth/entry.tsx
import { Head, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var HEAD_TITLES = {
  login: "Log in",
  register: "Register",
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
  "confirm-password": "Confirm password",
  "two-factor-challenge": "Two-factor authentication",
  "verify-email": "Email verification"
};
function AuthEntryForSlug({
  slug,
  body,
  entryId
}) {
  const canAuthorUx = usePage().props.auth?.canAuthorUx ?? false;
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const exit = () => setEditing(false);
    window.addEventListener("beam-ux:exit", exit);
    return () => window.removeEventListener("beam-ux:exit", exit);
  }, []);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("beam-ux:mode", {
        detail: { mode: editing ? "window" : "domain" }
      })
    );
  }, [editing]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: HEAD_TITLES[slug] ?? "Account" }),
    canAuthorUx && !editing && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setEditing(true),
        className: "fixed top-3 right-3 z-40 rounded-lg border bg-background px-3 py-1.5 text-sm shadow-sm",
        children: "Edit content"
      }
    ),
    /* @__PURE__ */ jsx(page_editor_default, { slug, body, entryId })
  ] });
}
function AuthEntry({
  slug,
  body,
  entry = null
}) {
  return /* @__PURE__ */ jsx(
    AuthEntryForSlug,
    {
      slug,
      body,
      entryId: entry?.id ?? null
    },
    slug
  );
}
export {
  AuthEntry as default
};
//# sourceMappingURL=entry-DHMLCEAD.js.map