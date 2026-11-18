#!/usr/bin/env node
/**
 * `beam-ux-chrome-snapshot` — writes the client chrome registry snapshot that `BeamUxChromeAudit`
 * (`splicewire/laravel-beam-ux`, `beam:doctor`) reads in place of the hand-kept `beam.ux.chrome.registered`
 * list. The snapshot is `chromeRegistrySnapshot()` from `@splicewire/beam-ux/docs`: the two chrome registries'
 * roots, declarations, keys and registrants, and the packaged builtin names. Never a component.
 *
 * Usage, from the host's root:
 *
 *   beam-ux-chrome-snapshot --register resources/js/chrome.js            # print the snapshot
 *   beam-ux-chrome-snapshot --register resources/js/chrome.js --write    # write it
 *
 *   --register <module>  a module that registers the host's chrome (`registerChrome`, `configureDocs`), imported
 *                        before the snapshot is taken. Repeatable, in order. Relative to the working directory.
 *                        Node imports it, so it must be JavaScript Node can load, or run this under a loader.
 *   --out <path>         where `--write` writes. Default `storage/app/beam-chrome-registry.json`, the path
 *                        `beam.ux.chrome.snapshot` defaults to.
 *   --write              write the file. Without it the snapshot is printed and nothing is written. Refused
 *                        without a --register: a snapshot of the builtins alone would fail every name the host
 *                        registers.
 *
 * The registry is a module singleton, so a registration module must resolve the same `@splicewire/beam-ux` copy
 * as this bin (the host's own `node_modules/@splicewire/beam-ux`), or it registers into a registry this bin
 * never reads.
 *
 * Exit codes: 0 ok · 1 usage error (nothing written) · 2 a --register module could not be loaded (nothing written).
 */

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_OUT = 'storage/app/beam-chrome-registry.json';

/** The file's text: the snapshot as indented JSON with a trailing newline, so a regenerated file diffs by line. */
export function snapshotText(snapshot) {
    return `${JSON.stringify(snapshot, null, 4)}\n`;
}

/** @returns {{ register: string[], out: string, write: boolean } | { error: string }} */
export function parseArgs(argv) {
    const options = { register: [], out: DEFAULT_OUT, write: false };

    for (let at = 0; at < argv.length; at++) {
        const arg = argv[at];

        if (arg === '--write') {
            options.write = true;
        } else if (arg === '--register' || arg === '--out') {
            const value = argv[++at];

            if (value === undefined || value.startsWith('--')) {
                return { error: `${arg} needs a path.` };
            }

            if (arg === '--register') {
                options.register.push(value);
            } else {
                options.out = value;
            }
        } else {
            return { error: `unknown argument [${arg}].` };
        }
    }

    if (options.write && options.register.length === 0) {
        return { error: '--write needs at least one --register module; a snapshot of the builtins alone would fail every name the host registers.' };
    }

    return options;
}

/**
 * Import the registration modules in order, take the snapshot, then print it or write it. `snapshot` and
 * `importModule` are injectable so this package's tests run it against the source, not the build.
 */
export async function main(argv, io = {}) {
    const {
        cwd = process.cwd(),
        importModule = (url) => import(url),
        snapshot = async () => (await import('../dist/docs.js')).chromeRegistrySnapshot(),
        stdout = (text) => process.stdout.write(text),
        stderr = (text) => process.stderr.write(text),
    } = io;
    const options = parseArgs(argv);

    if ('error' in options) {
        stderr(`beam-ux-chrome-snapshot: ${options.error}\n`);

        return 1;
    }

    for (const module of options.register) {
        const path = resolve(cwd, module);

        try {
            await importModule(pathToFileURL(path).href);
        } catch (error) {
            stderr(`beam-ux-chrome-snapshot: cannot load [${path}]: ${error instanceof Error ? error.message : String(error)}\n`);

            return 2;
        }
    }

    const text = snapshotText(await snapshot());

    if (!options.write) {
        stdout(text);

        return 0;
    }

    const out = resolve(cwd, options.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
    stdout(`wrote ${out}\n`);

    return 0;
}

const invokedDirectly = process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
    process.exitCode = await main(process.argv.slice(2));
}
