import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // The host owns the single instance of each of these — never bundled into dist. React (+ its
    // JSX runtime), the @schemastud/blockdoc editor whose NodeView contract these implement, and
    // the lucide icons the host already carries.
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@schemastud/blockdoc',
        '@schemastud/blockdoc/react',
        'lucide-react',
    ],
});
