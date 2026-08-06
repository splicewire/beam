import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// beam-accounts consumes @schemastud/ui across a workspace boundary (a `file:` link), so its
// transitive React / react-table / react-query would otherwise resolve a SECOND copy out of the
// schemastud workspace's node_modules — duplicate instances, null hook dispatcher. Pin every
// shared singleton to the ONE copy hoisted in the beam workspace (the same single-instance
// guarantee the app's Vite gives at runtime). Deterministic aliases beat `dedupe` here because
// the foundation UI is pulled in from a different node_modules root.
const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');
const self = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        // Collapse the shared singletons to ONE instance. The Sheet/Dialog surfaces (credits +
        // billing) drag in Radix's scroll-lock tail (react-remove-scroll, react-style-singleton,
        // use-sidecar, aria-hidden…), each of which lives in the schemastud workspace's node_modules
        // and would otherwise resolve a SECOND React → the null-dispatcher `useRef` crash. `dedupe`
        // forces every copy of these to the one hoisted here, complementing the deterministic aliases.
        dedupe: ['react', 'react-dom', 'react-remove-scroll'],
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
            'react-remove-scroll': pkgDir('react-remove-scroll'),
            '@tanstack/react-table': pkgDir('@tanstack/react-table'),
            '@tanstack/react-query': pkgDir('@tanstack/react-query'),
            // Resolve the foundation UI to its built dist (its published entry), not its src.
            '@schemastud/ui': join(self, '..', '..', 'schemastud', 'ui', 'dist', 'index.js'),
        },
    },
    test: {
        // The verification bar (rehome-components §8a) mounts a live tree, so it needs a DOM.
        environment: 'jsdom',
        globals: true,
        // Inline the cross-workspace deps so Vite TRANSFORMS them and the single-instance
        // aliases above actually apply — otherwise vitest hands them to node's CJS resolver,
        // which bypasses `resolve.alias` and reloads the schemastud-workspace React copies.
        server: {
            deps: {
                // Inline ALL deps: Radix pulls a long tail of react-using helpers
                // (react-remove-scroll, react-style-singleton, use-sidecar, aria-hidden…) that
                // each live in the schemastud workspace's node_modules. Transforming everything
                // is the only way the single-instance React aliases reach all of them.
                inline: true,
            },
        },
    },
});
