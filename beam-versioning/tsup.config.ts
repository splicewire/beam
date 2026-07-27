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
    // Unlike @splicewire/beam-accounts, this package has NO @splicewire/_resources dependency:
    // its VersionData shape is deliberately record-agnostic (the PHP `VersionData` DTO's own
    // docblock says so — it carries identity + provenance, no app-shaped fields), so it is
    // defined locally in `src/types.ts` rather than sliced off the app projection. That keeps the
    // package free of the app-shaped tier line while still mirroring the PHP DTO field-for-field.
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/ui',
        'lucide-react',
    ],
});
