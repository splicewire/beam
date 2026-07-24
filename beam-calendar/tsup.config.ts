import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist.
    // React + react-query for shared context/hooks identity; the @schemastud/big-calendar
    // foundation and lucide icons the host already carries. The satellite NEVER imports
    // react-big-calendar directly (foundation-only), so it is not listed here.
    //
    // @splicewire/_resources (the generated calendar projection DTO) stays a real dependency,
    // not bundled: the emitted dist/index.d.ts keeps its `import type` from
    // @splicewire/_resources/types/calendar, and the dependency edge makes the projection
    // TRAVEL with the package. (Type-only, so it never appears in the JS bundle.)
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/big-calendar',
        'lucide-react',
    ],
});
