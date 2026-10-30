import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { canonicalCommerceInput, commerceStoryFiles, workspaceStoryPatterns } from './canonical-commerce-stories.mjs';

function fixture(t) {
    const root = realpathSync(mkdtempSync(resolve(tmpdir(), 'u21-commerce-input-')));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(resolve(root, 'src')); mkdirSync(resolve(root, 'dist'));
    writeFileSync(resolve(root, 'package.json'), JSON.stringify({ name: '@splicewire/beam-commerce', repository: { url: 'https://github.com/splicewire/laravel-beam-commerce.git', directory: 'js/beam-commerce' } }));
    const files = [...commerceStoryFiles, 'dist/index.js', 'dist/index.d.ts', 'dist/index.js.map'];
    for (const file of files) writeFileSync(resolve(root, file), file);
    const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git('init', '-q'); git('add', 'src', 'package.json');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'selected canonical fixture');
    const selection = { packageRoot: '.', sourceCommit: git('rev-parse', 'HEAD'), sha256: Object.fromEntries(files.map((file) => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')])) };
    const path = resolve(root, 'selection.json');
    const save = () => writeFileSync(path, JSON.stringify(selection));
    save(); return { root, path, selection, save };
}

test('keeps other workspace patterns and replaces exactly the three commerce file inputs', (t) => {
    const f = fixture(t);
    assert.deepEqual(workspaceStoryPatterns(['beam-ux', 'beam-commerce', 'beam-docs']), ['../beam-ux/src/**/*.stories.@(ts|tsx|mdx)', '../beam-docs/src/**/*.stories.@(ts|tsx|mdx)']);
    assert.deepEqual(canonicalCommerceInput(f.path).stories, commerceStoryFiles.map((file) => resolve(f.root, file)));
});
test('missing explicit selection refuses instead of falling back to mirror stories', () => {
    assert.throws(() => canonicalCommerceInput('/not-an-owned-selection.json'), /Select canonical commerce/);
});
test('a different source commit refuses', (t) => {
    const f = fixture(t); f.selection.sourceCommit = '0'.repeat(40); f.save();
    assert.throws(() => canonicalCommerceInput(f.path), /HEAD does not match/);
});
test('a missing selected story refuses', (t) => {
    const f = fixture(t); delete f.selection.sha256[commerceStoryFiles[0]]; f.save();
    assert.throws(() => canonicalCommerceInput(f.path), /exactly the three/);
});
test('a changed built artifact refuses', (t) => {
    const f = fixture(t); writeFileSync(resolve(f.root, 'dist/index.js'), 'different artifact');
    assert.throws(() => canonicalCommerceInput(f.path), /hash mismatch: dist/);
});
test('changed canonical source refuses even if someone changes a story hash in the manifest', (t) => {
    const f = fixture(t); writeFileSync(resolve(f.root, commerceStoryFiles[0]), 'uncommitted story');
    assert.throws(() => canonicalCommerceInput(f.path), /unrecorded changes/);
});

test('a mirror package owner refuses even with valid selected files', (t) => {
    const f = fixture(t); const path = resolve(f.root, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8')); pkg.repository.url = 'https://github.com/splicewire/beam.git';
    writeFileSync(path, JSON.stringify(pkg));
    assert.throws(() => canonicalCommerceInput(f.path), /canonical laravel-beam-commerce/);
});
