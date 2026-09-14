import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const react = dirname(require.resolve('react/package.json'));
const reactDom = dirname(require.resolve('react-dom/package.json'));

export default defineConfig({
    resolve: {
        alias: {
            'react/jsx-runtime': join(react, 'jsx-runtime.js'),
            'react/jsx-dev-runtime': join(react, 'jsx-dev-runtime.js'),
            'react-dom/client': join(reactDom, 'client.js'),
            react,
            'react-dom': reactDom,
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        server: { deps: { inline: true } },
    },
});
