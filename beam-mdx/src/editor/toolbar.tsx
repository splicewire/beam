import { Select, insertJsx$, usePublisher } from '@mdxeditor/editor';
import { KIT_MANIFEST } from './manifest';

// Sensible starter props for components with required attrs, so an inserted block is valid MDX.
const STARTER_PROPS: Record<string, Record<string, string>> = {
    Callout: { type: 'note' },
    Content: { name: 'fragments/example' },
    Ref: { to: 'key' },
    SectionLanding: { heading: 'Heading' },
    Card: { href: '/', title: 'Title' },
    Artifact: { file: 'example.json' },
};

/**
 * A toolbar dropdown that inserts a kit component at the cursor — driven by the same manifest that
 * registers them, so the insert list and the parse descriptors can't drift. Flow (block) components
 * get an empty children slot; inline components (Ref) insert as text. mdxeditor serializes the JSX
 * without an import (the components are ambient — verified).
 */
export function InsertKitBlock() {
    const insertJsx = usePublisher(insertJsx$);

    return (
        <Select
            value=""
            triggerTitle="Insert component"
            placeholder="Insert…"
            onChange={(name) => {
                if (!name) return;
                const node = KIT_MANIFEST.nodes.find((n) => n.name === name);
                const props = STARTER_PROPS[name] ?? {};
                if (node?.group === 'inline') {
                    insertJsx({ name, kind: 'text', props, children: [{ type: 'text', value: '' }] });
                } else {
                    insertJsx({ name, kind: 'flow', props, children: [] });
                }
            }}
            items={KIT_MANIFEST.nodes.map((n) => ({ label: n.name, value: n.name }))}
        />
    );
}
