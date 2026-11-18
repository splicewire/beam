// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Registry } from '@schemastud/registry';
import { beforeEach, describe, expect, it } from 'vitest';

// @ts-expect-error the bin is plain JavaScript with no declaration file; its exports are exercised below.
import { DEFAULT_OUT, main, parseArgs, snapshotText } from '../../bin/chrome-snapshot.mjs';
import { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
import { chromeRegistries, clearChromeRegistry, registerLayout, registerTemplate, registeredChromeNames } from './registry.js';
import { chromeRegistrySnapshot, type ChromeRegistrySnapshot } from './snapshot.js';
import type { ChromeComponent } from './types.js';

/**
 * registry-kernel-ts 09: the chrome snapshot a host writes for `BeamUxChromeAudit`. These tests verify; none of them
 * writes a committed file, and nothing here (no flag, no environment variable) makes one. The only writes are the
 * bin's, into a fresh temporary directory, to check that it writes exactly what it prints.
 */

const component = (): ChromeComponent => () => null;

/** What a registry holds, read straight off it through the test seam, in the snapshot's shape. */
function held(registry: Registry<ChromeComponent>, describedBy: string): ChromeRegistrySnapshot['registries'][number] {
    const { root, onKeyDuplicate, populationRequirement, description } = registry.declaration;

    return {
        root: { segments: [...root.segments], display: root.display },
        describedBy,
        declaration: { onKeyDuplicate, populationRequirement, description },
        keys: registry.keys().map((key, at) => ({
            key: { segments: [...key.segments], display: key.display },
            name: registry.names()[at]!,
            registrant: registry.registrantOf(key),
        })),
    };
}

/** Every name the snapshot says resolves: registered keys' names and builtins, as the PHP audit reads them. */
function resolvableNames(snapshot: ChromeRegistrySnapshot, rootDisplay: string): string[] {
    const registered = snapshot.registries.filter(({ root }) => root.display === rootDisplay).flatMap(({ keys }) => keys.map(({ name }) => name));
    const builtin = snapshot.builtins.filter(({ root }) => root.display === rootDisplay).flatMap(({ names }) => names);

    return [...new Set([...builtin, ...registered])];
}

function registerAFewChrome(): void {
    registerLayout('DocsLayout', component(), '@splicewire/beam-docs');
    registerLayout('site.shell', component());
    registerTemplate('ReferenceTemplate', component(), 'app/host');
    // A host overriding a packaged layout (Supersede): one key, the later registrant.
    registerLayout('DocsLayout', component(), 'app/host');
}

beforeEach(() => clearChromeRegistry());

describe('chromeRegistrySnapshot', () => {
    it('equals what the two registries hold, and the packaged builtins', () => {
        registerAFewChrome();
        const { layouts, templates } = chromeRegistries();

        expect(chromeRegistrySnapshot()).toEqual({
            version: 1,
            registries: [held(layouts, '@splicewire/beam-ux'), held(templates, '@splicewire/beam-ux')],
            builtins: [
                { root: { segments: ['beam', 'ux', 'chrome', 'layouts'], display: 'beam.ux.chrome.layouts' }, names: Object.keys(BUILTIN_LAYOUTS) },
                { root: { segments: ['beam', 'ux', 'chrome', 'templates'], display: 'beam.ux.chrome.templates' }, names: Object.keys(BUILTIN_TEMPLATES) },
            ],
        });
    });

    it('carries a PascalCase name under its root as segments and a display, with its registrant', () => {
        registerAFewChrome();
        const [layouts] = chromeRegistrySnapshot().registries;

        expect(layouts!.keys).toEqual([
            {
                key: { segments: ['beam', 'ux', 'chrome', 'layouts', 'DocsLayout'], display: 'beam.ux.chrome.layouts.DocsLayout' },
                name: 'DocsLayout',
                registrant: 'app/host',
            },
            {
                key: { segments: ['beam', 'ux', 'chrome', 'layouts', 'site', 'shell'], display: 'beam.ux.chrome.layouts.site.shell' },
                name: 'site.shell',
                registrant: null,
            },
        ]);
        expect(layouts!.declaration.onKeyDuplicate).toBe('supersede');
    });

    it('names every resolvable chrome name registeredChromeNames() lists, and no other', () => {
        registerAFewChrome();
        const snapshot = chromeRegistrySnapshot();
        const names = registeredChromeNames();

        expect(resolvableNames(snapshot, 'beam.ux.chrome.layouts')).toEqual(names.layouts);
        expect(resolvableNames(snapshot, 'beam.ux.chrome.templates')).toEqual(names.templates);
    });

    it('is plain data with no component in it', () => {
        registerAFewChrome();
        const snapshot = chromeRegistrySnapshot();

        expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    });

    it('holds only the builtins before anything is registered', () => {
        const snapshot = chromeRegistrySnapshot();

        expect(snapshot.registries.map(({ keys }) => keys)).toEqual([[], []]);
        expect(resolvableNames(snapshot, 'beam.ux.chrome.templates')).toEqual(['ProseTemplate', 'SpreadTemplate']);
    });
});

describe('beam-ux-chrome-snapshot', () => {
    const run = async (argv: string[], cwd: string, register: () => void = registerAFewChrome) => {
        const out: string[] = [];
        const err: string[] = [];
        const imported: string[] = [];
        const code = await main(argv, {
            cwd,
            importModule: async (url: string) => {
                imported.push(url);
                register();
            },
            snapshot: chromeRegistrySnapshot,
            stdout: (text: string) => out.push(text),
            stderr: (text: string) => err.push(text),
        });

        return { code, out: out.join(''), err: err.join(''), imported };
    };

    it('prints the snapshot after importing the registration modules, and writes nothing without --write', async () => {
        const cwd = mkdtempSync(join(tmpdir(), 'beam-chrome-snapshot-'));

        const result = await run(['--register', 'resources/js/chrome.js'], cwd);

        expect(result.code).toBe(0);
        expect(result.imported).toEqual([`file://${join(cwd, 'resources/js/chrome.js')}`]);
        expect(result.out).toBe(snapshotText(chromeRegistrySnapshot()));
        expect(JSON.parse(result.out).registries[0].keys.map(({ name }: { name: string }) => name)).toEqual(['DocsLayout', 'site.shell']);
        expect(readdirSync(cwd)).toEqual([]);
    });

    it('writes to the default path with --write, exactly what it would print', async () => {
        const cwd = mkdtempSync(join(tmpdir(), 'beam-chrome-snapshot-'));

        const result = await run(['--register', 'chrome.js', '--write'], cwd);
        const written = join(cwd, DEFAULT_OUT);

        expect(DEFAULT_OUT).toBe('storage/app/beam-chrome-registry.json');
        expect(result.code).toBe(0);
        expect(result.out).toBe(`wrote ${written}\n`);
        expect(readFileSync(written, 'utf8')).toBe(snapshotText(chromeRegistrySnapshot()));
    });

    it('writes to --out', async () => {
        const cwd = mkdtempSync(join(tmpdir(), 'beam-chrome-snapshot-'));

        await run(['--out', 'build/chrome.json', '--write'], cwd, () => {});

        expect(existsSync(join(cwd, 'build/chrome.json'))).toBe(true);
        expect(existsSync(join(cwd, DEFAULT_OUT))).toBe(false);
    });

    it('refuses an unknown argument or a flag with no path, and writes nothing', async () => {
        const cwd = mkdtempSync(join(tmpdir(), 'beam-chrome-snapshot-'));

        expect(parseArgs(['--check'])).toEqual({ error: 'unknown argument [--check].' });
        expect(parseArgs(['--register'])).toEqual({ error: '--register needs a path.' });
        expect(parseArgs(['--out', '--write'])).toEqual({ error: '--out needs a path.' });

        const result = await run(['--write', '--force'], cwd);

        expect(result.code).toBe(1);
        expect(result.err).toContain('unknown argument [--force]');
        expect(readdirSync(cwd)).toEqual([]);
    });
});
