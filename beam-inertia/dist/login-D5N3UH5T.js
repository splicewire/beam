import {
  deferPasswordLoginForTwoFactor,
  isTwoFactorChallengeUrl,
  reportAuthenticatedLogin,
  startPasswordLogin
} from "./chunk-KI2Z2TJA.js";
import {
  TextLink
} from "./chunk-ZHEDQPJW.js";
import "./chunk-DF6P7HIA.js";
import {
  RichMessage
} from "./chunk-3GD6IGMJ.js";
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
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/auth/login.tsx
import { DemoLogin } from "@splicewire/beam-accounts";
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
  const messages = useBeamMessages();
  const {
    status,
    canResetPassword,
    canRegister,
    demoAccounts = [],
    demoUserSearchUrl
  } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    featureEnabled("passkeys") && /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsx2(PasskeyVerify, { onAuthenticated: () => reportAuthenticatedLogin("passkey") }) }),
    /* @__PURE__ */ jsx2(
      Form,
      {
        action: "/login",
        method: "post",
        onStart: startPasswordLogin,
        onSuccess: ({ url }) => {
          if (isTwoFactorChallengeUrl(url)) {
            deferPasswordLoginForTwoFactor();
          } else {
            reportAuthenticatedLogin("password");
          }
        },
        resetOnSuccess: ["password"],
        className: "flex flex-col gap-6",
        children: ({ processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx2(Label, { htmlFor: "email", children: messages.t("splicewire-beam-inertia::messages.auth_email_address") }),
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
                  placeholder: messages.t("splicewire-beam-inertia::messages.auth_email_example_com_lowercase")
                }
              ),
              /* @__PURE__ */ jsx2(InputError, { message: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1", children: [
                /* @__PURE__ */ jsx2(Label, { htmlFor: "password", children: messages.t("splicewire-beam-inertia::messages.auth_password") }),
                canResetPassword && /* @__PURE__ */ jsx2(
                  TextLink,
                  {
                    href: "/forgot-password",
                    className: "ml-auto whitespace-nowrap text-sm",
                    tabIndex: 5,
                    children: messages.t("splicewire-beam-inertia::messages.auth_forgot_your_password")
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
                  placeholder: messages.t("splicewire-beam-inertia::messages.auth_password")
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
              /* @__PURE__ */ jsx2(Label, { htmlFor: "remember", children: messages.t("splicewire-beam-inertia::messages.auth_remember_me") })
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
                  messages.t("splicewire-beam-inertia::messages.auth_log_in")
                ]
              }
            )
          ] }),
          canRegister && /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsx2("div", { className: "text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx2(RichMessage, { text: messages.t("splicewire-beam-inertia::messages.auth_register_prompt", { action: "\uFFFC0\uFFFC" }), parts: [/* @__PURE__ */ jsx2(TextLink, { href: "/register", tabIndex: 5, children: messages.t("splicewire-beam-inertia::messages.auth_sign_up") })] }) }) })
        ] })
      }
    ),
    status && /* @__PURE__ */ jsx2("div", { className: "mb-4 text-center text-sm font-medium text-primary", children: status }),
    /* @__PURE__ */ jsx2(DemoLogin, { className: "mt-8", accounts: demoAccounts, searchUrl: demoUserSearchUrl })
  ] });
}
export {
  Login as default
};
//# sourceMappingURL=login-D5N3UH5T.js.map