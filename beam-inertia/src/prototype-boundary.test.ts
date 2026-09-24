import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * `@splicewire/beam-ux-prototype`'s `beam-verify-prototype-boundary` fails a host's production build
 * when any emitted file contains the bare `_prototype` token. This package is in every Beam host's
 * production bundle, so a `_prototype` literal in its shipped source fails that gate in every host
 * even though no prototype module is included. The prototype host page declares its own chrome.
 */
const MARKER = '_prototype';
const src = fileURLToPath(new URL('.', import.meta.url));

function shippedSources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return shippedSources(path);
        if (!/\.tsx?$/.test(entry.name) || /\.(test|stories)\.tsx?$/.test(entry.name)) return [];
        return [path];
    });
}

describe('production prototype boundary', () => {
    it('ships no source that names the prototype marker', () => {
        const files = shippedSources(src);
        // Guard against an empty walk reading as a pass.
        expect(files.length).toBeGreaterThan(10);
        expect(files.some((file) => file.endsWith('index.tsx'))).toBe(true);

        const offenders = files.filter((file) => readFileSync(file, 'utf8').includes(MARKER));
        expect(offenders).toEqual([]);
    });
});
