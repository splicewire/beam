#!/usr/bin/env node
/**
 * `beam-ux-sdk-hook-migration` — the Node CLI `Splicewire\Beam\Surgeon\SdkHookMigrationAudit` shells to
 * (`SdkHookMigrationBridge`, Symfony Process). Lossless TS/TSX parsing needs the JS toolchain (recast +
 * babel), so the scan runs HERE; PHP reports the result through the ordinary `Finding`/`FixableFinding`
 * channel and applies fixes via surgeon's existing generic `literal-rewrite` mechanism.
 *
 * Usage:
 *   echo '{"hooksDir":"...","apiRoot":"...","importerRoot":"...","excludeDirNames":["credits"],"routesManifestPath":"..."}' \
 *     | node bin/sdk-hook-migration.mjs scan
 *
 * Walks `apiRoot` for files literally named `api.ts` (the per-domain convention) to find hand-written
 * `useX` wrappers a generated hook in `hooksDir` already covers, and `importerRoot` (a superset of
 * `apiRoot` — every source file that could plausibly import one) for the import sites to repoint.
 * Directories named in `excludeDirNames` are skipped entirely, in both roles.
 *
 * `routesManifestPath` — optional, points at `ui/src/generated/routes.ts` (or wherever a host's
 * `defaults` route-name→path export lands). When given, its `defaults` object additionally recognizes
 * call sites that hand-write a plain string/template-literal path instead of `route('name')` (v2 — see
 * `sdkHookMigration.ts`'s module docblock). Missing/unreadable is tolerated — the scan just falls back
 * to the v1 `route('name')`-only shape rather than failing.
 *
 * Emits `{candidates, exceptions}` JSON on stdout. Exit codes: 0 ok · 1 usage/read error.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { extractRouteDefaultsFromSource, scan } from '../dist/surgeon.js';

function readStdin() {
    return new Promise((resolve, reject) => {
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (c) => (buf += c));
        process.stdin.on('end', () => resolve(buf));
        process.stdin.on('error', reject);
    });
}

/** Every file under `root` whose basename matches `predicate`, skipping `excludeDirNames` dirs. */
function walk(root, excludeDirNames, predicate) {
    const out = {};
    const visit = (dir) => {
        let entries;
        try {
            entries = readdirSync(dir);
        } catch {
            return;
        }
        for (const name of entries) {
            const full = join(dir, name);
            const stat = statSync(full);
            if (stat.isDirectory()) {
                if (name === 'node_modules' || excludeDirNames.includes(name)) continue;
                visit(full);
            } else if (predicate(name)) {
                out[full] = readFileSync(full, 'utf8');
            }
        }
    };
    visit(root);
    return out;
}

async function main() {
    const [command] = process.argv.slice(2);
    if (command !== 'scan') {
        process.stderr.write(`unknown command: ${command ?? '(none)'} — expected scan\n`);
        process.exit(1);
    }

    const input = await readStdin();
    let config;
    try {
        config = JSON.parse(input);
    } catch (err) {
        process.stderr.write(`invalid config JSON on stdin: ${String(err?.message ?? err)}\n`);
        process.exit(1);
        return;
    }

    const { hooksDir, apiRoot, importerRoot, excludeDirNames = [], routesManifestPath } = config;
    if (!hooksDir || !apiRoot || !importerRoot) {
        process.stderr.write('config needs hooksDir, apiRoot, importerRoot\n');
        process.exit(1);
        return;
    }

    const hookFiles = walk(hooksDir, [], (n) => n.endsWith('.ts'));
    const apiFiles = walk(apiRoot, excludeDirNames, (n) => n === 'api.ts');
    const importerSearchFiles = walk(importerRoot, excludeDirNames, (n) => n.endsWith('.ts') || n.endsWith('.tsx'));

    let routeDefaults = {};
    if (routesManifestPath) {
        try {
            routeDefaults = extractRouteDefaultsFromSource(readFileSync(routesManifestPath, 'utf8'));
        } catch {
            // Missing/unreadable manifest — degrade to the v1 route('name')-only shape rather than fail.
        }
    }

    const report = scan(hookFiles, apiFiles, importerSearchFiles, routeDefaults);
    process.stdout.write(JSON.stringify(report));
}

main().catch((err) => {
    process.stderr.write(String(err?.stack ?? err) + '\n');
    process.exit(1);
});
