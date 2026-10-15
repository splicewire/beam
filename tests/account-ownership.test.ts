import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
it('ships one account entry and migrates both Inertia consumers without a reverse dependency', () => {
    const accounts = JSON.parse(read('beam-accounts/package.json'));
    const ux = JSON.parse(read('beam-ux/package.json'));
    expect(accounts.exports['./account'].import).toBe('./dist/account.js');
    expect(ux.exports['./account']).toBeUndefined();
    expect(existsSync(resolve(root, 'beam-ux/src/account'))).toBe(false);
    expect({ ...ux.dependencies, ...ux.peerDependencies }['@splicewire/beam-accounts']).toBeUndefined();
    for (const file of ['components/app-sidebar-beam.tsx', 'pages/account/home.stories.tsx']) {
        const source = read(`beam-inertia/src/${file}`);
        expect(source).toContain('@splicewire/beam-accounts/account');
        expect(source).not.toContain('@splicewire/beam-ux/account');
    }
});
