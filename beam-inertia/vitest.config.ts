import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Canvas composes linked Schemastud packages: use the renderer's React throughout the live tree.
    resolve: { dedupe: ['react', 'react-dom'] },
    test: { server: { deps: { inline: true } } },
});
