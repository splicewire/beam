import { expect, it } from 'vitest';
import { insertRelativeTo } from './insert';
import { DEFAULT_BLOCK_TEMPLATES } from './templates';
import type { JsonBlock } from '../blockdoc/json';

it('mints a UUIDv7 for palette insertion and every inserted descendant', () => {
    const template = DEFAULT_BLOCK_TEMPLATES.find((item) => item.label === 'Section')!;
    const result = insertRelativeTo([], null, template.make);
    const inserted = result[0] as JsonBlock;

    expect(inserted.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    expect(inserted.children[0]).toMatchObject({ kind: 'text', value: 'New section' });
});
