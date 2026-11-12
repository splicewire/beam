import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const room = mkdtempSync(join(tmpdir(), 'beam-public-contract-'));
console.log(`Independent public contract room: ${room}`);
function run(command, args, cwd = room) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, NODE_PATH: '' } });
    assert.ifError(result.error);
    return result;
}
function succeed(command, args, cwd) {
    const result = run(command, args, cwd);
    assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result;
}

mkdirSync(join(room, 'archives'));
const packed = succeed('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', join(room, 'archives')], source);
const archive = JSON.parse(packed.stdout)[0].filename;
writeFileSync(join(room, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
// Install into the fresh room. Never borrow this workspace's node_modules or private bridge.
succeed('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false',
    join(room, 'archives', archive), 'typescript@5.9.3']);
assert.equal(existsSync(join(room, 'node_modules/@splicewire/_resources')), false);
const installed = join(room, 'node_modules/@splicewire/beam-resources');
for (const file of readdirSync(join(installed, 'types'))) {
    if (file.endsWith('.d.ts')) {
        assert.doesNotMatch(readFileSync(join(installed, 'types', file), 'utf8'), /@splicewire\/_resources|Splicewire[.\\]Tower/);
    }
}
const contracts = readFileSync(join(source, 'checks/contracts.ts'), 'utf8')
    .replaceAll("'../types/", "'@splicewire/beam-resources/types/");
writeFileSync(join(room, 'contracts.ts'), contracts);
writeFileSync(join(room, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, skipLibCheck: false, noEmit: true, types: [], module: 'NodeNext', moduleResolution: 'NodeNext' },
    files: ['contracts.ts'],
}));
const tsc = ['node_modules/typescript/bin/tsc', '--noEmit'];
succeed(process.execPath, tsc);

// Each control mutates only its own installed copy, then restores it before the next check.
for (const [file, broken, diagnostic] of [
    ['intake.d.ts', null, 'Cannot find module'],
    ['intake.d.ts', '', 'has no exported member|is not a module'],
    ['workflows.d.ts', 'export {};\n', 'has no exported member'],
    ['workflows.d.ts', 'export type MissingOwner = Splicewire.Tower.Data.PrincipalKindData;\n', 'Cannot find namespace'],
]) {
    const target = join(installed, 'types', file);
    const original = readFileSync(target, 'utf8');
    try {
        if (broken === null) renameSync(target, target + '.missing-control');
        else writeFileSync(target, broken);
        const result = run(process.execPath, tsc);
        assert.notEqual(result.status, 0, `Broken ${file} unexpectedly compiled`);
        assert.match(result.stdout + result.stderr, new RegExp(diagnostic));
    } finally {
        if (broken === null) renameSync(target + '.missing-control', target);
        else writeFileSync(target, original);
    }
}
succeed(process.execPath, tsc);
console.log('Public DTO consumer passed; missing/empty intake, missing workflow exports and dangling Tower controls failed as required.');
