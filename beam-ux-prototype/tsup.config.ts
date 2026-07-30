import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist.
    // React (+ its JSX runtime) for shared context/hooks identity; react-router because the
    // host's router is the one that mounts our RouteObject[]; the @schemastud/ui shadcn
    // foundation and lucide icons the host already carries. Everything here is a peer dep
    // (see package.json); the bundled default `cn` is the only non-peer runtime shipped.
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-router',
        '@schemastud/ui',
        'lucide-react',
    ],
});
