import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  OTP_MAX_LENGTH
} from "./chunk-NGPS6BJO.js";
import {
  completePendingLogin
} from "./chunk-KI2Z2TJA.js";
import "./chunk-DF6P7HIA.js";
import {
  RichMessage
} from "./chunk-3GD6IGMJ.js";
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
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/auth/two-factor-challenge.tsx
import { Form, setLayoutProps } from "@inertiajs/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function TwoFactorChallenge() {
  const messages = useBeamMessages();
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [code, setCode] = useState("");
  const authConfigContent = useMemo(() => {
    if (showRecoveryInput) {
      return {
        title: messages.t("splicewire-beam-inertia::messages.auth_recovery_code"),
        description: messages.t("splicewire-beam-inertia::messages.auth_please_confirm_access_to_your_account_by_entering_one_of_your_emergency_recovery_codes"),
        toggleText: messages.t("splicewire-beam-inertia::messages.auth_login_using_an_authentication_code_lowercase")
      };
    }
    return {
      title: messages.t("splicewire-beam-inertia::messages.auth_authentication_code"),
      description: messages.t("splicewire-beam-inertia::messages.auth_enter_the_authentication_code_provided_by_your_authenticator_application"),
      toggleText: messages.t("splicewire-beam-inertia::messages.auth_login_using_a_recovery_code_lowercase")
    };
  }, [showRecoveryInput, messages]);
  setLayoutProps({
    title: authConfigContent.title,
    description: authConfigContent.description
  });
  const toggleRecoveryMode = (clearErrors) => {
    setShowRecoveryInput(!showRecoveryInput);
    clearErrors();
    setCode("");
  };
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx(
    Form,
    {
      action: "/two-factor-challenge",
      method: "post",
      onSuccess: completePendingLogin,
      className: "space-y-4",
      resetOnError: true,
      resetOnSuccess: !showRecoveryInput,
      children: ({ errors, processing, clearErrors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        showRecoveryInput ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              name: "recovery_code",
              type: "text",
              placeholder: messages.t("splicewire-beam-inertia::messages.auth_enter_recovery_code"),
              autoFocus: showRecoveryInput,
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            InputError,
            {
              message: errors.recovery_code
            }
          )
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center space-y-3 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "flex w-full items-center justify-center", children: /* @__PURE__ */ jsx(
            InputOTP,
            {
              name: "code",
              maxLength: OTP_MAX_LENGTH,
              value: code,
              onChange: (value) => setCode(value),
              disabled: processing,
              pattern: REGEXP_ONLY_DIGITS,
              autoFocus: true,
              children: /* @__PURE__ */ jsx(InputOTPGroup, { children: Array.from(
                { length: OTP_MAX_LENGTH },
                (_, index) => /* @__PURE__ */ jsx(
                  InputOTPSlot,
                  {
                    index
                  },
                  index
                )
              ) })
            }
          ) }),
          /* @__PURE__ */ jsx(InputError, { message: errors.code })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full",
            disabled: processing,
            children: messages.t("splicewire-beam-inertia::messages.auth_continue")
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(RichMessage, { wrapText: (text) => /* @__PURE__ */ jsx("span", { children: text }), text: messages.t("splicewire-beam-inertia::messages.auth_recovery_mode_prompt", { action: "\uFFFC0\uFFFC" }), parts: [/* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500",
            onClick: () => toggleRecoveryMode(clearErrors),
            children: authConfigContent.toggleText
          }
        )] }) })
      ] })
    }
  ) }) });
}
export {
  TwoFactorChallenge as default
};
//# sourceMappingURL=two-factor-challenge-U7MY63U7.js.map