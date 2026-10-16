import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
import {
  Spinner
} from "./chunk-3T56CRQW.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/auth/verify-email.tsx
import { Form, usePage } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function VerifyEmail() {
  const { status } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    status === "verification-link-sent" && /* @__PURE__ */ jsx("div", { className: "mb-4 text-center text-sm font-medium text-primary", children: "A new verification link has been sent to the email address you provided during registration." }),
    /* @__PURE__ */ jsx(
      Form,
      {
        action: "/email/verification-notification",
        method: "post",
        className: "space-y-6 text-center",
        children: ({ processing }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(Button, { disabled: processing, variant: "secondary", children: [
            processing && /* @__PURE__ */ jsx(Spinner, {}),
            "Resend verification email"
          ] }),
          /* @__PURE__ */ jsx(
            TextLink,
            {
              href: "/logout",
              method: "post",
              className: "mx-auto block text-sm",
              children: "Log out"
            }
          )
        ] })
      }
    )
  ] });
}
export {
  VerifyEmail as default
};
//# sourceMappingURL=verify-email-L3CLVRJ7.js.map