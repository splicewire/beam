import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  OTP_MAX_LENGTH,
  useTwoFactorAuth
} from "./chunk-HEH5BX7D.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./chunk-5A4XHNWR.js";
import {
  useAppearance
} from "./chunk-6C5PVJOV.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
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
  featureEnabled
} from "./chunk-PGZP7A2Q.js";
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
  englishBeamMessages,
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/settings/security.tsx
import { setLayoutProps } from "@inertiajs/react";
import { Form as Form4, Head } from "@inertiajs/react";
import { useRef as useRef4 } from "react";

// src/components/manage-passkeys.tsx
import { router } from "@inertiajs/react";
import { KeyRound as KeyRound2 } from "lucide-react";

// src/components/passkey-item.tsx
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function PasskeyItem({ passkey, onDelete }) {
  const messages = useBeamMessages();
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(passkey.id, () => setIsDeleting(false));
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b p-4 last:border-b-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted", children: /* @__PURE__ */ jsx(KeyRound, { className: "h-5 w-5 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium tracking-tight", children: passkey.name }),
          passkey.authenticator && /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase ring-1 ring-border ring-inset", children: passkey.authenticator })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          messages.t("splicewire-beam-inertia::messages.auth_passkey_added", { date: passkey.createdAtDiff ?? "" }),
          passkey.lastUsedAtDiff && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "mx-1 text-muted-foreground/50", children: "/" }),
            messages.t("splicewire-beam-inertia::messages.auth_passkey_last_used", { date: passkey.lastUsedAtDiff })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Dialog, { children: [
      /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "text-destructive hover:bg-destructive/10 hover:text-destructive",
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: messages.t("splicewire-beam-inertia::messages.auth_remove") })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: messages.t("splicewire-beam-inertia::messages.auth_remove_passkey") }),
        /* @__PURE__ */ jsx(DialogDescription, { children: messages.t("splicewire-beam-inertia::messages.auth_passkey_remove_confirmation", { name: passkey.name }) }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
          /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "secondary", children: messages.t("splicewire-beam-inertia::messages.auth_cancel") }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "destructive",
              onClick: handleDelete,
              disabled: isDeleting,
              children: isDeleting ? messages.t("splicewire-beam-inertia::messages.auth_removing") : messages.t("splicewire-beam-inertia::messages.auth_remove_passkey")
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/components/passkey-register.tsx
import { usePasskeyRegister } from "@laravel/passkeys/react";
import { useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function PasskeyRegistration({ onSuccess }) {
  const messages = useBeamMessages();
  const [name, setName] = useState2(() => {
    const ua = navigator.userAgent;
    const browser = [
      { pattern: /Edg|Edge/, name: "Edge" },
      { pattern: /OPR|Opera|OPiOS/, name: "Opera" },
      { pattern: /Firefox|FxiOS/, name: "Firefox" },
      { pattern: /Chrome|CriOS/, name: "Chrome" },
      { pattern: /Safari/, name: "Safari" }
    ].find(({ pattern }) => pattern.test(ua))?.name;
    const os = [
      { pattern: /iPhone/, name: "iPhone" },
      { pattern: /iPad|Macintosh(?=.*Mobile)/, name: "iPad" },
      { pattern: /Android/, name: "Android" },
      { pattern: /Mac/, name: "Mac" },
      { pattern: /Windows/, name: "Windows" }
    ].find(({ pattern }) => pattern.test(ua))?.name;
    return browser && os ? messages.t("splicewire-beam-inertia::messages.auth_passkey_device_name", { browser, os }) : browser ?? os ?? "";
  });
  const [showForm, setShowForm] = useState2(false);
  const { register, isLoading, error, isSupported } = usePasskeyRegister({
    onSuccess: () => {
      setName("");
      setShowForm(false);
      onSuccess();
    }
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    await register(name);
  };
  const handleCancel = () => {
    setShowForm(false);
    setName("");
  };
  if (!isSupported) {
    return /* @__PURE__ */ jsx2("div", { className: "text-sm text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.auth_passkeys_are_not_supported_in_this_browser") });
  }
  if (!showForm) {
    return /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: () => setShowForm(true), children: messages.t("splicewire-beam-inertia::messages.auth_add_passkey") });
  }
  return /* @__PURE__ */ jsxs2(
    "form",
    {
      onSubmit: handleSubmit,
      className: "space-y-4 rounded-lg border border-border bg-muted/50 p-4",
      children: [
        /* @__PURE__ */ jsxs2("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "passkey-name", children: messages.t("splicewire-beam-inertia::messages.auth_passkey_name") }),
          /* @__PURE__ */ jsx2(
            Input,
            {
              id: "passkey-name",
              type: "text",
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: messages.t("splicewire-beam-inertia::messages.auth_e_g_macbook_pro_iphone_lowercase"),
              className: "mt-1 block w-full border-foreground/20",
              autoFocus: true
            }
          ),
          /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.auth_a_name_helps_you_identify_this_passkey_later") })
        ] }),
        error && /* @__PURE__ */ jsx2(InputError, { message: error }),
        /* @__PURE__ */ jsxs2("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx2(Button, { type: "submit", disabled: isLoading || !name.trim(), children: isLoading ? messages.t("splicewire-beam-inertia::messages.auth_registering") : messages.t("splicewire-beam-inertia::messages.auth_register_passkey") }),
          /* @__PURE__ */ jsx2(Button, { type: "button", variant: "ghost", onClick: handleCancel, children: messages.t("splicewire-beam-inertia::messages.auth_cancel") })
        ] })
      ]
    }
  );
}

