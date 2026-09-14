import { spawnSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

/** Call the producer explicitly; an absent PHP checkout is a failed check, never a skip. */
export function runProducer(args = []) {
    const configuredArtisan = process.env.BEAM_DOCS_ARTISAN;
    if (!configuredArtisan) throw new Error('Set BEAM_DOCS_ARTISAN to a docs-enabled artisan or package vendor/bin/testbench path.');
    const artisan = resolve(configuredArtisan);
    accessSync(artisan, constants.R_OK);
    const testbench = basename(artisan) === 'testbench' && basename(dirname(artisan)) === 'bin';
    const project = testbench ? dirname(dirname(dirname(artisan))) : dirname(artisan);
    const result = spawnSync(process.env.BEAM_DOCS_PHP ?? 'php', [
        artisan, 'splicewire:beam:docs:export-contracts', '--no-interaction', '--no-ansi', ...args,
    ], {
        encoding: 'utf8', cwd: project,
        env: { ...process.env, ...(testbench ? { TESTBENCH_WORKING_PATH: project } : {}) },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Contract export failed (${result.status}):\n${result.stderr}${result.stdout}`);
    return result.stdout;
}
