// src/config.ts
var configuration = {};
function configureBeamInertia(config) {
  configuration = config;
}
function getBeamInertiaConfig() {
  return configuration;
}
function featureEnabled(feature) {
  if (feature === "2fa-or-passkeys")
    return featureEnabled("2fa") || featureEnabled("passkeys");
  return configuration.features?.[feature] ?? true;
}
function authFeaturesFrom(enabled) {
  return {
    registration: enabled.includes("registration"),
    "email-verification": enabled.includes("email-verification"),
    "2fa": enabled.includes("2fa"),
    passkeys: enabled.includes("passkeys"),
    "password-confirmation": enabled.includes("password-confirmation"),
    "2fa-or-passkeys": enabled.includes("2fa") || enabled.includes("passkeys")
  };
}

export {
  configureBeamInertia,
  getBeamInertiaConfig,
  featureEnabled,
  authFeaturesFrom
};
//# sourceMappingURL=chunk-2XTQOEA4.js.map