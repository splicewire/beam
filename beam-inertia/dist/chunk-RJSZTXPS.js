import {
  featureEnabled,
  getBeamInertiaConfig
} from "./chunk-PGZP7A2Q.js";

// src/pages.ts
import { beamUxPages } from "@splicewire/beam-ux/pages";
var defaults = {
  ...beamUxPages,
  "os": () => import("./os-TYOSVVKG.js"),
  "settings/profile": () => import("./profile-RJAVRYRV.js"),
  "settings/appearance": () => import("./appearance-NA7WSVHM.js"),
  "settings/security": () => import("./security-U77OQF3K.js"),
  "auth/confirm-password": () => import("./confirm-password-BEAWZMJW.js"),
  "auth/login": () => import("./login-JRDNVB2G.js"),
  "auth/two-factor-challenge": () => import("./two-factor-challenge-ALWNUZD6.js"),
  "auth/register": () => import("./register-7XXA2UFM.js"),
  "auth/entry": () => import("./entry-SS4P4XYL.js"),
  "auth/reset-password": () => import("./reset-password-PHEA6RLX.js"),
  "auth/forgot-password": () => import("./forgot-password-E6L77TJA.js"),
  "auth/verify-email": () => import("./verify-email-U23GZFWZ.js"),
  "frame/console": () => import("./console-CQM3CZUQ.js"),
  "site/home": () => import("./home-H7NW27M5.js"),
  "account/theme": () => import("./theme-P67VYNK2.js"),
  "account/home": () => import("./home-Q6MVNDVS.js"),
  // Getting onto a team (splicewire/laravel-beam-accounts `routes/teams.php`): `teams.create` renders
  // the first, the emailed `invitations.accept` link the second. Bodies are @splicewire/beam-accounts'.
  "account/create-team": () => import("./create-team-WX7YLQLU.js"),
  "auth/accept-invitation": () => import("./accept-invitation-UUQBREGI.js"),
  "operator/dashboard": () => import("./dashboard-WZAUVULZ.js"),
  "operator/platform-connection": () => import("./platform-connection-GCONR4VX.js"),
  // The branded error page `splicewire/laravel-beam-accounts`' `ErrorPages` renders for a browser's
  // 403/404/419/500/503. It picks its own chrome (account shell or site shell), see pages/error.tsx.
  "error": () => import("./error-FQ7LQADG.js")
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
//# sourceMappingURL=chunk-RJSZTXPS.js.map