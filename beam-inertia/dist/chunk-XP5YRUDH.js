// src/config.ts
var configuration = {};
function configureBeamInertia(config) {
  configuration = config;
}
function getBeamInertiaConfig() {
  return configuration;
}
function intakeFormsEnabled() {
  return configuration.intakeForms === true;
}
function mdxHoldsBlocksEnabled() {
  return configuration.mdxHoldsBlocks === true;
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
  intakeFormsEnabled,
  mdxHoldsBlocksEnabled,
  featureEnabled,
  authFeaturesFrom
};
//# sourceMappingURL=chunk-XP5YRUDH.js.map