import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts', widgets: 'src/widgets/register.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each: React and react-query for context identity, frame (whose kit the host
    // mounts and whose provider these screens render under, with its `/cards` subpath) and seam (frame's widget
    // registry). Never bundled into dist.
    external: ['react', 'react/jsx-runtime', 'react-dom', '@tanstack/react-query', '@schemastud/frame', '@schemastud/frame/cards', '@schemastud/frame/session', '@schemastud/seam'],
});
