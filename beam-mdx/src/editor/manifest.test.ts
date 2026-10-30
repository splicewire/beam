import { describe, expect, it } from 'vitest';
import { kitManifest } from './manifest';
import { nodeToJsxDescriptor } from './descriptors';

describe('the PHP-declared MDX kit', () => {
    it('contains declared components without the retired Content shadow declaration', () => {
        expect(kitManifest.nodes.map((node) => node.name)).toEqual([
            'Callout', 'Steps', 'Step', 'Figure', 'Terminal', 'SectionLanding',
            'CardGrid', 'Card', 'DoctorOutput', 'FileTree', 'Ref', 'Artifact',
        ]);
        expect(kitManifest.nodes.filter((node) => node.admitsText).map((node) => node.name)).toEqual([
            'Callout', 'Step', 'Figure', 'Terminal', 'DoctorOutput', 'FileTree', 'Ref',
        ]);
        const callout = kitManifest.nodes.find((node) => node.name === 'Callout')!;
        expect(callout.attrsSchema?.properties).toHaveProperty('type.enum', ['note', 'tip', 'warning', 'danger', 'info']);
    });

    it('keeps leaf nodes closed and honors direct text independently of structured children', () => {
        const artifact = kitManifest.nodes.find((node) => node.name === 'Artifact')!;
        expect(nodeToJsxDescriptor(artifact).hasChildren).toBe(false);
        expect(nodeToJsxDescriptor({ ...artifact, admitsText: true }).hasChildren).toBe(true);
        expect(nodeToJsxDescriptor(kitManifest.nodes.find((node) => node.name === 'Ref')!).kind).toBe('text');
    });
});
