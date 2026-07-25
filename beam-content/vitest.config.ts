import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitest/config';

// beam-content consumes @schemastud/blockdoc across a workspace boundary (a `file:` link), so its
// transitive React would otherwise resolve a SECOND copy — duplicate instances, null hook
// dispatcher. Pin every shared singleton to the ONE copy hoisted in the beam workspace.
const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');

export default defineConfig({
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        server: {
            deps: { inline: [/@schemastud\/blockdoc/] },
        },
    },
});
