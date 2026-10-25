/** ux-0231 d8–10: identifiers are data only inside a declared component interface. */
import type { ComponentDefinitionData, ComponentPropData, ComponentPropType } from '@splicewire/beam-resources/types/beam-ux';

function object(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Literal metadata from the PHP declaration, never executable source or an inferred identifier. */
export function readComponentDefinition(value: unknown): ComponentDefinitionData {
    if (!object(value) || (value.name != null && (typeof value.name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(value.name) || value.name === 'Slot'))) {
        throw new Error('A component definition requires a PascalCase name');
    }
    const rawProps = value.props ?? [];
    if (!Array.isArray(rawProps)) throw new Error('Component props must be a list');
    const seen = new Set<string>();
    const props: ComponentPropData[] = rawProps.map((raw: unknown) => {
        if (!object(raw)) throw new Error('A component prop must be declared');
        assertReferenceName(raw.name);
        if (['children', 'components', 'bindings', 'bindingRuntime', 'styleRegistry', 'className', 'key', 'ref'].includes(raw.name)) throw new Error('This prop name belongs to the component runtime or a Slot');
        if (seen.has(raw.name)) throw new Error('Component prop names must be unique');
        seen.add(raw.name);
        const types: ComponentPropType[] = ['text', 'number', 'toggle', 'choice', 'link', 'image'];
        const type = types.find(type => type === raw.type);
        if (!type) throw new Error('Unknown component prop type');
        const choices = raw.choices ?? [];
        if (!Array.isArray(choices) || !choices.every((choice): choice is string => typeof choice === 'string')) throw new Error('Choices must be text');
        if (raw.required != null && typeof raw.required !== 'boolean') throw new Error('Required must be boolean');
        const fallback = raw.default ?? null;
        if (type === 'choice' && choices.length === 0) throw new Error('A choice prop requires literal text choices');
        if (fallback !== null && !(type === 'number' ? typeof fallback === 'number' && Number.isFinite(fallback)
            : type === 'toggle' ? typeof fallback === 'boolean'
                : type === 'choice' ? typeof fallback === 'string' && choices.includes(fallback)
                    : typeof fallback === 'string')) throw new Error('A component default must fit its declared prop type');
        // Narrow the scalar union independently of the serialized type declaration.
        const defaultValue = typeof fallback === 'string' || typeof fallback === 'number' || typeof fallback === 'boolean' ? fallback : null;
        return {name: raw.name, type, choices, required: raw.required === true, default: defaultValue};
    });
    return {name: typeof value.name === 'string' ? value.name : null, props};
}

export function componentLensContext(definition: ComponentDefinitionData, context: LensContext): LensContext {
    if (!definition.name) throw new Error('A component name must be saved with its body');
    const properties = Object.fromEntries((definition.props ?? []).map(prop => [prop.name, {
        type: prop.type === 'number' ? 'number' : prop.type === 'toggle' ? 'boolean' : 'string',
    }]));
    return {...context, component: definition.name, profile: {nodes: [
        ...(context.profile?.nodes.filter(node => node.name !== definition.name) ?? []),
        {name: definition.name, attrsSchema: {properties}, admitsChildCategories: []},
    ]}};
}
export interface ComponentDeclaration {
    name: string;
    attrsSchema?: {properties?: Record<string, unknown>};
    admitsChildCategories: string[] | null;
    slots?: {name: string; admitsChildCategories: string[] | null}[];
}
export interface LensContext {
    profile?: {nodes: ComponentDeclaration[]};
    component?: string;
}
export function assertReferenceName(value: unknown): asserts value is string {
    if (typeof value !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
        || ['__proto__', 'prototype', 'constructor', 'this', 'super', 'null', 'true', 'false'].includes(value)) {
        throw new Error('A component reference must be a declared identifier');
    }
}
export function declaredProp(context: LensContext, name: string): boolean {
    const entry = context.profile?.nodes.find(node => node.name === context.component);
    return !!entry?.attrsSchema?.properties && Object.hasOwn(entry.attrsSchema.properties, name);
}
export function declaredSlot(context: LensContext, name: string): boolean {
    const entry = context.profile?.nodes.find(node => node.name === context.component);
    return !!entry && (name === 'children' ? entry.admitsChildCategories === null || entry.admitsChildCategories.length > 0 : !!entry.slots?.some(slot => slot.name === name));
}
