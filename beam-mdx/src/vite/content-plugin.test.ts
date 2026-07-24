import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { beamMdxContent, type BeamMdxContentOptions } from './content-plugin';

const RESOLVED_ID = '\0virtual:beam-mdx/content';

function write(root: string, rel: string, body: string): void {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
}

describe('beamMdxContent — MODULES bundle exclusion', () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'beam-mdx-content-'));
        write(root, 'docs/public.mdx', '---\ntitle: Public\n---\nbody\n');
        write(root, 'docs/guarded.mdx', '---\ntitle: Guarded\naccess: root\n---\nbody\n');
        write(
            root,
            'docs/guarded-list.mdx',
            '---\ntitle: List\naccess: [support.view, billing.view]\n---\nbody\n',
        );
        // Undated essay ⇒ a plain draft (default draftable prefix), no access gate.
        write(root, 'essays/draft.mdx', '---\ntitle: Draft\n---\nbody\n');
    });

    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    /** The content names the plugin compiles into the MODULES map. */
    function moduleNames(opts: Partial<BeamMdxContentOptions> = {}): string[] {
        const plugin = beamMdxContent({ contentDir: root, ...opts });
        const load = plugin.load as (id: string) => string;
        const code = load.call(plugin, RESOLVED_ID);

        return [...code.matchAll(/^\s*"([^"]+)":\s*m\d+,/gm)].map((m) => m[1]);
    }

    it('omits a file carrying an access: gate from MODULES', () => {
        const names = moduleNames({ currentEnv: 'production', previewEnvs: [] });

        expect(names).toContain('docs/public');
        expect(names).not.toContain('docs/guarded');
        expect(names).not.toContain('docs/guarded-list');
    });

    it('excludes gated content even when drafts are allowed (preview env)', () => {
        const names = moduleNames({ includeDrafts: true });

        expect(names).toContain('docs/public');
        // A draft rides along under a preview build…
        expect(names).toContain('essays/draft');
        // …but a gated file never does — gating ignores the allowlist.
        expect(names).not.toContain('docs/guarded');
        expect(names).not.toContain('docs/guarded-list');
    });

    it('keeps public files and still excludes plain drafts in a production build', () => {
        const names = moduleNames({ currentEnv: 'production', previewEnvs: [] });

        expect(names).toContain('docs/public');
        expect(names).not.toContain('essays/draft');
    });
});
