import { defaultComponents } from './registry';

/**
 * EP-07 (ux-0228 d6): the names of the components the canvas registers, sorted — what `beam:doctor`'s
 * `BeamUxManifestRegistryAudit` compares, both ways, with each realm's Manifest Profile. A host writes it from its
 * build or test run (after `configureBeamInertia`, so the auth features gate it as they gate the canvas) to the path
 * `beam.ux.manifest.js_registry` names, as a list or as realm => list:
 *
 *     writeFileSync('storage/app/beam-js-registry.json', JSON.stringify(registrySnapshot(hostRegistry)));
 *
 * Without the file the doctor reports the comparison INCONCLUSIVE, never as a pass.
 */
export function registrySnapshot(registry: Record<string, unknown> = defaultComponents()): string[] {
    return Object.keys(registry).sort();
}
