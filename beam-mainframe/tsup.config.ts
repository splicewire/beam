import { defineConfig } from 'tsup';

export default defineConfig({
    // Single browser-side React surface. No node-side `vite` entry (unlike beam-mdx):
    // Mainframe is pure runtime chrome — it contributes no build-time plugin.
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // React (and its JSX runtime) stay external — the host owns the single instance
    // (the app's Vite `dedupe` forces it), never bundled into dist.
    external: ['react', 'react/jsx-runtime', 'react-dom'],
});
