import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// beam-ux consumes @schemastud/ui + @schemastud/seam across a workspace boundary (a `file:` link),
// so their transitive React / react-query would otherwise resolve a SECOND copy out of the
// schemastud workspace's node_modules — duplicate instances, null hook dispatcher. Pin every
// shared singleton to the ONE copy hoisted in the beam workspace (the same single-instance
// guarantee the app's Vite gives at runtime). Deterministic aliases beat `dedupe` here because
// the foundation UI + seam are pulled in from a different node_modules root.
const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');
const self = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
            '@tanstack/react-query': pkgDir('@tanstack/react-query'),
            // The `@schemastud/ui` dist is aliased to an ABSOLUTE path outside the beam workspace, so
            // its transitive Radix scroll-lock helpers otherwise resolve (and `require('react')`) out
            // of the schemastud workspace's node_modules — a second React, null hook dispatcher when a
            // Sheet/Dialog mounts. Pin the scroll-lock chain to the beam-workspace copies too, so the
            // single-React aliases above actually reach them (the FrameSidePanelOverlay renders a Sheet).
            'react-remove-scroll': pkgDir('react-remove-scroll'),
            'react-style-singleton': pkgDir('react-style-singleton'),
            'use-sidecar': pkgDir('use-sidecar'),
            'use-callback-ref': pkgDir('use-callback-ref'),
            'aria-hidden': pkgDir('aria-hidden'),
            // Resolve the foundation UI + the seam to their built dist (their published entries),
            // not their src.
            '@schemastud/ui': join(self, '..', '..', 'schemastud', 'ui', 'dist', 'index.js'),
            '@schemastud/seam': join(self, '..', '..', 'schemastud', 'seam', 'dist', 'index.js'),
            // The /appshell entry's overlay reads the frame side-panel store; its mode-core types
            // off mainframe. Resolve both to their built dist (their published entries).
            '@schemastud/frame': join(self, '..', '..', 'schemastud', 'frame', 'dist', 'index.js'),
            '@schemastud/mainframe': join(
                self,
                '..',
                '..',
                'schemastud',
                'mainframe',
                'dist',
                'index.js',
            ),
        },
    },
    test: {
        // The verification bar (rehome-ui §8a) mounts a live tree, so it needs a DOM.
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
