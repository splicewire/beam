import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// A js-release cut pins every first-party entry under `dependencies` to that dependency's
// NEWEST release, which then lands in every consumer's install. So a first-party package
// that src only imports for types belongs in peerDependencies (a range) + devDependencies.
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const firstParty = (name: string) => name.startsWith('@splicewire/') || name.startsWith('@schemastud/');

function* sources(dir: string): Generator<string> {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) yield* sources(path);
        else if (/\.tsx?$/.test(path) && !/\.(test|stories)\.tsx?$/.test(path)) yield readFileSync(path, 'utf8');
    }
}
const src = [...sources(join(root, 'src'))].join('\n');

it('every first-party runtime dependency has a runtime (non-type) import in src', () => {
    const typeOnly = Object.keys(manifest.dependencies ?? {})
        .filter(firstParty)
        .filter((dep) => {
            const spec = dep.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
            // Statements only (line-anchored, so prose in comments never counts); `import type` /
            // `export type` are type-only; a dynamic import() is a runtime use.
            const statement = new RegExp(`^\\s*(?:import|export)\\s+(type\\s+)?[^;]*?from\\s+['"]${spec}(?:/[^'"]*)?['"]`, "gm");
            const dynamic = new RegExp(`\\bimport\\(\\s*['"]${spec}(?:/[^'"]*)?['"]`);
            const runtime = [...src.matchAll(statement)].some((m) => m[1] === undefined) || dynamic.test(src);
            return !runtime;
        });
    expect(typeOnly, 'type-only first-party imports must be peerDependencies + devDependencies, not dependencies').toEqual([]);
});
