import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        // @schemastud/mainframe is a symlinked workspace sibling; without dedupe Vite would
        // resolve its `react` from schemastud's node_modules while our tests resolve React from
        // beam-mainframe's own — two React copies → "Invalid hook call". Dedupe pins one copy.
        dedupe: ['react', 'react-dom'],
    },
    test: {
        // The seam proof drives a live component tree (mode-swap under a stable host,
        // asserting state survives), so it needs a DOM — not the node default.
        environment: 'jsdom',
        globals: true,
    },
});
