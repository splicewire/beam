import {
  bodyClient
} from "./chunk-7TJWWPG6.js";
import {
  resolveBeamPage
} from "./chunk-5CZFBGMC.js";
import {
  featureEnabled
} from "./chunk-MTKP2AW3.js";

// src/editor/canvas-config.tsx
import { defaultCanvasConfig } from "@splicewire/beam-ux/editor";

// src/editor/registry.tsx
import { lazy, Suspense } from "react";

// src/editor/islands.tsx
import { DemoHero, DemoFeatureRow } from "@splicewire/beam-ux/editor";

// src/editor/registry.tsx
import { jsx } from "react/jsx-runtime";
function defaultComponents() {
  return {
    DemoHero,
    DemoFeatureRow,
    // theme-entries-and-authoring STR-03: the 7 promoted auth pages' real Fortify-bound forms, sealed
    // (position/delete-only in the visual editor, never decomposed) — the files themselves are
    // UNCHANGED in location/content (chisel's scaffold-time feature-toggle operates on these exact
    // paths; moving them would require updating the starter's own chisel-paths.php).
    AuthLogin: Login,
    ...featureEnabled("registration") ? { AuthRegister: Register } : {},
    AuthForgotPassword: ForgotPassword,
    AuthResetPassword: ResetPassword,
    ...featureEnabled("password-confirmation") ? { AuthConfirmPassword: ConfirmPassword } : {},
    ...featureEnabled("2fa") ? { AuthTwoFactorChallenge: TwoFactorChallenge } : {},
    ...featureEnabled("email-verification") ? { AuthVerifyEmail: VerifyEmail } : {}
  };
}
var LoginPage = lazy(async () => ({ default: await resolveBeamPage("auth/login") }));
function Login() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(LoginPage, {}) });
}
var RegisterPage = lazy(async () => ({ default: await resolveBeamPage("auth/register") }));
function Register() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(RegisterPage, {}) });
}
var ForgotPasswordPage = lazy(async () => ({ default: await resolveBeamPage("auth/forgot-password") }));
function ForgotPassword() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(ForgotPasswordPage, {}) });
}
var ResetPasswordPage = lazy(async () => ({ default: await resolveBeamPage("auth/reset-password") }));
function ResetPassword() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(ResetPasswordPage, {}) });
}
var ConfirmPasswordPage = lazy(async () => ({ default: await resolveBeamPage("auth/confirm-password") }));
function ConfirmPassword() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(ConfirmPasswordPage, {}) });
}
var TwoFactorChallengePage = lazy(async () => ({ default: await resolveBeamPage("auth/two-factor-challenge") }));
function TwoFactorChallenge() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(TwoFactorChallengePage, {}) });
}
var VerifyEmailPage = lazy(async () => ({ default: await resolveBeamPage("auth/verify-email") }));
function VerifyEmail() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(VerifyEmailPage, {}) });
}

// src/editor/canvas-config.tsx
var canvasConfig = { ...defaultCanvasConfig, get registry() {
  return defaultComponents();
} };

// src/editor/provider.tsx
import { usePage } from "@inertiajs/react";
import { EditorKitProvider } from "@splicewire/beam-ux/editor";
import { toast } from "sonner";

// src/editor/defaults.ts
import { defaultTreeFor, DEFAULT_TREES } from "@splicewire/beam-ux/editor";

// src/editor/provider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function InertiaEditorKit({ children }) {
  const page = usePage();
  return /* @__PURE__ */ jsx2(
    EditorKitProvider,
    {
      transport: bodyClient,
      userId: page.props.auth?.user?.id == null ? void 0 : String(page.props.auth.user.id),
      theme: page.props.theme?.canvas ?? {},
      canAuthor: page.props.auth?.canAuthorUx === true,
      canvasConfig,
      defaultTreeFor,
      notify: toast,
      children
    }
  );
}

export {
  canvasConfig,
  InertiaEditorKit
};
//# sourceMappingURL=chunk-RCVOWTEG.js.map