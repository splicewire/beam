import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Frame and its default `@schemastud/ui` primitives are linked across the workspace boundary, so their React and
// react-query, and the CommonJS scroll-lock helpers Radix's dialog pulls in, would otherwise resolve a second React out
// of the schemastud workspace: a null hook dispatcher the moment a withdraw dialog opens. Pin each singleton to the one
// copy in the beam workspace, point the helpers at their ESM builds, and inline every dependency so the aliases reach
// all of them (the pattern beam-accounts uses).
const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');
const entry = (id: string) => fileURLToPath(import.meta.resolve(id));

export default defineConfig({
    resolve: {
        alias: {
            'react-remove-scroll-bar/constants': entry('react-remove-scroll-bar/dist/es2015/constants.js'),
            'react-remove-scroll': entry('react-remove-scroll/dist/es2015/index.js'),
            'react-remove-scroll-bar': entry('react-remove-scroll-bar/dist/es2015/index.js'),
            'react-style-singleton': entry('react-style-singleton/dist/es2015/index.js'),
            'use-callback-ref': entry('use-callback-ref/dist/es2015/index.js'),
            'use-sidecar': entry('use-sidecar/dist/es2015/index.js'),
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
            '@tanstack/react-query': pkgDir('@tanstack/react-query'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        server: { deps: { inline: true } },
    },
});
