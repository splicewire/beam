import {
  featureEnabled,
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";

// src/pages.ts
import { beamUxPages } from "@splicewire/beam-ux/pages";
var defaults = {
  ...beamUxPages,
  "os": () => import("./os-LK6XIB6R.js"),
  "settings/profile": () => import("./profile-6U3RY24Y.js"),
  "settings/appearance": () => import("./appearance-YGZ3GVCA.js"),
  "settings/security": () => import("./security-QCEO2YKF.js"),
  "auth/confirm-password": () => import("./confirm-password-PINX6YJY.js"),
  "auth/login": () => import("./login-MNAIEZC2.js"),
  "auth/two-factor-challenge": () => import("./two-factor-challenge-GGCWUGTY.js"),
  "auth/register": () => import("./register-RNJ2O3YP.js"),
  "auth/entry": () => import("./entry-P5Y7OE3Z.js"),
  "auth/reset-password": () => import("./reset-password-MVW4VPLL.js"),
  "auth/forgot-password": () => import("./forgot-password-QGNC3NCS.js"),
  "auth/verify-email": () => import("./verify-email-L3CLVRJ7.js"),
  "frame/console": () => import("./console-W4RSYURS.js"),
  "site/home": () => import("./home-2QMEOFPO.js"),
  "account/theme": () => import("./theme-3MKRZAIV.js"),
  "account/home": () => import("./home-RRWYEPAF.js"),
  // Getting onto a team (splicewire/laravel-beam-accounts `routes/teams.php`): `teams.create` renders
  // the first, the emailed `invitations.accept` link the second. Bodies are @splicewire/beam-accounts'.
  "account/create-team": () => import("./create-team-POYKTAD5.js"),
  "auth/accept-invitation": () => import("./accept-invitation-PMQGCLTK.js"),
  "operator/dashboard": () => import("./dashboard-4WQQCVJX.js"),
  "operator/platform-connection": () => import("./platform-connection-WTKX7KLG.js"),
  // The branded error page `splicewire/laravel-beam-accounts`' `ErrorPages` renders for a browser's
  // 403/404/419/500/503. It picks its own chrome (account shell or site shell), see pages/error.tsx.
  "error": () => import("./error-PN4XAU43.js")
};
var pageFeatures = {
  "auth/register": "registration",
  "auth/verify-email": "email-verification",
  "auth/two-factor-challenge": "2fa",
  "auth/confirm-password": "password-confirmation"
};
async function resolveBeamPage(name) {
  const feature = pageFeatures[name];
  if (feature && !featureEnabled(feature)) throw new Error(`Page disabled: ${name}`);
  const own = getBeamInertiaConfig().pages;
  const loader = own?.[`./pages/${name}.tsx`] ?? own?.[name] ?? defaults[name];
  if (!loader) throw new Error(`Page not found: ${name}`);
  return (await loader()).default;
}

export {
  resolveBeamPage
};
//# sourceMappingURL=chunk-JJVSCOSX.js.map