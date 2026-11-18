import { createRegistryIndex, snapshotRegistryIndex, type RegistryKey } from '@schemastud/registry';

import { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
import { chromeRegistries } from './registry.js';

/**
 * A key as plain data. Its segments are its identity; its display is for showing only, and a reader
 * never parses it: `beam.ux.chrome.layouts.DocsLayout` is not a legal key in either runtime's grammar.
 */
export interface ChromeSnapshotKey {
    readonly segments: string[];
    readonly display: string;
}

/**
 * What the chrome registries hold, as the JSON file a host writes for `BeamUxChromeAudit`
 * (`splicewire/laravel-beam-ux`) to read in place of the hand-kept `beam.ux.chrome.registered` list.
 *
 * `version` and `registries` are the registry kernel's index snapshot of the two chrome registries,
 * described in an index: per root, its declaration, its keys in registration order, each key's name and
 * registrant. Never a component. `builtins` is this package's addition: the packaged names per root that
 * resolve after a registry misses (`BUILTIN_LAYOUTS`, `BUILTIN_TEMPLATES`). They have no key and no
 * registrant, but an entry naming one renders, so the audit must accept them.
 *
 * Declared here rather than imported, so this package's built types name no unreleased package.
 */
export interface ChromeRegistrySnapshot {
    readonly version: 1;
    readonly registries: {
        readonly root: ChromeSnapshotKey;
        readonly describedBy: string | null;
        readonly declaration: {
            readonly onKeyDuplicate: string;
            readonly populationRequirement: string;
            readonly description: string | null;
        };
        readonly keys: { readonly key: ChromeSnapshotKey; readonly name: string; readonly registrant: string | null }[];
    }[];
    readonly builtins: { readonly root: ChromeSnapshotKey; readonly names: string[] }[];
}

/** Who describes the two chrome registries to the index. */
const DESCRIBED_BY = '@splicewire/beam-ux';

const keyData = (key: RegistryKey): ChromeSnapshotKey => ({ segments: [...key.segments], display: key.display });

/**
 * The chrome registries as they are now, as plain data. Call it after the host's chrome registrations
 * have run (`registerChrome`, `configureDocs`), which is what `beam-ux-chrome-snapshot` does before it
 * writes the file.
 */
export function chromeRegistrySnapshot(): ChromeRegistrySnapshot {
    const { layouts, templates } = chromeRegistries();
    const index = createRegistryIndex().describe(layouts, DESCRIBED_BY).describe(templates, DESCRIBED_BY);

    return {
        ...snapshotRegistryIndex(index),
        builtins: [
            { root: keyData(layouts.declaration.root), names: Object.keys(BUILTIN_LAYOUTS) },
            { root: keyData(templates.declaration.root), names: Object.keys(BUILTIN_TEMPLATES) },
        ],
    };
}
