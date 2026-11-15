// node scripts/no-split-frame-root.mutate.mjs (from beam-inertia): proves src/frame/no-split-frame-root.test.ts is load-bearing.
// Control: the guard passes on the tree as it is. Each mutant must turn it RED:
//  1. realm.tsx's default manifest goes to a literal on the OTHER root (the split this guard exists for);
//  2. a new source file under src/ fetches a resource on the other root;
//  3. kit.tsx stops passing prefix: FRAME_PREFIX (the kit would fall back to frame's own default).
// Every edited file is restored and the added file (a per-run name) removed afterwards. Not part of `pnpm test`.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const prefixSrc = readFileSync(join(pkg, 'src/frame/prefix.ts'), 'utf8');
const current = /FRAME_PREFIX = '([^']+)'/.exec(prefixSrc)[1];
const other = ['/frame', '/stud/frame'].find((root) => root !== current);
const vitest = () => spawnSync(join(pkg, 'node_modules/.bin/vitest'), ['run', 'src/frame/no-split-frame-root.test.ts'], { cwd: pkg, encoding: 'utf8' });
const verdict = (r) => (r.status === 0 ? 'GREEN' : /failed/.test(r.stdout + r.stderr) ? 'RED' : `ERROR (${r.status})`);
let ok = true;
const control = verdict(vitest());
console.log(`control (FRAME_PREFIX ${current}, other root ${other})  ${control}`);
if (control !== 'GREEN') ok = false;

const edit = (label, rel, from, to) => {
    const file = join(pkg, rel);
    const original = readFileSync(file, 'utf8');
    try {
        if (!original.includes(from)) throw new Error(`${label}: anchor missing`);
        writeFileSync(file, original.replace(from, to));
        const v = verdict(vitest());
        console.log(`${label}  ${v}`);
        if (v !== 'RED') ok = false;
    } finally {
        writeFileSync(file, original);
    }
};
edit('mutant 1 (realm default on the other root)', 'src/frame/realm.tsx', 'manifestUrl: FRAME_MANIFEST_URL,', `manifestUrl: '${other}/manifest',`);

const added = join(pkg, `src/frame/split-root-mutant-${process.pid}-${randomBytes(3).toString('hex')}.ts`);
try {
    writeFileSync(added, `export const split = () => fetch("${other}/resources/documents");\n`);
    const v = verdict(vitest());
    console.log(`mutant 2 (a new file fetching the other root)  ${v}`);
    if (v !== 'RED') ok = false;
} finally {
    rmSync(added, { force: true });
}

edit('mutant 3 (kit without an explicit prefix)', 'src/frame/kit.tsx', '            prefix: FRAME_PREFIX,\n', '');
console.log(ok ? 'MUTATION OK' : 'MUTATION FAILED');
process.exitCode = ok ? 0 : 1;
