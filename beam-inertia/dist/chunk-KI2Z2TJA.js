// src/pages/auth/analytics.ts
import { reportEvent } from "@splicewire/beam-ux/site";
var PENDING_LOGIN_METHOD = "beam.analytics.pending-login-method";
function clearPendingLoginMethod() {
  try {
    window.sessionStorage.removeItem(PENDING_LOGIN_METHOD);
  } catch {
  }
}
function startPasswordLogin() {
  clearPendingLoginMethod();
}
function reportAuthenticatedLogin(method) {
  clearPendingLoginMethod();
  reportEvent("login", { method });
}
function deferPasswordLoginForTwoFactor() {
  try {
    window.sessionStorage.setItem(PENDING_LOGIN_METHOD, "password");
  } catch {
  }
}
function completePendingLogin() {
  let method = null;
  try {
    method = window.sessionStorage.getItem(PENDING_LOGIN_METHOD);
    window.sessionStorage.removeItem(PENDING_LOGIN_METHOD);
  } catch {
    return;
  }
  if (method === "password" || method === "passkey") {
    reportEvent("login", { method });
  }
}
function isTwoFactorChallengeUrl(url) {
  try {
    return new URL(url, window.location.origin).pathname === "/two-factor-challenge";
  } catch {
    return url.split(/[?#]/, 1)[0] === "/two-factor-challenge";
  }
}

export {
  startPasswordLogin,
  reportAuthenticatedLogin,
  deferPasswordLoginForTwoFactor,
  completePendingLogin,
  isTwoFactorChallengeUrl
};
//# sourceMappingURL=chunk-KI2Z2TJA.js.map