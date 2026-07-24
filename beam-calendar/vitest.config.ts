import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// beam-calendar consumes @schemastud/big-calendar across a workspace boundary (a `file:`
// link), so its transitive React / react-query / react-big-calendar would otherwise resolve
// a SECOND copy out of the schemastud workspace's node_modules — duplicate instances, null
// hook dispatcher, and RBC portal duplication. Pin every shared singleton to the ONE copy
// hoisted in the beam workspace (the same single-instance guarantee the app's Vite gives).
const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');
const self = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        // Belt-and-braces: never load two copies of the shared singletons.
        dedupe: ['react', 'react-dom', 'react-big-calendar'],
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
            '@tanstack/react-query': pkgDir('@tanstack/react-query'),
            // The foundation's transitive RBC/date-fns would otherwise resolve a SECOND copy out
            // of schemastud/big-calendar/node_modules (RBC's PopOverlay then grabs a second React
            // → null hook dispatcher). Pin them to the ONE beam-workspace copy too.
            'react-big-calendar': pkgDir('react-big-calendar'),
            'date-fns': pkgDir('date-fns'),
            // Resolve the foundation to its BUILT dist (its published entry), not its src.
            '@schemastud/big-calendar': join(self, '..', '..', 'schemastud', 'big-calendar', 'dist', 'index.js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        // Inline the cross-workspace deps so Vite TRANSFORMS them and the single-instance
        // aliases above actually apply — otherwise vitest hands them to node's CJS resolver,
        // which bypasses resolve.alias and reloads the schemastud-workspace React/RBC copies.
        server: {
            deps: {
                inline: true,
            },
        },
    },
});
