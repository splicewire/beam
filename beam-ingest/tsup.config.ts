import { defineConfig } from 'tsup';
export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/ui',
        '@splicewire/_resources',
    ],
});
