import {
  PasskeyVerify
} from "./chunk-3PW4XCQ2.js";
import "./chunk-L5EIPFNI.js";
import {
  Spinner
} from "./chunk-2ENPYRHF.js";
import {
  PasswordInput
} from "./chunk-QZ5EKZIA.js";
import {
  InputError
} from "./chunk-UJ2MQHRA.js";
import {
  featureEnabled
} from "./chunk-XP5YRUDH.js";
import {
  Label
} from "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/auth/confirm-password.tsx
import { Form } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ConfirmPassword() {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    featureEnabled("passkeys") && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
      PasskeyVerify,
      {
        routes: {
          options: {
            method: "get",
            url: "/passkeys/confirm/options"
          },
          submit: { method: "post", url: "/passkeys/confirm" }
        },
        label: messages.t("splicewire-beam-inertia::messages.auth_confirm_with_passkey"),
        loadingLabel: messages.t("splicewire-beam-inertia::messages.auth_confirming"),
        separator: messages.t("splicewire-beam-inertia::messages.auth_or_confirm_with_password")
      }
    ) }),
    /* @__PURE__ */ jsx(
      Form,
      {
        action: "/user/confirm-password",
        method: "post",
        resetOnSuccess: ["password"],
        children: ({ processing, errors }) => /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: messages.t("splicewire-beam-inertia::messages.auth_password") }),
            /* @__PURE__ */ jsx(
              PasswordInput,
              {
                id: "password",
                name: "password",
                placeholder: messages.t("splicewire-beam-inertia::messages.auth_password"),
                autoComplete: "current-password",
                autoFocus: true
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.password })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsxs(
            Button,
            {
              className: "w-full",
              disabled: processing,
              "data-test": "confirm-password-button",
              children: [
                processing && /* @__PURE__ */ jsx(Spinner, {}),
                messages.t("splicewire-beam-inertia::messages.auth_confirm_password")
              ]
            }
          ) })
        ] })
      }
    )
  ] });
}
export {
  ConfirmPassword as default
};
//# sourceMappingURL=confirm-password-3CEM7F5A.js.map