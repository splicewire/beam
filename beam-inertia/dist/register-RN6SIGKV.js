import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
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
  InputError
} from "./chunk-UJ2MQHRA.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/auth/register.tsx
import { Form, usePage } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Register() {
  const { passwordRules } = usePage().props;
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Form,
    {
      action: "/register",
      method: "post",
      resetOnSuccess: ["password", "passwordConfirmation"],
      disableWhileProcessing: true,
      className: "flex flex-col gap-6",
      children: ({ processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Name" }),
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
                placeholder: "Full name"
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
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email address" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                required: true,
                tabIndex: 2,
                autoComplete: "email",
                name: "email",
                placeholder: "email@example.com"
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
            /* @__PURE__ */ jsx(
              PasswordInput,
              {
                id: "password",
                required: true,
                tabIndex: 3,
                autoComplete: "new-password",
                name: "password",
                placeholder: "Password",
                passwordrules: passwordRules
              }
            ),
            /* @__PURE__ */ jsx(InputError, { message: errors.password })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "passwordConfirmation", children: "Confirm password" }),
            /* @__PURE__ */ jsx(
              PasswordInput,
              {
                id: "passwordConfirmation",
                required: true,
                tabIndex: 4,
                autoComplete: "new-password",
                name: "passwordConfirmation",
                placeholder: "Confirm password",
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
                "Create account"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-muted-foreground", children: [
          "Already have an account?",
          " ",
          /* @__PURE__ */ jsx(TextLink, { href: "/login", tabIndex: 6, children: "Log in" })
        ] })
      ] })
    }
  ) });
}
export {
  Register as default
};
//# sourceMappingURL=register-RN6SIGKV.js.map