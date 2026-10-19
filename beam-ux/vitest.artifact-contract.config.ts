import { mergeConfig } from 'vitest/config';
import config from './vitest.config.js';

// Cross-repository gate: intentionally requires the real PHP compiler, never a cached fixture.
export default mergeConfig(config, {
    test: { include: ['src/site/*.contract.tsx'] },
});
