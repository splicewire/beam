import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from "./chunk-FADCRF7N.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
import {
  PasswordInput
} from "./chunk-EFVFQ3JO.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  featureEnabled
} from "./chunk-MTKP2AW3.js";
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

// src/pages/settings/profile.tsx
import { Form as Form2, Head, usePage } from "@inertiajs/react";
import { Link } from "@inertiajs/react";

// src/components/delete-user.tsx
import { Form } from "@inertiajs/react";
import { useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function DeleteUser() {
  const passwordInput = useRef(null);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      Heading,
      {
        variant: "small",
        title: "Delete account",
        description: "Delete your account and all of its resources"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative space-y-0.5 text-red-600 dark:text-red-100", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Warning" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Please proceed with caution, this cannot be undone." })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            "data-test": "delete-user-button",
            children: "Delete account"
          }
        ) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: "Are you sure you want to delete your account?" }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account." }),
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
                      children: "Password"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    PasswordInput,
                    {
                      id: "password",
                      name: "password",
                      ref: passwordInput,
                      placeholder: "Password",
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
                      children: "Cancel"
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
                          children: "Delete account"
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
function Profile({ mustVerifyEmail, status }) {
  const { auth } = usePage().props;
  return (
    // Sections space themselves: the settings layout's `space-y-12` only reaches a page's
    // direct children when that layout wraps it, so a bare mount put each section's Save
    // flush against the next heading.
    /* @__PURE__ */ jsxs2("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsx2(Head, { title: "Profile settings" }),
      /* @__PURE__ */ jsx2("h1", { className: "sr-only", children: "Profile settings" }),
      /* @__PURE__ */ jsxs2("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx2(
          Heading,
          {
            variant: "small",
            title: "Profile",
            description: "Update your name and email address"
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
                /* @__PURE__ */ jsx2(Label, { htmlFor: "name", children: "Name" }),
                /* @__PURE__ */ jsx2(
                  Input,
                  {
                    id: "name",
                    className: "mt-1 block w-full",
                    defaultValue: auth.user.name,
                    name: "name",
                    required: true,
                    autoComplete: "name",
                    placeholder: "Full name"
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
                /* @__PURE__ */ jsx2(Label, { htmlFor: "email", children: "Email address" }),
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
                    placeholder: "Email address"
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
              featureEnabled("email-verification") && /* @__PURE__ */ jsx2(Fragment2, { children: mustVerifyEmail && auth.user.email_verified_at === null && /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsxs2("p", { className: "-mt-4 text-sm text-muted-foreground", children: [
                  "Your email address is unverified.",
                  " ",
                  /* @__PURE__ */ jsx2(
                    Link,
                    {
                      href: "/email/verification-notification",
                      method: "post",
                      as: "button",
                      className: "text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500",
                      children: "Click here to re-send the verification email."
                    }
                  )
                ] }),
                status === "verification-link-sent" && /* @__PURE__ */ jsx2("div", { className: "mt-2 text-sm font-medium text-primary", children: "A new verification link has been sent to your email address." })
              ] }) }),
              /* @__PURE__ */ jsx2("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsx2(
                Button,
                {
                  disabled: processing,
                  "data-test": "update-profile-button",
                  children: "Save"
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
      title: "Profile settings",
      href: { method: "get", url: "/settings/profile" }
    }
  ]
};
export {
  Profile as default
};
//# sourceMappingURL=profile-YX7WPFLU.js.map