import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

type Viewport = { width: number; height: number };
type ViewportGlobal = { value?: string; isRotated?: boolean };
type ViewportPage = {
    setViewportSize: (viewport: Viewport) => Promise<void>;
    evaluate: (read: () => Viewport) => Promise<Viewport>;
};

/** Storybook 10 globals use the same named viewport mapping in the UI and runner. */
export async function applyStoryViewport(page: ViewportPage, requested?: ViewportGlobal) {
    const definition = Object.entries(MINIMAL_VIEWPORTS).find(([name]) => name === requested?.value)?.[1];
    const size = definition
        ? { width: Number.parseInt(definition.styles.width), height: Number.parseInt(definition.styles.height) }
        : { width: 1280, height: 720 };
    const viewport = definition && requested?.isRotated
        ? { width: size.height, height: size.width }
        : size;
    await page.setViewportSize(viewport);
    const actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    if (actual.width !== viewport.width || actual.height !== viewport.height) {
        throw new Error(`Story viewport mismatch: expected ${viewport.width}x${viewport.height}, got ${actual.width}x${actual.height}`);
    }
}
