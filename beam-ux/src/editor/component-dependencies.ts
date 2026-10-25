import type { ComponentCanvasData } from '@splicewire/beam-resources/types/beam-ux';
import type { JsonDoc } from '../blockdoc/json.js';

/** Only entries actually used by this Local Session (including nested instances) affect its Release. */
export function componentDependencies(body: JsonDoc, catalog: ComponentCanvasData[]): ComponentCanvasData[] {
    const byName = new Map(catalog.filter(entry => entry.definition.name).map(entry => [entry.definition.name, entry]));
    const found = new Map<string, ComponentCanvasData>();
    function walk(nodes: JsonDoc): void {
        for (const node of nodes) {
            if (node.kind !== 'block') continue;
            const entry = node.name ? byName.get(node.name) : undefined;
            if (entry && !found.has(entry.id)) {
                found.set(entry.id, entry);
                walk(entry.body);
            }
            walk(node.children);
            for (const children of Object.values(node.slots ?? {})) walk(children);
            walk(node.repeat?.empty ?? []);
        }
    }
    walk(body);
    return [...found.values()];
}
