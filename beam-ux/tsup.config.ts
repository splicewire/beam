import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        blockdoc: 'src/blockdoc/index.ts',
        'blockdoc/json': 'src/blockdoc/json.ts',
        canvas: 'src/canvas/index.ts',
        leaf: 'src/leaf/index.ts',
        site: 'src/site/index.ts',
        docs: 'src/docs/index.ts',
        pages: 'src/pages/index.ts',
        account: 'src/account/index.ts',
        shell: 'src/shell/index.ts',
        appshell: 'src/appshell/index.ts',
        nav: 'src/nav/index.ts',
        surgeon: 'src/surgeon/sdkHookMigration.ts',
        streaming: 'src/streaming/index.ts',
        admin: 'src/admin/index.ts',
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
        '@inertiajs/react',
        '@tanstack/react-query',
        '@schemastud/ui',
        '@schemastud/seam',
        // The mainframe `can`-type + the frame side-panel store: host owns their single instance
        // (the `/appshell` entry's mode-gate + overlay peer on them), never bundled.
        '@schemastud/frame',
        '@schemastud/mainframe',
        // The Frame OS desktop subpath (the canonical window manager + realm-agnostic chrome the
        // `/shell` realm layer re-bases onto; ADR-0017). Host owns its single instance.
        '@schemastud/mainframe/os',
        'lucide-react',
        // readSse() — the generic SSE frame parser the /streaming entry builds on. Only that
        // entry touches it; a consumer using other subpaths never needs it installed.
        '@schemastud/chat',
        // The nav primitives the `/docs` layout composes (OnThisPage). Host owns the single instance;
        // an optional peer, so a consumer using no other subpath never needs it installed.
        '@schemastud/nav',
    ],
});
