import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
import {
  Spinner
} from "./chunk-LROP6WVX.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/auth/verify-email.tsx
import { Form, usePage } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function VerifyEmail() {
  const messages = useBeamMessages();
  const { status } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    status === "verification-link-sent" && /* @__PURE__ */ jsx("div", { className: "mb-4 text-center text-sm font-medium text-primary", children: messages.t("splicewire-beam-inertia::messages.auth_a_new_verification_link_has_been_sent_to_the_email_address_you_provided_during_registration") }),
    /* @__PURE__ */ jsx(
      Form,
      {
        action: "/email/verification-notification",
        method: "post",
        className: "space-y-6 text-center",
        children: ({ processing }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(Button, { disabled: processing, variant: "secondary", children: [
            processing && /* @__PURE__ */ jsx(Spinner, {}),
            messages.t("splicewire-beam-inertia::messages.auth_resend_verification_email")
          ] }),
          /* @__PURE__ */ jsx(
            TextLink,
            {
              href: "/logout",
              method: "post",
              className: "mx-auto block text-sm",
              children: messages.t("splicewire-beam-inertia::messages.auth_log_out")
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
//# sourceMappingURL=verify-email-U23GZFWZ.js.map