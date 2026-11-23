import {
  page_editor_default
} from "./chunk-TOUQF5A3.js";
import "./chunk-FVRIAGV5.js";
import "./chunk-BHLJF5QC.js";
import "./chunk-IHHHPJVP.js";
import "./chunk-YAINAZ7K.js";
import "./chunk-PGZP7A2Q.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/auth/entry.tsx
import { Head, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AuthEntryForSlug({
  slug,
  body,
  entryId
}) {
  const messages = useBeamMessages();
  const HEAD_TITLES = {
    login: messages.t("splicewire-beam-inertia::messages.auth_log_in"),
    register: messages.t("splicewire-beam-inertia::messages.auth_register"),
    "forgot-password": messages.t("splicewire-beam-inertia::messages.auth_forgot_password"),
    "reset-password": messages.t("splicewire-beam-inertia::messages.auth_reset_password"),
    "confirm-password": messages.t("splicewire-beam-inertia::messages.auth_confirm_password"),
    "two-factor-challenge": messages.t("splicewire-beam-inertia::messages.auth_two_factor_authentication"),
    "verify-email": messages.t("splicewire-beam-inertia::messages.auth_email_verification")
  };
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
    /* @__PURE__ */ jsx(Head, { title: HEAD_TITLES[slug] ?? messages.t("splicewire-beam-inertia::messages.auth_account") }),
    canAuthorUx && !editing && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setEditing(true),
        className: "fixed top-3 right-3 z-40 rounded-lg border bg-background px-3 py-1.5 text-sm shadow-sm",
        children: messages.t("splicewire-beam-inertia::messages.auth_edit_content")
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
//# sourceMappingURL=entry-XWSTYEQS.js.map