// Real Chromium layout regression; no host/DB or backend-authority claim.
// Run from beam-ux: node scripts/verify-page-settings.mjs
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { launchBrowser } from '../../beam-workflows/scripts/_browser.mjs';
const root = fileURLToPath(new URL('./page-settings-fixture/', import.meta.url));
const out = process.env.PAGE_SETTINGS_EVIDENCE;
if (out) await mkdir(out, { recursive: true });
const server = await createServer({
    root, configFile: fileURLToPath(new URL('../vitest.config.ts', import.meta.url)),
    esbuild: { jsx: 'automatic' },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [resolve(root, '../../../..')] } },
});
let browser;
const observations = [];
try {
    await server.listen();
    browser = await launchBrowser({ args: ['--use-mock-keychain'] });
    const address = server.httpServer.address();
    for (const viewport of [{ width: 1280, height: 720 }, { width: 800, height: 400 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${address.port}`);
        await page.getByRole('button', { name: 'Enter editor' }).click();
        const title = page.getByLabel('Title', { exact: true });
        await title.waitFor({ state: 'attached' });
        const summary = page.locator('summary').filter({ hasText: 'Page settings' });
        await summary.click();
        const measure = async phase => {
            const geometry = await title.evaluate(input => {
                const details = input.closest('details');
                const panel = input.closest('[role="region"]') ?? details;
                const summary = details.querySelector('summary');
                const bar = details.closest('.pe-bar');
                const rect = el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
                const point = panel.getBoundingClientRect();
                return { panel: rect(panel), summary: rect(summary), bar: rect(bar),
                    panelOnTop: panel.contains(document.elementFromPoint(point.left + 20, point.top + 20)) };
            });
            observations.push({ viewport, phase, ...geometry });
            if (out) await page.screenshot({ path: resolve(out, `${viewport.width}-${phase}.png`) });
            assert.ok(geometry.panel.top >= geometry.bar.bottom, JSON.stringify(geometry));
            assert.ok(geometry.panel.bottom <= viewport.height, 'settings must fit the viewport with internal scrolling');
            assert.ok(geometry.summary.top >= 0 && geometry.summary.bottom <= geometry.bar.bottom, 'summary remains in toolbar');
            assert.ok(geometry.panelOnTop, 'fields must be above the Insert panel');
        };
        await measure('expanded');
        // All controls remain reachable inside the bounded scrolling panel.
        await page.getByLabel('Page type', { exact: true }).selectOption('Article');
        await title.fill('Unsaved');
        await summary.click();
        await page.getByRole('button', { name: 'Save draft', exact: true }).click();
        // Scope to the real conflict alert so an overlay cannot be bypassed programmatically.
        await page.getByRole('alertdialog', { name: 'Save conflict' }).getByRole('button', { name: 'Reload theirs' }).click();
        await page.waitForFunction(() => document.querySelector('input')?.value === 'Reloaded');
        await summary.click();
        await measure('reloaded');
        await summary.click();
        assert.equal(await summary.evaluate(el => el.parentElement.open), false);
        await summary.click();
        await title.fill('Editable after reload');
        assert.equal(await title.inputValue(), 'Editable after reload');
        assert.deepEqual(errors, []);
        await page.close();
    }
    console.log('Page settings: actual expanded/reloaded geometry, scroll access, close/reopen and edit pass at both viewports.');
} finally {
    if (out) await writeFile(resolve(out, 'geometry.json'), JSON.stringify(observations, null, 2) + '\n');
    await browser?.close();
    await server.close();
}
