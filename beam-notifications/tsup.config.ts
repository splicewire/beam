import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these, never bundled into dist: React and react-query for shared
    // context/hooks identity, the Frame kit the bell renders inside (02-1/02-5), the @schemastud/ui foundation and lucide
    // icons the host already has, and the messages runtime with this package's own catalog subpath (kept external, as
    // beam-workflows does; localization 30 W3).
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-query',
        '@schemastud/frame',
        '@schemastud/ui',
        'lucide-react',
        '@schemastud/messages',
        '@schemastud/messages/react',
        '@splicewire/beam-notifications/messages.js',
    ],
});
