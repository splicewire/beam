import type { ComponentType, SVGAttributes } from "react";
import type { UxBuilderClient } from "@splicewire/beam-ux";

export type AuthFeature =
  | "registration"
  | "email-verification"
  | "2fa"
  | "passkeys"
  | "password-confirmation"
  | "2fa-or-passkeys";
export type PageModule = { default: ComponentType };
export type PageLoader = () => Promise<PageModule>;
export interface BeamInertiaConfig {
  name?: string;
  development?: boolean;
  logo?: ComponentType<SVGAttributes<SVGElement>>;
  features?: Partial<Record<AuthFeature, boolean>>;
  pages?: Record<string, PageLoader>;
  entryClient?: UxBuilderClient;
}
let configuration: BeamInertiaConfig = {};
export function configureBeamInertia(config: BeamInertiaConfig): void {
  configuration = config;
}
export function getBeamInertiaConfig(): BeamInertiaConfig {
  return configuration;
}
export function featureEnabled(feature: AuthFeature): boolean {
  if (feature === "2fa-or-passkeys")
    return featureEnabled("2fa") || featureEnabled("passkeys");
  return configuration.features?.[feature] ?? true;
}

export function authFeaturesFrom(
  enabled: readonly AuthFeature[],
): Record<AuthFeature, boolean> {
  return {
    registration: enabled.includes("registration"),
    "email-verification": enabled.includes("email-verification"),
    "2fa": enabled.includes("2fa"),
    passkeys: enabled.includes("passkeys"),
    "password-confirmation": enabled.includes("password-confirmation"),
    "2fa-or-passkeys": enabled.includes("2fa") || enabled.includes("passkeys"),
  };
}
