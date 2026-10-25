import type { ComponentType, ReactNode } from 'react';
import type { ComponentCanvasData } from '@splicewire/beam-resources/types/beam-ux';
import { renderNode } from './TreeRender.js';
import type { CanvasConfig } from './context.js';

/** Working Head bodies for authoring only. Public EntryBody loads separately pinned artifacts. */
export function withAuthoredComponents(config: CanvasConfig): CanvasConfig {
    if (!config.authoredComponents?.length) return config;
    const registry: Record<string, ComponentType<Record<string, unknown>>> = {};
    const resolved: CanvasConfig = { ...config, registry };
    for (const entry of config.authoredComponents) {
        const name = entry.definition.name;
        if (name) registry[name] = authored(entry, resolved);
    }
    Object.assign(registry, config.registry);
    return resolved;
}

function authored(entry: ComponentCanvasData, config: CanvasConfig): ComponentType<Record<string, unknown>> {
    return function AuthoredWorkingHead(incoming) {
        const defaults = Object.fromEntries((entry.definition.props ?? [])
            .filter(prop => prop.default != null).map(prop => [prop.name, prop.default]));
        const scope: CanvasConfig = { ...config, bindings: entry.bindings ?? {},
            componentProps: { ...defaults, ...incoming } };
        return <>{entry.body.map((node, index) => {
            const root = node.kind === 'block' && incoming.className ? { ...node, props: [
                ...node.props.filter(prop => prop.name !== 'className'),
                { name: 'className', kind: 'string' as const,
                    value: [node.props.find(prop => prop.name === 'className')?.value, incoming.className].filter(Boolean).join(' ') },
            ] } : node;
            // No caller record crosses the component boundary. Slot ReactNodes were rendered by its caller.
            return renderNode(root, `${entry.id}.${index}`, scope);
        })}</>;
    };
}

export function componentValue(config: CanvasConfig, name: string): ReactNode {
    const value = config.componentProps?.[name];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        || value == null ? value : null;
}
