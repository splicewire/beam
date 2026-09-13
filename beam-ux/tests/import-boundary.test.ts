// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const fixtures: string[] = [];
afterEach(() => { for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true }); });

function run(source: string, page = false) {
    const fixture = mkdtempSync(join(tmpdir(), 'beam-import-boundary-'));
    fixtures.push(fixture);
    mkdirSync(join(fixture, 'scripts'));
    mkdirSync(join(fixture, 'src', 'pages'), { recursive: true });
    copyFileSync(fileURLToPath(new URL('../scripts/check-imports.mjs', import.meta.url)), join(fixture, 'scripts', 'check-imports.mjs'));
    symlinkSync(dirname(dirname(require.resolve('typescript/package.json'))), join(fixture, 'node_modules'), 'dir');
    writeFileSync(join(fixture, 'src', page ? 'pages/example.tsx' : 'example.ts'), source);
    return spawnSync(process.execPath, ['scripts/check-imports.mjs'], { cwd: fixture, encoding: 'utf8', timeout: 10_000 });
}

describe('public import-boundary command', () => {
    it('accepts generated import text but rejects executing the same host import', () => {
        const statement = "import { useThing } from '@/generated/hooks/things';";
        expect(run(`const source = ${JSON.stringify(statement)};`).status).toBe(0);
        const actual = run(statement);
        expect(actual.status).toBe(1);
        expect(actual.stderr).toContain('app-local');
    });
    it.each([
        "type Payload = import('@/host').Payload;",
        "const load = () => import('@/host');",
        "export { thing } from '@/host';",
        "import {\n router as go\n} from '@inertiajs/react';",
    ])('rejects actual dependency syntax: %s', (source) => {
        expect(run(source).status).toBe(1);
    });
    it('permits only the page-map Head binding, including aliases', () => {
        expect(run("import { Head as PageHead } from '@inertiajs/react';", true).status).toBe(0);
        expect(run("import { Link as Head } from '@inertiajs/react';", true).status).toBe(1);
        expect(run("import { Head } from '@inertiajs/react';").status).toBe(1);
    });
    it('fails closed when source cannot be parsed', () => {
        expect(run('import {').status).toBe(1);
    });
});
