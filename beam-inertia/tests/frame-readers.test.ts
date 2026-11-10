// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Frame host chrome readers', () => {
    it('ships a separate build-time module of the chrome keys, bound to their source readers', async () => {
        const { default: reads } = await import('../src/frame-readers');
        expect(Object.keys(reads).sort()).toEqual([
            'manifest:nav', 'manifest:routeContext', 'resource-entry:editable', 'resource-entry:form',
            'resource-entry:key', 'resource-entry:nav', 'resource-entry:nav.label', 'resource-entry:showable',
        ]);
        expect(Object.values(reads).every((reader) => typeof reader === 'function')).toBe(true);
        const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'));
        expect(manifest.exports['./frame-readers']).toEqual({ types: './dist/frame-readers.d.ts', import: './dist/frame-readers.js' });
        expect(readFileSync(resolve(import.meta.dirname, '../src/index.tsx'), 'utf8')).not.toContain('frame-readers');
    }, 60_000);
});
