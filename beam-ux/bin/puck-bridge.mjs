#!/usr/bin/env node
/**
 * `puck-bridge` — the Node CLI the PHP `splicewire:beam:ux-sync-from-disk` shells to (Symfony Process).
 *
 * Lossless JSX↔PuckData parsing needs the JS toolchain (recast + babel), so the reverse file→DB sync
 * leg runs HERE, not in PHP: PHP hands a page `.tsx` on stdin, this parses it back into a Puck `Data`
 * document and emits it as JSON on stdout. PHP then persists that Data through the StorageDriver as the
 * particle body (instead of the raw `['source' => …]` wrapping that treated a composed page as source).
 *
 * Usage:
 *   cat page.tsx | node bin/puck-bridge.mjs to-puck      # .tsx → Puck Data JSON
 *   cat data.json | node bin/puck-bridge.mjs to-tsx <slug> [blocksModule]   # Puck Data JSON → .tsx
 *
 * Exit codes: 0 ok · 1 usage/parse error · 2 no page-shaped root (caller falls back to raw source).
 */

import { blockDocToPuck, puckToTsx } from '../dist/blockdoc.js';

function readStdin() {
    return new Promise((resolve, reject) => {
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (c) => (buf += c));
        process.stdin.on('end', () => resolve(buf));
        process.stdin.on('error', reject);
    });
}

async function main() {
    const [command, ...rest] = process.argv.slice(2);
    const input = await readStdin();

    if (command === 'to-puck') {
        const data = blockDocToPuck(input);
        if (data === null) {
            process.stderr.write('no page-shaped root\n');
            process.exit(2);
        }
        process.stdout.write(JSON.stringify(data));
        return;
    }

    if (command === 'to-tsx') {
        const slug = rest[0];
        const blocksModule = rest[1];
        if (!slug) {
            process.stderr.write('to-tsx requires a slug argument\n');
            process.exit(1);
        }
        const data = JSON.parse(input);
        process.stdout.write(puckToTsx(data, slug, blocksModule));
        return;
    }

    process.stderr.write(`unknown command: ${command ?? '(none)'} — expected to-puck | to-tsx\n`);
    process.exit(1);
}

main().catch((err) => {
    process.stderr.write(String(err?.stack ?? err) + '\n');
    process.exit(1);
});
