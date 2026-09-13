import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.WORKFLOW_STORY_URL ?? 'http://localhost:6019';
const api = 'http://127.0.0.1:8767/api/beam/calendar-actions';
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const reset = await page.request.post(`${api}/fixture-transition`, { data: { transition: 'unpublish' } });
    assert.equal(reset.ok(), true);
    await page.goto(`${base}/iframe.html?id=workflows-workflowactionstandalone--live-fixture&viewMode=story`);
    await page.getByRole('button', { name: 'Schedule transition' }).waitFor();
    const scheduledResponse = page.waitForResponse((response) => response.url() === `${api}/schedule`);
    await page.getByRole('button', { name: 'Schedule transition' }).click();
    const scheduled = await scheduledResponse;
    assert.equal(scheduled.ok(), true, await scheduled.text());
    const action = (await scheduled.json()).data;
    assert.equal(action.payload.subject_kind, 'article');
    assert.equal(action.status, 'pending');
    await page.getByText('Attempt 1: Pending').waitFor();
    await page.reload();
    await page.getByText('Attempt 1: Pending').waitFor();
    const executed = await page.request.post(`${api}/${action.id}/fixture-run`, { data: { due_at: '2030-09-15T13:31:00Z' } });
    assert.equal(executed.ok(), true, await executed.text());
    assert.equal((await executed.json()).data.status, 'applied');
    await page.getByRole('button', { name: 'Refresh outcome' }).click();
    await page.getByText('Attempt 1: Applied').waitFor();
    await page.reload();
    await page.getByText('Attempt 1: Applied').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.WORKFLOW_SCREENSHOTS) await page.screenshot({ path: `${process.env.WORKFLOW_SCREENSHOTS}/workflow-action-standalone.png`, fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Standalone browser passed: actual mounted schedule/read/execute, article subject, durable reload, applied history, mobile no overflow/page errors.');
} finally { await browser.close(); }
