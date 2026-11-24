import {
  Spinner
} from "./chunk-LROP6WVX.js";
import {
  PasswordInput
} from "./chunk-GT2JL23L.js";
import {
  InputError
} from "./chunk-UJ2MQHRA.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/auth/reset-password.tsx
import { Form, usePage } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ResetPassword() {
  const messages = useBeamMessages();
  const { token, email, passwordRules } = usePage().props;
  const emailValue = typeof email === "string" ? email : "";
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Form,
    {
      action: "/reset-password",
      method: "post",
      transform: (data) => ({ ...data, token, email: emailValue }),
      resetOnSuccess: ["password", "passwordConfirmation"],
      children: ({ processing, errors }) => /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: messages.t("splicewire-beam-inertia::messages.auth_email") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              name: "email",
              autoComplete: "email",
              value: emailValue,
              className: "mt-1 block w-full",
              readOnly: true
            }
          ),
          /* @__PURE__ */ jsx(
            InputError,
            {
              message: errors.email,
              className: "mt-2"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: messages.t("splicewire-beam-inertia::messages.auth_password") }),
          /* @__PURE__ */ jsx(
            PasswordInput,
            {
              id: "password",
              name: "password",
              autoComplete: "new-password",
              className: "mt-1 block w-full",
              autoFocus: true,
              placeholder: messages.t("splicewire-beam-inertia::messages.auth_password"),
              passwordrules: passwordRules
            }
          ),
          /* @__PURE__ */ jsx(InputError, { message: errors.password })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "passwordConfirmation", children: messages.t("splicewire-beam-inertia::messages.auth_confirm_password") }),
          /* @__PURE__ */ jsx(
            PasswordInput,
            {
              id: "passwordConfirmation",
              name: "passwordConfirmation",
              autoComplete: "new-password",
              className: "mt-1 block w-full",
              placeholder: messages.t("splicewire-beam-inertia::messages.auth_confirm_password"),
              passwordrules: passwordRules
            }
          ),
          /* @__PURE__ */ jsx(
            InputError,
            {
              message: errors.passwordConfirmation,
              className: "mt-2"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "submit",
            className: "mt-4 w-full",
            disabled: processing,
            "data-test": "reset-password-button",
            children: [
              processing && /* @__PURE__ */ jsx(Spinner, {}),
              messages.t("splicewire-beam-inertia::messages.auth_reset_password")
            ]
          }
        )
      ] })
    }
  ) });
}
export {
  ResetPassword as default
};
//# sourceMappingURL=reset-password-PHEA6RLX.js.map