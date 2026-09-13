import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.WORKFLOW_STORY_URL ?? 'http://127.0.0.1:6019';
const output = process.env.WORKFLOW_SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [name, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/iframe.html?id=workflows-workflowactionform--repeated-hour&viewMode=story`);
        await page.getByRole('form', { name: 'Schedule workflow transition' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Schedule transition' }).isDisabled(), true);
        await page.getByRole('radio').nth(1).check();
        assert.equal(await page.getByRole('button', { name: 'Schedule transition' }).isEnabled(), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name} overflow`);
        if (output) await page.screenshot({ path: `${output}/workflow-action-${name}.png`, fullPage: true });
    }
    await page.goto(`${base}/iframe.html?id=workflows-workflowactionform--refused-save&viewMode=story`);
    await page.getByRole('button', { name: 'Schedule transition' }).click();
    await page.getByRole('alert').filter({ hasText: 'Permission to schedule' }).waitFor();
    assert.equal(await page.getByLabel('Date and time').inputValue(), '2026-09-15T09:30');
    assert.deepEqual(errors, []);
    console.log('Workflow action browser checks passed: desktop/mobile fold choice, no horizontal overflow, refused-save recovery, no page errors.');
} finally { await browser.close(); }
