// Real Chromium: a closed style panel mounts its controls only when opened, and they read the block's CURRENT values.
// jsdom cannot prove this (no native <details>/<summary> activation or focus move). No host/DB claim.
// Run from beam-ux: node scripts/verify-block-inspector.mjs (as verify-page-settings.mjs).
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { launchBrowser } from '../../beam-workflows/scripts/_browser.mjs';
const root = fileURLToPath(new URL('./block-inspector-fixture/', import.meta.url));
const server = await createServer({
    root, configFile: fileURLToPath(new URL('../vitest.config.ts', import.meta.url)),
    esbuild: { jsx: 'automatic' },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [resolve(root, '../../../..')] } },
});
let browser;
try {
    await server.listen();
    browser = await launchBrowser({ args: ['--use-mock-keychain'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await page.getByRole('button', { name: 'Select node' }).click();
    const summary = page.locator('[data-frame-region="inspector"] summary').filter({ hasText: /^Text$/ });
    await summary.waitFor();
    const isOpen = () => summary.evaluate(el => el.parentElement.open);
    const controls = () => summary.evaluate(el => el.parentElement.querySelectorAll('input, select, button').length);
    const colour = page.getByLabel('color', { exact: true });
    const size = page.getByLabel('font-size', { exact: true });
    assert.equal(await isOpen(), false);
    assert.equal(await controls(), 0, 'a closed panel mounts no controls');

    // The block changes while its panel is closed; the controls the open mounts must read the new value.
    await page.getByRole('button', { name: 'Recolour the block' }).click();
    await summary.click();
    await colour.waitFor();
    assert.equal(await isOpen(), true);
    assert.ok(await controls() > 0);
    assert.equal(await colour.inputValue(), '#0000ff');
    assert.equal(await page.getByLabel('color colour', { exact: true }).inputValue(), '#0000ff');

    // Typed text is written when the summary click takes focus, then closing unmounts and reopening reads it back.
    await size.fill('2rem');
    await summary.click();
    await page.waitForFunction(() => document.querySelector('[data-testid="attrs"]')?.textContent?.includes('2rem'));
    assert.equal(await isOpen(), false);
    assert.equal(await controls(), 0, 'closing unmounts the controls');
    await summary.click();
    await size.waitFor();
    assert.equal(await size.inputValue(), '2rem');
    assert.equal(await colour.inputValue(), '#0000ff');
    assert.deepEqual(errors, []);
    console.log('Block inspector: a closed panel mounts nothing; opened it reads current values; an edit survives close and reopen.');
} finally {
    await browser?.close();
    await server.close();
}
