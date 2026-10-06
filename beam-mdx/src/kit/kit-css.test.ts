import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * docs-walkthrough D-T2 (DM5, DOCS-13): the guide kit reads ONE token family, `--beam-*`, which flips under `.dark`. A
 * read of a host's shadcn token (`--border`, `--foreground`, ...) mixed families: on www the FileTree drew dark text
 * (`--foreground`) on the dark `--beam-paper-raised` ground (shots 23/35).
 */
const css = readFileSync(new URL('./kit.css', import.meta.url), 'utf8');

describe('beam-mdx kit.css', () => {
    it('reads no un-prefixed shadcn token', () => {
        // `--bkit-*` are the kit's own component-local variables, set inside this file; everything else is `--beam-*`.
        const reads = [...css.matchAll(/var\(\s*(--[a-z][\w-]*)/g)].map((m) => m[1]);
        expect(reads.filter((token) => !token.startsWith('--beam-') && !token.startsWith('--bkit-'))).toEqual([]);
    });
});
