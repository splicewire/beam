import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { runProducer } from './contracts.mjs';

test('committed frontend contracts match the PHP producer', () => {
    const expected = JSON.parse(runProducer());
    const directory = new URL('../src/generated/', import.meta.url);
    const names = Object.keys(expected).sort();
    assert.ok(names.length > 0, 'The producer must emit contracts.');
    assert.deepEqual(readdirSync(directory).sort(), names, 'Regenerate missing or stale contracts with contracts:generate -- --write.');
    for (const name of names) {
        assert.equal(typeof expected[name], 'string');
        assert.ok(expected[name].trim(), `${name} must not be empty.`);
        assert.equal(readFileSync(new URL(name, directory), 'utf8'), expected[name],
            `${name} drifted. Run contracts:generate -- --write.`);
    }
});
