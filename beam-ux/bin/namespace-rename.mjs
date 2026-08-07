#!/usr/bin/env node
/**
 * `beam-ux-namespace-rename` — standing, re-runnable CLI for the `App.<pivot>.*` package-namespace
 * rename (surgeon-audit-viability ticket 33). Rebuilds its lookup fresh from `generated.d.ts` every
 * run, so re-running after ANY future `->returns()`/`->streams()` DTO relocation between packages
 * (or any other change to the emitted namespace tree) only touches the delta — idempotent by
 * construction, not a one-shot migration script.
 *
 * Usage:
 *   echo '{"generatedDtsPath":"...","sourceRoot":"..."}' | node bin/namespace-rename.mjs scan
 *
 * Emits `{edits: [{file, old, new}]}` JSON on stdout — the same `{file, old, new}` shape surgeon's
 * generic `literal-rewrite`/`LiteralRewriteOperation`/`surgeon:rewrite` mechanism already applies
 * for ticket 08's SDK-hook migration and ticket 26's `->returns()` apply operation. Exit codes:
 * 0 ok · 1 usage/read error.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildNamespaceLookup, renameNamespaceReferences } from '../dist/surgeon.js';

function readStdin() {
    return new Promise((resolve, reject) => {
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (c) => (buf += c));
        process.stdin.on('end', () => resolve(buf));
        process.stdin.on('error', reject);
    });
}

/** Every `.ts`/`.tsx` file under `root`, excluding `node_modules` and `excludePaths`. */
function walk(root, excludePaths) {
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
                if (name === 'node_modules') continue;
                visit(full);
            } else if ((name.endsWith('.ts') || name.endsWith('.tsx')) && !excludePaths.includes(full)) {
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

    const { generatedDtsPath, sourceRoot } = config;
    if (!generatedDtsPath || !sourceRoot) {
        process.stderr.write('config needs generatedDtsPath, sourceRoot\n');
        process.exit(1);
        return;
    }

    const lookup = buildNamespaceLookup(readFileSync(generatedDtsPath, 'utf8'));
    const files = walk(sourceRoot, [generatedDtsPath]);
    const edits = renameNamespaceReferences(files, lookup);

    process.stdout.write(JSON.stringify({ edits }));
}

main().catch((err) => {
    process.stderr.write(String(err?.stack ?? err) + '\n');
    process.exit(1);
});
