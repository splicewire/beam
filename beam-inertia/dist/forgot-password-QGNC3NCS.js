import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
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

// src/pages/auth/forgot-password.tsx
import { Form, usePage } from "@inertiajs/react";
import { LoaderCircle } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ForgotPassword() {
  const { status } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    status && /* @__PURE__ */ jsx("div", { className: "mb-4 text-center text-sm font-medium text-primary", children: status }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(Form, { action: "/forgot-password", method: "post", children: ({ processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email address" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              name: "email",
              autoComplete: "off",
              autoFocus: true,
              placeholder: "email@example.com"
            }
          ),
          /* @__PURE__ */ jsx(InputError, { message: errors.email })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "my-6 flex items-center justify-start", children: /* @__PURE__ */ jsxs(
          Button,
          {
            className: "w-full",
            disabled: processing,
            "data-test": "email-password-reset-link-button",
            children: [
              processing && /* @__PURE__ */ jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Email password reset link"
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-x-1 text-center text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { children: "Or, return to" }),
        /* @__PURE__ */ jsx(TextLink, { href: "/login", children: "log in" })
      ] })
    ] })
  ] });
}
export {
  ForgotPassword as default
};
//# sourceMappingURL=forgot-password-QGNC3NCS.js.map