import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * localization 16 (ruling 02 §4): localization.ts must mirror laravel-beam's declared Data classes. The schema fixture is
 * exported from the PHP classes by reflection, and this test reads the TS source, so it reports any added, missing or
 * retyped member. (brand.ts has no such guard and has drifted from BrandData; that's a finding routed separately.)
 */
const schema: { shapes: Record<string, Record<string, string>> } = JSON.parse(
    readFileSync(new URL('./localization.schema.json', import.meta.url), 'utf8'),
);
const source = readFileSync(new URL('./localization.ts', import.meta.url), 'utf8');

function membersOf(name: string): Record<string, string> {
    const body = new RegExp(`export interface ${name} \\{([^}]*)\\}`).exec(source)?.[1];
    if (body === undefined) throw new Error(`localization.ts declares no interface ${name}`);
    return Object.fromEntries(
        body
            .split('\n')
            .map(line => /^\s*(\w+)\s*:\s*(.+?);\s*$/.exec(line))
            .filter((m): m is RegExpExecArray => m !== null)
            .map(m => [m[1], m[2].replace(/\s+/g, ' ')]),
    );
}

describe('localization.ts mirrors the PHP Data classes', () => {
    it.each(Object.keys(schema.shapes))('%s matches its declared members and types', name => {
        expect(membersOf(name)).toEqual(schema.shapes[name]);
    });

    it('declares nothing the PHP side does not', () => {
        const declared = [...source.matchAll(/export interface (\w+)/g)].map(m => m[1]).sort();
        expect(declared).toEqual(Object.keys(schema.shapes).sort());
    });
});
