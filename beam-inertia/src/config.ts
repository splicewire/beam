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
  /**
   * EP-07d: register the packaged IntakeForm. A host turns it on where it turns on laravel-beam's public intake door
   * (`beam.core.intake.enabled`), which is where laravel-beam-ux's Manifest Profile offers the node.
   */
  intakeForms?: boolean;
  /**
   * The host's own components for the canvas registry: its designed sections, and the kit its MDX pages offer where
   * they hold blocks. They join the packaged islands, so the canvas, a compiled body and the doctor's registry
   * snapshot read one map. The host owns its registry: a host component replaces a packaged one of the same name.
   * Typed as any component, since one declares its own props (a kit's required `heading`) and the canvas hands it
   * whatever its block stores.
   */
  components?: Record<string, ComponentType<never>>;
  pages?: Record<string, PageLoader>;
  entryClient?: UxBuilderClient;
  /** Host-owned editor route for an inspected entry; absent means no Open Theme link. */
  fileEditorHref?: (entryId: string) => string | undefined;
}
let configuration: BeamInertiaConfig = {};
export function configureBeamInertia(config: BeamInertiaConfig): void {
  configuration = config;
}
export function getBeamInertiaConfig(): BeamInertiaConfig {
  return configuration;
}
/** EP-07d: does this host register the packaged IntakeForm (its public intake door is on)? */
export function intakeFormsEnabled(): boolean {
  return configuration.intakeForms === true;
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
