import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist.
    // React (+ its JSX runtime) and react-query for shared context/hooks identity; the
    // @schemastud/ui foundation and lucide icons the host already has; and @xyflow/react —
    // the read-only workflow graph's viz lib, a HEAVY generic dep the host already carries,
    // so it lands as a peer (not a bundled foundation primitive; brief §4 / 07 delta #6).
    //
    // @splicewire/_resources (the generated DTO projection, rehome-components 01/08) stays a
    // real dependency, not bundled: the emitted `dist/index.d.ts` keeps its `import type` from
    // `@splicewire/_resources/types/workflows`, and the dependency edge (see package.json) makes
    // the projection TRAVEL with the package so a consumer resolves it transitively. (Type-only,
    // so it never appears in the JS bundle.)
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/ui',
        '@xyflow/react',
        'lucide-react',
    ],
});
