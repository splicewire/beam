import { copyFileSync } from 'node:fs';

import { defineConfig } from 'tsup';

export default defineConfig({
    // Object form keeps distinct output basenames (dist/index.js + dist/vite.js);
    // a bare array would collide two `index` entries. The `vite` entry is the
    // node-side build plugin + MDX preset; `index` is the browser React surface.
    // `editor` is the heavy authoring surface (mdxeditor + RJSF), kept a separate entry so `.`/`./kit`
    // stay light (ADR-0116); the host lazy-loads it.
    entry: { index: 'src/index.ts', vite: 'src/vite/index.ts', kit: 'src/kit/index.ts', editor: 'src/editor/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // Peers + the host's build toolchain stay external — never bundled into dist.
    external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@inertiajs/react',
        'vite',
        '@mdx-js/rollup',
        '@mdx-js/mdx',
        'remark-frontmatter',
        'remark-mdx-frontmatter',
        // The editor's heavy deps — bundled by the host, never inlined into dist.
        '@mdxeditor/editor',
        '@rjsf/core',
        '@rjsf/shadcn',
        '@rjsf/utils',
        '@rjsf/validator-ajv8',
    ],
    // The base typography rides alongside the JS as a plain, importable stylesheet
    // (`@splicewire/beam-mdx/css`); satellites override the tokens it reads.
    // site-prose.css + kit.css are standalone stylesheets (imported by consumers, not the JS), so
    // they're copied. editor.css is IMPORTED by the editor component, so tsup bundles it into
    // dist/editor.css (alongside mdxeditor's style.css) and the JS side-effect-imports it — do NOT
    // copy over that bundle.
    onSuccess: async () => {
        copyFileSync('src/site-prose.css', 'dist/site-prose.css');
        copyFileSync('src/kit/kit.css', 'dist/kit.css');
    },
});
