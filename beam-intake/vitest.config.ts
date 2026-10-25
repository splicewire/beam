import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const pkgDir = (id: string) => dirname(require.resolve(`${id}/package.json`));
const react = pkgDir('react');
const reactDom = pkgDir('react-dom');
export default defineConfig({
    plugins: [{
        // RJSF's nested lucide-react CJS entry bypasses Vite's React aliases and loads schemastud's own React copy
        // (a null hook dispatcher once SchemaForm draws an error icon). Resolve only that dependency's installed ESM
        // entry so its hooks use this suite's renderer, as beam-ux's suite does.
        name: 'rjsf-lucide-esm',
        enforce: 'pre',
        resolveId(source, importer) {
            if (source !== 'lucide-react' || !importer?.includes('/@rjsf/shadcn/')) return;
            const fromImporter = createRequire(importer);
            const iconPackage = fromImporter.resolve('lucide-react/package.json');
            const iconManifest = fromImporter(iconPackage) as { module: string };
            return join(dirname(iconPackage), iconManifest.module);
        },
    }],
    resolve: {
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
            '@tanstack/react-query': pkgDir('@tanstack/react-query'),
            '@tanstack/react-table': pkgDir('@tanstack/react-table'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        server: { deps: { inline: true } },
    },
});
