import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of react and three — never bundled into dist.
    external: ['react', 'react/jsx-runtime', 'three'],
});
