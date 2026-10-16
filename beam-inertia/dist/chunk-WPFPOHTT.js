import {
  Separator
} from "./chunk-L5EIPFNI.js";
import {
  Spinner
} from "./chunk-3T56CRQW.js";
import {
  InputError
} from "./chunk-UJ2MQHRA.js";
import {
  Button
} from "./chunk-SXSE375U.js";

// src/components/passkey-verify.tsx
import { router } from "@inertiajs/react";
import { usePasskeyVerify } from "@laravel/passkeys/react";
import { KeyRound } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function PasskeyVerify({
  routes,
  label,
  loadingLabel,
  separator
} = {}) {
  const { verify, isLoading, error, isSupported } = usePasskeyVerify({
    ...routes && {
      routes: {
        options: routes.options.url,
        submit: routes.submit.url
      }
    },
    onSuccess: (response) => {
      router.visit(response.redirect ?? "/dashboard");
    }
  });
  if (!isSupported) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          className: "w-full",
          onClick: verify,
          disabled: isLoading,
          children: [
            isLoading ? /* @__PURE__ */ jsx(Spinner, {}) : /* @__PURE__ */ jsx(KeyRound, { className: "h-4 w-4" }),
            isLoading ? loadingLabel ?? "Authenticating..." : label ?? "Sign in with a passkey"
          ]
        }
      ),
      error && /* @__PURE__ */ jsx(InputError, { message: error, className: "text-center" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative my-6", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx(Separator, { className: "w-full" }) }),
      /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-background px-2 text-muted-foreground", children: separator ?? "Or continue with email" }) })
    ] })
  ] });
}

export {
  PasskeyVerify
};
//# sourceMappingURL=chunk-WPFPOHTT.js.map