import {
  featureEnabled,
  getBeamInertiaConfig
} from "./chunk-2XTQOEA4.js";

// src/pages.ts
import { beamUxPages } from "@splicewire/beam-ux/pages";
var defaults = {
  ...beamUxPages,
  "os": () => import("./os-IAOONCUM.js"),
  "settings/profile": () => import("./profile-BJO4IPAO.js"),
  "settings/appearance": () => import("./appearance-YGZ3GVCA.js"),
  "settings/security": () => import("./security-U5BT3H7W.js"),
  "auth/confirm-password": () => import("./confirm-password-DBXUACTG.js"),
  "auth/login": () => import("./login-JHBZENRF.js"),
  "auth/two-factor-challenge": () => import("./two-factor-challenge-RLGREPUB.js"),
  "auth/register": () => import("./register-RN6SIGKV.js"),
  "auth/entry": () => import("./entry-MMLH5UDC.js"),
  "auth/reset-password": () => import("./reset-password-MVW4VPLL.js"),
  "auth/forgot-password": () => import("./forgot-password-QGNC3NCS.js"),
  "auth/verify-email": () => import("./verify-email-L3CLVRJ7.js"),
  "frame/console": () => import("./console-HH3AALNI.js"),
  "site/home": () => import("./home-XWACTM4T.js"),
  "account/theme": () => import("./theme-TNYMKTQV.js"),
  "account/home": () => import("./home-RRWYEPAF.js"),
  // Getting onto a team (splicewire/laravel-beam-accounts `routes/teams.php`): `teams.create` renders
  // the first, the emailed `invitations.accept` link the second. Bodies are @splicewire/beam-accounts'.
  "account/create-team": () => import("./create-team-POYKTAD5.js"),
  "auth/accept-invitation": () => import("./accept-invitation-PMQGCLTK.js"),
  "operator/dashboard": () => import("./dashboard-4WQQCVJX.js"),
  "operator/platform-connection": () => import("./platform-connection-WTKX7KLG.js"),
  // The branded error page `splicewire/laravel-beam-accounts`' `ErrorPages` renders for a browser's
  // 403/404/419/500/503. It picks its own chrome (account shell or site shell), see pages/error.tsx.
  "error": () => import("./error-QJYYTVWZ.js")
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
//# sourceMappingURL=chunk-BGX343GV.js.map