#!/usr/bin/env node
// The beam workspaces, in pnpm-workspace.yaml's order (topological, leaves first). One reader for the root scripts,
// Storybook and the build-order test, so the list lives in one file.
//   node scripts/workspaces.mjs run <script>   runs <script> in each workspace that has it, one at a time, in order
//   node scripts/workspaces.mjs                prints the list
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** The `packages:` entries of pnpm-workspace.yaml: plain directory names, one per `  - name` line. */
export function workspaces() {
    const lines = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8').split('\n');
    const start = lines.findIndex((line) => line === 'packages:');
    if (start < 0) throw new Error('pnpm-workspace.yaml: no packages: list');
    const list = [];
    for (const line of lines.slice(start + 1)) {
        if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
        const match = /^  - ([a-z0-9][a-z0-9-]*)$/.exec(line);
        if (!match) break;
        list.push(match[1]);
    }
    if (list.length === 0) throw new Error('pnpm-workspace.yaml: the packages: list is empty');
    return list;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [command, script] = process.argv.slice(2);
    if (command === undefined) {
        console.log(workspaces().join('\n'));
    } else if (command === 'run' && script) {
        for (const dir of workspaces()) {
            const scripts = JSON.parse(readFileSync(resolve(root, dir, 'package.json'), 'utf8')).scripts ?? {};
            if (!scripts[script]) continue;
            console.log(`\n> ${dir}: pnpm run ${script}`);
            const result = spawnSync('pnpm', ['run', script], { cwd: resolve(root, dir), stdio: 'inherit' });
            if (result.status !== 0) process.exit(result.status ?? 1);
        }
    } else {
        console.error('usage: node scripts/workspaces.mjs [run <script>]');
        process.exit(2);
    }
}
