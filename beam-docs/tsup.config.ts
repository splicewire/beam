import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts', pages: 'src/pages/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
        'react', 'react/jsx-runtime', 'react-dom', '@inertiajs/react',
        '@schemastud/nav', '@schemastud/seam', '@rjsf/utils',
        '@splicewire/beam-ux/docs', '@splicewire/beam-ux/nav',
    ],
});
