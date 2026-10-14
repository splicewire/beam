#!/usr/bin/env node
// Export a built workspace as a package-root Git commit; never publish to npm or push refs.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [workspace, version] = process.argv.slice(2);
if (!['beam-market', 'beam-commerce'].includes(workspace) || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  throw new Error('Usage: node scripts/export-private-release.mjs beam-market|beam-commerce x.y.z');
}
const run = (command, args, options = {}) => execFileSync(command, args, {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options,
}).trim();
const git = (...args) => run('git', args);
if (git('status', '--porcelain')) throw new Error('Release source must be committed and clean.');
const source = git('rev-parse', 'HEAD');
const tag = `release/${workspace}/${source.slice(0, 12)}`;
if (git('tag', '--list', tag) || git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`)) {
  throw new Error(`Refusing to replace existing ${tag}`);
}
const packageRoot = join(root, workspace);
for (const file of ['dist/index.js', 'dist/index.d.ts']) {
  if (!existsSync(join(packageRoot, file))) throw new Error(`Build ${workspace} first: missing ${file}`);
}
const work = mkdtempSync(join(tmpdir(), 'beam-private-release-'));
const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', work], { cwd: packageRoot }));
run('tar', ['-xzf', join(work, packed[0].filename), '-C', work]);
const exported = join(work, 'package');
const manifestPath = join(exported, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.name !== `@splicewire/${workspace}`) throw new Error('Unexpected package identity');
manifest.version = version;
manifest.private = true;
delete manifest.publishConfig;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
writeFileSync(join(exported, 'RELEASE.json'), JSON.stringify({
  package: manifest.name, version, sourceRepository: 'https://github.com/splicewire/beam.git',
  sourceCommit: source, sourcePackageTree: git('rev-parse', `${source}:${workspace}`),
  sourceLockSha256: digest(join(root, 'package-lock.json')),
  node: process.version, npm: run('npm', ['--version']),
  dist: { 'index.js': digest(join(exported, 'dist/index.js')), 'index.d.ts': digest(join(exported, 'dist/index.d.ts')) },
}, null, 2) + '\n');
// A private index leaves the source checkout's index, branch and files untouched.
const env = { ...process.env, GIT_INDEX_FILE: join(work, 'index') };
run('git', ['read-tree', '--empty'], { env });
function addFiles(dir, prefix = '') {
  for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name), relative = prefix + name;
    if (statSync(file).isDirectory()) addFiles(file, relative + '/');
    else {
      const blob = run('git', ['hash-object', '-w', file]);
      run('git', ['update-index', '--add', '--cacheinfo', '100644', blob, relative], { env });
    }
  }
}
addFiles(exported);
const tree = run('git', ['write-tree'], { env });
const commit = run('git', ['commit-tree', tree, '-p', source], {
  input: `release: ${manifest.name} ${version} built package-root export\n\nSource ${source}:${workspace}; tag ${tag}.\nSource package content is unchanged; export-only version/private metadata and built dist.\n`,
});
git('tag', tag, commit);
console.log(JSON.stringify({ package: manifest.name, source, tree, commit, tag,
  specifier: `git+https://github.com/splicewire/beam.git#${commit}`, work }, null, 2));
