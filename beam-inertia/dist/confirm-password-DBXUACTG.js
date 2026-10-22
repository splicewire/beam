import {
  PasskeyVerify
} from "./chunk-WPFPOHTT.js";
import "./chunk-L5EIPFNI.js";
import {
  Spinner
} from "./chunk-3T56CRQW.js";
import {
  PasswordInput
} from "./chunk-EFVFQ3JO.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  featureEnabled
} from "./chunk-2XTQOEA4.js";
import {
  InputError
} from "./chunk-UJ2MQHRA.js";
import "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/auth/confirm-password.tsx
import { Form } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ConfirmPassword() {
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
        label: "Confirm with passkey",
        loadingLabel: "Confirming...",
        separator: "Or confirm with password"
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
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
            /* @__PURE__ */ jsx(
              PasswordInput,
              {
                id: "password",
                name: "password",
                placeholder: "Password",
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
                "Confirm password"
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
//# sourceMappingURL=confirm-password-DBXUACTG.js.map