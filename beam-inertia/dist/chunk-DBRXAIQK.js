import {
  resolveBeamPage
} from "./chunk-OW5S7K7F.js";
import {
  useBrand
} from "./chunk-IHHHPJVP.js";
import {
  bodyClient
} from "./chunk-MUHE33WK.js";
import {
  featureEnabled,
  getBeamInertiaConfig,
  intakeFormsEnabled,
  mdxHoldsBlocksEnabled
} from "./chunk-XP5YRUDH.js";

// src/editor/intake.tsx
import { usePage } from "@inertiajs/react";
import { IntakeForm, PublicIntakeProvider } from "@splicewire/beam-intake";
import { useEditMode } from "@splicewire/beam-ux/canvas";
import { reportEvent } from "@splicewire/beam-ux/site";
import { jsx } from "react/jsx-runtime";
function IntakeFormsFromPage({ children }) {
  const { props } = usePage();
  return /* @__PURE__ */ jsx(PublicIntakeProvider, { value: { schemas: props.intakeForms ?? {}, honeypotField: props.intakeHoneypotField, onSent: () => reportEvent("generate_lead") }, children });
}
function IntakeFormIsland(props) {
  const editing = useEditMode();
  return /* @__PURE__ */ jsx(
    IntakeForm,
    {
      captureKey: String(props.captureKey ?? ""),
      submitLabel: typeof props.submitLabel === "string" ? props.submitLabel : void 0,
      successMessage: typeof props.successMessage === "string" ? props.successMessage : void 0,
      preview: editing
    }
  );
}

// src/editor/canvas-config.tsx
import { defaultCanvasConfig } from "@splicewire/beam-ux/editor";

// src/editor/registry.tsx
import { Link, usePage as usePage2 } from "@inertiajs/react";
import { ManifestTable, SiteNav as BeamSiteNav } from "@splicewire/beam-ux/site";
import { lazy, Suspense } from "react";

// src/editor/islands.tsx
import { DemoHero, DemoFeatureRow } from "@splicewire/beam-ux/editor";

// src/editor/registry.tsx
import { richFieldComponents } from "@splicewire/beam-ux/editor";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function defaultComponents() {
  return {
    DemoHero,
    DemoFeatureRow,
    ...richFieldComponents,
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
    ...featureEnabled("email-verification") ? { AuthVerifyEmail: VerifyEmail } : {},
    // EP-07d: the packaged form, where the host turned on its public intake door (laravel-beam-ux offers the node
    // there too, so the doctor's registry check agrees).
    ...intakeFormsEnabled() ? { IntakeForm: IntakeFormIsland } : {},
    // EP-42: what laravel-beam-ux adds to an MDX page's profile where MDX pages hold blocks (the packages' shipped docs
    // pages place them), only there, so the doctor's registry check agrees.
    ...mdxHoldsBlocksEnabled() ? { SiteNav: PageSiteNav, ManifestTable } : {},
    // The host's own components (configureBeamInertia({ components })), its sections and its MDX kit.
    ...getBeamInertiaConfig().components
  };
}
function authIsland(page, route, form) {
  const Page = lazy(async () => ({ default: await resolveBeamPage(page) }));
  const path = new RegExp(`^${route.replace(/\{[^}]+\}/g, "[^/]+")}$`);
  return function AuthIsland() {
    const { url, props } = usePage2();
    if (!path.test(url.split(/[?#]/)[0])) {
      return /* @__PURE__ */ jsxs("div", { role: "note", "data-auth-island-refused": route, className: "p-4 text-sm", children: [
        "The ",
        form,
        " works only on its own page."
      ] });
    }
    return /* @__PURE__ */ jsx2(Suspense, { fallback: null, children: /* @__PURE__ */ jsx2(Page, { ...props }) });
  };
}
var Login = authIsland("auth/login", "/login", "sign-in form");
var Register = authIsland("auth/register", "/register", "sign-up form");
var ForgotPassword = authIsland("auth/forgot-password", "/forgot-password", "password reset request");
var ResetPassword = authIsland("auth/reset-password", "/reset-password/{token}", "password reset form");
var ConfirmPassword = authIsland("auth/confirm-password", "/user/confirm-password", "password confirmation");
var TwoFactorChallenge = authIsland("auth/two-factor-challenge", "/two-factor-challenge", "two-factor challenge");
var VerifyEmail = authIsland("auth/verify-email", "/email/verify", "email verification notice");
function PageSiteNav(props) {
  const { nav } = usePage2().props;
  return /* @__PURE__ */ jsx2(BeamSiteNav, { nav: nav ?? null, linkComponent: Link, ...props });
}

// src/editor/canvas-config.tsx
var canvasConfig = { ...defaultCanvasConfig, get registry() {
  return defaultComponents();
} };

// src/editor/provider.tsx
import { usePage as usePage3 } from "@inertiajs/react";
import { EditorKitProvider } from "@splicewire/beam-ux/editor";
import { toast } from "sonner";

// src/editor/defaults.ts
import { defaultTreeFor, DEFAULT_TREES } from "@splicewire/beam-ux/editor";

// src/editor/provider.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function InertiaEditorKit({ children }) {
  const page = usePage3();
  const brand = useBrand();
  return /* @__PURE__ */ jsx3(
    EditorKitProvider,
    {
      transport: bodyClient,
      userId: page.props.auth?.user?.id == null ? void 0 : String(page.props.auth.user.id),
      theme: page.props.theme?.canvas ?? {},
      canAuthor: page.props.auth?.canAuthorUx === true,
      canvasConfig,
      defaultTreeFor,
      notify: toast,
      brand: brand.name,
      children
    }
  );
}

export {
  IntakeFormsFromPage,
  defaultComponents,
  canvasConfig,
  InertiaEditorKit
};
//# sourceMappingURL=chunk-DBRXAIQK.js.map