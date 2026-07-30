#!/usr/bin/env node
/**
 * Production-build boundary assertion — the packaged CLI (rushing-prototype / ADR-0116).
 *
 * Turns the "prototypes never ship" guarantee into an ASSERTION rather than an assumption. Runs
 * the host's real production build and fails loudly if the output contains any throwaway prototype
 * code — catching the two silent regressions that matter:
 *
 *   1. A shipped module importing a prototype (the DEV-only `_prototype/` code gets pulled into a
 *      production chunk).
 *   2. The `import.meta.env.DEV` guard around `createPrototypeRoutes(...)` in the host router being
 *      removed (the whole DEV route spread, including `/_prototype/<slug>`, ships).
 *
 * It couples ONLY to the build output — the highest possible seam — never to how any individual
 * prototype is written. The invariant: a production bundle must contain none of the forbidden
 * tokens (by default the `_prototype` module token and the `/_prototype/` route string).
 *
 * This is the repo-agnostic lift of splicewire-app's former `ui/scripts/assert-prod-boundary.mjs`:
 * the build invocation, recursive walk, and offender report are verbatim; only the output-dir and
 * the token strings are now parameters.
 *
 * Usage (run from the host UI package root, e.g. splicewire-app `ui/`):
 *   verify-prototype-boundary                       # build, then assert
 *   verify-prototype-boundary --no-build            # assert against existing out-dir
 *   verify-prototype-boundary --out-dir ../public/ui
 *   verify-prototype-boundary --tokens /_prototype/,_prototype
 *   verify-prototype-boundary --build-command "npm run build"
 *
 * Defaults:
 *   --out-dir      : the host `package.json` `prototype.outDir` key (required if not passed)
 *   --tokens       : /_prototype/,_prototype
 *   --build-command: npm run build
 * Paths resolve relative to the current working directory (the host package root).
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const cwd = process.cwd();

/** Minimal `--flag value` / `--flag` parser over process.argv. */
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('--')) continue;
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
            out[key] = true; // boolean flag
        } else {
            out[key] = next;
            i++;
        }
    }
    return out;
}

const args = parseArgs(process.argv.slice(2));

function fail(message) {
    console.error(`\n\x1b[31m✗ prototype-boundary: ${message}\x1b[0m\n`);
    process.exit(1);
}

/** Read `prototype.outDir` from the host package.json, if present. */
function outDirFromPackageJson() {
    try {
        const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
        return pkg.prototype?.outDir;
    } catch {
        return undefined;
    }
}

const outDirArg = typeof args['out-dir'] === 'string' ? args['out-dir'] : outDirFromPackageJson();
if (!outDirArg) {
    fail(
        'no --out-dir given and no `prototype.outDir` in package.json. Pass --out-dir <path> or add ' +
            '{ "prototype": { "outDir": "../public/ui" } } to the host package.json.',
    );
}
const outDir = resolve(cwd, outDirArg);

// Tokens that only ever appear in output if throwaway prototype code shipped. `_prototype` catches
// the module path / chunk name; `/_prototype/` catches the route path literal. The second is a
// subset of the first but is asserted separately so a failure names precisely which regression fired.
const tokens =
    typeof args.tokens === 'string'
        ? args.tokens.split(',').map((t) => t.trim()).filter(Boolean)
        : ['/_prototype/', '_prototype'];

const buildCommand = typeof args['build-command'] === 'string' ? args['build-command'] : 'npm run build';
const shouldBuild = !args['no-build'];

if (shouldBuild) {
    console.log(`prototype-boundary: running production build (${buildCommand})...`);
    try {
        execSync(buildCommand, { cwd, stdio: 'inherit' });
    } catch {
        fail('production build failed — cannot assert the boundary');
    }
}

let outStat;
try {
    outStat = statSync(outDir);
} catch {
    fail(`build output not found at ${outDir} (run without --no-build to build first)`);
}
if (!outStat.isDirectory()) fail(`${outDir} is not a directory`);

/** Recursively collect every file under a directory. */
function walk(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (entry.isFile()) files.push(full);
    }
    return files;
}

const offenders = [];
for (const file of walk(outDir)) {
    // Read as text; binary assets (fonts, images) simply won't contain the token.
    let text;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        continue;
    }
    const hits = tokens.filter((token) => text.includes(token));
    if (hits.length) offenders.push({ file: file.replace(`${outDir}/`, ''), hits });
}

if (offenders.length) {
    console.error('\n\x1b[31m✗ prototype code leaked into the production bundle:\x1b[0m');
    for (const { file, hits } of offenders) {
        console.error(`  ${file} — contains ${hits.map((h) => `"${h}"`).join(', ')}`);
    }
    fail(
        'a shipped module imports a prototype, or the import.meta.env.DEV guard around the ' +
            'prototype routes was removed. Prototype code must never reach production.',
    );
}

console.log(
    `\x1b[32m✓ prototype-boundary: ${outDirArg} is clean — no ${tokens
        .map((t) => `"${t}"`)
        .join(' / ')} tokens in the production bundle.\x1b[0m`,
);