// src/components/manage-passkeys.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var EmptyState = () => {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsxs3("div", { className: "p-8 text-center", children: [
    /* @__PURE__ */ jsx3("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted", children: /* @__PURE__ */ jsx3(KeyRound2, { className: "h-7 w-7 text-muted-foreground" }) }),
    /* @__PURE__ */ jsx3("p", { className: "font-medium", children: messages.t("splicewire-beam-inertia::messages.auth_no_passkeys_yet") }),
    /* @__PURE__ */ jsx3("p", { className: "mt-1 text-sm text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.auth_add_a_passkey_to_sign_in_without_a_password") })
  ] });
};
function ManagePasskeys(props) {
  const messages = useBeamMessages();
  const passkeys = props.passkeys ?? [];
  const handleDelete = (id, onError) => {
    router.delete(`/user/passkeys/${id}`, {
      preserveScroll: true,
      onError
    });
  };
  const handleRegisterSuccess = () => {
    router.reload();
  };
  if (!(props.canManagePasskeys ?? false)) {
    return null;
  }
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx3(
      Heading,
      {
        variant: "small",
        title: messages.t("splicewire-beam-inertia::messages.auth_passkeys"),
        description: messages.t("splicewire-beam-inertia::messages.auth_manage_your_passkeys_for_passwordless_sign_in")
      }
    ),
    /* @__PURE__ */ jsx3("div", { className: "overflow-hidden rounded-lg border border-border", children: passkeys.length > 0 ? passkeys.map((passkey) => /* @__PURE__ */ jsx3(
      PasskeyItem,
      {
        passkey,
        onDelete: handleDelete
      },
      passkey.id
    )) : /* @__PURE__ */ jsx3(EmptyState, {}) }),
    /* @__PURE__ */ jsx3(PasskeyRegistration, { onSuccess: handleRegisterSuccess })
  ] });
}

// src/components/manage-two-factor.tsx
import { Form as Form3 } from "@inertiajs/react";
import { ShieldCheck } from "lucide-react";
import { useEffect as useEffect3, useRef as useRef3, useState as useState6 } from "react";

// src/components/two-factor-recovery-codes.tsx
import { Form } from "@inertiajs/react";
import { Eye, EyeOff, LockKeyhole, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState as useState3 } from "react";

// src/components/alert-error.tsx
import { AlertCircleIcon } from "lucide-react";

// src/components/ui/alert.tsx
import { cva } from "class-variance-authority";
import { jsx as jsx4 } from "react/jsx-runtime";
var alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "text-destructive-foreground [&>svg]:text-current *:data-[slot=alert-description]:text-destructive-foreground/80"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Alert({
  className,
  variant,
  ...props
}) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "alert",
      role: "alert",
      className: cn(alertVariants({ variant }), className),
      ...props
    }
  );
}
function AlertTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "alert-title",
      className: cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      ),
      ...props
    }
  );
}
function AlertDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "alert-description",
      className: cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      ),
      ...props
    }
  );
}

