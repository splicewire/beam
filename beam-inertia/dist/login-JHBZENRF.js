import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
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
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/pages/auth/login.tsx
import { Form, usePage } from "@inertiajs/react";

// src/components/ui/checkbox.tsx
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { jsx } from "react/jsx-runtime";
function Checkbox({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    CheckboxPrimitive.Root,
    {
      "data-slot": "checkbox",
      className: cn(
        "peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        CheckboxPrimitive.Indicator,
        {
          "data-slot": "checkbox-indicator",
          className: "flex items-center justify-center text-current transition-none",
          children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-3.5" })
        }
      )
    }
  );
}

// src/pages/auth/login.tsx
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function Login() {
  const {
    status,
    canResetPassword,
    canRegister,
    demoAccounts = []
  } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    featureEnabled("passkeys") && /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsx2(PasskeyVerify, {}) }),
    /* @__PURE__ */ jsx2(
      Form,
      {
        action: "/login",
        method: "post",
        resetOnSuccess: ["password"],
        className: "flex flex-col gap-6",
        children: ({ processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx2(Label, { htmlFor: "email", children: "Email address" }),
              /* @__PURE__ */ jsx2(
                Input,
                {
                  id: "email",
                  type: "email",
                  name: "email",
                  required: true,
                  autoFocus: true,
                  tabIndex: 1,
                  autoComplete: "email",
                  placeholder: "email@example.com"
                }
              ),
              /* @__PURE__ */ jsx2(InputError, { message: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1", children: [
                /* @__PURE__ */ jsx2(Label, { htmlFor: "password", children: "Password" }),
                canResetPassword && /* @__PURE__ */ jsx2(
                  TextLink,
                  {
                    href: "/forgot-password",
                    className: "ml-auto whitespace-nowrap text-sm",
                    tabIndex: 5,
                    children: "Forgot your password?"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx2(
                PasswordInput,
                {
                  id: "password",
                  name: "password",
                  required: true,
                  tabIndex: 2,
                  autoComplete: "current-password",
                  placeholder: "Password"
                }
              ),
              /* @__PURE__ */ jsx2(InputError, { message: errors.password })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx2(
                Checkbox,
                {
                  id: "remember",
                  name: "remember",
                  tabIndex: 3
                }
              ),
              /* @__PURE__ */ jsx2(Label, { htmlFor: "remember", children: "Remember me" })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "submit",
                className: "mt-4 w-full",
                tabIndex: 4,
                disabled: processing,
                "data-test": "login-button",
                children: [
                  processing && /* @__PURE__ */ jsx2(Spinner, {}),
                  "Log in"
                ]
              }
            )
          ] }),
          canRegister && /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-muted-foreground", children: [
            "Don't have an account?",
            " ",
            /* @__PURE__ */ jsx2(TextLink, { href: "/register", tabIndex: 5, children: "Sign up" })
          ] }) })
        ] })
      }
    ),
    status && /* @__PURE__ */ jsx2("div", { className: "mb-4 text-center text-sm font-medium text-primary", children: status }),
    demoAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative text-center text-xs text-muted-foreground uppercase", children: [
        /* @__PURE__ */ jsx2("span", { className: "relative z-10 bg-background px-2", children: "Or try a demo account" }),
        /* @__PURE__ */ jsx2(
          "span",
          {
            className: "absolute inset-x-0 top-1/2 border-t border-border",
            "aria-hidden": true
          }
        )
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "grid gap-2", children: demoAccounts.map((account) => (
        // A signed OOTB login-as link (beam-accounts `account/login-as/{subject}`); a full
        // GET so the server signs you in and redirects. Guarded server-side by Demo::enabled().
        /* @__PURE__ */ jsx2(
          "a",
          {
            href: account.url,
            className: "w-full",
            children: /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                className: "w-full",
                children: [
                  "Sign in as ",
                  account.label
                ]
              }
            )
          },
          account.key
        )
      )) }),
      /* @__PURE__ */ jsx2("p", { className: "text-center text-xs text-muted-foreground", children: "Dev only \u2014 hidden in production." })
    ] })
  ] });
}
export {
  Login as default
};
//# sourceMappingURL=login-JHBZENRF.js.map