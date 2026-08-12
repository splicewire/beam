#!/usr/bin/env node
/**
 * Static import-boundary gate (rehome-components §8b — the deny-list enforcer, ADR-0116 §7b). A
 * rehomed component is "portable" only if it reaches for NOTHING app-local. Twin of the gate in
 * @schemastud/ui, @splicewire/beam-accounts, @splicewire/beam-commerce.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const FORBIDDEN = [
    { re: /from\s+['"]@\//, why: "app-local '@/…' import" },
    { re: /import\s+['"]@\//, why: "app-local '@/…' side-effect import" },
    { re: /from\s+['"]sonner['"]/, why: 'direct toast lib (feedback is injected, not imported)' },
    { re: /from\s+['"]axios['"]/, why: 'transport lib (the client is injected, not imported)' },
    { re: /from\s+['"]ziggy-js['"]/, why: 'named-route resolution has no place in a portable component' },
    { re: /from\s+['"]@inertiajs\//, why: 'Inertia coupling' },
];

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) yield* walk(path);
        else if (/\.tsx?$/.test(path)) yield path;
    }
}

const violations = [];
for (const file of walk(SRC)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        for (const { re, why } of FORBIDDEN) {
            if (re.test(line)) {
                violations.push(`  ${file}:${i + 1} — ${why}\n    ${line.trim()}`);
            }
        }
    });
}

if (violations.length) {
    console.error('✗ import-boundary check FAILED — @splicewire/beam-market must stay host-agnostic:\n');
    console.error(violations.join('\n'));
    process.exit(1);
}
console.log('✓ import-boundary check passed — no forbidden imports in src/.');