// src/components/alert-error.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function AlertError({
  errors,
  title
}) {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsxs4(Alert, { variant: "destructive", children: [
    /* @__PURE__ */ jsx5(AlertCircleIcon, {}),
    /* @__PURE__ */ jsx5(AlertTitle, { children: title || messages.t("splicewire-beam-inertia::messages.chrome_unexpected_error") }),
    /* @__PURE__ */ jsx5(AlertDescription, { children: /* @__PURE__ */ jsx5("ul", { className: "list-inside list-disc text-sm", children: Array.from(new Set(errors)).map((error, index) => /* @__PURE__ */ jsx5("li", { children: error }, index)) }) })
  ] });
}

// src/components/ui/card.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-header",
      className: cn("flex flex-col gap-1.5 px-6", className),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}

// src/components/two-factor-recovery-codes.tsx
import { Fragment as Fragment2, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function TwoFactorRecoveryCodes({
  recoveryCodesList,
  fetchRecoveryCodes,
  errors
}) {
  const messages = useBeamMessages();
  const [codesAreVisible, setCodesAreVisible] = useState3(false);
  const codesSectionRef = useRef(null);
  const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;
  const toggleCodesVisibility = useCallback(async () => {
    if (!codesAreVisible && !recoveryCodesList.length) {
      await fetchRecoveryCodes();
    }
    setCodesAreVisible(!codesAreVisible);
    if (!codesAreVisible) {
      setTimeout(() => {
        codesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      });
    }
  }, [codesAreVisible, recoveryCodesList.length, fetchRecoveryCodes]);
  useEffect(() => {
    if (!recoveryCodesList.length) {
      fetchRecoveryCodes();
    }
  }, [recoveryCodesList.length, fetchRecoveryCodes]);
  const RecoveryCodeIconComponent = codesAreVisible ? EyeOff : Eye;
  return /* @__PURE__ */ jsxs5(Card, { children: [
    /* @__PURE__ */ jsxs5(CardHeader, { children: [
      /* @__PURE__ */ jsxs5(CardTitle, { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx7(LockKeyhole, { className: "size-4", "aria-hidden": "true" }),
        messages.t("splicewire-beam-inertia::messages.auth_2fa_recovery_codes")
      ] }),
      /* @__PURE__ */ jsx7(CardDescription, { children: messages.t("splicewire-beam-inertia::messages.auth_recovery_codes_let_you_regain_access_if_you_lose_your_2fa_device_store_them_in_a_secure_password_manager") })
    ] }),
    /* @__PURE__ */ jsxs5(CardContent, { children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex flex-col gap-3 select-none sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs5(
          Button,
          {
            onClick: toggleCodesVisibility,
            className: "w-fit",
            "aria-expanded": codesAreVisible,
            "aria-controls": "recovery-codes-section",
            children: [
              /* @__PURE__ */ jsx7(
                RecoveryCodeIconComponent,
                {
                  className: "size-4",
                  "aria-hidden": "true"
                }
              ),
              codesAreVisible ? messages.t("splicewire-beam-inertia::messages.auth_hide_recovery_codes") : messages.t("splicewire-beam-inertia::messages.auth_view_recovery_codes")
            ]
          }
        ),
        canRegenerateCodes && /* @__PURE__ */ jsx7(
          Form,
          {
            action: "/user/two-factor-recovery-codes",
            method: "post",
            options: { preserveScroll: true },
            onSuccess: fetchRecoveryCodes,
            children: ({ processing }) => /* @__PURE__ */ jsxs5(
              Button,
              {
                variant: "secondary",
                type: "submit",
                disabled: processing,
                "aria-describedby": "regenerate-warning",
                children: [
                  /* @__PURE__ */ jsx7(RefreshCw, {}),
                  " ",
                  messages.t("splicewire-beam-inertia::messages.auth_regenerate_codes")
                ]
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsx7(
        "div",
        {
          id: "recovery-codes-section",
          className: `relative overflow-hidden transition-all duration-300 ${codesAreVisible ? "h-auto opacity-100" : "h-0 opacity-0"}`,
          "aria-hidden": !codesAreVisible,
          children: /* @__PURE__ */ jsx7("div", { className: "mt-3 space-y-3", children: errors?.length ? /* @__PURE__ */ jsx7(AlertError, { errors }) : /* @__PURE__ */ jsxs5(Fragment2, { children: [
            /* @__PURE__ */ jsx7(
              "div",
              {
                ref: codesSectionRef,
                className: "grid gap-1 rounded-lg bg-muted p-4 font-mono text-sm",
                role: "list",
                "aria-label": messages.t("splicewire-beam-inertia::messages.auth_recovery_codes"),
                children: recoveryCodesList.length ? recoveryCodesList.map((code, index) => /* @__PURE__ */ jsx7(
                  "div",
                  {
                    role: "listitem",
                    className: "select-text",
                    children: code
                  },
                  index
                )) : /* @__PURE__ */ jsx7(
                  "div",
                  {
                    className: "space-y-2",
                    "aria-label": messages.t("splicewire-beam-inertia::messages.auth_loading_recovery_codes"),
                    children: Array.from(
                      { length: 8 },
                      (_, index) => /* @__PURE__ */ jsx7(
                        "div",
                        {
                          className: "h-4 animate-pulse rounded bg-muted-foreground/20",
                          "aria-hidden": "true"
                        },
                        index
                      )
                    )
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground select-none", children: /* @__PURE__ */ jsx7("p", { id: "regenerate-warning", children: /* @__PURE__ */ jsx7(RichMessage, { text: messages.t("splicewire-beam-inertia::messages.auth_recovery_codes_warning", { action: "\uFFFC0\uFFFC" }), parts: [/* @__PURE__ */ jsx7("span", { className: "font-bold", children: messages.t("splicewire-beam-inertia::messages.auth_regenerate_codes") })] }) }) })
          ] }) })
        }
      )
    ] })
  ] });
}

// src/components/two-factor-setup-modal.tsx
import { Form as Form2 } from "@inertiajs/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Check, Copy, ScanLine } from "lucide-react";
import { useCallback as useCallback2, useEffect as useEffect2, useMemo, useRef as useRef2, useState as useState5 } from "react";

// src/hooks/use-clipboard.ts
import { useState as useState4 } from "react";
function useClipboard() {
  const [copiedText, setCopiedText] = useState4(null);
  const copy = async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  };
  return [copiedText, copy];
}

// src/components/two-factor-setup-modal.tsx
import { Fragment as Fragment3, jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function GridScanIcon() {
  return /* @__PURE__ */ jsx8("div", { className: "mb-3 rounded-full border border-border bg-card p-0.5 shadow-sm", children: /* @__PURE__ */ jsxs6("div", { className: "relative overflow-hidden rounded-full border border-border bg-muted p-2.5", children: [
    /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 grid grid-cols-5 opacity-50", children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsx8(
      "div",
      {
        className: "border-r border-border last:border-r-0"
      },
      `col-${i + 1}`
    )) }),
    /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 grid grid-rows-5 opacity-50", children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsx8(
      "div",
      {
        className: "border-b border-border last:border-b-0"
      },
      `row-${i + 1}`
    )) }),
    /* @__PURE__ */ jsx8(ScanLine, { className: "relative z-20 size-6 text-foreground" })
  ] }) });
}
function TwoFactorSetupStep({
  qrCodeSvg,
  manualSetupKey,
  buttonText,
  onNextStep,
  errors
}) {
  const messages = useBeamMessages();
  const { resolvedAppearance } = useAppearance();
  const [copiedText, copy] = useClipboard();
  const IconComponent = copiedText === manualSetupKey ? Check : Copy;
  return /* @__PURE__ */ jsx8(Fragment3, { children: errors?.length ? /* @__PURE__ */ jsx8(AlertError, { errors }) : /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx8("div", { className: "mx-auto flex max-w-md overflow-hidden", children: /* @__PURE__ */ jsx8("div", { className: "mx-auto aspect-square w-64 rounded-lg border border-border", children: /* @__PURE__ */ jsx8("div", { className: "z-10 flex h-full w-full items-center justify-center p-5", children: qrCodeSvg ? /* @__PURE__ */ jsx8(
      "div",
      {
        className: "aspect-square w-full rounded-lg bg-white p-2 [&_svg]:size-full",
        dangerouslySetInnerHTML: {
          __html: qrCodeSvg
        },
        style: {
          filter: resolvedAppearance === "dark" ? "invert(1) brightness(1.5)" : void 0
        }
      }
    ) : /* @__PURE__ */ jsx8(Spinner, {}) }) }) }),
    /* @__PURE__ */ jsx8("div", { className: "flex w-full space-x-5", children: /* @__PURE__ */ jsx8(Button, { className: "w-full", onClick: onNextStep, children: buttonText }) }),
    /* @__PURE__ */ jsxs6("div", { className: "relative flex w-full items-center justify-center", children: [
      /* @__PURE__ */ jsx8("div", { className: "absolute inset-0 top-1/2 h-px w-full bg-border" }),
      /* @__PURE__ */ jsx8("span", { className: "relative bg-card px-2 py-1", children: messages.t("splicewire-beam-inertia::messages.auth_or_enter_the_code_manually_lowercase") })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "flex w-full space-x-2", children: /* @__PURE__ */ jsx8("div", { className: "flex w-full items-stretch overflow-hidden rounded-xl border border-border", children: !manualSetupKey ? /* @__PURE__ */ jsx8("div", { className: "flex h-full w-full items-center justify-center bg-muted p-3", children: /* @__PURE__ */ jsx8(Spinner, {}) }) : /* @__PURE__ */ jsxs6(Fragment3, { children: [
      /* @__PURE__ */ jsx8(
        "input",
        {
          type: "text",
          readOnly: true,
          value: manualSetupKey,
          className: "h-full w-full bg-background p-3 text-foreground outline-none"
        }
      ),
      /* @__PURE__ */ jsx8(
        "button",
        {
          onClick: () => copy(manualSetupKey),
          className: "border-l border-border px-3 hover:bg-muted",
          children: /* @__PURE__ */ jsx8(IconComponent, { className: "w-4" })
        }
      )
    ] }) }) })
  ] }) });
}
function TwoFactorVerificationStep({
  onClose,
  onBack
}) {
  const messages = useBeamMessages();
  const [code, setCode] = useState5("");
  const pinInputContainerRef = useRef2(null);
  useEffect2(() => {
    setTimeout(() => {
      pinInputContainerRef.current?.querySelector("input")?.focus();
    }, 0);
  }, []);
  return /* @__PURE__ */ jsx8(
    Form2,
    {
      action: "/user/confirmed-two-factor-authentication",
      method: "post",
      onSuccess: () => onClose(),
      resetOnError: true,
      resetOnSuccess: true,
      children: ({
        processing,
        errors
      }) => /* @__PURE__ */ jsx8(Fragment3, { children: /* @__PURE__ */ jsxs6(
        "div",
        {
          ref: pinInputContainerRef,
          className: "relative w-full space-y-3",
          children: [
            /* @__PURE__ */ jsxs6("div", { className: "flex w-full flex-col items-center space-y-3 py-2", children: [
              /* @__PURE__ */ jsx8(
                InputOTP,
                {
                  id: "otp",
                  name: "code",
                  maxLength: OTP_MAX_LENGTH,
                  onChange: setCode,
                  disabled: processing,
                  pattern: REGEXP_ONLY_DIGITS,
                  autoFocus: true,
                  children: /* @__PURE__ */ jsx8(InputOTPGroup, { children: Array.from(
                    { length: OTP_MAX_LENGTH },
                    (_, index) => /* @__PURE__ */ jsx8(
                      InputOTPSlot,
                      {
                        index
                      },
                      index
                    )
                  ) })
                }
              ),
              /* @__PURE__ */ jsx8(
                InputError,
                {
                  message: errors?.confirmTwoFactorAuthentication?.code
                }
              )
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "flex w-full space-x-5", children: [
              /* @__PURE__ */ jsx8(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  className: "flex-1",
                  onClick: onBack,
                  disabled: processing,
                  children: messages.t("splicewire-beam-inertia::messages.auth_back")
                }
              ),
              /* @__PURE__ */ jsx8(
                Button,
                {
                  type: "submit",
                  className: "flex-1",
                  disabled: processing || code.length < OTP_MAX_LENGTH,
                  children: messages.t("splicewire-beam-inertia::messages.auth_confirm")
                }
              )
            ] })
          ]
        }
      ) })
    }
  );
}
function TwoFactorSetupModal({
  isOpen,
  onClose,
  requiresConfirmation,
  twoFactorEnabled,
  qrCodeSvg,
  manualSetupKey,
  clearSetupData,
  fetchSetupData,
  errors
}) {
  const messages = useBeamMessages();
  const [showVerificationStep, setShowVerificationStep] = useState5(false);
  const modalConfig = useMemo(() => {
    if (twoFactorEnabled) {
      return {
        title: messages.t("splicewire-beam-inertia::messages.auth_two_factor_authentication_enabled"),
        description: messages.t("splicewire-beam-inertia::messages.auth_two_factor_authentication_is_now_enabled_scan_the_qr_code_or_enter_the_setup_key_in_your_authenticator_app"),
        buttonText: messages.t("splicewire-beam-inertia::messages.auth_close")
      };
    }
    if (showVerificationStep) {
      return {
        title: messages.t("splicewire-beam-inertia::messages.auth_verify_authentication_code"),
        description: messages.t("splicewire-beam-inertia::messages.auth_enter_the_6_digit_code_from_your_authenticator_app"),
        buttonText: messages.t("splicewire-beam-inertia::messages.auth_continue")
      };
    }
    return {
      title: messages.t("splicewire-beam-inertia::messages.auth_enable_two_factor_authentication"),
      description: messages.t("splicewire-beam-inertia::messages.auth_to_finish_enabling_two_factor_authentication_scan_the_qr_code_or_enter_the_setup_key_in_your_authenticator_app"),
      buttonText: messages.t("splicewire-beam-inertia::messages.auth_continue")
    };
  }, [twoFactorEnabled, showVerificationStep, messages]);
  const resetModalState = useCallback2(() => {
    if (twoFactorEnabled) {
      clearSetupData();
    }
    setShowVerificationStep(false);
  }, [clearSetupData, twoFactorEnabled]);
  const handleClose = useCallback2(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);
  const handleModalNextStep = useCallback2(() => {
    if (requiresConfirmation) {
      setShowVerificationStep(true);
      return;
    }
    clearSetupData();
    handleClose();
  }, [requiresConfirmation, clearSetupData, handleClose]);
  const fetchSetupDataRef = useRef2(fetchSetupData);
  useEffect2(() => {
    fetchSetupDataRef.current = fetchSetupData;
  }, [fetchSetupData]);
  useEffect2(() => {
    if (isOpen && !qrCodeSvg) {
      fetchSetupDataRef.current();
    }
  }, [isOpen, qrCodeSvg]);
  return /* @__PURE__ */ jsx8(Dialog, { open: isOpen, onOpenChange: (open) => !open && handleClose(), children: /* @__PURE__ */ jsxs6(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs6(DialogHeader, { className: "flex items-center justify-center", children: [
      /* @__PURE__ */ jsx8(GridScanIcon, {}),
      /* @__PURE__ */ jsx8(DialogTitle, { children: modalConfig.title }),
      /* @__PURE__ */ jsx8(DialogDescription, { className: "text-center", children: modalConfig.description })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "flex flex-col items-center space-y-5", children: showVerificationStep ? /* @__PURE__ */ jsx8(
      TwoFactorVerificationStep,
      {
        onClose: handleClose,
        onBack: () => setShowVerificationStep(false)
      }
    ) : /* @__PURE__ */ jsx8(
      TwoFactorSetupStep,
      {
        qrCodeSvg,
        manualSetupKey,
        buttonText: modalConfig.buttonText,
        onNextStep: handleModalNextStep,
        errors
      }
    ) })
  ] }) });
}

