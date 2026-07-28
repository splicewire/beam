import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist.
    // React (+ its JSX runtime) and react-query for shared context/hooks identity; the
    // @schemastud/ui foundation and lucide icons the host already has.
    //
    // @splicewire/_resources (the generated DTO projection, rehome-components 01/08) stays a
    // real dependency, not bundled: the emitted `dist/index.d.ts` keeps its `import type` from
    // `@splicewire/_resources/types/tokens`, and the dependency edge (see package.json) makes
    // the projection TRAVEL with the package so a consumer resolves it transitively. This is
    // the publish path made concrete — the resources bundle delivered as a package dependency,
    // the shape decision 01 chose. (Type-only, so it never appears in the JS bundle.)
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/ui',
        'lucide-react',
    ],
});
