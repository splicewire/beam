import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));

export default defineConfig({
    // Canvas composes linked Schemastud packages: use the renderer's React throughout the live tree.
    resolve: {
        // `@tanstack/react-query` joins the list because the linked `@schemastud/facets`/`frame` resolve
        // THEIR copy from the schemastud workspace root: a test that mounts a frame shell under this
        // package's QueryClientProvider would otherwise hit "No QueryClient set" inside `useListFilters`.
        dedupe: ['react', 'react-dom', '@tanstack/react-query'],
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