// src/components/manage-two-factor.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function ManageTwoFactor(props) {
  const messages = useBeamMessages();
  const requiresConfirmation = props.requiresConfirmation ?? false;
  const twoFactorEnabled = props.twoFactorEnabled ?? false;
  const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    clearTwoFactorAuthData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors
  } = useTwoFactorAuth();
  const [showSetupModal, setShowSetupModal] = useState6(false);
  const prevTwoFactorEnabled = useRef3(twoFactorEnabled);
  useEffect3(() => {
    if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
      clearTwoFactorAuthData();
    }
    prevTwoFactorEnabled.current = twoFactorEnabled;
  }, [twoFactorEnabled, clearTwoFactorAuthData]);
  if (!(props.canManageTwoFactor ?? false)) {
    return null;
  }
  return /* @__PURE__ */ jsxs7("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx9(
      Heading,
      {
        variant: "small",
        title: messages.t("splicewire-beam-inertia::messages.auth_two_factor_authentication"),
        description: messages.t("splicewire-beam-inertia::messages.auth_manage_your_two_factor_authentication_settings")
      }
    ),
    twoFactorEnabled ? /* @__PURE__ */ jsxs7("div", { className: "flex flex-col items-start justify-start space-y-4", children: [
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.auth_you_will_be_prompted_for_a_secure_random_pin_during_login_which_you_can_retrieve_from_the_totp_supported_appli") }),
      /* @__PURE__ */ jsx9("div", { className: "relative inline", children: /* @__PURE__ */ jsx9(
        Form3,
        {
          action: "/user/two-factor-authentication",
          method: "delete",
          children: ({ processing }) => /* @__PURE__ */ jsx9(
            Button,
            {
              variant: "destructive",
              type: "submit",
              disabled: processing,
              children: messages.t("splicewire-beam-inertia::messages.auth_disable_2fa")
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx9(
        TwoFactorRecoveryCodes,
        {
          recoveryCodesList,
          fetchRecoveryCodes,
          errors
        }
      )
    ] }) : /* @__PURE__ */ jsxs7("div", { className: "flex flex-col items-start justify-start space-y-4", children: [
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.auth_when_you_enable_two_factor_authentication_you_will_be_prompted_for_a_secure_pin_during_login_this_pin_can_be_r") }),
      /* @__PURE__ */ jsx9("div", { children: hasSetupData ? /* @__PURE__ */ jsxs7(Button, { onClick: () => setShowSetupModal(true), children: [
        /* @__PURE__ */ jsx9(ShieldCheck, {}),
        messages.t("splicewire-beam-inertia::messages.auth_continue_setup")
      ] }) : /* @__PURE__ */ jsx9(
        Form3,
        {
          action: "/user/two-factor-authentication",
          method: "post",
          onSuccess: () => setShowSetupModal(true),
          children: ({ processing }) => /* @__PURE__ */ jsx9(Button, { type: "submit", disabled: processing, children: messages.t("splicewire-beam-inertia::messages.auth_enable_2fa") })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx9(
      TwoFactorSetupModal,
      {
        isOpen: showSetupModal,
        onClose: () => setShowSetupModal(false),
        requiresConfirmation,
        twoFactorEnabled,
        qrCodeSvg,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        errors
      }
    )
  ] });
}

// src/pages/settings/security.tsx
import { Fragment as Fragment4, jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
function Security(props) {
  const messages = useBeamMessages();
  setLayoutProps({ breadcrumbs: [{ title: messages.t("splicewire-beam-inertia::messages.auth_security_settings"), href: { method: "get", url: "/settings/security" } }] });
  const passwordInput = useRef4(null);
  const currentPasswordInput = useRef4(null);
  return (
    // Sections space themselves: the settings layout's `space-y-12` only reaches a page's
    // direct children when that layout wraps it, so a bare mount put each section's Save
    // flush against the next heading.
    /* @__PURE__ */ jsxs8("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsx10(Head, { title: messages.t("splicewire-beam-inertia::messages.auth_security_settings") }),
      /* @__PURE__ */ jsx10("h1", { className: "sr-only", children: messages.t("splicewire-beam-inertia::messages.auth_security_settings") }),
      /* @__PURE__ */ jsxs8("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx10(
          Heading,
          {
            variant: "small",
            title: messages.t("splicewire-beam-inertia::messages.auth_update_password"),
            description: messages.t("splicewire-beam-inertia::messages.auth_ensure_your_account_is_using_a_long_random_password_to_stay_secure")
          }
        ),
        /* @__PURE__ */ jsx10(
          Form4,
          {
            action: "/settings/password",
            method: "put",
            options: {
              preserveScroll: true
            },
            resetOnError: ["password", "passwordConfirmation", "currentPassword"],
            resetOnSuccess: true,
            onError: (errors) => {
              if (errors.password) {
                passwordInput.current?.focus();
              }
              if (errors.currentPassword) {
                currentPasswordInput.current?.focus();
              }
            },
            className: "space-y-6",
            children: ({ errors, processing }) => /* @__PURE__ */ jsxs8(Fragment4, { children: [
              /* @__PURE__ */ jsxs8("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx10(Label, { htmlFor: "current_password", children: messages.t("splicewire-beam-inertia::messages.auth_current_password") }),
                /* @__PURE__ */ jsx10(
                  PasswordInput,
                  {
                    id: "current_password",
                    ref: currentPasswordInput,
                    name: "currentPassword",
                    className: "mt-1 block w-full",
                    autoComplete: "current-password",
                    placeholder: messages.t("splicewire-beam-inertia::messages.auth_current_password")
                  }
                ),
                /* @__PURE__ */ jsx10(InputError, { message: errors.currentPassword })
              ] }),
              /* @__PURE__ */ jsxs8("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx10(Label, { htmlFor: "password", children: messages.t("splicewire-beam-inertia::messages.auth_new_password") }),
                /* @__PURE__ */ jsx10(
                  PasswordInput,
                  {
                    id: "password",
                    ref: passwordInput,
                    name: "password",
                    className: "mt-1 block w-full",
                    autoComplete: "new-password",
                    placeholder: messages.t("splicewire-beam-inertia::messages.auth_new_password"),
                    passwordrules: props.passwordRules
                  }
                ),
                /* @__PURE__ */ jsx10(InputError, { message: errors.password })
              ] }),
              /* @__PURE__ */ jsxs8("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx10(Label, { htmlFor: "password_confirmation", children: messages.t("splicewire-beam-inertia::messages.auth_confirm_password") }),
                /* @__PURE__ */ jsx10(
                  PasswordInput,
                  {
                    id: "password_confirmation",
                    name: "passwordConfirmation",
                    className: "mt-1 block w-full",
                    autoComplete: "new-password",
                    placeholder: messages.t("splicewire-beam-inertia::messages.auth_confirm_password"),
                    passwordrules: props.passwordRules
                  }
                ),
                /* @__PURE__ */ jsx10(InputError, { message: errors.passwordConfirmation })
              ] }),
              /* @__PURE__ */ jsx10("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsx10(
                Button,
                {
                  disabled: processing,
                  "data-test": "update-password-button",
                  children: messages.t("splicewire-beam-inertia::messages.auth_save")
                }
              ) })
            ] })
          }
        )
      ] }),
      featureEnabled("2fa") && /* @__PURE__ */ jsx10(Fragment4, { children: /* @__PURE__ */ jsx10(
        ManageTwoFactor,
        {
          canManageTwoFactor: props.canManageTwoFactor,
          requiresConfirmation: props.requiresConfirmation,
          twoFactorEnabled: props.twoFactorEnabled
        }
      ) }),
      featureEnabled("passkeys") && /* @__PURE__ */ jsx10(Fragment4, { children: /* @__PURE__ */ jsx10(
        ManagePasskeys,
        {
          canManagePasskeys: props.canManagePasskeys,
          passkeys: props.passkeys
        }
      ) })
    ] })
  );
}
Security.layout = {
  breadcrumbs: [
    {
      title: englishBeamMessages.t("splicewire-beam-inertia::messages.auth_security_settings"),
      href: { method: "get", url: "/settings/security" }
    }
  ]
};
export {
  Security as default
};
//# sourceMappingURL=security-U77OQF3K.js.map