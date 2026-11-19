import {
  featureEnabled,
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";

// src/pages.ts
import { beamUxPages } from "@splicewire/beam-ux/pages";
var defaults = {
  ...beamUxPages,
  "os": () => import("./os-R6CIUJRP.js"),
  "settings/profile": () => import("./profile-74T5V2AG.js"),
  "settings/appearance": () => import("./appearance-VAW5NDQ7.js"),
  "settings/security": () => import("./security-HC62RI7T.js"),
  "auth/confirm-password": () => import("./confirm-password-3CEM7F5A.js"),
  "auth/login": () => import("./login-D5N3UH5T.js"),
  "auth/two-factor-challenge": () => import("./two-factor-challenge-U7MY63U7.js"),
  "auth/register": () => import("./register-PKEQ4RE7.js"),
  "auth/entry": () => import("./entry-24NSERFP.js"),
  "auth/reset-password": () => import("./reset-password-OGFW7CDY.js"),
  "auth/forgot-password": () => import("./forgot-password-QY2LN7ZR.js"),
  "auth/verify-email": () => import("./verify-email-Z7M5BAAJ.js"),
  "frame/console": () => import("./console-QBPYE3OD.js"),
  "site/home": () => import("./home-HHNAVB4G.js"),
  "account/theme": () => import("./theme-2DMXNRO6.js"),
  "account/home": () => import("./home-566EPAH4.js"),
  // Getting onto a team (splicewire/laravel-beam-accounts `routes/teams.php`): `teams.create` renders
  // the first, the emailed `invitations.accept` link the second. Bodies are @splicewire/beam-accounts'.
  "account/create-team": () => import("./create-team-2FFQDJUB.js"),
  "auth/accept-invitation": () => import("./accept-invitation-HVESEPME.js"),
  "operator/dashboard": () => import("./dashboard-RI7TSWRO.js"),
  "operator/platform-connection": () => import("./platform-connection-GDOIXB7I.js"),
  // The branded error page `splicewire/laravel-beam-accounts`' `ErrorPages` renders for a browser's
  // 403/404/419/500/503. It picks its own chrome (account shell or site shell), see pages/error.tsx.
  "error": () => import("./error-TUBOMDOV.js")
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
//# sourceMappingURL=chunk-HBH3R2C7.js.map