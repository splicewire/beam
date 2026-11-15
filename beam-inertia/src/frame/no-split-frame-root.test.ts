import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FRAME_MANIFEST_URL, FRAME_PREFIX } from './prefix';

/**
 * Guard (L36): this host talks to ONE Frame socket, `FRAME_PREFIX` (`./prefix`). A split root (the manifest on one Frame root and the
 * resources on another) is what taking frame's moved default did. So:
 *  - the kit is built with `prefix: FRAME_PREFIX` and the root realm's manifest is `FRAME_MANIFEST_URL`, derived from it;
 *  - no source file under `src/` names a path on a known Frame root OTHER than `FRAME_PREFIX` (a quoted string or a word that STARTS
 *    with it). Module specifiers (`../frame/x`, `@schemastud/frame/x`) and realm manifests (`/operator/frame/manifest`) are not roots.
 * When `FRAME_PREFIX` moves (ticket 10 / owner-review 16), the old root becomes the forbidden one and this test lists what to move.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url));
const KNOWN_ROOTS = ['/frame', '/stud/frame'];
const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const startsWithRoot = (root: string) => new RegExp(`(^|[\\s'"\`(])${`${root}/`.replace(/\//g, '\\/')}`);

function sources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sources(path);
        return SOURCE.test(entry.name) ? [path] : [];
    });
}

describe('one Frame socket root', () => {
    it('FRAME_PREFIX is a known root and the root manifest derives from it', () => {
        expect(KNOWN_ROOTS).toContain(FRAME_PREFIX);
        expect(FRAME_MANIFEST_URL).toBe(`${FRAME_PREFIX}/manifest`);
    });

    it('the kit is built on FRAME_PREFIX and the root realm reads FRAME_MANIFEST_URL', () => {
        expect(readFileSync(join(SRC, 'frame/kit.tsx'), 'utf8')).toMatch(/createFrameKit<FrameNav>\(\{\s*prefix: FRAME_PREFIX,/);
        expect(readFileSync(join(SRC, 'frame/realm.tsx'), 'utf8')).toMatch(/manifestUrl: FRAME_MANIFEST_URL,/);
    });

    it('the root pattern matches a path on a root, and nothing that only resembles one', () => {
        // Cases are built from the root values, so this file names no root path literally (the scan below reads it too).
        const [legacyRoot, studRoot] = KNOWN_ROOTS;
        const stud = startsWithRoot(studRoot);
        for (const bad of [`'${studRoot}/manifest'`, `" GET ${studRoot}/x"`, `fetch(${studRoot}/a)`]) expect(stud.test(bad), bad).toBe(true);
        const legacy = startsWithRoot(legacyRoot);
        for (const fine of [`'${studRoot}/manifest'`, `'..${legacyRoot}/manifest'`, `'@schemastud${legacyRoot}/session'`, `'/operator${legacyRoot}/manifest'`]) {
            expect(legacy.test(fine), fine).toBe(false);
        }
    });

    it('no source file under src/ names a path on another Frame root', () => {
        const forbidden = KNOWN_ROOTS.filter((root) => root !== FRAME_PREFIX).map(startsWithRoot);
        const hits = sources(SRC).flatMap((file) =>
            readFileSync(file, 'utf8')
                .split('\n')
                .flatMap((line, i) => (forbidden.some((re) => re.test(line)) ? [`${relative(SRC, file)}:${i + 1}: ${line.trim()}`] : [])),
        );
        expect(hits).toEqual([]);
    });
});
