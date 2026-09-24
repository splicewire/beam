import { defineConfig } from 'vitest/config';

// Static-markup tests (react-dom/server): the shell's structure and classes, no DOM needed.
export default defineConfig({
    test: { environment: 'node', include: ['tests/**/*.test.tsx'] },
});
