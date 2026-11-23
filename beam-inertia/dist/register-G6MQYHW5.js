import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
import "./chunk-DF6P7HIA.js";
import {
  RichMessage
} from "./chunk-3GD6IGMJ.js";
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

// src/pages/auth/register.tsx
import { Form, usePage } from "@inertiajs/react";
import { reportEvent } from "@splicewire/beam-ux/site";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Register() {
  const messages = useBeamMessages();
  const { passwordRules } = usePage().props;
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Form,
    {
      action: "/register",
      method: "post",
      onSuccess: () => reportEvent("sign_up", { method: "password" }),
      resetOnSuccess: ["password", "passwordConfirmation"],
      disableWhileProcessing: true,
      className: "flex flex-col gap-6",
      children: ({ processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: messages.t("splicewire-beam-inertia::messages.auth_name") }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "name",
                type: "text",
                required: true,
                autoFocus: true,
                tabIndex: 1,
                autoComplete: "name",
                name: "name",
                placeholder: messages.t("splicewire-beam-inertia::messages.auth_full_name")
              }
            ),
            /* @__PURE__ */ jsx(
              InputError,
              {
                message: errors.name,
                className: "mt-2"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: messages.t("splicewire-beam-inertia::messages.auth_email_address") }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                required: true,
                tabIndex: 2,
                autoComplete: "email",
                name: "email",
                placeholder: messages.t("splicewire-beam-inertia::messages.auth_email_example_com_lowercase")
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: messages.t("splicewire-beam-inertia::messages.auth_password") }),
            /* @__PURE__ */ jsx(
              PasswordInput,
              {
                id: "password",
                required: true,
                tabIndex: 3,
                autoComplete: "new-password",
                name: "password",
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
                required: true,
                tabIndex: 4,
                autoComplete: "new-password",
                name: "passwordConfirmation",
                placeholder: messages.t("splicewire-beam-inertia::messages.auth_confirm_password"),
                passwordrules: passwordRules
              }
            ),
            /* @__PURE__ */ jsx(
              InputError,
              {
                message: errors.passwordConfirmation
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              className: "mt-2 w-full",
              tabIndex: 5,
              "data-test": "register-user-button",
              children: [
                processing && /* @__PURE__ */ jsx(Spinner, {}),
                messages.t("splicewire-beam-inertia::messages.auth_create_account")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(RichMessage, { text: messages.t("splicewire-beam-inertia::messages.auth_login_prompt", { action: "\uFFFC0\uFFFC" }), parts: [/* @__PURE__ */ jsx(TextLink, { href: "/login", tabIndex: 6, children: messages.t("splicewire-beam-inertia::messages.auth_log_in") })] }) })
      ] })
    }
  ) });
}
export {
  Register as default
};
//# sourceMappingURL=register-G6MQYHW5.js.map