// Shared Playwright launcher for the beam-workflows verify scripts.
//
// WHY --password-store=basic: the bundled chrome-headless-shell is ad-hoc signed, so on launch it
// reads the macOS "Chromium Safe Storage" login-keychain item to unlock its profile encryption.
// That ad-hoc identity isn't on the item's ACL (and its hash changes with every Chromium build),
// so macOS pops a GUI keychain dialog that BLOCKS the headless run until someone clicks it on the
// host. --password-store=basic uses an in-memory store instead: no keychain read, no prompt.
// Automation never needs OS-encrypted cookie storage.
import { chromium } from 'playwright';

/**
 * Launch headless Chromium for a verify script. Defaults to headless + the keychain-free password
 * store; any extra Playwright launch options pass through, and extra args compose with the default.
 */
export function launchBrowser(options = {}) {
    const { args = [], ...rest } = options;
    return chromium.launch({ headless: true, ...rest, args: ['--password-store=basic', ...args] });
}
