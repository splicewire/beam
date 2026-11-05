// Browser-only regression for inline-size container intrinsic sizing. jsdom cannot measure layout.
// The host reproduces the shrinkable FiveRegion canvas slot at a 390px viewport; the real widget
// CSS rule is read from canvas/css.ts so this catches a missing fill-width declaration.
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const cssSource = await readFile(new URL('../src/canvas/css.ts', import.meta.url), 'utf8');
const widgetRule = cssSource.match(/\.ve-canvas-widget\{[^}]*\}/)?.[0];
if (!widgetRule) throw new Error('Could not find the .ve-canvas-widget rule in canvas/css.ts');

const browser = await chromium.launch({headless: true, args: ['--password-store=basic']});
try {
    const page = await browser.newPage({viewport: {width: 390, height: 800}});
    await page.setContent(`<!doctype html>
        <style>
            * { box-sizing: border-box }
            body { margin: 0 }
            .host { width: 390px; max-width: 100% }
            .shell { display: flex; width: 100%; min-width: 0 }
            .sidebar { flex: 0 0 180px }
            .canvas-region { display: flex; flex: 1 1 auto; min-width: 0 }
            .ve-canvas-widget { container-type: inline-size; max-width: 100%; ${widgetRule.slice('.ve-canvas-widget{'.length, -1)} }
            .ve-canvas { display: flex; flex: 1 1 auto; min-width: 0 }
        </style>
        <main class="host" aria-label="390px host">
            <div class="shell">
                <aside class="sidebar" aria-hidden="true"></aside>
                <section class="canvas-region" aria-label="FiveRegion canvas region">
                    <div class="ve-canvas-widget"><div class="ve-canvas">Canvas</div></div>
                </section>
            </div>
        </main>`);

    const boxes = await page.evaluate(() => {
        const width = (selector) => document.querySelector(selector).getBoundingClientRect().width;
        return {
            viewport: window.innerWidth,
            host: width('.host'),
            region: width('.canvas-region'),
            widget: width('.ve-canvas-widget'),
            canvas: width('.ve-canvas'),
        };
    });
    console.log(JSON.stringify(boxes));
    if (boxes.viewport !== 390 || boxes.host !== 390) throw new Error('Regression fixture is not a 390px host');
    if (boxes.widget <= 0 || boxes.canvas <= 0) throw new Error('Canvas collapsed at 390px inside the shrinkable flex host');
} finally {
    await browser.close();
}
