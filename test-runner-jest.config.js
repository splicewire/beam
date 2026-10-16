import { getJestConfig } from '@storybook/test-runner';

// The default Storybook test-runner Jest config (jest-playwright environment + the VR snapshot wiring).
const testRunnerConfig = getJestConfig();

/**
 * The Storybook test-runner (the G6 built-package proof path, `npm run test-storybook`) launches
 * Chromium through jest-playwright. With no explicit launchOptions the ad-hoc-signed
 * chrome-headless-shell reads the macOS "Chromium Safe Storage" login-keychain item for profile
 * encryption, so macOS pops a GUI dialog that BLOCKS the headless run on the host.
 * --password-store=basic uses an in-memory store instead: no keychain read, no prompt. Same fix as
 * beam-workflows/scripts/_browser.mjs — see AGENTS.md "Browser verify scripts". We deep-merge so the
 * default jest-playwright options (browsers / collectCoverage / exitOnPageError) are preserved.
 *
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
    ...testRunnerConfig,
    testEnvironmentOptions: {
        ...testRunnerConfig.testEnvironmentOptions,
        'jest-playwright': {
            ...testRunnerConfig.testEnvironmentOptions?.['jest-playwright'],
            launchOptions: {
                ...testRunnerConfig.testEnvironmentOptions?.['jest-playwright']?.launchOptions,
                args: [
                    '--password-store=basic',
                    ...(testRunnerConfig.testEnvironmentOptions?.['jest-playwright']?.launchOptions?.args ?? []),
                ],
            },
        },
    },
};
