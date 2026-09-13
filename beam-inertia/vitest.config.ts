import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));

export default defineConfig({
    // Canvas composes linked Schemastud packages: use the renderer's React throughout the live tree.
    resolve: {
        dedupe: ['react', 'react-dom'],
        // Window geometry uses CJS helpers; their native require bypasses Vite dedupe.
        // Resolve them from this workspace so they use the same React as the renderer.
        alias: {
            'react-rnd': pkgDir('react-rnd'),
            're-resizable': pkgDir('re-resizable'),
            'react-draggable': pkgDir('react-draggable'),
        },
    },
    test: { server: { deps: { inline: true } } },
});
