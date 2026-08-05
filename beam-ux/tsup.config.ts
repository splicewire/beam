import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        puck: 'src/puck.ts',
        blockdoc: 'src/blockdoc/index.ts',
        manifest: 'src/manifest/index.ts',
        leaf: 'src/leaf/index.ts',
        site: 'src/site/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist.
    // React (+ its JSX runtime) and react-query for shared context/hooks identity; the
    // @schemastud/ui foundation and lucide icons the host already has; and @schemastud/seam —
    // the real schema-driven SchemaForm the `form`-kind region editor mounts, a host-provided
    // peer (not a bundled foundation primitive).
    //
    // @splicewire/_resources (the generated DTO projection, rehome-ui) stays a real dependency,
    // not bundled: the emitted `dist/index.d.ts` keeps its `import type` from
    // `@splicewire/_resources/types/beam-ux`, and the dependency edge (see package.json) makes
    // the projection TRAVEL with the package so a consumer resolves it transitively. (Type-only,
    // so it never appears in the JS bundle.)
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/ui',
        '@schemastud/seam',
        'lucide-react',
        // The structural editor: host owns the single @measured/puck instance (peer), same as
        // react/react-query — never bundled. Only the /puck entry touches it.
        '@measured/puck',
    ],
});
