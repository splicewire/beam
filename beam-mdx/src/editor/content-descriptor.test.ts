import { describe, it, expect } from 'vitest';
import { contentJsxDescriptor, withContentDescriptor } from './content-descriptor';
import { KIT_JSX_DESCRIPTORS } from './descriptors';

describe('contentJsxDescriptor', () => {
    it('describes the Content JSX tag with a single string `name` prop and no children', () => {
        const d = contentJsxDescriptor(['partials/a', 'partials/b']);
        expect(d.name).toBe('Content');
        expect(d.kind).toBe('flow');
        expect(d.hasChildren).toBe(false);
        expect(d.props).toEqual([{ name: 'name', type: 'string' }]);
        expect(typeof d.Editor).toBe('function');
    });
});

describe('withContentDescriptor', () => {
    it('replaces the generic Content descriptor with the real-partial one (exactly one Content)', () => {
        const out = withContentDescriptor(KIT_JSX_DESCRIPTORS, { options: ['partials/x'] });
        const contents = out.filter((d) => d.name === 'Content');
        expect(contents).toHaveLength(1);
        expect(contents[0].props).toEqual([{ name: 'name', type: 'string' }]);
        // Every other kit descriptor is preserved.
        const nonContent = KIT_JSX_DESCRIPTORS.filter((d) => d.name !== 'Content').map((d) => d.name);
        for (const name of nonContent) {
            expect(out.some((d) => d.name === name)).toBe(true);
        }
    });

    it('defaults to the kit descriptors and empty options', () => {
        const out = withContentDescriptor();
        expect(out.some((d) => d.name === 'Content')).toBe(true);
    });
});
