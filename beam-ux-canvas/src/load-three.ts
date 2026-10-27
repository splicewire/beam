/**
 * The dynamic `three` loader. `three` is a peer dependency, never bundled into this package's
 * `dist` and never fetched from a CDN: the `import('three')` below stays a dynamic import in the
 * built output, so the host's bundler (Vite) splits `three` into its own chunk, requested only when
 * an effect is about to mount (landing-motion tickets 04 and 06 point 4).
 */
export type ThreeModule = typeof import('three');

let pending: Promise<ThreeModule> | null = null;

/** Load `three` once per page; a rejected load is not cached, so a later mount may retry. */
export function loadThree(): Promise<ThreeModule> {
    pending ??= import('three').catch((error: unknown) => {
        pending = null;
        throw error;
    });
    return pending;
}
