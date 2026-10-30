import { readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const commerceStoryFiles = [
    'src/auto-reload-config-card.stories.tsx',
    'src/credits-surface.stories.tsx',
    'src/reload-activity-card.stories.tsx',
];
const artifactFiles = ['dist/index.js', 'dist/index.d.ts', 'dist/index.js.map'];
const fail = (message) => { throw new Error(`[beam Storybook] ${message}`); };

/** A private manifest selects immutable canonical inputs; never fall back to the retired mirror. */
export function canonicalCommerceInput(manifestPath) {
    let selected;
    try { selected = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch { fail('Select canonical commerce in .storybook/commerce-source.local.json (see its example); input is missing or invalid.'); }
    const packageRoot = realpathSync(resolve(dirname(manifestPath), selected.packageRoot));
    const pkg = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
    if (pkg.name !== '@splicewire/beam-commerce' || pkg.repository?.url !== 'https://github.com/splicewire/laravel-beam-commerce.git'
        || pkg.repository?.directory !== 'js/beam-commerce') fail('Commerce stories must belong to the canonical laravel-beam-commerce package.');
    if (!/^[0-9a-f]{40}$/.test(selected.sourceCommit ?? '')) fail('Canonical sourceCommit must be an exact commit.');
    const git = (...args) => execFileSync('git', ['-C', packageRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (git('rev-parse', 'HEAD') !== selected.sourceCommit) fail('Canonical commerce source HEAD does not match the selected commit.');
    if (git('status', '--porcelain', '--untracked-files=all', '--', 'src', 'package.json')) fail('Canonical commerce source has unrecorded changes.');
    const files = [...commerceStoryFiles, ...artifactFiles];
    if (!selected.sha256 || Object.keys(selected.sha256).sort().join() !== [...files].sort().join()) fail('Select exactly the three canonical stories and three built exports.');
    for (const file of files) {
        const expected = selected.sha256[file];
        const actual = createHash('sha256').update(readFileSync(resolve(packageRoot, file))).digest('hex');
        if (!/^[0-9a-f]{64}$/.test(expected ?? '') || actual !== expected) fail(`Canonical commerce input hash mismatch: ${file}`);
    }
    return { packageRoot, stories: commerceStoryFiles.map((file) => resolve(packageRoot, file)) };
}

export function workspaceStoryPatterns(workspaces) {
    return workspaces.filter((name) => name !== 'beam-commerce').map((name) => `../${name}/src/**/*.stories.@(ts|tsx|mdx)`);
}
