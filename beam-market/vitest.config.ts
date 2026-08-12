import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// beam-market consumes @schemastud/ui across a workspace boundary (a `file:` link), so its
// transitive React would otherwise resolve a SECOND copy out of the schemastud workspace's
// node_modules — duplicate instances, null hook dispatcher. Pin every shared singleton to the ONE
// copy hoisted in the beam workspace (the same single-instance guarantee the app's Vite gives at
// runtime) — mirrors @splicewire/beam-accounts and @splicewire/beam-commerce's own vitest configs
// exactly.
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
            '@schemastud/ui': join(self, '..', '..', 'schemastud', 'ui', 'dist', 'index.js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        server: {
            deps: {
                inline: true,
            },
        },
    },
});
