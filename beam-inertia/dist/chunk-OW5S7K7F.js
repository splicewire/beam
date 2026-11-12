import {
  featureEnabled,
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";

// src/pages.ts
import { beamUxPages } from "@splicewire/beam-ux/pages";
var defaults = {
  ...beamUxPages,
  "os": () => import("./os-33QU2DC3.js"),
  "settings/profile": () => import("./profile-NJTPZ6B5.js"),
  "settings/appearance": () => import("./appearance-YGZ3GVCA.js"),
  "settings/security": () => import("./security-MTO6X3TP.js"),
  "auth/confirm-password": () => import("./confirm-password-K7FY5J6K.js"),
  "auth/login": () => import("./login-XAUYNDQ4.js"),
  "auth/two-factor-challenge": () => import("./two-factor-challenge-GGCWUGTY.js"),
  "auth/register": () => import("./register-HQPAXF6C.js"),
  "auth/entry": () => import("./entry-KW3V3PJV.js"),
  "auth/reset-password": () => import("./reset-password-2NGMAV3L.js"),
  "auth/forgot-password": () => import("./forgot-password-O2S233HW.js"),
  "auth/verify-email": () => import("./verify-email-L3CLVRJ7.js"),
  "frame/console": () => import("./console-OZ4PXATS.js"),
  "site/home": () => import("./home-KA4AVMLF.js"),
  "account/theme": () => import("./theme-JEWXSPQV.js"),
  "account/home": () => import("./home-RRWYEPAF.js"),
  // Getting onto a team (splicewire/laravel-beam-accounts `routes/teams.php`): `teams.create` renders
  // the first, the emailed `invitations.accept` link the second. Bodies are @splicewire/beam-accounts'.
  "account/create-team": () => import("./create-team-POYKTAD5.js"),
  "auth/accept-invitation": () => import("./accept-invitation-PMQGCLTK.js"),
  "operator/dashboard": () => import("./dashboard-4WQQCVJX.js"),
  "operator/platform-connection": () => import("./platform-connection-2RFEIXP5.js"),
  // The branded error page `splicewire/laravel-beam-accounts`' `ErrorPages` renders for a browser's
  // 403/404/419/500/503. It picks its own chrome (account shell or site shell), see pages/error.tsx.
  "error": () => import("./error-4N66PKT3.js")
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
//# sourceMappingURL=chunk-OW5S7K7F.js.map