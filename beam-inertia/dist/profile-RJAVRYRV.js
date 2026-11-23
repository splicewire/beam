import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from "./chunk-5A4XHNWR.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
import "./chunk-DF6P7HIA.js";
import {
  RichMessage
} from "./chunk-3GD6IGMJ.js";
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
import "./chunk-GBIJGQ7E.js";
import {
  englishBeamMessages,
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/settings/profile.tsx
import { setLayoutProps } from "@inertiajs/react";
import { Form as Form2, Head, usePage } from "@inertiajs/react";
import { Link } from "@inertiajs/react";

// src/components/delete-user.tsx
import { Form } from "@inertiajs/react";
import { useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function DeleteUser() {
  const messages = useBeamMessages();
  const passwordInput = useRef(null);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      Heading,
      {
        variant: "small",
        title: messages.t("splicewire-beam-inertia::messages.auth_delete_account"),
        description: messages.t("splicewire-beam-inertia::messages.auth_delete_your_account_and_all_of_its_resources")
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative space-y-0.5 text-red-600 dark:text-red-100", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: messages.t("splicewire-beam-inertia::messages.auth_warning") }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: messages.t("splicewire-beam-inertia::messages.auth_please_proceed_with_caution_this_cannot_be_undone") })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            "data-test": "delete-user-button",
            children: messages.t("splicewire-beam-inertia::messages.auth_delete_account")
          }
        ) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: messages.t("splicewire-beam-inertia::messages.auth_are_you_sure_you_want_to_delete_your_account") }),
          /* @__PURE__ */ jsx(DialogDescription, { children: messages.t("splicewire-beam-inertia::messages.auth_once_your_account_is_deleted_all_of_its_resources_and_data_will_also_be_permanently_deleted_please_enter_your") }),
          /* @__PURE__ */ jsx(
            Form,
            {
              action: "/settings/profile",
              method: "delete",
              options: {
                preserveScroll: true
              },
              onError: () => passwordInput.current?.focus(),
              resetOnSuccess: true,
              className: "space-y-6",
              children: ({ resetAndClearErrors, processing, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(
                    Label,
                    {
                      htmlFor: "password",
                      className: "sr-only",
                      children: messages.t("splicewire-beam-inertia::messages.auth_password")
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    PasswordInput,
                    {
                      id: "password",
                      name: "password",
                      ref: passwordInput,
                      placeholder: messages.t("splicewire-beam-inertia::messages.auth_password"),
                      autoComplete: "current-password"
                    }
                  ),
                  /* @__PURE__ */ jsx(InputError, { message: errors.password })
                ] }),
                /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
                  /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "secondary",
                      onClick: () => resetAndClearErrors(),
                      children: messages.t("splicewire-beam-inertia::messages.auth_cancel")
                    }
                  ) }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "destructive",
                      disabled: processing,
                      asChild: true,
                      children: /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "submit",
                          "data-test": "confirm-delete-user-button",
                          children: messages.t("splicewire-beam-inertia::messages.auth_delete_account")
                        }
                      )
                    }
                  )
                ] })
              ] })
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/pages/settings/profile.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function languageName(tag) {
  try {
    return new Intl.DisplayNames([tag], { type: "language" }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}
function Profile({ mustVerifyEmail, status, preferredLocale = null, supportedLocales = [] }) {
  const messages = useBeamMessages();
  setLayoutProps({ breadcrumbs: [{ title: messages.t("splicewire-beam-inertia::messages.auth_profile_settings"), href: { method: "get", url: "/settings/profile" } }] });
  const { auth } = usePage().props;
  return (
    // Sections space themselves: the settings layout's `space-y-12` only reaches a page's
    // direct children when that layout wraps it, so a bare mount put each section's Save
    // flush against the next heading.
    /* @__PURE__ */ jsxs2("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsx2(Head, { title: messages.t("splicewire-beam-inertia::messages.auth_profile_settings") }),
      /* @__PURE__ */ jsx2("h1", { className: "sr-only", children: messages.t("splicewire-beam-inertia::messages.auth_profile_settings") }),
      /* @__PURE__ */ jsxs2("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx2(
          Heading,
          {
            variant: "small",
            title: messages.t("splicewire-beam-inertia::messages.auth_profile"),
            description: messages.t("splicewire-beam-inertia::messages.auth_update_your_name_and_email_address")
          }
        ),
        /* @__PURE__ */ jsx2(
          Form2,
          {
            action: "/settings/profile",
            method: "patch",
            options: {
              preserveScroll: true
            },
            className: "space-y-6",
            children: ({ processing, errors }) => /* @__PURE__ */ jsxs2(Fragment2, { children: [
              /* @__PURE__ */ jsxs2("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx2(Label, { htmlFor: "name", children: messages.t("splicewire-beam-inertia::messages.auth_name") }),
                /* @__PURE__ */ jsx2(
                  Input,
                  {
                    id: "name",
                    className: "mt-1 block w-full",
                    defaultValue: auth.user.name,
                    name: "name",
                    required: true,
                    autoComplete: "name",
                    placeholder: messages.t("splicewire-beam-inertia::messages.auth_full_name")
                  }
                ),
                /* @__PURE__ */ jsx2(
                  InputError,
                  {
                    className: "mt-2",
                    message: errors.name
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs2("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx2(Label, { htmlFor: "email", children: messages.t("splicewire-beam-inertia::messages.auth_email_address") }),
                /* @__PURE__ */ jsx2(
                  Input,
                  {
                    id: "email",
                    type: "email",
                    className: "mt-1 block w-full",
                    defaultValue: auth.user.email,
                    name: "email",
                    required: true,
                    autoComplete: "username",
                    placeholder: messages.t("splicewire-beam-inertia::messages.auth_email_address")
                  }
                ),
                /* @__PURE__ */ jsx2(
                  InputError,
                  {
                    className: "mt-2",
                    message: errors.email
                  }
                )
              ] }),
              supportedLocales.length > 0 && /* @__PURE__ */ jsxs2("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx2(Label, { htmlFor: "preferredLocale", children: messages.t("splicewire-beam-inertia::messages.auth_language") }),
                /* @__PURE__ */ jsxs2(
                  "select",
                  {
                    id: "preferredLocale",
                    name: "preferredLocale",
                    defaultValue: preferredLocale ?? "",
                    className: "mt-1 block h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
                    children: [
                      /* @__PURE__ */ jsx2("option", { value: "", children: messages.t("splicewire-beam-inertia::messages.auth_automatic") }),
                      supportedLocales.map((tag) => /* @__PURE__ */ jsx2("option", { value: tag, lang: tag, children: languageName(tag) }, tag))
                    ]
                  }
                ),
                /* @__PURE__ */ jsx2(
                  InputError,
                  {
                    className: "mt-2",
                    message: errors.preferredLocale
                  }
                )
              ] }),
              featureEnabled("email-verification") && /* @__PURE__ */ jsx2(Fragment2, { children: mustVerifyEmail && auth.user.email_verified_at === null && /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx2("p", { className: "-mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsx2(RichMessage, { text: messages.t("splicewire-beam-inertia::messages.auth_unverified_email_prompt", { action: "\uFFFC0\uFFFC" }), parts: [/* @__PURE__ */ jsx2(
                  Link,
                  {
                    href: "/email/verification-notification",
                    method: "post",
                    as: "button",
                    className: "text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500",
                    children: messages.t("splicewire-beam-inertia::messages.auth_click_here_to_re_send_the_verification_email")
                  }
                )] }) }),
                status === "verification-link-sent" && /* @__PURE__ */ jsx2("div", { className: "mt-2 text-sm font-medium text-primary", children: messages.t("splicewire-beam-inertia::messages.auth_a_new_verification_link_has_been_sent_to_your_email_address") })
              ] }) }),
              /* @__PURE__ */ jsx2("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsx2(
                Button,
                {
                  disabled: processing,
                  "data-test": "update-profile-button",
                  children: messages.t("splicewire-beam-inertia::messages.auth_save")
                }
              ) })
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx2(DeleteUser, {})
    ] })
  );
}
Profile.layout = {
  breadcrumbs: [
    {
      title: englishBeamMessages.t("splicewire-beam-inertia::messages.auth_profile_settings"),
      href: { method: "get", url: "/settings/profile" }
    }
  ]
};
export {
  Profile as default,
  languageName
};
//# sourceMappingURL=profile-RJAVRYRV.js.map